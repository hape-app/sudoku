import {bindings, defineConfig} from 'cf/config'
import * as entrypoint from './src' with {type: 'cf-worker'}

export default defineConfig({
	worker: {
		name: 'api-sudoku-hape',
		domains: ['api.sudoku.hape.app'],
		compatibilityDate: '2026-11-01',
		entrypoint,
		compatibilityFlags: ['nodejs_compat'],
		env: {
			RSA_PUK: bindings.secret(),
			COOKIE_SECRET: bindings.secret(),
			APP_URL: bindings.text('https://sudoku.hape.app'),
		},
	},
})
