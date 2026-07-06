import { Outlet } from 'react-router-dom'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'

export default function App(){
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
