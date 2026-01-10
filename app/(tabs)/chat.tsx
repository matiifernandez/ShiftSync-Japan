import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Text className="text-2xl font-bold text-brand-dark">Chat</Text>
      <Text className="text-gray-500">Coming soon...</Text>
    </SafeAreaView>
  );
}
