import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, ChevronRight } from 'lucide-react'
import { api, Producer } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

import { Card, CardContent } from '@/components/ui/card'
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
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  document: z.string().min(11, 'Documento inválido'),
})

export default function Producers() {
  const [producers, setProducers] = useState<Producer[]>([])
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', document: '' },
  })

  const load = async () => {
    const data = await api.getProducers()
    setProducers(data)
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    await api.createProducer(values)
    toast({ title: 'Sucesso', description: 'Produtor cadastrado com sucesso.' })
    setOpen(false)
    form.reset()
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Produtores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os produtores e clientes do sistema.
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Novo Produtor
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Novo Produtor</SheetTitle>
              <SheetDescription>Preencha os dados do novo produtor abaixo.</SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome / Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar Produtor
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">Nome / Razão Social</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="w-[120px] text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {producers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    Nenhum produtor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                producers.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium pl-6">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.document}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Link to={`/produtores/${p.id}`}>
                          Detalhes <ChevronRight className="w-4 h-4 ml-1" />
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
