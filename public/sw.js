const CACHE_NAME = 'geography-gym-v28'
const APP_SHELL = [
  './',
  './app/',
  './manifest.webmanifest',
  './faq/',
  './help/',
  './privacy/',
  './site.css',
  './theme.js',
  './icons/icon.svg',
]
const SCOPE_PATH = new URL('./', self.location.href).pathname
const SHELL_PATHS = new Set(APP_SHELL.map((url) => new URL(url, self.location.href).pathname))

function cacheKey(request) {
  const url = new URL(request.url)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function shouldCache(request) {
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  return (
    request.mode === 'navigate'
    || SHELL_PATHS.has(url.pathname)
    || url.pathname.startsWith(`${SCOPE_PATH}assets/`)
    || url.pathname.startsWith(`${SCOPE_PATH}icons/`)
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !shouldCache(event.request)) return
  const key = cacheKey(event.request)
  event.respondWith(
    caches.match(key).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(key, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
