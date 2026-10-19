import { supabase } from './supabase'
import type { AnexoCliente } from '../types/cliente'

const BUCKET = 'anexos-clientes'

export async function listarAnexos(clienteId: string): Promise<AnexoCliente[]> {
  const { data, error } = await supabase
    .from('anexos_cliente')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function enviarAnexo(clienteId: string, arquivo: File): Promise<void> {
  const caminho = `${clienteId}/${Date.now()}-${arquivo.name}`

  const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)
  if (erroUpload) throw erroUpload

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('anexos_cliente').insert({
    cliente_id: clienteId,
    nome_arquivo: arquivo.name,
    caminho,
    tipo: arquivo.type || null,
    tamanho: arquivo.size,
    enviado_por: user?.id ?? null,
  })
  if (error) throw error
}

export async function obterUrlAnexo(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60 * 10)
  if (error) throw error
  return data.signedUrl
}

export async function excluirAnexo(anexo: AnexoCliente): Promise<void> {
  const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([anexo.caminho])
  if (erroStorage) throw erroStorage

  const { error } = await supabase.from('anexos_cliente').delete().eq('id', anexo.id)
  if (error) throw error
}
