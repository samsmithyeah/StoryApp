import {
  getAnalytics,
  logEvent,
  setUserProperties,
  setUserId,
  logScreenView,
} from "@react-native-firebase/analytics";
import { logger } from "./logger";

/**
 * Analytics utility for tracking events in the app
 */
export class Analytics {
  /**
   * Log a custom event
   */
  static async logEvent(eventName: string, parameters?: Record<string, any>) {
    try {
      await logEvent(getAnalytics(), eventName, parameters);
      logger.debug(`Analytics event logged: ${eventName}`, parameters);
    } catch (error) {
      logger.error(`Failed to log analytics event: ${eventName}`, error);
    }
  }

  /**
   * Set user properties
   */
  static async setUserProperties(properties: Record<string, string>) {
    try {
      await setUserProperties(getAnalytics(), properties);
      logger.debug("Analytics user properties set", properties);
    } catch (error) {
      logger.error("Failed to set analytics user properties", error);
    }
  }

  /**
   * Set user ID
   */
  static async setUserId(userId: string) {
    try {
      await setUserId(getAnalytics(), userId);
      logger.debug(`Analytics user ID set: ${userId}`);
    } catch (error) {
      logger.error("Failed to set analytics user ID", error);
    }
  }

  /**
   * Track screen view
   */
  static async logScreenView(screenName: string, screenClass?: string) {
    try {
      await logScreenView(getAnalytics(), {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      logger.debug(`Analytics screen view logged: ${screenName}`);
    } catch (error) {
      logger.error(`Failed to log analytics screen view: ${screenName}`, error);
    }
  }

  // === WIZARD TRACKING ===
  static async logWizardStarted(parameters: {
    total_children: number;
    has_preferences: boolean;
  }) {
    await this.logEvent("story_wizard_started", parameters);
  }

  static async logWizardStepEntered(
    stepName: string,
    stepIndex: number,
    fromStep?: string,
    timeSpentMs?: number
  ) {
    await this.logEvent("wizard_step_entered", {
      step_name: stepName,
      step_index: stepIndex,
      from_step: fromStep,
      time_spent_ms: timeSpentMs,
    });
  }

  static async logWizardAbandoned(
    stepName: string,
    stepIndex: number,
    completionPercent: number
  ) {
    await this.logEvent("story_wizard_abandoned", {
      abandoned_at_step: stepName,
      step_index: stepIndex,
      completion_percentage: completionPercent,
    });
  }

  static async logWizardCompleted(parameters: {
    total_steps: number;
    completion_time_ms: number;
    final_config: Record<string, any>;
  }) {
    await this.logEvent("story_wizard_completed", parameters);
  }

  // === STORY GENERATION PERFORMANCE ===
  static async logStoryGenerationStarted(config: {
    page_count: number;
    has_illustrations: boolean;
    character_count: number;
    model_primary: string;
  }) {
    await this.logEvent("story_generation_started", {
      ...config,
      timestamp: Date.now(),
    });
  }

  static async logStoryGenerationCompleted(metrics: {
    story_id: string;
    generation_time_ms: number;
    generation_time_seconds: number;
    model_used: string;
    required_fallback: boolean;
    page_count: number;
    has_illustrations: boolean;
  }) {
    await this.logEvent("story_generation_completed", metrics);
  }

  static async logStoryGenerationFailed(failure: {
    error_type: string;
    error_message: string;
    generation_time_ms: number;
    model_attempted: string;
    used_fallback: boolean;
    story_config?: Record<string, any>;
  }) {
    await this.logEvent("story_generation_failed", failure);
  }

  static async logStoryGenerationSafetyBlocked(data: {
    model_blocked: string;
    attempting_fallback: string;
    content_type: string;
    story_config: Record<string, any>;
  }) {
    await this.logEvent("story_generation_safety_blocked", data);
  }

  // === IMAGE GENERATION & FALLBACKS ===
  static async logImageGenerationStarted(data: {
    story_id: string;
    image_type: "cover" | "page";
    page_index?: number;
    primary_model: string;
    fallback_model?: string;
    art_styles_available: number;
  }) {
    await this.logEvent("image_generation_started", data);
  }

  static async logImageGenerationSuccess(success: {
    story_id: string;
    image_type: "cover" | "page";
    page_index?: number;
    model_used: string;
    required_model_fallback: boolean;
    style_index_used: number;
    required_style_fallback: boolean;
    total_attempts: number;
    generation_time_ms: number;
  }) {
    await this.logEvent("image_generation_success", success);
  }

  static async logImageGenerationFailed(failure: {
    story_id: string;
    image_type: "cover" | "page";
    page_index?: number;
    error_type: string;
    model_attempted: string;
    total_attempts: number;
    generation_time_ms: number;
    models_tried: string[];
    art_styles_tried: number;
  }) {
    await this.logEvent("image_generation_failed", failure);
  }

  static async logImageModelFallback(data: {
    story_id: string;
    image_type: "cover" | "page";
    page_index?: number;
    primary_model: string;
    fallback_model: string;
    primary_failure_reason: string;
  }) {
    await this.logEvent("image_model_fallback_attempt", data);
  }

  static async logImageStyleFallback(data: {
    story_id: string;
    image_type: "cover" | "page";
    page_index?: number;
    model: string;
    style_fallback_index: number;
    previous_failure_reason: string;
  }) {
    await this.logEvent("image_style_fallback_attempt", data);
  }

  static async logImageRetry(retry: {
    story_id: string;
    page_index: number;
    retry_type: "manual_user_retry" | "automatic_retry";
    retry_time_ms?: number;
    models_used?: string[];
    success: boolean;
  }) {
    await this.logEvent("image_retry_attempt", retry);
  }

  // === STORY INTERACTION ===

  static async logStoryReadingAbandoned(data: {
    story_id: string;
    pages_read: number;
    abandon_point: number;
    time_spent_ms: number;
  }) {
    await this.logEvent("story_reading_abandoned", data);
  }

  // === PERFORMANCE METRICS ===
  static async logPerformanceMetric(metric: {
    operation: string;
    duration_ms: number;
    success: boolean;
    additional_data?: Record<string, any>;
  }) {
    await this.logEvent("performance_metric", metric);
  }

  // === AUTHENTICATION & ONBOARDING ===
  static async logSignInAttempt(data: {
    method: "google" | "apple" | "email";
    is_new_user?: boolean;
  }) {
    await this.logEvent("sign_in_attempt", data);
  }

  static async logSignInSuccess(data: {
    method: "google" | "apple" | "email";
    is_new_user: boolean;
    user_created_at?: string;
  }) {
    await this.logEvent("sign_in_success", data);
  }

  static async logSignInError(data: {
    method: "google" | "apple" | "email";
    error_type: string;
    error_message?: string;
  }) {
    await this.logEvent("sign_in_error", data);
  }

  static async logOnboardingStarted(data: {
    user_type: "new" | "returning";
    entry_point: string;
  }) {
    await this.logEvent("onboarding_started", data);
  }

  static async logOnboardingStepCompleted(data: {
    step_name: string;
    step_index: number;
    time_spent_ms: number;
  }) {
    await this.logEvent("onboarding_step_completed", data);
  }

  static async logOnboardingCompleted(data: {
    total_steps: number;
    completion_time_ms: number;
    skipped_steps?: string[];
  }) {
    await this.logEvent("onboarding_completed", data);
  }

  static async logOnboardingAbandoned(data: {
    abandoned_at_step: string;
    step_index: number;
    time_spent_ms: number;
  }) {
    await this.logEvent("onboarding_abandoned", data);
  }

  // === MONETIZATION & BUSINESS METRICS ===
  static async logInsufficientCredits(data: {
    required_credits: number;
    current_balance: number;
    action_attempted: string;
  }) {
    await this.logEvent("insufficient_credits_shown", data);
  }

  static async logPurchaseInitiated(data: {
    item_type: "credits" | "subscription";
    package_id: string;
    price: number;
    currency: string;
  }) {
    await this.logEvent("purchase_initiated", data);
  }

  static async logPurchaseCompleted(data: {
    item_type: "credits" | "subscription";
    package_id: string;
    price: number;
    currency: string;
    credits_granted?: number;
  }) {
    await this.logEvent("purchase_completed", data);
  }

  static async logPurchaseError(data: {
    item_type: "credits" | "subscription";
    package_id: string;
    error_type: string;
    error_message?: string;
  }) {
    await this.logEvent("purchase_error", data);
  }

  static async logCreditsScreenViewed(data: {
    current_balance: number;
    entry_point: string;
  }) {
    await this.logEvent("credits_screen_viewed", data);
  }

  // === STORY MANAGEMENT ===
  static async logStoryOpened(data: {
    story_id: string;
    story_length: "short" | "medium" | "long";
    has_illustrations: boolean;
    story_age_days: number;
  }) {
    await this.logEvent("story_opened", data);
  }

  static async logStoryDeleted(data: {
    story_id: string;
    deletion_method: "swipe" | "menu" | "bulk";
    story_age_days: number;
  }) {
    await this.logEvent("story_deleted", data);
  }

  static async logStoryShared(data: {
    story_id: string;
    share_method: "native" | "link" | "export";
  }) {
    await this.logEvent("story_shared", data);
  }

  static async logReadingSessionStarted(data: {
    story_id: string;
    total_pages: number;
  }) {
    await this.logEvent("reading_session_started", data);
  }

  static async logReadingSessionCompleted(data: {
    story_id: string;
    pages_read: number;
    total_pages: number;
    reading_time_ms: number;
  }) {
    await this.logEvent("reading_session_completed", data);
  }

  // === SAVED CHARACTERS ===
  static async logCharacterCreated(data: {
    character_type: "child" | "custom";
    creation_method: "manual" | "wizard";
  }) {
    await this.logEvent("character_created", data);
  }

  static async logCharacterUsed(data: {
    character_type: "child" | "custom";
    character_age_days: number;
    usage_context: "wizard" | "quick_story";
  }) {
    await this.logEvent("character_used", data);
  }

  static async logCharacterUpdated(data: {
    character_type: "child" | "custom";
    character_id: string;
  }) {
    await this.logEvent("character_updated", data);
  }

  // === SETTINGS & CONFIGURATION ===
  static async logSettingsScreenViewed(data: {
    screen_name: string;
    entry_point: string;
  }) {
    await this.logEvent("settings_screen_viewed", data);
  }

  static async logSettingsChanged(data: {
    setting_category: "account" | "preferences" | "privacy" | "notifications";
    setting_name: string;
    old_value?: string;
    new_value?: string;
    change_method: "toggle" | "selection" | "input";
  }) {
    await this.logEvent("settings_changed", data);
  }

  // === REFERRAL SYSTEM ===
  static async logReferralCodeEntered(data: {
    code_length: number;
    entry_method: "manual" | "paste" | "link";
    entry_point: string;
  }) {
    await this.logEvent("referral_code_entered", data);
  }

  static async logReferralCodeSuccess(data: {
    code_length: number;
    credits_earned: number;
    entry_point: string;
  }) {
    await this.logEvent("referral_code_success", data);
  }

  static async logReferralCodeError(data: {
    code_length: number;
    error_type: "invalid" | "expired" | "already_used" | "network_error";
    entry_point: string;
  }) {
    await this.logEvent("referral_code_error", data);
  }

  static async logReferralLinkShared(data: {
    share_method: "native" | "copy" | "social";
    platform?: string;
  }) {
    await this.logEvent("referral_link_shared", data);
  }

  // === WIZARD STEP DETAILS ===
  static async logWizardStepAction(data: {
    step_name: string;
    action_type: "selection" | "input" | "toggle" | "navigation";
    selection_value?: string;
    time_spent_ms: number;
  }) {
    await this.logEvent("wizard_step_action", data);
  }

  // === ERROR TRACKING ===
  static async logAppError(error: {
    error_type: string;
    error_message: string;
    component?: string;
    user_action?: string;
    additional_context?: Record<string, any>;
  }) {
    await this.logEvent("app_error", error);
  }

  // === SETTINGS & NAVIGATION ===
  static async logSettingsMenuNavigation(data: {
    menu_item: string;
    destination: string;
  }) {
    await this.logEvent("settings_menu_navigation", data);
  }

  static async logInviteFriendsScreenOpened(data: {
    entry_point: string;
    has_existing_referrals: boolean;
  }) {
    await this.logEvent("invite_friends_screen_opened", data);
  }

  static async logWizardThemeSelected(data: {
    theme_type: "preset" | "custom";
    theme_value: string;
  }) {
    await this.logEvent("wizard_theme_selected", data);
  }

  static async logWizardMoodSelected(data: {
    mood_type: "preset" | "custom";
    mood_value: string;
  }) {
    await this.logEvent("wizard_mood_selected", data);
  }

  static async logWizardStoryAboutSelected(data: {
    selection_type: "surprise" | "custom";
    has_custom_description: boolean;
    description_length: number;
  }) {
    await this.logEvent("wizard_story_about_selected", data);
  }

  static async logWizardStoryLengthSelected(data: {
    page_count: number;
    credits_required: number;
  }) {
    await this.logEvent("wizard_story_length_selected", data);
  }

  static async logWizardRhymePreferenceSelected(data: {
    rhyme_enabled: boolean;
  }) {
    await this.logEvent("wizard_rhyme_preference_selected", data);
  }

  static async logWizardIllustrationStyleSelected(data: {
    style_type: "preset" | "custom";
    style_value: string;
  }) {
    await this.logEvent("wizard_illustration_style_selected", data);
  }
}
