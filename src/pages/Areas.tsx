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
import { areaSchema } from '@/lib/validation/schemas'

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

export default function Areas() {
  const { organization, role } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const canEdit = role === 'admin' || role === 'technician'

  const form = useForm<z.infer<typeof areaSchema>>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: '', farm_id: '', total_area_ha: 0, declared_area_ha: 0, notes: '' },
  })

  const {
    data: areas = [],
    isLoading,
    refetch,
  } = useQuery(
    ['areas', organization?.id || ''],
    async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*, farms(name, producers(name))')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
      if (error) throw error
      return data || []
    },
    { enabled: !!organization },
  )

  const { data: farms = [] } = useQuery(
    ['farms-select', organization?.id || ''],
    async () => {
      const { data, error } = await supabase
        .from('farms')
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
    setBreadcrumbs([{ label: 'Áreas' }])
  }, [setBreadcrumbs])

  const mutation = useMutation(
    async (values: z.infer<typeof areaSchema>) => {
      if (editingId) {
        const { error } = await supabase.from('areas').update(values).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('areas')
          .insert({ ...values, organization_id: organization!.id })
        if (error) throw error
      }
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Área salva.' })
        setOpen(false)
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const archiveMutation = useMutation(
    async (id: string) => {
      const { error } = await supabase.from('areas').update({ status: 'archived' }).eq('id', id)
      if (error) throw error
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Área arquivada.' })
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const onSubmit = (values: z.infer<typeof areaSchema>) => mutation.mutateAsync(values)
  const handleArchive = (id: string) => archiveMutation.mutateAsync(id)

  const filtered = areas.filter(
    (a: any) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.farms?.name?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Áreas e Talhões</h1>
          <p className="text-muted-foreground">Gerencie as subdivisões para amostragem.</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditingId(null)
              form.reset({
                name: '',
                farm_id: '',
                total_area_ha: 0,
                declared_area_ha: 0,
                notes: '',
              })
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Área
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
              <TableHead>Fazenda</TableHead>
              <TableHead>Produtor</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma área encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link to={`/areas/${a.id}`} className="hover:underline text-primary">
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>{a.farms?.name}</TableCell>
                  <TableCell>{a.farms?.producers?.name}</TableCell>
                  <TableCell>{a.total_area_ha ? `${a.total_area_ha} ha` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/areas/${a.id}`}>Acessar</Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(a.id)
                                form.reset({
                                  ...a,
                                  total_area_ha: a.total_area_ha || 0,
                                  declared_area_ha: a.declared_area_ha || 0,
                                })
                                setOpen(true)
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(a.id)}
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
            <SheetTitle>{editingId ? 'Editar' : 'Nova'} Área / Talhão</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="farm_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fazenda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fazenda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {farms.map((f: any) => (
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
                    <FormLabel>Identificação (Ex: Talhão 1)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_area_ha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho Mapeado (ha)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="declared_area_ha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho Declarado (ha)</FormLabel>
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
                    <FormMessage />
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
                    <FormMessage />
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
