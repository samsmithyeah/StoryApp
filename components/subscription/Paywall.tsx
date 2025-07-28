import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/Theme';
import { revenueCatService, PACKAGE_TYPE } from '@/services/revenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

const FEATURES = [
  { icon: 'infinity', text: 'Unlimited story generation' },
  { icon: 'wand.and.stars', text: 'Priority AI processing' },
  { icon: 'photo.stack', text: 'HD illustrations for every page' },
  { icon: 'books.vertical', text: 'Access to your entire story library' },
  { icon: 'heart', text: 'Support independent development' },
];

export const Paywall: React.FC<PaywallProps> = ({ 
  visible, 
  onClose,
  onPurchaseSuccess 
}) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { checkSubscription } = useSubscriptionStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    try {
      setIsLoading(true);
      const offering = await revenueCatService.getOfferings();
      
      if (offering && offering.availablePackages) {
        setPackages(offering.availablePackages);
        // Default to annual plan
        const annualPackage = offering.availablePackages.find(
          pkg => pkg.identifier === PACKAGE_TYPE.ANNUAL
        );
        setSelectedPackage(annualPackage || offering.availablePackages[0]);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      await revenueCatService.purchasePackage(selectedPackage);
      
      // Refresh subscription status
      await checkSubscription();
      
      Alert.alert(
        'Success!',
        'Welcome to StoryApp Pro! You now have unlimited story generation.',
        [{ text: 'OK', onPress: () => {
          onPurchaseSuccess?.();
          onClose();
        }}]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      const customerInfo = await revenueCatService.restorePurchases();
      await checkSubscription();
      
      if (customerInfo.entitlements.active['pro']) {
        Alert.alert(
          'Restored!',
          'Your Pro subscription has been restored.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('No Subscription Found', 'No active subscription found to restore.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getPackagePrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackageSavings = (pkg: PurchasesPackage) => {
    if (pkg.identifier === PACKAGE_TYPE.ANNUAL) {
      const monthlyPackage = packages.find(p => p.identifier === PACKAGE_TYPE.MONTHLY);
      if (monthlyPackage) {
        const monthlyPrice = monthlyPackage.product.price;
        const annualPrice = pkg.product.price;
        const savings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);
        return `Save ${savings}%`;
      }
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Unlock Unlimited Stories</Text>
            <Text style={styles.subtitle}>
              Create magical bedtime stories whenever inspiration strikes
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <IconSymbol
                  name={feature.icon as any}
                  size={24}
                  color={Colors.primary}
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Options */}
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.packagesContainer}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const savings = getPackageSavings(pkg);
                
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    onPress={() => setSelectedPackage(pkg)}
                    style={[
                      styles.packageOption,
                      isSelected && styles.selectedPackageOption
                    ]}
                  >
                    <View style={styles.packageContent}>
                      <Text style={[styles.packageName, isSelected && styles.selectedText]}>
                        {pkg.identifier === PACKAGE_TYPE.ANNUAL ? 'Annual' : 'Monthly'}
                      </Text>
                      <Text style={[styles.packagePrice, isSelected && styles.selectedText]}>
                        {getPackagePrice(pkg)}
                      </Text>
                      {savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>{savings}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Terms */}
          <Text style={styles.terms}>
            Subscriptions automatically renew unless cancelled. You can manage your subscription in your device settings.
          </Text>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Button
            title={isPurchasing ? 'Processing...' : 'Continue with Pro'}
            onPress={handlePurchase}
            variant="primary"
            size="large"
            disabled={!selectedPackage || isPurchasing}
            style={styles.purchaseButton}
          />
          
          <View style={styles.secondaryActions}>
            <Button
              title="Restore Purchase"
              onPress={handleRestore}
              variant="secondary"
              disabled={isPurchasing}
            />
            <Button
              title="Maybe Later"
              onPress={onClose}
              variant="secondary"
              disabled={isPurchasing}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: isTablet ? Typography.fontSize.h1Tablet : Typography.fontSize.h1,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.primary,
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: isTablet ? 28 : 24,
  },
  featuresContainer: {
    marginBottom: Spacing.xxxl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  featureText: {
    fontSize: isTablet ? Typography.fontSize.medium : Typography.fontSize.medium,
    color: Colors.text,
    flex: 1,
  },
  packagesContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  packageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.md,
  },
  selectedPackageOption: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  packageContent: {
    padding: Spacing.lg,
    width: '100%',
    position: 'relative',
  },
  packageName: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  packagePrice: {
    fontSize: isTablet ? Typography.fontSize.h2 : Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  selectedText: {
    color: Colors.background,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  savingsText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  terms: {
    fontSize: Typography.fontSize.small,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  purchaseButton: {
    marginBottom: Spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  loader: {
    marginVertical: Spacing.xxxl,
  },
});