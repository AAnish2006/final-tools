/**
 * DevToolBox - Markdown Live Previewer & Editor (Vanilla JS for Exact React DOM)
 */
(function() {
  const page = document.querySelector('.markdown-page');
  if (!page) return;

  const workspace = page.querySelector('.md-workspace');
  const textarea = page.querySelector('.md-textarea');
  const previewContent = page.querySelector('.md-preview-content');
  const fullscreenBtn = page.querySelector('.md-btn-fullscreen');
  const sampleBtn = page.querySelector('.md-btn-sample');
  const clearBtn = page.querySelector('.md-btn-clear');
  const stats = page.querySelector('.md-panel-stats');
  const viewTabs = page.querySelectorAll('.md-view-tab');
  const toolbarBtns = page.querySelectorAll('.md-tools-left .md-tool-btn');
  const copyBtn = page.querySelector('.md-btn-copy');
  const downloadBtns = page.querySelectorAll('.md-btn-download');

  const SAMPLE_MARKDOWN = `## Welcome to DevToolBox Markdown Editor

A fast, interactive Markdown to HTML live editor and previewer. Your draft is processed in this browser tab.

## Key Features
- **Live Preview:** Changes render instantly side-by-side
- **Zero Server Lag:** All parsing executes locally in your browser
- **Quick Export:** Download ready-to-use \`.md\` or compiled \`.html\` files

### Code Example
\`\`\`javascript
function calculateEntropy(bits) {
  return bits >= 80 ? 'Very Strong' : 'Moderate';
}
\`\`\`

> "Good code is its own best documentation." — Steve McConnell

### Markdown Formatting Table
| Element | Syntax | Result |
| :--- | :--- | :--- |
| Bold | \`**bold**\` | **bold** |
| Italic | \`*italic*\` | *italic* |
| Strikethrough | \`~~strike~~\` | ~~strike~~ |

### Useful Checklist
- [x] Auto-render markdown
- [x] View compiled HTML
- [x] One-click copy and download
`;

  let viewMode = 'preview'; // 'preview' | 'html'
  let isFullPage = false;

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Exact Markdown parser matching React component
  function parseMarkdownToHTML(markdown) {
    if (!markdown) return '';
    let html = markdown;

    // Escape raw HTML entities
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced Code Blocks (```code```)
    html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline Code (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Horizontal Rules
    html = html.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr />');

    // Bold, Italic, Strikethrough
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Links & Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Tables
    html = html.replace(/(?:^\|.+?\|\s*$\n?)+/gm, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      if (rows.length < 2) return tableBlock;
      let tableHtml = '<div class="md-table-wrapper"><table>';
      let isHeader = true;

      rows.forEach((row, idx) => {
        if (/^\|[\s:-|-]+\|$/.test(row.trim())) {
          isHeader = false;
          return;
        }
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<${tag}>${cell}</${tag}>`;
        });
        tableHtml += '</tr>';
      });

      tableHtml += '</table></div>';
      return tableHtml;
    });

    // Task lists
    html = html.replace(/^- \[x\] (.*$)/gim, '<li class="task-list-item"><input type="checkbox" checked disabled /> $1</li>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<li class="task-list-item"><input type="checkbox" disabled /> $1</li>');

    // Unordered lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<oli>$1</oli>');
    html = html.replace(/(<oli>.*<\/oli>)/gim, '<ol>$1</ol>');
    html = html.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');

    // Paragraphs
    const blocks = html.split(/\n{2,}/);
    html = blocks.map(b => {
      const trimmed = b.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|pre|blockquote|ul|ol|hr|div|table)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');

    return html;
  }

  function render() {
    if (!textarea) return;
    const txt = textarea.value;
    const compiled = parseMarkdownToHTML(txt);

    if (previewContent) {
      if (viewMode === 'preview') {
        previewContent.innerHTML = `<div class="md-rendered-body">${compiled || '<p style="color:#64748b">Preview will appear here...</p>'}</div>`;
      } else {
        previewContent.innerHTML = `<pre class="md-raw-html"><code>${escapeHtml(compiled)}</code></pre>`;
      }
    }

    if (stats) {
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      stats.textContent = `${words} words | ${txt.length} chars`;
    }
  }

  function insertSyntax(prefix, suffix, defaultText) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end) || defaultText;
    const replacement = `${prefix}${selected}${suffix}`;
    textarea.value = val.substring(0, start) + replacement + val.substring(end);
    render();
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  }

  function toggleFullPage() {
    isFullPage = !isFullPage;
    if (isFullPage) {
      document.body.classList.add('md-fullpage-open');
      page.classList.add('page-in-fullpage');
      if (workspace) workspace.classList.add('fullpage-active');
      if (fullscreenBtn) {
        fullscreenBtn.classList.add('active');
        fullscreenBtn.textContent = '↗️ Exit Full Page';
        fullscreenBtn.title = 'Exit Full Page (Esc)';
      }
      if (textarea) textarea.focus();
    } else {
      document.body.classList.remove('md-fullpage-open');
      page.classList.remove('page-in-fullpage');
      if (workspace) workspace.classList.remove('fullpage-active');
      if (fullscreenBtn) {
        fullscreenBtn.classList.remove('active');
        fullscreenBtn.textContent = '↗️ Full Page';
        fullscreenBtn.title = 'Expand to Full Page';
      }
    }
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullPage);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullPage) {
      toggleFullPage();
    }
  });

  // Formatting Toolbar Buttons
  const SYNTAX_MAP = [
    { prefix: '**', suffix: '**', def: 'bold text' },      // B
    { prefix: '*', suffix: '*', def: 'italic text' },       // I
    { prefix: '~~', suffix: '~~', def: 'strike' },          // S
    { prefix: '# ', suffix: '', def: 'Heading 1' },         // H1
    { prefix: '## ', suffix: '', def: 'Heading 2' },        // H2
    { prefix: '### ', suffix: '', def: 'Heading 3' },       // H3
    { prefix: '> ', suffix: '', def: 'Quote' },             // Quote
    { prefix: '`', suffix: '`', def: 'code' },              // Code
    { prefix: '```javascript\n', suffix: '\n```', def: 'console.log("Hello");' }, // Code block
    { prefix: '[', suffix: '](https://example.com)', def: 'link text' }, // Link
    { prefix: '- ', suffix: '', def: 'List item' },         // List
    { prefix: '| Column 1 | Column 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n', suffix: '', def: '' } // Table
  ];

  toolbarBtns.forEach((btn, idx) => {
    const s = SYNTAX_MAP[idx];
    if (s) {
      btn.addEventListener('click', () => insertSyntax(s.prefix, s.suffix, s.def));
    }
  });

  // View Mode Tabs
  if (viewTabs.length >= 2) {
    viewTabs[0].addEventListener('click', () => {
      viewMode = 'preview';
      viewTabs[0].classList.add('active');
      viewTabs[1].classList.remove('active');
      render();
      if (copyBtn) copyBtn.textContent = '📋 Copy Markdown';
    });

    viewTabs[1].addEventListener('click', () => {
      viewMode = 'html';
      viewTabs[1].classList.add('active');
      viewTabs[0].classList.remove('active');
      render();
      if (copyBtn) copyBtn.textContent = '📋 Copy Raw HTML';
    });
  }

  // Load Sample & Clear
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      if (textarea) {
        textarea.value = SAMPLE_MARKDOWN;
        render();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (window.confirm('Clear all markdown text?')) {
        if (textarea) {
          textarea.value = '';
          render();
          textarea.focus();
        }
      }
    });
  }

  // Copy Action
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const textToCopy = viewMode === 'preview' ? (textarea ? textarea.value : '') : parseMarkdownToHTML(textarea ? textarea.value : '');
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = orig;
        copyBtn.classList.remove('copied');
      }, 1500);
    });
  }

  // Download Actions (MD and HTML)
  if (downloadBtns.length >= 2) {
    // Export .MD
    downloadBtns[0].addEventListener('click', () => {
      const content = textarea ? textarea.value : '';
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Export .HTML
    downloadBtns[1].addEventListener('click', () => {
      const content = parseMarkdownToHTML(textarea ? textarea.value : '');
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (textarea) {
    textarea.addEventListener('input', render);
  }

  // Initial render
  render();
})();
