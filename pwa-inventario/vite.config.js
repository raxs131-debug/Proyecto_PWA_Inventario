// pwa-inventario/vite.config.js - CAMBIOS NECESARIOS
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' 

const themeColor = '#007bff'; 

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      // 🚨 CAMBIO CLAVE 1: Cambiar la estrategia a 'injectManifest'
      strategies: 'injectManifest', 
      
      // 🚨 CAMBIO CLAVE 2: Especificar la ubicación del archivo fuente
      srcDir: 'src',
      filename: 'sw.js', // El archivo final que se generará en 'dist/'

      injectManifest: {
          // 🚨 CAMBIO CLAVE 3: Apuntar al archivo fuente que crearemos
          swSrc: 'src/sw.js', 
          // Esta es la variable donde Workbox inyectará la lista de precaching
          injectionPoint: 'self.__WB_MANIFEST', 
      },

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'], 

      // 🚨 WORKBOX: La configuración de runtimeCaching (caching de API) se MANTIENE.
      // La configuración de globPatterns NO es necesaria con injectManifest.
      workbox: {
        // ESTA CONFIGURACIÓN DE 'runtimeCaching' ES LO QUE REEMPLAZA A TU LÓGICA MANUAL
        // DE FETCH EN EL SERVICE WORKER. ES MEJOR Y MÁS ROBUSTA.
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
        //... (El resto del manifiesto se mantiene igual)
        name: 'Inventario Hospitalario',
        short_name: 'InvHospital',
        //...
      }
    }),
  ],
})