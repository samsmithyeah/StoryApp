import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { GoogleAuth } from "google-auth-library";

const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";
const GOOGLE_PLAY_API_URL =
  "https://androidpublisher.googleapis.com/androidpublisher/v3";

interface AppleReceiptData {
  receipt: string;
  password?: string; // App-specific shared secret
}

interface AppleReceiptResponse {
  status: number;
  receipt?: {
    in_app: {
      product_id: string;
      transaction_id: string;
      purchase_date_ms: string;
      quantity: string;
    }[];
  };
  "is-retryable"?: boolean;
}

// This interface is used for documentation purposes

interface GooglePurchaseResponse {
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  orderId: string;
  purchaseType?: number;
  acknowledgementState?: number;
}

/**
 * Validates an Apple App Store receipt
 */
export async function validateAppleReceipt(
  receiptData: string,
  isProduction: boolean = true
): Promise<{
  valid: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
}> {
  try {
    const url = isProduction ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
    const password = process.env.APPLE_SHARED_SECRET; // Set this in Firebase config

    const requestData: AppleReceiptData = {
      receipt: receiptData,
    };

    if (password) {
      requestData.password = password;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Apple validation request failed: ${response.status}`);
    }

    const result: AppleReceiptResponse = await response.json();

    // Handle different status codes
    switch (result.status) {
      case 0:
        // Receipt is valid
        if (result.receipt?.in_app && result.receipt.in_app.length > 0) {
          const latestPurchase =
            result.receipt.in_app[result.receipt.in_app.length - 1];
          return {
            valid: true,
            transactionId: latestPurchase.transaction_id,
            productId: latestPurchase.product_id,
          };
        }
        return { valid: true };

      case 21007:
        // Receipt is from sandbox but sent to production
        if (isProduction) {
          logger.info("Receipt from sandbox, retrying with sandbox URL");
          return await validateAppleReceipt(receiptData, false);
        }
        return { valid: false, error: "Invalid receipt environment" };

      case 21008:
        // Receipt is from production but sent to sandbox
        if (!isProduction) {
          logger.info("Receipt from production, retrying with production URL");
          return await validateAppleReceipt(receiptData, true);
        }
        return { valid: false, error: "Invalid receipt environment" };

      case 21000:
        return { valid: false, error: "Malformed receipt data" };
      case 21002:
        return { valid: false, error: "Malformed receipt data" };
      case 21003:
        return { valid: false, error: "Receipt could not be authenticated" };
      case 21004:
        return { valid: false, error: "Invalid shared secret" };
      case 21005:
        return {
          valid: false,
          error: "Receipt server temporarily unavailable",
        };
      case 21006:
        return {
          valid: false,
          error: "Receipt valid but subscription has expired",
        };

      default:
        return {
          valid: false,
          error: `Unknown Apple status code: ${result.status}`,
        };
    }
  } catch (error) {
    logger.error("Apple receipt validation failed:", error);
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Validates a Google Play purchase
 */
export async function validateGooglePlayPurchase(
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<{ valid: boolean; transactionId?: string; error?: string }> {
  try {
    // Get access token for Google Play API
    const serviceAccount = admin.app().options.credential;
    if (!serviceAccount) {
      throw new Error("No service account configured");
    }

    // Create JWT for Google Play API authentication
    const jwtClient = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    const accessToken = await jwtClient.getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to get Google Play API access token");
    }

    const url = `${GOOGLE_PLAY_API_URL}/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 410) {
      return { valid: false, error: "Purchase token no longer valid" };
    }

    if (!response.ok) {
      throw new Error(
        `Google Play validation failed: ${response.status} ${response.statusText}`
      );
    }

    const purchase: GooglePurchaseResponse = await response.json();

    // Check purchase state (0 = purchased, 1 = canceled)
    if (purchase.purchaseState !== 0) {
      return { valid: false, error: "Purchase was canceled" };
    }

    // Check if purchase needs to be acknowledged
    if (purchase.acknowledgementState === 0) {
      // Purchase needs acknowledgment - acknowledge it
      const ackUrl = `${GOOGLE_PLAY_API_URL}/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}:acknowledge`;

      await fetch(ackUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      logger.info("Google Play purchase acknowledged", {
        packageName,
        productId,
        orderId: purchase.orderId,
      });
    }

    return {
      valid: true,
      transactionId: purchase.orderId,
    };
  } catch (error) {
    logger.error("Google Play validation failed:", error);
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Main receipt validation function that handles both platforms
 */
export async function validateReceipt(
  platform: "ios" | "android",
  receiptData: string,
  additionalData?: {
    packageName?: string;
    productId?: string;
    purchaseToken?: string;
  }
): Promise<{
  valid: boolean;
  transactionId?: string;
  productId?: string;
  error?: string;
}> {
  try {
    if (platform === "ios") {
      return await validateAppleReceipt(receiptData);
    } else if (platform === "android") {
      if (
        !additionalData?.packageName ||
        !additionalData?.productId ||
        !additionalData?.purchaseToken
      ) {
        return {
          valid: false,
          error: "Missing required data for Google Play validation",
        };
      }

      const result = await validateGooglePlayPurchase(
        additionalData.packageName,
        additionalData.productId,
        additionalData.purchaseToken
      );

      return {
        ...result,
        productId: additionalData.productId,
      };
    } else {
      return { valid: false, error: "Unsupported platform" };
    }
  } catch (error) {
    logger.error("Receipt validation error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}
