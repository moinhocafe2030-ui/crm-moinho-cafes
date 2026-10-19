export interface ModeloEmail {
  id: string
  nome: string
  assunto: string
  corpo: string
}

export interface EnvioEmail {
  id: string
  cliente_id: string
  modelo_id: string | null
  assunto: string
  corpo: string
  enviado_por: string | null
  enviado_em: string
  vendedores: { nome: string } | null
}

export type TipoEstabelecimento =
  | 'cafeteria'
  | 'restaurante'
  | 'padaria'
  | 'emporio'
  | 'escritorio'
  | 'revendedor'
  | 'cafeicultor_cooperativa'
  | 'pessoa_fisica'
  | 'outro'

export const TIPOS_ESTABELECIMENTO: { value: TipoEstabelecimento; label: string }[] = [
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'emporio', label: 'Empório' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'revendedor', label: 'Revendedor' },
  { value: 'cafeicultor_cooperativa', label: 'Cafecultor/Cooperativa' },
  { value: 'pessoa_fisica', label: 'Pessoa física' },
  { value: 'outro', label: 'Outro' },
]

export type TipoInteresse =
  | 'catering'
  | 'avaliacao_sensorial'
  | 'torra'
  | 'cursos'
  | 'produtos_fisicos'
  | 'white_label'
  | 'parceiro_comercial'

export const TIPOS_INTERESSE: { value: TipoInteresse; label: string }[] = [
  { value: 'catering', label: 'Catering' },
  { value: 'avaliacao_sensorial', label: 'Avaliação sensorial' },
  { value: 'torra', label: 'Torra' },
  { value: 'cursos', label: 'Cursos' },
  { value: 'produtos_fisicos', label: 'Produtos físicos' },
  { value: 'white_label', label: 'White Label' },
  { value: 'parceiro_comercial', label: 'Parceiro Comercial' },
]

const TIPOS_INTERESSE_SERVICO: TipoInteresse[] = ['catering', 'avaliacao_sensorial', 'torra', 'cursos']

export function precisaDadosServico(tipos: TipoInteresse[]) {
  return tipos.some((t) => TIPOS_INTERESSE_SERVICO.includes(t))
}

export function precisaDadosProduto(tipos: TipoInteresse[]) {
  return tipos.includes('produtos_fisicos')
}

export type Origem = 'indicacao' | 'instagram' | 'visita' | 'feira' | 'site' | 'bni' | 'ia' | 'outro'

export const ORIGENS: { value: Origem; label: string }[] = [
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'visita', label: 'Visita' },
  { value: 'feira', label: 'Feira' },
  { value: 'site', label: 'Site' },
  { value: 'bni', label: 'BNI' },
  { value: 'ia', label: 'IA' },
  { value: 'outro', label: 'Outro' },
]

export type ProdutoInteresse = 'grao' | 'moido' | 'drip' | 'outros'

export const PRODUTOS_INTERESSE: { value: ProdutoInteresse; label: string }[] = [
  { value: 'grao', label: 'Grão' },
  { value: 'moido', label: 'Moído' },
  { value: 'drip', label: 'Drip' },
  { value: 'outros', label: 'Outros' },
]

export interface EtapaFunil {
  id: string
  nome: string
  ordem: number
  cor: string
  encerra_ganho: boolean
  encerra_perda: boolean
  probabilidade: number
}

export interface Vendedor {
  id: string
  nome: string
}

export interface Tag {
  id: string
  nome: string
}

export interface ClienteServico {
  cliente_id: string
  volume_torra_kg: number | null
  numero_avaliacoes_sensoriais: number | null
  tipo_curso: string | null
  numero_convidados: number | null
}

export interface ClienteProduto {
  cliente_id: string
  volume_estimado_kg_mes: number | null
  produtos_interesse: ProdutoInteresse[]
  valor_potencial_mensal: number | null
}

export interface Amostra {
  id: string
  cliente_id: string
  data_envio: string | null
  feedback: string | null
  criado_em: string
}

export interface Pedido {
  id: string
  cliente_id: string
  data_pedido: string
  produto: string | null
  valor: number | null
  quantidade_kg: number | null
  observacao: string | null
  criado_em: string
}

export interface PedidoComCliente extends Pedido {
  clientes: { nome_estabelecimento: string } | null
}

export interface PrecoNegociado {
  id: string
  cliente_id: string
  produto: string
  preco: number
  observacao: string | null
  atualizado_em: string
}

export interface AnexoCliente {
  id: string
  cliente_id: string
  nome_arquivo: string
  caminho: string
  tipo: string | null
  tamanho: number | null
  enviado_por: string | null
  criado_em: string
}

export interface Cliente {
  id: string
  nome_contato: string
  nome_estabelecimento: string
  tipo_estabelecimento: TipoEstabelecimento
  tipos_interesse: TipoInteresse[]
  telefone: string | null
  email: string | null
  instagram: string | null
  cidade: string | null
  bairro: string | null
  endereco: string | null
  origem: Origem | null
  etapa_id: string
  responsavel_id: string | null
  motivo_perda: string | null
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface ClienteCompleto extends Cliente {
  etapas_funil: EtapaFunil | null
  vendedores: Vendedor | null
  clientes_servico: ClienteServico | null
  clientes_produto: ClienteProduto | null
  clientes_tags: { tags: Tag }[]
}

export type TipoInteracao = 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'nota'

export const TIPOS_INTERACAO: { value: TipoInteracao; label: string }[] = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visita', label: 'Visita' },
  { value: 'nota', label: 'Nota' },
]

export interface Interacao {
  id: string
  cliente_id: string
  tipo: TipoInteracao
  descricao: string
  registrado_por: string | null
  data: string
  vendedores: { nome: string } | null
}

export interface ProximoPasso {
  id: string
  cliente_id: string
  descricao: string
  data_retorno: string
  horario_retorno: string | null
  concluido: boolean
  criado_em: string
}

export interface RetornoHoje {
  id: string
  descricao: string
  data_retorno: string
  cliente_id: string
  clientes: { nome_estabelecimento: string; nome_contato: string; telefone: string | null } | null
}

export interface ClienteKanban {
  id: string
  nome_contato: string
  nome_estabelecimento: string
  etapa_id: string
  vendedores: { nome: string } | null
  clientes_produto: { valor_potencial_mensal: number | null } | null
}

export interface ClienteFormValues {
  nome_contato: string
  nome_estabelecimento: string
  tipo_estabelecimento: TipoEstabelecimento
  tipos_interesse: TipoInteresse[]
  telefone: string
  email: string
  instagram: string
  cidade: string
  bairro: string
  endereco: string
  origem: Origem | ''
  etapa_id: string
  responsavel_id: string
  observacoes: string
  tag_ids: string[]
  servico: {
    volume_torra_kg: string
    numero_avaliacoes_sensoriais: string
    tipo_curso: string
    numero_convidados: string
  }
  produto: {
    volume_estimado_kg_mes: string
    produtos_interesse: ProdutoInteresse[]
    valor_potencial_mensal: string
  }
}
