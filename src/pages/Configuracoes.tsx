import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { conectarGoogle, statusGoogleAgenda } from '../lib/google'
import { enviarLogo } from '../lib/logo'
import { formatarDataHora } from '../lib/data'
import { botaoPrimarioClasse, botaoSecundarioClasse } from '../lib/estilos'
import { Logo } from '../components/Logo'

const MOTIVOS_ERRO: Record<string, string> = {
  parametros_ausentes: 'O Google não enviou os dados esperados. Tente novamente.',
  sessao_invalida: 'Sua sessão expirou. Faça login de novo e tente conectar outra vez.',
  token: 'Não foi possível trocar o código pelo acesso. Confira o Client ID/Secret configurados.',
  sem_refresh_token:
    'O Google não enviou a permissão de acesso contínuo. Tente desconectar o app em sua conta Google e conectar de novo.',
  salvar: 'Não foi possível salvar a conexão. Tente novamente.',
}

export function Configuracoes() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<{ conectado: boolean; atualizadoEm?: string } | null>(null)
  const [conectando, setConectando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [logoKey, setLogoKey] = useState(0)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [mensagemLogo, setMensagemLogo] = useState<string | null>(null)
  const inputLogoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    statusGoogleAgenda().then(setStatus)
  }, [])

  const resultado = params.get('google')
  const motivo = params.get('motivo')

  async function handleConectar() {
    setConectando(true)
    setErro(null)
    try {
      await conectarGoogle()
    } catch (e) {
      setErro((e as Error).message)
      setConectando(false)
    }
  }

  async function handleTrocarLogo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setEnviandoLogo(true)
    setMensagemLogo(null)
    try {
      await enviarLogo(arquivo)
      setLogoKey((k) => k + 1)
      setMensagemLogo('Logo atualizada!')
    } catch (err) {
      setMensagemLogo(`Erro ao enviar: ${(err as Error).message}`)
    } finally {
      setEnviandoLogo(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold text-marrom">Configurações</h1>

      {resultado === 'conectado' && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Google Agenda conectado com sucesso!
        </p>
      )}
      {resultado === 'erro' && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Não foi possível conectar: {MOTIVOS_ERRO[motivo ?? ''] ?? 'erro desconhecido.'}
        </p>
      )}
      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-medium text-gray-900">Google Agenda e Email</h2>
        <p className="mb-3 text-sm text-gray-500">
          Com a conexão feita, toda vez que você definir uma data de retorno em um cliente, um evento
          é criado na sua Google Agenda automaticamente, e você pode enviar emails direto da ficha do
          cliente usando sua conta do Gmail.
        </p>

        {status === null ? (
          <p className="text-sm text-gray-500">Verificando...</p>
        ) : status.conectado ? (
          <div>
            <p className="mb-3 text-sm text-green-700">
              ✓ Conectado{status.atualizadoEm ? ` (desde ${formatarDataHora(status.atualizadoEm)})` : ''}
            </p>
            <button onClick={handleConectar} disabled={conectando} className={botaoPrimarioClasse}>
              {conectando ? 'Abrindo o Google...' : 'Reconectar'}
            </button>
          </div>
        ) : (
          <button onClick={handleConectar} disabled={conectando} className={botaoPrimarioClasse}>
            {conectando ? 'Abrindo o Google...' : 'Conectar Google'}
          </button>
        )}
      </section>

      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-medium text-gray-900">Logo da empresa</h2>
        <p className="mb-3 text-sm text-gray-500">
          Aparece na tela de login e no topo do app. Pode trocar quando quiser.
        </p>
        <div className="flex items-center gap-4">
          <Logo key={logoKey} className="h-16 w-16 rounded-full object-cover" />
          <div>
            <button
              type="button"
              onClick={() => inputLogoRef.current?.click()}
              disabled={enviandoLogo}
              className={botaoSecundarioClasse}
            >
              {enviandoLogo ? 'Enviando...' : 'Trocar logo'}
            </button>
            <input
              ref={inputLogoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTrocarLogo}
            />
            {mensagemLogo && <p className="mt-1 text-sm text-gray-600">{mensagemLogo}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-medium text-gray-900">Modelos de email</h2>
        <p className="mb-3 text-sm text-gray-500">
          Crie modelos reutilizáveis (apresentação, follow-up, etc.) para usar ao enviar email da
          ficha do cliente.
        </p>
        <Link to="/configuracoes/modelos-email" className={botaoSecundarioClasse}>
          Gerenciar modelos
        </Link>
      </section>
    </div>
  )
}
