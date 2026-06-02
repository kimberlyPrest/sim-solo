import { useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useQuery } from '@/hooks/use-query'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AreaMap } from './components/AreaMap'
import { GeographicWizard } from './components/GeographicWizard'

interface MapTabProps {
  area: any
  canEdit: boolean
}

export function MapTab({ area, canEdit }: MapTabProps) {
  const { organization } = useAuth()
  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0)
  const [campaignName, setCampaignName] = useState('')
  const [seasonId, setSeasonId] = useState('')

  const { data: seasons = [] } = useQuery(
    ['geo-area-seasons', area.id],
    async () => {
      const { data, error } = await supabase
        .from('area_seasons')
        .select('id, season_year, crop')
        .eq('area_id', area.id)
        .order('season_year', { ascending: false })
      if (error) throw error
      return data || []
    },
    { enabled: !!area.id },
  )

  const {
    data: campaigns = [],
    isLoading,
    refetch: refetchCampaigns,
  } = useQuery(
    ['geo-campaigns', area.id],
    async () => {
      const { data, error } = await supabase
        .from('sampling_campaigns')
        .select('id, name, area_season_id, start_date, status, area_seasons!inner(area_id)')
        .eq('area_seasons.area_id', area.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    { enabled: !!area.id },
  )

  const createCampaign = async () => {
    if (!organization || !campaignName.trim() || !seasonId) {
      toast({
        variant: 'destructive',
        title: 'Dados incompletos',
        description: 'Selecione a safra e informe o nome da campanha.',
      })
      return
    }

    const { error } = await supabase.from('sampling_campaigns').insert({
      organization_id: organization.id,
      area_season_id: seasonId,
      name: campaignName.trim(),
      source: 'sim',
    })

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar campanha', description: error.message })
      return
    }

    setCampaignName('')
    setSeasonId('')
    await refetchCampaigns()
    toast({ title: 'Campanha criada', description: 'A campanha já pode receber pontos de coleta.' })
  }

  const refreshMap = async () => {
    await refetchCampaigns()
    setRefreshKey((current) => current + 1)
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova campanha de amostragem</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Safra</Label>
              <Select value={seasonId} onValueChange={setSeasonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a safra" />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.season_year}
                      {season.crop ? ` - ${season.crop}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome da campanha</Label>
              <Input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                placeholder="Ex: Amostragem 2026"
              />
            </div>
            <Button onClick={createCampaign}>
              <Plus className="mr-2 h-4 w-4" /> Criar campanha
            </Button>
          </CardContent>
        </Card>
      )}

      <AreaMap key={refreshKey} areaId={area.id} area={area} campaigns={campaigns} />

      {canEdit && organization && (
        <GeographicWizard
          areaId={area.id}
          organizationId={organization.id}
          area={area}
          campaigns={campaigns}
          onComplete={refreshMap}
        />
      )}

      {!isLoading && campaigns.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre uma safra e uma campanha antes de importar os pontos geográficos.
        </p>
      )}
    </div>
  )
}
