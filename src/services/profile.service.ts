// Service layer để xử lý các operations liên quan đến user profile
import { supabase } from '../config/supabase';
import type { UserProfile } from '../types/auth.types';

class ProfileService {
  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[ProfileService] Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[ProfileService] Unexpected error:', err);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('[ProfileService] Error updating profile:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Unexpected error:', err);
      return false;
    }
  }
}

export const profileService = new ProfileService();
