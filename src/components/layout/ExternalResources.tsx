import React from 'react';

interface ExternalResourcesProps {
  preferredSite: 'dotabuff' | 'opendota';
  onSiteChange: (site: string) => void;
  isCollapsed: boolean;
}

interface ExternalResource {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
}

const externalResources: ExternalResource[] = [
  {
    id: 'dotabuff',
    name: 'Dotabuff',
    url: 'https://www.dotabuff.com',
    icon: '🔴',
    description: 'Dota 2 statistics and analysis',
  },
  {
    id: 'opendota',
    name: 'OpenDota',
    url: 'https://www.opendota.com',
    icon: '🟢',
    description: 'Open source Dota 2 statistics',
  },
  {
    id: 'dota2protracker',
    name: 'Dota2ProTracker',
    url: 'https://www.dota2protracker.com',
    icon: '🛡️',
    description: 'Professional player statistics',
  },
  {
    id: 'stratz',
    name: 'Stratz',
    url: 'https://stratz.com',
    icon: '🏰',
    description: 'Advanced Dota 2 analytics',
  },
];

export const ExternalResources: React.FC<ExternalResourcesProps> = ({
  preferredSite,
  onSiteChange,
  isCollapsed,
}) => {
  const handleSiteChange = (siteId: string) => {
    if (siteId === 'dotabuff' || siteId === 'opendota') {
      onSiteChange(siteId);
    }
  };

  const handleExternalClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isCollapsed) {
    return (
      <div className="p-4 space-y-2">
        {externalResources.map((resource) => (
          <button
            key={resource.id}
            onClick={() => handleExternalClick(resource.url)}
            className="flex justify-center w-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={resource.name}
          >
            <span className="text-lg">{resource.icon}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        External Resources
      </h3>
      
      {externalResources.map((resource) => (
        <div key={resource.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleExternalClick(resource.url)}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span className="mr-2">{resource.icon}</span>
              <span className="truncate">{resource.name}</span>
            </button>
            
            {/* Preferred site indicator for dotabuff/opendota */}
            {(resource.id === 'dotabuff' || resource.id === 'opendota') && (
              <button
                onClick={() => handleSiteChange(resource.id)}
                className={`ml-2 px-2 py-1 text-xs rounded ${
                  preferredSite === resource.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={`Set as preferred site: ${resource.name}`}
              >
                {preferredSite === resource.id ? '✓' : 'Set'}
              </button>
            )}
          </div>
          
          {!isCollapsed && (
            <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">
              {resource.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}; 