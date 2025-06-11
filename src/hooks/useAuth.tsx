import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppStore } from '@/store'
import { supabase, validateApiKey } from '@/lib/supabase'

interface User {
  id: string
  user_id: string
  api_key: string
  name?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUserId } = useAppStore()

  useEffect(() => {
    checkAuth()
  }, [setUserId])

  const checkAuth = async () => {
    try {
      // Проверяем сохраненный API-ключ
      const savedApiKey = localStorage.getItem('tracker_api_key')
      
      if (savedApiKey && validateApiKey(savedApiKey)) {
        // Проверяем ключ в БД
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('api_key', savedApiKey)
          .single()

        if (error || !userData) {
          console.error('API key not found or invalid:', error)
          localStorage.removeItem('tracker_api_key')
          setLoading(false)
          return
        }

        // Обновляем последнюю активность
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userData.id)

        const userObj: User = {
          id: userData.id,
          user_id: userData.user_id,
          api_key: userData.api_key!,
          name: userData.name || undefined,
          created_at: userData.created_at
        }

        setUser(userObj)
        setUserId(userData.user_id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('tracker_api_key')
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem('tracker_api_key')
    setUser(null)
    setUserId(null)
    window.location.reload()
  }

  const value: AuthContextType = {
    user,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
