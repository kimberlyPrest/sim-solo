import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { parseShapefileZip, validatePointsAgainstBoundary } from '../utils/shapefile'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type GeographicAction = 'initial' | 'reuse' | 'new_points' | 'update_boundary'

interface GeographicWizardProps {
  areaId: string
  organizationId: string
  area: any
  campaigns: any[]
  onComplete: () => Promise<void>
}

export function GeographicWizard({
  areaId,
  organizationId,
  area,
  campaigns,
  onComplete,
}: GeographicWizardProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [action, setAction] = useState<GeographicAction>('initial')
  const [file, setFile] = useState<File | null>(null)
  const [projection, setProjection] = useState('EPSG:4326')
  const [targetCampaign, setTargetCampaign] = useState('')
  const [sourceCampaign, setSourceCampaign] = useState('')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  const reset = () => {
    setStep(1)
    setAction('initial')
    setFile(null)
    setProjection('EPSG:4326')
    setTargetCampaign('')
    setSourceCampaign('')
    setJustification('')
    setPreview(null)
  }

  const processFile = async () => {
    if (action === 'reuse') {
      if (!sourceCampaign || !targetCampaign) {
        toast({ variant: 'destructive', title: 'Selecione as campanhas de origem e destino.' })
        return
      }
      if (sourceCampaign === targetCampaign) {
        toast({ variant: 'destructive', title: 'A campanha de destino deve ser diferente.' })
        return
      }
      setStep(3)
      return
    }

    if (!file) {
      toast({ variant: 'destructive', title: 'Selecione um arquivo ZIP.' })
      return
    }

    if (['initial', 'new_points'].includes(action) && !targetCampaign) {
      toast({ variant: 'destructive', title: 'Selecione a campanha de destino.' })
      return
    }

    if (action === 'update_boundary' && !justification.trim()) {
      toast({ variant: 'destructive', title: 'Informe a justificativa da alteração.' })
      return
    }

    setLoading(true)
    try {
      const data = await parseShapefileZip(
        file,
        projection,
        area.declared_area_ha || area.total_area_ha,
      )

      if (action === 'initial' && (!data.boundaryGeom || data.pointsList.length === 0)) {
        throw new Error('O cadastro inicial exige um contorno e ao menos um ponto.')
      }
      if (action === 'new_points' && data.pointsList.length === 0) {
        throw new Error('O arquivo deve conter ao menos um ponto.')
      }
      if (action === 'update_boundary' && !data.boundaryGeom) {
        throw new Error('A atualização exige um polígono ou multipolígono.')
      }

      let boundaryToValidate = data.boundaryGeom
      if (action === 'new_points') {
        const { data: mapData, error } = await (supabase.rpc as any)('get_area_map_data', {
          p_area_id: areaId,
        })
        if (error) throw error
        boundaryToValidate = mapData?.boundary
        if (!boundaryToValidate) {
          throw new Error('Cadastre o contorno da área antes de importar somente pontos.')
        }
      }

      const pointsSummary = validatePointsAgainstBoundary(data.pointsList, boundaryToValidate)
      setPreview({ ...data, pointsSummary })
      setStep(3)
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const commit = async () => {
    setLoading(true)
    let storagePath: string | null = null
    try {
      if (action === 'reuse') {
        const { error } = await (supabase.rpc as any)('reuse_campaign_points', {
          p_source_campaign_id: sourceCampaign,
          p_target_campaign_id: targetCampaign,
          p_org_id: organizationId,
        })
        if (error) throw error
      } else {
        const importId = crypto.randomUUID()
        if (!file) throw new Error('Selecione o arquivo ZIP.')

        storagePath = `${organizationId}/${areaId}/${importId}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('soil-imports')
          .upload(storagePath, file)
        if (uploadError) throw uploadError

        const { error } = await (supabase.rpc as any)('commit_geographic_import', {
          p_import_id: importId,
          p_area_id: areaId,
          p_campaign_id: targetCampaign || null,
          p_action: action,
          p_boundary_geojson: preview?.boundaryGeom || null,
          p_points: preview?.pointsList || [],
          p_calculated_area_ha: preview?.calculatedAreaHa || 0,
          p_source_srid: projection,
          p_justification: justification.trim() || null,
          p_org_id: organizationId,
          p_file_path: storagePath,
          p_original_name: file.name,
          p_file_size: file.size,
        })
        if (error) throw error
      }

      toast({ title: 'Importação concluída', description: 'Os dados geográficos foram salvos.' })
      setOpen(false)
      reset()
      await onComplete()
    } catch (error: any) {
      if (storagePath) {
        await supabase.storage.from('soil-imports').remove([storagePath])
      }
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>Gerenciar dados geográficos</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importação geográfica</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label>Ação desejada</Label>
            <Select value={action} onValueChange={(value) => setAction(value as GeographicAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Cadastro inicial: contorno e pontos</SelectItem>
                <SelectItem value="reuse">Reutilizar pontos de campanha anterior</SelectItem>
                <SelectItem value="new_points">Importar novos pontos</SelectItem>
                <SelectItem value="update_boundary">Atualizar contorno da área</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={() => setStep(2)}>
              Avançar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Campanha de destino{' '}
                {action === 'update_boundary' ? '(opcional para novos pontos)' : ''}
              </Label>
              <Select value={targetCampaign} onValueChange={setTargetCampaign}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      action === 'update_boundary'
                        ? 'Selecione somente se o ZIP também tiver novos pontos'
                        : 'Selecione a campanha'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {action === 'reuse' && (
              <div className="space-y-2">
                <Label>Campanha de origem</Label>
                <Select value={sourceCampaign} onValueChange={setSourceCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {action !== 'reuse' && (
              <>
                <div className="space-y-2">
                  <Label>Arquivo shapefile ZIP</Label>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Projeção de origem</Label>
                  <Select value={projection} onValueChange={setProjection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EPSG:4326">WGS 84: EPSG:4326</SelectItem>
                      <SelectItem value="EPSG:32723">UTM 23S WGS 84: EPSG:32723</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {action === 'update_boundary' && (
              <div className="space-y-2">
                <Label>Justificativa obrigatória</Label>
                <Input
                  value={justification}
                  onChange={(event) => setJustification(event.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={processFile} disabled={loading}>
                {action === 'reuse' ? 'Revisar' : 'Validar'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Resumo da importação</h4>
            {action === 'reuse' ? (
              <p className="text-sm text-muted-foreground">
                Os pontos serão copiados para a nova campanha sem alterar o histórico.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {preview?.boundaryGeom && (
                  <>
                    <p>Área calculada: {preview.calculatedAreaHa.toFixed(2)} ha</p>
                    <p>Divergência da área declarada: {preview.divergencePct.toFixed(2)}%</p>
                  </>
                )}
                <p>Pontos identificados: {preview?.pointsList.length || 0}</p>
                {preview?.pointsSummary.pointsOutside > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pontos fora do contorno</AlertTitle>
                    <AlertDescription>
                      {preview.pointsSummary.pointsOutside} ponto(s):{' '}
                      {preview.pointsSummary.outsideCodes.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={commit} disabled={loading}>
                Confirmar e salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
