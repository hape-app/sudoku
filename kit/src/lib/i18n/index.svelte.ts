import {setCookie, getCookie} from '#lib'
import en from './en'
import zh from './zh'

type M = typeof zh
type Path<T> = T extends object ? {
  [K in keyof T & string]: T[K] extends object ? `${K}.${Path<T[K]>}` : K
}[keyof T & string] : never

export const data = $state({
  lang: 'en' as Lang
})

$effect.root(() => {
  $effect(() => {
    getCookie<Lang>('lang').then(lang => {
      if (lang !== 'zh' && lang !== 'en') lang = data.lang
      data.lang = lang
    })
  })

  $effect(() => {
    setCookie('lang', data.lang)
  })
})

export function t(key: Path<M>, params?: Record<string, string | number>): string {
  const message = get(key)

  if (!params) return message

  return message.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`))
}

function get(key: Path<M>): string {
  const ps = key.split('.')
  let r = data.lang === 'en' ? en : zh
  for (const x of ps) {
    //@ts-ignore
    r = r[x]
  }
  return r as unknown as string
}
