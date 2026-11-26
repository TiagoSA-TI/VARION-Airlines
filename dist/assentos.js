'use strict';
const cabine=(()=>{
  let legIndex=0,passenger=0,seats=[],pendingExit=null,openCategory='extra',leaving=false;
  const leg=()=>bookingLegs(flight)[legIndex];
  const model=()=>frota[leg().aircraft];
  const root=()=>document.querySelector('.seat-page');
  const find=id=>seats.find(s=>s.id===id);
  const assigned=i=>leg().seats?.[i];
  const person=i=>esc(draft?.names?.[i]||travelerTitle(search,i));
  const cost=n=>n?money(n):'Incluído';
  const stateNames={selected:'Selecionado',occupied:'Ocupado',blocked:'Indisponível',other:'Outra cabine'};
  function activate(i){
    legIndex=i;seats=cabinSeats(leg());pendingExit=null;openCategory=leg().fare==='Executiva'?'business':'extra';
    passenger=Array.from({length:seatCount(search)},(_,n)=>n).find(n=>!assigned(n))??0;
  }
  // One upholstery drawing at both scales. Stitching, seams and status marks
  // remain independent of the commercial category and its colour.
  function symbols(){
    return `<svg class="chair-defs" aria-hidden="true"><defs>
      <g id="chair-frame" stroke-linejoin="round">
        <path class="chair-shell" d="M-17-11Q-17-17-11-18Q0-20 11-18Q17-17 17-11L16 13Q16 18 11 19Q0 21-11 19Q-16 18-16 13Z"/>
        <path class="chair-pan" d="M-12-5Q0-8 12-5L12 9Q12 13 8 14Q0 16-8 14Q-12 13-12 9Z"/>
        <path class="chair-back" d="M-14-12Q-14-16-10-16Q0-18 10-16Q14-16 14-12L13-6Q0-9-13-6Z"/>
        <path class="chair-arms" d="M-18-6q2-2 4 0v14q-2 3-4 0ZM14-6q2-2 4 0v14q-2 3-4 0Z"/>
        <path class="chair-stitch" d="M-9 10q9 3 18 0"/>
      </g>
      <g id="chair-business" stroke-linejoin="round">
        <path class="chair-shell" d="M-24-20Q-24-24-17-25H17Q24-25 24-18V18Q24 24 17 25H-16Q-24 25-24 18Z"/>
        <path class="chair-pan" d="M-16-8Q0-12 16-8V10Q16 16 10 16H-10Q-16 16-16 10Z"/>
        <path class="chair-back" d="M-17-17Q0-23 17-17L15-9Q0-13-15-9Z"/>
        <path class="chair-arms" d="M-25-14h5v33h-5Zm45 0h5v33h-5Z"/>
        <path class="chair-stitch" d="M-10 19h20M-28-21v44"/>
      </g>
      <path id="mark-other" d="M-5 2h10"/>
      <path id="trim-extra" d="M-8-13q8-2 16 0m-16 3q8-2 16 0"/>
      <path id="trim-preferred" d="M-6-11l6-3 6 3"/>
      <path id="mark-selected" d="m-6 2 4 4 8-9"/>
      <path id="mark-occupied" d="m-4-2 8 8m-8 0 8-8"/>
      <path id="mark-blocked" d="M-5 7 5-4"/>
    </defs></svg>`;
  }
  function chair(category,state='available'){
    const mark=state==='available'?(['standard','business'].includes(category)?'':'trim-'+category):'mark-'+state;
    return `<g class="upholstery"><use href="#${category==='business'?'chair-business':'chair-frame'}"/>${mark?`<use class="chair-mark" href="#${mark}"/>`:''}</g>`;
  }
  function sample(category,state='available'){
    return `<svg class="seat-sample ${category} ${state}" viewBox="${category==='business'?'-32 -30 64 60':'-23 -24 46 48'}" aria-hidden="true">${chair(category,state)}</svg>`;
  }
  function categories(){
    return `<h2>Tipos de assento</h2><div class="seat-categories">${(leg().fare==='Executiva'?['business']:['extra','preferred','standard']).map(k=>{
      const t=seatTypes[k],fee=categoryFee(leg(),k);
      return `<div class="seat-category ${k}"><button type="button" aria-controls="benefits-${k}" aria-expanded="${openCategory===k}" data-seat-category="${k}">${sample(k)}<span><strong>${t.label}</strong><small>${fee?'A partir de <b>'+money(fee)+'</b>':'Incluído na tarifa '+leg().fare}</small></span><i class="category-chevron"></i></button><div class="category-fold" id="benefits-${k}" aria-hidden="${openCategory!==k}" ${openCategory!==k?'inert':''}><div><ul>${t.benefits.map(b=>'<li>'+b+'</li>').join('')}</ul></div></div></div>`;
    }).join('')}</div><div class="seat-legend"><h3>Disponibilidade</h3>${[['available','Disponível'],...Object.entries(stateNames).filter(([key])=>key!=='other'||model().businessRows)].map(([s,label])=>`<span>${sample('standard',s)}${label}</span>`).join('')}</div>`;
  }
  function legTabs(){
    return bookingLegs(flight).map((l,i)=>`<button type="button" data-seat-leg="${i}" aria-pressed="${i===legIndex}"><span>${i?'Volta':'Ida'} · ${dateText(l.date)}</span><strong>${city(l.from)} <i aria-hidden="true">→</i> ${city(l.to)}</strong></button>`).join('');
  }
  function mapHeader(){
    const m=model(),l=leg();
    return `<div class="map-ident"><div><small>Voo ${l.number} · ${l.fare}</small><h2>${m.name}</h2></div><span>${capacidade(l.aircraft)} assentos<br>${m.businessRows?'12 na executiva · 156 na econômica':m.rows+' fileiras · '+m.letters.length/2+'–'+m.letters.length/2}</span></div>`;
  }
  function glyphLabel(s,owner){
    const status=owner>=0?'Selecionado para '+person(owner):stateNames[s.state]||cost(s.fee);
    return [s.id,seatTypes[s.category].label,s.position,s.exit?'Saída de emergência':'',status].filter(Boolean).join(', ');
  }
  function seatGlyph(s,x,y,first){
    const owner=(leg().seats||[]).indexOf(s.id),state=owner>=0?'selected':s.state,label=glyphLabel(s,owner);
    return `<g transform="translate(${x} ${y})" class="seat-glyph ${s.category} ${state}" data-chair="${s.id}" role="button" tabindex="${s.id===first?0:-1}" aria-disabled="${s.state!=='available'||(owner>=0&&owner!==passenger)||(s.exit&&!exitEligible(search,passenger))}" aria-pressed="${owner>=0}" aria-label="${label}"><title>${label}</title><rect class="chair-hit" x="-21" y="-24" width="42" height="48" rx="7"/>${chair(s.category,state)}</g>`;
  }
  function diagram(){
    const m=model(),id=leg().aircraft,n=m.letters.length/2,w=n===2?118:id==='max8'?161:165;
    const nose=m.nose*.75,exitRows=m.extra.filter(r=>r>(m.businessRows||0)+1);
    const x=i=>i<n?-38-(n-i-1)*47:38+(i-n)*47;
    const y=r=>nose+78+(r-1)*53+exitRows.filter(e=>e<=r).length*27+
      (m.businessRows?32+Math.min(r-1,m.businessRows)*20+(r>m.businessRows?45:0):0);
    const xBusiness=i=>[-102,-42,42,102][i];
    const columns=(letters,xx,yy)=>[...letters].map((c,i)=>`<text class="seat-col" x="${xx(i)}" y="${yy}">${c}</text>`).join('');
    const band=(yy,label)=>`<g class="cabin-divider" transform="translate(0 ${yy})"><path d="M-147 0h81m132 0h81"/><text y="3">${label}</text></g>`;
    const end=y(m.rows)+56,h=end+m.tail,wing=y(m.wing)-38;
    const tip=id==='a319'?.30:id==='max8'?.56:.72;
    const hull=`M0 4C${w*tip} 7 ${w} ${nose*.52} ${w} ${nose+26}V${end}Q${w-6} ${end+m.tail*.6} 5 ${h}Q0 ${h+2} -5 ${h}Q-${w-6} ${end+m.tail*.6} -${w} ${end}V${nose+26}C-${w} ${nose*.52} -${w*tip} 7 0 4Z`;
    const mirrored=fn=>[1,-1].map(sign=>`<g transform="scale(${sign} 1)">${fn()}</g>`).join('');
    const wings=mirrored(()=>`<path class="wing" d="M${w-8} ${wing}l135 ${m.sweep} 4 -9 3 22 -77 -31 -68 -12Z"/><path class="wing-seam" d="M${w} ${wing+22}l104 ${m.sweep-28}m-104 -1 66 14"/><path class="wing" d="M${w-18} ${end}l75 63 -2 11 -112 -37Z"/>`);
    const windows=Array.from({length:m.rows},(_,i)=>`<path d="M${w-4} ${y(i+1)-9}v10m0 7v7"/>`).join('');
    const fittings=mirrored(()=>`<g class="cabin-windows">${windows}</g><path class="cockpit-glass" d="M4 ${nose*.36}Q24 ${nose*.32} 43 ${nose*.49}l-6 8Q19 ${nose*.45} 4 ${nose*.48}ZM47 ${nose*.53}l15 13 -3 7 -18 -11Z"/><path class="door-trim" d="M${w-2} ${nose+18}v16m0 ${end-nose-48}v16"/>`);
    const service=yy=>`<g class="service-fittings" transform="translate(0 ${yy})"><path d="M-${w-12} -7h40v18h-35ZM${w-12} -7h-46v18h41Z"/><text x="-${w-32}" y="5">WC</text><text x="${w-34}" y="5">SERVIÇO</text></g>`;
    const first=assigned(passenger)||seats.find(s=>s.state==='available')?.id;
    const gates=exitRows.map(r=>`<g class="exit-band" transform="translate(0 ${y(r)-36})"><path d="M-${w+3} 0h${w-68}m142 0h${w-68}"/><text y="3">SAÍDA DE EMERGÊNCIA</text><path class="exit-door" d="M-${w-2} -7v14M${w-2} -7v14"/></g>`).join('');
    return `<svg class="cabin-drawing type-${id}" viewBox="-${w+44} 0 ${(w+44)*2} ${h+7}" role="group" aria-label="Mapa de assentos de ${m.name}"><g aria-hidden="true">${wings}<path class="hull" d="${hull}"/><path class="inner-hull" d="M-${w-9} ${nose+35}V${end-20}M${w-9} ${nose+35}V${end-20}"/>${fittings}${service(nose+23)}${service(end-7)}
      <path class="aisle" d="M0 ${y(1)-34}V${y(m.rows)+21}"/>${gates}
      ${m.businessRows?band(y(1)-63,'EXECUTIVA')+columns(m.businessLetters,xBusiness,y(1)-36)+band(y(4)-60,'ECONÔMICA')+columns(m.letters,x,y(4)-30):columns(m.letters,x,y(1)-30)}
      ${Array.from({length:m.rows},(_,i)=>`<text class="row-num" y="${y(i+1)+4}">${i+1}</text>`).join('')}</g>
      ${seats.map(s=>seatGlyph(s,s.category==='business'?xBusiness(s.col):x(s.col),y(s.row),first)).join('')}</svg>`;
  }
  function amount(){
    const {beneficio,passagens,adicionais,total}=precificacao.resumo(search,flight);
    const ground=transporteCore.quote(transporte.selected(search,flight));
    return `${beneficio.plano?beneficios.detalhe(beneficio):'<div><span>Passagens</span><b>'+money(passagens)+'</b></div>'}<div><span>Escolha de assentos</span><b>${money(adicionais)}</b></div>${ground.subtotal?'<div><span>Transporte terrestre</span><b>'+money(ground.subtotal/100)+'</b></div><div><span>Desconto do transporte</span><b>− '+money(ground.discount/100)+'</b></div>':''}<div class="seat-grand"><strong>Total da viagem</strong><strong>${money((Math.round(total*100)+ground.total)/100)}</strong></div>`;
  }
  function roster(){
    const p=partyFor(search);
    return Array.from({length:seatCount(search)},(_,i)=>{
      const s=find(assigned(i));
      return `<div class="person-row" data-active="${i===passenger}"><button type="button" data-seat-person="${i}" aria-pressed="${i===passenger}">
        <b class="seat-badge">${s?s.id:'—'}</b><span><strong>${person(i)}</strong><small>${s?seatTypes[s.category].label+' · '+s.position:'Assento a escolher'}${i<p.infants?' · Com bebê de colo':''}</small>${s?'<small class="person-fee">'+cost(s.fee)+'</small>':''}</span></button>
        ${s?`<button type="button" class="seat-erase" data-seat-remove="${i}" aria-label="Remover ${s.id} de ${person(i)}">×</button>`:''}</div>`;
    }).join('');
  }
  function nextLabel(){
    if(!legIndex&&flight.returnLeg)return 'Escolher assentos da volta';
    return bookingLegs(flight).some(l=>l.seats?.some(Boolean))?'Continuar com a seleção':'Continuar sem escolher';
  }
  function side(){
    const p=partyFor(search),l=leg();
    return `<h2>Passageiros</h2><p class="side-leg">${l.from} → ${l.to} · ${l.departure} – ${arrivalLabel(l)}</p><div class="seat-roster">${roster()}</div>${p.infants?'<p class="seat-infants">Bebês de colo viajam sem assento próprio.</p>':''}
      <div class="seat-bill">${amount()}</div><button type="button" class="primary seat-next" data-seat-next>${nextLabel()} <i aria-hidden="true">→</i></button>
      ${!legIndex&&flight.returnLeg?'<button type="button" class="seat-later" data-seat-finish>Continuar para os dados dos passageiros</button>':''}<p class="seat-note">Você pode deixar lugares em aberto para depois, sem custo nesta etapa.</p>`;
  }
  function page(){
    leaving=false;openCategory='extra';activate(0);
    return `<div class="wrap sub seat-page">${symbols()}<header class="seat-heading"><div><a class="crumb" href="#voos">← Voltar aos voos</a><h1>Escolha seus assentos</h1></div></header>
      <nav class="seat-legs" aria-label="Trechos da viagem">${legTabs()}</nav>
      <div class="seat-layout"><aside class="seat-catalog" aria-label="Categorias e disponibilidade">${categories()}</aside>
      <section class="seat-map-area" aria-label="Cabine da aeronave"><div class="map-header">${mapHeader()}</div>
      <div class="seat-scroll" tabindex="0" aria-label="Role para percorrer a cabine. Nas poltronas, use as setas para navegar e Enter para escolher.">${diagram()}</div>
      <div class="seat-inspector" role="status">Escolhendo para <strong>${person(passenger)}</strong></div></section>
      <aside class="seat-side" aria-label="Resumo da seleção">${side()}</aside></div>
      <dialog class="exit-check" aria-labelledby="exit-title"><form method="dialog"><h2 id="exit-title">Fileira de emergência</h2><p class="exit-context"></p><p>Para ocupar este assento, o passageiro precisa ter pelo menos 15 anos, compreender as instruções da tripulação e poder ajudar sem assistência ou responsabilidades que impeçam essa atuação.</p><div><button type="button" class="primary" data-seat-accept>Confirmar elegibilidade e escolher</button><button type="button" class="seat-later" data-seat-cancel>Escolher outro lugar</button></div></form></dialog></div>`;
  }
  function say(html){root().querySelector('.seat-inspector').innerHTML=html}
  function repaint(oldSeat,newSeat,focusSelector){
    const el=root(),list=el.querySelector('.seat-roster'),offset=list.scrollTop;
    list.innerHTML=roster();list.scrollTop=offset;
    const bill=el.querySelector('.seat-bill'),value=amount();
    if(bill.innerHTML!==value){bill.innerHTML=value;bill.querySelector('.seat-grand').animate?.(matchMedia('(prefers-reduced-motion: reduce)').matches?[]:[{opacity:.55},{opacity:1}],180)}
    el.querySelector('[data-seat-next]').innerHTML=nextLabel()+' <i aria-hidden="true">→</i>';
    for(const g of el.querySelectorAll('[data-chair]')){
      const s=find(g.dataset.chair),owner=(leg().seats||[]).indexOf(s.id),state=owner>=0?'selected':s.state;
      g.setAttribute('aria-disabled',String(s.state!=='available'||(owner>=0&&owner!==passenger)||(s.exit&&!exitEligible(search,passenger))));
      if(s.id!==oldSeat && s.id!==newSeat)continue;
      g.setAttribute('class','seat-glyph '+s.category+' '+state+' seat-changed');
      g.setAttribute('aria-pressed',String(owner>=0));g.setAttribute('aria-label',glyphLabel(s,owner));
      g.querySelector('title').innerHTML=glyphLabel(s,owner);g.querySelector('.upholstery').outerHTML=chair(s.category,state);
    }
    if(focusSelector)el.querySelector(focusSelector)?.focus({preventScroll:true});
  }
  function switchLeg(i){
    if(legIndex===i)return;
    activate(i);const el=root();
    el.querySelector('.seat-legs').innerHTML=legTabs();el.querySelector('.seat-catalog').innerHTML=categories();
    el.querySelector('.map-header').innerHTML=mapHeader();el.querySelector('.seat-side').innerHTML=side();
    const sc=el.querySelector('.seat-scroll');sc.innerHTML=diagram();sc.scrollTop=0;
    el.querySelector('[data-seat-leg="'+i+'"]').focus({preventScroll:true});say('Escolhendo para <strong>'+person(passenger)+'</strong>');
  }
  function saveSeat(i,s){
    const l=leg(),old=assigned(i);
    (l.seats??=[])[i]=s?.id||null;(l.exitAccepted??=[])[i]=s?.exit?s.id:null;
    if(!legIndex && outbound){outbound.seats=l.seats;outbound.exitAccepted=l.exitAccepted}
    saveSelection();
    if(s){const next=Array.from({length:seatCount(search)},(_,idx)=>idx).find(idx=>!assigned(idx));passenger=next??i}else passenger=i;
    repaint(old,s?.id,s?null:'[data-seat-person="'+i+'"]');
    say(s?`<strong>${s.id} · ${person(i)}</strong> ${seatTypes[s.category].label} · ${s.position} · ${cost(s.fee)}${passenger!==i?' · Agora escolha para '+person(passenger):''}`:'Assento removido. Escolhendo para <strong>'+person(i)+'</strong>');
  }
  function selectSeat(id){
    const s=find(id);if(!s)return;
    const owner=(leg().seats||[]).indexOf(id);
    if(owner>=0){say(`<strong>${id} · ${person(owner)}</strong> Para trocar, selecione esse passageiro e escolha outra poltrona.`);return}
    if(s.state!=='available'){say('<strong>'+id+'</strong> '+stateNames[s.state]);return}
    if(s.exit){
      if(!exitEligible(search,passenger)){say('<strong>'+id+' · Saída de emergência</strong> Escolha outra fileira para '+person(passenger)+'.');return}
      pendingExit=id;const dlg=root().querySelector('.exit-check');
      dlg.querySelector('.exit-context').textContent=id+' · '+seatTypes[s.category].label+' · '+cost(s.fee);dlg.showModal();return;
    }
    saveSeat(passenger,s);
  }
  function finish(){
    if(leaving)return;leaving=true;const el=root();el.classList.add('seat-leaving');
    setTimeout(()=>{if(root()===el)go('passageiros')},matchMedia('(prefers-reduced-motion: reduce)').matches?0:110);
  }
  function click(e){
    const btn=e.target.closest('button,[data-chair]');if(!btn||!btn.closest('.seat-page'))return;
    if(btn.hasAttribute('data-seat-category')){
      const k=btn.dataset.seatCategory;openCategory=openCategory===k?null:k;
      root().querySelectorAll('[data-seat-category]').forEach(b=>{const open=b.dataset.seatCategory===openCategory;b.setAttribute('aria-expanded',open);const fold=document.getElementById(b.getAttribute('aria-controls'));fold.setAttribute('aria-hidden',!open);fold.inert=!open});return;
    }
    if(btn.hasAttribute('data-chair')){focusSeat(btn);selectSeat(btn.dataset.chair);return}
    if(btn.hasAttribute('data-seat-cancel')){pendingExit=null;root().querySelector('.exit-check').close();return}
    if(btn.hasAttribute('data-seat-accept')){
      const s=find(pendingExit);root().querySelector('.exit-check').close();pendingExit=null;
      if(s?.exit && s.state==='available' && exitEligible(search,passenger) && !leg().seats?.includes(s.id))saveSeat(passenger,s);return;
    }
    if(btn.hasAttribute('data-seat-leg')){switchLeg(Number(btn.dataset.seatLeg));return}
    if(btn.hasAttribute('data-seat-person')){passenger=Number(btn.dataset.seatPerson);repaint(null,null,'[data-seat-person="'+passenger+'"]');say('Escolhendo para <strong>'+person(passenger)+'</strong>');return}
    if(btn.hasAttribute('data-seat-remove')){saveSeat(Number(btn.dataset.seatRemove),null);return}
    if(btn.hasAttribute('data-seat-next')&&!legIndex&&flight.returnLeg){switchLeg(1);return}
    if(btn.hasAttribute('data-seat-next')||btn.hasAttribute('data-seat-finish'))finish();
  }
  function focusSeat(g){
    root().querySelector('[data-chair][tabindex="0"]')?.setAttribute('tabindex','-1');g.setAttribute('tabindex','0');g.focus({preventScroll:true});
  }
  function key(e){
    const g=e.target.closest('[data-chair]');if(!g)return;
    const s=find(g.dataset.chair);
    if(e.key==='Enter'||e.key===' '){e.preventDefault();selectSeat(s.id);return}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();
    const horizontal=e.key==='ArrowLeft'||e.key==='ArrowRight';
    const step=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1;
    const row=seats.filter(v=>v.row===s.row+(horizontal?0:step));
    const next=horizontal?row[s.col+step]:row.find(v=>v.id.slice(-1)===s.id.slice(-1))||row[Math.min(s.col,row.length-1)];
    if(!next)return;
    const target=root().querySelector('[data-chair="'+next.id+'"]');focusSeat(target);target.scrollIntoView({block:'nearest'});say(target.getAttribute('aria-label').replace(/&/g,'&amp;').replace(/</g,'&lt;'));
  }
  return {page,click,key};
})();
