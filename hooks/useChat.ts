import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content_original: string;
  content_translated?: string;
  original_language?: string;
  created_at: string;
  sender_name?: string; // Virtual field for UI
  avatar_url?: string;  // Virtual field for UI
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<string | null>(null);

  // 1. Fetch initial history
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userRef.current = user?.id || null;

      // Join with profiles to get sender names
      const { data, error } = await supabase
        .from("messages")
        .select(`
            *,
            profiles:sender_id (full_name, avatar_url)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false }); // Latest first

      if (error) throw error;

      // Transform data to flat structure
      const formattedMessages = data.map((msg: any) => ({
        ...msg,
        sender_name: msg.profiles?.full_name || "Unknown",
        avatar_url: msg.profiles?.avatar_url
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // 2. Realtime Subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
           console.log("New message received!", payload);
           const newMessage = payload.new as any;
           
           // Fetch sender profile info for the new message to display name correctly
           // Optimization: If sender is ME, I already know my name, but fetching is safer for consistency
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("id", newMessage.sender_id)
                .single();

            const msgWithProfile: Message = {
                id: newMessage.id,
                conversation_id: newMessage.conversation_id,
                sender_id: newMessage.sender_id,
                content_original: newMessage.content_original,
                content_translated: newMessage.content_translated,
                original_language: newMessage.original_language,
                created_at: newMessage.created_at,
                sender_name: profile?.full_name || "Unknown",
                avatar_url: profile?.avatar_url
            };

           setMessages((prev) => [msgWithProfile, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  // 3. Send Message Function
  const sendMessage = async (text: string) => {
    if (!text.trim() || !userRef.current) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userRef.current,
        content_original: text,
        original_language: 'en' // Defaulting to 'en' for now, later we can auto-detect
      });

      if (error) throw error;
      // Realtime will handle the UI update
    } catch (err) {
      Alert.alert("Error", "Could not send message");
      console.error(err);
    }
  };

  return { 
      messages, 
      loading, 
      sendMessage,
      currentUserId: userRef.current 
  };
}
