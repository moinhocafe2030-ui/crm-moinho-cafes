import { useEffect, useMemo, useState } from 'react'
import { listarPedidosComCliente } from '../lib/pedidos'
import type { PedidoComCliente } from '../types/cliente'
import { formatarMoeda, dataHojeISO } from '../lib/data'
import { campoClasse, labelClasse } from '../lib/estilos'

function primeiroDiaDoMesISO(): string {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toLocaleDateString('sv-SE')
}

function mesAnoChave(dataISO: string): string {
  return dataISO.slice(0, 7) // "2026-10"
}

function mesAnoRotulo(chave: string): string {
  const [ano, mes] = chave.split('-')
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`
}

interface Totais {
  valor: number
  volume: number
  pedidos: number
}

function somarPorChave(
  pedidos: PedidoComCliente[],
  chaveFn: (p: PedidoComCliente) => string,
): Map<string, Totais> {
  const mapa = new Map<string, Totais>()
  for (const p of pedidos) {
    const chave = chaveFn(p)
    const atual = mapa.get(chave) ?? { valor: 0, volume: 0, pedidos: 0 }
    atual.valor += p.valor ?? 0
    atual.volume += p.quantidade_kg ?? 0
    atual.pedidos += 1
    mapa.set(chave, atual)
  }
  return mapa
}

export function Vendas() {
  const [pedidos, setPedidos] = useState<PedidoComCliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMesISO())
  const [dataFim, setDataFim] = useState(dataHojeISO())

  useEffect(() => {
    listarPedidosComCliente()
      .then(setPedidos)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  const noPeriodo = useMemo(
    () => pedidos.filter((p) => p.data_pedido >= dataInicio && p.data_pedido <= dataFim),
    [pedidos, dataInicio, dataFim],
  )

  const totalValor = noPeriodo.reduce((soma, p) => soma + (p.valor ?? 0), 0)
  const totalVolume = noPeriodo.reduce((soma, p) => soma + (p.quantidade_kg ?? 0), 0)
  const ticketMedio = noPeriodo.length > 0 ? totalValor / noPeriodo.length : null

  const porMes = useMemo(() => {
    const hoje = new Date()
    const chaves: string[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      chaves.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const mapa = somarPorChave(pedidos, (p) => mesAnoChave(p.data_pedido))
    return chaves.map((chave) => ({ chave, ...(mapa.get(chave) ?? { valor: 0, volume: 0, pedidos: 0 }) }))
  }, [pedidos])

  const porCliente = useMemo(() => {
    const mapa = somarPorChave(noPeriodo, (p) => p.cliente_id)
    const nomes = new Map(noPeriodo.map((p) => [p.cliente_id, p.clientes?.nome_estabelecimento ?? '—']))
    return Array.from(mapa, ([cliente_id, totais]) => ({ nome: nomes.get(cliente_id)!, ...totais }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
  }, [noPeriodo])

  const porProduto = useMemo(() => {
    const mapa = somarPorChave(noPeriodo, (p) => p.produto?.trim() || 'Sem produto informado')
    return Array.from(mapa, ([produto, totais]) => ({ produto, ...totais })).sort(
      (a, b) => b.valor - a.valor,
    )
  }, [noPeriodo])

  const maiorValorMes = Math.max(1, ...porMes.map((m) => m.valor))
  const maiorValorCliente = Math.max(1, ...porCliente.map((c) => c.valor))
  const maiorValorProduto = Math.max(1, ...porProduto.map((p) => p.valor))

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">Vendas</h1>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <section className="mb-4 flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div>
          <label className={labelClasse}>De</label>
          <input
            type="date"
            className={campoClasse}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClasse}>Até</label>
          <input
            type="date"
            className={campoClasse}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Cartao titulo="Vendido no período" valor={formatarMoeda(totalValor)} />
        <Cartao titulo="Volume no período" valor={`${totalVolume.toLocaleString('pt-BR')} kg`} />
        <Cartao titulo="Pedidos no período" valor={String(noPeriodo.length)} />
        <Cartao titulo="Ticket médio" valor={ticketMedio != null ? formatarMoeda(ticketMedio) : '—'} />
      </div>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Faturamento por mês (últimos 12 meses)</h2>
        <div className="flex flex-col gap-2">
          {porMes.map((m) => (
            <div key={m.chave} className="flex items-center gap-2 text-sm">
              <span className="w-12 shrink-0 text-gray-700">{mesAnoRotulo(m.chave)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-marrom"
                  style={{ width: `${(m.valor / maiorValorMes) * 100}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-gray-500">{formatarMoeda(m.valor)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Top clientes no período</h2>
        {porCliente.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum pedido registrado neste período.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {porCliente.map((c) => (
              <div key={c.nome} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 truncate text-gray-700">{c.nome}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-marrom-claro"
                    style={{ width: `${(c.valor / maiorValorCliente) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-gray-500">{formatarMoeda(c.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Vendas por produto no período</h2>
        {porProduto.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum pedido registrado neste período.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {porProduto.map((p) => (
              <div key={p.produto} className="flex items-center gap-2 text-sm">
                <span className="w-28 shrink-0 truncate text-gray-700">{p.produto}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-marrom"
                    style={{ width: `${(p.valor / maiorValorProduto) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-gray-500">{formatarMoeda(p.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Cartao({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-xl font-semibold text-marrom">{valor}</p>
    </div>
  )
}
