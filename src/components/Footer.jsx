import HoverInvert from './HoverInvert.jsx'

export default function Footer() {
  return (
    <footer className="bg-ink px-6 py-10 text-paper md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <span className="font-mono-tech text-sm tracking-[0.15em]">
          SAOM<span className="text-signal">.</span>AI
        </span>
        <nav className="flex flex-wrap gap-8 group">
          {['Platform', 'Threat Intelligence', 'Security', 'Careers', 'Contact'].map((l) => (
            <span key={l} className="text-sm text-paper/60">
              <HoverInvert className="hover:!text-signal">{l}</HoverInvert>
            </span>
          ))}
        </nav>
        <span className="font-mono-tech text-xs text-paper/40">© {new Date().getFullYear()} SAOM AI</span>
      </div>
    </footer>
  )
}
