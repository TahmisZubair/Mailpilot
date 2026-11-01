'use client'

import { useState, useEffect } from 'react'
import { BASE_URL } from '../config'

export default function TestQueueStats() {
  const [queueStats, setQueueStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchQueueStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${BASE_URL}/api/queue-stats`)
      const data = await response.json()
      setQueueStats(data)
      console.log('Queue stats fetched:', data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching queue stats:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchQueueStats()
    
    // Poll every 5 seconds
    const interval = setInterval(fetchQueueStats, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Queue Status (Live)</h2>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {queueStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{queueStats.waiting}</div>
            <div className="text-sm text-blue-700">Waiting</div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{queueStats.active}</div>
            <div className="text-sm text-yellow-700">Active</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{queueStats.total}</div>
            <div className="text-sm text-purple-700">Total</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-right">
        <button 
          onClick={fetchQueueStats}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  )
}