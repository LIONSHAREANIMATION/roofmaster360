import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface MenuItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("roofmaster_user");
            await AsyncStorage.removeItem("roofmaster_guest_mode");
            reloadAppAsync();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert("Account Deleted", "Your account has been deleted.");
          },
        },
      ]
    );
  };

  const settingsItems: MenuItem[] = [
    {
      id: "branding",
      icon: "image",
      title: "Company Branding",
      subtitle: "Logo and company name for estimates",
      onPress: () => navigation.navigate("CompanyBranding"),
    },
    {
      id: "notifications",
      icon: "bell",
      title: "Notifications",
      subtitle: "Manage notification preferences",
    },
    {
      id: "units",
      icon: "maximize-2",
      title: "Measurement Units",
      subtitle: "Imperial (sq ft)",
    },
    {
      id: "theme",
      icon: "moon",
      title: "Appearance",
      subtitle: "System default",
    },
  ];

  const supportItems: MenuItem[] = [
    {
      id: "feedback",
      icon: "message-square",
      title: "Send Feedback",
      subtitle: "Help us improve RoofMaster 360",
      onPress: () => navigation.navigate("Feedback"),
    },
    {
      id: "signin",
      icon: "user",
      title: "Sign In / Sign Up",
      onPress: () => navigation.navigate("SignIn"),
    },
    {
      id: "terms",
      icon: "file-text",
      title: "Terms of Service",
      onPress: () => navigation.navigate("Legal", { type: "terms" }),
    },
    {
      id: "privacy",
      icon: "shield",
      title: "Privacy Policy",
      onPress: () => navigation.navigate("Legal", { type: "privacy" }),
    },
  ];

  const dangerItems: MenuItem[] = [
    {
      id: "logout",
      icon: "log-out",
      title: "Sign Out",
      onPress: handleLogout,
      danger: true,
    },
    {
      id: "delete",
      icon: "trash-2",
      title: "Delete Account",
      onPress: handleDeleteAccount,
      danger: true,
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        styles.menuItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.divider },
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={item.onPress}
    >
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: item.danger
              ? "#DC354515"
              : theme.backgroundSecondary,
          },
        ]}
      >
        <Feather
          name={item.icon}
          size={20}
          color={item.danger ? "#DC3545" : theme.accent}
        />
      </View>
      <View style={styles.menuContent}>
        <ThemedText
          type="body"
          style={[styles.menuTitle, item.danger && { color: "#DC3545" }]}
        >
          {item.title}
        </ThemedText>
        {item.subtitle ? (
          <ThemedText type="secondary" style={styles.menuSubtitle}>
            {item.subtitle}
          </ThemedText>
        ) : null}
      </View>
      {!item.danger ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
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
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <Feather name="user" size={32} color="#FFFFFF" />
          </View>
          <Pressable
            style={[styles.editBadge, { backgroundColor: theme.backgroundRoot }]}
          >
            <Feather name="edit-2" size={14} color={theme.accent} />
          </Pressable>
        </View>
        <ThemedText type="h4" style={styles.profileName}>
          Roofing Pro
        </ThemedText>
        <ThemedText type="secondary">roofingpro@example.com</ThemedText>
        <View style={styles.companyInfo}>
          <Feather name="briefcase" size={16} color={theme.textSecondary} />
          <ThemedText type="secondary" style={styles.companyName}>
            ABC Roofing Co.
          </ThemedText>
        </View>
      </Card>

      <Card style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View>
            <ThemedText type="secondary" style={styles.subscriptionLabel}>
              Current Plan
            </ThemedText>
            <ThemedText type="h4" style={{ color: theme.accent }}>
              Pro Plan
            </ThemedText>
          </View>
          <View
            style={[
              styles.activeBadge,
              { backgroundColor: Colors.light.success + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: Colors.light.success, fontWeight: "600" }}
            >
              Active
            </ThemedText>
          </View>
        </View>
        <View style={styles.renewalInfo}>
          <Feather name="calendar" size={16} color={theme.textSecondary} />
          <ThemedText type="secondary" style={styles.renewalText}>
            Renews on Jan 15, 2025
          </ThemedText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.upgradeButton,
            {
              backgroundColor: theme.backgroundSecondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <ThemedText type="body" style={{ color: theme.accent, fontWeight: "600" }}>
            Manage Subscription
          </ThemedText>
        </Pressable>
      </Card>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Settings
      </ThemedText>
      <Card style={styles.menuCard}>
        {settingsItems.map((item, index) =>
          renderMenuItem(item, index === settingsItems.length - 1)
        )}
      </Card>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Support
      </ThemedText>
      <Card style={styles.menuCard}>
        {supportItems.map((item, index) =>
          renderMenuItem(item, index === supportItems.length - 1)
        )}
      </Card>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Account
      </ThemedText>
      <Card style={styles.menuCard}>
        {dangerItems.map((item, index) =>
          renderMenuItem(item, index === dangerItems.length - 1)
        )}
      </Card>

      <ThemedText type="secondary" style={styles.versionText}>
        RoofMaster 360 v1.0.0
      </ThemedText>
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
  profileCard: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: {
    marginBottom: Spacing.xs,
  },
  companyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  companyName: {},
  subscriptionCard: {
    marginBottom: Spacing.lg,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  subscriptionLabel: {
    marginBottom: Spacing.xs,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  renewalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  renewalText: {},
  upgradeButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  menuCard: {
    padding: 0,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: "500",
  },
  menuSubtitle: {
    marginTop: 2,
  },
  versionText: {
    textAlign: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
