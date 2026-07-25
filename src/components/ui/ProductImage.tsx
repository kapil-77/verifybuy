import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getFallbackImage } from "@/lib/utils/images";

interface ProductImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackText?: string;
}

export function ProductImage({
  src,
  alt,
  className,
  fallbackText = "Image unavailable",
  ...props
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  function handleError() {
    if (!hasError) {
      setHasError(true);
      setImgSrc(getFallbackImage());
    }
  }

  return (
    <div className="relative overflow-hidden">
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onError={handleError}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          hasError && "opacity-60",
          className,
        )}
        {...props}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-text-muted/70 font-medium px-2 text-center leading-tight">
            {fallbackText}
          </span>
        </div>
      )}
    </div>
  );
}