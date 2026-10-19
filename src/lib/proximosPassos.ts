import { supabase } from './supabase'
import type { ProximoPasso, RetornoHoje } from '../types/cliente'
import { dataHojeISO } from './data'
import { sincronizarEventoAgenda } from './google'

export async function listarProximosPassos(clienteId: string): Promise<ProximoPasso[]> {
  const { data, error } = await supabase
    .from('proximos_passos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_retorno', { ascending: false })
  if (error) throw error
  return data
}

export async function criarProximoPasso(
  clienteId: string,
  descricao: string,
  dataRetorno: string,
  horarioRetorno: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from('proximos_passos')
    .insert({
      cliente_id: clienteId,
      descricao,
      data_retorno: dataRetorno,
      horario_retorno: horarioRetorno,
    })
    .select('id')
    .single()
  if (error) throw error

  sincronizarEventoAgenda(data.id)
}

export async function marcarProximoPassoConcluido(id: string, concluido: boolean): Promise<void> {
  const { error } = await supabase.from('proximos_passos').update({ concluido }).eq('id', id)
  if (error) throw error
}

export async function listarRetornosHoje(): Promise<RetornoHoje[]> {
  const hoje = dataHojeISO()
  const { data, error } = await supabase
    .from('proximos_passos')
    .select(
      'id, descricao, data_retorno, cliente_id, clientes ( nome_estabelecimento, nome_contato, telefone )',
    )
    .eq('concluido', false)
    .lte('data_retorno', hoje)
    .order('data_retorno', { ascending: true })
  if (error) throw error
  return data as unknown as RetornoHoje[]
}
