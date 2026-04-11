const LOGOS = ['True Beacon', 'Zerodha', 'Aeon Studio', 'Think9', 'Muvin']

export function ProofStrip() {
  return (
    <div className="border-t border-b border-border bg-surface py-8">
      <div className="max-w-[1100px] mx-auto px-8">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-faint text-center mb-6">
          Trusted by teams at
        </div>
        <div className="flex items-center justify-center gap-10 flex-wrap">
          {LOGOS.map(name => (
            <span key={name} className="font-mono text-[13px] font-medium text-faint tracking-[0.04em]">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
