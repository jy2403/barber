import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="confirm" id="main">
      <span className="eyebrow center">Error 404</span>
      <h1>Esta página <em>no existe.</em></h1>
      <Link className="btn btn-gold btn-caps" href="/">Volver al inicio</Link>
    </main>
  );
}
