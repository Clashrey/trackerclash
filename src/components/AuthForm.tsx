import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Copy, Eye, EyeOff, Plus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { supabase, generateApiKey, validateApiKey } from '@/lib/supabase'
import { transitions } from '@/lib/animations'

// Instead of window.location.reload(), we set auth state directly
function useLoginCallback() {
  return async (apiKeyValue: string): Promise<{ success: boolean; error?: string }> => {
    if (!validateApiKey(apiKeyValue)) {
      return { success: false, error: 'Неверный формат API-ключа. Ключ должен начинаться с "tk_"' }
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('api_key', apiKeyValue)
        .single()

      if (error || !user) {
        return { success: false, error: 'API-ключ не найден или недействителен' }
      }

      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('id', user.id)

      localStorage.setItem('tracker_api_key', apiKeyValue)

      // Trigger re-auth by reloading — this is the simplest correct approach
      // since AuthProvider reads from localStorage on mount
      window.location.reload()

      return { success: true }
    } catch (err) {
      return { success: false, error: 'Ошибка при авторизации: ' + (err as Error).message }
    }
  }
}

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register' | 'generated'>('login')
  const [apiKey, setApiKey] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const loginWithKey = useLoginCallback()

  const handleGenerateKey = async () => {
    setLoading(true)
    setError('')

    try {
      const newApiKey = generateApiKey()
      const userId = crypto.randomUUID()

      const { error } = await supabase
        .from('users')
        .insert([{ user_id: userId, api_key: newApiKey, name: 'Пользователь' }])
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setError('Попробуйте ещё раз — ключ уже существует')
          return
        }
        throw error
      }

      setGeneratedKey(newApiKey)
      setMode('generated')
    } catch (err) {
      setError('Ошибка при создании ключа: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const result = await loginWithKey(apiKey)
    if (!result.success) {
      setError(result.error || 'Неизвестная ошибка')
      setLoading(false)
    }
    // If success, page will reload — no need to setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && apiKey) {
      handleLogin()
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
    }
  }

  const continueToLogin = () => {
    setApiKey(generatedKey)
    setMode('login')
    setGeneratedKey('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.slow}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-10)] flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Трекер задач</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="mt-2 text-sm text-[var(--color-text-secondary)]"
            >
              {mode === 'generated'
                ? 'Сохраните ключ для входа'
                : mode === 'login'
                  ? 'Войдите с помощью API-ключа'
                  : 'Получите новый ключ'
              }
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={transitions.smooth}
              className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-[var(--color-danger-10)] border border-[var(--color-danger-20)]"
            >
              <AlertCircle size={16} className="text-[var(--color-danger)] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[var(--color-danger)]">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-primary)] shadow-sm p-6">
          <AnimatePresence mode="wait">
            {mode === 'generated' ? (
              <motion.div
                key="generated"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={transitions.smooth}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Ваш API-ключ
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={generatedKey}
                      readOnly
                      className="w-full px-3 py-3 pr-20 border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                        aria-label={showKey ? 'Скрыть ключ' : 'Показать ключ'}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(generatedKey)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                        aria-label="Скопировать ключ"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs text-[var(--color-success)] mt-1.5"
                      >
                        <CheckCircle2 size={12} /> Скопировано
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning-20)]">
                  <AlertCircle size={14} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <strong>Важно:</strong> Сохраните этот ключ! Он потребуется для входа.
                  </p>
                </div>

                <div className="space-y-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={continueToLogin}
                    className="w-full py-3 text-sm font-medium text-white bg-[var(--color-accent)] rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    Войти с этим ключом
                  </motion.button>
                  <button
                    onClick={() => { setMode('login'); setGeneratedKey(''); setApiKey('') }}
                    className="w-full py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    У меня есть другой ключ
                  </button>
                </div>
              </motion.div>

            ) : mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={transitions.smooth}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="apikey" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    API-ключ
                  </label>
                  <div className="relative">
                    <input
                      id="apikey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="tk_..."
                      className="w-full px-3 py-3 pl-10 border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-30)] focus:border-[var(--color-accent)] font-mono text-sm transition-all"
                      disabled={loading}
                    />
                    <Key className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={loading || !apiKey}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-[var(--color-accent)] rounded-xl hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <LogIn size={16} />
                      Войти
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-sm text-[var(--color-accent)] hover:underline"
                  >
                    Нет ключа? Получить новый
                  </button>
                </div>
              </motion.div>

            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={transitions.smooth}
                className="space-y-5"
              >
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-accent-5)] border border-[var(--color-accent-20)]">
                  <Key size={14} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Нажмите кнопку ниже, чтобы получить уникальный API-ключ для доступа к вашим задачам.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateKey}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-[var(--color-success)] rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <>
                      <Plus size={16} />
                      Создать новый ключ
                    </>
                  )}
                </motion.button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-[var(--color-accent)] hover:underline"
                  >
                    Уже есть ключ? Войти
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-6">
          Ваши данные надёжно сохраняются в облаке
        </p>
      </motion.div>
    </div>
  )
}
