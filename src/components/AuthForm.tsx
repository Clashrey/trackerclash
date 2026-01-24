import React, { useState } from 'react'
import { Key, Copy, Eye, EyeOff, Plus, LogIn } from 'lucide-react'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase, generateApiKey, validateApiKey } from '@/lib/supabase'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'generated'>('login')
  const [apiKey, setApiKey] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerateKey = async () => {
    setLoading(true)
    setError('')

    try {
      const newApiKey = generateApiKey()
      const userId = crypto.randomUUID()
      
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            user_id: userId,
            api_key: newApiKey,
            name: 'Пользователь'
          }
        ])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setError('Попробуйте еще раз - ключ уже существует')
          return
        }
        throw error
      }

      setGeneratedKey(newApiKey)
      setMode('generated')
    } catch (err) {
      setError('Ошибка при создании ключа: ' + (err as Error).message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!validateApiKey(apiKey)) {
      setError('Неверный формат API-ключа. Ключ должен начинаться с "tk_"')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      if (error || !user) {
        setError('API-ключ не найден или недействителен')
        return
      }

      // Обновляем последнюю активность
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id)

      // Сохраняем ключ
      localStorage.setItem('tracker_api_key', apiKey)
      
      // Перезагружаем страницу
      window.location.reload()

    } catch (err) {
      setError('Ошибка при авторизации: ' + (err as Error).message)
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

  const continueToLogin = () => {
    setApiKey(generatedKey)
    setMode('login')
    setGeneratedKey('')
  }

  // Экран с сгенерированным ключом
  if (mode === 'generated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Key className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Ваш ключ готов!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Сохраните этот ключ для входа в приложение
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API-ключ:
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={generatedKey}
                  readOnly
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              {copied && (
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">✅ Скопировано!</p>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                <strong>Важно:</strong> Сохраните этот ключ! Он потребуется для входа.
              </p>
            </div>

            <button
              onClick={continueToLogin}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Войти с этим ключом
            </button>

            <button
              onClick={() => {
                setMode('login')
                setGeneratedKey('')
                setApiKey('')
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              У меня есть другой ключ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Основная форма
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Key className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            📋 Трекер задач
          </h2>
          <h3 className="mt-2 text-xl text-gray-600 dark:text-gray-400">
            {mode === 'login'
              ? 'Войдите с помощью API-ключа'
              : 'Получите новый ключ'
            }
          </h3>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3">
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {mode === 'login' ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="apikey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Введите ваш API-ключ
              </label>
              <div className="relative">
                <input
                  id="apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="tk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  disabled={loading}
                />
                <Key className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                API-ключ начинается с <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">tk_</code>
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !apiKey}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner /> : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Войти
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium"
              >
                Нет ключа? Получить новый
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-4">
              <p className="text-blue-800 dark:text-blue-300 text-sm">
                Нажмите кнопку ниже, чтобы получить уникальный API-ключ для доступа к вашим задачам.
              </p>
            </div>

            <button
              onClick={handleGenerateKey}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner /> : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать новый ключ
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium"
              >
                Уже есть ключ? Войти
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Ваши данные надежно сохраняются в облаке
        </div>
      </div>
    </div>
  )
}
