import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStaff } from "../hooks/useStaff";
import { useTranslation } from "../hooks/useTranslation";
import { supabase } from "../lib/supabase";

const THEME_COLOR = "#D9381E";

export default function CreateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { staff, loading: loadingStaff } = useStaff();
  
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Filter staff based on search and exclude self
  const filteredStaff = staff.filter(user => 
    user.id !== currentUserId &&
    user.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (mode === "dm") {
      // In DM mode, selecting a user immediately triggers creation/navigation
      handleStartDM(userId);
    } else {
      // In Group mode, toggle selection
      setSelectedUserIds(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Check if DM already exists
      // This is a complex query. We need to find a conversation of type 'direct'
      // where participants include BOTH me AND targetUserId.
      // Doing this via RPC is best, but for now we can do a quick check via existing conversations or a specific RPC.
      // Let's assume we create a new one optimistically or checking:
      
      // Alternative: Just create it. If we duplicate DMs it's messy but functional for MVP.
      // Better: Use a helper or RPC. 
      // Let's rely on a client-side check if we had the full list, but we don't.
      
      // Let's try to call a stored procedure 'get_or_create_dm' if it existed.
      // Since it doesn't, we will:
      // A. Create new conversation 'direct'.
      // B. Add participants.
      // (Ideally we prevent duplicates later).
      
      // REALITY CHECK: For MVP, let's just create it. 
      // If we want to be smarter: Query conversations that I am in, then check if target is in them.
      // Too heavy for client?
      
      // Let's just create. Uniqueness enforcement is a backend task for 'direct' chats usually.
      
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: staff.find(s => s.id === targetUserId)?.organization_id, // We assume same org
          type: 'direct',
          name: 'Direct Message' // Placeholder, usually hidden for DMs
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: targetUserId }
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      // Navigate
      router.replace({
        pathname: "/chat/[id]",
        params: { id: conv.id, name: staff.find(s => s.id === targetUserId)?.full_name || "Chat" }
      });

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }
    if (selectedUserIds.length === 0) {
      Alert.alert("Error", "Please select at least one member");
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Create Conversation
      // We need organization_id. Let's take it from the first selected user or my own profile.
      // Ideally we fetch my profile.
      const { data: myProfile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: myProfile?.organization_id,
          type: 'group',
          name: groupName
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add Participants (Me + Selected)
      const participants = [
        { conversation_id: conv.id, user_id: user.id },
        ...selectedUserIds.map(uid => ({ conversation_id: conv.id, user_id: uid }))
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      router.replace({
        pathname: "/chat/[id]",
        params: { id: conv.id, name: groupName }
      });

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-red font-bold text-base">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-brand-dark font-bold text-lg">{t('new_chat')}</Text>
        <View className="w-16" /> 
      </View>
      
      {/* MODE SWITCHER */}
      <View className="flex-row p-2 mx-4 mt-4 bg-gray-100 rounded-xl">
        <TouchableOpacity 
          onPress={() => setMode("dm")}
          className={`flex-1 py-2 items-center rounded-lg ${mode === "dm" ? "bg-white shadow-sm" : "bg-transparent"}`}
        >
          <Text className={`font-bold ${mode === "dm" ? "text-brand-dark" : "text-gray-400"}`}>Direct Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setMode("group")}
          className={`flex-1 py-2 items-center rounded-lg ${mode === "group" ? "bg-white shadow-sm" : "bg-transparent"}`}
        >
          <Text className={`font-bold ${mode === "group" ? "text-brand-dark" : "text-gray-400"}`}>New Group</Text>
        </TouchableOpacity>
      </View>

      {/* GROUP INFO INPUT */}
      {mode === "group" && (
        <View className="px-6 mt-6">
          <Text className="text-brand-dark font-bold mb-2">Group Name</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder="e.g. Bus 1 Team"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      )}

      {/* SEARCH */}
      <View className="px-6 mt-6 mb-2">
        <Text className="text-brand-dark font-bold mb-2">Select Members</Text>
        <View className="bg-gray-50 flex-row items-center px-4 py-3 rounded-xl border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-brand-dark"
            placeholder="Search staff..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredStaff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isSelected = selectedUserIds.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleUser(item.id)}
              disabled={creating}
              className="flex-row items-center py-4 border-b border-gray-50"
            >
              <View className="relative">
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} className="w-12 h-12 rounded-full" />
                ) : (
                  <Ionicons name="person-circle" size={48} color="#D1D5DB" />
                )}
                {mode === "group" && isSelected && (
                  <View className="absolute -bottom-1 -right-1 bg-brand-red rounded-full border-2 border-white">
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  </View>
                )}
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-bold text-brand-dark text-base">{item.full_name}</Text>
                <Text className="text-gray-400 text-xs capitalize">{item.role}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* CREATE GROUP BUTTON */}
      {mode === "group" && (
        <View className="absolute bottom-10 left-6 right-6">
          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={creating}
            className={`w-full p-4 rounded-2xl items-center shadow-lg ${
              creating ? "bg-gray-400" : "bg-brand-red"
            }`}
          >
            {creating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Create Group ({selectedUserIds.length})</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* LOADING OVERLAY FOR DM */}
      {creating && mode === "dm" && (
        <View className="absolute inset-0 bg-black/20 justify-center items-center">
          <ActivityIndicator size="large" color={THEME_COLOR} />
        </View>
      )}
    </View>
  );
}
