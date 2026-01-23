import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useConversations, Conversation } from "../../hooks/useConversations";
import { useTranslation } from "../../hooks/useTranslation";
import { supabase } from "../../lib/supabase";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { conversations, loading, refreshConversations } = useConversations();

  const handleOptions = (item: Conversation) => {
    Alert.alert(
      item.name,
      "Select an option",
      [
        {
          text: item.is_pinned ? "Unpin Chat" : "Pin Chat",
          onPress: () => handleTogglePin(item.id, !!item.is_pinned),
        },
        {
          text: "Delete Chat",
          style: "destructive",
          onPress: () => handleDeleteConversation(item.id),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleTogglePin = async (conversationId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_pinned: !currentStatus })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      refreshConversations();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              
              const { error } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', user.id);
                
              if (error) throw error;
              
              refreshConversations();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item }: { item: Conversation }) => {
    const timeDisplay = item.last_message_time 
      ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "";

    return (
      <TouchableOpacity
        className={`flex-row items-center px-6 py-4 border-b border-gray-50 ${item.is_pinned ? 'bg-red-50/30' : 'active:bg-gray-50'}`}
        onPress={() => router.push({
            pathname: "/chat/[id]",
            params: { id: item.id, name: item.name }
        })}
        onLongPress={() => handleOptions(item)}
      >
        <View className="relative">
          <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center overflow-hidden border border-gray-100">
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} className="w-full h-full" />
            ) : (
              <FontAwesome5
                name={item.type === "group" ? "users" : "user"}
                size={24}
                color="#9CA3AF"
              />
            )}
          </View>
          {!!item.unread_count && item.unread_count > 0 && (
            <View className="absolute -top-1 -right-1 bg-brand-red w-5 h-5 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-white text-[10px] font-bold">{item.unread_count}</Text>
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-brand-dark font-bold text-lg flex-1 mr-2" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center">
              {item.is_pinned && (
                <Ionicons name="pin" size={14} color="#D9381E" style={{ marginRight: 6, transform: [{ rotate: '45deg' }] }} />
              )}
              <Text className="text-gray-400 text-xs">{timeDisplay}</Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm" numberOfLines={1}>
            {item.last_message || "No messages yet"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" className="ml-2" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-brand-dark mb-4">{t('messages_title')}</Text>
        <View className="bg-gray-100 flex-row items-center px-4 py-3 rounded-2xl">
          <Ionicons name="search" size={20} color="#D9381E" />
          <TextInput
            className="flex-1 ml-3 text-brand-dark text-base"
            placeholder={t('search_placeholder')}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {loading && conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#D9381E" />
        </View>
      ) : (
        <FlatList
            data={conversations
              .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
              .sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return 0;
              })
            }
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refreshConversations} tintColor="#D9381E" />
            }
            ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
                <Ionicons name="chatbubbles-outline" size={64} color="#E5E7EB" />
                <Text className="text-gray-400 mt-4 text-lg">{t('no_conversations')}</Text>
            </View>
            }
        />
      )}

      {/* NEW CHAT FAB */}
      <TouchableOpacity
        onPress={() => router.push("/chat-create")}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#D9381E",
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#D9381E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Ionicons name="create-outline" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}