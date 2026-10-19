import { supabase } from './supabase'
import type { PrecoNegociado } from '../types/cliente'

export async function listarPrecos(clienteId: string): Promise<PrecoNegociado[]> {
  const { data, error } = await supabase
    .from('precos_negociados')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('produto')
  if (error) throw error
  return data
}

export async function criarPreco(
  clienteId: string,
  produto: string,
  preco: number,
  observacao: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('precos_negociados')
    .insert({ cliente_id: clienteId, produto, preco, observacao })
  if (error) throw error
}

export async function excluirPreco(id: string): Promise<void> {
  const { error } = await supabase.from('precos_negociados').delete().eq('id', id)
  if (error) throw error
}
