import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { campoClasse, labelClasse, botaoPrimarioClasse } from '../lib/estilos'

export function RedefinirSenha() {
  const navigate = useNavigate()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não são iguais.')
      return
    }

    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setSalvando(false)

    if (error) {
      setErro(
        'Não foi possível redefinir a senha. O link pode ter expirado — peça um novo em "Esqueci minha senha".',
      )
      return
    }

    setSucesso(true)
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <Logo className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
        <h1 className="mb-6 text-center text-2xl font-semibold text-marrom">Nova senha</h1>

        {sucesso ? (
          <p className="text-center text-sm text-green-700">
            Senha atualizada! Redirecionando para o CRM...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="senha" className={labelClasse}>
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                required
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={campoClasse}
              />
            </div>

            <div>
              <label htmlFor="confirmarSenha" className={labelClasse}>
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                required
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className={campoClasse}
              />
            </div>

            {erro && <p className="text-sm text-red-600">{erro}</p>}

            <button type="submit" disabled={salvando} className={`${botaoPrimarioClasse} mt-2`}>
              {salvando ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <Link to="/login" className="text-center text-sm text-gray-500 hover:text-marrom">
              Cancelar
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
