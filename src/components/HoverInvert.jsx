/**
 * Wraps inline text/labels that invert black<->white with a red underline
 * sweep on hover. Used for nav links, technical labels, list items.
 */
export default function HoverInvert({ children, className = '', as: Tag = 'span' }) {
  return (
    <Tag
      className={`relative inline-block cursor-pointer transition-colors duration-500 ease-signal hover:text-signal ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-0 bg-signal transition-all duration-500 ease-signal group-hover:w-full" />
    </Tag>
  )
}
