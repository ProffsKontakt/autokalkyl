/**
 * Tests for season utilities.
 *
 * Tests winter month detection and high-load hour determination
 * for natagare-specific tariff timing configuration.
 *
 * @see NATA-14 for requirements
 */

import { isWinterMonth, isHighLoadHour } from './season'

describe('isWinterMonth', () => {
  it('returns true for January (month 0)', () => {
    expect(isWinterMonth(0)).toBe(true)
  })

  it('returns true for February (month 1)', () => {
    expect(isWinterMonth(1)).toBe(true)
  })

  it('returns true for March (month 2)', () => {
    expect(isWinterMonth(2)).toBe(true)
  })

  it('returns false for April (month 3)', () => {
    expect(isWinterMonth(3)).toBe(false)
  })

  it('returns false for summer months (4-9)', () => {
    for (let month = 4; month <= 9; month++) {
      expect(isWinterMonth(month)).toBe(false)
    }
  })

  it('returns false for October (month 9)', () => {
    expect(isWinterMonth(9)).toBe(false)
  })

  it('returns true for November (month 10)', () => {
    expect(isWinterMonth(10)).toBe(true)
  })

  it('returns true for December (month 11)', () => {
    expect(isWinterMonth(11)).toBe(true)
  })
})

describe('isHighLoadHour', () => {
  const defaultConfig = {}

  describe('with default config (07:00-20:00, not winter-only)', () => {
    it('returns true for hour 7 (start of high-load)', () => {
      expect(isHighLoadHour(7, 0, defaultConfig)).toBe(true)
    })

    it('returns false for hour 6 (before high-load)', () => {
      expect(isHighLoadHour(6, 0, defaultConfig)).toBe(false)
    })

    it('returns true for hour 19 (last high-load hour)', () => {
      expect(isHighLoadHour(19, 0, defaultConfig)).toBe(true)
    })

    it('returns false for hour 20 (after high-load)', () => {
      expect(isHighLoadHour(20, 0, defaultConfig)).toBe(false)
    })

    it('returns true for midday hour 12', () => {
      expect(isHighLoadHour(12, 0, defaultConfig)).toBe(true)
    })

    it('returns false for midnight hour 0', () => {
      expect(isHighLoadHour(0, 0, defaultConfig)).toBe(false)
    })
  })

  describe('with custom high-load hours', () => {
    const customConfig = { highLoadStartHour: 6, highLoadEndHour: 23 }

    it('respects custom start hour', () => {
      expect(isHighLoadHour(6, 0, customConfig)).toBe(true)
      expect(isHighLoadHour(5, 0, customConfig)).toBe(false)
    })

    it('respects custom end hour', () => {
      expect(isHighLoadHour(22, 0, customConfig)).toBe(true)
      expect(isHighLoadHour(23, 0, customConfig)).toBe(false)
    })
  })

  describe('with winter-only flag', () => {
    const winterOnlyConfig = { isWinterOnlyHighLoad: true }

    it('returns true in winter month (January)', () => {
      expect(isHighLoadHour(10, 0, winterOnlyConfig)).toBe(true)
    })

    it('returns true in winter month (November)', () => {
      expect(isHighLoadHour(10, 10, winterOnlyConfig)).toBe(true)
    })

    it('returns false in summer month (July) even during high-load hours', () => {
      expect(isHighLoadHour(10, 6, winterOnlyConfig)).toBe(false)
    })

    it('returns false in summer month (April) even during high-load hours', () => {
      expect(isHighLoadHour(10, 3, winterOnlyConfig)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles undefined config values with defaults', () => {
      expect(isHighLoadHour(10, 0, {})).toBe(true)
      expect(isHighLoadHour(5, 0, {})).toBe(false)
    })

    it('handles boundary between winter and summer (March/April)', () => {
      const winterOnly = { isWinterOnlyHighLoad: true }
      expect(isHighLoadHour(10, 2, winterOnly)).toBe(true)  // March = winter
      expect(isHighLoadHour(10, 3, winterOnly)).toBe(false) // April = summer
    })

    it('handles boundary between summer and winter (October/November)', () => {
      const winterOnly = { isWinterOnlyHighLoad: true }
      expect(isHighLoadHour(10, 9, winterOnly)).toBe(false)  // October = summer
      expect(isHighLoadHour(10, 10, winterOnly)).toBe(true)  // November = winter
    })
  })
})
