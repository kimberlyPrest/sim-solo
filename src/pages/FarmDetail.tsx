import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, ChevronRight, ArrowLeft } from 'lucide-react'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useQuery } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default function FarmDetail() {
  const { id } = useParams()
  const { setBreadcrumbs } = useBreadcrumbs()

  const { data: farm, isLoading: loadingFarm } = useQuery(
    ['farm', id || ''],
    async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*, producers(id, name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    { enabled: !!id },
  )

  const { data: areas = [] } = useQuery(
    ['farm-areas', id || ''],
    async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('farm_id', id!)
        .eq('status', 'active')
      if (error) throw error
      return data || []
    },
    { enabled: !!id },
  )

  useEffect(() => {
    if (farm) {
      setBreadcrumbs([
        { label: 'Fazendas', url: '/fazendas' },
        { label: farm.producers?.name || 'Produtor', url: `/produtores/${farm.producer_id}` },
        { label: farm.name },
      ])
    }
  }, [farm, setBreadcrumbs])

  if (loadingFarm || !farm)
    return <div className="p-12 text-center animate-pulse">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <Button variant="outline" size="icon" asChild className="rounded-full">
          <Link to={`/produtores/${farm.producer_id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{farm.name}</h1>
          <p className="text-muted-foreground mt-1">
            Produtor:{' '}
            <Link to={`/produtores/${farm.producer_id}`} className="hover:underline">
              {farm.producers?.name}
            </Link>{' '}
            • {farm.total_area_ha ? `${farm.total_area_ha} ha` : 'Área não informada'}
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Áreas Mapeadas
          </CardTitle>
          <CardDescription>Talhões e divisões dentro desta propriedade.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Identificação</TableHead>
                <TableHead>Área Declarada</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Nenhum talhão registrado.
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="pl-6 font-medium">{a.name}</TableCell>
                    <TableCell>{a.total_area_ha ? `${a.total_area_ha} ha` : '-'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Link to={`/areas/${a.id}`}>
                          Acessar <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
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
