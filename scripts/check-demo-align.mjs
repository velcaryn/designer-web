/**
 * Geometry guard for the demo sites.
 *
 * The other guards check bytes, colour and content. This one checks
 * ALIGNMENT, which is the class of defect a reviewer notices first and
 * that no amount of reading the CSS will reliably catch: it only exists
 * once the browser has laid the page out.
 *
 * Four properties, each of which had a real failure when this was written:
 *
 *   1. Direct children of a .vd-shell share a left edge. A section whose
 *      heading starts 12px left of its body reads as broken.
 *   2. A section's h2 and its lede start at the same x.
 *   3. Cells that genuinely share a line share a baseline. The menu row
 *      centred the price against a two-line name-and-note block, which
 *      floated the rupee figure 35px below the item it priced.
 *   4. Nothing escapes its parent horizontally.
 *
 * MEASURING THIS CORRECTLY IS THE HARD PART, and three of the checks were
 * wrong before they were right:
 *
 *   - Comparing element TOPS finds nothing useful. Two cells at different
 *     type sizes correctly have different tops and the same baseline.
 *   - Comparing element BOTTOMS is wrong for a flex container, which
 *     reports its flex baseline, and for a cell with a second block under
 *     the figure (a price with a "per tooth" unit under it). Both produced
 *     phantom offsets of 5 to 20px on rows a designer would call correct.
 *     So the baseline is read from a Range over the cell's own first text
 *     node.
 *   - scrollWidth is inflated by a ::before used to grow a tap area, which
 *     this codebase does in four places. Overflow is measured against the
 *     parent's painted content box instead.
 *
 * Between them those three mistakes produced 213 findings on a corpus that
 * actually had about six. A guard that cries wolf gets switched off, so
 * the heuristics matter as much as the checks.
 *
 * Needs the production server: npm run build && npm start
 * Run: node scripts/check-demo-align.mjs [width]
 */
import puppeteer from 'puppeteer';
const {SLUGS}=await import('../content/demos/index.js');
const WIDTHS=process.argv[2]?[Number(process.argv[2])]:[320,390,768,1440];

const b=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
let total=0;
for(const W of WIDTHS){
await p.setViewport({width:W,height:900});
const findingsW=[];
const findings=[];
for(const s of SLUGS){
 await p.goto(`http://localhost:4000/demo-site/${s}`,{waitUntil:'networkidle0'});
 await p.evaluate(()=>{const n=[...document.querySelectorAll('button')].find(x=>/no thanks/i.test(x.textContent));if(n)n.click();});
 await new Promise(r=>setTimeout(r,250));
 const f=await p.evaluate(()=>{
  const out=[];
  const R=e=>e.getBoundingClientRect();
  const txt=e=>[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
  const vis=e=>{const c=getComputedStyle(e);const r=R(e);
    return c.display!=='none'&&c.visibility!=='hidden'&&r.width>1&&r.height>1;};

  // 1. LEFT EDGE ALIGNMENT: everything inside a shell should share a left edge
  for(const shell of document.querySelectorAll('.vd-shell')){
   const sec=shell.closest('section'); if(!sec)continue;
   const kids=[...shell.children].filter(vis);
   if(kids.length<2)continue;
   const lefts=kids.map(k=>Math.round(R(k).left));
   const uniq=[...new Set(lefts)];
   if(uniq.length>1){
    const spread=Math.max(...uniq)-Math.min(...uniq);
    if(spread>1&&spread<40) // >40 is intentional layout, <=1 is rounding
     out.push({t:'edge',sec:sec.id||sec.className.slice(0,24),
       d:`direct children of .vd-shell start at ${uniq.join('/')} (spread ${spread}px)`});}}

  // 2. HEADING / LEDE alignment inside a section
  for(const sec of document.querySelectorAll('section')){
   const h=sec.querySelector('.vd-h2'); if(!h||!vis(h))continue;
   const lede=sec.querySelector('.vd-lede');
   if(lede&&vis(lede)){
    const d=Math.abs(R(h).left-R(lede).left);
    if(d>1)out.push({t:'head',sec:sec.id||sec.className.slice(0,24),d:`h2 and lede left edges differ by ${d.toFixed(1)}px`});}
  }

  // 3. BASELINE within a row.
  //    Only cells that genuinely SHARE A LINE can share a baseline. A
  //    card that stacks name over duration is correct layout, not a
  //    defect, so group children by their vertical band first and only
  //    compare within a band. This is the check that produced 90 false
  //    positives when it compared every child of a card.
  for(const row of document.querySelectorAll('[class*="__row"],[class*="__item"],[class*="__card"],[class*="__cell"]')){
   if(!vis(row))continue;
   const cs=getComputedStyle(row);
   if(cs.display!=='grid'&&cs.display!=='flex')continue;
   const kids=[...row.children].filter(k=>vis(k)&&txt(k));
   if(kids.length<2)continue;
   // Compare the FIRST TEXT LINE of each cell, not the cell box.
   // The original defect was the price sitting 35px below the item name,
   // and the name lives inside a two-line .vd-menu__info wrapper: a
   // filter that drops multi-line cells drops exactly the cell the bug
   // was in. So each cell contributes its first line's baseline, wherever
   // in its subtree that line is.
   const firstLine=k=>{
     const walk=document.createTreeWalker(k,NodeFilter.SHOW_TEXT);
     let n; while((n=walk.nextNode())){
       if(!n.textContent.trim())continue;
       const rg=document.createRange();
       rg.setStart(n,0); rg.setEnd(n,n.textContent.length);
       const rects=[...rg.getClientRects()].filter(r=>r.height>0);
       if(rects.length)return rects[0];}
     return null;};
   const single=kids.map(k=>({el:k,line:firstLine(k)})).filter(x=>x.line);
   if(single.length<2)continue;
   // Band by vertical overlap: two cells are on one line if their boxes
   // overlap vertically by more than half the shorter one.
   const bands=[];
   for(const {el:k,line:r} of single){
    // 25%, not 50%. A misaligned pair is exactly the case where the two
    // line boxes only partly overlap: the reported defect had the name's
    // line ending at 1054 and the price's at 1065, an 11px offset that
    // left them overlapping by 8px of a 19px line. A 50% threshold put
    // them in separate bands and the guard reported nothing. Anything
    // sharing a quarter of its height is on the same visual line and
    // ought to share a baseline.
    const hit=bands.find(bd=>{
      const o=Math.min(bd.bot,r.bottom)-Math.max(bd.top,r.top);
      return o>Math.min(bd.bot-bd.top,r.height)*0.25;});
    if(hit){hit.top=Math.min(hit.top,r.top);hit.bot=Math.max(hit.bot,r.bottom);
      hit.els.push(k);hit.lines.push(r);}
    else bands.push({top:r.top,bot:r.bottom,els:[k],lines:[r]});}
   for(const bd of bands){
    if(bd.els.length<2)continue;
    // Range over the contents, not the element box: a flex container
    // reports its FLEX baseline, which produced a phantom 5.5px offset
    // on a row that was correctly aligned.
    // Range over the FIRST LINE's own text only. Two things would
    // otherwise register as misalignment when the type is in fact
    // correctly set: a flex container reports its flex baseline rather
    // than its text baseline, and a cell with a second block under the
    // figure (a price with a "per tooth" unit) reports the bottom of
    // that block. Both produced phantom offsets of 5 to 20px on rows
    // that a designer would call correct.
    const bases=bd.lines.map(r=>Math.round(r.bottom));
    const sp=Math.max(...bases)-Math.min(...bases);
    if(sp>3)out.push({t:'base',sec:row.className.toString().slice(0,30),
      d:`baselines differ by ${sp}px across ${bd.els.length} cells on one line`});}}

  // 4. IMAGES without dimensions (layout shift) or wrong fit
  for(const img of document.querySelectorAll('img')){
   if(!vis(img))continue;
   if(!img.getAttribute('width')||!img.getAttribute('height'))
    out.push({t:'img',sec:img.className||'img',d:`no width/height attrs: ${img.src.split('/').pop()}`});
   const r=R(img);
   const natural=img.naturalWidth/img.naturalHeight;
   const shown=r.width/r.height;
   const fit=getComputedStyle(img).objectFit;
   if(fit==='fill'&&Math.abs(natural-shown)>0.02)
    out.push({t:'img',sec:img.className||'img',d:`stretched: natural ${natural.toFixed(2)} shown ${shown.toFixed(2)}`});}

  // 5. TEXT escaping its container.
  //    scrollWidth is unreliable here: a ::before used to grow a tap area
  //    (the pattern used on the email link and the inline map link)
  //    inflates it by the inset without any text moving. So compare the
  //    painted right edge against the nearest ancestor that actually
  //    clips or bounds, which is what a reader would see.
  for(const e of document.querySelectorAll('*')){
   if(!vis(e))continue; if(!txt(e))continue;
   const cs=getComputedStyle(e);
   if(cs.overflowX!=='visible')continue;
   let par=e.parentElement; while(par&&getComputedStyle(par).display==='contents')par=par.parentElement;
   if(!par)continue;
   const r=R(e), pr=R(par);
   const ps=getComputedStyle(par);
   const padR=parseFloat(ps.paddingRight)||0, padL=parseFloat(ps.paddingLeft)||0;
   const over=Math.max(r.right-(pr.right-padR), (pr.left+padL)-r.left);
   if(over>1)out.push({t:'ovf',sec:e.className.toString().slice(0,28),
     d:`escapes its parent by ${Math.round(over)}px: "${txt(e).slice(0,24)}"`});}
  return out;});
 f.forEach(x=>findingsW.push({slug:s,...x}));
}
const by={};
findingsW.forEach(f=>{const k=f.t+'|'+f.sec+'|'+f.d.replace(/\d+/g,'N');(by[k]=by[k]||[]).push(f);});
if(findingsW.length){
 console.log(`\n  ${W}px: ${findingsW.length} finding(s)`);
 Object.entries(by).sort((a,b)=>b[1].length-a[1].length).slice(0,12).forEach(([,v])=>{
  const f=v[0];
  console.log(`  [${f.t}] x${String(v.length).padStart(2)}  ${f.sec}`);
  console.log(`         ${f.d}`);
  console.log(`         ${[...new Set(v.map(x=>x.slug))].slice(0,5).join(', ')}`);});}
total+=findingsW.length;
}
await b.close();
if(total>0){
 console.log(`\ncheck:demo-align - ${total} geometry problem(s).`);
 process.exit(1);
}
console.log(`check:demo-align - clean. ${SLUGS.length} demos at ${WIDTHS.join('/')}px: shared left edges, aligned headings, shared baselines, nothing overflowing.`);
