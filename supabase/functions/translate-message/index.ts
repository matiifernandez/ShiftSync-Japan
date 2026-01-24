import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    
    if (!record || !record.content_original || !record.id) {
       return new Response(JSON.stringify({ message: 'No content to translate' }), { status: 200 })
    }

    console.log(`Translating message ${record.id}: ${record.content_original}`)

    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set')
    }

    // Determine target language (naive check, can be improved)
    // If original_language is set, use it. Otherwise, simple detection or default.
    // Assuming context: User EN -> Target JP, User JP -> Target EN.
    // For now, let's ask the LLM to provide both or infer.
    
    // Simplification: Ask LLM to translate to the "other" language (EN<->JP).
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Updated to latest stable model
        messages: [
          {
            role: "system",
            content: "You are a professional translator for a logistics app. Translate the following text between English and Japanese. If it's English, translate to Japanese. If it's Japanese, translate to English. Return ONLY the translation, no explanations."
          },
          {
            role: "user",
            content: record.content_original
          }
        ],
        temperature: 0.3
      })
    })

    const json = await response.json()
    const translatedText = json.choices?.[0]?.message?.content?.trim()

    if (!translatedText) {
      console.error('Groq returned empty translation', json)
      return new Response(JSON.stringify({ error: 'Translation failed' }), { status: 500 })
    }

    console.log(`Translated: ${translatedText}`)

    // Update the message in Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    const { error } = await supabase
      .from('messages')
      .update({ content_translated: translatedText })
      .eq('id', record.id)

    if (error) {
      console.error('Error updating translation:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, translated: translatedText }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})