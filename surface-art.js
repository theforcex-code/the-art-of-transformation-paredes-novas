'use strict';
// The art of each surface as it sits in the room, in plain 2D canvas (no 3D needed): Forma walls with the logo kept
// whole and the white field stretched around it, photos continued at their edges, covers with their crop, the table
// fitted to its plates. Shared by the 3D room (room-bridge.js) and the Frames page, so both make the same picture.
window.pharmaArt=(()=>{
  const doc=document;
  // decoded off the main thread (decode()), so drawing a big picture the first time does not stop what is playing
  const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.src=src;
    (image.decode?image.decode():new Promise((ok,no)=>{image.onload=ok;image.onerror=no;})).then(()=>resolve(image),()=>image.naturalWidth?resolve(image):reject(new Error('Não foi possível abrir o still')));});

  // Forma walls: black borders touching the edge of the image (top, bottom or sides) become white field. Only near-black
  // pixels inside those border bands are replaced, by the first clean pixel next to the band, so logo tips that cross a
  // strip stay. Images without a border come back untouched.
  function cleanBorders(image,maxW){
    const k=Math.min(1,maxW/image.width),w=Math.round(image.width*k),h=Math.round(image.height*k);
    const c=doc.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0,w,h);
    const img=g.getImageData(0,0,w,h),d=img.data;
    const dark=i=>0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]<45;
    const rowDark=y=>{let n=0;for(let x=0;x<w;x+=4)if(dark((y*w+x)*4))n++;return n/(w/4)>0.6;};
    let top=0,bottom=h;while(top<h*0.45&&rowDark(top))top++;while(bottom>h*0.55&&rowDark(bottom-1))bottom--;
    const colDark=x=>{let n=0,t=0;for(let y=top;y<bottom;y+=4){t++;if(dark((y*w+x)*4))n++;}return t&&n/t>0.6;};
    let left=0,right=w;while(left<w*0.3&&colDark(left))left++;while(right>w*0.7&&colDark(right-1))right--;
    if(!top&&bottom===h&&!left&&right===w)return c;
    const copy=(dst,src)=>{d[dst]=d[src];d[dst+1]=d[src+1];d[dst+2]=d[src+2];d[dst+3]=255;};
    const inset=Math.max(2,Math.round(h*0.004));
    const yTop=Math.min(h-1,top+inset),yBot=Math.max(0,bottom-1-inset);
    for(let y=0;y<h;y++){
      if(y>=top&&y<bottom)continue;
      const sy=y<top?yTop:yBot;
      for(let x=0;x<w;x++){const i=(y*w+x)*4;if(dark(i))copy(i,(sy*w+x)*4);}
    }
    const xL=Math.min(w-1,left+inset),xR=Math.max(0,right-1-inset);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      if(x>=left&&x<right)continue;
      const i=(y*w+x)*4;if(dark(i))copy(i,(y*w+(x<left?xL:xR))*4);
    }
    g.putImageData(img,0,0);
    return c;
  }
  // Forma walls: find the box the silver logo occupies (mid-grey pixels, ignoring the white field and the black strips).
  // Returns {x0,x1,y0,y1} in image pixels, or null when the background is not a white field.
  function logoBox(image){
    const aw=600,ah=Math.max(1,Math.round(image.height*aw/image.width));
    const c=doc.createElement('canvas');c.width=aw;c.height=ah;const g=c.getContext('2d');g.drawImage(image,0,0,aw,ah);
    const px=g.getImageData(0,0,aw,ah).data,lum=i=>0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2];
    const rows=[];for(let y=0;y<ah;y++){let sum=0;for(let x=0;x<aw;x++)sum+=lum((y*aw+x)*4);if(sum/aw>40)rows.push(y);}
    if(rows.length<ah*0.2)return null;
    // Background luminance of this image (median of the analysed pixels): the logo is what sits well below it.
    const sample=[];for(const y of rows)for(let x=0;x<aw;x+=7)sample.push(lum((y*aw+x)*4));sample.sort((p,q)=>p-q);
    const bg=sample[Math.floor(sample.length/2)],limit=Math.min(170,bg-45);
    if(bg<175)return null; // not a white field
    const isLogo=(x,y)=>{const L=lum((y*aw+x)*4);return L>30&&L<limit;};
    const hits=[];for(let x=0;x<aw;x++){let n=0;for(const y of rows)if(isLogo(x,y))n++;hits.push(n);}
    const min=Math.max(2,rows.length*0.06);let x0=hits.findIndex(n=>n>=min),x1=aw-1-[...hits].reverse().findIndex(n=>n>=min);
    if(x0<0||x1<=x0)return null;
    const rowHits=[];for(let y=0;y<ah;y++){let n=0;for(let x=x0;x<=x1;x++)if(isLogo(x,y))n++;rowHits.push(n);}
    const rmin=Math.max(2,(x1-x0)*0.04);let y0=rowHits.findIndex(n=>n>=rmin),y1=ah-1-[...rowHits].reverse().findIndex(n=>n>=rmin);
    if(y0<0||y1<=y0){y0=0;y1=ah-1;}
    const pad=aw*0.02;x0=Math.max(0,x0-pad);x1=Math.min(aw,x1+1+pad);
    const k=image.width/aw;return {x0:x0*k,x1:x1*k,y0:y0*k,y1:(y1+1)*k};
  }
  const logoColumns=image=>{const b=logoBox(image);return b&&[b.x0,b.x1];};
  // Places the form without cutting or deforming it, and fills the rest of the wall by stretching only background:
  // - white field: the logo box is kept and the white around it is stretched (also up and down when the form is smaller);
  // - photo (landscape): the whole image is kept and only its outer edges (sky, sea) are stretched sideways.
  // posX / posY: where the form's centre goes on the panorama; size: form height as a fraction of the wall (optional);
  // anchor: the form's box in a photo, as fractions {x,y,w,h} (optional, image centre by default).
  function extendCanvas(image,W,H,posX,opts={}){
    // a form marked by hand (anchor) wins over the white-field detection (light photos can look white)
    const iw=image.width,ih=image.height,white=opts.anchor?null:logoBox(image);
    if(!white&&!opts.anchor&&!opts.photo)return null;
    const a=opts.anchor||{x:.5,y:.5,w:1,h:1};
    const box=white||{x0:(a.x-a.w/2)*iw,x1:(a.x+a.w/2)*iw,y0:(a.y-a.h/2)*ih,y1:(a.y+a.h/2)*ih};
    const objH=Math.max(1,box.y1-box.y0),cx=(box.x0+box.x1)/2,cy=(box.y0+box.y1)/2;
    // scale: by default the image height is the wall height (as before); with size, the form gets that height
    let k=opts.size?opts.size*H/objH:H/ih;
    k=Math.min(k,H/objH);                                     // the form never taller than the wall
    if(!white)k=Math.max(k,H/ih);                             // a photo always fills the wall height (no bars)
    // 1) vertical: source strip of height H/k with the form centre at posY, white extended above/below if needed
    const srcH=H/k,posY=opts.posY??(cy/ih);
    let oy=posY*srcH-cy;
    oy=Math.min(srcH-box.y1,Math.max(-box.y0,oy));            // keeps the whole form inside the wall
    if(!white){oy=Math.max(srcH-ih,Math.min(0,oy));}          // a photo is never moved past its own edges
    const V=doc.createElement('canvas');V.width=iw;V.height=Math.round(srcH);const gv=V.getContext('2d');gv.imageSmoothingQuality='high';
    gv.drawImage(image,0,oy);
    const band=Math.max(2,ih*0.02);
    if(oy>0)gv.drawImage(image,0,0,iw,band,0,0,iw,oy+1);
    if(oy+ih<V.height)gv.drawImage(image,0,ih-band,iw,band,0,oy+ih-1,iw,V.height-(oy+ih)+1);
    // 2) horizontal: protected part (logo box, or the whole photo) kept, the sides stretched
    const px0=white?box.x0:0,px1=white?box.x1:iw,wp=(px1-px0)*k;
    if(wp>W)return null;
    let left=W*posX-(cx-px0)*k;
    // A photo's quiet outer background may be clipped, but its anchored Forma must not move.
    left=white?Math.max(0,Math.min(W-wp,left)):Math.max(-box.x0*k,Math.min(W-box.x1*k,left));
    const c=doc.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.imageSmoothingQuality='high';
    if(!white){
      // photo: each side is continued by mirroring the photo's own edge (horizon and sky stay continuous, nothing is
      // deformed). If the mirror would reach the form itself, that side is widened from its outer quarter instead.
      const m=iw*0.02,eL=left/k,eR=(W-left-wp)/k;
      const mirrorL=eL<=box.x0-m,mirrorR=eR<=iw-box.x1-m;
      const sL=mirrorL?0:Math.max(1,Math.min(box.x0-m,iw*0.25)),sR=mirrorR?iw:Math.min(iw-1,Math.max(box.x1+m,iw*0.75));
      const dL=left+sL*k,dR=left+sR*k;
      g.drawImage(V,sL,0,sR-sL,V.height,dL,0,dR-dL,H);
      if(mirrorL){if(left>0){g.save();g.translate(left,0);g.scale(-1,1);g.drawImage(V,0,0,eL,V.height,0,0,left,H);g.restore();}}
      else g.drawImage(V,0,0,sL,V.height,0,0,dL,H);
      if(mirrorR){const r=W-left-wp;if(r>0){g.save();g.translate(left+wp,0);g.scale(-1,1);g.drawImage(V,iw-eR,0,eR,V.height,-r,0,r,H);g.restore();}}
      else g.drawImage(V,sR,0,iw-sR,V.height,dR,0,W-dR,H);
      return c;
    }
    const edge=Math.max(2,iw*0.01),lx=white?Math.max(edge,px0):edge,rx=white?Math.min(iw-edge,px1):iw-edge;
    if(left>0)g.drawImage(V,0,0,lx,V.height,0,0,left,H);
    g.drawImage(V,px0,0,px1-px0,V.height,left,0,wp,H);
    if(W-left-wp>0)g.drawImage(V,rx,0,iw-rx,V.height,left+wp,0,W-left-wp,H);
    return c;
  }
  // Table fitted to the 16 plates: the whole image is drawn in the rectangle {bx,by,kx,ky} (fractions of the table).
  // A stretched copy underneath fills whatever that rectangle leaves uncovered, so no black edge shows.
  function platesCanvas(image,W,H,p){
    if(!p)return null;
    const c=doc.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.imageSmoothingQuality='high';
    g.drawImage(image,0,0,W,H);
    g.drawImage(image,p.bx*W,p.by*H,p.kx*W,p.ky*H);
    return c;
  }
  // zoom (cover only, >= 1): enlarges the picture inside the frame, so posY can move its horizon to a chosen height
  function fitCanvas(image,W,H,fit,posY,zoom=1){
    const c=doc.createElement('canvas');c.width=W;c.height=H;
    const ctx=c.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    const scale=fit==='cover'?Math.max(W/image.width,H/image.height)*Math.max(1,zoom||1):Math.min(W/image.width,H/image.height);
    const w=fit==='stretch'?W:image.width*scale,h=fit==='stretch'?H:image.height*scale;
    const y=fit==='cover'?(H-h)*posY:(H-h)/2;
    ctx.imageSmoothingQuality='high';ctx.drawImage(image,(W-w)/2,y,w,h);
    return c;
  }

  // Art file at the pixel-map size (walls 6410 x 1150, table 10726 x 2160) with the same fit as in the room.
  function surfaceCanvas(image,surface,fit,posY=.5,posX=.35,forma={},maxClean=Infinity,W,H){
    W=W||(surface==='mesa'?10726:6410);H=H||(surface==='mesa'?2160:1150);
    const isForma=fit==='extend'&&surface!=='mesa',src=isForma?cleanBorders(image,maxClean):image;
    return (isForma&&extendCanvas(src,W,H,posX,forma))||fitCanvas(src,W,H,isForma?'cover':fit,posY,forma?.zoom);
  }
  return {loadImage,cleanBorders,logoBox,extendCanvas,platesCanvas,fitCanvas,surfaceCanvas};
})();
