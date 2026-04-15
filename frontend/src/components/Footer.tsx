import KushalLogo from './KushalLogo';

export default function Footer() {
  return (
    <footer className="border-t border-sky-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-sm text-slate-600 sm:px-6 lg:px-8">
        <KushalLogo size="sm" showText={true} />
        <p>Secure digital care platform</p>
      </div>
    </footer>
  );
}
