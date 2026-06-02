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
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import useMainStore from '@/stores/main'

const schema = z.object({
  farmId: z.string().min(1, 'Selecione uma fazenda'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  sizeHectares: z.coerce.number().min(0.1, 'Tamanho deve ser maior que 0'),
})

export default function Areas() {
  const { areas, farms, addArea } = useMainStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { farmId: '', name: '', sizeHectares: 0 },
  })

  function onSubmit(data: z.infer<typeof schema>) {
    addArea(data)
    setOpen(false)
    form.reset()
    toast({ title: 'Área Criada', description: 'Talhão e dados geográficos registrados.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Áreas (Talhões)</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova Área</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Talhão</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="farmId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fazenda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {farms.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
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
                      <FormLabel>Nome da Área</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sizeHectares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho (Hectares)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label>Importar Geometria (Shapefile/GeoJSON)</Label>
                  <Input
                    type="file"
                    accept=".zip,.geojson"
                    onChange={() =>
                      toast({
                        title: 'Upload Simulado',
                        description: 'Geometria enviada para PostGIS.',
                      })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Salvar e Processar PostGIS
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
                <TableHead>Área / Talhão</TableHead>
                <TableHead>Fazenda</TableHead>
                <TableHead>Hectares</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma área cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {areas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    {farms.find((f) => f.id === a.farmId)?.name || 'Desconhecida'}
                  </TableCell>
                  <TableCell>{a.sizeHectares} ha</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
