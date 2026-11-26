'use strict';

const passengerTypes = [
  {key:'adults', label:'Adultos', age:'A partir de 12 anos'},
  {key:'children', label:'Crianças', age:'De 2 a 11 anos'},
  {key:'infants', label:'Bebês', age:'Menores de 2 anos · no colo, sem tarifa'}
];
const seated = party => party.adults + party.children;
const headcount = party => seated(party) + party.infants;

function validParty(p) {
  return p && passengerTypes.every(({key})=>Number.isInteger(p[key]) && p[key]>=0)
    && p.adults>=1 && seated(p)<=9 && p.infants<=p.adults;
}
function partyFor(query) {
  if (validParty(query.party)) return {...query.party};
  const adults=Number.isInteger(query.count) && query.count>=1 && query.count<=9 ? query.count : 1;
  return {adults,children:0,infants:0};
}
function seatCount(query) {return query.party ? seated(query.party) : query.count}
function passengerLabel(p) {
  return headcount(p)===1 ? '1 adulto' : headcount(p)+' pessoas';
}
function passengerDescription(p) {
  const labels=[['adulto','adultos'],['criança','crianças'],['bebê','bebês']];
  return passengerTypes.flatMap(({key},i)=>p[key] ? [p[key]+' '+labels[i][Number(p[key]>1)]] : []).join(', ');
}
function passengersField() {
  return `<div class="party-field fieldbox">
    <button class="party-trigger" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="party-panel">
      ${icon('people')}<span><small>Passageiros</small><b>${passengerLabel(plan.party)}</b></span>
    </button>
    <div class="selector-panel party-panel" id="party-panel" role="dialog" aria-labelledby="party-heading" inert>
      <h3 id="party-heading">Quem vai viajar?</h3>
      ${passengerTypes.map(({key,label,age})=>`<div class="party-row" role="group" aria-label="${label}">
        <div><strong>${label}</strong><small>${age}</small></div>
        <div class="party-stepper"><button type="button" data-step="-1" data-kind="${key}" aria-label="Diminuir quantidade de ${label.toLowerCase()}">−</button>
        <b data-amount="${key}"></b><button type="button" data-step="1" data-kind="${key}" aria-label="Aumentar quantidade de ${label.toLowerCase()}">+</button></div>
      </div>`).join('')}
      <div class="party-total"><div><small>Total de passageiros</small><strong data-party-total aria-live="polite"></strong></div>
      <button type="button" class="primary" data-party-apply>Confirmar</button></div>
    </div></div>`;
}

// An airport list stays attached to its field in the DOM even in the top layer.
function placeAirportList(panel) {
  const field=panel.parentElement, anchor=field.getBoundingClientRect();
  const view=window.visualViewport, inset=8, gap=7;
  const left=view?.offsetLeft??0, top=view?.offsetTop??0;
  const right=left+(view?.width??document.documentElement.clientWidth);
  const bottom=top+(view?.height??window.innerHeight)-inset;
  let ceiling=top+inset;
  for(const bar of document.querySelectorAll('body > header, #tech-return:not([hidden])')){
    const rect=bar.getBoundingClientRect();
    if(rect.height && rect.top<bottom && rect.bottom>top)
      ceiling=Math.max(ceiling,rect.bottom+inset);
  }
  if(anchor.bottom<=ceiling || anchor.top>=bottom)return false;

  const width=Math.min(330,right-left-2*inset);
  const x=Math.max(left+inset,Math.min(anchor.left,right-inset-width));
  panel.style.width=width+'px';
  const below=Math.max(0,bottom-anchor.bottom-gap);
  const above=Math.max(0,anchor.top-gap-ceiling);
  // A short scrollable list below is preferable to a longer list above.
  const up=below<Math.min(180,panel.scrollHeight+2) && above>below;
  const available=up?above:below;
  if(available<=12)return false;
  panel.style.maxHeight=Math.floor(Math.min(370,available))+'px';
  const y=up?anchor.top-gap-panel.offsetHeight:anchor.bottom+gap;
  const floating=panel.matches('[popover]');
  panel.style.left=(floating?x:x-anchor.left-field.clientLeft)+'px';
  panel.style.top=(floating?y:y-anchor.top-field.clientTop)+'px';
  panel.classList.toggle('above',up);
  return true;
}

function positionPicker(panel){
  if(panel.classList.contains('airport-list'))return placeAirportList(panel);
  placeSelector(panel);
  return true;
}

function placeSelector(panel) {
  const anchor=panel.parentElement.getBoundingClientRect(),view=window.visualViewport;
  const top=view?.offsetTop??0,left=view?.offsetLeft??0;
  const right=left+(view?.width??document.documentElement.clientWidth);
  const bottom=top+(view?.height??window.innerHeight);
  const width=Math.min(panel.classList.contains('party-panel')?340:330,right-left-16);
  const x=Math.max(left+8,Math.min(anchor.left,right-width-8));
  const below=bottom-anchor.bottom-12, above=anchor.top-top-12;
  const up=below<Math.min(300,panel.scrollHeight) && above>below;
  panel.style.width=width+'px';
  panel.style.left=(x-anchor.left-panel.parentElement.clientLeft)+'px';
  panel.style.maxHeight=Math.max(80,Math.min(370,up?above:below))+'px';
  panel.classList.toggle('above',up);
}

function bindSearch(root) {
  let openPanel=null, trigger=null, edit=null;
  const closeTimers=new WeakMap();
  const geometryObserver=window.ResizeObserver && new ResizeObserver(reposition);
  function close() {
    if(!openPanel)return;
    geometryObserver?.disconnect();
    openPanel.inert=true;
    openPanel.classList.remove('is-open');
    if(openPanel.hasAttribute('popover')){
      const panel=openPanel;
      const hide=()=>{if(panel.isConnected && panel.inert)panel.hidePopover()};
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)hide();
      else closeTimers.set(panel,setTimeout(hide,180));
    }
    trigger.setAttribute('aria-expanded','false');
    trigger.removeAttribute('aria-activedescendant');
    openPanel=null;trigger=null;edit=null;
  }
  function open(panel,control) {
    const newlyOpened=panel!==openPanel;
    if(newlyOpened)close();
    trigger=control;openPanel=panel;
    if(panel.classList.contains('airport-list') && typeof panel.showPopover==='function'){
      clearTimeout(closeTimers.get(panel));
      panel.setAttribute('popover','manual');
      if(!panel.matches(':popover-open'))panel.showPopover();
    }
    if(newlyOpened && panel.classList.contains('airport-list')){
      for(const item of [panel.parentElement,document.querySelector('body > header'),document.querySelector('.brand-horizon')])
        if(item)geometryObserver?.observe(item);
    }
    if(!positionPicker(panel)){close();return}
    panel.inert=false;panel.classList.add('is-open');
    control.setAttribute('aria-expanded','true');
  }
  function airportCodes(input) {
    if(input.name==='to' && plan.from)return rede.destinos(plan.from);
    if(input.name==='from' && !plan.from && plan.to)return rede.destinos(plan.to);
    return Object.keys(aeroportos).filter(c=>input.name!=='from'||c!==plan.to);
  }
  function showAirports(input,filter='') {
    const panel=input.closest('.airport-field').querySelector('.airport-list');
    const terms=normalize(filter).split(/\s+/).filter(Boolean);
    const found=airportCodes(input).filter(code=>{
      const a=aeroportos[code],text=normalize([a.cidade,a.pais,a.aeroporto,code].join(' '));
      return terms.every(term=>text.includes(term));
    });
    const groups=[['Hub principal',c=>c===rede.hub],['Destinos nacionais',c=>c!==rede.hub && !rede.porCodigo[c].internacional],['Destinos internacionais',c=>rede.porCodigo[c]?.internacional]];
    panel.innerHTML=groups.map(([label,match])=>{
      const codes=found.filter(match);
      if(!codes.length)return '';
      return `<div role="group" aria-label="${label}"><div class="airport-group-title" aria-hidden="true">${label}</div>
        ${codes.map(c=>`<div class="airport-option" id="op-${input.name}-${c}" role="option" aria-selected="${plan[input.name]===c}" data-airport="${c}">
          <span><strong>${city(c)}</strong><small>${aeroportos[c].aeroporto} · ${aeroportos[c].pais}</small></span><b>${c}</b></div>`).join('')}</div>`;
    }).join('') || '<p role="status">Nenhum aeroporto encontrado. Tente outra cidade, país, aeroporto ou código.</p>';
    panel.scrollTop=0;input.removeAttribute('aria-activedescendant');open(panel,input);
  }
  function setAirport(input,code) {
    plan[input.name]=code;
    if(code)input.value=airportLabel(code);
    if(input.name==='from' && code && plan.to && !rede.destinos(code).includes(plan.to)) {
      plan.to='';input.form.elements.to.value='';input.form.elements.to.setCustomValidity('');
    }
    input.setCustomValidity('');savePlan();
  }
  function commit(input,code) {
    setAirport(input,code);close();
    input.closest('.airport-field').animate?.([{backgroundColor:'#eee8f8'},{backgroundColor:'#fff'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:240});
  }
  function paintParty(changed) {
    for(const {key} of passengerTypes) {
      const amount=openPanel.querySelector('[data-amount="'+key+'"]');
      amount.textContent=edit[key];
      if(key===changed && !matchMedia('(prefers-reduced-motion: reduce)').matches)
        amount.animate?.([{opacity:.5,transform:'translateY(2px)'},{opacity:1,transform:'none'}],{duration:145});
    }
    for(const btn of openPanel.querySelectorAll('[data-step]')){
      const key=btn.dataset.kind;
      btn.disabled=!validParty({...edit,[key]:edit[key]+Number(btn.dataset.step)});
    }
    openPanel.querySelector('[data-party-total]').textContent=headcount(edit)+(headcount(edit)===1?' pessoa':' pessoas');
  }
  function settle(input) {
    const code=matchAirport(input.value,airportCodes(input));
    setAirport(input,code||'');
    if(openPanel && trigger===input)close();
  }
  root.addEventListener('focusin',e=>{
    if(e.target.matches('.airport-field input')){e.target.select();showAirports(e.target)}
  });
  root.addEventListener('focusout',e=>{
    if(e.target.matches('.airport-field input'))settle(e.target);
    else if(openPanel && trigger?.classList.contains('party-trigger') && !openPanel.parentElement.contains(e.relatedTarget) && e.relatedTarget)close();
  });
  root.addEventListener('input',e=>{
    if(!e.target.matches('.airport-field input'))return;
    e.target.setCustomValidity('');showAirports(e.target,e.target.value);
  });
  root.addEventListener('mousedown',e=>{if(e.target.closest('.airport-list'))e.preventDefault()});
  root.addEventListener('click',e=>{
    const option=e.target.closest('[data-airport]');
    if(option){commit(option.closest('.airport-field').querySelector('input'),option.dataset.airport);return}
    const field=e.target.closest('.airport-field');
    if(field && !e.target.closest('.airport-list')){
      const input=field.querySelector('input');
      if(document.activeElement!==input)input.focus();
      if(trigger!==input)showAirports(input);
      return;
    }
    const control=e.target.closest('.party-trigger');
    if(control){
      if(trigger===control){close();return}
      open(control.parentElement.querySelector('.party-panel'),control);
      edit={...plan.party};paintParty();return;
    }
    const step=e.target.closest('[data-step]');
    if(step && edit){
      const key=step.dataset.kind,next={...edit,[key]:edit[key]+Number(step.dataset.step)};
      if(validParty(next)){edit=next;paintParty(key)}
      if(step.disabled)step.parentElement.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
      return;
    }
    if(e.target.closest('[data-party-apply]') && edit){
      plan.party={...edit};plan.count=headcount(edit);plan.students=beneficios.estudantes(plan);savePlan();
      trigger.querySelector('b').textContent=passengerLabel(edit);
      const control=trigger;close();control.focus({preventScroll:true});
    }
  });
  document.addEventListener('pointerdown',e=>{if(openPanel && !openPanel.parentElement.contains(e.target))close()});
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape' && openPanel){
      e.preventDefault();const control=trigger;close();control.focus({preventScroll:true});return;
    }
    const input=e.target;
    if(!input.matches('.airport-field input'))return;
    if(e.key==='Enter' && openPanel && trigger===input){
      e.preventDefault();
      const opts=openPanel.querySelectorAll('[data-airport]');
      const active=document.getElementById(input.getAttribute('aria-activedescendant')) || (opts.length===1?opts[0]:null);
      const code=active?.dataset.airport || matchAirport(input.value,airportCodes(input));
      if(code)commit(input,code);
      return;
    }
    if(!['ArrowDown','ArrowUp'].includes(e.key))return;
    e.preventDefault();if(trigger!==input)showAirports(input);
    const opts=[...openPanel.querySelectorAll('[data-airport]')];if(!opts.length)return;
    const index=opts.findIndex(o=>o.id===input.getAttribute('aria-activedescendant'));
    const next=e.key==='ArrowDown'?(index+1)%opts.length:(index<=0?opts.length:index)-1;
    for(const opt of opts)opt.classList.toggle('active-option',opt===opts[next]);
    input.setAttribute('aria-activedescendant',opts[next].id);opts[next].scrollIntoView({block:'nearest'});
  });
  function reposition(){if(openPanel && (!openPanel.isConnected || !positionPicker(openPanel)))close()}
  window.addEventListener('resize',reposition);
  window.visualViewport?.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,{passive:true});
  window.visualViewport?.addEventListener('scroll',()=>{if(openPanel?.classList.contains('airport-list'))reposition()});
  window.addEventListener('hashchange',close);
}
