import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AvatarBuilder } from '../../components/avatar/AvatarBuilder'
import { DEFAULT_AVATAR_CONFIG, AVATAR_STORAGE_KEY } from '../../components/avatar/avatar-parts'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => {
  localStorageMock.clear()
})

describe('AvatarBuilder', () => {
  test('renders confirm button with Arabic label', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    expect(screen.getByText('تأكيد الشخصية')).toBeInTheDocument()
  })

  test('shows 3 face shape options', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    expect(screen.getByText('مستدير')).toBeInTheDocument()
    expect(screen.getByText('عريض')).toBeInTheDocument()
    expect(screen.getByText('بيضاوي')).toBeInTheDocument()
  })

  test('shows 4 headwear options', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    expect(screen.getByText('بدون')).toBeInTheDocument()
    expect(screen.getByText('غترة')).toBeInTheDocument()
    expect(screen.getByText('حجاب')).toBeInTheDocument()
    expect(screen.getByText('كاب')).toBeInTheDocument()
  })

  test('shows 5 color palette swatches', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    // Each palette button has aria-label "لون N"
    for (let n = 1; n <= 5; n++) {
      expect(screen.getByLabelText(`لون ${n}`)).toBeInTheDocument()
    }
  })

  test('shows live PlayerAvatar preview (SVG with role="img")', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    const preview = screen.getByRole('img')
    expect(preview).toBeInTheDocument()
    expect(preview.tagName.toLowerCase()).toBe('svg')
  })

  test('calls onConfirm with current config when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<AvatarBuilder onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('تأكيد الشخصية'))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      faceShape: expect.any(Number),
      headwear: expect.any(String),
      colorPalette: expect.any(Number),
    }))
  })

  test('saves config to localStorage on confirm', () => {
    render(<AvatarBuilder onConfirm={() => {}} />)
    fireEvent.click(screen.getByText('تأكيد الشخصية'))
    const stored = localStorageMock.getItem(AVATAR_STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveProperty('faceShape')
    expect(parsed).toHaveProperty('headwear')
    expect(parsed).toHaveProperty('colorPalette')
  })

  test('loads saved config from localStorage on mount', () => {
    const savedConfig = { faceShape: 3, headwear: 'hijab', colorPalette: 4 }
    localStorageMock.setItem(AVATAR_STORAGE_KEY, JSON.stringify(savedConfig))

    render(<AvatarBuilder onConfirm={() => {}} />)

    // Check that the live preview SVG reflects the loaded config
    // The palette 4 skin color is #8B6914 — check that the preview circle has that fill
    const svg = screen.getByRole('img')
    const circles = svg.querySelectorAll('circle')
    const skinCircle = Array.from(circles).find(c => c.getAttribute('fill') === '#8B6914')
    expect(skinCircle).toBeDefined()
  })

  test('selecting a face shape updates the preview', () => {
    const onConfirm = vi.fn()
    render(<AvatarBuilder onConfirm={onConfirm} />)

    // Click "بيضاوي" (faceShape=3) — confirms with updated shape
    fireEvent.click(screen.getByText('بيضاوي'))
    fireEvent.click(screen.getByText('تأكيد الشخصية'))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ faceShape: 3 }))
  })

  test('selecting a headwear option updates confirm payload', () => {
    const onConfirm = vi.fn()
    render(<AvatarBuilder onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText('غترة'))
    fireEvent.click(screen.getByText('تأكيد الشخصية'))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ headwear: 'ghutra' }))
  })

  test('selecting a palette swatch updates confirm payload', () => {
    const onConfirm = vi.fn()
    render(<AvatarBuilder onConfirm={onConfirm} />)

    fireEvent.click(screen.getByLabelText('لون 3'))
    fireEvent.click(screen.getByText('تأكيد الشخصية'))

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ colorPalette: 3 }))
  })

  test('corrupted localStorage does not crash — uses DEFAULT_AVATAR_CONFIG', () => {
    localStorageMock.setItem(AVATAR_STORAGE_KEY, 'not-valid-json{{{')

    // Should render without throwing
    expect(() => render(<AvatarBuilder onConfirm={() => {}} />)).not.toThrow()

    // Preview should use default palette skin color
    const svg = screen.getByRole('img')
    const circles = svg.querySelectorAll('circle')
    const defaultSkin = '#F5CBA7' // PALETTES[1].skin = DEFAULT_AVATAR_CONFIG.colorPalette
    const skinCircle = Array.from(circles).find(c => c.getAttribute('fill') === defaultSkin)
    expect(skinCircle).toBeDefined()
  })
})
