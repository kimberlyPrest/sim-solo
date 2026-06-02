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
import { producerSchema } from '@/lib/validation/schemas'

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Producers() {
  const { organization, role } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const canEdit = role === 'admin' || role === 'technician'

  const form = useForm<z.infer<typeof producerSchema>>({
    resolver: zodResolver(producerSchema),
    defaultValues: { name: '', document: '', email: '', phone: '', notes: '' },
  })

  const {
    data: producers = [],
    isLoading: loading,
    refetch,
  } = useQuery(
    ['producers', organization?.id || ''],
    async () => {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .order('name')
      if (error) throw error
      return data || []
    },
    { enabled: !!organization },
  )

  useEffect(() => {
    setBreadcrumbs([{ label: 'Produtores' }])
  }, [setBreadcrumbs])

  const mutation = useMutation(
    async (values: z.infer<typeof producerSchema>) => {
      if (editingId) {
        const { error } = await supabase.from('producers').update(values).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('producers')
          .insert({ ...values, organization_id: organization!.id })
        if (error) throw error
      }
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Produtor salvo.' })
        setOpen(false)
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const archiveMutation = useMutation(
    async (id: string) => {
      const { error } = await supabase.from('producers').update({ status: 'archived' }).eq('id', id)
      if (error) throw error
    },
    {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Produtor arquivado.' })
        refetch()
      },
      onError: (err: any) =>
        toast({ variant: 'destructive', title: 'Erro', description: err.message }),
    },
  )

  const onSubmit = (values: z.infer<typeof producerSchema>) => mutation.mutateAsync(values)
  const handleArchive = (id: string) => archiveMutation.mutateAsync(id)

  const filtered = producers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtores</h1>
          <p className="text-muted-foreground">Gerencie os produtores e clientes.</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditingId(null)
              form.reset({ name: '', document: '', email: '', phone: '', notes: '' })
              setOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Produtor
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute ml-3" />
        <Input
          placeholder="Buscar por nome..."
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
              <TableHead>Documento</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum produtor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link to={`/produtores/${p.id}`} className="hover:underline text-primary">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>{p.document || '-'}</TableCell>
                  <TableCell>{p.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/produtores/${p.id}`}>Acessar Detalhes</Link>
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingId(p.id)
                                form.reset(p)
                                setOpen(true)
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchive(p.id)}
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
            <SheetTitle>{editingId ? 'Editar Produtor' : 'Novo Produtor'}</SheetTitle>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Documento (CPF/CNPJ)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
