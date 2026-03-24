
'use client';

import Link, { LinkProps } from 'next/link';
import { useLoading } from '@/context/LoadingContext';
import React from 'react';
import { usePathname } from 'next/navigation';

interface LoadingLinkProps extends LinkProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  children: React.ReactNode;
}

const LoadingLink: React.FC<LoadingLinkProps> = ({ href, children, onClick, ...props }) => {
  const { showLoader } = useLoading();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.toString() !== pathname) {
        showLoader();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};

export default LoadingLink;
