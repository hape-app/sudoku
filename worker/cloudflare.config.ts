import {bindings, defineConfig} from 'cf/config'
import * as entrypoint from './src' with {type: 'cf-worker'}

export default defineConfig({
	worker: {
		name: "api-lufei-me",
		compatibilityDate: "2026-10-01",
		entrypoint,
		compatibilityFlags: ['nodejs_compat'],
		env: {
			RSA_PUK: bindings.secret(),
		},
	},
});
