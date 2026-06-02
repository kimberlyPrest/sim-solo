import { useState, useRef } from 'react'
import { ArrowLeft, Download, UploadCloud, FileType } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useQuery } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'

export function ImportSoilAnalysis({ area, onBack }: { area: any; onBack: () => void }) {
  const { organization } = useAuth()
  const { toast } = useToast()
  
  const [seasonId, setSeasonId] = useState<string>('')
  const [campaignId, setCampaignId] = useState<string>('')
  const [labName, setLabName] = useState<string>('')
  const [sampleDate, setSampleDate] = useState<string>('')
  const [resultDate, setResultDate] = useState<string>('')
  const [source, setSource] = useState<string>('sim')
  
  const [file, setFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: seasons = [] } = useQuery(['area-seasons', area.id], async () => {
    const { data } = await supabase.from('area_seasons').select('*').eq('area_id', area.id).order('season_year', { ascending: false })
    return data || []
  })

  const { data: campaigns = [] } = useQuery(['seasons-campaigns', seasonId], async () => {
    if (!seasonId) return []
    const { data } = await supabase.from('sampling_campaigns').select('*').eq('area_season_id', seasonId)
    return data || []
  }, { enabled: !!seasonId })

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-soil-analysis', {
        body: { action: 'template' }
      })
      if (error) throw error
      if (!data?.base64) throw new Error('Erro ao gerar template')
      
      const link = document.createElement('a')
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.base64}`
      link.download = `Template_Analise_Solo_${area.name}.xlsx`
      link.click()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleImport = async () => {
    if (!seasonId || !campaignId || !file) {
      toast({ variant: 'destructive', title: 'Atenção', description: 'Selecione safra, campanha e anexe o arquivo.' })
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${organization?.id}/${Date.now()}_soil.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('soil-imports')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError

      const { data: importRecord, error: importError } = await supabase
        .from('imports')
        .insert({
          organization_id: organization!.id,
          area_id: area.id,
          area_season_id: seasonId,
          kind: 'soil_analysis',
          status: 'uploaded',
          created_by: (await supabase.auth.getUser()).data.user!.id,
          uploaded_by: (await supabase.auth.getUser()).data.user!.id,
        })
        .select().single()
      
      if (importError) throw importError

      await supabase.from('import_files').insert({
        import_id: importRecord.id,
        organization_id: organization!.id,
        file_path: filePath,
        storage_path: filePath,
        original_name: file.name,
        file_size: file.size,
        file_kind: 'soil_analysis'
      })

      const { data, error: processError } = await supabase.functions.invoke('process-soil-analysis', {
        body: {
          action: 'import',
          importId: importRecord.id,
          orgId: organization!.id,
          campaignId,
          filePath,
          metadata: {
            laboratory: labName,
            sample_date: sampleDate || null,
            result_date: resultDate || null,
            source: source
          }
        }
      })

      if (processError) throw processError

      if (!data.success) {
        toast({ 
          variant: 'destructive', 
          title: 'Erro na validação do arquivo', 
          description: data.errors?.[0] || 'Erros encontrados no arquivo.' 
        })
        return
      }

      toast({ title: 'Sucesso', description: `${data.samplesCount} amostras e ${data.measurementsCount} medições importadas com sucesso.` })
      onBack()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na importação', description: err.message })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">Importar Análises de Solo</h2>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/20">
            <div>
              <h3 className="font-semibold text-primary">Template Oficial</h3>
              <p className="text-sm text-muted-foreground">Baixe a planilha com as colunas laboratoriais pré-configuradas.</p>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={isDownloading}>
              {isDownloading ? 'Gerando...' : <><Download className="w-4 h-4 mr-2" /> Baixar Template</>}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Safra (Obrigatório)</Label>
              <Select value={seasonId} onValueChange={(val) => { setSeasonId(val); setCampaignId('') }}>
                <SelectTrigger><SelectValue placeholder="Selecione a Safra" /></SelectTrigger>
                <SelectContent>
                  {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.season_year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campanha (Obrigatório)</Label>
              <Select value={campaignId} onValueChange={setCampaignId} disabled={!seasonId}>
                <SelectTrigger><SelectValue placeholder="Selecione a Campanha" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6">
            <div className="space-y-2">
              <Label>Laboratório</Label>
              <Input value={labName} onChange={e => setLabName(e.target.value)} placeholder="Ex: Laboratório Solos Brasil" />
            </div>
            <div className="space-y-2">
              <Label>Origem dos Dados</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Padrão SIM</SelectItem>
                  <SelectItem value="historical_standardized">Histórico Padronizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Coleta</Label>
              <Input type="date" value={sampleDate} onChange={e => setSampleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data do Resultado</Label>
              <Input type="date" value={resultDate} onChange={e => setResultDate(e.target.value)} />
            </div>
          </div>

          <div className="pt-6 border-t">
            <Label className="mb-2 block">Arquivo Excel Preenchido (.xlsx)</Label>
            <div 
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx" 
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setFile(f)
                }} 
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <FileType className="w-8 h-8 text-primary" />
                  </div>
                  <span className="font-semibold text-lg">{file.name}</span>
                  <span className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <div className="bg-muted p-4 rounded-full mb-3">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <span className="font-medium text-foreground">Clique para anexar o arquivo Excel</span>
                  <span className="text-sm mt-1">Somente arquivos no formato do template oficial</span>
                </div>
              )}
            </div>
          </div>

          <Button className="w-full h-12 text-lg font-semibold" onClick={handleImport} disabled={isUploading || !file || !campaignId}>
            {isUploading ? 'Validando e Importando Dados...' : 'Iniciar Importação de Análises'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
