import {env} from 'cloudflare:workers'
import {Hono, type Context} from 'hono'
import {cors} from 'hono/cors'
import {deleteCookie, getSignedCookie, setSignedCookie} from 'hono/cookie'
import {jwtParse, db, puzzleLevels, type PuzzleLevel} from '#lib'

const app = new Hono()

const cookieName = 'uid'
const cookieMaxAge = 60 * 60 * 24 * 30
const localHosts = new Set(['localhost', '127.0.0.1'])

app.use(cors({
	origin: origin => origin,
	credentials: true,
}))

app.onError((err, c) => {
	console.error(err)
	return c.json({error: err.message}, 500)
})

function cookieOptions(c: Context) {
	return {
		httpOnly: true,
		path: '/',
		sameSite: 'lax' as const,
		secure: new URL(c.req.url).protocol === 'https:',
	}
}

function returnUrl(c: Context) {
	const fallback = new URL(env.APP_URL)
	const encoded = c.req.param('return')
	const raw = encoded
		? Buffer.from(encoded, 'base64url').toString()
		: c.req.query('return')
	if (!raw) return fallback.toString()

	try {
		const url = new URL(raw)
		const production = url.origin === fallback.origin
		const local = url.protocol === 'http:' && localHosts.has(url.hostname)
		return production || local ? url.toString() : fallback.toString()
	} catch {
		return fallback.toString()
	}
}

async function auth(c: Context) {
	let raw = c.req.query('data')
	let returnTo = returnUrl(c)

	// Nexus appends ?data= verbatim. Recover callbacks created before the
	// return target moved into the path, where it ended up inside `return`.
	if (!raw) {
		try {
			const url = new URL(returnTo)
			raw = url.searchParams.get('data') ?? undefined
			if (raw) {
				url.searchParams.delete('data')
				returnTo = url.toString()
			}
		} catch {}
	}

	if (!raw) return c.json({error: 'Missing auth data'}, 400)

	let user: {
		sub: string
		name: string
		picture: string
		email: string
		email_verified: boolean
	}

	try {
		const payload = await jwtParse<{data: string}>(raw, env.RSA_PUK)
		user = JSON.parse(Buffer.from(payload.data, 'base64url').toString())
	} catch {
		return c.json({error: 'Invalid auth data'}, 400)
	}

	await db.user.updateOne(
		{uid: user.sub},
		{
			$set: {name: user.name, avatar: user.picture},
			$setOnInsert: {uid: user.sub},
		},
		{upsert: true}
	)

	await setSignedCookie(c, cookieName, user.sub, env.COOKIE_SECRET, {
		...cookieOptions(c),
		maxAge: cookieMaxAge,
	})

	return c.redirect(returnTo, 303)
}

app.get('/auth', auth)
app.get('/auth/:return', auth)

app.get('/me', async c => {
	const uid = await getSignedCookie(c, env.COOKIE_SECRET, cookieName)
	if (!uid) return c.json({error: 'Unauthorized'}, 401)

	const user = await db.user.findOne(
		{uid},
		{projection: {_id: 0, uid: 1, name: 1, avatar: 1}}
	)

	if (!user) {
		deleteCookie(c, cookieName, cookieOptions(c))
		return c.json({error: 'Unauthorized'}, 401)
	}

	c.header('Cache-Control', 'no-store')
	return c.json(user)
})

app.get('/signout', c => {
	deleteCookie(c, cookieName, cookieOptions(c))
	return c.redirect(returnUrl(c), 303)
})

async function randomPuzzle(level?: PuzzleLevel) {
	const filter = level ? {level} : {}
	const count = await db.puzzle.countDocuments(filter)
	if (!count) return null

	let number = Math.floor(Math.random() * count) + 1
	let [puzzle] = await db.puzzle.find(filter, {
		skip: number - 1,
		limit: 1,
		projection: {task: 1, level: 1},
		sort: {_id: 1},
	})

	if (!puzzle) {
		number = 1
		;[puzzle] = await db.puzzle.find(filter, {
			limit: 1,
			projection: {task: 1, level: 1},
			sort: {_id: 1},
		})
	}

	return puzzle ? {puzzle, number} : null
}

app.get('/puzzle', async c => {
	const requested = c.req.query('level') ?? 'beginner'
	if (!puzzleLevels.includes(requested as PuzzleLevel)) {
		return c.json({error: 'Invalid level'}, 400)
	}

	let result = await randomPuzzle(requested as PuzzleLevel)
	if (!result) result = await randomPuzzle()
	if (!result) return c.json({error: 'No puzzle available'}, 404)

	c.header('Cache-Control', 'no-store')
	return c.json({
		id: result.puzzle._id,
		task: result.puzzle.task,
		level: result.puzzle.level,
		number: result.number,
	})
})

export default {
	fetch: app.fetch
} satisfies ExportedHandler
