import { CustomSlider } from "@/components/ui/CustomSlider";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { InsufficientCreditsModal } from "@/components/ui/InsufficientCreditsModal";
import {
  DEFAULT_PAGE_COUNT,
  MAX_PAGE_COUNT,
  MIN_PAGE_COUNT,
} from "@/constants/Story";
import { Colors } from "@/constants/Theme";
import { useCredits } from "@/hooks/useCredits";
import { Analytics } from "@/utils/analytics";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { WizardContainer } from "../shared/WizardContainer";
import { WizardFooter } from "../shared/WizardFooter";
import { WizardStepHeader } from "../shared/WizardStepHeader";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface StoryDetailsProps {
  pageCount?: number;
  shouldRhyme?: boolean;
  onUpdate: (data: { pageCount?: number; shouldRhyme?: boolean }) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

export const StoryDetails: React.FC<StoryDetailsProps> = ({
  pageCount = DEFAULT_PAGE_COUNT,
  shouldRhyme = false,
  onUpdate,
  onNext,
  onBack,
  onCancel,
}) => {
  const { balance, hasEnoughCredits } = useCredits();
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
    useState(false);
  const analyticsTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (analyticsTimeoutRef.current) {
        clearTimeout(analyticsTimeoutRef.current);
      }
    };
  }, []);

  const handlePageCountChange = React.useCallback(
    (value: number) => {
      const newPageCount = Math.round(value);
      onUpdate({ pageCount: newPageCount });

      // Debounce analytics to prevent excessive events during slider drag
      if (analyticsTimeoutRef.current) {
        clearTimeout(analyticsTimeoutRef.current);
      }
      analyticsTimeoutRef.current = setTimeout(() => {
        Analytics.logWizardStoryLengthSelected({
          page_count: newPageCount,
          credits_required: newPageCount,
        });
      }, 300);
    },
    [onUpdate]
  );

  const handleRhymeToggle = (value: boolean) => {
    // Track rhyme preference selection
    Analytics.logWizardRhymePreferenceSelected({
      rhyme_enabled: value,
    });
    onUpdate({ shouldRhyme: value });
  };

  const handleNextClick = () => {
    if (!hasEnoughCredits(pageCount)) {
      setShowInsufficientCreditsModal(true);
    } else {
      onNext();
    }
  };

  const creditsNeeded = Math.max(0, pageCount - balance);

  return (
    <>
      <WizardContainer>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <WizardStepHeader
            title="Story details"
            subtitle={`Choose the length and style for your story • ${balance} credits available`}
            stepNumber={6}
            totalSteps={7}
            onBack={onBack}
            onCancel={onCancel}
          />
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story length</Text>
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{pageCount} pages</Text>
                <View style={styles.creditCost}>
                  <IconSymbol
                    name="sparkles"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.creditCostText}>{pageCount} credits</Text>
                </View>
              </View>
              <CustomSlider
                value={pageCount}
                onValueChange={handlePageCountChange}
                minValue={MIN_PAGE_COUNT}
                maxValue={MAX_PAGE_COUNT}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderEndLabel}>
                  {MIN_PAGE_COUNT} pages
                </Text>
                <Text style={styles.sliderEndLabel}>
                  {MAX_PAGE_COUNT} pages
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleSection}>
              <View style={styles.toggleInfo}>
                <Text style={styles.sectionTitle}>Rhyming</Text>
                <View style={styles.descriptionRow}>
                  <Text style={styles.toggleDescription}>
                    Make the story rhyme like a poem or nursery rhyme
                  </Text>
                  <Switch
                    value={shouldRhyme}
                    onValueChange={handleRhymeToggle}
                    trackColor={{
                      false: "#374151",
                      true: "rgba(212, 175, 55, 0.3)",
                    }}
                    thumbColor={
                      shouldRhyme ? Colors.primary : Colors.textSecondary
                    }
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <WizardFooter onNext={handleNextClick} />
      </WizardContainer>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        visible={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={balance}
        creditsNeeded={creditsNeeded}
        showAlternativeAction={true}
        alternativeActionText="Choose fewer pages"
      />
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 16,
  },
  sliderContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 24,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "600",
    color: Colors.primary,
  },
  creditCost: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  creditCostText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 6,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderEndLabel: {
    fontSize: isTablet ? 14 : 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  toggleSection: {
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleDescription: {
    fontSize: isTablet ? 16 : 14,
    color: Colors.textSecondary,
    flex: 1,
    paddingRight: 16,
  },
});
