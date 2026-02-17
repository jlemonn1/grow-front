import { useMemo, useState } from 'react';
import './CustomerAvatar.css';

interface CustomerAvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  className?: string;
  tooltip?: string;
}

const resolveImageUrl = (url?: string) => {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${apiBase}${url}`;
};

const initialsFromName = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function CustomerAvatar({ name, imageUrl, size = 40, className, tooltip }: CustomerAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = useMemo(() => resolveImageUrl(imageUrl), [imageUrl]);
  const initials = useMemo(() => initialsFromName(name), [name]);
  const showImage = Boolean(resolvedUrl && !hasError);
  const classes = ['customer-avatar', className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(12, size * 0.35)}px` }}
      title={tooltip || name}
      aria-label={tooltip || `Avatar de ${name}`}
    >
      {showImage ? (
        <img
          src={resolvedUrl as string}
          alt={tooltip || name}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="customer-avatar-initials">{initials || name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
