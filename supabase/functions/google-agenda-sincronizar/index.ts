// Edge Function: cria ou atualiza o evento na Google Agenda do vendedor responsável
// quando um "próximo passo" (data de retorno) é criado ou editado no CRM.
//
// Chamada autenticada pelo app (mantém "Verify JWT" ligado, padrão do Supabase).

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// CORS: o navegador faz uma checagem "OPTIONS" antes da chamada real, porque o
// front-end chama essa função com cabeçalhos extras (Authorization, Content-Type).
// Sem isso, o navegador bloqueia a chamada de verdade antes mesmo dela chegar aqui.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function resposta(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function somarDia(dataISO: string): string {
  const d = new Date(dataISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function somarUmaHora(dataISO: string, horario: string): string {
  const [h, m] = horario.split(':').map(Number)
  const d = new Date(`${dataISO}T00:00:00`)
  d.setHours(h + 1, m, 0, 0)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}:00`
}

async function obterAccessTokenValido(vendedorId: string): Promise<string | null> {
  const { data: token } = await supabaseAdmin
    .from('google_tokens')
    .select('*')
    .eq('vendedor_id', vendedorId)
    .maybeSingle()

  if (!token) return null

  const expiraEm = new Date(token.expira_em).getTime()
  if (expiraEm > Date.now() + 60_000) {
    return token.access_token
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const dados = await res.json()
  if (!res.ok || !dados.access_token) return null

  const novaExpiracao = new Date(Date.now() + dados.expires_in * 1000).toISOString()
  await supabaseAdmin
    .from('google_tokens')
    .update({
      access_token: dados.access_token,
      expira_em: novaExpiracao,
      atualizado_em: new Date().toISOString(),
    })
    .eq('vendedor_id', vendedorId)

  return dados.access_token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return resposta({ erro: 'Método não permitido' }, 405)
  }

  try {
    const { proximo_passo_id } = await req.json()
    if (!proximo_passo_id) {
      return resposta({ erro: 'proximo_passo_id é obrigatório' }, 400)
    }

    const { data: passo, error: erroPasso } = await supabaseAdmin
      .from('proximos_passos')
      .select('id, cliente_id, descricao, data_retorno, horario_retorno')
      .eq('id', proximo_passo_id)
      .single()
    if (erroPasso || !passo) {
      return resposta({ erro: 'Próximo passo não encontrado' }, 404)
    }

    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('nome_estabelecimento, nome_contato, telefone, responsavel_id')
      .eq('id', passo.cliente_id)
      .single()
    if (!cliente) {
      return resposta({ erro: 'Cliente não encontrado' }, 404)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: chamador } = await supabaseAdmin.auth.getUser(jwt)
    const vendedorId = cliente.responsavel_id ?? chamador.user?.id

    if (!vendedorId) {
      return resposta({ sincronizado: false, motivo: 'sem_responsavel' })
    }

    const accessToken = await obterAccessTokenValido(vendedorId)
    if (!accessToken) {
      console.error('Vendedor não conectado ao Google ou refresh falhou:', vendedorId)
      return resposta({ sincronizado: false, motivo: 'nao_conectado' })
    }

    const horario: string | null = passo.horario_retorno
    const evento = {
      summary: `${cliente.nome_estabelecimento} — ${passo.descricao}`,
      description: `Contato: ${cliente.nome_contato}${cliente.telefone ? ` · ${cliente.telefone}` : ''}\nRegistrado no CRM Moinho Cafés.`,
      ...(horario
        ? {
            start: { dateTime: `${passo.data_retorno}T${horario}`, timeZone: 'America/Sao_Paulo' },
            end: {
              dateTime: `${passo.data_retorno}T${somarUmaHora(passo.data_retorno, horario)}`,
              timeZone: 'America/Sao_Paulo',
            },
          }
        : {
            start: { date: passo.data_retorno },
            end: { date: somarDia(passo.data_retorno) },
          }),
    }

    const { data: eventoExistente } = await supabaseAdmin
      .from('eventos_agenda')
      .select('*')
      .eq('proximo_passo_id', passo.id)
      .maybeSingle()

    const respostaGoogle = eventoExistente
      ? await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventoExistente.google_event_id}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(evento),
          },
        )
      : await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(evento),
        })

    const dadosEvento = await respostaGoogle.json()
    if (!respostaGoogle.ok) {
      console.error('Erro ao criar/atualizar evento no Google:', respostaGoogle.status, JSON.stringify(dadosEvento))
      return resposta({ sincronizado: false, motivo: 'erro_google', detalhe: dadosEvento })
    }

    if (!eventoExistente) {
      await supabaseAdmin.from('eventos_agenda').insert({
        proximo_passo_id: passo.id,
        google_event_id: dadosEvento.id,
      })
    }

    return resposta({ sincronizado: true })
  } catch (e) {
    return resposta({ erro: String(e) }, 500)
  }
})
