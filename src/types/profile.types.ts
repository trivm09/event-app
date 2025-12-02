import type { UserProfile } from './auth.types';

export interface ProfileResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ProfileUpdateData = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
