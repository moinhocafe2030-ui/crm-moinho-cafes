import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  obterFornecedor,
  excluirFornecedor,
  listarLotes,
  criarLote,
  excluirLote,
} from '../lib/fornecedores'
import type { LoteFormValues } from '../lib/fornecedores'
import { listarAnexosLote, enviarAnexoLote, obterUrlAnexoLote, excluirAnexoLote } from '../lib/anexosLote'
import type { Fornecedor, LoteCafe, AnexoLote } from '../types/fornecedor'
import { VARIEDADES, PROCESSAMENTOS } from '../types/fornecedor'
import { formatarMoeda, formatarDataSimples } from '../lib/data'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

const LOTE_VAZIO: LoteFormValues = {
  nome_lote: '',
  variedade: '',
  processamento: '',
  safra: '',
  altitude_min: '',
  altitude_max: '',
  certificacao: '',
  nota_sca: '',
  volume_disponivel_kg: '',
  preco_por_saca: '',
  observacoes: '',
}

function rotulo(lista: { value: string; label: string }[], valor: string | null) {
  return lista.find((i) => i.value === valor)?.label ?? valor ?? '—'
}

export function FornecedorFicha() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [lotes, setLotes] = useState<LoteCafe[]>([])
  const [anexosPorLote, setAnexosPorLote] = useState<Record<string, AnexoLote[]>>({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [mostrarNovoLote, setMostrarNovoLote] = useState(false)
  const [novoLote, setNovoLote] = useState<LoteFormValues>(LOTE_VAZIO)
  const [salvandoLote, setSalvandoLote] = useState(false)
  const [enviandoAnexo, setEnviandoAnexo] = useState<string | null>(null)

  async function carregar() {
    if (!id) return
    setCarregando(true)
    try {
      const [f, ls] = await Promise.all([obterFornecedor(id), listarLotes(id)])
      setFornecedor(f)
      setLotes(ls)
      const anexos = await Promise.all(ls.map((l) => listarAnexosLote(l.id)))
      setAnexosPorLote(Object.fromEntries(ls.map((l, i) => [l.id, anexos[i]])))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleExcluirFornecedor() {
    if (!id) return
    if (!confirm('Excluir este fornecedor e todos os lotes registrados? Essa ação não pode ser desfeita.')) {
      return
    }
    setExcluindo(true)
    try {
      await excluirFornecedor(id)
      navigate('/fornecedores')
    } catch (e) {
      setErro((e as Error).message)
      setExcluindo(false)
    }
  }

  async function handleAdicionarLote() {
    if (!id) return
    setSalvandoLote(true)
    try {
      await criarLote(id, novoLote)
      setNovoLote(LOTE_VAZIO)
      setMostrarNovoLote(false)
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoLote(false)
    }
  }

  async function handleExcluirLote(loteId: string) {
    if (!confirm('Excluir este lote e seus anexos?')) return
    try {
      await excluirLote(loteId)
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleEnviarAnexo(loteId: string, arquivo: File | undefined) {
    if (!arquivo) return
    setEnviandoAnexo(loteId)
    try {
      await enviarAnexoLote(loteId, arquivo)
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviandoAnexo(null)
    }
  }

  async function handleAbrirAnexo(anexo: AnexoLote) {
    try {
      const url = await obterUrlAnexoLote(anexo.caminho)
      window.open(url, '_blank')
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleExcluirAnexo(anexo: AnexoLote) {
    if (!confirm('Excluir este anexo?')) return
    try {
      await excluirAnexoLote(anexo)
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>
  if (erro && !fornecedor) return <p className="text-sm text-red-600">{erro}</p>
  if (!fornecedor) return null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-marrom">{fornecedor.nome_produtor}</h1>
          {fornecedor.nome_fazenda && <p className="text-sm text-gray-500">{fornecedor.nome_fazenda}</p>}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Link to={`/fornecedores/${fornecedor.id}/editar`} className={botaoSecundarioClasse}>
          Editar
        </Link>
        <button onClick={handleExcluirFornecedor} disabled={excluindo} className={botaoSecundarioClasse}>
          {excluindo ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Dados do fornecedor</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Região</dt>
            <dd className="font-medium text-gray-900">{fornecedor.regiao ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Endereço</dt>
            <dd className="font-medium text-gray-900">{fornecedor.endereco_completo ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{fornecedor.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Celular</dt>
            <dd className="font-medium text-gray-900">{fornecedor.telefone ?? '—'}</dd>
          </div>
        </dl>
        {fornecedor.observacoes && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{fornecedor.observacoes}</p>
        )}
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Lotes de café</h2>
          <button
            type="button"
            onClick={() => setMostrarNovoLote((v) => !v)}
            className={botaoSecundarioClasse}
          >
            {mostrarNovoLote ? 'Cancelar' : '+ Novo lote'}
          </button>
        </div>

        {mostrarNovoLote && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClasse}>Nome/descrição do lote</label>
                <input
                  className={campoClasse}
                  value={novoLote.nome_lote}
                  onChange={(e) => setNovoLote({ ...novoLote, nome_lote: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Safra</label>
                <input
                  className={campoClasse}
                  placeholder="2024/2025"
                  value={novoLote.safra}
                  onChange={(e) => setNovoLote({ ...novoLote, safra: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Variedade</label>
                <select
                  className={campoClasse}
                  value={novoLote.variedade}
                  onChange={(e) => setNovoLote({ ...novoLote, variedade: e.target.value })}
                >
                  <option value="">Selecione</option>
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
                  value={novoLote.processamento}
                  onChange={(e) => setNovoLote({ ...novoLote, processamento: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {PROCESSAMENTOS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasse}>Altitude mínima (m)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={novoLote.altitude_min}
                  onChange={(e) => setNovoLote({ ...novoLote, altitude_min: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Altitude máxima (m)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={novoLote.altitude_max}
                  onChange={(e) => setNovoLote({ ...novoLote, altitude_max: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Certificação/selo</label>
                <input
                  className={campoClasse}
                  value={novoLote.certificacao}
                  onChange={(e) => setNovoLote({ ...novoLote, certificacao: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Nota SCA</label>
                <input
                  type="number"
                  step="0.25"
                  min={0}
                  max={100}
                  className={campoClasse}
                  value={novoLote.nota_sca}
                  onChange={(e) => setNovoLote({ ...novoLote, nota_sca: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Volume disponível (kg)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={novoLote.volume_disponivel_kg}
                  onChange={(e) => setNovoLote({ ...novoLote, volume_disponivel_kg: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClasse}>Preço por saca 60kg (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className={campoClasse}
                  value={novoLote.preco_por_saca}
                  onChange={(e) => setNovoLote({ ...novoLote, preco_por_saca: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClasse}>Observações</label>
              <textarea
                className={campoClasse}
                rows={2}
                value={novoLote.observacoes}
                onChange={(e) => setNovoLote({ ...novoLote, observacoes: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={handleAdicionarLote}
              disabled={salvandoLote}
              className={`${botaoPrimarioClasse} self-end`}
            >
              {salvandoLote ? 'Salvando...' : 'Salvar lote'}
            </button>
          </div>
        )}

        {lotes.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum lote registrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {lotes.map((l) => (
              <div key={l.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="mb-2 flex items-start justify-between">
                  <p className="font-medium text-gray-900">{l.nome_lote || 'Lote sem nome'}</p>
                  <button
                    type="button"
                    onClick={() => handleExcluirLote(l.id)}
                    className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                  >
                    Excluir
                  </button>
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
                    <strong className="text-gray-900">Safra:</strong> {l.safra ?? '—'}
                  </span>
                  <span>
                    <strong className="text-gray-900">Altitude:</strong>{' '}
                    {l.altitude_min != null || l.altitude_max != null
                      ? `${l.altitude_min ?? '?'}–${l.altitude_max ?? '?'} m`
                      : '—'}
                  </span>
                  <span>
                    <strong className="text-gray-900">Certificação:</strong> {l.certificacao ?? '—'}
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
                </dl>
                {l.observacoes && <p className="mt-2 text-gray-600">{l.observacoes}</p>}

                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="mb-1 text-xs font-medium text-gray-700">Anexos (laudo SCA, fotos...)</p>
                  {(anexosPorLote[l.id] ?? []).length > 0 && (
                    <ul className="mb-1 flex flex-col gap-1">
                      {(anexosPorLote[l.id] ?? []).map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleAbrirAnexo(a)}
                            className="truncate text-left text-marrom underline"
                          >
                            {a.nome_arquivo}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirAnexo(a)}
                            className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                          >
                            Excluir
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    type="file"
                    onChange={(e) => handleEnviarAnexo(l.id, e.target.files?.[0])}
                    disabled={enviandoAnexo === l.id}
                    className="text-xs"
                  />
                  {enviandoAnexo === l.id && <p className="text-xs text-gray-500">Enviando...</p>}
                </div>

                <Link
                  to={`/fornecedores/lotes/${l.id}/imprimir`}
                  target="_blank"
                  className="mt-2 inline-block text-xs text-gray-400 underline hover:text-marrom"
                >
                  Gerar ficha para enviar ao comprador
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-400">
        Cadastrado em {formatarDataSimples(fornecedor.criado_em.slice(0, 10))}
      </p>
    </div>
  )
}
