import type * as schema from '#lib/schema.ts'
import n from './core.ts'

export namespace tweet {
  export function list(opts?: {next?: string | null, prev?: string | null}) {
    type R = {
      tweets: schema.tweet.Tweet[]
      next?: string
      prev?: string
    }
    return n.get<null, R>('/tweet', {params: opts})
  }

  export function post(data: {id?: string, content: string, imgs?: string[], video?: string}) {
    return n.post<null, string>('/tweet', data)
  }

  export function del(id: string) {
    return n.delete('/tweet', {params: {id}})
  }
}

export namespace r2 {
  export function uploadUrl(data: {size: number, name: string, mime: string}) {
    type R = {
      method: string
      headers: Record<string, string>
      url: string
    }
    return n.query<null, R & {key: string} | {uploadId: string, blockSize: number, key: string, urls: R[]}>('/r2/upload/url', data)
  }


  export function complete(data: {uploadId: string, key: string, parts: {etag: string, n: number}[]}) {
    return n.patch('/r2/complete', data)
  }
}

export function me() {
  return n.get('/me')
}
