import { supabase } from '../lib/supabaseClient'
import { fetchProduct } from './openFoodFacts'

/**
 * Prompts por nivel de detalle.
 * Nivel 1 = Directo, Nivel 2 = Equilibrado, Nivel 3 = Detallado.
 */
const PROMPTS_BY_LEVEL = {
  1: (product) => `Analiza brevemente: ${product.product_name || product.name}. Marca: ${product.brand || 'N/A'}. Nutriscore: ${product.nutriScore || 'N/A'}. Sé MUY breve: máximo 1 frase corta por campo. Responde ESTRICTAMENTE en JSON con llaves: "veredicto" (máximo 3 palabras), "analisis" (1 frase), "alternativa" (1 frase), "tip" (1 frase corta).`,

  2: (product) => `Analiza este producto: ${product.product_name || product.name}. Marca: ${product.brand || 'N/A'}. Nutriscore: ${product.nutriScore || 'N/A'}. Ingredientes: ${product.ingredients || 'N/A'}. Nutrientes por 100g - Azúcares: ${product.nutriments?.sugar ?? 'N/A'}g, Sal: ${product.nutriments?.salt ?? 'N/A'}g, Grasa: ${product.nutriments?.fat ?? 'N/A'}g, Energía: ${product.nutriments?.energy ?? 'N/A'} kcal. Da un análisis moderado: 2-3 frases por campo. Responde ESTRICTAMENTE en JSON con llaves: "veredicto" (frase corta), "analisis" (2-3 frases, puntos clave), "alternativa" (1-2 frases), "tip" (1 frase práctica).`,

  3: (product) => `Eres un nutricionista experto. Analiza en profundidad este producto: ${product.product_name || product.name}. Marca: ${product.brand || 'N/A'}. Nutriscore: ${product.nutriScore || 'N/A'}. Ingredientes: ${product.ingredients || 'N/A'}. Nutrientes por 100g - Azúcares: ${product.nutriments?.sugar ?? 'N/A'}g, Sal: ${product.nutriments?.salt ?? 'N/A'}g, Grasa: ${product.nutriments?.fat ?? 'N/A'}g, Energía: ${product.nutriments?.energy ?? 'N/A'} kcal. Da un análisis detallado y experto. Responde ESTRICTAMENTE en JSON con llaves: "veredicto" (frase descriptiva), "analisis" (análisis completo de ingredientes y nutrientes, impacto en salud), "alternativa" (sugerencia detallada con producto específico), "tip" (consejo práctico y educativo).`,
}

/**
 * getProductAnalysis
 * Diagnóstico dinámico de modelos con nivel de detalle configurable.
 * @param {object} product - Producto a analizar
 * @param {number} detailLevel - Nivel de detalle (1, 2 o 3). Default: 2
 */
export async function getProductAnalysis(product, detailLevel = 2) {
  if (!product || (!product.barcode && !product.name)) return null

  // 1. Check Cache (solo si el nivel coincide para evitar resultados inapropiados)
  try {
    const cacheKey = `ai_analysis_l${detailLevel}`
    const { data: cached } = await supabase
      .from('global_products')
      .select('ai_analysis')
      .eq('barcode', product.barcode)
      .single()

    if (cached?.ai_analysis) {
      try {
        const parsed = JSON.parse(cached.ai_analysis)
        // Si el caché tiene el nivel almacenado y coincide, usarlo
        if (parsed._level === detailLevel) return parsed
      } catch (_) { /* cache inválido, seguir */ }
    }
  } catch (err) {
    console.warn('[aiAdvisor] Cache check failed:', err)
  }

  // 1.5. Complement data
  let fullProduct = { ...product }
  if (!product.ingredients || !product.nutriments || !product.nutriments?.sugar) {
    try {
      const freshData = await fetchProduct(product.barcode)
      if (freshData) fullProduct = { ...product, ...freshData }
    } catch (e) {
      console.warn('[aiAdvisor] No se pudo complementar la info:', e)
    }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  try {
    console.log(`[aiAdvisor] Nivel de detalle: ${detailLevel}`)
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`)
    const modelsData = await modelsRes.json()

    if (!modelsData.models || modelsData.models.length === 0) {
      throw new Error('Google dice que no tienes modelos disponibles. ¿Está activa la Gemini API?')
    }

    const availableModels = modelsData.models.map(m => m.name.split('/').pop())
    const priorityOrder = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro']
    const modelToUse = priorityOrder.find(m => availableModels.includes(m)) || availableModels[0]

    console.log(`[aiAdvisor] Modelo: ${modelToUse}`)

    // Seleccionar prompt según nivel
    const level = [1, 2, 3].includes(detailLevel) ? detailLevel : 2
    const promptFn = PROMPTS_BY_LEVEL[level]
    const prompt = promptFn(fullProduct)

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const data = await response.json()

    if (data.candidates && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text
      const jsonStr = text.replace(/```json|```/gi, '').trim()
      const analysis = JSON.parse(jsonStr)

      // Guardar el nivel junto con el análisis para distinguir caché
      analysis._level = level

      // Save Cache
      if (product.barcode) {
        supabase.from('global_products').update({ ai_analysis: JSON.stringify(analysis) }).eq('barcode', product.barcode).then(() => {})
      }
      return analysis
    } else {
      console.error('[aiAdvisor] Error en la generación:', data)
      throw new Error(data.error?.message || 'Error desconocido en Gemini')
    }

  } catch (err) {
    console.error('[aiAdvisor] Diagnóstico fallido:', err)
    throw new Error('Falló la conexión con el asesor IA.')
  }
}
