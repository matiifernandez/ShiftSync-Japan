import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  try {
    const { record, type, table } = await req.json() // Supabase webhook sends 'table' and 'type' (INSERT/UPDATE)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    if (!record) {
       return new Response(JSON.stringify({ message: 'Missing record data' }), { status: 200 })
    }

    let notifications = [];

    // --- CASE 1: CHAT MESSAGE (INSERT) ---
    if (record.conversation_id && record.content_original) {
        
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

        // 3. Get recipients
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`user_id, profiles:user_id (expo_push_token)`)
          .eq('conversation_id', record.conversation_id)
          .neq('user_id', record.sender_id)

        const tokens = participants?.map(p => (p.profiles as any)?.expo_push_token).filter(t => !!t) || []

        if (tokens.length > 0) {
            const title = conversation?.is_group ? `${conversation.name}` : `${senderName}`
            const body = conversation?.is_group ? `${senderName}: ${record.content_original}` : record.content_original
            
            notifications = tokens.map(token => ({
              to: token,
              sound: 'default',
              title,
              body,
              data: { conversationId: record.conversation_id, type: 'chat' }
            }))
        }
    } 
    
    // --- CASE 2: EXPENSE UPDATE (STATUS CHANGE) ---
    else if (record.amount && record.status && (record.status === 'approved' || record.status === 'rejected')) {
        
        // 1. Get owner token
        const { data: owner } = await supabase
            .from('profiles')
            .select('expo_push_token')
            .eq('id', record.user_id)
            .single()
        
        if (owner?.expo_push_token) {
            const isApproved = record.status === 'approved';
            const icon = isApproved ? '✅' : '❌';
            const title = `Expense ${isApproved ? 'Approved' : 'Rejected'}`;
            const body = `${icon} Your expense of ¥${record.amount} has been ${record.status}.`;

            notifications.push({
                to: owner.expo_push_token,
                sound: 'default',
                title,
                body,
                data: { expenseId: record.id, type: 'expense' }
            });
        }
    }

    if (notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No notifications sent' }), { status: 200 })
    }

    // --- SEND TO EXPO ---
    console.log(`Sending ${notifications.length} notifications...`)

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
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
