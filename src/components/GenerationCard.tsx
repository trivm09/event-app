import { Download, Trash2, RefreshCw, Copy } from 'lucide-react';
import { useState } from 'react';
import { formatDate, getStatusColor, getStatusText, truncateText, downloadImage, copyToClipboard } from '../utils/runway.utils';
import type { AIGeneration } from '../types/runway.types';

interface GenerationCardProps {
  generation: AIGeneration;
  onDelete?: (id: string) => void;
  onRegenerate?: (prompt: string, aspectRatio: string) => void;
}

export function GenerationCard({ generation, onDelete, onRegenerate }: GenerationCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!generation.image_url) return;

    try {
      await downloadImage(generation.image_url, `generation-${generation.id}.png`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await copyToClipboard(generation.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const statusColor = getStatusColor(generation.status);
  const statusText = getStatusText(generation.status);
  const displayPrompt = showFullPrompt ? generation.prompt : truncateText(generation.prompt, 100);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {generation.image_url && generation.status === 'succeeded' ? (
        <div className="relative aspect-video bg-gray-100">
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={generation.image_url}
            alt={generation.prompt}
            className={`w-full h-full object-cover ${isImageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            onLoad={() => setIsImageLoading(false)}
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>
            {generation.status === 'processing' && (
              <div className="mt-2 w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="mb-2">
          <p className="text-sm text-gray-700">
            {displayPrompt}
            {generation.prompt.length > 100 && (
              <button
                onClick={() => setShowFullPrompt(!showFullPrompt)}
                className="ml-2 text-blue-600 hover:text-blue-700 text-xs"
              >
                {showFullPrompt ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{generation.aspect_ratio}</span>
          <span>{generation.cost_credits} credits</span>
          <span>{formatDate(generation.created_at)}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyPrompt}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Copy prompt"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Đã copy' : 'Copy'}
          </button>

          {generation.status === 'succeeded' && generation.image_url && (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Tải xuống"
              >
                <Download className="w-4 h-4" />
                Tải
              </button>

              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(generation.prompt, generation.aspect_ratio)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="Tạo lại"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tạo lại
                </button>
              )}
            </>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(generation.id)}
              className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {generation.error_message && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {generation.error_message}
          </div>
        )}
      </div>
    </div>
  );
}
