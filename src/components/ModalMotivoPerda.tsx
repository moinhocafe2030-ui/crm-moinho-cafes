import { useState } from 'react'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

export function ModalMotivoPerda({
  nomeCliente,
  onConfirmar,
  onCancelar,
}: {
  nomeCliente: string
  onConfirmar: (motivo: string) => void
  onCancelar: () => void
}) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h2 className="mb-1 font-semibold text-gray-900">Motivo da perda</h2>
        <p className="mb-3 text-sm text-gray-500">
          Marcando <strong>{nomeCliente}</strong> como perdido. Por que esse cliente não fechou?
        </p>
        <label className={labelClasse}>Motivo (opcional)</label>
        <textarea
          autoFocus
          className={campoClasse}
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ex: preço, já tem fornecedor, sem interesse no momento..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className={botaoSecundarioClasse} onClick={onCancelar}>
            Cancelar
          </button>
          <button className={botaoPrimarioClasse} onClick={() => onConfirmar(motivo)}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
