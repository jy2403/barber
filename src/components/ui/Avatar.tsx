/* eslint-disable @next/next/no-img-element -- SVG locales pequeños, no requieren next/image */
import { EMBLEMA, fotoUrl } from '@/lib/assets';
import { ini } from '@/lib/format';

/** Foto del barbero */
export function Avatar({ id, className = '' }: { id: string; className?: string }) {
  return (
    <span className={'av ' + className}>
      <img src={fotoUrl(id)} alt="" loading="lazy" />
    </span>
  );
}

/** Iniciales (clientes y usuarios) */
export function AvatarIni({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={'av av-ini ' + className} aria-hidden="true">
      {ini(name)}
    </span>
  );
}

/** Emblema de la marca (opción "cualquier barbero") */
export function AvatarEmblem({ className = '' }: { className?: string }) {
  return (
    <span className={'av av-emblem ' + className}>
      <img src={EMBLEMA} alt="" />
    </span>
  );
}
