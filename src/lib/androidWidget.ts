import { Capacitor, registerPlugin } from '@capacitor/core'

interface SalienceWidgetPlugin {
  update(options: {
    quote: string
    author: string
    status: string
    upToDate: boolean
  }): Promise<void>
}

const SalienceWidget = registerPlugin<SalienceWidgetPlugin>('SalienceWidget')

export const updateSalienceWidget = async (options: {
  quote?: string
  author?: string
  status: string
  upToDate: boolean
}) => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await SalienceWidget.update({
      quote: options.quote ?? 'One entry is enough for today.',
      author: options.author ?? 'Salience',
      status: options.status,
      upToDate: options.upToDate,
    })
  } catch {
    // Widget support is best-effort; app tracking must keep working if Android rejects an update.
  }
}
