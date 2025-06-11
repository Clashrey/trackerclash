import React, { useState } from 'react'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Введите имя пользователя и пароль')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Упрощенная авторизация без Supabase Auth
      // Генерируем уникальный ID пользователя на основе username
      const userId = btoa(username.trim()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
      
      const user = {
        id: userId,
        username: username.trim(),
        created_at: new Date().toISOString()
      }

      // Сохраняем пользователя в localStorage
      localStorage.setItem('current_user', JSON.stringify(user))
      localStorage.setItem('user_password', password) // Для демо-целей
      
      // Перезагружаем страницу для обновления состояния
      window.location.reload()

    } catch (err) {
      setError('Произошла ошибка: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            📋 Трекер задач
          </h2>
          <h3 className="mt-2 text-center text-xl text-gray-600">
            {isSignUp ? 'Создать аккаунт' : 'Войти в систему'}
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isSignUp ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Введите имя пользователя"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Введите пароль"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner /> : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
            </button>
          </div>
        </form>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          Демо-версия: данные сохраняются локально в браузере
        </div>
      </div>
    </div>
  )
}

