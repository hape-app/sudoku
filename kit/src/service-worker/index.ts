import {version} from '$app/env'
import {resolve} from '$app/paths'
import {self} from '$app/service-worker'
import {immutable, assets} from '$app/manifest'

const CACHE = `cache-${version}`

const ASSETS: string[] = [
	...immutable.map((asset) => resolve<any>(asset.path)), // the Vite output
	...assets.map((asset) => resolve<any>(asset.path))  // everything in `static`
]

self.addEventListener('install', e => {
  async function addFilesToCache() {
		const cache = await caches.open(CACHE)
		await cache.addAll(ASSETS)
	}
	e.waitUntil(addFilesToCache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', e => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key)
		}
	}
	e.waitUntil(deleteOldCaches().then(() => self.clients.claim()))
})

self.addEventListener('fetch', e => {
	if (e.request.method !== 'GET') return

	async function respond() {
		const url = new URL(e.request.url)
		const cache = await caches.open(CACHE)

		// `immutable`/`assets` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname)
			if (response) return response
		}

		return await fetch(e.request)
	}

	e.respondWith(respond())
})
