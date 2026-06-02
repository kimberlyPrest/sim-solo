import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sprout, Plus, ChevronRight, ArrowLeft } from 'lucide-react'
import { api, Farm, Area } from '@/lib/api'
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
  FormDescription,
} from '@/components/ui/form'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  size: z.coerce.number().min(0.01, 'Tamanho inválido'),
  geom: z.string().optional(),
})

export default function FarmDetail() {
  const { id } = useParams()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', size: 0, geom: '' },
  })

  const load = async () => {
    if (!id) return
    const f = await api.getFarm(id)
    if (f) setFarm(f)
    const a = await api.getAreasByFarm(id)
    setAreas(a)
  }

  useEffect(() => {
    load()
  }, [id])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!id) return
    await api.createArea({ ...values, farmId: id })
    toast({ title: 'Sucesso', description: 'Talhão cadastrado com sucesso.' })
    setOpen(false)
    form.reset()
    load()
  }

  if (!farm)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Carregando fazenda...
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link to={`/produtores/${farm.producerId}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{farm.name}</h1>
            <p className="text-muted-foreground mt-1">
              Área Total da Propriedade: {farm.totalArea} ha
            </p>
          </div>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Novo Talhão
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Novo Talhão (Área)</SheetTitle>
              <SheetDescription>
                Subdivisão da fazenda para processos de amostragem.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificação</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Talhão 01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho (ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="geom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GeoJSON (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="{ type: 'Feature', ... }" {...field} />
                      </FormControl>
                      <FormDescription>
                        Estrutura geométrica exportada para PostGIS.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar Talhão
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" /> Talhões Mapeados
          </CardTitle>
          <CardDescription>Áreas de manejo dentro desta propriedade.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Identificação</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Integração GIS</TableHead>
                <TableHead className="text-right pr-6 w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Nenhum talhão registrado.
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{a.name}</TableCell>
                    <TableCell>{a.size} ha</TableCell>
                    <TableCell>
                      {a.geom ? (
                        <span className="text-primary font-medium">Definida</span>
                      ) : (
                        <span className="text-muted-foreground">Não definida</span>
                      )}
                    </TableCell>
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
