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
      console.log('🔍 checkAuth - API key from localStorage:', savedApiKey)
      
      if (savedApiKey && validateApiKey(savedApiKey)) {
        // Проверяем ключ в БД
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('api_key', savedApiKey)
          .single()

        console.log('🔍 User lookup result:', { userData, error })

        if (error || !userData) {
          console.error('❌ API key not found or invalid:', error)
          localStorage.removeItem('tracker_api_key')
          setLoading(false)
          return
        }

        // ✅ ИСПРАВЛЕНО: Проверяем что user_id существует
        if (!userData.user_id) {
          console.error('❌ User found but user_id is missing:', userData)
          // Создаем user_id если его нет
          const newUserId = crypto.randomUUID()
          await supabase
            .from('users')
            .update({ user_id: newUserId })
            .eq('id', userData.id)
          
          userData.user_id = newUserId
          console.log('✅ Created missing user_id:', newUserId)
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

        console.log('✅ Setting user object:', userObj)
        setUser(userObj)
        // ✅ Используем id вместо user_id для совместимости с существующими задачами
        console.log('✅ Setting userId in store:', userData.id)
        setUserId(userData.id)
      } else {
        console.log('🔍 No valid API key found')
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
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
