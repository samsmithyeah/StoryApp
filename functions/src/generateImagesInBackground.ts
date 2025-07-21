import * as admin from "firebase-admin";
import { StoryGenerationRequest, StoryPage } from "./types";
import { uploadImageToStorage } from "./utils/storage";
import { retryWithBackoff } from "./utils/retry";
import { getFluxClient } from "./utils/flux";
import { getGeminiClient } from "./utils/gemini";

// Helper function to convert data URL to buffer
function dataURLToBuffer(dataURL: string): Buffer {
  const [, data] = dataURL.split(",");
  return Buffer.from(data, "base64");
}

// Helper function to extract base64 from data URL  
function extractBase64FromDataURL(dataURL: string): string {
  const [, data] = dataURL.split(",");
  return data;
}


// Background image generation function
export async function generateImagesInBackground(
  storyId: string,
  storyContent: any,
  storyPages: StoryPage[],
  config: StoryGenerationRequest,
  averageAge: number,
  _openai: any, // Kept for compatibility but not used
  userId: string
): Promise<void> {
  console.log(`[generateImagesInBackground] Starting for story ${storyId}, pages: ${storyPages.length}`);
  const storyRef = admin.firestore().collection("stories").doc(storyId);
  let imagesGenerated = 0;

  try {
    // Update status to generating
    console.log(`[generateImagesInBackground] Updating status to 'generating' for story ${storyId}`);
    await storyRef.update({
      imageGenerationStatus: "generating",
    });

    // Determine image provider (default to flux for backward compatibility)
    const imageProvider = config.imageProvider || "flux";
    console.log(`[generateImagesInBackground] Using image provider: ${imageProvider}`);

    // Initialize clients based on provider
    let fluxClient: any = null;
    let geminiClient: any = null;
    
    if (imageProvider === "flux") {
      console.log(`[generateImagesInBackground] Initializing FLUX client`);
      fluxClient = getFluxClient();
    } else if (imageProvider === "gemini") {
      console.log(`[generateImagesInBackground] Initializing Gemini client`);
      geminiClient = getGeminiClient();
    }

    // Generate page 1 image first (will be used as cover and input for other pages)
    const firstPage = storyContent.pages[0];
    if (!firstPage.imagePrompt) {
      console.error(`[generateImagesInBackground] First page missing image prompt`);
      throw new Error("First page must have an image prompt");
    }

    const firstPagePrompt = `${firstPage.imagePrompt}. Style: ${config.illustrationStyle}, gentle colors, child-friendly, perfect for a bedtime story.`;
    console.log(`[generateImagesInBackground] Generating page 1 image with prompt: ${firstPagePrompt.substring(0, 100)}...`);
    
    let firstPageImageUrl: string;
    
    if (imageProvider === "flux") {
      firstPageImageUrl = await retryWithBackoff(() =>
        fluxClient.generateImageWithPolling({
          prompt: firstPagePrompt,
          aspect_ratio: "1:1",
          output_format: "png",
          safety_tolerance: 2,
          prompt_upsampling: false,
        })
      );
    } else if (imageProvider === "gemini") {
      firstPageImageUrl = await retryWithBackoff(() =>
        geminiClient.generateImage(firstPagePrompt)
      );
    } else {
      throw new Error(`Unsupported image provider: ${imageProvider}`);
    }
    
    console.log(`[generateImagesInBackground] Page 1 image generated successfully: ${firstPageImageUrl.substring(0, 50)}...`);

    // Handle different image URL formats (data URL for Gemini, regular URL for FLUX)
    let page1Buffer: ArrayBuffer;
    
    if (firstPageImageUrl.startsWith('data:')) {
      // Gemini returns data URL
      console.log(`[generateImagesInBackground] Converting data URL to buffer for upload`);
      page1Buffer = dataURLToBuffer(firstPageImageUrl).buffer;
    } else {
      // FLUX returns regular URL
      console.log(`[generateImagesInBackground] Fetching page 1 image for upload`);
      const page1Response = await fetch(firstPageImageUrl);
      page1Buffer = await page1Response.arrayBuffer();
    }
    
    // Upload page 1 image to Firebase Storage (using the already fetched buffer)
    let page1StorageUrl = "";
    try {
      const filePath = `stories/${userId}/${storyId}/page-1.png`;
      console.log(`[generateImagesInBackground] Uploading page 1 image to Firebase Storage: ${filePath}`);
      const file = admin.storage().bucket().file(filePath);
      
      await file.save(Buffer.from(page1Buffer), {
        metadata: {
          contentType: "image/png",
        },
        public: false,
        validation: false,
      });
      
      page1StorageUrl = filePath;
      console.log(`[generateImagesInBackground] Page 1 image uploaded successfully to: ${page1StorageUrl}`);
      
      // Update page 1 image
      storyPages[0].imageUrl = page1StorageUrl;
      imagesGenerated++;

      // Also use page 1 image as cover
      console.log(`[generateImagesInBackground] Updating Firestore with page 1 image as cover`);
      await storyRef.update({
        coverImageUrl: page1StorageUrl,
        [`storyContent.0.imageUrl`]: page1StorageUrl,
        imagesGenerated,
      });
    } catch (uploadError) {
      console.error(`[generateImagesInBackground] Failed to upload page 1 image to storage:`, uploadError);
      throw uploadError;
    }

    // Generate remaining page images in series using page 1 as input
    console.log(`[generateImagesInBackground] Starting series generation for ${storyContent.pages.length - 1} remaining pages`);
    
    for (let i = 1; i < storyContent.pages.length; i++) {
      const page = storyContent.pages[i];
      
      if (page.imagePrompt) {
        const pageIndex = i;
        const pageText = page.text;
        console.log(`[generateImagesInBackground] Starting generation for page ${pageIndex + 1}`);
        
        try {
          // Add a small delay between requests to avoid overwhelming the API
          if (i > 1) {
            console.log(`[generateImagesInBackground] Adding 1s delay before page ${pageIndex + 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Construct prompt that references the input image
          const subsequentPrompt = `The caption for the input image is "${firstPage.text}". In the same style, and with totally consistent characters to the input, generate another image for this caption: "${pageText}"`;
          console.log(`[generateImagesInBackground] Page ${pageIndex + 1} prompt: ${subsequentPrompt.substring(0, 100)}...`);
          
          let tempImageUrl: string;
          
          if (imageProvider === "flux") {
            tempImageUrl = await retryWithBackoff(() =>
              fluxClient.generateImageWithPolling({
                prompt: subsequentPrompt,
                input_image: firstPageImageUrl, // Use the FLUX URL directly
                aspect_ratio: "1:1",
                output_format: "png",
                safety_tolerance: 2,
                prompt_upsampling: false,
              })
            );
          } else if (imageProvider === "gemini") {
            // For Gemini, extract base64 from the data URL
            const page1Base64 = extractBase64FromDataURL(firstPageImageUrl);
            tempImageUrl = await retryWithBackoff(() =>
              geminiClient.editImage(subsequentPrompt, page1Base64, "image/png")
            );
          } else {
            throw new Error(`Unsupported image provider: ${imageProvider}`);
          }
          
          console.log(`[generateImagesInBackground] Page ${pageIndex + 1} image generated: ${tempImageUrl.substring(0, 50)}...`);

          if (tempImageUrl) {
            try {
              // Upload to Firebase Storage
              console.log(`[generateImagesInBackground] Uploading page ${pageIndex + 1} image to Firebase Storage`);
              
              let imageUrl: string;
              
              if (tempImageUrl.startsWith('data:')) {
                // Gemini returns data URL - need to convert to buffer and upload directly
                const imageBuffer = dataURLToBuffer(tempImageUrl);
                const filePath = `stories/${userId}/${storyId}/page-${pageIndex + 1}.png`;
                const file = admin.storage().bucket().file(filePath);
                
                await file.save(imageBuffer, {
                  metadata: {
                    contentType: "image/png",
                  },
                  public: false,
                  validation: false,
                });
                
                imageUrl = filePath;
              } else {
                // FLUX returns regular URL - use existing upload function
                imageUrl = await uploadImageToStorage(
                  tempImageUrl,
                  userId,
                  storyId,
                  `page-${pageIndex + 1}`
                );
              }
              console.log(`[generateImagesInBackground] Page ${pageIndex + 1} uploaded successfully: ${imageUrl}`);

              // Update the specific page with the Firebase Storage URL
              storyPages[pageIndex].imageUrl = imageUrl;
              imagesGenerated++;
              
              // Update Firestore with the new image
              console.log(`[generateImagesInBackground] Updating Firestore for page ${pageIndex + 1}`);
              await storyRef.update({
                [`storyContent.${pageIndex}.imageUrl`]: imageUrl,
                imagesGenerated,
              });
              
              console.log(`[generateImagesInBackground] Page ${pageIndex + 1} completed successfully`);
            } catch (uploadError) {
              console.error(
                `[generateImagesInBackground] Failed to upload page ${pageIndex + 1} image to storage:`,
                uploadError
              );
              // Continue with next page instead of throwing
              continue;
            }
          } else {
            console.warn(`[generateImagesInBackground] Page ${pageIndex + 1}: No image URL returned`);
          }
        } catch (error) {
          console.error(`[generateImagesInBackground] Failed to generate image for page ${pageIndex + 1}:`, error);
          // Continue with next page instead of failing entirely
          continue;
        }
      }
    }
    // Update final status
    console.log(`[generateImagesInBackground] Series generation completed. Total images generated: ${imagesGenerated}`);
    await storyRef.update({
      imageGenerationStatus: "completed",
      storyContent: storyPages, // Update all pages at once to ensure consistency
      imagesGenerated,
    });
    
    console.log(`[generateImagesInBackground] Background image generation completed successfully for story ${storyId}`);
  } catch (error) {
    console.error(`[generateImagesInBackground] Error in background image generation for story ${storyId}:`, error);
    throw error; // This will be caught by the .catch() in the main function
  }
}