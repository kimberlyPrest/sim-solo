import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function Imports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Importações</h1>
          <p className="text-muted-foreground mt-1">
            Importe arquivos com análises e contornos georreferenciados.
          </p>
        </div>
        <Button disabled>
          <Upload className="w-4 h-4 mr-2" /> Nova Importação
        </Button>
      </div>

      <EmptyState
        title="Nenhuma importação realizada"
        description="O histórico de importações de arquivos Shapefile e análises laboratoriais aparecerá aqui."
      />
    </div>
  )
}
