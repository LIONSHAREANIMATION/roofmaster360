import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          opacity: disabled ? 0.5 : 1,
          borderColor: isPrimary ? "rgba(255, 255, 255, 0.12)" : isGhost ? "transparent" : "rgba(255, 255, 255, 0.06)",
          borderWidth: isGhost ? 0 : 1,
          shadowColor: isPrimary ? "rgba(255, 255, 255, 0.15)" : "transparent",
          shadowOpacity: isPrimary ? 1 : 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 16,
          elevation: isPrimary ? 4 : 0,
        },
        style,
        animatedStyle,
      ]}
    >
      {Platform.OS === "ios" && !isGhost ? (
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
      ) : !isGhost ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(18, 18, 18, 0.95)" }]} />
      ) : null}
      {isPrimary ? (
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <ThemedText
        type="body"
        style={[styles.buttonText, { color: "#FFFFFF" }]}
      >
        {children}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
