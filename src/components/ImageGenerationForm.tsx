import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { ASPECT_RATIO_OPTIONS, PROMPT_VALIDATION } from '../config/runway.config';
import { validatePrompt, sanitizePrompt } from '../utils/runway.utils';
import type { AspectRatio } from '../types/runway.types';

interface ImageGenerationFormProps {
  onSubmit: (prompt: string, aspectRatio: AspectRatio) => void;
  isLoading: boolean;
  credits: number;
}

export function ImageGenerationForm({ onSubmit, isLoading, credits }: ImageGenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setError(validation.error || 'Prompt không hợp lệ');
      return;
    }

    const selectedOption = ASPECT_RATIO_OPTIONS.find(opt => opt.value === aspectRatio);
    const cost = selectedOption?.cost || 1.0;

    if (credits !== -1 && credits < cost) {
      setError('Không đủ credits để tạo ảnh');
      return;
    }

    const sanitized = sanitizePrompt(prompt);
    onSubmit(sanitized, aspectRatio);
  };

  const selectedOption = ASPECT_RATIO_OPTIONS.find(opt => opt.value === aspectRatio);
  const cost = selectedOption?.cost || 1.0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả ảnh bạn muốn tạo
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ví dụ: A beautiful sunset over mountains with vibrant colors..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={PROMPT_VALIDATION.MAX_LENGTH}
          disabled={isLoading}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>
            {prompt.length} / {PROMPT_VALIDATION.MAX_LENGTH}
          </span>
          <span>Chi phí: {cost} credits</span>
        </div>
      </div>

      <div>
        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-2">
          Tỷ lệ khung hình
        </label>
        <select
          id="aspectRatio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        >
          {ASPECT_RATIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.cost} credits
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Wand2 className="w-5 h-5" />
        {isLoading ? 'Đang tạo ảnh...' : 'Tạo ảnh'}
      </button>
    </form>
  );
}
