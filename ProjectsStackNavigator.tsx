import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProjectsScreen from "@/screens/ProjectsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type ProjectsStackParamList = {
  Projects: undefined;
};

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export default function ProjectsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="RoofMaster 360" />,
        }}
      />
    </Stack.Navigator>
  );
}
