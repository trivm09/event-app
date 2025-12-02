import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import {
  generateImage,
  getUserCredits,
  getUserGenerations,
  deleteGeneration as deleteGenerationService,
  cancelGeneration as cancelGenerationService,
  getGenerationById,
} from '../services/runway.service';
import type { AIGeneration, UserCredits, AspectRatio } from '../types/runway.types';

interface RunwayContextType {
  credits: UserCredits | null;
  generations: AIGeneration[];
  activeGenerations: AIGeneration[];
  isLoading: boolean;
  error: string | null;
  generateNewImage: (prompt: string, aspectRatio: AspectRatio) => Promise<void>;
  refreshCredits: () => Promise<void>;
  refreshGenerations: () => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  cancelGeneration: (id: string) => Promise<void>;
  clearError: () => void;
}

const RunwayContext = createContext<RunwayContextType | undefined>(undefined);

export function RunwayProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthContext();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [activeGenerations, setActiveGenerations] = useState<AIGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCredits = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userCredits = await getUserCredits(user.id);
      setCredits(userCredits);
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  }, [user?.id]);

  const refreshGenerations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userGenerations = await getUserGenerations(user.id, { limit: 50 });
      setGenerations(userGenerations);

      const active = userGenerations.filter(
        (gen) => gen.status === 'starting' || gen.status === 'processing'
      );
      setActiveGenerations(active);
    } catch (err) {
      console.error('Error refreshing generations:', err);
    }
  }, [user?.id]);

  const generateNewImage = useCallback(
    async (prompt: string, aspectRatio: AspectRatio) => {
      if (!user?.id) {
        setError('Bạn cần đăng nhập để tạo ảnh');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await generateImage(user.id, prompt, aspectRatio);

        if (!result.success) {
          setError(result.error?.message || 'Không thể tạo ảnh');
          return;
        }

        await refreshCredits();
        await refreshGenerations();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.id, refreshCredits, refreshGenerations]
  );

  const deleteGeneration = useCallback(
    async (id: string) => {
      if (!user?.id) return;

      try {
        const success = await deleteGenerationService(id, user.id);
        if (success) {
          await refreshGenerations();
        }
      } catch (err) {
        console.error('Error deleting generation:', err);
        setError('Không thể xóa ảnh');
      }
    },
    [user?.id, refreshGenerations]
  );

  const cancelGeneration = useCallback(
    async (id: string) => {
      try {
        const success = await cancelGenerationService(id);
        if (success) {
          await refreshGenerations();
        }
      } catch (err) {
        console.error('Error cancelling generation:', err);
        setError('Không thể hủy generation');
      }
    },
    [refreshGenerations]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCredits();
      refreshGenerations();
    }
  }, [isAuthenticated, user?.id, refreshCredits, refreshGenerations]);

  useEffect(() => {
    if (activeGenerations.length === 0) return;

    const pollInterval = setInterval(async () => {
      if (!user?.id) return;

      let hasChanges = false;

      for (const gen of activeGenerations) {
        const updated = await getGenerationById(gen.id);
        if (updated && updated.status !== gen.status) {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await refreshGenerations();
        await refreshCredits();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [activeGenerations, user?.id, refreshGenerations, refreshCredits]);

  const value: RunwayContextType = {
    credits,
    generations,
    activeGenerations,
    isLoading,
    error,
    generateNewImage,
    refreshCredits,
    refreshGenerations,
    deleteGeneration,
    cancelGeneration,
    clearError,
  };

  return <RunwayContext.Provider value={value}>{children}</RunwayContext.Provider>;
}

export function useRunwayContext() {
  const context = useContext(RunwayContext);
  if (!context) {
    throw new Error('useRunwayContext must be used within RunwayProvider');
  }
  return context;
}
