'use client'

import { useState } from 'react'
import { FaUser, FaEnvelope, FaEdit, FaPhone, FaLinkedin, FaPaperPlane, FaEye, FaUsers, FaLightbulb } from 'react-icons/fa'

interface EmailComposerProps {
  excelData: any[]
  onSendEmails: (emailData: any) => void
  userEmail: string
}

export default function EmailComposer({ excelData, onSendEmails, userEmail }: EmailComposerProps) {
  const [subject, setSubject] = useState('')
  const [text, setText] = useState('')
  const [user, setUser] = useState('')
  const [contact, setContact] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !text.trim() || !user.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsSending(true)
    
    try {
      await onSendEmails({
        fromEmail: userEmail,
        user,
        subject,
        text,
        contact,
        linkedIn,
        xlsxData: JSON.stringify(excelData)
      })
    } catch (error) {
      console.error('Error sending emails:', error)
    } finally {
      setIsSending(false)
    }
  }

  const getPreviewContent = () => {
    const sampleRecipient = excelData[0] || { name: 'John Doe', email: 'john@example.com' }
    const recipientName = sampleRecipient.name || sampleRecipient.Name || 'John Doe'
    
    return `Dear ${recipientName},

${text}

Best Regards,
${user}
${contact ? `Contact: ${contact}` : ''}
${linkedIn ? `LinkedIn: ${linkedIn}` : ''}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Name */}
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
                <FaUser className="inline mr-2 text-gray-400" />
                Your Name *
              </label>
              <input
                type="text"
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2 text-gray-400" />
                Email Subject *
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
                placeholder="Enter a compelling subject line"
                required
              />
            </div>

            {/* Email Message */}
            <div>
              <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                <FaEdit className="inline mr-2 text-gray-400" />
                Email Message *
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="input-field resize-none"
                placeholder="Write your personalized message here. Each recipient will receive a customized version with their name."
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Your message will be automatically personalized for each recipient
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                <FaPhone className="inline mr-2 text-gray-400" />
                Contact Information
              </label>
              <input
                type="text"
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input-field"
                placeholder="Phone, email, or other contact details"
              />
            </div>

            {/* LinkedIn Profile */}
            <div>
              <label htmlFor="linkedIn" className="block text-sm font-medium text-gray-700 mb-2">
                <FaLinkedin className="inline mr-2 text-gray-400" />
                LinkedIn Profile
              </label>
              <input
                type="url"
                id="linkedIn"
                value={linkedIn}
                onChange={(e) => setLinkedIn(e.target.value)}
                className="input-field"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isSending || excelData.length === 0}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending Emails...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Send to {excelData.length} Recipients</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          {/* Recipients Summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaUsers className="mr-2 text-blue-600" />
                Recipients Summary
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {excelData.length} contacts
              </span>
            </div>
            
            {excelData.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Your email will be sent to:
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {excelData.slice(0, 5).map((contact, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="font-medium">{contact.name || contact.Name || 'Unknown'}</span>
                      <span className="text-gray-500">({contact.email})</span>
                    </div>
                  ))}
                  {excelData.length > 5 && (
                    <div className="text-sm text-gray-500 italic">
                      ...and {excelData.length - 5} more recipients
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No contacts uploaded yet
              </div>
            )}
          </div>

          {/* Email Preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaEye className="mr-2 text-green-600" />
                Email Preview
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>

            {showPreview && (text || subject) ? (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Subject:</div>
                  <div className="font-medium">{subject || 'No subject'}</div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-600 mb-2">Message:</div>
                  <div className="whitespace-pre-wrap bg-white p-3 rounded border">
                    {getPreviewContent()}
                  </div>
                </div>
              </div>
            ) : showPreview ? (
              <div className="text-center text-gray-500 py-8">
                Fill in the subject and message to see preview
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Click "Show Preview" to see how your email will look
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <FaLightbulb className="mr-2" />
              Email Tips
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep your subject line clear and engaging</li>
              <li>• Personalization happens automatically</li>
              <li>• Include contact info for better responses</li>
              <li>• Test with a small group first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}