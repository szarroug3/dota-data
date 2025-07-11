import React from 'react';


export const WelcomeSection: React.FC = () => {
  const handleAddFirstTeam = () => {
    // This would typically navigate to team management page
    // For now, we'll just log the action
    console.log('Navigate to team management');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Dota Data Analysis
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Track your team&apos;s performance, analyze matches, and get draft suggestions
        </p>
      </div>

      {/* Get Started Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Get Started
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add your first team to start analyzing performance, tracking matches, and getting draft suggestions.
          </p>
          <button
            onClick={handleAddFirstTeam}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Add Your First Team
          </button>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          title="Match History"
          description="Analyze your team's match performance with detailed statistics and insights."
          icon="📊"
        />
        <FeatureCard
          title="Player Performance"
          description="Track individual player statistics and hero performance across matches."
          icon="👤"
        />
        <FeatureCard
          title="Draft Suggestions"
          description="Get meta insights and draft recommendations based on current trends."
          icon="🎯"
        />
        <FeatureCard
          title="Team Analytics"
          description="Comprehensive team performance analytics and trend analysis."
          icon="📈"
        />
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}; 