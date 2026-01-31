import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PermitsScreen from "@/screens/PermitsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PermitsStackParamList = {
  Permits: undefined;
};

const Stack = createNativeStackNavigator<PermitsStackParamList>();

export default function PermitsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Permits"
        component={PermitsScreen}
        options={{
          headerTitle: "Permit Lookup",
        }}
      />
    </Stack.Navigator>
  );
}
