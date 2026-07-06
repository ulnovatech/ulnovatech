import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-transparent flex items-center justify-between px-6 border-b border-gray-800">
      <div className="flex items-center gap-4">
        <button type="button" className="p-2 rounded-md hover:bg-gray-800/40">☰</button>
        <div className="text-sm text-muted">
          Welcome back — <span className="text-white">{user?.username || 'Team'}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => logout()}
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-brand hover:text-white"
        >
          Sign out
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-purple to-accent-cyan flex items-center justify-center text-xs">
          {(user?.username || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
