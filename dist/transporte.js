'use strict';
const transporte=(()=>{
 const C=transporteCore,key='varion.transporte.v1';
 const fmt=c=>money(c/100);
 const direction=(r,d)=>d==='to'?r.terminal+' → '+r.airport:r.airport+' → '+r.terminal;
 const schedule=s=>dateText(C.dateAt(s.start))+' · '+C.label(s.start)+' – '+C.label(s.end)+(C.dateAt(s.end)!==C.dateAt(s.start)?' (+1 dia)':'');
 const priceRows=items=>{const q=C.quote(items);return [['Transporte terrestre',fmt(q.subtotal)],['Desconto ida e volta (transporte)',q.discount?'− '+fmt(q.discount):fmt(0)]]};
 const details=(items,names=[])=>items.length?'<div class="ground-details"><h3>Seus traslados</h3>'+items.map(s=>'<div><strong>'+esc(direction(C.get(s.code),s.direction))+'</strong><small>'+schedule(s)+' · '+s.passengers.length+' passageiro(s) · '+fmt(C.get(s.code).cents*s.passengers.length)+'</small>'+(names.length?'<small>'+s.passengers.map(p=>esc(names[p]||'Passageiro '+(p+1))).join(', ')+'</small>':'')+'</div>').join('')+'</div>':'';
 const itinerary=(q,f)=>JSON.stringify([q.from,q.to,q.date,q.back,q.count,bookingLegs(f).map(l=>[l.number,l.start,l.end])]);
 let state={id:'',items:{}};
 try{const stored=JSON.parse(sessionStorage.getItem(key));if(stored&&typeof stored.id==='string'&&stored.items&&typeof stored.items==='object')state=stored}catch{}
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(state))}catch{}}
 function clear(){state={id:'',items:{}};persist()}
 function groups(q,f){
  if(!f)return [];
  return bookingLegs(f).flatMap((l,i)=>{
   const international=rede.aeroportos[l.from]?.pais!=='Brasil'||rede.aeroportos[l.to]?.pais!=='Brasil';
   return [['to',l.from],['from',l.to]].flatMap(([d,code])=>{
    const r=C.get(code);if(!r)return [];
    return [{id:i+'-'+d,leg:i,d,code,r,slots:C.compatible(code,d,l,international)}];
   });
  });
 }
 function ensure(q,f){
  const id=itinerary(q,f);if(state.id!==id){state={id,items:{}};persist()}
 }
 function selected(q,f){
  if(!f)return [];ensure(q,f);
  return groups(q,f).flatMap(g=>{
   const v=state.items[g.id],slot=g.slots.find(s=>s.start===v?.start);
   const passengers=Array.isArray(v?.passengers)?[...new Set(v.passengers)].filter(p=>Number.isInteger(p)&&p>=0&&p<q.count):[];
   return slot&&passengers.length?[{...slot,passengers}]:[];
  });
 }
 function option(s){return '<option value="'+s.start+'">'+schedule(s)+'</option>'}
 function integrated(q,f,names){
  ensure(q,f);const gs=groups(q,f);if(!gs.length)return '';
  return '<section class="panel ground-integrated"><div class="ground-heading">'+icon('bus')+'<div><span class="ground-kicker">SERVIÇO OPCIONAL</span><h2>Transporte ao aeroporto</h2><p>Complete sua viagem com um traslado. Economize 10% na ida e volta da mesma rota, por passageiro.</p></div></div>'+gs.map(g=>{
   const v=state.items[g.id]||{},valid=g.slots.some(s=>s.start===v.start);
   const opts=g.slots.map(s=>'<option value="'+s.start+'" '+(s.start===v.start?'selected':'')+'>'+schedule(s)+'</option>').join('');
   return '<details class="ground-leg" '+(valid?'open':'')+'><summary><span><small>Voo de '+(g.leg?'volta':'ida')+' · '+(g.d==='to'?'Antes do embarque':'Após a chegada')+'</small><strong>'+esc(direction(g.r,g.d))+'</strong></span><b>'+fmt(g.r.cents)+'/pessoa</b></summary>'+(g.slots.length?'<div class="ground-leg-body"><label class="formfield">Horário do traslado<select data-ground-time="'+g.id+'"><option value="">Não contratar</option>'+opts+'</select></label><fieldset '+(valid?'':'disabled')+'><legend>Quem utilizará o transporte?</legend>'+Array.from({length:q.count},(_,p)=>'<label class="ground-check"><input type="checkbox" data-ground-person="'+p+'" '+(valid&&v.passengers?.includes(p)?'checked':'')+'> '+esc(names[p]||travelerTitle(q,p))+'</label>').join('')+'</fieldset></div>':'<p class="ground-empty">Não há horários compatíveis com este voo.</p>')+'</details>';
  }).join('')+'<p class="ground-note">Horários locais simulados. Os planos e tarifas aéreas não alteram o preço do traslado.</p></section>';
 }
 function changeIntegrated(e){
  const el=e.target,leg=el.closest('.ground-leg');if(!leg||!el.matches('[data-ground-time],[data-ground-person]'))return false;
  const select=leg.querySelector('[data-ground-time]'),fieldset=leg.querySelector('fieldset');
  const previous=state.items[select.dataset.groundTime];
  if(el===select){fieldset.disabled=!select.value;if(!select.value)fieldset.querySelectorAll('input').forEach(c=>c.checked=false)}
  if(select.value)state.items[select.dataset.groundTime]={start:Number(select.value),passengers:Array.from(fieldset.querySelectorAll('input:checked'),c=>Number(c.dataset.groundPerson))};
  else delete state.items[select.dataset.groundTime];
  persist();const target=document.querySelector('[data-ground-summary]');if(target)target.innerHTML=summary(search,flight,draft.names);
  return true;
 }
 const routeOptions=()=>C.routes.map(r=>'<option value="'+r.code+'">'+esc(r.terminal)+' / '+r.code+'</option>').join('');
 function page(){
  return section('Transporte ao aeroporto','Da rodoviária ao aeroporto, ou do aeroporto à cidade. Contrate o traslado mesmo sem passagem aérea.',
  '<div class="ground-banner"><div><span class="ground-kicker">VARION · MOBILIDADE</span><h2>Seu próximo destino começa em terra.</h2><p>Traslados nos dois sentidos, com horários programados e tarifa por pessoa.</p></div><div class="ground-offer">'+icon('bus')+'<strong>10% de desconto</strong><span>na ida e volta da mesma rota</span></div></div><div class="ground-routes">'+C.routes.map(r=>'<article><span class="ground-code">'+r.code+'</span><h3>'+esc(r.terminal)+'</h3><p>↔ '+esc(r.airport)+'</p><div><small>Por pessoa / trecho · '+r.minutes+' min</small><b>'+fmt(r.cents)+'</b></div></article>').join('')+'</div><div class="split ground-book"><form class="panel" id="groundform"><h2>Reserve seu transporte</h2><label class="formfield">Rota<select name="route">'+routeOptions()+'</select></label><label class="formfield">Origem e destino<select name="direction"><option value="to">Rodoviária → aeroporto</option><option value="from">Aeroporto → rodoviária</option></select></label><p data-ground-direction class="ground-note"></p><label class="formfield">Tipo de viagem<select name="trip"><option value="one">Somente este trecho</option><option value="round">Ida e volta</option></select></label><div class="ground-fields"><label class="formfield">Data do primeiro trecho<input required type="date" name="date" min="'+C.dateAt(Date.now())+'" value="'+C.dateAt(Date.now())+'"></label><label class="formfield">Horário<select required name="time"><option value="">Selecione</option></select></label></div><div class="ground-fields" data-ground-return hidden><label class="formfield">Data da volta<input type="date" name="backDate" disabled></label><label class="formfield">Horário da volta<select name="backTime" disabled><option value="">Selecione</option></select></label></div><label class="formfield">Passageiros<select name="count">'+Array.from({length:9},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+'</option>').join('')+'</select></label><button class="primary">Confirmar transporte</button><p class="error" data-ground-error role="status"></p></form><aside class="panel ground-summary"><h2>Resumo do traslado</h2><div data-ground-standalone aria-live="polite"></div><p class="ground-note">Reserva simulada, sem cobrança e sem necessidade de dados pessoais. Durações e horários são estimados.</p></aside></div>');
 }
 function formItems(form){
  const f=form.elements,code=f.route.value,d=f.direction.value,n=Number(f.count.value),now=Date.now();
  if(!Number.isInteger(n)||n<1||n>9)return [];
  const passengers=Array.from({length:n},(_,i)=>i);
  const first=C.slots(code,d,f.date.value,now).find(s=>s.start===Number(f.time.value));
  if(!first)return [];
  if(f.trip.value==='one')return [{...first,passengers}];
  const back=C.slots(code,d==='to'?'from':'to',f.backDate.value,now).find(s=>s.start===Number(f.backTime.value)&&s.start>=first.end);
  return back?[{...first,passengers},{...back,passengers}]:[];
 }
 function updateForm(form){
  const f=form.elements,code=f.route.value,d=f.direction.value,round=f.trip.value==='round',r=C.get(code);
  form.querySelector('[data-ground-direction]').textContent=direction(r,d)+(round?' · e retorno no sentido inverso':'');
  const setOptions=(el,slots)=>{const previous=el.value;el.innerHTML='<option value="">Selecione</option>'+slots.map(option).join('');if(slots.some(s=>String(s.start)===previous))el.value=previous;};
  const now=Date.now(),firstSlots=C.slots(code,d,f.date.value,now);
  setOptions(f.time,firstSlots);
  const first=firstSlots.find(s=>String(s.start)===f.time.value);
  const backFields=form.querySelector('[data-ground-return]');backFields.hidden=!round;
  f.backDate.disabled=f.backTime.disabled=!round;f.backDate.required=f.backTime.required=round;
  f.backDate.min=first?C.dateAt(first.end):f.date.value||C.dateAt(now);
  if(round&&(!f.backDate.value||f.backDate.value<f.backDate.min))f.backDate.value=f.backDate.min;
  setOptions(f.backTime,C.slots(code,d==='to'?'from':'to',f.backDate.value,now).filter(s=>first&&s.start>=first.end));
  const count=Number(f.count.value), subtotal=r.cents*count*(round?2:1),discount=round?Math.round(subtotal*C.rules.discount/100):0;
  const items=formItems(form);
  document.querySelector('[data-ground-standalone]').innerHTML=details(items)+rows([['Passageiros',count],['Transporte terrestre',fmt(subtotal)],['Desconto ida e volta',discount?'− '+fmt(discount):fmt(0)],['Total',fmt(subtotal-discount),'total']])+(items.length?'':'<p class="ground-note">Selecione datas e horários disponíveis para confirmar.</p>');
  form.querySelector('[data-ground-error]').textContent=!firstSlots.length?'Não há horários disponíveis para a data escolhida.':'';
 }
 function confirm(form){
  const items=formItems(form),error=form.querySelector('[data-ground-error]');
  if(!items.length){error.textContent='Selecione horários válidos e uma volta posterior à chegada da ida.';return}
  try{
   let code;const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   do{code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>chars[n%chars.length]).join('')}while(localStorage.getItem(storagePrefix+code));
   localStorage.setItem(storagePrefix+code,JSON.stringify({code,groundOnly:true,transport:items}));
   go('emitida/'+code);
  }catch{error.textContent='Não foi possível salvar a reserva neste navegador.'}
 }
 function receipt(r,confirmed){
  const items=r.transport||[],q=C.quote(items);
  return section(confirmed?'Transporte confirmado':'Sua reserva de transporte','Guarde o código para consultar o traslado neste navegador.','<article class="ticket"><div class="tickethead">'+brand+'<span>Reserva ilustrativa</span></div><div class="ticketbody">'+details(items)+rows([...priceRows(items),['Total',fmt(q.total),'total']])+'<p class="note">Simulação sem cobrança e sem validade para embarque.</p></div><div class="codearea"><small>Código da reserva</small><strong>'+esc(r.code)+'</strong></div></article><div class="actions"><a class="primary" href="#reservas">Minhas reservas</a><a class="secondary" href="#servicos/transporte">Novo transporte</a></div>',true);
 }
 return {selected,clear,priceRows,details,integrated,changeIntegrated,page,updateForm,confirm,receipt};
})();
