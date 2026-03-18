import { useState, useCallback, useEffect } from 'react'
import './App.css'

const DEFAULT_MARKDOWN = `# Welcome to MD Slides

Your markdown presentation tool

---

## How It Works

- Write markdown in the **left panel**
- Separate slides with \`---\` (horizontal rule)
- Use *italic*, **bold**, and \`code\` formatting
- Add lists, blockquotes, and images

> Tip: Use keyboard arrows to navigate slides

---

## Get Started

1. Edit this markdown
2. Click **Present** for fullscreen
3. Click **Export HTML** to download

\`\`\`js
const slides = markdown.split('---');
console.log('Slides:', slides.length);
\`\`\`

Happy presenting!`

function parseMarkdown(md: string): string {
  let html = md

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`
  })

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>')

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
  // Wrap consecutive <li> not already in <ul> into <ol>
  html = html.replace(/(?<!<\/ul>)(<li>.*<\/li>\n?)+/g, (match) => {
    if (!match.includes('<ul>')) return `<ol>${match}</ol>`
    return match
  })

  // Paragraphs: wrap remaining lines
  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<(h[1-4]|ul|ol|li|pre|blockquote|img)/.test(trimmed)) return trimmed
      if (trimmed.startsWith('<')) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')

  return html
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateExportHtml(slides: string[]): string {
  const slidesHtml = slides
    .map((s, i) => `<div class="slide" id="slide-${i}">${s}</div>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Presentation</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; background: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.slide { display: none; background: #fff; border-radius: 8px; padding: 64px 80px; width: 1000px; max-width: 90vw; min-height: 500px; color: #222; font-size: 20px; line-height: 1.7; flex-direction: column; justify-content: center; }
.slide.active { display: flex; }
.slide h1 { font-size: 48px; margin-bottom: 16px; color: #111; }
.slide h2 { font-size: 36px; margin-bottom: 12px; color: #222; }
.slide h3 { font-size: 22px; margin-bottom: 10px; }
.slide p { margin-bottom: 12px; }
.slide ul, .slide ol { padding-left: 24px; margin-bottom: 12px; }
.slide li { margin-bottom: 4px; }
.slide code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
.slide pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 12px; }
.slide pre code { background: none; padding: 0; color: inherit; }
.slide blockquote { border-left: 4px solid #7c83ff; padding: 8px 16px; margin-bottom: 12px; background: #f8f8ff; color: #555; }
.slide img { max-width: 100%; border-radius: 6px; }
.slide a { color: #7c83ff; }
nav { position: fixed; bottom: 24px; display: flex; gap: 16px; align-items: center; }
nav button { background: rgba(255,255,255,0.15); color: #fff; border: none; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-size: 14px; }
nav span { color: rgba(255,255,255,0.6); font-size: 13px; }
</style>
</head>
<body>
${slidesHtml}
<nav>
<button onclick="go(-1)">Prev</button>
<span id="counter"></span>
<button onclick="go(1)">Next</button>
</nav>
<script>
let cur = 0;
const slides = document.querySelectorAll('.slide');
function show() {
  slides.forEach((s, i) => s.classList.toggle('active', i === cur));
  document.getElementById('counter').textContent = (cur + 1) + ' / ' + slides.length;
}
function go(d) { cur = Math.max(0, Math.min(slides.length - 1, cur + d)); show(); }
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') go(1);
  if (e.key === 'ArrowLeft') go(-1);
  if (e.key === 'Escape') window.close();
});
show();
</script>
</body>
</html>`
}

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [presenting, setPresenting] = useState(false)

  const slides = markdown
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseMarkdown)

  const totalSlides = slides.length

  const goTo = useCallback(
    (dir: number) => {
      setCurrentSlide((prev) => Math.max(0, Math.min(totalSlides - 1, prev + dir)))
    },
    [totalSlides]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === ' ') goTo(1)
      if (e.key === 'ArrowLeft') goTo(-1)
      if (e.key === 'Escape') setPresenting(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goTo])

  // Keep slide index in bounds when slides change
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(totalSlides - 1)
    }
  }, [totalSlides, currentSlide])

  const handleExport = () => {
    const html = generateExportHtml(slides)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'presentation.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const slideHtml = slides[currentSlide] || '<p>No slides yet</p>'

  return (
    <>
      <header className="app-header">
        <h1>MD Slides</h1>
        <div className="header-actions">
          <button className="btn btn-present" onClick={() => setPresenting(true)}>
            Present
          </button>
          <button className="btn btn-export" onClick={handleExport}>
            Export HTML
          </button>
        </div>
      </header>

      <div className="split-layout">
        <div className="editor-panel">
          <label>Markdown</label>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="preview-panel">
          <div className="slide-nav">
            <button onClick={() => goTo(-1)} disabled={currentSlide === 0}>
              Prev
            </button>
            <span className="slide-counter">
              Slide {currentSlide + 1} of {totalSlides}
            </span>
            <button onClick={() => goTo(1)} disabled={currentSlide >= totalSlides - 1}>
              Next
            </button>
          </div>
          <div className="slide-container">
            <div className="slide" dangerouslySetInnerHTML={{ __html: slideHtml }} />
          </div>
        </div>
      </div>

      {presenting && (
        <div className="fullscreen-overlay">
          <button className="fullscreen-exit" onClick={() => setPresenting(false)}>
            Exit (Esc)
          </button>
          <div className="slide" dangerouslySetInnerHTML={{ __html: slideHtml }} />
          <div className="fullscreen-nav">
            <button onClick={() => goTo(-1)} disabled={currentSlide === 0}>
              Prev
            </button>
            <span className="slide-counter">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button onClick={() => goTo(1)} disabled={currentSlide >= totalSlides - 1}>
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
