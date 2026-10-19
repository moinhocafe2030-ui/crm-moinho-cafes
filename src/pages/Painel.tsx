import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarEtapas } from '../lib/clientes'
import { listarClientesParaPainel, listarClienteIdsComAmostra } from '../lib/painel'
import { listarUltimosPedidosPorCliente } from '../lib/pedidos'
import type { UltimoPedidoPorCliente } from '../lib/pedidos'
import type { EtapaFunil } from '../types/cliente'
import type { ClientePainel } from '../lib/painel'
import { formatarMoeda, diasDesde } from '../lib/data'
import { campoClasse, labelClasse } from '../lib/estilos'

export function Painel() {
  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [clientes, setClientes] = useState<ClientePainel[]>([])
  const [idsComAmostra, setIdsComAmostra] = useState<Set<string>>(new Set())
  const [ultimosPedidos, setUltimosPedidos] = useState<UltimoPedidoPorCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [diasLimite, setDiasLimite] = useState(14)
  const [diasLimiteRecompra, setDiasLimiteRecompra] = useState(30)

  useEffect(() => {
    Promise.all([
      listarEtapas(),
      listarClientesParaPainel(),
      listarClienteIdsComAmostra(),
      listarUltimosPedidosPorCliente(),
    ])
      .then(([e, c, amostrados, pedidos]) => {
        setEtapas(e)
        setClientes(c)
        setIdsComAmostra(amostrados)
        setUltimosPedidos(pedidos)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const etapaPorId = useMemo(() => new Map(etapas.map((e) => [e.id, e])), [etapas])

  const totalPorEtapa = useMemo(
    () => etapas.map((e) => ({ etapa: e, total: clientes.filter((c) => c.etapa_id === e.id).length })),
    [etapas, clientes],
  )

  const valorPotencial = useMemo(
    () =>
      clientes
        .filter((c) => !etapaPorId.get(c.etapa_id)?.encerra_perda)
        .reduce((soma, c) => soma + (c.clientes_produto?.valor_potencial_mensal ?? 0), 0),
    [clientes, etapaPorId],
  )

  const previsaoPonderada = useMemo(
    () =>
      clientes
        .filter((c) => !etapaPorId.get(c.etapa_id)?.encerra_perda)
        .reduce((soma, c) => {
          const probabilidade = etapaPorId.get(c.etapa_id)?.probabilidade ?? 0
          const valor = c.clientes_produto?.valor_potencial_mensal ?? 0
          return soma + (valor * probabilidade) / 100
        }, 0),
    [clientes, etapaPorId],
  )

  const ganhos = clientes.filter((c) => etapaPorId.get(c.etapa_id)?.encerra_ganho).length
  const perdidos = clientes.filter((c) => etapaPorId.get(c.etapa_id)?.encerra_perda).length
  const taxaConversao = ganhos + perdidos > 0 ? (ganhos / (ganhos + perdidos)) * 100 : null

  const amostrados = useMemo(
    () => clientes.filter((c) => idsComAmostra.has(c.id)),
    [clientes, idsComAmostra],
  )
  const amostrasConvertidas = amostrados.filter((c) => etapaPorId.get(c.etapa_id)?.encerra_ganho).length
  const conversaoAmostra = amostrados.length > 0 ? (amostrasConvertidas / amostrados.length) * 100 : null

  const parados = useMemo(
    () =>
      clientes
        .filter((c) => {
          const etapa = etapaPorId.get(c.etapa_id)
          return etapa && !etapa.encerra_ganho && !etapa.encerra_perda && diasDesde(c.atualizado_em) > diasLimite
        })
        .sort((a, b) => diasDesde(b.atualizado_em) - diasDesde(a.atualizado_em)),
    [clientes, etapaPorId, diasLimite],
  )

  const ultimaPedidoPorCliente = useMemo(
    () => new Map(ultimosPedidos.map((p) => [p.cliente_id, p.ultima_data])),
    [ultimosPedidos],
  )

  const semComprar = useMemo(
    () =>
      clientes
        .filter((c) => etapaPorId.get(c.etapa_id)?.encerra_ganho)
        .map((c) => ({ cliente: c, ultimaData: ultimaPedidoPorCliente.get(c.id) }))
        .filter(
          (x): x is { cliente: ClientePainel; ultimaData: string } =>
            !!x.ultimaData && diasDesde(x.ultimaData) > diasLimiteRecompra,
        )
        .sort((a, b) => diasDesde(a.ultimaData) < diasDesde(b.ultimaData) ? 1 : -1),
    [clientes, etapaPorId, ultimaPedidoPorCliente, diasLimiteRecompra],
  )

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  const maiorTotal = Math.max(1, ...totalPorEtapa.map((t) => t.total))

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">Painel</h1>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Cartao titulo="Valor potencial do funil" valor={formatarMoeda(valorPotencial)} />
        <Cartao
          titulo="Previsão ponderada"
          valor={formatarMoeda(previsaoPonderada)}
          legenda="pelo % de chance de cada etapa"
        />
        <Cartao
          titulo="Taxa de conversão"
          valor={taxaConversao != null ? `${taxaConversao.toFixed(0)}%` : '—'}
          legenda={`${ganhos} ganhos · ${perdidos} perdidos`}
        />
        <Cartao
          titulo="Conversão de amostra"
          valor={conversaoAmostra != null ? `${conversaoAmostra.toFixed(0)}%` : '—'}
          legenda={
            amostrados.length > 0
              ? `${amostrasConvertidas} de ${amostrados.length} viraram cliente`
              : 'nenhuma amostra enviada ainda'
          }
        />
        <Cartao titulo="Total de clientes" valor={String(clientes.length)} />
        <Cartao titulo="Parados" valor={String(parados.length)} legenda={`há mais de ${diasLimite} dias`} />
      </div>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Total por etapa</h2>
        <div className="flex flex-col gap-2">
          {totalPorEtapa.map(({ etapa, total }) => (
            <div key={etapa.id} className="flex items-center gap-2 text-sm">
              <span className="w-36 shrink-0 truncate text-gray-700">{etapa.nome}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(total / maiorTotal) * 100}%`, backgroundColor: etapa.cor }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-gray-500">{total}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-medium text-gray-900">Clientes parados</h2>
          <div className="w-28">
            <label className={labelClasse}>Dias</label>
            <input
              type="number"
              min={1}
              className={campoClasse}
              value={diasLimite}
              onChange={(e) => setDiasLimite(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        {parados.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum cliente parado há mais de {diasLimite} dias.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {parados.map((c) => (
              <Link
                key={c.id}
                to={`/clientes/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{c.nome_estabelecimento}</span>
                <span className="text-gray-500">{diasDesde(c.atualizado_em)} dias</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-medium text-gray-900">Clientes sem comprar</h2>
          <div className="w-28">
            <label className={labelClasse}>Dias</label>
            <input
              type="number"
              min={1}
              className={campoClasse}
              value={diasLimiteRecompra}
              onChange={(e) => setDiasLimiteRecompra(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <p className="mb-3 text-xs text-gray-400">
          Clientes fechados que já compraram antes, mas não têm pedido registrado há mais de{' '}
          {diasLimiteRecompra} dias. Registre os pedidos na ficha do cliente para este alerta funcionar.
        </p>

        {semComprar.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum cliente fechado parado na recompra.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {semComprar.map(({ cliente, ultimaData }) => (
              <Link
                key={cliente.id}
                to={`/clientes/${cliente.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{cliente.nome_estabelecimento}</span>
                <span className="text-gray-500">{diasDesde(ultimaData)} dias sem pedido</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Cartao({ titulo, valor, legenda }: { titulo: string; valor: string; legenda?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-xl font-semibold text-marrom">{valor}</p>
      {legenda && <p className="text-xs text-gray-400">{legenda}</p>}
    </div>
  )
}
