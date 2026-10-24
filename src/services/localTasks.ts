import type { Priority, Task, TaskInput, TaskPatch } from '../types/task'

/**
 * Armazenamento local (usado no app Android): guarda as tarefas no próprio aparelho,
 * sem servidor. Expõe as mesmas funções e aplica as mesmas regras de validação da API.
 */

const STORAGE_KEY = 'todo-list:tasks:v1'
const PRIORITIES: Priority[] = ['low', 'medium', 'high']

interface Stored {
  nextId: number
  tasks: Task[]
}

function load(): Stored {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return { nextId: 1, tasks: [] }
  try {
    const data = JSON.parse(raw) as Stored
    if (Array.isArray(data.tasks) && typeof data.nextId === 'number') return data
  } catch {
    // cai no erro abaixo
  }
  // Não sobrescreve dados ilegíveis com uma lista vazia.
  throw new Error('Os dados salvos neste aparelho não puderam ser lidos.')
}

function save(state: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    throw new Error('Não foi possível salvar as tarefas neste aparelho.')
  }
}

function cleanTitle(value: unknown): string {
  const title = typeof value === 'string' ? value.trim() : ''
  if (!title) throw new Error('O título não pode ser vazio.')
  if (title.length > 200) throw new Error('O título deve ter no máximo 200 caracteres.')
  return title
}

function cleanDescription(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.trim() || null
}

function cleanPriority(value: unknown): Priority {
  if (!PRIORITIES.includes(value as Priority)) throw new Error('Prioridade inválida.')
  return value as Priority
}

function cleanDueDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const text = String(value)
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`))
  if (!valid) throw new Error('Data de vencimento inválida.')
  return text
}

function byNewest(a: Task, b: Task): number {
  return a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : b.id - a.id
}

function findIndex(state: Stored, id: number): number {
  const index = state.tasks.findIndex((task) => task.id === id)
  if (index === -1) throw new Error('Tarefa não encontrada.')
  return index
}

export async function listTasks(): Promise<Task[]> {
  return [...load().tasks].sort(byNewest)
}

export async function createTask(input: TaskInput): Promise<Task> {
  const state = load()
  const now = new Date().toISOString()
  const task: Task = {
    id: state.nextId,
    title: cleanTitle(input.title),
    description: cleanDescription(input.description),
    priority: cleanPriority(input.priority),
    due_date: cleanDueDate(input.due_date),
    completed: false,
    created_at: now,
    updated_at: now,
  }
  save({ nextId: state.nextId + 1, tasks: [...state.tasks, task] })
  return task
}

export async function updateTask(id: number, patch: TaskPatch): Promise<Task> {
  const state = load()
  const index = findIndex(state, id)
  const current = state.tasks[index]

  // Só os campos enviados são alterados; os omitidos permanecem como estão.
  const updated: Task = {
    ...current,
    ...('title' in patch && { title: cleanTitle(patch.title) }),
    ...('description' in patch && { description: cleanDescription(patch.description) }),
    ...('priority' in patch && { priority: cleanPriority(patch.priority) }),
    ...('due_date' in patch && { due_date: cleanDueDate(patch.due_date) }),
    ...('completed' in patch && { completed: Boolean(patch.completed) }),
    updated_at: new Date().toISOString(),
  }

  const tasks = [...state.tasks]
  tasks[index] = updated
  save({ ...state, tasks })
  return updated
}

export async function deleteTask(id: number): Promise<void> {
  const state = load()
  const index = findIndex(state, id)
  save({ ...state, tasks: state.tasks.filter((_, i) => i !== index) })
}
