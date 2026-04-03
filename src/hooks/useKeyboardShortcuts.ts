import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { TaskCategory } from '@/types'

/**
 * Global keyboard shortcuts:
 * 1-5: Navigate between views
 * D: Toggle dark mode
 * Cmd+K / Ctrl+K: Command palette (handled in CommandPalette)
 */
export function useKeyboardShortcuts() {
  const { setCurrentCategory, toggleDarkMode } = useAppStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Don't trigger when modifier keys are held (except for Cmd+K which is in CommandPalette)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const categoryMap: Record<string, TaskCategory> = {
        '1': 'today',
        '2': 'tasks',
        '3': 'ideas',
        '4': 'recurring',
        '5': 'analytics',
      }

      if (e.key in categoryMap) {
        e.preventDefault()
        setCurrentCategory(categoryMap[e.key])
        return
      }

      if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        e.preventDefault()
        toggleDarkMode()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCurrentCategory, toggleDarkMode])
}
