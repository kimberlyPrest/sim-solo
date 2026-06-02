import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Map, Plus, ChevronRight, ArrowLeft } from 'lucide-react'
import { api, Producer, Farm } from '@/lib/api'
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
} from '@/components/ui/form'

const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  totalArea: z.coerce.number().min(0.1, 'Área inválida'),
})

export default function ProducerDetail() {
  const { id } = useParams()
  const [producer, setProducer] = useState<Producer | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', totalArea: 0 },
  })

  const load = async () => {
    if (!id) return
    const p = await api.getProducer(id)
    if (p) setProducer(p)
    const f = await api.getFarmsByProducer(id)
    setFarms(f)
  }

  useEffect(() => {
    load()
  }, [id])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!id) return
    await api.createFarm({ ...values, producerId: id })
    toast({ title: 'Sucesso', description: 'Fazenda cadastrada com sucesso.' })
    setOpen(false)
    form.reset()
    load()
  }

  if (!producer)
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse">
        Carregando produtor...
      </div>
    )

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
            <p className="text-muted-foreground mt-1">Documento: {producer.document}</p>
          </div>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Fazenda
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Nova Fazenda</SheetTitle>
              <SheetDescription>
                Adicione uma nova propriedade rural para este produtor.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Fazenda</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Fazenda Esperança" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área Total (ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar Fazenda
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
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
                <TableHead>Área Total</TableHead>
                <TableHead className="text-right pr-6 w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Nenhuma fazenda cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                farms.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{f.name}</TableCell>
                    <TableCell>{f.totalArea} ha</TableCell>
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
