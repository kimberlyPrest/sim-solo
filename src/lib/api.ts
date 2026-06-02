export interface Producer {
  id: string
  name: string
  document: string
}
export interface Farm {
  id: string
  producerId: string
  name: string
  totalArea: number
}
export interface Area {
  id: string
  farmId: string
  name: string
  size: number
  geom?: string
}
export interface Season {
  id: string
  name: string
  year: string
}
export interface Campaign {
  id: string
  areaId: string
  seasonId: string
  date: string
  status: string
}
export interface Point {
  id: string
  campaignId: string
  name: string
  lat: number
  lng: number
}
export interface Depth {
  id: string
  name: string
}
export interface MeasurementType {
  id: string
  name: string
  unit: string
}
export interface Measurement {
  id: string
  pointId: string
  depthId: string
  typeId: string
  value: number
}

const db = {
  producers: [
    { id: '1', name: 'Agropecuária Vale Verde', document: '11.222.333/0001-44' },
    { id: '2', name: 'João Batista Silva', document: '123.456.789-00' },
  ] as Producer[],
  farms: [{ id: '1', producerId: '1', name: 'Fazenda Boa Vista', totalArea: 1200 }] as Farm[],
  areas: [{ id: '1', farmId: '1', name: 'Talhão A', size: 200 }] as Area[],
  seasons: [{ id: '1', name: 'Verão 2023/24', year: '2023' }] as Season[],
  campaigns: [
    { id: '1', areaId: '1', seasonId: '1', date: '2023-09-15', status: 'Coletada' },
  ] as Campaign[],
  points: [{ id: '1', campaignId: '1', name: 'Ponto 01', lat: -15.7801, lng: -47.9292 }] as Point[],
  depths: [
    { id: '1', name: '0-20cm' },
    { id: '2', name: '20-40cm' },
  ] as Depth[],
  measurementTypes: [
    { id: '1', name: 'pH', unit: '-' },
    { id: '2', name: 'Fósforo (P)', unit: 'mg/dm³' },
    { id: '3', name: 'Potássio (K)', unit: 'cmolc/dm³' },
  ] as MeasurementType[],
  measurements: [{ id: '1', pointId: '1', depthId: '1', typeId: '1', value: 6.2 }] as Measurement[],
}

const delay = () => new Promise((res) => setTimeout(res, 200))
const genId = () => Math.random().toString(36).slice(2, 9)

export const api = {
  getDashboardStats: async () => {
    await delay()
    const activeCampaigns = db.campaigns.filter((c) => c.status !== 'Analisada').length
    const hectares = db.farms.reduce((acc, f) => acc + f.totalArea, 0)
    return {
      producers: db.producers.length,
      hectares,
      activeCampaigns,
      recentAnalyses: db.measurements.length,
    }
  },
  getRecentPoints: async () => {
    await delay()
    return db.points.slice(-5).map((p) => {
      const c = db.campaigns.find((c) => c.id === p.campaignId)
      return { ...p, campaignName: c ? c.date : 'Desconhecida' }
    })
  },

  getProducers: async () => {
    await delay()
    return [...db.producers]
  },
  getProducer: async (id: string) => {
    await delay()
    return db.producers.find((p) => p.id === id)
  },
  createProducer: async (data: Omit<Producer, 'id'>) => {
    await delay()
    const newProd = { ...data, id: genId() }
    db.producers.push(newProd)
    return newProd
  },

  getFarmsByProducer: async (prodId: string) => {
    await delay()
    return db.farms.filter((f) => f.producerId === prodId)
  },
  getFarm: async (id: string) => {
    await delay()
    return db.farms.find((f) => f.id === id)
  },
  createFarm: async (data: Omit<Farm, 'id'>) => {
    await delay()
    const newFarm = { ...data, id: genId() }
    db.farms.push(newFarm)
    return newFarm
  },

  getAreasByFarm: async (farmId: string) => {
    await delay()
    return db.areas.filter((a) => a.farmId === farmId)
  },
  getArea: async (id: string) => {
    await delay()
    return db.areas.find((a) => a.id === id)
  },
  createArea: async (data: Omit<Area, 'id'>) => {
    await delay()
    const newArea = { ...data, id: genId() }
    db.areas.push(newArea)
    return newArea
  },

  getSeasons: async () => {
    await delay()
    return [...db.seasons]
  },
  getCampaignsByArea: async (areaId: string) => {
    await delay()
    return db.campaigns.filter((c) => c.areaId === areaId)
  },
  getCampaign: async (id: string) => {
    await delay()
    return db.campaigns.find((c) => c.id === id)
  },
  createCampaign: async (data: Omit<Campaign, 'id'>) => {
    await delay()
    const newCamp = { ...data, id: genId() }
    db.campaigns.push(newCamp)
    return newCamp
  },

  getPointsByCampaign: async (campId: string) => {
    await delay()
    return db.points.filter((p) => p.campaignId === campId)
  },
  createPoint: async (data: Omit<Point, 'id'>) => {
    await delay()
    const newPoint = { ...data, id: genId() }
    db.points.push(newPoint)
    return newPoint
  },

  getDepths: async () => {
    await delay()
    return [...db.depths]
  },
  getMeasurementTypes: async () => {
    await delay()
    return [...db.measurementTypes]
  },
  getMeasurementsByPoint: async (pointId: string) => {
    await delay()
    return db.measurements.filter((m) => m.pointId === pointId)
  },
  createMeasurement: async (data: Omit<Measurement, 'id'>) => {
    await delay()
    const newMeas = { ...data, id: genId() }
    db.measurements.push(newMeas)
    return newMeas
  },
}
