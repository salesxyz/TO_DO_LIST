import type { Priority, Task } from '../types/task'

export type View = 'today' | 'all' | 'pending' | 'completed'
export type SortOrder = 'recent' | 'due-asc' | 'due-desc'
export type PriorityFilter = Priority | 'all'

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Data local de hoje no formato YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Converte YYYY-MM-DD em Date local (evita o deslocamento de fuso do `new Date(string)`). */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDue(iso: string, today: string): string {
  if (iso === today) return 'Hoje'
  if (iso === addDays(today, 1)) return 'Amanhã'
  const date = parseISODate(iso)
  const options: Intl.DateTimeFormatOptions =
    date.getFullYear() === parseISODate(today).getFullYear()
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' }
  return date.toLocaleDateString('pt-BR', options).replace('.', '')
}

export function isOverdue(task: Task, today: string): boolean {
  return !task.completed && task.due_date !== null && task.due_date < today
}

export function matchesView(task: Task, view: View, today: string): boolean {
  switch (view) {
    case 'today':
      return task.due_date === today || (task.due_date === null && !task.completed)
    case 'pending':
      return !task.completed
    case 'completed':
      return task.completed
    default:
      return true
  }
}

/** Remove acentos e ignora maiúsculas para a pesquisa. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export interface TaskFilters {
  view: View
  priority: PriorityFilter
  query: string
  sort: SortOrder
}

export function filterAndSortTasks(tasks: Task[], filters: TaskFilters, today: string): Task[] {
  const query = normalize(filters.query.trim())
  const result = tasks.filter(
    (task) =>
      matchesView(task, filters.view, today) &&
      (filters.priority === 'all' || task.priority === filters.priority) &&
      (query === '' || normalize(task.title).includes(query)),
  )

  if (filters.sort === 'recent') return result // a API já devolve da mais recente para a mais antiga

  const direction = filters.sort === 'due-asc' ? 1 : -1
  // Array.sort é estável: empates mantêm a ordem original. Tarefas sem data ficam sempre por último.
  return [...result].sort((a, b) => {
    if (a.due_date === b.due_date) return 0
    if (a.due_date === null) return 1
    if (b.due_date === null) return -1
    return a.due_date < b.due_date ? -direction : direction
  })
}
