import z from 'zod'

export namespace tweet {
  export interface Tweet {
    id: string
    createdAt: string
    content: string
    updatedAt: string
    imgs?: string[]
    video?: string
    name: string
    avatar: string
    editable: boolean
  }

  export const post = z.object({
    content: z.string().nonempty().max(5e3),
    imgs: z.string().array().optional(),
    video: z.string().nonempty().optional(),
  })
}

export interface Profile {
  name: string
  avatar: string
}
