import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@/hooks/use-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Map, MapPin } from 'lucide-react'

export default function Index() {
  const { setBreadcrumbs } = useBreadcrumbs()
  const { organization } = useAuth()

  useEffect(() => {
    setBreadcrumbs([])
  }, [setBreadcrumbs])

  const { data: stats = { producers: 0, farms: 0, areas: 0 } } = useQuery(
    ['dashboard-stats', organization?.id || ''],
    async () => {
      if (!organization) return { producers: 0, farms: 0, areas: 0 }
      const [pRes, fRes, aRes] = await Promise.all([
        supabase
          .from('producers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active'),
        supabase
          .from('farms')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active'),
        supabase
          .from('areas')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'active'),
      ])
      return { producers: pRes.count || 0, farms: fRes.count || 0, areas: aRes.count || 0 }
    },
    { enabled: !!organization },
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao SIM Solo MVP. Acesse rapidamente os cadastros principais.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/produtores" className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Produtores Ativos</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.producers}</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/fazendas" className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fazendas</CardTitle>
              <Map className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.farms}</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/areas" className="group">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Áreas/Talhões</CardTitle>
              <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.areas}</div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
