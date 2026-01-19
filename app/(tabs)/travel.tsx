import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  ActivityIndicator,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useTravel } from "../../hooks/useTravel";
import { useNotifications } from "../../hooks/useNotifications";
import { useTranslation } from "../../hooks/useTranslation";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function TravelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { trip, loading } = useTravel();
  const { scheduleNotification } = useNotifications();
  const [remindMe, setRemindMe] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function getRole() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          setUserRole(data?.role || 'staff');
        }
      }
      getRole();
    }, [])
  );

  const handleOpenMaps = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    setRemindMe(value);
    if (value) {
        // En una app real, calcularíamos la diferencia de tiempo hasta la salida (ticket.departure_time - 2 horas)
        // Para demo, usaremos 5 segundos para probar que funciona
        await scheduleNotification(
            "Trip Reminder 🚄", 
            "Your trip to Osaka starts soon! Don't forget your tickets.", 
            5
        );
    }
  };

  if (loading) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-gray-50 justify-center items-center"
      >
        <ActivityIndicator size="large" color="#D9381E" />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      className="bg-gray-50"
    >
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE SECTION */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-brand-dark mb-2">
            {t('travel_logistics')}
          </Text>
          {trip && (
            <Text className="text-base text-gray-600">
              {trip.name} — {trip.dates}
            </Text>
          )}
        </View>

        {/* TRANSPORT SECTION */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-500 font-bold uppercase tracking-wider text-xs">
            {t('cat_transport')}
          </Text>
          {userRole === 'admin' && trip && (
            <TouchableOpacity 
              onPress={() => router.push({ pathname: "/travel/add-ticket", params: { projectId: trip.id } })}
              className="bg-red-50 px-3 py-1 rounded-full"
            >
              <Text className="text-brand-red font-bold text-[10px]">+ {t('new_expense') === '経費登録' ? 'チケット追加' : 'ADD TICKET'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {trip?.tickets.map((ticket, index) => (
          <View
            key={ticket.id}
            className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 flex-row items-center"
          >
            <View className="w-10 items-center justify-center mr-4">
              <FontAwesome5 name="train" size={24} color="#D9381E" />
              <Text className="text-brand-dark font-bold text-xs mt-1">
                {format(new Date(ticket.departure_time), "HH:mm")}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-brand-dark mb-1">
                {ticket.transport_name}
              </Text>
              {(ticket.departure_station || ticket.arrival_station) && (
                <Text className="text-brand-red font-medium text-sm mb-1">
                  {ticket.departure_station || "???"} → {ticket.arrival_station || "???"}
                </Text>
              )}
              {ticket.seat_number && (
                <Text className="text-gray-500 text-xs">
                  {ticket.seat_number}
                </Text>
              )}
              {/* ADMIN: SHOW WHO IS FOR */}
              {userRole === 'admin' && ticket.profiles && (
                <View className="mt-2 bg-gray-50 self-start px-2 py-1 rounded-md">
                  <Text className="text-[10px] text-gray-500 font-bold">FOR: {ticket.profiles.full_name}</Text>
                </View>
              )}

              {/* VIEW TICKET BUTTON */}
              {ticket.ticket_file_url && (
                <TouchableOpacity 
                  onPress={() => ticket.ticket_file_url && Linking.openURL(ticket.ticket_file_url)}
                  className="mt-3 flex-row items-center border border-brand-red self-start px-3 py-2 rounded-xl"
                >
                  <Ionicons name="eye-outline" size={16} color="#D9381E" />
                  <Text className="text-brand-red font-bold text-xs ml-2">
                    {t('view_ticket')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {!trip?.tickets.length && (
          <View className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 items-center justify-center mb-6">
            <Ionicons name="train-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2 text-sm">No transport added yet</Text>
          </View>
        )}

        {/* HOTEL SECTION */}
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text className="text-gray-500 font-bold uppercase tracking-wider text-xs">
            {t('cat_hotel')}
          </Text>
          {userRole === 'admin' && trip && (
            <TouchableOpacity 
              onPress={() => router.push({ pathname: "/travel/add-hotel", params: { projectId: trip.id } })}
              className="bg-red-50 px-3 py-1 rounded-full"
            >
              <Text className="text-brand-red font-bold text-[10px]">+ {t('new_expense') === '経費登録' ? 'ホテル追加' : 'ADD HOTEL'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {trip?.accommodations.map((hotel) => (
          <View
            key={hotel.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6"
          >
            <View className="p-5 flex-row items-center">
              <View className="w-10 items-center justify-center mr-4">
                <FontAwesome5 name="hotel" size={22} color="#D9381E" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-brand-dark mb-1">
                  {t('cat_hotel')}: {hotel.name}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenMaps(hotel.map_url)}
              className="bg-brand-red py-4 flex-row items-center justify-center"
            >
              <FontAwesome5 name="map-marked-alt" size={16} color="white" />
              <Text className="text-white font-bold ml-2">
                {t('open_maps')}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* REMINDER TOGGLE */}
        {trip && trip.tickets.length > 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-row items-center justify-between mb-10">
            <View className="flex-1 mr-4">
              <Text className="text-brand-dark font-medium mb-1">
                {t('remind_me')}
              </Text>
            </View>
            <Switch
              value={remindMe}
              onValueChange={handleToggleReminder}
              trackColor={{ false: "#E5E7EB", true: "#D9381E" }}
              thumbColor={"#FFFFFF"}
            />
          </View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* ADMIN ADD BUTTON */}
      {userRole === 'admin' && (
        <TouchableOpacity
          onPress={() => router.push("/travel/create")}
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
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
