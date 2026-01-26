import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const userRef = useRef<string | null>(null);

  // 0. Initialize User Ref
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      userRef.current = user?.id || null;
    });
  }, []);

  // 1. Fetch Messages (Query)
  const { data: messages = [], isLoading: loading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      userRef.current = user?.id || null;

      if (user?.id) {
        // MARK AS READ: Update last_read_at timestamp
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
      }

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
      return data.map((msg: any) => ({
        ...msg,
        sender_name: msg.profiles?.full_name || "Unknown",
        avatar_url: msg.profiles?.avatar_url
      })) as Message[];
    },
    enabled: !!conversationId,
  });

  // 2. Send Message (Mutation)
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!text.trim() || !userRef.current) throw new Error("Invalid message");

      const { data, error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userRef.current,
        content_original: text,
        original_language: 'en'
      }).select().single();

      if (error) throw error;
      return data;
    },
    onMutate: async (text) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

      // Optimistic Update
      if (userRef.current) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: userRef.current,
          content_original: text,
          created_at: new Date().toISOString(),
          sender_name: "Me", // Will be updated on invalidate
          avatar_url: undefined, // Optional
        };

        queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => [optimisticMessage, ...(old || [])]);
      }

      return { previousMessages };
    },
    onError: (err, newTodo, context) => {
      // Rollback
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', conversationId], context.previousMessages);
      }
      Alert.alert("Error", "Could not send message");
    },
    onSettled: () => {
      // Refetch to get real ID and server data
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    }
  });

  // 3. Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*", 
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
           console.log("Realtime event received!", payload.eventType);
           const newMessage = payload.new as any;

           if (payload.eventType === 'INSERT') {
              // Fetch sender profile info
              const { data: profile } = await supabase
                  .from("profiles")
                  .select("full_name, avatar_url")
                  .eq("id", newMessage.sender_id)
                  .single();

              const msgWithProfile: Message = {
                  ...newMessage,
                  sender_name: profile?.full_name || "Unknown",
                  avatar_url: profile?.avatar_url
              };

              queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
                 // Prevent duplicate if we handled it optimistically or via other means
                 // (Usually optimistic update uses temp ID, real one has UUID)
                 // A more robust check might be needed if IDs collide, but UUID vs temp-timestamp is safe.
                 if (old?.some(m => m.id === msgWithProfile.id)) return old;
                 return [msgWithProfile, ...(old || [])];
              });

              // Mark as read
              if (userRef.current) {
                  await supabase
                    .from('conversation_participants')
                    .update({ last_read_at: new Date().toISOString() })
                    .eq('conversation_id', conversationId)
                    .eq('user_id', userRef.current);
              }

           } else if (payload.eventType === 'UPDATE') {
             // Handle translation update
             queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => 
                old?.map(msg => msg.id === newMessage.id ? { ...msg, ...newMessage } : msg)
             );
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const sendMessage = async (text: string) => {
    await sendMessageMutation.mutateAsync(text);
  };

  return { 
      messages, 
      loading, 
      sendMessage,
      currentUserId: userRef.current 
  };
}
