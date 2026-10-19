import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Garante que o app instalado no celular/computador sempre baixe e aplique a versão
// mais nova sozinho (sem precisar desinstalar/reinstalar). Verifica por atualização
// a cada hora, mesmo com o app aberto em segundo plano por vários dias.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    setInterval(() => registration.update(), 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
