import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/use-auth'
import { BreadcrumbProvider } from '@/hooks/use-breadcrumbs'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'

import Index from '@/pages/Index'
import Producers from '@/pages/Producers'
import ProducerDetail from '@/pages/ProducerDetail'
import Farms from '@/pages/Farms'
import FarmDetail from '@/pages/FarmDetail'
import Areas from '@/pages/Areas'
import AreaDetail from '@/pages/AreaDetail'
import Imports from '@/pages/Imports'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BreadcrumbProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/produtores" element={<Producers />} />
                <Route path="/produtores/:id" element={<ProducerDetail />} />
                <Route path="/fazendas" element={<Farms />} />
                <Route path="/fazendas/:id" element={<FarmDetail />} />
                <Route path="/areas" element={<Areas />} />
                <Route path="/areas/:id" element={<AreaDetail />} />
                <Route path="/importacoes" element={<Imports />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </BreadcrumbProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
