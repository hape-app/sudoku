import {defineEnvVars} from '@sveltejs/kit/env'

export const variables = defineEnvVars({
  NEXUS: {public: true},
  NEXUS_G: {public: true},
})
