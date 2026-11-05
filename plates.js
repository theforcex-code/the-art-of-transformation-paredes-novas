'use strict';
// Os 16 lugares da mesa no mapa de pixels 10726 x 2160 (gabarito do CAD, o mesmo eixo de cadeiras do visualizador).
// Um encaixe é o retângulo onde a imagem inteira é desenhada sobre a mesa, em fração da mesa: {bx, by, kx, ky}.
// Esticar = {0, 0, 1, 1}. "Detectar" procura o retângulo em que as 16 clareiras da arte caem sobre os pratos.
window.pharmaPlates=(()=>{
  const MAP={w:10726,h:2160},R=300;
  const XS=[694,2004,3354,4684,6144,7452,8804,10132],YS=[544,1616];
  const CENTERS=YS.flatMap(y=>XS.map(x=>({x:x/MAP.w,y:y/MAP.h})));
  const RX=R/MAP.w,RY=R/MAP.h;
  const STRETCH={bx:0,by:0,kx:1,ky:1};
  // Tables generated on the guide come with pure black outside the useful band: crop those edge bands away first,
  // otherwise they show as a border on the table. Cached per image.
  const prepared=new WeakMap();
  function prepare(image){
    if(prepared.has(image))return prepared.get(image);
    // A native table map already has its final crop. Dark artwork is not letterboxing.
    if(Math.abs((image.width/image.height)/(MAP.w/MAP.h)-1)<0.003){
      prepared.set(image,image);return image;
    }
    const w=Math.min(image.width,1600),h=Math.round(image.height*w/image.width);
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0,w,h);
    const d=g.getImageData(0,0,w,h).data,dark=i=>d[i]+d[i+1]+d[i+2]<3*28;
    const rowDark=y=>{let n=0;for(let x=0;x<w;x+=3)if(dark((y*w+x)*4))n++;return n/(w/3)>0.85;};
    let top=0,bottom=h;while(top<h*0.4&&rowDark(top))top++;while(bottom>h*0.6&&rowDark(bottom-1))bottom--;
    const colDark=x=>{let n=0,t=0;for(let y=top;y<bottom;y+=3){t++;if(dark((y*w+x)*4))n++;}return t&&n/t>0.85;};
    let left=0,right=w;while(left<w*0.3&&colDark(left))left++;while(right>w*0.7&&colDark(right-1))right--;
    let out=image;
    if(top||bottom<h||left||right<w){
      const k=image.width/w,sx=left*k,sy=top*k,sw=(right-left)*k,sh=(bottom-top)*k;
      out=document.createElement('canvas');out.width=Math.round(sw);out.height=Math.round(sh);
      out.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,out.width,out.height);
    }
    prepared.set(image,out);prepared.set(out,out);return out;
  }

  // Gradient magnitude + integral image of a downscaled grey copy: flat clearings have little gradient.
  function analyse(image){
    const w=640,h=Math.max(40,Math.round(image.height*w/image.width));
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});
    g.filter='blur(1px)';g.drawImage(image,0,0,w,h);
    const d=g.getImageData(0,0,w,h).data,L=new Float32Array(w*h);
    for(let i=0;i<w*h;i++)L[i]=0.2126*d[i*4]+0.7152*d[i*4+1]+0.0722*d[i*4+2];
    const I=new Float64Array((w+1)*(h+1));
    for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){
      const i=y*w+x,gx=x>0&&x<w-1?Math.abs(L[i+1]-L[i-1]):0,gy=y>0&&y<h-1?Math.abs(L[i+w]-L[i-w]):0;
      row+=gx+gy;I[(y+1)*(w+1)+x+1]=I[y*(w+1)+x+1]+row;}}
    const box=(x0,y0,x1,y1)=>{x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(w,Math.ceil(x1));y1=Math.min(h,Math.ceil(y1));
      if(x1<=x0||y1<=y0)return [0,0];const W=w+1;return [I[y1*W+x1]-I[y0*W+x1]-I[y1*W+x0]+I[y0*W+x0],(x1-x0)*(y1-y0)];};
    return {w,h,box};
  }
  // Lower is better: mean (gradient inside each plate / gradient in the ring around it).
  function score(A,p){
    let total=0;
    for(const c of CENTERS){
      const cx=(c.x-p.bx)/p.kx*A.w,cy=(c.y-p.by)/p.ky*A.h,rx=RX/p.kx*A.w,ry=RY/p.ky*A.h;
      if(cx-rx<0||cx+rx>A.w||cy-ry<0||cy+ry>A.h){total+=1.6;continue;}
      const [si,ni]=A.box(cx-rx*.7,cy-ry*.7,cx+rx*.7,cy+ry*.7),[so,no]=A.box(cx-rx*1.7,cy-ry*1.7,cx+rx*1.7,cy+ry*1.7);
      const inner=si/Math.max(1,ni),ring=(so-si)/Math.max(1,no-ni);
      total+=inner/(ring+2);
    }
    return total/CENTERS.length;
  }
  // Only rectangles that cover the whole table (no border): kx, ky >= 1 and the shift stays inside the overflow.
  function search(A,ranges,best){
    for(const kx of ranges.kx)for(const ky of ranges.ky){
      if(kx<1||ky<1)continue;
      const bx0=(1-kx)/2,by0=(1-ky)/2,mx=(kx-1)/2+1e-9,my=(ky-1)/2+1e-9;
      for(const dx of ranges.dx)for(const dy of ranges.dy){
        if(Math.abs(dx)>mx||Math.abs(dy)>my)continue;
        const p={kx,ky,bx:bx0+dx,by:by0+dy},s=score(A,p);
        if(s<best.s){best.s=s;best.p=p;}
      }
    }
    return best;
  }
  const range=(a,b,step)=>{const out=[];for(let v=a;v<=b+1e-9;v+=step)out.push(+v.toFixed(4));return out;};
  function detect(image){
    image=prepare(image);const A=analyse(image);
    let best={s:score(A,STRETCH),p:{...STRETCH}};
    const base=best.s;
    best=search(A,{kx:range(1,1.25,0.0125),ky:range(1,1.6,0.025),dx:range(-0.12,0.12,0.01),dy:range(-0.3,0.3,0.02)},best);
    for(const step of [0.5,0.25]){
      const p=best.p,bx0=(1-p.kx)/2,by0=(1-p.ky)/2;
      best=search(A,{kx:range(p.kx-0.025,p.kx+0.025,0.0125*step*2),ky:range(p.ky-0.05,p.ky+0.05,0.025*step*2),
        dx:range(p.bx-bx0-0.01,p.bx-bx0+0.01,0.005*step*2),dy:range(p.by-by0-0.02,p.by-by0+0.02,0.01*step*2)},best);
    }
    // Confidence: how much clearer the plates are than with a plain stretch (1 = same, lower = better fit).
    return {...best.p,score:+best.s.toFixed(3),gain:+(best.s/base).toFixed(3)};
  }
  // Images already in the table map proportion (10726 x 2160) were made on the plate guide: stretch is the fit.
  // Otherwise detect, and keep the plain stretch when detection does not find clearly better clearings.
  function auto(image){
    image=prepare(image);const ratio=image.width/image.height;
    if(Math.abs(ratio/(MAP.w/MAP.h)-1)<0.03)return {...STRETCH,how:'mapa'};
    const r=detect(image);
    return r.gain<0.9?{bx:r.bx,by:r.by,kx:r.kx,ky:r.ky,how:'detectado'}:{...STRETCH,how:'esticado'};
  }
  // ---- Encaixe fino: cada clareira no centro exato do seu prato ----
  const TABLE={w:5.0,h:1.007},SIGMA=0.22;   // metros; sigma ~ um terço do passo entre cadeiras
  function alignedCanvas(image,W,H,p){
    const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingQuality='high';
    g.drawImage(image,0,0,W,H);g.drawImage(image,p.bx*W,p.by*H,p.kx*W,p.ky*H);return c;
  }
  // Finds the clearing around each plate as a whole region (flat, low-gradient pixels connected to the flattest point near
  // the plate) and returns the offset of its centroid. Using the centre of the whole clearing, not just any flat point,
  // is what makes oval clearings (3:1 art stretched to the table) sit centred on the plate.
  function refine(image,p){
    image=prepare(image);
    const W=1600,H=Math.round(W*MAP.h/MAP.w),c=alignedCanvas(image,W,H,p);
    const g=c.getContext('2d',{willReadFrequently:true}),d=g.getImageData(0,0,W,H).data;
    const L=new Float32Array(W*H);for(let i=0;i<W*H;i++)L[i]=0.2126*d[i*4]+0.7152*d[i*4+1]+0.0722*d[i*4+2];
    // gradient, then a 5x5 box blur of it so texture reads as "busy" and clearings as "flat"
    const G=new Float32Array(W*H);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;G[i]=Math.abs(L[i+1]-L[i-1])+Math.abs(L[i+W]-L[i-W]);}
    const B=new Float32Array(W*H),T=new Float32Array(W*H),R=2;
    for(let y=0;y<H;y++){let acc=0;for(let x=-R;x<W;x++){if(x+R<W)acc+=G[y*W+x+R];if(x-R-1>=0)acc-=G[y*W+x-R-1];if(x>=0)T[y*W+x]=acc;}}
    for(let x=0;x<W;x++){let acc=0;for(let y=-R;y<H;y++){if(y+R<H)acc+=T[(y+R)*W+x];if(y-R-1>=0)acc-=T[(y-R-1)*W+x];if(y>=0)B[y*W+x]=acc/25;}}
    const rx=RX*W,ry=RY*H,plateArea=Math.PI*rx*ry;
    const I=new Float64Array((W+1)*(H+1));
    for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=G[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+row;}}
    const box=(a,b,c2,d2)=>{a=Math.max(0,a|0);b=Math.max(0,b|0);c2=Math.min(W,Math.ceil(c2));d2=Math.min(H,Math.ceil(d2));if(c2<=a||d2<=b)return [0,1];const S=W+1;return [I[d2*S+c2]-I[b*S+c2]-I[d2*S+a]+I[b*S+a],(c2-a)*(d2-b)];};
    const local=(x,y)=>{const [si,ni]=box(x-rx*.7,y-ry*.7,x+rx*.7,y+ry*.7),[so,no]=box(x-rx*1.7,y-ry*1.7,x+rx*1.7,y+ry*1.7);const inner=si/ni,ring=(so-si)/Math.max(1,no-ni);return {s:inner/(ring+2),contrast:ring/(inner+1)};};
    // Fallback when the clearing is not a closed region: centre of all the near-flattest positions (not just the first one).
    const byScore=(cx,cy)=>{const pts=[];for(let oy=-0.9*ry;oy<=0.9*ry;oy+=ry/12)for(let ox=-0.9*rx;ox<=0.9*rx;ox+=rx/12)pts.push({x:cx+ox,y:cy+oy,...local(cx+ox,cy+oy)});
      const sorted=pts.map(p=>p.s).sort((a,b)=>a-b),min=sorted[0],mid=sorted[sorted.length>>1],lim=min+(mid-min)*0.15;
      let n=0,mx=0,my=0;for(const p of pts)if(p.s<=lim){n++;mx+=p.x;my+=p.y;}mx/=n;my/=n;
      return local(mx,my).contrast>=1.5?{x:mx,y:my}:null;};
    let found=0;
    const offsets=CENTERS.map(q=>{
      const cx=q.x*W,cy=q.y*H;
      const x0=Math.max(0,Math.floor(cx-2.4*rx)),x1=Math.min(W-1,Math.ceil(cx+2.4*rx)),y0=Math.max(0,Math.floor(cy-2.4*ry)),y1=Math.min(H-1,Math.ceil(cy+2.4*ry));
      // flatness threshold from this neighbourhood: clearly flatter than its surroundings
      const vals=[];for(let y=y0;y<=y1;y+=2)for(let x=x0;x<=x1;x+=2)vals.push(B[y*W+x]);vals.sort((a,b)=>a-b);
      const lo=vals[Math.floor(vals.length*0.1)],hi=vals[Math.floor(vals.length*0.8)];
      const fallback=()=>{const r=byScore(cx,cy);if(!r)return {dx:0,dy:0,ok:false};found++;return {dx:(r.x-cx)/W,dy:(r.y-cy)/H,ok:true};};
      if(hi<lo*1.8+2)return fallback();   // uniform neighbourhood
      const t=lo+(hi-lo)*0.28;
      // seed: flattest point within one plate radius
      let seed=-1,sv=Infinity;for(let y=Math.round(cy-ry);y<=cy+ry;y++)for(let x=Math.round(cx-rx);x<=cx+rx;x++){if(x<x0||x>x1||y<y0||y>y1)continue;const v=B[y*W+x];if(v<sv){sv=v;seed=y*W+x;}}
      if(seed<0||sv>t)return fallback();
      const seen=new Uint8Array((x1-x0+1)*(y1-y0+1)),stack=[seed];let n=0,sx=0,sy=0,edge=0,minx=W,maxx=0,miny=H,maxy=0;
      const key=i=>((i/W|0)-y0)*(x1-x0+1)+(i%W-x0);seen[key(seed)]=1;
      while(stack.length){const i=stack.pop(),x=i%W,y=i/W|0;n++;sx+=x;sy+=y;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
        if(x===x0||x===x1||y===y0||y===y1)edge++;
        for(const j of [i-1,i+1,i-W,i+W]){const jx=j%W,jy=j/W|0;if(jx<x0||jx>x1||jy<y0||jy>y1)continue;const k=key(j);if(seen[k]||B[j]>t)continue;seen[k]=1;stack.push(j);}}
      // Largest circle that fits inside the clearing (chamfer distance transform of the region). Its centre ignores the
      // routes that leave the clearing, and its radius is the real size of the clearing.
      const ww=x1-x0+1,hh=y1-y0+1,D=new Float32Array(ww*hh),BIG=1e9;
      for(let i=0;i<D.length;i++)D[i]=seen[i]?BIG:0;
      for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){const i=y*ww+x;if(!D[i])continue;let v=D[i];
        if(x>0)v=Math.min(v,D[i-1]+1);if(y>0){v=Math.min(v,D[i-ww]+1);if(x>0)v=Math.min(v,D[i-ww-1]+1.414);if(x<ww-1)v=Math.min(v,D[i-ww+1]+1.414);}
        if(x===0||y===0||x===ww-1||y===hh-1)v=Math.min(v,1);D[i]=v;}
      for(let y=hh-1;y>=0;y--)for(let x=ww-1;x>=0;x--){const i=y*ww+x;if(!D[i])continue;let v=D[i];
        if(x<ww-1)v=Math.min(v,D[i+1]+1);if(y<hh-1){v=Math.min(v,D[i+ww]+1);if(x<ww-1)v=Math.min(v,D[i+ww+1]+1.414);if(x>0)v=Math.min(v,D[i+ww-1]+1.414);}D[i]=v;}
      let best=0;for(let i=0;i<D.length;i++)if(D[i]>best)best=D[i];
      let n2=0,mx=0,my=0;for(let y=0;y<hh;y++)for(let x=0;x<ww;x++)if(D[y*ww+x]>=best*0.96){n2++;mx+=x+x0;my+=y+y0;}
      mx/=n2;my/=n2;
      const pxm=W/TABLE.w;
      // Whole disc, rim included: walk outwards from the centre until the image stops being the same in every direction
      // (disc and its shaded rim are round and symmetric; the artwork around them is not).
      const ring=rho=>{let a=0,a2=0;for(let k=0;k<72;k++){const t=k/72*Math.PI*2,X=Math.round(mx+Math.cos(t)*rho),Y=Math.round(my+Math.sin(t)*rho);
        const v=X>=0&&X<W&&Y>=0&&Y<H?L[Y*W+X]:0;a+=v;a2+=v*v;}const m=a/72;return Math.sqrt(Math.max(0,a2/72-m*m));};
      let baseStd=0,nb=0;for(let rho=Math.max(2,best*0.55);rho<=best*0.9;rho++){baseStd+=ring(rho);nb++;}baseStd/=Math.max(1,nb);
      let edgePx=best;for(let rho=best;rho<=best*1.7;rho++){if(ring(rho)>Math.max(baseStd*2.5,baseStd+12)){edgePx=rho;break;}}
      const rm=(edgePx+0.5)/pxm;
      // a real clearing: at least 12 cm across, not an open flat field, and close to its plate
      if(rm<0.06||rm>0.27||Math.abs(mx-cx)>1.6*rx||Math.abs(my-cy)>1.6*ry)return fallback();
      // roundness: extent of the region pixels within 1.3 x the inscribed radius around the centre
      let ax0=Infinity,ax1=-Infinity,ay0=Infinity,ay1=-Infinity;const lim=(best*1.3)**2;
      for(let y=0;y<hh;y++)for(let x=0;x<ww;x++){if(!seen[y*ww+x])continue;const X=x+x0,Y=y+y0;if((X-mx)**2+(Y-my)**2>lim)continue;if(X<ax0)ax0=X;if(X>ax1)ax1=X;if(Y<ay0)ay0=Y;if(Y>ay1)ay1=Y;}
      found++;return {dx:(mx-cx)/W,dy:(my-cy)/H,ok:true,rm,wm:(ax1-ax0+1)/pxm,hm:(ay1-ay0+1)/pxm};
    });
    // The 16 clearings of one artwork share one size: a single measurement far from the median (a leak into a flat
    // background, or a rim read as the edge) is replaced by the median, and so are plates without a measurement.
    const radii=offsets.filter(o=>o.rm).map(o=>o.rm).sort((a,b)=>a-b),med=radii.length?radii[radii.length>>1]:null;
    if(med)for(const o of offsets){if(!o.rm||Math.abs(o.rm/med-1)>0.2){o.rm=med;o.rmFixed=true;}}
    return {offsets:offsets.map(({dx,dy,ok,rm})=>({dx:+dx.toFixed(5),dy:+dy.toFixed(5),ok,...(rm?{r:+rm.toFixed(4)}:{})})),found,shapes:offsets.map(o=>o.wm?{wm:o.wm,hm:o.hm,rm:o.rm}:null),median:med};
  }
  // Smooth local warp (Gaussian RBF, exact at the 16 plate centres): the clearing found at plate+offset is moved onto the plate.
  function solveWeights(offsets){
    const n=CENTERS.length,G=CENTERS.map(a=>CENTERS.map(b=>{const dx=(a.x-b.x)*TABLE.w,dy=(a.y-b.y)*TABLE.h;return Math.exp(-(dx*dx+dy*dy)/(2*SIGMA*SIGMA));}));
    const solve=rhs=>{const M=G.map((row,i)=>[...row,rhs[i]]);
      for(let c=0;c<n;c++){let piv=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[piv][c]))piv=r;[M[c],M[piv]]=[M[piv],M[c]];
        for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
      return M.map((row,i)=>row[n]/row[i]);};
    return {wx:solve(offsets.map(o=>o.dx)),wy:solve(offsets.map(o=>o.dy))};
  }
  // Each plate zone (out to ROUT from the plate centre) is remapped radially: the clearing found at plate+offset with
  // radius r becomes exactly the 28 cm plate, centred on it. Between R0 and ROUT the remap eases back into the smooth
  // translation field used elsewhere, so nothing outside the plate zones is scaled.
  const R0=0.14,ROUT=0.245;
  function render(image,W,H,p,offsets){
    image=prepare(image);
    const base=alignedCanvas(image,W,H,p);
    if(!offsets||offsets.every(o=>!o.dx&&!o.dy&&!o.r))return base;
    const {wx,wy}=solveWeights(offsets),src=base.getContext('2d').getImageData(0,0,W,H),sd=src.data;
    const out=new ImageData(W,H),od=out.data,k=-1/(2*SIGMA*SIGMA),n=CENTERS.length;
    const gxRow=new Float64Array(n),cxm=CENTERS.map(c=>c.x*TABLE.w),cym=CENTERS.map(c=>c.y*TABLE.h);
    const oxm=offsets.map(o=>o.dx*TABLE.w),oym=offsets.map(o=>o.dy*TABLE.h);
    const rad=offsets.map(o=>o.r?Math.min(ROUT*0.92,Math.max(R0*0.6,o.r)):R0);
    for(let y=0;y<H;y++){
      const ym=(y+.5)/H*TABLE.h;for(let j=0;j<n;j++){const d=ym-cym[j];gxRow[j]=d*d;}
      for(let x=0;x<W;x++){
        const xm=(x+.5)/W*TABLE.w;let bx=0,by=0,near=-1,nd=Infinity;
        for(let j=0;j<n;j++){const d=xm-cxm[j],d2=d*d+gxRow[j],g=Math.exp(d2*k);bx+=wx[j]*g;by+=wy[j]*g;if(d2<nd){nd=d2;near=j;}}
        // translation field (metres → source position in metres)
        let sxm=xm+bx*TABLE.w,sym=ym+by*TABLE.h;
        const d=Math.sqrt(nd);
        if(d<ROUT){
          const j=near,r=rad[j],s=d<=R0?d*r/R0:r+(d-R0)*(ROUT-r)/(ROUT-R0),f=d>0?s/d:0;
          const rxm=cxm[j]+oxm[j]+(xm-cxm[j])*f,rym=cym[j]+oym[j]+(ym-cym[j])*f;
          const t=d<=R0?1:1-(d-R0)/(ROUT-R0),w=t*t*(3-2*t);
          sxm=w*rxm+(1-w)*sxm;sym=w*rym+(1-w)*sym;
        }
        let sx=sxm/TABLE.w*W-.5,sy=sym/TABLE.h*H-.5;sx=Math.min(W-1.001,Math.max(0,sx));sy=Math.min(H-1.001,Math.max(0,sy));
        const x0=sx|0,y0=sy|0,fx=sx-x0,fy=sy-y0,i00=(y0*W+x0)*4,i10=i00+4,i01=i00+W*4,i11=i01+4,o=(y*W+x)*4;
        for(let ch=0;ch<3;ch++)od[o+ch]=(sd[i00+ch]*(1-fx)+sd[i10+ch]*fx)*(1-fy)+(sd[i01+ch]*(1-fx)+sd[i11+ch]*fx)*fy;
        od[o+3]=255;
      }
    }
    const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(out,0,0);return c;
  }
  // Full automatic fit: global rectangle, then each plate.
  // Does this table artwork work on the real plates without heavy editing? Round clearings, little one-sided stretch,
  // every plate found and only small moves per plate.
  // Plates are round: clearing between 0.88 and 1.12 : 1, at most 12% one-sided stretch, plates moved at most 5 cm.
  // Clearing size is corrected to the 28 cm plate; only clearings between 22 and 38 cm are accepted (small correction).
  const LIMITS={found:16,measured:12,round:[0.88,1.12],aniso:0.12,move:0.05,size:[0.22,0.38]};
  function evaluate(image){
    image=prepare(image);const g=auto(image),r=refine(image,g);
    const aniso=(g.kx/g.ky)*(MAP.w/MAP.h)/(image.width/image.height);
    const sizes=r.shapes.filter(Boolean),ratios=sizes.map(z=>z.wm/z.hm).sort((a,b)=>a-b);
    const round=ratios.length?ratios[ratios.length>>1]:null;
    const diam=sizes.map(z=>2*z.rm).sort((a,b)=>a-b),size=diam.length?diam[diam.length>>1]:null;
    const worst=diam.length?Math.max(diam[diam.length-1]/0.28,0.28/diam[0]):1;
    const move=Math.max(0,...r.offsets.map(o=>Math.hypot(o.dx*TABLE.w,o.dy*TABLE.h)));
    const reasons=[];
    if(r.found<LIMITS.found)reasons.push('só '+r.found+' de 16 pratos com clareira');
    if(sizes.length<LIMITS.measured)reasons.push('clareiras sem contorno definido');
    if(round!=null&&(round<LIMITS.round[0]||round>LIMITS.round[1]))reasons.push('clareiras ovais ('+round.toFixed(2).replace('.',',')+' : 1)');
    if(diam.length&&diam[diam.length-1]>LIMITS.size[1])reasons.push('pratos grandes demais para corrigir (até '+Math.round(diam[diam.length-1]*100)+' cm)');
    if(diam.length&&diam[0]<LIMITS.size[0])reasons.push('pratos pequenos demais ('+Math.round(diam[0]*100)+' cm)');
    if(Math.abs(aniso-1)>LIMITS.aniso)reasons.push('precisa esticar '+Math.round(Math.abs(aniso-1)*100)+'% de um lado');
    if(move>LIMITS.move)reasons.push('prato deslocado até '+Math.round(move*100)+' cm');
    return {ok:!reasons.length,reasons,found:r.found,measured:sizes.length,round,size,aniso,move};
  }
  function autoFull(image){const g=auto(image),r=refine(image,g);return {...g,offsets:r.offsets,found:r.found};}
  // The automatic fit without bending the picture: the per-plate corrections become one straight move and scale of the
  // whole picture (least squares over the 16 places, x and y apart), so nothing stretches around the plates.
  function autoWhole(image){
    const a=autoFull(image),o=a.offsets;if(!o)return {...a,offsets:null};
    const line=(h,c)=>{const n=h.length,mh=h.reduce((s,v)=>s+v,0)/n,mc=c.reduce((s,v)=>s+v,0)/n;
      let sh=0,shc=0;for(let i=0;i<n;i++){sh+=(h[i]-mh)**2;shc+=(h[i]-mh)*(c[i]-mc);}const k=sh>1e-9?shc/sh:1;return [k,mc-k*mh];};
    const [axk,axb]=line(CENTERS.map((c,i)=>c.x+o[i].dx),CENTERS.map(c=>c.x)),[ayk,ayb]=line(CENTERS.map((c,i)=>c.y+o[i].dy),CENTERS.map(c=>c.y));
    const fit=cover({bx:axk*a.bx+axb,kx:axk*a.kx,by:ayk*a.by+ayb,ky:ayk*a.ky});
    return {...a,...fit,offsets:null,found:a.found};
  }
  // Keeps any manual fit covering the whole table.
  function cover(p){const kx=Math.max(1,p.kx),ky=Math.max(1,p.ky);
    return {...p,kx,ky,bx:Math.min(0,Math.max(1-kx,p.bx)),by:Math.min(0,Math.max(1-ky,p.by))};}
  return {CENTERS,RX,RY,STRETCH,LIMITS,cover,prepare,detect,auto,refine,render,autoFull,autoWhole,evaluate,score:(image,p)=>score(analyse(image),p)};
})();
