'use client';

import { useState, useEffect } from 'react';

const PLACEHOLDER_IMAGE = '/images/default-show.jpg';

function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? url : `/images/${url}`;
}

export const TicketImage = ({ imageUrl, venue }: { imageUrl: string | null | undefined, venue: string }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => normalizeImageUrl(imageUrl));
  
  useEffect(() => {
    console.log('Image URL:', imageUrl);
    console.log('Normalized URL:', imgSrc);
  }, [imageUrl, imgSrc]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      overflow: 'hidden'
    }}>
      <img 
        src={imgSrc}
        alt={`${venue} ticket`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '4px'
        }}
        onError={(e) => {
          console.error('Image failed to load:', imgSrc);
          if (imgSrc !== PLACEHOLDER_IMAGE) {
            setImgSrc(PLACEHOLDER_IMAGE);
          }
        }}
      />
    </div>
  );
}; 