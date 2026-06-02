import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Map, ChevronRight, ArrowLeft } from 'lucide-react'
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

export default function ProducerDetail() {
  const { id } = useParams()
  const { setBreadcrumbs } = useBreadcrumbs()

  const { data: producer, isLoading: loadingProducer } = useQuery(
    ['producer', id || ''],
    async () => {
      const { data, error } = await supabase.from('producers').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    { enabled: !!id },
  )

  const { data: farms = [] } = useQuery(
    ['producer-farms', id || ''],
    async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('producer_id', id!)
        .eq('status', 'active')
      if (error) throw error
      return data || []
    },
    { enabled: !!id },
  )

  useEffect(() => {
    if (producer) {
      setBreadcrumbs([{ label: 'Produtores', url: '/produtores' }, { label: producer.name }])
    }
  }, [producer, setBreadcrumbs])

  if (loadingProducer || !producer)
    return <div className="p-12 text-center animate-pulse">Carregando produtor...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link to="/produtores">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{producer.name}</h1>
            <p className="text-muted-foreground mt-1 flex gap-2 flex-wrap">
              {producer.document && (
                <span className="bg-muted px-2 py-0.5 rounded text-sm">
                  Doc: {producer.document}
                </span>
              )}
              {producer.email && (
                <span className="bg-muted px-2 py-0.5 rounded text-sm">{producer.email}</span>
              )}
              {producer.phone && (
                <span className="bg-muted px-2 py-0.5 rounded text-sm">{producer.phone}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" /> Fazendas Vinculadas
          </CardTitle>
          <CardDescription>
            Gerencie as propriedades cadastradas para este produtor.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Nome da Propriedade</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Área Total</TableHead>
                <TableHead className="text-right pr-6 w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Nenhuma fazenda cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                farms.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{f.name}</TableCell>
                    <TableCell>{f.city ? `${f.city}/${f.state}` : '-'}</TableCell>
                    <TableCell>{f.total_area_ha ? `${f.total_area_ha} ha` : '-'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Link to={`/fazendas/${f.id}`}>
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
