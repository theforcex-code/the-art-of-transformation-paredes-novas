'use strict';
// Curadoria compartilhada pela galeria e pela sala: favoritas, removidas, combinações parede + mesa, vistas salvas,
// encaixes da mesa e o roteiro. Grava em selecao.json pelo server.py; sem servidor (arquivo estático), só neste navegador.
//
// Cada mudança é uma operação (mutate). A gravação leva a versão (rev) que este navegador viu: se outra janela gravou
// antes, o servidor recusa (409), a página busca o estado novo, reaplica as próprias operações e grava de novo.
// Assim duas janelas abertas não apagam as mudanças uma da outra.
window.pharmaStore=(()=>{
  const KEY='pharma.selecao.v1',MERGED='pharma.selecao.mesclado',API='api/selecao';
  const empty=()=>({favorites:[],removed:[],combos:[],views:[],aligns:[],deleted:[],sequence:[],stories:[],restage:[],anchors:[],tracks:[],presentation:[]});
  let state=empty(),remote=false,rev=0,timer=0,pending=[],saving=false;
  const listeners=new Set();
  const normalize=raw=>{const s=empty();if(raw&&typeof raw==='object')for(const k of Object.keys(s))if(Array.isArray(raw[k]))s[k]=raw[k];return s;};
  // Etapa trocada pela pessoa (ex.: uma Forma sem fundo branco usada como transição Água para Forma): vale para a
  // galeria e para a sala, sem mexer no catálogo nem nos arquivos.
  function applyRestage(){
    const media=window.PHARMA?.media||[],map=new Map(state.restage.map(r=>[r.sha,r.stage]));
    for(const a of media){if(a._stage0===undefined)a._stage0=a.stage;a.stage=map.get(a.sha256)||a._stage0;}
  }
  const emit=()=>{applyRestage();listeners.forEach(fn=>fn(state));};
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const keepLocal=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}};

  async function fetchState(){
    const r=await fetch(API,{cache:'no-store'});
    if(!r.ok||!r.headers.get('content-type')?.includes('json'))throw new Error('sem servidor');
    const data=await r.json();rev=data.rev||0;return normalize(data);
  }
  function mutate(fn){fn(state);pending.push(fn);emit();keepLocal();schedule();}
  function schedule(){clearTimeout(timer);timer=setTimeout(flush,250);}
  async function flush(){
    if(!remote||saving||!pending.length)return;
    saving=true;const sent=pending.length;
    try{
      for(let attempt=0;attempt<3;attempt++){
        const r=await fetch(API,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...state,rev})});
        if(r.ok){rev=(await r.json().catch(()=>({}))).rev??rev+1;pending=pending.slice(sent);break;}
        if(r.status!==409)throw new Error(r.status);
        // someone else saved first: take theirs, replay ours on top, try again
        const ops=pending;state=await fetchState();for(const fn of ops)fn(state);emit();keepLocal();
      }
    }catch{window.pharmaToast?.('Não foi possível salvar a seleção no projeto');}
    finally{saving=false;if(pending.length)schedule();}
  }

  // What this browser kept before the project server existed (or while an old server ran) joins the project once.
  function mergeLocal(local){
    const has=(list,x,key)=>list.some(y=>key?y[key]===x[key]:y===x);
    const ops=[];
    for(const k of ['favorites','removed'])for(const x of local[k])if(!has(state[k],x))ops.push(s=>{if(!s[k].includes(x))s[k].push(x);});
    for(const k of ['combos','views'])for(const x of local[k])if(!has(state[k],x,'id'))ops.push(s=>{if(!s[k].some(y=>y.id===x.id))s[k].push(x);});
    for(const x of local.aligns)if(!has(state.aligns,x,'sha'))ops.push(s=>{if(!s.aligns.some(y=>y.sha===x.sha))s.aligns.push(x);});
    if(local.sequence.length&&!state.sequence.length)ops.push(s=>{if(!s.sequence.length)s.sequence=local.sequence;});
    for(const fn of ops)mutate(fn);
    return ops.length;
  }

  const ready=(async()=>{
    let local=null;try{local=normalize(JSON.parse(localStorage.getItem(KEY)));}catch{}
    try{state=await fetchState();remote=true;}catch{}
    if(!remote){if(local)state=local;emit();return;}
    let merged=0;try{if(local&&!localStorage.getItem(MERGED)){merged=mergeLocal(local);localStorage.setItem(MERGED,new Date().toISOString());}}catch{}
    emit();keepLocal();
    if(merged)window.pharmaToast?.('Juntei ao projeto o que estava salvo só neste navegador');
  })();

  // The intent (add or remove) is fixed when the person clicks, so replaying the operation after a conflict is safe.
  const toggleIn=(k,id)=>{const add=!state[k].includes(id);mutate(s=>{s[k]=s[k].filter(x=>x!==id);if(add)s[k].push(id);});return add;};
  return {
    ready,get remote(){return remote},get state(){return state},
    on(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    isFav:id=>state.favorites.includes(id),
    isRemoved:id=>state.removed.includes(id),
    isDeleted:id=>state.deleted.some(d=>d.sha===id),
    toggleFav:id=>toggleIn('favorites',id),
    toggleRemoved(id){
      const removing=!state.removed.includes(id);
      mutate(s=>{if(removing){if(!s.removed.includes(id))s.removed.push(id);s.favorites=s.favorites.filter(x=>x!==id);}else s.removed=s.removed.filter(x=>x!==id);});
      return removing;
    },
    addCombo(combo){const c={id:uid(),...combo};mutate(s=>{if(!s.combos.some(x=>x.id===c.id))s.combos.unshift(c);});return c;},
    removeCombo(id){mutate(s=>{s.combos=s.combos.filter(c=>c.id!==id);s.sequence=s.sequence.filter(x=>x.combo!==id);for(const st of s.stories)st.steps=st.steps.filter(x=>x.combo!==id);});},
    renameCombo(id,name){mutate(s=>{const c=s.combos.find(c=>c.id===id);if(c)c.name=name;});},
    updateCombo(id,patch){mutate(s=>{const c=s.combos.find(c=>c.id===id);if(c)Object.assign(c,patch);});},
    // Onde está a forma dentro de uma foto (frações da imagem): {sha, x, y, w, h}
    getAnchor:sha=>state.anchors.find(a=>a.sha===sha)||null,
    setAnchor(sha,box){mutate(s=>{s.anchors=s.anchors.filter(a=>a.sha!==sha);if(box)s.anchors.push({sha,...box});});},
    // Trilha sonora: músicas do projeto {id, name, file, duration}; os passos apontam para elas (step.music)
    addTrack(t){const x={id:uid(),...t};mutate(s=>{if(!s.tracks.some(y=>y.id===x.id))s.tracks.push(x);});return x;},
    updateTrack(id,patch){mutate(s=>{const t=s.tracks.find(t=>t.id===id);if(t)Object.assign(t,patch);});},
    renameTrack(id,name){mutate(s=>{const t=s.tracks.find(t=>t.id===id);if(t)t.name=name;});},
    removeTrack(id){mutate(s=>{s.tracks=s.tracks.filter(t=>t.id!==id);for(const st of s.stories)for(const x of st.steps)if(x.music===id)delete x.music;});},
    // Roteiro: passos em ordem, cada um aponta para uma combinação salva: [{id, combo}]
    setSequence(steps){const seq=steps.map(x=>({id:x.id||uid(),combo:x.combo}));mutate(s=>{s.sequence=seq;});},
    // Roteiros com nome: {id, name, hold, fade, steps:[{id, combo} | {id, wall, table, stage, name}]}
    addStory(story){const st={id:uid(),hold:6,fade:2,steps:[],...story};st.steps=st.steps.map(x=>({id:x.id||uid(),...x}));mutate(s=>{if(!s.stories.some(x=>x.id===st.id))s.stories.push(st);});return st;},
    updateStory(id,patch){mutate(s=>{const st=s.stories.find(x=>x.id===id);if(st)Object.assign(st,patch);});},
    // the presentation (apresentacao.html): the walls and tables chosen for each act
    setPresentationCheck(key,id,on){mutate(s=>{let v=s.presentation.find(x=>x.key===key);if(!v){v={key};s.presentation.push(v);}v.checks={...(v.checks||{}),[id]:!!on};});},
    setPresentationAct(key,patch){mutate(s=>{const i=s.presentation.findIndex(x=>x.key===key),v={...(i<0?{}:s.presentation[i]),...patch,key};if(i<0)s.presentation.push(v);else s.presentation[i]=v;});},
    setStorySteps(id,steps){const list=steps.map(x=>({...x,id:x.id||uid()}));mutate(s=>{const st=s.stories.find(x=>x.id===id);if(st)st.steps=list;});},
    removeStory(id){mutate(s=>{s.stories=s.stories.filter(x=>x.id!==id);});},
    addView(view){const v={id:uid(),...view};mutate(s=>{if(!s.views.some(x=>x.id===v.id))s.views.push(v);});return v;},
    stageOf:sha=>state.restage.find(r=>r.sha===sha)?.stage||null,
    originalStage:sha=>(window.PHARMA?.media||[]).find(a=>a.sha256===sha)?._stage0||null,
    setStage(sha,stage){mutate(s=>{s.restage=s.restage.filter(r=>r.sha!==sha);const orig=(window.PHARMA?.media||[]).find(a=>a.sha256===sha)?._stage0;if(stage&&stage!==orig)s.restage.push({sha,stage});});},
    removeView(id){mutate(s=>{s.views=s.views.filter(v=>v.id!==id);});},
    renameView(id,name){mutate(s=>{const v=s.views.find(v=>v.id===id);if(v)v.name=name;});},
    // Encaixe da mesa nos 16 pratos, por imagem: {sha, bx, by, kx, ky, offsets (ajuste fino de cada prato)}
    getAlign:sha=>state.aligns.find(a=>a.sha===sha)||null,
    setAlign(sha,p){const a={sha,bx:p.bx,by:p.by,kx:p.kx,ky:p.ky,offsets:p.offsets||null};mutate(s=>{s.aligns=s.aligns.filter(x=>x.sha!==sha);s.aligns.push(a);});},
    clearAlign(sha){mutate(s=>{s.aligns=s.aligns.filter(a=>a.sha!==sha);});},
    // Busca o estado do projeto de novo (ex.: uma imagem apagada que foi enviada outra vez volta ao acervo).
    // Reload only when someone else saved since (a cheap check of the revision), and never over unsaved edits.
    async pull(){
      if(!remote||saving||pending.length)return false;
      const r=await fetch(API+'?so=rev',{cache:'no-store'}).catch(()=>null);if(!r?.ok)return false;
      const n=(await r.json().catch(()=>({}))).rev;if(n==null||n===rev||saving||pending.length)return false;
      await this.refresh();return true;
    },
    async refresh(){
      if(!remote)return;
      const ops=pending;state=await fetchState();for(const fn of ops)fn(state);emit();keepLocal();
    },
    // Apagar: o servidor move os arquivos da imagem para _lixeira/ e devolve a lista de apagadas.
    async deleteMedia(sha){
      if(!remote)throw new Error('Apagar só funciona com o servidor da galeria (ABRIR.cmd).');
      const r=await fetch('api/apagar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha})});
      const out=await r.json().catch(()=>({}));if(!r.ok)throw new Error(out.error||'Não foi possível apagar');
      const ops=pending;state=await fetchState();for(const fn of ops)fn(state);emit();keepLocal();
      return out;
    }
  };
})();
