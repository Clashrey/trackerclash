import React, { useEffect, useRef } from 'react'
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
  const dataLoaded = useRef(false)

  // Загружаем данные один раз когда userId появляется
  useEffect(() => {
    if (userId && !dataLoaded.current) {
      console.log('🔍 App - loading data for userId:', userId)
      dataLoaded.current = true
      loadAllData()
    }
  }, [userId, loadAllData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Layout />
}

export default App

