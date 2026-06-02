import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import useMainStore from '@/stores/main'

const schema = z.object({
  producerId: z.string().min(1, 'Selecione um produtor'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  location: z.string().min(3, 'Localização é obrigatória'),
})

export default function Farms() {
  const { farms, producers, addFarm } = useMainStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { producerId: '', name: '', location: '' },
  })

  function onSubmit(data: z.infer<typeof schema>) {
    addFarm(data)
    setOpen(false)
    form.reset()
    toast({ title: 'Sucesso', description: 'Fazenda registrada com sucesso.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fazendas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova Fazenda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Fazenda</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="producerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {producers.map((p) => (
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
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Fazenda</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fazenda</TableHead>
                <TableHead>Produtor Associado</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma fazenda cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {farms.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>
                    {producers.find((p) => p.id === f.producerId)?.name || 'Desconhecido'}
                  </TableCell>
                  <TableCell>{f.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
