const page='https://tcgjournal.de/karten/pokemon/japanisch/m6a/';
const response=await fetch(page,{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36','Accept':'text/html,application/xhtml+xml'}});
if(!response.ok)throw new Error('TCG Journal catalogue HTTP '+response.status);
const html=await response.text();
const targets=[];
for(const match of html.matchAll(/<img\b[^>]*>/gi)){
 const tag=match[0];
 const alt=tag.match(/\balt=["']([^"']*)["']/i)?.[1]||'';
 const src=tag.match(/\b(?:src|data-src|data-original)=["']([^"']+)["']/i)?.[1]||'';
 if(/Karte (10[4-9]|11[0-9]|12[0-9]|13[0-5])\b|Karte (GRA|FIR|WAT|LIG|PSY|FIG|DAR|MET)\b/.test(alt)){
   const url=new URL(src,page).href;
   targets.push({alt,src,url});
 }
}
console.log('TARGET_COUNT',targets.length);
for(const item of targets){
 try{
  const r=await fetch(item.url,{headers:{'User-Agent':'Mozilla/5.0','Referer':page}});
  const bytes=new Uint8Array(await r.arrayBuffer());
  const type=(r.headers.get('content-type')||'').toLowerCase();
  const ok=r.ok&&type.startsWith('image/')&&bytes.length>1000;
  console.log('TARGET_IMAGE',JSON.stringify({...item,status:r.status,type,bytes:bytes.length,ok}));
 }catch(e){console.log('TARGET_IMAGE',JSON.stringify({...item,ok:false,error:e.message}));}
}
