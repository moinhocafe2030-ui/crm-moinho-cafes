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
