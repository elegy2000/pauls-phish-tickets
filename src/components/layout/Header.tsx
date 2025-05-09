'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-purple-200">
            Paul's Phish Tickets
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-purple-200">
              Home
            </Link>
            <Link href="/phish" className="hover:text-purple-200">
              Phish Tour History
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2">
            <Link 
              href="/" 
              className="block py-2 hover:text-purple-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/phish" 
              className="block py-2 hover:text-purple-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Phish Tour History
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
} 