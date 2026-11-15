import Link from 'next/link'

export function SiteFooter({ showGallery = true }: { showGallery?: boolean }) {
  return (
    <footer className="site-footer flex flex-col gap-4 border-t border-border py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0">© {new Date().getFullYear()} dev.akarun</p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link className="link-underline text-foreground" href="/about">
          About
        </Link>
        <Link className="link-underline text-foreground" href="/blog">
          Blog
        </Link>
        {showGallery ? <Link className="link-underline text-foreground" href="/gallery">Gallery</Link> : null}
        <Link className="link-underline text-foreground" href="/contact">
          Contact
        </Link>
        <Link className="link-underline text-foreground" href="/cookies">
          Cookies
        </Link>
      </nav>
    </footer>
  )
}
