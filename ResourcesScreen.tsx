import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface Feature {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  isPopular?: boolean;
}

const features: Feature[] = [
  {
    id: "1",
    icon: "camera",
    title: "Drone Integration",
    description:
      "Seamlessly import drone measurements for accurate roof dimensions",
  },
  {
    id: "2",
    icon: "file-text",
    title: "Permit Lookup",
    description:
      "Access permit history and requirements for any property instantly",
  },
  {
    id: "3",
    icon: "dollar-sign",
    title: "Cost Estimation",
    description:
      "Generate professional estimates with itemized material and labor costs",
  },
  {
    id: "4",
    icon: "cloud",
    title: "Cloud Sync",
    description:
      "Access your projects from anywhere with automatic cloud backup",
  },
];

const pricingTiers: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: 29,
    period: "/month",
    features: [
      "2 projects",
      "Basic measurements",
      "PDF estimates",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 79,
    period: "/month",
    features: [
      "5 estimates or projects",
      "Drone integration",
      "Permit lookup",
      "Team collaboration",
      "Priority support",
    ],
    isPopular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    period: "/month",
    features: [
      "Up to 25 estimates",
      "API access",
      "Dedicated account manager",
      "On-site training",
    ],
  },
];

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const renderFeatureCard = (feature: Feature) => (
    <View
      key={feature.id}
      style={[
        styles.featureCard,
        { 
          backgroundColor: theme.glassBackground,
          borderWidth: 1,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      <View
        style={[styles.featureIcon, { backgroundColor: theme.glassBlueTint }]}
      >
        <Feather name={feature.icon} size={24} color={theme.glassBlue} />
      </View>
      <ThemedText type="body" style={styles.featureTitle}>
        {feature.title}
      </ThemedText>
      <ThemedText type="secondary" style={styles.featureDescription}>
        {feature.description}
      </ThemedText>
    </View>
  );

  const renderPricingCard = (tier: PricingTier) => (
    <Pressable
      key={tier.id}
      style={({ pressed }) => [
        styles.pricingCard,
        {
          backgroundColor: theme.glassBackground,
          borderColor: tier.isPopular ? theme.glassOrange : theme.glassBorder,
          borderWidth: tier.isPopular ? 2 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: tier.isPopular ? theme.glassOrange : "transparent",
          shadowOpacity: tier.isPopular ? 0.4 : 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 20,
        },
      ]}
    >
      {tier.isPopular ? (
        <View style={[styles.popularBadge, { backgroundColor: theme.glassOrange }]}>
          <ThemedText type="small" style={styles.popularText}>
            Most Popular
          </ThemedText>
        </View>
      ) : null}
      <ThemedText
        type="h4"
        style={[
          styles.tierName,
          { color: tier.isPopular ? theme.glassOrange : theme.text },
        ]}
      >
        {tier.name}
      </ThemedText>
      <View style={styles.priceContainer}>
        <ThemedText
          type="h2"
          style={{ color: tier.isPopular ? theme.glassOrange : theme.text }}
        >
          ${tier.price}
        </ThemedText>
        <ThemedText
          type="secondary"
          style={{ color: theme.textSecondary }}
        >
          {tier.period}
        </ThemedText>
      </View>
      <View style={styles.featuresList}>
        {tier.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Feather
              name="check"
              size={16}
              color={tier.isPopular ? theme.glassOrange : theme.success}
            />
            <ThemedText
              type="small"
              style={[
                styles.featureText,
                { color: theme.text },
              ]}
            >
              {feature}
            </ThemedText>
          </View>
        ))}
      </View>
      <Pressable
        style={[
          styles.selectButton,
          {
            backgroundColor: tier.isPopular ? theme.glassOrange : "transparent",
            borderWidth: tier.isPopular ? 0 : 1,
            borderColor: theme.glassBorder,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.selectButtonText,
            { color: "#FFFFFF" },
          ]}
        >
          Select Plan
        </ThemedText>
      </Pressable>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText type="h3" style={styles.sectionTitle}>
        Features
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuresScroll}
      >
        {features.map(renderFeatureCard)}
      </ScrollView>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Pricing Plans
      </ThemedText>
      <View style={styles.pricingContainer}>
        {pricingTiers.map(renderPricingCard)}
      </View>

      <ThemedText type="h3" style={styles.sectionTitle}>
        AI Assistant
      </ThemedText>
      <Card
        style={styles.supportCard}
        onPress={() => navigation.navigate("AIAssistant")}
      >
        <View style={styles.supportContent}>
          <View
            style={[
              styles.supportIcon,
              { backgroundColor: Colors.light.success + "15" },
            ]}
          >
            <Feather name="cpu" size={24} color={Colors.light.success} />
          </View>
          <View style={styles.supportInfo}>
            <ThemedText type="body" style={styles.supportTitle}>
              RoofMaster AI
            </ThemedText>
            <ThemedText type="secondary">
              Get expert roofing guidance instantly
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </View>
      </Card>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Account
      </ThemedText>
      <Card
        style={styles.supportCard}
        onPress={() => navigation.navigate("SignIn")}
      >
        <View style={styles.supportContent}>
          <View
            style={[
              styles.supportIcon,
              { backgroundColor: theme.accent + "15" },
            ]}
          >
            <Feather name="user" size={24} color={theme.accent} />
          </View>
          <View style={styles.supportInfo}>
            <ThemedText type="body" style={styles.supportTitle}>
              Sign In / Sign Up
            </ThemedText>
            <ThemedText type="secondary">
              Sync projects and access all features
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  featuresScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  featureCard: {
    width: 180,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 13,
  },
  pricingContainer: {
    gap: Spacing.md,
  },
  pricingCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  popularText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tierName: {
    marginBottom: Spacing.sm,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  featuresList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
  },
  selectButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButtonText: {
    fontWeight: "600",
  },
  supportCard: {
    marginBottom: Spacing.lg,
  },
  supportContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
});
