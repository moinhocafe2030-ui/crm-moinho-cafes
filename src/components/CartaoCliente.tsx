import { useDraggable } from '@dnd-kit/core'
import { useNavigate } from 'react-router-dom'
import type { ClienteKanban } from '../types/cliente'

export function CartaoCliente({ cliente }: { cliente: ClienteKanban }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: cliente.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const valor = cliente.clientes_produto?.valor_potencial_mensal

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => navigate(`/clientes/${cliente.id}`)}
      className={`relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 pr-9 text-sm shadow-sm ${
        isDragging ? 'z-10 opacity-50' : ''
      }`}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        aria-label="Arrastar para mudar de etapa"
        className="absolute right-0.5 top-0.5 touch-none rounded p-2 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="3" cy="3" r="1.3" />
          <circle cx="7" cy="3" r="1.3" />
          <circle cx="11" cy="3" r="1.3" />
          <circle cx="3" cy="7" r="1.3" />
          <circle cx="7" cy="7" r="1.3" />
          <circle cx="11" cy="7" r="1.3" />
          <circle cx="3" cy="11" r="1.3" />
          <circle cx="7" cy="11" r="1.3" />
          <circle cx="11" cy="11" r="1.3" />
        </svg>
      </button>
      <p className="font-medium text-gray-900">{cliente.nome_estabelecimento}</p>
      <p className="text-gray-500">{cliente.nome_contato}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>{cliente.vendedores?.nome ?? 'Sem responsável'}</span>
        {valor != null && <span>R$ {valor}</span>}
      </div>
    </div>
  )
}
