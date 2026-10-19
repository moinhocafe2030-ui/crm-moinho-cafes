// Edge Function: dispara todo dia (via pg_cron) um email para cada vendedor conectado
// ao Google, com os retornos atrasados e os de hoje dos clientes que ele é responsável.
//
// Chamada pelo pg_cron usando a service role key (mantém "Verify JWT" ligado, padrão).

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function paraBase64Utf8(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((b) => (binario += String.fromCharCode(b)))
  return btoa(binario)
}

function paraBase64Url(texto: string): string {
  return paraBase64Utf8(texto)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function formatarDataBr(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function dataHojeSaoPaulo(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
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

async function enviarEmailGmail(
  accessToken: string,
  paraEmail: string,
  assunto: string,
  corpo: string,
): Promise<boolean> {
  const corpoBase64 = paraBase64Utf8(corpo)
  const assuntoCodificado = `=?UTF-8?B?${paraBase64Utf8(assunto)}?=`
  const mensagem = [
    `To: ${paraEmail}`,
    `Subject: ${assuntoCodificado}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    corpoBase64,
  ].join('\r\n')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: paraBase64Url(mensagem) }),
  })

  if (!res.ok) {
    console.error('Erro ao enviar lembrete pelo Gmail:', res.status, await res.text())
  }
  return res.ok
}

Deno.serve(async () => {
  const hoje = dataHojeSaoPaulo()
  const resultado: Record<string, string> = {}

  try {
    const { data: tokens } = await supabaseAdmin.from('google_tokens').select('vendedor_id')
    const vendedorIds = (tokens ?? []).map((t) => t.vendedor_id)

    for (const vendedorId of vendedorIds) {
      const { data: passos } = await supabaseAdmin
        .from('proximos_passos')
        .select('id, descricao, data_retorno, clientes!inner ( nome_estabelecimento, nome_contato, responsavel_id )')
        .eq('concluido', false)
        .lte('data_retorno', hoje)
        .eq('clientes.responsavel_id', vendedorId)
        .order('data_retorno', { ascending: true })

      if (!passos || passos.length === 0) {
        resultado[vendedorId] = 'sem_retornos'
        continue
      }

      const atrasados = passos.filter((p) => p.data_retorno < hoje)
      const deHoje = passos.filter((p) => p.data_retorno === hoje)

      const linhas: string[] = []
      if (atrasados.length > 0) {
        linhas.push('ATRASADOS:')
        for (const p of atrasados) {
          const cliente = p.clientes as unknown as { nome_estabelecimento: string; nome_contato: string }
          linhas.push(
            `- ${cliente.nome_estabelecimento} (${cliente.nome_contato}) — ${p.descricao} [desde ${formatarDataBr(p.data_retorno)}]`,
          )
        }
        linhas.push('')
      }
      if (deHoje.length > 0) {
        linhas.push('HOJE:')
        for (const p of deHoje) {
          const cliente = p.clientes as unknown as { nome_estabelecimento: string; nome_contato: string }
          linhas.push(`- ${cliente.nome_estabelecimento} (${cliente.nome_contato}) — ${p.descricao}`)
        }
        linhas.push('')
      }
      linhas.push(`Veja todos os detalhes em: ${APP_URL}`)

      const corpo = linhas.join('\n')
      const assunto = `CRM Moinho Cafés — ${passos.length} retorno(s) para hoje`

      const accessToken = await obterAccessTokenValido(vendedorId)
      if (!accessToken) {
        resultado[vendedorId] = 'sem_token'
        continue
      }

      const { data: usuario } = await supabaseAdmin.auth.admin.getUserById(vendedorId)
      const email = usuario?.user?.email
      if (!email) {
        resultado[vendedorId] = 'sem_email'
        continue
      }

      const enviado = await enviarEmailGmail(accessToken, email, assunto, corpo)
      resultado[vendedorId] = enviado ? 'enviado' : 'erro_envio'
    }

    return new Response(JSON.stringify({ ok: true, resultado }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, erro: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
