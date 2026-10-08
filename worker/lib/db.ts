import {BSON} from 'bson'
import type {Document, OptionalId, InsertOneOptions, Filter, UpdateFilter} from 'mongodb'
import type * as schema from './schema'

{
  // const m = new MongoClient('')
  // m.db('').collection('').updateOne()
}

class Collection<T extends Document> {
  db: string
  name: string

  constructor(db: string, name: string) {
    this.db = db
    this.name = name
  }

  async insertOne(doc: OptionalId<T>, opts?: InsertOneOptions) {
    let r
    r = await fetch('https://mgo.hape.app', {
      headers: {authorization: 'jarvis'},
      //@ts-ignore
      body: BSON.serialize({
        db: this.db,
        cmd: {
          insert: this.name,
          documents: [doc],
        }
      })
    })
    r = await r.json()
    return r
  }

  async updateOne(filter: Filter<T>, update: T[] | UpdateFilter<T>, opts?: {upsert?: boolean}) {
    let r
    r = await fetch('https://mgo.hape.app', {
      method: 'POST',
      headers: {authorization: 'jarvis'},
      //@ts-ignore
      body: BSON.serialize({
        db: this.db,
        cmd: {
          update: this.name,
          updates: [{
            q: filter,
            u: update,
            multi: false,
            upsert: opts?.upsert ?? false,
          }],
        }
      })
    })
    r = await r.json()
    return r
  }
}

export const user = new Collection<schema.db.User>('sudoku', 'user')
