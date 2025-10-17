import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ❌ LÍNEA ELIMINADA:
// import * as serviceWorkerRegistration from './serviceWorkerRegistration'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ==========================================================
// 🎯 REGISTRO DEL SERVICE WORKER (PWA)
// ==========================================================

// El registro solo ocurre en modo de producción (después de 'npm run build')
// para evitar problemas en el servidor de desarrollo de Vite.
if (process.env.NODE_ENV === 'production') {
    // 1. Verifica si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
        // 2. Espera a que la página esté completamente cargada
        window.addEventListener('load', () => {
            // 3. Registra el Service Worker usando la ruta directa '/sw.js'.
            navigator.serviceWorker.register('/sw.js')
              .then(registration => {
                console.log('✅ Service Worker registrado con éxito:', registration);
              })
              .catch(registrationError => {
                console.error('❌ Fallo en el registro de Service Worker:', registrationError);
              });
        });
    }
}