import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import ProjectsStackNavigator from "@/navigation/ProjectsStackNavigator";
import PermitsStackNavigator from "@/navigation/PermitsStackNavigator";
import ResourcesStackNavigator from "@/navigation/ResourcesStackNavigator";
import AccountStackNavigator from "@/navigation/AccountStackNavigator";
import { useTheme } from "@/hooks/useTheme";

export type MainTabParamList = {
  ProjectsTab: undefined;
  PermitsTab: undefined;
  ResourcesTab: undefined;
  AccountTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="ProjectsTab"
      screenOptions={{
        tabBarActiveTintColor: "rgba(255, 255, 255, 0.9)",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.35)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "rgba(10, 10, 10, 0.98)",
            web: "rgba(10, 10, 10, 0.98)",
          }),
          borderTopWidth: 1,
          borderTopColor: "rgba(255, 255, 255, 0.06)",
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10, 10, 10, 0.98)" }]} />
          ),
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStackNavigator}
        options={{
          title: "Projects",
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PermitsTab"
        component={PermitsStackNavigator}
        options={{
          title: "Permits",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ResourcesTab"
        component={ResourcesStackNavigator}
        options={{
          title: "Resources",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountStackNavigator}
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
