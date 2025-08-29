import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useReferrals } from "../../hooks/useReferrals";
import { ReferralCodeCard } from "./ReferralCodeCard";
import { ReferralHistory } from "./ReferralHistory";

interface ReferralDashboardProps {
  showHistory?: boolean;
  maxHistoryItems?: number;
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  showHistory = true,
  maxHistoryItems = 5,
}) => {
  const { loadReferralData } = useReferrals();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#8b5cf6"]}
          tintColor="#8b5cf6"
        />
      }
    >
      <ReferralCodeCard showStats={true} />

      {showHistory && (
        <ReferralHistory maxItems={maxHistoryItems} showHeader={true} />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎁 Earn credits by inviting friends to join DreamWeaver!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
