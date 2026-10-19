import { supabase } from './supabase'
import type { ClienteKanban, EtapaFunil } from '../types/cliente'

export async function listarClientesParaFunil(): Promise<ClienteKanban[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, nome_contato, nome_estabelecimento, etapa_id, vendedores ( nome ), clientes_produto ( valor_potencial_mensal )',
    )
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data as unknown as ClienteKanban[]
}

export async function moverClienteEtapa(clienteId: string, etapaId: string): Promise<void> {
  const { error } = await supabase.from('clientes').update({ etapa_id: etapaId }).eq('id', clienteId)
  if (error) throw error
}

export async function criarEtapa(nome: string, proximaOrdem: number): Promise<EtapaFunil> {
  const { data, error } = await supabase
    .from('etapas_funil')
    .insert({ nome, ordem: proximaOrdem })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function atualizarEtapa(
  id: string,
  dados: Partial<Pick<EtapaFunil, 'nome' | 'cor' | 'encerra_ganho' | 'encerra_perda'>>,
): Promise<void> {
  const { error } = await supabase.from('etapas_funil').update(dados).eq('id', id)
  if (error) throw error
}

export async function reordenarEtapas(etapas: { id: string; ordem: number }[]): Promise<void> {
  for (const e of etapas) {
    const { error } = await supabase.from('etapas_funil').update({ ordem: e.ordem }).eq('id', e.id)
    if (error) throw error
  }
}

export async function excluirEtapa(id: string): Promise<void> {
  const { error } = await supabase.from('etapas_funil').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('Não é possível excluir: existem clientes nesta etapa. Mova-os primeiro.')
    }
    throw error
  }
}
