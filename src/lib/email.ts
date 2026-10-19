import { supabase } from './supabase'
import type { ModeloEmail, EnvioEmail } from '../types/cliente'

export async function listarModelosEmail(): Promise<ModeloEmail[]> {
  const { data, error } = await supabase.from('modelos_email').select('*').order('nome')
  if (error) throw error
  return data
}

export async function criarModeloEmail(
  nome: string,
  assunto: string,
  corpo: string,
): Promise<ModeloEmail> {
  const { data, error } = await supabase
    .from('modelos_email')
    .insert({ nome, assunto, corpo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function atualizarModeloEmail(
  id: string,
  dados: Partial<Pick<ModeloEmail, 'nome' | 'assunto' | 'corpo'>>,
): Promise<void> {
  const { error } = await supabase.from('modelos_email').update(dados).eq('id', id)
  if (error) throw error
}

export async function excluirModeloEmail(id: string): Promise<void> {
  const { error } = await supabase.from('modelos_email').delete().eq('id', id)
  if (error) throw error
}

export async function listarEnviosEmail(clienteId: string): Promise<EnvioEmail[]> {
  const { data, error } = await supabase
    .from('envios_email')
    .select('*, vendedores ( nome )')
    .eq('cliente_id', clienteId)
    .order('enviado_em', { ascending: false })
  if (error) throw error
  return data as unknown as EnvioEmail[]
}

export interface ResultadoEnvio {
  enviado: boolean
  motivo?: string
}

export async function enviarEmail(
  clienteId: string,
  assunto: string,
  corpo: string,
  modeloId: string | null,
): Promise<ResultadoEnvio> {
  const { data, error } = await supabase.functions.invoke('enviar-email', {
    body: { cliente_id: clienteId, assunto, corpo, modelo_id: modeloId },
  })
  if (error) throw error
  return data as ResultadoEnvio
}

const CAMPOS_SUBSTITUICAO: Record<string, (c: {
  nome_contato: string
  nome_estabelecimento: string
  cidade: string | null
  responsavel: string | null
}) => string> = {
  '{{nome_contato}}': (c) => c.nome_contato,
  '{{nome_estabelecimento}}': (c) => c.nome_estabelecimento,
  '{{cidade}}': (c) => c.cidade ?? '',
  '{{responsavel}}': (c) => c.responsavel ?? '',
}

export function preencherModelo(
  texto: string,
  cliente: {
    nome_contato: string
    nome_estabelecimento: string
    cidade: string | null
    responsavel: string | null
  },
): string {
  let resultado = texto
  for (const [chave, fn] of Object.entries(CAMPOS_SUBSTITUICAO)) {
    resultado = resultado.split(chave).join(fn(cliente))
  }
  return resultado
}
