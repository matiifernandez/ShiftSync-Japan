import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChat, Message } from "../../hooks/useChat";
import { useChatContext } from "../../context/ChatContext";

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { id, name } = params;

  // Get conversation metadata from context
  const { conversations } = useChatContext();
  const conversation = conversations.find(c => c.id === id);
  const isGroup = conversation?.type === 'group';

  // Use the custom hook connected to Supabase
  const {
    messages,
    sendMessage: sendToSupabase,
    currentUserId,
  } = useChat(id as string);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendToSupabase(inputText);
    setInputText("");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    const isOptimistic = item.id.startsWith("temp-");
    const timeString = new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        className={`flex-row mb-4 ${isMe ? "justify-end" : "justify-start"} ${isOptimistic ? "opacity-70" : "opacity-100"}`}
      >
        {!isMe && (
          <View className="w-8 h-8 bg-gray-300 rounded-full mr-2 items-center justify-center overflow-hidden">
            <Text className="text-gray-600 text-xs font-bold">
              {item.sender_name ? item.sender_name[0] : "?"}
            </Text>
          </View>
        )}

        <View
          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
            isMe
              ? "bg-brand-red rounded-tr-none"
              : "bg-gray-100 rounded-tl-none"
          }`}
        >
          {!isMe && item.sender_name && (
            <Text className="text-gray-500 text-xs mb-1 font-bold">
              {item.sender_name}
            </Text>
          )}

          <Text
            className={`${isMe ? "text-white" : "text-brand-dark"} text-base`}
          >
            {item.content_original}
          </Text>

          {item.content_translated && (
            <View
              className={`mt-2 pt-2 border-t ${
                isMe ? "border-white/20" : "border-gray-200"
              }`}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="language"
                  size={12}
                  color={isMe ? "rgba(255,255,255,0.7)" : "#9CA3AF"}
                />
                <Text
                  className={`text-[10px] ml-1 ${
                    isMe ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  TRANSLATED
                </Text>
              </View>
              <Text
                className={`${
                  isMe ? "text-white/90" : "text-gray-600"
                } text-sm italic`}
              >
                {item.content_translated}
              </Text>
            </View>
          )}

          <View className="flex-row justify-end items-center mt-1">
            {isOptimistic ? (
               <Ionicons name="time-outline" size={10} color={isMe ? "rgba(255,255,255,0.7)" : "#9CA3AF"} />
            ) : (
               <Text
                className={`text-[10px] text-right ${
                  isMe ? "text-white/60" : "text-gray-400"
                }`}
              >
                {timeString}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white"
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-1"
          disabled={!isGroup}
          onPress={() => isGroup && router.push({ pathname: "/chat/details", params: { id: id as string } })}
        >
          <Text className="text-xl font-bold text-brand-dark" numberOfLines={1}>
            {name || "Chat"}
          </Text>
          {isGroup && (
            <Text className="text-green-600 text-xs font-bold">Tap for info</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CHAT AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={messages}
          extraData={messages} // Force re-render when data changes
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
        />

        {/* INPUT AREA */}
        <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row items-center pb-8">
          <TouchableOpacity className="mr-3">
            <Ionicons name="add-circle-outline" size={28} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex-row items-center min-h-[44px]">
            <TextInput
              className="flex-1 text-base text-brand-dark"
              placeholder="Type a message..."
              multiline
              value={inputText}
              onChangeText={setInputText}
              style={{ 
                textAlignVertical: "center",
                maxHeight: 100,
                includeFontPadding: false,
                paddingTop: Platform.OS === 'android' ? 0 : 8,
                paddingBottom: Platform.OS === 'android' ? 0 : 8,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() ? "bg-brand-red" : "bg-gray-200"
            }`}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
