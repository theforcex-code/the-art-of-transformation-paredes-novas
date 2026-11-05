'use strict';
// Reuse the original studio's CAD and projection channels without its server.
// The gallery only needs: look, orbit, zoom, fixed cameras and export. Every original panel stays hidden (see build_sala3d.py).
(()=>{
  const a=window.__v3,T=window.THREE,doc=document;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layer(key,on){const b=doc.querySelector('#v3layers [data-l="'+key+'"]');if(b&&(b.getAttribute('aria-pressed')==='true')!==on)b.click();}

  // Camera presets framed from the real projection surfaces (measured in the scene), so each one fills the screen
  // whatever its shape. Saved views (pharmaStore) go through the same flight.
  const SURF={p01:{min:[0.044,0,0.016],max:[7.854,2,0.016],normal:[0,0,-1]},p02:{min:[0.011,0,-3.316],max:[0.011,2,0.024],normal:[1,0,0]},mesa:{min:[1.304,0.75,-2.178],max:[6.304,0.75,-1.171]}};
  const V=(x,y,z)=>new T.Vector3(x,y,z);
  const centerOf=s=>V((s.min[0]+s.max[0])/2,(s.min[1]+s.max[1])/2,(s.min[2]+s.max[2])/2);
  function fitDistance(w,h,margin){
    const half=T.MathUtils.degToRad(a.cam.fov)/2,t=Math.tan(half);
    return Math.max((h/2)/t,(w/2)/(t*a.cam.aspect))*margin;
  }
  // Like Luciano's viewer, outside views look from above the ceiling: the slatted ceiling then hides the top 50 cm of wall
  // that the projectors do not reach (projection is 2.00 m on a 2.50 m wall). Inside views (Convidado) show it, as a guest would.
  const builtIn=(view,pull)=>()=>{a.goto(view);const target=a.controls.target.clone(),pos=a.cam.position.clone();
    if(pull&&a.cam.aspect<1)pos.sub(target).multiplyScalar(Math.max(1,1.3/a.cam.aspect)).add(target);return {target,pos};};
  const PRESETS={
    sala:builtIn('persp',true),
    // Parede 01 straight on, at about eye height (1,6 m), with the slatted ceiling hidden so it does not cover the top.
    parede1:()=>{const target=V(3.95,1.0,-0.9);return {target,pos:target.clone().addScaledVector(V(0,0.1,-1).normalize(),fitDistance(8.3,3.4,1.05)),layers:{teto:false,opostas:false,ripas:false}};},
    // Parede 02 straight on, at about eye height (1,5 m), down the length of the table; slatted ceiling hidden.
    parede2:()=>{const target=V(0.02,1.05,-1.65);return {target,pos:target.clone().addScaledVector(V(1,0.12,0).normalize(),fitDistance(3.6,2.6,1.3)),layers:{teto:false,opostas:false,ripas:false}};},
    mesa:()=>{const s=SURF.mesa,target=centerOf(s);return {target,pos:target.clone().addScaledVector(V(0,1,-0.62).normalize(),fitDistance(s.max[0]-s.min[0]+0.7,2.9,1.04)),layers:{teto:false,opostas:false,ripas:false}};},
    // The whole room from the open corner, close: both projected walls and the table fill the frame, no ceiling in front.
    inteira:()=>{const target=V(3.8,0.75,-1.2),k=Math.max(0.9,(16/9)/a.cam.aspect);return {target,pos:target.clone().addScaledVector(V(4.03,2.17,-5.51),k),layers:{teto:false,opostas:false,ripas:false}};},
    // Camera inside the room: keep every wall, otherwise a hidden wall reads as a black hole at the side.
    convidado:()=>{a.goto('convidado');return {target:a.controls.target.clone(),pos:a.cam.position.clone(),layers:{opostas:true,ripas:true}};}
  };

  let flight=0,current='sala',userMoved=false;
  a.controls.addEventListener('start',()=>{userMoved=true;cancelAnimationFrame(flight);});
  function fly(pose,instant){
    const p0=a.cam.position.clone(),t0=a.controls.target.clone();
    if(a.getEye()>=0)a.goto('persp');
    if(pose.layers)for(const [k,v] of Object.entries(pose.layers))layer(k,v);
    cancelAnimationFrame(flight);userMoved=false;
    if(instant||reduced){a.cam.position.copy(pose.pos);a.controls.target.copy(pose.target);a.controls.update();return;}
    const start=performance.now(),ms=900,ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const step=now=>{const k=ease(Math.min(1,(now-start)/ms));a.cam.position.lerpVectors(p0,pose.pos,k);a.controls.target.lerpVectors(t0,pose.target,k);a.controls.update();if(k<1)flight=requestAnimationFrame(step);};
    flight=requestAnimationFrame(step);
  }
  function flyTo(name,instant){
    if(!PRESETS[name])name='sala';current=name;
    const keep={pos:a.cam.position.clone(),target:a.controls.target.clone()};
    const pose=PRESETS[name]();
    a.cam.position.copy(keep.pos);a.controls.target.copy(keep.target);
    fly(pose,instant);
  }
  const vec=arr=>V(arr[0],arr[1],arr[2]);
  function showView(view){current=null;fly({pos:vec(view.pos),target:vec(view.target),layers:view.layers});}
  function currentView(){
    const r=n=>Math.round(n*1000)/1000;
    return {pos:a.cam.position.toArray().map(r),target:a.controls.target.toArray().map(r),layers:{teto:!!a.L.teto,ripas:!!a.L.ripas,opostas:!!a.L.opostas}};
  }
  // Keep a preset framed when the panel is resized, unless the person has moved the camera since.
  let resizeTimer=0;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(current&&!userMoved)flyTo(current,true);},150);});

  // Presentation cleanup: no nits or labels; projectors stay so their supports are not left hanging.
  function presentation(){
    // Same defaults as Luciano's viewer (light cones on), minus the technical readouts.
    layer('beams',true);layer('nits',false);layer('aber',false);layer('proj',true);layer('pratos',true);
    const box=new T.Box3(),drop=[];
    a.scene.traverse(o=>{
      if(o.isSprite)o.visible=false;
      // Corrugated metal strip of the CAD that sits on Parede 01 at 2 m and reads as a floating bar over the projection.
      const name=[].concat(o.material||[]).map(m=>m.name||'').join(' ');
      if(o.isMesh&&/Metal Corrugated|JianE_Mtl_2021102215595634417/.test(name)){box.setFromObject(o);if(box.min.y>1.5&&box.max.y<2.4)o.visible=false;}
      // the strips of stone and grass the CAD leaves outside the room (beyond Parede 02 and the door)
      if(o.isMesh&&/Piso_cacos_pedra_ferro|Vegetation Grass/.test(name))drop.push(o);
      // the CAD's door frame, wall frame and their saw-toothed edge strips: left standing where the open walls are, they read
      // as a ladder and a broken border; the steel panel flat on the floor goes too. The table's own base (0.73 m) stays.
      if(o.isMesh&&/^(Inox_PORTAS|TEXTURA_PAREDES)$/.test(name))drop.push(o);
      if(o.isMesh&&name==='painel inox'){box.setFromObject(o);if(box.max.y>1||box.max.y-box.min.y<0.02)drop.push(o);else dropTriangles(o,v=>v.x>7.2);}   // (the counter's steel frame)
      // a narrow concrete counter at table height against the far wall, with no legs: it reads as a table floating
      if(o.isMesh&&name==='*10')dropTriangles(o,v=>v.x>7.2&&v.y>0.6&&v.y<0.9);
      if(o.isMesh&&name==='*5')floorMaterial(o);
      // the light outline the viewer draws around the projected walls: black, so no white line frames the walls
      if(o.isLineSegments&&!Array.isArray(o.material)&&o.material.color&&o.material.color.getHex()===0xc5c9f5)o.material.color.set(0x000000);
    });
    // taken out of the scene, not just hidden: the viewer's wall layers would show them again
    for(const o of drop)o.parent?.remove(o);
  }
  // remove the triangles of a mesh whose three corners (in the room's coordinates) pass the test
  function dropTriangles(o,test){
    o.updateMatrixWorld(true);let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    const P=g.attributes.position,v=new T.Vector3(),keep=[];
    for(let t=0;t<P.count;t+=3){let all=true;for(let k=0;k<3;k++){v.fromBufferAttribute(P,t+k).applyMatrix4(o.matrixWorld);if(!test(v)){all=false;break;}}if(!all)keep.push(t);}
    if(keep.length*3===P.count)return;
    const out=new T.BufferGeometry();
    for(const [key,attr] of Object.entries(g.attributes)){const n=attr.itemSize,src=attr.array,dst=new src.constructor(keep.length*3*n);
      keep.forEach((t,j)=>dst.set(src.subarray(t*n,(t+3)*n),j*3*n));out.setAttribute(key,new T.BufferAttribute(dst,n,attr.normalized));}
    o.geometry=out;}
  // the floor: a dark graphite micro-cement, seamless, with a soft sheen (the CAD's was a small brown concrete picture)
  function floorMaterial(o){
    const N=1024,c=doc.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d');
    g.fillStyle='#8f8a82';g.fillRect(0,0,N,N);
    let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    // soft clouds of lighter and darker trowel marks, drawn wrapped so the picture tiles without a seam
    const blot=(x,y,r,col)=>{for(const dx of [-N,0,N])for(const dy of [-N,0,N]){const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,r);
      gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x+dx-r,y+dy-r,2*r,2*r);}};
    for(let i=0;i<70;i++)blot(rnd()*N,rnd()*N,90+rnd()*260,rnd()<0.5?'rgba(255,248,236,0.06)':'rgba(0,0,0,0.09)');
    for(let i=0;i<260;i++)blot(rnd()*N,rnd()*N,8+rnd()*40,rnd()<0.5?'rgba(255,250,240,0.03)':'rgba(0,0,0,0.05)');
    const im=g.getImageData(0,0,N,N),d=im.data;for(let i=0;i<d.length;i+=4){const n=(rnd()-0.5)*7;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}g.putImageData(im,0,0);
    const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;if('colorSpace' in tex)tex.colorSpace='srgb';else tex.encoding=T.sRGBEncoding;
    tex.anisotropy=8;
    // about one picture every 2.5 m of floor, whatever the CAD's UVs are
    const uv=o.geometry.attributes.uv;let rep=1;
    if(uv){let u0=1e9,u1=-1e9;for(let i=0;i<uv.count;i++){const u=uv.getX(i);u0=Math.min(u0,u);u1=Math.max(u1,u);}
      const bb=new T.Box3().setFromObject(o),w=bb.max.x-bb.min.x;if(u1>u0&&w>0)rep=(w/2.5)/(u1-u0);}
    tex.repeat.set(rep,rep);
    // the CAD's own material keeps its lighting (the room's shaders are built on it): only its picture changes
    const m=o.material;if(m.map)m.map.dispose?.();m.map=tex;m.roughness=0.5;m.needsUpdate=true;}

  const {loadImage,cleanBorders,logoBox,extendCanvas,platesCanvas,fitCanvas}=window.pharmaArt;   // surface-art.js

  const display={},fades={};

  // ---- Movement in the pictures (Água / Moléculas and Matéria) ----
  // Nothing is generated: the picture itself is read through a small moving displacement, on the graphics card, inside
  // each projector's own shader. When a picture is shown, a small map of it is worked out once: where the sea is (below
  // the horizon), the water seen from above on the table, the leaves, branches and flowers that the wind moves (large
  // shapes, not the sky, the sun or a far haze), and the plates of the table, which never move.
  //   sea:     waves in perspective (larger and stronger near, nearly still at the horizon), the sun's glints twinkling
  //   water:   the table's water seen from above, refracting gently
  //   foliage: a slow sway in passing gusts, plus a small flutter of the leaves
  const MOTION=window.__motion={on:true,amp:1,t0:performance.now(),ch:{},raf:0};
  const MKIND={none:0,sea:1,water:2,foliage:3};
  function motionMask(canvas,motion,surface){
    const table=surface==='mesa',kind=motion==='agua'?(table?MKIND.water:MKIND.sea):motion==='materia'?MKIND.foliage:0;
    if(!kind)return null;
    const w=canvas.width,h=canvas.height,mw=Math.max(8,Math.round(w/8)),mh=Math.max(4,Math.round(h/8)),n=mw*mh;
    const c=doc.createElement('canvas');c.width=mw;c.height=mh;const g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(canvas,0,0,mw,mh);const px=g.getImageData(0,0,mw,mh).data;
    const L=new Float32Array(n),S=new Float32Array(n),R=new Float32Array(n),G=new Float32Array(n);
    for(let i=0;i<n;i++){const r=px[i*4]/255,gg=px[i*4+1]/255,b=px[i*4+2]/255;L[i]=0.2126*r+0.7152*gg+0.0722*b;S[i]=Math.max(r,gg,b)-Math.min(r,gg,b);}
    const blur=(A,passes)=>{let src=A;for(let p=0;p<passes;p++){const o=new Float32Array(n);
      for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){let s=0,k=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=mw||yy>=mh)continue;s+=src[yy*mw+xx];k++;}o[y*mw+x]=s/k;}
      src=o;}return src;};
    const p90=A=>{const s=Array.from(A).sort((a,b)=>a-b);return Math.max(1e-4,s[Math.floor(s.length*0.9)]);};
    let hz=0;
    if(kind===MKIND.sea){
      // the horizon: the row where the mean brightness changes most, in the middle of the picture
      const hh=Math.max(40,Math.round(h/2)),hc=doc.createElement('canvas');hc.width=128;hc.height=hh;
      const hg=hc.getContext('2d',{willReadFrequently:true});hg.drawImage(canvas,0,0,128,hh);const hp=hg.getImageData(0,0,128,hh).data;
      const m=new Float32Array(hh);for(let y=0;y<hh;y++){let s=0;for(let x=0;x<128;x++){const i=(y*128+x)*4;s+=hp[i]*0.2126+hp[i+1]*0.7152+hp[i+2]*0.0722;}m[y]=s/128;}
      let best=-1,by=Math.round(hh*0.5);
      for(let y=Math.round(hh*0.22);y<Math.round(hh*0.85);y++){const d=Math.abs(m[Math.min(hh-1,y+2)]-m[Math.max(0,y-2)]);if(d>best){best=d;by=y;}}
      hz=by/hh;R.fill(1);
    }else if(kind===MKIND.water)R.fill(1);
    else{
      // large shapes (leaves, branches, flowers, dandelions) have strong edges at a coarse scale; the sky, the sun's glow
      // and the fine texture of far forest or sand do not
      const Lb=blur(L,1),Sb=blur(S,1),E=new Float32Array(n),F=new Float32Array(n);
      const at=(A,x,y)=>A[Math.min(mh-1,Math.max(0,y))*mw+Math.min(mw-1,Math.max(0,x))];
      for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const i=y*mw+x;
        const gx=at(Lb,x+2,y)-at(Lb,x-2,y),gy=at(Lb,x,y+2)-at(Lb,x,y-2),cx=at(Sb,x+2,y)-at(Sb,x-2,y),cy=at(Sb,x,y+2)-at(Sb,x,y-2);
        E[i]=Math.hypot(gx,gy)+0.6*Math.hypot(cx,cy);F[i]=Math.abs(L[i]-Lb[i]);}
      const Eb=blur(E,2),e9=p90(Eb),f9=p90(F),Ls=blur(L,2);
      for(let i=0;i<n;i++){const sun=1-Math.min(1,Math.max(0,(Ls[i]-0.8)/0.12));
        R[i]=Math.min(1,Eb[i]/e9)*sun;G[i]=Math.min(1,F[i]/f9)*R[i];}
    }
    if(table){                                   // the plates (black discs) and a margin around them stay still
      const hole=new Uint8Array(n);for(let i=0;i<n;i++)hole[i]=L[i]<0.06&&S[i]<0.08?1:0;
      const near=new Uint8Array(n);
      for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){let on=0;
        for(let dy=-2;dy<=2&&!on;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<mw&&yy<mh&&hole[yy*mw+xx]){on=1;break;}}
        near[y*mw+x]=on;}
      for(let i=0;i<n;i++)if(near[i]){R[i]=0;G[i]=0;}
    }
    const Rb=blur(R,2),Gb=blur(G,1),data=new Uint8Array(n*4);
    for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const i=y*mw+x,o=((mh-1-y)*mw+x)*4;   // rows from the bottom, like the picture's texture
      data[o]=Math.round(Rb[i]*255);data[o+1]=Math.round(Gb[i]*255);data[o+3]=255;}
    const tex=new T.DataTexture(data,mw,mh,T.RGBAFormat);tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearFilter;tex.needsUpdate=true;
    return {kind,hz,tex};
  }
  const MOTION_GLSL=`

// "Ondas": up to 6 waves in world space (metres). wSrc: origin xyz and age in s (w<0: none); wPar: amp, speed, life, width
#define WMAX 6
uniform vec4 wSrc[WMAX];uniform vec4 wPar[WMAX];uniform float wOn;varying vec3 vWp;
// a wave with wK[i]=1 leaves the outline of the Forma (not its centre): wFx/wFy the logo's own axes, wProf its radius by angle
uniform float wK[WMAX];uniform vec3 wFx;uniform vec3 wFy;uniform float wProf[48];uniform float wSeed[WMAX];
// the Forma's liquid, three looks (wStyle): 0 a dense glossy liquid oozing out of it, 1 a single swell as on still
// water, 2 the Forma's own chrome melting out over the wall. liqH: the liquid's height at d m from the Forma's edge,
// under a front at Rf (a rounded body, thicker near the Forma, with a soft rounded edge)
uniform float wStyle;
float liqH(float d,float Rf){float u=d/max(Rf,1e-3);return (1.0-smoothstep(0.78,1.0,u))*(0.45+0.55*sqrt(max(0.0,1.0-0.85*u*u)));}
// "Ondas na imagem": ripples drawn in the picture's own space. Kind 1, on the water of a wall picture: they leave a
// sphere where it sits on the water and spread over the water in perspective (ground coordinates from the water line),
// hidden behind every sphere. Kind 2, on the table: soft rings around a plate that die out before the next plate.
// pS: x, y (fractions of the picture; for water the point where the sphere touches it), age (s), kind; pP: amp, speed,
// life, starting radius (water: in ground units; plate: in picture heights)
#define PMAX 32
uniform vec4 pS[PMAX];uniform vec4 pP[PMAX];uniform float pOn,pCh,pWl,pF,pNd,pPr,pKr;uniform vec3 pDisc[32];uniform vec2 pPl[16];uniform vec2 pPk[16];
// golden dust: one layer of grains scattered at random (cell c, in picture heights), each its own size and twinkle
float dust(vec2 q,float t,float c,float s){
  vec2 cl=q/c+s,ci=floor(cl),fq=fract(cl)-0.5;
  float h1=fract(sin(dot(ci,vec2(127.1,311.7)))*43758.5453),h2=fract(sin(dot(ci,vec2(269.5,183.3)))*43758.5453),h3=fract(h1*17.13+h2*3.7);
  float pd=length(fq-(vec2(h1,h2)-0.5)*0.8),sz=0.012+0.05*h3*h3;
  return step(0.7,h3)*exp(-pd*pd/sz)*pow(h2,1.5)*1.6*(0.35+0.65*max(0.0,sin(t*(4.0+5.0*h1)+h2*60.0)));}
float sheetH(float x,float rw){float y=clamp(x/rw,-8.0,8.0),th=(1.0-exp(-2.0*y))/(1.0+exp(-2.0*y));
  return (0.5-0.5*th)*exp(min(x,0.0)/0.3)*0.8+exp(-pow((x+1.1*rw)/(1.2*rw),2.0))*0.45;}
float formaR(vec2 q){float a=atan(q.y,q.x)/6.2832*48.0;if(a<0.0)a+=48.0;int i=int(floor(a));float f=fract(a);
  return mix(wProf[i],wProf[i+1>47?0:i+1],f);}
uniform sampler2D mA,mB;uniform float mKA,mKB,mHA,mHB,mMix,mTime,mAmp,mOx,mW;uniform vec2 mSize;
float mFade(float lambda){return smoothstep(5.0,14.0,lambda);}          // no wave finer than a few pixels (no shimmer)
vec3 mWave(vec2 w,vec2 K,float om,float a,float sc,vec2 dpx){
  float ph=dot(w,K)-om*mTime,lam=6.2832/max(1e-4,length(K*dpx));
  return vec3(normalize(K)*cos(ph)*a*mFade(lam)*sc,ph);}
vec3 mOff(float k,sampler2D m,float hz,vec2 uv){
  if(k<0.5)return vec3(0.0);
  vec4 q=texture2D(m,uv);
  vec2 px=vec2(uv.x*mSize.x+mOx,(1.0-uv.y)*mSize.y);
  float t=mTime,H=mSize.y;vec2 o=vec2(0.0);float gl=0.0;
  if(k<1.5){                                                            // sea, in perspective below the horizon
    float D=px.y-hz*H;if(D<1.0)return vec3(0.0);
    vec2 w=vec2(px.x/D,H/D),dpx=vec2(1.0/D,H/(D*D));                    // ground coordinates and their change per pixel
    float near=smoothstep(0.0,0.5*H,D)*smoothstep(0.0,0.06*H,D);
    vec3 a1=mWave(w,vec2(18.0,30.0),1.05,2.4,near,dpx),a2=mWave(w,vec2(-24.0,37.0),1.3,1.8,near,dpx),
         a3=mWave(w,vec2(6.0,56.0),1.65,1.3,near,dpx),a4=mWave(w,vec2(41.0,72.0),2.3,0.7,near,dpx);
    o=a1.xy+a2.xy+a3.xy+a4.xy;o.y*=0.8;
    float sp=0.5+0.5*sin(dot(w,vec2(63.0,118.0))-3.1*t+2.0*sin(dot(w,vec2(-47.0,83.0))+1.7*t));
    gl=0.45*pow(sp,6.0)*smoothstep(0.0,0.08*H,D)*q.r;
  }else if(k<2.5){                                                      // water seen from above
    vec2 w=px/H,dpx=vec2(1.0/H);
    vec3 a1=mWave(w,vec2(30.0,38.0),0.9,2.6,1.0,dpx),a2=mWave(w,vec2(-42.0,25.0),1.1,2.0,1.0,dpx),
         a3=mWave(w,vec2(15.0,-50.0),1.4,1.5,1.0,dpx),a4=mWave(w,vec2(70.0,60.0),2.0,0.7,1.0,dpx);
    o=(a1.xy+a2.xy+a3.xy+a4.xy)*q.r;
    gl=0.18*pow(0.5+0.5*sin(a1.z+a2.z*0.7+a3.z*0.5),5.0)*q.r;
  }else{                                                                // leaves and branches in the wind
    float gx=px.x/mW,gy=px.y/H;
    float gust=0.55+0.45*sin(0.31*t-gx*5.5)*sin(0.17*t+gx*2.3+1.3);
    float sway=0.7*sin(1.05*t+gx*14.0+gy*2.0)+0.3*sin(1.9*t+gx*23.0-gy*3.0+0.8);
    o=vec2(3.4*sway,1.1*sin(1.4*t+gx*17.0+gy*5.0))*q.r*gust;
    o+=0.7*q.g*gust*vec2(sin(5.5*t+px.x*0.05+px.y*0.031),cos(6.3*t+px.x*0.037-px.y*0.045));
  }
  return vec3(o,gl);}
// "Tecido": the wall as a cloth that comes out of the Forma (the logo) and opens over the walls (tMode 1), or the picture
// on show drawn into the Forma like a cloth pulled in (tMode 2). tO: the Forma, in pixels along the whole wall.
uniform sampler2D tPrev;uniform float tMode,tProg;uniform vec2 tO;
vec3 fabric(vec2 uv){
  vec2 px=vec2(uv.x*mSize.x+mOx,(1.0-uv.y)*mSize.y),dv=px-tO;
  float d=length(dv),ang=atan(dv.y,dv.x),H=mSize.y;
  float Rmax=length(vec2(max(tO.x,mW-tO.x),max(tO.y,H-tO.y)))*1.1;
  float e=tProg*tProg*(3.0-2.0*tProg),out_=tMode<1.5?1.0:0.0;
  float R=Rmax*(out_>0.5?e:1.0-e);
  float Rw=R*(1.0+0.07*sin(5.0*ang+6.0*tProg)+0.035*sin(11.0*ang-9.0*tProg)+0.02*sin(17.0*ang+4.0*tProg));
  float behind=max(0.0,Rw-d);                                               // inside the cloth, from its edge
  float fold=sin(behind*0.085-tProg*9.0)*exp(-behind/150.0)*(1.0-0.6*e);   // folds that run behind the edge and settle
  float k=1.0+0.5*(out_>0.5?1.0-e:e)*(1.0-smoothstep(0.0,Rmax,d));         // squeezed toward the Forma: coming out / drawn in
  vec2 src=tO+dv*k+(d>0.001?dv/d:vec2(1.0,0.0))*fold*6.0;
  vec2 uvS=vec2((src.x-mOx)/mSize.x,1.0-src.y/H);
  vec3 cloth=out_>0.5?texture2D(map,uvS).rgb:texture2D(tPrev,uvS).rgb;
  vec3 under=out_>0.5?texture2D(tPrev,uv).rgb:texture2D(map,uv).rgb;
  cloth*=1.0+0.22*fold;                                                    // light and shade on the folds
  cloth+=0.16*exp(-pow((d-Rw)/5.0,2.0));                                    // the rolled edge catching the light
  under*=1.0-0.35*smoothstep(Rw+45.0,Rw,d);                                 // the cloth's shadow on the picture under it
  return mix(cloth,under,smoothstep(Rw-2.0,Rw+2.0,d));}
`;
  function patchProjector(m){
    if(!m||!m.isShaderMaterial||m.userData.motion||!/texture2D\(map, uvc\)/.test(m.fragmentShader))return;
    const U=m.uniforms;
    const W0=()=>Array.from({length:6},()=>new T.Vector4(0,0,0,-1));
    const P0=()=>Array.from({length:32},()=>new T.Vector4(0,0,0,0));
    Object.assign(U,{pS:{value:P0()},pP:{value:P0()},pOn:{value:0},pCh:{value:0},pWl:{value:0.44},pF:{value:2},pNd:{value:0},pPr:{value:0.04},pKr:{value:0.139},pPk:{value:Array.from({length:16},()=>new T.Vector2(-9,-9))},
      pDisc:{value:Array.from({length:32},()=>new T.Vector3())},pPl:{value:Array.from({length:16},()=>new T.Vector2(-9,-9))},
      wSrc:{value:W0()},wPar:{value:W0()},wOn:{value:0},wStyle:{value:0},wK:{value:new Array(6).fill(0)},wSeed:{value:new Array(6).fill(0)},wFx:{value:new T.Vector3(0,0,-1)},wFy:{value:new T.Vector3(0,1,0)},wProf:{value:FORMA_EDGE.prof},mA:{value:null},mB:{value:null},mKA:{value:0},mKB:{value:0},mHA:{value:0},mHB:{value:0},mMix:{value:1},
      mTime:{value:0},mAmp:{value:0},mOx:{value:0},mW:{value:1},mSize:{value:new T.Vector2(1,1)},
      tPrev:{value:null},tMode:{value:0},tProg:{value:1},tO:{value:new T.Vector2(0,0)}});
    m.fragmentShader=m.fragmentShader.replace('void main(){',MOTION_GLSL+'void main(){').replace(
      'vec3 c = hasMap > 0.5 ? texture2D(map, uvc).rgb : vec3(0.0);',
      `vec3 mo=vec3(0.0);
  if(mAmp>0.0 && hasMap>0.5){ vec3 oA=mOff(mKA,mA,mHA,uvc),oB=mOff(mKB,mB,mHB,uvc); mo=mix(oA,oB,mMix)*mAmp; }
  vec2 wOff=vec2(0.0);float wRim=0.0,wCau=0.0,wL=0.0,wS=0.0,pSoft=0.0,pLt=0.0,wC=0.0,wHt=0.0;vec3 wG=vec3(0.0),wGt=vec3(0.0),wNs=vec3(0.0,0.0,1.0);
  if(wOn>0.5){
    vec3 dA=dFdx(vWp),dB=dFdy(vWp);vec2 dU=dFdx(uvc),dV=dFdy(uvc);
    for(int i=0;i<WMAX;i++){vec4 S=wSrc[i],P=wPar[i];
      if(S.w>=0.0){
        vec3 r=vWp-S.xyz;float d=length(r),R=P.y*S.w,inside=1.0;vec3 n=r/max(d,1e-4);
        if(wK[i]>0.5){                                                  // distance to the Forma's edge, outward only
          vec2 q=vec2(dot(r,wFx),dot(r,wFy));float h=dot(r,cross(wFx,wFy)),rho=length(q),sd=rho-formaR(q),so=max(sd,0.0);
          d=sqrt(h*h+so*so);inside=smoothstep(-0.03,0.04,sd);
          n=normalize(wFx*q.x/max(rho,1e-4)*so+wFy*q.y/max(rho,1e-4)*so+cross(wFx,wFy)*h+vec3(1e-5));}
        // a liquid coming out of the Forma: a clear film pours out of its outline and spreads over the wall, with a
        // rounded lip at its front and an uneven, slowly moving edge (no rings, no lines). It shows the way a liquid
        // does: the picture bends under it, a soft light and shade on its lip, a faint sheen where it lies; it thins
        // and fades as it spreads.
        // it oozes out slowly (most of its spread in the first ~3 s, under a metre) and then fades where it lies;
        // the swell (look 1) runs further and faster, as a wave on water does
        float sw1=step(0.5,wStyle)*step(wStyle,1.5);
        float Rw=mix((0.5+0.35*P.x)*(1.0-exp(-S.w/2.4)),1.7*(1.0-exp(-S.w/2.6)),sw1)+0.02;
        float age=(1.0-smoothstep(0.4*P.z,P.z,S.w))*smoothstep(0.0,0.5,S.w),thin=1.0/(1.0+0.5*Rw);
        float E0=P.x*age*thin*inside*(wK[i]>0.5?1.0:smoothstep(0.1,0.5,d));
        vec2 qa=vec2(dot(r,wFx),dot(r,wFy));float ang=atan(qa.y,qa.x),sd0=wSeed[i],tt=S.w;
        vec3 gAng=(wFx*(-qa.y)+wFy*qa.x)/max(dot(qa,qa),1e-4);              // how the angle changes across the wall
        float h1=fract(sin(sd0*12.9898)*43758.5453)*6.2832,h2=fract(h1*7.13)*6.2832,h3=fract(h1*3.71+0.37)*6.2832;
        // its edge: wide tongues and small fingers that drift slowly, so it never reads as a circle (the swell: barely)
        float wob=0.55*sin(3.0*ang+h1+0.25*tt)+0.3*sin(5.0*ang+h2-0.35*tt)+0.15*sin(9.0*ang+h3+0.5*tt);
        float wobA=1.65*cos(3.0*ang+h1+0.25*tt)+1.5*cos(5.0*ang+h2-0.35*tt)+1.35*cos(9.0*ang+h3+0.5*tt);
        float wk=mix(0.22,0.07,sw1),Rf=Rw*(1.0+wk*wob);
        float H,dHd,dHR;
        if(sw1<0.5){                                                     // a body of liquid (looks 0 and 2)
          H=liqH(d,Rf);dHd=(liqH(d+0.01,Rf)-liqH(d-0.01,Rf))/0.02;dHR=(liqH(d,Rf+0.01)-liqH(d,Rf-0.01))/0.02;
          float ph=d*6.0-tt*1.2+1.8*sin(2.0*ang+h2)+h3;                    // its surface still moves, slowly
          float am=mix(0.07,0.24,step(1.5,wStyle));                         // the chrome ripples more, so it reflects light and dark
          float pk=d*11.0+tt*1.6+2.4*sin(3.0*ang+h1);
          dHd+=am*6.0*cos(ph)*H+am*0.5*11.0*cos(pk)*H;H+=am*sin(ph)*H+am*0.5*sin(pk)*H;
          float uc=(d/max(Rf,1e-3)-1.04)/0.06;wRim+=E0*exp(-uc*uc)*(1.0-wStyle*0.5);   // the soft shade it casts on the wall, right at its edge
          wCau=max(wCau,E0*smoothstep(0.0,0.25,H));                          // where the liquid covers the wall
        }else{                                                           // one swell, and a lower trough behind it
          float sg=0.1+0.07*Rw,x=d-Rf,y=x+2.2*sg,g1=exp(-x*x/(2.0*sg*sg)),g2=exp(-y*y/(2.0*sg*sg));
          H=g1-0.35*g2;dHd=-x/(sg*sg)*g1+0.35*y/(sg*sg)*g2;dHR=-dHd;
        }
        wG+=E0*25.0*(dHd*n+dHR*Rw*wk*wobA*gAng);wHt+=E0*H;}}
    if(dot(wG,wG)>1e-10||wHt>1e-4){
      wNs=normalize(cross(dA,dB));wNs*=sign(dot(wNs,cameraPosition-vWp)+1e-6);
      wGt=wG-wNs*dot(wG,wNs);
      vec2 dg=dU*dot(wGt,dA)+dV*dot(wGt,dB);float lg=length(dg);
      if(lg>1e-12)wOff+=dg/lg*min(length(wGt)*0.00016,0.009);}         // the picture refracts through the slope of each lip
  }
  if(pOn>0.5){
    float asp=mW/mSize.y;vec2 q=vec2((uvc.x*mSize.x+mOx)/mW*asp,1.0-uvc.y);   // in picture heights, y from the top
    float vis=1.0,D=q.y-pWl,aW=0.0,aS=0.0,aL=0.0,aO=0.0;
    if(pCh<0.5)for(int j=0;j<32;j++){if(float(j)>=pNd)break;vec3 sd=pDisc[j];   // behind a sphere: hidden by it
      vis*=smoothstep(-0.002,0.004,length(q-vec2(sd.x*asp,sd.y))-sd.z);}
    for(int i=0;i<PMAX;i++){vec4 S=pS[i],P=pP[i];
      if(S.w<0.5)continue;
      float age=S.z,R=P.y*age,fadeT=(1.0-smoothstep(0.45*P.z,P.z,age))*smoothstep(0.0,0.4,age);
      if(S.w<1.5){
        if(pCh>0.5||D<=0.003)continue;
        float Ds=S.y-pWl;vec2 g=vec2((q.x-S.x*asp)/D,pF/D),gs=vec2(0.0,pF/Ds);   // the water as a floor, seen from in front of the sphere
        vec2 rv=g-gs;float rl=length(rv),dist=rl-P.w;if(dist<0.0)continue;
        float x=dist-R;
        float lam=0.25+0.35*P.w+0.08*R,k=6.2832/lam,sig=1.25*lam;        // a packet of 3-4 rings, sized to the sphere
        vec2 nr=rv/max(rl,1e-4);float gpp=length(vec2(fwidth(q.x)/D*nr.x,pF*fwidth(q.y)/(D*D)*nr.y));   // ground per pixel, along the ring's radius
        float env=exp(-x*x/(2.0*sig*sig))*P.x*fadeT*vis*exp(-dist/(3.0*P.w+0.6))*smoothstep(0.002,0.025,D)
          *(1.0-smoothstep(0.12,0.25,gpp/lam));                           // rings finer than ~5 px fade out instead of shimmering
        float sl=-sin(x*k)*env,facing=0.4+0.6*abs(nr.y);    // slope of the water; rings show most toward us
        float wt=env*env+1e-6;aW+=wt;                                  // weighted by strength: the strongest ring leads
        aO+=wt*sl*facing*0.005*(0.3+D);                                 // the reflections bend a little with the slope
        aS+=wt*sl*facing*1.9;aL+=wt*pow(max(0.0,cos(x*k)),10.0)*env*facing*0.6;   // light and shade of the slope, a soft glint
      }else if(S.w>2.5){
        // kind 3, "faixa": one soft wave of golden light crossing the whole table, end to end (from S.x 0 or 1)
        if(pCh<0.5)continue;
        float u=q.x/asp,from=S.x,head=mix(-0.15,1.15,clamp(P.y*age,0.0,1.0));
        float along=from<0.5?u:1.0-u,dd=along-head+0.018*sin(q.y*9.0+age*1.3)+0.01*sin(q.y*23.0-age*0.8);
        float glow=exp(-dd*dd/(2.0*P.w*P.w))+0.35*exp(-(dd+0.05)*(dd+0.05)/(2.0*P.w*P.w*2.5));   // the front and a soft trail
        float keep=1.0;for(int j=0;j<16;j++){vec2 cj=vec2(pPk[j].x*asp,pPk[j].y);keep*=smoothstep(0.0,0.03,length(q-cj)-pKr);}
        pLt+=glow*P.x*fadeT*keep*0.55;
      }else{
        if(pCh<0.5)continue;
        vec2 c0=vec2(S.x*asp,S.y);float dist=length(q-c0)-P.w;if(dist<0.0)continue;
        // a wave of golden light leaving the glass: two soft rings that open a few centimetres and fade, never near a plate
        float room=1.0-smoothstep(0.055,0.08,dist);
        for(int j=0;j<16;j++){vec2 cj=vec2(pPk[j].x*asp,pPk[j].y);room*=smoothstep(0.02,0.045,length(q-cj)-pKr);}
        float x=dist-R,vis=P.x*fadeT*room*smoothstep(0.0,0.006,dist);
        float band=exp(-x*x/(2.0*0.0065*0.0065))+exp(-(x+0.022)*(x+0.022)/(2.0*0.0065*0.0065))*0.55;   // two thin rings travelling out
        pLt+=band*0.9*vis;
      }}
    if(aW>1e-5){wOff+=vec2(0.0,aO/aW);wS+=aS/aW;wL+=aL/aW;pSoft=1.0;}
  }
  vec3 c = hasMap > 0.5 ? texture2D(map, uvc + wOff + vec2(mo.x,-mo.y)/mSize).rgb : vec3(0.0);
  if(wL>0.002 && hasMap>0.5 && pSoft<0.5){ vec3 bl=(texture2D(map,uvc+wOff*2.2).rgb+texture2D(map,uvc-wOff*1.4).rgb)*0.5; c=mix(c,bl,min(0.5,abs(wS)*0.6)); }
  if(wOn>0.5&&(dot(wGt,wGt)>1e-10||wCau>1e-4||wRim>1e-4)){            // the Forma's liquid (see wStyle)
    float lm=dot(c,vec3(0.2126,0.7152,0.0722)),hi=smoothstep(0.55,0.95,lm);
    c = mix(c,min(c,vec3(1.0)),hi);                                      // above white, a shade would be clipped away
    vec3 ua=normalize(wFx-wNs*dot(wFx,wNs)+vec3(1e-5)),va=cross(wNs,ua);va*=sign(va.y+1e-3);
    vec3 L=normalize(-0.45*ua+0.6*va+0.66*wNs),N=normalize(wNs-wGt*0.0045),V=normalize(cameraPosition-vWp);
    float sh=dot(N,L)/max(dot(wNs,L),0.2)-1.0;vec3 Hh=normalize(L+V);
    float spec=max(0.0,pow(max(dot(N,Hh),0.0),28.0)-pow(max(dot(wNs,Hh),0.0),28.0)),glint=max(0.0,pow(max(dot(N,Hh),0.0),160.0)-pow(max(dot(wNs,Hh),0.0),160.0));
    c *= 1.0-min(0.3,wRim*0.28);                                         // the shade it casts at its edge
    if(wStyle<0.5){                                                      // 0: a dense, glossy, clear liquid
      c *= 1.0+clamp(sh*1.7,-0.42,0.38);
      c *= mix(vec3(1.0),vec3(0.93,0.96,1.0),min(1.0,wCau)*0.35);
      c += vec3(1.0)*(spec*0.55+glint*0.9);
    }else if(wStyle<1.5){                                                // 1: a swell on still water
      c *= 1.0+clamp(sh*1.3,-0.32,0.3);
      c += vec3(1.0)*(spec*0.35+glint*0.6);
    }else{                                                               // 2: the Forma's chrome, melting out
      vec3 R=reflect(-V,N);float ry=dot(R,va),rx=dot(R,ua);
      // a studio around it, as the Forma's own chrome reflects: a dark floor, a bright sky, two soft boxes and a dark band
      float env=mix(0.06,0.95,smoothstep(-0.25,0.35,ry))+1.1*exp(-pow((ry-0.62)/0.07,2.0))+0.9*exp(-pow((rx+0.35)/0.1,2.0))*smoothstep(-0.1,0.5,ry)
               +0.7*exp(-pow((rx-0.45)/0.08,2.0))*smoothstep(0.0,0.6,ry)-0.55*exp(-pow((ry-0.12)/0.06,2.0));
      vec3 chrome=vec3(0.92,0.95,0.99)*clamp(env,0.0,1.6)*0.85+vec3(1.0)*glint;
      float k=min(1.0,wCau*1.3);
      c = mix(c,chrome,k);
    }}
  float wLum=dot(c,vec3(0.2126,0.7152,0.0722));
  float brightK=smoothstep(0.6,0.92,wLum);                                // on a white picture the waves are drawn, not shaded
  c *= 1.0+clamp(wS,-1.0,1.0)*0.32*(1.0-0.88*brightK);
  c *= 1.0-brightK*min(1.0,wC*1.6)*0.16;                                 // neutral grey hairlines, like a relief in white silk
  if(false){
    c = mix(c,min(c,vec3(1.0)),brightK);                                 // above white, the liquid's shade would be clipped away
    c *= mix(vec3(1.0),vec3(0.9,0.94,1.0),0.35*clamp(wHt,0.0,1.0)*brightK);   // on a white wall: a faint cool sheen where it lies
    // the Forma's waves lit like a real liquid: a soft light from the upper left, so each lip is bright on one side and
    // in shadow on the other, a small sharp glint on its crest, and the film a touch milky where it lies (no colours)
    vec3 u=normalize(wFx-wNs*dot(wFx,wNs)+vec3(1e-5)),v=cross(wNs,u);v*=sign(v.y+1e-3);
    vec3 L=normalize(-0.45*u+0.55*v+0.70*wNs),N=normalize(wNs-wGt*0.004);
    float sh=dot(N,L)/max(dot(wNs,L),0.2)-1.0;
    c *= 1.0+clamp(sh*1.3,-0.3,0.26);
    vec3 Hh=normalize(L+wNs);
    c += vec3(max(0.0,pow(max(dot(N,Hh),0.0),14.0)-pow(dot(wNs,Hh),14.0)))*0.3;   // a broad gloss, no thin glints
    float lum=dot(c,vec3(0.2126,0.7152,0.0722));
    c = mix(c,vec3(lum)*1.01+0.01,0.03*clamp(abs(wHt),0.0,1.0));}
  c = mix(c,vec3(1.0,0.8,0.42)*1.15,clamp(pLt*0.75,0.0,0.92));            // the glasses' gold, over the water
  c += vec3(0.82,0.9,1.0)*min(0.3,wL*0.2+max(wS,0.0)*0.04)*(1.0-0.75*wLum);  // light shows on the dark, barely on the bright
  c *= 1.0 + mo.z*smoothstep(0.45,0.9,dot(c,vec3(0.2126,0.7152,0.0722)));
  if(tMode>0.5 && hasMap>0.5) c=fabric(uvc);`);
    m.vertexShader=m.vertexShader.replace('void main(){','varying vec3 vWp;\nvoid main(){').replace('vec4 w=modelMatrix*vec4(position,1.0);','vec4 w=modelMatrix*vec4(position,1.0); vWp=w.xyz;');
    m.extensions=Object.assign(m.extensions||{},{derivatives:true});
    m.userData.motion=true;m.needsUpdate=true;
  }
  // where each channel sits along its whole surface, so the waves and the wind run on across the corner of 01 and 02
  const MSPLIT=4490/6410;
  // the cloth transition running on each wall channel: {prev (texture of the picture before), t0, ms, mode, o (Forma)}
  const TECIDO={};
  function tecidoEnd(channel){const t=TECIDO[channel];if(!t)return;clearTimeout(t.timer);delete TECIDO[channel];setTimeout(()=>t.prev.dispose(),100);}
  // where the Forma is, as a share of the whole wall (x) and of its height from the top (y): the logo on Parede 02
  function formaPoint(){
    const o=LOGO.state?.opts||{pos:0,height:0.5},p=SURF.p02;
    const z=(p.min[2]+p.max[2])/2-(o.pos||0)*(p.max[2]-p.min[2]);
    const u=(p.max[2]-z)/(p.max[2]-p.min[2]);                    // along Parede 02 as its picture runs
    return [MSPLIT+(1-MSPLIT)*Math.min(1,Math.max(0,u)),1-(o.height??0.5)];
  }
  // pulse(origin): origin is 'forma' or [x,y,z] in metres; opts: amp, speed (m/s), life (s), width (m)
  const WAVES=[];
  // the Forma's outline, read from the logo's own render (alpha): its centre in the room, its axes and its radius at
  // 48 angles, so a wave starts on the edge of the metal and not in the hole of the ring
  let WAVE_STYLE=0;   // the look of the Forma's liquid (see wStyle in the shader): 0 dense liquid, 1 swell, 2 chrome
  const FORMA_EDGE={prof:new Array(48).fill(0.7),c:[0,1,-1.6],fx:new T.Vector3(0,0,-1),fy:new T.Vector3(0,1,0),at:0};
  function formaEdge(){
    const s=LOGO.state;if(!s?.on)return null;
    // reading the live metal's picture back stalls the GPU (1536 x 1536): once, then again only when the Forma changes
    // (logoApply clears it) or after a minute
    if(performance.now()-FORMA_EDGE.at<60000&&FORMA_EDGE.src===(s.renderUrl||''))return FORMA_EDGE;
    if(performance.now()-(FORMA_EDGE.tried||0)<500)return null;FORMA_EDGE.tried=performance.now();   // a read that found nothing: not again at once
    try{let W,H,buf;
      // an act with a Blender render shows that picture and the live metal stops drawing: read the outline from the picture
      // (flipped, as the render target reads from the bottom), once per picture
      const img=s.renderUrl&&LOGO.renders?.[s.renderUrl]?.image;
      if(s.renderUrl&&!img)return null;
      if(img){const ec=LOGO.edgeBufs||(LOGO.edgeBufs={});
        if(!ec[s.renderUrl]){const w=384,h=384,c=doc.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
          g.translate(0,h);g.scale(1,-1);g.drawImage(img,0,0,w,h);ec[s.renderUrl]=g.getImageData(0,0,w,h).data;}
        W=H=384;buf=ec[s.renderUrl];}
      else{W=s.rt.width;H=s.rt.height;buf=new Uint8Array(W*H*4);a.renderer.readRenderTargetPixels(s.rt,0,0,W,H,buf);}
      const A=(x,y)=>buf[(y*W+x)*4+3]>40;let n=0,cx=0,cy=0;
      for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2)if(A(x,y)){n++;cx+=x;cy+=y;}
      if(n<20)return null;cx/=n;cy/=n;
      const pl=s.plane;pl.updateMatrixWorld();const m=pl.scale.x;               // the plane is 2 x 2 before its scale
      const o=pl.localToWorld(new T.Vector3(0,0,0)),ex=pl.localToWorld(new T.Vector3(1,0,0)).sub(o).normalize(),ey=pl.localToWorld(new T.Vector3(0,1,0)).sub(o).normalize();
      const c=pl.localToWorld(new T.Vector3((cx/W-.5)*2,(cy/H-.5)*2,0));
      for(let k=0;k<48;k++){const t=k/48*Math.PI*2;let last=0;
        for(let r=0;r<W*.75;r++){const x=Math.round(cx+Math.cos(t)*r),y=Math.round(cy+Math.sin(t)*r);if(x<0||y<0||x>=W||y>=H)break;if(A(x,y))last=r;}
        FORMA_EDGE.prof[k]=last/W*2*m;}
      FORMA_EDGE.c=[c.x,c.y,c.z];FORMA_EDGE.fx.copy(ex);FORMA_EDGE.fy.copy(ey);FORMA_EDGE.at=performance.now();FORMA_EDGE.src=s.renderUrl||'';return FORMA_EDGE;}
    catch{return null;}
  }
  // picture ripples (see "Ondas na imagem" in the shader): the water scene of the wall (water line, every sphere as a
  // disc x, y, r in fractions of the picture, r of its height) and the plates of the table
  const PW={list:[],wl:0.44,discs:[],plates:null,pr:0.04,mask:null,kr:0.139};
  function waterScene(waterline,discs){PW.wl=waterline;
    PW.discs=(discs||[]).filter(d=>d[2]/Math.max(1e-3,d[1]+d[2]-waterline)>=0.25).slice(0,32);}
  // the glasses the rings leave (and their radius) and the plates they keep off (and theirs), in fractions of the table
  function plateScene(glasses,r,plates,pr){PW.plates=glasses.slice(0,16);PW.pr=r;PW.mask=(plates||[]).slice(0,16);PW.kr=pr??0.139;}
  // ripple('agua',{x,y,r}) from a sphere of the water scene; ripple('prato',{x,y}) from a glass of the table
  function ripple(kind,src,opts={}){
    const t0=performance.now();
    if(PW.list.length>=32)return false;   // full: skip this one rather than cut one running
    if(kind==='agua'){const Ds=src.y+src.r-PW.wl;if(Ds<=0.002)return false;
      PW.list.push({k:1,x:src.x,y:src.y+src.r,r0:src.r/Ds*0.98,t0,rise:opts.rise||0,amp:opts.amp??0.8,speed:opts.speed??0.42,life:opts.life??11});}
    else if(kind==='faixa')PW.list.push({k:3,x:src.x??0,y:0,r0:opts.width??0.05,t0,rise:opts.rise||0,amp:opts.amp??1,speed:opts.speed??0.4,life:opts.life??3.4});
    else PW.list.push({k:2,x:src.x,y:src.y,r0:PW.pr*1.02,t0,rise:opts.rise||0,amp:opts.amp??0.9,speed:opts.speed??0.028,life:opts.life??3.2});
    if(!MOTION.raf)MOTION.raf=requestAnimationFrame(motionTick);return true;
  }
  // clearing fades what is running out in a moment (never a cut)
  const fadeOut=(list,ms)=>{if(!(ms>0)){for(const w of list)w.out=1;return;}const now=performance.now();for(const w of list)if(!w.out){w.out=now+ms;w.outMs=ms;}};
  function ripplesClear(ms=900,kind){fadeOut(kind?PW.list.filter(w=>w.k===({agua:1,prato:2,faixa:3})[kind]):PW.list,ms);}
  function pulsesClear(ms=700){fadeOut(WAVES,ms);}
  const outK=(w,now)=>w.out?Math.max(0,1-(now-(w.out-(w.outMs||800)))/(w.outMs||800)):1;
  // ---- "Ondas da Forma" (act I): particles that resonate on the Forma's outline with the sound and pulse out into the
  // whole room. A band of grains lives on the outline: it trembles in a few standing modes, brighter and wider as the
  // track gets louder. On each peak a burst leaves the outline (along it and out of the wall, into the room), slows
  // down in the air and fades out. Normal blending in a cool silver, so it reads on the white wall and in the dark.
  const PART={pts:null,on:false,raf:0,level:0,target:0,last:0,t:0,NC:2400,N:14000,fade:0};
  function partInit(){
    if(PART.pts)return PART;
    const N=PART.N,g=new T.BufferGeometry();
    PART.pos=new Float32Array(N*3);PART.vel=new Float32Array(N*3);PART.alpha=new Float32Array(N);PART.glow=new Float32Array(N);PART.size=new Float32Array(N);
    PART.age=new Float32Array(N);PART.life=new Float32Array(N);PART.ang=new Float32Array(N);PART.off=new Float32Array(N*2);PART.seed=new Float32Array(N);
    for(let i=0;i<N;i++){PART.seed[i]=Math.random();PART.life[i]=-1;}
    for(let i=0;i<PART.NC;i++){PART.ang[i]=(i/PART.NC)*Math.PI*2+Math.random()*0.01;
      const r=Math.random();PART.off[i*2]=0.012+0.05*r*r*r+0.008*(Math.random()-0.5);PART.off[i*2+1]=0.006+0.04*Math.random();   // just outside the metal's edge, a few further out; a little in front of the wall
      PART.size[i]=0.009+0.018*Math.random()**3;}
    g.setAttribute('position',new T.BufferAttribute(PART.pos,3));g.setAttribute('aAlpha',new T.BufferAttribute(PART.alpha,1));g.setAttribute('aSize',new T.BufferAttribute(PART.size,1));g.setAttribute('aGlow',new T.BufferAttribute(PART.glow,1));
    const m=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:T.NormalBlending,
      uniforms:{uScale:{value:1600},uCol:{value:new T.Color(0.3,0.34,0.44)},uCore:{value:new T.Color(0.55,0.6,0.72)}},
      vertexShader:'attribute float aAlpha;attribute float aSize;attribute float aGlow;varying float vA;varying float vG;uniform float uScale;void main(){vA=aAlpha;vG=aGlow;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*uScale/max(0.2,-mv.z),1.5,24.0);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying float vA;varying float vG;uniform vec3 uCol;uniform vec3 uCore;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;float a=exp(-r*1.6)*vA*1.6*(1.0-vG);vec3 c=mix(uCol,uCore,exp(-r*4.0));gl_FragColor=vec4(c,min(1.0,a));}'});
    // the same grains as light, added: they glow where the room is dark (on the white wall they change nothing)
    const m2=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,uniforms:m.uniforms,
      vertexShader:m.vertexShader.replace('aSize*uScale','aSize*1.8*uScale'),
      fragmentShader:'varying float vA;varying float vG;void main(){vec2 q=gl_PointCoord*2.0-1.0;float r=dot(q,q);if(r>1.0)discard;gl_FragColor=vec4(vec3(0.72,0.8,1.0)*exp(-r*4.0)*vA*vG*0.95,1.0);}'});
    const p=new T.Points(g,m);p.frustumCulled=false;p.renderOrder=7;p.visible=false;a.scene.add(p);PART.pts=p;PART.geo=g;
    const p2=new T.Points(g,m2);p2.frustumCulled=false;p2.renderOrder=8;p.add(p2);return PART;}
  // where a contour grain sits now: on the outline at its angle, pushed out by the resonance
  function partEdge(e,th,rad,dz,out){const k=((th/(Math.PI*2))%1+1)%1*48,i0=Math.floor(k)%48,i1=(i0+1)%48,f=k-Math.floor(k);
    const R=e.prof[i0]*(1-f)+e.prof[i1]*f+rad,c=Math.cos(th),s=Math.sin(th);
    out[0]=e.c[0]+(e.fx.x*c+e.fy.x*s)*R+PART.nx*dz;out[1]=e.c[1]+(e.fx.y*c+e.fy.y*s)*R+PART.ny*dz;out[2]=e.c[2]+(e.fx.z*c+e.fy.z*s)*R+PART.nz*dz;
    return out;}
  function partNormal(e){const n=new T.Vector3().crossVectors(e.fx,e.fy).normalize(),to=new T.Vector3().subVectors(a.cam.position,new T.Vector3(...e.c));
    if(n.dot(to)<0)n.negate();PART.nx=n.x;PART.ny=n.y;PART.nz=n.z;}
  function partTick(now){
    PART.raf=requestAnimationFrame(partTick);
    const dt=Math.min(0.05,(now-(PART.last||now))/1000);PART.last=now;PART.t+=dt;
    PART.fade=Math.max(0,Math.min(1,PART.fade+(PART.on?dt/1.2:-dt/1.5)));
    const e=formaEdge();
    if(!e||(!PART.on&&PART.fade<=0)){PART.pts.visible=false;if(!PART.on){cancelAnimationFrame(PART.raf);PART.raf=0;}return;}
    partNormal(e);PART.pts.visible=true;
    PART.pts.material.uniforms.uScale.value=a.renderer.domElement.height/(2*Math.tan(T.MathUtils.degToRad(a.cam.fov)/2));
    // the level follows the sound: quick up, slower down
    const L=PART.level+=(PART.target-PART.level)*(PART.target>PART.level?Math.min(1,dt*14):Math.min(1,dt*3));
    const t=PART.t,P=PART.pos,V=PART.vel,A=PART.alpha,o=[0,0,0];
    for(let i=0;i<PART.NC;i++){const th=PART.ang[i],sd=PART.seed[i];
      // standing modes along the outline (they move with the sound), and each grain's own small tremble
      const res=(0.5*Math.sin(6*th+t*1.7)+0.35*Math.sin(11*th-t*2.6+1.3)+0.25*Math.sin(19*th+t*4.1+sd*6))*(0.008+0.15*L)
        +Math.sin(t*(7+9*sd)+sd*40)*0.006*(0.4+L);
      partEdge(e,th,PART.off[i*2]*(1+3*L)+res,PART.off[i*2+1]*(1+2.5*L),o);P[i*3]=o[0];P[i*3+1]=o[1];P[i*3+2]=o[2];
      A[i]=PART.fade*(0.35+0.65*L)*(0.6+0.4*Math.sin(t*(3+5*sd)+sd*20)**2);}
    for(let i=PART.NC;i<PART.N;i++){if(PART.life[i]<0){A[i]=0;continue;}
      const ag=PART.age[i]+=dt,lf=PART.life[i];if(ag>=lf){PART.life[i]=-1;A[i]=0;continue;}
      const drag=Math.exp(-dt*0.16),sd=PART.seed[i],j=i*3;
      // a gentle swirl in the air, a little rise, then they hang and fade
      V[j]=V[j]*drag+Math.sin(t*0.7+sd*30+P[j+1]*1.3)*0.08*dt;V[j+1]=V[j+1]*drag+(0.05+Math.sin(t*0.5+sd*17)*0.08)*dt;V[j+2]=V[j+2]*drag+Math.cos(t*0.6+sd*23+P[j]*1.1)*0.08*dt;
      P[j]+=V[j]*dt;P[j+1]+=V[j+1]*dt;P[j+2]+=V[j+2]*dt;
      // only inside the room (Parede 01 and 02, the floor, the ceiling, the far sides): they fade out before a wall
      const p1=SURF.p01,p2=SURF.p02,dm=Math.min(P[j]-p2.min[0],p1.max[0]-P[j],p1.min[2]-P[j+2],P[j+2]-p2.min[2],P[j+1]-p1.min[1],2.6-P[j+1]);
      if(dm<0){PART.life[i]=-1;A[i]=0;continue;}
      PART.glow[i]=Math.max(0,Math.min(1,(((P[j]-e.c[0])*PART.nx+(P[j+1]-e.c[1])*PART.ny+(P[j+2]-e.c[2])*PART.nz)-0.2)/0.5));   // silver over the white wall, light in the room
      const k=ag/lf;A[i]=PART.fade*(1-k*k)*Math.min(1,ag*8)*(0.6+0.4*sd)*Math.min(1,dm/0.25);}
    PART.geo.attributes.position.needsUpdate=true;PART.geo.attributes.aAlpha.needsUpdate=true;PART.geo.attributes.aGlow.needsUpdate=true;}
  // a burst on a peak: grains leave the outline, out along it and into the room
  function partBurst(amp=1){
    const e=formaEdge();if(!e||!PART.pts)return false;partNormal(e);
    const n=Math.round(2000+2000*Math.min(1.5,amp)),o=[0,0,0];let made=0;
    for(let i=PART.NC;i<PART.N&&made<n;i++){if(PART.life[i]>=0)continue;made++;
      const th=Math.random()*Math.PI*2,sd=PART.seed[i];partEdge(e,th,-0.03*Math.random(),(Math.random()-0.5)*0.04,o);
      const c=Math.cos(th),s=Math.sin(th),ox=e.fx.x*c+e.fy.x*s,oy=e.fx.y*c+e.fy.y*s,oz=e.fx.z*c+e.fy.z*s;
      const sp=(1.7+1.1*Math.random())*(0.8+0.3*Math.min(1.5,amp)),rr=0.25+0.85*Math.random(),dl=1/Math.hypot(1,rr),vr=sp*rr*dl,vn=sp*dl,j=i*3;   // a front that opens from the outline and crosses the room
      PART.pos[j]=o[0];PART.pos[j+1]=o[1];PART.pos[j+2]=o[2];
      PART.vel[j]=ox*vr+PART.nx*vn+(Math.random()-0.5)*0.08;PART.vel[j+1]=(oy*vr+PART.ny*vn)*0.3+(Math.random()-0.5)*0.08;   // flatter up and down: the front crosses the room at the guests' height
      PART.vel[j+2]=oz*vr+PART.nz*vn+(Math.random()-0.5)*0.08;
      PART.age[i]=0;PART.life[i]=7+4*Math.random();PART.size[i]=0.014+0.03*Math.random()**2;}
    PART.geo.attributes.aSize.needsUpdate=true;return made>0;}
  // the particles were taken out (the client did not want them): never built, never drawn, in any act
  function formaParticles(){PART.on=false;cancelAnimationFrame(PART.raf);PART.raf=0;if(PART.pts)PART.pts.visible=false;}
  function formaLevel(v){PART.target=Math.max(0,Math.min(1,+v||0));}
  function pulse(origin,opts={}){
    let o=origin,k=0;
    if(o==='forma'){const e=formaEdge();if(!e)return false;o=e.c;k=1;}
    WAVES.push({o,k,seed:Math.random()*97,t0:performance.now(),amp:opts.amp??1,speed:opts.speed??1.3,life:opts.life??6,width:opts.width??0.3});
    while(WAVES.length>6)WAVES.shift();
    if(!MOTION.raf)MOTION.raf=requestAnimationFrame(motionTick);
    return true;
  }
  // a point of a wall picture (u along the whole wall 0..1, v from the top 0..1) in metres, on Parede 01 or 02
  function wallPoint(u,v){
    const y=SURF.p01.min[1]+(1-v)*(SURF.p01.max[1]-SURF.p01.min[1]);
    if(u<MSPLIT){const p=SURF.p01,k=u/MSPLIT;return [p.max[0]-k*(p.max[0]-p.min[0]),y,p.min[2]-0.02];}
    const p=SURF.p02,k=(u-MSPLIT)/(1-MSPLIT);return [p.min[0]+0.02,y,p.max[2]-k*(p.max[2]-p.min[2])];
  }
  function motionTick(){
    MOTION.raf=requestAnimationFrame(motionTick);
    const t=(performance.now()-MOTION.t0)/1000,nowW=performance.now();
    for(let i=WAVES.length-1;i>=0;i--)if((nowW-WAVES[i].t0)/1000>WAVES[i].life||(WAVES[i].out&&nowW>=WAVES[i].out))WAVES.splice(i,1);
    for(let i=PW.list.length-1;i>=0;i--)if((nowW-PW.list[i].t0)/1000>PW.list[i].life||(PW.list[i].out&&nowW>=PW.list[i].out))PW.list.splice(i,1);
    for(const p of a.getProj?.()||a.PROJ||[]){          // the current projectors (the viewer rebuilds them)
      const m=p.mesh?.material;if(!m)continue;patchProjector(m);if(!m.userData.motion)continue;
      {const Uw=m.uniforms;Uw.wOn.value=WAVES.length?1:0;if(Uw.wStyle)Uw.wStyle.value=WAVE_STYLE;Uw.wFx.value.copy(FORMA_EDGE.fx);Uw.wFy.value.copy(FORMA_EDGE.fy);
        for(let i=0;i<6;i++){const w=WAVES[i];
          if(w){Uw.wSrc.value[i].set(w.o[0],w.o[1],w.o[2],(nowW-w.t0)/1000);Uw.wPar.value[i].set(w.amp*outK(w,nowW),w.speed,w.life,w.width);Uw.wK.value[i]=w.k;Uw.wSeed.value[i]=w.seed;}
          else Uw.wSrc.value[i].w=-1;}}
      const U=m.uniforms,ch=Object.keys(display).find(k=>display[k].tex===U.map.value),s=ch&&MOTION.ch[ch];
      U.pOn.value=ch&&PW.list.length?1:0;
      if(U.pOn.value){U.pCh.value=ch==='mesa'?1:0;U.pWl.value=PW.wl;U.pF.value=1.2;U.pNd.value=PW.discs.length;U.pPr.value=PW.pr;
        PW.discs.forEach((d,i)=>U.pDisc.value[i].set(d[0],d[1],d[2]));
        (PW.plates||[]).forEach((c,i)=>U.pPl.value[i].set(c.x,c.y));(PW.mask||[]).forEach((c,i)=>U.pPk.value[i].set(c.x,c.y));U.pKr.value=PW.kr;
        for(let i=0;i<32;i++){const w=PW.list[i];
          if(w){U.pS.value[i].set(w.x,w.y,(nowW-w.t0)/1000,w.k);{const age=(nowW-w.t0)/1000,ri=w.rise>0?Math.min(1,age/w.rise):1;U.pP.value[i].set(w.amp*outK(w,nowW)*ri*ri*(3-2*ri),w.speed,w.life,w.r0);}}else U.pS.value[i].w=0;}}
      const tr=ch&&TECIDO[ch];
      if(ch){const d=display[ch].canvas,whole=ch==='mesa'?d.width:d.width/(ch==='p01'?MSPLIT:1-MSPLIT);
        U.mSize.value.set(d.width,d.height);U.mOx.value=ch==='p02'?MSPLIT*whole:0;U.mW.value=whole;
        if(tr){U.tMode.value=tr.mode;U.tPrev.value=tr.prev;U.tProg.value=Math.min(1,(performance.now()-tr.t0)/tr.ms);U.tO.value.set(tr.o[0]*whole,tr.o[1]*d.height);}
        else U.tMode.value=0;}
      else U.tMode.value=0;
      if(!s||!MOTION.on||(!s.A?.kind&&!s.B?.kind)){U.mAmp.value=0;continue;}
      const d=display[ch].canvas,whole=ch==='mesa'?d.width:d.width/(ch==='p01'?MSPLIT:1-MSPLIT);
      U.mA.value=(s.A||s.B).tex;U.mB.value=(s.B||s.A).tex;U.mKA.value=s.A?.kind||0;U.mKB.value=s.B?.kind||0;
      U.mHA.value=s.A?.hz||0;U.mHB.value=s.B?.hz||0;U.mMix.value=s.mix;U.mTime.value=t;U.mAmp.value=MOTION.amp;
      U.mSize.value.set(d.width,d.height);U.mOx.value=ch==='p02'?MSPLIT*whole:0;U.mW.value=whole;
    }
  }
  // a new picture on a channel: during a cross-fade the movement of the one before turns into this one's
  function motionSet(channel,mask,fading){
    const s=MOTION.ch[channel]||(MOTION.ch[channel]={A:null,B:null,mix:1});
    if(s.A&&s.A!==s.B)s.A.tex?.dispose();
    if(fading){s.A=s.B;s.B=mask;s.mix=0;}else{if(s.B)s.B.tex?.dispose();s.A=s.B=mask;s.mix=1;}
    if(!MOTION.raf)MOTION.raf=requestAnimationFrame(motionTick);
    return s;
  }

  // ---- Logo 3D on Parede 02 (see pharmaRoom.setLogo) ----
  // the logo as one smooth piece (logo3d.html, guias-formato-sala/logo_liso.py): it can turn all the way round without coming apart
  const LOGO=window.__logo={url:'modelos/logo-azul-liso-sala.glb?v=1',state:null};
  // the model (1.9 MB) starts loading with the room, not when the first Forma is asked for
  LOGO.glb=()=>LOGO.glbP||(LOGO.glbP=new Promise((res,rej)=>new T.GLTFLoader().load(LOGO.url,res,undefined,rej)).catch(e=>{LOGO.glbP=null;throw e;}));
  setTimeout(()=>LOGO.glb().catch(()=>{}),0);
  // adjustments (the gallery's "Ajustar logo"): finish, polish 0..1, reflection, size and height as a share of the 2 m
  // of projection, position along the wall (-0.5..0.5 of its width, + = to the right), turn speed (rad/s), front
  // gira (rad/s) and balanco (rad): the Forma turning in its own plane, facing the room, with a small sway and tilt.
  const LOGO_DEFAULT={finish:'cromo',polish:0.85,reflect:1.25,size:0.8,height:0.5,pos:0,speed:0.115,studio:0.45,gira:0,balanco:0};
  const FINISH={
    gelclaro:{color:0xf2faff,metalness:0.06,rough:0.03,clearcoat:1,opacity:0.42,ior:1.4,iridescence:0.9,specular:1,env:0.95},
    cromo:{color:0xf6f7f9,metalness:1,rough:0.03,clearcoat:0},
    branco:{color:0xf4f6f9,metalness:0.7,rough:0.2,clearcoat:1},
    perola:{color:0xf6f5f2,metalness:0.35,rough:0.28,clearcoat:1,iridescence:0.7},
    azul:{color:0xffffff,metalness:0.15,rough:0.24,clearcoat:1,vertexColors:true},
    // the matter of each act (the Forma takes the main matter of the scene); the see-through ones let the wall show
    // through the logo (opacity), tinted by their colour, with the wall reflected on top
    agua:{color:0x1b55ff,metalness:0.25,rough:0.03,clearcoat:1,opacity:0.74,ior:1.33,specular:1,env:0.8},                // couvert
    gel:{color:0xff6f3c,metalness:0.2,rough:0.06,clearcoat:1,opacity:0.78,ior:1.4,iridescence:0.3,specular:1,env:0.75,emissive:0x2a0c02}, // entrada
    vidro:{color:0xc9f2d6,metalness:0.1,rough:0.01,clearcoat:1,opacity:0.5,ior:1.5,iridescence:0.3,specular:1,env:0.9},  // salada
    seda:{color:0xd9a24f,metalness:0.8,rough:0.26,clearcoat:0.5,sheen:1,sheenColor:0xffe6b0,env:0.85},              // risoto
    rose:{color:0xf08a6e,metalness:1,rough:0.06,clearcoat:0.6,env:0.85},                                               // principal
    cristal:{color:0xfff0d8,metalness:0.1,rough:0.01,clearcoat:1,opacity:0.62,ior:2.0,iridescence:0.6,emissive:0x6a4410,specular:1,env:0.9}};  // sobremesa
  function reflApply(st){
    const r=st.refl,o=st.opts,R=o.reflexo,p=SURF.p02;if(!r)return;
    if(!R||!R.url||!st.on){r.visible=false;return;}
    const side=st.plane.scale.x*2,top=st.plane.position.y+side/2-R.inicio*side,full=R.altura*side,low=p.min[1]+0.002;
    const vis=Math.max(0,Math.min(full,top-low));if(vis<=0.01){r.visible=false;return;}
    r.scale.set(side,vis,1);r.position.set(st.plane.position.x+0.001,top-vis/2,st.plane.position.z);
    // the reflection is drawn into a canvas of its own, turned with the Forma (mirrored: the other way round, about the
    // Forma's centre seen in the water)
    const put=tex=>{if(st.opts.reflexo!==R)return;const img=tex.image,cv=st.reflCv||(st.reflCv=doc.createElement('canvas'));
      if(cv.width!==img.width||cv.height!==img.height){cv.width=img.width;cv.height=img.height;}
      if(!st.reflTex){st.reflTex=new T.CanvasTexture(cv);if("colorSpace" in st.reflTex&&T.SRGBColorSpace)st.reflTex.colorSpace=T.SRGBColorSpace;else st.reflTex.encoding=T.sRGBEncoding;st.reflTex.anisotropy=8;}
      st.reflTex.repeat.set(1,vis/full);st.reflTex.offset.set(0,1-vis/full);
      st.reflDraw={img,cv,px:img.width/2,py:(R.inicio-0.5)/R.altura*img.height,a:null};reflSpin(st,true);
      r.material.map=st.reflTex;r.material.needsUpdate=true;r.visible=true;};
    const c=LOGO.reflexos||(LOGO.reflexos={});
    if(c[R.url])put(c[R.url]);
    else new T.TextureLoader().load(R.url,tex=>{if("colorSpace" in tex&&T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;else tex.encoding=T.sRGBEncoding;tex.anisotropy=8;c[R.url]=tex;put(tex);});
  }
  function reflSpin(st,force){const d=st.reflDraw;if(!d||!st.refl?.visible&&!force)return;
    const a=st.plane.rotation.z||0;if(!force&&d.a!=null&&Math.abs(a-d.a)<0.0015)return;d.a=a;
    const g=d.cv.getContext('2d');g.clearRect(0,0,d.cv.width,d.cv.height);g.save();g.translate(d.px,d.py);g.rotate(a);g.translate(-d.px,-d.py);
    g.drawImage(d.img,0,0);g.restore();st.reflTex.needsUpdate=true;}
  function logoApply(st){
    FORMA_EDGE.at=0;                                         // the Forma moved or changed: its outline is read again
    const o=st.opts,f=FINISH[o.finish]||FINISH.cromo,m=st.metal,p=SURF.p02;
    m.color.set(f.color);m.metalness=f.metalness;m.clearcoat=f.clearcoat;
    m.roughness=Math.max(0.01,Math.min(0.6,f.rough*(2-2*o.polish)+0.02*(1-o.polish)));m.clearcoatRoughness=m.roughness*0.5;
    m.iridescence=f.iridescence||0;m.iridescenceIOR=1.35;m.iridescenceThicknessRange=[200,500];
    const op=f.opacity??1,tr=op<1;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}m.opacity=op;
    m.ior=f.ior??1.5;m.specularIntensity=f.specular??1;m.sheen=f.sheen||0;m.sheenColor.set(f.sheenColor??0x000000);m.sheenRoughness=0.4;
    m.emissive.set(f.emissive??0x000000);
    const vc=st.hasColors;if(m.vertexColors!==vc){m.vertexColors=vc;m.needsUpdate=true;}
    if(st.brandU)st.brandU.value=f.vertexColors?1:0;
    if(f.vertexColors&&!st.hasColors)m.color.set(0x1a8fd6);
    m.envMapIntensity=o.reflect*(f.env??1);
    const side=2*o.size/0.9;                               // the logo fills ~90% of its square
    st.plane.scale.setScalar(side/2);
    const width=p.max[2]-p.min[2];
    st.plane.position.set(p.min[0]+0.004,(p.min[1]+p.max[1])*o.height,(p.min[2]+p.max[2])/2-o.pos*width);
    if(o.front){st.group.rotation.y=0;o.front=false;}
    if(o.angle!=null){st.group.rotation.y=o.angle;o.angle=null;}   // a given angle (radians), e.g. its back
    st.studioT=null;                                        // the chrome environment follows the new setting
    // a Forma rendered in Blender with a BlenderKit material (opts.render: its picture, same square and framing as the
    // live one): the plane shows that picture instead of the live metal, which stops drawing while it is on
    reflApply(st);
    const url=o.render||null;
    if(url!==st.renderUrl){st.renderUrl=url;
      if(!url){st.plane.material.map=st.rt.texture;st.plane.material.needsUpdate=true;}
      else{const done=tex=>{if(st.renderUrl!==url)return;st.plane.material.map=tex;st.plane.material.needsUpdate=true;};
        st.renderP=renderTex(url).then(tex=>{if(tex)done(tex);});}}
    // a Forma in video with transparency (opts.video): the plane shows it, and the live one stops drawing while it is on
    const vu=o.video||null;
    if(vu!==st.videoUrl){st.videoUrl=vu;
      if(st.vid){st.vid.pause();st.vid.removeAttribute('src');st.vid.load();st.vid=null;st.vidTex?.dispose();st.vidTex=null;if(!url){st.plane.material.map=st.rt.texture;st.plane.material.needsUpdate=true;}}
      if(vu){const v=doc.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.src=vu;v.defaultPlaybackRate=0.6;v.playbackRate=0.6;
        const tx=new T.VideoTexture(v);if('colorSpace' in tx&&T.SRGBColorSpace)tx.colorSpace=T.SRGBColorSpace;else tx.encoding=T.sRGBEncoding;
        st.vid=v;st.vidTex=tx;v.addEventListener('playing',()=>{if(st.vid!==v)return;st.plane.material.map=tx;st.plane.material.needsUpdate=true;},{once:true});v.play().catch(()=>{});}}
  }
  // the Blender pictures of the Forma, loaded once each (and ahead of time with pharmaRoom.preloadForma)
  function renderTex(url){const c=LOGO.renders||(LOGO.renders={}),w=LOGO.renderWait||(LOGO.renderWait={});
    if(c[url])return Promise.resolve(c[url]);
    return w[url]||(w[url]=new Promise(res=>new T.TextureLoader().load(url,tex=>{
      if("colorSpace" in tex&&T.SRGBColorSpace)tex.colorSpace=T.SRGBColorSpace;else tex.encoding=T.sRGBEncoding;tex.anisotropy=8;c[url]=tex;res(tex);},
      undefined,()=>{delete w[url];res(null);})));}
  const EW=512,EH=256;                                       // size of the chrome studio picture
  // size of the 360° reflection picture: the reflections are cut into six cube faces of a quarter of its width, so
  // 1024 gives 256 px faces (512 gave 128: soft, milky, grey; 2048 was sharper but too heavy to rebuild during fades)
  const RW=1024,RH=512;
  // mix of the bright silver studio (0) and the contrasted chrome one (1), cached per value
  function studioMix(t){
    t=Math.round(Math.max(0,Math.min(1,t))*20)/20;
    if(LOGO.mix&&LOGO.mixT===t)return LOGO.mix;
    const A=studioMap(),B=contrastMap(),M=LOGO.mix||new Float32Array(A.length);
    for(let i=0;i<A.length;i++)M[i]=A[i]+(B[i]-A[i])*t;
    LOGO.mix=M;LOGO.mixT=t;return M;
  }
  // contrasted chrome: a light, cool sky, a sharp horizon, a dark floor, crisp light panels and dark window bars
  function contrastMap(){
    if(LOGO.contrast)return LOGO.contrast;
    const S=new Float32Array(EW*EH*3),soft=(v,a,b,e)=>{const s=x=>x<=0?0:x>=1?1:x*x*(3-2*x);return s((v-a)/e)*s((b-v)/e);};
    const panels=[
      {u:[0.18,0.26],v:[0.12,0.42],k:0.5,e:0.006},{u:[0.47,0.62],v:[0.06,0.11],k:0.5,e:0.005},{u:[0.79,0.815],v:[0.18,0.46],k:0.5,e:0.004},
      {u:[0.40,0.60],v:[0.66,0.675],k:0.55,e:0.004},
      ...[0.11,0.33,0.565,0.70,0.90].map(c=>({u:[c-0.006,c+0.006],v:[0.02,0.47],k:-0.62,e:0.003}))];
    for(let y=0;y<EH;y++){const v=y/(EH-1);
      const sky=0.86-0.2*Math.pow(v/0.5,1.5),ground=0.04+0.12*Math.pow(Math.max(0,(v-0.5)/0.5),1.2);
      const h=Math.min(1,Math.max(0,(v-0.495)/0.01)),base=sky*(1-h)+ground*h;
      for(let x=0;x<EW;x++){const u=x/(EW-1);let l=base;
        for(const b of panels)l+=b.k*soft(u,b.u[0],b.u[1],b.e)*soft(v,b.v[0],b.v[1],b.e);
        l=Math.max(0,Math.min(1,l))*255;const p=(y*EW+x)*3,cool=v<0.5?1.05:1.0;
        S[p]=l*0.96;S[p+1]=l*0.99;S[p+2]=Math.min(255,l*cool);}}
    return LOGO.contrast=S;
  }
  function studioMap(){
    if(LOGO.studio)return LOGO.studio;
    const S=new Float32Array(EW*EH*3),soft=(v,a,b,e)=>{const s=x=>x<=0?0:x>=1?1:x*x*(3-2*x);return s((v-a)/e)*s((b-v)/e);};
    const marks=[   // u (around, 0..1), v (top 0 .. bottom 1), added light, edge softness
      {u:[-0.1,1.1],v:[0.488,0.512],k:-0.78,e:0.004},      // the horizon: one crisp dark line all around
      {u:[-0.1,1.1],v:[0.60,0.615],k:-0.45,e:0.006},       // a second, softer line below it
      ...[0.10,0.36,0.62,0.86].map(c=>({u:[c-0.005,c+0.005],v:[0.05,0.488],k:-0.7,e:0.003})),   // thin dark bars
      {u:[0.66,0.74],v:[0.22,0.40],k:-0.6,e:0.01},         // a black card on one side (the deep accent)
      {u:[0.18,0.26],v:[0.14,0.42],k:0.3,e:0.006},         // light panels: pure white
      {u:[0.45,0.58],v:[0.06,0.11],k:0.3,e:0.005}];
    for(let y=0;y<EH;y++){const v=y/(EH-1);
      const base=v<0.5?0.93-0.13*(v/0.5):0.82-0.22*Math.pow((v-0.5)/0.5,1.3);   // bright all round, a little less below
      for(let x=0;x<EW;x++){const u=x/(EW-1);let l=base;
        for(const b of marks)l+=b.k*soft(u,b.u[0],b.u[1],b.e)*soft(v,b.v[0],b.v[1],b.e);
        l=Math.max(0,Math.min(1,l))*255;const p=(y*EW+x)*3;
        S[p]=l*0.97;S[p+1]=l*0.99;S[p+2]=Math.min(255,l*1.03);}}
    return LOGO.studio=S;
  }
  function studioTexture(st){
    const t=Math.round((st.opts.studio??0.45)*20)/20;
    if(st.studioTex&&st.studioT===t)return st.studioTex;
    const S=studioMix(t),data=new Uint8Array(EW*EH*4);
    for(let p=0,q=0,i=0;p<EW*EH;p++,q+=3,i+=4){data[i]=S[q];data[i+1]=S[q+1];data[i+2]=S[q+2];data[i+3]=255;}
    st.studioTex?.dispose();st.studioTex=new T.DataTexture(data,EW,EH,T.RGBAFormat);st.studioTex.needsUpdate=true;
    st.studioTex.magFilter=T.LinearFilter;st.studioTex.minFilter=T.LinearFilter;st.studioT=t;
    return st.studioTex;
  }
  // the last call wins: a "show" still loading the model must not bring the Forma back after a later "hide" (a wall
  // that already has the logo painted on it)
  async function logo3d(on,opts){LOGO.want=!!on;const r=await logo3dRaw(on,opts);if(LOGO.want!==!!on&&!LOGO.want)await logo3dRaw(false);return r;}
  async function logo3dRaw(on,opts){
    const s=LOGO.state;
    if(!on){if(s){s.on=false;s.plane.visible=false;if(s.refl)s.refl.visible=false;cancelAnimationFrame(s.raf);a.refreshMedia?.();}return true;}
    if(s){Object.assign(s.opts,opts);if(!s.on){s.on=true;s.plane.visible=true;s.raf=requestAnimationFrame(s.tick);}logoApply(s);if(s.renderUrl)await s.renderP;return true;}
    // a second call while the model is still loading waits for it (or it would build a second Forma on the wall)
    if(LOGO.loading){await LOGO.loading;return LOGO.want===!!on?logo3dRaw(on,opts):true;}
    let doneLoading;LOGO.loading=new Promise(r=>doneLoading=r);
    // a Forma shown as its Blender picture (opts.render) does not wait for the model: only the live chrome needs it, and
    // the model comes in behind the picture
    const glbP=LOGO.glb();
    if(!opts?.render)await glbP.catch(e=>{LOGO.loading=null;doneLoading();throw e;});
    LOGO.doneLoading=doneLoading;
    const R=a.renderer,scene=new T.Scene(),cam=new T.PerspectiveCamera(24,1,0.1,100),group=new T.Group(),pivot=new T.Group();
    const metal=new T.MeshPhysicalMaterial({color:0xf3f5f8,metalness:1,roughness:0.12,clearcoat:1,clearcoatRoughness:0.04,envMapIntensity:1.25});
    // the logo carries the brand's own gradient (light blue to dark blue) as vertex colours: the "azul" finish shows it
    // as it is; every other finish keeps its own colour and only darkens where the brand is dark, so each swoosh still
    // turns from light to dark as in the logo
    const brandU={value:0};
    metal.onBeforeCompile=sh=>{sh.uniforms.uBrand=brandU;
      sh.fragmentShader='uniform float uBrand;'+String.fromCharCode(10)+sh.fragmentShader.replace('#include <color_fragment>',
        ['#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )',' if(uBrand>0.5)diffuseColor.rgb*=vColor.rgb;',' else{float dk=clamp((0.34-vColor.g)/0.236,0.0,1.0);diffuseColor.rgb*=mix(1.0,0.42,dk);}','#endif'].join(String.fromCharCode(10)));};
    group.add(pivot);scene.add(group);
    const key=new T.DirectionalLight(0xffffff,0.6);key.position.set(3,5,6);scene.add(key);
    cam.position.set(0,0,1).setLength(4.6/(2*Math.tan(T.MathUtils.degToRad(12))));cam.lookAt(0,0,0);
    const rt=new T.WebGLRenderTarget(1536,1536,{samples:4});   // 1536: a clean outline close up, lighter than 2048 every frame
    // The reflections, made on the graphics card every frame from the very textures the walls are painted with, so the
    // metal changes in the same instant as the walls (steps, the opening, the spheres lighting up). A small shader
    // wraps both walls into a 360° picture and, where the wall is white or black, puts the chrome environment instead.
    const envRT=new T.WebGLRenderTarget(RW,RH,{depthBuffer:false});envRT.texture.mapping=T.EquirectangularReflectionMapping;
    const envScene=new T.Scene(),envCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
    const envMat=new T.ShaderMaterial({depthTest:false,depthWrite:false,
      uniforms:{p01:{value:null},p02:{value:null},studio:{value:null},nxt:{value:null},split:{value:4490/6410},has:{value:0},hasNext:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`uniform sampler2D p01,p02,studio,nxt;uniform float split,has,hasNext;varying vec2 vUv;
        vec3 wall(float u,float t){float y=1.0-t;
          if(u<split)return texture2D(p01,vec2(u/split,y)).rgb;
          return texture2D(p02,vec2((u-split)/(1.0-split),y)).rgb;}
        float box(float x,float a,float b,float e){return smoothstep(a-e,a+e,x)*(1.0-smoothstep(b-e,b+e,x));}
        void main(){
          float vt=1.0-vUv.y,t=clamp((vt-90./256.)/(76./256.),0.,1.);     // the picture in the middle band
          vec3 c=has>0.5?wall(vUv.x,t):vec3(0.0);
          float L=dot(c,vec3(.2126,.7152,.0722)),sat=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b)),grey=1.0-min(1.0,sat*2.5);
          // white or black walls (the Forma's white room, a step switched off) would make the chrome vanish into them:
          // there it reflects the chrome environment instead; colours are reflected as they are
          float w=max(smoothstep(0.7,0.92,L),1.0-smoothstep(0.03,0.14,L))*grey;
          vec3 s=texture2D(studio,vec2(vUv.x,vt)).rgb;
          // "Antecipar a próxima cena": on white or black the logo already reflects the next scene's picture (the whole
          // wall, as it will be), and the chrome studio only where that one is white or black too
          if(hasNext>0.5){vec3 cn=texture2D(nxt,vec2(vUv.x,1.0-t)).rgb;
            float Ln=dot(cn,vec3(.2126,.7152,.0722)),gn=1.0-min(1.0,(max(cn.r,max(cn.g,cn.b))-min(cn.r,min(cn.g,cn.b)))*2.5);
            float wn=max(smoothstep(0.7,0.92,Ln),1.0-smoothstep(0.03,0.14,Ln))*gn;
            s=mix(cn,s,wn);}
          vec3 band=mix(c,s,w);
          // Above the walls a white studio with a few black flags (as chrome is photographed), below them a dark floor,
          // both faintly tinted by the walls. Chrome reads as chrome through hard white against hard black: a mirror that
          // only showed the wall would melt into it, and a mid-grey sky or ceiling makes the whole metal read grey.
          vec3 tint=vec3(0.0);
          if(has>0.5){for(int i=0;i<8;i++){float u=(float(i)+0.5)/8.0;tint+=wall(u,0.3)+wall(u,0.7);}tint/=16.0;}
          float lights=box(vUv.x,0.16,0.27,0.004)*box(vt,0.10,0.24,0.004)+box(vUv.x,0.44,0.60,0.004)*box(vt,0.04,0.09,0.004)
            +box(vUv.x,0.78,0.82,0.003)*box(vt,0.12,0.30,0.003)+0.8*box(vUv.x,0.40,0.62,0.003)*box(vt,0.80,0.81,0.002);
          float flags=clamp(box(vUv.x,0.04,0.12,0.004)*box(vt,0.03,0.40,0.004)+box(vUv.x,0.29,0.35,0.004)*box(vt,0.0,0.38,0.004)
            +box(vUv.x,0.52,0.68,0.004)*box(vt,0.16,0.27,0.004)+box(vUv.x,0.80,0.88,0.004)*box(vt,0.02,0.42,0.004),0.0,1.0);
          vec3 ceil=mix(vec3(1.0,1.02,1.06)+tint*0.08,vec3(0.015)+tint*0.03,flags)+vec3(1.5)*lights*step(vt,0.5),
               floorc=0.02+tint*0.07+vec3(1.0)*lights*step(0.5,vt);
          float inB=smoothstep(78./256.,94./256.,vt)*(1.0-smoothstep(162./256.,178./256.,vt));
          gl_FragColor=vec4(mix(vt<0.5?ceil:floorc,band,inB),1.0);}`});
    envScene.add(new T.Mesh(new T.PlaneGeometry(2,2),envMat));
    scene.environment=envRT.texture;
    // a square on the wall, centred on Parede 02, as tall as the projection (2 m); the logo fills ~80% of it
    const p=SURF.p02,plane=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({map:rt.texture,transparent:true,depthWrite:false,toneMapped:false}));
    plane.position.set(p.min[0]+0.004,(p.min[1]+p.max[1])/2,(p.min[2]+p.max[2])/2);plane.rotation.y=Math.PI/2;plane.renderOrder=5;
    a.scene.add(plane);
    // the Forma's reflection on water (opts.reflexo: its picture and where it starts / how tall, as shares of the
    // Forma's square): a second plane right under the Forma, cut where the wall ends
    const refl=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}));
    refl.rotation.y=Math.PI/2;refl.renderOrder=4;refl.visible=false;a.scene.add(refl);
    const st=LOGO.state={refl,on:true,plane,scene,group,cam,rt,envRT,envScene,envCam,envMat,metal,hasColors:false,brandU,opts:{...LOGO_DEFAULT,...opts},raf:0,last:performance.now(),studioT:null};
    LOGO.loading=null;LOGO.doneLoading?.();LOGO.doneLoading=null;   // the Forma exists: calls that waited apply their options to it
    logoApply(st);
    // the model goes into the Forma's square as soon as it is there (at once when it was awaited above)
    glbP.then(gltf=>{
      gltf.scene.traverse(o=>{if(o.isMesh){o.material=metal;o.castShadow=false;if(o.geometry.attributes.color)st.hasColors=true;o.geometry.deleteAttribute('normal');o.geometry.computeVertexNormals();}});
      const box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      gltf.scene.position.sub(center);pivot.add(gltf.scene);pivot.scale.setScalar(4.2/Math.max(size.x,size.y));logoApply(st);},()=>{});
    st.tick=now=>{
      if(!st.on)return;
      const dt=Math.min(0.1,(now-st.last)/1000);st.last=now;
      if(st.opts.gira||st.opts.balanco){const s_=now/1000,k=reduced?0:1;st.spin=(st.spin||0)+(st.opts.gira||0)*dt*k;
        const sw=(st.opts.balanco||0)*Math.sin(s_*0.31)*k,tl=(st.opts.balanco||0)*0.3*Math.sin(s_*0.23+1.3)*k;
        group.rotation.set(tl,sw,st.spin);
        st.plane.rotation.z=st.renderUrl?st.spin:0;            // a Blender picture of the Forma turns in its own plane
        reflSpin(st);}
      else{group.rotation.y+=st.opts.speed*dt;                 // turning all the time (asked for), even with reduced motion
        if(st.plane.rotation.z){st.plane.rotation.z=0;reflSpin(st);}}
      group.position.y=st.opts.fixo?0:Math.sin(now/1000*1.1)*0.05;   // fixo: no floating (a still render of it)
      const prevTarget=R.getRenderTarget(),prevAlpha=R.getClearAlpha(),prevColor=R.getClearColor(new T.Color());
      const tStudio=studioTexture(st),t1=display.p01?.tex,t2=display.p02?.tex;
      // only when a wall really changed in this frame (a step, the opening, the spheres lighting up): same instant, and
      // nothing spent while the walls stand still
      const tn=st.opts.antecipa?LOGO.next:null;
      const stamp=[t1?.id,t1?.version,t2?.id,t2?.version,tStudio.id,tn?.id].join('|');
      if(stamp!==st.envStamp&&now-(st.envAt||0)>140){st.envStamp=stamp;st.envAt=now;
        envMat.uniforms.p01.value=t1||null;envMat.uniforms.p02.value=t2||null;
        envMat.uniforms.has.value=t1&&t2?1:0;envMat.uniforms.studio.value=tStudio;
        envMat.uniforms.nxt.value=tn;envMat.uniforms.hasNext.value=tn?1:0;
        R.setRenderTarget(envRT);R.render(envScene,envCam);envRT.texture.needsPMREMUpdate=true;}
      if(!st.renderUrl&&!st.vid){R.setRenderTarget(rt);R.setClearColor(0x000000,0);R.clear();R.render(scene,cam);}
      R.setRenderTarget(prevTarget);R.setClearColor(prevColor,prevAlpha);
      st.raf=requestAnimationFrame(st.tick);
    };
    st.raf=requestAnimationFrame(st.tick);a.refreshMedia?.();
    if(st.renderUrl)await st.renderP;
    return true;
  }
  window.pharmaRoom={
    // Builds the surface image at the exact master aspect ratios without changing CAD geometry.
    async compose(source,surface,fit='cover',posY=.5,posX=.35,align=null,forma={}){
      // source: URL of a still, or a canvas already prepared by the gallery (table fitted to the plates).
      const image=typeof source==='string'?await loadImage(source):source;
      const W=surface==='mesa'?5363:2564,H=surface==='mesa'?1080:460;
      const isForma=fit==='extend'&&surface!=='mesa',src=isForma?cleanBorders(image,3200):image;
      return (isForma&&extendCanvas(src,W,H,posX,forma))||(fit==='plates'&&surface==='mesa'?platesCanvas(image,W,H,align):null)||fitCanvas(src,W,H,isForma||fit==='plates'?'cover':fit,posY,forma?.zoom);
    },
    // Shows a composed surface; with fadeMs > 0 it cross-fades from what is on the surface now (used by the Roteiro).
    // mode 'acender': the cross-fade of a surface coming back from black, slow at first like a dimmer.
    // mode 'tecido' / 'tecido-puxa': the new picture comes out of the Forma (the logo) like a cloth opening over the walls,
    // or the picture on show is drawn into the Forma like a cloth pulled in (walls only; see TECIDO).
    // mode 'abrir': instead of a cross-fade the new picture opens from a line in the middle of the surface, a solid
    // band with hard edges growing up and down until it fills it (the white of the Forma opening onto the scene).
    // motion: 'agua' or 'materia' sets the picture moving (see MOTION); anything else keeps it still.
    show(surface,canvas,fadeMs=0,mode='fade',motion=null){
      const channels=surface==='mesa'?[['mesa',0,1]]:[['p01',0,4490/6410],['p02',4490/6410,1]];
      const jobs=[];
      for(const [channel,start,end] of channels){
        const sw=Math.round(canvas.width*(end-start)),sh=canvas.height,slot=a.CENAS[a.getCena()][channel];
        let d=display[channel];
        // a picture of another size (a plain black of a switched-off step, say) is fitted to the surface as it is, so it
        // still cross-fades: a new surface would cut straight to it
        const keep=d&&slot.tex===d.tex&&(fadeMs>0||(d.canvas.width===sw&&d.canvas.height===sh)),w=keep?d.canvas.width:sw,h=keep?d.canvas.height:sh;
        if(!keep){
          const c=doc.createElement('canvas');c.width=w;c.height=h;
          d=display[channel]={canvas:c,tex:new T.CanvasTexture(c)};d.tex.minFilter=T.LinearFilter;
          if(slot.video){slot.video.pause();URL.revokeObjectURL(slot.video.src);slot.video=null;}
          slot.tex?.dispose();slot.tex=d.tex;slot.kind='img';slot.nome=surface==='mesa'?'Still do acervo · mesa':'Panorama do acervo · '+channel;
          fadeMs=0;
        }
        const next=doc.createElement('canvas');next.width=w;next.height=h;
        next.getContext('2d').drawImage(canvas,canvas.width*start,0,sw,sh,0,0,w,h);
        let prev=null;if(fadeMs>0){prev=doc.createElement('canvas');prev.width=w;prev.height=h;prev.getContext('2d').drawImage(d.canvas,0,0);}
        let tmp=false;
        if(mode==='abrir'){
          // The opening of the white (Forma): near-white becomes pure white in the new picture, so its white matches the
          // white before it and the moving edge disappears into it; and if the picture before already shows an open band
          // (the step before was an opening too), this one continues from that band instead of starting again.
          const nd=next.getContext('2d',{willReadFrequently:true}),img=nd.getImageData(0,0,w,h),px=img.data;
          for(let i=0;i<px.length;i+=4){const r=px[i],g2=px[i+1],b=px[i+2],mx=Math.max(r,g2,b),mn=Math.min(r,g2,b);
            if(mn>225&&mx-mn<14){const k2=Math.min(1,(mn-225)/12);px[i]=r+(255-r)*k2;px[i+1]=g2+(255-g2)*k2;px[i+2]=b+(255-b)*k2;}}
          nd.putImageData(img,0,0);
          if(prev){
            // the open band of the picture before, read on its right half (where a Forma in front does not reach)
            const pd=prev.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;let top=-1,bottom=-1,n=0;
            for(let y=0;y<h;y++){let dark=0;n=0;for(let x=Math.round(w*0.55);x<w;x+=6){n++;const i=(y*w+x)*4;if(Math.min(pd[i],pd[i+1],pd[i+2])<246)dark++;}
              if(dark>n*0.5){if(top<0)top=y;bottom=y;}}
            tmp={from:top<0?0:Math.max(h/2-top,bottom-h/2)};
          }
        }
        jobs.push({d,next,prev,tmp,channel,mask:motionMask(next,motion,surface)});
      }
      cancelAnimationFrame(fades[surface]);
      for(const j of jobs)tecidoEnd(j.channel);
      if((mode==='tecido'||mode==='tecido-puxa')&&fadeMs>0&&surface!=='mesa'&&jobs.every(j=>j.prev)){
        // the new picture is on the wall at once; the shader shows the cloth between it and the one before
        const o=formaPoint(),t0=performance.now();
        for(const j of jobs){motionSet(j.channel,j.mask,false);
          const g=j.d.canvas.getContext('2d');g.globalAlpha=1;g.drawImage(j.next,0,0);j.d.tex.needsUpdate=true;
          const prev=new T.CanvasTexture(j.prev);prev.minFilter=T.LinearFilter;prev.wrapS=prev.wrapT=T.ClampToEdgeWrapping;
          TECIDO[j.channel]={prev,t0,ms:fadeMs,mode:mode==='tecido'?1:2,o};}
        if(!MOTION.raf)MOTION.raf=requestAnimationFrame(motionTick);
        a.refreshMedia();
        return new Promise(res=>{const done=setTimeout(()=>{for(const j of jobs)tecidoEnd(j.channel);res();},fadeMs+30);
          for(const j of jobs)TECIDO[j.channel].timer=done;});
      }
      const moving=jobs.map(j=>motionSet(j.channel,j.mask,fadeMs>0));
      const paint=k=>{for(const s of moving)s.mix=k;for(const {d,next,prev,tmp} of jobs){const g=d.canvas.getContext('2d');g.globalAlpha=1;
        if(tmp&&k<1){                                       // a solid opening: a hard-edged band growing from the middle
          const H=d.canvas.height,W=d.canvas.width,from=Math.min(H/2,tmp.from),half=Math.round(from+(H/2-from)*k),cy=Math.round(H/2);
          const f=Math.round(from),x=f>0?Math.min(1,k/0.45):1,i2=x*x*(3-2*x);
          if(f>0){                                          // continuing an open band (the step before was an opening too):
            g.fillStyle='#fff';g.fillRect(0,0,W,H);         // outside the band, what was in front of the white (a Forma's
            g.globalAlpha=1-i2;g.drawImage(prev,0,0);g.globalAlpha=1;                     // ends) fades with the change
            g.save();g.beginPath();g.rect(0,cy-f,W,2*f);g.clip();g.drawImage(prev,0,0);   // inside the band, the scene
            g.globalAlpha=i2;g.drawImage(next,0,0);g.restore();g.globalAlpha=1;           // before turns into this one
          }else g.drawImage(prev,0,0);
          const f2=Math.max(0,f-3);                         // newly opened rows: solid, overlapping the band edge by 3 px (no seam)
          if(half>f2){g.save();g.beginPath();g.rect(0,cy-half,W,half-f2);g.rect(0,cy+f2,W,half-f2);g.clip();g.drawImage(next,0,0);g.restore();}
        }else{if(prev&&k<1){g.drawImage(prev,0,0);g.globalAlpha=k;}g.drawImage(next,0,0);}
        g.globalAlpha=1;d.tex.needsUpdate=true;}};
      if(!(fadeMs>0)){paint(1);a.refreshMedia();return Promise.resolve();}
      a.refreshMedia();
      return new Promise(res=>{const t0=performance.now();
        const ease=mode==='acender'?x=>{const y=Math.pow(x,1.6);return y*y*(3-2*y);}:x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
        const step=now=>{const x=Math.min(1,(now-t0)/fadeMs),k=ease(x);paint(k);if(x<1)fades[surface]=requestAnimationFrame(step);else res();};
        fades[surface]=requestAnimationFrame(step);});
    },
    // Light that follows the soundtrack (Roteiro): repaints a surface every frame from a canvas of the same size as the
    // one last shown, without fades or new textures. Returns false when the surface is not ready (then use show()).
    waveStyle(n){WAVE_STYLE=+n||0;},
    pulse,pulsesClear,formaParticles,formaLevel,wallPoint,waterScene,plateScene,ripple,ripplesClear,
    paint(surface,canvas){
      const channels=surface==='mesa'?[['mesa',0,1]]:[['p01',0,4490/6410],['p02',4490/6410,1]];
      for(const [channel] of channels){
        const d=display[channel];
        if(!d||a.CENAS[a.getCena()][channel].tex!==d.tex)return false;
      }
      cancelAnimationFrame(fades[surface]);
      for(const [channel,start,end] of channels){
        const d=display[channel],w=d.canvas.width,h=d.canvas.height,g=d.canvas.getContext('2d');
        g.globalAlpha=1;g.drawImage(canvas,canvas.width*start,0,canvas.width*(end-start),canvas.height,0,0,w,h);d.tex.needsUpdate=true;
      }
      return true;
    },
    // The Pharma logo in 3D (modelos/logo-pharma-3d.glb, exported from logo-pharma-3d.html), turning slowly in the
    // middle of Parede 02 as part of what is projected there. It is metallic and reflects the walls' own pictures:
    // both walls, as shown right now, are wrapped into a 360° environment (refreshed a few times a second).
    setLogo(on,opts={}){return logo3d(on,opts);},
    // the chrome studio the Forma reflects (the room's white walls give way to it), as pixels: for another renderer (the
    // page's opening) to light its own Forma exactly like the room's. Null until the room's Forma exists
    chromeEnvPixels(){const st=LOGO.state;if(!st)return null;const R=a.renderer,u=st.envMat.uniforms,keep=[u.has.value,u.hasNext.value,u.studio.value];
      u.has.value=0;u.hasNext.value=0;u.studio.value=studioTexture(st);
      const rt=new T.WebGLRenderTarget(RW,RH,{depthBuffer:false}),prev=R.getRenderTarget();R.setRenderTarget(rt);R.render(st.envScene,st.envCam);
      const px=new Uint8Array(RW*RH*4);R.readRenderTargetPixels(rt,0,0,RW,RH,px);R.setRenderTarget(prev);rt.dispose();
      [u.has.value,u.hasNext.value,u.studio.value]=keep;st.envStamp=null;return {w:RW,h:RH,px};},
    preloadForma(urls){return Promise.all((urls||[]).map(renderTex));},
    // The Forma as it is drawn on Parede 02 now, for exporting the wall: its picture (the act's Blender render, or the
    // live metal read from its render target, unpremultiplied and in sRGB) and its square on Parede 02, as fractions
    // of that wall (u from its left edge at the corner with Parede 01, v from the top). null when the logo is off.
    logoLayer(){
      const st=LOGO.state;if(!st?.on||!st.plane.visible)return null;
      const p=SURF.p02,pl=st.plane;pl.updateMatrixWorld();
      const side=pl.scale.x*2,Wz=p.max[2]-p.min[2],Hy=p.max[1]-p.min[1];
      const u=(p.max[2]-pl.position.z)/Wz,v=(p.max[1]-pl.position.y)/Hy;
      let canvas=null;
      if(st.vid&&st.vid.videoWidth){canvas=doc.createElement('canvas');canvas.width=st.vid.videoWidth;canvas.height=st.vid.videoHeight;canvas.getContext('2d').drawImage(st.vid,0,0);}
      else if(st.renderUrl){const img=LOGO.renders?.[st.renderUrl]?.image;if(img){canvas=doc.createElement('canvas');canvas.width=img.width;canvas.height=img.height;canvas.getContext('2d').drawImage(img,0,0);}}
      else{const W=st.rt.width,H=st.rt.height,buf=new Uint8Array(W*H*4);a.renderer.readRenderTargetPixels(st.rt,0,0,W,H,buf);
        const lin=st.rt.texture.encoding!==T.sRGBEncoding,toS=x=>x<=0.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-0.055,lut=new Uint8Array(256);
        for(let i=0;i<256;i++)lut[i]=Math.round(255*(lin?toS(i/255):i/255));
        canvas=doc.createElement('canvas');canvas.width=W;canvas.height=H;const g=canvas.getContext('2d'),im=g.createImageData(W,H);
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s_=((H-1-y)*W+x)*4,d=(y*W+x)*4,al=buf[s_+3];if(!al)continue;   // rows from the bottom in the target
          for(let c=0;c<3;c++)im.data[d+c]=lut[Math.min(255,Math.round(buf[s_+c]*255/al))];im.data[d+3]=al;}
        g.putImageData(im,0,0);}
      return canvas&&{canvas,u,v,w:side/Wz,h:side/Hy};
    },
    // the wall of the scene that comes next (a composed wall canvas, or null): reflected by the logo on white or black
    // when its "antecipa" option is on
    setLogoNext(canvas){
      if(LOGO.nextCanvas===canvas)return;LOGO.nextCanvas=canvas||null;LOGO.next?.dispose();LOGO.next=null;
      if(canvas){LOGO.next=new T.CanvasTexture(canvas);LOGO.next.minFilter=T.LinearFilter;LOGO.next.needsUpdate=true;}
    },
    // Movement in the pictures of Água / Moléculas and Matéria: on or off, and its strength (1 = as designed)
    setMotion(on,amp=1){MOTION.on=!!on;MOTION.amp=Math.max(0,amp);},
    async apply(source,surface,fit='cover',posY=.5,posX=.35,align=null,forma={},motion=null){
      this.show(surface,await this.compose(source,surface,fit,posY,posX,align,forma),0,'fade',motion);
    },
    // Art file at the pixel-map size (walls 6410 x 1150, table 10726 x 2160) with the same fit as in the room.
    async exportSurface(source,surface,fit,posY=.5,posX=.35,forma={}){
      const image=await loadImage(source),W=surface==='mesa'?10726:6410,H=surface==='mesa'?2160:1150;
      const isForma=fit==='extend'&&surface!=='mesa',src=isForma?cleanBorders(image,Infinity):image;
      const c=(isForma&&extendCanvas(src,W,H,posX,forma))||fitCanvas(src,W,H,isForma?'cover':fit,posY,forma?.zoom);
      return new Promise(r=>c.toBlob(r,'image/png'));
    },
    setTableObjects(on){layer('pratos',!!on);},
    // Mean brightness (0-255) of what each projection channel is showing now (diagnostics).
    levels(){const out={};for(const [k,d] of Object.entries(display)){const c=doc.createElement('canvas');c.width=64;c.height=16;const g=c.getContext('2d');g.drawImage(d.canvas,0,0,64,16);const px=g.getImageData(0,0,64,16).data;let s=0;for(let i=0;i<px.length;i+=4)s+=(px[i]+px[i+1]+px[i+2])/3;out[k]=Math.round(s/(px.length/4));}return out;},
    // Full-size wall master (6410 x 1150) with the Forma logo centred; null when no logo is found.
    async exportWall(source,posX=.35){
      const c=extendCanvas(cleanBorders(await loadImage(source),Infinity),6410,1150,posX);
      return c&&new Promise(r=>c.toBlob(r,'image/png'));
    },
    // The viewer moves its camera again while the 10 MB document finishes loading; settle a few times unless someone already moved it.
    ready(){presentation();a.resize();flyTo('sala',true);for(const ms of [600,1500,3000,5000])setTimeout(()=>{if(!userMoved&&current)flyTo(current,true);},ms);},
    flyTo,showView,currentView,
    snapshot(){a.renderer.render(a.scene,a.cam);return a.renderer.domElement.toDataURL('image/png');},
    canvas(){return a.renderer.domElement;},
    setAutoRotate(on){a.controls.autoRotate=!!on;a.controls.autoRotateSpeed=1.6;},
    // Room support light (the original default is 0.10); projection brightness is not affected.
    setLight(x){a.setLuzApoio(Math.max(0,x));},
    fitView(){}
  };
})();
