'use client';

import { BarChart, Building, Clock } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useShareContext } from '@/frontend/contexts/share-context';

import { formatShortcutAria, formatShortcutVisual, getShortcutModifier } from './sidebar-shortcuts';

const NavigationContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isShareMode, shareKey } = useShareContext();
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Building />, path: '/dashboard', shortcutKey: '1' },
    { id: 'match-history', label: 'Match History', icon: <Clock />, path: '/match-history', shortcutKey: '2' },
    { id: 'player-stats', label: 'Player Stats', icon: <BarChart />, path: '/player-stats', shortcutKey: '3' },
  ];
  const shortcutModifier = React.useMemo(() => getShortcutModifier(), []);

  const buildRoute = React.useCallback(
    (path: string) => {
      if (isShareMode && shareKey) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('config', shareKey);
        return `${path}?${params.toString()}`;
      }
      return path;
    },
    [isShareMode, searchParams, shareKey],
  );

  React.useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey)) {
        return;
      }

      const targetPath =
        event.key === '1'
          ? '/dashboard'
          : event.key === '2'
            ? '/match-history'
            : event.key === '3'
              ? '/player-stats'
              : null;

      if (!targetPath) {
        return;
      }

      event.preventDefault();
      router.push(buildRoute(targetPath));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buildRoute, router]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path;
          const handleClick = () => {
            router.push(buildRoute(item.path));
          };
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={handleClick}
                className={isActive ? 'bg-accent' : ''}
                tooltip={{
                  children: `${item.label} (${formatShortcutVisual(shortcutModifier, item.shortcutKey)})`,
                }}
                aria-label={`${item.label} (${formatShortcutAria(shortcutModifier, item.shortcutKey)})`}
              >
                {React.cloneElement(item.icon, {
                  className: isActive ? 'text-primary' : '',
                })}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export const SidebarNavigation = () => {
  return (
    <Suspense
      fallback={
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu className="overflow-hidden">
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <Building className="animate-pulse" />
                <span className="truncate">Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <NavigationContent />
    </Suspense>
  );
};
