import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { BlurView } from "expo-blur";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequestSafe } from "@/lib/query-client";

interface RoofSegment {
  id: number;
  areaSqFt: number;
  pitchDegrees: number;
  pitchRatio: number;
  orientation: string;
}

interface MeasurementResult {
  totalAreaSqFt: number;
  roofSquares: number;
  avgPitchDegrees: number;
  avgPitchRatio: number;
  segmentCount: number;
  segments: RoofSegment[];
}

interface PermitAddress {
  street_no: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

interface Permit {
  id: string;
  address: PermitAddress;
  permitType: string;
  status: string;
  issueDate: string;
  description?: string;
}

export default function NewProjectScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [address, setAddress] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [pitch, setPitch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoMeasuring, setIsAutoMeasuring] = useState(false);
  const [autoMeasurements, setAutoMeasurements] = useState<MeasurementResult | null>(null);
  const [measurementError, setMeasurementError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [isLoadingPermits, setIsLoadingPermits] = useState(false);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const handleVoiceInput = async () => {
    if (Platform.OS === "web") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        Alert.alert("Not Supported", "Speech recognition is not supported in this browser.");
        return;
      }

      if (isRecording) {
        setIsRecording(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        setAddress(event.results[0][0].transcript.trim());
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      try {
        recognition.start();
      } catch (error) {
        Alert.alert("Error", "Could not start voice input.");
      }
      return;
    }

    if (isRecording) {
      try {
        await audioRecorder.stop();
        setIsRecording(false);
        setIsTranscribing(true);

        const uri = audioRecorder.uri;
        if (uri) {
          const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
          const response = await apiRequestSafe("POST", "/api/speech-to-text", { audio: base64Audio });
          const data = await response.json();

          if (data.success && data.text) {
            setAddress(data.text.trim());
          }
        }
      } catch (error) {
        console.error("Voice input error:", error);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert("Permission Required", "Microphone access is needed for voice input.");
          return;
        }
        await audioRecorder.record();
        setIsRecording(true);
      } catch (error) {
        console.error("Recording start error:", error);
      }
    }
  };

  const calculateRoofArea = () => {
    if (autoMeasurements) return autoMeasurements.totalAreaSqFt;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const p = parseFloat(pitch) || 0;
    const pitchMultiplier = 1 + (p / 12) * 0.1;
    return Math.round(l * w * pitchMultiplier);
  };

  const extractZipCode = (addr: string): string | null => {
    const match = addr.match(/\b\d{5}(-\d{4})?\b/);
    return match ? match[0].substring(0, 5) : null;
  };

  const fetchPermits = async (addr: string) => {
    setIsLoadingPermits(true);
    try {
      const zipCode = extractZipCode(addr);
      const searchQuery = zipCode || addr;
      const response = await apiRequestSafe("POST", "/api/permits", { address: searchQuery });
      const data = await response.json();
      if (data.success && data.permits) {
        setPermits(data.permits.slice(0, 3));
      }
    } catch (error) {
      console.error("Permit fetch error:", error);
    } finally {
      setIsLoadingPermits(false);
    }
  };

  const handleAutoMeasure = async () => {
    if (!address.trim()) {
      Alert.alert("Missing Address", "Please enter a property address first.");
      return;
    }

    setIsAutoMeasuring(true);
    setMeasurementError(null);
    setAutoMeasurements(null);
    setPermits([]);

    fetchPermits(address.trim());

    try {
      const response = await apiRequestSafe("POST", "/api/roof-measurements", { address: address.trim() });
      const data = await response.json();

      if (!response.ok) {
        setMeasurementError(data.error || data.message || "Failed to get measurements.");
        return;
      }

      if (data.success && data.measurements) {
        setAutoMeasurements(data.measurements);
        setPitch(String(data.measurements.avgPitchRatio));
        const side = Math.round(Math.sqrt(data.measurements.totalAreaSqFt));
        setLength(String(side));
        setWidth(String(side));
      } else if (data.configured === false) {
        setMeasurementError("Satellite measurement not configured. Using manual entry.");
      } else {
        setMeasurementError(data.error || "Could not get measurements for this address.");
      }
    } catch (error) {
      console.error("Measurement error:", error);
      setMeasurementError("Network error. Please check your connection.");
    } finally {
      setIsAutoMeasuring(false);
    }
  };

  const handleContinue = async () => {
    if (!address.trim()) {
      Alert.alert("Missing Information", "Please enter a property address.");
      return;
    }
    
    const roofArea = calculateRoofArea();
    if (roofArea <= 0) {
      Alert.alert("Missing Information", "Please get satellite measurements or enter manually.");
      return;
    }

    setIsSubmitting(true);

    try {
      const projectId = Date.now().toString();
      const newProject = {
        id: projectId,
        address: address.trim(),
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        pitch: parseFloat(pitch) || 4,
        roofArea,
        roofSquares: autoMeasurements?.roofSquares || Math.ceil(roofArea / 100),
        autoMeasurements,
        materials: [],
        laborRate: 0,
        additionalCosts: 0,
        estimateTotal: 0,
        status: "draft",
        createdAt: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem("roofmaster_projects");
      const projects = stored ? JSON.parse(stored) : [];
      projects.unshift(newProject);
      await AsyncStorage.setItem("roofmaster_projects", JSON.stringify(projects));

      navigation.replace("CostInput", { projectId });
    } catch (error) {
      Alert.alert("Error", "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roofArea = calculateRoofArea();
  const hasValidMeasurements = roofArea > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={[styles.heroCard, { backgroundColor: isDark ? "rgba(255,107,53,0.15)" : "rgba(255,107,53,0.08)" }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.heroIconContainer, { backgroundColor: theme.accent }]}>
              <Feather name="globe" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextContainer}>
              <ThemedText type="h4" style={styles.heroTitle}>
                Satellite Roof Measurement
              </ThemedText>
              <ThemedText type="secondary" style={styles.heroSubtitle}>
                Instant measurements from satellite imagery
              </ThemedText>
            </View>
          </View>

          <View style={styles.addressSection}>
            <ThemedText type="body" style={styles.inputLabel}>Property Address</ThemedText>
            <View style={styles.addressRow}>
              <View style={[styles.addressInputContainer, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="map-pin" size={18} color={theme.accent} style={styles.inputIcon} />
                <TextInput
                  style={[styles.addressInput, { color: theme.text }]}
                  placeholder="Enter full address with zip code"
                  placeholderTextColor={theme.textSecondary}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    setAutoMeasurements(null);
                    setMeasurementError(null);
                  }}
                  autoCapitalize="words"
                />
              </View>
              <Pressable
                onPress={handleVoiceInput}
                disabled={isTranscribing}
                style={({ pressed }) => [
                  styles.voiceButton,
                  { backgroundColor: isRecording ? "#DC3545" : theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {isTranscribing ? (
                  <ActivityIndicator color={theme.accent} size="small" />
                ) : (
                  <Feather name={isRecording ? "mic-off" : "mic"} size={20} color={isRecording ? "#FFFFFF" : theme.accent} />
                )}
              </Pressable>
            </View>
            {isRecording ? (
              <ThemedText type="secondary" style={styles.recordingHint}>Listening... tap mic when done</ThemedText>
            ) : null}
          </View>

          <Pressable
            onPress={handleAutoMeasure}
            disabled={isAutoMeasuring || !address.trim()}
            style={({ pressed }) => [
              styles.measureButton,
              { backgroundColor: theme.accent, opacity: pressed || isAutoMeasuring || !address.trim() ? 0.7 : 1 },
            ]}
          >
            {isAutoMeasuring ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather name="zap" size={22} color="#FFFFFF" />
            )}
            <ThemedText type="body" style={styles.measureButtonText}>
              {isAutoMeasuring ? "Analyzing Satellite Imagery..." : "Get Roof Measurements"}
            </ThemedText>
          </Pressable>

          {measurementError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#DC3545" />
              <ThemedText type="secondary" style={styles.errorText}>{measurementError}</ThemedText>
            </View>
          ) : null}
        </View>

        {autoMeasurements ? (
          <View style={[styles.resultsCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.resultsHeader}>
              <View style={[styles.successBadge, { backgroundColor: Colors.light.success + "20" }]}>
                <Feather name="check-circle" size={16} color={Colors.light.success} />
                <ThemedText type="small" style={{ color: Colors.light.success, fontWeight: "600" }}>
                  Measurement Complete
                </ThemedText>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.accent + "15" }]}>
                <ThemedText type="h2" style={{ color: theme.accent }}>
                  {autoMeasurements.totalAreaSqFt.toLocaleString()}
                </ThemedText>
                <ThemedText type="secondary">Square Feet</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.accent + "15" }]}>
                <ThemedText type="h2" style={{ color: theme.accent }}>
                  {autoMeasurements.roofSquares}
                </ThemedText>
                <ThemedText type="secondary">Roofing Squares</ThemedText>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Feather name="trending-up" size={18} color={theme.textSecondary} />
                <ThemedText type="body" style={styles.detailValue}>
                  {autoMeasurements.avgPitchRatio}:12
                </ThemedText>
                <ThemedText type="secondary" style={styles.detailLabel}>Pitch</ThemedText>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.detailItem}>
                <Feather name="layers" size={18} color={theme.textSecondary} />
                <ThemedText type="body" style={styles.detailValue}>
                  {autoMeasurements.segmentCount}
                </ThemedText>
                <ThemedText type="secondary" style={styles.detailLabel}>Sections</ThemedText>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.detailItem}>
                <Feather name="compass" size={18} color={theme.textSecondary} />
                <ThemedText type="body" style={styles.detailValue}>
                  {autoMeasurements.segments[0]?.orientation || "Mixed"}
                </ThemedText>
                <ThemedText type="secondary" style={styles.detailLabel}>Primary</ThemedText>
              </View>
            </View>

            {autoMeasurements.segments.length > 1 ? (
              <View style={[styles.segmentsSection, { borderTopColor: theme.divider }]}>
                <ThemedText type="body" style={styles.segmentsTitle}>Roof Segments</ThemedText>
                {autoMeasurements.segments.slice(0, 4).map((seg) => (
                  <View key={seg.id} style={[styles.segmentItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={styles.segmentInfo}>
                      <ThemedText type="body">{seg.orientation}</ThemedText>
                      <ThemedText type="secondary">{seg.pitchRatio}:12 pitch</ThemedText>
                    </View>
                    <ThemedText type="body" style={{ color: theme.accent, fontWeight: "600" }}>
                      {seg.areaSqFt ? seg.areaSqFt.toLocaleString() : "—"} sq ft
                    </ThemedText>
                  </View>
                ))}
                {autoMeasurements.segments.length > 4 ? (
                  <ThemedText type="secondary" style={styles.moreSegments}>
                    +{autoMeasurements.segments.length - 4} more segments
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {(permits.length > 0 || isLoadingPermits) ? (
          <View style={[styles.permitsCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.permitsHeader}>
              <Feather name="file-text" size={20} color={theme.accent} />
              <ThemedText type="body" style={styles.permitsTitle}>Recent Permits in Area</ThemedText>
            </View>
            
            {isLoadingPermits ? (
              <View style={styles.permitsLoading}>
                <ActivityIndicator color={theme.accent} size="small" />
                <ThemedText type="secondary">Loading permit history...</ThemedText>
              </View>
            ) : (
              <>
                {permits.map((permit) => (
                  <View key={permit.id} style={[styles.permitItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={styles.permitItemHeader}>
                      <ThemedText type="body" style={styles.permitAddress}>
                        {permit.address.street_no} {permit.address.street}
                      </ThemedText>
                      <View style={[styles.permitStatus, { backgroundColor: permit.status === "approved" ? Colors.light.success + "20" : Colors.light.accent + "20" }]}>
                        <ThemedText type="small" style={{ color: permit.status === "approved" ? Colors.light.success : Colors.light.accent, fontWeight: "600" }}>
                          {permit.status}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="secondary" style={styles.permitType}>{permit.permitType}</ThemedText>
                    {permit.description ? (
                      <ThemedText type="small" style={styles.permitDescription} numberOfLines={2}>
                        {permit.description}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 4 }}>
                      {new Date(permit.issueDate).toLocaleDateString()}
                    </ThemedText>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() => setShowManualEntry(!showManualEntry)}
          style={[styles.manualToggle, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.manualToggleContent}>
            <Feather name="edit-3" size={20} color={theme.textSecondary} />
            <View>
              <ThemedText type="body">Manual Entry</ThemedText>
              <ThemedText type="secondary" style={styles.manualToggleSubtitle}>
                {autoMeasurements ? "Override satellite data" : "Enter measurements yourself"}
              </ThemedText>
            </View>
          </View>
          <Feather name={showManualEntry ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
        </Pressable>

        {showManualEntry ? (
          <View style={[styles.manualSection, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.manualRow}>
              <View style={styles.manualField}>
                <ThemedText type="secondary" style={styles.fieldLabel}>Length (ft)</ThemedText>
                <View style={[styles.fieldInput, { backgroundColor: theme.backgroundSecondary }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    value={length}
                    onChangeText={setLength}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.manualField}>
                <ThemedText type="secondary" style={styles.fieldLabel}>Width (ft)</ThemedText>
                <View style={[styles.fieldInput, { backgroundColor: theme.backgroundSecondary }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    value={width}
                    onChangeText={setWidth}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
            <View style={styles.manualField}>
              <ThemedText type="secondary" style={styles.fieldLabel}>Pitch (rise per 12")</ThemedText>
              <View style={[styles.fieldInput, { backgroundColor: theme.backgroundSecondary }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="4"
                  placeholderTextColor={theme.textSecondary}
                  value={pitch}
                  onChangeText={setPitch}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ) : null}

        {hasValidMeasurements && !autoMeasurements ? (
          <View style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="secondary">Calculated Roof Area</ThemedText>
            <ThemedText type="h3" style={{ color: theme.accent }}>{roofArea.toLocaleString()} sq ft</ThemedText>
            <ThemedText type="secondary">({Math.ceil(roofArea / 100)} roofing squares)</ThemedText>
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button onPress={handleContinue} disabled={isSubmitting || !hasValidMeasurements}>
          {isSubmitting ? "Creating Project..." : "Continue to Cost Estimate"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  
  heroCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  heroTextContainer: { flex: 1 },
  heroTitle: { fontWeight: "700" },
  heroSubtitle: { marginTop: 2 },
  
  addressSection: { marginBottom: Spacing.lg },
  inputLabel: { fontWeight: "600", marginBottom: Spacing.sm },
  addressRow: { flexDirection: "row", gap: Spacing.sm },
  addressInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  addressInput: { flex: 1, fontSize: 16 },
  voiceButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingHint: { marginTop: Spacing.xs, fontStyle: "italic", color: "#DC3545" },
  
  measureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  measureButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "#DC354515",
    borderRadius: BorderRadius.sm,
  },
  errorText: { flex: 1, color: "#DC3545" },
  
  resultsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  resultsHeader: { marginBottom: Spacing.lg },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
  },
  detailItem: { alignItems: "center", gap: 4 },
  detailValue: { fontWeight: "600" },
  detailLabel: { fontSize: 12 },
  detailDivider: { width: 1, height: 40 },
  
  segmentsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  segmentsTitle: { fontWeight: "600", marginBottom: Spacing.md },
  segmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  segmentInfo: { gap: 2 },
  moreSegments: { textAlign: "center", marginTop: Spacing.sm },
  
  permitsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  permitsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  permitsTitle: { fontWeight: "600" },
  permitsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  permitItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  permitItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  permitAddress: { fontWeight: "600", flex: 1, marginRight: Spacing.sm },
  permitStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  permitType: { marginBottom: 4 },
  permitDescription: { marginTop: 4, lineHeight: 18 },
  
  manualToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  manualToggleContent: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  manualToggleSubtitle: { marginTop: 2 },
  
  manualSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  manualRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.md },
  manualField: { flex: 1 },
  fieldLabel: { marginBottom: Spacing.xs, fontSize: 13 },
  fieldInput: {
    height: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  input: { flex: 1, fontSize: 16, height: "100%" },
  
  summaryCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
});
