import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { MapPin, Plus, ArrowLeft, FlaskConical } from 'lucide-react'
import { api, Campaign, Point, Measurement, Depth, MeasurementType } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'

const pointSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

const measSchema = z.object({
  pointId: z.string().min(1, 'Selecione o ponto'),
  depthId: z.string().min(1, 'Selecione a profundidade'),
  typeId: z.string().min(1, 'Selecione o elemento'),
  value: z.coerce.number(),
})

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [depths, setDepths] = useState<Depth[]>([])
  const [mTypes, setMTypes] = useState<MeasurementType[]>([])
  const [measurements, setMeasurements] = useState<Record<string, Measurement[]>>({})

  const [openPoint, setOpenPoint] = useState(false)
  const [openMeas, setOpenMeas] = useState(false)
  const { toast } = useToast()

  const pointForm = useForm<z.infer<typeof pointSchema>>({
    resolver: zodResolver(pointSchema),
    defaultValues: { name: '', lat: 0, lng: 0 },
  })

  const measForm = useForm<z.infer<typeof measSchema>>({
    resolver: zodResolver(measSchema),
    defaultValues: { pointId: '', depthId: '', typeId: '', value: 0 },
  })

  const load = async () => {
    if (!id) return
    const c = await api.getCampaign(id)
    if (c) setCampaign(c)

    const pts = await api.getPointsByCampaign(id)
    setPoints(pts)

    const dp = await api.getDepths()
    setDepths(dp)

    const mt = await api.getMeasurementTypes()
    setMTypes(mt)

    const mDict: Record<string, Measurement[]> = {}
    for (const p of pts) {
      mDict[p.id] = await api.getMeasurementsByPoint(p.id)
    }
    setMeasurements(mDict)
  }

  useEffect(() => {
    load()
  }, [id])

  const onPointSubmit = async (values: z.infer<typeof pointSchema>) => {
    if (!id) return
    await api.createPoint({ ...values, campaignId: id })
    toast({ title: 'Sucesso', description: 'Ponto amostral georreferenciado registrado.' })
    setOpenPoint(false)
    pointForm.reset()
    load()
  }

  const onMeasSubmit = async (values: z.infer<typeof measSchema>) => {
    await api.createMeasurement(values)
    toast({
      title: 'Sucesso',
      description: 'Dados laboratoriais adicionados à matriz normalizada.',
    })
    setOpenMeas(false)
    measForm.reset()
    load()
  }

  if (!campaign)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Carregando detalhes...
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link to={`/areas/${campaign.areaId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Detalhes da Campanha</h1>
            <p className="text-muted-foreground mt-1">
              Realizada em: {new Date(campaign.date).toLocaleDateString('pt-BR')} | Status:{' '}
              <Badge variant="secondary" className="ml-2">
                {campaign.status}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Sheet open={openMeas} onOpenChange={setOpenMeas}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10"
              >
                <FlaskConical className="w-4 h-4 mr-2" /> Inserir Laboratório
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Entrada de Laboratório</SheetTitle>
                <SheetDescription>
                  Insira o resultado químico usando o padrão EAV normalizado.
                </SheetDescription>
              </SheetHeader>
              <Form {...measForm}>
                <form onSubmit={measForm.handleSubmit(onMeasSubmit)} className="space-y-5 mt-6">
                  <FormField
                    control={measForm.control}
                    name="pointId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ponto Amostral (Local)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ponto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {points.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={measForm.control}
                    name="depthId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidade de Coleta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a profundidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {depths.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={measForm.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Elemento Analisado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o elemento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} ({t.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={measForm.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Bruto Obtido</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar Medição
                  </Button>
                </form>
              </Form>
            </SheetContent>
          </Sheet>

          <Sheet open={openPoint} onOpenChange={setOpenPoint}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Demarcar Ponto
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Novo Ponto Georreferenciado</SheetTitle>
                <SheetDescription>
                  Identifique as coordenadas de amostragem na grade GIS.
                </SheetDescription>
              </SheetHeader>
              <Form {...pointForm}>
                <form onSubmit={pointForm.handleSubmit(onPointSubmit)} className="space-y-5 mt-6">
                  <FormField
                    control={pointForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identificação Interna</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ponto 02" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={pointForm.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pointForm.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Registrar Ponto (PostGIS)
                  </Button>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Rede Amostral & Resultados
          </CardTitle>
          <CardDescription>Visão tabular integrada dos pontos processados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6 w-[200px]">Ponto</TableHead>
                <TableHead className="w-[200px]">Coordenadas (Lat, Lng)</TableHead>
                <TableHead>Medições e Análises Registradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Nenhum ponto registrado na grade atual.
                  </TableCell>
                </TableRow>
              ) : (
                points.map((p) => {
                  const mList = measurements[p.id] || []
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/30 align-top">
                      <TableCell className="font-medium pl-6 pt-4">{p.name}</TableCell>
                      <TableCell className="font-mono text-sm pt-4">
                        {p.lat}, {p.lng}
                      </TableCell>
                      <TableCell className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {mList.length === 0 ? (
                            <span className="text-muted-foreground text-sm italic">
                              Pendente de resultados
                            </span>
                          ) : (
                            mList.map((m) => {
                              const t = mTypes.find((t) => t.id === m.typeId)
                              const d = depths.find((d) => d.id === m.depthId)
                              return (
                                <Badge
                                  variant="outline"
                                  key={m.id}
                                  className="text-xs font-normal border-primary/30 bg-primary/5 text-foreground py-1 px-3"
                                >
                                  {d?.name}:{' '}
                                  <strong className="ml-1 mr-1 text-primary">{t?.name}</strong> ={' '}
                                  {m.value}{' '}
                                  <span className="text-muted-foreground ml-1">{t?.unit}</span>
                                </Badge>
                              )
                            })
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
