export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  description: string | null
  priority: Priority
  /** Data no formato YYYY-MM-DD (sem horário e sem fuso). */
  due_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

/** Campos editáveis pelo usuário (criação e edição). */
export interface TaskInput {
  title: string
  description: string | null
  priority: Priority
  due_date: string | null
}

/** Atualização parcial: só o que for enviado é alterado. */
export type TaskPatch = Partial<TaskInput & { completed: boolean }>
