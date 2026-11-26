'use strict';
const {aeroportos} = rede;
const city = code => aeroportos[code].cidade;
const airportLabel = code => city(code)+' ('+code+')';
const routeName = q => city(q.from)+' → '+city(q.to);
const today = () => rede.local(Date.now(),'CNF').data;
const dateText = iso => iso.split('-').reverse().join('/');
const duration = n => Math.floor(n/60)+'h'+String(n%60).padStart(2,'0');
const shortDay = iso => new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(iso+'T12:00Z')).replace('.','');
const searchKey='varion.busca.v2';
function defaultSearch() {return {from:'',to:'',date:'',back:'',round:false,count:1,party:{adults:1,children:0,infants:0}}}
function validQuery(q) {
  return q && rede.destinos(q.from).includes(q.to) && rede.dataValida(q.date) && q.date>=today() && Number.isInteger(q.count) && (q.party ? validParty(q.party) && q.count===headcount(q.party) : q.count>=1 && q.count<=9) && typeof q.round==='boolean' && (!q.round || (rede.dataValida(q.back) && q.back>=q.date));
}
function restoreSearch() {
  try {const q=JSON.parse(sessionStorage.getItem(searchKey));if(validQuery(q)) return q;}catch{}
  return defaultSearch();
}
let search=restoreSearch(), outbound=null, flight=null, draft=null;
function remember() {try{sessionStorage.setItem(searchKey,JSON.stringify(search))}catch{}}
// The editable form and the submitted itinerary have independent lifetimes.
const formKey='varion.planejamento.v1';
function restorePlan() {
  let saved;
  try {saved=JSON.parse(sessionStorage.getItem(formKey))}catch{}
  const src=saved || search, plan=defaultSearch();
  plan.from=Object.hasOwn(aeroportos,src.from)?src.from:'';
  plan.to=Object.hasOwn(aeroportos,src.to) && (!plan.from || rede.destinos(plan.from).includes(src.to))?src.to:'';
  plan.date=rede.dataValida(src.date) && src.date>=today()?src.date:'';
  plan.back=(saved || src.round) && plan.date && rede.dataValida(src.back) && src.back>=plan.date?src.back:'';
  plan.party=partyFor(src);plan.count=headcount(plan.party);
  plan.students=beneficios.estudantes({...plan,students:src.students});
  return plan;
}
let plan=restorePlan();
function savePlan(){try{sessionStorage.setItem(formKey,JSON.stringify(plan))}catch{}}
function setPlanFromResults(){plan={...search,party:partyFor(search),back:search.round?search.back:''};savePlan()}
// Mantém o valor escolhido durante a reserva, inclusive se a data da consulta mudar.
const selectionKey='varion.trechos.v2';
function saveSelection() {
  const key=leg=>leg && [leg.number,leg.fare,leg.seats||[],leg.exitAccepted||[],leg.price,!!leg.emCampanha];
  try {
    sessionStorage.setItem(selectionKey,JSON.stringify({query:JSON.stringify(search),ida:key(flight||outbound),volta:key(flight?.returnLeg)}));
  } catch {}
}
function restoreSelection() {
  try {
    const saved=JSON.parse(sessionStorage.getItem(selectionKey));
    if(!saved || saved.query!==JSON.stringify(search))return;
    function findLeg(from,to,date,key) {
      if(!key)return null;
      const f=rede.voos(from,to,date).find(item=>item.number===key[0]);
      const fare=f?.tarifas.find(t=>t.nome===key[1] && t.lugares>=seatCount(search));
      return fare?{...f,fare:fare.nome,emCampanha:key[5]??fare.emCampanha,price:Number.isFinite(key[4]) && key[4]>=0?key[4]:fare.valor,seats:restoredSeats({...f,fare:fare.nome},key[2],seatCount(search),search,key[3]),exitAccepted:key[3]||[]}:null;
    }
    const ida=findLeg(search.from,search.to,search.date,saved.ida);
    if(!ida)return;
    if(!search.round){flight=ida;return}
    outbound=ida;
    const volta=findLeg(search.to,search.from,search.back,saved.volta);
    if(volta && volta.start>=ida.end+45*60000)flight={...ida,returnLeg:volta};
  } catch {}
}
restoreSelection();
function resetSelection(){outbound=null;flight=null;draft=null;saveSelection()}
function bookDestination(code,offerDate) {
  if(!rede.porCodigo[code])return;
  plan.from=rede.hub;plan.to=code;
  if(rede.dataValida(offerDate) && offerDate>=today()){plan.date=offerDate;if(plan.back<offerDate)plan.back=''}
  savePlan();tab='busca';go('buscar');
}
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function matchAirport(value,codes) {
  const key=normalize(value);
  return codes.find(c=>[c,city(c),airportLabel(c),aeroportos[c].aeroporto].some(v=>normalize(v)===key));
}
function airportField(name,label,code) {
  return '<div class="airport-field fieldbox">'+icon(name==='from'?'takeoff':'land')+
    '<span><label for="airport-'+name+'">'+label+'</label><input id="airport-'+name+'" name="'+name+'" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="list-'+name+'" placeholder="Cidade ou IATA" title="Busque por cidade, país, aeroporto ou código IATA" autocomplete="off" spellcheck="false" required value="'+(code?airportLabel(code):'')+'"></span><div class="airport-list selector-panel" id="list-'+name+'" role="listbox" aria-label="'+label+'" inert></div></div>';
}
function dateField(name,label,value) {
  return '<button class="fieldbox travel-date" type="button" data-date-field="'+name+'" aria-haspopup="dialog" aria-expanded="false">'+icon('calendar')+'<span><small>'+label+'</small><b class="'+(value?'':'placeholder')+'">'+(value?dateText(value):name==='date'?'Selecionar ida':'Adicionar volta')+'</b></span></button>';
}
function searchForm() {
  return '<form id="searchform"><div class="searchgrid route-fields">'+airportField('from','Origem',plan.from)+airportField('to','Destino',plan.to)+
    dateField('date','Data de ida',plan.date)+dateField('back','Volta (opcional)',plan.back)+
    passengersField()+'<button class="primary">'+icon('search')+' Buscar voos</button></div></form>';
}
function submitSearch(form) {
  const f=form.elements,from=matchAirport(f.from.value,Object.keys(aeroportos)),to=matchAirport(f.to.value,rede.destinos(from));
  if(!from||!to){const el=!from?f.from:f.to;el.setCustomValidity('Selecione um aeroporto disponível na lista.');el.reportValidity();return}
  if(!plan.date || plan.date<today()){calendario.abrir(form.querySelector('[data-date-field=date]'));return}
  const q={from,to,date:plan.date,back:plan.back,round:!!plan.back,count:headcount(plan.party),party:{...plan.party},students:beneficios.estudantes(plan)};
  if(!validQuery(q))return;
  search=q;remember();setPlanFromResults();resetSelection();go('voos');
}
function legQuery(back) {return back?{from:search.to,to:search.from,date:search.back}:search}
let dataCotacao;
function optionsFor(back,date) {
  const q=legQuery(back);
  return rede.voos(q.from,q.to,date,dataCotacao).filter(f=>!back||!outbound||f.start>=outbound.end+45*60000);
}
function lowest(back,date){
  const prices=optionsFor(back,date).flatMap(f=>f.tarifas.filter(t=>t.lugares>=seatCount(search)).map(t=>beneficios.tarifa(search,t,back?outbound:null).final));
  return prices.length?Math.min(...prices):null;
}
function arrivalLabel(f){return f.arrival+(f.arrivalDate && f.arrivalDate>f.date?' (+1 dia)':'')}
function results(back=false) {
  dataCotacao=today();
  const q=legQuery(back),list=optionsFor(back,q.date);
  const dates=Array.from({length:7},(_,i)=>rede.adicionar(q.date,i-3)).filter(d=>d>=today()&&(!back||d>=search.date));
  const strip=dates.map(d=>{const price=lowest(back,d);return '<button data-day="'+d+'" '+(q.date===d?'aria-current="date"':'')+'><span>'+shortDay(d)+'</span><strong>'+(price===null?'Sem opção':money(price))+'</strong></button>'}).join('');
  const flights=list.map((f,i)=>compararVoos(f,i,back)).join('');
  let empty='';
  if(lowest(back,q.date)===null){
    let sugestao=q.date;do{sugestao=rede.adicionar(sugestao,1)}while(lowest(back,sugestao)===null && sugestao<rede.adicionar(q.date,30));
    empty='<div class="empty-flights"><h2>Nenhuma opção para esta data</h2><p>'+(!list.length?'Não há voos disponíveis para este trecho e horário.':'As tarifas disponíveis não acomodam todos os passageiros.')+'</p>'+(lowest(back,sugestao)!==null?'<button class="secondary" data-day="'+sugestao+'">Ver voos em '+dateText(sugestao)+'</button>':'')+'</div>';
  }
  return '<div class="wrap sub results-page">'+homeLink+'<div class="results-toolbar"><span class="eyebrow">'+(back?'Volta · 2 de 2':search.round?'Ida · 1 de 2':'Somente ida')+'</span><a href="#buscar">Alterar busca ↗</a></div><h1>'+routeName(q)+'</h1><p class="lead">'+dateText(q.date)+' · '+passengerDescription(partyFor(search))+' · Horários locais</p>'+(back?'<p class="chosen-leg">Ida selecionada · '+outbound.number+' · '+dateText(outbound.date)+' às '+outbound.departure+' <a href="#voos">Alterar ida</a></p>':'')+beneficios.declaracao(search)+'<h2 class="date-title">Compare as datas</h2><div class="date-strip" aria-label="Menor tarifa disponível por data">'+strip+'</div><p class="result-note">O comparador de datas mostra o total do grupo por trecho. Abra um voo para ver as tarifas e o desconto aplicável.</p>'+empty+flights+'</div>';
}
function selectFare(value,back){
  const [i,j]=value.split('-').map(Number),f=optionsFor(back,legQuery(back).date)[i],t=f?.tarifas[j];
  if(!t||t.lugares<seatCount(search))return;
  const previous=back?flight?.returnLeg:(flight||outbound);
  const same=previous?.date===f.date && previous?.number===f.number;
  const leg={...f,fare:t.nome,price:t.valor,emCampanha:t.emCampanha,exitAccepted:same?previous.exitAccepted||[]:[]};
  leg.seats=restoredSeats(leg,same?previous.seats:[],seatCount(search),search,leg.exitAccepted);
  if(!back && search.round){outbound=leg;if(!same)flight=null;else if(flight)flight={...leg,returnLeg:flight.returnLeg};saveSelection();go('voos/volta');return}
  flight=back?{...outbound,returnLeg:leg}:leg;saveSelection();go('assentos');
}
