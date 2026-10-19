import { supabase } from './supabase'
import type { Interacao, TipoInteracao } from '../types/cliente'

export async function listarInteracoes(clienteId: string): Promise<Interacao[]> {
  const { data, error } = await supabase
    .from('interacoes')
    .select('*, vendedores ( nome )')
    .eq('cliente_id', clienteId)
    .order('data', { ascending: false })
  if (error) throw error
  return data as unknown as Interacao[]
}

export async function criarInteracao(
  clienteId: string,
  tipo: TipoInteracao,
  descricao: string,
): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  const { error } = await supabase.from('interacoes').insert({
    cliente_id: clienteId,
    tipo,
    descricao,
    registrado_por: userData.user?.id ?? null,
  })
  if (error) throw error
}
