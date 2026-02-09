'use client';

import React from 'react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

import { Dota2ProTrackerIcon, DotabuffIcon, OpenDotaIcon } from '../icons/ExternalSiteIcons';

export const SidebarExternalSites = () => {
  const externalSites = [
    { id: 'dotabuff', label: 'Dotabuff', icon: <DotabuffIcon />, url: 'https://dotabuff.com' },
    { id: 'opendota', label: 'OpenDota', icon: <OpenDotaIcon />, url: 'https://opendota.com' },
    {
      id: 'dota2protracker',
      label: 'Dota2ProTracker',
      icon: <Dota2ProTrackerIcon />,
      url: 'https://dota2protracker.com',
    },
  ];

  return (
    <SidebarGroup>
      <div className="flex justify-center">
        <SidebarSeparator />
      </div>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
        External Sites
      </SidebarGroupLabel>
      <SidebarMenu className="overflow-hidden">
        {externalSites.map((site) => (
          <SidebarMenuItem key={site.id}>
            <SidebarMenuButton onClick={() => window.open(site.url, '_blank')} tooltip={site.label}>
              {site.icon} <span className="truncate">{site.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
