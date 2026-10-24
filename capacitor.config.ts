import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.tarefas.todolist',
  appName: 'Tarefas',
  webDir: 'dist',
  android: {
    // Permite apenas conteúdo HTTPS dentro do app (o app usa só arquivos locais).
    allowMixedContent: false,
  },
}

export default config
