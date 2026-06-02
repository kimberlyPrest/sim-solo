import shp from 'shpjs'
import proj4 from 'proj4'
import * as turf from '@turf/turf'

proj4.defs('EPSG:32723', '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs')

const pointCodeKeys = ['ID', 'CODE', 'CODIGO', 'PONTO', 'id', 'code', 'codigo', 'ponto', 'name']

const transformCoordinates = (coordinates: any, sourceProjection: string): any => {
  if (sourceProjection === 'EPSG:4326') return coordinates
  if (typeof coordinates[0] === 'number') {
    return proj4(sourceProjection, 'EPSG:4326', coordinates)
  }
  return coordinates.map((child: any) => transformCoordinates(child, sourceProjection))
}

const getPointCode = (properties: Record<string, unknown>, index: number) => {
  const key = pointCodeKeys.find((candidate) => properties[candidate] != null)
  const code = key ? String(properties[key]).trim() : ''
  if (!code) {
    throw new Error(`O ponto ${index + 1} não possui identificador no DBF.`)
  }
  return code
}

export const parseShapefileZip = async (
  file: File,
  sourceProjection: string,
  declaredAreaHa?: number | null,
) => {
  const geojson = await shp(await file.arrayBuffer())
  const layers = Array.isArray(geojson) ? geojson : [geojson]
  const features = layers.flatMap((layer: any) => layer.features || [])
  const polygonFeatures = features.filter((feature: any) =>
    ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type),
  )
  const pointFeatures = features.flatMap((feature: any) => {
    if (feature.geometry?.type === 'Point') return [feature]
    if (feature.geometry?.type !== 'MultiPoint') return []
    return feature.geometry.coordinates.map((coordinates: number[]) => ({
      ...feature,
      geometry: { type: 'Point', coordinates },
    }))
  })

  if (polygonFeatures.length > 1) {
    throw new Error('O ZIP deve conter exatamente um polígono ou multipolígono para o contorno.')
  }

  let boundaryGeom: any = null
  if (polygonFeatures.length === 1) {
    const geometry = polygonFeatures[0].geometry
    const coordinates = transformCoordinates(geometry.coordinates, sourceProjection)
    boundaryGeom =
      geometry.type === 'Polygon'
        ? { type: 'MultiPolygon', coordinates: [coordinates] }
        : { type: 'MultiPolygon', coordinates }
  }

  const pointsList = pointFeatures.map((feature: any, index: number) => {
    const [lng, lat] = transformCoordinates(feature.geometry.coordinates, sourceProjection)
    return {
      code: getPointCode(feature.properties || {}, index),
      lng,
      lat,
    }
  })

  const uniqueCodes = new Set(pointsList.map((point) => point.code))
  if (uniqueCodes.size !== pointsList.length) {
    throw new Error('Os identificadores dos pontos devem ser únicos dentro do arquivo.')
  }

  let calculatedAreaHa = 0
  let divergencePct = 0
  if (boundaryGeom) {
    calculatedAreaHa = turf.area(turf.feature(boundaryGeom)) / 10_000
    if (declaredAreaHa) {
      divergencePct = (Math.abs(calculatedAreaHa - declaredAreaHa) / declaredAreaHa) * 100
    }
  }

  return { boundaryGeom, pointsList, calculatedAreaHa, divergencePct }
}

export const validatePointsAgainstBoundary = (points: any[], boundaryGeom: any) => {
  const summary = { pointsInside: 0, pointsOutside: 0, outsideCodes: [] as string[] }
  if (!boundaryGeom || points.length === 0) return summary

  const polygon = turf.feature(boundaryGeom)
  points.forEach((point) => {
    if (turf.booleanPointInPolygon(turf.point([point.lng, point.lat]), polygon)) {
      summary.pointsInside += 1
    } else {
      summary.pointsOutside += 1
      summary.outsideCodes.push(point.code)
    }
  })
  return summary
}
