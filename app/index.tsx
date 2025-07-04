import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  console.log('Index page - user:', user ? 'logged in' : 'logged out', 'authLoading:', authLoading, 'onboardingComplete:', hasCompletedOnboarding);

  useEffect(() => {
    console.log('Index useEffect - user changed:', user ? 'logged in' : 'logged out');
    
    // Show onboarding if user is authenticated but hasn't completed onboarding
    if (user && hasCompletedOnboarding === false) {
      setShowOnboarding(true);
    }
  }, [user, hasCompletedOnboarding]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    completeOnboarding();
  };

  if (authLoading || onboardingLoading) {
    console.log('Index - showing loading state');
    return null; // Show loading state
  }

  // Show onboarding modal if needed
  if (user && showOnboarding) {
    return (
      <WelcomeOnboarding
        visible={true}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (user) {
    console.log('Index - user authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('Index - user not authenticated, redirecting to auth/login');
    return <Redirect href="/(auth)/login" />;
  }
}