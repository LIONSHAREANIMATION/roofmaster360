import React from "react";
import { View, StyleSheet, Linking, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const openWebsite = () => {
    Linking.openURL("https://lionshareanimation.com");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <View style={styles.headerSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.accent + "15" }]}>
          <Feather name="mail" size={40} color={theme.accent} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          Contact Support
        </ThemedText>
        <ThemedText type="secondary" style={styles.subtitle}>
          For all support inquiries, feature requests, and feedback, please visit our website.
        </ThemedText>
      </View>

      <Card style={styles.websiteCard} onPress={openWebsite}>
        <View style={styles.websiteRow}>
          <View style={[styles.websiteIcon, { backgroundColor: theme.accent + "15" }]}>
            <Feather name="globe" size={24} color={theme.accent} />
          </View>
          <View style={styles.websiteContent}>
            <ThemedText type="body" style={styles.websiteTitle}>
              lionshareanimation.com
            </ThemedText>
            <ThemedText type="secondary">
              Visit our website for support
            </ThemedText>
          </View>
          <Feather name="external-link" size={20} color={theme.accent} />
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoItem}>
          <Feather name="clock" size={20} color={theme.textSecondary} />
          <View style={styles.infoText}>
            <ThemedText type="body" style={styles.infoTitle}>Response Time</ThemedText>
            <ThemedText type="secondary">We typically respond within 24-48 hours</ThemedText>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <View style={styles.infoItem}>
          <Feather name="help-circle" size={20} color={theme.textSecondary} />
          <View style={styles.infoText}>
            <ThemedText type="body" style={styles.infoTitle}>What We Can Help With</ThemedText>
            <ThemedText type="secondary">Account issues, billing questions, feature requests, bug reports, and general inquiries</ThemedText>
          </View>
        </View>
      </Card>

      <Button onPress={openWebsite} style={styles.button}>
        Visit Support Website
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  websiteCard: {
    marginBottom: Spacing.lg,
  },
  websiteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  websiteIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  websiteContent: {
    flex: 1,
  },
  websiteTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontWeight: "500",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  button: {
    marginBottom: Spacing.lg,
  },
});
