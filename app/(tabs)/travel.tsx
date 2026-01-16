import React, { useState } from "react";
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

export default function TravelScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { trip, loading } = useTravel();
  const { scheduleNotification } = useNotifications();
  const [remindMe, setRemindMe] = useState(false);

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
          <Text className="text-lg font-bold text-brand-dark">
            {t('travel_logistics')}
          </Text>
          {trip && (
            <Text className="text-base text-gray-600 mt-1">
              {trip.name} — {trip.dates}
            </Text>
          )}
        </View>

        {/* TRANSPORT CARDS */}
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
                            {t('cat_transport')}: {ticket.transport_name}
                          </Text>
                          {(ticket.departure_station || ticket.arrival_station) && (
                            <Text className="text-brand-red font-medium text-sm mb-1">
                              {ticket.departure_station || "???"} → {ticket.arrival_station || "???"}
                            </Text>
                          )}
                          {ticket.seat_number && (
                            <Text className="text-gray-500">
                              {ticket.seat_number}
                            </Text>
                          )}
                        </View>
          </View>
        ))}

        {/* HOTEL CARD */}
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

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
