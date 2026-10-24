import { CalendarDays, CircleCheck, Circle, ListTodo, type LucideIcon } from 'lucide-react'
import type { View } from '../utils/tasks'

interface Props {
  view: View
  counts: Record<View, number>
  onChange: (view: View) => void
}

const ITEMS: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'today', label: 'Hoje', icon: CalendarDays },
  { view: 'all', label: 'Todas', icon: ListTodo },
  { view: 'pending', label: 'Pendentes', icon: Circle },
  { view: 'completed', label: 'Concluídas', icon: CircleCheck },
]

/** Sidebar fixa no desktop e barra inferior no celular (a diferença é só CSS). */
export default function Sidebar({ view, counts, onChange }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <CircleCheck size={16} strokeWidth={2.5} />
        </span>
        Tarefas
      </div>
      <nav aria-label="Seções">
        <ul>
          {ITEMS.map(({ view: itemView, label, icon: Icon }) => (
            <li key={itemView}>
              <button
                type="button"
                className="nav-item"
                aria-current={view === itemView ? 'page' : undefined}
                onClick={() => onChange(itemView)}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="nav-label">{label}</span>
                <span className="nav-count">{counts[itemView]}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
