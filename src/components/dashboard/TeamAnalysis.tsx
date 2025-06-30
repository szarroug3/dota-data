import { Target, AlertTriangle } from "lucide-react";
import DataCard from "./DataCard";

interface TeamAnalysisProps {
  strengths: Record<string, string>;
  weaknesses: string[];
  error?: string;
}

export default function TeamAnalysis({
  strengths,
  weaknesses,
  error,
}: TeamAnalysisProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DataCard title="Team Strengths" icon={Target} error={error}>
        <div className="space-y-3">
          {Object.entries(strengths).map(([role, strength]) => (
            <div
              key={role}
              className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
            >
              <h4 className="font-medium capitalize text-green-800 dark:text-green-200">
                {role}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                {strength}
              </p>
            </div>
          ))}
        </div>
      </DataCard>

      <DataCard title="Team Weaknesses" icon={AlertTriangle} error={error}>
        <div className="space-y-3">
          {weaknesses.map((weakness, index) => (
            <div
              key={index}
              className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg"
            >
              <p className="text-sm text-red-700 dark:text-red-300">
                {weakness}
              </p>
            </div>
          ))}
        </div>
      </DataCard>
    </div>
  );
}
