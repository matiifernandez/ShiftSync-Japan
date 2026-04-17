import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "../hooks/useTranslation";

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

const normalizeConversationType = (rawType: string | null | undefined): Conversation["type"] =>
  rawType === "direct" ? "direct" : "group";

const isRpcMissing = (error: any): boolean =>
  error?.code === "PGRST202" || String(error?.message || "").includes("get_my_conversations");

type ConversationRpcRow = {
  id: string;
  name: string | null;
  type: string | null;
  last_message: string | null;
  last_message_time: string | null;
  avatar_url: string | null;
  unread_count: number | string | null;
  is_pinned: boolean | null;
};

const normalizeUnreadCount = (rawValue: number | string | null | undefined): number => {
  if (typeof rawValue === "number") return Number.isFinite(rawValue) ? rawValue : 0;
  const parsed = Number(rawValue ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRpcConversation = (
  row: ConversationRpcRow,
  labels: { direct: string; group: string }
): Conversation | null => {
  if (!row?.id) return null;

  const type = normalizeConversationType(row.type);
  const name = String(row.name || "").trim() || (type === "direct" ? labels.direct : labels.group);

  return {
    id: row.id,
    name,
    type,
    last_message: row.last_message || "",
    last_message_time: row.last_message_time || undefined,
    avatar_url: row.avatar_url || undefined,
    unread_count: normalizeUnreadCount(row.unread_count),
    is_pinned: !!row.is_pinned,
  };
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const warnedMissingRpcRef = useRef(false);
  const warnedFetchRef = useRef(false);

  const fetchConversations = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase.rpc("get_my_conversations");

      if (error) {
        if (isRpcMissing(error)) {
          if (!warnedMissingRpcRef.current) {
            console.warn("RPC get_my_conversations is missing. Chat list depends on migration 20260417_get_my_conversations_rpc.sql.");
            warnedMissingRpcRef.current = true;
          }
          if (!isBackground) {
            setConversations([]);
          }
          return;
        }
        throw error;
      }

      const rows = (Array.isArray(data) ? data : []) as ConversationRpcRow[];
      const labels = {
        direct: t("chat_direct_fallback_name"),
        group: t("chat_group_fallback_name"),
      };

      const mapped = rows
        .map((row) => mapRpcConversation(row, labels))
        .filter((conversation): conversation is Conversation => !!conversation);

      setConversations(mapped);
    } catch (error) {
      if (!warnedFetchRef.current) {
        console.warn("Unable to fetch conversations. Showing cached/empty state.");
        warnedFetchRef.current = true;
      }
      if (!isBackground) {
        setConversations([]);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [t]);

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
        .from('conversation_participants')
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
        .from('conversation_participants')
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
