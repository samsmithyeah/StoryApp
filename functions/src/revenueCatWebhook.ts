import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import * as crypto from "crypto";

// Define the secret parameter
const revenueCatAuthToken = defineSecret("REVENUECAT_AUTH_TOKEN");

const db = admin.firestore();

// RevenueCat webhook event types
interface RevenueCatEvent {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    price: number;
    currency: string;
    is_family_share: boolean;
    country_code: string;
    app_id: string;
    store: string;
    transaction_id: string;
    original_transaction_id: string;
    takehome_percentage?: number;
    offer_code?: string;
    tax_percentage?: number;
    commission_percentage?: number;
  };
}

// Credit amounts for each product
const CREDIT_AMOUNTS: Record<string, number> = {
  // Credit packs
  credits_10: 10,
  credits_25: 25,
  credits_50: 50,
  credits_100: 100,

  // Subscriptions
  subscription_monthly_basic: 30,
  subscription_monthly_pro: 100,
  subscription_annual_basic: 360,
  subscription_annual_pro: 1200,
};

/**
 * RevenueCat webhook handler for secure purchase processing
 * This function processes purchase events from RevenueCat webhooks
 * and awards credits server-side for security
 */
export const revenueCatWebhook = onRequest(
  {
    cors: false, // Disable CORS for webhook
    region: "us-central1",
    // Add rate limiting and timeout protection
    concurrency: 10, // Limit concurrent executions
    timeoutSeconds: 60, // 1 minute timeout
    secrets: [revenueCatAuthToken], // Include the secret
  },
  async (request, response) => {
    try {
      // Verify this is a POST request
      if (request.method !== "POST") {
        logger.warn("RevenueCat webhook called with non-POST method", {
          method: request.method,
        });
        response.status(405).json({ error: "Method not allowed" });
        return;
      }

      // Verify authorization header for security
      const authHeader = request.headers["authorization"] as string;

      // TEMPORARY: Log for debugging
      logger.info("Webhook request received", {
        hasAuthHeader: !!authHeader,
        authHeaderStart: authHeader
          ? authHeader.substring(0, 10) + "..."
          : "none",
        method: request.method,
        contentType: request.headers["content-type"],
      });

      if (!verifyWebhookAuth(authHeader)) {
        logger.warn("Invalid webhook authorization", {
          hasAuthHeader: !!authHeader,
          hasAuthToken: !!revenueCatAuthToken.value(),
        });
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Validate request body exists and is valid JSON
      if (!request.body || typeof request.body !== "object") {
        logger.warn("Invalid or missing request body");
        response.status(400).json({ error: "Invalid request body" });
        return;
      }

      const eventData: RevenueCatEvent = request.body;

      logger.info("Received RevenueCat webhook", {
        eventType: eventData.event.type,
        userId: eventData.event.app_user_id,
        productId: eventData.event.product_id,
        transactionId: eventData.event.transaction_id,
      });

      const { event } = eventData;
      const userId = event.app_user_id || event.original_app_user_id;

      if (!userId) {
        logger.error("No user ID in webhook event");
        response.status(400).json({ error: "No user ID provided" });
        return;
      }

      // Process different event types
      switch (event.type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
          await handlePurchaseEvent(event, userId);
          break;

        case "CANCELLATION":
        case "EXPIRATION":
          await handleCancellationEvent(event, userId);
          break;

        case "PRODUCT_CHANGE":
          await handleProductChange(event, userId);
          break;

        default:
          logger.info("Unhandled webhook event type", { type: event.type });
      }

      response.status(200).json({ success: true });
    } catch (error) {
      logger.error("Error processing RevenueCat webhook", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

async function handlePurchaseEvent(
  event: RevenueCatEvent["event"],
  userId: string
) {
  const credits = CREDIT_AMOUNTS[event.product_id];

  if (!credits) {
    logger.warn("Unknown product ID in purchase event", {
      productId: event.product_id,
      userId,
    });
    return;
  }

  const isSubscription = event.product_id.includes("subscription");

  try {
    await db.runTransaction(async (transaction) => {
      const creditsRef = db.collection("userCredits").doc(userId);
      const creditsDoc = await transaction.get(creditsRef);

      // Initialize user credits if they don't exist
      if (!creditsDoc.exists) {
        transaction.set(creditsRef, {
          userId,
          balance: 0,
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: false,
          lastUpdated: FieldValue.serverTimestamp(),
        });
      }

      // Check if we've already processed this transaction
      const transactionQuery = db
        .collection("creditTransactions")
        .where("purchaseId", "==", event.transaction_id);

      const existingTransactions = await transactionQuery.get();

      if (!existingTransactions.empty) {
        logger.info("Transaction already processed", {
          transactionId: event.transaction_id,
          userId,
        });
        return;
      }

      // Update credits
      transaction.update(creditsRef, {
        balance: FieldValue.increment(credits),
        lastUpdated: FieldValue.serverTimestamp(),
        ...(isSubscription && {
          subscriptionActive: true,
          subscriptionId: event.product_id,
          subscriptionRenewsAt: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null,
        }),
      });

      // Record the transaction
      const transactionRef = db.collection("creditTransactions").doc();
      transaction.set(transactionRef, {
        userId,
        amount: credits,
        type: isSubscription ? "subscription" : "purchase",
        description: isSubscription
          ? `Subscription ${event.type.toLowerCase()}: ${credits} credits`
          : `Purchased ${credits} credits`,
        createdAt: FieldValue.serverTimestamp(),
        purchaseId: event.transaction_id,
        metadata: {
          productId: event.product_id,
          ...(event.price !== undefined && { price: event.price }),
          ...(event.currency && { currency: event.currency }),
          ...(event.store && { store: event.store }),
          eventType: event.type,
        },
      });

      // Record the purchase
      const purchaseRef = db.collection("purchaseHistory").doc();
      transaction.set(purchaseRef, {
        userId,
        productId: event.product_id,
        purchaseDate: new Date(event.purchased_at_ms),
        amount: event.price,
        credits,
        platform: event.store === "app_store" ? "ios" : "android",
        transactionId: event.transaction_id,
        status: "completed",
        metadata: {
          ...(event.currency && { currency: event.currency }),
          ...(event.country_code && { countryCode: event.country_code }),
          eventType: event.type,
        },
      });
    });

    logger.info("Successfully processed purchase", {
      userId,
      productId: event.product_id,
      credits,
      transactionId: event.transaction_id,
      type: event.type,
    });
  } catch (error) {
    logger.error("Error processing purchase event", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      productId: event.product_id,
      transactionId: event.transaction_id,
    });
    throw error;
  }
}

async function handleCancellationEvent(
  event: RevenueCatEvent["event"],
  userId: string
) {
  try {
    const creditsRef = db.collection("userCredits").doc(userId);

    await creditsRef.update({
      subscriptionActive: false,
      subscriptionId: FieldValue.delete(),
      subscriptionRenewsAt: FieldValue.delete(),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    // Record the cancellation transaction
    await db.collection("creditTransactions").add({
      userId,
      amount: 0,
      type: "subscription",
      description: `Subscription ${event.type.toLowerCase()}: ${event.product_id}`,
      createdAt: FieldValue.serverTimestamp(),
      purchaseId: event.transaction_id,
      metadata: {
        productId: event.product_id,
        eventType: event.type,
        ...(event.store && { store: event.store }),
      },
    });

    logger.info("Successfully processed cancellation", {
      userId,
      productId: event.product_id,
      transactionId: event.transaction_id,
      type: event.type,
    });
  } catch (error) {
    logger.error("Error processing cancellation event", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      productId: event.product_id,
      transactionId: event.transaction_id,
    });
    throw error;
  }
}

async function handleProductChange(
  event: RevenueCatEvent["event"],
  userId: string
) {
  // Handle subscription plan changes
  logger.info("Processing product change", {
    userId,
    productId: event.product_id,
    transactionId: event.transaction_id,
  });

  // For now, treat as a new purchase - could be enhanced to handle downgrades/upgrades
  await handlePurchaseEvent(event, userId);
}

/**
 * Verify webhook authorization header from RevenueCat
 * This ensures the request actually comes from RevenueCat
 */
function verifyWebhookAuth(authHeader: string): boolean {
  const expectedAuthToken = revenueCatAuthToken.value();

  if (!expectedAuthToken) {
    logger.warn(
      "REVENUECAT_AUTH_TOKEN secret not configured - webhook security disabled"
    );
    return true; // Allow in development, but log warning
  }

  if (!authHeader) {
    logger.warn("No authorization header provided");
    return false;
  }

  try {
    // RevenueCat sends authorization header in format: "Bearer <token>" or just "<token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(token, "utf8"),
      Buffer.from(expectedAuthToken, "utf8")
    );
  } catch (error) {
    logger.error("Error verifying webhook authorization", {
      error: error instanceof Error ? error.message : String(error),
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
    });
    return false;
  }
}
