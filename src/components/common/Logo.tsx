import logoImg from '@/assets/logo.jpg';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
}

/** Reusable ARCANA TECH logo component. */
export const Logo = ({
  size = 36,
  className = '',
  showText = false,
  textClassName = '',
  subtitle,
}: LogoProps) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImg}
        alt="ARCANA TECH"
        style={{ width: size, height: size }}
        className="object-contain flex-shrink-0"
      />
      {showText && (
        <div className={textClassName}>
          <span className="font-bold text-sm tracking-tight block">ARCANA TECH</span>
          {subtitle && (
            <p className="text-[11px] leading-none mt-0.5 opacity-60">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
