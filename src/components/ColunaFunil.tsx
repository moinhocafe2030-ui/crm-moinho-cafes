import { useDroppable } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { EtapaFunil } from '../types/cliente'

export function ColunaFunil({ etapa, children }: { etapa: EtapaFunil; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-xl bg-white shadow-sm transition ${
        isOver ? 'ring-2 ring-marrom' : ''
      }`}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 p-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: etapa.cor }} />
        <h2 className="text-sm font-medium text-gray-900">{etapa.nome}</h2>
      </div>
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">{children}</div>
    </div>
  )
}
