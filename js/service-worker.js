// service-worker.js - Para hacer la PWA funcional en APK
const CACHE_NAME = 'voicebook-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/profile.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/profile.js',
  '/js/locations.js',
  '/img/default-avatar.png',
  '/img/default-avatar-client.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker de VoiceBook instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos los recursos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error en cache durante instalación:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker de VoiceBook activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker ahora controla la aplicación');
      return self.clients.claim();
    })
  );
});

// Fetch events - Estrategia Cache First
self.addEventListener('fetch', event => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la versión en cache si existe
        if (response) {
          return response;
        }

        // Si no está en cache, haz la petición y guarda en cache
        return fetch(event.request).then(response => {
          // Verifica si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona la respuesta para guardar en cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(error => {
        console.error('Error en fetch:', error);
        // Puedes devolver una página de error offline aquí
        return new Response('Error de conexión', {
          status: 408,
          statusText: 'Network Error'
        });
      })
  );
});

// Manejar mensajes desde la aplicación
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Manejar sync events para funcionalidad offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync ejecutado');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Aquí puedes agregar lógica para sincronizar datos cuando se recupere la conexión
  console.log('Sincronizando datos en background...');
}
