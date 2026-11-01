'use client'

import { useRef } from 'react'
import { FaUpload, FaFileExcel, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTrash } from 'react-icons/fa'

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isUploading: boolean
  uploadError: string | null
  uploadedData: any[]
}

export default function FileUploader({ onFileUpload, isUploading, uploadError, uploadedData }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isUploading
            ? 'border-blue-300 bg-blue-50'
            : (uploadedData?.length || 0) > 0
            ? 'border-green-300 bg-green-50'
            : uploadError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        {isUploading ? (
          <div className="space-y-4">
            <FaSpinner className="mx-auto text-4xl text-blue-600 animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Uploading File...</h3>
              <p className="text-blue-700">Please wait while we process your file</p>
            </div>
          </div>
        ) : (uploadedData?.length || 0) > 0 ? (
          <div className="space-y-4">
            <FaCheckCircle className="mx-auto text-4xl text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">File Uploaded Successfully!</h3>
              <p className="text-green-700">
                Found {uploadedData?.length || 0} contacts in your file
              </p>
              <button
                onClick={clearFile}
                className="mt-3 inline-flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <FaTrash />
                <span>Upload Different File</span>
              </button>
            </div>
          </div>
        ) : uploadError ? (
          <div className="space-y-4">
            <FaExclamationTriangle className="mx-auto text-4xl text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Upload Failed</h3>
              <p className="text-red-700">{uploadError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FaUpload className="mx-auto text-4xl text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Your Contact List</h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your Excel file here, or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                <FaFileExcel className="mr-2" />
                Choose File
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File Requirements */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">File Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Supported formats: .xlsx, .xls, .csv</li>
          <li>• Required column: <strong>email</strong> (with valid email addresses)</li>
          <li>• Optional column: <strong>name</strong> (for personalization)</li>
          <li>• Maximum file size: 10MB</li>
        </ul>
      </div>

      {/* Sample Data Preview */}
      {(uploadedData?.length || 0) > 0 && (
        <div className="mt-6 card">
          <h4 className="font-medium text-gray-900 mb-3">Data Preview:</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(uploadedData || []).slice(0, 5).map((contact, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {contact.name || contact.Name || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {contact.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(uploadedData?.length || 0) > 5 && (
              <div className="text-center py-3 text-sm text-gray-500">
                ...and {(uploadedData?.length || 0) - 5} more contacts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}