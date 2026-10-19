import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  listarEtapas,
  listarVendedores,
  listarTags,
  criarTag,
  salvarCliente,
  obterCliente,
} from '../lib/clientes'
import type { ClienteFormValues, EtapaFunil, Vendedor, Tag, TipoInteresse, ProdutoInteresse } from '../types/cliente'
import {
  TIPOS_ESTABELECIMENTO,
  TIPOS_INTERESSE,
  ORIGENS,
  PRODUTOS_INTERESSE,
  precisaDadosServico,
  precisaDadosProduto,
} from '../types/cliente'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

const valoresIniciais: ClienteFormValues = {
  nome_contato: '',
  nome_estabelecimento: '',
  tipo_estabelecimento: 'cafeteria',
  tipos_interesse: [],
  telefone: '',
  email: '',
  instagram: '',
  cidade: '',
  bairro: '',
  endereco: '',
  origem: '',
  etapa_id: '',
  responsavel_id: '',
  observacoes: '',
  tag_ids: [],
  servico: {
    volume_torra_kg: '',
    numero_avaliacoes_sensoriais: '',
    tipo_curso: '',
    numero_convidados: '',
  },
  produto: {
    volume_estimado_kg_mes: '',
    produtos_interesse: [],
    valor_potencial_mensal: '',
  },
}

export function ClienteForm() {
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const [etapas, setEtapas] = useState<EtapaFunil[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [novaTag, setNovaTag] = useState('')
  const [valores, setValores] = useState<ClienteFormValues>(valoresIniciais)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const [e, v, t] = await Promise.all([listarEtapas(), listarVendedores(), listarTags()])
        setEtapas(e)
        setVendedores(v)
        setTags(t)

        if (id) {
          const cliente = await obterCliente(id)
          setValores({
            nome_contato: cliente.nome_contato,
            nome_estabelecimento: cliente.nome_estabelecimento,
            tipo_estabelecimento: cliente.tipo_estabelecimento,
            tipos_interesse: cliente.tipos_interesse,
            telefone: cliente.telefone ?? '',
            email: cliente.email ?? '',
            instagram: cliente.instagram ?? '',
            cidade: cliente.cidade ?? '',
            bairro: cliente.bairro ?? '',
            endereco: cliente.endereco ?? '',
            origem: cliente.origem ?? '',
            etapa_id: cliente.etapa_id,
            responsavel_id: cliente.responsavel_id ?? '',
            observacoes: cliente.observacoes ?? '',
            tag_ids: cliente.clientes_tags.map((ct) => ct.tags.id),
            servico: {
              volume_torra_kg: cliente.clientes_servico?.volume_torra_kg?.toString() ?? '',
              numero_avaliacoes_sensoriais:
                cliente.clientes_servico?.numero_avaliacoes_sensoriais?.toString() ?? '',
              tipo_curso: cliente.clientes_servico?.tipo_curso ?? '',
              numero_convidados: cliente.clientes_servico?.numero_convidados?.toString() ?? '',
            },
            produto: {
              volume_estimado_kg_mes: cliente.clientes_produto?.volume_estimado_kg_mes?.toString() ?? '',
              produtos_interesse: cliente.clientes_produto?.produtos_interesse ?? [],
              valor_potencial_mensal: cliente.clientes_produto?.valor_potencial_mensal?.toString() ?? '',
            },
          })
        } else {
          setValores((v2) => ({ ...v2, etapa_id: e.find((et) => et.ordem === 1)?.id ?? e[0]?.id ?? '' }))
        }
      } catch (e) {
        setErro((e as Error).message)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [id])

  function alternarTipoInteresse(tipo: TipoInteresse) {
    setValores((v) => ({
      ...v,
      tipos_interesse: v.tipos_interesse.includes(tipo)
        ? v.tipos_interesse.filter((t) => t !== tipo)
        : [...v.tipos_interesse, tipo],
    }))
  }

  function alternarProdutoInteresse(produto: ProdutoInteresse) {
    setValores((v) => ({
      ...v,
      produto: {
        ...v.produto,
        produtos_interesse: v.produto.produtos_interesse.includes(produto)
          ? v.produto.produtos_interesse.filter((p) => p !== produto)
          : [...v.produto.produtos_interesse, produto],
      },
    }))
  }

  function alternarTag(tagId: string) {
    setValores((v) => ({
      ...v,
      tag_ids: v.tag_ids.includes(tagId) ? v.tag_ids.filter((t) => t !== tagId) : [...v.tag_ids, tagId],
    }))
  }

  async function adicionarTag() {
    const nome = novaTag.trim()
    if (!nome) return
    try {
      const tag = await criarTag(nome)
      setTags((t) => [...t, tag].sort((a, b) => a.nome.localeCompare(b.nome)))
      setValores((v) => ({ ...v, tag_ids: [...v.tag_ids, tag.id] }))
      setNovaTag('')
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const novoId = await salvarCliente(valores, id)
      navigate(`/clientes/${novoId}`)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>

  const mostrarServico = precisaDadosServico(valores.tipos_interesse)
  const mostrarProduto = precisaDadosProduto(valores.tipos_interesse)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">
        {editando ? 'Editar cliente' : 'Novo cliente'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Dados principais</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasse}>Nome do contato *</label>
              <input
                required
                className={campoClasse}
                value={valores.nome_contato}
                onChange={(e) => setValores({ ...valores, nome_contato: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Nome do estabelecimento *</label>
              <input
                required
                className={campoClasse}
                value={valores.nome_estabelecimento}
                onChange={(e) => setValores({ ...valores, nome_estabelecimento: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Tipo de estabelecimento</label>
              <select
                className={campoClasse}
                value={valores.tipo_estabelecimento}
                onChange={(e) =>
                  setValores({ ...valores, tipo_estabelecimento: e.target.value as never })
                }
              >
                {TIPOS_ESTABELECIMENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Origem do contato</label>
              <select
                className={campoClasse}
                value={valores.origem}
                onChange={(e) => setValores({ ...valores, origem: e.target.value as never })}
              >
                <option value="">Selecione</option>
                {ORIGENS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Etapa do funil</label>
              <select
                className={campoClasse}
                value={valores.etapa_id}
                onChange={(e) => setValores({ ...valores, etapa_id: e.target.value })}
              >
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Responsável</label>
              <select
                className={campoClasse}
                value={valores.responsavel_id}
                onChange={(e) => setValores({ ...valores, responsavel_id: e.target.value })}
              >
                <option value="">Sem responsável</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClasse}>Portfólio</label>
            <div className="flex flex-wrap gap-3">
              {TIPOS_INTERESSE.map((t) => (
                <label key={t.value} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={valores.tipos_interesse.includes(t.value)}
                    onChange={() => alternarTipoInteresse(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Contato e localização</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasse}>Telefone/WhatsApp</label>
              <input
                className={campoClasse}
                value={valores.telefone}
                onChange={(e) => setValores({ ...valores, telefone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Email</label>
              <input
                type="email"
                className={campoClasse}
                value={valores.email}
                onChange={(e) => setValores({ ...valores, email: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Instagram</label>
              <input
                className={campoClasse}
                value={valores.instagram}
                onChange={(e) => setValores({ ...valores, instagram: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Cidade</label>
              <input
                className={campoClasse}
                value={valores.cidade}
                onChange={(e) => setValores({ ...valores, cidade: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Bairro</label>
              <input
                className={campoClasse}
                value={valores.bairro}
                onChange={(e) => setValores({ ...valores, bairro: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasse}>Endereço</label>
              <input
                className={campoClasse}
                value={valores.endereco}
                onChange={(e) => setValores({ ...valores, endereco: e.target.value })}
              />
            </div>
          </div>
        </section>

        {mostrarServico && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium text-gray-900">Dados de serviço</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClasse}>Volume de torra (kg)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={valores.servico.volume_torra_kg}
                  onChange={(e) =>
                    setValores({ ...valores, servico: { ...valores.servico, volume_torra_kg: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className={labelClasse}>Nº de avaliações sensoriais</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={valores.servico.numero_avaliacoes_sensoriais}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      servico: { ...valores.servico, numero_avaliacoes_sensoriais: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClasse}>Tipo de curso</label>
                <input
                  className={campoClasse}
                  value={valores.servico.tipo_curso}
                  onChange={(e) =>
                    setValores({ ...valores, servico: { ...valores.servico, tipo_curso: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className={labelClasse}>Nº de convidados (evento)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={valores.servico.numero_convidados}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      servico: { ...valores.servico, numero_convidados: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </section>
        )}

        {mostrarProduto && (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium text-gray-900">Dados de produto</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClasse}>Volume estimado (kg/mês)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={valores.produto.volume_estimado_kg_mes}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      produto: { ...valores.produto, volume_estimado_kg_mes: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className={labelClasse}>Valor potencial mensal (R$)</label>
                <input
                  type="number"
                  className={campoClasse}
                  value={valores.produto.valor_potencial_mensal}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      produto: { ...valores.produto, valor_potencial_mensal: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelClasse}>Produtos de interesse</label>
              <div className="flex flex-wrap gap-3">
                {PRODUTOS_INTERESSE.map((p) => (
                  <label key={p.value} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={valores.produto.produtos_interesse.includes(p.value)}
                      onChange={() => alternarProdutoInteresse(p.value)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Tags e observações</h2>
          <div className="mb-3 flex flex-wrap gap-3">
            {tags.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={valores.tag_ids.includes(t.id)}
                  onChange={() => alternarTag(t.id)}
                />
                {t.nome}
              </label>
            ))}
          </div>
          <div className="mb-4 flex gap-2">
            <input
              className={campoClasse}
              placeholder="Nova tag"
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
            />
            <button type="button" className={botaoSecundarioClasse} onClick={adicionarTag}>
              Adicionar tag
            </button>
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
        </section>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className={botaoSecundarioClasse} onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className={botaoPrimarioClasse}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
