import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx@0.18.5'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) throw new Error('Autenticação obrigatória.')

    const payload = await req.json()
    const { action } = payload

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Sessão inválida.')

    if (action === 'template') {
      const { data: attributes, error: attrError } = await supabase
        .from('lab_attributes')
        .select('code, name, unit')
        .eq('active', true)
        .order('display_order', { ascending: true })
      
      if (attrError) throw attrError

      const headers = ['PONTO', ...attributes.map((a: any) => a.code)]
      const workbook = XLSX.utils.book_new()
      
      const sheet0_20 = XLSX.utils.aoa_to_sheet([headers])
      XLSX.utils.book_append_sheet(workbook, sheet0_20, 'SOLO_0_20')
      
      const sheet20_40 = XLSX.utils.aoa_to_sheet([headers])
      XLSX.utils.book_append_sheet(workbook, sheet20_40, 'SOLO_20_40')
      
      const readmeData = [
        ['Instruções para Importação de Análises de Solo'],
        ['1. Preencha os dados nas abas SOLO_0_20 e SOLO_20_40 correspondentes às profundidades.'],
        ['2. A coluna PONTO é obrigatória e deve conter o código exato do ponto amostral na campanha.'],
        ['3. As demais colunas são os atributos laboratoriais. Preencha apenas com valores numéricos.'],
        ['4. Você pode deixar colunas vazias caso não tenha o resultado.'],
        ['5. Não altere o nome das abas nem o nome das colunas na linha 1.']
      ]
      const sheetReadme = XLSX.utils.aoa_to_sheet(readmeData)
      XLSX.utils.book_append_sheet(workbook, sheetReadme, 'LEIA_ME')

      const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
      return new Response(JSON.stringify({ success: true, base64 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    if (action === 'import') {
      const { importId, orgId, campaignId, filePath, metadata } = payload
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('soil-imports')
        .download(filePath)
      
      if (downloadError || !fileData) throw new Error(`Falha ao baixar arquivo: ${downloadError?.message}`)

      const arrayBuffer = await fileData.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })

      const { data: points, error: pointsError } = await supabase
        .from('sampling_points')
        .select('id, code')
        .eq('campaign_id', campaignId)
        .eq('organization_id', orgId)
      
      if (pointsError) throw pointsError
      const pointMap = new Map(points.map((p: any) => [String(p.code).trim(), p.id]))

      const { data: attributes, error: attrError } = await supabase
        .from('lab_attributes')
        .select('code')
        .eq('active', true)
      
      if (attrError) throw attrError
      const validAttrCodes = new Set(attributes.map((a: any) => a.code))

      const samples: any[] = []
      const measurements: any[] = []
      const errors: string[] = []

      const processSheet = (sheetName: string, depthFrom: number, depthTo: number) => {
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) return

        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null })
        
        if (rows.length > 0) {
          const headers = Object.keys(rows[0])
          if (!headers.includes('PONTO')) {
            errors.push(`Aba ${sheetName}: Coluna 'PONTO' não encontrada.`)
            return
          }
          headers.forEach(h => {
            if (h !== 'PONTO' && !validAttrCodes.has(h)) {
              errors.push(`Aba ${sheetName}: Coluna '${h}' desconhecida e será ignorada.`)
            }
          })
        }

        const seenPoints = new Set<string>()

        rows.forEach((row, index) => {
          const rowNum = index + 2
          const ptCode = String(row['PONTO'] || '').trim()
          if (!ptCode) return

          if (!pointMap.has(ptCode)) {
            errors.push(`Aba ${sheetName}, Linha ${rowNum}: Ponto '${ptCode}' não encontrado na campanha.`)
            return
          }

          if (seenPoints.has(ptCode)) {
            errors.push(`Aba ${sheetName}, Linha ${rowNum}: Ponto '${ptCode}' duplicado na mesma profundidade.`)
            return
          }
          seenPoints.add(ptCode)

          const pointId = pointMap.get(ptCode)
          const sampleCode = `${ptCode}-${depthFrom}-${depthTo}`
          
          samples.push({
            point_id: pointId,
            code: sampleCode,
            depth_from: depthFrom,
            depth_to: depthTo
          })

          Object.entries(row).forEach(([col, val]) => {
            if (col === 'PONTO' || val === null || val === '') return
            
            if (validAttrCodes.has(col)) {
              const numVal = Number(val)
              if (isNaN(numVal)) {
                errors.push(`Aba ${sheetName}, Linha ${rowNum}: Valor inválido para '${col}' ('${val}'). Deve ser numérico.`)
              } else {
                measurements.push({
                  sample_code: sampleCode,
                  attribute_code: col,
                  value: numVal
                })
              }
            }
          })
        })
      }

      processSheet('SOLO_0_20', 0, 20)
      processSheet('SOLO_20_40', 20, 40)

      if (errors.length > 0) {
        await supabase.from('imports').update({
          status: 'failed',
          error_summary: { errors: errors.slice(0, 50) }
        }).eq('id', importId)
        
        return new Response(JSON.stringify({ success: false, errors }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      if (samples.length === 0) {
        return new Response(JSON.stringify({ success: false, errors: ['Nenhum dado válido encontrado para importar.'] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const { error: rpcError } = await supabase.rpc('commit_soil_analysis_import', {
        p_import_id: importId,
        p_org_id: orgId,
        p_campaign_id: campaignId,
        p_metadata: metadata,
        p_samples: samples,
        p_measurements: measurements
      })

      if (rpcError) throw rpcError

      return new Response(JSON.stringify({ success: true, samplesCount: samples.length, measurementsCount: measurements.length }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    throw new Error('Ação inválida.')
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
