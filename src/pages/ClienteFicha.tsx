import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obterCliente, excluirCliente, listarAmostras, criarAmostra } from '../lib/clientes'
import { listarInteracoes, criarInteracao } from '../lib/interacoes'
import {
  listarProximosPassos,
  criarProximoPasso,
  marcarProximoPassoConcluido,
} from '../lib/proximosPassos'
import { listarModelosEmail, enviarEmail, preencherModelo } from '../lib/email'
import { listarPedidos, criarPedido } from '../lib/pedidos'
import { listarPrecos, criarPreco, excluirPreco } from '../lib/precos'
import { listarAnexos, enviarAnexo, obterUrlAnexo, excluirAnexo } from '../lib/anexos'
import type {
  ClienteCompleto,
  Amostra,
  Interacao,
  ProximoPasso,
  TipoInteracao,
  ModeloEmail,
  Pedido,
  PrecoNegociado,
  AnexoCliente,
} from '../types/cliente'
import {
  TIPOS_ESTABELECIMENTO,
  TIPOS_INTERESSE,
  ORIGENS,
  PRODUTOS_INTERESSE,
  TIPOS_INTERACAO,
} from '../types/cliente'
import { formatarDataSimples, formatarDataHora, dataHojeISO } from '../lib/data'
import { campoClasse, labelClasse, botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'

function rotulo(lista: { value: string; label: string }[], valor: string | null) {
  return lista.find((i) => i.value === valor)?.label ?? valor ?? '—'
}

export function ClienteFicha() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<ClienteCompleto | null>(null)
  const [amostras, setAmostras] = useState<Amostra[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const [novaAmostraData, setNovaAmostraData] = useState(dataHojeISO())
  const [novaAmostraFeedback, setNovaAmostraFeedback] = useState('')
  const [novaAmostraFollowUp, setNovaAmostraFollowUp] = useState(true)
  const [salvandoAmostra, setSalvandoAmostra] = useState(false)

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [novoPedidoData, setNovoPedidoData] = useState(dataHojeISO())
  const [novoPedidoProduto, setNovoPedidoProduto] = useState('')
  const [novoPedidoValor, setNovoPedidoValor] = useState('')
  const [novoPedidoObservacao, setNovoPedidoObservacao] = useState('')
  const [salvandoPedido, setSalvandoPedido] = useState(false)

  const [precos, setPrecos] = useState<PrecoNegociado[]>([])
  const [novoPrecoProduto, setNovoPrecoProduto] = useState('')
  const [novoPrecoValor, setNovoPrecoValor] = useState('')
  const [novoPrecoObservacao, setNovoPrecoObservacao] = useState('')
  const [salvandoPreco, setSalvandoPreco] = useState(false)

  const [anexos, setAnexos] = useState<AnexoCliente[]>([])
  const [enviandoAnexo, setEnviandoAnexo] = useState(false)

  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [novoTipoInteracao, setNovoTipoInteracao] = useState<TipoInteracao>('ligacao')
  const [novaDescricaoInteracao, setNovaDescricaoInteracao] = useState('')
  const [salvandoInteracao, setSalvandoInteracao] = useState(false)

  const [proximosPassos, setProximosPassos] = useState<ProximoPasso[]>([])
  const [novoPassoDescricao, setNovoPassoDescricao] = useState('')
  const [novoPassoData, setNovoPassoData] = useState(dataHojeISO())
  const [novoPassoHorario, setNovoPassoHorario] = useState('')
  const [salvandoPasso, setSalvandoPasso] = useState(false)

  const [modelosEmail, setModelosEmail] = useState<ModeloEmail[]>([])
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState('')
  const [assuntoEmail, setAssuntoEmail] = useState('')
  const [corpoEmail, setCorpoEmail] = useState('')
  const [enviandoEmail, setEnviandoEmail] = useState(false)
  const [mensagemEmail, setMensagemEmail] = useState<string | null>(null)

  async function carregar() {
    if (!id) return
    setCarregando(true)
    try {
      const [c, a, i, p, ped, prc, anx] = await Promise.all([
        obterCliente(id),
        listarAmostras(id),
        listarInteracoes(id),
        listarProximosPassos(id),
        listarPedidos(id),
        listarPrecos(id),
        listarAnexos(id),
      ])
      setCliente(c)
      setAmostras(a)
      setInteracoes(i)
      setProximosPassos(p)
      setPedidos(ped)
      setPrecos(prc)
      setAnexos(anx)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    listarModelosEmail()
      .then(setModelosEmail)
      .catch((e) => setErro((e as Error).message))
  }, [])

  async function handleExcluir() {
    if (!id) return
    if (!confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    try {
      await excluirCliente(id)
      navigate('/clientes')
    } catch (e) {
      setErro((e as Error).message)
      setExcluindo(false)
    }
  }

  async function handleAdicionarAmostra() {
    if (!id) return
    setSalvandoAmostra(true)
    try {
      await criarAmostra(id, novaAmostraData || null, novaAmostraFeedback || null, novaAmostraFollowUp)
      setNovaAmostraFeedback('')
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoAmostra(false)
    }
  }

  async function handleAdicionarPedido() {
    if (!id || !novoPedidoData) return
    setSalvandoPedido(true)
    try {
      await criarPedido(
        id,
        novoPedidoData,
        novoPedidoProduto || null,
        novoPedidoValor.trim() === '' ? null : Number(novoPedidoValor),
        novoPedidoObservacao || null,
      )
      setNovoPedidoProduto('')
      setNovoPedidoValor('')
      setNovoPedidoObservacao('')
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoPedido(false)
    }
  }

  async function handleAdicionarPreco() {
    if (!id || !novoPrecoProduto.trim() || novoPrecoValor.trim() === '') return
    setSalvandoPreco(true)
    try {
      await criarPreco(id, novoPrecoProduto.trim(), Number(novoPrecoValor), novoPrecoObservacao || null)
      setNovoPrecoProduto('')
      setNovoPrecoValor('')
      setNovoPrecoObservacao('')
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoPreco(false)
    }
  }

  async function handleExcluirPreco(precoId: string) {
    try {
      await excluirPreco(precoId)
      setPrecos((ps) => ps.filter((p) => p.id !== precoId))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleEnviarAnexo(arquivo: File | undefined) {
    if (!id || !arquivo) return
    setEnviandoAnexo(true)
    try {
      await enviarAnexo(id, arquivo)
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviandoAnexo(false)
    }
  }

  async function handleAbrirAnexo(anexo: AnexoCliente) {
    try {
      const url = await obterUrlAnexo(anexo.caminho)
      window.open(url, '_blank')
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleExcluirAnexo(anexo: AnexoCliente) {
    if (!confirm('Excluir este anexo?')) return
    try {
      await excluirAnexo(anexo)
      setAnexos((as) => as.filter((a) => a.id !== anexo.id))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  async function handleAdicionarInteracao() {
    if (!id || !novaDescricaoInteracao.trim()) return
    setSalvandoInteracao(true)
    try {
      await criarInteracao(id, novoTipoInteracao, novaDescricaoInteracao.trim())
      setNovaDescricaoInteracao('')
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoInteracao(false)
    }
  }

  async function handleAdicionarPasso() {
    if (!id || !novoPassoDescricao.trim() || !novoPassoData) return
    setSalvandoPasso(true)
    try {
      await criarProximoPasso(id, novoPassoDescricao.trim(), novoPassoData, novoPassoHorario || null)
      setNovoPassoDescricao('')
      setNovoPassoHorario('')
      await carregar()
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvandoPasso(false)
    }
  }

  async function handleAlternarPasso(passo: ProximoPasso) {
    setProximosPassos((ps) =>
      ps.map((p) => (p.id === passo.id ? { ...p, concluido: !p.concluido } : p)),
    )
    try {
      await marcarProximoPassoConcluido(passo.id, !passo.concluido)
    } catch (e) {
      setErro((e as Error).message)
      setProximosPassos((ps) =>
        ps.map((p) => (p.id === passo.id ? { ...p, concluido: passo.concluido } : p)),
      )
    }
  }

  function aplicarModelo(modeloId: string) {
    setModeloSelecionadoId(modeloId)
    if (!cliente) return
    const modelo = modelosEmail.find((m) => m.id === modeloId)
    if (!modelo) {
      setAssuntoEmail('')
      setCorpoEmail('')
      return
    }
    const dadosCliente = {
      nome_contato: cliente.nome_contato,
      nome_estabelecimento: cliente.nome_estabelecimento,
      cidade: cliente.cidade,
      responsavel: cliente.vendedores?.nome ?? null,
    }
    setAssuntoEmail(preencherModelo(modelo.assunto, dadosCliente))
    setCorpoEmail(preencherModelo(modelo.corpo, dadosCliente))
  }

  const MOTIVOS_ENVIO: Record<string, string> = {
    cliente_sem_email: 'Este cliente não tem email cadastrado. Edite a ficha para adicionar um.',
    nao_conectado: 'Conecte sua conta do Google em Configurações antes de enviar.',
    erro_gmail: 'O Gmail recusou o envio. Tente novamente em instantes.',
  }

  async function handleEnviarEmail() {
    if (!id || !assuntoEmail.trim() || !corpoEmail.trim()) return
    setEnviandoEmail(true)
    setMensagemEmail(null)
    try {
      const resultado = await enviarEmail(
        id,
        assuntoEmail.trim(),
        corpoEmail.trim(),
        modeloSelecionadoId || null,
      )
      if (resultado.enviado) {
        setMensagemEmail('Email enviado com sucesso!')
        setAssuntoEmail('')
        setCorpoEmail('')
        setModeloSelecionadoId('')
        await carregar()
      } else {
        setMensagemEmail(MOTIVOS_ENVIO[resultado.motivo ?? ''] ?? 'Não foi possível enviar o email.')
      }
    } catch (e) {
      setMensagemEmail((e as Error).message)
    } finally {
      setEnviandoEmail(false)
    }
  }

  if (carregando) return <p className="text-gray-500">Carregando...</p>
  if (erro && !cliente) return <p className="text-sm text-red-600">{erro}</p>
  if (!cliente) return null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-marrom">{cliente.nome_estabelecimento}</h1>
          <p className="text-sm text-gray-500">{cliente.nome_contato}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: cliente.etapas_funil?.cor ?? '#6b4a33' }}
        >
          {cliente.etapas_funil?.nome}
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        <Link to={`/clientes/${cliente.id}/editar`} className={botaoSecundarioClasse}>
          Editar
        </Link>
        <button onClick={handleExcluir} disabled={excluindo} className={botaoSecundarioClasse}>
          {excluindo ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>

      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Dados principais</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Campo rotulo="Tipo" valor={rotulo(TIPOS_ESTABELECIMENTO, cliente.tipo_estabelecimento)} />
          <Campo rotulo="Origem" valor={rotulo(ORIGENS, cliente.origem)} />
          <Campo rotulo="Responsável" valor={cliente.vendedores?.nome ?? '—'} />
          <Campo
            rotulo="Interesses"
            valor={
              cliente.tipos_interesse.length
                ? cliente.tipos_interesse.map((t) => rotulo(TIPOS_INTERESSE, t)).join(', ')
                : '—'
            }
          />
        </dl>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Contato e localização</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Campo rotulo="Telefone/WhatsApp" valor={cliente.telefone ?? '—'} />
          <Campo rotulo="Email" valor={cliente.email ?? '—'} />
          <Campo rotulo="Instagram" valor={cliente.instagram ?? '—'} />
          <Campo rotulo="Cidade" valor={cliente.cidade ?? '—'} />
          <Campo rotulo="Bairro" valor={cliente.bairro ?? '—'} />
          <Campo rotulo="Endereço" valor={cliente.endereco ?? '—'} />
        </dl>
      </section>

      {cliente.clientes_servico && (
        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Dados de serviço</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Campo rotulo="Volume de torra (kg)" valor={cliente.clientes_servico.volume_torra_kg ?? '—'} />
            <Campo
              rotulo="Nº avaliações sensoriais"
              valor={cliente.clientes_servico.numero_avaliacoes_sensoriais ?? '—'}
            />
            <Campo rotulo="Tipo de curso" valor={cliente.clientes_servico.tipo_curso ?? '—'} />
            <Campo rotulo="Nº convidados" valor={cliente.clientes_servico.numero_convidados ?? '—'} />
          </dl>
        </section>
      )}

      {cliente.clientes_produto && (
        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Dados de produto</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Campo
              rotulo="Volume estimado (kg/mês)"
              valor={cliente.clientes_produto.volume_estimado_kg_mes ?? '—'}
            />
            <Campo
              rotulo="Valor potencial mensal"
              valor={
                cliente.clientes_produto.valor_potencial_mensal != null
                  ? `R$ ${cliente.clientes_produto.valor_potencial_mensal}`
                  : '—'
              }
            />
            <Campo
              rotulo="Produtos de interesse"
              valor={
                cliente.clientes_produto.produtos_interesse
                  .map((p) => rotulo(PRODUTOS_INTERESSE, p))
                  .join(', ') || '—'
              }
            />
          </dl>
        </section>
      )}

      {cliente.clientes_tags.length > 0 && (
        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {cliente.clientes_tags.map((ct) => (
              <span key={ct.tags.id} className="rounded-full bg-creme px-3 py-1 text-xs text-marrom">
                {ct.tags.nome}
              </span>
            ))}
          </div>
        </section>
      )}

      {cliente.observacoes && (
        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-gray-900">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{cliente.observacoes}</p>
        </section>
      )}

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Amostras</h2>

        {amostras.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhuma amostra registrada.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {amostras.map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-medium text-gray-900">Enviada em {formatarDataSimples(a.data_envio)}</p>
                {a.feedback && <p className="text-gray-600">{a.feedback}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelClasse}>Data de envio</label>
            <input
              type="date"
              className={campoClasse}
              value={novaAmostraData}
              onChange={(e) => setNovaAmostraData(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={labelClasse}>Feedback</label>
            <input
              className={campoClasse}
              value={novaAmostraFeedback}
              onChange={(e) => setNovaAmostraFeedback(e.target.value)}
              placeholder="Opcional, pode preencher depois"
            />
          </div>
          <button
            type="button"
            onClick={handleAdicionarAmostra}
            disabled={salvandoAmostra}
            className={botaoPrimarioClasse}
          >
            {salvandoAmostra ? 'Salvando...' : 'Registrar amostra'}
          </button>
        </div>
        <label className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={novaAmostraFollowUp}
            onChange={(e) => setNovaAmostraFollowUp(e.target.checked)}
          />
          Criar lembrete automático para cobrar feedback em 7 dias
        </label>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Histórico de pedidos</h2>

        {pedidos.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhum pedido registrado ainda.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {pedidos.map((p) => (
              <li key={p.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-medium text-gray-900">
                  {formatarDataSimples(p.data_pedido)}
                  {p.valor != null && ` · R$ ${p.valor}`}
                  {p.produto && ` · ${p.produto}`}
                </p>
                {p.observacao && <p className="text-gray-600">{p.observacao}</p>}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelClasse}>Data do pedido</label>
            <input
              type="date"
              className={campoClasse}
              value={novoPedidoData}
              onChange={(e) => setNovoPedidoData(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClasse}>Produto</label>
            <input
              className={campoClasse}
              value={novoPedidoProduto}
              onChange={(e) => setNovoPedidoProduto(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className={labelClasse}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className={campoClasse}
              value={novoPedidoValor}
              onChange={(e) => setNovoPedidoValor(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={labelClasse}>Observação</label>
            <input
              className={campoClasse}
              value={novoPedidoObservacao}
              onChange={(e) => setNovoPedidoObservacao(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <button
            type="button"
            onClick={handleAdicionarPedido}
            disabled={salvandoPedido}
            className={botaoPrimarioClasse}
          >
            {salvandoPedido ? 'Salvando...' : 'Registrar pedido'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Registrar os pedidos aqui alimenta o alerta de "Clientes sem comprar" no Painel.
        </p>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Preços negociados</h2>

        {precos.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhum preço negociado registrado.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {precos.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {p.produto} · R$ {p.preco}
                  </p>
                  {p.observacao && <p className="text-gray-600">{p.observacao}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleExcluirPreco(p.id)}
                  className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className={labelClasse}>Produto</label>
            <input
              className={campoClasse}
              value={novoPrecoProduto}
              onChange={(e) => setNovoPrecoProduto(e.target.value)}
              placeholder="Ex: Café grão 1kg"
            />
          </div>
          <div>
            <label className={labelClasse}>Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              className={campoClasse}
              value={novoPrecoValor}
              onChange={(e) => setNovoPrecoValor(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={labelClasse}>Observação</label>
            <input
              className={campoClasse}
              value={novoPrecoObservacao}
              onChange={(e) => setNovoPrecoObservacao(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <button
            type="button"
            onClick={handleAdicionarPreco}
            disabled={salvandoPreco}
            className={botaoPrimarioClasse}
          >
            {salvandoPreco ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Anexos</h2>

        {anexos.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhum arquivo anexado.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {anexos.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm"
              >
                <button
                  type="button"
                  onClick={() => handleAbrirAnexo(a)}
                  className="truncate text-left font-medium text-marrom underline"
                >
                  {a.nome_arquivo}
                </button>
                <button
                  type="button"
                  onClick={() => handleExcluirAnexo(a)}
                  className="shrink-0 text-xs text-gray-400 hover:text-red-600"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          type="file"
          onChange={(e) => handleEnviarAnexo(e.target.files?.[0])}
          disabled={enviandoAnexo}
          className="text-sm"
        />
        {enviandoAnexo && <p className="mt-1 text-xs text-gray-500">Enviando...</p>}
        <p className="mt-2 text-xs text-gray-400">
          Fotos, propostas em PDF ou qualquer arquivo relacionado a este cliente.
        </p>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Próximo passo</h2>

        {proximosPassos.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhum próximo passo registrado.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {proximosPassos.map((p) => {
              const atrasado = !p.concluido && p.data_retorno < dataHojeISO()
              return (
                <li
                  key={p.id}
                  className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={p.concluido}
                    onChange={() => handleAlternarPasso(p)}
                  />
                  <div className={p.concluido ? 'text-gray-400 line-through' : ''}>
                    <p className="font-medium text-gray-900">
                      {formatarDataSimples(p.data_retorno)}
                      {p.horario_retorno && ` às ${p.horario_retorno.slice(0, 5)}`}
                      {atrasado && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-normal text-red-700">
                          Atrasado
                        </span>
                      )}
                    </p>
                    <p className="text-gray-600">{p.descricao}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelClasse}>Data de retorno</label>
            <input
              type="date"
              className={campoClasse}
              value={novoPassoData}
              onChange={(e) => setNovoPassoData(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClasse}>Horário (opcional)</label>
            <input
              type="time"
              className={campoClasse}
              value={novoPassoHorario}
              onChange={(e) => setNovoPassoHorario(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className={labelClasse}>O que fazer</label>
            <input
              className={campoClasse}
              value={novoPassoDescricao}
              onChange={(e) => setNovoPassoDescricao(e.target.value)}
              placeholder="Ex: ligar para fechar negociação"
            />
          </div>
          <button
            type="button"
            onClick={handleAdicionarPasso}
            disabled={salvandoPasso}
            className={botaoPrimarioClasse}
          >
            {salvandoPasso ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Enviar email</h2>

        {!cliente.email ? (
          <p className="text-sm text-gray-500">
            Este cliente não tem email cadastrado.{' '}
            <Link to={`/clientes/${cliente.id}/editar`} className="text-marrom underline">
              Adicionar email
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mensagemEmail && <p className="text-sm text-gray-700">{mensagemEmail}</p>}
            <div>
              <label className={labelClasse}>Modelo (opcional)</label>
              <select
                className={campoClasse}
                value={modeloSelecionadoId}
                onChange={(e) => aplicarModelo(e.target.value)}
              >
                <option value="">Escrever do zero</option>
                {modelosEmail.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Assunto</label>
              <input
                className={campoClasse}
                value={assuntoEmail}
                onChange={(e) => setAssuntoEmail(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasse}>Mensagem</label>
              <textarea
                className={campoClasse}
                rows={6}
                value={corpoEmail}
                onChange={(e) => setCorpoEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleEnviarEmail}
              disabled={enviandoEmail || !assuntoEmail.trim() || !corpoEmail.trim()}
              className={`${botaoPrimarioClasse} self-end`}
            >
              {enviandoEmail ? 'Enviando...' : `Enviar para ${cliente.email}`}
            </button>
          </div>
        )}
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-gray-900">Histórico de interações</h2>

        {interacoes.length === 0 ? (
          <p className="mb-3 text-sm text-gray-500">Nenhuma interação registrada.</p>
        ) : (
          <ul className="mb-3 flex flex-col gap-2">
            {interacoes.map((i) => (
              <li key={i.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="font-medium text-gray-900">
                  {rotulo(TIPOS_INTERACAO, i.tipo)} · {formatarDataHora(i.data)}
                </p>
                <p className="text-gray-600">{i.descricao}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Registrado por {i.vendedores?.nome ?? 'desconhecido'}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label className={labelClasse}>Tipo</label>
            <select
              className={campoClasse}
              value={novoTipoInteracao}
              onChange={(e) => setNovoTipoInteracao(e.target.value as TipoInteracao)}
            >
              {TIPOS_INTERACAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClasse}>Descrição</label>
            <input
              className={campoClasse}
              value={novaDescricaoInteracao}
              onChange={(e) => setNovaDescricaoInteracao(e.target.value)}
              placeholder="O que foi conversado"
            />
          </div>
          <button
            type="button"
            onClick={handleAdicionarInteracao}
            disabled={salvandoInteracao}
            className={botaoPrimarioClasse}
          >
            {salvandoInteracao ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </section>

      <p className="text-xs text-gray-400">
        Criado em {formatarDataHora(cliente.criado_em)} · Atualizado em {formatarDataHora(cliente.atualizado_em)}
      </p>
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <div>
      <dt className="text-gray-500">{rotulo}</dt>
      <dd className="font-medium text-gray-900">{valor}</dd>
    </div>
  )
}
