import React from 'react';

interface PlaceholderImageProps {
  className?: string;
  alt: string;
}

export default function PlaceholderImage({ className = '', alt }: PlaceholderImageProps) {
  return (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-gray-500 text-center p-4">
        <div className="text-4xl mb-2">🎫</div>
        <div className="text-sm">{alt}</div>
      </div>
    </div>
  );
} 