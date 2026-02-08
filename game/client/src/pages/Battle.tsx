import { useState } from 'react'
import { battle, fetchProfile } from '../api'

interface Props {
  username: string
}

export default function Battle({ username }: Props) {
  const [log, setLog] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const handleBattle = async () => {
    try {
      const result = await battle()
      setLog(result.log)
      const profile = await fetchProfile(username)
      setStats(profile)
    } catch (e: any) {
      setLog(e.message)
    }
  }

  return (
    <div>
      <button onClick={handleBattle}>Battle!</button>
      {log && <pre>{log}</pre>}
      {stats && (
        <div>
          <h3>Updated Stats</h3>
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
