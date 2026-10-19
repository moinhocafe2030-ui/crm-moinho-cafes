import { supabase } from './supabase'

export interface ClientePainel {
  id: string
  nome_estabelecimento: string
  etapa_id: string
  atualizado_em: string
  clientes_produto: { valor_potencial_mensal: number | null } | null
}

export async function listarClientesParaPainel(): Promise<ClientePainel[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, nome_estabelecimento, etapa_id, atualizado_em, clientes_produto ( valor_potencial_mensal )',
    )
  if (error) throw error
  return data as unknown as ClientePainel[]
}

// Clientes que já receberam pelo menos uma amostra, para calcular a taxa de conversão
// de amostra em venda no Painel.
export async function listarClienteIdsComAmostra(): Promise<Set<string>> {
  const { data, error } = await supabase.from('amostras').select('cliente_id')
  if (error) throw error
  return new Set((data as { cliente_id: string }[]).map((a) => a.cliente_id))
}
