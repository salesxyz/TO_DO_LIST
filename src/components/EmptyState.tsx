import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  text?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, text, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
