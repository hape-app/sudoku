/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_BASE_URL: string
    readonly VITE_R2_BASE: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  type Lang = 'zh' | 'en'
}

export {}
