import shp from 'shpjs'
import proj4 from 'proj4'
import * as turf from '@turf/turf'

proj4.defs('EPSG:32723', '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs')

export const parseShapefileZip = async (
  file: File,
  projection: string,
  declaredAreaHa?: number,
) => {
  const buffer = await file.arrayBuffer()
  const geojson = await shp(buffer)

  const layers = Array.isArray(geojson) ? geojson : [geojson]

  let boundaryLayer: any = null
  let pointsLayer: any = null

  for (const layer of layers) {
    const type = layer.features[0]?.geometry?.type
    if (type === 'Polygon' || type === 'MultiPolygon') boundaryLayer = layer
    if (type === 'Point' || type === 'MultiPoint') pointsLayer = layer
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

  let calculatedAreaHa = 0
  let divergencePct = 0
  let boundaryGeom = boundaryLayer ? boundaryLayer.features[0].geometry : null

  if (boundaryGeom) {
    if (boundaryGeom.type === 'Polygon') {
      boundaryGeom = { type: 'MultiPolygon', coordinates: [boundaryGeom.coordinates] }
    }
    const polygon = turf.feature(boundaryGeom)
    const areaSqm = turf.area(polygon)
    calculatedAreaHa = areaSqm / 10000
    if (declaredAreaHa) {
      divergencePct = (Math.abs(calculatedAreaHa - declaredAreaHa) / declaredAreaHa) * 100
    }
  }

  const pointsList: any[] = []

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
      pointsList.push({ code: code.toString(), lng: coords[0], lat: coords[1] })
    })
  }

  return { boundaryGeom, pointsList, calculatedAreaHa, divergencePct }
}

export const validatePointsAgainstBoundary = (points: any[], boundaryGeom: any) => {
  const summary = { pointsInside: 0, pointsOutside: 0, outsideCodes: [] as string[] }
  if (!boundaryGeom || points.length === 0) return summary
  const polygon = turf.feature(boundaryGeom)

  points.forEach((pt) => {
    const point = turf.point([pt.lng, pt.lat])
    if (!turf.booleanPointInPolygon(point, polygon)) {
      summary.pointsOutside++
      summary.outsideCodes.push(pt.code)
    } else {
      summary.pointsInside++
    }
  })
  return summary
}
