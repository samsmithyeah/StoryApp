# DreamWeaver - Hyper-Personalized Bedtime Story Generator

## Project Overview

DreamWeaver is a mobile application that creates magical, personalized bedtime stories for children aged 3-10. The app generates unique stories and illustrations on demand, creating a calming and engaging bedtime routine for families.

## Core Mission

To create a magical, calming, and engaging bedtime routine for families by generating unique stories and illustrations that are personalized to each child's interests and preferences.

## App Persona

- **Magical**: Enchanting experiences that spark imagination
- **Gentle**: Soft, calming interactions perfect for bedtime
- **Creative**: Unique stories every time
- **Trustworthy**: Safe, secure, and parent-friendly

## Implementation Status

| Feature                                                 | Done | Description of Implementation                                                              | Sam Approved     |
| ------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ | ---------------- |
| **AUTHENTICATION & ONBOARDING**                         |
| Google Sign-In                                          | ✅   | Firebase Authentication with @react-native-google-signin/google-signin, native integration |                  |
| Apple Sign-In                                           | ✅   | Firebase Authentication with Apple provider configured and implemented                     | ✅               |
| Email & Password                                        | ✅   | Firebase Authentication with email/password provider                                       |                  |
| Seamless onboarding flow                                | ✅   | Authentication state management with Zustand, automatic navigation                         |                  |
| Direct navigation to child profile setup on first login | ✅   | WelcomeOnboarding component with 3-step flow implemented                                   | ✅               |
| **CHILD PROFILE MANAGEMENT**                            |
| Create child profiles                                   | ✅   | ChildProfileForm component with name, DOB, preferences fields                              |                  |
| Read child profiles                                     | ✅   | ChildProfileCard component displays child info with calculated age                         |                  |
| Update child profiles                                   | ✅   | Edit functionality in ChildProfileForm                                                     |                  |
| Delete child profiles                                   | ✅   | Delete confirmation in ChildProfileCard                                                    |                  |
| Child name field                                        | ✅   | Text input with validation                                                                 |                  |
| Child age field                                         | ❌   | **ISSUE**: Implemented as date of birth, but spec requires age field                       | Happy with this! |
| Child preferences field                                 | ✅   | Free text input for interests/preferences                                                  |                  |
| **STORY GENERATION WIZARD**                             |
| **Step 1: Child Selection**                             |
| Select one or more children                             | ✅   | Multi-select interface with checkboxes                                                     |                  |
| Option to feature selected children as main characters  | ✅   | Toggle switch for childrenAsCharacters                                                     |                  |
| Alternative: Generic age-based story generation         | ❌   | No option for generic stories without selecting children                                   |                  |
| **Step 2: Theme Selection**                             |
| AI-suggested themes based on child preferences          | ✅   | OpenAI GPT-4o-mini generates 4 personalized themes based on child preferences              | ✅               |
| Custom theme input option                               | ✅   | Text input with add button for custom themes                                               |                  |
| **Step 3: Customization**                               |
| Story length (Short/Medium/Long)                        | ✅   | Three length options with page counts                                                      |                  |
| Illustration toggle and style selection                 | ✅   | Switch toggle to enable/disable illustrations with style selection                         | ✅               |
| Custom art style input                                  | ✅   | Text input for custom illustration style descriptions                                      | ✅               |
| **Step 4: Generation**                                  |
| Loading animation with calming messages                 | ✅   | Progress bar with rotating messages                                                        |                  |
| AI synthesis of all inputs                              | ✅   | Full OpenAI GPT-4o integration with personalized story generation                          |                  |
| **STORY VIEWER**                                        |
| Paginated, book-like interface                          | ✅   | Full StoryViewer component with page navigation                                            |                  |
| Swipe navigation                                        | ✅   | Horizontal ScrollView with pagingEnabled for smooth page-to-page swiping                   | ✅               |
| Integrated illustrations                                | ✅   | DALL-E 3 generated images with async loading and progress tracking                         |                  |
| TTS audio narration with text highlighting              | ❌   | Not implemented yet                                                                        |                  |
| Clean, readable typography                              | ✅   | Optimized typography for children's reading                                                |                  |
| **STORY LIBRARY**                                       |
| Grid view of saved stories                              | ✅   | Full library screen with StoryCard components                                              |                  |
| Book cover thumbnails                                   | ✅   | Generated cover images displayed in library                                                |                  |
| Quick access to previously generated stories            | ✅   | Real-time Firestore sync with instant story access                                         |                  |
| **DATA MODELS**                                         |
| Users Collection - Firebase Auth ID                     | ✅   | Using Firebase Auth UID as document ID                                                     |                  |
| Users Collection - email field                          | ✅   | Stored from Firebase Auth                                                                  |                  |
| Users Collection - createdAt timestamp                  | ❌   | Not implemented in user document                                                           |                  |
| Users Collection - children array                       | ✅   | Array of child objects in user document                                                    |                  |
| Child object - childName                                | ✅   | String field implemented                                                                   |                  |
| Child object - childAge                                 | ❌   | **ISSUE**: Using dateOfBirth instead of age number                                         | Happy with this! |
| Child object - childPreferences                         | ✅   | String field implemented                                                                   |                  |
| Stories Collection structure                            | ✅   | Full Firestore collection with real-time sync                                              |                  |
| Story - id (auto-generated)                             | ✅   | Firestore auto-generated document IDs                                                      |                  |
| Story - userId                                          | ✅   | Links stories to authenticated users                                                       |                  |
| Story - title                                           | ✅   | AI-generated titles stored and displayed                                                   |                  |
| Story - createdAt timestamp                             | ✅   | Firestore serverTimestamp for creation tracking                                            |                  |
| Story - storyContent array                              | ✅   | Array of page objects with text and images                                                 |                  |
| Story - page number                                     | ✅   | Sequential page numbering in storyContent                                                  |                  |
| Story - page text                                       | ✅   | AI-generated story text for each page                                                      |                  |
| Story - page imageUrl                                   | ✅   | DALL-E 3 generated image URLs with async loading                                           |                  |
| Story - audioUrl                                        | ❌   | Not implemented yet                                                                        |                  |
| Story - coverImageUrl                                   | ✅   | AI-generated cover images for library display                                              |                  |
| Story - storyConfiguration object                       | ✅   | Stores generation parameters for regeneration/editing                                      |                  |
| **UI/UX GUIDELINES**                                    |
| Soft, pastel palette                                    | ✅   | Using gentle colors (#6366F1, soft grays, pastels)                                         |                  |
| Highly readable, child-friendly fonts                   | ✅   | Clear typography with appropriate sizing                                                   |                  |
| Smooth, delightful micro-animations                     | ❌   | Basic animations, could be more delightful                                                 |                  |
| Clean, uncluttered interface                            | ✅   | Minimal design with good spacing                                                           |                  |
| Rounded corners throughout                              | ✅   | Consistent border-radius of 12px+ throughout                                               |                  |
| **TECHNICAL STACK**                                     |
| React Native (Expo)                                     | ✅   | Using Expo with development builds                                                         |                  |
| Firebase Authentication                                 | ✅   | Fully implemented with multiple providers                                                  |                  |
| Firestore for data storage                              | ✅   | Basic setup, children storage working                                                      |                  |
| Firebase Storage for images/audio                       | ⚠️   | Using OpenAI-hosted images, not Firebase Storage                                           |                  |
| Story Generation API                                    | ✅   | Full OpenAI GPT-4o integration with Firebase Functions                                     |                  |
| Illustration Generation API                             | ✅   | OpenAI DALL-E 3 fully integrated with async generation                                     |                  |
| Text-to-Speech API                                      | ❌   | Not implemented yet                                                                        |                  |

## Major Issues to Address

1. **Child age vs DOB**: Spec requires age field, we implemented DOB ✅ **RESOLVED** - Sam approved DOB approach
2. **Missing illustration toggle**: Should allow disabling illustrations ✅ **RESOLVED** - Toggle implemented
3. **No generic story option**: Should allow stories without selecting specific children ❌ **PENDING**
4. **Missing AI theme suggestions**: Should actually use AI to suggest themes ❌ **PENDING**
5. **No custom art style input**: Should allow custom illustration style descriptions ✅ **RESOLVED** - Custom input added
6. **Missing entire Story Viewer**: Core feature not implemented ✅ **RESOLVED** - Full viewer with swipe navigation
7. **Missing entire Story Library**: Core feature not implemented ✅ **RESOLVED** - Complete library implemented
8. **Missing Firestore story storage**: Data models not implemented ✅ **RESOLVED** - Full data models working
9. **Missing onboarding flow**: Should guide new users to add children first ✅ **RESOLVED** - 3-step onboarding flow
10. **Missing TTS audio narration**: Core accessibility feature ❌ **PENDING**
11. **Missing createdAt in user documents**: Data model incomplete ❌ **PENDING**

## Technical Stack

- **Frontend**: React Native (Expo)
- **Authentication**: Firebase Authentication
  - Google Sign-In
  - Apple Sign-In
  - Email & Password
- **Backend & Database**: Firebase
  - Firestore for data storage
  - Firebase Storage for images/audio
- **AI Services**:
  - Story Generation: OpenAI GPT-4o
  - Illustration Generation: OpenAI DALL-E 3
  - Text-to-Speech: TBD (High-quality TTS API)

## Data Models

### Users Collection

```
{
  id: firebaseAuthUserId,
  email: string,
  createdAt: timestamp,
  children: [
    {
      childName: string,
      childAge: number,
      childPreferences: string
    }
  ]
}
```

### Stories Collection

```
{
  id: auto-generated,
  userId: string,
  title: string,
  createdAt: timestamp,
  storyContent: [
    {
      page: number,
      text: string,
      imageUrl: string
    }
  ],
  audioUrl: string,
  coverImageUrl: string,
  storyConfiguration: {
    selectedChildren: array,
    theme: string,
    length: string,
    illustrationStyle: string,
    // ... other generation parameters
  }
}
```

## UI/UX Guidelines

- **Colors**: Soft, pastel palette
- **Typography**: Highly readable, child-friendly fonts
- **Interactions**: Smooth, delightful micro-animations
- **Layout**: Clean, uncluttered interface
- **Shapes**: Rounded corners throughout

## Development Phases

### Phase 1: Foundation ✅

1. Project setup and configuration ✅
2. Firebase integration ✅
3. Authentication implementation ✅

### Phase 2: Core Features (In Progress)

1. Child profile management ✅
2. Story generation wizard ⚠️ (Partially complete)
3. Basic story viewer ❌

### Phase 3: Enhanced Features

1. Illustration integration ❌
2. TTS implementation ❌
3. Story library ❌

### Phase 4: Polish & Optimization

1. UI/UX refinements ❌
2. Performance optimization ❌
3. Testing and bug fixes ❌

## Security Considerations

- Secure authentication flow ✅
- Protected child data ✅
- Safe content generation ❌
- No tracking or analytics on children ✅

## Future Enhancements

- Offline story access
- Story sharing features
- Multiple language support
- Bedtime routine tracking
- Parent dashboard with insights
