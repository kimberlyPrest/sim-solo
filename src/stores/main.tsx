import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Producer {
  id: string
  name: string
  document: string
  email: string
}
export interface Farm {
  id: string
  producerId: string
  name: string
  location: string
}
export interface Area {
  id: string
  farmId: string
  name: string
  sizeHectares: number
}
export interface Season {
  id: string
  name: string
  year: string
}
export interface Campaign {
  id: string
  seasonId: string
  areaId: string
  name: string
  status: string
}
export interface Point {
  id: string
  campaignId: string
  code: string
  lat: number
  lng: number
}
export interface Measurement {
  id: string
  pointId: string
  depth: string
  property: string
  value: number
}

interface MainStoreData {
  producers: Producer[]
  farms: Farm[]
  areas: Area[]
  seasons: Season[]
  campaigns: Campaign[]
  points: Point[]
  measurements: Measurement[]
  addProducer: (p: Omit<Producer, 'id'>) => void
  addFarm: (f: Omit<Farm, 'id'>) => void
  addArea: (a: Omit<Area, 'id'>) => void
  addSeason: (s: Omit<Season, 'id'>) => void
  addCampaign: (c: Omit<Campaign, 'id'>) => void
  addMeasurement: (m: Omit<Measurement, 'id'>) => void
}

const MOCK_PRODUCERS = [
  { id: '1', name: 'João Batista', document: '123.456.789-00', email: 'joao@example.com' },
]
const MOCK_FARMS = [
  { id: '1', producerId: '1', name: 'Fazenda Boa Vista', location: 'Rio Verde - GO' },
]
const MOCK_AREAS = [{ id: '1', farmId: '1', name: 'Talhão Leste', sizeHectares: 150 }]
const MOCK_SEASONS = [{ id: '1', name: 'Safra Verão', year: '2026' }]
const MOCK_CAMPAIGNS = [
  { id: '1', seasonId: '1', areaId: '1', name: 'Amostragem Pós-Colheita', status: 'Em Andamento' },
]
const MOCK_POINTS = [
  { id: '1', campaignId: '1', code: 'P01', lat: -17.79, lng: -50.92 },
  { id: '2', campaignId: '1', code: 'P02', lat: -17.8, lng: -50.93 },
]
const MOCK_MEASUREMENTS = [{ id: '1', pointId: '1', depth: '0-20cm', property: 'pH', value: 5.8 }]

const MainContext = createContext<MainStoreData | null>(null)

export function MainProvider({ children }: { children: ReactNode }) {
  const [producers, setProducers] = useState<Producer[]>(MOCK_PRODUCERS)
  const [farms, setFarms] = useState<Farm[]>(MOCK_FARMS)
  const [areas, setAreas] = useState<Area[]>(MOCK_AREAS)
  const [seasons, setSeasons] = useState<Season[]>(MOCK_SEASONS)
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS)
  const [points, setPoints] = useState<Point[]>(MOCK_POINTS)
  const [measurements, setMeasurements] = useState<Measurement[]>(MOCK_MEASUREMENTS)

  const addProducer = (p: Omit<Producer, 'id'>) =>
    setProducers((prev) => [...prev, { ...p, id: Date.now().toString() }])
  const addFarm = (f: Omit<Farm, 'id'>) =>
    setFarms((prev) => [...prev, { ...f, id: Date.now().toString() }])
  const addArea = (a: Omit<Area, 'id'>) =>
    setAreas((prev) => [...prev, { ...a, id: Date.now().toString() }])
  const addSeason = (s: Omit<Season, 'id'>) =>
    setSeasons((prev) => [...prev, { ...s, id: Date.now().toString() }])
  const addCampaign = (c: Omit<Campaign, 'id'>) => {
    const id = Date.now().toString()
    setCampaigns((prev) => [...prev, { ...c, id }])
    // Auto generate georeferenced points to simulate GIS data
    setPoints((prev) => [
      ...prev,
      { id: `pt-${id}-1`, campaignId: id, code: `P01-${id.slice(-4)}`, lat: -17.0, lng: -50.0 },
      { id: `pt-${id}-2`, campaignId: id, code: `P02-${id.slice(-4)}`, lat: -17.1, lng: -50.1 },
    ])
  }
  const addMeasurement = (m: Omit<Measurement, 'id'>) =>
    setMeasurements((prev) => [...prev, { ...m, id: Date.now().toString() }])

  return (
    <MainContext.Provider
      value={{
        producers,
        farms,
        areas,
        seasons,
        campaigns,
        points,
        measurements,
        addProducer,
        addFarm,
        addArea,
        addSeason,
        addCampaign,
        addMeasurement,
      }}
    >
      {children}
    </MainContext.Provider>
  )
}

export default function useMainStore() {
  const context = useContext(MainContext)
  if (!context) throw new Error('useMainStore must be used within MainProvider')
  return context
}
