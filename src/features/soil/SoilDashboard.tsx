import { useState, useMemo } from 'react'
import { useQuery } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { PointDetailDrawer } from './PointDetailDrawer'

export function SoilDashboard({ area }: { area: any }) {
  const [seasonId, setSeasonId] = useState<string>('all')
  const [campaignId, setCampaignId] = useState<string>('all')
  const [depth, setDepth] = useState<string>('all')
  const [selectedPoint, setSelectedPoint] = useState<any>(null)

  const { data: seasons = [] } = useQuery(['area-seasons', area.id], async () => {
    const { data } = await supabase.from('area_seasons').select('id, season_year').eq('area_id', area.id).order('season_year', { ascending: false })
    return data || []
  })

  const { data: campaigns = [] } = useQuery(['seasons-campaigns', seasonId], async () => {
    let q = supabase.from('sampling_campaigns').select('id, name, area_season_id')
    if (seasonId !== 'all') {
      q = q.eq('area_season_id', seasonId)
    } else if (seasons.length > 0) {
      q = q.in('area_season_id', seasons.map(s => s.id))
    } else {
      return []
    }
    const { data } = await q
    return data || []
  }, { enabled: true })

  const { data: attributes = [] } = useQuery(['lab-attributes'], async () => {
    const { data } = await supabase.from('lab_attributes').select('code, name, unit').eq('active', true).order('display_order')
    return data || []
  })

  const { data: rawData = [], isLoading } = useQuery(['soil-data', area.id, campaignId], async () => {
    if (campaigns.length === 0 && campaignId === 'all') return []
    let q = supabase.from('samples')
      .select(`
        id, code, depth_from_cm, depth_to_cm,
        sampling_points!inner(id, code, campaign_id, sampling_campaigns!inner(area_season_id)),
        lab_measurements(attribute_code, numeric_value)
      `)
    if (campaignId !== 'all') {
      q = q.eq('sampling_points.campaign_id', campaignId)
    } else if (campaigns.length > 0) {
      q = q.in('sampling_points.campaign_id', campaigns.map(c => c.id))
    }
    const { data } = await q
    return data || []
  }, { enabled: true })

  const filteredData = useMemo(() => {
    return rawData.filter(s => {
      if (seasonId !== 'all' && s.sampling_points.sampling_campaigns.area_season_id !== seasonId) return false
      if (depth !== 'all') {
        if (depth === '0_20' && (s.depth_from_cm !== 0 || s.depth_to_cm !== 20)) return false
        if (depth === '20_40' && (s.depth_from_cm !== 20 || s.depth_to_cm !== 40)) return false
      }
      return true
    })
  }, [rawData, seasonId, depth])

  const visibleAttributes = attributes.slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select value={seasonId} onValueChange={(v) => { setSeasonId(v); setCampaignId('all'); }}>
          <SelectTrigger><SelectValue placeholder="Safra" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Safras</SelectItem>
            {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.season_year}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger><SelectValue placeholder="Campanha" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Campanhas</SelectItem>
            {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={depth} onValueChange={setDepth}>
          <SelectTrigger><SelectValue placeholder="Profundidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Profundidades</SelectItem>
            <SelectItem value="0_20">0 - 20 cm</SelectItem>
            <SelectItem value="20_40">20 - 40 cm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 min-w-[120px]">Ponto</TableHead>
                <TableHead className="min-w-[100px]">Prof. (cm)</TableHead>
                {visibleAttributes.map(attr => (
                  <TableHead key={attr.code} className="text-right whitespace-nowrap">
                    {attr.code} <span className="text-xs text-muted-foreground block">{attr.unit}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-12 animate-pulse text-muted-foreground">Carregando dados de solo...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-12 text-muted-foreground">Nenhum dado encontrado para os filtros selecionados.</TableCell></TableRow>
              ) : (
                filteredData.map(sample => {
                  const measMap = new Map(sample.lab_measurements.map((m: any) => [m.attribute_code, m.numeric_value]))
                  return (
                    <TableRow key={sample.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedPoint(sample.sampling_points)}>
                      <TableCell className="pl-6 font-medium text-primary">{sample.sampling_points.code}</TableCell>
                      <TableCell>{sample.depth_from_cm} - {sample.depth_to_cm}</TableCell>
                      {visibleAttributes.map(attr => (
                        <TableCell key={attr.code} className="text-right">
                          {measMap.get(attr.code) ?? '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {filteredData.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">Exibindo colunas limitadas. Clique em uma linha para ver todos os atributos do ponto.</p>
      )}

      {selectedPoint && (
        <PointDetailDrawer 
          point={selectedPoint} 
          open={!!selectedPoint} 
          onOpenChange={(val: boolean) => !val && setSelectedPoint(null)} 
          attributes={attributes}
        />
      )}
    </div>
  )
}
