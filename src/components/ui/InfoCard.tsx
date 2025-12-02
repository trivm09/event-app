// Reusable info card component for dashboard
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
}

export const InfoCard = ({
  label,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-slate-900',
}: InfoCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{label}</p>
          <p className={`text-lg font-semibold ${valueColor}`}>{value}</p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};
