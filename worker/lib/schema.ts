export const puzzleLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export type PuzzleLevel = typeof puzzleLevels[number]

export namespace db {
  export interface User {
    name: string
    avatar: string
    uid: string
  }

  export interface Puzzle {
    _id: string
    task: string
    level: PuzzleLevel
  }
}
