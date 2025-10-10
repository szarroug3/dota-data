import React from 'react';

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({ children, className = '' }) => {
  return <div className={`flex flex-col gap-8 ${className}`}>{children}</div>;
};
