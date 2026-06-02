import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Loader2, UploadCloud, AlertTriangle } from 'lucide-react'
// @ts-expect-error
import shp from 'shpjs'
// @ts-expect-error
import proj4 from 'proj4'
import * as turf from '@turf/turf'

proj4.defs('EPSG:32723', '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs')

type ActionType = 'initial' | 'reuse' | 'new_points' | 'update_contour'

export function GeographicWizard({ area, mapData, campaigns, onClose, onSuccess }: any) {
  const { organization } = useAuth()
  const { toast } = useToast()
  const [action, setAction] = useState<ActionType>('initial')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [targetCampaign, setTargetCampaign] = useState('')
  const [sourceCampaign, setSourceCampaign] = useState('')
  const [justification, setJustification] = useState('')

  const [preview, setPreview] = useState<any>(null)

  const processFile = async () => {
    if (!file) return
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const geojson = await shp(buffer)

      let polygons: any[] = []
      let points: any[] = []

      const collections = Array.isArray(geojson) ? geojson : [geojson]

      collections.forEach((coll) => {
        coll.features.forEach((feat: any) => {
          if (feat.geometry.type === 'Polygon' || feat.geometry.type === 'MultiPolygon') {
            polygons.push(feat)
          } else if (feat.geometry.type === 'Point') {
            points.push(feat)
          }
        })
      })

      const checkCoords = (coords: number[]) =>
        Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90
      let needsReprojection = false
      if (polygons.length && checkCoords(polygons[0].geometry.coordinates[0][0]))
        needsReprojection = true
      else if (points.length && checkCoords(points[0].geometry.coordinates))
        needsReprojection = true

      const reproject = (coords: number[]) => {
        if (!needsReprojection) return coords
        return proj4('EPSG:32723', 'EPSG:4326', coords)
      }

      let boundaryFeature = null
      if (polygons.length > 0) {
        const poly = polygons[0]
        if (needsReprojection) {
          poly.geometry.coordinates = poly.geometry.coordinates.map((ring: any) =>
            ring.map((c: number[]) => reproject(c)),
          )
        }
        boundaryFeature = poly
      }

      let parsedPoints: any[] = []
      if (points.length > 0) {
        parsedPoints = points.map((pt) => {
          const coords = needsReprojection
            ? reproject(pt.geometry.coordinates)
            : pt.geometry.coordinates
          return {
            code:
              pt.properties.codigo ||
              pt.properties.CODE ||
              pt.properties.id ||
              String(Math.floor(Math.random() * 1000)),
            lat: coords[1],
            lng: coords[0],
          }
        })
      }

      let validationWarnings = []
      let calculatedArea = 0

      if (boundaryFeature) {
        calculatedArea = turf.area(boundaryFeature) / 10000
        const declared = area.declared_area_ha || area.total_area_ha || 0
        if (declared > 0) {
          const diff = Math.abs(calculatedArea - declared) / declared
          if (diff > 0.1)
            validationWarnings.push(
              `Área calculada (${calculatedArea.toFixed(2)} ha) diverge mais de 10% da declarada.`,
            )
        }
      } else if (action === 'initial' || action === 'update_contour') {
        throw new Error('Nenhum polígono encontrado no arquivo.')
      }

      if (parsedPoints.length === 0 && (action === 'initial' || action === 'new_points')) {
        throw new Error('Nenhum ponto encontrado no arquivo.')
      }

      let contourToCheck = boundaryFeature || mapData?.boundary
      if (contourToCheck && parsedPoints.length > 0) {
        const polyFeature =
          contourToCheck.type === 'Feature' ? contourToCheck : turf.feature(contourToCheck)
        const outsidePoints = parsedPoints.filter((pt: any) => {
          const ptFeature = turf.point([pt.lng, pt.lat])
          try {
            return !turf.booleanPointInPolygon(ptFeature, polyFeature)
          } catch (e) {
            return false
          }
        })
        if (outsidePoints.length > 0) {
          validationWarnings.push(
            `${outsidePoints.length} ponto(s) estão fora do contorno da área.`,
          )
        }
      }

      setPreview({
        boundary: boundaryFeature?.geometry,
        points: parsedPoints,
        calculatedArea: parseFloat(calculatedArea.toFixed(2)),
        warnings: validationWarnings,
        needsReprojection,
      })

      setStep(3)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro de Processamento', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = async () => {
    setLoading(true)
    try {
      let filePath = null
      let fileSize = 0
      let importId = crypto.randomUUID()

      if (file) {
        const fileExt = file.name.split('.').pop()
        filePath = `${organization?.id}/${area.id}/${importId}.${fileExt}`
        fileSize = file.size
        const { error: uploadError } = await supabase.storage
          .from('soil-imports')
          .upload(filePath, file)
        if (uploadError) throw uploadError
      }

      if (action === 'reuse') {
        const { error } = await supabase.rpc('reuse_campaign_points', {
          p_org_id: organization?.id,
          p_source_campaign_id: sourceCampaign,
          p_target_campaign_id: targetCampaign,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('save_geographic_import', {
          p_area_id: area.id,
          p_org_id: organization?.id,
          p_campaign_id: targetCampaign || null,
          p_boundary: preview.boundary || null,
          p_points: preview.points || [],
          p_import_id: importId,
          p_file_path: filePath,
          p_original_name: file?.name,
          p_file_size: fileSize,
          p_calculated_area_ha: preview.calculatedArea || 0,
          p_justification: justification || null,
        })
        if (error) throw error
      }

      toast({ title: 'Sucesso', description: 'Dados geográficos importados.' })
      onSuccess()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Importação Geográfica</SheetTitle>
          <SheetDescription>Siga os passos para importar o contorno e pontos.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 1: O que você deseja fazer?</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant={action === 'initial' ? 'default' : 'outline'}
                  onClick={() => setAction('initial')}
                >
                  Configuração Inicial (Contorno + Pontos)
                </Button>
                <Button
                  variant={action === 'reuse' ? 'default' : 'outline'}
                  onClick={() => setAction('reuse')}
                >
                  Reutilizar Pontos de Campanha Anterior
                </Button>
                <Button
                  variant={action === 'new_points' ? 'default' : 'outline'}
                  onClick={() => setAction('new_points')}
                >
                  Importar Novos Pontos
                </Button>
                <Button
                  variant={action === 'update_contour' ? 'default' : 'outline'}
                  onClick={() => setAction('update_contour')}
                >
                  Atualizar Contorno da Área
                </Button>
              </div>
              <Button className="w-full mt-4" onClick={() => setStep(2)}>
                Avançar
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 2: Arquivos e Campanhas</h3>

              {['initial', 'new_points'].includes(action) && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Campanha de Destino</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={targetCampaign}
                    onChange={(e) => setTargetCampaign(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {campaigns?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {action === 'reuse' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Campanha Origem (com pontos)
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={sourceCampaign}
                      onChange={(e) => setSourceCampaign(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {campaigns?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Campanha Destino (nova)
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={targetCampaign}
                      onChange={(e) => setTargetCampaign(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {campaigns?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {action === 'update_contour' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Justificativa da Alteração
                  </label>
                  <Input
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Motivo da atualização de contorno"
                  />
                </div>
              )}

              {action !== 'reuse' && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione um arquivo ZIP contendo .shp, .shx, .dbf
                  </p>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                {action === 'reuse' ? (
                  <Button
                    disabled={!sourceCampaign || !targetCampaign || loading}
                    onClick={confirmImport}
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Reuso
                  </Button>
                ) : (
                  <Button disabled={!file || loading} onClick={processFile}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Processar Arquivo
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 3 && preview && (
            <div className="space-y-4">
              <h3 className="font-semibold">Passo 3: Validação e Resumo</h3>

              <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                <p>
                  <strong>Área Calculada:</strong> {preview.calculatedArea} ha
                </p>
                <p>
                  <strong>Pontos Identificados:</strong> {preview.points.length}
                </p>
                <p>
                  <strong>Projeção Identificada:</strong>{' '}
                  {preview.needsReprojection ? 'Convertido para WGS84' : 'WGS84'}
                </p>
              </div>

              {preview.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Avisos</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2">
                      {preview.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button onClick={confirmImport} disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirmar Importação
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
