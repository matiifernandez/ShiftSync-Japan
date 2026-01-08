import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { supabase } from "./lib/supabase"; // Make sure the path is correct

export default function App() {
  const [status, setStatus] = useState("Connecting to Supabase...");

  useEffect(() => {
    async function checkConnection() {
      // Trying to read the profiles table (even if it's empty)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        setStatus("Connection error: " + error.message);
        console.error(error);
      } else {
        setStatus("Successfully connected to Supabase! 🚀");
        console.log("Data:", data);
      }
    }

    checkConnection();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{status}</Text>
    </View>
  );
}
