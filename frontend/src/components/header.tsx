'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaUser, FaSignOutAlt, FaUserPlus, FaTachometerAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const pathname = usePathname()
  const { isAuth, user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Mailpilot
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {isAuth ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <FaTachometerAlt className="text-sm" />
                  <span>Dashboard</span>
                </Link>
                
                <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-blue-600 text-xs" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {user?.userName || 'User'}
                    </span>
                  </div>
                  
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="text-sm" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <FaUser className="text-sm" />
                  <span>Login</span>
                </Link>
                
                <Link
                  href="/signup"
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaUserPlus className="text-sm" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
