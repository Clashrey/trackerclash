import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAppStore } from '@/store'

interface User {
  id: string
  username: string
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
    const currentUser = localStorage.getItem('current_user')
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser)
        setUser(userData)
        setUserId(userData.id) // Устанавливаем userId в store
      } catch (error) {
        localStorage.removeItem('current_user')
      }
    }
    setLoading(false)
  }, [setUserId])

  const signOut = () => {
    localStorage.removeItem('current_user')
    localStorage.removeItem('user_password')
    setUser(null)
    setUserId(null) // Очищаем userId в store
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

