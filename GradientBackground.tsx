import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientBackgroundProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "mesh" | "subtle";
}

// Carbon fiber matte black palette
const carbonColors: [string, string, ...string[]] = ["#0A0A0A", "#101010", "#141414", "#101010", "#0A0A0A"];
const meshColors: [string, string, ...string[]] = ["#0A0A0A", "#0E0E0E", "#121212", "#0E0E0E", "#0A0A0A"];
const subtleColors: [string, string, ...string[]] = ["#0A0A0A", "#0D0D0D", "#0A0A0A"];

export function GradientBackground({
  children,
  style,
  variant = "default",
}: GradientBackgroundProps) {
  const colors = variant === "mesh" ? meshColors : variant === "subtle" ? subtleColors : carbonColors;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
