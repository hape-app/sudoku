import axios from 'axios'
import type {Profile, Puzzle, PuzzleLevel} from '#lib'

const n = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true
})

n.interceptors.response.use(r => {
  return r.data
}, async ({response, message}) => {
  if (response?.status === 401) return Promise.reject(new Error('401'))
  if (response?.data) {
    const data = response.data
    const detail = typeof data === 'string' ? data : data.error ?? data.message
    return Promise.reject(new Error(detail || message))
  }
  return Promise.reject(new Error(message))
})

export default n

export async function getPuzzle(level: PuzzleLevel): Promise<Puzzle> {
  return await n.get<never, Puzzle>('/puzzle', {params: {level}})
}

export async function getMe(): Promise<Profile> {
  return await n.get<never, Profile>('/me')
}
