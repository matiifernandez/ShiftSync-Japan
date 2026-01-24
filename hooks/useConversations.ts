import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "expo-router";

export interface Conversation {
  id: string;
  name: string;
  type: "group" | "direct";
  last_message?: string;
  last_message_time?: string;
  avatar_url?: string;
  unread_count?: number;
  is_pinned?: boolean;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase.rpc("get_my_conversations");

      if (error) throw error;

      if (data) {
        setConversations(data as Conversation[]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      // Fetch in background when focusing (to update without spinner)
      fetchConversations(true);
    }, [fetchConversations])
  );

  // Realtime Subscription for List Updates
  useEffect(() => {
    const channel = supabase
      .channel("conversations-list-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
           console.log("New message in list view, refreshing...", payload);
           // Refresh list quietly (isBackground = true)
           fetchConversations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  return { 
      conversations, 
      loading, 
      refreshConversations: () => fetchConversations(false) // Pull to refresh shows loader
  };
}