import { supabase } from './supabase'
import type { AnexoLote } from '../types/fornecedor'

const BUCKET = 'anexos-fornecedores'

export async function listarAnexosLote(loteId: string): Promise<AnexoLote[]> {
  const { data, error } = await supabase
    .from('lotes_cafe_anexos')
    .select('*')
    .eq('lote_id', loteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function enviarAnexoLote(loteId: string, arquivo: File): Promise<void> {
  const caminho = `${loteId}/${Date.now()}-${arquivo.name}`

  const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)
  if (erroUpload) throw erroUpload

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('lotes_cafe_anexos').insert({
    lote_id: loteId,
    nome_arquivo: arquivo.name,
    caminho,
    tipo: arquivo.type || null,
    tamanho: arquivo.size,
    enviado_por: user?.id ?? null,
  })
  if (error) throw error
}

export async function obterUrlAnexoLote(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function excluirAnexoLote(anexo: AnexoLote): Promise<void> {
  const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([anexo.caminho])
  if (erroStorage) throw erroStorage

  const { error } = await supabase.from('lotes_cafe_anexos').delete().eq('id', anexo.id)
  if (error) throw error
}
