import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import shp from 'npm:shpjs@4.0.4'
import proj4 from 'npm:proj4@2.15.0'
import * as turf from 'npm:@turf/turf@7.1.0'

proj4.defs('EPSG:32723', '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { storagePath, action, declaredAreaHa, projection = 'EPSG:4326' } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('soil-imports')
      .download(storagePath)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    const buffer = await fileData.arrayBuffer()
    const geojson = await shp(buffer)

    const layers = Array.isArray(geojson) ? geojson : [geojson]

    let boundaryLayer: any = null
    let pointsLayer: any = null

    for (const layer of layers) {
      const type = layer.features[0]?.geometry?.type
      if (type === 'Polygon' || type === 'MultiPolygon') boundaryLayer = layer
      if (type === 'Point' || type === 'MultiPoint') pointsLayer = layer
    }

    if (action === 'initial' || action === 'update_contour') {
      if (!boundaryLayer)
        throw new Error('A camada de contorno (Polígono) não foi encontrada no arquivo ZIP.')
    }
    if (action === 'initial' || action === 'points_only') {
      if (!pointsLayer)
        throw new Error('A camada de pontos de amostragem não foi encontrada no arquivo ZIP.')
    }

    const convertCoords = (coords: any[], isPolygon: boolean): any[] => {
      if (projection === 'EPSG:4326') return coords
      if (isPolygon) {
        if (typeof coords[0] === 'number') {
          const [x, y] = proj4(projection, 'EPSG:4326', [coords[0], coords[1]])
          return [x, y]
        }
        return coords.map((c: any) => convertCoords(c, true))
      } else {
        const [x, y] = proj4(projection, 'EPSG:4326', [coords[0], coords[1]])
        return [x, y]
      }
    }

    if (boundaryLayer && projection !== 'EPSG:4326') {
      boundaryLayer.features.forEach((f: any) => {
        f.geometry.coordinates = convertCoords(f.geometry.coordinates, true)
      })
    }

    if (pointsLayer && projection !== 'EPSG:4326') {
      pointsLayer.features.forEach((f: any) => {
        f.geometry.coordinates = convertCoords(f.geometry.coordinates, false)
      })
    }

    const validationSummary = {
      boundaryValid: true,
      pointsInside: 0,
      pointsOutside: 0,
      outsideCodes: [] as string[],
    }
    let calculatedAreaHa = 0
    let divergencePct = 0

    const boundaryGeom = boundaryLayer ? boundaryLayer.features[0].geometry : null
    const pointsList: any[] = []

    if (boundaryGeom) {
      const polygon = turf.feature(boundaryGeom)
      const areaSqm = turf.area(polygon)
      calculatedAreaHa = areaSqm / 10000
      if (declaredAreaHa) {
        divergencePct = (Math.abs(calculatedAreaHa - declaredAreaHa) / declaredAreaHa) * 100
      }
    }

    if (pointsLayer) {
      pointsLayer.features.forEach((f: any) => {
        const props = f.properties || {}
        const code =
          props.ID ||
          props.CODE ||
          props.id ||
          props.name ||
          `P-${Math.random().toString(36).substring(7)}`
        const coords = f.geometry.coordinates
        pointsList.push({ code: code.toString(), lon: coords[0], lat: coords[1] })

        if (boundaryGeom) {
          const pt = turf.point(coords)
          const polygon = turf.feature(boundaryGeom)
          if (!turf.booleanPointInPolygon(pt, polygon)) {
            validationSummary.pointsOutside++
            validationSummary.outsideCodes.push(code.toString())
          } else {
            validationSummary.pointsInside++
          }
        }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        boundary: boundaryGeom,
        points: pointsList,
        calculatedAreaHa,
        divergencePct,
        validationSummary,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
