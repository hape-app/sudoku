import {toast as _toast} from 'svelte-sonner'

export * from './core.ts'
export {default as dayjs} from './day.ts'

export function toast(r: Error | string, type?: 'success') {
  if (type === 'success') return _toast.success(r as string)
  if (r instanceof Error) _toast.error(r.message)
  else _toast.info(r)
}



export function start(fn: Function) {
  if ('startViewTransition' in document) return document.startViewTransition(() => fn())
  else fn()
}

export function onKeyDown(e: KeyboardEvent) {
  if (e.key.toLowerCase() !== 'enter' && e.key !== ' ') return
  e.currentTarget?.dispatchEvent(new MouseEvent('click', {bubbles: true}))
}

export interface DebounceOptions {
  /** 是否在前沿（立即）触发执行 */
  immediate?: boolean;
}

/**
 * 带有 cancel 方法的防抖函数类型接口
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** 取消尚未执行的防抖函数 */
  cancel(): void;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number = .3): DebouncedFunction<T> {
  let tid: ReturnType<typeof setTimeout> | null | undefined = null

  function debounced(this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const context = this

    if (tid) clearTimeout(tid)
    tid = setTimeout(() => {
      func.apply(context, args)
    }, wait * 1e3)
  }

  debounced.cancel = () => {
    clearTimeout(tid as any)
  }

  return debounced
}

export function setCookie(k: string, v: string) {
  cookieStore.set({
    name: k,
    value: v,
    expires: Date.now() + 365 * 24 * 3600 * 1e3,
    path: '/',
    sameSite: 'lax',
    //@ts-ignore
    secure: true,
  })
}

export async function getCookie<T>(key: string): Promise<T | undefined> {
  let r
  r = await cookieStore.get(key)
  return r?.value as T
}

/** 计算字符串长度 更适合emoji场景 */
export function len(r: string) {
  return [...new Intl.Segmenter(undefined, {
    granularity: 'grapheme',
  }).segment(r)].length
}
