import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarRetornosHoje, marcarProximoPassoConcluido } from '../lib/proximosPassos'
import { dataHojeISO, formatarDataSimples } from '../lib/data'
import type { RetornoHoje } from '../types/cliente'

export function Hoje() {
  const [retornos, setRetornos] = useState<RetornoHoje[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try {
      setRetornos(await listarRetornosHoje())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function concluir(id: string) {
    setRetornos((rs) => rs.filter((r) => r.id !== id))
    try {
      await marcarProximoPassoConcluido(id, true)
    } catch (e) {
      setErro((e as Error).message)
      carregar()
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  const hoje = dataHojeISO()
  const atrasados = retornos.filter((r) => r.data_retorno < hoje)
  const deHoje = retornos.filter((r) => r.data_retorno === hoje)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">Hoje</h1>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      {retornos.length === 0 && (
        <p className="text-gray-500">Nenhum retorno pendente para hoje. 🎉</p>
      )}

      {atrasados.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-red-700">Atrasados</h2>
          <div className="flex flex-col gap-2">
            {atrasados.map((r) => (
              <ItemRetorno key={r.id} retorno={r} onConcluir={concluir} atrasado />
            ))}
          </div>
        </div>
      )}

      {deHoje.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-700">Hoje</h2>
          <div className="flex flex-col gap-2">
            {deHoje.map((r) => (
              <ItemRetorno key={r.id} retorno={r} onConcluir={concluir} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRetorno({
  retorno,
  onConcluir,
  atrasado,
}: {
  retorno: RetornoHoje
  onConcluir: (id: string) => void
  atrasado?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <Link to={`/clientes/${retorno.cliente_id}`} className="font-medium text-gray-900 hover:text-marrom">
          {retorno.clientes?.nome_estabelecimento ?? 'Cliente'}
        </Link>
        <p className="truncate text-sm text-gray-500">{retorno.descricao}</p>
        {atrasado && (
          <p className="text-xs text-red-600">Desde {formatarDataSimples(retorno.data_retorno)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onConcluir(retorno.id)}
        className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Concluir
      </button>
    </div>
  )
}
