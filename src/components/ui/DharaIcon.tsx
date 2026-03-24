import React from 'react';

export const DharaIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c-4.42 0-8 3.58-8 8v2c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2c0-4.42-3.58-8-8-8z" />
    <path d="M7 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M10.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M13.5 15c0 2 1.5 2 1.5 4s-1.5 2-1.5 4" />
    <path d="M17 15c0 2-1.5 2-1.5 4s1.5 2 1.5 4" />
  </svg>
);
