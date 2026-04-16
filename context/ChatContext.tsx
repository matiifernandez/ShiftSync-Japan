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

async function fetchConversationsFallback(labels: { direct: string; group: string }): Promise<Conversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: participantRows, error: participantsError } = await supabase
    .from("conversation_participants")
    .select("conversation_id,is_pinned,last_read_at,conversations(id,name,type)")
    .eq("user_id", user.id);

  if (participantsError) throw participantsError;

  const rows = (participantRows || []) as any[];
  if (rows.length === 0) return [];

  const conversationIds = rows.map((row) => row.conversation_id).filter(Boolean);
  if (conversationIds.length === 0) return [];

  const [messagesRes, othersRes] = await Promise.all([
    supabase
      .from("messages")
      .select("conversation_id,sender_id,content_original,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("conversation_participants")
      .select("conversation_id,user_id,profiles:user_id(full_name,avatar_url)")
      .in("conversation_id", conversationIds)
      .neq("user_id", user.id),
  ]);

  if (messagesRes.error) throw messagesRes.error;
  if (othersRes.error) throw othersRes.error;

  const messages = (messagesRes.data || []) as any[];
  const otherParticipants = (othersRes.data || []) as any[];

  const latestMessageMap = new Map<string, any>();
  const messagesByConversation = new Map<string, any[]>();

  for (const message of messages) {
    const conversationId = message.conversation_id as string;
    if (!latestMessageMap.has(conversationId)) {
      latestMessageMap.set(conversationId, message);
    }
    const existing = messagesByConversation.get(conversationId);
    if (existing) {
      existing.push(message);
    } else {
      messagesByConversation.set(conversationId, [message]);
    }
  }

  const otherParticipantMap = new Map<string, any>();
  for (const participant of otherParticipants) {
    const conversationId = participant.conversation_id as string;
    if (!otherParticipantMap.has(conversationId)) {
      const profile = Array.isArray(participant.profiles)
        ? participant.profiles[0]
        : participant.profiles;
      otherParticipantMap.set(conversationId, profile);
    }
  }

  const fallbackConversations = rows
    .map((row) => {
      const conversationId = row.conversation_id as string;
      const conversation = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      const type = normalizeConversationType(conversation?.type);
      const latestMessage = latestMessageMap.get(conversationId);
      const conversationMessages = messagesByConversation.get(conversationId) || [];
      const otherProfile = otherParticipantMap.get(conversationId);

      const baseName = String(conversation?.name || "").trim();
      const directFallbackName = otherProfile?.full_name || labels.direct;
      const name = baseName || (type === "direct" ? directFallbackName : labels.group);

      const lastReadAt = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;
      const unreadCount = conversationMessages.reduce((count, message) => {
        const createdAt = Date.parse(message.created_at);
        if (!Number.isNaN(createdAt) && message.sender_id !== user.id && createdAt > lastReadAt) {
          return count + 1;
        }
        return count;
      }, 0);

      return {
        id: conversationId,
        name,
        type,
        last_message: latestMessage?.content_original || "",
        last_message_time: latestMessage?.created_at || undefined,
        avatar_url: type === "direct" ? otherProfile?.avatar_url || undefined : undefined,
        unread_count: unreadCount,
        is_pinned: !!row.is_pinned,
      } as Conversation;
    })
    .filter((conversation) => !!conversation.id);

  fallbackConversations.sort((a, b) => {
    const aTime = a.last_message_time ? Date.parse(a.last_message_time) : 0;
    const bTime = b.last_message_time ? Date.parse(b.last_message_time) : 0;
    return bTime - aTime;
  });

  return fallbackConversations;
}

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
        if (!isRpcMissing(error)) {
          throw error;
        }

        if (!warnedMissingRpcRef.current) {
          console.warn("RPC get_my_conversations not found. Falling back to table queries.");
          warnedMissingRpcRef.current = true;
        }

        const fallbackData = await fetchConversationsFallback({
          direct: t("chat_direct_fallback_name"),
          group: t("chat_group_fallback_name"),
        });
        setConversations(fallbackData);
        return;
      }

      if (data) {
        setConversations(data as Conversation[]);
      }
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
