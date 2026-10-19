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
      workbox: {
        // Permite abrir o CRM e ver os últimos dados carregados mesmo sem internet
        // (ex: durante uma visita a um cliente). Não funciona para CRIAR ou EDITAR
        // dados offline — isso exige conexão, e o app mostra um aviso quando está offline.
        runtimeCaching: [
          {
            urlPattern: /\/rest\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-dados',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/storage\/v1\/object\/public\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-arquivos-publicos',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
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
