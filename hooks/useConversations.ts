import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "expo-router";

export interface Conversation {
  id: string;
  name: string;
  type: "group" | "direct";
  last_message?: string;
  last_message_time?: string;
  avatar_url?: string;
  unread_count?: number; // Not implemented in RPC yet, simpler on client for now or V2
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call the Database Function (RPC)
      // Note: This requires the function 'get_my_conversations' to exist in Supabase
      const { data, error } = await supabase.rpc("get_my_conversations");

      if (error) throw error;

      if (data) {
        // Map any type discrepancies if needed, usually RPC returns match the interface
        setConversations(data as Conversation[]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when screen comes into focus (in case new messages arrived while in a chat)
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  return { conversations, loading, refreshConversations: fetchConversations };
}
