// Edge Function: todo dia 15 do mês (via pg_cron), gera um CSV de clientes, de fornecedores
// e de lotes de café e manda por email (Gmail) como anexo, pra servir de backup caso algo dê
// errado no sistema. Os CSVs trazem os dados "crus" (sem traduzir código em texto), pensados
// pra restaurar os dados se precisar, não pra leitura — pra relatório bonito já existem as
// telas de Vendas/Painel/Portfólio no próprio app.
//
// Chamada pelo pg_cron usando a service role key (mantém "Verify JWT" ligado, padrão).

import { createClient } from 'npm:@supabase/supabase-js@2'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const EMAIL_BACKUP = Deno.env.get('EMAIL_BACKUP_MENSAL') ?? 'moinhocafe2030@gmail.com'

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

function formatarCelula(valor: unknown): string {
  if (valor == null) return ''
  if (Array.isArray(valor)) return valor.join(';')
  const texto = String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function paraCSV(colunas: string[], linhas: Record<string, unknown>[]): string {
  const cabecalho = colunas.join(',')
  const corpo = linhas.map((linha) => colunas.map((c) => formatarCelula(linha[c])).join(','))
  return [cabecalho, ...corpo].join('\r\n')
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

// Usa de preferência a conta Google do próprio dono (EMAIL_BACKUP); se não achar, usa a
// primeira conta conectada ao Google que encontrar.
async function escolherVendedorRemetente(): Promise<string | null> {
  const { data: tokens } = await supabaseAdmin.from('google_tokens').select('vendedor_id')
  if (!tokens || tokens.length === 0) return null

  for (const t of tokens) {
    const { data: usuario } = await supabaseAdmin.auth.admin.getUserById(t.vendedor_id)
    if (usuario?.user?.email === EMAIL_BACKUP) return t.vendedor_id
  }
  return tokens[0].vendedor_id
}

const CLIENTES_COLUNAS = [
  'id', 'nome_contato', 'nome_estabelecimento', 'tipo_estabelecimento', 'tipos_interesse',
  'telefone', 'email', 'instagram', 'cidade', 'bairro', 'endereco', 'origem', 'etapa_id',
  'responsavel_id', 'motivo_perda', 'observacoes', 'criado_em', 'atualizado_em',
]

const FORNECEDORES_COLUNAS = [
  'id', 'nome_produtor', 'nome_fazenda', 'regiao', 'endereco_completo', 'email', 'telefone',
  'observacoes', 'criado_em', 'atualizado_em',
]

const LOTES_COLUNAS = [
  'id', 'fornecedor_id', 'nome_lote', 'variedade', 'processamento', 'safra', 'altitude_min',
  'altitude_max', 'certificacao', 'nota_sca', 'volume_disponivel_kg', 'preco_por_saca',
  'observacoes', 'criado_em',
]

Deno.serve(async () => {
  try {
    const [{ data: clientes }, { data: fornecedores }, { data: lotes }] = await Promise.all([
      supabaseAdmin.from('clientes').select(CLIENTES_COLUNAS.join(',')),
      supabaseAdmin.from('fornecedores').select(FORNECEDORES_COLUNAS.join(',')),
      supabaseAdmin.from('lotes_cafe').select(LOTES_COLUNAS.join(',')),
    ])

    const csvClientes = paraCSV(CLIENTES_COLUNAS, clientes ?? [])
    const csvFornecedores = paraCSV(FORNECEDORES_COLUNAS, fornecedores ?? [])
    const csvLotes = paraCSV(LOTES_COLUNAS, lotes ?? [])

    const vendedorId = await escolherVendedorRemetente()
    if (!vendedorId) {
      return new Response(
        JSON.stringify({ ok: false, erro: 'Nenhuma conta Google conectada para enviar o backup.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const accessToken = await obterAccessTokenValido(vendedorId)
    if (!accessToken) {
      return new Response(
        JSON.stringify({ ok: false, erro: 'Não foi possível obter um token do Google válido.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    const boundary = 'crm_moinho_backup_boundary'
    const assunto = `CRM Moinho Cafés — Backup mensal (${hoje})`
    const corpoTexto =
      'Backup automático mensal do CRM Moinho Cafés.\n\n' +
      'Em anexo: clientes.csv, fornecedores.csv e lotes_cafe.csv, com todos os registros ' +
      'cadastrados até o momento deste envio. Guarde este email como cópia de segurança.'

    const anexo = (nome: string, conteudo: string) =>
      [
        `--${boundary}`,
        `Content-Type: text/csv; charset="UTF-8"; name="${nome}"`,
        `Content-Disposition: attachment; filename="${nome}"`,
        'Content-Transfer-Encoding: base64',
        '',
        paraBase64Utf8(conteudo),
        '',
      ].join('\r\n')

    const mensagem = [
      `To: ${EMAIL_BACKUP}`,
      `Subject: =?UTF-8?B?${paraBase64Utf8(assunto)}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      paraBase64Utf8(corpoTexto),
      '',
      anexo('clientes.csv', csvClientes),
      anexo('fornecedores.csv', csvFornecedores),
      anexo('lotes_cafe.csv', csvLotes),
      `--${boundary}--`,
    ].join('\r\n')

    const respostaGmail = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: paraBase64Url(mensagem) }),
      },
    )

    if (!respostaGmail.ok) {
      const detalhe = await respostaGmail.text()
      console.error('Erro ao enviar backup mensal pelo Gmail:', respostaGmail.status, detalhe)
      return new Response(JSON.stringify({ ok: false, erro: 'erro_gmail', detalhe }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        clientes: clientes?.length ?? 0,
        fornecedores: fornecedores?.length ?? 0,
        lotes: lotes?.length ?? 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, erro: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
