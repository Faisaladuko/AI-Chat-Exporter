/**
 * Markdown Exporter
 */
export function exportToMarkdown(exportData) {
  const { title, messages } = exportData;
  
  let markdown = `# ${title}\n\n`;
  
  messages.forEach((message, index) => {
    const roleLabel = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `## ${roleLabel}\n\n`;
    
    // Convert HTML to Markdown while preserving formatting
    let content = htmlToMarkdown(message.htmlContent || message.textContent || '');
    
    markdown += content + '\n\n';
    
    if (index < messages.length - 1) {
      markdown += '---\n\n';
    }
  });
  
  return new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Convert HTML to Markdown with formatting preservation
 */
function htmlToMarkdown(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Process code blocks first to preserve them
  temp.querySelectorAll('pre').forEach((pre, index) => {
    const code = pre.querySelector('code');
    if (code) {
      const language = extractLanguage(code);
      const codeText = code.textContent;
      pre.replaceWith(document.createTextNode(`\n\`\`\`${language}\n${codeText}\n\`\`\`\n`));
    }
  });
  
  // Process inline code
  temp.querySelectorAll('code').forEach(code => {
    code.replaceWith(document.createTextNode(`\`${code.textContent}\``));
  });
  
  // Process math (KaTeX, MathJax)
  temp.querySelectorAll('.katex, .math, mjx-container, .MathJax').forEach(math => {
    // Try to extract LaTeX from annotation or text
    const annotation = math.querySelector('annotation');
    const latex = annotation ? annotation.textContent : math.textContent;
    const isBlock = math.classList.contains('katex-display') || math.style.display === 'block';
    const delimiter = isBlock ? '$$' : '$';
    math.replaceWith(document.createTextNode(`${delimiter}${latex}${delimiter}`));
  });
  
  // Process headings
  for (let i = 1; i <= 6; i++) {
    temp.querySelectorAll(`h${i}`).forEach(h => {
      const text = h.textContent;
      h.replaceWith(document.createTextNode(`\n${'#'.repeat(i)} ${text}\n\n`));
    });
  }
  
  // Process bold
  temp.querySelectorAll('strong, b').forEach(el => {
    el.replaceWith(document.createTextNode(`**${el.textContent}**`));
  });
  
  // Process italic
  temp.querySelectorAll('em, i').forEach(el => {
    el.replaceWith(document.createTextNode(`*${el.textContent}*`));
  });
  
  // Process links
  temp.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    const text = a.textContent;
    if (href && href !== text) {
      a.replaceWith(document.createTextNode(`[${text}](${href})`));
    }
  });
  
  // Process lists
  temp.querySelectorAll('ul').forEach(ul => {
    const items = Array.from(ul.querySelectorAll('li')).map(li => `- ${li.textContent.trim()}`);
    ul.replaceWith(document.createTextNode(`\n${items.join('\n')}\n`));
  });
  
  temp.querySelectorAll('ol').forEach(ol => {
    const items = Array.from(ol.querySelectorAll('li')).map((li, i) => `${i + 1}. ${li.textContent.trim()}`);
    ol.replaceWith(document.createTextNode(`\n${items.join('\n')}\n`));
  });
  
  // Process blockquotes
  temp.querySelectorAll('blockquote').forEach(quote => {
    const lines = quote.textContent.split('\n').map(line => `> ${line.trim()}`).filter(l => l.trim() !== '>');
    quote.replaceWith(document.createTextNode(`\n${lines.join('\n')}\n`));
  });
  
  // Process line breaks
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith(document.createTextNode('\n'));
  });
  
  // Process paragraphs
  temp.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    if (text) {
      p.replaceWith(document.createTextNode(`${text}\n\n`));
    }
  });
  
  return temp.textContent.trim();
}

/**
 * Extract language from code element
 */
function extractLanguage(codeElement) {
  const className = codeElement.className || '';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : '';
}
