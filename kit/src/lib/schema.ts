export interface Profile {
  uid: string
  name: string
  avatar: string
}

export type PuzzleLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface Puzzle {
  id: string
  task: string
  level: PuzzleLevel
  number: number
}
