'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ChartPoint = { label: string; [key: string]: string | number }
export type ChartSeries = { key: string; label: string; color?: string }

const lime = '#d4f03c'
const green = 'var(--theme-success-500, #4c711c)'
const foreground = 'var(--theme-text, #222)'
const grid = 'var(--theme-elevation-150, #ddd)'

function TooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: string | number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ border: `1px solid ${grid}`, borderRadius: 8, padding: '8px 10px', background: 'var(--theme-elevation-0, white)', color: foreground, fontSize: 12 }}>
      {label ? <strong style={{ display: 'block', marginBottom: 4 }}>{label}</strong> : null}
      {payload.map((item) => <div key={item.name} style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}><span>{item.name}</span><strong>{Number(item.value ?? 0).toLocaleString('en')}</strong></div>)}
    </div>
  )
}

function ChartFrame({ title, summary, height, children }: { title: string; summary: string; height: number; children: React.ReactNode }) {
  return (
    <section aria-label={summary} role="img" style={{ display: 'grid', alignContent: 'start', alignSelf: 'stretch', height: '100%', border: `1px solid ${grid}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <h2 style={{ margin: '0 0 12px', color: foreground, fontSize: 17 }}>{title}</h2>
      <div style={{ width: '100%', height }}>
        {children}
      </div>
    </section>
  )
}

export function TrendChart({ title, summary, data, series, height = 280 }: { title: string; summary: string; data: ChartPoint[]; series: ChartSeries[]; height?: number }) {
  if (!data.length || !series.length || !data.some((point) => series.some((item) => Number(point[item.key] ?? 0) > 0))) return <ChartFrame height={112} summary={summary} title={title}><p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>No data yet</p></ChartFrame>
  return (
    <ChartFrame height={height} summary={summary} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tick={{ fill: foreground, fontSize: 11 }} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tick={{ fill: foreground, fontSize: 11 }} tickLine={false} width={38} />
          <Tooltip content={<TooltipContent />} />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item, index) => {
            const color = item.color ?? (index === 0 ? lime : green)
            return <Area activeDot={{ r: 4, stroke: foreground, strokeWidth: 1 }} dataKey={item.key} fill={color} fillOpacity={0.18} key={item.key} name={item.label} stroke={color} strokeWidth={3} type="monotone" />
          })}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function Sparkline({ title, data, dataKey = 'count' }: { title: string; data: ChartPoint[]; dataKey?: string }) {
  const hasData = data.some((point) => Number(point[dataKey] ?? point.visits ?? point.visitors ?? 0) > 0)
  return (
    <div aria-label={`${title} trend over the last seven days`} role="img" style={{ height: 38, width: '100%' }}>
      {data.length && hasData ? <ResponsiveContainer height="100%" width="100%"><AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}><Area dataKey={dataKey} fill={lime} fillOpacity={0.2} isAnimationActive={false} stroke={green} strokeWidth={2} type="monotone" /></AreaChart></ResponsiveContainer> : <span style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>No data yet</span>}
    </div>
  )
}

export function TopBarChart({ title, summary, data, dataKey = 'count', height = 260 }: { title: string; summary: string; data: ChartPoint[]; dataKey?: string; height?: number }) {
  if (!data.length || !data.some((point) => Number(point[dataKey] ?? 0) > 0)) return <ChartFrame height={112} summary={summary} title={title}><p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>No data yet</p></ChartFrame>
  return (
    <ChartFrame height={height} summary={summary} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 14, left: 8, bottom: 2 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis allowDecimals={false} type="number" tick={{ fill: foreground, fontSize: 11 }} />
          <YAxis dataKey="label" type="category" width={138} tick={{ fill: foreground, fontSize: 11 }} />
          <Tooltip content={<TooltipContent />} />
          <Bar dataKey={dataKey} fill={lime} maxBarSize={22} name="Visits" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function StackedBarChart({ title, summary, data, series, height = 300 }: { title: string; summary: string; data: ChartPoint[]; series: ChartSeries[]; height?: number }) {
  if (!data.length || !series.length || !data.some((point) => series.some((item) => Number(point[item.key] ?? 0) > 0))) return <ChartFrame height={112} summary={summary} title={title}><p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>No data yet</p></ChartFrame>
  const colors = [lime, green, 'var(--theme-elevation-600)', '#8da535', '#c1d77a', '#b66f27', '#607d8b']
  return (
    <ChartFrame height={height} summary={summary} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tick={{ fill: foreground, fontSize: 11 }} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tick={{ fill: foreground, fontSize: 11 }} tickLine={false} width={38} />
          <Tooltip content={<TooltipContent />} />
          <Legend />
          {series.map((item, index) => <Bar dataKey={item.key} fill={item.color ?? colors[index % colors.length]} key={item.key} name={item.label} stackId="events" />)}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function SharePieChart({ title, summary, data, height = 290 }: { title: string; summary: string; data: Array<{ label: string; count: number }>; height?: number }) {
  if (!data.length) return <ChartFrame height={112} summary={summary} title={title}><p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>No data yet</p></ChartFrame>
  const colors = [lime, green, 'var(--theme-elevation-600)', '#8da535', '#c1d77a', '#b66f27', '#607d8b']
  return (
    <ChartFrame height={height} summary={summary} title={title}>
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Tooltip content={<TooltipContent />} />
          <Legend />
          <Pie data={data} dataKey="count" innerRadius="48%" nameKey="label" outerRadius="78%" paddingAngle={2}>
            {data.map((entry, index) => <Cell fill={colors[index % colors.length]} key={`${entry.label}-${index}`} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
