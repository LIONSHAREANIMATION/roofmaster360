import React, { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import AuthScreen from "@/screens/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("roofmaster_user");
      const guestMode = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (guestMode === "true") {
        setIsGuest(true);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async (userData: any) => {
    setUser(userData);
    setIsGuest(false);
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("roofmaster_guest_mode", "true");
    setIsGuest(true);
  };

  if (isLoading) {
    return (
      <GradientBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </GradientBackground>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} onSkip={handleSkip} />;
  }

  return (
    <GradientBackground>
      <NavigationContainer>
        <RootStackNavigator />
      </NavigationContainer>
    </GradientBackground>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={styles.root}>
            <KeyboardProvider>
              <AppContent />
              <StatusBar style="auto" />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
