# DreamWeaver Architecture

## Project Structure

```
StoryApp/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── library.tsx    # Story library
│   │   ├── create.tsx     # Story creation wizard
│   │   └── settings.tsx   # Child profiles & settings
│   ├── story/
│   │   └── [id].tsx       # Story viewer
│   └── _layout.tsx        # Root layout
├── components/
│   ├── auth/
│   │   ├── GoogleSignInButton.tsx
│   │   ├── AppleSignInButton.tsx
│   │   └── EmailAuthForm.tsx
│   ├── story/
│   │   ├── StoryWizard/
│   │   │   ├── ChildSelector.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   ├── CustomizationStep.tsx
│   │   │   └── GenerationLoader.tsx
│   │   ├── StoryViewer/
│   │   │   ├── PageView.tsx
│   │   │   ├── TTSControls.tsx
│   │   │   └── PageIndicator.tsx
│   │   └── StoryCard.tsx
│   ├── settings/
│   │   ├── ChildProfileCard.tsx
│   │   └── ChildProfileForm.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── firebase/
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── ai/
│   │   ├── storyGenerator.ts
│   │   ├── imageGenerator.ts
│   │   └── textToSpeech.ts
│   └── api/
│       └── client.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useChildren.ts
│   ├── useStories.ts
│   └── useTTS.ts
├── store/
│   ├── authStore.ts
│   ├── childrenStore.ts
│   └── storyStore.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   └── validation.ts
└── types/
    ├── auth.types.ts
    ├── story.types.ts
    └── child.types.ts
```

## Component Architecture

### Navigation Structure

```
Root Navigator
├── Auth Stack (if not authenticated)
│   └── Login Screen
└── Tab Navigator (if authenticated)
    ├── Library Tab
    ├── Create Tab
    └── Settings Tab
```

### State Management

Using Zustand for global state management:

- **AuthStore**: User authentication state
- **ChildrenStore**: Child profiles management
- **StoryStore**: Generated stories and active story state

### Data Flow

1. **Authentication Flow**
   - User signs in → Firebase Auth
   - Auth state updates → AuthStore
   - Navigation redirects to main app

2. **Story Generation Flow**
   - User selects children → ChildrenStore
   - Wizard collects inputs → Local component state
   - Generate story → AI Services
   - Save to Firestore → StoryStore
   - Navigate to viewer

3. **Story Viewing Flow**
   - Load story from Firestore/StoryStore
   - Initialize TTS service
   - Track reading progress → Local state
   - Update last read → Firestore

## Key Technical Decisions

### 1. Expo Router

- File-based routing for simplicity
- Built-in deep linking support
- Easy navigation management

### 2. Firebase Integration

- Real-time data synchronization
- Secure authentication
- Scalable storage solution

### 3. Component Library

- Custom UI components for consistency
- Themed components matching app persona
- Reusable across screens

### 4. TypeScript

- Type safety throughout the app
- Better developer experience
- Reduced runtime errors

### 5. AI Service Abstraction

- Service layer for AI integrations
- Easy to swap providers
- Consistent interface

## Security Architecture

### Authentication

- Firebase Auth handles secure authentication
- Session management via Firebase SDK
- Secure token storage

### Data Protection

- Firestore security rules for data access
- User data isolation
- Child data encryption considerations

### API Security

- API keys stored in environment variables
- Server-side API calls where possible
- Rate limiting implementation

## Performance Considerations

### Image Optimization

- Lazy loading for story images
- Cached images in Firebase Storage
- Progressive loading for better UX

### Data Caching

- Local story caching for offline access
- Firestore offline persistence
- Smart prefetching for library

### Bundle Size

- Code splitting with Expo Router
- Lazy loading of AI services
- Minimal initial bundle

## Testing Strategy

### Unit Tests

- Component testing with Jest
- Service layer testing
- Utility function testing

### Integration Tests

- Firebase integration tests
- AI service integration tests
- Navigation flow tests

### E2E Tests

- Complete user flows
- Story generation process
- Authentication flows

## Deployment Strategy

### Development

- Expo development builds
- Environment-specific configs
- Feature flags for gradual rollout

### Production

- EAS Build for app store builds
- Over-the-air updates for patches
- Monitoring and analytics setup

## Monitoring & Analytics

### Performance Monitoring

- Firebase Performance Monitoring
- Custom performance metrics
- User experience tracking

### Error Tracking

- Sentry integration
- Firebase Crashlytics
- Custom error boundaries

### Usage Analytics

- Anonymous usage statistics
- Feature adoption tracking
- No child-specific tracking
