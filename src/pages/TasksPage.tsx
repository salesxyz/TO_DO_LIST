import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarCheck,
  CircleCheck,
  Inbox,
  ListChecks,
  Moon,
  Search,
  SearchX,
  Sun,
  TriangleAlert,
} from 'lucide-react'
import Dialog from '../components/Dialog'
import EmptyState from '../components/EmptyState'
import Sidebar from '../components/Sidebar'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import { createTask, deleteTask, listTasks, updateTask } from '../services/tasks'
import type { Task, TaskInput } from '../types/task'
import {
  PRIORITY_LABELS,
  filterAndSortTasks,
  matchesView,
  parseISODate,
  todayISO,
  type PriorityFilter,
  type SortOrder,
  type View,
} from '../utils/tasks'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

type Toast = { kind: 'success' | 'error'; text: string }

const VIEW_TITLES: Record<View, string> = {
  today: 'Hoje',
  all: 'Todas',
  pending: 'Pendentes',
  completed: 'Concluídas',
}

const EMPTY_MESSAGES: Record<View, { title: string; text: string }> = {
  today: { title: 'Nada para hoje', text: 'Você não tem tarefas para hoje. Aproveite ou adicione uma nova acima.' },
  all: { title: 'Nenhuma tarefa ainda', text: 'Adicione sua primeira tarefa no campo acima.' },
  pending: { title: 'Tudo em dia', text: 'Não há tarefas pendentes.' },
  completed: { title: 'Nenhuma tarefa concluída', text: 'As tarefas que você concluir aparecerão aqui.' },
}

export default function TasksPage({ theme, onToggleTheme }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [view, setView] = useState<View>('today')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [sort, setSort] = useState<SortOrder>('recent')

  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [deletingNow, setDeletingNow] = useState(false)

  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // "Hoje" muda à meia-noite; recalcular a cada renderização é barato e evita dado velho.
  const today = todayISO()

  const notify = useCallback((kind: Toast['kind'], text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ kind, text })
    toastTimer.current = window.setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setTasks(await listTasks())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const counts = useMemo<Record<View, number>>(
    () => ({
      today: tasks.filter((t) => matchesView(t, 'today', today)).length,
      all: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks, today],
  )

  const visibleTasks = useMemo(
    () => filterAndSortTasks(tasks, { view, priority, query, sort }, today),
    [tasks, view, priority, query, sort, today],
  )

  const filtersActive = query.trim() !== '' || priority !== 'all'

  function clearFilters() {
    setQuery('')
    setPriority('all')
  }

  function setBusy(id: number, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Criação e edição propagam o erro para o formulário, que o mostra e mantém os dados digitados.
  async function handleCreate(input: TaskInput) {
    const created = await createTask(input)
    setTasks((prev) => [created, ...prev])
    notify(
      'success',
      matchesView(created, view, today)
        ? 'Tarefa criada.'
        : `Tarefa criada. Ela aparece em “${VIEW_TITLES.all}” e “${VIEW_TITLES.pending}”.`,
    )
  }

  async function handleEdit(input: TaskInput) {
    if (!editing) return
    const updated = await updateTask(editing.id, input)
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setEditing(null)
    notify('success', 'Tarefa atualizada.')
  }

  async function handleToggle(task: Task) {
    if (busyIds.has(task.id)) return
    setBusy(task.id, true)
    try {
      const updated = await updateTask(task.id, { completed: !task.completed })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      notify('success', updated.completed ? 'Tarefa concluída.' : 'Tarefa reaberta.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível atualizar a tarefa.')
    } finally {
      setBusy(task.id, false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting || deletingNow) return
    const task = deleting
    setDeletingNow(true)
    try {
      await deleteTask(task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      setDeleting(null)
      notify('success', 'Tarefa excluída.')
    } catch (err) {
      setDeleting(null)
      notify('error', err instanceof Error ? err.message : 'Não foi possível excluir a tarefa.')
    } finally {
      setDeletingNow(false)
    }
  }

  const subtitle =
    view === 'today'
      ? parseISODate(today).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null

  const emptyIcon =
    view === 'completed' ? <CircleCheck size={28} /> : view === 'today' ? <CalendarCheck size={28} /> : <Inbox size={28} />

  return (
    <div className="layout">
      <Sidebar view={view} counts={counts} onChange={setView} />

      <main className="main">
        <header className="page-header">
          <div className="page-heading">
            <h1>{VIEW_TITLES[view]}</h1>
            <p className="page-subtitle">
              {subtitle && <span className="capitalize">{subtitle} · </span>}
              {counts.pending} {counts.pending === 1 ? 'pendente' : 'pendentes'} · {counts.completed}{' '}
              {counts.completed === 1 ? 'concluída' : 'concluídas'}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <TaskForm compact submitLabel="Adicionar" onSubmit={handleCreate} />

        <section className="toolbar" aria-label="Pesquisa e filtros">
          <div className="search">
            <Search size={16} aria-hidden="true" />
            <input
              className="input"
              type="search"
              value={query}
              placeholder="Pesquisar por título"
              aria-label="Pesquisar tarefas por título"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="toolbar-row">
            <select
              className="input"
              aria-label="Filtrar por prioridade"
              value={priority}
              onChange={(event) => setPriority(event.target.value as PriorityFilter)}
            >
              <option value="all">Todas as prioridades</option>
              {(Object.keys(PRIORITY_LABELS) as Array<keyof typeof PRIORITY_LABELS>).map((key) => (
                <option key={key} value={key}>
                  Prioridade {PRIORITY_LABELS[key].toLowerCase()}
                </option>
              ))}
            </select>
            <select
              className="input"
              aria-label="Ordenar tarefas"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
            >
              <option value="recent">Mais recentes</option>
              <option value="due-asc">Vencimento: mais próximo</option>
              <option value="due-desc">Vencimento: mais distante</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="loading" role="status">
            <span className="spinner" aria-hidden="true" />
            Carregando tarefas…
          </div>
        ) : loadError ? (
          <div className="banner banner-error" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <p>{loadError}</p>
            <button type="button" className="btn" onClick={() => void loadTasks()}>
              Tentar novamente
            </button>
          </div>
        ) : visibleTasks.length === 0 ? (
          filtersActive ? (
            <EmptyState
              icon={<SearchX size={28} />}
              title="Nenhum resultado"
              text={
                query.trim()
                  ? `Nenhuma tarefa encontrada para “${query.trim()}” com os filtros atuais.`
                  : 'Nenhuma tarefa corresponde aos filtros atuais.'
              }
              action={
                <button type="button" className="btn" onClick={clearFilters}>
                  Limpar pesquisa e filtros
                </button>
              }
            />
          ) : (
            <EmptyState icon={emptyIcon} title={EMPTY_MESSAGES[view].title} text={EMPTY_MESSAGES[view].text} />
          )
        ) : (
          <ul className="task-list" aria-label={`Tarefas: ${VIEW_TITLES[view]}`}>
            {visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                today={today}
                busy={busyIds.has(task.id)}
                onToggle={handleToggle}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </ul>
        )}
      </main>

      <Dialog open={editing !== null} title="Editar tarefa" onClose={() => setEditing(null)}>
        {editing && (
          <TaskForm
            key={editing.id}
            initial={editing}
            submitLabel="Salvar"
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={deleting !== null}
        title="Excluir tarefa"
        onClose={() => {
          if (!deletingNow) setDeleting(null)
        }}
      >
        <p className="confirm-text">
          Tem certeza de que deseja excluir <strong>{deleting?.title}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setDeleting(null)} disabled={deletingNow}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void handleConfirmDelete()} disabled={deletingNow}>
            {deletingNow ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Dialog>

      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
            {toast.kind === 'success' ? <ListChecks size={16} aria-hidden="true" /> : <TriangleAlert size={16} aria-hidden="true" />}
            {toast.text}
          </div>
        )}
      </div>
    </div>
  )
}
