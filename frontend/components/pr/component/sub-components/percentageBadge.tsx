import { Badge } from "@/components/ui/badge";
import { PERCENTAGE_COLORS } from "../constants";

interface PercentageBadgeProps {
  totalAmount: number;
  totalDisbursed: number;
}

export function PercentageBadge({ totalAmount, totalDisbursed }: PercentageBadgeProps) {
  if (totalAmount <= 0) {
    return <Badge variant="outline" className={PERCENTAGE_COLORS.zero}>0%</Badge>;
  }

  const percent = (totalDisbursed / totalAmount) * 100;
  
  const getColorClass = (percentage: number) => {
    if (percentage >= 100) return PERCENTAGE_COLORS.full;
    if (percentage >= 75) return PERCENTAGE_COLORS.high;
    if (percentage >= 50) return PERCENTAGE_COLORS.medium;
    if (percentage > 0) return PERCENTAGE_COLORS.low;
    return PERCENTAGE_COLORS.zero;
  };

  return (
    <Badge variant="outline" className={`${getColorClass(percent)} font-medium text-xs`}>
      {percent.toFixed(2)}%
    </Badge>
  );
}