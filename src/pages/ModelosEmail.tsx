import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listarModelosEmail,
  criarModeloEmail,
  atualizarModeloEmail,
  excluirModeloEmail,
} from '../lib/email'
import type { ModeloEmail } from '../types/cliente'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

const valoresIniciais = { nome: '', assunto: '', corpo: '' }

export function ModelosEmail() {
  const [modelos, setModelos] = useState<ModeloEmail[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [valores, setValores] = useState(valoresIniciais)
  const [salvando, setSalvando] = useState(false)
  const [criandoNovo, setCriandoNovo] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      setModelos(await listarModelosEmail())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function iniciarEdicao(modelo: ModeloEmail) {
    setEditandoId(modelo.id)
    setCriandoNovo(false)
    setValores({ nome: modelo.nome, assunto: modelo.assunto, corpo: modelo.corpo })
  }

  function iniciarNovo() {
    setCriandoNovo(true)
    setEditandoId(null)
    setValores(valoresIniciais)
  }

  function cancelar() {
    setEditandoId(null)
    setCriandoNovo(false)
    setValores(valoresIniciais)
  }

  async function salvar() {
    if (!valores.nome.trim() || !valores.assunto.trim() || !valores.corpo.trim()) return
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizarModeloEmail(editandoId, valores)
      } else {
        await criarModeloEmail(valores.nome.trim(), valores.assunto.trim(), valores.corpo.trim())
      }
      cancelar()
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este modelo de email?')) return
    try {
      await excluirModeloEmail(id)
      setModelos((ms) => ms.filter((m) => m.id !== id))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-marrom">Modelos de email</h1>
        <Link to="/configuracoes" className="text-sm text-gray-500 hover:text-marrom">
          Voltar
        </Link>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <p className="mb-4 text-sm text-gray-500">
        Use <code className="rounded bg-gray-100 px-1">{'{{nome_contato}}'}</code>,{' '}
        <code className="rounded bg-gray-100 px-1">{'{{nome_estabelecimento}}'}</code>,{' '}
        <code className="rounded bg-gray-100 px-1">{'{{cidade}}'}</code> e{' '}
        <code className="rounded bg-gray-100 px-1">{'{{responsavel}}'}</code> no assunto ou no corpo
        — eles são substituídos automaticamente na hora de enviar.
      </p>

      <div className="flex flex-col gap-2">
        {modelos.map((m) =>
          editandoId === m.id ? (
            <FormularioModelo
              key={m.id}
              valores={valores}
              setValores={setValores}
              onSalvar={salvar}
              onCancelar={cancelar}
              salvando={salvando}
            />
          ) : (
            <div key={m.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium text-gray-900">{m.nome}</p>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => iniciarEdicao(m)} className="text-gray-500 hover:text-marrom">
                    Editar
                  </button>
                  <button onClick={() => excluir(m.id)} className="text-gray-400 hover:text-red-600">
                    Excluir
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{m.assunto}</p>
            </div>
          ),
        )}
      </div>

      {criandoNovo ? (
        <div className="mt-4">
          <FormularioModelo
            valores={valores}
            setValores={setValores}
            onSalvar={salvar}
            onCancelar={cancelar}
            salvando={salvando}
          />
        </div>
      ) : (
        <button onClick={iniciarNovo} className={`${botaoSecundarioClasse} mt-4`}>
          + Novo modelo
        </button>
      )}
    </div>
  )
}

function FormularioModelo({
  valores,
  setValores,
  onSalvar,
  onCancelar,
  salvando,
}: {
  valores: { nome: string; assunto: string; corpo: string }
  setValores: (v: { nome: string; assunto: string; corpo: string }) => void
  onSalvar: () => void
  onCancelar: () => void
  salvando: boolean
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-2">
        <label className={labelClasse}>Nome do modelo</label>
        <input
          className={campoClasse}
          value={valores.nome}
          onChange={(e) => setValores({ ...valores, nome: e.target.value })}
          placeholder="Ex: Apresentação"
        />
      </div>
      <div className="mb-2">
        <label className={labelClasse}>Assunto</label>
        <input
          className={campoClasse}
          value={valores.assunto}
          onChange={(e) => setValores({ ...valores, assunto: e.target.value })}
          placeholder="Ex: Moinho Cafés — proposta para {{nome_estabelecimento}}"
        />
      </div>
      <div className="mb-3">
        <label className={labelClasse}>Corpo</label>
        <textarea
          className={campoClasse}
          rows={6}
          value={valores.corpo}
          onChange={(e) => setValores({ ...valores, corpo: e.target.value })}
          placeholder={`Olá {{nome_contato}},\n\n...`}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancelar} className={botaoSecundarioClasse}>
          Cancelar
        </button>
        <button onClick={onSalvar} disabled={salvando} className={botaoPrimarioClasse}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
