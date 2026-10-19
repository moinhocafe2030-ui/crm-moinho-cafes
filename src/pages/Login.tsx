import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Logo } from '../components/Logo'

export function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    setEnviando(false)
    if (error) {
      setErro('Email ou senha incorretos.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <Logo className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
        <h1 className="mb-1 text-center text-2xl font-semibold text-marrom">Moinho Cafés</h1>
        <p className="mb-6 text-center text-sm text-gray-500">CRM de potenciais clientes</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-marrom focus:ring-1 focus:ring-marrom"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-marrom focus:ring-1 focus:ring-marrom"
            />
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-lg bg-marrom py-2 font-medium text-white transition hover:bg-marrom-claro disabled:opacity-60"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>

          <Link to="/esqueci-senha" className="text-center text-sm text-gray-500 hover:text-marrom">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  )
}
