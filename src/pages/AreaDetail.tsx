import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ClipboardList, Plus, ChevronRight, ArrowLeft } from 'lucide-react'
import { api, Area, Campaign, Season } from '@/lib/api'
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

const schema = z.object({
  seasonId: z.string().min(1, 'Selecione uma safra'),
  date: z.string().min(1, 'Data é obrigatória'),
  status: z.string().min(1, 'Selecione um status'),
})

export default function AreaDetail() {
  const { id } = useParams()
  const [area, setArea] = useState<Area | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { seasonId: '', date: '', status: 'Planejada' },
  })

  const load = async () => {
    if (!id) return
    const a = await api.getArea(id)
    if (a) setArea(a)
    const c = await api.getCampaignsByArea(id)
    setCampaigns(c)
    const s = await api.getSeasons()
    setSeasons(s)
  }

  useEffect(() => {
    load()
  }, [id])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!id) return
    await api.createCampaign({ ...values, areaId: id })
    toast({ title: 'Sucesso', description: 'Campanha iniciada com sucesso.' })
    setOpen(false)
    form.reset()
    load()
  }

  const getSeasonName = (sid: string) => seasons.find((s) => s.id === sid)?.name || sid

  if (!area)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">Carregando área...</div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link to={`/fazendas/${area.farmId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Área: {area.name}</h1>
            <p className="text-muted-foreground mt-1">Tamanho Registrado: {area.size} ha</p>
          </div>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Campanha
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Nova Campanha de Amostragem</SheetTitle>
              <SheetDescription>
                Inicie um evento de coleta de solo para este talhão específico.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-6">
                <FormField
                  control={form.control}
                  name="seasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Safra de Referência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a safra correspondente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {seasons.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Base da Coleta</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação Inicial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Planejada">Planejada</SelectItem>
                          <SelectItem value="Coletada">Coletada</SelectItem>
                          <SelectItem value="Analisada">Analisada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar Campanha
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" /> Histórico de Campanhas
          </CardTitle>
          <CardDescription>
            Consulte as amostragens de solo já realizadas ou programadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Safra Referência</TableHead>
                <TableHead>Data da Coleta</TableHead>
                <TableHead>Status Operacional</TableHead>
                <TableHead className="text-right pr-6 w-[120px]">Resultados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Nenhuma campanha registrada no momento.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{getSeasonName(c.seasonId)}</TableCell>
                    <TableCell>{new Date(c.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'Analisada'
                            ? 'default'
                            : c.status === 'Coletada'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Link to={`/campanhas/${c.id}`}>
                          Visualizar <ChevronRight className="w-4 h-4 ml-1" />
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
