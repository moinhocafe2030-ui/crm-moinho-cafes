import { supabase } from './supabase'
import { parseCSV, paraCSV } from './csv'
import type { ClienteCompleto, EtapaFunil, Vendedor } from '../types/cliente'
import { TIPOS_ESTABELECIMENTO, TIPOS_INTERESSE, ORIGENS } from '../types/cliente'

const CABECALHO = [
  'Nome do contato',
  'Nome do estabelecimento',
  'Tipo',
  'Portfólio',
  'Telefone',
  'Email',
  'Instagram',
  'Cidade',
  'Bairro',
  'Endereço',
  'Origem',
  'Etapa',
  'Responsável',
  'Observações',
]

function rotuloOuValor(lista: { value: string; label: string }[], valor: string): string {
  return lista.find((i) => i.value === valor)?.label ?? valor
}

function valorOuPadrao(lista: { value: string; label: string }[], texto: string, padrao: string): string {
  const alvo = texto.trim().toLowerCase()
  if (!alvo) return padrao
  const achado = lista.find((i) => i.label.toLowerCase() === alvo || i.value.toLowerCase() === alvo)
  return achado?.value ?? padrao
}

export function exportarClientesCSV(clientes: ClienteCompleto[]): string {
  const linhas = clientes.map((c) => [
    c.nome_contato,
    c.nome_estabelecimento,
    rotuloOuValor(TIPOS_ESTABELECIMENTO, c.tipo_estabelecimento),
    c.tipos_interesse.map((t) => rotuloOuValor(TIPOS_INTERESSE, t)).join('; '),
    c.telefone ?? '',
    c.email ?? '',
    c.instagram ?? '',
    c.cidade ?? '',
    c.bairro ?? '',
    c.endereco ?? '',
    c.origem ? rotuloOuValor(ORIGENS, c.origem) : '',
    c.etapas_funil?.nome ?? '',
    c.vendedores?.nome ?? '',
    c.observacoes ?? '',
  ])
  return paraCSV([CABECALHO, ...linhas])
}

export interface ResultadoImportacao {
  criados: number
  erros: string[]
}

export async function importarClientesCSV(
  texto: string,
  etapas: EtapaFunil[],
  vendedores: Vendedor[],
): Promise<ResultadoImportacao> {
  const linhas = parseCSV(texto)
  if (linhas.length < 2) {
    return { criados: 0, erros: ['Arquivo vazio ou sem linhas de dados.'] }
  }

  const cabecalho = linhas[0].map((h) => h.trim().toLowerCase())
  const idx = (nome: string) => cabecalho.indexOf(nome.toLowerCase())

  const iNomeContato = idx('Nome do contato')
  const iNomeEstab = idx('Nome do estabelecimento')
  const iTipo = idx('Tipo')
  const iInteresses = idx('Portfólio')
  const iTelefone = idx('Telefone')
  const iEmail = idx('Email')
  const iInstagram = idx('Instagram')
  const iCidade = idx('Cidade')
  const iBairro = idx('Bairro')
  const iEndereco = idx('Endereço')
  const iOrigem = idx('Origem')
  const iEtapa = idx('Etapa')
  const iResponsavel = idx('Responsável')
  const iObservacoes = idx('Observações')

  if (iNomeContato < 0 || iNomeEstab < 0) {
    return {
      criados: 0,
      erros: ['O arquivo precisa ter as colunas "Nome do contato" e "Nome do estabelecimento".'],
    }
  }

  const etapaPadrao = [...etapas].sort((a, b) => a.ordem - b.ordem)[0]
  const erros: string[] = []
  const paraInserir: Record<string, unknown>[] = []

  linhas.slice(1).forEach((campos, indice) => {
    const nomeContato = campos[iNomeContato]?.trim()
    const nomeEstab = campos[iNomeEstab]?.trim()
    if (!nomeContato || !nomeEstab) {
      erros.push(`Linha ${indice + 2}: nome do contato e do estabelecimento são obrigatórios.`)
      return
    }

    const etapaTexto = iEtapa >= 0 ? campos[iEtapa]?.trim() : ''
    const responsavelTexto = iResponsavel >= 0 ? campos[iResponsavel]?.trim() : ''
    const interessesTexto = iInteresses >= 0 ? (campos[iInteresses] ?? '') : ''
    const origemTexto = iOrigem >= 0 ? (campos[iOrigem] ?? '') : ''

    const etapa = etapaTexto
      ? etapas.find((e) => e.nome.toLowerCase() === etapaTexto.toLowerCase())
      : undefined
    const responsavel = responsavelTexto
      ? vendedores.find((v) => v.nome.toLowerCase() === responsavelTexto.toLowerCase())
      : undefined

    const tiposInteresse = interessesTexto
      .split(';')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => valorOuPadrao(TIPOS_INTERESSE, t, ''))
      .filter(Boolean)

    paraInserir.push({
      nome_contato: nomeContato,
      nome_estabelecimento: nomeEstab,
      tipo_estabelecimento: valorOuPadrao(TIPOS_ESTABELECIMENTO, iTipo >= 0 ? campos[iTipo] ?? '' : '', 'outro'),
      tipos_interesse: tiposInteresse,
      telefone: iTelefone >= 0 ? campos[iTelefone]?.trim() || null : null,
      email: iEmail >= 0 ? campos[iEmail]?.trim() || null : null,
      instagram: iInstagram >= 0 ? campos[iInstagram]?.trim() || null : null,
      cidade: iCidade >= 0 ? campos[iCidade]?.trim() || null : null,
      bairro: iBairro >= 0 ? campos[iBairro]?.trim() || null : null,
      endereco: iEndereco >= 0 ? campos[iEndereco]?.trim() || null : null,
      origem: origemTexto.trim() ? valorOuPadrao(ORIGENS, origemTexto, 'outro') : null,
      etapa_id: (etapa ?? etapaPadrao)?.id,
      responsavel_id: responsavel?.id ?? null,
      observacoes: iObservacoes >= 0 ? campos[iObservacoes]?.trim() || null : null,
    })
  })

  if (paraInserir.length === 0) {
    return { criados: 0, erros: erros.length ? erros : ['Nenhuma linha válida encontrada.'] }
  }

  const { error } = await supabase.from('clientes').insert(paraInserir)
  if (error) {
    erros.push(error.message)
    return { criados: 0, erros }
  }

  return { criados: paraInserir.length, erros }
}
