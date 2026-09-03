 import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import MagneticButton from './MagneticButton.jsx'
import HoverInvert from './HoverInvert.jsx'

const LINKS = [
  { label: 'Platform', href: '#difference' },
  { label: 'How It Works', href: '#story' },
  { label: 'Threat Intelligence', href: '#global' },
  { label: 'About', href: '#compare' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState(null)
const [registerHovered, setRegisterHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 transition-all duration-500 ease-signal ${
        scrolled
          ? 'py-3 bg-paper/85 backdrop-blur-md border-b border-hair'
          : 'py-6 bg-transparent'
      }`}
    >

      {/* LOGO */}
      <a
        href="#top"
        className="font-mono-tech text-sm tracking-[0.15em]"
      >
        SAOM<span className="text-signal">.</span>AI
      </a>


      {/* NAVIGATION */}
      <nav className="hidden md:flex items-center gap-8">

        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="relative py-2 text-sm text-ink/80"
            onMouseEnter={() => setHovered(l.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <HoverInvert>
              {l.label}
            </HoverInvert>

            {/* RED UNDERLINE */}
            <span
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '2px',
                backgroundColor: '#ff5b5b',
                transform:
                  hovered === l.label
                    ? 'scaleX(1)'
                    : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.3s ease',
              }}
            />
          </a>
        ))}

      </nav>


      {/* AUTH BUTTONS */}
      <div className="flex items-center gap-6">

        {/* SIGN IN */}
        <a
          href="#sign-in"
          className="relative hidden py-2 text-sm text-ink/80 md:inline-block"
          onMouseEnter={() => setHovered('Sign In')}
          onMouseLeave={() => setHovered(null)}
        >
          <HoverInvert>
            Sign In
          </HoverInvert>

          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              height: '2px',
              backgroundColor: '#ff5b5b',
              transform:
                hovered === 'Sign In'
                  ? 'scaleX(1)'
                  : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'transform 0.3s ease',
            }}
          />
        </a>


        {/* REGISTER */}
         <div
  onMouseEnter={() => setRegisterHovered(true)}
  onMouseLeave={() => setRegisterHovered(false)}
  style={{
    transition: 'all 0.3s ease',
  }}
>
   <MagneticButton
  className="!px-5 !py-2.5 !text-xs"
  style={{
    color: registerHovered ? '#ff3b30' : undefined,
    backgroundColor: registerHovered ? '#000000' : undefined,
    borderColor: registerHovered ? '#000000' : undefined,
    transition: 'all 0.3s ease',
  }}
  onMouseEnter={() => setRegisterHovered(true)}
  onMouseLeave={() => setRegisterHovered(false)}
>
  Register
</MagneticButton>
</div>
      </div>

    </motion.header>
  )
}