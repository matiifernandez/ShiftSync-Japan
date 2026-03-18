import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStaff } from "../hooks/useStaff";
import { useTranslation } from "../hooks/useTranslation";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { supabase } from "../lib/supabase";
import { useToast } from "../context/ToastContext";
import { Colors } from "../constants/Colors";

const THEME_COLOR = Colors.brand.red;

export default function CreateChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { staff, loading: loadingStaff } = useStaff();
  const { showToast } = useToast();
  const { userId, organizationId } = useCurrentUser();
  
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  // Filter staff based on search and exclude self
  const filteredStaff = staff.filter(user => 
    user.id !== userId &&
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
    if (!userId || !organizationId) return;
    setCreating(true);
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
          type: 'direct',
          name: t('direct_message') // Placeholder, usually hidden for DMs
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = [
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: targetUserId }
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      // Navigate
      router.replace({
        pathname: "/chat/[id]",
        params: { id: conv.id, name: staff.find(s => s.id === targetUserId)?.full_name || t('chat_title_fallback') }
      });

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast(t('group_name_error'), 'error');
      return;
    }
    if (selectedUserIds.length === 0) {
      showToast(t('group_member_error'), 'error');
      return;
    }
    if (!userId || !organizationId) return;

    setCreating(true);
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: organizationId,
          type: 'group',
          name: groupName
        })
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add Participants (Me + Selected)
      const participants = [
        { conversation_id: conv.id, user_id: userId },
        ...selectedUserIds.map(uid => ({ conversation_id: conv.id, user_id: uid }))
      ];

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      showToast(t('group_created'), 'success');
      router.replace({
        pathname: "/chat/[id]",
        params: { id: conv.id, name: groupName }
      });

    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-red font-bold text-base">{t('cancel')}</Text>
        </TouchableOpacity>
        <Text className="text-brand-dark font-bold text-lg">{t('new_chat')}</Text>
        <View className="w-16" /> 
      </View>
      
      {/* MODE SWITCHER */}
      <View className="flex-row p-2 mx-4 mt-4 bg-gray-100 rounded-xl">
        <TouchableOpacity 
          onPress={() => setMode("dm")}
          className="flex-1 py-2 items-center rounded-lg"
          style={{ backgroundColor: mode === "dm" ? "white" : "transparent" }}
        >
          <Text className="font-bold" style={{ color: mode === "dm" ? "#1A1A1A" : "#9CA3AF" }}>{t('direct_message')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setMode("group")}
          className="flex-1 py-2 items-center rounded-lg"
          style={{ backgroundColor: mode === "group" ? "white" : "transparent" }}
        >
          <Text className="font-bold" style={{ color: mode === "group" ? "#1A1A1A" : "#9CA3AF" }}>{t('new_group')}</Text>
        </TouchableOpacity>
      </View>

      {/* GROUP INFO INPUT */}
      {mode === "group" && (
        <View className="px-6 mt-6">
          <Text className="text-brand-dark font-bold mb-2">{t('group_name')}</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-base"
            placeholder={t('group_placeholder')}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      )}

      {/* SEARCH */}
      <View className="px-6 mt-6 mb-2">
        <Text className="text-brand-dark font-bold mb-2">{t('select_members')}</Text>
        <View className="bg-gray-50 flex-row items-center px-4 py-3 rounded-xl border border-gray-100">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-brand-dark"
            placeholder={t('search_staff')}
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
              <Text className="text-white font-bold text-lg">{t('create_group')} ({selectedUserIds.length})</Text>
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
