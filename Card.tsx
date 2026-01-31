import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CardProps {
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  glowColor?: "platinum" | "silver" | "success" | "none";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
  glowColor = "none",
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const getGlowBorderColor = () => {
    if (glowColor === "platinum") return "rgba(255, 255, 255, 0.15)";
    if (glowColor === "silver") return "rgba(255, 255, 255, 0.1)";
    if (glowColor === "success") return theme.success;
    return "rgba(255, 255, 255, 0.06)";
  };

  const getGlowShadowColor = () => {
    if (glowColor === "platinum") return "rgba(255, 255, 255, 0.08)";
    if (glowColor === "silver") return "rgba(255, 255, 255, 0.05)";
    if (glowColor === "success") return theme.success;
    return "transparent";
  };

  const cardContent = (
    <>
      {title ? (
        <ThemedText type="h4" style={styles.cardTitle}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="secondary" style={styles.cardDescription}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </>
  );

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          borderColor: getGlowBorderColor(),
          shadowColor: getGlowShadowColor(),
          shadowOpacity: glowColor !== "none" ? 1 : 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 12,
        },
        animatedStyle,
        style,
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18, 18, 18, 0.95)" }]} />
      )}
      <View style={styles.cardContent}>{cardContent}</View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    opacity: 0.7,
  },
});
