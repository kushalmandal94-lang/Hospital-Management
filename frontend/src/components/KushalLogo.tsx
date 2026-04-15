interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showText?: boolean;
  readonly className?: string;
}

export default function KushalLogo({ size = 'md', showText = true, className = '' }: Readonly<LogoProps>) {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/kushal-logo.svg"
        alt="Kushal Hospitals Logo"
        className={`${sizeMap[size]} flex-shrink-0`}
      />
      {showText && (
        <span className={`font-display font-extrabold text-teal-800 ${textSizeMap[size]}`}>
          Kushal Hospitals
        </span>
      )}
    </div>
  );
}
