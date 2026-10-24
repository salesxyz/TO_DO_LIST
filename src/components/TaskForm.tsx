import { useId, useState, type FormEvent } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import type { Priority, Task, TaskInput } from '../types/task'
import { PRIORITY_LABELS } from '../utils/tasks'

interface Props {
  /** Tarefa sendo editada. Sem ela, o formulário cria uma nova tarefa. */
  initial?: Task
  /** Modo de criação rápida: só o título, com "Detalhes" opcionais. */
  compact?: boolean
  submitLabel: string
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel?: () => void
}

export default function TaskForm({ initial, compact = false, submitLabel, onSubmit, onCancel }: Props) {
  const id = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [showDetails, setShowDetails] = useState(!compact)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return // evita envios duplicados

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Informe um título para a tarefa.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: cleanTitle,
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
      })
      if (!initial) {
        setTitle('')
        setDescription('')
        setPriority('medium')
        setDueDate('')
        if (compact) setShowDetails(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a tarefa.')
    } finally {
      setSubmitting(false)
    }
  }

  const titleField = (
    <input
      id={`${id}-title`}
      className="input"
      type="text"
      value={title}
      maxLength={200}
      placeholder={compact ? 'Adicionar uma tarefa…' : 'O que precisa ser feito?'}
      aria-label={compact ? 'Título da nova tarefa' : undefined}
      aria-invalid={error ? true : undefined}
      onChange={(event) => {
        setTitle(event.target.value)
        if (error) setError(null)
      }}
      disabled={submitting}
    />
  )

  const details = (
    <div className="form-details">
      <div className="field">
        <label htmlFor={`${id}-description`}>Descrição</label>
        <textarea
          id={`${id}-description`}
          className="input"
          rows={3}
          value={description}
          placeholder="Opcional"
          onChange={(event) => setDescription(event.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-priority`}>Prioridade</label>
          <select
            id={`${id}-priority`}
            className="input"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            disabled={submitting}
          >
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((key) => (
              <option key={key} value={key}>
                {PRIORITY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-due`}>Vencimento</label>
          <input
            id={`${id}-due`}
            className="input"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={submitting}
          />
          {dueDate && (
            <button type="button" className="link-btn" onClick={() => setDueDate('')} disabled={submitting}>
              Remover data
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (compact) {
    return (
      <form className="quick-add" onSubmit={handleSubmit} noValidate>
        <div className="quick-add-row">
          {titleField}
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-label={submitLabel}>
            <Plus size={18} aria-hidden="true" />
            <span>{submitting ? 'Salvando…' : submitLabel}</span>
          </button>
        </div>
        <button
          type="button"
          className="link-btn details-toggle"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((value) => !value)}
        >
          <ChevronDown size={16} aria-hidden="true" className={showDetails ? 'rotated' : ''} />
          Detalhes
        </button>
        {showDetails && details}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    )
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-title`}>Título</label>
        {titleField}
      </div>
      {details}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
