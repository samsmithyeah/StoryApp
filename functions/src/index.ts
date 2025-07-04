import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Define secret parameter
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// Set global options
setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Initialize OpenAI client lazily
const getOpenAIClient = () => {
  const apiKey = openaiApiKey.value();
  if (!apiKey) {
    throw new HttpsError('internal', 'OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.status === 429) {
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff
        console.log(`Rate limited. Retrying after ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If not a rate limit error, throw immediately
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Background image generation function
async function generateImagesInBackground(
  storyId: string,
  storyContent: any,
  storyPages: StoryPage[],
  config: StoryGenerationRequest,
  averageAge: number,
  openai: OpenAI
): Promise<void> {
  const storyRef = admin.firestore().collection('stories').doc(storyId);
  let imagesGenerated = 0;
  
  try {
    // Update status to generating
    await storyRef.update({
      imageGenerationStatus: 'generating',
    });
    
    // Generate cover image first
    const coverPrompt = `A gentle, dreamy book cover illustration for a children's bedtime story titled "${storyContent.title}". Style: ${config.illustrationStyle}, soft colors, magical atmosphere, perfect for children aged ${averageAge}.`;
    
    const coverImageResponse = await retryWithBackoff(() =>
      openai.images.generate({
        model: 'dall-e-3',
        prompt: coverPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      })
    );
    
    const coverImageUrl = coverImageResponse.data?.[0]?.url || '';
    
    // Update cover image immediately
    if (coverImageUrl) {
      imagesGenerated++;
      await storyRef.update({
        coverImageUrl,
        imagesGenerated,
      });
    }
    
    // Generate page images one by one
    for (let i = 0; i < storyContent.pages.length; i++) {
      const page = storyContent.pages[i];
      
      if (page.imagePrompt) {
        // Add delay between requests to avoid rate limits
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between requests
        }
        
        const enhancedPrompt = `${page.imagePrompt}. Style: ${config.illustrationStyle}, gentle colors, child-friendly, perfect for a bedtime story.`;
        
        try {
          const imageResponse = await retryWithBackoff(() =>
            openai.images.generate({
              model: 'dall-e-3',
              prompt: enhancedPrompt,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
            })
          );
          
          const imageUrl = imageResponse.data?.[0]?.url || '';
          
          if (imageUrl) {
            // Update the specific page with the image
            storyPages[i].imageUrl = imageUrl;
            imagesGenerated++;
            
            // Update Firestore with the new image
            await storyRef.update({
              [`storyContent.${i}.imageUrl`]: imageUrl,
              imagesGenerated,
            });
          }
        } catch (error) {
          console.error(`Failed to generate image for page ${i + 1}:`, error);
          // Continue with other pages even if one fails
        }
      }
    }
    
    // Update final status
    await storyRef.update({
      imageGenerationStatus: 'completed',
      storyContent: storyPages, // Update all pages at once to ensure consistency
    });
    
  } catch (error) {
    console.error('Error in background image generation:', error);
    throw error; // This will be caught by the .catch() in the main function
  }
}

interface StoryGenerationRequest {
  selectedChildren: string[];
  childrenAsCharacters: boolean;
  theme: string;
  length: 'short' | 'medium' | 'long';
  illustrationStyle: string;
  enableIllustrations: boolean;
}

interface StoryPage {
  page: number;
  text: string;
  imageUrl: string;
}

interface GeneratedStory {
  title: string;
  pages: StoryPage[];
  coverImageUrl: string;
}

export const generateStory = onCall(
  { 
    secrets: [openaiApiKey],
    timeoutSeconds: 540, // 9 minutes timeout
    memory: '1GiB'
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data as StoryGenerationRequest;

  try {
    const userId = request.auth.uid;
    
    // Get user and children data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      throw new HttpsError('not-found', 'User not found');
    }

    const children = userData.children || [];
    const selectedChildrenData = children.filter((child: any) => 
      data.selectedChildren.includes(child.id)
    );

    if (selectedChildrenData.length === 0 && data.selectedChildren.length > 0) {
      throw new HttpsError('invalid-argument', 'Selected children not found');
    }

    // Calculate story parameters
    const pageCount = data.length === 'short' ? 4 : data.length === 'medium' ? 6 : 8;
    const childNames = selectedChildrenData.map((child: any) => child.childName).join(' and ');
    const preferences = selectedChildrenData
      .map((child: any) => child.childPreferences)
      .filter((pref: string) => pref.trim())
      .join(', ');

    // Calculate average age for appropriate content
    const ages = selectedChildrenData.map((child: any) => {
      const today = new Date();
      const birthDate = new Date(child.dateOfBirth.seconds * 1000);
      return today.getFullYear() - birthDate.getFullYear();
    });
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length) : 5;

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Generate story with OpenAI
    const systemPrompt = `You are a creative children's story writer specializing in personalized bedtime stories. Create engaging, age-appropriate stories that are magical, gentle, and educational.`;

    const userPrompt = `Create a personalized bedtime story with the following details:
${data.childrenAsCharacters && childNames ? `- Main character(s): ${childNames}` : '- Generic child character'}
- Age level: ${averageAge} years old
- Theme: ${data.theme}
- Story length: ${pageCount} pages
${preferences ? `- Child interests: ${preferences}` : ''}

Requirements:
1. The story should be divided into exactly ${pageCount} pages
2. Each page should be 2-3 sentences suitable for a ${averageAge}-year-old
3. ${data.childrenAsCharacters && childNames ? `Include ${childNames} as the main character(s)` : 'Use a generic child character'}
4. Make it gentle and perfect for bedtime
5. End with a peaceful, sleep-inducing conclusion
6. ${data.enableIllustrations ? 'For each page, include an image prompt description' : 'No image prompts needed'}

Return the story in this JSON format:
{
  "title": "Story Title",
  "pages": [
    {
      "page": 1,
      "text": "Page text here",
      ${data.enableIllustrations ? '"imagePrompt": "A gentle, child-friendly illustration of [scene description]"' : ''}
    }
  ]
}`;

    const chatResponse = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' },
      })
    );

    const storyContent = JSON.parse(chatResponse.choices[0].message.content || '{}');

    // Create story pages with placeholder images
    const storyPages: StoryPage[] = [];
    for (const page of storyContent.pages) {
      storyPages.push({
        page: page.page,
        text: page.text,
        imageUrl: '', // Empty for now, will be filled by background task
      });
    }

    // Save story to Firestore immediately with text only
    const storyData = {
      userId,
      title: storyContent.title,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      storyContent: storyPages,
      coverImageUrl: '', // Empty for now
      storyConfiguration: data,
      imageGenerationStatus: data.enableIllustrations ? 'pending' : 'not_requested',
      imagesGenerated: 0,
      totalImages: data.enableIllustrations ? storyPages.length + 1 : 0, // +1 for cover
    };

    const storyRef = await admin.firestore().collection('stories').add(storyData);

    // Start image generation in background if enabled
    if (data.enableIllustrations) {
      // Don't await this - let it run in background
      generateImagesInBackground(
        storyRef.id,
        storyContent,
        storyPages,
        data,
        averageAge,
        openai
      ).catch(error => {
        console.error(`Background image generation failed for story ${storyRef.id}:`, error);
        // Update status to failed
        storyRef.update({
          imageGenerationStatus: 'failed',
          imageGenerationError: error.message || 'Unknown error',
        });
      });
    }

    const result: GeneratedStory = {
      title: storyContent.title,
      pages: storyPages,
      coverImageUrl: '',
    };

    return {
      success: true,
      storyId: storyRef.id,
      story: result,
      imageGenerationStatus: data.enableIllustrations ? 'pending' : 'not_requested',
    };

  } catch (error: any) {
    console.error('Error generating story:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('timeout') || error.message?.includes('DEADLINE')) {
      throw new HttpsError('deadline-exceeded', 'Story generation took too long. Please try again with fewer pages or simpler settings.');
    }
    
    if (error.message?.includes('API key')) {
      throw new HttpsError('failed-precondition', 'OpenAI API key configuration error');
    }
    
    if (error.code === 'resource-exhausted') {
      throw new HttpsError('resource-exhausted', 'AI service is temporarily unavailable. Please try again later.');
    }
    
    throw new HttpsError('internal', `Failed to generate story: ${error.message || 'Unknown error'}`);
  }
});

export const generateThemeSuggestions = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    console.log('Function called with auth:', !!request.auth, 'uid:', request.auth?.uid);
    
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { preferences } = request.data;
    
    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      throw new HttpsError('invalid-argument', 'Valid preferences array is required');
    }

    try {
      const openai = getOpenAIClient();
      
      const preferencesText = preferences.join(', ');
      const prompt = `Based on these child preferences: "${preferencesText}", suggest 4 unique and creative bedtime story themes. Each theme should be:
- Age-appropriate for children 3-10
- Calming and suitable for bedtime
- Engaging and fun
- Related to the child's interests

Return a JSON object with a "themes" array containing exactly 4 themes. Each theme should have:
- id: a simple lowercase identifier (no spaces, use hyphens)
- name: a short, catchy theme name (2-3 words max)
- description: a brief description (8-12 words)
- icon: one of these icon names only: "airplane", "sparkles", "pawprint", "moon.stars", "drop.fill", "heart.fill", "moon.fill", "bolt.fill", "leaf.fill", "car.fill", "gamecontroller.fill", "book.fill", "music.note", "paintbrush.fill", "star.fill"

Example format:
{
  "themes": [
    {
      "id": "space-adventure",
      "name": "Space Adventure",
      "description": "Journey to distant planets and meet friendly aliens",
      "icon": "moon.stars"
    }
  ]
}`;

      const response = await retryWithBackoff(() =>
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a creative children\'s story consultant. Generate age-appropriate, calming bedtime story themes based on children\'s interests.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        })
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Extract themes array
      const themes = parsedResponse.themes;
      
      // Validate the response structure
      if (!themes || !Array.isArray(themes) || themes.length !== 4) {
        throw new Error('Invalid themes format');
      }

      // Validate each theme has required fields
      for (const theme of themes) {
        if (!theme.id || !theme.name || !theme.description || !theme.icon) {
          throw new Error('Theme missing required fields');
        }
      }

      return { success: true, themes };

    } catch (error: any) {
      console.error('Error generating theme suggestions:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', `Failed to generate theme suggestions: ${error.message || 'Unknown error'}`);
    }
  }
);

export const getStories = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const userId = request.auth.uid;
    const storiesSnapshot = await admin.firestore()
      .collection('stories')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const stories = storiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, stories };
  } catch (error) {
    console.error('Error fetching stories:', error);
    throw new HttpsError('internal', 'Failed to fetch stories');
  }
});

export const getStory = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const data = request.data as { storyId: string };

  try {
    const userId = request.auth.uid;
    const storyDoc = await admin.firestore().collection('stories').doc(data.storyId).get();
    
    if (!storyDoc.exists) {
      throw new HttpsError('not-found', 'Story not found');
    }

    const storyData = storyDoc.data();
    
    if (storyData?.userId !== userId) {
      throw new HttpsError('permission-denied', 'Access denied');
    }

    return {
      success: true,
      story: {
        id: storyDoc.id,
        ...storyData,
      },
    };
  } catch (error) {
    console.error('Error fetching story:', error);
    throw new HttpsError('internal', 'Failed to fetch story');
  }
});