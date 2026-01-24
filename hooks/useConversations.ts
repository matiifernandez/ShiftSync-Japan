import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useChatContext } from "../context/ChatContext";

// Re-export interface for compatibility
export type { Conversation } from "../context/ChatContext";

export function useConversations() {
  const { conversations, loading, totalUnreadCount, refreshConversations } = useChatContext();

  // Keep the focus effect logic here, as it's UI-specific
  useFocusEffect(
    useCallback(() => {
      // Fetch in background when focusing
      refreshConversations(true);
    }, [refreshConversations])
  );

  return { 
      conversations, 
      loading, 
      totalUnreadCount,
      refreshConversations: () => refreshConversations(false) 
  };
}
