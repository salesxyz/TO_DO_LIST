import type { Task, TaskInput, TaskPatch } from '../types/task'
import * as local from './localTasks'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    const detail = body?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      // Erros de validação do FastAPI/Pydantic (422).
      const message = String(detail[0]?.msg ?? '').replace(/^Value error, /, '')
      if (message) return message
    }
  } catch {
    // corpo ausente ou que não é JSON
  }
  return `A API respondeu com erro (${response.status}).`
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = init.body ? { 'Content-Type': 'application/json' } : {}
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está em execução.')
  }
  if (!response.ok) throw new ApiError(await readErrorMessage(response))
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function apiListTasks(): Promise<Task[]> {
  return request<Task[]>('/api/tasks')
}

function apiCreateTask(input: TaskInput): Promise<Task> {
  return request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) })
}

function apiUpdateTask(id: number, patch: TaskPatch): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}

function apiDeleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE' })
}

/**
 * Origem dos dados, definida na compilação por VITE_DATA_SOURCE:
 * - "api" (padrão): backend FastAPI + SQLite;
 * - "local": armazenamento no próprio aparelho, sem servidor (usado no app Android).
 */
const useLocalStorage = import.meta.env.VITE_DATA_SOURCE === 'local'

export const listTasks = useLocalStorage ? local.listTasks : apiListTasks
export const createTask = useLocalStorage ? local.createTask : apiCreateTask
export const updateTask = useLocalStorage ? local.updateTask : apiUpdateTask
export const deleteTask = useLocalStorage ? local.deleteTask : apiDeleteTask
