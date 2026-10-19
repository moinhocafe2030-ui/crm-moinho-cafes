import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine)
    window.addEventListener('online', atualizar)
    window.addEventListener('offline', atualizar)
    return () => {
      window.removeEventListener('online', atualizar)
      window.removeEventListener('offline', atualizar)
    }
  }, [])
  return online
}

const links = [
  { to: '/', label: 'Hoje' },
  { to: '/funil', label: 'Funil' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/painel', label: 'Painel' },
  { to: '/vendas', label: 'Vendas' },
]

export function Layout({ children }: { children: ReactNode }) {
  const online = useOnline()

  return (
    <div className="flex min-h-screen flex-col bg-creme">
      {!online && (
        <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Sem conexão com a internet. Você está vendo os últimos dados carregados — alterações só são
          salvas quando a conexão voltar.
        </div>
      )}
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Logo className="h-9 w-9 rounded-full object-cover" />
          <span className="font-semibold text-marrom">Moinho Cafés CRM</span>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/configuracoes" className="text-sm text-gray-500 hover:text-marrom">
            Configurações
          </NavLink>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-500 hover:text-marrom"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">{children}</main>

      <nav className="sticky bottom-0 flex border-t border-black/10 bg-white">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm font-medium ${
                isActive ? 'text-marrom' : 'text-gray-400'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
