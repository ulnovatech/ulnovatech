import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold">UlnovaTech</Link>
            <Link to="/companies" className="text-sm text-gray-600">Companies</Link>
            <Link to="/import" className="text-sm text-gray-600">Import</Link>
            <Link to="/analytics" className="text-sm text-gray-600">Analytics</Link>
          </div>
          <div className="text-sm text-gray-500">Local Dev</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
