import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorCardProps {
  title?: string;
  error: string;
  icon?: React.ReactNode;
  className?: string;
  description?: string;
}

export default function ErrorCard({
  title,
  error,
  icon = <AlertTriangle className="w-5 h-5" />,
  className = "",
  description,
}: ErrorCardProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        {description && (
          <p className="text-muted-foreground text-xs px-4 pb-2 pt-0">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
