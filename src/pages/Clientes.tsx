import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { listarClientes, listarEtapas, listarVendedores, listarTags } from '../lib/clientes'
import { exportarClientesCSV, importarClientesCSV } from '../lib/importExportClientes'
import type { ClienteCompleto, EtapaFunil, Vendedor, Tag } from '../types/cliente'
import { TIPOS_ESTABELECIMENTO } from '../types/cliente'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

export function Clientes() {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([])
  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [etapaId, setEtapaId] = useState('')
  const [tipo, setTipo] = useState('')
  const [cidade, setCidade] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [tagId, setTagId] = useState('')

  const [importando, setImportando] = useState(false)
  const [mensagemImportacao, setMensagemImportacao] = useState<string | null>(null)
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([listarEtapas(), listarVendedores(), listarTags()])
      .then(([e, v, t]) => {
        setEtapas(e)
        setVendedores(v)
        setTags(t)
      })
      .catch((e) => setErro(e.message))
  }, [])

  function recarregarClientes() {
    setCarregando(true)
    listarClientes({ busca, etapaId, tipoEstabelecimento: tipo, cidade, responsavelId, tagId })
      .then(setClientes)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    setCarregando(true)
    const timeout = setTimeout(() => {
      listarClientes({ busca, etapaId, tipoEstabelecimento: tipo, cidade, responsavelId, tagId })
        .then(setClientes)
        .catch((e) => setErro(e.message))
        .finally(() => setCarregando(false))
    }, 250)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, etapaId, tipo, cidade, responsavelId, tagId])

  function handleExportar() {
    const csv = exportarClientesCSV(clientes)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes-moinho-cafes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleArquivoSelecionado(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setImportando(true)
    setMensagemImportacao(null)
    try {
      const texto = await arquivo.text()
      const resultado = await importarClientesCSV(texto, etapas, vendedores)
      let msg = `${resultado.criados} cliente(s) importado(s).`
      if (resultado.erros.length > 0) {
        msg += ` ${resultado.erros.length} linha(s) com problema: ${resultado.erros.slice(0, 3).join(' ')}`
      }
      setMensagemImportacao(msg)
      recarregarClientes()
    } catch (err) {
      setMensagemImportacao(`Erro ao importar: ${(err as Error).message}`)
    } finally {
      setImportando(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-marrom">Clientes</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportar} className={botaoSecundarioClasse}>
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            disabled={importando}
            className={botaoSecundarioClasse}
          >
            {importando ? 'Importando...' : 'Importar CSV'}
          </button>
          <input
            ref={inputArquivoRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleArquivoSelecionado}
          />
          <Link to="/clientes/novo" className={botaoPrimarioClasse}>
            + Novo cliente
          </Link>
        </div>
      </div>

      {mensagemImportacao && (
        <p className="mb-4 rounded-lg bg-white p-3 text-sm text-gray-700 shadow-sm">{mensagemImportacao}</p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <label className={labelClasse}>Buscar</label>
          <input
            className={campoClasse}
            placeholder="Nome do contato ou estabelecimento"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClasse}>Etapa</label>
          <select className={campoClasse} value={etapaId} onChange={(e) => setEtapaId(e.target.value)}>
            <option value="">Todas</option>
            {etapas.map((et) => (
              <option key={et.id} value={et.id}>
                {et.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Tipo</label>
          <select className={campoClasse} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_ESTABELECIMENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Cidade</label>
          <input className={campoClasse} value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Responsável</label>
          <select
            className={campoClasse}
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
          >
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Tag</label>
          <select className={campoClasse} value={tagId} onChange={(e) => setTagId(e.target.value)}>
            <option value="">Todas</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : clientes.length === 0 ? (
        <p className="text-gray-500">Nenhum cliente encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map((c) => (
            <Link
              key={c.id}
              to={`/clientes/${c.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow"
            >
              <div>
                <p className="font-medium text-gray-900">{c.nome_estabelecimento}</p>
                <p className="text-sm text-gray-500">
                  {c.nome_contato} {c.cidade ? `· ${c.cidade}` : ''}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: c.etapas_funil?.cor ?? '#6b4a33' }}
              >
                {c.etapas_funil?.nome}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
