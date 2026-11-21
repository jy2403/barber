/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { EMBLEMA } from '@/lib/assets';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AURUM Barber Club, ir al inicio">
      <img src={EMBLEMA} alt="" width={44} height={44} />
      <span className="brand-text">
        <span className="brand-name">AURUM</span>
        <span className="brand-sub">BARBER CLUB</span>
      </span>
    </Link>
  );
}
