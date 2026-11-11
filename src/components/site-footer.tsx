import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="site-footer flex flex-col gap-4 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0">© {new Date().getFullYear()} dev.akarun</p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link className="underline underline-offset-4" href="/about">
          About
        </Link>
        <Link className="underline underline-offset-4" href="/blog">
          Blog
        </Link>
        <Link className="underline underline-offset-4" href="/gallery">
          Gallery
        </Link>
        <Link className="underline underline-offset-4" href="/contact">
          Contact
        </Link>
      </nav>
    </footer>
  )
}
