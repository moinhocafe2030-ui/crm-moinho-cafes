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
      {...listeners}
      {...attributes}
      onClick={() => navigate(`/clientes/${cliente.id}`)}
      className={`cursor-grab touch-none rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing ${
        isDragging ? 'z-10 opacity-50' : ''
      }`}
    >
      <p className="font-medium text-gray-900">{cliente.nome_estabelecimento}</p>
      <p className="text-gray-500">{cliente.nome_contato}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
        <span>{cliente.vendedores?.nome ?? 'Sem responsável'}</span>
        {valor != null && <span>R$ {valor}</span>}
      </div>
    </div>
  )
}
