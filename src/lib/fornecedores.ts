import { supabase } from './supabase'
import { paraCSV } from './csv'
import type { Fornecedor, LoteCafe, LoteCafeComFornecedor, FiltrosPortfolio } from '../types/fornecedor'
import { VARIEDADES, PROCESSAMENTOS } from '../types/fornecedor'

function rotulo(lista: { value: string; label: string }[], valor: string | null): string {
  return lista.find((i) => i.value === valor)?.label ?? valor ?? ''
}

export interface FornecedorFormValues {
  nome_produtor: string
  nome_fazenda: string
  regiao: string
  endereco_completo: string
  email: string
  telefone: string
  observacoes: string
}

export async function listarFornecedores(busca?: string): Promise<Fornecedor[]> {
  let query = supabase.from('fornecedores').select('*').order('nome_produtor')
  if (busca) {
    query = query.or(`nome_produtor.ilike.%${busca}%,nome_fazenda.ilike.%${busca}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function obterFornecedor(id: string): Promise<Fornecedor> {
  const { data, error } = await supabase.from('fornecedores').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function salvarFornecedor(valores: FornecedorFormValues, id?: string): Promise<string> {
  const dados = {
    nome_produtor: valores.nome_produtor,
    nome_fazenda: valores.nome_fazenda || null,
    regiao: valores.regiao || null,
    endereco_completo: valores.endereco_completo || null,
    email: valores.email || null,
    telefone: valores.telefone || null,
    observacoes: valores.observacoes || null,
  }

  if (id) {
    const { error } = await supabase.from('fornecedores').update(dados).eq('id', id)
    if (error) throw error
    return id
  }

  const { data, error } = await supabase.from('fornecedores').insert(dados).select('id').single()
  if (error) throw error
  return data.id
}

export async function excluirFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) throw error
}

export interface LoteFormValues {
  nome_lote: string
  variedade: string
  processamento: string
  safra: string
  altitude_min: string
  altitude_max: string
  certificacao: string
  nota_sca: string
  volume_disponivel_kg: string
  preco_por_saca: string
  observacoes: string
}

function paraNumeroOuNull(valor: string): number | null {
  if (valor.trim() === '') return null
  const n = Number(valor)
  return Number.isNaN(n) ? null : n
}

export async function listarLotes(fornecedorId: string): Promise<LoteCafe[]> {
  const { data, error } = await supabase
    .from('lotes_cafe')
    .select('*')
    .eq('fornecedor_id', fornecedorId)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function criarLote(fornecedorId: string, valores: LoteFormValues): Promise<void> {
  const { error } = await supabase.from('lotes_cafe').insert({
    fornecedor_id: fornecedorId,
    nome_lote: valores.nome_lote || null,
    variedade: valores.variedade || null,
    processamento: valores.processamento || null,
    safra: valores.safra || null,
    altitude_min: paraNumeroOuNull(valores.altitude_min),
    altitude_max: paraNumeroOuNull(valores.altitude_max),
    certificacao: valores.certificacao || null,
    nota_sca: paraNumeroOuNull(valores.nota_sca),
    volume_disponivel_kg: paraNumeroOuNull(valores.volume_disponivel_kg),
    preco_por_saca: paraNumeroOuNull(valores.preco_por_saca),
    observacoes: valores.observacoes || null,
  })
  if (error) throw error
}

export async function excluirLote(id: string): Promise<void> {
  const { error } = await supabase.from('lotes_cafe').delete().eq('id', id)
  if (error) throw error
}

export async function obterLoteComFornecedor(id: string): Promise<LoteCafeComFornecedor> {
  const { data, error } = await supabase
    .from('lotes_cafe')
    .select('*, fornecedores ( nome_produtor, nome_fazenda, regiao )')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as LoteCafeComFornecedor
}

// Todos os lotes com dados do fornecedor — alimenta a busca do Portfólio.
export async function listarPortfolio(): Promise<LoteCafeComFornecedor[]> {
  const { data, error } = await supabase
    .from('lotes_cafe')
    .select('*, fornecedores ( nome_produtor, nome_fazenda, regiao )')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data as unknown as LoteCafeComFornecedor[]
}

export function aplicarFiltrosPortfolio(
  lotes: LoteCafeComFornecedor[],
  filtros: FiltrosPortfolio,
): LoteCafeComFornecedor[] {
  return lotes.filter((l) => {
    if (filtros.variedade && l.variedade !== filtros.variedade) return false
    if (filtros.processamento && l.processamento !== filtros.processamento) return false
    if (filtros.regiao && !(l.fornecedores?.regiao ?? '').toLowerCase().includes(filtros.regiao.toLowerCase())) {
      return false
    }
    if (filtros.altitudeMinima != null) {
      const altitude = l.altitude_max ?? l.altitude_min
      if (altitude == null || altitude < filtros.altitudeMinima) return false
    }
    if (filtros.notaMinima != null && (l.nota_sca == null || l.nota_sca < filtros.notaMinima)) return false
    if (
      filtros.volumeMinimo != null &&
      (l.volume_disponivel_kg == null || l.volume_disponivel_kg < filtros.volumeMinimo)
    ) {
      return false
    }
    if (filtros.busca) {
      const alvo = filtros.busca.toLowerCase()
      const texto = `${l.fornecedores?.nome_produtor ?? ''} ${l.fornecedores?.nome_fazenda ?? ''} ${l.nome_lote ?? ''}`.toLowerCase()
      if (!texto.includes(alvo)) return false
    }
    return true
  })
}

const CABECALHO_PORTFOLIO = [
  'Produtor/Cooperativa',
  'Fazenda',
  'Região',
  'Lote',
  'Variedade',
  'Processamento',
  'Safra',
  'Altitude mínima (m)',
  'Altitude máxima (m)',
  'Certificação',
  'Nota SCA',
  'Volume disponível (kg)',
  'Preço por saca 60kg (R$)',
  'Observações',
]

export function exportarPortfolioCSV(lotes: LoteCafeComFornecedor[]): string {
  const linhas = lotes.map((l) => [
    l.fornecedores?.nome_produtor ?? '',
    l.fornecedores?.nome_fazenda ?? '',
    l.fornecedores?.regiao ?? '',
    l.nome_lote ?? '',
    rotulo(VARIEDADES, l.variedade),
    rotulo(PROCESSAMENTOS, l.processamento),
    l.safra ?? '',
    l.altitude_min ?? '',
    l.altitude_max ?? '',
    l.certificacao ?? '',
    l.nota_sca ?? '',
    l.volume_disponivel_kg ?? '',
    l.preco_por_saca ?? '',
    l.observacoes ?? '',
  ])
  return paraCSV([CABECALHO_PORTFOLIO, ...linhas])
}
