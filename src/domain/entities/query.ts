export interface Query {
  text: string
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
