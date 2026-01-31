import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getApiUrl } from "@/lib/query-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_STORAGE_KEY = "roofmaster_user";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Help me format this address",
  "What materials do I need for a roof replacement?",
  "How do I calculate roofing squares?",
  "What permits are typically needed?",
];

export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your RoofMaster AI assistant. I can help you with:\n\n- Property address formatting\n- Roof measurement guidance\n- Material recommendations\n- Cost estimation tips\n- Permit requirements\n\nAs a logged-in user, you get 1 free AI request to try me out. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Get auth token
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      let token: string | null = null;
      if (userData) {
        const parsed = JSON.parse(userData);
        token = parsed.token || null;
      }

      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const baseUrl = getApiUrl();
      const url = new URL("/api/ai-assistant", baseUrl);
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
        }),
      });
      
      const data = await response.json();

      if (data.requiresAuth) {
        setRequiresAuth(true);
        const authMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Please log in to use the AI assistant. You'll get 1 free request to try it out!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, authMessage]);
      } else if (data.requiresSubscription) {
        setRequiresSubscription(true);
        const subMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "You've used your free AI request. Subscribe to a Pro plan for unlimited AI assistance!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, subMessage]);
      } else if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (data.freeRequestsRemaining === 0) {
          const warningMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "That was your free AI request. Subscribe to continue using the AI assistant!",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, warningMessage]);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please check your connection.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate("Auth");
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === "user" ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === "assistant" ? (
        <View style={[styles.avatarContainer, { backgroundColor: theme.accent }]}>
          <Feather name="cpu" size={16} color="#FFFFFF" />
        </View>
      ) : null}
      <View
        style={[
          styles.messageBubble,
          item.role === "user"
            ? { backgroundColor: theme.accent }
            : { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <ThemedText
          type="body"
          style={[
            styles.messageText,
            item.role === "user" ? { color: "#FFFFFF" } : { color: theme.text },
          ]}
        >
          {item.content}
        </ThemedText>
      </View>
    </View>
  );

  const renderQuickPrompts = () => (
    <View style={styles.quickPromptsContainer}>
      <ThemedText type="secondary" style={styles.quickPromptsTitle}>
        Quick Questions
      </ThemedText>
      <View style={styles.quickPromptsGrid}>
        {QUICK_PROMPTS.map((prompt, index) => (
          <Pressable
            key={index}
            onPress={() => sendMessage(prompt)}
            style={({ pressed }) => [
              styles.quickPromptButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText type="secondary" style={styles.quickPromptText}>
              {prompt}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <ThemedView style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { paddingTop: headerHeight + Spacing.md, paddingBottom: 120 },
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="interactive"
          ListFooterComponent={
            messages.length === 1 ? renderQuickPrompts : isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.accent} />
                <ThemedText type="secondary" style={styles.loadingText}>
                  Thinking...
                </ThemedText>
              </View>
            ) : null
          }
        />

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.md,
              borderTopColor: theme.backgroundSecondary,
            },
          ]}
        >
          {requiresAuth ? (
            <Pressable
              onPress={goToLogin}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="log-in" size={18} color="#FFFFFF" />
              <ThemedText type="body" style={styles.actionButtonText}>
                Log In to Continue
              </ThemedText>
            </Pressable>
          ) : requiresSubscription ? (
            <View style={[styles.subscriptionBanner, { backgroundColor: Colors.light.success + "15" }]}>
              <Feather name="star" size={20} color={Colors.light.success} />
              <ThemedText type="body" style={styles.subscriptionText}>
                Subscribe for unlimited AI assistance
              </ThemedText>
            </View>
          ) : (
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Ask about addresses, measurements, materials..."
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: theme.accent,
                    opacity: pressed || !inputText.trim() || isLoading ? 0.5 : 1,
                  },
                ]}
              >
                <Feather name="send" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    alignItems: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  assistantMessage: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontStyle: "italic",
  },
  quickPromptsContainer: {
    marginTop: Spacing.lg,
  },
  quickPromptsTitle: {
    marginBottom: Spacing.sm,
  },
  quickPromptsGrid: {
    gap: Spacing.sm,
  },
  quickPromptButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickPromptText: {
    fontSize: 14,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : Spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subscriptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  subscriptionText: {
    fontWeight: "500",
  },
});
