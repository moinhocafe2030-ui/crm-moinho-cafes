import { supabase } from './supabase'
import type { Pedido, PedidoComCliente } from '../types/cliente'

export async function listarPedidos(clienteId: string): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('data_pedido', { ascending: false })
  if (error) throw error
  return data
}

export async function criarPedido(
  clienteId: string,
  dataPedido: string,
  produto: string | null,
  valor: number | null,
  quantidadeKg: number | null,
  observacao: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      data_pedido: dataPedido,
      produto,
      valor,
      quantidade_kg: quantidadeKg,
      observacao,
    })
  if (error) throw error
}

// Todos os pedidos num período (opcional), com o nome do cliente — usado na tela de Vendas.
export async function listarPedidosComCliente(
  dataInicio?: string,
  dataFim?: string,
): Promise<PedidoComCliente[]> {
  let query = supabase
    .from('pedidos')
    .select('*, clientes ( nome_estabelecimento )')
    .order('data_pedido', { ascending: false })

  if (dataInicio) query = query.gte('data_pedido', dataInicio)
  if (dataFim) query = query.lte('data_pedido', dataFim)

  const { data, error } = await query
  if (error) throw error
  return data as unknown as PedidoComCliente[]
}

export async function excluirPedido(id: string): Promise<void> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) throw error
}

export interface UltimoPedidoPorCliente {
  cliente_id: string
  ultima_data: string
}

// Último pedido de cada cliente, usado no Painel para o alerta de recompra.
export async function listarUltimosPedidosPorCliente(): Promise<UltimoPedidoPorCliente[]> {
  const { data, error } = await supabase.from('pedidos').select('cliente_id, data_pedido')
  if (error) throw error

  const porCliente = new Map<string, string>()
  for (const p of data as { cliente_id: string; data_pedido: string }[]) {
    const atual = porCliente.get(p.cliente_id)
    if (!atual || p.data_pedido > atual) porCliente.set(p.cliente_id, p.data_pedido)
  }
  return Array.from(porCliente, ([cliente_id, ultima_data]) => ({ cliente_id, ultima_data }))
}
