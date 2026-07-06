import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-surface text-white">
      <Outlet />
      <BottomNav />
      <div className="h-20" aria-hidden />
    </div>
  )
}
