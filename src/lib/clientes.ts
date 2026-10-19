import { supabase } from './supabase'
import type {
  Cliente,
  ClienteCompleto,
  ClienteFormValues,
  EtapaFunil,
  Vendedor,
  Tag,
  Amostra,
} from '../types/cliente'

const SELECT_COMPLETO = `
  *,
  etapas_funil ( id, nome, ordem, cor ),
  vendedores ( id, nome ),
  clientes_servico ( * ),
  clientes_produto ( * ),
  clientes_tags ( tags ( id, nome ) )
`

export interface FiltrosClientes {
  busca?: string
  etapaId?: string
  tipoEstabelecimento?: string
  cidade?: string
  responsavelId?: string
  tagId?: string
}

export async function listarClientes(filtros: FiltrosClientes): Promise<ClienteCompleto[]> {
  let query = supabase.from('clientes').select(SELECT_COMPLETO).order('criado_em', { ascending: false })

  if (filtros.etapaId) query = query.eq('etapa_id', filtros.etapaId)
  if (filtros.tipoEstabelecimento) query = query.eq('tipo_estabelecimento', filtros.tipoEstabelecimento)
  if (filtros.responsavelId) query = query.eq('responsavel_id', filtros.responsavelId)
  if (filtros.cidade) query = query.ilike('cidade', `%${filtros.cidade}%`)
  if (filtros.busca) {
    query = query.or(
      `nome_contato.ilike.%${filtros.busca}%,nome_estabelecimento.ilike.%${filtros.busca}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error

  let resultado = (data ?? []) as unknown as ClienteCompleto[]

  if (filtros.tagId) {
    resultado = resultado.filter((c) => c.clientes_tags.some((ct) => ct.tags.id === filtros.tagId))
  }

  return resultado
}

export async function obterCliente(id: string): Promise<ClienteCompleto> {
  const { data, error } = await supabase.from('clientes').select(SELECT_COMPLETO).eq('id', id).single()
  if (error) throw error
  return data as unknown as ClienteCompleto
}

export async function listarEtapas(): Promise<EtapaFunil[]> {
  const { data, error } = await supabase.from('etapas_funil').select('*').order('ordem')
  if (error) throw error
  return data
}

export async function listarVendedores(): Promise<Vendedor[]> {
  const { data, error } = await supabase.from('vendedores').select('*').order('nome')
  if (error) throw error
  return data
}

export async function listarTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarTag(nome: string): Promise<Tag> {
  const { data, error } = await supabase.from('tags').insert({ nome }).select().single()
  if (error) throw error
  return data
}

function paraNumeroOuNull(valor: string): number | null {
  if (valor.trim() === '') return null
  const n = Number(valor)
  return Number.isNaN(n) ? null : n
}

export async function salvarCliente(valores: ClienteFormValues, clienteId?: string): Promise<string> {
  const dadosCliente: Partial<Cliente> = {
    nome_contato: valores.nome_contato,
    nome_estabelecimento: valores.nome_estabelecimento,
    tipo_estabelecimento: valores.tipo_estabelecimento,
    tipos_interesse: valores.tipos_interesse,
    telefone: valores.telefone || null,
    email: valores.email || null,
    instagram: valores.instagram || null,
    cidade: valores.cidade || null,
    bairro: valores.bairro || null,
    endereco: valores.endereco || null,
    origem: valores.origem || null,
    etapa_id: valores.etapa_id,
    responsavel_id: valores.responsavel_id || null,
    observacoes: valores.observacoes || null,
  }

  let id = clienteId

  if (id) {
    const { error } = await supabase.from('clientes').update(dadosCliente).eq('id', id)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('clientes').insert(dadosCliente).select('id').single()
    if (error) throw error
    id = data.id
  }

  // Dados de serviço
  const precisaServico = ['catering', 'avaliacao_sensorial', 'torra', 'cursos'].some((t) =>
    valores.tipos_interesse.includes(t as never),
  )
  if (precisaServico) {
    await supabase.from('clientes_servico').upsert({
      cliente_id: id,
      volume_torra_kg: paraNumeroOuNull(valores.servico.volume_torra_kg),
      numero_avaliacoes_sensoriais: paraNumeroOuNull(valores.servico.numero_avaliacoes_sensoriais),
      tipo_curso: valores.servico.tipo_curso || null,
      numero_convidados: paraNumeroOuNull(valores.servico.numero_convidados),
    })
  } else {
    await supabase.from('clientes_servico').delete().eq('cliente_id', id)
  }

  // Dados de produto
  const precisaProduto = valores.tipos_interesse.includes('produtos_fisicos')
  if (precisaProduto) {
    await supabase.from('clientes_produto').upsert({
      cliente_id: id,
      volume_estimado_kg_mes: paraNumeroOuNull(valores.produto.volume_estimado_kg_mes),
      produtos_interesse: valores.produto.produtos_interesse,
      valor_potencial_mensal: paraNumeroOuNull(valores.produto.valor_potencial_mensal),
    })
  } else {
    await supabase.from('clientes_produto').delete().eq('cliente_id', id)
  }

  // Tags: remove todas e recria (simples e suficiente para o volume de dados)
  await supabase.from('clientes_tags').delete().eq('cliente_id', id)
  if (valores.tag_ids.length > 0) {
    await supabase
      .from('clientes_tags')
      .insert(valores.tag_ids.map((tagId) => ({ cliente_id: id, tag_id: tagId })))
  }

  return id!
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw error
}

export async function marcarPerdido(id: string, etapaPerdidoId: string, motivo: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update({ etapa_id: etapaPerdidoId, motivo_perda: motivo })
    .eq('id', id)
  if (error) throw error
}

export async function listarAmostras(clienteId: string): Promise<Amostra[]> {
  const { data, error } = await supabase
    .from('amostras')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function criarAmostra(
  clienteId: string,
  dataEnvio: string | null,
  feedback: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('amostras')
    .insert({ cliente_id: clienteId, data_envio: dataEnvio, feedback })
  if (error) throw error
}
