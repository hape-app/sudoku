import {BSON} from 'bson'
import type {
  Document,
  Filter,
  FindOptions as MongoFindOptions,
  InsertOneOptions,
  OptionalId,
  UpdateFilter,
} from 'mongodb'
import type * as schema from './schema'

const endpoint = 'https://mgo.hape.app'

type FindOptions = Pick<MongoFindOptions, 'limit' | 'projection' | 'skip' | 'sort'>

interface CommandResult {
  ok: number
  errmsg?: string
}

interface CursorResult<T> extends CommandResult {
  cursor: {
    firstBatch: T[]
  }
}

async function runCommand<T extends CommandResult>(db: string, cmd: Document): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {authorization: 'jarvis'},
    body: BSON.serialize({db, cmd}) as unknown as BodyInit,
  })

  if (!response.ok) {
    throw new Error(`Mongo gateway returned ${response.status}: ${await response.text()}`)
  }

  const data = await response.json() as T
  if (data.ok !== 1) throw new Error(data.errmsg ?? 'Mongo command failed')
  return data
}

class Collection<T extends Document> {
  db: string
  name: string

  constructor(db: string, name: string) {
    this.db = db
    this.name = name
  }

  async insertOne(doc: OptionalId<T>, opts?: InsertOneOptions) {
    return await runCommand<CommandResult & {insertedId: string}>(this.db, {
      insert: this.name,
      documents: [doc],
    })
  }

  async updateOne(filter: Filter<T>, update: T[] | UpdateFilter<T>, opts?: {upsert?: boolean}) {
    return await runCommand<CommandResult & {
      n: number
      nModified: number
      upserted?: Array<{index: number, _id: string}>
    }>(this.db, {
      update: this.name,
      updates: [{
        q: filter,
        u: update,
        multi: false,
        upsert: opts?.upsert ?? false,
      }],
    })
  }

  async find(filter: Filter<T> = {}, opts: FindOptions = {}) {
    const cmd: Document = {find: this.name, filter}
    if (opts.projection) cmd.projection = opts.projection
    if (opts.skip) cmd.skip = opts.skip
    if (opts.limit) cmd.limit = opts.limit
    if (opts.sort) cmd.sort = opts.sort

    const result = await runCommand<CursorResult<T>>(this.db, cmd)
    return result.cursor.firstBatch
  }

  async findOne(filter: Filter<T> = {}, opts: FindOptions = {}) {
    const [doc] = await this.find(filter, {...opts, limit: 1})
    return doc ?? null
  }

  async countDocuments(filter: Filter<T> = {}) {
    const result = await runCommand<CommandResult & {n: number}>(this.db, {
      count: this.name,
      query: filter,
    })
    return result.n
  }
}

export const user = new Collection<schema.db.User>('sudoku', 'user')
export const puzzle = new Collection<schema.db.Puzzle>('sudoku', 'puzzle')
