import { useState } from 'react'
import { urlLogoPublica } from '../lib/logo'

export function Logo({ className }: { className?: string }) {
  const [erro, setErro] = useState(false)

  // Sem logo enviada ainda: não mostra nada (o nome "Moinho Cafés" já aparece em texto
  // ao lado, no cabeçalho e na tela de login).
  if (erro) return null

  return (
    <img
      src={urlLogoPublica()}
      alt="Moinho Cafés"
      className={className}
      onError={() => setErro(true)}
    />
  )
}
