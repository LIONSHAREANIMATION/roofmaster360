import React from "react";
import { View, StyleSheet, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, "Legal">>();
  const { type } = route.params;

  const isTerms = type === "terms";
  const url = "https://lionshareanimations.com/privacy/roof-master-360";

  const handleOpenBrowser = () => {
    Linking.openURL(url);
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.webFallback, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={48} color={theme.accent} />
          </View>
          <ThemedText type="h3" style={styles.fallbackTitle}>
            {isTerms ? "Terms of Service" : "Privacy Policy"}
          </ThemedText>
          <ThemedText type="secondary" style={styles.fallbackText}>
            View our {isTerms ? "Terms of Service" : "Privacy Policy"} in your browser.
          </ThemedText>
          <Button onPress={handleOpenBrowser} style={styles.openButton}>
            Open in Browser
          </Button>
          <ThemedText type="secondary" style={styles.contactText}>
            Questions? Visit lionshareanimation.com
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="secondary">Loading...</ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  fallbackTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  fallbackText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  openButton: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  contactText: {
    textAlign: "center",
  },
});
