 export default function Footer() {
  return (
    <footer className="bg-ink px-6 py-10 text-paper md:px-10">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        
        {/* LEFT */}
        <span className="font-mono-tech text-sm tracking-[0.15em]">
          SAOM<span className="text-signal">.</span>AI
        </span>

        {/* RIGHT */}
        <span className="font-mono-tech text-xs text-paper/40">
          © {new Date().getFullYear()} SAOM AI
        </span>

      </div>
    </footer>
  )
}