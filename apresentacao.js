'use strict';
// The Art of Transformation · the Construção roteiro act by act, against the dishes of the deck "atos / universos /
// jantar". Each act: the room in 3D (live, one room placed over the act on screen), its walls and tables (swappable;
// more can be added; saved for everyone in selecao.json, "presentation"), the dish's visual elements and what to make.
(async()=>{
  const $=s=>document.querySelector(s);
  const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
  const deck=$('#deck');
  const ROTEIRO='Construção · Forma branca';
  // smooth scrolling (Lenis, vendor/lenis-1.1.20.min.js): the wheel and the trackpad glide instead of jumping; the
  // links to the acts glide there too. On even when the system asks for less motion (asked for: without it the page
  // jumped too fast to stop on a scene). Each turn of the wheel goes about half as far as the browser's own
  const lenis=window.Lenis?new window.Lenis({lerp:0.075,wheelMultiplier:0.5,touchMultiplier:0.8,anchors:{offset:0}}):null;
  if(lenis){window.__lenis=lenis;const raf=t=>{lenis.raf(t);requestAnimationFrame(raf);};requestAnimationFrame(raf);}
  const glideTo=(top,dur)=>lenis?lenis.scrollTo(top,{duration:dur||1.1}):scrollTo({top,behavior:'smooth'});
  const ROOM_URL='sala3d.html?cenario=zk521a&v=151';

  // ---- the gallery's pictures and tools: the media lists of its index.html, the store, the plates, the art ----
  const html=(await (await fetch('midias.html',{cache:'no-store'})).text()).replace(/<!--[\s\S]*?-->/g,'');
  // all asked for at once (one after another, some forty small files took seconds before anything showed), run in
  // their order (async=false)
  const loadOrdered=list=>Promise.all(list.map(src=>new Promise(r=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=s.onerror=r;document.head.append(s);})));
  await loadOrdered([...[...html.matchAll(/<script[^>]+src="([^"]*(?:catalog|-media)\.js[^"]*)"/g)].map(m=>m[1]),'store.js?v=21','plates.js?v=13','surface-art.js?v=3','lucide.min.js']);
  const data=window.PHARMA||{media:[],stages:{}},store=window.pharmaStore,Plates=window.pharmaPlates,Art=window.pharmaArt;
  await store.ready;
  const media=new Map(data.media.map(m=>[m.sha256,m]));
  const SEM_ALFA=/iP(hone|ad|od)/.test(navigator.userAgent)||(/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Android|Edg|Firefox/.test(navigator.userAgent));
  const NOVAS={couvert:['couvert-1'],primeiro:['entrada-a','entrada-b','entrada-1','entrada-2','entrada-3'],segundo:['salada-5'],terceiro:['risoto-3'],quarto:['prato-4']};
  for(const k in NOVAS)NOVAS[k]=NOVAS[k].map(f=>{const sha='nova-'+f,image='apresentacao/paredes-novas/'+f+'.jpg';media.set(sha,{sha256:sha,image,thumb:image});return {sha};});
  const [videos,refs,pieces]=await Promise.all([   // (together)
    fetch('apresentacao/videos/videos.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
    fetch('apresentacao/deck/refs.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})),
    fetch('trilhas/ambientes/ambientes.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[])]);
  // where the Forma sits on Parede 02 (the same in every act): across the wall (-0.5..0.5, + = right), height of its
  // centre (share of the 2 m), size (share of the 2 m). Saved for everyone in selecao.json ("presentation", _logo).
  const LOGO_POS={pos:0,height:.5,size:.8};
  const logoPos=()=>{const v=(store.state.presentation||[]).find(x=>x.key==='_logo')||{};return {pos:v.pos??LOGO_POS.pos,height:v.height??LOGO_POS.height,size:v.size??LOGO_POS.size};};
  let logoSaving=false;
  // the Forma's reflection on the water (acts whose Parede 02 is water): its picture and where it sits under the Forma
  const REFLEXO={};
  for(const k of ['couvert']){const m=await fetch('modelos/formas/reflexo-'+k+'.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
    if(m)REFLEXO[k]={url:'modelos/formas/reflexo-'+k+'.png?v=1',inicio:m.inicio,altura:m.altura};}

  // ---- the acts ----
  const ACTS=[
    {key:'forma',n:'I',name:'Recepção',dish:'Sem prato. Os convidados chegam e a locução dá as boas-vindas.',
      els:[['Silêncio, precisão e luz','tem','O preto, o título e a Forma cromada.'],['Locução de boas-vindas','parte','A voz da Forma existe; falta gravar a locução.'],['Começar no escuro','falta','Hoje o título já aparece aceso.']],
      gap:'Começar no escuro; gravar a locução',
      make:['A sala começa no escuro total; o título acende junto com a voz da locução.','A Forma cromada na Parede 2 e um halo de luz em cada lugar quando os convidados se sentam.']},
    {key:'couvert',n:'II',name:'Welcome drink e couvert',dish:'Botanical Elixir: gin botânico, hibisco, limão-siciliano, espuma de alecrim e manjericão. O couvert como obra da projeção.',
      els:[['As esferas brilham com a trilha','tem','Acendem com os sons da trilha e iluminam os pratos.'],['Esferas peroladas','falta','Hoje o gel das esferas é azul.'],
        ['A luz indo até cada copo','falta','Quando o drink é servido, a luz vai até o copo de cada convidado.']],
      gap:'Esferas peroladas e a luz até cada copo',
      make:['As esferas acendem uma a uma no ritmo da trilha, em gel perolado.','A luz vai até cada copo quando o drink é servido.']},
    {key:'primeiro',n:'III',name:'Entrada',dish:'Tartar de filé-mignon, com alternativa veggie de aparência semelhante, ou ceviche contemporâneo.',
      els:[['Gel','tem','As esculturas de gel na praia.'],['Hélices de DNA','tem','A estrutura subindo do mar.'],['Precisão do corte','falta','O gel é todo curvo; falta cristalizar em sal.'],['Fio de óleo dourado','falta','Na mesa, percorrendo os lugares.']],
      gap:'O gel cristalizando em sal; o fio de óleo na mesa',
      make:['O gel começa a cristalizar em grãos de sal, preciso como o corte do prato.','Na mesa, sal brilhando na areia e um único fio de óleo dourado chegando a cada lugar.']},
    {key:'segundo',n:'IV',name:'Salada',dish:'Burrata, figo caramelizado e pesto de rúcula. Paleta: verde profundo, âmbar, vinho e creme.',
      els:[['Ramos e flores acendendo','tem','As plantas acendem em grupos com a trilha.'],['Um jardim escuro','tem','Verde floresta, com as luzes preservadas.'],
        ['O figo-geodo','falta','O figo se abrindo em geodo cor de vinho no centro da Parede 1.'],['Luz âmbar','falta','A luz das flores ainda é branca.'],['Nervuras douradas','falta','A estrutura das folhas revelada.']],
      gap:'O figo-geodo, a luz âmbar e as nervuras',
      make:['O jardim em verde floresta, com a luz das flores puxada para o âmbar da caramelização.','O figo se abrindo em geodo cor de vinho no centro da Parede 1, o clímax do ato.','Na mesa, rosetas suaves inspiradas no interior do figo, abrindo no serviço.']},
    {key:'terceiro',n:'V',name:'Risoto',dish:'Risoto de abobrinha, ou nhoque de batata ou mandioquinha. Camadas, incorporação, transformação gradual.',
      els:[['Camadas','tem','As sedas em camadas.'],['Pele e luminosidade','tem','A seda brilhante como pele hidratada.'],['Sequência do ato','falta','Hoje há um passo só.'],['Calor','falta','A seda ainda é fria.']],
      gap:'A sequência do ato e o calor',
      make:['As sedas entrando, se organizando em camadas e esquentando ao longo do ato, em 3 passos.','Na mesa, a seda em volta de cada lugar ganhando tons de creme e verde-abobrinha.']},
    {key:'quarto',n:'VI',name:'Prato principal',dish:'Entrecot, filé Angus em crosta, peixe ou couve-flor. Uma linguagem que sirva às quatro opções.',
      els:[['Volume','tem','As fitas de metal líquido.'],['Precisão e assinatura','tem','Rosa e cromo, com a Forma.'],['Servir às quatro opções','parte','A mesa abstrata serve carne, peixe e a opção vegetal.'],['Mesas do próprio ato','falta','Dois passos usam a mesa da passagem.']],
      gap:'As mesas do ato e a Revelação',
      make:['As fitas de metal líquido em rosa e cromo, terminando em cristal para a sobremesa nascer delas.','Na mesa, cristais se partindo em fios de luz e linhas âmbar como marcas de grelha abstratas.']},
    {key:'sobremesa',n:'VII',name:'Sobremesa',dish:'Uma escultura central, servida a todos. Elementos na mesa compondo a animação.',
      els:[['Os cristais','tem','Acendendo no horizonte, em sequência.'],['A rede de cristal na mesa','tem','Em volta de cada lugar.'],['Escultura central','falta','Definir com o chef; servida a todos.'],['O encerramento','parte','O passo final volta à Forma branca; deixar no preto.']],
      gap:'A escultura e o encerramento no preto',
      make:['Os cristais acendendo no horizonte enquanto a escultura chega ao centro da mesa.','A rede de cristal da mesa acendendo do centro para as pontas.','O fechamento: a volta ao preto, ao silêncio e à Forma.']},
  ];
  // ---- the Council (14/10/2026), second reading: the brand elements of the deck's universes in every act ----
  // Each act has one dominant universe and carries the others as accents; the elements are born from the dish's
  // ingredient. Every item can be ticked (saved for everyone in selecao.json, "presentation"); what the room already
  // shows starts ticked.
  const BRAND=[['fluid','Fluid','géis translúcidos e iridescentes, hidratação, emulsões'],['arch','Architecture','estruturas moleculares de vidro, hélice, redes e camadas'],
    ['energy','Energy Field','ondas concêntricas, pulsos e linhas de energia no ritmo da trilha'],['mineral','Mineral','cristais, hidroxiapatita, partículas que ganham volume'],
    ['future','Future of Beauty','metal líquido, cromo, luz e silêncio'],['joias','Joias','pérolas, metal, brilho e pedras coloridas']];
  const B=(id,status,text)=>{const b=BRAND.find(x=>x[0]===id);return {id:'m-'+id,label:b[1],status,text};};
  const T=(id,text)=>({id,text}),S=(id,status,text)=>({id,status,text});
  const COUNCIL={
    date:'15/10/2026',
    position:'Ficar com os checkpoints bons, de três tipos: o que dá para fazer por código ou com a skill de cor, uma revelação do ingrediente por ato com imagem gerada, e a infraestrutura (chef, deixas de serviço, Revelação, sequências). Cortar animação ao vivo, objetos no prato e metáforas a mais.',
    confidence:'82%. O corte segue o que a sala sabe fazer: imagens paradas com transição e luzes disparadas pela trilha. Pode mudar se o cliente quiser um objeto físico específico na mesa.',
    risks:[['Animação prometida','Checkpoints que pedem movimento contínuo ou sincronia com o garçom não podem ser entregues pela sala atual.'],
      ['Mesa ocupada','Objetos físicos no prato ou sobre os lugares atrapalham o serviço e cobrem a projeção.'],
      ['Lista que ninguém segue','Uma lista longa dilui os cinco momentos que o cliente vai lembrar: o escuro da abertura, a luz no copo, o figo-geodo, o metal virando cristal e o fecho no preto.']],
    steps:[T('codigo','Fazer por código os anéis de energia com a trilha, a luz no copo, o brilho em cada lugar e as partículas minerais nas passagens de fundo preto.'),
      T('cor','Recolorir com a skill de cor: esferas do couvert peroladas, âmbar e vinho na Salada.'),
      T('revelacoes','Gerar as três revelações do ingrediente: o sal cristalizando, o figo-geodo e o metal virando cristal.'),
      T('chef','Fechar com o chef os pratos e marcar as deixas de serviço e a Revelação de cada ato.'),
      T('sequencias','Completar as sequências do Risoto e do Principal, que hoje têm um passo cada.')],
    global:[T('forma-sempre','A Forma fica a noite toda e muda de matéria a cada universo: por código, o material da Forma 3D em cada ato (cromo, gel, nervuras, seda, metal rosé, cristal).'),
      T('mesa-regra','Mesa: a matéria do prato vista de perto, nunca a foto do prato; clareira calma em cada lugar; forte só na Revelação, cerca de 35% durante a refeição.'),
      T('atos','O deck diz "um jantar imersivo em 8 atos" e a apresentação tem 7: alinhar com o cliente.'),
      T('luz','Ritmo de luz: a marca forte na abertura de cada ato, acento discreto durante a refeição.'),
      T('equipe','Passar as deixas de serviço de cada ato para a equipe e ensaiar com a projeção.')],
    minority:['O Visionário','Cortar todas as metáforas de joia deixa a noite correta e esquecível. O figo-geodo e a escultura de joias precisam ficar, mesmo que deem trabalho.'],
    acts:{
      forma:{dominant:'Future of Beauty',forma:'Cromo puro no preto, parada e em silêncio.',note:'A abertura funciona pelo que tem de essencial: escuro, silêncio, o título e a Forma cromada. Aqui menos é mais; a marca se apresenta e o resto espera.',
        brand:[B('future','tem','Fundo preto, THE ART OF TRANSFORMATION e a Forma cromada na Parede 2.'),
          B('energy','tem','Por código: ondas concêntricas saindo da Forma, nos picos da voz quando a trilha toca e devagar, como respiração, sem ela.'),
          B('mineral','falta','Por código: partículas minerais brancas no preto, as mesmas que vão marcar as passagens entre os atos.')],
        table:[S('mesa-preta','tem','Mesa preta, invertida como a parede.'),
          S('mesa-halo','falta','Por código: um halo de luz em cada lugar quando os convidados se sentam.')],
        improve:[S('escuro','falta','Começar no escuro total e acender o título junto com a voz da locução.'),
          S('locucao','falta','Gravar a locução de boas-vindas e encaixar na trilha da Forma.'),
          S('tempo','falta','Definir quanto tempo a Forma fica até o couvert.')],
        cut:['Rede molecular se desenhando a partir do título: pede animação e enche a abertura.','Gel escorrendo atrás da Forma: pede animação.','Pérola ou peça cromada em cada prato: atrapalha o serviço.']},
      couvert:{dominant:'Energy Field',forma:'Cromo refletindo as esferas e pulsando com a luz delas, no ritmo da trilha.',note:'As esferas acendendo com a trilha já são o Energy Field e a melhor base da noite. O que falta é barato e tem efeito grande: o perolado das esferas, os anéis de luz e a luz chegando ao copo.',
        brand:[B('energy','tem','As esferas acendem com a trilha e, por código, anéis concêntricos saem das esferas que acendem e dos pratos do mesmo grupo na mesa.'),
          B('joias','falta','Com a skill de cor: as esferas em gel perolado e iridescente, como madrepérola. A pérola da marca encontra o Fluid.'),
          B('future','tem','A Forma cromada refletindo as esferas na Parede 2.')],
        table:[S('mesa-agua','tem','A água da mesa acende junto com as esferas da parede.'),
          S('mesa-prato','falta','O prato na mesa: espuma perolada fina e bolhas espalhadas entre os lugares, com sombras desfocadas de alecrim e manjericão sob a água.'),
          S('mesa-entrada','falta','Como entra: água escura, a espuma aparece quando o drink é servido e um anel de luz desce até cada copo.')],
        improve:[S('abertura','falta','Abrir com as esferas apagadas e acender uma a uma, antes de a água aparecer inteira.'),
          S('deixa','falta','Marcar na trilha a deixa de serviço do drink e do couvert.')],
        cut:['Filamentos de luz ligando as esferas em rede: pede animação.','Cristais na condensação e pérolas boiando: metáfora a mais num ato que já funciona.','Ramos de alecrim e objetos na mesa: o drink já é o objeto.']},
      primeiro:{dominant:'Fluid',forma:'Vira gel transparente, como as esculturas da praia.',note:'O gel da praia é o Fluid, e as hélices de DNA já trazem a Architecture. A mudança que faz o ato conversar com o tartar é o gel começar a cristalizar em sal: a revelação do ingrediente.',
        brand:[B('fluid','tem','O gel escorrendo pela praia.'),
          B('arch','tem','As hélices de DNA de vidro subindo do mar.'),
          B('joias','tem','As pedras coloridas na areia, como acento.'),
          B('mineral','falta','Imagem gerada: o gel cristalizando em grãos de sal, preciso como o corte do prato (a revelação do ato).'),
          B('energy','parte','Os passos com grupos de luz já existem; por código, ligá-los aos sons do Água · gel.')],
        table:[S('mesa-areia','tem','Mesa de areia rosada com o gel desenhando um anel em volta de cada lugar.'),
          S('mesa-prato','falta','O prato na mesa: grãos de sal brilhando na areia e um único fio de óleo dourado percorrendo a mesa entre os lugares.'),
          S('mesa-entrada','falta','Como entra: o gel aparece fraco, o fio de óleo chega a cada lugar na Revelação, e a mesa acalma.')],
        improve:[S('prato','falta','Escolher com o chef entre tartar e ceviche.'),
          S('ponte','falta','Ligar ao couvert: o perolado das esferas continua no brilho do gel da praia.'),
          S('revelacao','falta','Último passo de Revelação, disparado pela deixa de serviço.'),
          S('grupo-praia','falta','O grupo "Praia · gel e DNA" (passos 8 a 12) repete as imagens da Entrada e não entra em nenhum ato: juntar à Entrada ou apagar.')],
        cut:['Vidro escorrendo até o prato e parando quando é servido: pede sincronia ao vivo com o garçom.','Mostarda como gema e óleo como fio de ouro na parede: metáfora a mais.','Louça especial de vidro: decisão do chef, não da projeção.']},
      segundo:{dominant:'Architecture',forma:'Ganha as nervuras das plantas e acende junto com os grupos de flores.',note:'O jardim em verde floresta é o ato mais completo e o melhor candidato a ato de prova. A revelação do ingrediente, o figo que se abre em geodo, é a ideia mais forte da noite.',
        brand:[B('arch','parte','Ramos e flores radiais já formam estrutura; imagem gerada com nervuras douradas nas folhas.'),
          B('energy','tem','As plantas acendem em grupos no ritmo da trilha.'),
          B('mineral','falta','Imagem gerada: o figo se abrindo em geodo cor de vinho no centro da Parede 1, o clímax do ato.')],
        table:[S('mesa-verde','tem','Mesa verde floresta, com os anéis de luz dos pratos acendendo junto com as plantas.'),
          S('mesa-prato','falta','O prato na mesa: em volta de cada lugar, uma roseta suave inspirada no interior do figo, em vinho e âmbar; traços verdes translúcidos do pesto entre os lugares.'),
          S('mesa-entrada','falta','Como entra: as rosetas fechadas se abrem no serviço, em 2 passos, e a mesa acalma.')],
        improve:[S('opcao','falta','Confirmar a opção A (burrata e figo) ou B (palmito); o figo-geodo depende da A.'),
          S('ambar','falta','Com a skill de cor: âmbar e vinho entrando no verde, na luz das flores.')],
        cut:['Folhas crescendo em direção aos pratos: pede animação.','Granadas, burrata como pérola, orvalho em gel e pesto como fluxo na parede: metáforas a mais ao lado do figo.','Amêndoas e figo físicos na mesa: atrapalham o serviço.']},
      terceiro:{dominant:'Fluid',forma:'Superfície acetinada, como seda e pele perolada.',note:'A seda brilhante é o Fluid na pele, e a direção está certa. O problema real é estrutural: o ato tem um passo só, então não existe transformação para ver.',
        brand:[B('fluid','tem','As sedas brilhantes fluindo como pele.'),
          B('arch','parte','Imagem gerada: as camadas da seda se organizando, numa sequência de 3 passos.'),
          B('energy','falta','Por código: os anéis de energia sob os pratos, o mesmo mecanismo dos outros atos.')],
        table:[S('mesa-seda','tem','Mesa com a seda trançada em volta de cada lugar.'),
          S('mesa-prato','falta','O prato na mesa: a seda em volta de cada lugar ganha tons de creme e verde-abobrinha, com ondas concêntricas suaves.'),
          S('mesa-entrada','falta','Como entra: os tons mudam em 3 passos até o serviço, depois calma.')],
        improve:[S('sequencia','falta','Criar a sequência do ato (hoje é um passo só): seda entrando, camadas, calor e Revelação.'),
          S('prato','falta','Confirmar nhoque ou risoto.'),
          S('ponte','falta','Com a skill de cor: ligar ao verde da Salada no primeiro passo, que vai virando tom de pele.')],
        cut:['Risoto sendo mexido sincronizado com a trilha: pede animação.','Amido como cristal, grãos como pérolas, abobrinha como jade: metáforas a mais.','Seda física sobre a mesa: cobre a projeção e atrapalha o serviço.']},
      quarto:{dominant:'Future of Beauty',forma:'Vira metal líquido rosé, torcido como as fitas.',note:'O metal líquido em rosa e cromo é o Future of Beauty no auge. A mesa de cristais se partindo já traz o Mineral e prepara a sobremesa; falta as outras mesas do ato acompanharem.',
        brand:[B('future','tem','As fitas de metal líquido em rosa e cromo.'),
          B('fluid','tem','O metal escorrendo e se torcendo como gel.'),
          B('mineral','parte','A mesa de cristais se partindo em fios de luz no primeiro passo; levar para os outros.'),
          B('energy','falta','Por código: um brilho em cada lugar no serviço, o mesmo mecanismo do copo do couvert.')],
        table:[S('mesa-cristal','tem','Mesa de cristais se partindo em fios de luz em volta dos lugares (primeiro passo).'),
          S('mesa-ponte','falta','As mesas do segundo e do terceiro passo repetem a água ao pôr do sol da passagem: trocar por uma mesa do próprio ato.'),
          S('mesa-prato','falta','O prato na mesa: linhas âmbar de luz entre os lugares, como marcas de grelha abstratas, servindo carne, peixe e a opção vegetal.')],
        improve:[S('opcoes','falta','Definir as opções do principal e uma linguagem visual comum.'),
          S('revelacao','falta','Último passo de Revelação, disparado pela deixa de serviço.'),
          S('ponte','falta','Fechar o ato com o metal começando a cristalizar, para a sobremesa nascer dele.')],
        cut:['Coral de couve-flor: metáfora a mais.','Sal grosso ou pedras lapidadas na mesa: higiene e serviço.','Volume escultural girando junto da Forma: pede animação.']},
      sobremesa:{dominant:'Mineral',forma:'Vira cristal facetado, como os cristais do horizonte: a Forma se torna joia.',note:'Os cristais que acendem no horizonte e a rede de cristal na mesa já são o Mineral e a melhor sequência da noite. Falta a escultura servida a todos e a volta à Forma no preto.',
        brand:[B('mineral','tem','Os cristais no horizonte e a rede de cristal em volta de cada lugar.'),
          B('energy','parte','Os cristais acendem em sequência; por código, ligar aos sons da trilha.'),
          B('joias','parte','O brilho dos cristais; pérolas e pedras coloridas como acento na escultura.'),
          B('future','parte','O passo final volta à Forma branca; deixar no preto, como a abertura.')],
        table:[S('mesa-rede','tem','Mesa com uma rede de cristal em volta de cada lugar.'),
          S('mesa-centro','falta','Como entra: a rede acende do centro para as pontas enquanto a escultura chega; aqui a mesa pode ser protagonista por um minuto.'),
          S('mesa-escultura','falta','Na mesa física: a escultura central servida a todos (decisão com o chef).')],
        improve:[S('escultura','falta','Definir a escultura central com o chef.'),
          S('fecho','falta','Fechar como abriu: o passo final no preto, com a Forma e o silêncio.'),
          S('metal','falta','Decidir o som Diamante · metal: entra antes da sobremesa ou sai.')],
        cut:['Rosto em metal líquido: genérico, e o deck pede controle para o Future of Beauty não parecer genérico.','Cristais de açúcar crescendo: pede animação.','Calda e chocolate com brilho de gel: metáfora a mais.']}
    }
  };
  // ticked items, per act (and 'geral'); what the room already shows counts as done until someone unticks it
  const ticked=key=>(store.state.presentation||[]).find(x=>x.key===key)?.checks||{};
  const isDone=(key,it)=>{const t=ticked(key);return it.id in t?!!t[it.id]:it.status==='tem';};
  const STATUS={tem:'já tem',parte:'em parte',falta:'falta'};
  function checkList(key,items){
    const ul=el('ul','checks');
    for(const it of items){const li=el('li'),lab=el('label'),box=el('input');box.type='checkbox';box.dataset.ck=key;box.dataset.id=it.id;
      box.onchange=()=>store.setPresentationCheck(key,it.id,box.checked);
      const tx=el('span','ck-text');
      if(it.label){const h=el('span','ck-label');h.append(el('strong',null,it.label),el('em','st '+it.status,STATUS[it.status]));tx.append(h);}
      tx.append(el('span',null,it.text));lab.append(box,tx);li.append(lab);ul.append(li);}
    return ul;}
  const actItems=key=>{const c=COUNCIL.acts[key];return c?[...c.brand,...c.table,...c.improve]:[];};
  const progress=(key,items)=>items.filter(it=>isDone(key,it)).length;
  // prompts to generate each act's wall (panorama) and table, with the brand elements the Council set for it.
  // Midjourney takes --ar as written; in ChatGPT, ask for the widest format: the gallery fits it to the surface.
  // the rules for the whole end of the night (acts V to VII): pasted once, before the step prompts
  const MASTER_PROMPT="Vou te pedir uma série de imagens para projeção mapeada num jantar de luxo da Maison Pharmaesthetics (The Art of Transformation). Siga estas regras em todas as imagens:\n1. Paredes: panorama ultra largo, proporção 39:7 (se não der, o mais largo possível, sempre horizontal). Mesas: vista de cima, proporção 5:1.\n2. Cada ato tem 3 ou 4 passos. Gere o passo 1 e depois os seguintes como VARIAÇÃO DA MESMA IMAGEM: mesmo enquadramento, horizonte na mesma altura (cerca de 60% da altura), objeto principal na mesma posição. Mude só o que o passo pede.\n3. Os 30% da direita da parede ficam mais calmos e escuros: ali entra uma escultura 3D da marca.\n4. Fundo escuro e elegante, contraste suave, sem pôr do sol laranja, sem pessoas, sem texto, sem logotipos, fotorrealista, luxo minimalista.\n5. Cristais sempre como minerais naturais (quartzo, calcita), baixos e orgânicos, nunca altos e retos como prédios.\n6. Mesas: use a imagem de mesa que eu enviar como referência e mantenha as 16 clareiras redondas e calmas exatamente onde estão (é onde ficam os pratos); o desenho vive entre elas, com baixa saturação.\n7. Paleta por ato: Humano em taupe escuro, nude, pérola e creme; Joia em preto de estúdio com metal rosé e cromo; Escultura em noite azul-preta com cristal transparente e poucos pontos de pérola e pedras coloridas.";
  const MASTER_ACTS=['terceiro','quarto','sobremesa'];
  const PROMPTS={
    forma:[['Parede','Ultra-wide panoramic composition, deep matte black space, a single smooth monolithic form in polished liquid chrome resting in silence, minimal museum lighting, luxury, photorealistic, no text --ar 39:7'],
      ['Mesa','Top-down view of a matte black surface with a soft halo of light at sixteen evenly spaced places, minimal, luxury, photorealistic, no text --ar 5:1']],
    couvert:[['Parede','Ultra-wide panorama of dark still water at blue hour, translucent pearlescent glass spheres glowing with an iridescent mother-of-pearl gel floating on the surface, soft concentric ripples spreading from each sphere, luxury, photorealistic, no text --ar 39:7'],
      ['Mesa','Top-down view of dark still water, very fine pearlescent foam and tiny bubbles spreading in soft drifts between sixteen calm round clearings, faint out-of-focus shadows of rosemary and basil sprigs beneath the surface, subtle iridescence, low contrast, luxury, minimal, photorealistic, no text --ar 5:1']],
    primeiro:[['Parede','Ultra-wide panorama of a bright beach, sculptural clear gel forms and glass DNA helices rising from the sea, the gel beginning to crystallize into precise salt crystals, a few small colored stones on the wet sand, luxury, photorealistic, no text --ar 39:7'],
      ['Mesa','Top-down view of pale rose sand with clear gel forming a ring around each of sixteen calm round clearings, glittering salt crystals and a single thin thread of golden oil meandering between them, low contrast, luxury, minimal, photorealistic, no text --ar 5:1']],
    segundo:[['Parede','Ultra-wide panorama of a dark night garden in deep forest green, luminous dandelions and orchids glowing in groups, branches and leaves with fine golden veins, a fig opening in macro with a wine-red geode interior and amber crystals at the center, warm amber light, luxury, photorealistic, no text --ar 39:7'],
      ['Mesa','Top-down view of a deep forest green surface, around each of sixteen calm round clearings a soft radial rosette inspired by the inside of a fig in wine and amber tones, fluid translucent green strokes flowing between them, low contrast, luxury, minimal, photorealistic, no text --ar 5:1']],
    terceiro:[["Parede · passo 1", "Crie uma imagem panorâmica bem larga e horizontal (proporção 39:7, ou a mais larga possível). Fundo escuro em tom taupe quente, como um estúdio. Uma única fita de seda cor de pele entra suavemente pela esquerda, com brilho acetinado, parecendo pele. Luz suave e calma. O terço da direita da imagem fica mais vazio e escuro. Fotorrealista, luxo minimalista, sem pessoas e sem texto."], ["Parede · passo 2", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: a seda agora se dobra em várias camadas nos tons nude, pérola, creme e um toque de verde-claro, uma sobre a outra, como camadas de pele. A luz fica um pouco mais quente. O terço da direita continua vazio e escuro."], ["Parede · passo 3", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: as camadas se acomodam numa superfície lisa e luminosa, como pele hidratada, com um brilho quente e suave no centro e reflexos perolados. Calmo. O terço da direita continua vazio e escuro."], ["Mesa", "Use a imagem que estou enviando como referência e mantenha os 16 círculos escuros exatamente nos mesmos lugares (é onde ficam os pratos). Vista de cima, proporção 5:1. Entre os círculos, fitas de seda nos tons creme, pérola e verde-abobrinha claro, trançadas em volta de cada círculo, com ondas suaves e luz quente. Pouco contraste e cores suaves perto dos círculos. Fotorrealista, sem texto."]],
    quarto:[["Parede · passo 1", "Crie uma imagem panorâmica bem larga e horizontal (proporção 39:7, ou a mais larga possível). Fundo quase preto, de estúdio, com um brilho âmbar baixo no horizonte. Uma única fita de metal líquido em ouro rosé e cromo se torce devagar nos dois terços da esquerda, com reflexos nítidos e chão espelhado. O terço da direita da imagem fica mais vazio e escuro. Fotorrealista, luxo minimalista, sem pessoas e sem texto."], ["Parede · passo 2", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: uma segunda fita de metal se entrelaça com a primeira, com mais volume, e linhas de luz âmbar deslizam pelo metal, como marcas de grelha. O terço da direita continua escuro."], ["Parede · passo 3", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: as pontas das fitas começam a virar cristal transparente facetado, como se o metal se tornasse uma joia. Luz calma. O terço da direita continua escuro."], ["Mesa", "Use a imagem que estou enviando como referência e mantenha os 16 círculos escuros exatamente nos mesmos lugares (é onde ficam os pratos). Vista de cima, proporção 5:1. Pedra preta com fragmentos de cristal facetado que se desfazem em fios finos de luz em volta de cada círculo, e linhas âmbar paralelas entre eles. Pouco contraste e cores suaves perto dos círculos. Fotorrealista, sem texto."]],
    sobremesa:[["Parede · passo 1", "Crie uma imagem panorâmica bem larga e horizontal (proporção 39:7, ou a mais larga possível). Noite azul quase preta. Uma planície escura com poucos grupos baixos de cristais de quartzo naturais, brilhando de leve. Formas orgânicas e baixas, nada parecido com prédios. O terço da direita da imagem fica mais vazio e escuro. Fotorrealista, luxo minimalista, sem pessoas e sem texto."], ["Parede · passo 2", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: os grupos de cristal crescem e acendem um a um, da esquerda para a direita, com brilho branco e azul-claro, continuando baixos e orgânicos. O terço da direita continua escuro."], ["Parede · passo 3", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: no centro dos dois terços da esquerda surge uma única escultura de cristal facetado, com algumas pérolas e pequenas pedras coloridas incrustadas; os cristais em volta ficam com luz suave. O terço da direita continua escuro."], ["Parede · passo 4", "Faça uma variação desta mesma imagem, com o mesmo enquadramento e o horizonte na mesma altura: tudo escurece quase até o preto, menos a escultura de cristal, que brilha suave no centro. Silencioso e precioso."], ["Mesa", "Use a imagem que estou enviando como referência e mantenha os 16 círculos escuros exatamente nos mesmos lugares (é onde ficam os pratos). Vista de cima, proporção 5:1. Superfície preta com uma trama delicada de cristal transparente em volta de cada círculo, e a luz convergindo para o centro da mesa. Pouco contraste e cores suaves perto dos círculos. Fotorrealista, sem texto."]]
  };
  // ---- how to improve each act, on the deck's "Estrutura de cada cena": the wall is the Origem (the ingredient in
  // its natural place); the table carries the ingredients through Matéria, Transformação, Composição and Revelação ----
  const P_TAIL=' Panorâmica bem larga e horizontal (proporção 39:7, ou a mais larga possível). O terço da direita mais calmo e escuro, porque ali entra uma escultura 3D. Fotorrealista, luxo minimalista, sem pessoas, sem texto e sem prato pronto.';
  const P_TABLE='Use a imagem de mesa que estou enviando como referência e mantenha os 16 círculos escuros exatamente nos mesmos lugares (é onde ficam os pratos). Vista de cima, proporção 5:1. ';
  const P_TTAIL=' Tudo acontece entre os círculos, nunca dentro deles. Pouco contraste perto dos círculos. Fotorrealista, sem texto e sem prato pronto.';
  const W_NOTE='A parede é um lugar só, real, na luz do ato. O universo da marca fica com a Forma, que muda de matéria a cada ato.';
  const T_STEPS='A mesa passa pelas 4 etapas do deck, uma imagem cada. Gere a Matéria com a mesa atual como referência e as outras como variação da imagem anterior, para formar uma sequência. A Revelação fica limpa, sem ingrediente: é quando o prato chega.';
  const P_NEXT='Faça uma variação da imagem anterior, mantendo os 16 círculos escuros nos mesmos lugares e o mesmo enquadramento: ';
  const GUIDE={
    forma:{
      wall:{todo:['Não há prato: a parede preta, o título e a Forma cromada já estão certos.'],prompts:[]},
      table:{needs:['Não há prato nesse momento: a mesa preta já existe.'],prompts:[]}},
    couvert:{
      wall:{todo:[W_NOTE,'Origem do drink (gin botânico, limão-siciliano, alecrim e manjericão): o jardim de ervas e o limoeiro à beira da água, com as esferas ao fundo, que já são a cena do ato.'],
        prompts:[['Origem','À noite, um jardim botânico à beira de uma água escura e parada, com alecrim, manjericão e um limoeiro-siciliano iluminados de leve, e as esferas de vidro brilhando sobre a água ao fundo.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Do drink: manjericão, alecrim, limão-siciliano e a espuma.'],
        prompts:[['Matéria',P_TABLE+'Sobre água escura, em macro: folhas de manjericão, agulhas de alecrim e raspas de limão-siciliano com gotas de água.'+P_TTAIL],
          ['Transformação',P_NEXT+'As ervas e as raspas de limão se desfazem numa espuma fina e perolada, como a espuma do drink, que se espalha pela água escura.'+P_TTAIL],
          ['Composição',P_NEXT+'A espuma e as ervas se organizam em anéis suaves em volta de cada círculo, com linhas finas de bolhas ligando um lugar ao outro.'+P_TTAIL],
          ['Revelação',P_NEXT+'A água escurece e fica só um anel de luz suave em volta de cada círculo, onde o drink é servido.'+P_TTAIL]]}},
    primeiro:{
      wall:{todo:[W_NOTE,'Origem do tartar: a salina à beira-mar ao amanhecer, um lugar só. É o respiro claro no meio da noite.'],
        prompts:[['Origem','Ao amanhecer, uma salina branca à beira-mar, com montes de sal brilhando e a água rasa refletindo o céu claro, calma e luminosa.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Do tartar: sal grosso, mostarda, azeite, ervas e o crocante, sem mostrar a carne.'],
        prompts:[['Matéria',P_TABLE+'Sobre areia clara, em macro: cristais de sal grosso, sementes de mostarda, gotas de azeite e folhas finas de ervas.'+P_TTAIL],
          ['Transformação',P_NEXT+'O azeite e a mostarda se misturam em fios dourados e brilhantes que escorrem entre os cristais de sal.'+P_TTAIL],
          ['Composição',P_NEXT+'O sal e os fios dourados se organizam numa grade de pequenos cubos precisos entre os círculos, com lascas crocantes douradas.'+P_TTAIL],
          ['Revelação',P_NEXT+'Tudo se acalma e fica só um anel de brilho de sal em volta de cada círculo.'+P_TTAIL]]}},
    segundo:{
      wall:{todo:[W_NOTE,'Origem da salada (figo, rúcula, amêndoas, burrata): a figueira com figos no jardim noturno verde floresta, com o chão de rúcula.'],
        prompts:[['Origem','À noite, num jardim escuro em verde floresta, galhos de figueira com figos maduros pendurados entre plantas que brilham suavemente, e o chão coberto de folhas de rúcula.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Da salada: rúcula, figo, amêndoas e o creme da burrata.'],
        prompts:[['Matéria',P_TABLE+'Sobre verde floresta escuro, em macro: folhas de rúcula, metades de figo com o interior vinho, amêndoas e gotas de creme branco.'+P_TTAIL],
          ['Transformação',P_NEXT+'O figo carameliza: gotas de caramelo âmbar brilham sobre as metades de figo, e a rúcula se desfaz em traços verdes de pesto.'+P_TTAIL],
          ['Composição',P_NEXT+'Os figos, as amêndoas e o pesto se organizam em rosetas suaves em volta de cada círculo, com traços verdes ligando um lugar ao outro.'+P_TTAIL],
          ['Revelação',P_NEXT+'A mesa acalma e fica só um brilho âmbar suave em volta de cada círculo.'+P_TTAIL]]}},
    terceiro:{
      wall:{todo:[W_NOTE,'Origem do risoto de abobrinha: a horta de abobrinha em flor, no fim da tarde, com a paleta de pele do ato.'],
        prompts:[['Origem','Ao fim da tarde, uma horta de abobrinha com folhas largas e flores amarelas abertas, em luz quente e suave, tons de creme, nude e verde-claro.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Do risoto: arroz, abobrinha com flor, parmesão e o creme.'],
        prompts:[['Matéria',P_TABLE+'Sobre fundo escuro e quente, em macro: grãos de arroz, fatias finas de abobrinha verde-clara, flores de abobrinha e lascas de parmesão.'+P_TTAIL],
          ['Transformação',P_NEXT+'O arroz se incorpora num creme branco que se dobra em movimento circular, com o verde da abobrinha se misturando.'+P_TTAIL],
          ['Composição',P_NEXT+'O creme forma ondas concêntricas em volta de cada círculo, como fitas de seda creme e verde-claro trançadas.'+P_TTAIL],
          ['Revelação',P_NEXT+'A mesa acalma e fica só um anel creme, suave e quente, em volta de cada círculo.'+P_TTAIL]]}},
    quarto:{
      wall:{todo:[W_NOTE,'Origem do principal (carne, peixe ou couve-flor, todos com ervas e fogo): o campo de ervas com o fogo baixo, no crepúsculo.'],
        prompts:[['Origem','No crepúsculo, um campo de alecrim e tomilho em tons escuros, com uma fogueira baixa ao longe e fumaça leve no ar.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Do principal: sal grosso, pimenta, alecrim, a crosta e a grelha. Serve às quatro opções, sem mostrar a carne.'],
        prompts:[['Matéria',P_TABLE+'Sobre pedra preta, em macro: sal grosso, pimenta em grão, ramos de alecrim e a textura escura de uma crosta tostada.'+P_TTAIL],
          ['Transformação',P_NEXT+'Brasas acendem entre os círculos e marcas de grelha douradas aparecem em luz âmbar, com fumaça leve.'+P_TTAIL],
          ['Composição',P_NEXT+'As marcas de grelha e as brasas se organizam em linhas paralelas entre os círculos, com cristais de sal brilhando.'+P_TTAIL],
          ['Revelação',P_NEXT+'A mesa acalma e fica só um brilho âmbar em volta de cada círculo.'+P_TTAIL]]}},
    sobremesa:{
      wall:{todo:[W_NOTE,'A sobremesa ainda não foi definida (uma escultura central servida a todos). Origem provisória: a plantação de cacau à noite.'],
        prompts:[['Origem','Numa noite azul quase preta, uma plantação de cacau com os frutos dourados iluminados de leve entre as folhas escuras.'+P_TAIL]]},
      table:{needs:[T_STEPS,'Da sobremesa (provisório): açúcar, caramelo, chocolate e frutas vermelhas, com a luz indo para o centro, onde a escultura chega.'],
        prompts:[['Matéria',P_TABLE+'Sobre superfície preta, em macro: cristais de açúcar, lascas de chocolate e algumas frutas vermelhas.'+P_TTAIL],
          ['Transformação',P_NEXT+'O açúcar derrete em caramelo âmbar que escorre em fios finos entre os círculos.'+P_TTAIL],
          ['Composição',P_NEXT+'Os fios de caramelo e os cristais se organizam numa trama em volta de cada círculo, com a luz convergindo para o centro da mesa.'+P_TTAIL],
          ['Revelação',P_NEXT+'Tudo escurece e a luz fica só no centro da mesa, onde a escultura é servida.'+P_TTAIL]]}}
  };
  const VIEWS=[['inteira','Sala inteira'],['parede1','Parede 1'],['parede2','Parede 2'],['mesa','Mesa']];   // the room's marked views, all close
  const MARK={tem:'●',parte:'◐',falta:'○'},MARK_TXT={tem:'já combina',parte:'combina em parte',falta:'falta criar'};

  // ---- the roteiro is the source: each act is its groups (named after the act, by their first word), and its
  // pictures are those steps' walls and tables. Everything changed here is written into the roteiro itself, so the
  // gallery's Roteiro shows it too (and what is changed there shows here). ----
  const storyId=((store.state.stories||[]).find(s=>s.name.startsWith(ROTEIRO))||(store.state.stories||[]).find(s=>s.steps.some(x=>x.nome)))?.id;
  const curStory=()=>(store.state.stories||[]).find(s=>s.id===storyId);
  const comboOf=id=>(store.state.combos||[]).find(c=>c.id===id);
  // as the roteiro reads a step: its combination when it has one, otherwise its own wall and table
  const wallSha=st=>st.combo?comboOf(st.combo)?.wall:st.wall,tableSha=st=>st.combo?comboOf(st.combo)?.table:st.table;
  const steps=(curStory()?.steps||[]).filter(st=>media.get(wallSha(st))||media.get(tableSha(st)));
  const KEYS=new Set(ACTS.map(a=>a.key));
  const actOf=st=>{const w=(st.nome||'').trim().toLowerCase().split(/[\s·\-–]+/)[0];return KEYS.has(w)?w:null;};
  // the act's steps, with their place in the roteiro (hidden groups stay out, as in the preview)
  const stepsOf=key=>(curStory()?.steps||[]).map((st,i)=>({st,i})).filter(x=>actOf(x.st)===key&&!x.st.oculto&&(media.get(wallSha(x.st))||media.get(tableSha(x.st))));
  // each picture once (the first step that uses it), even when the roteiro repeats it
  const uniq=l=>{const seen=new Set();return l.filter(x=>!seen.has(x.sha+(x.inv?'i':'')+(x.gr?'g':''))&&seen.add(x.sha+(x.inv?'i':'')+(x.gr?'g':'')));};
  // the act's picture for the previews (journey, glance, its first slide): the Recepção's first wall is plain white,
  // so it shows its wave wall with the Forma
  function heroWall(a){const ws=picsOf(a).walls;if(a.key==='forma')return ws.find(w=>!w.semLogo)||ws[0];   // the Recepção: its white wall with the title (and the chrome Forma drawn on it)
    return ws.find(w=>w.semLogo)||ws[0];}   // (a declaration: used before this line runs)
  // the act's wall in a preview, always with its Forma: a wall with the Forma painted on it as it is; on any other the act's
  // Forma is drawn as the room shows it (wallWithForma), once the room is ready (that code runs further down)
  const HERO_RENDER=['forma','couvert','primeiro','segundo','terceiro','quarto','sobremesa'],heroCache=new Map();
  const heroForma=key=>NOVAS[key]?'modelos/formas/forma-gel-'+key+'.webp':key==='forma'?'apresentacao/sala/forma-cromo-frente.webp?v=3':'modelos/formas/forma-'+key+'.webp?v=9';
  // roomReady is declared further down: wait for it to exist (the previews are built before that line runs)
  function heroRoom(){return window.__apresCodigo?Promise.resolve():new Promise(r=>setTimeout(r,60)).then(heroRoom);}   // (the code further down is in place)
  function heroPic(im,a){const w=heroWall(a);if(!w)return;
    if(ONLY_WALL[a.key]){im.src='apresentacao/atos/'+a.key+'-volta.jpg?v='+VOLTA_V;return;}   // (its one wall in video: the first frame of its turn, never an older wall first)
    const tv=TRACK_WALL_VIDEO[a.key];if(tv?.poster){im.src=tv.poster+'?v='+tv.v;return;}   // (a wall in video for its track: a frame of it, its own logo in it)
    if(!w.semLogo&&HERO_RENDER.includes(a.key)){im.style.opacity='0';im.style.transition='opacity .6s';}   // shown only with its Forma, never without it first
    else{showPic(im,media.get(w.sha).image,true,w.gr);if(w.inv)im.style.filter='invert(1)';}
    if(w.semLogo||!HERO_RENDER.includes(a.key))return;
    if(!heroCache.has(a.key))heroCache.set(a.key,heroRoom().then(async()=>{const c=await wallWithForma(a,w,await Art.loadImage(heroForma(a.key)));
      return new Promise(r=>c.toBlob(b=>r(b?URL.createObjectURL(b):null),'image/jpeg',0.9));}).catch(()=>null));
    heroCache.get(a.key).then(u=>{im.style.filter='';if(u){im.onload=()=>{im.style.opacity='1';};im.src=u;}else{showPic(im,media.get(w.sha).image,true,w.gr);im.style.opacity='1';}});}
  // an act shown on one wall only (ONLY_WALL: the Couvert, its wall in video; its other walls, pictures with the spheres
  // lit, contradicted it): the room and the act's pictures keep just that one
  // the Recepção too: its wall is the white wall in video (fcfbc887); the wave walls it had before are now its track's
  // every act shows only its wall in video (asked for: the still walls out of the presentation; they stay in the roteiro
  // and the gallery)
  const VOLTA_V=14;   // the acts' turns in apresentacao/atos (their clips and first frames)
  const ONLY_WALL={forma:'fcfbc887',sobremesa:'9bde1875'};
  // the walls and tables made for a whole track (guias-formato-sala: parede_trilha.py, parede_forma.py, mesa_trilha.py),
  // in files of one minute, played by the room at the track's own time (wallTrack, tableTrack below)
  const TRACK_WALL_VIDEO={couvert:{base:'apresentacao/paredes/couvert-parede-',n:1,seg:72.25,v:11,trilha:'ambiente-02-agua',livre:true,poster:'apresentacao/paredes/couvert-parede-poster.jpg'},   // (one file, two turns of the ring: it goes round, with the track too)
    forma:{base:'apresentacao/paredes/forma-trilha-',n:15,seg:60,v:10,trilha:'ambiente-01-forma',semForma:true,livre:true,poster:'apresentacao/paredes/forma-trilha-poster.jpg'}};
  delete TRACK_WALL_VIDEO.couvert;
  const TRACK_TABLE_VIDEO={couvert:{base:'apresentacao/mesas/couvert-mesa-trilha-',n:15,seg:60,v:6,trilha:'ambiente-02-agua'}};

  const onlyWall=(a,w)=>!ONLY_WALL[a.key]||!w||w.sha.startsWith(ONLY_WALL[a.key]);
  function picsOf(a){const r=picsAll(a);return {walls:NOVAS[a.key]||uniq(r.walls.filter(w=>onlyWall(a,w))),tables:uniq(r.tables)};}
  function picsAll(a){const list=stepsOf(a.key);
    return {walls:list.filter(x=>media.get(wallSha(x.st))).map(x=>({sha:wallSha(x.st),texto:x.st.texto||undefined,inv:!!x.st.invertWall,gr:x.st.gradeWall==='floresta',semLogo:!!x.st.semLogo,passo:x.i+1,at:x.i})),
            tables:list.filter(x=>media.get(tableSha(x.st))).map(x=>({sha:tableSha(x.st),inv:!!x.st.invertTable,gr:x.st.gradeTable==='floresta',passo:x.i+1,at:x.i}))};}
  // what the room shows at each step of the act, as the roteiro plays it: "continua" keeps the picture of the step
  // before (looking back through the roteiro), "para" switches the surface off
  function framesOf(a){const all=curStory()?.steps||[];
    // a hidden step is not in the roteiro: "continua" looks past it; at the start of the act the act's first picture is used
    const res=(k0,f)=>{for(let k=k0;k>=0;k--){const st=all[k];if(!st||st.oculto)continue;if(k<k0&&actOf(st)!==a.key&&!st.bridge&&!/^fundo/i.test(st.nome||''))return first(f);
        const mode=(f==='wall'?st.wallMode:st.tableMode)||'troca';if(mode==='para'&&k<k0&&actOf(all[k0])===a.key&&actOf(st)!==a.key)return first(f);
        if(mode==='para')return null;
        if(mode==='troca'){const sha=f==='wall'?wallSha(st):tableSha(st);if(sha&&media.get(sha))return f==='wall'
          ?{sha,texto:st.texto||undefined,inv:!!st.invertWall,gr:st.gradeWall==='floresta',semLogo:!!st.semLogo,passo:k+1,at:k}
          :{sha,inv:!!st.invertTable,gr:st.gradeTable==='floresta',passo:k+1,at:k};}}
      return null;};
    const mine=stepsOf(a.key),first=f=>{for(const x of mine){const st=x.st,mode=(f==='wall'?st.wallMode:st.tableMode)||'troca',sha=f==='wall'?wallSha(st):tableSha(st);
        if(mode==='troca'&&sha&&media.get(sha))return res(x.i,f);}return null;};
    const fr=mine.map(x=>({at:x.i,w:res(x.i,'wall'),t:res(x.i,'table')}));
    if(ONLY_WALL[a.key]){const w0=fr.map(f=>f.w).find(w=>w&&onlyWall(a,w));if(w0)for(const f of fr)if(f.w&&!onlyWall(a,f.w))f.w=w0;}   // the other walls: that one
    return fr;}
  // the room's steps: the wall and the table pass TOGETHER at every step (the video tables first). The roteiro changes them on their own beats (a
  // table can stay for many walls, or change under the same wall), so the room takes the act's walls and tables in the
  // roteiro's order and pairs them, as many steps as it takes for both lists to come round together (at most 24).
  const TABLE_FIRST={segundo:'f58b246e',couvert:'7cc4606c'};   // the Salada: the first table of the day, the moss-and-almond one; the Couvert: its water with the plates' holes
  // the Salada's night: its first wall (the night) goes with these tables, once each and in this order: the black one
  // (petals), then the kaleidoscope, the passage from night to day. After them the day walls take turns with the other
  // tables, and the night ones do not come back
  const NIGHT_TABLES={segundo:['d4d7c17b']};   // (the petals table, 46512f89, out: asked for)
  // after the last step the room goes round again from here: the Salada's night (its first two steps) is shown once
  const LOOP_FROM={segundo:2};
  const nextStep=(key,i,n)=>i+1<n?i+1:Math.min(LOOP_FROM[key]||0,n-1);
  function roomFrames(a){const fr=framesOf(a);if(!fr.length)return fr;
    const runs=get=>{const out=[];let last;for(const f of fr){const x=get(f),k=x?x.sha+'|'+(x.texto||''):'-';if(k!==last){out.push({x,at:f.at});last=k;}}
      if(out.length>1){const k0=out[0].x?out[0].x.sha+'|'+(out[0].x.texto||''):'-',x=out[out.length-1].x;if(k0===(x?x.sha+'|'+(x.texto||''):'-'))out.pop();}return out;};
    // the act's video tables first (the room opens on them), then its pictures, each in the roteiro's order
    const W=NOVAS[a.key]?NOVAS[a.key].map(x=>({x,at:fr[0].at})):runs(f=>f.w),isVid=r=>!!(r.x&&media.get(r.x.sha)?.video),T0=runs(f=>f.t),T=[...T0.filter(isVid),...T0.filter(r=>!isVid(r))].filter((r,i,arr)=>arr.findIndex(q=>q.x?.sha===r.x?.sha)===i),gcd=(x,y)=>y?gcd(y,x%y):x,l=W.length*T.length/gcd(W.length,T.length);
    // a very dark table (a black background, media.brilho < 10: the Salada's petals) goes only with the act's first wall,
    // the darkest (the Salada's night); the other walls take turns with the other tables
    const night=NIGHT_TABLES[a.key],dark=night?(r=>night.some(h=>r.x?.sha.startsWith(h))):(r=>(media.get(r.x?.sha)?.brilho??99)<10);
    const Td=night?night.map(h=>T.find(r=>r.x?.sha.startsWith(h))).filter(Boolean):T.filter(dark),Tl=T.filter(r=>!dark(r));
    {const f=TABLE_FIRST[a.key],k=f?Tl.findIndex(r=>r.x?.sha.startsWith(f)):-1;if(k>0)Tl.unshift(...Tl.splice(k,1));}   // a table asked to come first
    if(Td.length&&Tl.length&&W.length>1){const W2=W.slice(1),l2=W2.length*Tl.length/gcd(W2.length,Tl.length),n2=l2<=24?l2:Math.max(W2.length,Tl.length);
      return [...Td.map(t=>({w:W[0].x,t:t.x,at:W[0].at})),...Array.from({length:n2},(_,k)=>({w:W2[k%W2.length].x,t:Tl[k%Tl.length].x,at:W2[k%W2.length].at}))];}
    {const f=TABLE_FIRST[a.key],k=f?T.findIndex(r=>r.x?.sha.startsWith(f)):-1;if(k>0)T.unshift(...T.splice(k,1));}   // (here too: the room opens on it)
    const n=l<=24?l:Math.max(W.length,T.length);
    return Array.from({length:n},(_,k)=>({w:W[k%W.length].x,t:T[k%T.length].x,at:W[k%W.length].at}));}
  // ---- writing into the roteiro ----
  // a short message at the bottom of the page (the in-app browser does not show the browser's own dialogs)
  const toastEl=el('div','toast');toastEl.setAttribute('role','status');document.body.append(toastEl);let toastT=0;
  function promptRow(label,text,msg){const row=el('div','prompt'),top=el('div','prompt-top'),copy=el('button','btn quiet','Copiar');copy.type='button';
    copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);}catch{const r=document.createRange();r.selectNodeContents(row.querySelector('p'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);document.execCommand('copy');}
      copy.textContent='Copiado';toast(msg);setTimeout(()=>copy.textContent='Copiar',2200);};
    top.append(el('strong',null,label),copy);row.append(top,el('p','master',text));return row;}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),3800);}
  function editSteps(fn){const s=curStory();if(!s){toast('O roteiro '+ROTEIRO+' não foi encontrado.');return false;}
    const list=s.steps.map(x=>({...x}));fn(list);store.setStorySteps(s.id,list);return true;}
  // a step that used a combination gets the combination's pictures and settings as its own, so one of them can change
  function inline(step){if(!step.combo)return step;const c=comboOf(step.combo)||{},o={...step};delete o.combo;
    for(const k of ['stage','wall','table','settings','formaX','formaSize','formaY'])if(c[k]!==undefined)o[k]=JSON.parse(JSON.stringify(c[k]));return o;}
  const SURF={walls:['wall','parede'],tables:['table','mesa']};
  function setPicture(o,kind,sha){const [field,surface]=SURF[kind];o[field]=sha;
    if(o.settings){o.settings={...o.settings};delete o.settings[surface];}
    if(kind==='walls'&&media.get(sha)?.stage)o.stage=media.get(sha).stage;return o;}
  const newId=()=>'passo-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  // a new picture: a new step at the end of the act, paired with the last step's other surface
  function addPicture(a,kind,sha){const was=kind==='walls'?'wasWall':'wasTable';
    // a picture removed from this act left its places empty: the new one takes all of them (remove + add = replace)
    {const s=curStory(),hole=s&&s.steps.map((st,i)=>({st,i})).find(x=>actOf(x.st)===a.key&&!x.st.oculto&&x.st[was]);
      if(hole){const old=hole.st[was];let n=0;
        editSteps(list=>{list.forEach((st,i)=>{if(actOf(st)===a.key&&!st.oculto&&st[was]===old){const o=setPicture(inline({...st}),kind,sha);delete o[was];o[kind==='walls'?'wallMode':'tableMode']='troca';list[i]=o;n++;}});});
        toast((kind==='walls'?'Parede':'Mesa')+' colocada nos '+n+' passos da que foi removida.');return;}}
    editSteps(list=>{const mine=list.map((st,i)=>({st,i})).filter(x=>actOf(x.st)===a.key);const last=mine.at(-1);
      let o;if(last){o=inline({...last.st});delete o.texto;delete o.oculto;}else o={nome:a.key};
      o.id=newId();setPicture(o,kind,sha);if(!o.stage)o.stage=media.get(sha)?.stage;
      list.splice(last?last.i+1:list.length,0,o);});
  }
  // "Trocar": the picture changes in every step of the act that shows it (an act like the couvert uses the same table in
  // several steps of its cycle), so the new one takes exactly the old one's places
  function swapPicture(at,kind,sha){const shaOf=kind==='walls'?wallSha:tableSha;
    editSteps(list=>{const old=shaOf(list[at]),act=actOf(list[at]);let n=0;
      list.forEach((st,i)=>{if(i===at||(old&&!st.oculto&&actOf(st)===act&&shaOf(st)===old&&((kind==='walls'?st.wallMode:st.tableMode)||'troca')==='troca')){list[i]=setPicture(inline(list[i]),kind,sha);n++;}});
      if(n>1)toast((kind==='walls'?'Parede':'Mesa')+' trocada nos '+n+' passos em que aparecia.');});}
  // "Remover" on a picture takes out that picture only: the step keeps its other surface, and this one continues from the
  // step before (as "Continua" in the Roteiro); a step left with no picture at all leaves the roteiro
  function removePicture(at,kind){const st=curStory()?.steps[at];if(!st)return;const [field,surface]=SURF[kind],other=kind==='walls'?'tables':'walls';
    let gone=false;
    const shaOf=kind==='walls'?wallSha:tableSha,was=kind==='walls'?'wasWall':'wasTable',old=shaOf(st),act=actOf(st);let n=0;
    const ok=editSteps(list=>{for(let i=list.length-1;i>=0;i--){const s=list[i];
        if(!(i===at||(old&&!s.oculto&&actOf(s)===act&&shaOf(s)===old&&((kind==='walls'?s.wallMode:s.tableMode)||'troca')==='troca')))continue;
        const o=inline({...s});delete o[field];o[field+'Mode']='continua';if(old)o[was]=old;if(o.settings){o.settings={...o.settings};delete o.settings[surface];}
        n++;if(!media.get(o[SURF[other][0]])&&((other==='walls'?o.wallMode:o.tableMode)||'troca')==='troca'){list.splice(i,1);if(i===at)gone=true;}else list[i]=o;}});
    if(ok)toast(gone?'Passo '+(at+1)+' removido do roteiro (já não tinha '+(kind==='walls'?'mesa':'parede')+').':(kind==='walls'?'Parede':'Mesa')+' tirada do passo '+(at+1)+'; '+(kind==='walls'?'a mesa':'a parede')+' continua.');}
  // a group of the roteiro joins the act: copies of its steps, renamed to the act's group, after the act's last step
  function addGroup(a,g){
    editSteps(list=>{const mine=list.map((st,i)=>({st,i})).filter(x=>actOf(x.st)===a.key);const last=mine.at(-1),nome=last?.st.nome||a.key;
      const copies=g.items.map(({st})=>{const o=JSON.parse(JSON.stringify(st));o.id=newId();o.nome=nome;delete o.oculto;return o;});
      list.splice(last?last.i+1:list.length,0,...copies);});
  }
  // an image from the computer: it joins the gallery's collection (server), then the act like any other picture
  // sends a picture from the computer into the collection; returns its sha (the picture is not placed yet)
  async function uploadMedia(a,kind,file){
    const surface=SURF[kind][1];let w=0,h=0;if(!/^video\//.test(file.type))try{const bmp=await createImageBitmap(file);w=bmp.width;h=bmp.height;bmp.close?.();}catch{}   // (a video: the server reads its size)
    const l=stepsOf(a.key).at(-1),stage=(l&&(media.get(wallSha(l.st))?.stage||media.get(tableSha(l.st))?.stage))||Object.keys(data.stages||{})[0]||'01';
    const r=await fetch('api/midia/enviar?'+new URLSearchParams({nome:file.name,superficie:surface,etapa:stage,w,h}),{method:'POST',body:file});
    const out=await r.json().catch(()=>({}));if(!r.ok||!out.entry)throw new Error(out.error||'não foi possível enviar');
    let m=media.get(out.entry.sha256);if(!m){m={...out.entry};data.media.push(m);media.set(m.sha256,m);}
    return m.sha256;
  }
  async function uploadPicture(a,kind,file){addPicture(a,kind,await uploadMedia(a,kind,file));}
  const SOUND_NAME={'01':'Forma','02':'Água','02b':'Água · gel','03':'Matéria','04':'Pele','05':'Diamante','05b':'Diamante · metal','06':'Retorno'};
  const PLANNED={forma:'01',couvert:'02',primeiro:'02b',segundo:'03',terceiro:'04',quarto:'05',quinto:'05b',sobremesa:'05'};
  function soundOf(key){
    const sg=stepsOf(key).map(x=>x.st.soundStage||x.st.stage).find(k=>k&&!String(k).startsWith('T'))||PLANNED[key];
    const piece=pieces.find(x=>x.kind==='ambiente'&&x.stage===sg);
    return piece?{file:piece.file,duration:piece.duration,name:key.charAt(0).toUpperCase()+key.slice(1),sound:SOUND_NAME[sg]||sg}:null;
  }
  const thumb=m=>m?.thumb||m?.image||'';
  const audio=new Audio();audio.preload='none';let playing=null;
  const mmss=t=>Math.floor((t||0)/60)+':'+String(Math.floor((t||0)%60)).padStart(2,'0');

  // ---- page ----
  const nav=$('#acts-nav');
  for(const a of ACTS){const l=el('a',null,a.n);l.href='#ato-'+a.key;l.title=a.name;l.dataset.key=a.key;nav.append(l);}
  {const l=el('a','nav-now','Agora');l.href='#conselho';l.title='O que fazer agora';nav.append(l);}
  const parts=[];
  {const s=el('section','cover');s.id='topo';
    s.append(el('h1',null,(steps.find(st=>st.texto)?.texto||'The Art of Transformation').toUpperCase()));
    // the opening: only the title, centred, with the Forma (its chrome render) standing behind it
    {const f=el('figure','cover-forma-bg'),im=el('img');im.alt='';im.decoding='async';im.src='apresentacao/sala/logo-vidro-pb-cinza-0.webp?v=1';f.append(im);s.prepend(f);}
    parts.push(s);}
  // the reason of the roteiro, before the acts: the matter comes out of the gel, becomes life, then human, then jewel.
  // Each stage shows a cut of its own wall from the roteiro, the acts it covers and the brand elements in its visuals.
  // the deck's universe each act shows on its walls (Future of Beauty opens and closes, as the deck asks; Joias are an accent in all)
  const ACT_UNIVERSE={forma:'The Future of Beauty',couvert:'The Fluid Universe',primeiro:'The Architecture of Beauty',segundo:'The Energy Field',terceiro:'The Mineral Dimension',quarto:'The Future of Beauty',sobremesa:'The Future of Beauty'};
  const JOURNEY=[
      {name:'Forma',acts:['forma'],from:'forma',pos:'86% 42%',text:'A parede branca, com o nome do jantar e uma única forma de metal polido.',
        brand:['Future of Beauty: o cromo, a luz e o silêncio']},
      {name:'Água',acts:['couvert'],from:'couvert',text:'Um lago escuro com esferas de vidro que acendem com a trilha e levam a luz até as taças.',
        brand:['Energy Field: as esferas e as ondas no ritmo do som','Joias: o anel dourado em cada taça']},
      {name:'Gel',acts:['primeiro'],from:'primeiro',text:'Esculturas de madrepérola sobre uma água rasa e, na mesa, o sal, a mostarda, o azeite e as ervas.',
        brand:['Fluid: as esculturas de gel','Architecture: as hélices de DNA','Joias: as pedras coloridas na areia']},
      {name:'Vida',acts:['segundo'],from:'segundo',text:'Um campo ao entardecer, com esculturas de vidro que mudam devagar, e o figo, a burrata e a rúcula na mesa.',
        brand:['Architecture: flores radiais em fileiras','Energy Field: as flores acendendo com a trilha']},
      {name:'Pele',acts:['terceiro'],from:'terceiro',text:'Sedas e fios dourados que se dobram em camadas, como o creme do risoto.',
        brand:['Fluid: a seda com brilho de pele hidratada','Joias: os fios dourados']},
      {name:'Metal',acts:['quarto'],from:'quarto',text:'Fitas de metal líquido em ouro rosé atravessam o pôr do sol e, na mesa, sal, alecrim e brasas.',
        brand:['Joias: o metal em rosé e cromo','Fluid: o metal que escorre como uma fita']},
      {name:'Joia',acts:['sobremesa'],from:'sobremesa',text:'A escultura de cristal acende no horizonte e, na mesa, os mesmos cristais cercam cada lugar.',
        brand:['Future of Beauty: o mesmo universo que abriu a noite','Joias: o ouro e o brilho']}];
  const stageOf=key=>JOURNEY.find(j=>j.acts.includes(key))?.name,universeOf=key=>ACT_UNIVERSE[key];
  // what each act is in the roteiro: one sentence that picks up where the previous act left off
  // the caption of each act, in the client's own words: the universe its frames show and the act's line in the deck
  // "atos / universos / jantar" (the principal has no universe of its own: the metal and shine of the Joias, slide 19)
  const ACT_META={
    forma:['The Future of Beauty','A Forma abre a noite'],
    couvert:['The Fluid Universe','A beleza em movimento'],
    primeiro:['The Architecture of Beauty','A beleza como arquitetura'],
    segundo:['The Energy Field','Ondas, pulsos e linhas de energia'],
    terceiro:['The Mineral Dimension','As formas minerais ganham volume'],
    quarto:['The Future of Beauty','Silêncio, precisão, luz e materiais'],
    sobremesa:['The Future of Beauty','O metal se cristaliza em joia']};
  const metaOf=key=>ACT_META[key]||[universeOf(key)||'',stageOf(key)||''];
  // what each act shows, as the room shows it today
  const ABOUT={
    forma:'A noite começa na parede branca, com o nome do jantar e uma única forma cromada, em silêncio. Ela fica na Parede 2 a noite inteira e se adapta a cada ato. É The Future of Beauty, o universo de abertura: luz, precisão e materiais.',
    couvert:'O welcome drink e o couvert apresentam a Casa Pharmaesthetics. A sala vira água: esferas de vidro acendem com a trilha, soltam ondas e levam a luz até cada taça.',
    primeiro:'Esculturas de gel e hélices de DNA na beira do mar e, na mesa, o sal, a mostarda, o azeite e as ervas do tartar.',
    segundo:'Num campo ao entardecer, esculturas de vidro mudam de forma devagar. Na mesa, o figo, a rúcula, as amêndoas e o creme da burrata, em verde profundo, vinho e creme.',
    terceiro:'Sedas e fios dourados se dobram em camadas, como o risoto que incorpora a abobrinha aos poucos.',
    quarto:'O metal líquido se torce como uma fita e, na mesa, a areia quente vira metal polido.',
    sobremesa:'A sobremesa é uma escultura de cristal: no horizonte ela acende aos poucos, da esquerda para a direita, e na mesa os mesmos cristais e pérolas cercam cada lugar. A noite fecha na Forma, no mesmo lugar em que abriu.'};
  // ---- "Do deck para a sala": for the client, each choice of the frames next to what the deck "atos / universos /
  // jantar" asks; below it, in red, what the frames do not show yet (16/10/2026)
  // the deck's own words (quoted, with the slide) and, beside them, what the room shows and why
  const DECK_WHY={
    forma:[['o universo de encerramento ou de abertura da experiência',17,'Por isso ele abre a noite. A parede começa branca e limpa, só com o nome do jantar e a Forma em cromo.'],
      ['silêncio, precisão, luz, materiais e formas sofisticadas',17,'A Forma é uma peça de metal polido. Dela saem ondas de luz que tomam a parede e se dissolvem, sem tirar o silêncio da cena.']],
    couvert:[['gotas de água se formando e se expandindo… luz atravessando o copo',1,'A parede é um lago escuro com esferas de vidro. A água e o vidro dão a transparência e os reflexos da cena, e lembram o copo do Botanical Elixir.'],
      ['ondas concêntricas, pulsos luminosos, ritmo visual sincronizado com a trilha sonora',15,'As esferas acendem em grupos, no tempo da trilha, e cada uma solta ondas na água.'],
      ['a projeção conduz o olhar até o copo que chega à mesa',1,'Quando as esferas acendem, aparece um anel de luz dourada na base de cada taça.']],
    primeiro:[['grãos de sal, gotas de mostarda, óleo se espalhando, ervas se movimentando',3,'Entre os pratos, a mesa mostra de perto o sal, a mostarda, o azeite e as ervas do tartar.'],
      ['um universo translúcido, líquido e sensorial, inspirado em géis',12,'Na parede, esculturas de gel transparente na beira do mar.'],
      ['pérolas, metal, brilhante… pedras coloridas',19,'Hélices de DNA saem da água e há pedras coloridas na areia.']],
    segundo:[['ramos e folhas crescem lentamente',4,'A parede é um jardim no escuro, com flores que acendem em grupos durante o prato.'],
      ['formas que se organizam até criar equilíbrio',13,'As flores são radiais e estão em fileiras, por isso o ato ficou em The Architecture of Beauty.'],
      ['verde profundo, âmbar, vinho e tons creme',4,'Chão verde, céu vinho e flores creme. Na mesa, o figo aberto, a rúcula, as amêndoas e o creme da burrata.']],
    terceiro:[['camadas, incorporação e transformação gradual',7,'Sedas e fios dourados se dobram uns sobre os outros, devagar, como o arroz incorporando o creme.'],
      ['inspirado em géis, hidratação, emulsões e superfícies de alta luminosidade',12,'Mesmo universo da Entrada, agora em seda, com o brilho de uma pele hidratada.'],
      ['Risoto de abobrinha',7,'Na mesa, abobrinha, flor de abobrinha, parmesão e o creme, em ondas como as da seda.']],
    quarto:[['volume, precisão e assinatura',8,'Uma fita de metal líquido atravessa a parede inteira. É a maior forma da noite.'],
      ['pérolas, metal, brilhante',19,'O metal vem em rosé e cromo, as cores das joias da marca.'],
      ['Entrecot grelhado',8,'Na mesa, a areia quente do deserto vira metal e ouro rosé.']],
    sobremesa:[['servida coletivamente como uma escultura central',19,'Na parede, a escultura de cristal acende aos poucos; na mesa, os mesmos cristais cercam cada lugar.'],
      ['o universo de encerramento ou de abertura da experiência',17,'A noite fecha no mesmo universo em que abriu, com a Forma ainda no seu lugar.'],
      ['trabalhar mais com a introdução onde o ato cresce e depois deixa mais calmo',19,'A mesa só acende a luz em volta de cada lugar, sem outras imagens.']]};
  // the deck's "Estrutura de cada cena" (slide 9) in each act: which frame does each step; null = no frame yet (red)
  const SCENE_STEPS=['Origem','Matéria','Transformação','Composição','Revelação'];
  // what the presentation says: why each thing is in the room, in one short line (checked against the frames it shows)
  const WHY_LEAD={
    forma:'A noite começa no branco e no silêncio, só com o nome do jantar e a Forma. Ela é a primeira coisa vista e fica na sala até o fim.',
    couvert:'A matéria nasce na água. Um lago azul ao anoitecer, com esferas de vidro que acendem, traduz o Botanical Elixir: a transparência do copo e a luz que o atravessa.',
    primeiro:'A água ganha corpo. Esculturas de madrepérola, translúcidas como gel, pousam sobre uma água rasa e luminosa. Na mesa, o sal, as ervas e o azeite trazem o frescor e a precisão do tartar.',
    segundo:'O gel ganha vida num campo ao entardecer, onde as esculturas de vidro mudam devagar. O frescor é o da salada, e na mesa estão o figo, a burrata e a rúcula.',
    terceiro:'A vida ganha pele. Sedas em creme, rosa e cobre, com fios de ouro, ondulam em camadas sobre o mar ao pôr do sol, devagar, como o risoto que incorpora a abobrinha.',
    quarto:'A pele ganha o brilho do metal. Fitas de metal líquido em ouro rosé atravessam o pôr do sol e, na mesa, sal grosso, alecrim e brasas trazem o fogo do prato principal, seja carne, peixe ou vegetal.',
    sobremesa:'O metal se cristaliza em joia. Uma linha de cristais acende aos poucos no horizonte e, na mesa, cristais e pérolas cercam cada lugar. A noite termina na Forma, onde começou.'};
  const WHY_STEPS={
    forma:['O branco apresenta a casa antes de qualquer cor.','A Forma reflete a sala inteira, como uma joia.','Ondas de luz saem da Forma e tomam a parede inteira.','As ondas se dissolvem e ficam só o nome do jantar e a Forma.','A voz da Forma dá as boas-vindas.'],
    couvert:['O lago azul ao anoitecer traz a calma de antes do jantar.','As esferas de vidro levam a transparência do copo para a sala.','Elas acendem com a trilha, e a sala respira junto.','Na mesa, a água abre anéis de luz em volta de cada lugar.','Bolhas peroladas se juntam em volta dos lugares quando o drink é servido.'],
    primeiro:['A água rasa e clara abre o ato com a luz mais limpa da noite.','As esculturas de madrepérola são a mesma água, agora com corpo.','Elas se movem devagar, e a luz dança na água em volta.','Na mesa, sal, ervas e azeite sobre a areia antecipam os temperos.','Os cubos vermelhos chegam à mesa junto com o tartar.'],
    segundo:['O campo verde é a horta de onde a salada vem.','Na mesa, figo, burrata, amêndoa e rúcula, os ingredientes do prato.','As esculturas de vidro mudam de forma devagar.','Os ingredientes se organizam em anéis em volta dos lugares.','A mesa se acalma para o prato chegar.'],
    terceiro:['Sedas em tons de creme abrem o ato com suavidade.','Flores de abobrinha e pérolas sobre o creme da mesa.','As sedas viram fios de ouro: o calor do preparo.','O creme forma ondas em volta de cada prato.','Ouro e creme se acalmam juntos para o risoto chegar.'],
    quarto:['O pôr do sol quente prepara o prato mais forte da noite.','O metal líquido se torce como uma fita: força e brilho.','Na mesa, sal grosso, pimenta e alecrim sobre a pedra escura.','As brasas acendem e desenham marcas de grelha entre os lugares.','O metal se acalma no pôr do sol para o prato chegar.'],
    sobremesa:['O céu da noite devolve o silêncio do começo.','No horizonte, uma linha de cristais: a matéria virou joia.','Os cristais acendem aos poucos, até o horizonte inteiro brilhar.','Na mesa, os mesmos cristais e pérolas em volta de cada prato.','Com tudo aceso, a sala volta à Forma do começo.']};
  const SCENE={
    couvert:['O lago no escuro, com as esferas apagadas, e a mesa só de água.',
      'As folhas de manjericão e as raspas de limão do drink aparecem de perto na mesa.',
      'A espuma de ervas se espalha pela água, como a espuma de alecrim do Botanical Elixir.',
      'Pérolas se organizam em volta de cada lugar enquanto os grupos de esferas acendem.',
      'Todas as esferas acendem, a mesa fica dourada e a luz chega às taças.'],
    primeiro:['A praia à noite, com as esculturas de gel na parede e a água chegando na mesa.',
      'Sal grosso, mostarda, azeite e ervas na areia, entre os lugares.',
      'O azeite escorre em fios dourados e o crocante aparece partido na areia.',
      'Pequenos cubos cor de rubi se alinham entre os lugares, com o sal e a mostarda.',
      'As hélices de DNA saem da parede e a praia fica calma para o prato chegar.'],
    segundo:['O jardim no escuro, com as flores ainda apagadas.',
      'Figos abertos, rúcula, amêndoas e o creme da burrata espalhados pela mesa.',
      'O figo carameliza: gotas âmbar escorrem sobre os figos e o pesto, enquanto as flores acendem em grupos.',
      'Os mesmos ingredientes se organizam em anéis em volta de cada lugar.',
      'Fica acesa só uma flor e a sala se acalma para o prato chegar.'],
    terceiro:['A horta vista de cima: abobrinhas, flores e grãos de arroz na terra.',
      'Abobrinha, flor de abobrinha, parmesão e grãos de arroz sobre a mesa.',
      'O creme começa a envolver os ingredientes, como no risoto.',
      'O creme se organiza em ondas em volta de cada lugar.',
      'A mesa fica nas ondas de creme e as sedas seguem devagar na parede para o prato chegar.'],
    quarto:['O deserto ao pôr do sol e, na mesa, a areia quente com as ondas do vento.',
      'A fita de metal líquido se torce na parede; na mesa, veios de metal escorrem pela areia.',
      'O metal toma a mesa inteira, polido, refletindo o pôr do sol.',
      'O brilho chega a todos os lugares, com pequenas joias no metal.',
      'O sol baixa, o metal se acalma em ouro rosé e a mesa espera o prato.'],
    sobremesa:['O céu da noite, com a escultura de cristal apagada no horizonte.',
      'A escultura aparece no horizonte, ainda apagada; na mesa, os cristais em volta de cada lugar.',
      'A escultura acende em sequência, da esquerda para a direita.',
      'Na mesa, os mesmos cristais e pérolas brilham em volta de cada lugar.',
      'A escultura toda acesa, e a sala volta à Forma.']};
  // a step can need more than one image (the dessert's Revelação: the last wall and the last table)
  const SCENE_MORE={sobremesa:[[4,[null,'a escultura em ouro sobre a água, para fechar a noite','Edite a parede que estou enviando (a floresta de cacau da Origem). Esta é a parede final da noite, a Revelação da sobremesa.\n\nMANTENHA: a mesma proporção, o horizonte, a água e o terço da direita calmo e escuro.\n\nMUDE: a luz cai e a floresta fica quase escura. Sobre a água calma, no centro da imagem, surge uma escultura grande em ouro polido: um anel orgânico com a silhueta de um triângulo arredondado, como a Forma do logo (anexe também a imagem do logo como referência de forma). Um reflexo dourado longo na água.\n\nEVITE: pessoas, texto, mais de uma escultura e brilho exagerado. Fotorrealista, luxo minimalista.','a parede que você gerar na Origem (e a imagem do logo)','como última parede da sobremesa','Parede']]]};
  // the reference image of each prompt (the file in the collection), shown and downloadable next to the prompt
  const REF_FILE=[['002-exec-2ad7835e','images/6d8e1d8563a8296a6154b8be.webp'],['Imagem do ChatGPT 16 de out. de 2026, 12_54_12','enviadas/249cbaeaf19a4973d053aed6.png'],['mesa-praia-sal-mostarda','enviadas/c2b0a160199a8fa81c1044a5.webp'],['Imagem do ChatGPT 15 de out. de 2026, 22_42_47','enviadas/436bba145ab2e04f09e16746.png'],
    ['Imagem do ChatGPT 16 de out. de 2026, 13_26_20','enviadas/5e3f22f97d1a68bb6948784a.png'],['Imagem do ChatGPT 16 de out. de 2026, 13_26_28','enviadas/751073e7e2e615115cdd467d.png'],
    ['Imagem do ChatGPT 15 de out. de 2026, 23_09_41','enviadas/f2c57377ebb1e739f03d306f.png'],['Imagem do ChatGPT 15 de out. de 2026, 23_11_08','enviadas/396ae96610869ea77affb98d.png']];
  function sceneSteps(key){const list=SCENE[key]||(WHY_STEPS[key]?WHY_STEPS[key].slice():null);if(!list)return document.createTextNode('');
    const box=el('div','scene');box.append(el('h3','block-title','A cena'));const ol=el('ol','scene-steps');
    list.forEach((v,i)=>{const miss=Array.isArray(v)&&!WHY_STEPS[key]?.[i],li=el('li',miss?'missing':null);li.append(el('span','scene-n',String(i+1)),el('strong',null,SCENE_STEPS[i]),
      el('p',null,WHY_STEPS[key]?.[i]||(miss?'Ainda falta: '+v[1]+'.':v)));ol.append(li);});
    box.append(ol);
    // the prompts for the red steps, to copy into the GPT (with "Editar imagens"): the reference to send and where it goes
    const todo=list.map((v,i)=>({v,i})).filter(x=>Array.isArray(x.v)&&x.v[2]).concat((SCENE_MORE[key]||[]).map(([i,v])=>({v,i})));
    if(todo.length){const pr=el('div','prompts scene-prompts');pr.append(el('h4',null,'Prompts para as etapas em vermelho'));
      // walls first, then tables, each under its own heading
      const surf=v=>v[5]||'Mesa',order=['Parede','Mesa'];let last='';
      todo.sort((x,y)=>order.indexOf(surf(x.v))-order.indexOf(surf(y.v))||x.i-y.i);
      for(const {v,i} of todo){if(surf(v)!==last){last=surf(v);pr.append(el('h5','prompt-surf',last==='Parede'?'Parede':'Mesa'));}const r=promptRow(surf(v)+' · '+SCENE_STEPS[i]+': '+v[1],v[2],'Prompt copiado. Envie junto a imagem de referência.');
        const file=REF_FILE.find(([k])=>v[3].startsWith(k))?.[1],ref=el('div','prompt-refbox');
        if(file){const l=el('a','prompt-refimg');l.href=file;l.download=v[3].split(' (')[0];l.title='Baixar a imagem de referência';
          const im=el('img');im.src=file;im.alt='Imagem de referência';l.append(im);ref.append(l);}
        const txt=el('div');txt.append(el('p','prompt-ref','Envie esta imagem junto com o prompt: '+v[3]+'.'),el('p','prompt-ref','Entra no roteiro '+v[4]+'.'));
        if(file){const d=el('a','btn quiet','Baixar a imagem');d.href=file;d.download=v[3].split(' (')[0];txt.append(d);}
        ref.append(txt);r.insertBefore(ref,r.querySelector('p.master'));pr.append(r);}
      box.append(pr);}
    return box;}
  const BRIEF_GAP={};
  function deckWhy(key){const rows=DECK_WHY[key];if(!rows)return document.createTextNode('');
    const box=el('div','deck-why');box.append(el('h3','block-title','Do deck para a sala'));
    const dl=el('dl');for(const [q,n,s] of rows){const r=el('div','why-row'),dt=el('dt');
      dt.append(el('q',null,q),el('span','why-slide','slide '+n));r.append(dt,el('dd',null,s));dl.append(r);}
    box.append(dl);return box;}
  function briefGap(key){const list=BRIEF_GAP[key];if(!list)return document.createTextNode('');
    const box=el('aside','brief-gap');box.append(el('p','brief-gap-t','Ainda falta nos frames'));
    const ul=el('ul');for(const f of list)ul.append(el('li',null,f));box.append(ul);return box;}
  {const s=el('section','journey');s.id='jornada';
    const head=el('div','journey-head');head.append(el('h2',null,'Da forma à joia'),
      el('p',null,'A noite acompanha uma única matéria. Ela nasce na água e, a cada prato, muda de estado: gel, vida, pele, metal e, por fim, uma joia de cristal. A Forma assiste a tudo da Parede 2.'));
    const ol=el('ol','stages');
    for(const j of JOURNEY){const li=el('li'),a=ACTS.find(x=>x.key===j.from);
      const fig=el('a','stage-pic');fig.href='#ato-'+j.acts[0];fig.setAttribute('aria-label','Ir para '+j.name+': '+j.acts.map(k=>ACTS.find(x=>x.key===k)?.name).join(' e '));
      const w=a&&heroWall(a);
      if(j.pic){const im=el('img');im.loading='lazy';im.alt='';im.src=j.pic;if(j.pos)im.style.objectPosition=j.pos;fig.append(im);}   // the room itself: the title and the logo in the dark
      else if(w){const im=el('img');im.loading='lazy';im.alt='';heroPic(im,a);im.style.objectPosition='86% 42%';fig.append(im);}   // each card on its act's Forma
      const acts=el('span','stage-acts',j.acts.map(k=>{const x=ACTS.find(y=>y.key===k);return x?x.n+' '+x.name:k;}).join('  ·  '));
      const ul=el('ul','stage-brand');for(const b of j.brand){const [k,v]=b.split(': ');const bi=el('li');bi.append(el('strong',null,k),document.createTextNode(' '+v));ul.append(bi);}
      li.append(fig,el('span','stage-state',j.name),el('h3',null,metaOf(j.acts[0])[0]),acts);ol.append(li);}
    s.append(head,ol);parts.push(s);}
  // the acts' videos of the overview go together: all on one clock (the same second of their 30 s at the same time),
  // each brought back to it if it drifts or starts later than the others
  const glanceT0=performance.now(),glanceVids=new Set();
  function glanceSync(v){glanceVids.add(v);v.currentTime=((performance.now()-glanceT0)/1000)%(v.duration||30);}
  setInterval(()=>{for(const v of glanceVids){if(v.paused||v.readyState<2)continue;const d=v.duration||30,t=((performance.now()-glanceT0)/1000)%d;
    let dt=t-v.currentTime;if(dt>d/2)dt-=d;if(dt<-d/2)dt+=d;
    if(Math.abs(dt)>2)v.currentTime=t;else v.playbackRate=Math.abs(dt)<0.05?1:Math.max(0.94,Math.min(1.06,1+dt*0.3));}},1000);   // (brought back by its speed, never a jump: a jump read as a stutter; only far off, it jumps)
  // the eight acts at a glance
  {const s=el('section','glance');s.append(el('h2',null,'Os '+ACTS.length+' atos'));const ol=el('ol');
    for(const a of ACTS){const li=el('li'),l=el('a');l.href='#ato-'+a.key;
      const name=el('span');name.append(el('span','g-name',a.name));const mk=el('span','g-marks');for(const [t,st] of a.els){const m=el('span','mk '+st,MARK[st]);m.title=t+': '+MARK_TXT[st];mk.append(m);}name.append(mk);
      const pic=el('span','g-pic');const w=heroWall(a);if(w){const im=el('img');im.alt='';heroPic(im,a);pic.append(im);}
      // one turn of the act's Forma, from its wall in video (apresentacao/atos/<act>-volta.mp4, 38 s: each cut to start with
      // the ring edge-on and timed to the same speed, half a turn in 19 s, so all the Formas turn together), over the picture
      // once it plays, only while in view
      if(!NOVAS[a.key]){const v=el('video','g-vid');v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.preload='none';v.setAttribute('aria-hidden','true');
        v.src='apresentacao/atos/'+a.key+'-volta.mp4?v='+VOLTA_V;v.addEventListener('playing',()=>{v.classList.add('on');glanceSync(v);},{once:true});pic.append(v);vidSeen(v);}
      const pr=el('span','g-prog');pr.dataset.key=a.key;name.append(pr);
      l.append(el('span','g-n',a.n),name,el('span','g-dish g-uni',metaOf(a.key)[0]+' · '+metaOf(a.key)[1]),el('span','g-dish g-gap',a.gap),pic);li.append(l);ol.append(li);}
    s.append(ol);parts.push(s);}

  const acts=new Map();
  for(const a of ACTS){
    const s=el('section','act');s.id='ato-'+a.key;s.dataset.key=a.key;
    // the cover: the act's own wall, full screen; its number, its name in Times (lighting up to white as it comes into
    // view) and the universe of the deck it belongs to
    const head=el('header','act-cover'),bg=el('div','cover-bg');
    {const w=picsOf(a).walls[0],im=el('img');im.alt='';im.decoding='async';
      if(a.key==='forma'){im.src='apresentacao/sala/forma.jpg';im.style.objectPosition='50% 42%';}   // its wall is white: on the white cover, the room in the dark shows it
      else if(w){im.src=media.get(w.sha).image;if(w.inv)im.style.filter='invert(1)';if(w.gr)gradedSrc(media.get(w.sha).image,true,3600).then(u=>im.src=u);}
      bg.append(im);}
    const ttl=el('div','cover-title');ttl.append(el('span','cover-n',a.n),el('h2','cover-name',a.name),el('p','cover-uni',metaOf(a.key)[0]));
    head.append(bg,ttl);
    // the idea of the act beside its dish: one sentence, one line of the deck
    const idea=el('div','act-idea'),why=(DECK_WHY[a.key]||[])[0];
    idea.append(el('p','idea-lead',WHY_LEAD[a.key]||ABOUT[a.key]||a.dish));
    if(why){const q=el('blockquote','idea-quote');q.append(el('p',null,'“'+why[0]+'”'),el('cite',null,'Deck, slide '+why[1]));idea.append(q);}
    // the room
    const stage=el('div','stage'),box=el('div','stage-box');box.dataset.key=a.key;
    // while the room is not over this box (loading, or putting this act together): a turning ring and a word, never black alone
    {const w=el('div','wait');w.setAttribute('role','status');w.append(el('span','wait-ring'),el('span','wait-t','Carregando a sala 3D'));box.append(w);}
    // arrows over the room: the previous / next visual (wall and table together)
    for(const [cls,d,label,icon] of [['prev',-1,'Visual anterior','chevron-left'],['next',1,'Próximo visual','chevron-right']]){
      const ar=el('button','room-arrow '+cls);ar.type='button';ar.setAttribute('aria-label',label);ar.title=label;ar.innerHTML='<i data-lucide="'+icon+'"></i>';
      ar.onclick=()=>room.stepBy(a.key,d);box.append(ar);}
    const tools=el('div','stage-tools'),views=el('div','views');views.setAttribute('role','group');views.setAttribute('aria-label','Vistas da sala');
    for(const [k,label] of VIEWS){const b=el('button','view',label);b.type='button';b.dataset.view=k;b.onclick=()=>room.view(a,k);views.append(b);}
    tools.append(views);const snd=soundOf(a.key);if(snd)tools.append(player(a,snd));
    // export the wall on show with the Forma applied (local only: the client's copy hides it)
    tools.append(logoControls(a));
    stage.append(box,tools);
    // the dish, as the deck shows it
    const ref=el('div','dish'),strip=el('div','dish-photos');const rl=refs[a.key]||[];
    ref.append(strip,el('p','dish-text',a.dish.split('. ')[0].replace(/\.$/,'')+'.'));
    const oneCap=rl.length>1&&rl.every(r=>r.cap===rl[0].cap);   // the same words under every photo: say them once
    strip.style.setProperty('--n',Math.min(3,rl.length)||1);strip.dataset.n=String(Math.min(3,rl.length));
    for(const r of rl.slice(0,3)){const f=el('figure');if(r.w&&r.h)f.style.setProperty('--ar',r.w/r.h);const im=el('img');im.loading='lazy';im.alt=r.cap;im.src=r.img;f.append(im);if(!oneCap)f.append(el('figcaption',null,r.cap));strip.append(f);}
    if(!rl.length){const w=heroWall(a);   // no dish in this act: its wall with the Forma beside the sentence
      if(w&&a.key==='forma'){strip.dataset.n='1';const f=el('figure','dish-forma'),im=el('img');   // only the Forma: its 3D render in polished chrome, still, facing the guest
        im.alt='A Forma';im.decoding='async';im.src='apresentacao/sala/forma-cromo-frente.webp?v=3';f.append(im);strip.append(f);ref.querySelector('.dish-text').remove();}
      else ref.hidden=true;}
    const pair=el('div','act-pair');pair.append(ref,idea);
    // its pictures: walls or tables
    const imgs=el('div','images');
    // notes
    const notes=el('div','act-notes');
    const n1=el('div');n1.append(el('h3',null,'O que a sala precisa mostrar'));const ul=el('ul','els');
    for(const [t,st,how] of a.els){const li=el('li');const m=el('span','mk '+st,MARK[st]);m.title=MARK_TXT[st];const tx=el('span');tx.append(el('strong',null,t));if(how)tx.append(el('small',null,how));li.append(m,tx);ul.append(li);}
    n1.append(ul);
    const n2=el('div');n2.append(el('h3',null,'Para combinar com o prato'));const ol=el('ol','make');a.make.forEach(t=>ol.append(el('li',null,t)));n2.append(ol);
    notes.append(n1,n2);
    const council=el('div','council');
    const guide=el('div','guide'),g=GUIDE[a.key];
    if(g){guide.append(el('h3','block-title','Como melhorar este ato'));const cols=el('div','guide-cols');
      const col=(title,items,prompts)=>{const c=el('div','guide-col');c.append(el('h4',null,title));const ul=el('ul','guide-list');items.forEach(t=>ul.append(el('li',null,t)));c.append(ul);
        for(const [label,text] of prompts)c.append(promptRow(label,text,'Prompt copiado ('+label.toLowerCase()+', ato '+a.n+'). Gere no ChatGPT e suba em Imagens, Enviar do computador.'));return c;};
      cols.append(col('Parede: Origem',g.wall.todo,g.wall.prompts),col('Mesa (envie a mesa atual junto com cada prompt)',g.table.needs,g.table.prompts));
      guide.append(cols);}
    // as slides: the cover, the room, the dish with its idea, and the scene with the act's pictures
    const sceneSlide=el('div','slide-scene');sceneSlide.append(sceneSteps(a.key),briefGap(a.key),imgs);
    s.append(head,pair,stage,sceneSlide,guide,notes,council);   // the dish first, then the room
    parts.push(s);acts.set(a.key,{a,s,box,imgs,council,kind:'walls',active:{wall:0,table:0}});
  }
  const verdict=el('section','next verdict');verdict.id='conselho';parts.push(verdict);
  // for checking the texts against the room: the pictures of each step of an act, as the room plays them
  window.__frames=key=>framesOf(acts.get(key).a).map(f=>({w:f.w?media.get(f.w.sha)?.image:null,t:f.t?media.get(f.t.sha)?.image:null,at:f.at??null}));
  deck.replaceChildren(...parts);
  // the council: each act's dominant universe, its brand elements and other checkpoints; the overall verdict
  let councilBuilt=false;
  function renderCouncil(){
    if(councilBuilt)return syncCouncil();councilBuilt=true;
    for(const [key,st] of acts){const c=COUNCIL.acts[key];if(!c){st.council.replaceChildren();continue;}
      const head=el('div','council-head'),cnt=el('span','council-count');cnt.dataset.key=key;head.append(el('h3',null,'O que fazer agora'),cnt);
      const dom=el('p','council-dom');dom.append(document.createTextNode('Universo '),el('strong',null,universeOf(key)));
      const fm=el('p','council-forma');fm.append(el('strong',null,'A Forma neste ato: '),document.createTextNode(c.forma||''));
      st.council.replaceChildren(head,dom,fm,el('p','council-note',c.note),el('h4',null,'Elementos da marca'),checkList(key,c.brand),
        el('h4',null,'Na mesa'),checkList(key,c.table),el('h4',null,'Para fazer mais sentido'),checkList(key,c.improve));
      if(c.cut?.length){const d=el('details','council-cut'),sm=el('summary',null,'Cortado pelo conselho ('+c.cut.length+')'),ul=el('ul');
        for(const t of c.cut){const [what,why]=t.split(': ');const li=el('li');li.append(el('strong',null,what),document.createTextNode(why?': '+why:''));ul.append(li);}
        d.append(sm,ul);st.council.append(d);}}
    const gc=el('span','council-count');gc.dataset.key='geral';
    const top=el('div','verdict-top');top.append(el('h2',null,'O que fazer agora'),gc);
    const pos=el('p','verdict-pos',COUNCIL.position),conf=el('p','verdict-conf');conf.append(el('strong',null,'Confiança '),document.createTextNode(COUNCIL.confidence));
    const kit=el('div','brand-kit');for(const [,name,desc] of BRAND){const d=el('div');d.append(el('strong',null,name),el('span',null,desc));kit.append(d);}
    const cols=el('div','verdict-cols'),c1=el('div'),c2=el('div');
    c1.append(el('h3',null,'Próximos passos'),checkList('geral',COUNCIL.steps),el('h3',null,'Para todos os atos'),checkList('geral',COUNCIL.global));
    const rk=el('ol','risks');for(const [t,d] of COUNCIL.risks){const li=el('li');li.append(el('strong',null,t),el('p',null,d));rk.append(li);}
    const mr=el('blockquote','minority');mr.append(el('p',null,COUNCIL.minority[1]),el('cite',null,'Voto contrário: '+COUNCIL.minority[0]));
    c2.append(el('h3',null,'Riscos'),rk,mr);cols.append(c1,c2);
    verdict.replaceChildren(top,pos,conf,el('h3','kit-title','Os elementos da marca, dos universos do deck'),kit,cols,
      el('p','verdict-src','Leitura do conselho de '+COUNCIL.date+', a partir dos universos e atos do deck e do roteiro atual. O que a sala já mostra vem marcado; marque o resto conforme for feito: fica salvo para todos.'));
    syncCouncil();
  }
  // a tick saved (here or by someone else): the boxes, the counts and the overview follow, without redrawing
  function syncCouncil(){
    const findItem=(key,id)=>(key==='geral'?[...COUNCIL.steps,...COUNCIL.global]:actItems(key)).find(it=>it.id===id);
    for(const box of document.querySelectorAll('input[data-ck]')){const it=findItem(box.dataset.ck,box.dataset.id);const on=!!it&&isDone(box.dataset.ck,it);
      box.checked=on;box.closest('li').classList.toggle('done',on);}
    const items=key=>key==='geral'?[...COUNCIL.steps,...COUNCIL.global]:actItems(key);
    for(const c of document.querySelectorAll('.council-count[data-key]'))c.textContent=progress(c.dataset.key,items(c.dataset.key))+' de '+items(c.dataset.key).length+' feitos';
    for(const pr of document.querySelectorAll('.g-prog')){const c=COUNCIL.acts[pr.dataset.key];
      pr.textContent=c?universeOf(pr.dataset.key)+' · marca '+progress(pr.dataset.key,c.brand)+' de '+c.brand.length:'';}
  }
  renderCouncil();

  // ---- the soundtrack of each act: play, pause and drag along it (one act at a time) ----
  function showPhases(key){return false;}   // the acts whose player names the phase of the music (a declaration: used before this line runs)
  function player(a,snd){
    const box=el('div','player');box.dataset.key=a.key;
    const btn=el('button','play');btn.type='button';btn.setAttribute('aria-label','Tocar a trilha do ato '+a.n+': '+snd.name);btn.innerHTML='<i data-lucide="play"></i>';
    const name=el('span','p-name');name.append(document.createTextNode('Trilha '),el('b',null,snd.name));
    const bar=el('input','scrub');bar.type='range';bar.min=0;bar.max=Math.round(snd.duration||900);bar.step=0.5;bar.value=0;bar.setAttribute('aria-label','Posição na trilha');
    const time=el('span','p-time',mmss(0)+' / '+mmss(snd.duration));
    const paint=t=>{bar.value=t;bar.style.setProperty('--p',(100*t/(+bar.max||1))+'%');time.textContent=mmss(t)+' / '+mmss(+bar.max);};
    box._paint=paint;box._btn=btn;
    btn.onclick=()=>{
      if(playing===box&&!audio.paused){audio.pause();return;}
      if(playing!==box){if(playing)playing._idle();playing=box;audio.src=snd.file;audio.currentTime=+bar.value||0;}
      room.pickUntil=0;   // play: the room follows the track from now on
      audio.volume=0;audio.play().then(()=>{let v=0;const up=setInterval(()=>{v=Math.min(1,v+0.08);audio.volume=v;if(v>=1)clearInterval(up);},60);}).catch(()=>{});
    };
    box._idle=()=>{btn.innerHTML='<i data-lucide="play"></i>';lucide.createIcons({root:btn});box.classList.remove('on');};
    bar.oninput=()=>{paint(+bar.value);if(playing===box)audio.currentTime=+bar.value;};
    if(showPhases(a.key))name.append(el('span','p-fase'));
    box.append(btn,name,bar,time);paint(0);
    return box;
  }
  audio.addEventListener('timeupdate',()=>{if(playing)playing._paint(audio.currentTime);});
  audio.addEventListener('play',()=>{if(!playing)return;playing._btn.innerHTML='<i data-lucide="pause"></i>';lucide.createIcons({root:playing._btn});playing.classList.add('on');});
  audio.addEventListener('pause',()=>{if(playing)playing._idle();});
  audio.addEventListener('ended',()=>{if(playing){playing._idle();playing._paint(0);}});

  // ---- an act's pictures: walls or tables, one list at a time. One big (the one in the room) with "+N" opening the
  // rest large in a pop-up, or all of them big. Click one to put it in the room; swap, remove, add one or a roteiro group.
  const PREF_ALL='apresentacao-todas-grandes';
  let showAll=false;try{showAll=localStorage.getItem(PREF_ALL)==='1';}catch{}
  // the Forma over the pictures (and in the exported walls): on or off, remembered in this browser
  const PREF_LOGO='apresentacao-imagens-com-logo';
  let showLogo=true;try{showLogo=localStorage.getItem(PREF_LOGO)!=='0';}catch{}
  const word=(kind,n)=>kind==='walls'?(n>1?'paredes':'parede'):(n>1?'mesas':'mesa');
  function seg(label,items,cur,on){const g=el('div','seg');g.setAttribute('role','group');g.setAttribute('aria-label',label);
    for(const [k,text,count] of items){const b=el('button','seg-b');b.type='button';b.append(document.createTextNode(text));if(count!=null)b.append(el('span','seg-n',String(count)));
      b.setAttribute('aria-pressed',String(k===cur));b.onclick=()=>on(k);g.append(b);}
    return g;}
  // the walls and tables that are videos play in their preview only while it is on screen
  function vidSeen(v){(vidSeen.o||(vidSeen.o=new IntersectionObserver(es=>{for(const e of es){const x=e.target;if(e.isIntersecting)x.play().catch(()=>{});else x.pause();}},{rootMargin:'100px'}))).observe(v);}   // (a declaration: used before this line runs)
  function picFigure(st,kind,item,idx,inGallery){
    const a=st.a,key=a.key,isWall=kind==='walls',slot=isWall?'wall':'table',m=media.get(item.sha);
    const fig=el('figure','pic '+(isWall?'wall':'table')+(st.active[slot]===idx?' active':''));fig.dataset.kind=kind;fig.dataset.idx=idx;
    const frame=el('div','pic-frame');frame.title='Mostrar na sala 3D';frame.tabIndex=0;frame.setAttribute('role','button');
    const im=el('img');im.loading='lazy';im.alt=(isWall?'Parede':'Mesa')+(item.passo?' do passo '+item.passo:'');frame.append(im);
    if(m.video){const vd=el('video');vd.muted=true;vd.loop=true;vd.playsInline=true;vd.preload='metadata';vd.poster=m.image;vd.src=m.video;
      vd.setAttribute('aria-label',im.alt+' (vídeo)');im.replaceWith(vd);vidSeen(vd);}
    if(item.inv){im.style.filter='invert(1)';fig.classList.add('inverted');}
    showPic(im,isWall?m.image:(m.projection_preview||m.image),isWall,item.gr);   // the same grade the room shows, without white bands
    if(item.texto){const t=el('span','pic-text',item.texto.toUpperCase());frame.append(t);}
    if(isWall&&st.logo&&showLogo&&!item.semLogo){const L=el('img','pic-logo');L.alt='';L.src=st.logo;const at=st.logoAt;Object.assign(L.style,{left:(at.x*100)+'%',top:(at.y*100)+'%',width:(at.h*1150/6410*100)+'%'});frame.append(L);
      const R=REFLEXO[key];if(R){const F=el('img','pic-refl');F.alt='';F.src=R.url;Object.assign(F.style,{left:(at.x*100)+'%',top:((at.y-at.h/2+R.inicio*at.h)*100)+'%',width:(at.h*1150/6410*100)+'%'});frame.append(F);}}
    const pick=()=>{st.active[slot]=idx;if(inGallery)gal.close();renderSurfaces(key);room.jump(key,kind,idx);};
    frame.onclick=pick;frame.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}};
    const cap=el('figcaption');
    cap.append(el('span',null,item.passo?'Passo '+item.passo+' do roteiro · '+((curStory()?.steps[item.at]?.nome)||a.key):'Do roteiro'));   // named as in the current roteiro
    cap.append(el('span','in-room','Na sala'));
    const tools=el('span','tools');
    const swap=el('button','btn quiet','Trocar');swap.type='button';swap.onclick=()=>{if(inGallery)gal.close();openPicker(a,kind,idx,item.at);};
    const del=el('button','btn quiet','Remover');del.type='button';del.title='Tira só '+(isWall?'esta parede':'esta mesa')+' do passo '+item.passo+'; '+(isWall?'a mesa':'a parede')+' do passo fica';
    // two clicks: the first asks, right on the button, for a few seconds
    let armed=0;del.onclick=()=>{if(armed){clearTimeout(armed);armed=0;removePicture(item.at,kind);return;}
      del.textContent=isWall?'Tirar só a parede?':'Tirar só a mesa?';del.classList.add('danger');
      armed=setTimeout(()=>{armed=0;del.textContent='Remover';del.classList.remove('danger');},4000);};
    tools.append(swap,del);
    if(isWall){const hide=el('button','btn quiet pic-nologo',item.semLogo?'Mostrar logo':'Esconder logo');hide.type='button';
      hide.title=item.semLogo?'A Forma volta nesta parede (na sala, na prévia e na exportação)':'Esta parede fica sem a Forma: na sala, na prévia e na exportação';
      hide.onclick=e=>{e.stopPropagation();st.active.wall=idx;const on=!item.semLogo,same=stepsOf(key).filter(x=>wallSha(x.st)===item.sha&&!!x.st.invertWall===!!item.inv&&(x.st.gradeWall==='floresta')===!!item.gr).map(x=>x.i);
        if(editSteps(list=>{for(const i of same){if(on)list[i].semLogo=true;else delete list[i].semLogo;}}))toast(on?'Esta parede fica sem a Forma.':'A Forma voltou nesta parede.');};
      tools.append(hide);}
    cap.append(tools);
    if(isWall){const ex=el('button','btn quiet local-only pic-export',showLogo?'Exportar com logo':'Exportar sem logo');ex.type='button';ex.title='Baixa esta parede inteira (6410 × 1150)'+(showLogo?' com a Forma do ato aplicada':', sem a Forma');
      ex.onclick=e=>{e.stopPropagation();exportPictures(a,[item],ex);};cap.append(ex);}
    fig.append(frame,cap);return fig;
  }
  // the video made for the act's whole track, as the pictures' section shows it: playing on its own (not with the
  // track), one minute after the other, round again at the end
  function trackFigure(c,isWall){
    const fig=el('figure','pic '+(isWall?'wall':'table')+' track-pic'),frame=el('div','pic-frame'),v=el('video');
    v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='none';if(c.poster)v.poster=c.poster+'?v='+c.v;
    v.setAttribute('aria-label',(isWall?'Parede':'Mesa')+' da trilha inteira (vídeo)');let i=0;
    const go=play=>{v.src=c.base+String(i).padStart(3,'0')+'.mp4?v='+c.v;if(play)v.play().catch(()=>{});};
    v.addEventListener('ended',()=>{i=(i+1)%c.n;go(true);});go(false);vidSeen(v);   // (it plays once in view: asked to play at once, it loaded its whole minute with the page)
    frame.append(v);fig.append(frame,el('figcaption','track-cap',(isWall?'A parede':'A mesa')+(c.n===1?', em laço, como passa na sala (aqui sem som)':' durante a trilha inteira, como passa na sala (aqui sem som)')));return fig;}
  function renderSurfaces(key){
    const st=acts.get(key),a=st.a,p=picsOf(a),kind=st.kind,isWall=kind==='walls',list=p[kind],slot=isWall?'wall':'table';
    const tv=(isWall?TRACK_WALL_VIDEO:TRACK_TABLE_VIDEO)[key];   // (an act whose wall or table is a video made for its track)
    const head=el('div','img-head');
    head.append(el('h3','block-title','Imagens'),
      seg('Mostrar paredes ou mesas',[['walls','Paredes',TRACK_WALL_VIDEO[key]?1:p.walls.length],['tables','Mesas',TRACK_TABLE_VIDEO[key]?1:p.tables.length]],kind,k=>{st.kind=k;renderSurfaces(key);}),
      seg('Tamanho das imagens',[['one','Uma grande'],['all','Todas grandes']],showAll?'all':'one',k=>{showAll=k==='all';try{localStorage.setItem(PREF_ALL,showAll?'1':'0');}catch{}for(const k2 of acts.keys())renderSurfaces(k2);}));
    if(isWall&&!tv)head.append(seg('A Forma nas imagens',[['on','Com logo'],['off','Sem logo']],showLogo?'on':'off',k=>{showLogo=k==='on';try{localStorage.setItem(PREF_LOGO,showLogo?'1':'0');}catch{}for(const k2 of acts.keys())renderSurfaces(k2);}));
    const edit=el('div','img-edit');
    const add=el('button','btn','Adicionar '+word(kind,1)+' do acervo');add.type='button';add.onclick=()=>openPicker(a,kind,-1);
    const grp=el('button','btn','Adicionar grupo do roteiro');grp.type='button';grp.onclick=()=>openGroups(a);
    const up=el('button','btn','Enviar do computador');up.type='button';
    const file=el('input');file.type='file';file.accept='image/*,video/*';file.hidden=true;up.onclick=()=>file.click();
    file.onchange=async()=>{const f=file.files[0];file.value='';if(!f)return;up.disabled=true;up.textContent='Enviando…';
      try{await uploadPicture(a,kind,f);}catch(e){toast('Não foi possível enviar '+f.name+': '+e.message);}
      finally{up.disabled=false;up.textContent='Enviar do computador';}};
    edit.append(add,up,file,grp);head.append(edit);
    if(isWall&&!tv&&list.length){const all=el('button','btn local-only pic-export-all',showLogo?'Exportar todas com logo':'Exportar todas sem logo');all.type='button';all.onclick=()=>exportPictures(a,list,all);head.append(all);}
    const body=el('div','img-list');
    if(tv&&!tv.falhou){body.append(trackFigure(tv,isWall));st.imgs.replaceChildren(head,body);return;}
    if(!list.length)body.append(el('p','no-photo','Nenhuma '+word(kind,1)+' neste ato ainda.'));
    else if(showAll)list.forEach((it,i)=>body.append(picFigure(st,kind,it,i)));
    else{const i=Math.min(st.active[slot],list.length-1);body.append(picFigure(st,kind,list[i],i));
      const rest=list.map((it,j)=>({it,j})).filter(x=>x.j!==i);
      if(rest.length){const more=el('button','more');more.type='button';more.setAttribute('aria-label','Ver as outras '+rest.length+' '+word(kind,rest.length));
        const th=el('span','more-thumbs');for(const {it} of rest.slice(0,3)){const im=el('img');im.loading='lazy';im.alt='';showPic(im,it.gr?media.get(it.sha).image:thumb(media.get(it.sha)),kind==='walls',it.gr);th.append(im);}
        more.append(th,el('span','more-n','+'+rest.length),el('span','more-t',word(kind,rest.length)));more.onclick=()=>openGallery(key);body.append(more);}}
    st.imgs.replaceChildren(head,body);
  }
  // the pop-up: every picture of the list, large
  const gal=$('#gallery'),galList=$('#gallery-list');let galKey=null;
  function fillGallery(){const st=acts.get(galKey),kind=st.kind,list=picsOf(st.a)[kind];
    $('#gallery-title').textContent=(kind==='walls'?'Paredes':'Mesas')+' · '+st.a.n+' '+st.a.name;
    galList.replaceChildren(...list.map((it,i)=>picFigure(st,kind,it,i,true)));}
  function openGallery(key){galKey=key;fillGallery();gal.showModal();}
  // a whole group of the roteiro (the consecutive steps with the same name): its walls and tables at once
  function roteiroGroups(){const all=curStory()?.steps||[],out=[];let k=0;
    while(k<all.length){const n=(all[k].nome||'').trim();let e=k;
      if(n){while(e+1<all.length&&(all[e+1].nome||'').trim().toLowerCase()===n.toLowerCase())e++;
        const items=[];for(let q=k;q<=e;q++)items.push({st:all[q],passo:q+1});out.push({name:n,items});}
      k=e+1;}
    return out;}
  const grpDlg=$('#groups'),grpList=$('#groups-list');
  function openGroups(a){
    $('#groups-title').textContent='Adicionar grupo do roteiro · '+a.n+' '+a.name;grpList.replaceChildren();
    for(const g of roteiroGroups()){const ws=g.items.map(x=>wallSha(x.st)).filter(s=>media.get(s)),ts=g.items.map(x=>tableSha(x.st)).filter(s=>media.get(s));
      if(!ws.length&&!ts.length)continue;
      const b=el('button','grp');b.type='button';
      const th=el('span','grp-thumbs');for(const sha of ws.slice(0,4)){const im=el('img');im.loading='lazy';im.alt='';showPic(im,thumb(media.get(sha)),true);th.append(im);}
      const tx=el('span','grp-t');tx.append(el('strong',null,g.name),el('small',null,'Passos '+g.items[0].passo+(g.items.length>1?' a '+g.items.at(-1).passo:'')+'. '+ws.length+' '+word('walls',ws.length)+', '+ts.length+' '+word('tables',ts.length)+'.'));
      b.append(tx,th);b.onclick=()=>{addGroup(a,g);grpDlg.close();};
      grpList.append(b);}
    if(!grpList.children.length)grpList.append(el('p','picker-empty','O roteiro não tem grupos com nome e imagens.'));
    grpDlg.showModal();
  }
  for(const key of acts.keys())renderSurfaces(key);
  store.on(()=>{if(!acts.size||logoSaving)return;renderCouncil();for(const key of acts.keys())renderSurfaces(key);if(galKey&&gal.open)fillGallery();if(room.current)room.refresh(room.current);});
  // what the gallery saved meanwhile comes in when this page is looked at again
  const pull=()=>{if(!document.hidden)store.pull().catch(()=>{});};
  addEventListener('focus',pull);document.addEventListener('visibilitychange',pull);setInterval(pull,4000);
  lucide.createIcons({root:deck});

  // ---- picker: the gallery's walls or tables, by stage ----
  const dlg=$('#picker'),grid=$('#picker-grid'),stSel=$('#picker-stage');
  let pickFor=null;
  stSel.append(Object.assign(el('option',null,'Todas'),{value:''}));
  for(const [k,s] of Object.entries(data.stages||{})){const o=el('option',null,s.title||k);o.value=k;stSel.append(o);}
  function fillPicker(){
    const {kind}=pickFor,surface=kind==='walls'?'parede':'mesa';
    const seen=new Set(),list=data.media.filter(m=>m.surface===surface&&!store.isRemoved?.(m.sha256)&&(!stSel.value||m.stage===stSel.value)&&!seen.has(m.sha256)&&seen.add(m.sha256));
    grid.className='picker-grid'+(kind==='tables'?' tables':'');grid.replaceChildren();
    if(!list.length){grid.append(el('p','picker-empty','Nenhuma imagem nesta etapa.'));return;}
    for(const m of list){const b=el('button');b.type='button';const im=el('img');im.loading='lazy';im.alt='';im.src=thumb(m);b.append(im,el('span',null,m.name));
      b.onclick=()=>{dlg.close();applyPick(m.sha256);};
      grid.append(b);}
  }
  // the chosen picture goes in: added, or in place of the one being swapped (in every step of the act that showed it)
  function applyPick(sha){const {a,kind,idx,at}=pickFor,st=acts.get(a.key);st.kind=kind;
    if(idx<0){addPicture(a,kind,sha);st.active[kind==='walls'?'wall':'table']=picsOf(a)[kind].length-1;room.jump(a.key,kind,picsOf(a)[kind].length-1);}
    else{swapPicture(at,kind,sha);room.jump(a.key,kind,idx);}}
  // "Enviar do computador" in the picker: the picture goes to the collection and straight into its place
  {const up=$('#picker-upload'),file=$('#picker-file');
    up.onclick=()=>file.click();
    file.onchange=async()=>{const f=file.files[0];file.value='';if(!f||!pickFor)return;up.disabled=true;up.textContent='Enviando…';
      try{const sha=await uploadMedia(pickFor.a,pickFor.kind,f);dlg.close();applyPick(sha);toast(f.name+' entrou '+(pickFor.idx<0?'no ato.':'no lugar da imagem trocada.'));}
      catch(e){toast('Não foi possível enviar '+f.name+': '+e.message);}
      finally{up.disabled=false;up.textContent='Enviar do computador';}};}
  function openPicker(a,kind,idx,at){
    pickFor={a,kind,idx,at};
    $('#picker-title').textContent=(idx<0?'Adicionar ':'Trocar ')+(kind==='walls'?'parede':'mesa');
    const cur=picsOf(a)[kind][Math.max(0,idx)]||picsOf(a).walls[0];stSel.value=media.get(cur?.sha)?.stage||'';
    fillPicker();dlg.showModal();
  }
  stSel.onchange=fillPicker;

  // ---- edit mode: the controls appear only when editing ----
  const et=$('#edit-toggle');
  et.onclick=()=>{const on=et.getAttribute('aria-pressed')!=='true';et.setAttribute('aria-pressed',String(on));et.textContent=on?'Concluir':'Editar imagens';document.body.classList.toggle('editing',on);place();};

  // ---- the room in 3D: one live room, placed over the act on screen, showing that act's chosen wall and table ----
  const frame=el('iframe');frame.id='room3d';frame.title='Sala 3D';frame.src=ROOM_URL;document.body.append(frame);
  const roomReady=new Promise(res=>{frame.addEventListener('load',()=>{const t=setInterval(()=>{const w=frame.contentWindow;
    if(w?.__v3?.getGLB?.().ok&&w.pharmaRoom){clearInterval(t);w.pharmaRoom.ready();w.pharmaRoom.flyTo('inteira',true);w.pharmaRoom.setLight(0.05);w.__v3.controls.enabled=false;
      Promise.resolve(w.pharmaRoom.setLogo(true,{front:true,speed:0,...FORMA_MOVE})).catch(()=>{});res(w.pharmaRoom);}},200);},{once:true});});
  const aligns=new Map();
  // where the plates are on each table picture of the roteiro, found once ahead (Plates.autoWhole, ~0.6 s each on a
  // slower computer: done while a table video plays it froze the video for that long before every change of step)
  const PRATOS=fetch('apresentacao/mesas-pratos.json?v=1').then(r=>r.ok?r.json():{}).catch(()=>({}));
  async function tableCanvas(m){
    const img=await Art.loadImage(m.projection_preview||m.image);
    let al;if(m.calibrated===true)al={...Plates.STRETCH,offsets:null};
    else{const saved=store.getAlign(m.sha256);if(saved)al={...Plates.cover(saved),offsets:saved.offsets||null};
      else{if(!aligns.has(m.sha256))aligns.set(m.sha256,(await PRATOS)[m.sha256.slice(0,16)]||Plates.autoWhole(img));al=aligns.get(m.sha256);}}
    return Plates.render(img,2682,540,al,al.offsets);
  }
  // the logo as the room draws it now: its own picture (transparent around it), straightened and in display colours
  // the Forma as the room draws it now on Parede 02 (the act's render or the live metal) and its square on the whole
  // wall picture (centre x, y and side as shares of the picture height), for the pictures' preview
  async function logoShot(){
    const R=await roomReady,L=R.logoLayer?.();if(!L)return null;const split=4490/6410;
    return {src:L.canvas.toDataURL('image/png'),at:{x:split+(1-split)*L.u,y:L.v,h:L.h}};
  }
  function withText(cv,text,color='#000'){                                   // the title on Parede 1, as the room draws it
    const g=cv.getContext('2d'),size=Math.round(cv.height*0.1);g.font='400 '+size+'px "Times New Roman",Times,serif';
    if('letterSpacing' in g)g.letterSpacing=Math.round(size*0.12)+'px';g.fillStyle=color;g.textAlign='center';g.textBaseline='middle';
    g.fillText(text.toUpperCase(),cv.width*(4490/6410)/2,cv.height*0.3);return cv;}
  // The room passes through the act's walls and tables in a loop (LOOP_MS each, loopMs). Every change of act gets a new
  // generation: work started for an act that is no longer on screen is dropped, so one act never paints over another.
  // Each act keeps its own view; the room stays hidden until the new act is painted.
  const LOOP_MS=3500,FADE_MS=900;
  // a step whose table is a video lasts 15 s, so the table plays for a while
  const VIDEO_STEP_MS=15000,loopMs=key=>NOVAS[key]?VIDEO_STEP_MS:room.cur?.key===key&&room.cur.t&&media.get(room.cur.t.sha)?.video?VIDEO_STEP_MS:LOOP_MS;
  const black=surface=>{const c=document.createElement('canvas');c.width=surface==='mesa'?2682:2564;c.height=surface==='mesa'?540:460;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);return c;};
  const cvCache=new Map();   // composed canvases, the last few (a wall is a big canvas)
  function cached(k,make){if(cvCache.has(k)){const v=cvCache.get(k);cvCache.delete(k);cvCache.set(k,v);return v;}
    const v=make().catch(e=>{cvCache.delete(k);throw e;});cvCache.set(k,v);while(cvCache.size>12)cvCache.delete(cvCache.keys().next().value);return v;}
  const inverted=cv=>{if(!cv)return cv;const m=document.createElement('canvas');m.width=cv.width;m.height=cv.height;const g=m.getContext('2d');g.filter='invert(1)';g.drawImage(cv,0,0);g.filter='none';return m;};
  const FOREST_LUT='luts/forest_night.cube';   // "Verde floresta": the LUT made with the colour skill (presets.yml forest_night)
  let forestLut=null;
  const loadForest=()=>forestLut||(forestLut=fetch(FOREST_LUT).then(r=>r.text()).then(t=>{let n=0;const v=[];
    for(const line of t.split('\n')){const s=line.trim();if(!s||s[0]==='#'||/^[A-Z_]/.test(s)){if(s.startsWith('LUT_3D_SIZE'))n=+s.split(/\s+/)[1];continue;}const p=s.split(/\s+/);v.push(+p[0],+p[1],+p[2]);}
    return {n,t:Float32Array.from(v)};}));
  // trilinear through the cube (red changes fastest); the lights of the picture keep their own colour
  const forested=async(cv,wall=false)=>{if(!cv)return cv;const {n,t:T}=await loadForest(),m=document.createElement('canvas');m.width=cv.width;m.height=cv.height;
    const g=m.getContext('2d',{willReadFrequently:true});g.drawImage(cv,0,0);const W=m.width,H=m.height,d=g.getImageData(0,0,W,H),px=d.data,k=(n-1)/255,sR=3,sG=3*n,sB=3*n*n;
    // a wall keeps a real night sky: above the horizon, what is not brighter than the sky itself turns the plum of a fig at dusk (luminance
    // kept); the flowers in front of it keep their own colour; the ground below gets the green, gently
    const rowL=new Float32Array(H),skyL=new Float32Array(H);let hz=H;
    if(wall){for(let y=0;y<H;y++){let s=0;const sm=[];for(let x=0;x<W;x+=Math.max(1,W>>7)){const i=(y*W+x)*4,l=(0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2])/255;s+=l;sm.push(l);}
        rowL[y]=s/sm.length;sm.sort((a,b)=>a-b);skyL[y]=sm[sm.length>>1];}
      // the horizon: where the blue of the sky gives way to the green of the ground (the same scene gets the same split
      // in every picture); only when a picture has no such change, the row where the brightness changes the most
      const bg=new Float32Array(H);for(let y=0;y<H;y++){let s2=0,n2=0;for(let x=0;x<W;x+=Math.max(1,W>>7)){const i=(y*W+x)*4;s2+=px[i+2]-px[i+1];n2++;}bg[y]=s2/n2;}
      const sm=y=>{let s3=0,n3=0;for(let k=-3;k<=3;k++){const j=Math.min(H-1,Math.max(0,y+k*Math.max(1,H>>8)));s3+=bg[j];n3++;}return s3/n3;};
      let found=-1;for(let y=Math.round(H*.25);y<Math.round(H*.85);y++){if(sm(y-2)>2&&sm(y)<=0){found=y;break;}}
      if(found>0)hz=found;
      else{let best=-1;for(let y=Math.round(H*.22);y<Math.round(H*.85);y++){const dd=Math.abs(rowL[Math.min(H-1,y+2)]-rowL[Math.max(0,y-2)]);if(dd>best){best=dd;hz=y;}}}}
    const KS=[1.607,0.797,1.221],ss=t=>t*t*(3-2*t),cl=t=>Math.min(1,Math.max(0,t)),hf=hz/H;
    for(let y=0;y<H;y++){const reg=wall?1-ss(cl((y/H-(hf-0.04))/0.05)):0;
      for(let x=0;x<W;x++){const i=(y*W+x)*4,r=px[i]*k,gg=px[i+1]*k,b=px[i+2]*k,r0=Math.min(n-2,r|0),g0=Math.min(n-2,gg|0),b0=Math.min(n-2,b|0),fr=r-r0,fg=gg-g0,fb=b-b0;
        const lum=(0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2])/255,keep=ss(cl((lum-.4)/.3)),o=b0*sB+g0*sG+r0*sR;
        const sky=reg*(1-cl((lum-skyL[y]-0.04)/0.12));
        for(let c=0;c<3;c++){const a=o+c;
          const c00=T[a]+(T[a+sR]-T[a])*fr,c10=T[a+sG]+(T[a+sG+sR]-T[a+sG])*fr,c01=T[a+sB]+(T[a+sB+sR]-T[a+sB])*fr,c11=T[a+sB+sG]+(T[a+sB+sG+sR]-T[a+sB+sG])*fr;
          const v=((c00+(c10-c00)*fg)*(1-fb)+(c01+(c11-c01)*fg)*fb)*255,orig=px[i+c],gr=(orig*0.45+v*0.55)*(wall?[0.5,0.58,0.27][c]:1);   // a wall's ground: the dark forest green of the salad's table
          const rest=orig*reg+gr*(1-reg),skyc=lum*255*0.62*(0.35+0.65*KS[c]);
          const base=skyc*sky+rest*(1-sky);px[i+c]=base*(1-keep)+orig*keep;}}}
    g.putImageData(d,0,0);return m;};
  function gradedSrc(url,wall,maxW=1600){const graded=gradedSrc.cache||(gradedSrc.cache=new Map()),k=url+(wall?'|w':'|t')+'|'+maxW;   // (a declaration: the journey uses it before this line runs)
    if(!graded.has(k))graded.set(k,Art.loadImage(url).then(async img=>{
      const s=Math.min(1,maxW/img.width),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);return (await forested(c,wall)).toDataURL('image/jpeg',maxW>1600?0.93:0.86);}).catch(()=>url));return graded.get(k);}
  // wall pictures made wider than their file (a 6410 × 1150 wall letterboxed into a 3:1 picture) keep white bands on two
  // opposite sides: cut them off and zoom in a little (ZOOM), always with the picture's own proportions. Pictures that are
  // white by design (the Recepção wall, a white table) are left alone: only even bands on opposite sides count.

  function trimmedSrc(url,ZOOM=1.04){const cache=trimmedSrc.cache||(trimmedSrc.cache=new Map());
    if(!cache.has(url))cache.set(url,Art.loadImage(url).then(img=>{
      const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,s=Math.min(1,480/W),w=Math.max(1,Math.round(W*s)),h=Math.max(1,Math.round(H*s));
      const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
      const d=g.getImageData(0,0,w,h).data,white=i=>{const r=d[i],gg=d[i+1],b=d[i+2],lo=Math.min(r,gg,b);return lo>228&&Math.max(r,gg,b)-lo<30;};
      const rowW=y=>{let n=0;for(let x=0;x<w;x++)n+=white((y*w+x)*4);return n/w>0.94;},colW=x=>{let n=0;for(let y=0;y<h;y++)n+=white((y*w+x)*4);return n/h>0.94;};
      const run=(len,test,rev)=>{let n=0;while(n<len/2&&test(rev?len-1-n:n))n++;return n;};
      const even=(a,b,len)=>a>0&&b>0&&Math.min(a,b)/Math.max(a,b)>0.6&&(a+b)<len*0.6;
      let t=run(h,rowW),b=run(h,rowW,true),l=run(w,colW),r=run(w,colW,true);
      if(!even(t,b,h))t=b=0;if(!even(l,r,w))l=r=0;
      if(!(t||b||l||r))return url;
      // the band's soft edge goes too: one more line of the small picture, then the zoom
      const x0=(l?l+1:0)/s,y0=(t?t+1:0)/s,x1=W-(r?r+1:0)/s,y1=H-(b?b+1:0)/s,cw=(x1-x0)/ZOOM,ch=(y1-y0)/ZOOM,cx=(x0+x1)/2,cy=(y0+y1)/2;
      const k=Math.min(1,4096/cw),o=document.createElement('canvas');o.width=Math.round(cw*k);o.height=Math.round(ch*k);
      o.getContext('2d').drawImage(img,cx-cw/2,cy-ch/2,cw,ch,0,0,o.width,o.height);
      return new Promise(res=>o.toBlob(bl=>res(bl?URL.createObjectURL(bl):url),'image/jpeg',0.92));}).catch(()=>url));
    return cache.get(url);}
  // a picture's <img>: graded like the room when asked, then without white bands
  function showPic(im,url,wall,gr){im.src=url;(gr?gradedSrc(url,wall):Promise.resolve(url)).then(u=>wall?trimmedSrc(u):u).then(u=>{if(u!==im.src)im.src=u;});}
  // (a wall with the logo painted on it, w.semLogo, is never trimmed: the logo must stay exactly in place)
  // every wall of an act with its horizon on the same line (apresentacao/paredes-horizonte.json: the horizon of each
  // wall's picture, as a share of its height, and its act's line T, found once ahead). The picture is placed so its
  // horizon falls on T, zoomed in only as much as that needs (the walls of an act differ by little; at most ~1.2x); the
  // zoom keeps the Forma's place (the middle of Parede 02) where it is and takes the extra from the left
  const HORIZONTE=fetch('apresentacao/paredes-horizonte.json?v=2').then(r=>r.ok?r.json():{}).catch(()=>({}));
  async function wallAligned(R,src,sha){const hz=(await HORIZONTE)[sha.slice(0,16)];if(!hz)return R.compose(src,'parede','cover',.5);
    const img=await Art.loadImage(src),W=2564,H=460,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,FX=0.85,{h,T}=hz;
    const s0=Math.max(W/iw,H/ih),u0=W/(iw*s0),v0=H/(ih*s0),z=Math.min(1.3,Math.max(1,T*v0/h,(1-T)*v0/(1-h))),u=u0/z,v=v0/z;
    const a=Math.min(1-v,Math.max(0,h-T*v)),b=Math.min(1-u,Math.max(0,FX*(1-u)));
    const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,W,H);
    g.imageSmoothingQuality='high';g.drawImage(img,b*iw,a*ih,u*iw,v*ih,0,0,W,H);return c;}
  // walls whose picture already carries the Forma, whole (act I: the white wall, a video of the Forma turning)
  const FORMA_NA_PAREDE=['fcfbc887'],comForma=w=>w.semLogo||w.sha.startsWith('nova-')||FORMA_NA_PAREDE.some(h=>w.sha.startsWith(h));
  const wallCv=(R,w)=>cached('w|'+w.sha+'|'+(w.texto||'')+(w.inv?'|i':'')+(w.gr?'|f':''),async()=>{let cv=await wallAligned(R,comForma(w)?media.get(w.sha).image:await trimmedSrc(media.get(w.sha).image),w.sha);if(w.inv)cv=inverted(cv);if(w.gr)cv=await forested(cv,true);return w.texto?withText(cv,w.texto,w.inv?'#fff':'#000'):cv;});
  const tableCv=t=>cached('t|'+t.sha+(t.inv?'|i':'')+(t.gr?'|f':''),async()=>{let cv=await tableCanvas(media.get(t.sha));if(t.inv)cv=inverted(cv);return t.gr?forested(cv):cv;});
  // the matter of the Forma 3D in each act (room-bridge.js FINISH): the main matter of the scene
  var FORMA_MOVE={speed:0.5,fixo:true};   // in the room the Forma turns round all the time (a turn every ~12.5 s), in its place, same size
  const ACT_FINISH={forma:'cromo',couvert:'gelclaro',primeiro:'gelclaro',segundo:'gelclaro',terceiro:'gelclaro',quarto:'gelclaro',sobremesa:'cristal'};
  // the acts whose Forma is a Blender render with a BlenderKit material (modelos/formas/forma-<act>.png)
  // (only the Sobremesa: its Forma of crystals, asked for even though a still picture does not turn; every other act shows
  // the live Forma in its act's matter, turning)
  const FORMA_RENDER=['sobremesa'];
  // a table that is a video (media.video, e.g. the TouchDesigner salad table): its first frame goes on the table like any
  // picture, then the video plays there in a loop, one frame of the room at a time (R.paint), until another table comes
  const tv={url:null,el:null,prev:null,cv:null,raf:0,g:-1};
  // the table videos stay loaded once seen (up to 6): coming back to one, it goes on at once instead of loading again
  const vidPool=new Map();
  const dropVideo=v=>{if(!v||!v.pause)return;v.pause();};
  // another act on screen: the videos of the acts left behind stop loading (they went on filling the connection, and the
  // act coming up waited behind them); the act's own and the ones on show stay
  function poolTrim(keep){for(const [u,o] of [...vidPool]){if(keep.has(u)||o===tv.el||o===tv.prev||o.__twin===tv.el||o.__twin===tv.prev||o===wv.v)continue;
      vidPool.delete(u);for(const x of [o,o.__twin])if(x){x.pause();x.removeAttribute('src');x.load();}}}
  function poolVideo(url){let v=vidPool.get(url);if(v){vidPool.delete(url);vidPool.set(url,v);return v;}
    v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.src=url;vidPool.set(url,v);
    while(vidPool.size>10){const [u,o]=vidPool.entries().next().value;if(o===tv.el||o===tv.prev||o.__twin===tv.el||o.__twin===tv.prev)break;vidPool.delete(u);
      for(const x of [o,o.__twin])if(x){x.pause();x.removeAttribute('src');x.load();}}
    return v;}
  // a table video loops on two players of the same file taking turns: as one reaches its end, the other, waiting on its
  // first frame, starts. One player looping seeks back to the start there and stalls (a frame or two, then a second of
  // uneven frames while it catches up): the table seemed to catch at every turn of its loop
  const twinOf=v=>v.__twin||(v.__twin=Object.assign(document.createElement('video'),{muted:true,playsInline:true,preload:'auto',src:v.src}));
  function tableVideoStop(){cancelAnimationFrame(tv.raf);tv.raf=0;tv.run=null;dropVideo(tv.el);dropVideo(tv.prev);tv.el=tv.prev=null;tv.url=null;}
  // xfade (ms): the table on show fades into this one (both keep playing during the fade); from: the picture on the table
  // when it is not a video (a canvas), so a picture fades into a playing video too
  // at (s): where the video starts when it comes in (the wave from where it begins to rise)
  function tableVideo(R,url,g,wait,xfade=0,from=null,at=null){
    if(tv.url===url&&tv.el){tv.g=g;return;}   // the same table in the next step: it just goes on
    let old=xfade>0?from||(tv.el&&tv.el.readyState>=2?tv.el:null):null;
    cancelAnimationFrame(tv.raf);if(tv.prev!==old)dropVideo(tv.prev);if(tv.el!==old)dropVideo(tv.el);
    tv.prev=old;tv.url=url;tv.g=g;
    const v0=poolVideo(url),tw=twinOf(v0);let v=v0.__cur||v0;v0.loop=tw.loop=false;tv.el=v;if(at!=null)try{v.currentTime=at;}catch{}
    if(!tv.cv){tv.cv=document.createElement('canvas');tv.cv.width=2682;tv.cv.height=540;}
    const g2=tv.cv.getContext('2d'),t0=performance.now()+(wait||0),run={};tv.run=run;
    // a new picture exactly when the video has one (the browser says so: requestVideoFrameCallback), only while the room
    // is on screen: no frame drawn twice, none skipped, so the motion does not stutter
    let lastT=-1,lastAt=0,x0=0,fresh=true;const rvfc=!!v.requestVideoFrameCallback;
    if(rvfc)for(const el of [v0,tw]){const cb=()=>{if(tv.run!==run)return;if(el===v)fresh=true;el.requestVideoFrameCallback(cb);};el.requestVideoFrameCallback(cb);}
    const frameLoop=now=>{if(tv.run!==run)return;tv.raf=requestAnimationFrame(frameLoop);
      if(tv.g!==room.gen||document.hidden||frame.style.opacity!=='1'){if(!v.paused)v.pause();if(old&&old.pause&&!old.paused)old.pause();return;}
      // the turn of the loop: the other player, already on its first frame, takes over at the end
      const nx=v===v0?tw:v0,D=v.duration;
      if(D>2){if(!nx.__pronto&&v.currentTime>D-1.5){nx.__pronto=true;nx.pause();try{nx.currentTime=0;}catch{}}
        if(v.ended||v.currentTime>=D-0.04){
          if(nx.readyState>=2&&!nx.seeking){nx.play().catch(()=>{});v.pause();v.__pronto=false;v=nx;v0.__cur=v;tv.el=v;fresh=true;lastT=-1;}   // (its first frame, already there, at once)
          else if(v.ended){try{v.currentTime=0;}catch{}}}}
      if(v.paused)v.play().catch(()=>{});if(old&&old.paused)old.play().catch(()=>{});
      if(now<t0||(!rvfc&&now-lastAt<14))return;        // the picture's fade first, then the video
      if(old){if(v.readyState<2)return;if(!x0)x0=now;
        const k=Math.min(1,(now-x0)/xfade),e=k*k*(3-2*k);lastAt=now;
        g2.globalAlpha=1;g2.drawImage(old,0,0,2682,540);g2.globalAlpha=e;g2.drawImage(v,0,0,2682,540);g2.globalAlpha=1;R.paint('mesa',tv.cv);
        if(k>=1){dropVideo(old);if(tv.prev===old)tv.prev=null;old=null;}return;}
      if(v.readyState<2||(rvfc?!fresh:v.currentTime===lastT))return;
      fresh=false;lastT=v.currentTime;lastAt=now;g2.drawImage(v,0,0,2682,540);R.paint('mesa',tv.cv);};
    tv.raf=requestAnimationFrame(frameLoop);}
  // (off: SHOW_ACTS is empty, the tables pass with the walls in every act; kept for a later use)
  // ---- the act's video tables tell the story of its track: one table per phase of the music, from the darkest to the
  // brightest and back (media.brilho), as <track>.gatilhos.json says: each phase starts on a phrase of the track's
  // melodic layer (trilha-sonora/historia_mesa.py) and its table fades in slowly there. The table follows the track's
  // position: while it plays, and also when its bar is dragged. The walls go on with the roteiro's steps as before.
  const SHOW_ACTS={},SHOW_FADE_MS=6000,SHOW_SEEK_MS=1500;
  const shows=new Map(),trigs={};
  const trigOf=name=>trigs[name]||(trigs[name]=fetch('trilhas/ambientes/'+name+'.gatilhos.json?v=2',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null));
  function showOf(key){
    if(!SHOW_ACTS[key]||!acts.has(key))return null;
    const list=[...new Set(picsOf(acts.get(key).a).tables.map(t=>t.sha))].filter(sha=>media.get(sha)?.video)
      .sort((x,y)=>(media.get(x).brilho??99)-(media.get(y).brilho??99));
    if(list.length<2)return null;
    let sh=shows.get(key);
    if(!sh||sh.list.join()!==list.join()){sh={list,i:0,trig:null,fase:null};shows.set(key,sh);trigOf(SHOW_ACTS[key]).then(j=>{sh.trig=j;});}
    return sh;}
  async function showGo(key,sh,ms){const R=await roomReady;if(room.current!==key)return;
    const sha=sh.list[sh.i];tableVideo(R,media.get(sha).video,room.gen,0,ms||SHOW_FADE_MS);
    if(room.cur)room.cur.t={sha};const st=acts.get(key),ti=picsOf(st.a).tables.findIndex(x=>x.sha===sha);if(ti>=0){st.active.table=ti;markRoom(key);}}
  setInterval(()=>{const key=room.current,sh=key&&showOf(key);const cenas=sh?.trig?.cenas;if(!cenas||frame.style.opacity!=='1')return;
    const box=acts.get(key).s.querySelector('.player'),live=playing===box&&!audio.paused;
    if(!live&&document.body.classList.contains('editing'))return;   // while editing, a table picked by hand stays
    const t=playing===box?audio.currentTime:+(box?.querySelector('.scrub')?.value||0);
    let c=cenas[0];for(const x of cenas){if(x.inicio<=t)c=x;else break;}
    const i=Math.round(c.brilho*(sh.list.length-1));
    if(c!==sh.fase){sh.fase=c;const lab=box?.querySelector('.p-fase');if(lab){lab.textContent=c.fase;lab.title=c.fase+': '+c.elemento;}}
    if(i!==sh.i){sh.i=i;showGo(key,sh,live?SHOW_FADE_MS:SHOW_SEEK_MS);}},100);
  window.__mesaSeq=()=>{const sh=shows.get(room.current);return sh?{i:sh.i,lista:sh.list.map(x=>x.slice(0,8)),fase:sh.fase?.fase||null,naSala:(tv.url||'').split('/').pop().slice(0,8),fundindo:!!tv.prev}:null;};   // (reading only, for tests)
  // ---- act I follows its track. Without the voice: the white wall with the Forma. While the Forma speaks
  // (trilhas/ambientes/ambiente-01-forma.voz.json: where the voice is in the track, 33 s every 93.6 s) the wave walls
  // come out of the Forma, drawn here frame by frame: each one opens from the Forma in a soft, uneven circle whose edge is
  // a blur of white light, the next one opens over it the same way, and at the end of the phrase the white comes back
  // the same way, so the passage is one organic movement and not a cut. The Forma (3D, in front of the wall) is never
  // covered and never goes out: everything passes behind it.
  let vozFalas=null;fetch('trilhas/ambientes/ambiente-01-forma.voz.json?v=2').then(r=>r.ok?r.json():null).then(j=>{vozFalas=j&&j.falas;}).catch(()=>{});
  const fw={raf:0,seg:null,pics:null,loading:null,cv:null,m:null,last:0};
  function vozSeg(){
    if(!vozFalas||!(playing&&playing.dataset.key==='forma'&&!audio.paused))return null;
    const t=audio.currentTime;return vozFalas.find(([s,d])=>t>=s&&t<s+d)||null;}
  function fwPics(R){return fw.loading||(fw.loading=(async()=>{const fr=roomFrames(acts.get('forma').a);
    const cvs=await Promise.all(fr.map(f=>f.w?wallCv(R,f.w):null));
    fw.pics=cvs.map(c=>{if(!c)return null;const o=document.createElement('canvas');o.width=3205;o.height=575;
      const g=o.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(c,0,0,o.width,o.height);return o;});
    fw.cv=document.createElement('canvas');fw.cv.width=3205;fw.cv.height=575;fw.m=document.createElement('canvas');fw.m.width=3205;fw.m.height=575;
    return fw.pics;})());}
  const ease=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  // the distance from the Forma, as it stands on Parede 02 (its own silhouette: the chrome render, at the saved place and
  // size), on a 1602 x 288 grid of the two walls: the waves open along these contours, so they come out of the Forma
  // (from its ring and from inside it) and keep its shape, as the waves are drawn in the pictures
  function fwField(){return fw.field||(fw.field=Art.loadImage('apresentacao/sala/forma-cromo-frente.webp?v=3').then(img=>{
    const W=1602,H=288,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
    const o=logoNow||logoPos(),x0=W*4490/6410,PW=W-x0,side=2*o.size/0.9,lw=side/3.34*PW,lh=side/2*H,cx=x0+(0.5+o.pos)*PW,cy=(1-o.height)*H;
    g.drawImage(img,cx-lw/2,cy-lh/2,lw,lh);const a=g.getImageData(0,0,W,H).data,N=W*H,D=new Float32Array(N);
    // the exact distance (each point carries its nearest point of the Forma, passed on to its neighbours both ways), so
    // the contours far from the Forma stay round instead of turning into octagons
    const SX=new Int32Array(N).fill(-1),SY=new Int32Array(N).fill(-1);
    for(let k=0;k<N;k++)if(a[k*4+3]>90){SX[k]=k%W;SY[k]=(k/W)|0;}
    const tryN=(k,x,y,j)=>{if(SX[j]<0)return;const dx=x-SX[j],dy=y-SY[j],dd=dx*dx+dy*dy;
      if(SX[k]<0){SX[k]=SX[j];SY[k]=SY[j];return;}const ex=x-SX[k],ey=y-SY[k];if(dd<ex*ex+ey*ey){SX[k]=SX[j];SY[k]=SY[j];}};
    for(let pass=0;pass<2;pass++){
      for(let y=0;y<H;y++){for(let x=0;x<W;x++){const k=y*W+x;if(x>0)tryN(k,x,y,k-1);if(y>0){tryN(k,x,y,k-W);if(x>0)tryN(k,x,y,k-W-1);if(x<W-1)tryN(k,x,y,k-W+1);}}
        for(let x=W-2;x>=0;x--){const k=y*W+x;tryN(k,x,y,k+1);}}
      for(let y=H-1;y>=0;y--){for(let x=W-1;x>=0;x--){const k=y*W+x;if(x<W-1)tryN(k,x,y,k+1);if(y<H-1){tryN(k,x,y,k+W);if(x<W-1)tryN(k,x,y,k+W+1);if(x>0)tryN(k,x,y,k+W-1);}}
        for(let x=1;x<W;x++){const k=y*W+x;tryN(k,x,y,k-1);}}}
    for(let k=0;k<N;k++){if(SX[k]<0){D[k]=1e4;continue;}const dx=(k%W)-SX[k],dy=((k/W)|0)-SY[k];D[k]=Math.sqrt(dx*dx+dy*dy);}
    let mx=0;for(let k=0;k<N;k++)if(D[k]>mx)mx=D[k];
    const mk=document.createElement('canvas');mk.width=W;mk.height=H;const wk=document.createElement('canvas');wk.width=W;wk.height=H;
    return {W,H,D,max:mx,mk,wk,mi:mk.getContext('2d').createImageData(W,H),wi:wk.getContext('2d').createImageData(W,H)};}));}
  // ---- act I follows its track: the white wall with the Forma; while the Forma's voice speaks (ambiente-01-forma.voz.json)
  // its wave walls (the generated pictures) pass one after the other across the phrase, from the first to the last, with
  // soft fades, and the white comes back after it. The arrows go through the same walls by hand; after a click the room
  // stays on the chosen one for a while (roomHold) before following the track again.
  function formaStep(){
    if(!vozFalas||!(playing&&playing.dataset.key==='forma'&&!audio.paused))return 0;
    const t=audio.currentTime,n=room.count('forma')-1;if(n<1)return 0;
    for(const [s,d] of vozFalas)if(t>=s&&t<s+d)return 1+Math.min(n-1,Math.floor((t-s)/d*n));
    return 0;}
  setInterval(()=>{if(room.current!=='forma'||frame.style.opacity!=='1'||document.body.classList.contains('editing')||Date.now()<(room.pickUntil||0))return;
    const c=TRACK_WALL_VIDEO.forma;if(c&&!c.falhou){if(trackDriven('forma'))wallTrack('forma');if(wt.on&&wt.key==='forma')return;}   // the wall made for the track, waves and all
    const i=formaStep();if(i!==room.step){room.step=i;room.paint('forma',i,i?1600:1800);}},250);
  // a wall with the Forma painted on it: the 3D one leaves only once that wall has faded in (no blink)
  function logoWall(R,key,w,g,fade){const off=!!(w&&(w.semLogo||media.get(w.sha)?.video));if(off===!!room.logoOff)return;room.logoOff=off;
    Promise.resolve(off?new Promise(r=>setTimeout(r,(fade||0)+60)).then(()=>{if(g===room.gen&&room.logoOff)return R.setLogo?.(false);}):R.setLogo?.(true,{...logoPos(),...FORMA_MOVE,finish:ACT_FINISH[key]||'cromo',render:NOVAS[key]&&SEM_ALFA?'modelos/formas/forma-gel-'+key+'.webp':FORMA_RENDER.includes(key)?'modelos/formas/forma-'+key+'.webp?v=9':null,reflexo:REFLEXO[key]||null,video:NOVAS[key]&&!SEM_ALFA?'apresentacao/forma-gel-'+key+'.webm':null})).catch(()=>{});}
  // ---- with the act's track playing, the room follows it (act I has its own rule, formaStep: the voice) ----
  // As soon as the track plays the room goes to the act's own table, its "mesa padrão" (the first one, the video one),
  // and the roteiro's walls pass slowly along the track, each change on one of its sounds. Each distinct sound of the
  // track (<track>.passos.json, trilha-sonora/passos_trilha.py: the water's drop, pebble, bubble and wave; the salad's
  // breath, sprout, flower and bloom; the drops, phrases and beats of the others) brings another of the act's tables in
  // softly, the same table for the same kind of sound (a track with one kind: the tables in turn), and a few seconds later the room goes back to the mesa padrão. An
  // act with a single table (the Sobremesa) does it with its walls. The Salada's night follows the track's phases
  // (Começo: the petals, Desenvolvimento at 2:53: the kaleidoscope) with no other table; its day starts on the Expansão
  // (5:09) with the moss table as its mesa padrão.
  const ACC_IN=1000,ACC_HOLD=4.5,ACC_OUT=2600,WALL_FADE=2200,LEAD=0.15;   // ms, s, ms, ms, s (a picture takes ~0.15 s to be ready)
  let saladaCenas=null;fetch('trilhas/ambientes/ambiente-03-materia.gatilhos.json?v=2').then(r=>r.ok?r.json():null).then(j=>{saladaCenas=j&&j.cenas;}).catch(()=>{});
  const trackDriven=key=>playing&&playing.dataset.key===key&&!audio.paused;
  function saladaStep(){const c=saladaCenas;if(!c||c.length<3)return null;const t=audio.currentTime;
    return t<c[1].inicio?0:t<c[2].inicio?1:null;}
  const passos={},passosOf=key=>{const f=soundOf(key)?.file;if(!f)return null;const name=f.split('/').pop().replace(/\.ogg$/,'');
    if(!(name in passos)){passos[name]=null;fetch('trilhas/ambientes/'+name+'.passos.json?v=3').then(r=>r.ok?r.json():null).then(j=>{passos[name]=j;}).catch(()=>{});}
    return passos[name];};
  // an act's mesa padrão and the tables its sounds bring, when not the roteiro's own (its first table, the others):
  // the Couvert stays on the leaves (animated) and the shine of each sound is the pearls (animated), for now. A kind of
  // sound can have its own table (TRACK_KINDS), shown for as long as that sound lasts (passos.json duracoes): in the
  // Entrada the wave video plays while the sea's wave is heard, on a still table the rest of the time
  const TRACK_WALLS={couvert:['fe92a050']},TRACK_BASE={couvert:'7cc4606c',primeiro:'f6d050b6'},TRACK_ACCENTS={couvert:['84b4fb4b'],primeiro:['10c130bc','1b56f50d']},TRACK_KINDS={},TRACK_KIND_AT={};
  function trackPlan(key){const fr=roomFrames(acts.get(key).a);if(!fr.length)return null;
    const k=NIGHT_TABLES[key]?Math.min(NIGHT_TABLES[key].length,fr.length-1):0,day=fr.slice(k);
    const uniq=(get,same)=>day.map(get).filter(Boolean).filter((x,i,arr)=>arr.findIndex(y=>same(x,y))===i);
    const all=uniq(f=>f.w,(x,y)=>x.sha===y.sha&&(x.texto||'')===(y.texto||'')),tables=uniq(f=>f.t,(x,y)=>x.sha===y.sha);
    const keep=TRACK_WALLS[key]&&all.filter(x=>TRACK_WALLS[key].some(h=>x.sha.startsWith(h))),walls=keep&&keep.length?keep:all;
    const find=h=>tables.find(x=>x.sha.startsWith(h)),base=(TRACK_BASE[key]&&find(TRACK_BASE[key]))||tables[0]||null;
    const kinds=Object.fromEntries(Object.entries(TRACK_KINDS[key]||{}).map(([kd,h])=>[kd,find(h)]).filter(e=>e[1])),own=Object.values(kinds);
    const accents=TRACK_ACCENTS[key]?TRACK_ACCENTS[key].map(find).filter(Boolean):tables.filter(x=>x!==base&&!own.includes(x));
    return {night:fr.slice(0,k),walls,base,accents,kinds,cycle:[base,...accents].filter(Boolean),dayAt:k?(saladaCenas?.[2]?.inicio??0):0};}
  const pick=(key,kind,item)=>{const st=acts.get(key),i=picsOf(st.a)[kind].findIndex(x=>x.sha===item.sha);if(i>=0){st.active[kind==='walls'?'wall':'table']=i;markRoom(key);}};
  async function trackWall(key,w,fade){const tw=TRACK_WALL_VIDEO[key];if(tw?.livre&&!tw.semForma)return;   // (its wall is its track's video, always: never an older one between)
    const R=await roomReady,g=room.gen,wc=await wallCv(R,w);if(g!==room.gen||room.current!==key)return;
    if(!(wt.on&&wt.key===key)){R.show('parede',wc,fade);wallVideo(R,w,g,(fade||0)+60);}logoWall(R,key,w,g,fade);room.cur={...room.cur,key,wc,w};ringsStart(key,fade);pick(key,'walls',w);}
  async function trackTable(key,t,fade,at=null){const R=await roomReady,g=room.gen,vid=media.get(t.sha)?.video,from=tv.el?null:room.cur?.tc;
    const tc=vid&&(tv.el||from)?null:await tableCv(t);if(g!==room.gen||room.current!==key)return;
    if(vid&&(tv.el||from))tableVideo(R,vid,g,0,fade,from,at);                 // into a video: both play (or the picture) during the fade
    else{R.show('mesa',tc,fade);if(vid)tableVideo(R,vid,g,fade+60,0,null,at);else tableVideoStop();}
    room.cur={...room.cur,key,t,tc:tc||room.cur?.tc};pick(key,'tables',t);}
  // ---- water at the edge of the table (TRACK_WASH): the Entrada's sea. Always there while the act is in the room
  // (on a still table): the water of the wave video (apresentacao/onda-entrada.mp4, guias-formato-sala/onda_vai_volta.py:
  // the water coming in, slowing to a stop and going back the same way, T seconds, in a loop) lies over the far side of
  // the table with a soft wavy edge, a light sea tint and a line of foam, and comes and goes with the clip. Each wave of
  // the track (passos.json, "onda") starts the clip again, played so that it lasts about as long as the wave heard plus
  // its ebb, and the water comes over the whole table: up there, hidden under it, the visual changes (the next table and
  // the next wall of the act), and the water draws back over the new one. A change of table under it cross-fades.
  const TRACK_WASH={primeiro:{onda:{url:'apresentacao/onda-entrada.mp4?v=3',T:16,rest:0.12,idle:0.14,wave:0.84}}};
  const wash={raf:0,v:null,key:null,cfg:null,ev:null,base:null,prev:null,bt:0};
  // (a wave while the last one still runs waits for it; a wave starts from where the water is, on its way up: the clip
  // goes there and back the same way, so the picture at tau and at 1 - tau is the same one)
  function washRun(key,cfg,dur,peak){if(wash.key!==key||!wash.v||wash.ev)return;const v=wash.v,D=Math.min(20,Math.max(10,dur+8));
    const tau=(v.currentTime%cfg.T)/cfg.T,t0=tau<0.5?tau:1-tau;
    wash.ev={rate:Math.min(1.6,Math.max(0.8,cfg.T*(1-t0)/D)),peak,at:performance.now()};v.loop=false;   // the wave ends with the clip
    if(Math.abs(t0*cfg.T-v.currentTime)>0.2)try{v.currentTime=t0*cfg.T;}catch{}v.playbackRate=wash.ev.rate;v.play().catch(()=>{});}
  function washStart(key){const cfg=Object.values(TRACK_WASH[key])[0],W=2682,H=540;washStop();
    if(!wash.cv){wash.cv=document.createElement('canvas');wash.cv.width=W;wash.cv.height=H;wash.layer=document.createElement('canvas');wash.layer.width=W;wash.layer.height=H;
      wash.mask=document.createElement('canvas');wash.mask.width=W>>2;wash.mask.height=H>>2;}
    const v=poolVideo(cfg.url);v.loop=true;v.playbackRate=1;v.play().catch(()=>{});Object.assign(wash,{key,cfg,v,ev:null,base:null,prev:null,lastT:0,was:false});
    const ph=Math.random()*6.28,c=wash.cv.getContext('2d'),l=wash.layer.getContext('2d'),m=wash.mask.getContext('2d'),mw=wash.mask.width,mh=wash.mask.height;
    const front=(x,r,now)=>mh*r+mh*(0.035+0.05*r)*Math.sin(x/mw*9+ph+now/900)+mh*0.02*Math.sin(x/mw*23+ph*1.7-now/600);
    const loop=async now=>{wash.raf=requestAnimationFrame(loop);const R=await roomReady;
      if(room.current!==key||frame.style.opacity!=='1'||document.body.classList.contains('editing')){return;}
      if(tv.el){wash.was=true;return;}                                   // a video table: it paints itself
      const tc=room.cur?.tc;if(!tc||v.readyState<2)return;
      if(tc!==wash.base){wash.prev=wash.was?tv.cv:wash.base;wash.base=tc;wash.bt=now;wash.was=false;}
      const tau=(v.currentTime%cfg.T)/cfg.T;
      if(wash.ev&&!v.seeking&&(v.ended||v.currentTime>=cfg.T-0.05)){wash.ev=null;v.loop=true;v.playbackRate=1;try{v.currentTime=0;}catch{}v.play().catch(()=>{});}   // the wave is over: back to the calm coming and going
      if(wash.ev?.peak&&!v.seeking&&v.currentTime>=cfg.T*0.5){const f=wash.ev.peak;wash.ev.peak=null;f();}   // the water at the top: the visual changes under it
      const e=wash.ev?Math.min(1,(now-wash.ev.at)/1500):0,reach=cfg.rest+(cfg.idle+cfg.wave*e*e*(3-2*e))*Math.sin(Math.PI*tau);
      m.clearRect(0,0,mw,mh);m.filter='blur(3px)';m.fillStyle='#fff';m.beginPath();m.moveTo(0,-4);
      for(let x=0;x<=mw;x+=4)m.lineTo(x,front(x,reach,now));m.lineTo(mw,-4);m.closePath();m.fill();m.filter='none';
      l.globalCompositeOperation='source-over';l.globalAlpha=1;l.clearRect(0,0,W,H);l.drawImage(v,0,0,W,H);
      l.globalCompositeOperation='source-atop';l.fillStyle='rgba(110,190,200,0.22)';l.fillRect(0,0,W,H);            // a light sea tint
      l.globalCompositeOperation='destination-in';l.drawImage(wash.mask,0,0,W,H);l.globalCompositeOperation='source-over';
      const k=wash.prev?Math.min(1,(now-wash.bt)/900):1;
      c.globalAlpha=1;c.drawImage(k<1?wash.prev:tc,0,0,W,H);if(k<1){c.globalAlpha=k;c.drawImage(tc,0,0,W,H);}else wash.prev=null;
      c.globalAlpha=0.95;c.drawImage(wash.layer,0,0);
      // foam along the edge: a bright line and a fainter one just behind it, strongest while the water moves
      const moving=0.55+0.45*Math.abs(Math.cos(Math.PI*tau));c.strokeStyle='#fff';c.filter='blur(4px)';
      for(const [dy,w,a] of [[0,9,0.55],[-10,5,0.25]]){c.globalAlpha=a*moving;c.lineWidth=w;c.beginPath();
        for(let x=0;x<=mw;x+=4){const y=front(x,reach,now)*4+dy;x?c.lineTo(x*4,y):c.moveTo(0,y);}c.stroke();}
      c.filter='none';c.globalAlpha=1;R.paint('mesa',wash.cv);};
    wash.raf=requestAnimationFrame(loop);}
  function washStop(){cancelAnimationFrame(wash.raf);wash.raf=0;if(wash.v)wash.v.pause();wash.key=null;wash.ev=null;}
  setInterval(()=>{const key=room.current,on=key&&TRACK_WASH[key];if(on&&wash.key!==key)washStart(key);else if(!on&&wash.key)washStop();},250);
  // ---- wall clips with the track (apresentacao/paredes-clipes.json, made by pacote-seedance/ferramentas/importar.py
  // from the videos generated in Seedance). On a wall that has one, a sound of the kinds it answers to plays its clip,
  // started early so the clip's beat (the drop hitting the water, the gel moving) falls on the sound. A clip starts on
  // its wall's own picture and ends on it again, or on the next wall (the gel moves into its next position, and that
  // wall stays). While one plays the wall does not change otherwise.
  let CLIPES={};fetch('apresentacao/paredes-clipes.json?v=6',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{CLIPES=j||{};}).catch(()=>{});
  const wclip={raf:0,on:false,cv:null,tmp:null,layers:[],g:-1,key:null};
  const clipFor=(key,w,kind)=>w&&!(TRACK_WALL_VIDEO[key]&&!TRACK_WALL_VIDEO[key].falhou)&&(CLIPES[key]||[]).find(c=>w.sha.startsWith(c.parede)&&c.tipos.includes(kind));
  function wallClipStop(){cancelAnimationFrame(wclip.raf);wclip.raf=0;for(const L of wclip.layers)L.v.pause();wclip.layers=[];wclip.on=false;}
  // Several clips can play at once (a drop falling while the spheres are lit), each over the wall as it is at that
  // moment (its video going on underneath, or its picture). How each one goes on the wall:
  // - whole (the default): the whole wall, faded in over entra s and out over sai s, so it comes and goes without a cut;
  //   with acesa (s), it stays until the sound's own length is over (and at least acesa s), then fades out;
  // - with regiao ([x0, x1, y0, y1], shares of the wall): only there, its edge soft (pena, px);
  // - luz: only the light of the effect, added to the wall (a drop's splash and its glowing rings on black), at a place
  //   of its list (lugares: x, y where its point goes, s its size, f mirrored) that changes every time it plays,
  //   tamanho / ponto: its size as a share of the wall and the point of it (the impact) that goes to that place
  const clipMasks=new Map();
  function clipMask(r,p){const k=r.join()+'|'+p;let m=clipMasks.get(k);if(m)return m;
    m=document.createElement('canvas');m.width=2564;m.height=460;const g=m.getContext('2d');g.filter='blur('+p+'px)';g.fillStyle='#fff';
    g.fillRect(r[0]*2564,r[2]*460,(r[1]-r[0])*2564,(r[3]-r[2])*460);clipMasks.set(k,m);return m;}
  async function wallClip(key,c,from,done,opt={}){const R=await roomReady,g=room.gen;
    if(wclip.layers.length&&(wclip.g!==g||wclip.key!==key))wallClipStop();wclip.g=g;wclip.key=key;
    const v=poolVideo(c.clip);if(wclip.layers.some(L=>L.v===v))return;   // (that clip is already on)
    v.loop=false;v.playbackRate=1;if(Math.abs(v.currentTime-from)>0.05)try{v.currentTime=Math.max(0,from);}catch{}v.play().catch(()=>{});
    if(!wclip.cv){wclip.cv=document.createElement('canvas');wclip.cv.width=2564;wclip.cv.height=460;}
    const L={v,c,done,fresh:true,fim:opt.fim??null,lugar:opt.lugar||null,mk:c.regiao?clipMask(c.regiao,c.pena||40):null};
    if(L.mk&&!wclip.tmp){wclip.tmp=document.createElement('canvas');wclip.tmp.width=2564;wclip.tmp.height=460;}
    if(v.requestVideoFrameCallback){const cb=()=>{L.fresh=true;if(wclip.layers.includes(L))v.requestVideoFrameCallback(cb);};v.requestVideoFrameCallback(cb);}
    wclip.layers.push(L);wclip.layers.sort((a,b)=>(a.c.luz?1:0)-(b.c.luz?1:0));wclip.on=true;   // the lights over the rest
    if(wclip.raf)return;
    const gx=wclip.cv.getContext('2d'),W=2564,H=460;
    const loop=()=>{wclip.raf=0;if(!wclip.layers.length){wclip.on=false;return;}
      if(wclip.g!==room.gen||room.current!==wclip.key){wallClipStop();return;}wclip.raf=requestAnimationFrame(loop);
      let fresh=false;
      for(const L of [...wclip.layers]){const d=L.v.duration||L.c.duracao,end=L.fim!=null?Math.min(d,L.fim):d;
        if(L.v.ended||L.v.currentTime>=end-0.04){L.v.pause();wclip.layers.splice(wclip.layers.indexOf(L),1);L.done&&L.done();continue;}
        if(L.fresh&&L.v.readyState>=2&&!L.v.seeking){L.fresh=false;fresh=true;}}
      if(!wclip.layers.length){wclip.on=false;return;}
      if(!fresh)return;
      const under=wv.v&&wv.v.readyState>=2?wv.v:room.cur?.wc||null;
      gx.globalAlpha=1;gx.globalCompositeOperation='source-over';if(under)gx.drawImage(under,0,0,W,H);
      for(const L of wclip.layers){const v=L.v,c=L.c;if(v.readyState<2)continue;
        const d=v.duration||c.duracao,end=L.fim!=null?Math.min(d,L.fim):d,tt=v.currentTime;
        const k=Math.max(0,Math.min(1,c.entra?tt/c.entra:1,c.sai?(end-tt)/c.sai:1)),e=k*k*(3-2*k);
        if(c.luz){const p=L.lugar||{x:c.ponto[0],y:c.ponto[1],s:1},sw=c.tamanho[0]*W*(p.s||1),sh=c.tamanho[1]*H*(p.s||1);
          gx.save();gx.globalCompositeOperation='lighter';gx.globalAlpha=e;gx.translate(p.x*W,p.y*H);if(p.f)gx.scale(-1,1);
          gx.drawImage(v,-c.ponto[0]*sw,-c.ponto[1]*sh,sw,sh);gx.restore();continue;}
        let src=v;if(L.mk){const t=wclip.tmp.getContext('2d');t.globalCompositeOperation='copy';t.drawImage(v,0,0,W,H);t.globalCompositeOperation='destination-in';t.drawImage(L.mk,0,0);t.globalCompositeOperation='source-over';src=wclip.tmp;}
        gx.globalAlpha=under?e:1;gx.drawImage(src,0,0,W,H);}
      gx.globalAlpha=1;gx.globalCompositeOperation='source-over';R.paint('parede',wclip.cv);};
    wclip.raf=requestAnimationFrame(loop);}
  // a wall that is a video (sent from the computer, media.video): its first frame is the wall's picture, shown with the
  // fade like any other, then the video plays there in a loop, cropped like a picture (cover, centred), one frame of the
  // room at a time. A wall's clip (wallClip) plays over it, and it goes on after
  var wv={url:null,v:null,raf:0,cv:null,g:-1};
  function wallVideoStop(){cancelAnimationFrame(wv.raf);wv.raf=0;if(wv.v)wv.v.pause();wv.v=null;wv.url=null;}
  function wallVideo(R,w,g,wait){const url=w&&media.get(w.sha)?.video;if(!url){wallVideoStop();return;}
    if(wv.url===url&&wv.v){wv.g=g;return;}   // the same wall in the next step: it just goes on (and plays again if it was held)
    wallVideoStop();
    const v=poolVideo(url);v.loop=true;wv.v=v;wv.url=url;wv.g=g;try{v.currentTime=0;}catch{}
    if(!wv.cv){wv.cv=document.createElement('canvas');wv.cv.width=2564;wv.cv.height=460;}
    const gx=wv.cv.getContext('2d'),t0=performance.now()+(wait||0);let fresh=true;
    if(v.requestVideoFrameCallback){const cb=()=>{fresh=true;if(wv.v===v)v.requestVideoFrameCallback(cb);};v.requestVideoFrameCallback(cb);}
    const loop=now=>{if(wv.v!==v)return;wv.raf=requestAnimationFrame(loop);
      if(wv.g!==room.gen||document.hidden||frame.style.opacity!=='1'||wt.on){if(!v.paused)v.pause();return;}   // (the wall made for the track is on: this one waits, paused, not decoding under it)
      if(v.paused)v.play().catch(()=>{});
      if(now<t0||wclip.on||v.readyState<2||!fresh)return;fresh=false;
      const iw=v.videoWidth||2564,ih=v.videoHeight||460,k=Math.max(2564/iw,460/ih),sw=2564/k,sh=460/k;
      gx.drawImage(v,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,2564,460);R.paint('parede',wv.cv);};
    wv.raf=requestAnimationFrame(loop);}
  // ---- a wall made for its whole track (TRACK_WALL_VIDEO, guias-formato-sala/parede_trilha.py: the base, the lights
  // and the drops already in their places, from the first second of the track to the last), in files of one minute.
  // With that track on, the wall is that video at the track's own time: the minute it is in, at the same second (a
  // small drift is taken up by its speed, a big one by a jump), the next minute loaded ahead. Paused, it stays on its
  // picture; it lets go when the room leaves the act or another track plays.
  // (act I: guias-formato-sala/parede_forma.py, the white wall with the Forma turning, its waves on each phrase of the voice)
  // (TRACK_WALL_VIDEO: declared above, with ONLY_WALL)
  var wt={on:false,key:null,els:[],raf:0,cv:null};
  function wtEl(c,i){const src=c.base+String(i).padStart(3,'0')+'.mp4?v='+c.v,e=wt.els.find(x=>x.src===src);if(e)return e.v;   // (by its file: each act's minute 0 is its own)
    const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.loop=c.n===1;v.src=src;
    v.addEventListener('error',()=>{c.falhou=true;},{once:true});   // (not there: the wall goes back to its pictures and clips)
    wt.els.push({i,src,v});while(wt.els.length>3){const o=wt.els.shift();o.v.pause();o.v.removeAttribute('src');o.v.load();}return v;}
  function wallTrackStop(){cancelAnimationFrame(wt.raf);wt.raf=0;for(const e of wt.els)e.v.pause();wt.on=false;wt.key=null;}
  async function wallTrack(key){const c=TRACK_WALL_VIDEO[key];if(!c||c.falhou||(wt.on&&wt.key===key))return;
    const R=await roomReady;wallTrackStop();wallClipStop();wt.on=true;wt.key=key;
    if(c.semForma){room.logoOff=true;R.setLogo?.(false);}   // the Forma turns in the video itself
    if(!wt.cv){wt.cv=document.createElement('canvas');wt.cv.width=2564;wt.cv.height=460;}
    const gx=wt.cv.getContext('2d');let last=null,aT=-1,aAt=0,first=true,free=null,fAt=performance.now();
    // (livre: without its track playing the wall runs on its own, from where it was, round again at the end, as the
    // table does: the act shows its wall before the track is played)
    const loop=()=>{if(!wt.on||wt.key!==key)return;wt.raf=requestAnimationFrame(loop);
      const ours=(audio.src||'').includes(c.trilha);
      if(room.current!==key||(!ours&&!c.livre)||c.falhou){const back=c.semForma&&room.current===key;wallTrackStop();
        if(back){room.step=0;room.paint(key,0,1200);}return;}   // still in the act: its own wall (and the 3D Forma) again
      const now=performance.now(),sync=ours&&!audio.paused,dur=c.n*c.seg;
      if(!c.livre||sync)free=null;else{free=free==null?(ours?audio.currentTime:0):(free+(now-fAt)/1000)%dur;}fAt=now;
      const t=free==null?(c.n===1?audio.currentTime%dur:audio.currentTime):free,i=Math.max(0,Math.min(c.n-1,Math.floor(t/c.seg))),v=wtEl(c,i),lt=t-i*c.seg;
      if(i+1<c.n&&lt>c.seg-10)wtEl(c,i+1);else if(free!=null&&i+1===c.n&&lt>c.seg-10)wtEl(c,0);   // the next minute, ready before its time
      for(const e of wt.els)if(e.v!==v&&!e.v.paused)e.v.pause();
      // the track not moving (paused, or still loading: playing but its time stands) holds the wall on its picture
      if(t!==aT){aT=t;aAt=now;}const still=free==null&&(audio.paused||now-aAt>180);
      if(still){if(!v.paused)v.pause();}else if(v.paused)v.play().catch(()=>{});
      if(v.readyState>=1&&!v.seeking){let dt=lt-v.currentTime;if(c.n===1&&Math.abs(dt)>dur/2)dt-=Math.sign(dt)*dur;   // (one file going round: the short way)
        // on its own (no track to follow) the clock follows the video: a video that waits a moment for its data goes on from
        // there instead of jumping ahead to catch up (the jump read as a stutter); with the track, it is brought to the
        // track's time, by its speed, jumping only when far off
        if(free!=null&&Math.abs(dt)<1.5){v.playbackRate=1;if(!v.paused&&v.readyState>=2&&!v.ended)free=i*c.seg+v.currentTime;}
        else if(Math.abs(dt)>0.6||(still&&Math.abs(dt)>0.04))try{v.currentTime=lt;}catch{}
        else v.playbackRate=Math.max(0.92,Math.min(1.08,1+dt*0.8));}
      if(v.readyState<2||v.seeking)return;
      const at=v.src+Math.floor(v.currentTime*(c.fps||24)+0.01);if(at===last)return;last=at;   // (only a new frame of the video goes to the room)
      gx.drawImage(v,0,0,2564,460);if(first){first=false;R.show('parede',wt.cv,1200);}else R.paint('parede',wt.cv);};   // in with a fade, then frame by frame
    wt.raf=requestAnimationFrame(loop);}
  // ---- the table made for its whole track (TRACK_TABLE_VIDEO, guias-formato-sala/mesa_trilha.py: the water, and the
  // pearl table lighting with the wall's lights and gathering into the plates as they go out, from the wall's own plan),
  // in files of one minute, played at the track's own time like the wall above. While it is on, the sounds do not
  // change the table.
  // (TRACK_TABLE_VIDEO: declared above, with ONLY_WALL)
  window.__mesaTrilha=()=>({on:mt.on,key:mt.key,t:mt.els.find(e=>!e.v.paused)?.v.currentTime??null});   // (reading only, for tests)
  var mt={on:false,key:null,els:[],raf:0,cv:null};
  function mtEl(c,i){const src=c.base+String(i).padStart(3,'0')+'.mp4?v='+c.v,e=mt.els.find(x=>x.src===src);if(e)return e.v;
    const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=src;
    v.addEventListener('error',()=>{c.falhou=true;},{once:true});
    mt.els.push({i,src,v});while(mt.els.length>3){const o=mt.els.shift();o.v.pause();o.v.removeAttribute('src');o.v.load();}return v;}
  function tableTrackStop(){cancelAnimationFrame(mt.raf);mt.raf=0;for(const e of mt.els)e.v.pause();mt.on=false;mt.key=null;}
  async function tableTrack(key){const c=TRACK_TABLE_VIDEO[key];if(!c||c.falhou||(mt.on&&mt.key===key))return;
    const R=await roomReady;tableTrackStop();mt.on=true;mt.key=key;
    if(!mt.cv){mt.cv=document.createElement('canvas');mt.cv.width=2682;mt.cv.height=540;}
    const gx=mt.cv.getContext('2d');let last=null,aT=-1,aAt=0,first=true,free=null,fAt=performance.now();
    // with the track playing, the track's time; without it the table runs on its own (from where it was), round again
    // at the end
    const loop=()=>{if(!mt.on||mt.key!==key)return;mt.raf=requestAnimationFrame(loop);
      if(room.current!==key||c.falhou){tableTrackStop();if(room.current===key)ts.key=null;return;}   // (the act's own table again)
      const now=performance.now(),ours=(audio.src||'').includes(c.trilha),sync=ours&&!audio.paused,dur=c.n*c.seg;
      if(sync)free=null;else{free=free==null?(ours?audio.currentTime:0):(free+(now-fAt)/1000)%dur;}fAt=now;
      const t=sync?audio.currentTime:free,i=Math.max(0,Math.min(c.n-1,Math.floor(t/c.seg))),v=mtEl(c,i),lt=t-i*c.seg;
      if(i+1<c.n&&lt>c.seg-10)mtEl(c,i+1);else if(!sync&&i+1===c.n&&lt>c.seg-10)mtEl(c,0);
      for(const e of mt.els)if(e.v!==v&&!e.v.paused)e.v.pause();
      if(t!==aT){aT=t;aAt=now;}const still=sync&&now-aAt>180;
      if(still){if(!v.paused)v.pause();}else if(v.paused)v.play().catch(()=>{});
      if(v.readyState>=1&&!v.seeking){const dt=lt-v.currentTime;
        // on its own (no track to follow) the clock follows the video: a video that waits a moment for its data goes on from
        // there instead of jumping ahead to catch up (the jump read as a stutter); with the track, it is brought to the
        // track's time, by its speed, jumping only when far off
        if(free!=null&&Math.abs(dt)<1.5){v.playbackRate=1;if(!v.paused&&v.readyState>=2&&!v.ended)free=i*c.seg+v.currentTime;}
        else if(Math.abs(dt)>0.6||(still&&Math.abs(dt)>0.04))try{v.currentTime=lt;}catch{}
        else v.playbackRate=Math.max(0.92,Math.min(1.08,1+dt*0.8));}
      if(v.readyState<2||v.seeking)return;
      const at=v.src+Math.floor(v.currentTime*24+0.01);if(at===last)return;last=at;   // (only a new frame of the video: 24 a second, not one per screen refresh)
      gx.drawImage(v,0,0,2682,540);
      if(first){first=false;tableVideoStop();R.ripplesClear?.(400,'prato');R.show('mesa',mt.cv,1200);}else R.paint('mesa',mt.cv);};   // in with a fade, then frame by frame
    mt.raf=requestAnimationFrame(loop);}
  const ts={key:null};   // the room with the track: its act, plan, last track time, next sound, what is on show
  function trackStart(key,t){const P=trackPlan(key),J=passosOf(key);if(!P)return false;
    Object.assign(ts,{key,P,t,J:J||null,night:false,next:(J?.tempos||[]).findIndex(x=>x>t+LEAD),wall:null,table:null,until:0,kinds:{},occ:0,cyc:0,clips:new Set(),clipN:{},fresh:true});if(ts.next<0)ts.next=1e9;
    for(const x of [P.base,...P.accents,...Object.values(P.kinds),...P.night.map(f=>f.t)])if(x&&media.get(x.sha)?.video)poolVideo(media.get(x.sha).video);   // ready to come in at once
    return true;}
  const wallIdx=(P,t,dur)=>P.walls.length?Math.min(P.walls.length-1,Math.floor(Math.max(0,t-P.dayAt)/Math.max(1,dur-P.dayAt)*P.walls.length)):-1;
  setInterval(()=>{const key=room.current;
    // (a picture chosen by hand, arrows or a click on it, holds the track for a while; turning the room or changing the
    // view does not)
    if(!key||key==='forma'||!trackDriven(key)||frame.style.opacity!=='1'||document.body.classList.contains('editing')||Date.now()<(room.pickUntil||0)){ts.key=null;return;}
    const t=audio.currentTime,J=passosOf(key);
    if(ts.key!==key||t<ts.t-0.5||t>ts.t+2){if(!trackStart(key,t))return;}   // play, a seek, back from a hold: start from here
    if(J&&!ts.J){ts.J=J;ts.next=J.tempos.findIndex(x=>x>t+LEAD);if(ts.next<0)ts.next=1e9;}   // its sounds arrived after the play
    ts.t=t;const P=ts.P,dur=soundOf(key)?.duration||900,fade=ts.fresh?FADE_MS:WALL_FADE;
    if(TRACK_WALL_VIDEO[key]&&!audio.paused)wallTrack(key);   // the wall made for this track takes over
    if(TRACK_TABLE_VIDEO[key]&&!TRACK_TABLE_VIDEO[key].falhou&&!audio.paused)tableTrack(key);   // the table made for this track takes over
    const tableOwn=()=>mt.on&&mt.key===key;
    const wall=x=>{if(x&&x!==ts.wall&&!wclip.on){ts.wall=x;trackWall(key,x,fade);}},table=(x,ms)=>{if(tableOwn())return;if(x&&x!==ts.table){ts.table=x;trackTable(key,x,ms);}};
    // the sounds reached now (one that is already over a second old, after a jump, is let go)
    const T=J?.tempos||[];
    // the wall's clip for a sound coming: it starts its beat early, so the beat falls on the sound
    // (several can be on at once; each place of a clip's list in turn; a lasting sound keeps its clip on as long)
    if(J&&!ts.night){for(let j=ts.next;j<T.length&&T[j]<=t+10;j++){if(ts.clips.has(j))continue;const c=clipFor(key,ts.wall,J.tipos[j]);
      if(c&&t>=T[j]-c.batida-LEAD&&t<T[j]){ts.clips.add(j);const nw=c.depois&&P.walls.find(x=>x.sha.startsWith(c.depois));
        const n=ts.clipN[c.tipos[0]]=(ts.clipN[c.tipos[0]]??-1)+1,lugar=c.lugares?.length?c.lugares[n%c.lugares.length]:null;
        const fim=c.acesa!=null?Math.max(c.acesa,c.batida+(J.duracoes?.[j]||0))+(c.sai||0):null;
        wallClip(key,c,t+LEAD-(T[j]-c.batida),()=>{if(ts.key!==key)return;if(nw){ts.wall=nw;trackWall(key,nw,250);}else if(!wv.v&&!wclip.on&&room.cur?.wc)roomReady.then(R=>R.show('parede',room.cur.wc,250));},{lugar,fim});}}}
    let snd=-1;while(ts.next<T.length&&T[ts.next]<=t+LEAD){if(T[ts.next]>t-1)snd=ts.next;ts.next++;}
    if(P.night.length){const i=saladaStep();if(i!=null){const f=P.night[Math.min(i,P.night.length-1)];wall(f.w);table(f.t,fade);ts.fresh=false;ts.until=0;ts.night=true;return;}}
    const washing=!!TRACK_WASH[key],wi=washing?(ts.cyc||0)%Math.max(1,P.walls.length):wallIdx(P,t,dur),w=P.walls[wi];
    if(ts.fresh||ts.night){wall(w);table(P.base,fade);ts.fresh=ts.night=false;}   // the play (or the end of the night): the mesa padrão
    if(snd>=0){const kind=J.tipos?.[snd]||'som';if(!(kind in ts.kinds))ts.kinds[kind]=Object.keys(ts.kinds).length;const n=new Set((J.tipos||[]).filter(x=>!P.kinds[x]&&!TRACK_WASH[key]?.[x])).size>1?ts.kinds[kind]:ts.occ++;   // several kinds: one table per kind; one kind: the tables in turn
      if(!ts.until&&!washing)wall(w);   // the next wall of the track comes with a sound
      const hold=Math.max(3,J.duracoes?.[snd]||ACC_HOLD);   // a sound with a length (a wave): its table stays as long
      const wc=TRACK_WASH[key]?.[kind];
      if(wc)washRun(key,wc,hold,()=>{if(ts.key!==key)return;ts.cyc=(ts.cyc||0)+1;   // the wave at the top: the next table and wall under it
        const x=P.cycle[ts.cyc%P.cycle.length];if(x){P.base=x;ts.table=x;trackTable(key,x,700);}
        const y=P.walls[ts.cyc%P.walls.length];if(y&&y!==ts.wall&&!(CLIPES[key]||[]).length&&!wclip.on){ts.wall=y;trackWall(key,y,WALL_FADE);}});
      else if(washing);   // with the water, only the waves change the visual
      else if(P.kinds[kind]){const x=P.kinds[kind];if(x!==ts.table){ts.table=x;trackTable(key,x,ACC_IN,TRACK_KIND_AT[key]?.[kind]??null);}ts.until=Math.max(ts.until,t+hold);}
      else if(P.accents.length){let x=P.accents[n%P.accents.length];if(x===ts.table&&P.accents.length>1)x=P.accents[(n+1)%P.accents.length];
        table(x,ACC_IN);ts.until=t+hold;}
      else if(P.walls.length>1){const x=P.walls[(wi+1+n)%P.walls.length];if(x!==ts.wall){ts.wall=x;trackWall(key,x,ACC_IN);ts.until=t+ACC_HOLD;}}}
    else if(ts.until&&t>=ts.until){ts.until=0;if(P.accents.length)table(P.base,ACC_OUT);else if(w!==ts.wall){ts.wall=w;trackWall(key,w,ACC_OUT);}}
    else if(!washing&&!ts.until&&w&&w!==ts.wall&&t>P.dayAt+(wi*(dur-P.dayAt)/P.walls.length)+20)wall(w);   // no sound for long: the wall changes anyway
  },50);
  window.__paredeAgora=()=>{const c=wt.on?wt.cv:wclip.on?wclip.cv:wv.v?wv.cv:null;const v=wt.on&&wt.els.find(e=>!e.v.paused)?.v;
    return c?{trilha:wt.on,videoT:v?+v.currentTime.toFixed(3):null,arquivo:v?v.src.split('/').pop():null,audioT:+audio.currentTime.toFixed(3),efeitos:wclip.layers.map(L=>L.c.tipos[0]),img:c.toDataURL('image/jpeg',0.8)}:null;};   // (reading only, for tests)
  window.__mesaDbg=()=>({video:(tv.url||'').split('/').pop().slice(0,8)||null,agua:!!wash.key,onda:!!wash.ev,aguaT:wash.v?+wash.v.currentTime.toFixed(2):null,base:!!wash.base&&wash.base===room.cur?.tc});   // (reading only, for tests)
  window.__trilhaSala=()=>ts.key?{ato:ts.key,t:+ts.t.toFixed(2),parede:ts.wall?.sha.slice(0,8)||null,mesa:ts.table?.sha.slice(0,8)||null,padrao:ts.P.base?.sha.slice(0,8)||null,voltaEm:ts.until?+ts.until.toFixed(2):null}:null;   // (reading only, for tests)
  window.__fontesParedes=async key=>Promise.all(picsOf(acts.get(key).a).walls.map(async w=>{const u=w.semLogo?media.get(w.sha).image:await trimmedSrc(media.get(w.sha).image);
    const b=await fetch(u).then(r=>r.blob());return {sha:w.sha,semLogo:!!w.semLogo,data:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b);})};}));   // (reading only, for the horizon tool)
  window.__paredes=async key=>{const R=await roomReady;return Promise.all(picsOf(acts.get(key).a).walls.map(async w=>({sha:w.sha,semLogo:!!w.semLogo,inv:!!w.inv,gr:!!w.gr,cv:await wallCv(R,w)})));};   // (reading only, for the horizon tool)
  window.__apresCodigo=true;   // the previews' helpers (wallWithForma, inverted, forested...) exist from here on (heroRoom)
  window.__roomNow=()=>room.cur?{ato:room.cur.key,passo:room.cur.i,de:room.count(room.cur.key),parede:room.cur.w?.sha.slice(0,8)||null,mesa:room.cur.t?.sha.slice(0,8)||null}:null;   // (reading only, for tests)
  const room={current:null,gen:0,timer:0,step:0,holdUntil:0,   // holdUntil: someone is looking at something, the pictures wait
    count(key){return roomFrames(acts.get(key).a).length;},
    // put step i of the act in the room: its wall and its table as the roteiro plays them
    async paint(key,i,fade){const R=await roomReady,g=room.gen,st=acts.get(key),fr=roomFrames(st.a),p=picsOf(st.a);if(!fr.length)return false;
      const f=fr[i%fr.length];
      // an act with a table sequence (showOf): the table is the sequence's, not the step's; it is put once per visit
      const sh=showOf(key),tshow=sh?{sha:sh.list[sh.i]}:null,first=sh&&room.showGen!==g;
      // an act whose wall runs on its own from its track's video (livre, with its Forma in it): the first frame of that
      // video until it comes in, never the roteiro's older wall video under it
      const tw=TRACK_WALL_VIDEO[key],ownWall=tw?.livre&&!tw.semForma&&tw.poster;
      const [wc,tc]=await Promise.all([ownWall?cached('tp|'+key+'|'+tw.v,async()=>{const im=await Art.loadImage(tw.poster+'?v='+tw.v),cv=document.createElement('canvas');cv.width=2564;cv.height=460;cv.getContext('2d').drawImage(im,0,0,2564,460);return cv;}):f.w?wallCv(R,f.w):black('parede'),sh?(first?tableCv(tshow):null):(f.t?tableCv(f.t):black('mesa'))]);
      if(g!==room.gen||room.current!==key)return false;
      const own=mt.on&&mt.key===key;   // (the table made for the track is on: the roteiro's tables wait)
      if(!(wt.on&&wt.key===key)){R.show('parede',wc,fade);if(ownWall)wallVideoStop();else wallVideo(R,f.w,g,(fade||0)+60);}if(tc&&!own)R.show('mesa',tc,fade);   // (the wall made for the track is on: the roteiro's walls wait)
      if(own){}else if(sh){if(first){room.showGen=g;tableVideo(R,media.get(tshow.sha).video,g,(fade||0)+60);}}
      else{const vid=f.t&&media.get(f.t.sha)?.video;if(vid)tableVideo(R,vid,g,(fade||0)+60);else tableVideoStop();}
      logoWall(R,key,f.w,g,fade);
      const tt=sh?{sha:sh.list[sh.i]}:f.t;
      room.cur={key,wc,tc,w:f.w,t:tt,at:f.at,i};ringsStart(key,fade);   // the waves by code, over this picture
      const wi=f.w?p.walls.findIndex(x=>x.sha===f.w.sha):-1,ti=tt?p.tables.findIndex(x=>x.sha===tt.sha):-1;
      if(wi>=0)st.active.wall=wi;if(ti>=0)st.active.table=ti;markRoom(key);return true;},
    loop(key){clearTimeout(room.timer);const g=room.gen;if(key==='forma'&&!document.body.classList.contains('editing'))return;   // act I follows its track (formaStep)
      const tick=async()=>{if(g!==room.gen)return;const n=room.count(key);
        // while editing the room stays on its step: the picture under the buttons does not change by itself
        if(n>1&&!document.hidden&&!document.body.classList.contains('editing')&&Date.now()>=room.holdUntil&&!trackDriven(key)){room.step=nextStep(key,room.step,n);await room.paint(key,room.step,FADE_MS);}
        if(g===room.gen)room.timer=setTimeout(tick,Math.max(loopMs(key),room.holdUntil-Date.now()));};
      room.timer=setTimeout(tick,Math.max(loopMs(key),room.holdUntil-Date.now()));},
    // the act's pictures changed (or one was picked): show the current step again and restart the loop from it
    async refresh(key){if(room.current!==key)return;const n=room.count(key);room.step=n?room.step%n:0;clearTimeout(room.timer);
      if(await room.paint(key,room.step,500))room.loop(key);},
    // the arrows: one step back or forward (wall and table together); the room then holds there for a while
    async stepBy(key,d){if(room.current!==key){await room.show(key);}const n=room.count(key);if(n<2)return;
      room.step=d>0?nextStep(key,room.step,n):((room.step+d)%n+n)%n;roomHold();room.pickUntil=room.holdUntil;clearTimeout(room.timer);if(await room.paint(key,room.step,700))room.loop(key);},
    // a picture was picked: go to the first step that shows it
    jump(key,kind,idx){roomHold();room.pickUntil=room.holdUntil;const a=acts.get(key).a,item=picsOf(a)[kind][idx],fr=roomFrames(a);
      const sha=item?.sha,j=fr.findIndex(f=>(kind==='walls'?f.w:f.t)?.sha===sha);room.step=j>=0?j:0;
      const sh=kind==='tables'&&showOf(key),k=sh?sh.list.indexOf(sha):-1;   // a table of the sequence: the sequence goes there
      if(k>=0&&k!==sh.i){sh.i=k;if(room.current===key)showGo(key,sh,SHOW_SEEK_MS);}
      if(room.current===key)room.refresh(key);},
    async view(a,name){acts.get(a.key).view=name;markView(a.key,name);tourHold(name);if(room.current!==a.key){await room.show(a.key);return;}(await roomReady).flyTo(name);},
    async show(key){if(room.current===key)return;
      room.current=key;room.holdUntil=0;const g=++room.gen;clearTimeout(room.timer);tableVideoStop();
      {const keep=new Set();for(const f of roomFrames(acts.get(key).a))for(const x of [f.w,f.t]){const u=x&&media.get(x.sha)?.video;if(u)keep.add(u);}
        wallVideoStop();poolTrim(keep);   // (the room is hidden from here until this act is drawn: the last act's wall goes now)
        for(const [T,C,stop] of [[wt,TRACK_WALL_VIDEO[key],wallTrackStop],[mt,TRACK_TABLE_VIDEO[key],tableTrackStop]]){if(T.on&&T.key!==key)stop();
          if(!T.on){const mine=T.els.filter(e=>C&&e.src.startsWith(C.base));for(const e of T.els)if(!mine.includes(e)){e.v.pause();e.v.removeAttribute('src');e.v.load();}T.els.splice(0,T.els.length,...mine);}}}   // (another act's track: its minutes let go)
      // another act's track still playing (played there, then on to this act): it fades out and stops, so this act
      // never sounds with the other's voice and music
      if(playing&&playing.dataset.key!==key&&!audio.paused){const from=audio.volume;let k=0;
        const down=setInterval(()=>{k++;audio.volume=Math.max(0,from*(1-k/8));if(k>=8){clearInterval(down);audio.pause();audio.volume=from;}},60);}
      frame.style.transition='none';frame.style.opacity='0';place();frame.style.visibility='visible';   // out at once, in with a fade
      const R=await roomReady;if(g!==room.gen)return;
      if(key!=='forma')R.pulsesClear?.(0);if(key!=='couvert')R.ripplesClear?.(0);   // hidden now: the other act's waves end here
      const st=acts.get(key),view=st.view||'inteira';R.flyTo(view,true);markView(key,view);tourStart(key);
      const lp=Promise.resolve(R.setLogo?.(true,{...logoPos(),...FORMA_MOVE,finish:ACT_FINISH[key]||'cromo',render:NOVAS[key]&&SEM_ALFA?'modelos/formas/forma-gel-'+key+'.webp':FORMA_RENDER.includes(key)?'modelos/formas/forma-'+key+'.webp?v=9':null,reflexo:REFLEXO[key]||null,video:NOVAS[key]&&!SEM_ALFA?'apresentacao/forma-gel-'+key+'.webm':null})).catch(()=>{});room.logoOff=false;
      room.step=0;
      if(!await room.paint(key,room.step,0))return;
      await Promise.race([lp,new Promise(r=>setTimeout(r,5000))]);if(g!==room.gen)return;   // the act appears with its Forma, not before it
      // its videos (wall, table) with enough loaded to play on without stopping, before it appears (the loading ring under
      // it meanwhile); at most 4 s
      const enough=v=>!v||v.readyState>=4?null:new Promise(r=>{v.addEventListener('canplaythrough',r,{once:true});v.addEventListener('error',r,{once:true});});
      await Promise.race([Promise.all([enough(wv.v),enough(tv.el)]),new Promise(r=>setTimeout(r,4000))]);if(g!==room.gen)return;
      await new Promise(r=>setTimeout(r,120));if(g!==room.gen)return;   // let the room draw the new act before it appears
      frame.style.transition='';frame.style.opacity='1';room.loop(key);
      if(TRACK_TABLE_VIDEO[key])tableTrack(key);   // (its table made for the track, running even without the track)
      if(TRACK_WALL_VIDEO[key]?.livre)wallTrack(key);   // (and its wall, the same)
      if(!st.logo)logoPreview(key,g);
      // the acts before and after this one get their first step ready while nothing else happens, so scrolling into
      // them does not stop the page while their pictures are put together
      const keys=[...acts.keys()],i=keys.indexOf(key),idle=window.requestIdleCallback||(f=>setTimeout(f,400));
      for(const k of [keys[i+1],keys[i-1]].filter(Boolean))idle(()=>{if(room.current!==key)return;const f=roomFrames(acts.get(k).a)[0];if(!f)return;
        if(f.w)wallCv(R,f.w).catch(()=>{});if(f.t&&!media.get(f.t.sha)?.video)tableCv(f.t).catch(()=>{});
        const wu=f.w&&media.get(f.w.sha)?.video;if(wu&&!TRACK_WALL_VIDEO[k])poolVideo(wu);},{timeout:3000});}};   // (its wall in video: loading already, so it plays at once there)
  // ---- the Forma's place on Parede 02, and the wall exported exactly as the room shows it ----
  // "Ajustar Forma" (edit mode): a panel to move and scale the Forma on Parede 02, live in the room; Salvar keeps it for
  // everyone (every act, the pictures' previews and the exported walls), Cancelar goes back to what was saved
  function logoControls(a){   // (declarations: the acts are built before these lines run)
    const LOGO_FIELDS=[['pos','Horizontal',-0.45,0.45],['height','Altura',0.2,0.8],['size','Tamanho',0.3,1]];
    const wrap=el('div','logo-ctl'),open=el('button','btn lc-open','Ajustar Forma');open.type='button';open.setAttribute('aria-expanded','false');
    const panel=el('div','lc-panel');panel.hidden=true;
    for(const [k,label,min,max] of LOGO_FIELDS){const lab=el('label','lc-field');lab.append(el('span',null,label));
      const r=el('input');r.type='range';r.min=min;r.max=max;r.step='0.005';r.value=logoPos()[k];r.dataset.k=k;r.setAttribute('aria-label','Forma: '+label);
      const out=el('output','lc-val',Math.round(+r.value*100)+'');r.oninput=()=>{out.textContent=Math.round(+r.value*100)+'';logoMove({[k]:+r.value});};
      lab.append(r,out);panel.append(lab);}
    const sync=()=>{const v=logoNow||logoPos();for(const r of panel.querySelectorAll('input[data-k]')){r.value=v[r.dataset.k];r.nextSibling.textContent=Math.round(v[r.dataset.k]*100)+'';}};
    const reset=el('button','btn quiet lc-reset','Centralizar');reset.type='button';reset.onclick=()=>{logoMove({...LOGO_POS});sync();};
    const cancel=el('button','btn quiet lc-cancel','Cancelar');cancel.type='button';
    const save=el('button','btn lc-save','Salvar');save.type='button';
    const ex=el('button','btn quiet lc-export','Exportar parede');ex.type='button';ex.onclick=()=>exportWall(a,ex);
    const acts_=el('div','lc-actions');acts_.append(reset,ex,cancel,save);panel.append(acts_);
    const show=on=>{panel.hidden=!on;open.setAttribute('aria-expanded',String(on));open.textContent=on?'Fechar ajuste':'Ajustar Forma';if(on){logoNow=null;sync();}};
    open.onclick=()=>show(panel.hidden);
    cancel.onclick=()=>{logoNow=null;logoMove(logoPos());logoNow=null;sync();show(false);};
    save.onclick=()=>{logoSave();show(false);toast('Posição da Forma salva: vale para todos os atos, as imagens e as paredes exportadas.');};
    wrap.append(open,panel);return wrap;}
  var logoNow=null;
  function logoMove(patch){logoNow={...(logoNow||logoPos()),...patch};
    for(const r of document.querySelectorAll('.logo-ctl input[data-k]'))if(r.dataset.k in patch){r.value=logoNow[r.dataset.k];if(r.nextSibling)r.nextSibling.textContent=Math.round(logoNow[r.dataset.k]*100)+'';}
    roomReady.then(R=>{if(room.current)R.setLogo?.(true,{...logoNow,...FORMA_MOVE});});}
  function logoSave(){if(!logoNow)return;logoSaving=true;store.setPresentationAct('_logo',{...logoNow});logoSaving=false;
    for(const st of acts.values())st.logo=null;if(room.current)logoPreview(room.current,room.gen);}   // the previews follow the new place
  // Walls exported exactly as the room shows them: each picture from its original file at full size (6410 x 1150, Parede 01 +
  // Parede 02), with the room's fit and treatment (inverted, forest green, title), and the act's Forma drawn on Parede 02
  // at the saved place and size (the act's Blender render; in act I the live chrome). Downloaded, and saved in
  // exportacoes/ by the local server.
  async function formaPicture(a){
    if(FORMA_RENDER.includes(a.key)){const img=await Art.loadImage('modelos/formas/forma-'+a.key+'.webp?v=9');return img;}
    const R=await roomReady;if(room.current!==a.key)await room.show(a.key);
    for(let i=0;i<20;i++){const L=R.logoLayer?.();if(L)return L.canvas;await new Promise(r=>setTimeout(r,250));}
    return null;}
  async function wallWithForma(a,w,forma){
    let c;
    if(w){const img=await Art.loadImage(w.semLogo||w.sha.startsWith('nova-')?media.get(w.sha).image:await trimmedSrc(media.get(w.sha).image));c=Art.surfaceCanvas(img,'parede','cover',.5);
      if(w.inv)c=inverted(c);if(w.gr)c=await forested(c,true);if(w.texto)withText(c,w.texto,w.inv?'#fff':'#000');}
    else{c=document.createElement('canvas');c.width=6410;c.height=1150;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);}
    if(forma){const o=logoNow||logoPos(),x0=4490,PW=c.width-x0,side=2*o.size/0.9;          // the room's plane: side in metres, Parede 02 is 3.34 x 2 m
      const lw=side/3.34*PW,lh=side/2*c.height,cx=x0+(0.5+o.pos)*PW,cy=(1-o.height)*c.height,g=c.getContext('2d');
      g.imageSmoothingQuality='high';g.drawImage(forma,cx-lw/2,cy-lh/2,lw,lh);
      const R=REFLEXO[a.key];if(R){const ri=await Art.loadImage(R.url);g.drawImage(ri,cx-lw/2,cy-lh/2+R.inicio*lh,lw,R.altura*lh);}}
    return c;}
  async function exportPictures(a,items,btn){
    const txt=btn.textContent;btn.disabled=true;let done=0,saved=0;
    try{const forma=showLogo?await formaPicture(a):null;
      for(const w of items){btn.textContent='Exportando '+(++done)+' de '+items.length+'…';
        const fw=w&&w.semLogo?null:forma,c=await wallWithForma(a,w,fw),blob=await new Promise(r=>c.toBlob(r,'image/png'));
        const name='parede-'+a.n+'-'+a.key+(w&&w.passo?'-passo'+w.passo:'')+(fw?'':'-sem-logo')+'.png';
        const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),4000);
        const ok=await fetch('api/parede/exportar?nome='+encodeURIComponent(name),{method:'POST',body:blob}).then(r=>r.ok).catch(()=>false);if(ok)saved++;}
      btn.textContent=saved?(saved===1?'Salvo em exportacoes/':saved+' salvas em exportacoes/'):'Baixado';
      toast(saved?'Pronto: '+saved+' '+(saved===1?'parede salva':'paredes salvas')+' em exportacoes/ e baixada'+(saved===1?'':'s')+' no navegador.':'Baixado no navegador.');}
    catch(e){console.error(e);btn.textContent='Não deu para exportar';toast('Não deu para exportar: '+e.message);}
    finally{btn.disabled=false;setTimeout(()=>{btn.textContent=txt;},6000);}}
  // the wall on show (the Forma panel's button)
  function exportWall(a,btn){const f=room.cur&&room.cur.key===a.key?room.cur:null;return exportPictures(a,[f?.w?{...f.w,passo:(room.step||0)+1}:null],btn);}
  // the preview of the logo over the act's walls: taken once the act's Forma is drawn (its render may still be loading)
  function logoPreview(key,g,tries=6){setTimeout(async()=>{if(g!==room.gen)return;const shot=await logoShot();
    if(shot&&g===room.gen){const st=acts.get(key);st.logo=shot.src;st.logoAt=shot.at;renderSurfaces(key);}else if(tries>1)logoPreview(key,g,tries-1);},900);}
  // ---- the room tours its views by itself: Sala inteira, Mesa, Parede 1, Parede 2, and again. A click on a view (or a drag
  // in the room, or a picture picked) holds the view AND the pictures there; after 30 s without touching, both go on.
  // Not while editing (the Forma panel needs the room still).
  const TOUR=['inteira','mesa','parede1','parede2'],TOUR_MS=17000,TOUR_IDLE=30000;
  function roomHold(){tour.until=room.holdUntil=Date.now()+TOUR_IDLE;}   // (a declaration: room.jump calls it)
  const tour={key:null,i:0,timer:0,until:0};
  // (the room no longer tours its views by itself: it stays on the view chosen, "Sala inteira" at first)
  function tourStart(key){clearTimeout(tour.timer);tour.key=key;tour.i=Math.max(0,TOUR.indexOf(acts.get(key).view||'inteira'));}
  function tourHold(name){const i=TOUR.indexOf(name);if(i>=0)tour.i=i;roomHold();}
  function tourNext(ms){clearTimeout(tour.timer);tour.timer=setTimeout(async()=>{
    if(!tour.key||room.current!==tour.key)return;
    const wait=tour.until-Date.now();if(wait>0)return tourNext(wait);
    if(document.hidden||document.body.classList.contains('editing'))return tourNext(TOUR_MS);
    tour.i=(tour.i+1)%TOUR.length;const name=TOUR[tour.i],st=acts.get(tour.key);st.view=name;markView(tour.key,name);
    (await roomReady).flyTo(name,matchMedia('(prefers-reduced-motion: reduce)').matches);tourNext(TOUR_MS);},ms);}
  // the Forma's pictures (webp, about 150 KB each) load with the room, so no act waits for its Forma
  roomReady.then(R=>R.preloadForma?.(FORMA_RENDER.map(k=>'modelos/formas/forma-'+k+'.webp?v=9'))).catch(()=>{});
  // the wheel over the room scrolls the page (it used to zoom the room, and the page stopped there); Ctrl + wheel, and
  // the pinch of a trackpad, still zoom it. On a touch screen a vertical swipe over the room scrolls the page and a
  // sideways drag still turns the room
  roomReady.then(()=>{try{const w=frame.contentWindow;w.addEventListener('pointerdown',roomHold,{passive:true});
    w.addEventListener('wheel',e=>{if(e.ctrlKey){roomHold();return;}e.preventDefault();e.stopImmediatePropagation();
      const k=e.deltaMode===1?40:e.deltaMode===2?innerHeight:1;lenis?lenis.scrollTo(lenis.targetScroll+e.deltaY*k*(lenis.options.wheelMultiplier||1)):scrollBy({top:e.deltaY*k,left:0,behavior:'instant'});},{capture:true,passive:false});
    for(const c of w.document.querySelectorAll('canvas'))c.style.touchAction='pan-y';}catch{}});
  // the pictures mark the one the room is showing now
  function markRoom(key){const st=acts.get(key);
    for(const f of [...st.imgs.querySelectorAll('.pic'),...(galKey===key?galList.querySelectorAll('.pic'):[])]){
      const slot=f.dataset.kind==='walls'?'wall':'table';f.classList.toggle('active',+f.dataset.idx===st.active[slot]);}}
  // ---- waves in the room itself (room-bridge pulse): each one leaves a real point and runs through the whole room,
  // over both walls and the table, folding the picture where it passes, soft and fading with distance ----
  // Act I: from the Forma (the 3D logo on Parede 2), on the peaks of the voice while the act's track plays, otherwise
  // slowly, like breathing. Couvert: when a group of spheres lights (the step's lightingGroup in the roteiro), from
  // those spheres on the water, and a moment later from the plates of the same group on the table.
  const RING_ACTS=new Set(['couvert']);   // (act I: the waves are in its wall pictures now, made by image generation)
  const ring={raf:0,g:-1,timers:[],an:null,ctx:null,buf:null,prev:0,lastPeak:0,next:0};
  // the loudness of act I's track right now (0..1), or null when it is not playing
  function voiceLevel(){
    if(!(playing&&playing.dataset.key==='forma'&&!audio.paused))return null;
    try{if(!ring.an){const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),src=ctx.createMediaElementSource(audio),an=ctx.createAnalyser();
        an.fftSize=1024;src.connect(an);an.connect(ctx.destination);ring.an=an;ring.ctx=ctx;ring.buf=new Float32Array(an.fftSize);}
      if(ring.ctx.state==='suspended')ring.ctx.resume();ring.an.getFloatTimeDomainData(ring.buf);let s=0;for(const v of ring.buf)s+=v*v;return Math.sqrt(s/ring.buf.length);}
    catch{return null;}}
  // which spheres (and plates) light in this couvert step: group 1 the left ones, 2 the middle, 3 the right, the wave all
  function couvertCols(c){const at=c.at??c.w?.at??c.t?.at,st=at!=null?curStory()?.steps[at]:null;if(!st)return null;
    const state=st.tableLightingState?.state||'',g=st.lightingGroup;
    return state==='todas-acesas'?[[0,1,2,3,4,5,6,7]]:g===1?[[0,1,2]]:g===2?[[3,4]]:g===3?[[5,6,7]]:null;}
  // the couvert's water: the spheres of each picture (where they sit, how big, which glow) were measured once from the
  // pictures themselves (esferas-couvert.json); the ripples leave the glowing ones and run over the water in
  // perspective, behind and in front of the others; on the table, soft rings around the plates of the same group
  // the glass of each place, as the room has it: 17 cm beside the plate and 12 cm toward the middle of the table (the
  // first 8 places are the row at the top of the table picture)
  const TACAS=P=>P.CENTERS.map((c,i)=>i<8?{x:c.x-0.034,y:c.y+0.119}:{x:c.x+0.034,y:c.y-0.119});
  let ESFERAS=null;const esferas=()=>ESFERAS||(ESFERAS=fetch('esferas-couvert.json?v=1').then(r=>r.json()).catch(()=>({})));
  async function couvertRipples(R,sha,groups,after,t0,rise){
    const e=(await esferas())[sha];if(!e||!R.ripple)return;
    R.waterScene(e.horizon,e.spheres.map(s=>[s[0],s[1],s[2]]));R.plateScene(TACAS(Plates),0.042,Plates.CENTERS,Plates.RY);R.ripplesClear(350,'prato');R.ripplesClear(350,'faixa');
    const lit=e.spheres.filter(s=>s[3]&&s[2]/Math.max(1e-3,s[1]+s[2]-e.horizon)>=0.25).sort((a,b)=>b[2]-a[2]).slice(0,8),plates=(groups||[]).flat().flatMap(col=>[col,col+8]);
    lit.forEach((s,i)=>after(t0+((i*53)%120),()=>R.ripple('agua',{x:s[0],y:s[1],r:s[2]},{rise})));
    // (the table made for the track is a video with its own water: no rings drawn over it, round the glasses or the plates)
    if(!TRACK_TABLE_VIDEO.couvert)plates.forEach((pl,i)=>after(t0+((i*41)%120),()=>R.ripple('prato',TACAS(Plates)[pl],{rise})));   // with the spheres
  }
  function ringsStart(key,fade){
    cancelAnimationFrame(ring.raf);ring.timers.forEach(clearTimeout);ring.timers=[];ring.g=room.gen;
    const R=frame.contentWindow?.pharmaRoom;if(!R?.pulse)return;
    if(key!=='couvert')R.ripplesClear?.();   // within the couvert the ripples of one step run on into the next
    if(key!=='forma')R.pulsesClear?.();      // the Forma's waves belong to act I only
    R.formaParticles?.(false);              // no particles on the Forma
    const c=room.cur;if(!c||!RING_ACTS.has(key))return;
    const after=(ms,f)=>ring.timers.push(setTimeout(()=>{if(ring.g===room.gen)f();},ms)),t0=(fade||0)+80;
    if(key==='couvert'){couvertRipples(R,c.w?.sha,couvertCols(c),after,0,(fade||0)/1000);return;}   // with the picture's fade
    ring.next=performance.now()+t0+300;ring.raf=requestAnimationFrame(ringFrame);
  }
  function ringFrame(now){
    const c=room.cur;if(ring.g!==room.gen||!c||c.key!=='forma')return;
    const R=frame.contentWindow?.pharmaRoom;
    const lv=voiceLevel();             // the Forma speaks: a burst on each peak of the voice, or a slow breath without the track
    if(lv!=null){if(lv>0.05&&lv>ring.prev*1.3&&now-ring.lastPeak>2200){R?.pulse('forma',{amp:.85,speed:0.75,life:9,width:0.4});ring.lastPeak=now;}ring.prev=ring.prev*0.85+lv*0.15;}
    else if(now>=ring.next){R?.pulse('forma',{amp:.75,speed:0.6,life:10,width:0.45});ring.next=now+7000;}
    ring.raf=requestAnimationFrame(ringFrame);
  }
  // the room as it is now, drawn once more and read right away (the canvas does not keep its picture)
  function snapshot(key){try{const a=frame.contentWindow.__v3;a.renderer.render(a.scene,a.cam);
    const url=a.renderer.domElement.toDataURL('image/jpeg',0.82);
    return url;}catch{return null;}}   // (no picture is left in the act's box: it stays dark until the 3D room is there)
  window.__apresSnap=key=>snapshot(key);
  function markView(key,name){for(const b of acts.get(key).s.querySelectorAll('.views .view'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
  // the room follows the act on screen
  function place(){const st=room.current&&acts.get(room.current);if(!st){frame.style.opacity='0';return;}
    const r=st.box.getBoundingClientRect();Object.assign(frame.style,{left:(r.left+scrollX)+'px',top:(r.top+scrollY)+'px',width:r.width+'px',height:r.height+'px'});
    // the screens are cards that come up over each other: where the next one covers the room's screen, the room is cut
    const nx=st.box.closest('.stage')?.nextElementSibling,cover=nx&&nx.offsetHeight?Math.max(0,Math.min(r.height,r.bottom-nx.getBoundingClientRect().top)):0;
    frame.style.clipPath=cover?`inset(3px 0 ${cover}px 0 round var(--r))`:'';}
  addEventListener('resize',place);addEventListener('scroll',place,{passive:true});if(lenis)lenis.on('scroll',place);
  // a card taller than the window stays only once its end is in view
  const cardTops=()=>{for(const e of document.querySelectorAll('#topo~.glance,.act>.act-cover,.act>.act-pair,.act>.stage,.act>.slide-scene'))e.style.top=Math.min(0,innerHeight-e.offsetHeight)+'px';};
  cardTops();addEventListener('resize',cardTops);{const ro=new ResizeObserver(place);ro.observe(document.body);for(const st of acts.values())ro.observe(st.box);}   // the room follows its box (opening the Forma panel shrinks it)
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)room.show(e.target.dataset.key);},{threshold:.55});
  for(const st of acts.values())io.observe(st.box);
  // ---- the Forma turning behind the title of the cover on screen: the room's own three.js (its window, already loaded),
  // one canvas that moves to the cover in view and only draws while a cover is on screen; polished chrome in a studio ----
  const coverForma=(()=>{let st=null,loading=null,on=null,raf=0,t0=0;
    const still=false;   // a slow turn, kept even when the system asks for less motion (asked for)
    async function init(){
      await roomReady;const w=frame.contentWindow,T=w&&w.THREE;if(!T||!T.GLTFLoader)return null;
      // the canvas is made in the room's own document (its WebGL2 context then belongs to the same window as that three.js,
      // or three takes it for WebGL1 and the chrome reflections fail), then moved into the cover
      const canvas=frame.contentDocument.createElement('canvas');canvas.className='cover-forma';canvas.setAttribute('aria-hidden','true');
      const r=new T.WebGLRenderer({canvas,alpha:true,antialias:true});r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.setClearColor(0x000000,0);
      if('outputEncoding' in r)r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.NoToneMapping;   // as the room draws its Forma
      const scene=new T.Scene(),cam=new T.PerspectiveCamera(24,1,.1,100);cam.position.set(0,0,10.6);
      // the room's own chrome studio (pharmaRoom.chromeEnvPixels), so this Forma looks exactly like the room's
      let env=null;for(let i=0;i<100&&!env;i++){env=w.pharmaRoom?.chromeEnvPixels?.();if(!env)await new Promise(res=>setTimeout(res,300));}
      if(!env)return null;
      const dt=new T.DataTexture(env.px,env.w,env.h,T.RGBAFormat);dt.mapping=T.EquirectangularReflectionMapping;dt.magFilter=dt.minFilter=T.LinearFilter;dt.needsUpdate=true;
      const pm=new T.PMREMGenerator(r);scene.environment=pm.fromEquirectangular(dt).texture;
      // the room's chrome (room-bridge.js FINISH.cromo, polish 0.85, reflect 1.25), darker where the brand is dark
      const mat=new T.MeshPhysicalMaterial({color:0xf6f7f9,metalness:1,roughness:0.012,clearcoat:0,envMapIntensity:1.25});
      mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',
        ['#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )',' float dk=clamp((0.34-vColor.g)/0.236,0.0,1.0);diffuseColor.rgb*=mix(1.0,0.42,dk);','#endif'].join(String.fromCharCode(10)));};
      const gltf=await new Promise((res,rej)=>new T.GLTFLoader().load('modelos/logo-pharma-3d-leve.glb?v=1',res,undefined,rej));
      gltf.scene.traverse(o=>{if(o.isMesh){o.material=mat;if(o.geometry.attributes.color)mat.vertexColors=true;}});
      const box=new T.Box3().setFromObject(gltf.scene),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
      gltf.scene.position.sub(c);const pivot=new T.Group();pivot.add(gltf.scene);pivot.scale.setScalar(4.1/Math.max(size.x,size.y));scene.add(pivot);
      const fit=()=>{const b=canvas.getBoundingClientRect();if(b.width>0){r.setSize(b.width,b.height,false);cam.aspect=b.width/b.height;cam.updateProjectionMatrix();if(st&&on)r.render(scene,cam);}};
      new ResizeObserver(fit).observe(canvas);
      return window.__coverForma=st={T,r,scene,cam,pivot,canvas,fit};}
    // in the Recepção's slide (.dish-forma) the Forma stands still, facing the guest; drawn again only when resized
    const front=()=>!!(on&&on.classList&&on.classList.contains('dish-forma'));
    // elsewhere it turns slowly in its own plane only, facing the guest: it is two curved strips that only close into a
    // ring seen from the front, so turned sideways it would come apart
    function draw(now){if(!st||!on)return;const t=(now-t0)/1000,f=front();
      st.pivot.rotation.set(0,0,f||still?0:-t*2*Math.PI/75);
      st.r.render(st.scene,st.cam);if(!still&&!f)raf=requestAnimationFrame(draw);}
    return {async show(cover,where){on=cover;if(!st){loading=loading||init().catch(e=>{console.warn('cover forma',e);return null;});await loading;}
        if(!st||on!==cover)return;const host=where||cover.querySelector('.cover-title')||cover;if(st.canvas.parentNode!==host)host.prepend(st.canvas);host.classList.add('vivo');
        st.fit();cancelAnimationFrame(raf);t0=t0||performance.now();raf=requestAnimationFrame(draw);},
      hide(cover){if(on===cover){on=null;cancelAnimationFrame(raf);}}};})();
  const cio=new IntersectionObserver(es=>{for(const e of es){e.target.classList.toggle('lit',e.isIntersecting);
    }},{threshold:.45});   // (coverForma, the turning Forma behind the name, is kept but not used: the cover shows only the name)
  for(const c of document.querySelectorAll('.act-cover'))cio.observe(c);
  // like slides: the arrow keys, PageUp/PageDown and the space bar go to the next or the previous screen
  const slideList=()=>[...document.querySelectorAll('#topo,#jornada,.glance,.act-cover,.act .stage,.act-pair,.slide-scene')].filter(e=>e.offsetParent);
  addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;
    const t=e.target,tag=t&&t.tagName;if(/^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(tag)||t.isContentEditable||document.querySelector('dialog[open]'))return;
    const dir={ArrowDown:1,PageDown:1,' ':e.shiftKey?-1:1,ArrowUp:-1,PageUp:-1}[e.key];if(!dir)return;
    const list=slideList(),y=scrollY+2,root=document.documentElement;root.classList.add('sem-cartoes');const tops=list.map(el_=>el_.getBoundingClientRect().top+scrollY);root.classList.remove('sem-cartoes');
    let i=tops.findIndex(v=>v>y)-1;if(i<-1)i=tops.length-1;if(tops.findIndex(v=>v>y)===-1)i=tops.length-1;
    const cur=tops.findIndex(v=>Math.abs(v-scrollY)<4),to=cur>=0?cur+dir:(dir>0?i+1:i);
    if(to<0||to>=list.length)return;e.preventDefault();glideTo(tops[to]);});
  // the page settles on a screen: when the wheel or a swipe stops with a screen's start (or, for a screen taller than the
  // window, its end) a fifth of the window or less ahead, in the way it was going, it glides on there; just past one (a
  // twentieth), it goes back to it. So a screen is never left half under the next card, and going on slowly, a little at a
  // time, is never pulled back
  if(lenis){let tid=0,own=false,dir=1;
    const settle=()=>{if(own||lenis.isScrolling||document.body.classList.contains('editing')||document.querySelector('dialog[open]'))return;
      const y=scrollY,H=innerHeight,root=document.documentElement,pts=[];root.classList.add('sem-cartoes');
      for(const el_ of slideList()){const r=el_.getBoundingClientRect();pts.push(r.top+y);if(r.height>H+40)pts.push(r.top+y+r.height-H);}
      root.classList.remove('sem-cartoes');
      let best=null;for(const p of pts){const d=(p-y)*dir;if(Math.abs(d)<2)return;if((d>0?d<=H*0.2:-d<=H*0.05)&&(best==null||Math.abs(p-y)<Math.abs(best-y)))best=p;}
      if(best==null)return;own=true;lenis.scrollTo(best,{duration:0.8,onComplete:()=>{own=false;}});setTimeout(()=>{own=false;},1500);};
    lenis.on('scroll',l=>{clearTimeout(tid);if(own)return;if(l.direction)dir=l.direction;tid=setTimeout(settle,220);});}
  // the opening and the overview of the acts in one group: the opening stays (sticky) only while the overview comes up
  // over it, and leaves with it (stuck to the whole page it would show through the acts)
  {const t=$('#topo'),g=document.querySelector('.glance');
    if(t&&g&&t.parentElement===g.parentElement){const w=el('div','capa-pilha'),list=[];for(let n=t;n;n=n.nextElementSibling){list.push(n);if(n===g)break;}t.before(w);w.append(...list);}}
  // the opening: the glass logo turning behind the title, in its own black and white on white with its darks lighter by
  // 21% (greyer, less black; no chrome curve, which read as a picture of poor quality) (the user's clip on pure black,
  // 9aN8ybQAN1NTcLw4Pkufsw: 5 s, 1024 px, its end meets its start; the black keyed out by brightness); its first frame
  // is the still picture shown until the video plays. Plays only in view
  {const topo=$('#topo'),fig=topo&&topo.querySelector('.cover-forma-bg');
    if(fig){const v=el('video','cover-forma');v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.autoplay=true;v.preload='auto';v.setAttribute('aria-hidden','true');
      v.src='apresentacao/sala/logo-vidro-pb-cinza.mp4?v=1';fig.append(v);
      v.addEventListener('playing',()=>fig.classList.add('vivo'),{once:true});
      // it plays while the cover is in view; asked again when it can play and when the page is shown again (a play asked
      // while the page was hidden, or before the video had data, may never start)
      let inView=true;const go=()=>{if(inView&&!document.hidden&&v.paused)v.play().catch(()=>{});};
      v.addEventListener('canplay',go);document.addEventListener('visibilitychange',go);
      new IntersectionObserver(es=>{for(const e of es){inView=e.isIntersecting;if(inView)go();else v.pause();}},{threshold:.05}).observe(topo);}}
  // the bar marks the act on screen
  const nio=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)for(const l of nav.querySelectorAll('a'))l.setAttribute('aria-current',String(l.dataset.key===e.target.dataset.key));},{rootMargin:'-45% 0px -50% 0px'});
  for(const st of acts.values())nio.observe(st.s);
})().catch(err=>{const d=document.getElementById('deck');d.replaceChildren();const s=document.createElement('section');s.className='cover';
  s.textContent='Não foi possível carregar a apresentação: '+err.message+'. Confira se o servidor da galeria está ligado.';d.append(s);});
