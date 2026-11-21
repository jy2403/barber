import type { ReactNode } from 'react';

export function Badge({ children, cls = '', dot = true }: { children: ReactNode; cls?: string; dot?: boolean }) {
  return <span className={'badge ' + (dot ? 'dot ' : '') + cls}>{children}</span>;
}
