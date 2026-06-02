import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseShapefileZip, validatePointsAgainstBoundary } from '../utils/shapefile'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function GeographicWizard({ areaId, organizationId, area, campaigns, onComplete }: any) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [action, setAction] = useState('initial')
  const [file, setFile] = useState<File | null>(null)
  const [projection, setProjection] = useState('EPSG:4326')
  const [targetCampaign, setTargetCampaign] = useState('')
  const [sourceCampaign, setSourceCampaign] = useState('')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)

  const handleProcess = async () => {
    if (action === 'reuse') {
      if (!sourceCampaign || !targetCampaign) return toast({ title: 'Selecione as campanhas' })
      setStep(3)
      return
    }
    if (!file) return toast({ title: 'Selecione o arquivo ZIP' })
    if (['initial', 'new_points'].includes(action) && !targetCampaign)
      return toast({ title: 'Selecione a campanha destino' })

    setLoading(true)
    try {
      const data = await parseShapefileZip(file, projection, area.total_area_ha)
      if (action === 'initial' && !data.boundaryGeom)
        throw new Error('Polígono não encontrado no arquivo.')
      if (['initial', 'new_points'].includes(action) && data.pointsList.length === 0)
        throw new Error('Pontos não encontrados no arquivo.')
      if (action === 'update_boundary' && !data.boundaryGeom)
        throw new Error('Polígono não encontrado no arquivo.')

      let pointsSummary = { pointsInside: 0, pointsOutside: 0, outsideCodes: [] as string[] }
      if (['initial', 'new_points'].includes(action)) {
        let boundaryToUse = data.boundaryGeom
        if (!boundaryToUse) {
          const { data: areaData } = await (supabase.rpc as any)('get_area_map_data', {
            p_area_id: areaId,
          })
          boundaryToUse = areaData?.boundary
        }
        pointsSummary = validatePointsAgainstBoundary(data.pointsList, boundaryToUse)
      }
      setPreview({ ...data, pointsSummary })
      setStep(3)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    setLoading(true)
    try {
      if (action === 'reuse') {
        const { error } = await (supabase.rpc as any)('reuse_campaign_points', {
          p_source_campaign_id: sourceCampaign,
          p_target_campaign_id: targetCampaign,
          p_org_id: organizationId,
        })
        if (error) throw error
      } else {
        const { data: importRes, error: iErr } = await supabase
          .from('imports')
          .insert({
            organization_id: organizationId,
            area_id: areaId,
            kind: 'geography',
            created_by: user!.id,
            status: 'validating',
          })
          .select()
          .single()
        if (iErr) throw iErr

        if (file) {
          const path = `${organizationId}/${importRes.id}/${file.name}`
          await supabase.storage.from('soil-imports').upload(path, file)
          await supabase.from('import_files').insert({
            import_id: importRes.id,
            organization_id: organizationId,
            file_path: path,
            original_name: file.name,
          })
        }

        const { error } = await (supabase.rpc as any)('commit_geographic_import', {
          p_import_id: importRes.id,
          p_area_id: areaId,
          p_campaign_id: targetCampaign || null,
          p_action: action,
          p_boundary_geojson: preview?.boundaryGeom || null,
          p_points: preview?.pointsList || null,
          p_calculated_area_ha: preview?.calculatedAreaHa || 0,
          p_source_srid: projection,
          p_justification: justification,
          p_user_id: user!.id,
          p_org_id: organizationId,
        })
        if (error) throw error
      }
      toast({ title: 'Sucesso', description: 'Dados geográficos atualizados e salvos.' })
      setOpen(false)
      onComplete()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        setStep(1)
        setPreview(null)
        setFile(null)
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full mt-4">Gerenciar Dados Geográficos (Shapefile)</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importação Geográfica</DialogTitle>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-4 pt-4">
            <Label>Ação Desejada</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Cadastro Inicial (Contorno + Pontos)</SelectItem>
                <SelectItem value="reuse">Reaproveitar Pontos de Campanha Anterior</SelectItem>
                <SelectItem value="new_points">Importar Novos Pontos</SelectItem>
                <SelectItem value="update_boundary">Atualizar Contorno (Correção)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setStep(2)} className="w-full">
              Avançar
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 pt-4">
            {action !== 'update_boundary' && (
              <div className="space-y-2">
                <Label>Campanha de Destino</Label>
                <Select value={targetCampaign} onValueChange={setTargetCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {action === 'reuse' && (
              <div className="space-y-2">
                <Label>Campanha de Origem</Label>
                <Select value={sourceCampaign} onValueChange={setSourceCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {action !== 'reuse' && (
              <>
                <div className="space-y-2">
                  <Label>Arquivo Shapefile (.zip)</Label>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Projeção de Origem</Label>
                  <Select value={projection} onValueChange={setProjection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EPSG:4326">WGS 84 (EPSG:4326)</SelectItem>
                      <SelectItem value="EPSG:32723">UTM 23S WGS 84 (EPSG:32723)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {action === 'update_boundary' && (
                  <div className="space-y-2">
                    <Label>Justificativa de Alteração</Label>
                    <Input
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Descreva o motivo da alteração de contorno"
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleProcess} disabled={loading}>
                {loading ? 'Processando...' : 'Validar'}
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 pt-4">
            <h4 className="font-semibold text-lg">Resumo da Importação</h4>
            {action === 'reuse' ? (
              <p>
                Os pontos da campanha de origem selecionada serão copiados para a campanha de
                destino.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {preview?.boundaryGeom && (
                  <>
                    <p>
                      <strong>Área Calculada:</strong> {preview.calculatedAreaHa.toFixed(2)} ha
                    </p>
                    <p>
                      <strong>Divergência:</strong> {preview.divergencePct.toFixed(2)}% da área
                      declarada
                    </p>
                  </>
                )}
                {preview?.pointsList && (
                  <>
                    <p>
                      <strong>Pontos Identificados:</strong> {preview.pointsList.length}
                    </p>
                    <p>
                      <strong>Dentro do Contorno:</strong> {preview.pointsSummary.pointsInside}
                    </p>
                    {preview.pointsSummary.pointsOutside > 0 && (
                      <p className="text-red-600 font-medium">
                        Atenção: {preview.pointsSummary.pointsOutside} pontos fora do contorno! (
                        {preview.pointsSummary.outsideCodes.slice(0, 3).join(', ')}
                        {preview.pointsSummary.outsideCodes.length > 3 ? '...' : ''})
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                onClick={handleCommit}
                disabled={loading || (action === 'update_boundary' && !justification)}
              >
                {loading ? 'Salvando...' : 'Confirmar e Salvar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
