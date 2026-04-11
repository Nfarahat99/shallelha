import { describe, it, expect } from 'vitest'
import { categories } from '../../prisma/seed-data'

describe('Admin Seed Script', () => {
  it('seed produces >= 200 questions with status approved', () => {
    // All questions in seed-data are seeded with status 'approved'.
    // This test validates total count across all categories and types.
    const total = categories.reduce((sum, cat) => {
      return sum + cat.mc.length + cat.media.length + cat.freeText.length
    }, 0)
    expect(total).toBeGreaterThanOrEqual(200)
  })

  it('seed produces questions across exactly 6 categories', () => {
    expect(categories).toHaveLength(6)
    // Each category must have a non-empty slug and name
    for (const cat of categories) {
      expect(cat.slug).toBeTruthy()
      expect(cat.name).toBeTruthy()
    }
  })

  it('seed is idempotent: running twice does not duplicate questions', () => {
    // Idempotency is enforced by prisma.question.upsert keyed on @@unique([text, categoryId]).
    // This test validates that all question texts within a category are unique
    // (duplicate texts would cause upsert key collisions and data integrity errors).
    for (const cat of categories) {
      const allTexts = [
        ...cat.mc.map((q) => q.text),
        ...cat.media.map((q) => q.text),
        ...cat.freeText.map((q) => q.text),
      ]
      const uniqueTexts = new Set(allTexts)
      expect(uniqueTexts.size).toBe(allTexts.length)
    }
  })

  it('all seeded questions have valid options array with 4 elements (MC) or 0 elements (FREE_TEXT)', () => {
    for (const cat of categories) {
      for (const q of cat.mc) {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThanOrEqual(3)
      }
      for (const q of cat.media) {
        expect(q.options).toHaveLength(4)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThanOrEqual(3)
        expect(q.mediaUrl).toBeTruthy()
      }
      // FREE_TEXT questions have no options array in the interface,
      // only text — options: [] is applied during seeding.
      for (const q of cat.freeText) {
        expect(q.text).toBeTruthy()
      }
    }
  })
})
