import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  error?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon = BarChart3,
  iconColor = "text-muted-foreground",
  error,
  className = "",
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm font-semibold">{error}</p>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
