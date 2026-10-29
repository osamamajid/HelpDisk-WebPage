import * as React from 'react';

import { extensionIcon, toneForValue } from '@/lib/icons';
import { cn, extensionLabel } from '@/lib/utils';

interface FileKindIconProps {
  extension: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Render the extension text inside the tile (e.g. "EXE"). */
  showLabel?: boolean;
}

const SIZES = {
  sm: 'size-8 rounded-md text-2xs',
  md: 'size-10 rounded-lg text-2xs',
  lg: 'size-12 rounded-lg text-xs',
} as const;

const GLYPH = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' } as const;

/**
 * Extension badge. Icons come from lucide-react and the label is plain text -
 * the library never renders emoji for file types.
 */
export function FileKindIcon({
  extension,
  size = 'md',
  className,
  showLabel = true,
}: FileKindIconProps) {
  const Icon = extensionIcon(extension);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center gap-0.5 font-mono font-semibold uppercase',
        toneForValue(extension),
        SIZES[size],
        className,
      )}
      aria-hidden
    >
      <Icon className={GLYPH[size]} />
      {showLabel ? <span className="leading-none">{extensionLabel(extension, 3)}</span> : null}
    </span>
  );
}
