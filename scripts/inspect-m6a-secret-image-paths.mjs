const url='https://tcgjournal.de/karten/pokemon/japanisch/m6a/';
const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36','Accept':'text/html,application/xhtml+xml'}});
if(!r.ok)throw new Error('source '+r.status);
const html=await r.text();
const tags=[...html.matchAll(/<img\b[^>]*>/gi)].map(x=>x[0]);
for(const tag of tags){
  if(/Karte (10[0-9]|11[0-9]|12[0-9]|13[0-5])\b|Karte (GRA|FIR|WAT|LIG|PSY|FIG|DAR|MET)\b/.test(tag)){
    console.log('CARD_IMAGE_TAG '+tag);
  }
}
