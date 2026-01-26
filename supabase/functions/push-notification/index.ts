import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    if (!record || !record.conversation_id || !record.sender_id) {
       return new Response(JSON.stringify({ message: 'Missing record data' }), { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Get sender info
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', record.sender_id)
      .single()

    const senderName = senderProfile?.full_name || 'Someone'

    // 2. Get conversation info
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, name, is_group')
      .eq('id', record.conversation_id)
      .single()

    // 3. Get all participants tokens except sender
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        profiles:user_id (expo_push_token)
      `)
      .eq('conversation_id', record.conversation_id)
      .neq('user_id', record.sender_id)

    if (participantsError) {
      throw participantsError
    }

    const tokens = participants
      ?.map(p => (p.profiles as any)?.expo_push_token)
      .filter(token => !!token)

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), { status: 200 })
    }

    // 4. Prepare notification content
    const title = conversation?.is_group 
      ? `${conversation.name}` 
      : `${senderName}`
    
    const body = conversation?.is_group
      ? `${senderName}: ${record.content_original}`
      : record.content_original

    // 5. Send to Expo Push API
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { 
        conversationId: record.conversation_id,
        type: 'chat'
      },
    }))

    console.log(`Sending ${messages.length} notifications...`)

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('Expo response:', result)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" }
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
