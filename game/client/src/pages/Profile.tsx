import { useEffect, useState } from 'react'
import { fetchProfile, updateProfile } from '../api'
import { useParams } from 'react-router-dom'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    fetchProfile(username)
      .then(setProfile)
      .catch(e => setError(e.message))
  }, [username])

  const save = async () => {
    if (!username) return
    try {
      const updated = await updateProfile(username, profile)
      setProfile(updated)
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (!profile) return <p>Loading...</p>

  return (
    <div>
      <h2>Profile: {username}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={save}>Save</button>
    </div>
  )
}
