const samples = [
  'https://www.onepiece-cardgame.com/images/cardlist/card/OP05-098_p1.png?2602273',
  'https://www.onepiece-cardgame.com/images/cardlist/card/OP05-098.png?2602273',
  'https://www.onepiece-cardgame.com/images/cardlist/card/OP05-100_p2.png?2602273'
];

for (const url of samples) {
  for (const referer of [undefined, 'https://www.onepiece-cardgame.com/']) {
    const headers = { 'User-Agent': 'Mozilla/5.0 TCG-Collection-Note image-check' };
    if (referer) headers.Referer = referer;
    try {
      const response = await fetch(url, { headers });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || '';
      const isImage = response.ok && contentType.toLowerCase().startsWith('image/') && bytes.length > 1000;
      console.log(JSON.stringify({
        card: url.split('/').pop().split('?')[0],
        referer: referer ? 'official' : 'none',
        status: response.status,
        contentType,
        bytes: bytes.length,
        isImage
      }));
      if (!isImage) throw new Error('Official card image did not return image bytes');
    } catch (error) {
      console.error('Image check failed:', url, referer || 'no referer', error.message);
      process.exitCode = 1;
    }
  }
}
