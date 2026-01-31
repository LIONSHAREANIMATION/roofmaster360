import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { apiRequest } from "@/lib/query-client";
import { Card } from "@/components/Card";

const AUTH_STORAGE_KEY = "roofmaster_user";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setCurrentUser(null);
            Alert.alert("Success", "You have been signed out.");
          },
        },
      ]
    );
  };

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
        const userData = {
          ...data.user,
          token: data.token,
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        setCurrentUser(userData);
        Alert.alert("Success", isLogin ? "Welcome back!" : "Account created successfully!");
        setEmail("");
        setPassword("");
        setUsername("");
        setConfirmPassword("");
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

  if (isCheckingAuth) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (currentUser) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.accent }]}>
            <Feather name="user" size={40} color="#FFFFFF" />
          </View>
          <ThemedText type="h3" style={styles.userName}>
            {currentUser.username || "User"}
          </ThemedText>
          <ThemedText type="secondary">{currentUser.email}</ThemedText>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="body" style={styles.infoText}>
              Signed in successfully
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Feather name="cloud" size={20} color={theme.textSecondary} />
            <ThemedText type="secondary" style={styles.infoText}>
              Your projects sync across devices
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          <View style={styles.infoRow}>
            <Feather name="cpu" size={20} color={theme.textSecondary} />
            <ThemedText type="secondary" style={styles.infoText}>
              AI Assistant access enabled
            </ThemedText>
          </View>
        </Card>

        <Button onPress={handleLogout} variant="secondary" style={styles.logoutButton}>
          Sign Out
        </Button>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <View style={styles.headerSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.accent + "15" }]}>
          <Feather name="user" size={40} color={theme.accent} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </ThemedText>
        <ThemedText type="secondary" style={styles.subtitle}>
          {isLogin
            ? "Sign in to sync your projects and access AI features"
            : "Create an account to save your work and unlock all features"}
        </ThemedText>
      </View>

      <View style={styles.formContainer}>
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
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  formContainer: {
    gap: Spacing.md,
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
    paddingVertical: Spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  infoCard: {
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  logoutButton: {
    marginBottom: Spacing.lg,
  },
});
