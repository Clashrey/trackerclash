import React, { useState } from 'react'
import { Key, Copy, Eye, EyeOff, Plus, LogIn, User } from 'lucide-react'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase, generateApiKey, validateApiKey, setUserContext } from '@/lib/supabase'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [apiKey, setApiKey] = useState('')
  const [userName, setUserName] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleLogin = async () => {
    if (!validateApiKey(apiKey)) {
      setError('Неверный формат API-ключа. Ключ должен начинаться с "tk_"')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Временно устанавливаем контекст для поиска
      await setUserContext('temp')

      // Проверяем существование пользователя
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      if (error || !user) {
        setError('API-ключ не найден или недействителен')
        return
      }

      // Устанавливаем правильный контекст
      await setUserContext(user.user_id)

      // Обновляем последнюю активность
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id)

      // Сохраняем ключ
      localStorage.setItem('tracker_api_key', apiKey)
      
      // Перезагружаем страницу для обновления состояния
      window.location.reload()

    } catch (err) {
      setError('Ошибка при авторизации: ' + (err as Error).message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!userName.trim()) {
      setError('Введите имя пользователя')
      return
    }

    setLoading(true)
    setError('')

    try {
      const newApiKey = generateApiKey()
      const userId = crypto.randomUUID()
      
      // Устанавливаем контекст для нового пользователя
      await setUserContext(userId)

      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            user_id: userId,
            api_key: newApiKey,
            name: userName.trim()
          }
        ])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // unique violation
          setError('Попробуйте еще раз - ключ уже существует')
          return
        }
        throw error
      }

      setGeneratedKey(newApiKey)
      setApiKey(newApiKey)
    } catch (err) {
      setError('Ошибка при создании аккаунта: ' + (err as Error).message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Не удалось скопировать:', err)
    }
  }

  if (generatedKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Key className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900">
              Аккаунт создан!
            </h2>
            <p className="mt-2 text-gray-600">
              Сохраните ваш API-ключ в безопасном месте
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ваш API-ключ:
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={generatedKey}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-1">Скопировано!</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Важно:</strong> Сохраните этот ключ! Он потребуется для входа в приложение.
                Не передавайте его другим людям.
              </p>
            </div>

            <button
              onClick={() => {
                setGeneratedKey('')
                setMode('login')
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Продолжить к входу
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Key className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">
            📋 Трекер задач
          </h2>
          <h3 className="mt-2 text-xl text-gray-600">
            {mode === 'login' 
              ? 'Войдите с помощью API-ключа' 
              : 'Создайте новый аккаунт'
            }
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
                setApiKey('')
                setUserName('')
              }}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Вход
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Регистрация
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault()
          mode === 'login' ? handleLogin() : handleRegister()
        }}>
          {mode === 'register' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Имя пользователя
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Введите ваше имя"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div>
              <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 mb-1">
                API-ключ
              </label>
              <div className="relative">
                <input
                  id="apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="tk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  disabled={loading}
                />
                <Key className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                API-ключ начинается с <code className="bg-gray-100 px-1 rounded">tk_</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'login' && !apiKey) || (mode === 'register' && !userName)}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <LoadingSpinner />
            ) : mode === 'login' ? (
              'Войти'
            ) : (
              'Создать аккаунт'
            )}
          </button>
        </form>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          Ваши данные надежно сохраняются в облаке
        </div>
      </div>
    </div>
  )
}
