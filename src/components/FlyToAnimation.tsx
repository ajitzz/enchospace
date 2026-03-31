import React, { useEffect } from 'react';
import { Listing } from '../types';

interface Props {
  listing: Listing;
  target: 'RESERVES' | 'WISHLIST';
  onComplete: (target: 'RESERVES' | 'WISHLIST') => void;
}

export default function FlyToAnimation({ target, onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(target);
    }, 1000);
    return () => clearTimeout(timer);
  }, [target, onComplete]);

  return <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">Animating...</div>;
}
