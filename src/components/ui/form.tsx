import React from 'react';

import { cn } from '@/lib/utils';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  className?: string;
}

export const Form: React.FC<FormProps> = ({ children, className, ...props }) => {
  return (
    <form className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  );
};

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ children, className }) => {
  return <div className={cn('space-y-2', className)}>{children}</div>;
};

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({ children, className }) => {
  return <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>{children}</div>;
};
