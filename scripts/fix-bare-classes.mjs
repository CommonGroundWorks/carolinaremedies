/**
 * Fix bare Tailwind classes left by the compound handler bug.
 * These appear as lines with only Tailwind classes that should be inside className="".
 * Pattern: className="existing"\n   bare-classes\n>
 * Fix:     className="existing bare-classes"\n>
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, relative, join } from 'path'

const ROOT = resolve(import.meta.dirname, '..')

// Tailwind class pattern (matches lines that are ONLY tailwind classes + maybe a style={{ }})
const BARE_CLASS_RE = /^(\s+)((?:(?:text-|bg-|border-|tracking-|-tracking-|font-|h-px|z-\[)[^\s]*\s*)+)(style=\{\{[^}]*\}\})?\s*$/

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

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const newLines = []
  let fixed = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(BARE_CLASS_RE)

    if (match) {
      const bareClasses = match[2].trim()
      const remainingStyle = match[3] || ''

      // Look backwards for the className="..." on a previous line
      let merged = false
      for (let j = newLines.length - 1; j >= Math.max(0, newLines.length - 5); j--) {
        const prevLine = newLines[j]
        // Find className="..." in the previous line
        const classNameIdx = prevLine.lastIndexOf('className="')
        if (classNameIdx !== -1) {
          // Find the closing quote
          const afterClassName = prevLine.slice(classNameIdx + 'className="'.length)
          const closingQuote = afterClassName.indexOf('"')
          if (closingQuote !== -1) {
            const absoluteQuotePos = classNameIdx + 'className="'.length + closingQuote
            // Insert bare classes before closing quote
            newLines[j] = prevLine.slice(0, absoluteQuotePos) + ' ' + bareClasses + prevLine.slice(absoluteQuotePos)
            // If there's a remaining style, keep it on this line
            if (remainingStyle) {
              newLines.push(match[1] + remainingStyle)
            }
            merged = true
            fixed++
            break
          }
        }
      }

      if (!merged) {
        // Couldn't find className, leave as-is but wrap in className
        newLines.push(match[1] + `className="${bareClasses}"` + (remainingStyle ? ' ' + remainingStyle : ''))
        fixed++
      }
    } else {
      newLines.push(line)
    }
  }

  if (fixed > 0) {
    writeFileSync(filePath, newLines.join('\n'), 'utf8')
  }
  return fixed
}

const files = findTsxFiles(join(ROOT, 'src'))
console.log(`\n🔧 Fixing bare Tailwind classes in ${files.length} files...\n`)

let totalFixed = 0
for (const file of files) {
  const count = processFile(file)
  if (count > 0) {
    console.log(`  ✓ ${relative(ROOT, file)} — ${count} fixes`)
    totalFixed += count
  }
}

console.log(`\n✅ Fixed ${totalFixed} bare class instances.\n`)
