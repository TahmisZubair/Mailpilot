'use client'

import { useState, useEffect } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaSync, FaEnvelope, FaDownload } from 'react-icons/fa'
import { BASE_URL } from '../config'

interface SimpleBatchStatusProps {
  batchId: string | null;
}

export default function SimpleBatchStatus({ batchId }: SimpleBatchStatusProps) {
  const [batchData, setBatchData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchBatchStatus = async () => {
    if (!batchId) return;
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${BASE_URL}/api/batch-status/${batchId}`)
      const data = await response.json()
      setBatchData(data)
      console.log('Batch status fetched:', data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching batch status:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (batchId) {
      fetchBatchStatus()
      
      const interval = setInterval(fetchBatchStatus, 3000)
      
      return () => clearInterval(interval)
    }
  }, [batchId])
  
  if (!batchId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <FaEnvelope className="mx-auto text-4xl text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Active Email Campaign
        </h3>
        <p className="text-gray-600">
          Upload contacts and compose your email to start sending
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Email Campaign Status</h2>
          <p className="text-sm text-gray-500">Batch ID: {batchId.slice(-8)}</p>
        </div>
        <button 
          onClick={fetchBatchStatus}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1"
          disabled={loading}
        >
          <FaSync className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {batchData && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{batchData.total || 0}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{batchData.successful || 0}</div>
              <div className="text-sm text-green-700">Successful</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{batchData.failed || 0}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{batchData.progressPercentage || 0}%</div>
              <div className="text-sm text-purple-700">Progress</div>
            </div>
          </div>
          
          {batchData.results && batchData.results.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Email Results:</h3>
                <button
                  onClick={() => {
                    const emailData = localStorage.getItem('lastEmailContent');
                    let emailSubject = '';
                    let emailBody = '';
                    
                    try {
                      if (emailData) {
                        const parsedData = JSON.parse(emailData);
                        emailSubject = parsedData.subject || '';
                        emailBody = parsedData.text || '';
                      }
                    } catch (e) {
                      console.error('Error parsing email content:', e);
                    }
                    
                    const csvContent = [
                      ['Email Address', 'Status', 'Message ID', 'Timestamp', 'Email Subject', 'Email Body'].join(','),
                      ...batchData.results.map((result: any) => [
                        `"${result.email}"`,
                        result.status === 'sent' ? 'Successfully Sent' : 'Failed',
                        `"${result.messageId || 'N/A'}"`,
                        `"${new Date().toLocaleString()}"`,
                        `"${emailSubject.replace(/"/g, '""')}"`,
                        `"${emailBody.replace(/"/g, '""')}"`
                      ].join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `email-report-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <FaDownload className="mr-1" /> Download Report
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchData.results.map((result: any, index: number) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="py-2 text-sm">{result.email}</td>
                        <td className="py-2">
                          {result.status === 'sent' ? (
                            <span className="flex items-center text-green-600 text-sm">
                              <FaCheckCircle className="mr-1" /> Sent
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 text-sm">
                              <FaExclamationCircle className="mr-1" /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Campaign actions */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <FaEnvelope />
                  <span>Send Another Campaign</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}