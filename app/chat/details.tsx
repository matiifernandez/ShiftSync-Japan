import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useTranslation } from "../../hooks/useTranslation";

export default function ChatDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationName, setConversationName] = useState("");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      if (!id) return;

      // 1. Fetch Conversation Info
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('name, type')
        .eq('id', id)
        .single();
      
      if (convError) throw convError;
      setConversationName(conv.name);

      // 2. Fetch Participants
      const { data: parts, error: partsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          profiles:user_id (
            id, full_name, avatar_url, role
          )
        `)
        .eq('conversation_id', id);

      if (partsError) throw partsError;

      // Flatten data
      const formatted = parts.map((p: any) => p.profiles).filter(Boolean);
      setParticipants(formatted);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', id)
                .eq('user_id', user.id);

              if (error) throw error;

              // Go back to chat list
              router.dismissAll(); 
              router.replace("/(tabs)/chat");
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* CUSTOM HEADER */}
      <View 
        style={{ paddingTop: insets.top }}
        className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white"
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="chevron-back" size={28} color="#D9381E" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-brand-dark flex-1 text-center mr-10">
          Group Info
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#D9381E" />
        </View>
      ) : (
        <View className="flex-1">
          {/* HEADER INFO */}
          <View className="items-center py-8 bg-gray-50 border-b border-gray-100">
            <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
              <Ionicons name="people" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-brand-dark">{conversationName}</Text>
            <Text className="text-gray-500 mt-1">{participants.length} members</Text>
          </View>

          {/* LIST */}
          <Text className="px-6 py-4 text-gray-500 font-bold text-xs uppercase tracking-wider">Participants</Text>
          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center px-6 py-3 border-b border-gray-50">
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} className="w-10 h-10 rounded-full bg-gray-200" />
                ) : (
                  <Ionicons name="person-circle" size={40} color="#D1D5DB" />
                )}
                <View className="ml-3">
                  <Text className="font-bold text-brand-dark">{item.full_name}</Text>
                  <Text className="text-gray-400 text-xs capitalize">{item.role}</Text>
                </View>
              </View>
            )}
          />

          {/* LEAVE BUTTON */}
          <View className="p-6 pb-10">
            <TouchableOpacity 
              onPress={handleLeaveGroup}
              className="flex-row items-center justify-center p-4 bg-red-50 rounded-2xl"
            >
              <Ionicons name="log-out-outline" size={20} color="#D9381E" />
              <Text className="ml-2 text-brand-red font-bold">Leave Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
