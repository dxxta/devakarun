import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { numericToAlpha2 } from 'i18n-iso-countries'
import type { GeometryCollection, Topology } from 'topojson-specification'
import atlas from 'world-atlas/countries-110m.json'

type AtlasObjects = { countries: GeometryCollection<{ name?: string }> }
type AtlasTopology = Topology<AtlasObjects>

const fills = ['#f3f8c9', '#d4f03c', '#a7c22a', '#6d8722', '#33451b']
const unknownFill = 'var(--theme-elevation-100, #e5e7eb)'

function getFill(value: number, thresholds: number[]): string {
  if (value <= 0) return unknownFill
  let level = 0
  for (const threshold of thresholds) if (value > threshold) level += 1
  return fills[Math.min(fills.length - 1, level)]
}

export function CountryWorldMap({ counts, compact = false }: { counts: Record<string, number>; compact?: boolean }) {
  const topology = atlas as unknown as AtlasTopology
  const countries = feature(topology, topology.objects.countries).features
  const projection = geoNaturalEarth1().fitSize(compact ? [760, 340] : [1000, 470], { type: 'FeatureCollection', features: countries })
  const path = geoPath(projection)
  const values = Object.values(counts).filter((value) => value > 0).sort((a, b) => a - b)
  const thresholds = [0.2, 0.4, 0.6, 0.8].map((quantile) => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * quantile))] : Number.POSITIVE_INFINITY)
  const minimum = values[0] ?? 0
  const maximum = values.at(-1) ?? 0
  const width = compact ? 760 : 1000
  const height = compact ? 340 : 470

  return (
    <section style={{ display: 'grid', alignContent: 'start', alignSelf: 'start', gap: 10, border: '1px solid var(--theme-elevation-150)', borderRadius: 10, padding: 16, minWidth: 0 }}>
      <h2 style={{ margin: 0, color: 'var(--theme-text)', fontSize: 17 }}>Visits by country</h2>
      {values.length ? <>
        <svg aria-label="World map shaded by visit count for countries with recorded visits. The country table provides the same data." role="img" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
          {countries.map((country) => {
            const numeric = String(country.id ?? '')
            const alpha2 = numericToAlpha2(numeric)
            const count = alpha2 ? counts[alpha2] ?? 0 : 0
            const name = country.properties?.name ?? alpha2 ?? 'Unknown'
            const d = path(country)
            return d ? <path aria-label={`${name}: ${count.toLocaleString('en')} visits`} d={d} fill={getFill(count, thresholds)} key={numeric} stroke="var(--theme-elevation-400, #999)" strokeWidth={0.35} tabIndex={0}><title>{name}: {count.toLocaleString('en')} visits</title></path> : null
          })}
        </svg>
        <div aria-label={`Map legend, values range from ${minimum} to ${maximum} visits`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--theme-elevation-700)', flexWrap: 'wrap' }}>
          <span>{minimum.toLocaleString('en')}</span>
          {fills.map((fill, index) => <span aria-label={`Map level ${index + 1}`} key={fill} style={{ display: 'inline-block', width: 24, height: 12, border: '1px solid var(--theme-elevation-300)', borderRadius: 3, background: fill }} />)}
          <span>{maximum.toLocaleString('en')} visits</span>
          <span style={{ marginLeft: 'auto' }}>Grey: no data</span>
        </div>
      </> : <p style={{ margin: 0, color: 'var(--theme-elevation-600)' }}>No data yet</p>}
    </section>
  )
}
