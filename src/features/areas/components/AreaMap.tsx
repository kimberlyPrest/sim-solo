import { useCallback, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import * as turf from '@turf/turf'
import { supabase } from '@/lib/supabase/client'
import 'leaflet/dist/leaflet.css'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'

const MapUpdater = ({ boundary, points }: { boundary: any; points: any[] }) => {
  const map = useMap()
  useEffect(() => {
    if (boundary) {
      const bbox = turf.bbox(turf.feature(boundary))
      map.fitBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { padding: [20, 20] },
      )
    } else if (points.length > 0) {
      const fc = turf.featureCollection(points.map((p) => turf.point([p.lng, p.lat])))
      const bbox = turf.bbox(fc)
      map.fitBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ],
        { padding: [20, 20] },
      )
    }
  }, [boundary, points, map])
  return null
}

export function AreaMap({
  areaId,
  area,
  campaigns,
}: {
  areaId: string
  area: any
  campaigns: any[]
}) {
  const [boundary, setBoundary] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')

  const fetchGeom = useCallback(async () => {
    const { data: areaData } = await (supabase.rpc as any)('get_area_map_data', {
      p_area_id: areaId,
    })
    setBoundary(areaData?.boundary || null)

    if (selectedCampaign && selectedCampaign !== 'all') {
      const { data: pts } = await (supabase.rpc as any)('get_campaign_points', {
        p_campaign_id: selectedCampaign,
      })
      setPoints(pts || [])
    } else {
      setPoints([])
    }
  }, [areaId, selectedCampaign])

  useEffect(() => {
    fetchGeom()
  }, [fetchGeom])

  const flipCoords = (coords: any[]): any[] => {
    return coords.map((ring) => ring.map((c: number[]) => [c[1], c[0]]))
  }

  const polygonPositions =
    boundary?.type === 'MultiPolygon'
      ? boundary.coordinates.map((poly: any) => flipCoords(poly))
      : boundary?.type === 'Polygon'
        ? flipCoords(boundary.coordinates)
        : []

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="md:col-span-3 h-[500px] overflow-hidden relative">
        <MapContainer center={[-15.7801, -47.9292]} zoom={4} className="w-full h-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapUpdater boundary={boundary} points={points} />
          {boundary && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
            />
          )}
          {points.map((pt) => (
            <CircleMarker
              key={pt.id}
              center={[pt.lat, pt.lng]}
              radius={6}
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.8 }}
            >
              <Tooltip>Ponto: {pt.code}</Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </Card>

      <div className="space-y-4">
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Visualização</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Campanha</label>
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Apenas Contorno</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área Declarada:</span>
              <span className="font-medium">
                {area.declared_area_ha || area.total_area_ha || '-'} ha
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Área Calculada:</span>
              <span className="font-medium">{area.calculated_area_ha?.toFixed(2) || '-'} ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projeção Original:</span>
              <span className="font-medium">{area.source_srid || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de Pontos:</span>
              <span className="font-medium">{points.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
