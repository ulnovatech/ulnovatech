import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RouteScroll from './components/layout/RouteScroll'
import ServiceInquiryModal from './components/forms/ServiceInquiryModal'
import { serviceInquiries } from './components/forms/serviceInquiries'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import PricesPage from './pages/PricesPage'
import TrackOrderPage from './pages/TrackOrderPage'

export default function App() {
  const [activeModal, setActiveModal] = useState(null)
  const modalConfig = serviceInquiries.find((s) => s.id === activeModal)

  return (
    <BrowserRouter>
      <RouteScroll />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage onOpenInquiry={(id) => (id ? setActiveModal(id) : null)} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
        </Routes>

        {modalConfig && (
          <ServiceInquiryModal
            open={Boolean(modalConfig)}
            onClose={() => setActiveModal(null)}
            title={modalConfig.title}
            description={modalConfig.description}
            endpoint={modalConfig.endpoint}
          />
        )}
      </Layout>
    </BrowserRouter>
  )
}
