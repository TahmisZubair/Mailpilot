'use client'

import React from 'react'
import { FaCheckCircle, FaExclamationCircle, FaClock, FaChartLine, FaEnvelope, FaUsers, FaDownload } from 'react-icons/fa'

interface BatchState {
  batchId: string | null
  status: 'idle' | 'processing' | 'completed' | 'failed'
  isLoading: boolean
  progress: number
  results?: Array<{
    email: string
    status: 'sent' | 'failed'
    messageId?: string
    error?: string
  }>
}

interface EmailStatusDisplayProps {
  batchState: BatchState
  statusMessage: string
}

const EmailStatusDisplay: React.FC<EmailStatusDisplayProps> = ({ batchState, statusMessage }) => {
  const { status, progress, results = [] } = batchState || { status: 'idle', progress: 0, results: [] }
  
  console.log('EmailStatusDisplay - batchState:', batchState)
  console.log('EmailStatusDisplay - results:', results)

  const successCount = results.filter(r => r.status === 'sent').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const totalCount = results.length

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <FaClock className="text-blue-600 animate-pulse" />
      case 'completed':
        return <FaCheckCircle className="text-green-600" />
      case 'failed':
        return <FaExclamationCircle className="text-red-600" />
      default:
        return <FaEnvelope className="text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    if (status === 'processing') {
      return 'Sending Emails...'
    } else if (status === 'completed') {
      if (successCount === totalCount && totalCount > 0) {
        return 'All Emails Sent Successfully'
      } else if (successCount > 0) {
        return 'Campaign Completed with Some Failures'
      } else {
        return 'Campaign Failed - No Emails Sent'
      }
    } else if (status === 'failed') {
      return 'Something Went Wrong'
    } else {
      return 'Ready to Send Emails'
    }
  }

  const downloadReport = () => {
    if (results.length === 0) return

    const csvContent = [
      ['Email Address', 'Delivery Status', 'Message ID', 'Error Details', 'Timestamp', 'Campaign ID'].join(','),
      ...results.map(result => [
        `"${result.email}"`,
        result.status === 'sent' ? 'Successfully Sent' : 'Failed',
        `"${result.messageId || 'N/A'}"`,
        `"${result.error || 'None'}"`,
        `"${new Date().toLocaleString()}"`,
        `"${batchState?.batchId || 'Unknown'}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `email-campaign-report-${timestamp}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getStatusIcon()}</div>
            <div>
              <h3 className={`text-xl font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </h3>
              {statusMessage && (
                <p className="text-gray-600 mt-1">{statusMessage}</p>
              )}
            </div>
          </div>
          {batchState?.batchId && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Batch ID</div>
              <div className="text-xs font-mono text-gray-700">
                {batchState.batchId.slice(-8)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'processing' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {totalCount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-700">Sent Successfully</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-blue-700">Total Emails</div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaChartLine className="mr-2 text-blue-600" />
              Detailed Results
            </h4>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {successCount}/{totalCount} successful
              </div>
              <button
                onClick={downloadReport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
              >
                <FaDownload />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message ID / Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {result.status === 'sent' ? (
                          <>
                            <FaCheckCircle className="text-green-500 mr-2" />
                            <span className="text-green-700 font-medium">Sent</span>
                          </>
                        ) : (
                          <>
                            <FaExclamationCircle className="text-red-500 mr-2" />
                            <span className="text-red-700 font-medium">Failed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {result.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.status === 'sent' ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {result.messageId?.slice(-12) || 'Sent'}
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {result.error || 'Unknown error'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Completed - Show Actions */}
      {(status === 'completed' || status === 'failed') && totalCount > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-6">
            {successCount === totalCount ? (
              <FaCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
            ) : successCount > 0 ? (
              <FaExclamationCircle className="mx-auto text-5xl text-yellow-500 mb-4" />
            ) : (
              <FaExclamationCircle className="mx-auto text-5xl text-red-500 mb-4" />
            )}
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {successCount === totalCount ? 'Campaign Completed Successfully!' : 
               successCount > 0 ? 'Campaign Completed with Mixed Results' : 
               'Campaign Failed'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {successCount === totalCount ? `All ${totalCount} emails were sent successfully.` :
               successCount > 0 ? `${successCount} out of ${totalCount} emails were sent successfully.` :
               `None of the ${totalCount} emails could be sent. Please check your configuration.`}
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={downloadReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FaDownload />
              <span>Download Detailed Report</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FaEnvelope />
              <span>Send Another Campaign</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {status === 'idle' && totalCount === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FaUsers className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Send Your Email Campaign
          </h3>
          <p className="text-gray-600">
            Upload contacts and compose your email to start sending
          </p>
        </div>
      )}
    </div>
  )
}

export default EmailStatusDisplay