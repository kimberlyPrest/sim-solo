import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useQuery } from '@/hooks/use-query'
import { supabase } from '@/lib/supabase/client'
import { GeographicWizard } from './GeographicWizard'
import 'leaflet/dist/leaflet.css'

// Fix icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function FitBounds({ geojson, points }: { geojson: any; points: any[] }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds([])
    let hasBounds = false
    if (geojson) {
      const layer = L.geoJSON(geojson)
      bounds.extend(layer.getBounds())
      hasBounds = true
    }
    if (points && points.length > 0) {
      points.forEach((p) => {
        if (p.geom) {
          const coords = JSON.parse(p.geom).coordinates
          bounds.extend([coords[1], coords[0]])
          hasBounds = true
        }
      })
    }
    if (hasBounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [geojson, points, map])
  return null
}

export function MapTab({ area, canEdit }: { area: any; canEdit: boolean }) {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  const { data: mapData, refetch } = useQuery(['area-map', area.id], async () => {
    const { data, error } = await supabase.rpc('get_area_map_data', { p_area_id: area.id })
    if (error) throw error
    return data as { boundary: any; points: any[] }
  })

  const { data: campaigns } = useQuery(['area-campaigns', area.id], async () => {
    const { data, error } = await supabase
      .from('sampling_campaigns')
      .select('id, name, area_seasons!inner(area_id)')
      .eq('area_seasons.area_id', area.id)
    if (error) throw error
    return data
  })

  useEffect(() => {
    if (campaigns?.length && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id)
    }
  }, [campaigns, selectedCampaignId])

  const activePoints =
    mapData?.points.filter((p: any) =>
      selectedCampaignId ? p.campaign_id === selectedCampaignId : true,
    ) || []
  const selectedCampaignName =
    campaigns?.find((c: any) => c.id === selectedCampaignId)?.name || 'Todas'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Campanha:</label>
          <select
            className="border rounded p-1 text-sm bg-background"
            value={selectedCampaignId || ''}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
          >
            <option value="">Todas</option>
            {campaigns?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {canEdit && <Button onClick={() => setWizardOpen(true)}>Importar Dados Geográficos</Button>}
      </div>

      <Card>
        <CardContent className="p-0 h-[600px] relative rounded-lg overflow-hidden border">
          <MapContainer
            center={[-15, -50]}
            zoom={4}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapData?.boundary && (
              <GeoJSON
                data={mapData.boundary}
                style={{ color: 'hsl(var(--primary))', weight: 2, fillOpacity: 0.1 }}
              />
            )}
            {activePoints.map((point: any) => {
              const geom = JSON.parse(point.geom)
              return (
                <Marker key={point.id} position={[geom.coordinates[1], geom.coordinates[0]]}>
                  <Popup>
                    <strong>Ponto:</strong> {point.code}
                  </Popup>
                </Marker>
              )
            })}
            <FitBounds geojson={mapData?.boundary} points={activePoints} />
          </MapContainer>

          <div className="absolute bottom-4 right-4 bg-background/90 p-4 rounded-lg shadow border z-[1000] text-sm space-y-1">
            <p>
              <strong>Área Declarada:</strong> {area.declared_area_ha || area.total_area_ha || 0} ha
            </p>
            <p>
              <strong>Área Calculada:</strong>{' '}
              {area.calculated_area_ha ? `${area.calculated_area_ha} ha` : 'N/A'}
            </p>
            <p>
              <strong>Campanha:</strong> {selectedCampaignName}
            </p>
            <p>
              <strong>Pontos:</strong> {activePoints.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {wizardOpen && (
        <GeographicWizard
          area={area}
          mapData={mapData}
          campaigns={campaigns || []}
          onClose={() => setWizardOpen(false)}
          onSuccess={() => {
            setWizardOpen(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
