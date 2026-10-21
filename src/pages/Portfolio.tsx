import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPortfolio, aplicarFiltrosPortfolio, exportarPortfolioCSV } from '../lib/fornecedores'
import type { LoteCafeComFornecedor, FiltrosPortfolio } from '../types/fornecedor'
import { VARIEDADES, PROCESSAMENTOS } from '../types/fornecedor'
import { formatarMoeda } from '../lib/data'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

function rotulo(lista: { value: string; label: string }[], valor: string | null) {
  return lista.find((i) => i.value === valor)?.label ?? valor ?? '—'
}

export function Portfolio() {
  const [lotes, setLotes] = useState<LoteCafeComFornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosPortfolio>({})

  useEffect(() => {
    listarPortfolio()
      .then(setLotes)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const resultado = useMemo(() => aplicarFiltrosPortfolio(lotes, filtros), [lotes, filtros])

  function handleExportar() {
    const csv = exportarPortfolioCSV(resultado)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-cafes-moinho-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-marrom">Fornecedores</h1>
        <Link to="/fornecedores/novo" className={botaoPrimarioClasse}>
          + Novo fornecedor
        </Link>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <section className="mb-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm print:hidden">
        <div>
          <label className={labelClasse}>Buscar (produtor, fazenda ou lote)</label>
          <input
            className={campoClasse}
            value={filtros.busca ?? ''}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value || undefined }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClasse}>Variedade</label>
            <select
              className={campoClasse}
              value={filtros.variedade ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, variedade: (e.target.value || undefined) as never }))
              }
            >
              <option value="">Todas</option>
              {VARIEDADES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Processamento</label>
            <select
              className={campoClasse}
              value={filtros.processamento ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, processamento: (e.target.value || undefined) as never }))
              }
            >
              <option value="">Todos</option>
              {PROCESSAMENTOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Região</label>
            <input
              className={campoClasse}
              value={filtros.regiao ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, regiao: e.target.value || undefined }))}
            />
          </div>
          <div>
            <label className={labelClasse}>Altitude mínima (m)</label>
            <input
              type="number"
              className={campoClasse}
              value={filtros.altitudeMinima ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  altitudeMinima: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className={labelClasse}>Nota SCA mínima</label>
            <input
              type="number"
              className={campoClasse}
              value={filtros.notaMinima ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  notaMinima: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className={labelClasse}>Volume mínimo (kg)</label>
            <input
              type="number"
              className={campoClasse}
              value={filtros.volumeMinimo ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  volumeMinimo: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
          </div>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between print:hidden">
        <p className="text-sm text-gray-500">{resultado.length} lote(s) encontrado(s)</p>
        <div className="flex gap-2">
          <button type="button" onClick={handleExportar} className={botaoSecundarioClasse}>
            Exportar CSV/Excel
          </button>
          <button type="button" onClick={() => window.print()} className={botaoSecundarioClasse}>
            Imprimir lista
          </button>
        </div>
      </div>

      {resultado.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum lote encontrado com esses filtros.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resultado.map((l) => (
            <div key={l.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/fornecedores/${l.fornecedor_id}`}
                    className="font-medium text-marrom underline"
                  >
                    {l.fornecedores?.nome_produtor}
                  </Link>
                  {l.fornecedores?.nome_fazenda && (
                    <span className="text-sm text-gray-500"> · {l.fornecedores.nome_fazenda}</span>
                  )}
                  <p className="text-sm text-gray-700">{l.nome_lote || 'Lote sem nome'}</p>
                </div>
                <a
                  href={`/fornecedores/lotes/${l.id}/imprimir`}
                  target="_blank"
                  rel="noreferrer"
                  className="print:hidden shrink-0 text-xs text-gray-400 underline hover:text-marrom"
                >
                  Gerar ficha
                </a>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 sm:grid-cols-4">
                <span>
                  <strong className="text-gray-900">Variedade:</strong> {rotulo(VARIEDADES, l.variedade)}
                </span>
                <span>
                  <strong className="text-gray-900">Processo:</strong>{' '}
                  {rotulo(PROCESSAMENTOS, l.processamento)}
                </span>
                <span>
                  <strong className="text-gray-900">Região:</strong> {l.fornecedores?.regiao ?? '—'}
                </span>
                <span>
                  <strong className="text-gray-900">Altitude:</strong>{' '}
                  {l.altitude_min != null || l.altitude_max != null
                    ? `${l.altitude_min ?? '?'}–${l.altitude_max ?? '?'} m`
                    : '—'}
                </span>
                <span>
                  <strong className="text-gray-900">Nota SCA:</strong> {l.nota_sca ?? '—'}
                </span>
                <span>
                  <strong className="text-gray-900">Volume:</strong>{' '}
                  {l.volume_disponivel_kg != null ? `${l.volume_disponivel_kg} kg` : '—'}
                </span>
                <span>
                  <strong className="text-gray-900">Preço/saca:</strong>{' '}
                  {l.preco_por_saca != null ? formatarMoeda(l.preco_por_saca) : '—'}
                </span>
                <span>
                  <strong className="text-gray-900">Safra:</strong> {l.safra ?? '—'}
                </span>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
