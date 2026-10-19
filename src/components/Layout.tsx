import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'

const links = [
  { to: '/', label: 'Hoje' },
  { to: '/funil', label: 'Funil' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/painel', label: 'Painel' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-creme">
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
