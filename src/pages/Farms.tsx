import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Search, Plus, MoreHorizontal, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'
import { useQuery, useMutation } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { farmSchema } from '@/lib/validation/schemas'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Farms() {
  const { organization, role } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const canEdit = role === 'admin' || role === 'technician'

  const form = useForm<z.infer<typeof farmSchema>>({
    resolver: zodResolver(farmSchema),
    defaultValues: { name: '', producer_id: '', city: '', state: '', total_area_ha: 0, notes: '' },
  })

  const {
    data: farms = [],
    isLoading: loadingFarms,
    refetch,
  } = useQuery(
    ['farms', organization?.id || ''],
    async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*, producers(name)')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
      if (error) throw error
      return data || []
    },
    { enabled: !!organization },
  )

  const { data: producers = [] } = useQuery(
    ['producers-select', organization?.id || ''],
    async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('id, name')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return data || []
    },
    { enabled: !!organization },
  )

  useEffect(() => {
    setBreadcrumbs([{ label: 'Fazendas' }])
  }, [setBreadcrumbs])

  const mutation = useMutation(
    async (values: z.infer<typeof farmSchema>) => {
      if (editingId) {
        const { error } = await supabase.from('farms').update(values).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('farms')
          .insert({ ...values, organization_id: organization!.id })
        if (error) throw error
      }
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Fazenda salva.' })
        setOpen(false)
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const archiveMutation = useMutation(
    async (id: string) => {
      const { error } = await supabase.from('farms').update({ status: 'archived' }).eq('id', id)
      if (error) throw error
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Fazenda arquivada.' })
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const onSubmit = (values: z.infer<typeof farmSchema>) => mutation.mutateAsync(values)
  const handleArchive = (id: string) => archiveMutation.mutateAsync(id)

  const filtered = farms.filter(
    (f: any) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.producers?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fazendas</h1>
          <p className="text-muted-foreground">Gerencie as fazendas associadas aos produtores.</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditingId(null)
              form.reset({
                name: '',
                producer_id: '',
                city: '',
                state: '',
                total_area_ha: 0,
                notes: '',
              })
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Fazenda
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
        <Input
          placeholder="Buscar..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Produtor</TableHead>
              <TableHead>Área</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingFarms ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma fazenda encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    <Link to={`/fazendas/${f.id}`} className="hover:underline text-primary">
                      {f.name}
                    </Link>
                  </TableCell>
                  <TableCell>{f.producers?.name}</TableCell>
                  <TableCell>{f.total_area_ha ? `${f.total_area_ha} ha` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/fazendas/${f.id}`}>Acessar</Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(f.id)
                                form.reset({ ...f, total_area_ha: f.total_area_ha || 0 })
                                setOpen(true)
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(f.id)}
                              className="text-destructive"
                            >
                              Arquivar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Editar' : 'Nova'} Fazenda</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="producer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produtor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produtor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {producers.map((p: any) => (
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
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="total_area_ha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área Total (ha)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
