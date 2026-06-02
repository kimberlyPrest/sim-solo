import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'

import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Producers from '@/pages/Producers'
import Farms from '@/pages/Farms'
import Areas from '@/pages/Areas'
import Imports from '@/pages/Imports'
import NotFound from '@/pages/NotFound'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/produtores" element={<Producers />} />
          <Route path="/fazendas" element={<Farms />} />
          <Route path="/areas" element={<Areas />} />
          <Route path="/importacoes" element={<Imports />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
