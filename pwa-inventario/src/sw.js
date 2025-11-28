import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('activate', event => {
    console.log('[SW] Activando y limpiando cachés antiguas no Workbox...');
    const workboxCachePrefixes = ['workbox-precache-', 'api-cache']; 
    
    event.waitUntil(
        caches.keys().then((cacheNames) =>{
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!workboxCachePrefixes.some(prefix => cacheName.startsWith(prefix)) && cacheName !== 'api-cache') {
                        console.log(`[SW] Eliminando caché no gestionada por Workbox: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
});