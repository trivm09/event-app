import { Coins, TrendingUp } from 'lucide-react';
import { formatCredits } from '../utils/runway.utils';
import type { UserCredits } from '../types/runway.types';

interface CreditBalanceProps {
  credits: UserCredits;
  isAdmin: boolean;
}

export function CreditBalance({ credits, isAdmin }: CreditBalanceProps) {
  const displayCredits = isAdmin ? -1 : credits.credits;
  const isLowCredits = !isAdmin && credits.credits < 5;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className={`w-6 h-6 ${isLowCredits ? 'text-red-600' : 'text-blue-600'}`} />
          <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
        </div>
        {isAdmin && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            Admin
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className={`text-3xl font-bold ${isLowCredits ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCredits(displayCredits)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Credits khả dụng</p>
          {isLowCredits && (
            <p className="text-xs text-red-600 mt-2">
              Credits của bạn sắp hết. Hãy liên hệ admin để nạp thêm.
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="w-4 h-4" />
            <div className="flex-1">
              <p className="text-sm font-medium">Tổng số ảnh đã tạo</p>
              <p className="text-2xl font-bold">{credits.total_generations}</p>
            </div>
          </div>
        </div>

        {credits.last_generation_at && (
          <div className="text-xs text-gray-500">
            Lần tạo cuối:{' '}
            {new Date(credits.last_generation_at).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
