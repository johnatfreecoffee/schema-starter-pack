import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  threshold?: number;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

export function LazyImage({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  threshold = 0.1,
  aspectRatio = 'auto',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }[aspectRatio];

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass, className)}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        ref={imgRef}
        src={isInView ? (error ? fallback : src) : fallback}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          aspectRatioClass ? 'w-full h-full object-cover' : '',
          className
        )}
        {...props}
      />
    </div>
  );
}
