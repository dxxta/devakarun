import Link from 'next/link'

export const metadata = {
  title: 'Cookies',
  description: 'What dev.akarun stores in cookies and browser storage, and why.',
}

const storageItems = [
  {
    name: 'vid',
    purpose: 'Keeps guest reactions and daily post-view counts consistent for one anonymous visitor.',
    setBy: 'This site, when reactions or post views are used.',
    duration: 'Up to one year.',
    essential: 'Needed only for these features. You can delete it any time.',
  },
  {
    name: 'Auth.js sign-in cookies',
    purpose: 'Keep an optional Google sign-in for blog comments and protect the sign-in flow. Names include authjs.session-token, authjs.csrf-token, authjs.callback-url, and temporary PKCE, state, or nonce cookies. Secure deployments use prefixed variants.',
    setBy: 'Auth.js, only when Google sign-in is configured and used.',
    duration: 'A session can last up to 30 days. PKCE and state checks last up to 15 minutes. Other flow cookies are temporary.',
    essential: 'Needed only to sign in and use commenter features.',
  },
  {
    name: 'payload-token',
    purpose: 'Keeps an administrator signed in to the Payload control panel at /console.',
    setBy: 'Payload, only for administrators.',
    duration: 'Two hours by default.',
    essential: 'Needed only for admin access.',
  },
  {
    name: 'theme (localStorage)',
    purpose: 'Remembers the selected light, dark, or system theme.',
    setBy: 'This site through next-themes when you change the theme.',
    duration: 'Until you clear this browser storage.',
    essential: 'No. It is a display preference.',
  },
  {
    name: 'post-view:<slug> (sessionStorage)',
    purpose: 'Stops the same tab from sending a post-view request more than once in a session.',
    setBy: 'This site after a qualifying post view.',
    duration: 'Until the tab session ends.',
    essential: 'No. It only avoids duplicate view counts.',
  },
  {
    name: 'page-visit:<path> (sessionStorage)',
    purpose: 'Stops the same tab from sending a page visit more than once in a session.',
    setBy: 'This site after a qualifying page visit.',
    duration: 'Until the tab session ends.',
    essential: 'No. It only avoids duplicate visit counts.',
  },
  {
    name: 'Cloudflare security cookies (if set)',
    purpose: 'May support security checks from Turnstile or the Cloudflare proxy. This site does not choose their names or settings.',
    setBy: 'Cloudflare, when its security services are active.',
    duration: 'Set by Cloudflare and dependent on its service settings.',
    essential: 'Security-related when present.',
  },
]

function StorageCard({ item }: { item: (typeof storageItems)[number] }) {
  return (
    <article className="rounded-card border-2 border-ink-fixed bg-card p-5 shadow-hard">
      <h3 className="font-display text-lg font-bold">{item.name}</h3>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted-foreground">What it is for</dt>
          <dd className="mt-1">{item.purpose}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Set by</dt>
          <dd className="mt-1">{item.setBy}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">How long</dt>
          <dd className="mt-1">{item.duration}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted-foreground">Essential?</dt>
          <dd className="mt-1">{item.essential}</dd>
        </div>
      </dl>
    </article>
  )
}

export default function CookiesPage() {
  return (
    <article className="w-full space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Site information</p>
        <h1 className="font-display text-4xl font-bold tracking-tight">Cookies and browser storage</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">A short guide to the small amount of information this site keeps in your browser.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">The short version</h2>
        <p>This site uses a few first-party cookies and browser storage items for sign-in, settings, reactions, and post-view counts. We do not use advertising cookies.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold">What we store</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {storageItems.map((item) => <StorageCard item={item} key={item.name} />)}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">What we do not do</h2>
        <p>We do not use advertising cookies, third-party analytics, or tracking pixels. We do not save raw IP addresses. For rate limits and reaction or view deduplication, this site uses salted hashes that rotate daily.</p>
        <p>First-party analytics uses the same anonymous visitor cookie. It stores hashed visitor IDs, country codes, page paths, and event names, with short labels, reason codes, or referrer hosts where relevant. It does not store IP addresses or use advertising or third-party tracking.</p>
        <p>Sharing links open the selected network only when clicked. Nothing is loaded from those networks on our pages.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Third parties</h2>
        <p>If Google sign-in is enabled, Auth.js sends the details needed to Google when you choose to sign in. Google may use its own cookies on its pages. Google controls those settings.</p>
        <p>When enabled, Cloudflare Turnstile loads its script to help check forms. Our server may send the request IP to Cloudflare for verification. The Cloudflare proxy may also provide security features. These services may set their own security cookies. Their names and lifetimes depend on Cloudflare settings, and this site does not set or control them.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">How to control or delete them</h2>
        <p>You can clear cookies and site data in your browser settings. You can also sign out of comments with the sign-out button. Clearing the <code>theme</code> value in localStorage resets the saved theme. Deleting <code>vid</code> is fine, and reactions and view deduplication will start with a new anonymous visitor id.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Changes</h2>
        <p>Last updated: 15 November 2026.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Contact</h2>
        <p>If you have a question about this page, <Link className="link-underline text-foreground" href="/contact">contact us</Link>.</p>
      </section>

      <p className="border-t border-border pt-5 text-sm text-muted-foreground">This page is for information, not legal advice.</p>
    </article>
  )
}
