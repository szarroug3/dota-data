import React from 'react';

interface StrengthWeakness {
  category: string;
  score: number;
  description: string;
  examples?: string[];
  improvements?: string[];
}

interface StrengthsWeaknessesSectionProps {
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
}

export const StrengthsWeaknessesSection: React.FC<StrengthsWeaknessesSectionProps> = ({ strengths, weaknesses }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground mb-4">Strengths & Weaknesses</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-foreground mb-3">Strengths</h4>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {strength.description}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-medium text-foreground mb-3">Areas for Improvement</h4>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                • {weakness.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}; 