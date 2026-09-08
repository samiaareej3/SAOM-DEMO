 import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LINKS = [
  { label: "Problem", href: "#problem" },
  { label: "Signal", href: "#difference" },
  { label: "Investigation", href: "#story" },
  { label: "Threat Intelligence", href: "#global-threat-intelligence" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (event, href) => {
    event.preventDefault();

    const section = document.querySelector(href);

    if (!section) {
      console.warn(`Section ${href} not found`);
      return;
    }

    const navbarHeight = 80;

    const target =
      section.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight;

    window.scrollTo({
      top: target,
      behavior: "smooth",
    });
  };

  const goHome = (event) => {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 transition-all duration-500 ${
        scrolled
          ? "py-3 bg-paper/85 backdrop-blur-md border-b border-hair"
          : "py-6 bg-transparent"
      }`}
    >

      {/* LOGO */}
      <a
        href="#top"
        onClick={goHome}
        className="font-mono-tech text-sm tracking-[0.15em]"
      >
        SAOM<span className="text-signal">.</span>AI
      </a>

      {/* NAVIGATION */}
      <nav className="hidden md:flex items-center gap-8">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(event) =>
              scrollToSection(event, link.href)
            }
            onMouseEnter={() =>
              setHovered(link.label)
            }
            onMouseLeave={() =>
              setHovered(null)
            }
            className="relative py-2 text-sm text-ink/80"
          >
            {link.label}

            <span
              className="absolute left-0 bottom-0 w-full h-[2px] transition-transform duration-300"
              style={{
                backgroundColor: "#ff5b5b",
                transform:
                  hovered === link.label
                    ? "scaleX(1)"
                    : "scaleX(0)",
                transformOrigin: "left",
              }}
            />
          </a>
        ))}
      </nav>

      {/* AUTH */}
      <div className="flex items-center gap-6">

        {/* SIGN IN */}
        <Link
          to="/signin"
          onMouseEnter={() =>
            setHovered("Sign In")
          }
          onMouseLeave={() =>
            setHovered(null)
          }
          className="relative hidden py-2 text-sm text-ink/80 md:inline-block"
        >
          Sign In

          <span
            className="absolute left-0 bottom-0 w-full h-[2px] transition-transform duration-300"
            style={{
              backgroundColor: "#ff5b5b",
              transform:
                hovered === "Sign In"
                  ? "scaleX(1)"
                  : "scaleX(0)",
              transformOrigin: "left",
            }}
          />
        </Link>

        {/* REGISTER */}
        <Link
          to="/signup"
          className="border border-ink px-5 py-2.5 text-xs font-mono-tech transition-all duration-300 hover:bg-ink hover:text-paper"
        >
          Register
        </Link>

      </div>
    </motion.header>
  );
}