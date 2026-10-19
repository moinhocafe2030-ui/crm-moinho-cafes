import { supabase } from './supabase'
import type { Pedido } from '../types/cliente'

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
  observacao: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('pedidos')
    .insert({ cliente_id: clienteId, data_pedido: dataPedido, produto, valor, observacao })
  if (error) throw error
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
