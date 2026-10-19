import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { campoClasse, labelClasse, botaoPrimarioClasse } from '../lib/estilos'

export function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    setEnviando(false)
    if (error) {
      setErro('Não foi possível enviar o email. Tente novamente.')
      return
    }
    setEnviado(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <Logo className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
        <h1 className="mb-1 text-center text-2xl font-semibold text-marrom">Esqueci minha senha</h1>

        {enviado ? (
          <>
            <p className="mb-6 mt-4 text-center text-sm text-gray-600">
              Se esse email estiver cadastrado, você vai receber um link para redefinir sua senha.
              Confira sua caixa de entrada (e o spam).
            </p>
            <Link to="/login" className="block text-center text-sm text-marrom underline">
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-gray-500">
              Digite seu email para receber um link de redefinição
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className={labelClasse}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={campoClasse}
                />
              </div>

              {erro && <p className="text-sm text-red-600">{erro}</p>}

              <button type="submit" disabled={enviando} className={`${botaoPrimarioClasse} mt-2`}>
                {enviando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
            <Link to="/login" className="mt-4 block text-center text-sm text-gray-500 hover:text-marrom">
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
