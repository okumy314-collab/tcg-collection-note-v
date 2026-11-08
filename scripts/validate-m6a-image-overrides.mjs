const samples = [
  ['M6a 056/103 Mew', 'https://i.ebayimg.com/images/g/lZMAAeSwP-hqqfQq/s-l960.jpg'],
  ['M6a 057/103 Mew ex RR', 'https://totalcards.net/cdn/shop/files/39c4d1ebe37b899f428878d954eb35d9.jpg?v=1790065809'],
  ['M6a 129/103 Mew ex SAR', 'https://item-shopping.c.yimg.jp/i/n/card-museum_pmm06a-129-sar'],
  ['M6a 135/103 Mew ex FUR', 'https://i.ebayimg.com/images/g/0HoAAeSwAMdqqeF0/s-l1600.jpg']
];

let failed = 0;
for (const [card, url] of samples) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 TCG-Collection-Note image validator' },
      redirect: 'follow'
    });
    const type = (response.headers.get('content-type') || '').toLowerCase();
    const bytes = new Uint8Array(await response.arrayBuffer());
    const ok = response.ok && type.startsWith('image/') && bytes.length > 1000;
    console.log(JSON.stringify({ card, status: response.status, type, bytes: bytes.length, ok }));
    if (!ok) failed++;
  } catch (error) {
    console.error(JSON.stringify({ card, ok: false, error: error.message }));
    failed++;
  }
}
if (failed) throw new Error(failed + ' M6a image override(s) failed response validation');
console.log('M6a exact image overrides validated:', samples.length);
