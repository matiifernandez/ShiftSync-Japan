import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "../lib/supabase";

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

interface ChatContextType {
  conversations: Conversation[];
  loading: boolean;
  totalUnreadCount: number;
  refreshConversations: (isBackground?: boolean) => Promise<void>;
  pinConversation: (id: string, isPinned: boolean) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
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

  // Realtime Subscription for List Updates (Global)
  useEffect(() => {
    const channel = supabase
      .channel("global-conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
           console.log("Global ChatContext: New message detected, refreshing...", payload);
           // Refresh list quietly
           fetchConversations(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  const totalUnreadCount = conversations.reduce(
    (sum, chat) => sum + (chat.unread_count || 0),
    0
  );

  const pinConversation = async (id: string, isPinned: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('conversation_members')
        .update({ is_pinned: isPinned })
        .eq('conversation_id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      fetchConversations(true);
    } catch (error) {
      console.error("Error pinning conversation:", error);
      throw error;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('conversation_members')
        .delete()
        .eq('conversation_id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      fetchConversations(true);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        loading,
        totalUnreadCount,
        refreshConversations: fetchConversations,
        pinConversation,
        deleteConversation
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
