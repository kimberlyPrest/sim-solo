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
  DialogDescription,
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
  pointId: z.string().min(1, 'Selecione um ponto'),
  depth: z.string().min(1, 'Ex: 0-20cm'),
  property: z.string().min(1, 'Ex: pH, P, K'),
  value: z.coerce.number().min(0, 'Valor inválido'),
})

export default function Measurements() {
  const { measurements, points, campaigns, addMeasurement } = useMainStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { pointId: '', depth: '', property: '', value: 0 },
  })

  function onSubmit(data: z.infer<typeof schema>) {
    addMeasurement(data)
    setOpen(false)
    form.reset()
    toast({ title: 'Medição Salva', description: 'Resultado laboratorial incluído e normalizado.' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medições Laboratoriais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Inserir Resultado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Medição Dinâmica</DialogTitle>
              <DialogDescription>Adicione atributos sem limite de colunas.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="pointId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto Coletado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o ponto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {points.map((p) => {
                            const cName =
                              campaigns.find((c) => c.id === p.campaignId)?.name || 'Campanha'
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {p.code} ({cName})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="property"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Atributo (ex: pH, Ca)</FormLabel>
                        <FormControl>
                          <Input placeholder="pH" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="depth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profundidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Ex: 0-20cm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-20cm">0-20cm</SelectItem>
                          <SelectItem value="20-40cm">20-40cm</SelectItem>
                          <SelectItem value="40-60cm">40-60cm</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Salvar Medição
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
                <TableHead>Ponto Georreferenciado</TableHead>
                <TableHead>Profundidade</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhuma medição cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {measurements.map((m) => {
                const p = points.find((pt) => pt.id === m.pointId)
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {p?.code || 'Desconhecido'}{' '}
                      <span className="text-xs text-muted-foreground ml-2">
                        [{p?.lat}, {p?.lng}]
                      </span>
                    </TableCell>
                    <TableCell>{m.depth}</TableCell>
                    <TableCell>{m.property}</TableCell>
                    <TableCell>{m.value}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
