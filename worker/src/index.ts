import {env} from 'cloudflare:workers'
import {Hono} from 'hono'

const app = new Hono()

app.get('/', async c => {
	return c.json({ok: true})
})

export default {
	fetch: app.fetch
} satisfies ExportedHandler
