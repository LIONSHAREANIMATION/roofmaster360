import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { TextInput } from "react-native";
import { getApiUrl, apiRequest } from "@/lib/query-client";

export default function CompanyBrandingScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  
  const [companyName, setCompanyName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      const userToken = await AsyncStorage.getItem("roofmaster_user");
      const isGuest = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      if (userToken && isGuest !== "true") {
        try {
          const response = await fetch(
            new URL("/api/branding", getApiUrl()),
            {
              headers: {
                "Authorization": `Bearer ${JSON.parse(userToken).token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setCompanyName(data.branding.companyName || "");
              setLogoUri(data.branding.companyLogo || null);
              await AsyncStorage.setItem("company_branding", JSON.stringify({
                companyName: data.branding.companyName || "",
                logoUri: data.branding.companyLogo || null,
              }));
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.log("Failed to load branding from server, using local:", e);
        }
      }
      
      const stored = await AsyncStorage.getItem("company_branding");
      if (stored) {
        const data = JSON.parse(stored);
        setCompanyName(data.companyName || "");
        setLogoUri(data.logoUri || null);
      }
    } catch (error) {
      console.error("Error loading branding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBranding = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem("company_branding", JSON.stringify({
        companyName,
        logoUri,
      }));
      
      const userToken = await AsyncStorage.getItem("roofmaster_user");
      const isGuest = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      if (userToken && isGuest !== "true") {
        try {
          const response = await fetch(
            new URL("/api/branding", getApiUrl()),
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${JSON.parse(userToken).token}`,
              },
              body: JSON.stringify({
                companyName,
                companyLogo: logoUri,
              }),
            }
          );
          if (!response.ok) {
            console.log("Server sync returned non-2xx:", response.status);
          }
        } catch (e) {
          console.log("Failed to sync branding to server:", e);
        }
      }
      
      Alert.alert("Saved", "Company branding has been updated.");
    } catch (error) {
      console.error("Error saving branding:", error);
      Alert.alert("Error", "Failed to save branding settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const removeLogo = () => {
    Alert.alert(
      "Remove Logo",
      "Are you sure you want to remove your company logo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setLogoUri(null),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Card style={styles.logoCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Company Logo
        </ThemedText>
        <ThemedText type="secondary" style={styles.description}>
          Your logo will appear on estimates and contracts.
        </ThemedText>
        
        <View style={styles.logoContainer}>
          {logoUri ? (
            <Pressable onPress={pickImage} style={styles.logoWrapper}>
              <Image
                source={{ uri: logoUri }}
                style={styles.logo}
                contentFit="contain"
              />
              <Pressable
                style={[styles.removeButton, { backgroundColor: theme.backgroundRoot }]}
                onPress={removeLogo}
              >
                <Feather name="x" size={16} color="#DC3545" />
              </Pressable>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.uploadBox, { 
                borderColor: theme.divider, 
                backgroundColor: theme.backgroundSecondary 
              }]}
              onPress={pickImage}
            >
              <Feather name="upload" size={32} color={theme.accent} />
              <ThemedText type="body" style={[styles.uploadText, { color: theme.accent }]}>
                Upload Logo
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Square image recommended
              </ThemedText>
            </Pressable>
          )}
        </View>
      </Card>

      <Card style={styles.inputCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Company Name
        </ThemedText>
        <ThemedText type="secondary" style={styles.description}>
          This will appear on your professional estimates.
        </ThemedText>
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.divider,
            },
          ]}
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Enter your company name"
          placeholderTextColor={theme.textSecondary}
        />
      </Card>

      <Card style={styles.previewCard}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Preview
        </ThemedText>
        <ThemedText type="secondary" style={styles.description}>
          How your branding will appear on estimates:
        </ThemedText>
        
        <View style={[styles.previewBox, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.previewHeader}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.previewLogo}
                contentFit="contain"
              />
            ) : (
              <View style={[styles.previewLogoPlaceholder, { backgroundColor: theme.divider }]}>
                <Feather name="image" size={20} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.previewText}>
              <ThemedText type="h4">
                {companyName || "Your Company Name"}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Professional Roofing Estimate
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      <Pressable
        style={[
          styles.saveButton,
          { 
            backgroundColor: theme.accent,
            opacity: isSaving ? 0.7 : 1,
          },
        ]}
        onPress={saveBranding}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Feather name="check" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={styles.saveButtonText}>
              Save Branding
            </ThemedText>
          </>
        )}
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  logoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  inputCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  previewCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoWrapper: {
    position: "relative",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadBox: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  uploadText: {
    fontWeight: "600",
  },
  input: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  previewBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  previewLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  previewLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    flex: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
