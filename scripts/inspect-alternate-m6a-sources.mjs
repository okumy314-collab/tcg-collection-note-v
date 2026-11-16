const sources = [
  ['TCG Journal', 'https://tcgjournal.de/karten/pokemon/japanisch/m6a/'],
  ['Pavilion', 'https://pavilion-tcg.com/collection/pokemon/M6a?language=ja']
];
for (const [name, url] of sources) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    console.log('\nSOURCE', name, 'status', response.status, 'bytes', html.length, 'type', response.headers.get('content-type'));
    for (const marker of ['001/103', 'タマタマ', '129/103', 'ミュウex']) {
      const i=html.indexOf(marker);
      if(i>=0) console.log('MARKER',marker,html.slice(Math.max(0,i-600),Math.min(html.length,i+1100)).replace(/></g,'>\n<').slice(0,1800));
    }
    const imgs=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
    console.log('IMG COUNT',imgs.length);
    for(const tag of imgs.slice(0,8)) console.log('IMG',tag.slice(0,600));
  } catch (e) { console.log('SOURCE ERROR',name,e.message); }
}
