import * as z from 'zod'

export const producerSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  document: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export const farmSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  producer_id: z.string().uuid('Selecione um produtor'),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  total_area_ha: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const areaSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  farm_id: z.string().uuid('Selecione uma fazenda'),
  total_area_ha: z.number().min(0).optional(),
  declared_area_ha: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const seasonSchema = z.object({
  season_year: z.string().min(4, 'Ano safra obrigatório'),
  crop: z.string().optional(),
  expected_yield: z.number().min(0).optional(),
})
