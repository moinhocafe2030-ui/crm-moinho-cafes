import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { listarEtapas, marcarPerdido } from '../lib/clientes'
import { listarClientesParaFunil, moverClienteEtapa } from '../lib/etapas'
import type { ClienteKanban, EtapaFunil } from '../types/cliente'
import { ColunaFunil } from '../components/ColunaFunil'
import { CartaoCliente } from '../components/CartaoCliente'
import { ModalMotivoPerda } from '../components/ModalMotivoPerda'

export function Funil() {
  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [clientes, setClientes] = useState<ClienteKanban[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pendentePerda, setPendentePerda] = useState<{ clienteId: string; etapaId: string } | null>(
    null,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => {
    Promise.all([listarEtapas(), listarClientesParaFunil()])
      .then(([e, c]) => {
        setEtapas(e)
        setClientes(c)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const clienteId = String(active.id)
    const novaEtapaId = String(over.id)
    const cliente = clientes.find((c) => c.id === clienteId)
    if (!cliente || cliente.etapa_id === novaEtapaId) return

    const etapaDestino = etapas.find((e) => e.id === novaEtapaId)
    if (!etapaDestino) return

    if (etapaDestino.encerra_perda) {
      setPendentePerda({ clienteId, etapaId: novaEtapaId })
      return
    }

    const anterior = cliente.etapa_id
    setClientes((cs) => cs.map((c) => (c.id === clienteId ? { ...c, etapa_id: novaEtapaId } : c)))
    try {
      await moverClienteEtapa(clienteId, novaEtapaId)
    } catch (e) {
      setErro((e as Error).message)
      setClientes((cs) => cs.map((c) => (c.id === clienteId ? { ...c, etapa_id: anterior } : c)))
    }
  }

  async function confirmarPerda(motivo: string) {
    if (!pendentePerda) return
    const { clienteId, etapaId } = pendentePerda
    try {
      await marcarPerdido(clienteId, etapaId, motivo)
      setClientes((cs) => cs.map((c) => (c.id === clienteId ? { ...c, etapa_id: etapaId } : c)))
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setPendentePerda(null)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  const clienteDaPerdaPendente = pendentePerda
    ? clientes.find((c) => c.id === pendentePerda.clienteId)
    : null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-marrom">Funil</h1>
        <Link to="/funil/etapas" className="text-sm text-gray-500 hover:text-marrom">
          Editar etapas
        </Link>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {etapas.map((etapa) => (
            <ColunaFunil key={etapa.id} etapa={etapa}>
              {clientes
                .filter((c) => c.etapa_id === etapa.id)
                .map((cliente) => (
                  <CartaoCliente key={cliente.id} cliente={cliente} />
                ))}
            </ColunaFunil>
          ))}
        </div>
      </DndContext>

      {clienteDaPerdaPendente && (
        <ModalMotivoPerda
          nomeCliente={clienteDaPerdaPendente.nome_estabelecimento}
          onConfirmar={confirmarPerda}
          onCancelar={() => setPendentePerda(null)}
        />
      )}
    </div>
  )
}
