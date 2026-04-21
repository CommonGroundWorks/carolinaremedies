/**
 * Design System Transformation Script
 * Converts inline style={{ }} props to Tailwind utility classes.
 * Run once: node scripts/transform-styles.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, relative, join } from 'path'

// ─── Token → Tailwind Class Mappings ─────────────────────────
const SINGLE_PROP_MAP = {
  // Color tokens → text utilities
  "color: 'var(--cream-100)'": 'text-cream-100',
  "color: 'var(--cream-200)'": 'text-cream-200',
  "color: 'var(--cream-300)'": 'text-cream-300',
  "color: 'var(--cream-400)'": 'text-cream-400',
  "color: 'var(--cream-500)'": 'text-cream-500',
  "color: 'var(--cream-600)'": 'text-cream-600',
  "color: 'var(--gold-400)'": 'text-secondary-400',
  "color: 'var(--gold-300)'": 'text-secondary-300',
  "color: 'var(--sage-400)'": 'text-primary-400',
  "color: 'var(--sage-500)'": 'text-primary-500',
  "color: 'var(--ink-900)'": 'text-earth-900',
  "color: '#B85C5C'": 'text-error',

  // Background tokens → bg utilities
  "background: 'var(--ink-900)'": 'bg-earth-900',
  "background: 'var(--ink-800)'": 'bg-earth-800',
  "background: 'var(--ink-700)'": 'bg-earth-700',
  "background: 'var(--gold-400)'": 'bg-secondary-400',
  "background: 'var(--sage-500)'": 'bg-primary-500',
  "background: 'var(--sage-400)'": 'bg-primary-400',

  // Background rgba → bg with opacity
  "background: 'rgba(216,204,175,0.02)'": 'bg-cream-300/[0.02]',
  "background: 'rgba(216,204,175,0.03)'": 'bg-cream-300/[0.03]',
  "background: 'rgba(216,204,175,0.04)'": 'bg-cream-300/[0.04]',
  "background: 'rgba(216,204,175,0.05)'": 'bg-cream-300/5',
  "background: 'rgba(216,204,175,0.06)'": 'bg-cream-300/[0.06]',
  "background: 'rgba(216,204,175,0.08)'": 'bg-cream-300/[0.08]',
  "background: 'rgba(216,204,175,0.1)'": 'bg-cream-300/10',
  "background: 'rgba(216,204,175,0.15)'": 'bg-cream-300/[0.15]',
  "background: 'rgba(216,204,175,0.2)'": 'bg-cream-300/20',
  "background: 'rgba(9,9,10,0.6)'": 'bg-earth-950/60',
  "background: 'rgba(9,9,10,0.7)'": 'bg-earth-950/70',
  "background: 'rgba(17,16,9,0.8)'": 'bg-earth-900/80',
  "background: 'rgba(17,16,9,0.85)'": 'bg-earth-900/[0.85]',
  "background: 'rgba(17,16,9,0.9)'": 'bg-earth-900/90',
  "background: 'rgba(17,16,9,0.95)'": 'bg-earth-900/95',
  "background: 'rgba(17,16,9,0.97)'": 'bg-earth-900/[0.97]',
  "background: 'rgba(80,142,68,0.06)'": 'bg-primary-500/[0.06]',
  "background: 'rgba(80,142,68,0.08)'": 'bg-primary-500/[0.08]',
  "background: 'rgba(80,142,68,0.15)'": 'bg-primary-500/[0.15]',
  "background: 'rgba(80,142,68,0.9)'": 'bg-primary-500/90',
  "background: 'rgba(201,168,76,0.15)'": 'bg-secondary-400/[0.15]',

  // Font family → font utilities
  "fontFamily: 'var(--font-dm-sans)'": 'font-sans',
  "fontFamily: 'var(--font-dm-mono)'": 'font-mono',
  "fontFamily: 'var(--font-cormorant)'": 'font-display',

  // Letter spacing
  "letterSpacing: '-0.03em'": '-tracking-[0.03em]',
  "letterSpacing: '-0.02em'": '-tracking-[0.02em]',
  "letterSpacing: '-0.01em'": '-tracking-[0.01em]',
  "letterSpacing: '0.02em'": 'tracking-[0.02em]',
  "letterSpacing: '0.08em'": 'tracking-[0.08em]',
  "letterSpacing: '0.1em'": 'tracking-[0.1em]',
  "letterSpacing: '0.12em'": 'tracking-[0.12em]',
  "letterSpacing: '0.2em'": 'tracking-[0.2em]',

  // Font sizes
  "fontSize: 'clamp(3.5rem, 9vw, 8rem)'": 'text-display-hero',
  "fontSize: 'clamp(3rem, 8vw, 7rem)'": 'text-display-lg',
  "fontSize: 'clamp(2rem, 4vw, 3.5rem)'": 'text-display-md',
  "fontSize: 'clamp(2rem, 4vw, 3.25rem)'": 'text-display-md',
  "fontSize: 'clamp(1.75rem, 3vw, 2.5rem)'": 'text-display-sm',
  "fontSize: '1.5rem'": 'text-2xl',
  "fontSize: '1.25rem'": 'text-xl',

  // Borders (full property)
  "border: '1px solid rgba(216,204,175,0.05)'": 'border border-cream-300/5',
  "border: '1px solid rgba(216,204,175,0.06)'": 'border border-cream-300/[0.06]',
  "border: '1px solid rgba(216,204,175,0.08)'": 'border border-cream-300/[0.08]',
  "border: '1px solid rgba(216,204,175,0.1)'": 'border border-cream-300/10',
  "border: '1px solid rgba(216,204,175,0.12)'": 'border border-cream-300/[0.12]',
  "border: '1px solid rgba(216,204,175,0.15)'": 'border border-cream-300/[0.15]',
  "border: '1px solid rgba(216,204,175,0.2)'": 'border border-cream-300/20',
  "border: '1px solid rgba(80,142,68,0.2)'": 'border border-primary-500/20',
  "border: '1px solid rgba(80,142,68,0.3)'": 'border border-primary-500/30',
  "borderBottom: '1px solid rgba(216,204,175,0.05)'": 'border-b border-b-cream-300/5',
  "borderBottom: '1px solid rgba(216,204,175,0.08)'": 'border-b border-b-cream-300/[0.08]',
  "borderBottom: '1px solid rgba(216,204,175,0.1)'": 'border-b border-b-cream-300/10',
  "borderTop: '1px solid rgba(216,204,175,0.06)'": 'border-t border-t-cream-300/[0.06]',
  "borderTop: '1px solid rgba(216,204,175,0.08)'": 'border-t border-t-cream-300/[0.08]',
  "borderLeft: '1px solid rgba(216,204,175,0.2)'": 'border-l border-l-cream-300/20',
  "borderColor: 'rgba(216,204,175,0.06)'": 'border-cream-300/[0.06]',
  "borderColor: 'rgba(216,204,175,0.08)'": 'border-cream-300/[0.08]',
  "borderColor: 'rgba(216,204,175,0.1)'": 'border-cream-300/10',
  "borderColor: 'rgba(216,204,175,0.12)'": 'border-cream-300/[0.12]',
  "borderColor: 'rgba(216,204,175,0.15)'": 'border-cream-300/[0.15]',

  // Misc
  "height: '1px'": 'h-px',
  "zIndex: 9999": 'z-[9999]',
}

// ─── Processing Logic ────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Process a single file. Strategy:
 * 1. Find style={{ ... }} occurrences
 * 2. For each, try to map ALL properties to Tailwind classes
 * 3. If all map: remove style, add classes to className
 * 4. If some map: remove mapped props, add classes
 * 5. If none map: leave as-is
 */
function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8')
  const original = content
  let totalTransformed = 0

  // Phase 1: Handle simple single-property styles on same line as className
  // Pattern: className="..." style={{ prop }}
  for (const [prop, twClass] of Object.entries(SINGLE_PROP_MAP)) {
    const escapedProp = escapeRegex(prop)

    // className="..." [whitespace] style={{ prop }}
    const re1 = new RegExp(
      `(className="[^"]*)(")([\\s]*)style=\\{\\{\\s*${escapedProp}\\s*\\}\\}`,
      'g'
    )
    const before1 = content
    content = content.replace(re1, `$1 ${twClass}$2$3`)
    if (content !== before1) totalTransformed += (before1.match(re1) || []).length

    // style={{ prop }} [whitespace] className="..."
    const re2 = new RegExp(
      `style=\\{\\{\\s*${escapedProp}\\s*\\}\\}([\\s]*)(className="[^"]*)(")`,
      'g'
    )
    const before2 = content
    content = content.replace(re2, `$1$2 ${twClass}$3`)
    if (content !== before2) totalTransformed += (before2.match(re2) || []).length
  }

  // Phase 2: Handle styles on their own line (className on nearby line)
  // Pattern: className="..." \n [stuff] \n style={{ prop }}
  for (const [prop, twClass] of Object.entries(SINGLE_PROP_MAP)) {
    const escapedProp = escapeRegex(prop)

    // className on previous lines, style on current line (with 0-2 lines between)
    const re3 = new RegExp(
      `(className="[^"]*)(")([^>]{0,200}?)\\s*style=\\{\\{\\s*${escapedProp}\\s*\\}\\}`,
      'gs'
    )
    const before3 = content
    content = content.replace(re3, (match, cls, quote, between) => {
      // Only match if we haven't crossed a > boundary (same tag)
      if (between.includes('>')) return match
      return `${cls} ${twClass}${quote}${between}`
    })
    if (content !== before3) totalTransformed++

    // style on line before className
    const re4 = new RegExp(
      `style=\\{\\{\\s*${escapedProp}\\s*\\}\\}([^>]{0,200}?)(className="[^"]*)(")`,
      'gs'
    )
    const before4 = content
    content = content.replace(re4, (match, between, cls, quote) => {
      if (between.includes('>')) return match
      return `${between}${cls} ${twClass}${quote}`
    })
    if (content !== before4) totalTransformed++
  }

  // Phase 3: Handle compound styles (2-3 properties)
  // Map each known property, remove from style, merge classes
  content = processCompoundStyles(content)

  // Phase 4: Clean up empty style={{ }} that might remain
  content = content.replace(/\s*style=\{\{\s*\}\}/g, '')

  // Phase 5: Clean up multiple consecutive blank lines
  content = content.replace(/\n{3,}/g, '\n\n')

  // Phase 6: Clean up trailing whitespace on lines
  content = content.replace(/[ \t]+$/gm, '')

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8')
    return { changed: true, transforms: totalTransformed }
  }
  return { changed: false, transforms: 0 }
}

function processCompoundStyles(content) {
  // Find all style={{ ... }} blocks (multi-line)
  const styleBlockRe = /style=\{\{([\s\S]*?)\}\}/g
  let match

  while ((match = styleBlockRe.exec(content)) !== null) {
    const fullMatch = match[0]
    const styleContent = match[1]
    const startIdx = match.index

    // Parse individual properties
    // Split on commas that aren't inside parens
    const props = splitStyleProps(styleContent)
    const mappedClasses = []
    const unmappedProps = []

    for (const prop of props) {
      const trimmed = prop.trim()
      if (!trimmed) continue

      const mapped = SINGLE_PROP_MAP[trimmed]
      if (mapped) {
        mappedClasses.push(mapped)
      } else {
        unmappedProps.push(trimmed)
      }
    }

    if (mappedClasses.length === 0) continue

    // Build new style (if any unmapped props remain)
    let newStyle = ''
    if (unmappedProps.length > 0) {
      newStyle = `style={{ ${unmappedProps.join(', ')} }}`
    }

    // Replace the old style with new style (or nothing)
    const before = content.slice(0, startIdx)
    const after = content.slice(startIdx + fullMatch.length)
    content = before + newStyle + after

    // Now add the classes to the className on this element
    const classesToAdd = mappedClasses.join(' ')

    // Search backwards for className=" in the same tag
    const searchBack = content.slice(Math.max(0, startIdx - 500), startIdx)
    const classBackMatch = searchBack.match(/className="([^"]*)"\s*$/)

    if (classBackMatch) {
      const classEndInSearch = searchBack.lastIndexOf(classBackMatch[0]) + classBackMatch[0].length - 1
      const absolutePos = Math.max(0, startIdx - 500) + classEndInSearch
      // Insert before the closing quote
      content = content.slice(0, absolutePos) + ' ' + classesToAdd + content.slice(absolutePos)
    } else {
      // Search forward for className
      const searchFwd = content.slice(startIdx, startIdx + 300)
      const classFwdMatch = searchFwd.match(/className="([^"]*)"/)
      if (classFwdMatch) {
        const classFwdIdx = startIdx + searchFwd.indexOf(classFwdMatch[0])
        const insertPos = classFwdIdx + classFwdMatch[0].length - 1
        content = content.slice(0, insertPos) + ' ' + classesToAdd + content.slice(insertPos)
      } else if (newStyle === '') {
        // No className found and no remaining style — insert a className
        content = content.slice(0, startIdx) + `className="${classesToAdd}"` + content.slice(startIdx)
      }
    }

    // Reset regex since content changed
    styleBlockRe.lastIndex = 0
  }

  return content
}

function splitStyleProps(styleContent) {
  // Split CSS properties in a style object on commas,
  // but not commas inside parentheses (e.g., rgba(...))
  const props = []
  let depth = 0
  let current = ''

  for (const ch of styleContent) {
    if (ch === '(' || ch === '{') depth++
    else if (ch === ')' || ch === '}') depth--
    else if (ch === ',' && depth === 0) {
      props.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) props.push(current.trim())
  return props
}

// ─── Main Execution ──────────────────────────────────────────
const ROOT = resolve(import.meta.dirname, '..')

function findTsxFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...findTsxFiles(fullPath))
    } else if (entry.name.endsWith('.tsx')) {
      results.push(fullPath)
    }
  }
  return results
}

const files = findTsxFiles(join(ROOT, 'src'))
console.log(`\n🎨 Design System Transform — processing ${files.length} files...\n`)

let totalChanged = 0
for (const file of files) {
  const rel = relative(ROOT, file)
  const result = processFile(file)
  if (result.changed) {
    console.log(`  ✓ ${rel} (${result.transforms}+ transforms)`)
    totalChanged++
  }
}

console.log(`\n✅ Done — ${totalChanged} files modified.\n`)
console.log('⚠️  Review changes and fix remaining complex styles manually.')
console.log('   Run: npx tsc --noEmit to verify types.\n')
