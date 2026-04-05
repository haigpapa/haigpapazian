const fs = require('fs');
let html = fs.readFileSync('writing.html', 'utf8');

const regex = /<a href="#" class="writing-row js-row"([^>]*?)>\s*<span class="row-year">(\d{4})<\/span>\s*<span class="row-title">(.*?)<\/span>/g;

html = html.replace(regex, (match, rest, year, title) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `<a href="writing/${slug}.html" class="writing-row js-row"${rest}>\n    <span class="row-year">${year}</span>\n    <span class="row-title">${title}</span>`;
});

const msRegex = /<a href="works\.html(?:\?filter=systems)?" class="writing-row js-row"([^>]*?)>\s*<span class="row-year">(\d{4})<\/span>\s*<span class="row-title">(.*?)<\/span>/g;
html = html.replace(msRegex, (match, rest, year, title) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `<a href="writing/${slug}.html" class="writing-row js-row"${rest}>\n    <span class="row-year">${year}</span>\n    <span class="row-title">${title}</span>`;
});

fs.writeFileSync('writing.html', html);
console.log('Fixed writing links');
