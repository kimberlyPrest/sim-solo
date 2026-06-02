import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useQuery, useMutation } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seasonSchema } from '@/lib/validation/schemas'
import * as z from 'zod'
import { MapTab } from '@/features/areas/MapTab'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export default function AreaDetail() {
  const { id } = useParams()
  const { organization, role } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const canEdit = role === 'admin' || role === 'technician'

  const form = useForm<z.infer<typeof seasonSchema>>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { season_year: '', crop: '', expected_yield: 0 },
  })

  const { data: area, isLoading: loadingArea } = useQuery(
    ['area', id || ''],
    async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*, farms(id, name, producers(id, name))')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data
    },
    { enabled: !!id },
  )

  const { data: seasons = [], refetch: refetchSeasons } = useQuery(
    ['area-seasons', id || ''],
    async () => {
      const { data, error } = await supabase
        .from('area_seasons')
        .select('*')
        .eq('area_id', id!)
        .order('season_year', { ascending: false })
      if (error) throw error
      return data || []
    },
    { enabled: !!id },
  )

  useEffect(() => {
    if (area) {
      setBreadcrumbs([
        { label: 'Áreas', url: '/areas' },
        { label: area.farms?.name || 'Fazenda', url: `/fazendas/${area.farm_id}` },
        { label: area.name },
      ])
    }
  }, [area, setBreadcrumbs])

  const mutation = useMutation(
    async (values: z.infer<typeof seasonSchema>) => {
      const { error } = await supabase
        .from('area_seasons')
        .insert({ ...values, area_id: id!, organization_id: organization!.id })
      if (error) throw error
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Safra registrada.' })
        setOpen(false)
        refetchSeasons()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const onSubmit = (values: z.infer<typeof seasonSchema>) => mutation.mutateAsync(values)

  if (loadingArea || !area)
    return <div className="p-12 text-center animate-pulse">Carregando...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <Button variant="outline" size="icon" asChild className="rounded-full">
          <Link to={`/fazendas/${area.farm_id}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">{area.name}</h1>
          <p className="text-muted-foreground mt-1">
            Fazenda:{' '}
            <Link to={`/fazendas/${area.farm_id}`} className="hover:underline">
              {area.farms?.name}
            </Link>{' '}
            • Tamanho: {area.total_area_ha} ha
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-4 h-auto w-full gap-2 bg-transparent">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="seasons"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Safras
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Mapa
          </TabsTrigger>
          <TabsTrigger
            value="soil"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Análises de Solo
          </TabsTrigger>
          <TabsTrigger
            value="recs"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Recomendações
          </TabsTrigger>
          <TabsTrigger
            value="imports"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
          >
            Importações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Talhão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                <strong>Produtor:</strong>{' '}
                <Link
                  to={`/produtores/${area.farms?.producers?.id}`}
                  className="text-primary hover:underline"
                >
                  {area.farms?.producers?.name}
                </Link>
              </p>
              <p>
                <strong>Fazenda Pertencente:</strong>{' '}
                <Link to={`/fazendas/${area.farm_id}`} className="text-primary hover:underline">
                  {area.farms?.name}
                </Link>
              </p>
              <p>
                <strong>Área Declarada:</strong> {area.total_area_ha} hectares
              </p>
              <p>
                <strong>Observações:</strong> {area.notes || '-'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Safras Vinculadas</CardTitle>
                <CardDescription>Acompanhe o histórico de cultivo na área</CardDescription>
              </div>
              {canEdit && (
                <Button
                  onClick={() => {
                    form.reset({ season_year: '', crop: '', expected_yield: 0 })
                    setOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Nova Safra
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 border-t">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Ano-Safra</TableHead>
                    <TableHead>Cultivo</TableHead>
                    <TableHead>Produtividade Esperada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        Nenhuma safra cadastrada neste talhão.
                      </TableCell>
                    </TableRow>
                  ) : (
                    seasons.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium pl-6">{s.season_year}</TableCell>
                        <TableCell>{s.crop || '-'}</TableCell>
                        <TableCell>
                          {s.expected_yield ? `${s.expected_yield} kg/ha` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <MapTab area={area} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="soil">
          <Card>
            <CardContent className="py-24 text-center text-muted-foreground">
              Os dados de análise de solo e fertilidade dependem das integrações laboratoriais.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recs">
          <Card>
            <CardContent className="py-24 text-center text-muted-foreground">
              Não há recomendações agronômicas geradas para este talhão no momento.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imports">
          <Card>
            <CardContent className="py-24 text-center text-muted-foreground">
              Nenhuma importação vinculada exclusivamente a esta área no momento.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Registrar Safra</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="season_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano-Safra (ex: 2024/25)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crop"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultivo Principal</FormLabel>
                    <FormControl>
                      <Input placeholder="Soja, Milho, Algodão..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expected_yield"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produtividade Esperada (opcional - kg/ha)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? undefined : event.target.valueAsNumber,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-4">
                Salvar
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
