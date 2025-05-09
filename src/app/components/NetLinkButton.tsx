'use client';

import React, { useState } from 'react';

interface NetLinkButtonProps {
  href: string;
}

export const NetLinkButton: React.FC<NetLinkButtonProps> = ({ href }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '#4b5563',
        backgroundColor: isHovered ? '#f9fafb' : 'white',
        border: '1px solid #d1d5db',
        borderRadius: '9999px',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      .net link
    </a>
  );
}; 