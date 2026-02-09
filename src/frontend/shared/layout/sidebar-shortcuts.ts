type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string;
  };
};

export type ShortcutModifier = {
  symbol: string;
  label: string;
  joiner: string;
};

export const getShortcutModifier = (): ShortcutModifier => {
  if (typeof navigator === 'undefined') {
    return { symbol: 'Ctrl', label: 'Control', joiner: '+' };
  }

  const navigatorWithUAData = navigator as NavigatorWithUserAgentData;
  const platform = navigatorWithUAData.userAgentData?.platform ?? navigator.platform ?? '';
  const isMac = /mac/i.test(platform);
  return isMac ? { symbol: '⌘', label: 'Command', joiner: '' } : { symbol: 'Ctrl', label: 'Control', joiner: '+' };
};

export const formatShortcutVisual = (modifier: ShortcutModifier, key: string) => {
  return `${modifier.symbol}${modifier.joiner}${key}`;
};

export const formatShortcutAria = (modifier: ShortcutModifier, key: string) => {
  return `${modifier.label}+${key}`;
};
