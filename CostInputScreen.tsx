import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface MaterialType {
  id: string;
  name: string;
  basePrice: number;
  adjustedPrice: number;
  description: string;
  icon: string;
}

const MATERIAL_TYPES: MaterialType[] = [
  {
    id: "three-tab",
    name: "Three Tab",
    basePrice: 450,
    adjustedPrice: 450,
    description: "Standard asphalt shingles",
    icon: "layers",
  },
  {
    id: "architectural",
    name: "Architectural",
    basePrice: 500,
    adjustedPrice: 500,
    description: "Dimensional shingles with depth",
    icon: "grid",
  },
  {
    id: "metal-pbr",
    name: "Metal PBR",
    basePrice: 800,
    adjustedPrice: 800,
    description: "Purlin bearing rib metal panels",
    icon: "box",
  },
  {
    id: "standing-seam",
    name: "Standing Seam",
    basePrice: 1000,
    adjustedPrice: 1000,
    description: "Premium metal roofing",
    icon: "align-justify",
  },
];

export default function CostInputScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "CostInput">>();
  const { projectId } = route.params;

  const [selectedMaterial, setSelectedMaterial] = useState<string>("three-tab");
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>(
    MATERIAL_TYPES.reduce((acc, m) => ({ ...acc, [m.id]: m.basePrice }), {})
  );
  const [roofSquares, setRoofSquares] = useState<number>(0);
  const [laborRate, setLaborRate] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, []);

  const loadProjectData = async () => {
    try {
      const stored = await AsyncStorage.getItem("roofmaster_projects");
      if (stored) {
        const projects = JSON.parse(stored);
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
          // Use stored roofSquares if available, otherwise calculate from roofArea
          const squares = project.roofSquares || Math.ceil(project.roofArea / 100);
          setRoofSquares(squares);

          if (project.selectedMaterial) {
            setSelectedMaterial(project.selectedMaterial);
          }

          if (project.materialPricePerSquare) {
            setMaterialPrices((prev) => ({
              ...prev,
              [project.selectedMaterial || "three-tab"]: project.materialPricePerSquare,
            }));
          }

          if (project.laborRate) {
            setLaborRate(project.laborRate.toString());
          }

          if (project.laborHours) {
            setLaborHours(project.laborHours.toString());
          }

          if (project.additionalCosts) {
            setAdditionalCosts(project.additionalCosts.toString());
          }
        }
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const updateMaterialPrice = (materialId: string, price: number) => {
    setMaterialPrices((prev) => ({ ...prev, [materialId]: Math.round(price) }));
  };

  const getSelectedMaterialPrice = () => {
    return materialPrices[selectedMaterial] || 0;
  };

  const calculateMaterialsCost = () => {
    return roofSquares * getSelectedMaterialPrice();
  };

  const calculateLaborCost = () => {
    const rate = parseFloat(laborRate) || 0;
    const hours = parseFloat(laborHours) || 0;
    return rate * hours;
  };

  const calculateTotal = () => {
    const b = getMicroBreakdown();
    const materialTotal = (b.shingleTotal || 0) + (b.wasteTotal || 0) + (b.underlaymentTotal || 0) + 
      (b.iceShieldTotal || 0) + (b.dripEdgeTotal || 0) + (b.starterTotal || 0) + 
      (b.ridgeCapTotal || 0) + (b.flashingTotal || 0) + (b.ventTotal || 0) + (b.nailTotal || 0);
    return materialTotal + (b.labor || 0) + (b.additional || 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMicroBreakdown = () => {
    const laborTotal = calculateLaborCost();
    const additional = parseFloat(additionalCosts) || 0;
    const pricePerSquare = getSelectedMaterialPrice() || 0;
    const squares = roofSquares || 1;

    // Calculate quantities per square (industry standard)
    // Shingles: 3 bundles per square for 3-tab, 4-5 for architectural
    const isArchitectural = selectedMaterial === "architectural" || selectedMaterial === "standing-seam";
    const bundlesPerSquare = isArchitectural ? 4 : 3;
    const shingleBundles = Math.max(1, squares * bundlesPerSquare);
    const shingleCostPerBundle = bundlesPerSquare > 0 ? Math.round(pricePerSquare * 0.62 / bundlesPerSquare) : 0;
    
    // Underlayment: 1 roll covers 4 squares (15 lb felt) or 2 squares (synthetic)
    const underlaymentRolls = Math.ceil(squares / 3);
    const underlaymentCostPerRoll = 45;
    
    // Ice & Water Shield: 1 roll per 2 squares of eave/valley
    const iceShieldRolls = Math.ceil(squares * 0.15);
    const iceShieldCostPerRoll = 85;
    
    // Drip Edge: 10 ft pieces, perimeter = sqrt(area) * 4 roughly
    const roofPerimeter = Math.sqrt(squares * 100) * 4;
    const dripEdgePieces = Math.ceil(roofPerimeter / 10);
    const dripEdgeCostPerPiece = 8;
    
    // Starter Strip: same as drip edge
    const starterStripPieces = dripEdgePieces;
    const starterCostPerPiece = 12;
    
    // Ridge Cap: 1 bundle per 20-35 linear feet of ridge
    const ridgeLength = Math.sqrt(squares * 100) * 0.4;
    const ridgeCapBundles = Math.ceil(ridgeLength / 25);
    const ridgeCapCostPerBundle = 55;
    
    // Nails: 1.5 lbs per square (coil nails) or 2.5 lbs (hand nails)
    const nailPounds = squares * 2;
    const nailCostPerPound = 3;
    
    // Vents: 1 per 150 sq ft of attic space
    const ventCount = Math.ceil(squares / 1.5);
    const ventCostEach = 25;
    
    // Flashing: step and chimney flashing
    const flashingPieces = Math.ceil(squares * 0.3);
    const flashingCostPerPiece = 15;

    // Waste factor: 12% extra on shingles
    const wasteSquares = Math.ceil(squares * 0.12);
    const wasteBundles = wasteSquares * bundlesPerSquare;

    return {
      // Quantities
      shingleBundles,
      shingleCostPerBundle: Math.round(shingleCostPerBundle),
      shingleTotal: Math.round(shingleBundles * shingleCostPerBundle),
      
      wasteBundles,
      wasteTotal: Math.round(wasteBundles * shingleCostPerBundle),
      
      underlaymentRolls,
      underlaymentCostPerRoll,
      underlaymentTotal: Math.round(underlaymentRolls * underlaymentCostPerRoll),
      
      iceShieldRolls,
      iceShieldCostPerRoll,
      iceShieldTotal: Math.round(iceShieldRolls * iceShieldCostPerRoll),
      
      dripEdgePieces,
      dripEdgeCostPerPiece,
      dripEdgeTotal: Math.round(dripEdgePieces * dripEdgeCostPerPiece),
      
      starterStripPieces,
      starterCostPerPiece,
      starterTotal: Math.round(starterStripPieces * starterCostPerPiece),
      
      ridgeCapBundles,
      ridgeCapCostPerBundle,
      ridgeCapTotal: Math.round(ridgeCapBundles * ridgeCapCostPerBundle),
      
      nailPounds,
      nailCostPerPound,
      nailTotal: Math.round(nailPounds * nailCostPerPound),
      
      ventCount,
      ventCostEach,
      ventTotal: Math.round(ventCount * ventCostEach),
      
      flashingPieces,
      flashingCostPerPiece,
      flashingTotal: Math.round(flashingPieces * flashingCostPerPiece),
      
      labor: Math.round(laborTotal),
      laborRate: parseFloat(laborRate) || 0,
      laborHours: parseFloat(laborHours) || 0,
      
      additional: Math.round(additional),
      
      // Legacy fields for compatibility
      shingles: Math.round(shingleBundles * shingleCostPerBundle),
      waste: Math.round(wasteBundles * shingleCostPerBundle),
      underlayment: Math.round(underlaymentRolls * underlaymentCostPerRoll),
      flashing: Math.round(flashingPieces * flashingCostPerPiece),
      nails: Math.round(nailPounds * nailCostPerPound),
      venting: Math.round(ventCount * ventCostEach),
      ridgeCap: Math.round(ridgeCapBundles * ridgeCapCostPerBundle),
    };
  };

  const handlePreview = async () => {
    setIsSubmitting(true);

    try {
      const stored = await AsyncStorage.getItem("roofmaster_projects");
      if (stored) {
        const projects = JSON.parse(stored);
        const index = projects.findIndex((p: any) => p.id === projectId);
        if (index !== -1) {
          const breakdown = getMicroBreakdown();
          projects[index] = {
            ...projects[index],
            selectedMaterial,
            materialPricePerSquare: getSelectedMaterialPrice(),
            roofSquares,
            microBreakdown: breakdown,
            laborRate: parseFloat(laborRate) || 0,
            laborHours: parseFloat(laborHours) || 0,
            additionalCosts: parseFloat(additionalCosts) || 0,
            estimateTotal: calculateTotal(),
          };
          await AsyncStorage.setItem(
            "roofmaster_projects",
            JSON.stringify(projects)
          );
        }
      }

      navigation.navigate("EstimatePreview", { projectId });
    } catch (error) {
      Alert.alert("Error", "Failed to save costs. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMaterialData = MATERIAL_TYPES.find((m) => m.id === selectedMaterial);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Roofing Material
          </ThemedText>
          <ThemedText type="secondary" style={styles.sectionSubtitle}>
            Select material type and adjust price per square
          </ThemedText>

          <View style={styles.materialGrid}>
            {MATERIAL_TYPES.map((material) => (
              <Pressable
                key={material.id}
                onPress={() => setSelectedMaterial(material.id)}
                style={({ pressed }) => [
                  styles.materialOption,
                  {
                    backgroundColor:
                      selectedMaterial === material.id
                        ? theme.accent + "15"
                        : theme.backgroundDefault,
                    borderColor:
                      selectedMaterial === material.id
                        ? theme.accent
                        : theme.divider,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.materialIconWrap,
                    {
                      backgroundColor:
                        selectedMaterial === material.id
                          ? theme.accent
                          : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <Feather
                    name={material.icon as any}
                    size={20}
                    color={
                      selectedMaterial === material.id ? "white" : theme.text
                    }
                  />
                </View>
                <ThemedText
                  type="body"
                  style={[
                    styles.materialName,
                    {
                      color:
                        selectedMaterial === material.id
                          ? theme.accent
                          : theme.text,
                    },
                  ]}
                >
                  {material.name}
                </ThemedText>
                <ThemedText type="secondary" style={styles.materialPrice}>
                  {formatCurrency(materialPrices[material.id])}/sq
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Price Adjustor: {selectedMaterialData?.name}
          </ThemedText>
          <ThemedText type="secondary" style={styles.sectionSubtitle}>
            Slide to adjust your price per square
          </ThemedText>

          <Card style={styles.sliderCard}>
            <View style={styles.sliderHeader}>
              <ThemedText type="secondary">Base: {formatCurrency(selectedMaterialData?.basePrice || 0)}</ThemedText>
              <ThemedText type="h3" style={{ color: theme.accent }}>
                {formatCurrency(materialPrices[selectedMaterial])}
              </ThemedText>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={(selectedMaterialData?.basePrice || 0) * 0.5}
              maximumValue={(selectedMaterialData?.basePrice || 0) * 2}
              value={materialPrices[selectedMaterial]}
              onValueChange={(value) => updateMaterialPrice(selectedMaterial, value)}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.divider}
              thumbTintColor={theme.accent}
            />
            <View style={styles.sliderLabels}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatCurrency((selectedMaterialData?.basePrice || 0) * 0.5)}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {formatCurrency((selectedMaterialData?.basePrice || 0) * 2)}
              </ThemedText>
            </View>
          </Card>

          <View style={styles.squaresInfo}>
            <ThemedText type="secondary">Roof Size:</ThemedText>
            <ThemedText type="h4" style={{ color: theme.accent }}>
              {roofSquares} Squares
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Labor
          </ThemedText>
          <View style={styles.laborInputs}>
            <View style={styles.inputField}>
              <ThemedText type="secondary" style={styles.fieldLabel}>
                Hourly Rate ($)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={laborRate}
                  onChangeText={setLaborRate}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={styles.inputField}>
              <ThemedText type="secondary" style={styles.fieldLabel}>
                Estimated Hours
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  value={laborHours}
                  onChangeText={setLaborHours}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionTitle}>
            Additional Costs
          </ThemedText>
          <ThemedText type="secondary" style={styles.sectionSubtitle}>
            Permits, disposal fees, equipment rental, etc.
          </ThemedText>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="body" style={styles.currencyPrefix}>
              $
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              value={additionalCosts}
              onChangeText={setAdditionalCosts}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <ThemedText type="secondary" style={styles.summaryLabel}>
            Detailed Material Breakdown
          </ThemedText>
          
          <ThemedText type="small" style={[styles.breakdownSection, { color: theme.textSecondary }]}>
            ROOFING MATERIALS ({selectedMaterialData?.name})
          </ThemedText>
          
          {(() => {
            const b = getMicroBreakdown();
            return (
              <>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Shingles/Panels</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.shingleBundles} bundles x {formatCurrency(b.shingleCostPerBundle)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.shingleTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Waste Factor (12%)</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.wasteBundles} bundles extra
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.wasteTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Underlayment</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.underlaymentRolls} rolls x {formatCurrency(b.underlaymentCostPerRoll)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.underlaymentTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Ice & Water Shield</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.iceShieldRolls} rolls x {formatCurrency(b.iceShieldCostPerRoll)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.iceShieldTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Drip Edge</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.dripEdgePieces} pcs x {formatCurrency(b.dripEdgeCostPerPiece)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.dripEdgeTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Starter Strip</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.starterStripPieces} pcs x {formatCurrency(b.starterCostPerPiece)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.starterTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Ridge Cap</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.ridgeCapBundles} bundles x {formatCurrency(b.ridgeCapCostPerBundle)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.ridgeCapTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Flashing</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.flashingPieces} pcs x {formatCurrency(b.flashingCostPerPiece)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.flashingTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Roof Vents</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.ventCount} units x {formatCurrency(b.ventCostEach)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.ventTotal)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Nails/Fasteners</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.nailPounds} lbs x {formatCurrency(b.nailCostPerPound)}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.nailTotal)}</ThemedText>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                <ThemedText type="small" style={[styles.breakdownSection, { color: theme.textSecondary }]}>
                  LABOR & OTHER
                </ThemedText>
                <View style={styles.summaryRow}>
                  <View style={styles.itemDetails}>
                    <ThemedText type="body">Labor</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {b.laborHours} hrs x {formatCurrency(b.laborRate)}/hr
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{formatCurrency(b.labor)}</ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText type="body">Additional Costs</ThemedText>
                  <ThemedText type="body">{formatCurrency(b.additional)}</ThemedText>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                <View style={styles.summaryRow}>
                  <ThemedText type="h4">Total Estimate</ThemedText>
                  <ThemedText type="h3" style={{ color: theme.accent }}>
                    {formatCurrency(calculateTotal())}
                  </ThemedText>
                </View>
                <View style={styles.perSquareRow}>
                  <ThemedText type="secondary">
                    {formatCurrency(getSelectedMaterialPrice())} x {roofSquares} squares
                  </ThemedText>
                </View>
              </>
            );
          })()}
        </Card>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button onPress={handlePreview} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Preview Estimate"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  materialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  materialOption: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  materialIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  materialName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  materialPrice: {
    fontSize: 13,
  },
  sliderCard: {
    marginBottom: Spacing.md,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -Spacing.sm,
  },
  squaresInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  laborInputs: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  inputField: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: Spacing.sm,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  currencyPrefix: {
    marginRight: Spacing.xs,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    marginBottom: Spacing.lg,
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  breakdownSection: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  perSquareRow: {
    alignItems: "flex-end",
    marginTop: Spacing.xs,
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
});
