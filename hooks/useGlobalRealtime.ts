import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

type ScheduleNotificationFn = (title: string, body: string, seconds?: number) => Promise<void>;

export function useGlobalRealtime(scheduleNotification: ScheduleNotificationFn, enabled = true) {
    const userIdRef = useRef<string | null>(null);
    // Keep a stable ref so the effect closure always calls the latest function
    const scheduleRef = useRef<ScheduleNotificationFn>(scheduleNotification);
    useEffect(() => { scheduleRef.current = scheduleNotification; }, [scheduleNotification]);

    useEffect(() => {
        if (!enabled) {
            userIdRef.current = null;
            return;
        }

        // Initial fetch
        (async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) userIdRef.current = user.id;
            } catch (error) {
                console.warn("Realtime init skipped (network/auth unavailable).");
            }
        })();

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
                try {
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
                    await scheduleRef.current(
                        `New message from ${senderName}`, 
                        newMessage.content_original || 'Sent an image/attachment', 
                        1
                    );
                } catch (error) {
                    console.warn("Realtime message notification skipped due to a network error.");
                }
            }
        );

        // 2. Listen for Schedule Updates
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'schedule_items' },
            async (payload) => {
                try {
                    const newItem = payload.new as any;
                    // Only notify if it affects me
                    if (!userIdRef.current || (newItem && newItem.user_id !== userIdRef.current)) return;

                    if (payload.eventType === 'INSERT') {
                         await scheduleRef.current('New Schedule Item', 'A new shift or event has been added to your calendar.', 1);
                    } else if (payload.eventType === 'UPDATE') {
                         await scheduleRef.current('Schedule Change', 'Your schedule has been updated.', 1);
                    }
                } catch (error) {
                    console.warn("Realtime schedule notification skipped due to a network error.");
                }
            }
        );

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
            authListener.unsubscribe();
        };
    }, [enabled]);
}
