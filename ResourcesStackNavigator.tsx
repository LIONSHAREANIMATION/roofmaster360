import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ResourcesScreen from "@/screens/ResourcesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ResourcesStackParamList = {
  Resources: undefined;
};

const Stack = createNativeStackNavigator<ResourcesStackParamList>();

export default function ResourcesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{
          headerTitle: "Resources",
        }}
      />
    </Stack.Navigator>
  );
}
