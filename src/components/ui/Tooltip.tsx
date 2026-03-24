'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  hidden?: boolean;
}

export const Tooltip = ({ children, content, delay = 100, className, side = 'bottom', hidden = false }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [theme, setTheme] = useState('light');

    useEffect(() => {
    const savedTheme = localStorage.getItem('dhara_theme');
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    }
  }, []);

  const showTooltip = () => {
    if (hidden) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && !hidden && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, ...((side === 'left' || side === 'right') ? { x: side === 'left' ? 5 : -5 } : { y: side === 'top' ? 5 : -5 }) }}
            animate={{ opacity: 1, scale: 1, x: side === 'left' || side === 'right' ? 0 : '-50%', y: 0 }}
            exit={{ opacity: 0, scale: 0.95, ...((side === 'left' || side === 'right') ? { x: side === 'left' ? 5 : -5 } : { y: side === 'top' ? 5 : -5 }) }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{ 
              left: side === 'right' ? 'calc(100% + 8px)' : side === 'left' ? 'auto' : '50%', 
              right: side === 'left' ? 'calc(100% + 8px)' : 'auto', 
              top: (side === 'top' || side === 'bottom') ? (side === 'top' ? 'auto' : 'calc(100% + 8px)') : '50%', 
              bottom: side === 'top' ? 'calc(100% + 8px)' : 'auto', 
              transform: (side === 'top' || side === 'bottom') ? 'translateX(-50%)' : 'translateY(-50%)' 
            }}
            className={cn(
              "absolute z-[9999] px-2 py-1 rounded-md text-[11px] font-medium tracking-tight whitespace-nowrap pointer-events-none shadow-xl border",
              theme === 'dark' 
                ? "bg-[#0d0d0d] text-white border-[#30363d]" 
                : "bg-[#1a1a18] text-white border-black/10"
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
