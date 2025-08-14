import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { FieldValue } from "firebase-admin/firestore";
import { validateReceipt } from "./receiptValidation";

const db = admin.firestore();

interface ValidatePurchaseRequest {
  transactionId: string;
  productId: string;
  receipt?: string; // Receipt data for validation
  platform: "ios" | "android";
  // Additional data for Google Play
  packageName?: string;
  purchaseToken?: string;
}

interface ValidatePurchaseResponse {
  success: boolean;
  creditsAwarded: number;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Validates a purchase and awards credits
 * This provides a server-side validation mechanism for purchases
 * Call this from the client after a successful purchase to ensure credits are awarded
 */
export const validatePurchase = onCall<
  ValidatePurchaseRequest,
  Promise<ValidatePurchaseResponse>
>(
  {
    region: "us-central1",
    enforceAppCheck: false, // Disabled - authentication provides sufficient security
  },
  async (request) => {
    try {
      const { data, auth, app } = request;

      // Debug logging for App Check
      logger.info("Function called with verification status", {
        hasAuth: !!auth?.uid,
        hasApp: !!app,
        authUid: auth?.uid,
        appVerified: app ? "present" : "missing",
      });

      // Ensure user is authenticated
      if (!auth?.uid) {
        logger.warn("Unauthenticated purchase validation attempt", {
          transactionId: data.transactionId,
        });
        throw new Error("Authentication required");
      }

      const userId = auth.uid;
      const {
        transactionId,
        productId,
        platform,
        receipt,
        packageName,
        purchaseToken,
      } = data;

      logger.info("Validating purchase", {
        userId,
        transactionId,
        productId,
        platform,
        hasReceipt: !!receipt,
      });

      // Validate required fields
      if (!transactionId || !productId || !platform) {
        throw new Error(
          "Missing required fields: transactionId, productId, or platform"
        );
      }

      // Validate receipt if provided
      if (receipt) {
        logger.info("Performing receipt validation", { platform, productId });

        const receiptValidation = await validateReceipt(platform, receipt, {
          packageName,
          productId,
          purchaseToken,
        });

        if (!receiptValidation.valid) {
          logger.error("Receipt validation failed", {
            error: receiptValidation.error,
            platform,
            productId,
          });
          throw new Error(
            `Receipt validation failed: ${receiptValidation.error}`
          );
        }

        // Verify transaction IDs match if available
        if (
          receiptValidation.transactionId &&
          receiptValidation.transactionId !== transactionId
        ) {
          logger.warn("Transaction ID mismatch", {
            provided: transactionId,
            validated: receiptValidation.transactionId,
          });
          // Use the validated transaction ID
          data.transactionId = receiptValidation.transactionId;
        }

        // Verify product IDs match
        if (
          receiptValidation.productId &&
          receiptValidation.productId !== productId
        ) {
          logger.error("Product ID mismatch", {
            provided: productId,
            validated: receiptValidation.productId,
          });
          throw new Error("Product ID mismatch with receipt");
        }

        logger.info("Receipt validation successful", {
          transactionId: receiptValidation.transactionId,
          productId: receiptValidation.productId,
        });
      } else {
        logger.warn("No receipt provided for validation", {
          platform,
          productId,
        });
      }

      // Credit amounts mapping
      const CREDIT_AMOUNTS: Record<string, number> = {
        // Credit packs (consumable)
        "10_credit_pack": 10,
        "25_credit_pack": 25,
        "50_credit_pack": 50,
        "100_credit_pack": 100,
        // Subscriptions
        subscription_monthly_basic: 30,
        subscription_monthly_pro: 100,
        subscription_annual_basic: 360,
        subscription_annual_pro: 1200,
      };

      const credits = CREDIT_AMOUNTS[productId];
      if (!credits) {
        throw new Error(`Unknown product ID: ${productId}`);
      }

      const isSubscription = productId.includes("subscription");

      // Use a transaction to ensure atomicity
      const result = await db.runTransaction(async (transaction) => {
        // Check if transaction was already processed
        const existingTransactionQuery = await db
          .collection("creditTransactions")
          .where("purchaseId", "==", transactionId)
          .where("userId", "==", userId)
          .get();

        if (!existingTransactionQuery.empty) {
          logger.info("Purchase already processed", {
            userId,
            transactionId,
            productId,
          });
          return {
            success: true,
            creditsAwarded: credits,
            alreadyProcessed: true,
          };
        }

        // Get or create user credits document
        const creditsRef = db.collection("userCredits").doc(userId);
        const creditsDoc = await transaction.get(creditsRef);

        if (!creditsDoc.exists) {
          // Initialize user credits
          transaction.set(creditsRef, {
            userId,
            balance: 0,
            lifetimeUsed: 0,
            subscriptionActive: false,
            freeCreditsGranted: false,
            lastUpdated: FieldValue.serverTimestamp(),
          });
        }

        // Update credits and subscription status
        const updateData: any = {
          balance: FieldValue.increment(credits),
          lastUpdated: FieldValue.serverTimestamp(),
        };

        if (isSubscription) {
          updateData.subscriptionActive = true;
          updateData.subscriptionId = productId;
          // Note: expiration date should come from RevenueCat webhook for accuracy
        }

        transaction.update(creditsRef, updateData);

        // Record the credit transaction
        const transactionRef = db.collection("creditTransactions").doc();
        transaction.set(transactionRef, {
          userId,
          amount: credits,
          type: isSubscription ? "subscription" : "purchase",
          description: isSubscription
            ? `Subscription activated: ${credits} credits`
            : `Purchased ${credits} credits`,
          createdAt: FieldValue.serverTimestamp(),
          purchaseId: transactionId,
          metadata: {
            productId,
            platform,
            validatedAt: FieldValue.serverTimestamp(),
          },
        });

        // Record the purchase history
        const purchaseRef = db.collection("purchaseHistory").doc();
        transaction.set(purchaseRef, {
          userId,
          productId,
          purchaseDate: FieldValue.serverTimestamp(),
          credits,
          platform,
          transactionId,
          status: "completed",
          metadata: {
            validatedAt: FieldValue.serverTimestamp(),
          },
        });

        return {
          success: true,
          creditsAwarded: credits,
          alreadyProcessed: false,
        };
      });

      logger.info("Purchase validation completed", {
        userId,
        transactionId,
        productId,
        creditsAwarded: result.creditsAwarded,
        alreadyProcessed: result.alreadyProcessed,
      });

      return result;
    } catch (error) {
      logger.error("Error validating purchase", {
        error: error instanceof Error ? error.message : String(error),
        userId: request.auth?.uid,
        transactionId: request.data.transactionId,
        productId: request.data.productId,
      });

      return {
        success: false,
        creditsAwarded: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
