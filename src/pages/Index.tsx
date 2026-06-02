import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Map, FlaskConical, Activity, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'

export default function Index() {
  const [stats, setStats] = useState({
    producers: 0,
    hectares: 0,
    activeCampaigns: 0,
    recentAnalyses: 0,
  })
  const [recent, setRecent] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const data = await api.getDashboardStats()
      setStats(data)
      const pts = await api.getRecentPoints()
      setRecent(pts)
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema de prontuário agronômico.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/produtores">
              <Plus className="w-4 h-4 mr-2" /> Novo Registro
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.producers}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Hectares</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats.hectares} <span className="text-lg font-normal text-muted-foreground">ha</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises Recentes</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.recentAnalyses}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Últimos Pontos Amostrados</CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Identificação do Ponto</TableHead>
                <TableHead>Campanha Associada</TableHead>
                <TableHead>Coordenadas (Lat, Lng)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade recente.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{r.name}</TableCell>
                    <TableCell>{new Date(r.campaignName).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
