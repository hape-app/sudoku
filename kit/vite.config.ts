import {defineConfig} from 'vite'
import path from 'node:path'
import {sveltekit} from '@sveltejs/kit/vite'
import tw from '@tailwindcss/vite'
import adapter from '@sveltejs/adapter-cloudflare'
import {vitePreprocess as preprocess} from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    tw(),
    sveltekit({
      preprocess: [
        preprocess({
          style: true,
          script: true,
        })
      ],
      paths: {relative: false},
      adapter: adapter(),
      compilerOptions: {
        warningFilter(w) {
          if (w.code === 'options_missing_custom_element') return false
          return true
        }
      }
    })
  ],
  ssr: {
    noExternal: ['@lucide/svelte', 'svelte-sonner']
  },
  server: {
    allowedHosts: ['web.test'],
    fs: {
      allow: [
        process.cwd()
      ]
    }
  }
})
