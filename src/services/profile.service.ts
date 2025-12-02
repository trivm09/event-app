import { supabase } from '../config/supabase';
import { PROFILE_ERROR_MESSAGES, PROFILE_LOG_MESSAGES } from '../config/profile.config';
import type { UserProfile } from '../types/auth.types';
import type { ProfileResult, ProfileUpdateData } from '../types/profile.types';

export class ProfileService {
  private readonly tableName = 'users';

  private createErrorResult(message: string): ProfileResult {
    return {
      success: false,
      error: message,
    };
  }

  private createSuccessResult<T>(data: T): ProfileResult<T> {
    return {
      success: true,
      data,
    };
  }

  private logError(context: string, error: unknown): void {
    console.error(context, error);
  }

  async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        this.logError(PROFILE_LOG_MESSAGES.FETCH_ERROR, error);
        return null;
      }

      return data;
    } catch (err) {
      this.logError(PROFILE_LOG_MESSAGES.UNEXPECTED_ERROR, err);
      return null;
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<ProfileResult<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', userId);

      if (error) {
        this.logError(PROFILE_LOG_MESSAGES.UPDATE_ERROR, error);
        return this.createErrorResult(PROFILE_ERROR_MESSAGES.UPDATE_FAILED);
      }

      return this.createSuccessResult(true);
    } catch (err) {
      this.logError(PROFILE_LOG_MESSAGES.UNEXPECTED_ERROR, err);
      return this.createErrorResult(PROFILE_ERROR_MESSAGES.UNEXPECTED_ERROR);
    }
  }

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        this.logError(PROFILE_LOG_MESSAGES.FETCH_ERROR, error);
        return null;
      }

      return data;
    } catch (err) {
      this.logError(PROFILE_LOG_MESSAGES.UNEXPECTED_ERROR, err);
      return null;
    }
  }

  async checkAdminStatus(userId: string): Promise<boolean> {
    const profile = await this.fetchUserProfile(userId);
    return profile?.is_admin ?? false;
  }
}

export const profileService = new ProfileService();
