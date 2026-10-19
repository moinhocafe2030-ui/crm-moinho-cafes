import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'CRM Moinho Cafés',
        short_name: 'Moinho CRM',
        description: 'CRM interno da Moinho Cafés para gestão de potenciais clientes',
        theme_color: '#3f2a1d',
        background_color: '#faf6f1',
        display: 'standalone',
        start_url: '/',
        // Usa a logo publicada no Supabase Storage (mesma do login/cabeçalho) como ícone
        // do app no celular. Se o dono trocar a logo em Configurações, é preciso publicar
        // uma nova versão do app para o ícone instalado acompanhar (limitação do sistema
        // operacional, que guarda o ícone no momento da instalação).
        icons: [
          {
            src: 'https://narrzqrfuaqdivdybulc.supabase.co/storage/v1/object/public/branding/logo',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: 'https://narrzqrfuaqdivdybulc.supabase.co/storage/v1/object/public/branding/logo',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
