import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' 

const themeColor = '#007bff'; 

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      strategies: 'injectManifest', 
      srcDir: 'src',
      filename: 'sw.js', 
      injectManifest: {
          swSrc: 'src/sw.js', 
          injectionPoint: 'self.__WB_MANIFEST', 
      },

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'], 
      workbox: {
        runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/inventario/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // Cacha por 7 días
                },
              },
            },
        ],
      },
      
      manifest: {
        name: 'Inventario Hospitalario',
        short_name: 'InvHospital',
        //...
      }
    }),
  ],
})