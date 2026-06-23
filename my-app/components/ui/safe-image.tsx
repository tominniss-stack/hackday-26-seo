'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function SafeImage({ src, alt, className, fallbackIcon }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        {fallbackIcon || <Building2 className="h-6 w-6 text-slate-400" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
