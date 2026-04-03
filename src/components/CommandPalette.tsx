import React, { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays, ListTodo, Lightbulb, Repeat, BarChart3,
  Search, Plus, Moon, Sun, ArrowRight
} from 'lucide-react'
import { useAppStore } from '@/store'
import { TaskCategory } from '@/types'
import { transitions } from '@/lib/animations'

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { setCurrentCategory, currentCategory, isDarkMode, toggleDarkMode } = useAppStore()

  // Toggle with Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const navigateTo = useCallback((category: TaskCategory) => {
    setCurrentCategory(category)
    setOpen(false)
  }, [setCurrentCategory])

  const handleToggleDarkMode = useCallback(() => {
    toggleDarkMode()
    setOpen(false)
  }, [toggleDarkMode])

  const navigationItems: { id: TaskCategory; label: string; icon: React.ReactNode; shortcut?: string }[] = [
    { id: 'today', label: 'Сегодня', icon: <CalendarDays size={16} />, shortcut: '1' },
    { id: 'tasks', label: 'Задачи', icon: <ListTodo size={16} />, shortcut: '2' },
    { id: 'ideas', label: 'Идеи', icon: <Lightbulb size={16} />, shortcut: '3' },
    { id: 'recurring', label: 'Регулярные', icon: <Repeat size={16} />, shortcut: '4' },
    { id: 'analytics', label: 'Аналитика', icon: <BarChart3 size={16} />, shortcut: '5' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={transitions.smooth}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-[90vw] max-w-lg z-50"
          >
            <Command
              className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] shadow-2xl overflow-hidden"
              label="Меню команд"
            >
              <div className="flex items-center gap-2 px-4 border-b border-[var(--color-border-secondary)]">
                <Search size={16} className="text-[var(--color-text-tertiary)]" />
                <Command.Input
                  placeholder="Поиск команд..."
                  className="w-full py-3 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-tertiary)]">
                  Ничего не найдено
                </Command.Empty>

                <Command.Group heading="Навигация" className="mb-2">
                  <p className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Навигация
                  </p>
                  {navigationItems.map(item => (
                    <Command.Item
                      key={item.id}
                      value={`перейти к ${item.label}`}
                      onSelect={() => navigateTo(item.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors
                        ${currentCategory === item.id
                          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                        }
                        data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-secondary)]">
                          {item.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Действия" className="mb-2">
                  <p className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Действия
                  </p>
                  <Command.Item
                    value="переключить тему темный светлый режим"
                    onSelect={handleToggleDarkMode}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)] transition-colors"
                  >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{isDarkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
                    <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-secondary)]">
                      D
                    </kbd>
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border-secondary)] text-[10px] text-[var(--color-text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] font-mono">↑↓</kbd>
                    навигация
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] font-mono">↵</kbd>
                    выбрать
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] font-mono">Esc</kbd>
                  закрыть
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
