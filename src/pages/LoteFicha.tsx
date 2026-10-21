import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { obterLoteComFornecedor } from '../lib/fornecedores'
import type { LoteCafeComFornecedor } from '../types/fornecedor'
import { VARIEDADES, PROCESSAMENTOS } from '../types/fornecedor'
import { formatarMoeda } from '../lib/data'
import { Logo } from '../components/Logo'

function rotulo(lista: { value: string; label: string }[], valor: string | null) {
  return lista.find((i) => i.value === valor)?.label ?? valor ?? '—'
}

export function LoteFicha() {
  const { id } = useParams<{ id: string }>()
  const [lote, setLote] = useState<LoteCafeComFornecedor | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    obterLoteComFornecedor(id)
      .then(setLote)
      .catch((e) => setErro(e.message))
  }, [id])

  if (erro) return <p className="p-4 text-sm text-red-600">{erro}</p>
  if (!lote) return <p className="p-4 text-gray-500">Carregando...</p>

  return (
    <div className="min-h-screen bg-creme p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm print:shadow-none">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="text-lg font-semibold text-marrom">Moinho Cafés</p>
              <p className="text-xs text-gray-500">Ficha de especificação de lote de café verde</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden rounded-lg bg-marrom px-4 py-2 text-sm font-medium text-white hover:bg-marrom-claro"
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <h1 className="mb-1 text-xl font-semibold text-gray-900">{lote.nome_lote || 'Lote de café'}</h1>
        <p className="mb-4 text-sm text-gray-500">
          {lote.fornecedores?.nome_produtor}
          {lote.fornecedores?.nome_fazenda && ` · ${lote.fornecedores.nome_fazenda}`}
          {lote.fornecedores?.regiao && ` · ${lote.fornecedores.regiao}`}
        </p>

        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Campo rotulo="Variedade" valor={rotulo(VARIEDADES, lote.variedade)} />
          <Campo rotulo="Processamento" valor={rotulo(PROCESSAMENTOS, lote.processamento)} />
          <Campo rotulo="Safra" valor={lote.safra ?? '—'} />
          <Campo
            rotulo="Altitude"
            valor={
              lote.altitude_min != null || lote.altitude_max != null
                ? `${lote.altitude_min ?? '?'}–${lote.altitude_max ?? '?'} m`
                : '—'
            }
          />
          <Campo rotulo="Certificação" valor={lote.certificacao ?? '—'} />
          <Campo rotulo="Nota SCA" valor={lote.nota_sca != null ? `${lote.nota_sca} pts` : '—'} />
          <Campo
            rotulo="Volume disponível"
            valor={lote.volume_disponivel_kg != null ? `${lote.volume_disponivel_kg} kg` : '—'}
          />
          <Campo
            rotulo="Preço por saca (60kg)"
            valor={lote.preco_por_saca != null ? formatarMoeda(lote.preco_por_saca) : '—'}
          />
        </dl>

        {lote.observacoes && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Observações</p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{lote.observacoes}</p>
          </div>
        )}

        <p className="mt-8 border-t border-gray-200 pt-3 text-xs text-gray-400">
          Documento gerado pelo CRM Moinho Cafés
        </p>
      </div>
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-gray-500">{rotulo}</dt>
      <dd className="font-medium text-gray-900">{valor}</dd>
    </div>
  )
}
