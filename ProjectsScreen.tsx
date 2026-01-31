import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest } from "@/lib/query-client";

interface Project {
  id: string;
  address: string;
  roofArea: number;
  estimateTotal: number;
  createdAt: string;
  status: "draft" | "completed";
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const isGuest = await AsyncStorage.getItem("roofmaster_guest_mode");
      
      if (isGuest === "true") {
        const stored = await AsyncStorage.getItem("roofmaster_projects");
        if (stored) {
          setProjects(JSON.parse(stored));
        }
      } else {
        const response = await apiRequest("GET", "/api/projects");
        const data = await response.json();
        if (data.success && data.projects) {
          const formattedProjects = data.projects.map((p: any) => ({
            id: p.id,
            address: p.address || "Unknown Address",
            roofArea: p.data?.roofArea || 0,
            estimateTotal: p.data?.estimateTotal || 0,
            createdAt: p.createdAt,
            status: p.status || "draft",
          }));
          setProjects(formattedProjects);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      const stored = await AsyncStorage.getItem("roofmaster_projects");
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const filteredProjects = projects.filter((p) =>
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="clipboard" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        No Projects Yet
      </ThemedText>
      <ThemedText type="secondary" style={styles.emptyDescription}>
        Start your first roofing estimate by tapping the button below
      </ThemedText>
    </View>
  );

  const handleProjectPress = (item: Project) => {
    // If project has no estimate, go to cost input first
    if (item.estimateTotal <= 0) {
      navigation.navigate("CostInput", { projectId: item.id });
    } else {
      navigation.navigate("EstimatePreview", { projectId: item.id });
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <Card
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
    >
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <ThemedText type="body" style={styles.projectAddress}>
            {item.address}
          </ThemedText>
          <ThemedText type="secondary">
            {item.roofArea.toLocaleString()} sq ft
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "completed"
                  ? Colors.light.success + "20"
                  : theme.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={{
              color:
                item.status === "completed"
                  ? Colors.light.success
                  : theme.textSecondary,
            }}
          >
            {item.status === "completed" ? "Completed" : "Draft"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.projectFooter}>
        <ThemedText type="h4" style={{ color: theme.accent }}>
          {formatCurrency(item.estimateTotal)}
        </ThemedText>
        <ThemedText type="secondary">{formatDate(item.createdAt)}</ThemedText>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + 80 + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        ListHeaderComponent={
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather
              name="search"
              size={20}
              color={theme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search projects..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      />
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          styles.aiFab,
          {
            backgroundColor: theme.primary,
            bottom: tabBarHeight + Spacing.xl + 70,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={() => navigation.navigate("AIAssistant")}
      >
        <Feather name="cpu" size={24} color="#FFFFFF" />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.accent,
            bottom: tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={() => navigation.navigate("NewProject")}
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: Spacing.inputHeight,
    fontSize: 16,
  },
  projectCard: {
    marginBottom: Spacing.md,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  projectInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  projectAddress: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  projectFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing["5xl"],
    paddingHorizontal: Spacing["2xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  aiFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
});
