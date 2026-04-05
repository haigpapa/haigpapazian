const fs = require('fs');
const { PROJECTS, RAW_EDGES } = require('./data.js');

const writingHtml = fs.readFileSync('writing.html', 'utf8');
const projects = PROJECTS || [];

if (!fs.existsSync('projects')) fs.mkdirSync('projects');
if (!fs.existsSync('writing')) fs.mkdirSync('writing');

/* ─── HELPERS ─────────────────────────────────────────────────── */
const DOMAIN_COLORS = {
  sound: '#b8966a', text: '#5b8a7a', image: '#8a5b7a',
  code: '#4a7a8a', space: '#7a8a4a', systems: '#7a5a8a'
};

function domainTag(d) {
  const c = DOMAIN_COLORS[d] || '#888';
  return `<span class="domain-tag" style="color:${c};border-color:${c}">${d}</span>`;
}

function highlightItem(h) {
  return `<li class="highlight-item"><span class="highlight-dash">—</span>${h}</li>`;
}

function linkBtn(l) {
  return `<a href="${l.url}" target="_blank" rel="noopener" class="proj-link">${l.label} ↗</a>`;
}

// Build edge map
const edgeMap = {};
RAW_EDGES.forEach(([a, b]) => {
  if (!edgeMap[a]) edgeMap[a] = [];
  if (!edgeMap[b]) edgeMap[b] = [];
  edgeMap[a].push(b);
  edgeMap[b].push(a);
});

function relatedProjects(id) {
  const ids = edgeMap[id] || [];
  return ids.map(rid => {
    const p = projects.find(x => x.id === rid);
    if (!p) return '';
    return `<a href="${p.id}.html" class="related-node">${p.title}</a>`;
  }).filter(Boolean).join('');
}

/* ─── PROJECT PAGE TEMPLATE ───────────────────────────────────── */
const projectTemplate = (p) => {
  const highlights = (p.highlights || []).map(highlightItem).join('\n');
  const links = (p.links || []).map(linkBtn).join('');
  const related = relatedProjects(p.id);
  const domains = (p.domains || []).map(domainTag).join('');
  const longDescParagraphs = (p.longDesc || p.desc || '')
    .split('\n\n')
    .filter(s => s.trim())
    .map(s => `<p class="proj-body-p">${s.trim()}</p>`)
    .join('\n');

  const tierLabel = p.tier === 1 ? 'Hero Work' : p.tier === 2 ? 'Flagship' : 'Archive';
  const imgSrc = p.img || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80';
  const isExternal = imgSrc.startsWith('http');
  const imgPath = isExternal ? imgSrc : `../${imgSrc}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title} — Haig Papazian</title>
<meta name="description" content="${p.desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../tokens.css">
<link rel="stylesheet" href="../nav.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
<style>

/* ── PROJECT DETAIL PAGE ─────────────────────────── */

.proj-hero {
  position: relative; width: 100%;
  height: clamp(320px, 55vh, 680px);
  overflow: hidden; background: #0a0908;
}
.proj-hero-img {
  position: absolute; inset: 0;
  width: 100%; height: 110%;
  object-fit: cover; object-position: center 30%;
  opacity: 0; transition: opacity 1.1s ease; top: -5%;
}
.proj-hero-img.loaded { opacity: 1; }
.proj-hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(7,7,6,.2) 0%, rgba(7,7,6,.5) 60%, rgba(7,7,6,.95) 100%);
}
.proj-hero-badge {
  position: absolute; top: 2rem; left: clamp(1.5rem,3vw,3rem);
  font-family: var(--sans); font-size: .45rem; font-weight: 600;
  letter-spacing: .26em; text-transform: uppercase; color: var(--gold); z-index: 2;
}

.proj-header {
  padding: 2.5rem clamp(1.5rem,3vw,3rem) 2.5rem;
  border-bottom: 1px solid var(--line);
}
.proj-back {
  font-family: var(--sans); font-size: .5rem; font-weight: 500;
  letter-spacing: .2em; text-transform: uppercase;
  color: var(--ink-2); display: inline-flex; align-items: center; gap: .4rem;
  margin-bottom: 1.8rem; transition: color .2s;
}
.proj-back:hover { color: var(--gold); }
.proj-domains { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.domain-tag {
  font-family: var(--sans); font-size: .42rem; font-weight: 500;
  letter-spacing: .14em; text-transform: uppercase;
  padding: .2rem .6rem; border: 1px solid; border-radius: 100px;
}
.proj-title {
  font-family: var(--serif); font-weight: 300;
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: .95; color: var(--ink);
  letter-spacing: -.01em; margin-bottom: 1.2rem;
}
.proj-meta-row { display: flex; align-items: flex-start; gap: 3rem; flex-wrap: wrap; }
.proj-meta-item { display: flex; flex-direction: column; gap: .25rem; }
.proj-meta-label {
  font-family: var(--sans); font-size: .4rem; font-weight: 600;
  letter-spacing: .22em; text-transform: uppercase; color: var(--ink-3);
}
.proj-meta-value {
  font-family: var(--sans); font-size: .65rem; font-weight: 500; color: var(--ink-2);
}
.proj-role-value {
  font-family: var(--serif); font-style: italic; font-size: .95rem; color: var(--ink-2);
}

.proj-body {
  display: grid; grid-template-columns: 2fr 1fr; gap: 0;
  border-bottom: 1px solid var(--line);
}
.proj-body-main {
  padding: clamp(2.5rem,5vw,4.5rem) clamp(1.5rem,3vw,3rem);
  border-right: 1px solid var(--line);
}
.proj-body-p {
  font-family: var(--serif); font-weight: 300;
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  line-height: 1.82; color: var(--ink-2);
  max-width: 62ch; margin-bottom: 1.6rem;
}
.proj-body-p:last-child { margin-bottom: 0; }

.proj-body-aside {
  padding: clamp(2.5rem,5vw,4.5rem) clamp(1.5rem,3vw,2.5rem);
  display: flex; flex-direction: column; gap: 2.5rem;
}
.aside-section-label {
  font-family: var(--sans); font-size: .44rem; font-weight: 600;
  letter-spacing: .24em; text-transform: uppercase; color: var(--gold);
  margin-bottom: .9rem; display: block;
}
.highlights-list { list-style: none; display: flex; flex-direction: column; gap: .65rem; }
.highlight-item {
  font-family: var(--sans); font-size: .68rem; font-weight: 300;
  color: var(--ink-2); line-height: 1.55;
  display: flex; gap: .6rem; align-items: flex-start;
}
.highlight-dash { color: var(--gold); flex-shrink: 0; margin-top: .05em; }

.proj-links { display: flex; flex-direction: column; gap: .5rem; }
.proj-link {
  font-family: var(--sans); font-size: .52rem; font-weight: 600;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--ink-2); border: 1px solid var(--line-2);
  padding: .65rem 1rem; display: inline-flex; align-items: center;
  transition: color .2s, border-color .2s;
}
.proj-link:hover { color: var(--gold-lt); border-color: var(--gold); }

.proj-related {
  padding: clamp(2rem,4vw,3.5rem) clamp(1.5rem,3vw,3rem);
  border-bottom: 1px solid var(--line);
}
.proj-related-label {
  font-family: var(--sans); font-size: .44rem; font-weight: 600;
  letter-spacing: .24em; text-transform: uppercase; color: var(--ink-3);
  margin-bottom: 1rem; display: block;
}
.related-nodes { display: flex; flex-wrap: wrap; gap: .5rem; }
.related-node {
  font-family: var(--sans); font-size: .5rem; font-weight: 500;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-2); border: 1px solid var(--line-2);
  padding: .4rem .85rem; transition: color .2s, border-color .2s;
}
.related-node:hover { color: var(--gold-lt); border-color: var(--gold); }

.proj-footer {
  padding: 1.5rem clamp(1.5rem,3vw,3rem);
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid var(--line); gap: 1rem;
}
.proj-footer-left {
  font-family: var(--sans); font-size: .44rem; font-weight: 500;
  letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3);
}
.proj-footer-right {
  font-family: var(--serif); font-weight: 300; font-size: .82rem; color: var(--ink-3);
}

#page-transition {
  position: fixed; inset: 0; background: var(--gold);
  z-index: 99999; pointer-events: none; transform: translateY(100%);
}

.proj-title, .proj-domains, .proj-meta-row, .proj-back { opacity: 0; transform: translateY(18px); }

@media (max-width: 860px) {
  .proj-body { grid-template-columns: 1fr; }
  .proj-body-main { border-right: none; border-bottom: 1px solid var(--line); }
}
</style>
</head>
<body>

<div id="cursor"></div>
<div id="cursor-label"></div>
<div id="page-transition"></div>
<div id="nav-placeholder"></div>

<div class="proj-hero">
  <img class="proj-hero-img" src="${imgPath}" alt="${p.title}" onload="this.classList.add('loaded')" crossorigin="anonymous">
  <div class="proj-hero-overlay"></div>
  <span class="proj-hero-badge">${tierLabel}</span>
</div>

<header class="proj-header">
  <a href="../works.html" class="proj-back">← All Works</a>
  <div class="proj-domains">${domains}</div>
  <h1 class="proj-title">${p.title}</h1>
  <div class="proj-meta-row">
    <div class="proj-meta-item">
      <span class="proj-meta-label">Year</span>
      <span class="proj-meta-value">${p.year}</span>
    </div>
    <div class="proj-meta-item">
      <span class="proj-meta-label">Status</span>
      <span class="proj-meta-value">${p.status}</span>
    </div>
    ${p.role ? `<div class="proj-meta-item">
      <span class="proj-meta-label">Role</span>
      <span class="proj-role-value">${p.role}</span>
    </div>` : ''}
  </div>
</header>

<div class="proj-body">
  <div class="proj-body-main">
    ${longDescParagraphs}
  </div>
  <aside class="proj-body-aside">
    ${highlights ? `<div>
      <span class="aside-section-label">Highlights</span>
      <ul class="highlights-list">${highlights}</ul>
    </div>` : ''}
    ${links ? `<div>
      <span class="aside-section-label">Links</span>
      <div class="proj-links">${links}</div>
    </div>` : ''}
  </aside>
</div>

${related ? `<div class="proj-related">
  <span class="proj-related-label">Connected Works</span>
  <div class="related-nodes">${related}</div>
</div>` : ''}

<footer class="proj-footer">
  <span class="proj-footer-left">Haig Papazian — ${new Date().getFullYear()}</span>
  <span class="proj-footer-right">haigpapazian.com</span>
</footer>

<script>
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});
function doTransition(href) {
  if (!href || href.startsWith('#') || href.startsWith('http')) return;
  const bar = document.getElementById('page-transition');
  gsap.set(bar, { yPercent: 100 });
  gsap.timeline({ onComplete: () => { window.location.href = href; }})
    .to(bar, { yPercent: 0, duration: 0.55, ease: 'expo.inOut' });
}
document.querySelectorAll('a[href]').forEach(a => {
  const href = a.getAttribute('href');
  if (a.target !== '_blank' && href && !href.startsWith('http')) {
    a.addEventListener('click', e => { e.preventDefault(); doTransition(href); });
  }
});
gsap.timeline({ delay: 0.1 })
  .to('.proj-back', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
  .to('.proj-domains', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
  .to('.proj-title', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
  .to('.proj-meta-row', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4');
<\/script>
<script src="../nav.js"><\/script>
</body>
</html>`;
};

/* ─── GENERATE ALL PROJECT PAGES ──────────────────────────────── */
projects.forEach(p => {
  fs.writeFileSync('projects/' + p.id + '.html', projectTemplate(p));
});
console.log('Generated ' + projects.length + ' project pages');

/* ─── WRITING PAGES ───────────────────────────────────────────── */
const driveLinks = {
  'the-localization-gap-how-ai-systems-erase-cultural-specificity': 'https://docs.google.com/document/d/1fkQklFNhJl1p-hh5q-zz6-C6ZA2yTR-BsLHHenAayOg/edit',
  'sometimes-i-wake-up-elsewhere': 'https://docs.google.com/document/d/1oVWHiNzhKwPwda7HJeF5KKn971ziKBT_MbIfCe8y_5k/edit',
  'the-crane-song': 'https://docs.google.com/document/d/1m3rg1eZY73AN41wGafHw2fv0J9jREVbY/edit',
  'cartography-of-absence': 'https://docs.google.com/document/d/1ZkARATHqVi-xWzWwY7uSW1c_gVi5YGj8HOc5f3Eb-B8/edit',
  'the-souad-novella': 'https://docs.google.com/document/d/1VTkfovjfQ7L7gsJJM-9Y5O7ILkCg1xWy3Y4j426xojM/edit'
};

const writingPieces = [];
const existingLinksRegex = /<a href="writing\/([^\"]+)\.html" class="writing-row([^>]*?)>\s*<span class="row-year">(\d{4})<\/span>\s*<span class="row-title">(.*?)<\/span>(?:\s*<span class="row-pub">(.*?)<\/span>)?/g;

let m;
while ((m = existingLinksRegex.exec(writingHtml)) !== null) {
  writingPieces.push({ slug: m[1], year: m[3], title: m[4], pub: m[5] || '' });
}

const writingTemplate = (piece) => {
  const driveUrl = driveLinks[piece.slug];
  const readSection = driveUrl
    ? `<div class="writing-read-section">
        <a href="${driveUrl}" target="_blank" rel="noopener" class="writing-read-btn">Read Full Text ↗</a>
        <p class="writing-read-note">Opens in Google Drive</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${piece.title} — Haig Papazian</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../tokens.css">
<link rel="stylesheet" href="../nav.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
<style>
.writing-detail-header { padding: 8rem clamp(1.5rem,3vw,3rem) 3rem; border-bottom: 1px solid var(--line); max-width: 860px; }
.writing-back { font-family: var(--sans); font-size: .5rem; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-2); display: inline-block; margin-bottom: 2rem; transition: color .2s; }
.writing-back:hover { color: var(--gold); }
.writing-detail-year { font-family: var(--sans); font-size: .5rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
.writing-detail-title { font-family: var(--serif); font-weight: 300; font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1.05; color: var(--ink); margin-bottom: 1rem; letter-spacing: -.01em; }
.writing-detail-pub { font-family: var(--sans); font-size: .55rem; font-weight: 400; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); }
.writing-read-section { padding: 4rem clamp(1.5rem,3vw,3rem); border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 1.5rem; }
.writing-read-btn { font-family: var(--sans); font-size: .55rem; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: var(--bg); background: var(--gold); padding: .85rem 2rem; display: inline-block; transition: background .2s; }
.writing-read-btn:hover { background: var(--gold-lt); }
.writing-read-note { font-family: var(--sans); font-size: .45rem; font-weight: 400; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
#page-transition { position:fixed;inset:0;background:var(--gold);z-index:99999;pointer-events:none;transform:translateY(100%); }
</style>
</head>
<body>
<div id="cursor"></div>
<div id="page-transition"></div>
<div id="nav-placeholder"></div>
<header class="writing-detail-header">
  <a href="../writing.html" class="writing-back">← Writing</a>
  <div class="writing-detail-year">${piece.year}</div>
  <h1 class="writing-detail-title">${piece.title}</h1>
  ${piece.pub ? '<div class="writing-detail-pub">' + piece.pub + '</div>' : ''}
</header>
${readSection}
<script>
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => { cursor.style.left=e.clientX+'px'; cursor.style.top=e.clientY+'px'; });
document.querySelectorAll('a,button').forEach(el=>{ el.addEventListener('mouseenter',()=>cursor.classList.add('hover')); el.addEventListener('mouseleave',()=>cursor.classList.remove('hover')); });
function doTransition(href){ if(!href||href.startsWith('#')||href.startsWith('http'))return; const bar=document.getElementById('page-transition'); gsap.set(bar,{yPercent:100}); gsap.timeline({onComplete:()=>{window.location.href=href;}}).to(bar,{yPercent:0,duration:0.55,ease:'expo.inOut'}); }
document.querySelectorAll('a[href]').forEach(a=>{ const href=a.getAttribute('href'); if(a.target!=='_blank'&&href&&!href.startsWith('http')){ a.addEventListener('click',e=>{e.preventDefault();doTransition(href);}); } });
<\/script>
<script src="../nav.js"><\/script>
</body>
</html>`;
};

writingPieces.forEach(piece => {
  fs.writeFileSync('writing/' + piece.slug + '.html', writingTemplate(piece));
});
console.log('Generated ' + writingPieces.length + ' writing pages');
