import {createContext} from 'svelte'
import type * as schema from './schema.ts'

const _root = createContext<{
  profile: undefined | schema.Profile,
  overflow: number
}>()

export const root = {
  get: _root[0],
  set: _root[1]
}
