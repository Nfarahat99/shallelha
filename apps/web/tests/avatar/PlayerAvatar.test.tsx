import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerAvatar } from '../../components/avatar/PlayerAvatar'
import { DEFAULT_AVATAR_CONFIG, PALETTES } from '../../components/avatar/avatar-parts'

describe('PlayerAvatar', () => {
  test('renders SVG with role="img"', () => {
    render(<PlayerAvatar />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    expect(svg.tagName.toLowerCase()).toBe('svg')
  })

  test('palette 1 renders skin fill matching #F5CBA7', () => {
    render(<PlayerAvatar config={{ faceShape: 1, headwear: 'none', colorPalette: 1 }} />)
    const svg = screen.getByRole('img')
    // Check the base circle has the palette 1 skin color
    const circles = svg.querySelectorAll('circle')
    const skinCircle = Array.from(circles).find(c => c.getAttribute('fill') === PALETTES[1].skin)
    expect(skinCircle).toBeDefined()
  })

  test('headwear="none" renders no headwear group', () => {
    render(<PlayerAvatar config={{ faceShape: 1, headwear: 'none', colorPalette: 1 }} />)
    const svg = screen.getByRole('img')
    // There should be no path element for headwear
    const paths = svg.querySelectorAll('path')
    expect(paths.length).toBe(0)
  })

  test('headwear="ghutra" renders headwear path', () => {
    render(<PlayerAvatar config={{ faceShape: 1, headwear: 'ghutra', colorPalette: 1 }} />)
    const svg = screen.getByRole('img')
    const paths = svg.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  test('null config falls back to DEFAULT_AVATAR_CONFIG', () => {
    render(<PlayerAvatar config={null} />)
    const svg = screen.getByRole('img')
    expect(svg).toBeInTheDocument()
    // Should use default palette skin color
    const circles = svg.querySelectorAll('circle')
    const defaultSkin = PALETTES[DEFAULT_AVATAR_CONFIG.colorPalette].skin
    const skinCircle = Array.from(circles).find(c => c.getAttribute('fill') === defaultSkin)
    expect(skinCircle).toBeDefined()
  })

  test('size prop controls width and height', () => {
    render(<PlayerAvatar size={128} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '128')
    expect(svg).toHaveAttribute('height', '128')
  })

  test('default size is 64', () => {
    render(<PlayerAvatar />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  test('headwear="hijab" renders hijab path', () => {
    render(<PlayerAvatar config={{ faceShape: 1, headwear: 'hijab', colorPalette: 2 }} />)
    const svg = screen.getByRole('img')
    const paths = svg.querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
  })

  test('faceShape=2 renders an additional ellipse overlay', () => {
    render(<PlayerAvatar config={{ faceShape: 2, headwear: 'none', colorPalette: 1 }} />)
    const svg = screen.getByRole('img')
    const ellipses = svg.querySelectorAll('ellipse')
    expect(ellipses.length).toBeGreaterThan(0)
  })

  test('faceShape=1 renders no ellipse overlay', () => {
    render(<PlayerAvatar config={{ faceShape: 1, headwear: 'none', colorPalette: 1 }} />)
    const svg = screen.getByRole('img')
    const ellipses = svg.querySelectorAll('ellipse')
    expect(ellipses.length).toBe(0)
  })
})
