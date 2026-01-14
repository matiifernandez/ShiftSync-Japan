import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";

// Configuración básica del handler de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>("");
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setPermissionStatus(finalStatus);
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (e) {
        console.error(e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  // Función para agendar una notificación local
  const scheduleNotification = async (title: string, body: string, seconds: number) => {
    if (permissionStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Required", "Please enable notifications to receive reminders.");
            return;
        }
        setPermissionStatus(status);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        seconds: seconds, // En cuántos segundos disparar
        repeats: false,
      } as any, // Type assertion needed for some Expo versions with seconds trigger
    });
    
    Alert.alert("Reminder Set", `You will be reminded in ${seconds} seconds (demo mode).`);
  };

  return {
    scheduleNotification,
    permissionStatus,
    expoPushToken
  };
}
