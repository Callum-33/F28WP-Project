import { useState, useEffect } from 'react'
import { api } from './utils/api'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Test backend connection
    const fetchData = async () => {
      try {
        const response = await api.get('/')
        setMessage(response.data.message || 'Connected to backend!')
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>F28WP Project</h1>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
      </header>
    </div>
  )
}

export default App
