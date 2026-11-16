import Link from 'next/link'
import type { ReactNode } from 'react'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { isAdmin } from '@/access/users'
import { CountryWorldMap } from '@/components/admin/analytics/country-world-map'
import { SharePieChart, Sparkline, StackedBarChart, TopBarChart, TrendChart, type ChartPoint, type ChartSeries } from '@/components/admin/analytics/charts'
import { ShareImageButton } from '@/components/admin/analytics/share-image-button'
import { getSiteURL } from '@/lib/seo'
import type { AnalyticsEvent, ContactMessage, PageVisit, Post, PostReaction, PostView } from '@/payload-types'

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
const validMetrics = new Set(['visits', 'visitors', 'post-views', 'contact', 'rejected', 'clicks', 'pages', 'countries', 'referrers'])
const panelStyle = { border: '1px solid var(--theme-elevation-150)', borderRadius: 10, padding: 16, minWidth: 0 } as const
const mutedStyle = { color: 'var(--theme-elevation-600)' } as const

type Metric = 'visits' | 'visitors' | 'post-views' | 'contact' | 'rejected' | 'clicks' | 'pages' | 'countries' | 'referrers'
type MetricRow = { label: string; count: number; detail?: string }
type AnalyticsData = {
  visits: PageVisit[]
  views: PostView[]
  contacts: ContactMessage[]
  events: AnalyticsEvent[]
  reactions: PostReaction[]
  posts: Post[]
  currentStart: string
  previousStart: string
  range: number
}
type TableRow = { key: string; cells: Array<string | number | { label: string; href: string }> }

function relationID(value: number | { id: number } | null | undefined): number | null {
  return typeof value === 'number' ? value : value?.id ?? null
}

function countryName(code: string): string {
  if (code === 'XX') return 'Unknown'
  try { return regionNames.of(code) ?? code } catch { return code }
}

function analyticsWatermarkDomain(): string {
  const configuredURL = process.env.NEXT_PUBLIC_SERVER_URL || (process.env.NEXT_PUBLIC_SITE_URL ? getSiteURL() : '')
  if (configuredURL) {
    try {
      const host = new URL(configuredURL).host
      if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return host
    } catch {
      // Use the short brand label when no valid site host is configured.
    }
  }
  return 'dev.akarun'
}

function ShareCaptureWatermark({ domain }: { domain: string }) {
  return (
    <div aria-hidden="true" data-share-only style={{ display: 'none', position: 'absolute', zIndex: 0, inset: 0, overflow: 'hidden', pointerEvents: 'none', color: 'var(--theme-text)', opacity: 0.1 }}>
      <div style={{ position: 'absolute', inset: '-20%', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gridAutoRows: 112, transform: 'rotate(-20deg)', transformOrigin: 'center' }}>
        {Array.from({ length: 60 }, (_, index) => <span key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', fontSize: 18, fontWeight: 700, letterSpacing: '0.2em' }}>{domain}</span>)}
      </div>
    </div>
  )
}

function ShareCaptureFooter({ domain, range }: { domain: string; range: number }) {
  const generated = new Date().toISOString().slice(0, 10)
  return (
    <footer data-share-only data-share-display="flex" style={{ display: 'none', position: 'relative', zIndex: 1, flexDirection: 'column', alignItems: 'flex-end', gap: 4, padding: '12px 18px 4px', color: 'var(--theme-text)', textAlign: 'right' }}>
      <strong style={{ fontSize: 13, opacity: 0.28 }}>{domain}</strong>
      <span style={{ fontSize: 12, opacity: 0.8 }}>dev.akarun analytics, last {range} days, generated {generated}</span>
    </footer>
  )
}

function startOfDay(date = new Date()): Date {
  const result = new Date(date)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

function daysBetween(start: Date, range: number): Array<{ key: string; label: string }> {
  return Array.from({ length: range }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date),
    }
  })
}

function rangeFromParam(value: string | string[] | undefined): number {
  const selected = Array.isArray(value) ? value[0] : value
  return selected === '7' || selected === '90' ? Number(selected) : 30
}

function inRange<T extends { createdAt: string }>(rows: T[], from: string, before?: string): T[] {
  return rows.filter((row) => row.createdAt >= from && (!before || row.createdAt < before))
}

function increment(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function rank(counts: Map<string, number>, limit = 7): MetricRow[] {
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit)
}

function visitsByDay(rows: PageVisit[], days: Array<{ key: string; label: string }>): ChartPoint[] {
  const counts = new Map<string, number>()
  for (const row of rows) increment(counts, row.day)
  return days.map((day) => ({ label: day.label, visits: counts.get(day.key) ?? 0 }))
}

function uniqueVisitorsByDay(rows: PageVisit[], days: Array<{ key: string; label: string }>): ChartPoint[] {
  const visitors = new Map<string, Set<string>>()
  for (const row of rows) {
    const set = visitors.get(row.day) ?? new Set<string>()
    set.add(row.visitorHash)
    visitors.set(row.day, set)
  }
  return days.map((day) => ({ label: day.label, visitors: visitors.get(day.key)?.size ?? 0 }))
}

function rowCountByCreatedAt(rows: Array<{ createdAt: string }>, days: Array<{ key: string; label: string }>): ChartPoint[] {
  const counts = new Map<string, number>()
  for (const row of rows) increment(counts, row.createdAt.slice(0, 10))
  return days.map((day) => ({ label: day.label, count: counts.get(day.key) ?? 0 }))
}

function eventDaySeries(rows: AnalyticsEvent[], days: Array<{ key: string; label: string }>): { data: ChartPoint[]; series: ChartSeries[] } {
  const groups = new Map<string, { event: string; label: string; count: number }>()
  for (const row of rows) {
    if (row.event === 'contact_rejected') continue
    const label = row.label || 'no label'
    const groupKey = `${row.event}::${label}`
    const group = groups.get(groupKey) ?? { event: row.event, label, count: 0 }
    group.count += 1
    groups.set(groupKey, group)
  }
  const topGroups = [...groups].sort((a, b) => b[1].count - a[1].count).slice(0, 7)
  const series = topGroups.map(([key, group], index) => ({ key: `event_${index}`, label: `${group.event.replaceAll('_', ' ')} · ${group.label}`, color: undefined }))
  const data = days.map((day) => {
    const point: ChartPoint = { label: day.label }
    topGroups.forEach(([groupKey], index) => { point[`event_${index}`] = rows.filter((row) => row.day === day.key && `${row.event}::${row.label || 'no label'}` === groupKey).length })
    return point
  })
  return { data, series }
}

async function getAnalyticsData(payload: AdminViewServerProps['initPageResult']['req']['payload'], range: number): Promise<AnalyticsData> {
  const current = startOfDay()
  current.setUTCDate(current.getUTCDate() - (range - 1))
  const previous = new Date(current)
  previous.setUTCDate(previous.getUTCDate() - range)
  const previousStart = previous.toISOString()
  const [visits, views, contacts, events, reactions, posts] = await Promise.all([
    payload.find({ collection: 'page-visits', where: { createdAt: { greater_than_equal: previousStart } }, depth: 0, limit: 50000, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'post-views', where: { createdAt: { greater_than_equal: previousStart } }, depth: 0, limit: 50000, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'contact-messages', where: { createdAt: { greater_than_equal: previousStart } }, depth: 0, limit: 50000, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'analytics-events', where: { createdAt: { greater_than_equal: previousStart } }, depth: 0, limit: 50000, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'post-reactions', where: { createdAt: { greater_than_equal: previousStart } }, depth: 0, limit: 50000, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, depth: 0, limit: 2000, pagination: false, overrideAccess: true }),
  ])
  return { visits: visits.docs, views: views.docs, contacts: contacts.docs, events: events.docs, reactions: reactions.docs, posts: posts.docs, currentStart: current.toISOString(), previousStart, range }
}

function SummaryCard({ title, value, metric, data, detail }: { title: string; value: number; metric: Metric; data: ChartPoint[]; detail?: string }) {
  return (
    <article data-share-summary-card style={{ ...panelStyle, display: 'flex', flex: '0 0 clamp(220px, 19%, 280px)', flexDirection: 'column', alignItems: 'stretch', height: '100%', minHeight: 190, gap: 10, scrollSnapAlign: 'start' }}>
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}>
        <div><p style={{ margin: 0, ...mutedStyle, fontSize: 13 }}>{title}</p><p style={{ margin: '4px 0 0', fontSize: 27, fontWeight: 700, color: 'var(--theme-text)' }}>{value.toLocaleString('en')}</p></div>
        {detail ? <span style={{ color: 'var(--theme-elevation-700)', fontSize: 12 }}>{detail}</span> : null}
      </div>
      <Sparkline data={data} title={title} />
      <Link data-share-ignore href={`/console/analytics/${metric}`} style={{ color: 'var(--theme-text)', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}>View details</Link>
    </article>
  )
}

function RankingCard({ title, metric, rows }: { title: string; metric: Metric; rows: MetricRow[] }) {
  return (
    <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%', gap: 0 }}>
      <h2 style={{ margin: 0, fontSize: 17, color: 'var(--theme-text)' }}>{title}</h2>
      {rows.length ? <ol style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', alignContent: 'start', gap: 0, fontSize: 13 }}>{rows.slice(0, 7).map((row) => <li key={row.label} style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}><span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span><strong style={{ flexShrink: 0 }}>{row.detail ?? row.count.toLocaleString('en')}</strong></li>)}</ol> : <p style={{ margin: '12px 0 0', ...mutedStyle }}>No data yet</p>}
      <Link data-share-ignore href={`/console/analytics/${metric}`} style={{ marginTop: 'auto', paddingTop: 12, color: 'var(--theme-text)', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}>View details</Link>
    </section>
  )
}

function ChangeText({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <p style={{ margin: 0, ...mutedStyle }}>No previous-period baseline · current: {current.toLocaleString('en')}</p>
  const change = ((current - previous) / previous) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged'
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→'
  return <p style={{ margin: 0, color: 'var(--theme-text)' }}><strong>{arrow} {Math.abs(change).toFixed(1)}% {direction}</strong> · {current.toLocaleString('en')} now vs {previous.toLocaleString('en')} in the previous period</p>
}

function RangeSelector({ metric, range, path }: { metric: Metric; range: number; path?: string }) {
  const href = (value: number) => `/console/analytics/${metric}?range=${value}${path ? `&path=${encodeURIComponent(path)}` : ''}`
  return <nav aria-label="Analytics date range" data-share-ignore style={{ display: 'flex', gap: 12 }}>{[7, 30, 90].map((days) => <Link aria-current={range === days ? 'page' : undefined} href={href(days)} key={days} style={{ color: 'var(--theme-text)', fontWeight: range === days ? 700 : 400, textDecoration: 'underline', textUnderlineOffset: 3 }}>{days} days</Link>)}</nav>
}

function DataTable({ title, headers, rows, page, pageBase }: { title: string; headers: string[]; rows: TableRow[]; page: number; pageBase: string }) {
  const perPage = 25
  const pages = Math.max(1, Math.ceil(rows.length / perPage))
  const current = Math.max(1, Math.min(page, pages))
  const visibleRows = rows.slice((current - 1) * perPage, current * perPage)
  const pageHref = (value: number) => `${pageBase}${pageBase.includes('?') ? '&' : '?'}page=${value}`
  return (
    <section style={{ ...panelStyle, overflowX: 'auto' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 17, color: 'var(--theme-text)' }}>{title}</h2>
      {rows.length ? <>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 620, fontSize: 13 }}>
          <thead><tr>{headers.map((header) => <th key={header} scope="col" style={{ padding: '9px 10px', textAlign: 'left', borderBottom: '1px solid var(--theme-elevation-200)' }}>{header}</th>)}</tr></thead>
          <tbody>{visibleRows.map((row) => <tr key={row.key}>{row.cells.map((cell, index) => <td key={`${row.key}-${index}`} style={{ padding: '9px 10px', borderBottom: '1px solid var(--theme-elevation-100)', verticalAlign: 'top' }}>{typeof cell === 'object' ? <Link href={cell.href} style={{ color: 'var(--theme-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{cell.label}</Link> : cell}</td>)}</tr>)}</tbody>
        </table>
        <nav aria-label={`${title} pagination`} data-share-ignore style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
          <span style={mutedStyle}>Page {current} of {pages} · {rows.length.toLocaleString('en')} rows</span>
          <span style={{ display: 'flex', gap: 12 }}>{current > 1 ? <Link href={pageHref(current - 1)} style={{ color: 'var(--theme-text)', textDecoration: 'underline' }}>Previous</Link> : null}{current < pages ? <Link href={pageHref(current + 1)} style={{ color: 'var(--theme-text)', textDecoration: 'underline' }}>Next</Link> : null}</span>
        </nav>
      </> : <p style={{ margin: 0, ...mutedStyle }}>No data yet</p>}
    </section>
  )
}

function maskedEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return 'hidden'
  return `${local.slice(0, 1)}***@${domain}`
}

function metricTotals(metric: Metric, data: AnalyticsData, path?: string): { current: number; previous: number } {
  const cur = <T extends { createdAt: string }>(rows: T[]) => inRange(rows, data.currentStart)
  const prev = <T extends { createdAt: string }>(rows: T[]) => inRange(rows, data.previousStart, data.currentStart)
  const pageVisits = path ? data.visits.filter((row) => row.path === path) : data.visits
  const rejected = data.events.filter((row) => row.event === 'contact_rejected')
  const clicks = data.events.filter((row) => row.event !== 'contact_rejected')
  if (metric === 'visits' || metric === 'pages') return { current: cur(pageVisits).length, previous: prev(pageVisits).length }
  if (metric === 'visitors') return { current: new Set(cur(pageVisits).map((row) => row.visitorHash)).size, previous: new Set(prev(pageVisits).map((row) => row.visitorHash)).size }
  if (metric === 'post-views') return { current: cur(data.views).length, previous: prev(data.views).length }
  if (metric === 'contact') return { current: cur(data.contacts).length, previous: prev(data.contacts).length }
  if (metric === 'rejected') return { current: cur(rejected).length, previous: prev(rejected).length }
  if (metric === 'clicks') return { current: cur(clicks).length, previous: prev(clicks).length }
  if (metric === 'countries') return { current: cur(data.visits).length, previous: prev(data.visits).length }
  return { current: cur(data.visits.filter((row) => row.referrerHost)).length, previous: prev(data.visits.filter((row) => row.referrerHost)).length }
}

function mapCounts(rows: PageVisit[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) if (row.country !== 'XX') counts[row.country] = (counts[row.country] ?? 0) + 1
  return counts
}

function countryRows(rows: PageVisit[]): MetricRow[] {
  const counts = new Map<string, number>()
  for (const row of rows) increment(counts, row.country)
  const total = rows.length || 1
  return [...counts].map(([code, count]) => ({ label: countryName(code), count, detail: `${code} · ${count.toLocaleString('en')} · ${((count / total) * 100).toFixed(1)}%` })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function dashboardRows(data: AnalyticsData, visits: PageVisit[], clicks: AnalyticsEvent[]) {
  const pages = new Map<string, number>()
  const countries = new Map<string, number>()
  const refs = new Map<string, number>()
  for (const row of visits) {
    increment(pages, row.path)
    increment(countries, countryName(row.country))
    if (row.referrerHost) increment(refs, row.referrerHost)
  }
  const countryTotal = visits.length || 1
  const topCountries = rank(countries).map((row) => ({ ...row, detail: `${row.count} · ${((row.count / countryTotal) * 100).toFixed(1)}%` }))
  return { pages: rank(pages), countries: topCountries, referrers: rank(refs), clicks: clicks.length, data }
}

function Dashboard({ data, shareDomain }: { data: AnalyticsData; shareDomain: string }) {
  const days = daysBetween(new Date(data.currentStart), 7)
  const currentVisits = inRange(data.visits, data.currentStart)
  const currentViews = inRange(data.views, data.currentStart)
  const currentContacts = inRange(data.contacts, data.currentStart)
  const currentEvents = inRange(data.events, data.currentStart)
  const rejected = currentEvents.filter((row) => row.event === 'contact_rejected')
  const clicks = currentEvents.filter((row) => row.event !== 'contact_rejected')
  const dailyVisits = visitsByDay(currentVisits, days)
  const dailyUnique = uniqueVisitorsByDay(currentVisits, days)
  const dailyViews = rowCountByCreatedAt(currentViews, days)
  const dailyContacts = rowCountByCreatedAt(currentContacts, days)
  const dailyRejected = rowCountByCreatedAt(rejected, days)
  const dailyClicks = rowCountByCreatedAt(clicks, days)
  const uniqueValue = new Set(currentVisits.map((row) => row.visitorHash)).size
  const rankings = dashboardRows(data, currentVisits, clicks)
  const dailyData = dailyVisits.map((row, index) => ({ ...row, visitors: Number(dailyUnique[index]?.visitors ?? 0) }))
  const barPages = rankings.pages.map((row) => ({ label: row.label, count: row.count }))
  return (
    <div id="analytics-share-capture" style={{ position: 'relative', isolation: 'isolate', background: 'var(--theme-bg, var(--theme-elevation-0))' }}>
      <ShareCaptureWatermark domain={shareDomain} />
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 18, paddingBottom: 32 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}><div><h1 style={{ margin: 0 }}>Analytics</h1><p style={{ margin: '6px 0 0', ...mutedStyle }}>Last 7 days · anonymous first-party activity</p></div><ShareImageButton range={7} targetId="analytics-share-capture" /></header>
      <div className="analytics-summary-strip" data-share-summary-strip style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'stretch', overflowX: 'auto', gap: 16, paddingBottom: 8, scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}>
        <SummaryCard data={dailyVisits} metric="visits" title="Visits" value={currentVisits.length} />
        <SummaryCard data={dailyUnique} metric="visitors" title="Unique visitors" value={uniqueValue} />
        <SummaryCard data={dailyViews} metric="post-views" title="Post views" value={currentViews.length} />
        <SummaryCard data={dailyContacts} metric="contact" title="Contact submissions" value={currentContacts.length} />
        <SummaryCard data={dailyRejected} metric="rejected" title="Rejected attempts" value={rejected.length} />
        <SummaryCard data={dailyClicks} metric="clicks" title="Clicks" value={clicks.length} />
      </div>
      <div style={{ display: 'grid', alignItems: 'stretch', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 16 }}>
        <TrendChart data={dailyData} series={[{ key: 'visits', label: 'Visits' }, { key: 'visitors', label: 'Unique visitors', color: 'var(--theme-success-500, #4c711c)' }]} summary="Daily visits and unique visitors over the last seven days" title="Visits per day" />
        <TopBarChart data={barPages} summary="Most visited pages during the last seven days" title="Top pages" />
      </div>
      <CountryWorldMap compact counts={mapCounts(currentVisits)} />
      <div style={{ display: 'grid', alignItems: 'stretch', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
        <RankingCard metric="pages" rows={rankings.pages} title="Top pages" />
        <RankingCard metric="countries" rows={rankings.countries} title="Top countries" />
        <RankingCard metric="referrers" rows={rankings.referrers} title="Top referrer hosts" />
      </div>
      <p style={{ margin: 0, ...mutedStyle, fontSize: 12 }}>Counts are based on records stored during this period, and country is unknown when the Cloudflare country header is unavailable.</p>
      </div>
      <ShareCaptureFooter domain={shareDomain} range={7} />
    </div>
  )
}

function tableRows(metric: Metric, data: AnalyticsData, selectedVisits: PageVisit[], selectedViews: PostView[], selectedContacts: ContactMessage[], selectedEvents: AnalyticsEvent[], path?: string): { headers: string[]; rows: TableRow[] } {
  if (metric === 'contact') return {
    headers: ['Name', 'Email', 'Subject', 'Date', 'Record'],
    rows: [...selectedContacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => ({ key: String(row.id), cells: [row.name, maskedEmail(row.email), row.subject, new Date(row.createdAt).toLocaleString('en'), { label: 'Open', href: `/admin/collections/contact-messages/${row.id}` }] })),
  }
  if (metric === 'rejected') return {
    headers: ['Reason', 'Path', 'Country', 'Date'],
    rows: [...selectedEvents].filter((row) => row.event === 'contact_rejected').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => ({ key: String(row.id), cells: [row.reason ?? 'unknown', row.path, countryName(row.country), new Date(row.createdAt).toLocaleString('en')] })),
  }
  if (metric === 'clicks') return {
    headers: ['Event', 'Label', 'Path', 'Country', 'Date'],
      rows: [...selectedEvents].filter((row) => row.event !== 'contact_rejected').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => ({ key: String(row.id), cells: [row.event, row.label ?? 'N/A', row.path, countryName(row.country), new Date(row.createdAt).toLocaleString('en')] })),
  }
  if (metric === 'post-views') return {
    headers: ['Post', 'Day', 'Country', 'Visitor hash'],
    rows: [...selectedViews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => { const post = data.posts.find((item) => item.id === relationID(row.post)); return { key: String(row.id), cells: [post?.title ?? 'Post', row.day, countryName(row.country), `${row.visitorHash.slice(0, 12)}…`] } }),
  }
  if (metric === 'visitors') {
    const grouped = new Map<string, { count: number; last: string; country: string; path: string }>()
    for (const row of selectedVisits) {
      const item = grouped.get(row.visitorHash) ?? { count: 0, last: row.createdAt, country: row.country, path: row.path }
      item.count += 1
      if (row.createdAt > item.last) item.last = row.createdAt
      grouped.set(row.visitorHash, item)
    }
    return { headers: ['Visitor hash', 'Visits', 'Last seen', 'Country', 'Example path'], rows: [...grouped].map(([hash, item]) => ({ key: hash, cells: [`${hash.slice(0, 16)}…`, item.count, new Date(item.last).toLocaleString('en'), countryName(item.country), item.path] })).sort((a, b) => String(b.cells[2]).localeCompare(String(a.cells[2]))) }
  }
  if (metric === 'pages' && !path) {
    const pageMap = new Map<string, PageVisit[]>()
    for (const row of selectedVisits) pageMap.set(row.path, [...(pageMap.get(row.path) ?? []), row])
    const postIDs = new Map(data.posts.map((post) => [`/blog/${post.slug}`, post.id]))
    const rows = [...pageMap].map(([pagePath, visits]) => {
      const unique = new Set(visits.map((row) => row.visitorHash)).size
      const byCountry = new Map<string, number>()
      for (const visit of visits) increment(byCountry, countryName(visit.country))
      const topCountries = rank(byCountry, 3).map((row) => row.label).join(', ') || 'N/A'
      const postID = postIDs.get(pagePath)
      const postViews = postID ? selectedViews.filter((row) => relationID(row.post) === postID).length : 0
      const reactions = postID ? data.reactions.filter((row) => relationID(row.post) === postID && row.createdAt >= data.currentStart).length : 0
      return { key: pagePath, cells: [{ label: pagePath, href: `/console/analytics/pages?range=${data.range}&path=${encodeURIComponent(pagePath)}` }, visits.length, unique, (visits.length / data.range).toFixed(1), topCountries, postID ? postViews : 'N/A', postID ? reactions : 'N/A'] } satisfies TableRow
    }).sort((a, b) => Number(b.cells[1]) - Number(a.cells[1]))
    return { headers: ['Page', 'Visits', 'Unique visitors', 'Avg/day', 'Top countries', 'Post views', 'Reactions'], rows }
  }
  if (metric === 'pages' && path) return {
    headers: ['Day', 'Country', 'Referrer host', 'Visitor hash'],
    rows: [...selectedVisits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => ({ key: String(row.id), cells: [row.day, countryName(row.country), row.referrerHost ?? 'Direct', `${row.visitorHash.slice(0, 12)}…`] })),
  }
  if (metric === 'countries') {
    const groups = new Map<string, PageVisit[]>()
    for (const row of selectedVisits) groups.set(row.country, [...(groups.get(row.country) ?? []), row])
    const total = selectedVisits.length || 1
    return { headers: ['Country', 'Code', 'Visits', 'Unique visitors', 'Share', 'Top pages'], rows: [...groups].map(([code, visits]) => {
      const pageCounts = new Map<string, number>()
      for (const visit of visits) increment(pageCounts, visit.path)
      return { key: code, cells: [countryName(code), code, visits.length, new Set(visits.map((row) => row.visitorHash)).size, `${((visits.length / total) * 100).toFixed(1)}%`, rank(pageCounts, 3).map((row) => row.label).join(', ') || 'N/A'] }
    }).sort((a, b) => Number(b.cells[2]) - Number(a.cells[2])) }
  }
  if (metric === 'referrers') {
    const groups = new Map<string, PageVisit[]>()
    for (const row of selectedVisits) if (row.referrerHost) groups.set(row.referrerHost, [...(groups.get(row.referrerHost) ?? []), row])
    return { headers: ['Referrer host', 'Visits', 'Unique visitors', 'Top paths', 'Countries'], rows: [...groups].map(([host, visits]) => {
      const pages = new Map<string, number>(), countries = new Map<string, number>()
      for (const row of visits) { increment(pages, row.path); increment(countries, countryName(row.country)) }
      return { key: host, cells: [host, visits.length, new Set(visits.map((row) => row.visitorHash)).size, rank(pages, 3).map((row) => row.label).join(', '), rank(countries, 3).map((row) => row.label).join(', ')] }
    }).sort((a, b) => Number(b.cells[1]) - Number(a.cells[1])) }
  }
  return {
    headers: ['Day', 'Path', 'Country', 'Referrer host', 'Visitor hash'],
    rows: [...selectedVisits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((row) => ({ key: String(row.id), cells: [row.day, row.path, countryName(row.country), row.referrerHost ?? 'Direct', `${row.visitorHash.slice(0, 12)}…`] })),
  }
}

function Detail({ metric, data, searchParams, shareDomain }: { metric: Metric; data: AnalyticsData; searchParams?: Record<string, string | string[] | undefined>; shareDomain: string }) {
  const range = data.range
  const startDate = new Date(data.currentStart)
  const days = daysBetween(startDate, range)
  const selectedVisits = inRange(data.visits, data.currentStart)
  const selectedViews = inRange(data.views, data.currentStart)
  const selectedContacts = inRange(data.contacts, data.currentStart)
  const selectedEvents = inRange(data.events, data.currentStart)
  const pathParam = searchParams?.path
  const selectedPath = Array.isArray(pathParam) ? pathParam[0] : pathParam
  const pagePath = metric === 'pages' && selectedPath?.startsWith('/') && !selectedPath.startsWith('//') ? selectedPath : undefined
  const detailVisits = pagePath ? selectedVisits.filter((row) => row.path === pagePath) : selectedVisits
  const title = pagePath ? `Page · ${pagePath}` : ({ visits: 'Visits', visitors: 'Unique visitors', 'post-views': 'Post views', contact: 'Contact submissions', rejected: 'Rejected attempts', clicks: 'Clicks', pages: 'Pages', countries: 'Countries', referrers: 'Referrer hosts' } as Record<Metric, string>)[metric]
  const totals = metricTotals(metric, data, pagePath)
  const visitsSeries = visitsByDay(detailVisits, days)
  const visitUnique = uniqueVisitorsByDay(detailVisits, days)
  const visitsChart = visitsSeries.map((point, index) => ({ ...point, visitors: Number(visitUnique[index]?.visitors ?? 0) }))
  const viewsChart = rowCountByCreatedAt(metric === 'post-views' ? selectedViews : selectedViews, days)
  const contactsChart = rowCountByCreatedAt(selectedContacts, days)
  const rejectedChart = rowCountByCreatedAt(selectedEvents.filter((row) => row.event === 'contact_rejected'), days)
  const clickGroups = eventDaySeries(selectedEvents, days)
  const currentRows = metric === 'pages' && pagePath ? detailVisits : metric === 'pages' ? selectedVisits : selectedVisits
  const builtTable = tableRows(metric, data, currentRows, selectedViews, selectedContacts, selectedEvents, pagePath)
  const pageParam = searchParams?.page
  const page = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1
  const pageBase = `/console/analytics/${metric}?range=${range}${pagePath ? `&path=${encodeURIComponent(pagePath)}` : ''}`
  const countries = countryRows(pagePath ? detailVisits : selectedVisits)
  const map = mapCounts(pagePath ? detailVisits : selectedVisits)
  const countryPie = countries.slice(0, 6).map((row) => ({ label: row.label, count: row.count }))
  const otherCountries = countries.slice(6).reduce((sum, row) => sum + row.count, 0)
  if (otherCountries) countryPie.push({ label: 'Other', count: otherCountries })
  const pageCounts = new Map<string, number>()
  for (const row of selectedVisits) increment(pageCounts, row.path)
  const barPages = rank(pageCounts).map((row) => ({ label: row.label, count: row.count }))
  const seriesByMetric: Record<Metric, { data: ChartPoint[]; series: ChartSeries[] }> = {
    visits: { data: visitsChart, series: [{ key: 'visits', label: 'Visits' }, { key: 'visitors', label: 'Unique visitors', color: 'var(--theme-success-500, #4c711c)' }] },
    visitors: { data: visitsChart, series: [{ key: 'visitors', label: 'Unique visitors' }] },
    'post-views': { data: viewsChart, series: [{ key: 'count', label: 'Post views' }] },
    contact: { data: contactsChart, series: [{ key: 'count', label: 'Submissions' }] },
    rejected: { data: rejectedChart, series: [{ key: 'count', label: 'Rejected attempts' }] },
    clicks: clickGroups,
    pages: { data: visitsChart, series: [{ key: 'visits', label: 'Visits' }, { key: 'visitors', label: 'Unique visitors', color: 'var(--theme-success-500, #4c711c)' }] },
    countries: { data: visitsSeries, series: [{ key: 'visits', label: 'Visits' }] },
    referrers: { data: visitsSeries, series: [{ key: 'visits', label: 'Visits' }] },
  }
  const chart = seriesByMetric[metric]
  const previousCount = totals.previous

  return (
    <div id="analytics-share-capture" style={{ position: 'relative', isolation: 'isolate', background: 'var(--theme-bg, var(--theme-elevation-0))' }}>
      <ShareCaptureWatermark domain={shareDomain} />
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', alignContent: 'start', gap: 18, paddingBottom: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16 }}>
        <div><Link data-share-ignore href="/console" style={{ color: 'var(--theme-text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>← Analytics dashboard</Link><h1 style={{ margin: '8px 0 0', color: 'var(--theme-text)' }}>{title}</h1></div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}><RangeSelector metric={metric} path={pagePath} range={range} /><ShareImageButton range={range} targetId="analytics-share-capture" /></div>
      </header>
      <section style={panelStyle}><h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Compared with the previous {range} days</h2><ChangeText current={totals.current} previous={previousCount} /></section>
      <TrendChart data={chart.data} series={chart.series} summary={`${title} over the last ${range} days`} title={`${title} · ${range} days`} height={340} />
      {metric === 'clicks' ? <StackedBarChart data={chart.data} series={chart.series} summary="Clicks grouped by event name for each day" title="Clicks by event per day" /> : null}
      {metric === 'pages' && !pagePath ? <TopBarChart data={barPages} summary="Top visited pages for the selected period" title="Top pages" /> : null}
      {metric === 'countries' ? <>
        <CountryWorldMap counts={map} />
        <SharePieChart data={countryPie} summary="Share of visits by country, with the top six countries and remaining countries grouped" title="Country share" />
      </> : null}
      {metric === 'pages' && pagePath ? <>
        <section style={{ ...panelStyle, display: 'grid', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Page details</h2>
          <p style={{ margin: 0 }}>Visits: <strong>{detailVisits.length}</strong> · Unique visitors: <strong>{new Set(detailVisits.map((row) => row.visitorHash)).size}</strong> · Average per day: <strong>{(detailVisits.length / range).toFixed(1)}</strong></p>
          {pagePath.startsWith('/blog/') ? (() => {
            const slug = pagePath.slice('/blog/'.length)
            const post = data.posts.find((item) => item.slug === slug)
            if (!post) return null
            return <p style={{ margin: 0 }}>Post views: <strong>{selectedViews.filter((row) => relationID(row.post) === post.id).length}</strong> · Reactions: <strong>{data.reactions.filter((row) => relationID(row.post) === post.id && row.createdAt >= data.currentStart).length}</strong></p>
          })() : null}
        </section>
        <SharePieChart data={countryPie} summary="Top countries for this page" title="Top countries for this page" />
      </> : null}
      {metric === 'countries' ? <DataTable headers={builtTable.headers} page={page} pageBase={pageBase} rows={builtTable.rows} title="Country details" /> : null}
      {metric === 'contact' && selectedEvents.some((row) => row.event === 'contact_rejected') ? <DataTable headers={tableRows('rejected', data, currentRows, selectedViews, selectedContacts, selectedEvents).headers} page={page} pageBase={`${pageBase}&section=rejected`} rows={tableRows('rejected', data, currentRows, selectedViews, selectedContacts, selectedEvents).rows} title="Rejected reasons and attempts" /> : null}
      <div data-share-ignore={metric === 'contact' || metric === 'visitors' ? '' : undefined}><DataTable headers={builtTable.headers} page={page} pageBase={pageBase} rows={builtTable.rows} title={pagePath ? 'Page visits' : `${title} details`} /></div>
      </div>
      <ShareCaptureFooter domain={shareDomain} range={range} />
    </div>
  )
}

async function renderAnalytics({ initPageResult, params, searchParams, user }: AdminViewServerProps, wrapInTemplate: boolean) {
  const req = initPageResult.req
  const authorized = await isAdmin({ req } as Parameters<typeof isAdmin>[0])
  const templateProps = { i18n: req.i18n, locale: initPageResult.locale, params, payload: req.payload, permissions: initPageResult.permissions, searchParams, user, visibleEntities: initPageResult.visibleEntities }
  // Payload already wraps the dashboard view in the default admin template; custom routes are not wrapped.
  const wrap = (content: ReactNode) => (wrapInTemplate ? <DefaultTemplate {...templateProps}>{content}</DefaultTemplate> : <>{content}</>)

  if (!authorized) return wrap(<Gutter><h1>Analytics is for administrators</h1><p>Use the normal admin collections from the sidebar.</p></Gutter>)

  const metricParam = params?.metric
  const metricKey = Array.isArray(metricParam) ? metricParam[0] : metricParam
  const metric = metricKey && validMetrics.has(metricKey) ? metricKey as Metric : null
  const range = metric ? rangeFromParam(searchParams?.range) : 7
  const data = await getAnalyticsData(req.payload, range)
  const shareDomain = analyticsWatermarkDomain()

  return wrap(<Gutter>{metric ? <Detail data={data} metric={metric} searchParams={searchParams} shareDomain={shareDomain} /> : <Dashboard data={data} shareDomain={shareDomain} />}</Gutter>)
}

/** Custom admin routes (`/console/analytics...`): rendered without Payload's template, so wrap it here. */
export async function AnalyticsView(props: AdminViewServerProps) {
  return renderAnalytics(props, true)
}

/** Replaces the default dashboard at `/console`: Payload already adds the template. */
export async function AnalyticsDashboardView(props: AdminViewServerProps) {
  return renderAnalytics(props, false)
}
