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
import { Colors } from "../../constants/Colors";
import { useConversations, Conversation } from "../../hooks/useConversations";
import { useTranslation } from "../../hooks/useTranslation";
import { useToast } from "../../context/ToastContext";
import { FAB } from "../../components/FAB";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const { 
    conversations, 
    loading, 
    refreshConversations,
    pinConversation,
    deleteConversation 
  } = useConversations();

  const handleOptions = (item: Conversation) => {
    Alert.alert(
      item.name,
      t('select_option'),
      [
        {
          text: item.is_pinned ? t('unpin_chat') : t('pin_chat'),
          onPress: () => handleTogglePin(item.id, !!item.is_pinned),
        },
        {
          text: t('delete_chat'),
          style: "destructive",
          onPress: () => handleDeleteChat(item.id),
        },
        { text: t('cancel'), style: "cancel" },
      ]
    );
  };

  const handleTogglePin = async (conversationId: string, currentStatus: boolean) => {
    try {
      await pinConversation(conversationId, !currentStatus);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteChat = (conversationId: string) => {
    Alert.alert(
      t('delete_chat_title'),
      t('delete_chat_msg'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete_confirm'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
            } catch (error: any) {
              showToast(error.message, 'error');
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
                <Ionicons name="pin" size={14} color={Colors.brand.red} style={{ marginRight: 6, transform: [{ rotate: '45deg' }] }} />
              )}
              <Text className="text-gray-400 text-xs">{timeDisplay}</Text>
            </View>
          </View>
          <Text className="text-gray-500 text-sm" numberOfLines={1}>
            {item.last_message || t('no_messages')}
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
          <Ionicons name="search" size={20} color={Colors.brand.red} />
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
            <ActivityIndicator size="large" color={Colors.brand.red} />
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
                <RefreshControl refreshing={loading} onRefresh={refreshConversations} tintColor={Colors.brand.red} />
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
      <FAB 
        onPress={() => router.push("/chat-create")} 
        iconName="create-outline" 
        iconSize={28}
        accessibilityLabel={t('new_chat')}
      />
    </View>
  );
}
