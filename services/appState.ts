import auth from '@react-native-firebase/auth';
import { doc, updateDoc } from '@react-native-firebase/firestore';
import { AppState } from 'react-native';
import { db } from './firebase/config';

/**
 * Service to track and update user's app state in Firestore
 * This helps determine when to send push notifications
 */
export class AppStateService {
  private static appStateSubscription: any = null;
  private static currentState: string = AppState.currentState;

  /**
   * Start tracking app state changes and update Firestore
   */
  static async startTracking(): Promise<void> {
    const user = auth().currentUser;
    if (!user) return;

    // Update initial state
    await this.updateAppState(AppState.currentState);

    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (this.currentState !== nextAppState) {
        this.currentState = nextAppState;
        await this.updateAppState(nextAppState);
      }
    });

    console.log('AppState tracking started');
  }

  /**
   * Stop tracking app state changes
   */
  static stopTracking(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
      console.log('AppState tracking stopped');
    }
  }

  /**
   * Update user's app state in Firestore
   */
  private static async updateAppState(state: string): Promise<void> {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        appState: state,
        lastStateUpdate: new Date().toISOString(),
        lastActive: state === 'active' ? new Date().toISOString() : undefined,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
      );

      await updateDoc(userRef, updateData);
      console.log(`App state updated to: ${state}`);
    } catch (error) {
      console.error('Failed to update app state:', error);
    }
  }

  /**
   * Manually update that user is active (call this from key app interactions)
   */
  static async updateLastActive(): Promise<void> {
    const user = auth().currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastActive: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update last active:', error);
    }
  }
}