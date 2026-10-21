import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obterFornecedor, salvarFornecedor } from '../lib/fornecedores'
import type { FornecedorFormValues } from '../lib/fornecedores'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

const VAZIO: FornecedorFormValues = {
  nome_produtor: '',
  nome_fazenda: '',
  regiao: '',
  endereco_completo: '',
  email: '',
  telefone: '',
  observacoes: '',
}

export function FornecedorForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [valores, setValores] = useState<FornecedorFormValues>(VAZIO)
  const [carregando, setCarregando] = useState(!!id)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    obterFornecedor(id)
      .then((f) =>
        setValores({
          nome_produtor: f.nome_produtor,
          nome_fazenda: f.nome_fazenda ?? '',
          regiao: f.regiao ?? '',
          endereco_completo: f.endereco_completo ?? '',
          email: f.email ?? '',
          telefone: f.telefone ?? '',
          observacoes: f.observacoes ?? '',
        }),
      )
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false))
  }, [id])

  async function handleSalvar() {
    if (!valores.nome_produtor.trim()) {
      setErro('Nome do produtor/cooperativa é obrigatório.')
      return
    }
    setSalvando(true)
    setErro(null)
    try {
      const fornecedorId = await salvarFornecedor(valores, id)
      navigate(`/fornecedores/${fornecedorId}`)
    } catch (e) {
      setErro((e as Error).message)
      setSalvando(false)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">
        {id ? 'Editar fornecedor' : 'Novo fornecedor'}
      </h1>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className={labelClasse}>Nome do produtor/cooperativa *</label>
          <input
            className={campoClasse}
            value={valores.nome_produtor}
            onChange={(e) => setValores({ ...valores, nome_produtor: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasse}>Nome da fazenda</label>
          <input
            className={campoClasse}
            value={valores.nome_fazenda}
            onChange={(e) => setValores({ ...valores, nome_fazenda: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasse}>Região/Município</label>
          <input
            className={campoClasse}
            value={valores.regiao}
            onChange={(e) => setValores({ ...valores, regiao: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasse}>Endereço completo da fazenda (opcional)</label>
          <input
            className={campoClasse}
            value={valores.endereco_completo}
            onChange={(e) => setValores({ ...valores, endereco_completo: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClasse}>Email (opcional)</label>
            <input
              type="email"
              className={campoClasse}
              value={valores.email}
              onChange={(e) => setValores({ ...valores, email: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClasse}>Celular (opcional)</label>
            <input
              className={campoClasse}
              value={valores.telefone}
              onChange={(e) => setValores({ ...valores, telefone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={labelClasse}>Observações</label>
          <textarea
            className={campoClasse}
            rows={3}
            value={valores.observacoes}
            onChange={(e) => setValores({ ...valores, observacoes: e.target.value })}
          />
        </div>

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={handleSalvar} disabled={salvando} className={botaoPrimarioClasse}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className={botaoSecundarioClasse}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
