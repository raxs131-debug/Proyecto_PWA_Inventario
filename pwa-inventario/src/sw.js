// pwa-inventario/src/sw.js
import { precacheAndRoute } from 'workbox-precaching';

// 1. INYECCIÓN DEL PRECACHING
// 🚨 ESTA LÍNEA REEMPLAZA completamente tu evento 'install' manual.
// Workbox tomará la lista de archivos estáticos (App Shell) de Vite y la inyectará aquí.
precacheAndRoute(self.__WB_MANIFEST);

// 2. LÓGICA DE ACTIVACIÓN (LIMPIEZA DE CACHÉS)
// Workbox ya gestiona la limpieza de sus propias cachés y del precaching.
// Dejaremos esta lógica SÓLO para limpiar cualquier caché de Service Worker antigua o manual que no sea de Workbox.
self.addEventListener('activate', event => {
    console.log('[SW] Activando y limpiando cachés antiguas no Workbox...');
    
    // Obtenemos los nombres de caché que Workbox ha registrado (que queremos MANTENER).
    // Usaremos un prefijo que Workbox usa internamente (aunque a veces solo es el nombre).
    const workboxCachePrefixes = ['workbox-precache-', 'api-cache']; 
    
    event.waitUntil(
        caches.keys().then((cacheNames) =>{
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Si el nombre NO empieza por un prefijo de Workbox o nuestro cacheName de API, lo eliminamos.
                    if (!workboxCachePrefixes.some(prefix => cacheName.startsWith(prefix)) && cacheName !== 'api-cache') {
                        console.log(`[SW] Eliminando caché no gestionada por Workbox: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
});

// 3. LÓGICA DE FETCH (Ya cubierta por Workbox en vite.config.js)
// La configuración de 'runtimeCaching' en vite.config.js gestiona
// la intercepción de llamadas a '/api/inventario/'
// por lo que no necesitas un listener de 'fetch' aquí.