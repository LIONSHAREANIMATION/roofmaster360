import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type FeedbackType = "bug" | "feature" | "general";

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const feedbackTypes: { id: FeedbackType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: "bug", label: "Report Bug", icon: "alert-circle" },
    { id: "feature", label: "Feature Request", icon: "star" },
    { id: "general", label: "General Feedback", icon: "message-circle" },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Required", "Please enter your feedback message.");
      return;
    }

    setIsSending(true);

    const typeLabel = feedbackTypes.find((t) => t.id === feedbackType)?.label || "Feedback";
    const emailSubject = subject.trim() || `RoofMaster 360 ${typeLabel}`;
    const emailBody = `Type: ${typeLabel}\n\n${message}\n\n---\nSent from RoofMaster 360 App`;

    const mailtoUrl = `mailto:feedback@roofmaster360.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Alert.alert(
          "Thank You",
          "Your feedback helps us improve RoofMaster 360!",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Email Not Available",
          "Please send your feedback to feedback@roofmaster360.com or visit lionshareanimation.com",
          [
            { text: "Visit Website", onPress: () => Linking.openURL("https://lionshareanimation.com") },
            { text: "OK" },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const openWebsite = () => {
    Linking.openURL("https://lionshareanimation.com");
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Feather name="heart" size={24} color={theme.accent} />
          <ThemedText type="h4">We Value Your Feedback</ThemedText>
        </View>
        <ThemedText type="secondary">
          Your feedback helps us make RoofMaster 360 better for roofing professionals like you. Share your thoughts, report issues, or suggest new features.
        </ThemedText>
      </Card>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Feedback Type
      </ThemedText>
      <View style={styles.typeRow}>
        {feedbackTypes.map((type) => (
          <Card
            key={type.id}
            style={
              feedbackType === type.id
                ? { ...styles.typeCard, borderWidth: 2, borderColor: theme.accent }
                : styles.typeCard
            }
            onPress={() => setFeedbackType(type.id)}
          >
            <Feather
              name={type.icon}
              size={24}
              color={feedbackType === type.id ? theme.accent : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={[
                styles.typeLabel,
                feedbackType === type.id && { color: theme.accent, fontWeight: "600" },
              ]}
            >
              {type.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Subject (Optional)
      </ThemedText>
      <View style={[styles.inputContainer, { backgroundColor: theme.backgroundDefault }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Brief summary of your feedback"
          placeholderTextColor={theme.textSecondary}
          value={subject}
          onChangeText={setSubject}
          returnKeyType="next"
        />
      </View>

      <ThemedText type="secondary" style={styles.sectionLabel}>
        Your Message
      </ThemedText>
      <View style={[styles.textareaContainer, { backgroundColor: theme.backgroundDefault }]}>
        <TextInput
          style={[styles.textarea, { color: theme.text }]}
          placeholder="Tell us what's on your mind..."
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <Button onPress={handleSubmit} disabled={isSending} style={styles.submitButton}>
        {isSending ? "Opening Email..." : "Send Feedback"}
      </Button>

      <Card style={styles.supportCard} onPress={openWebsite}>
        <View style={styles.supportRow}>
          <View style={[styles.supportIcon, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="external-link" size={20} color={theme.accent} />
          </View>
          <View style={styles.supportContent}>
            <ThemedText type="body" style={styles.supportTitle}>
              Need More Help?
            </ThemedText>
            <ThemedText type="secondary">
              Visit lionshareanimation.com for support
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  typeLabel: {
    textAlign: "center",
  },
  inputContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  input: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  textareaContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  textarea: {
    minHeight: 140,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    lineHeight: 24,
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
  supportCard: {
    marginBottom: Spacing.lg,
  },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
});
