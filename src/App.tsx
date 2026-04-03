import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useDatabase } from './hooks/useDatabase'
import { useAppStore } from './store'
import { AuthForm } from './components/AuthForm'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()
  const { loadAllData } = useDatabase()
  const userId = useAppStore(state => state.userId)
  const isDarkMode = useAppStore(state => state.isDarkMode)

  // FIX #9: Храним userId который был загружен — автосброс при смене пользователя
  const dataLoaded = useRef<string | null>(null)

  // FIX #5: Состояние ошибки загрузки
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // FIX #9: Перезагружаем при смене userId (не только при первом появлении)
  useEffect(() => {
    if (userId && dataLoaded.current !== userId) {
      dataLoaded.current = userId
      setLoadError(null)
      loadAllData().catch((err) => {
        console.error('❌ loadAllData failed:', err)
        setLoadError('Не удалось загрузить данные. Проверьте соединение и обновите страницу.')
      })
    }
  }, [userId, loadAllData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  // FIX #5: Показываем ошибку загрузки пользователю
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-6 text-lg">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  return <Layout />
}

export default App
