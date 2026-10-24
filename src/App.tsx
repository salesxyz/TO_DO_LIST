import { useEffect, useState } from 'react'
import TasksPage from './pages/TasksPage'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  // O script em index.html já definiu data-theme com a preferência salva (ou a do sistema).
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // armazenamento indisponível (modo privado, etc.): o tema só não será lembrado
    }
  }, [theme])

  return <TasksPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
}
