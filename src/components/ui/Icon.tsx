import { ICONS } from '@/lib/icons';

interface Props {
  name: string;
  size?: number;
  className?: string;
}

/** Ícono de trazo (24 × 24) del set de la marca */
export function Icon({ name, size = 18, className = '' }: Props) {
  return (
    <svg
      className={'ic ' + className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
    />
  );
}
