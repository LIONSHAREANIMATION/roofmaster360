import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, Share, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { apiRequest } from "@/lib/query-client";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const MATERIAL_NAMES: Record<string, string> = {
  "three-tab": "Three Tab Shingles",
  "architectural": "Architectural Shingles",
  "metal-pbr": "Metal PBR Panels",
  "standing-seam": "Standing Seam Metal",
};

interface MicroBreakdown {
  shingles: number;
  waste: number;
  underlayment: number;
  flashing: number;
  nails: number;
  venting: number;
  ridgeCap: number;
  labor: number;
  additional: number;
  shingleBundles?: number;
  shingleCostPerBundle?: number;
  shingleTotal?: number;
  wasteBundles?: number;
  wasteTotal?: number;
  underlaymentRolls?: number;
  underlaymentCostPerRoll?: number;
  underlaymentTotal?: number;
  iceShieldRolls?: number;
  iceShieldCostPerRoll?: number;
  iceShieldTotal?: number;
  dripEdgePieces?: number;
  dripEdgeCostPerPiece?: number;
  dripEdgeTotal?: number;
  starterStripPieces?: number;
  starterCostPerPiece?: number;
  starterTotal?: number;
  ridgeCapBundles?: number;
  ridgeCapCostPerBundle?: number;
  ridgeCapTotal?: number;
  flashingPieces?: number;
  flashingCostPerPiece?: number;
  flashingTotal?: number;
  ventCount?: number;
  ventCostEach?: number;
  ventTotal?: number;
  nailPounds?: number;
  nailCostPerPound?: number;
  nailTotal?: number;
  laborRate?: number;
  laborHours?: number;
}

interface Project {
  id: string;
  address: string;
  length: number;
  width: number;
  pitch: number;
  roofArea: number;
  roofSquares?: number;
  selectedMaterial?: string;
  materialPricePerSquare?: number;
  microBreakdown?: MicroBreakdown;
  laborRate: number;
  laborHours: number;
  additionalCosts: number;
  estimateTotal: number;
  status: string;
  createdAt: string;
}

export default function EstimatePreviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "EstimatePreview">>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const isGuest = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      if (isGuest === "true") {
        const stored = await AsyncStorage.getItem("roofmaster_projects");
        if (stored) {
          const projects = JSON.parse(stored);
          const found = projects.find((p: Project) => p.id === projectId);
          if (found) {
            setProject(found);
          }
        }
      } else {
        const stored = await AsyncStorage.getItem("roofmaster_projects");
        if (stored) {
          const projects = JSON.parse(stored);
          const found = projects.find((p: Project) => p.id === projectId);
          if (found) {
            setProject(found);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSave = async (finalize: boolean) => {
    if (!project) return;

    setIsSaving(true);

    try {
      const isGuest = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      const stored = await AsyncStorage.getItem("roofmaster_projects");
      if (stored) {
        const projects = JSON.parse(stored);
        const index = projects.findIndex((p: Project) => p.id === projectId);
        if (index !== -1) {
          projects[index] = {
            ...projects[index],
            status: finalize ? "completed" : "draft",
          };
          await AsyncStorage.setItem(
            "roofmaster_projects",
            JSON.stringify(projects)
          );
          
          if (isGuest !== "true") {
            try {
              await apiRequest("POST", "/api/projects", {
                name: project.address,
                address: project.address,
                status: finalize ? "completed" : "draft",
                data: {
                  ...project,
                  status: finalize ? "completed" : "draft",
                },
              });
            } catch (dbError) {
              console.error("Failed to sync to database:", dbError);
            }
          }
        }
      }

      Alert.alert(
        finalize ? "Estimate Finalized" : "Draft Saved",
        finalize
          ? "Your estimate has been finalized and saved."
          : "Your estimate has been saved as a draft.",
        [
          {
            text: "OK",
            onPress: () => navigation.popToTop(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!project) return;

    const materialName = project.selectedMaterial
      ? MATERIAL_NAMES[project.selectedMaterial] || project.selectedMaterial
      : "Standard";

    const message = `
RoofMaster 360 Estimate

Property: ${project.address}
Roof Area: ${project.roofArea.toLocaleString()} sq ft (${project.roofSquares || Math.ceil(project.roofArea / 100)} squares)
Material: ${materialName}
Date: ${formatDate(project.createdAt)}

Total Estimate: ${formatCurrency(project.estimateTotal)}

Generated by RoofMaster 360
    `.trim();

    try {
      await Share.share({ message });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleSpeak = async () => {
    if (!project) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const materialName = project.selectedMaterial
      ? MATERIAL_NAMES[project.selectedMaterial] || project.selectedMaterial
      : "Standard materials";

    const breakdown = project.microBreakdown;
    
    let speechText = `RoofMaster 360 Estimate Summary. `;
    speechText += `Property address: ${project.address}. `;
    speechText += `Roof area: ${project.roofArea.toLocaleString()} square feet, which equals ${project.roofSquares || Math.ceil(project.roofArea / 100)} roofing squares. `;
    speechText += `Roof pitch: ${project.pitch} over 12. `;
    speechText += `Selected material: ${materialName}. `;
    
    if (breakdown) {
      speechText += `Cost breakdown: `;
      speechText += `Materials including shingles, underlayment, flashing, and accessories: ${formatCurrency(breakdown.shingles + breakdown.underlayment + breakdown.flashing + breakdown.nails + breakdown.venting + breakdown.ridgeCap)}. `;
      speechText += `Waste allowance: ${formatCurrency(breakdown.waste)}. `;
      speechText += `Labor cost: ${formatCurrency(breakdown.labor)}. `;
      if (breakdown.additional > 0) {
        speechText += `Additional costs: ${formatCurrency(breakdown.additional)}. `;
      }
    }
    
    speechText += `Total estimate: ${formatCurrency(project.estimateTotal)}. `;
    speechText += `Estimate generated on ${formatDate(project.createdAt)}.`;

    setIsSpeaking(true);
    
    Speech.speak(speechText, {
      language: "en-US",
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const handleDownloadPDF = async () => {
    if (!project) return;

    setIsGeneratingPdf(true);

    try {
      let branding = null;
      try {
        const storedBranding = await AsyncStorage.getItem("company_branding");
        if (storedBranding) {
          branding = JSON.parse(storedBranding);
        }
      } catch (e) {
        console.error("Failed to load branding:", e);
      }
      
      const response = await apiRequest("POST", "/api/generate-pdf", { project, branding });
      const data = await response.json();

      if (!data.success || !data.html) {
        Alert.alert("Error", "Failed to generate PDF. Please try again.");
        return;
      }

      if (Platform.OS === "web") {
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        Alert.alert("PDF Ready", "Your estimate has been opened in a new window. Use your browser's print function to save as PDF.");
      } else {
        const { uri } = await Print.printToFileAsync({ html: data.html });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Share Estimate PDF",
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert("PDF Generated", `PDF saved to: ${uri}`);
        }
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Redirect to CostInput if project is incomplete (no breakdown or zero estimate)
  useEffect(() => {
    if (project && (!project.microBreakdown || project.estimateTotal <= 0)) {
      navigation.replace("CostInput", { projectId });
    }
  }, [project, projectId, navigation]);

  if (!project) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body">Loading...</ThemedText>
      </View>
    );
  }

  // Don't render if we're about to redirect
  if (!project.microBreakdown || project.estimateTotal <= 0) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText type="body">Loading estimate...</ThemedText>
      </View>
    );
  }

  const materialName = project.selectedMaterial
    ? MATERIAL_NAMES[project.selectedMaterial] || project.selectedMaterial
    : "Standard Materials";
  const breakdown = project.microBreakdown;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: theme.accent }]}>
              <Feather name="home" size={24} color="#FFFFFF" />
            </View>
            <View>
              <ThemedText type="h4">RoofMaster 360</ThemedText>
              <ThemedText type="secondary">Professional Estimate</ThemedText>
            </View>
          </View>
          <ThemedText type="secondary" style={styles.dateText}>
            {formatDate(project.createdAt)}
          </ThemedText>
        </View>

        <Card style={styles.propertyCard}>
          <View style={styles.propertyHeader}>
            <Feather name="map-pin" size={20} color={theme.accent} />
            <ThemedText type="secondary">Property Address</ThemedText>
          </View>
          <ThemedText type="h4" style={styles.propertyAddress}>
            {project.address}
          </ThemedText>
          <View style={styles.propertyDetails}>
            <View style={styles.detailItem}>
              <ThemedText type="secondary">Roof Area</ThemedText>
              <ThemedText type="body" style={styles.detailValue}>
                {project.roofArea.toLocaleString()} sq ft
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText type="secondary">Squares</ThemedText>
              <ThemedText type="body" style={styles.detailValue}>
                {project.roofSquares || Math.ceil(project.roofArea / 100)}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText type="secondary">Pitch</ThemedText>
              <ThemedText type="body" style={styles.detailValue}>
                {project.pitch}/12
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.materialCard}>
          <View style={styles.materialHeader}>
            <Feather name="layers" size={20} color={theme.accent} />
            <ThemedText type="body" style={styles.materialTitle}>
              {materialName}
            </ThemedText>
          </View>
          <ThemedText type="secondary">
            {formatCurrency(project.materialPricePerSquare || 0)} per square
          </ThemedText>
        </Card>

        <Card style={styles.breakdownCard}>
          <ThemedText type="body" style={styles.breakdownTitle}>
            Micro-Level Cost Breakdown
          </ThemedText>

          {breakdown ? (
            <>
              <ThemedText type="secondary" style={styles.categoryTitle}>
                Roofing Materials
              </ThemedText>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Shingles/Panels</ThemedText>
                  {breakdown.shingleBundles ? (
                    <ThemedText type="secondary">
                      {breakdown.shingleBundles} bundles x {formatCurrency(breakdown.shingleCostPerBundle || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.shingleTotal || breakdown.shingles || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Waste Factor (12%)</ThemedText>
                  {breakdown.wasteBundles ? (
                    <ThemedText type="secondary">
                      {breakdown.wasteBundles} bundles extra
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.wasteTotal || breakdown.waste || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Underlayment</ThemedText>
                  {breakdown.underlaymentRolls ? (
                    <ThemedText type="secondary">
                      {breakdown.underlaymentRolls} rolls x {formatCurrency(breakdown.underlaymentCostPerRoll || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.underlaymentTotal || breakdown.underlayment || 0)}</ThemedText>
              </View>
              {breakdown.iceShieldTotal ? (
                <View style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <ThemedText type="body">Ice & Water Shield</ThemedText>
                    <ThemedText type="secondary">
                      {breakdown.iceShieldRolls} rolls x {formatCurrency(breakdown.iceShieldCostPerRoll || 0)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(breakdown.iceShieldTotal)}</ThemedText>
                </View>
              ) : null}
              {breakdown.dripEdgeTotal ? (
                <View style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <ThemedText type="body">Drip Edge</ThemedText>
                    <ThemedText type="secondary">
                      {breakdown.dripEdgePieces} pcs x {formatCurrency(breakdown.dripEdgeCostPerPiece || 0)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(breakdown.dripEdgeTotal)}</ThemedText>
                </View>
              ) : null}
              {breakdown.starterTotal ? (
                <View style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <ThemedText type="body">Starter Strip</ThemedText>
                    <ThemedText type="secondary">
                      {breakdown.starterStripPieces} pcs x {formatCurrency(breakdown.starterCostPerPiece || 0)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(breakdown.starterTotal)}</ThemedText>
                </View>
              ) : null}
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Ridge Cap</ThemedText>
                  {breakdown.ridgeCapBundles ? (
                    <ThemedText type="secondary">
                      {breakdown.ridgeCapBundles} bundles x {formatCurrency(breakdown.ridgeCapCostPerBundle || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.ridgeCapTotal || breakdown.ridgeCap || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Flashing</ThemedText>
                  {breakdown.flashingPieces ? (
                    <ThemedText type="secondary">
                      {breakdown.flashingPieces} pcs x {formatCurrency(breakdown.flashingCostPerPiece || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.flashingTotal || breakdown.flashing || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Roof Vents</ThemedText>
                  {breakdown.ventCount ? (
                    <ThemedText type="secondary">
                      {breakdown.ventCount} units x {formatCurrency(breakdown.ventCostEach || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.ventTotal || breakdown.venting || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Nails/Fasteners</ThemedText>
                  {breakdown.nailPounds ? (
                    <ThemedText type="secondary">
                      {breakdown.nailPounds} lbs x {formatCurrency(breakdown.nailCostPerPound || 0)}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.nailTotal || breakdown.nails || 0)}</ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.divider }]} />

              <ThemedText type="secondary" style={styles.categoryTitle}>
                Labor & Other
              </ThemedText>
              <View style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <ThemedText type="body">Labor</ThemedText>
                  <ThemedText type="secondary">
                    {breakdown.laborHours || project.laborHours || 0} hrs x {formatCurrency(breakdown.laborRate || project.laborRate || 0)}/hr
                  </ThemedText>
                </View>
                <ThemedText type="body">{formatCurrency(breakdown.labor || 0)}</ThemedText>
              </View>
              <View style={styles.lineItem}>
                <ThemedText type="body">Additional Costs</ThemedText>
                <ThemedText type="body">{formatCurrency(breakdown.additional || 0)}</ThemedText>
              </View>
            </>
          ) : (
            <ThemedText type="secondary">No breakdown available</ThemedText>
          )}

          <View style={[styles.totalDivider, { backgroundColor: theme.divider }]} />

          <View style={styles.totalRow}>
            <ThemedText type="h3">Total Estimate</ThemedText>
            <ThemedText type="h2" style={{ color: theme.accent }}>
              {formatCurrency(project.estimateTotal)}
            </ThemedText>
          </View>
        </Card>

        <View style={styles.signatureSection}>
          <View
            style={[styles.signatureLine, { borderBottomColor: theme.divider }]}
          >
            <ThemedText type="secondary">Contractor Signature</ThemedText>
          </View>
          <View
            style={[styles.signatureLine, { borderBottomColor: theme.divider }]}
          >
            <ThemedText type="secondary">Client Signature</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={styles.footerButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed || isGeneratingPdf ? 0.7 : 1,
              },
            ]}
            onPress={handleDownloadPDF}
            disabled={isGeneratingPdf}
          >
            <Feather name="file-text" size={20} color={theme.text} />
            <ThemedText type="body">{isGeneratingPdf ? "..." : "PDF"}</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={20} color={theme.text} />
            <ThemedText type="body">Share</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: isSpeaking ? theme.accent : theme.backgroundDefault,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={handleSpeak}
          >
            <Feather 
              name={isSpeaking ? "volume-x" : "volume-2"} 
              size={20} 
              color={isSpeaking ? "#FFFFFF" : theme.text} 
            />
            <ThemedText 
              type="body" 
              style={isSpeaking ? { color: "#FFFFFF" } : undefined}
            >
              {isSpeaking ? "Stop" : "Listen"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: theme.backgroundDefault,
                opacity: pressed || isSaving ? 0.7 : 1,
              },
            ]}
            onPress={() => handleSave(false)}
            disabled={isSaving}
          >
            <Feather name="save" size={20} color={theme.text} />
            <ThemedText type="body">Save</ThemedText>
          </Pressable>
        </View>
        <Button onPress={() => handleSave(true)} disabled={isSaving}>
          {isSaving ? "Saving..." : "Finalize Estimate"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    textAlign: "right",
  },
  propertyCard: {
    marginBottom: Spacing.lg,
  },
  propertyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  propertyAddress: {
    marginBottom: Spacing.lg,
  },
  propertyDetails: {
    flexDirection: "row",
    gap: Spacing["2xl"],
  },
  detailItem: {
    gap: Spacing.xs,
  },
  detailValue: {
    fontWeight: "600",
  },
  materialCard: {
    marginBottom: Spacing.lg,
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  materialTitle: {
    fontWeight: "600",
  },
  breakdownCard: {
    marginBottom: Spacing.lg,
  },
  breakdownTitle: {
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  lineItemInfo: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalDivider: {
    height: 2,
    marginVertical: Spacing.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  signatureSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.xl,
  },
  signatureLine: {
    paddingTop: Spacing["3xl"],
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  footerButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
  },
});
