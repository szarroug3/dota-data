import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DataCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  error?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function DataCard({
  title,
  description,
  icon: Icon,
  error,
  children,
  className = "",
}: DataCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-red-500 text-sm font-semibold p-4">{error}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
