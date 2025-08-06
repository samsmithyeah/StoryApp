import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "../components/ui/IconSymbol";
import { Colors, Spacing, Typography } from "../constants/Theme";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: "Introduction",
      content:
        'DreamWeaver ("we," "our," or "us") is committed to protecting the privacy of children and their families. This Privacy Policy explains how we collect, use, and safeguard information when you use our app.',
    },
    {
      title: "Information we collect",
      content:
        "A. Personal Data You Provide:\n• Account Information: Name, email address, and password when you create an account. If you register using Google or Apple, we receive information from that service as permitted by your privacy settings.\n• Child Profile Information: Name, date of birth (month and year), interests/preferences, and physical appearance details (e.g., hair color, eye color). This information is highly sensitive and should only be provided with full consent.\n• User-Generated Content: Story prompts, themes, moods, custom character descriptions, and story concepts.\n\nB. Data Collected Automatically:\nWe do not currently collect usage data or device information automatically, but reserve the right to do so in the future to improve our service.",
    },
    {
      title: "How we use information",
      content:
        "We use collected information to:\n\n• Create and manage your account\n• Generate personalized stories and illustrations based on provided information\n• Email you regarding your account (such as verification)\n• Improve the efficiency and operation of the app\n• Monitor usage trends to enhance your experience\n• Provide customer support",
    },
    {
      title: "Data storage and security",
      content:
        "We use administrative, technical, and physical security measures to protect your personal information, including Firestore Security Rules. All data is stored securely using Firebase, a Google Cloud service.\n\nSecurity measures include:\n• Encrypted data transmission\n• Secure authentication\n• Limited access controls\n• Regular security monitoring\n\nWhile we take reasonable steps to secure your information, no security measures are perfect, and no method of data transmission can be guaranteed against interception or misuse.",
    },
    {
      title: "Children's privacy (COPPA)",
      content:
        "DreamWeaver is intended to be used by parents and legal guardians for the benefit of their children. We do not knowingly collect information from or market to children under 13.\n\nBy creating a Child Profile, you represent that you are the parent or legal guardian with authority to provide this information. Parents and guardians have the right to:\n\n• Review information provided about their child\n• Request deletion of their account and all associated data\n• Refuse further collection or use of their child's information\n• Exercise these rights through the Settings screen or by contacting us",
    },
    {
      title: "Data sharing",
      content:
        "We do not sell your personal information. We may share information in certain situations:\n\nA. By Law or to Protect Rights:\nWe may share information when necessary to respond to legal process, investigate policy violations, or protect rights, property, and safety.\n\nB. Third-Party Service Providers:\nWe share information with service providers that perform services for us:\n• Backend Hosting: Your data is stored on Google Firebase servers\n• AI Model Providers: To generate stories and illustrations, we send your prompts (including child information and custom text) to AI text generation services (such as OpenAI GPT models) and AI image generation services. These providers have their own privacy policies, and we only send the minimum information required for generation.",
    },
    {
      title: "Your rights",
      content:
        "You have the right to:\n\n• Access your data\n• Correct inaccurate information\n• Delete your account and all associated data\n• Opt-out of non-essential data collection\n• Contact us with privacy concerns",
    },
    {
      title: "Data retention",
      content:
        "We retain your data only as long as necessary to provide our services. You can delete your account at any time from the Settings screen, which will permanently remove all associated data.",
    },
    {
      title: "Changes to this policy",
      content:
        "We may update this Privacy Policy periodically. We will notify you of any material changes through the app or via email.",
    },
    {
      title: "Contact us",
      content:
        "If you have questions about this Privacy Policy or our data practices, please contact us at:\n\nsupport@dreamweaver-app.com\n\nLast updated: August 6, 2025",
    },
  ];

  return (
    <ImageBackground
      source={require("../assets/images/background-landscape.png")}
      resizeMode="cover"
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Platform.select({
                  android: StatusBar.currentHeight || 0,
                  ios: 0,
                }) || 0,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy policy</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.primary,
  },
  sectionContent: {
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    lineHeight: 24,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
});
