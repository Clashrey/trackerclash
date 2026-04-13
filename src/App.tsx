import React, { useEffect, useRef, useState } from 'react'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import { useDatabase } from './hooks/useDatabase'
import { useAppStore } from './store'
import { initSupabaseUserContext } from './lib/supabase'
import { AuthForm } from './components/AuthForm'
import { Layout } from './components/Layout'
import { CommandPalette } from './components/CommandPalette'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

// Привязываем userId из store к каждому запросу Supabase (для RLS через request.header.x-user-id)
initSupabaseUserContext(() => useAppStore.getState().userId)

function App() {
  const { user, loading } = useAuth()
  const { loadAllData } = useDatabase()
  const userId = useAppStore(state => state.userId)
  const isDarkMode = useAppStore(state => state.isDarkMode)

  const dataLoaded = useRef<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (userId && dataLoaded.current !== userId) {
      dataLoaded.current = userId
      setLoadError(null)
      loadAllData().catch((err) => {
        console.error('loadAllData failed:', err)
        setLoadError('Не удалось загрузить данные. Проверьте соединение и обновите страницу.')
      })
    }
  }, [userId, loadAllData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="bottom-center" richColors />
      </>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-[var(--color-danger)] mb-6 text-lg">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors font-medium"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Layout />
      <CommandPalette />
      <Toaster position="bottom-center" richColors />
    </>
  )
}

export default App
