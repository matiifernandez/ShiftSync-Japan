import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View 
      style={{ 
        flex: 1, 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        justifyContent: "center", 
        alignItems: "center" 
      }} 
      className="bg-white"
    >
      <Text className="text-2xl font-bold text-brand-dark">Tickets</Text>
      <Text className="text-gray-500">Coming soon...</Text>
    </View>
  );
}
