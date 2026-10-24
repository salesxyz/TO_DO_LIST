import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../types/task'
import { PRIORITY_LABELS, formatDue, isOverdue } from '../utils/tasks'

interface Props {
  task: Task
  today: string
  busy: boolean
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export default function TaskItem({ task, today, busy, onToggle, onEdit, onDelete }: Props) {
  const overdue = isOverdue(task, today)

  return (
    <li className={`task${task.completed ? ' is-done' : ''}${busy ? ' is-busy' : ''}`}>
      <button
        type="button"
        className="check"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? `Reabrir “${task.title}”` : `Concluir “${task.title}”`}
        onClick={() => onToggle(task)}
        disabled={busy}
      >
        <span className="check-box" aria-hidden="true">
          <Check size={14} strokeWidth={3} />
        </span>
      </button>

      <div className="task-content">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
          {task.due_date && (
            <span className={`badge due${overdue ? ' overdue' : ''}`}>
              <CalendarDays size={12} aria-hidden="true" />
              {formatDue(task.due_date, today)}
              {overdue && ' · atrasada'}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => onEdit(task)}
          disabled={busy}
          aria-label={`Editar “${task.title}”`}
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          onClick={() => onDelete(task)}
          disabled={busy}
          aria-label={`Excluir “${task.title}”`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </li>
  )
}
