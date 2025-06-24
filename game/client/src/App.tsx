import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Battle from './pages/Battle'

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '')

  const handleLogin = (user: string) => {
    setUsername(user)
    localStorage.setItem('username', user)
  }

  return (
    <BrowserRouter>
      <Routes>
        {!username ? (
          <>
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </>
        ) : (
          <>
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/" element={<Battle username={username} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
