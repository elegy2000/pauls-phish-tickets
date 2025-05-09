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
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  
  useEffect(() => {
    console.log('Image URL:', imageUrl);
    console.log('Normalized URL:', imgSrc);
  }, [imageUrl, imgSrc]);

  return (
    <>
      {/* Preview thumbnail - fills the container */}
      <div 
        className="ticket-image-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => {
          console.log('Image clicked, opening lightbox');
          document.body.style.overflow = 'hidden';
          setLightboxOpen(true);
        }}
      >
        <img 
          src={imgSrc}
          alt={`${venue} ticket`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Changed back to cover to fill the box
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          id="lightbox-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem'
          }}
          onClick={() => {
            console.log('Closing lightbox');
            document.body.style.overflow = '';
            setLightboxOpen(false);
          }}
        >
          <button
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '50%',
              width: '2.5rem',
              height: '2.5rem',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000
            }}
            onClick={(e) => {
              e.stopPropagation();
              document.body.style.overflow = '';
              setLightboxOpen(false);
            }}
          >
            ✕
          </button>
          <div style={{ maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={imgSrc}
              alt={`${venue} ticket full view`}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                borderRadius: '4px'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}; 