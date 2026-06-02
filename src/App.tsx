import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from './components/Layout'
import Index from './pages/Index'
import Producers from './pages/Producers'
import ProducerDetail from './pages/ProducerDetail'
import FarmDetail from './pages/FarmDetail'
import AreaDetail from './pages/AreaDetail'
import CampaignDetail from './pages/CampaignDetail'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/produtores" element={<Producers />} />
          <Route path="/produtores/:id" element={<ProducerDetail />} />
          <Route path="/fazendas/:id" element={<FarmDetail />} />
          <Route path="/areas/:id" element={<AreaDetail />} />
          <Route path="/campanhas/:id" element={<CampaignDetail />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
