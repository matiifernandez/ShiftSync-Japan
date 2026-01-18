import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './useNotifications';

export function useGlobalRealtime() {
    const { scheduleNotification } = useNotifications();
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Initial fetch
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) userIdRef.current = user.id;
        });

        // Listen for auth changes to avoid stale user ID
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
            userIdRef.current = session?.user.id || null;
        });

        // Setup channel
        const channel = supabase.channel('global_notifications');

        // 1. Listen for New Messages
        channel.on(
            'postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            async (payload) => {
                const newMessage = payload.new as any;
                
                // Ignore my own messages
                if (!userIdRef.current || newMessage.sender_id === userIdRef.current) return;

                // Fetch sender name for better UX
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', newMessage.sender_id)
                    .single();
                
                const senderName = profile?.full_name || 'Someone';

                // Schedule local notification (immediate)
                await scheduleNotification(
                    `New message from ${senderName}`, 
                    newMessage.content_original || 'Sent an image/attachment', 
                    1
                );
            }
        );

        // 2. Listen for Schedule Updates
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'schedule_items' },
            async (payload) => {
                const newItem = payload.new as any;
                // Only notify if it affects me
                if (!userIdRef.current || (newItem && newItem.user_id !== userIdRef.current)) return;

                if (payload.eventType === 'INSERT') {
                     await scheduleNotification('New Schedule Item', 'A new shift or event has been added to your calendar.', 1);
                } else if (payload.eventType === 'UPDATE') {
                     await scheduleNotification('Schedule Change', 'Your schedule has been updated.', 1);
                }
            }
        );

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
            authListener.unsubscribe();
        };
    }, []);
}
