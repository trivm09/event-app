import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { profileService } from '../services/profile.service';
import { authService } from '../services/auth.service';
import { AuthErrorCode, type LoginCredentials, type UserProfile, type AuthContextType, type AuthResult } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (userId: string) => {
    const profile = await profileService.fetchUserProfile(userId);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('[AuthContext] Session initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      (async () => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      setIsLoading(true);

      const result = await authService.login(credentials);

      if (!result.success) {
        return result;
      }

      if (result.data?.user) {
        await loadUserProfile(result.data.user.id);
      }

      return result;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return {
        success: false,
        error: {
          message: 'Đã xảy ra lỗi không mong muốn',
          code: AuthErrorCode.UNEXPECTED_ERROR,
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    try {
      const result = await authService.logout();

      if (result.success) {
        setUser(null);
      } else {
        console.error('[AuthContext] Logout error:', result.error);
        throw new Error(result.error?.message || 'Đăng xuất thất bại');
      }
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      throw err;
    }
  }, []);

  const checkAdminStatus = useCallback((): boolean => {
    return user?.is_admin ?? false;
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
