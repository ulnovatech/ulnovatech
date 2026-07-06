import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import CompanyList from './pages/CompanyList';
import CompanyDetail from './pages/CompanyDetail';
import ImportCSV from './pages/ImportCSV';
import Analytics from './pages/Analytics';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="import" element={<ImportCSV />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
