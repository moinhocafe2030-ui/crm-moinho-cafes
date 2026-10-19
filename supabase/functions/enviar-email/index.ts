// Edge Function: envia um email a partir da ficha do cliente, usando a conta Gmail
// conectada pelo vendedor que está logado, e registra o envio no histórico.
//
// Chamada autenticada pelo app (mantém "Verify JWT" ligado, padrão do Supabase).

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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
    const { cliente_id, assunto, corpo, modelo_id } = await req.json()
    if (!cliente_id || !assunto || !corpo) {
      return resposta({ erro: 'cliente_id, assunto e corpo são obrigatórios' }, 400)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    const { data: chamador, error: erroChamador } = await supabaseAdmin.auth.getUser(jwt)
    if (erroChamador || !chamador.user) {
      return resposta({ enviado: false, motivo: 'nao_autenticado' })
    }
    const vendedorId = chamador.user.id

    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('email')
      .eq('id', cliente_id)
      .single()
    if (!cliente?.email) {
      return resposta({ enviado: false, motivo: 'cliente_sem_email' })
    }

    const accessToken = await obterAccessTokenValido(vendedorId)
    if (!accessToken) {
      console.error('Vendedor não conectado ao Google ou refresh falhou:', vendedorId)
      return resposta({ enviado: false, motivo: 'nao_conectado' })
    }

    const corpoBase64 = paraBase64Utf8(corpo)
    const assuntoCodificado = `=?UTF-8?B?${paraBase64Utf8(assunto)}?=`
    const mensagem = [
      `To: ${cliente.email}`,
      `Subject: ${assuntoCodificado}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      corpoBase64,
    ].join('\r\n')

    const respostaGmail = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: paraBase64Url(mensagem) }),
      },
    )

    const dadosGmail = await respostaGmail.json()
    if (!respostaGmail.ok) {
      console.error('Erro ao enviar email pelo Gmail:', respostaGmail.status, JSON.stringify(dadosGmail))
      return resposta({ enviado: false, motivo: 'erro_gmail', detalhe: dadosGmail })
    }

    await supabaseAdmin.from('envios_email').insert({
      cliente_id,
      modelo_id: modelo_id ?? null,
      assunto,
      corpo,
      enviado_por: vendedorId,
    })

    await supabaseAdmin.from('interacoes').insert({
      cliente_id,
      tipo: 'email',
      descricao: `Email enviado: ${assunto}`,
      registrado_por: vendedorId,
    })

    return resposta({ enviado: true })
  } catch (e) {
    return resposta({ erro: String(e) }, 500)
  }
})
