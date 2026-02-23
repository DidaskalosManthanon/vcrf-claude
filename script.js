// ── UTILS ─────────────────────────────────────────────
const $ = id => document.getElementById(id);
const r4 = n => Math.round(n*10000)/10000;
const r2 = n => Math.round(n*100)/100;
const r3 = n => Math.round(n*1000)/1000;

// Vérification que toutes les fonctions nécessaires existent
window.addEventListener('error', function(e) {
  if (e.message.includes('is not a function')) {
    console.error('Erreur de fonction manquante:', e.filename, e.lineno);
    alert('Une erreur est survenue. Rafraîchissez la page.');
  }
});

// ── CANVAS HELPER ─────────────────────────────────────
function bgCanvas(ctx, W, H){
  ctx.fillStyle='#231040'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(212,168,67,.07)'; ctx.lineWidth=.5;
  for(let x=0;x<W;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
}
function drawAxes(ctx,W,H,ox,oy,sc){
  ctx.strokeStyle='rgba(212,168,67,.35)'; ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,oy);ctx.lineTo(W,oy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ox,0);ctx.lineTo(ox,H);ctx.stroke();
  ctx.fillStyle='rgba(212,168,67,.3)'; ctx.font='10px "Share Tech Mono"';
  for(let i=Math.ceil(-ox/sc);i<=Math.floor((W-ox)/sc);i++){
    if(!i) continue;
    ctx.fillText(i,ox+i*sc-4,oy+13);
    ctx.strokeStyle='rgba(212,168,67,.2)'; ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(ox+i*sc,oy-3);ctx.lineTo(ox+i*sc,oy+3);ctx.stroke();
  }
  for(let j=Math.ceil(-(H-oy)/sc);j<=Math.floor(oy/sc);j++){
    if(!j) continue;
    ctx.fillText(j,ox+5,oy-j*sc+4);
    ctx.beginPath();ctx.moveTo(ox-3,oy-j*sc);ctx.lineTo(ox+3,oy-j*sc);ctx.stroke();
  }
}
function plotF(ctx,f,W,H,ox,oy,sc,col='#d4a843',lw=2.2){
  ctx.strokeStyle=col; ctx.lineWidth=lw;
  ctx.beginPath(); let first=true;
  for(let px=0;px<W;px++){
    const xv=(px-ox)/sc, yv=f(xv);
    if(!isFinite(yv)){first=true;continue;}
    const py=oy-yv*sc;
    if(py<-80||py>H+80){first=true;continue;}
    if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
  }
  ctx.stroke();
}
function dot2(ctx,x,y,col='#d4a843',r=5){ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=col;ctx.fill();}
function lbl(ctx,s,x,y,col='#f5f0e8',sz=11){ctx.fillStyle=col;ctx.font=`${sz}px "Share Tech Mono"`;ctx.fillText(s,x,y);}
function hLine(ctx,ox,oy,xv,yv,sc,col='rgba(255,255,255,.2)'){
  ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(ox+xv*sc,oy-yv*sc);ctx.lineTo(ox+xv*sc,oy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ox,oy-yv*sc);ctx.lineTo(ox+xv*sc,oy-yv*sc);ctx.stroke();
  ctx.setLineDash([]);
}

// ── FUNCTION REGISTRY ─────────────────────────────────
const FNS = {
  'x2m3':  { f:x=>x*x-3*x+2,      fp:x=>2*x-3,       label:'x²−3x+2',      fp_label:"f'=2x−3" },
  'cubic': { f:x=>x*x*x-3*x,      fp:x=>3*x*x-3,     label:'x³−3x',        fp_label:"f'=3x²−3" },
  'quart': { f:x=>x*x*x*x-4*x*x,  fp:x=>4*x*x*x-8*x, label:'x⁴−4x²',       fp_label:"f'=4x³−8x" },
  'custom':{ f:x=>-2*x*x+4*x+1,   fp:x=>-4*x+4,      label:'−2x²+4x+1',    fp_label:"f'=−4x+4" },
  'cubeup':{ f:x=>x*x*x-6*x*x+9*x,fp:x=>3*x*x-12*x+9,label:'x³−6x²+9x',   fp_label:"f'=3x²−12x+9"},
};
const CMP = {
  'x3':   { f:x=>x*x*x,       label:'x³' },
  'x2p1': { f:x=>x*x+1,       label:'x²+1' },
  'xsq':  { f:x=>x>=0?Math.sqrt(x):NaN, label:'√x' },
  'x2':   { f:x=>x*x,         label:'x²' },
  'x':    { f:x=>x,           label:'x' },
};
const NEWTON = {
  'x2m2': { f:x=>x*x-2,      fp:x=>2*x,      label:'x²−2',   root:Math.sqrt(2) },
  'x2m3': { f:x=>x*x-3,      fp:x=>2*x,      label:'x²−3',   root:Math.sqrt(3) },
  'cubic':{ f:x=>x*x*x-x-1,  fp:x=>3*x*x-1,  label:'x³−x−1', root:1.3247 },
  'x3m7': { f:x=>x*x*x-7,    fp:x=>3*x*x,    label:'x³−7',   root:Math.cbrt(7) },
};

// ── 01 — VARIATIONS ───────────────────────────────────
function drawVar(){
  const key=$('fn-var').value, fn=FNS[key];
  const cv=$('c-var'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=50;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  // f' in dashed teal
  plotF(ctx,fn.fp,W,H,ox,oy,sc,'rgba(45,212,191,.6)',1.5);
  ctx.setLineDash([5,4]); plotF(ctx,fn.fp,W,H,ox,oy,sc,'rgba(45,212,191,.4)',1); ctx.setLineDash([]);

  // f in gold
  plotF(ctx,fn.f,W,H,ox,oy,sc,'#d4a843',2.5);

  // zero line of f'
  ctx.strokeStyle='rgba(244,114,182,.3)';ctx.lineWidth=1;ctx.setLineDash([8,4]);
  ctx.beginPath();ctx.moveTo(0,oy);ctx.lineTo(W,oy);ctx.stroke();ctx.setLineDash([]);

  // Find zeros of f' numerically
  const zeros=[];
  for(let x=-5;x<5;x+=.01){
    const a=fn.fp(x),b=fn.fp(x+.01);
    if(isFinite(a)&&isFinite(b)&&a*b<0){
      // bisection
      let lo=x,hi=x+.01;
      for(let i=0;i<20;i++){const m=(lo+hi)/2;if(fn.fp(m)*a<0)hi=m;else lo=m;}
      const z=(lo+hi)/2;
      if(zeros.every(z2=>Math.abs(z-z2)>.05)) zeros.push(z);
    }
  }
  zeros.forEach(z=>{
    const fz=fn.f(z);
    if(!isFinite(fz)) return;
    hLine(ctx,ox,oy,z,fz,sc,'rgba(244,114,182,.3)');
    dot2(ctx,ox+z*sc,oy-fz*sc,'#f472b6',6);
    lbl(ctx,`x=${r2(z)}`,ox+z*sc+7,oy-fz*sc-8,'#f472b6',10);
  });

  // legend
  lbl(ctx,fn.label,12,20,'#d4a843',11);
  lbl(ctx,fn.fp_label,12,36,'#2dd4bf',11);

  // variation table
  let rows='';
  const pts=[-5,...zeros.map(r2),5];
  for(let i=0;i<pts.length-1;i++){
    const mid=(pts[i]+pts[i+1])/2;
    const sgn=fn.fp(mid);
    const arrow=sgn>0?'↗':'↘';
    const arrowCls=sgn>0?'up':'dn';
    rows+=`<td class="${arrowCls}">${arrow}</td>`;
    if(i<pts.length-2) rows+=`<td class="ze ext">f'=0</td>`;
  }

  let headerCols='<th>x</th><th>−∞</th>';
  zeros.forEach(z=>{ headerCols+=`<th>${r2(z)}</th>`; });
  headerCols+='<th>+∞</th>';

  let fpRow='<td>f\'(x)</td>';
  const pts2=[-5,...zeros,5];
  for(let i=0;i<pts2.length-1;i++){
    const mid=(pts2[i]+pts2[i+1])/2;
    const sgn=fn.fp(mid);
    fpRow+=`<td class="${sgn>0?'up':'dn'}">${sgn>0?'+':'−'}</td>`;
    if(i<pts2.length-2) fpRow+=`<td class="ze ext">0</td>`;
  }

  let fRow='<td>f(x)</td>';
  for(let i=0;i<pts2.length-1;i++){
    const mid=(pts2[i]+pts2[i+1])/2;
    const sgn=fn.fp(mid);
    fRow+=`<td class="${sgn>0?'up':'dn'}">${sgn>0?'↗':'↘'}</td>`;
    if(i<pts2.length-2){
      const z=zeros[i];const fz=fn.f(z);
      fRow+=`<td class="ext ${fn.fp(z+.001)>0?'vmin':'vmax'}">${r3(fz)}</td>`;
    }
  }

  $('var-table').innerHTML=`
    <table class="vtbl"><thead><tr>${headerCols}</tr></thead>
    <tbody><tr>${fpRow}</tr><tr>${fRow}</tr></tbody></table>`;
  window.MathJax&&MathJax.typesetPromise();
}
$('fn-var').addEventListener('change',drawVar);
drawVar();

// ── 02 — EXTREMUMS ────────────────────────────────────
function drawExt(){
  const a=+$('ex-a').value, b=+$('ex-b').value, c=+$('ex-c').value;
  $('ex-a-v').textContent=r2(a); $('ex-b-v').textContent=r2(b); $('ex-c-v').textContent=r2(c);

  // f(x)=(x-a)(x-b)(x-c)
  const f=x=>(x-a)*(x-b)*(x-c);
  const fp=x=>((x-b)*(x-c)+(x-a)*(x-c)+(x-a)*(x-b)); // expanded derivative

  const cv=$('c-ext'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=55;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  // plot f
  plotF(ctx,f,W,H,ox,oy,sc,'#d4a843',2.4);
  // plot f' (dashed)
  ctx.setLineDash([5,4]); plotF(ctx,fp,W,H,ox,oy,sc,'rgba(45,212,191,.5)',1.5); ctx.setLineDash([]);

  // roots of f
  [a,b,c].forEach(r=>{
    dot2(ctx,ox+r*sc,oy,'#d4a843',5);
    lbl(ctx,r2(r),ox+r*sc-8,oy+15,'#d4a843',9);
  });

  // extremums of f (zeros of f')
  // f' = 3x²-2(a+b+c)x+(ab+bc+ca)
  const A=3, B=-2*(a+b+c), C=(a*b+b*c+c*a);
  const disc=B*B-4*A*C;
  const extRes=[];
  if(disc>0){
    const x1=(-B-Math.sqrt(disc))/(2*A), x2=(-B+Math.sqrt(disc))/(2*A);
    [x1,x2].forEach(xv=>{
      const fv=f(xv);
      if(!isFinite(fv)) return;
      const isMax=fp(xv-.01)>0&&fp(xv+.01)<0;
      const col=isMax?'#f472b6':'#2dd4bf';
      hLine(ctx,ox,oy,xv,fv,sc,`rgba(${isMax?'244,114,182':'45,212,191'},.3)`);
      dot2(ctx,ox+xv*sc,oy-fv*sc,col,7);
      // horizontal tangent
      ctx.strokeStyle=col; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(ox+(xv-.8)*sc,oy-fv*sc);ctx.lineTo(ox+(xv+.8)*sc,oy-fv*sc);ctx.stroke();
      lbl(ctx,`${isMax?'max':'min'}(${r2(xv)},${r2(fv)})`,ox+xv*sc+8,oy-fv*sc-8,col,10);
      extRes.push({xv,fv,isMax});
    });
  }
  $('ext-res').innerHTML=extRes.map(e=>`
    <div class="res ${e.isMax?'rose':'teal'}">
      x = ${r3(e.xv)} → f'(x)=0 &nbsp;·&nbsp; f(${r3(e.xv)}) = ${r3(e.fv)} — ${e.isMax?'maximum':'minimum'} local
    </div>`).join('')||`<div class="res muted">Δ≤0 : pas d'extremum local (f' ne s'annule pas avec changement de signe)</div>`;
}
['ex-a','ex-b','ex-c'].forEach(id=>$(id).addEventListener('input',drawExt));
drawExt();

// ── 03 — OPTIMISATION ─────────────────────────────────
function drawOpt(){
  const L=+$('opt-L').value, xv=+$('opt-x').value;
  $('opt-L-v').textContent=L; $('opt-x-v').textContent=r2(xv);
  const xOpt=L/4, Aopt=L*L/8;
  const A=x=>x*(L-2*x);
  const cv=$('c-opt'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height;
  bgCanvas(ctx,W,H);
  const ox=30,oy=H-40,scx=(W-60)/(L/2+2),scy=(H-60)/(Aopt*1.3);

  // x axis
  ctx.strokeStyle='rgba(212,168,67,.35)'; ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(W-10,oy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox,10);ctx.stroke();
  lbl(ctx,'x (m)',W-30,oy+14,'rgba(212,168,67,.5)',10);
  lbl(ctx,'A (m²)',ox+5,18,'rgba(212,168,67,.5)',10);

  // curve A(x)
  ctx.strokeStyle='#d4a843'; ctx.lineWidth=2.2;
  ctx.beginPath(); let first=true;
  for(let x=0;x<=L/2;x+=.05){
    const px=ox+x*scx, py=oy-A(x)*scy;
    if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
  }
  ctx.stroke();

  // current x
  const ax=A(xv);
  ctx.strokeStyle='rgba(244,114,182,.6)'; ctx.lineWidth=1; ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.moveTo(ox+xv*scx,oy);ctx.lineTo(ox+xv*scx,oy-ax*scy);ctx.stroke();
  ctx.setLineDash([]);
  dot2(ctx,ox+xv*scx,oy-ax*scy,'#f472b6',6);

  // optimal x
  dot2(ctx,ox+xOpt*scx,oy-Aopt*scy,'#2dd4bf',8);
  lbl(ctx,`Optimal x=${r2(xOpt)}`,ox+xOpt*scx+8,oy-Aopt*scy-8,'#2dd4bf',10);

  $('opt-res').innerHTML=`
    <div class="res">A(x) = x(${L}−2x) &nbsp;·&nbsp; x actuel = ${r2(xv)} m → A = ${r2(ax)} m²</div>
    <div class="res teal">Optimal : x* = L/4 = ${r2(xOpt)} m → A_max = L²/8 = ${r2(Aopt)} m²</div>
    <div class="res">Rapport A/A_max = ${r2(ax/Aopt*100)}%</div>`;
}
['opt-L','opt-x'].forEach(id=>$(id).addEventListener('input',drawOpt));
drawOpt();

// ── 04 — COMPARAISON ──────────────────────────────────
function drawCmp(){
  const fk=$('cmp-f').value, gk=$('cmp-g').value;
  const ff=CMP[fk].f, gf=CMP[gk].f;
  const h=x=>ff(x)-gf(x);
  const cv=$('c-cmp'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=48;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  // shade positive/negative regions
  for(let px=0;px<W;px++){
    const xv=(px-ox)/sc;
    const hv=h(xv);
    if(!isFinite(hv)) continue;
    const y1=oy-ff(xv)*sc, y2=oy-gf(xv)*sc;
    if(!isFinite(y1)||!isFinite(y2)) continue;
    ctx.fillStyle=hv>0?'rgba(45,212,191,.08)':'rgba(244,114,182,.08)';
    ctx.fillRect(px,Math.min(y1,y2),1,Math.abs(y1-y2));
  }

  plotF(ctx,gf,W,H,ox,oy,sc,'#f472b6',1.8);
  plotF(ctx,ff,W,H,ox,oy,sc,'#d4a843',2.2);

  // legend
  lbl(ctx,`f(x) = ${CMP[fk].label}`,12,18,'#d4a843',11);
  lbl(ctx,`g(x) = ${CMP[gk].label}`,12,34,'#f472b6',11);
  lbl(ctx,'zone f>g',W-90,18,'rgba(45,212,191,.7)',9);
  lbl(ctx,'zone f<g',W-90,32,'rgba(244,114,182,.7)',9);

  $('cmp-res').innerHTML=`<div class="res">h(x) = f(x)−g(x) = ${CMP[fk].label} − ${CMP[gk].label}</div>
    <div class="res teal">Zone bleue : f(x) > g(x) — courbe de f au-dessus de g</div>
    <div class="res rose">Zone rose : f(x) < g(x) — courbe de g au-dessus de f</div>`;
}
$('cmp-f').addEventListener('change',drawCmp);
$('cmp-g').addEventListener('change',drawCmp);
drawCmp();

// ── 05 — POSITION RELATIVE ────────────────────────────
function drawPos(){
  const a=+$('pos-a').value, b=+$('pos-b').value, c=+$('pos-c').value;
  $('pos-a-v').textContent=r2(a);
  $('pos-b-v').textContent=b<0?'−'+Math.abs(b):b;
  $('pos-c-v').textContent=c<0?'−'+Math.abs(c):c;
  const f=x=>a*x*x+b*x+c, g=x=>x, h=x=>f(x)-g(x);
  const cv=$('c-pos'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=48;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  for(let px=0;px<W;px++){
    const xv=(px-ox)/sc,hv=h(xv);
    if(!isFinite(hv)) continue;
    const y1=oy-f(xv)*sc, y2=oy-g(xv)*sc;
    if(!isFinite(y1)||!isFinite(y2)) continue;
    ctx.fillStyle=hv>0?'rgba(45,212,191,.07)':'rgba(244,114,182,.07)';
    ctx.fillRect(px,Math.min(y1,y2),1,Math.abs(y1-y2));
  }
  plotF(ctx,g,W,H,ox,oy,sc,'#f472b6',1.8);
  plotF(ctx,f,W,H,ox,oy,sc,'#d4a843',2.2);

  lbl(ctx,`f(x) = ${a}x² ${b>=0?'+':''} ${b}x ${c>=0?'+':''} ${c}`,12,18,'#d4a843',10);
  lbl(ctx,'g(x) = x',12,33,'#f472b6',10);

  // h=f-g = ax²+(b-1)x+c
  const A=a, B=b-1, C=c;
  const D=B*B-4*A*C;
  let html=`<div class="res">h(x) = f(x)−g(x) = ${a}x² + (${b}−1)x + ${c} = ${a}x² ${B>=0?'+':''} ${B}x ${C>=0?'+':''} ${C}</div>`;
  if(Math.abs(A)<1e-9){
    html+=`<div class="res muted">a=0 : h est linéaire.</div>`;
  } else if(D>0){
    const r1=(-B-Math.sqrt(D))/(2*A), r2=(-B+Math.sqrt(D))/(2*A);
    html+=`<div class="res teal">Δ = ${r2(D)} > 0 — h s'annule en x₁≈${r2(r1)} et x₂≈${r2(r2)}</div>`;
    html+=`<div class="res">Les courbes se croisent en ces deux points.</div>`;
  } else if(Math.abs(D)<1e-9){
    const x0=-B/(2*A);
    html+=`<div class="res">Δ=0 — h s'annule en x₀=${r2(x0)} (tangence des courbes)</div>`;
  } else {
    html+=`<div class="res ${a>0?'teal':'rose'}">Δ<0 — h ne s'annule jamais : f est ${a>0?'toujours au-dessus de':'toujours en-dessous de'} g.</div>`;
  }
  $('pos-res').innerHTML=html;
}
['pos-a','pos-b','pos-c'].forEach(id=>$(id).addEventListener('input',drawPos));
drawPos();

// ── 06 — TRINÔME ──────────────────────────────────────
function drawTri(){
  const a=+$('tri-a').value, b=+$('tri-b').value, c=+$('tri-c').value;
  $('tri-a-v').textContent=r2(a);
  $('tri-b-v').textContent=b<0?'−'+Math.abs(b):b;
  $('tri-c-v').textContent=c<0?'−'+Math.abs(c):c;
  if(Math.abs(a)<1e-9){$('tri-res').innerHTML=`<div class="res muted">a ≠ 0 requis</div>`;return;}

  const f=x=>a*x*x+b*x+c, fp=x=>2*a*x+b;
  const alpha=-b/(2*a), beta=f(alpha);

  const cv=$('c-tri'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=50;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  // shade: f'>0 teal, f'<0 rose
  for(let px=0;px<W;px++){
    const xv=(px-ox)/sc, fpv=fp(xv);
    ctx.fillStyle=fpv>0?'rgba(45,212,191,.07)':'rgba(244,114,182,.07)';
    ctx.fillRect(px,0,1,H);
  }

  plotF(ctx,fp,W,H,ox,oy,sc,'rgba(244,114,182,.5)',1.5); // f'
  plotF(ctx,f,W,H,ox,oy,sc,'#d4a843',2.4); // f

  // vertex
  const vx=ox+alpha*sc, vy=oy-beta*sc;
  hLine(ctx,ox,oy,alpha,beta,sc,'rgba(212,168,67,.3)');
  dot2(ctx,vx,vy,'#d4a843',7);
  ctx.strokeStyle='#d4a843';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(vx-30,vy);ctx.lineTo(vx+30,vy);ctx.stroke();
  lbl(ctx,`S(${r2(alpha)};${r2(beta)})`,vx+9,vy-9,'#d4a843',10);

  // axis of symmetry
  ctx.strokeStyle='rgba(212,168,67,.25)';ctx.lineWidth=1;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(vx,0);ctx.lineTo(vx,H);ctx.stroke();ctx.setLineDash([]);

  lbl(ctx,`f(x)=${a}x²${b>=0?'+':''}${b}x${c>=0?'+':''}${c}`,12,18,'#d4a843',10);
  lbl(ctx,`f'(x)=${2*a}x${b>=0?'+':''}${b}`,12,33,'#f472b6',10);

  $('tri-res').innerHTML=`
    <div class="res">f'(x) = ${2*a}x + ${b} &nbsp;·&nbsp; f'(x)=0 ⟺ x = α = ${r3(alpha)}</div>
    <div class="res ${a>0?'teal':'rose'}">Sommet S(${r3(alpha)} ; ${r3(beta)}) — ${a>0?'minimum':'maximum'} = ${r3(beta)}</div>
    <div class="res ${a>0?'teal':'rose'}">f ${a>0?'décroît sur ]−∞;'+r3(alpha)+'] puis croît sur ['+r3(alpha)+';+∞[':'croît sur ]−∞;'+r3(alpha)+'] puis décroît sur ['+r3(alpha)+';+∞['}</div>`;
}
['tri-a','tri-b','tri-c'].forEach(id=>$(id).addEventListener('input',drawTri));
drawTri();

// ── 07 — NEWTON ───────────────────────────────────────
function runNewton(){
  const key=$('nwt-fn').value, fn=NEWTON[key];
  let x0=+$('nwt-x0').value, k=+$('nwt-k').value;
  const rnd2 = n => Math.round(n*100)/100;
  $('nwt-x0-v').textContent=rnd2(x0); $('nwt-k-v').textContent=k;

  const cv=$('c-nwt'),ctx=cv.getContext('2d');
  const W=cv.width,H=cv.height,ox=W/2,oy=H/2,sc=55;
  bgCanvas(ctx,W,H); drawAxes(ctx,W,H,ox,oy,sc);

  plotF(ctx,fn.f,W,H,ox,oy,sc,'#d4a843',2.2);

  // Newton steps
  let xn=x0;
  const steps=[{n:0,x:x0,fx:fn.f(x0),err:Math.abs(x0-fn.root)}];
  const colors=['#f472b6','#2dd4bf','#d4a843','#a78bfa','#fb923c','#34d399','#f87171','#60a5fa'];

  for(let i=0;i<k;i++){
    const fx=fn.f(xn), fpx=fn.fp(xn);
    if(!isFinite(fx)||!isFinite(fpx)||Math.abs(fpx)<1e-10) break;
    const xNext=xn-fx/fpx;

    // draw tangent line
    const col=colors[i%colors.length];
    ctx.strokeStyle=col; ctx.lineWidth=1.4; ctx.setLineDash([4,3]);
    const tanY=x=>fx+fpx*(x-xn);
    ctx.beginPath();
    ctx.moveTo(0,oy-tanY(-ox/sc)*sc);
    ctx.lineTo(W,oy-tanY((W-ox)/sc)*sc);
    ctx.stroke(); ctx.setLineDash([]);

    // vertical drop
    ctx.strokeStyle=`rgba(${col.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.4)`;
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ox+xn*sc,oy-fx*sc);ctx.lineTo(ox+xn*sc,oy);ctx.stroke();

    dot2(ctx,ox+xn*sc,oy-fx*sc,col,5);
    dot2(ctx,ox+xNext*sc,oy,col,5);
    lbl(ctx,`x${i}=${r4(xn)}`,ox+xn*sc+4,oy+14+i%2*12,col,9);

    steps.push({n:i+1,x:xNext,fx:fn.f(xNext),err:Math.abs(xNext-fn.root)});
    xn=xNext;
  }

  // final point
  dot2(ctx,ox+xn*sc,oy-fn.f(xn)*sc,'#2dd4bf',7);
  // true root
  ctx.strokeStyle='rgba(45,212,191,.3)';ctx.lineWidth=1;ctx.setLineDash([8,4]);
  ctx.beginPath();ctx.moveTo(ox+fn.root*sc,0);ctx.lineTo(ox+fn.root*sc,H);ctx.stroke();
  ctx.setLineDash([]);
  lbl(ctx,`racine≈${r4(fn.root)}`,ox+fn.root*sc+6,18,'#2dd4bf',10);

  // table
  let rows=steps.map(s=>`<div class="newton-row">
    <div class="newton-cell">x<sub>${s.n}</sub></div>
    <div class="newton-cell">${r4(s.x)}</div>
    <div class="newton-cell">${isFinite(s.fx)?r4(s.fx):'—'}</div>
    <div class="newton-cell">${r4(s.err)}</div>
    <div class="newton-cell">${s.err<1e-6?'✓ converge':'…'}</div>
  </div>`).join('');

  $('nwt-table').innerHTML=`
    <div class="newton-row" style="font-weight:600">
      <div class="newton-cell">Étape</div>
      <div class="newton-cell">xₙ</div>
      <div class="newton-cell">f(xₙ)</div>
      <div class="newton-cell">|xₙ − racine|</div>
      <div class="newton-cell">Statut</div>
    </div>${rows}
    <div class="res teal" style="margin-top:8px">Racine exacte = ${r4(fn.root)} &nbsp;·&nbsp; ${fn.label} = 0</div>`;
}
['nwt-x0','nwt-k'].forEach(id=>$(id).addEventListener('input',runNewton));
$('nwt-fn').addEventListener('change',runNewton);
runNewton();

// ── QCM ───────────────────────────────────────────────
const QCM=[
  {q:"Si \\(f'(x) > 0\\) sur \\(]a;b[\\), alors \\(f\\) est :",
   opts:["Strictement croissante sur ]a;b[","Strictement décroissante sur ]a;b[","Constante","Négative"],
   ans:0, expl:"Par le théorème du lien signe de f' / variations : f'>0 ⟹ f strictement croissante."},
  {q:"La fonction \\(f(x)=x^3-3x\\) admet ses extremums locaux en :",
   opts:["x=−1 et x=1","x=0 et x=3","x=±√3","x=1 seulement"],
   ans:0, expl:"f'(x)=3x²−3=0 ⟺ x=±1. f' change de signe en ces deux points."},
  {q:"Si \\(f'(a)=0\\) et \\(f'\\) passe de + à − en \\(a\\), alors \\(f(a)\\) est :",
   opts:["Un minimum local","Un maximum local","Une valeur quelconque","Nul"],
   ans:1, expl:"f' passe de + à − : f croît puis décroît. Donc f(a) est un maximum local."},
  {q:"Pour le trinôme \\(f(x)=2x^2-8x+3\\), l'extremum est atteint en :",
   opts:["x=2","x=4","x=−2","x=8"],
   ans:0, expl:"α=−b/(2a)=8/(2×2)=2. f'(x)=4x−8=0 ⟺ x=2."},
  {q:"Quelle est la valeur minimale de \\(f(x)=x^2-6x+5\\) ?",
   opts:["−4","−9","5","0"],
   ans:0, expl:"α=3, f(3)=9−18+5=−4. C'est le minimum (a=1>0)."},
  {q:"Pour étudier la position relative de \\(\\mathcal{C}_f\\) et \\(\\mathcal{C}_g\\), on étudie :",
   opts:["\\(f(x)\\cdot g(x)\\)","\\(f(x)-g(x)\\)","\\(f'(x)-g'(x)\\)","\\(f(x)/g(x)\\)"],
   ans:1, expl:"On pose h=f−g et on étudie le signe de h : h>0 ⟺ f au-dessus de g."},
  {q:"La méthode de Newton calcule \\(x_{n+1}\\) par :",
   opts:["\\(x_n + f(x_n)/f'(x_n)\\)","\\(x_n - f(x_n)/f'(x_n)\\)","\\(x_n \\cdot f'(x_n)\\)","\\(f(x_n)/x_n\\)"],
   ans:1, expl:"La formule de Newton-Raphson est xₙ₊₁=xₙ − f(xₙ)/f'(xₙ)."},
  {q:"\\(f(x)=x^3\\) en \\(x=0\\) : f'(0)=0. Peut-on conclure qu'il y a un extremum ?",
   opts:["Oui, c'est un minimum","Oui, c'est un maximum","Non, f' ne change pas de signe","Non, f n'est pas dérivable en 0"],
   ans:2, expl:"f'(x)=3x² ≥ 0 partout et f' ne change pas de signe en 0 : pas d'extremum. C'est un point d'inflexion à tangente horizontale."},
  {q:"La fonction \\(f(x) = -3x^2+12x-7\\) est croissante sur :",
   opts:["\\(]-\\infty;2[\\)","\\(]2;+\\infty[\\)","\\(]-\\infty;-2[\\)","\\(]-4;0[\\)"],
   ans:0, expl:"f'(x)=−6x+12=0 ⟺ x=2. a=−3<0, donc f croît avant 2 et décroît après."},
  {q:"Si \\(f\\) est croissante sur \\([a;b]\\), pour \\(x\\in[a;b]\\) on peut écrire :",
   opts:["\\(f(a) \\leq f(x) \\leq f(b)\\)","\\(f(x) \\leq f(a)\\)","\\(f(x) = f(a)\\)","\\(f(b) \\leq f(x)\\)"],
   ans:0, expl:"f croissante sur [a;b] signifie f(a)≤f(x)≤f(b) pour tout x de [a;b]. C'est l'outil pour encadrer des valeurs."},
];

let qSt={qs:[],cur:0,score:0,answered:0,did:false};
let tSec=0,tRun=true,tIv=null;
function qShuffle(){
  qSt={qs:[...QCM].sort(()=>Math.random()-.5),cur:0,score:0,answered:0,did:false};
  tSec=0;tDisp();clearInterval(tIv);tRun=true;$('t-btn').textContent='⏸';
  tIv=setInterval(()=>{if(tRun){tSec++;tDisp();}},1000);
  qRender();
}
function qRender(){
  const body=$('qcm-body');
  if(qSt.cur>=qSt.qs.length){
    body.innerHTML=`<p class="q-text" style="text-align:center;padding:20px">◆ Terminé ! Score : <strong style="color:var(--gold)">${qSt.score} / ${qSt.qs.length}</strong> ◆</p>`;
    clearInterval(tIv);return;
  }
  const q=qSt.qs[qSt.cur]; qSt.did=false;
  $('q-score').textContent=`Score : ${qSt.score} / ${qSt.answered}`;
  body.innerHTML=`<div class="q-num">◆ Question ${qSt.cur+1} / ${qSt.qs.length}</div>
    <p class="q-text">${q.q}</p>
    <div class="opts">${q.opts.map((o,i)=>`<button class="opt" id="opt${i}" onclick="qAns(${i})">${o}</button>`).join('')}</div>
    <div class="feedback" id="qfb"></div>`;
  window.MathJax&&MathJax.typesetPromise();
}
function qAns(i){
  if(qSt.did)return;qSt.did=true;qSt.answered++;
  const q=qSt.qs[qSt.cur],ok=i===q.ans;
  if(ok)qSt.score++;
  $('opt'+q.ans).classList.add('correct');
  if(!ok)$('opt'+i).classList.add('wrong');
  document.querySelectorAll('.opt').forEach(b=>b.classList.add('locked'));
  $('qfb').textContent=(ok?'✓ Correct ! ':'✗ Incorrect. ')+q.expl;
  $('q-score').textContent=`Score : ${qSt.score} / ${qSt.answered}`;
  window.MathJax&&MathJax.typesetPromise();
}
function qNext(){qSt.cur++;qRender();}
function tDisp(){const m=String(Math.floor(tSec/60)).padStart(2,'0'),s=String(tSec%60).padStart(2,'0');$('qcm-timer').textContent=`${m}:${s}`;}
function tPause(){tRun=!tRun;$('t-btn').textContent=tRun?'⏸':'▶';}
function tReset(){tSec=0;tDisp();}
function tShowTgl(){$('qcm-timer').classList.toggle('hidden',!$('t-show').checked);}
qShuffle();

// ── FADE IN ───────────────────────────────────────────
// threshold:0 + rootMargin ensure sections become visible as soon as they touch the viewport
const obs = new IntersectionObserver(
  entries => entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('vis'); }),
  { threshold: 0, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.fi').forEach(el => obs.observe(el));

// Safety fallback: reveal all sections after 500ms regardless
setTimeout(() => {
  document.querySelectorAll('.fi').forEach(el => el.classList.add('vis'));
}, 500);

// Navigation fluide
document.querySelectorAll('.nav-pills a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    document.querySelector(targetId).scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
});