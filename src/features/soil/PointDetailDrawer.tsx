import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useQuery } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function PointDetailDrawer({ point, open, onOpenChange, attributes }: any) {
  const { data: samples = [], isLoading } = useQuery(['point-samples', point?.id], async () => {
    if (!point?.id) return []
    const { data } = await supabase.from('samples')
      .select(`
        id, depth_from_cm, depth_to_cm,
        lab_measurements(attribute_code, numeric_value)
      `)
      .eq('sampling_point_id', point.id)
      .order('depth_from_cm')
    return data || []
  }, { enabled: !!point?.id })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Ponto {point?.code}</SheetTitle>
          <SheetDescription>Detalhes das análises de solo por profundidade</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-center animate-pulse text-muted-foreground">Carregando dados laboratoriais...</div>
        ) : samples.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">Nenhuma análise registrada para este ponto.</div>
        ) : (
          <div className="space-y-6">
            {samples.map((sample: any) => {
              const measMap = new Map(sample.lab_measurements.map((m: any) => [m.attribute_code, m.numeric_value]))
              const hasData = sample.lab_measurements.length > 0
              
              return (
                <div key={sample.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-muted/30 px-4 py-3 font-semibold border-b text-primary">
                    Profundidade: {sample.depth_from_cm} a {sample.depth_to_cm} cm
                  </div>
                  {!hasData ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">Sem resultados laboratoriais para esta profundidade.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Atributo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Unidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attributes.map((attr: any) => {
                          const val = measMap.get(attr.code)
                          if (val === undefined) return null
                          return (
                            <TableRow key={attr.code} className="hover:bg-muted/10">
                              <TableCell className="font-medium">{attr.name} ({attr.code})</TableCell>
                              <TableCell className="text-right font-semibold">{val}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{attr.unit || '-'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
