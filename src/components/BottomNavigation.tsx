import React from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ListTodo, Lightbulb, Repeat, BarChart3 } from 'lucide-react'
import { useAppStore } from '@/store'
import { TaskCategory } from '@/types'

interface NavItem {
  id: TaskCategory
  icon: React.ElementType
  label: string
}

const items: NavItem[] = [
  { id: 'today', icon: CalendarDays, label: 'Сегодня' },
  { id: 'tasks', icon: ListTodo, label: 'Задачи' },
  { id: 'ideas', icon: Lightbulb, label: 'Идеи' },
  { id: 'recurring', icon: Repeat, label: 'Регулярные' },
  { id: 'analytics', icon: BarChart3, label: 'Аналитика' },
]

export const BottomNavigation: React.FC = () => {
  const { currentCategory, setCurrentCategory } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-elevated)]/95 backdrop-blur-md border-t border-[var(--color-border-primary)] pb-safe sm:hidden"
      aria-label="Мобильная навигация"
    >
      <div className="flex justify-around items-center h-14">
        {items.map((item) => {
          const isActive = currentCategory === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentCategory(item.id)}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--color-accent)] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
