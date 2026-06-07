export function SevakLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-lg bg-gradient-gold shadow-gold" />
        <div className="absolute inset-[3px] rounded-md bg-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L4 6 v6 c0 5 3.5 8 8 10 c4.5-2 8-5 8-10 V6 z" />
            <path d="M9 12 l2 2 4-4" />
          </svg>
        </div>
      </div>
      <div className="leading-tight">
        <div className="font-display text-lg font-bold tracking-tight">SevakAI</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">Mahakumbh 2028</div>
      </div>
    </div>
  );
}
