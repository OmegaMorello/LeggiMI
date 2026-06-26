import { useEffect, useState } from 'react'
import { getHealth } from './services/api'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    getHealth()
      .then((data) => setStatus(data.ok ? 'backend OK' : 'backend KO'))
      .catch(() => setStatus('backend unreachable'))
  }, [])

  return <h1>Library — {status}</h1>
}

export default App