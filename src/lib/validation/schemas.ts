import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

export const producerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  document: z.string().optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

export const farmSchema = z.object({
  producer_id: z.string().min(1, 'Selecione um produtor'),
  name: z.string().min(3, 'Nome da fazenda é obrigatório'),
  city: z.string().optional(),
  state: z.string().optional(),
  total_area_ha: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

export const areaSchema = z.object({
  farm_id: z.string().min(1, 'Selecione uma fazenda'),
  name: z.string().min(2, 'Nome da área é obrigatório'),
  total_area_ha: z.coerce.number().positive('Tamanho deve ser maior que zero'),
  notes: z.string().optional(),
})

export const seasonSchema = z.object({
  season_year: z.string().min(4, 'Ano da safra inválido (ex: 2024)'),
  crop: z.string().optional(),
  expected_yield: z.coerce.number().min(0).optional(),
})
