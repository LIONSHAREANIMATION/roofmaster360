import React, { useState } from "react";
import { View, FlatList, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { apiRequest } from "@/lib/query-client";

interface Contractor {
  name: string;
  phone?: string;
  email?: string;
}

interface Permit {
  id: string;
  address: string;
  permitType: string;
  status: "approved" | "pending" | "expired";
  issueDate: string;
  expiryDate?: string;
  contractor?: Contractor;
  value?: number;
  description?: string;
}

export default function PermitsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [permits, setPermits] = useState<Permit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await apiRequest("POST", "/api/permits", { address: searchQuery.trim() });
      const data = await response.json();

      if (data.success) {
        setPermits(data.permits || []);
        setApiConfigured(data.configured !== false);
      } else {
        setSearchError(data.error || "Failed to search permits");
        setPermits([]);
      }
    } catch (error) {
      console.error("Permit search error:", error);
      setSearchError("Failed to search permits. Please try again.");
      setPermits([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: Permit["status"]) => {
    switch (status) {
      case "approved":
        return Colors.light.success;
      case "pending":
        return Colors.light.accent;
      case "expired":
        return "#DC3545";
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: Permit["status"]) => {
    switch (status) {
      case "approved":
        return "Active";
      case "pending":
        return "Pending";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="file-text" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        {hasSearched ? "No Permits Found" : "Search Permit History"}
      </ThemedText>
      <ThemedText type="secondary" style={styles.emptyDescription}>
        {hasSearched 
          ? apiConfigured 
            ? "No roofing permits found for this address"
            : "Permit lookup is not configured. Contact support to enable this feature."
          : "Enter a property address to look up roofing permit history"
        }
      </ThemedText>
    </View>
  );

  const renderPermit = ({ item }: { item: Permit }) => (
    <Card style={styles.permitCard}>
      <View style={styles.permitHeader}>
        <View style={styles.permitInfo}>
          <ThemedText type="body" style={styles.permitAddress}>
            {item.address}
          </ThemedText>
          <ThemedText type="secondary">{item.permitType}</ThemedText>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <ThemedText
            type="small"
            style={{ color: getStatusColor(item.status), fontWeight: "600" }}
          >
            {getStatusLabel(item.status)}
          </ThemedText>
        </View>
      </View>

      {item.description ? (
        <ThemedText type="secondary" style={styles.description}>
          {item.description}
        </ThemedText>
      ) : null}

      <View style={styles.permitDates}>
        <View style={styles.dateItem}>
          <ThemedText type="secondary" style={styles.dateLabel}>
            Issued
          </ThemedText>
          <ThemedText type="small">{formatDate(item.issueDate)}</ThemedText>
        </View>
        {item.expiryDate ? (
          <View style={styles.dateItem}>
            <ThemedText type="secondary" style={styles.dateLabel}>
              Expires
            </ThemedText>
            <ThemedText type="small">{formatDate(item.expiryDate)}</ThemedText>
          </View>
        ) : null}
        {item.value ? (
          <View style={styles.dateItem}>
            <ThemedText type="secondary" style={styles.dateLabel}>
              Value
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.accent }}>
              {formatCurrency(item.value)}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {item.contractor ? (
        <View style={[styles.contractorSection, { borderTopColor: theme.divider }]}>
          <ThemedText type="secondary" style={styles.contractorLabel}>
            Contractor
          </ThemedText>
          <ThemedText type="body" style={styles.contractorName}>
            {item.contractor.name}
          </ThemedText>
          {item.contractor.phone ? (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.contractor.phone}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
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
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={permits}
        keyExtractor={(item) => item.id}
        renderItem={renderPermit}
        ListHeaderComponent={
          <View style={styles.searchSection}>
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
                placeholder="Enter property address..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => {
                  setSearchQuery("");
                  setPermits([]);
                  setHasSearched(false);
                  setSearchError(null);
                }}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={({ pressed }) => [
                styles.searchButton,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed || isSearching || !searchQuery.trim() ? 0.7 : 1,
                },
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="search" size={18} color="#FFFFFF" />
                  <ThemedText type="body" style={styles.searchButtonText}>
                    Search Permits
                  </ThemedText>
                </>
              )}
            </Pressable>

            {searchError ? (
              <View style={[styles.errorCard, { backgroundColor: "#DC354520" }]}>
                <Feather name="alert-circle" size={16} color="#DC3545" />
                <ThemedText type="secondary" style={[styles.errorText, { color: "#DC3545" }]}>
                  {searchError}
                </ThemedText>
              </View>
            ) : null}

            {permits.length > 0 ? (
              <View style={styles.resultsHeader}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {permits.length} Permit{permits.length !== 1 ? "s" : ""} Found
                </ThemedText>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={!isSearching ? renderEmptyState : null}
      />
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
  searchSection: {
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: Spacing.inputHeight,
    fontSize: 16,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
  },
  resultsHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  permitCard: {
    marginBottom: Spacing.md,
  },
  permitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  permitInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  permitAddress: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  permitDates: {
    flexDirection: "row",
    gap: Spacing["2xl"],
  },
  dateItem: {
    gap: Spacing.xs,
  },
  dateLabel: {
    fontSize: 12,
  },
  contractorSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  contractorLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  contractorName: {
    fontWeight: "600",
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
});
