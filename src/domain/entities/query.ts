export interface Query {
  text: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

export interface Answer {
  text: string
  sources: Source[]
}

export interface Source {
  title: string
  url: string
  excerpt?: string
}
