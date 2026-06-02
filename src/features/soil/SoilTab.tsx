import { useState } from 'react'
import { SoilDashboard } from './SoilDashboard'
import { ImportSoilAnalysis } from './ImportSoilAnalysis'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export function SoilTab({ area, canEdit }: { area: any; canEdit: boolean }) {
  const [view, setView] = useState<'dashboard' | 'import'>('dashboard')

  if (view === 'import') {
    return <ImportSoilAnalysis area={area} onBack={() => setView('dashboard')} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="font-semibold text-lg">Dashboard de Análises</h3>
          <p className="text-sm text-muted-foreground">Consulte os resultados de laboratório vinculados às campanhas desta área.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setView('import')}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Análises
          </Button>
        )}
      </div>
      <SoilDashboard area={area} />
    </div>
  )
}
