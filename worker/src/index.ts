import {env} from 'cloudflare:workers'
import {Hono} from 'hono'
import {jwtParse, db} from '#lib'

const app = new Hono()

app.get('/auth', async c => {
	let r
	r = c.req.query('data')!
	r = await jwtParse<{data: string}>(r, env.RSA_PUK)
	r = Buffer.from(r.data, 'base64url').toString()
	r = JSON.parse(r) as {
		sub: string
		name: string
		picture: string
		email: string
		email_verified: boolean
	}

	r = await db.user.updateOne(
		{uid: r.sub},
		{
			$set: {name: r.name, avatar: r.picture},
			$setOnInsert: {uid: r.sub},
		},
		{upsert: true}
	)

	return c.json(r)
})

export default {
	fetch: app.fetch
} satisfies ExportedHandler
