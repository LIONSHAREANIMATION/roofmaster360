import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { GradientBackground } from "@/components/GradientBackground";
import { apiRequest } from "@/lib/query-client";

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onSkip: () => void;
}

export default function AuthScreen({ onAuthSuccess, onSkip }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email.trim() || !password) {
        Alert.alert("Missing Information", "Please enter your email and password.");
        return;
      }
    } else {
      if (!username.trim() || !email.trim() || !password) {
        Alert.alert("Missing Information", "Please fill in all fields.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        Alert.alert("Weak Password", "Password must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email: email.trim(), password }
        : { username: username.trim(), email: email.trim(), password };

      const response = await apiRequest("POST", endpoint, body);
      const data = await response.json();

      if (data.success && data.user && data.token) {
        await AsyncStorage.setItem("roofmaster_user", JSON.stringify({
          ...data.user,
          token: data.token,
        }));
        onAuthSuccess(data.user);
      } else {
        Alert.alert("Error", data.error || "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <GradientBackground style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["2xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: theme.accent }]}>
            <Feather name="home" size={40} color="#FFFFFF" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            RoofMaster 360
          </ThemedText>
          <ThemedText type="secondary" style={styles.subtitle}>
            Professional Roofing Estimation
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          <ThemedText type="h3" style={styles.formTitle}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </ThemedText>

          {!isLogin ? (
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="user" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Username"
                placeholderTextColor={theme.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="mail" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="lock" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          {!isLogin ? (
            <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <Button onPress={handleSubmit} disabled={isLoading} style={styles.submitButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>

          <Pressable onPress={toggleMode} style={styles.toggleButton}>
            <ThemedText type="secondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <ThemedText type="body" style={{ color: theme.accent }}>
                {isLogin ? "Sign Up" : "Sign In"}
              </ThemedText>
            </ThemedText>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <ThemedText type="secondary" style={styles.dividerText}>
              or
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          </View>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [
              styles.skipButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="body">Continue as Guest</ThemedText>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: "center",
  },
  formContainer: {
    gap: Spacing.md,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.lg,
  },
});
