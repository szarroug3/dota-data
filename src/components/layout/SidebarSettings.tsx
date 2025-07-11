import React from 'react';

interface SidebarSettingsProps {
  theme: 'light' | 'dark';
  preferredSite: 'dotabuff' | 'opendota';
  onThemeChange: (theme: string) => void;
  onPreferredSiteChange: (site: string) => void;
  isCollapsed: boolean;
}

const CollapsedSettings: React.FC<{ theme: 'light' | 'dark'; onThemeToggle: () => void }> = ({ theme, onThemeToggle }) => (
  <div className="p-4">
    <button
      onClick={onThemeToggle}
      className="flex justify-center w-full p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="text-lg">
        {theme === 'light' ? '\ud83c\udf19' : '\u2600\ufe0f'}
      </span>
    </button>
  </div>
);

const ExpandedSettings: React.FC<{
  theme: 'light' | 'dark';
  preferredSite: 'dotabuff' | 'opendota';
  onThemeToggle: () => void;
  onPreferredSiteChange: (site: string) => void;
}> = ({ theme, preferredSite, onThemeToggle, onPreferredSiteChange }) => (
  <div className="p-4 space-y-4">
    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Settings
    </h3>
    {/* Theme Toggle */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        Theme
      </label>
      <button
        onClick={onThemeToggle}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="flex items-center">
          <span className="mr-2">
            {theme === 'light' ? '\u2600\ufe0f' : '\ud83c\udf19'}
          </span>
          {theme === 'light' ? 'Light' : 'Dark'} Mode
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
        </span>
      </button>
    </div>
    {/* Preferred Site */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
        Preferred Site
      </label>
      <div className="space-y-1">
        <button
          onClick={() => onPreferredSiteChange('dotabuff')}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
            preferredSite === 'dotabuff'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="mr-2">\ud83d\udd34</span>
          Dotabuff
          {preferredSite === 'dotabuff' && (
            <span className="ml-auto text-xs">\u2713</span>
          )}
        </button>
        <button
          onClick={() => onPreferredSiteChange('opendota')}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
            preferredSite === 'opendota'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="mr-2">\ud83d\udfe2</span>
          OpenDota
          {preferredSite === 'opendota' && (
            <span className="ml-auto text-xs">\u2713</span>
          )}
        </button>
      </div>
    </div>
  </div>
);

export const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  theme,
  preferredSite,
  onThemeChange,
  onPreferredSiteChange,
  isCollapsed,
}) => {
  const handleThemeToggle = () => {
    onThemeChange(theme === 'light' ? 'dark' : 'light');
  };

  const handlePreferredSiteChange = (site: string) => {
    if (site === 'dotabuff' || site === 'opendota') {
      onPreferredSiteChange(site);
    }
  };

  if (isCollapsed) {
    return <CollapsedSettings theme={theme} onThemeToggle={handleThemeToggle} />;
  }

  return (
    <ExpandedSettings
      theme={theme}
      preferredSite={preferredSite}
      onThemeToggle={handleThemeToggle}
      onPreferredSiteChange={handlePreferredSiteChange}
    />
  );
}; 