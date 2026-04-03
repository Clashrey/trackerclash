import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppStore } from '@/store'
import { supabase, validateApiKey } from '@/lib/supabase'

interface User {
  id: string
  user_id: string
  api_key: string
  name?: string
  username?: string
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
      const savedApiKey = localStorage.getItem('tracker_api_key')

      if (savedApiKey && validateApiKey(savedApiKey)) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('api_key', savedApiKey)
          .single()

        if (error || !userData) {
          localStorage.removeItem('tracker_api_key')
          setLoading(false)
          return
        }

        if (!userData.user_id) {
          const newUserId = crypto.randomUUID()
          await supabase
            .from('users')
            .update({ user_id: newUserId })
            .eq('id', userData.id)
          userData.user_id = newUserId
        }

        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', userData.id)

        const userObj: User = {
          id: userData.id,
          user_id: userData.user_id,
          api_key: userData.api_key!,
          name: userData.name || undefined,
          username: userData.name || 'Пользователь',
          created_at: userData.created_at
        }

        setUser(userObj)
        setUserId(userData.id)
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
    // Reset all store state
    useAppStore.getState().setTasks([])
    useAppStore.getState().setRecurringTasks([])
    useAppStore.getState().setTaskCompletions([])
    useAppStore.getState().setSubtasks([])
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
