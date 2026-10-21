export type Variedade =
  | 'mundo_novo'
  | 'catuai'
  | 'bourbon'
  | 'icatu'
  | 'acaia'
  | 'topazio'
  | 'caturra'
  | 'geisha'
  | 'catucai'
  | 'outro'

export const VARIEDADES: { value: Variedade; label: string }[] = [
  { value: 'mundo_novo', label: 'Mundo Novo' },
  { value: 'catuai', label: 'Catuaí' },
  { value: 'bourbon', label: 'Bourbon' },
  { value: 'icatu', label: 'Icatu' },
  { value: 'acaia', label: 'Acaiá' },
  { value: 'topazio', label: 'Topázio' },
  { value: 'caturra', label: 'Caturra' },
  { value: 'geisha', label: 'Geisha' },
  { value: 'catucai', label: 'Catucaí' },
  { value: 'outro', label: 'Outro' },
]

export type Processamento =
  | 'natural'
  | 'cereja_descascado'
  | 'lavado'
  | 'despolpado'
  | 'fermentacao_natural'
  | 'honey'
  | 'outro'

export const PROCESSAMENTOS: { value: Processamento; label: string }[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'cereja_descascado', label: 'Cereja Descascado' },
  { value: 'lavado', label: 'Lavado' },
  { value: 'despolpado', label: 'Despolpado' },
  { value: 'fermentacao_natural', label: 'Fermentação Natural' },
  { value: 'honey', label: 'Honey' },
  { value: 'outro', label: 'Outro' },
]

export interface Fornecedor {
  id: string
  nome_produtor: string
  nome_fazenda: string | null
  regiao: string | null
  endereco_completo: string | null
  email: string | null
  telefone: string | null
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface LoteCafe {
  id: string
  fornecedor_id: string
  nome_lote: string | null
  variedade: Variedade | null
  processamento: Processamento | null
  safra: string | null
  altitude_min: number | null
  altitude_max: number | null
  certificacao: string | null
  nota_sca: number | null
  volume_disponivel_kg: number | null
  preco_por_saca: number | null
  observacoes: string | null
  criado_em: string
}

export interface LoteCafeComFornecedor extends LoteCafe {
  fornecedores: { nome_produtor: string; nome_fazenda: string | null; regiao: string | null } | null
}

export interface AnexoLote {
  id: string
  lote_id: string
  nome_arquivo: string
  caminho: string
  tipo: string | null
  tamanho: number | null
  enviado_por: string | null
  criado_em: string
}

export interface FiltrosPortfolio {
  busca?: string
  variedade?: Variedade
  processamento?: Processamento
  regiao?: string
  altitudeMinima?: number
  notaMinima?: number
  volumeMinimo?: number
}
