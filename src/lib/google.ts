import { supabase } from './supabase'

const ESCOPOS_GOOGLE = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
].join(' ')

export async function conectarGoogle(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Você precisa estar logado.')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não configurado no .env.local')
  }

  const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: ESCOPOS_GOOGLE,
    access_type: 'offline',
    prompt: 'consent',
    state: token,
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function statusGoogleAgenda(): Promise<{ conectado: boolean; atualizadoEm?: string }> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return { conectado: false }

  const { data: token } = await supabase
    .from('google_tokens')
    .select('atualizado_em')
    .eq('vendedor_id', userId)
    .maybeSingle()

  return token ? { conectado: true, atualizadoEm: token.atualizado_em } : { conectado: false }
}

export async function sincronizarEventoAgenda(proximoPassoId: string): Promise<void> {
  try {
    await supabase.functions.invoke('google-agenda-sincronizar', {
      body: { proximo_passo_id: proximoPassoId },
    })
  } catch {
    // Sincronização com a agenda é um "bônus": se falhar (ex: vendedor não conectou o
    // Google ainda), o próximo passo já foi salvo normalmente no CRM, então não interrompe o usuário.
  }
}
