import { describe, it, expect } from 'vitest'
import { tokens } from '@/styles/theme'

describe('design tokens', () => {
  it('exports brand colors with emerald and gold', () => {
    expect(tokens.brand.emerald[500]).toBe('#10B981')
    expect(tokens.brand.gold[500]).toBe('#D4AF37')
  })

  it('exports cluster chart palette', () => {
    expect(tokens.chart.cluster.high).toBe('#10B981')
    expect(tokens.chart.cluster.medium).toBe('#D4AF37')
    expect(tokens.chart.cluster.low).toBe('#EF4444')
  })
})
