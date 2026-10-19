import { supabase } from './supabase'

const CAMINHO_LOGO = 'logo'

// Sempre inclui um parâmetro de cache diferente, para não mostrar uma logo antiga
// guardada no navegador depois que o dono troca a logo em Configurações.
export function urlLogoPublica(): string {
  const base = supabase.storage.from('branding').getPublicUrl(CAMINHO_LOGO).data.publicUrl
  return `${base}?t=${Date.now()}`
}

export async function enviarLogo(arquivo: File): Promise<void> {
  const { error } = await supabase.storage.from('branding').upload(CAMINHO_LOGO, arquivo, {
    upsert: true,
    contentType: arquivo.type,
    cacheControl: '3600',
  })
  if (error) throw error
}
