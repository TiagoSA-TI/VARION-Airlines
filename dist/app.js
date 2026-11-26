'use strict';
const main = document.getElementById('route-content');
const paths = {
 plane:'<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="m11 13 7-7"/>',
 fly:'<path d="m22 2-1.5 5-4.8 4.8 2.2 7.3-2 2-4.2-6.1-4 3.2-.4 3.1-1.5 1-1.6-4.4-4.1-1.5 1-1.5 3.1-.3 3.2-4.1-6-4.1 1.9-2 7.2 2.1L17 4c1.2-1.2 3.1-2 5-2Z"/>',
 ticket:'<path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z"/><path d="M15 7.5v1m0 3v1m0 3v1"/>',
 menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 takeoff:'<path d="m3 11 3 2 5-1-4-6 2-1 6 6 4-1c3-.7 4 2 1 3l-13 4-5-4ZM3 21h18"/>',
 land:'<path d="m4 6 2 4 5 1-1-7 2 .4 3 7.5 4 1c3 .7 2.7 3.4-.3 3.2L5 13.7l-2.6-7ZM3 21h18"/>'
};
const icon = (name) => '<svg class="ico" aria-hidden="true" viewBox="0 0 24 24">'+paths[name]+'</svg>';
document.querySelectorAll('[data-icon]').forEach(el=>el.replaceWith(document.createRange().createContextualFragment(icon(el.dataset.icon))));
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
let activeCode='',tab='busca';
const storagePrefix='varion.reserva.v1.';
const nav=document.querySelector('nav');
const toggle=document.querySelector('.menu-toggle');
function setMenu(open) {
 nav.classList.toggle('open',open);
 toggle.setAttribute('aria-expanded',String(open));
 toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
}
toggle.onclick=()=>setMenu(!nav.classList.contains('open'));
nav.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false)});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape' && nav.classList.contains('open')){setMenu(false);toggle.focus()}
});
const brand='<span class="brand"><img src="assets/marca.png" alt=""><img src="assets/nome.png" alt="Varion"></span>';
const homeLink='<a class="crumb" href="#inicio">Início</a>';
const section=(title,lead,body,narrow=false)=>'<div class="wrap sub'+(narrow?' narrow':'')+'">'+homeLink+'<h1>'+title+'</h1>'+(lead?'<p class="lead">'+lead+'</p>':'')+body+'</div>';
const field=(label,name,type,val='',props='')=>'<label class="formfield">'+label+'<input required name="'+name+'" type="'+type+'" value="'+esc(val)+'" '+props+'></label>';
const lookupForm=()=>'<form id="lookupform" class="lookupform"><label class="formfield">Código da reserva<input name="code" placeholder="Ex.: VR7K3P" maxlength="12" required autocapitalize="characters" spellcheck="false" autocomplete="off"></label><button class="primary">'+icon('search')+' Consultar reserva</button></form><p id="lookup-status" class="error" role="status"></p>';
function booking(){return '<div class="tabs"><button type="button" data-tab="busca" class="tab '+(tab==='busca'?'active':'')+'" aria-pressed="'+(tab==='busca')+'">'+icon('fly')+' Voos</button><button type="button" data-tab="reservas" class="tab '+(tab==='reservas'?'active':'')+'" aria-pressed="'+(tab==='reservas')+'">'+icon('ticket')+' Minhas reservas</button></div>'+(tab==='busca'?searchForm():'<div class="inline-lookup">'+lookupForm()+'</div>')}
const rows = items=>'<dl class="facts">'+items.map(([title,value,cls])=>'<div class="'+(cls||'')+'"><dt>'+title+'</dt><dd>'+value+'</dd></div>').join('')+'</dl>';
function summary(q,f,names=[],savedExtra,savedBenefit) {
 const legs=bookingLegs(f),{beneficio,passagens,adicionais,total}=precificacao.resumo(q,f,savedExtra,savedBenefit);
 const details=legs.map((leg,i)=>{
   const items=[[i?'Volta':'Ida',leg.from?routeName(leg):routeName(q)],['Data',dateText(leg.date||q.date)],['Voo',esc(leg.number)]];
   if(frota[leg.aircraft])items.push(['Aeronave',frota[leg.aircraft].name+(leg.capacity?' · '+leg.capacity+' assentos':'')]);
   items.push(['Horário local',esc(leg.departure)+' – '+esc(arrivalLabel(leg))],['Tarifa',esc(leg.fare||'Econômica')],[beneficio.plano?'Por pessoa, antes do desconto':'Por passageiro com assento',money(leg.price)]);
   if(frota[leg.aircraft])items.push(['Assentos',Array.from({length:seatCount(q)},(_,j)=>esc(names[j]||travelerTitle(q,j))+' · '+(esc(leg.seats?.[j])||'A definir')).join('<br>')]);
   return rows(items);
 }).join('');
 const prices=[['Passageiros',passengerDescription(partyFor(q))]];
 if(frota[f.aircraft])prices.push([beneficio.plano?'Passagens com desconto':'Passagens',money(passagens)],['Adicional de assentos',money(adicionais)]);
 return details+beneficios.detalhe(beneficio)+rows([...prices,['Total da viagem',money(total),'total']]);
}
function passengerForm(){
 const names=Array.from({length:search.count},(_,i)=>field('Nome completo · '+travelerTitle(search,i),'name'+i,'text',draft?.names[i]||'','maxlength="90" minlength="2" placeholder="Ex.: Ana Oliveira"')).join('');
 return section('Dados dos passageiros','Use um nome e um e-mail de exemplo para continuar.','<div class="split"><form class="panel" id="passengerform"><h2>Quem vai viajar?</h2>'+names+beneficios.declaracao(search)+field('E-mail de contato','email','email',draft?.email||'','maxlength="120" placeholder="ana@example.com"')+'<div class="actions"><button class="primary">Revisar viagem</button><a class="link" href="#assentos">Alterar assentos</a></div></form><aside class="panel"><h2>Resumo da viagem</h2><div data-benefit-summary aria-live="polite">'+summary(search,flight)+'</div></aside></div>')
}
function review(){return section('Confira sua viagem','Confira o trecho, os horários e os dados dos passageiros.','<div class="panel">'+summary(search,flight,draft.names)+rows([['Passageiros',draft.names.map(esc).join('<br>')],['Contato',esc(draft.email)]])+'<p class="note">Esta reserva é ilustrativa e fica salva neste navegador. A confirmação não gera cobrança nem passagem válida para embarque.</p><div class="actions"><button class="primary" data-confirm>Confirmar reserva</button><a class="link" href="#passageiros">Corrigir dados</a><a class="link" href="#assentos">Alterar assentos</a></div><p id="save-status" class="error" role="status"></p></div>',true)}
function ticket(r){const {query:q,flight:f}=r;return '<article class="ticket"><div class="tickethead">'+brand+'<span>Reserva ilustrativa</span></div><div class="ticketbody"><div class="airline"><b>'+q.from+'</b><span></span>'+icon('fly')+'<span></span><b>'+q.to+'</b></div>'+summary(q,f,r.names,r.seatTotal??bookingLegs(f).reduce((v,l)=>v+seatFees(l,true),0),r.beneficio??null)+rows([['Passageiro'+(r.names.length>1?'s':''),r.names.map(esc).join('<br>')]])+'</div><div class="codearea"><small>Código da reserva</small><strong>'+esc(r.code)+'</strong></div></article>'}
function getRecord(code){const raw=localStorage.getItem(storagePrefix+code);return raw?JSON.parse(raw):null}
function recordPage(confirmed,code){
 let r;try{r=getRecord(code)}catch{}if(!r)return reservationPage();
 let body=ticket(r);
 if(confirmed)body+='<div class="actions"><a class="primary" href="#reservas">Ir para Minhas reservas</a><a class="secondary" href="#inicio">Voltar ao início</a></div>';
 else body+='<form id="contactform" class="panel"><h2>Contato da reserva</h2>'+field('E-mail de contato','email','email',r.email,'maxlength="120"')+'<button class="primary">Salvar alteração</button><p id="contact-status" role="status"></p></form><div class="actions"><a class="link" href="#reservas">Consultar outra reserva</a></div>';
 return section(confirmed?'Reserva confirmada':'Sua reserva',confirmed?'Guarde o código abaixo para consultar sua viagem neste navegador.':'Veja os detalhes da viagem ou atualize seu e-mail de contato.',body,true)
}
function reservationPage(){return section('Minhas reservas','Informe o código de seis caracteres no mesmo navegador em que você confirmou a reserva.','<div class="panel">'+lookupForm()+'</div>',true)}
function company() {
 return `<div class="wrap sub company-view">${homeLink}
 <article class="company-story"><div><h1>A companhia</h1>
 <p class="company-intro">De Minas para a América do Sul.</p>
 <p>Nossa sede e nosso principal aeroporto de conexão ficam em Confins, na região de Belo Horizonte. Daqui, a VARION liga Minas Gerais a oito destinos no Brasil e seis no exterior.</p>
 <p>Por trás de cada viagem, as equipes de tecnologia, logística, vendas e atendimento trabalham juntas, da escolha do voo ao portão de embarque.</p>
 <a class="company-more" href="#companhia/quem-somos">Quem somos <span aria-hidden="true">→</span></a>
 <small>Tecnologia e Inovação</small></div>
 <img src="assets/brasilia.webp" alt="Catedral de Brasília, um dos destinos da VARION"></article></div>`;
}
function services() {
 const rows=[
  ['search','Buscar voos','Compare horários e tarifas para o seu destino.','#buscar'],
  ['fly','Classe executiva','Conheça a cabine e os serviços do Boeing 737 MAX 8.','#servicos/executiva'],
  ['people','Planos de benefícios','Descontos nas passagens para duplas, grupos e estudantes.','#beneficios'],
  ['land','Painel de voos','Consulte partidas e chegadas em Confins.','#painel'],
  ['ticket','Consultar reserva','Veja os passageiros, o horário e o código do seu voo.','#reservas'],
  ['people','Atualizar e-mail de contato','Abra sua reserva para editar o endereço de e-mail.','#reservas']
 ];
 return section('Serviços','Escolha o que deseja fazer com sua viagem.',
  '<div class="service-list">'+rows.map(([name,title,copy,url])=>
   `<a href="${url}">${icon(name)}<span><strong>${title}</strong><small>${copy}</small></span><b aria-hidden="true">→</b></a>`
  ).join('')+'</div>',true);
}
function support(){
 const faqs=[['Onde encontro o código da reserva?','Você encontra o código de seis caracteres no resumo da viagem, logo após confirmar a reserva.'],['Como posso corrigir meu contato?','Abra Minhas reservas, informe o código, altere o e-mail e selecione Salvar alteração.'],['A confirmação gera alguma cobrança?','As reservas são ilustrativas. Você pode consultar os dados da viagem sem informar cartão ou fazer pagamentos.'],['Posso consultar em outro aparelho?','As reservas ficam no navegador em que você confirmou a reserva. Volte ao mesmo navegador e aparelho para consultá-las.']];
 return section('Atendimento','Tire suas dúvidas sobre a viagem e a reserva.','<div class="split"><section class="panel"><h2>Dúvidas frequentes</h2>'+faqs.map(([q,a])=>'<details><summary>'+q+'</summary><p>'+a+'</p></details>').join('')+'</section><form class="panel" id="helpform"><h2>Como podemos ajudar?</h2><p class="helper">Use dados de exemplo para revisar uma mensagem. O envio está indisponível.</p>'+field('Nome','name','text','','maxlength="90"')+field('E-mail','email','email','','maxlength="120"')+'<label class="formfield">Mensagem<textarea name="message" rows="3" required maxlength="1000"></textarea></label><button class="primary">Revisar mensagem</button><p id="help-status" role="status"></p></form></div>')
}
function render(){
 const [page,code]=location.hash.slice(1).split('/');
 calendario.fecharImediato();
 const showingCanva=tecnologia.route(page,code);
 setMenu(false);
 document.querySelectorAll('header a').forEach(a=>{if(a.getAttribute('href')==='#'+page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 if(showingCanva)return;
 if(['voos','assentos','passageiros','revisao'].includes(page) && !validQuery(search)){location.replace('#buscar');return}
 switch(page){
 case 'beneficios':main.innerHTML=beneficios.pagina();break;
 case 'destinos':main.innerHTML=destinosPage();break;
 case 'malha':main.innerHTML=paginaMapa();break;
 case 'painel':main.innerHTML=painel();break;
 case 'companhia':
  main.innerHTML=company();
  break;
 case 'servicos':main.innerHTML=code==='executiva'?paginaExecutiva():services();break;
 case 'atendimento':main.innerHTML=support();break;
 case 'reservas':main.innerHTML=reservationPage();break;
 case 'voos':main.innerHTML='<div class="flight-results">'+results(code==='volta' && search.round && !!outbound)+'</div>';break;
 case 'assentos':if(!flight){location.replace('#voos');return}main.innerHTML=cabine.page();break;
 case 'passageiros':main.innerHTML=flight?passengerForm():results();break;
 case 'revisao':main.innerHTML=flight?(draft?review():passengerForm()):results();break;
 case 'emitida':case 'reserva':activeCode=code||'';main.innerHTML=recordPage(page==='emitida',activeCode);break;
 default:if(page==='buscar')tab='busca';main.innerHTML=home();break
 }
 document.title=(main.querySelector('h1')?.innerText.replace(/\n/g,' ')||'Voos e reservas')+' | VARION Airlines';
 if(page==='buscar'){document.querySelector('#booking').scrollIntoView({block:'center'});document.querySelector('#booking').setAttribute('tabindex','-1');document.querySelector('#booking').focus({preventScroll:true})}else{window.scrollTo(0,0);if(location.hash)main.focus({preventScroll:true})}
}
function go(page){if(location.hash==='#'+page)render();else location.hash=page}
bindSearch(main);
main.addEventListener('click',cabine.click);
main.addEventListener('keydown',cabine.key);
main.addEventListener('change',e=>{
 if(e.target.matches('[data-student]')){
  search.students=Array.from(main.querySelectorAll('[data-student]:checked'),input=>input.dataset.student);
  remember();setPlanFromResults();saveSelection();
  const resumo=main.querySelector('[data-benefit-summary]');
  if(resumo){resumo.innerHTML=summary(search,flight);return}
  const back=location.hash==='#voos/volta' && search.round && !!outbound;
  const atualizado=document.createElement('div');
  atualizado.innerHTML=results(back);
  const replaceAll=selector=>{
    const novos=atualizado.querySelectorAll(selector);
    main.querySelectorAll(selector).forEach((antigo,i)=>antigo.replaceWith(novos[i]));
  };
  replaceAll('.date-strip');replaceAll('.fare-low');replaceAll('.fare-matrix');
  return;
 }
 if(e.target.id==='airport-map')updateMap(e.target.value,'#airport-map');
 if(e.target.id==='board-date' && rede.dataValida(e.target.value)){boardDate=e.target.value;main.querySelector('tbody').innerHTML=boardRows()}
});
main.addEventListener('keydown',e=>{
 const pin=e.target.closest('[data-pin]');
 if(pin && ['Enter',' '].includes(e.key)){e.preventDefault();updateMap(pin.dataset.pin,'[data-pin="'+pin.dataset.pin+'"]')}
});
main.addEventListener('click',e=>{
 const pin=e.target.closest('[data-pin]');if(pin){updateMap(pin.dataset.pin);return}
 const el=e.target.closest('button');if(!el)return;
 if(el.dataset.filter){
  mapa.filtro=el.dataset.filter;
  main.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
  const routes=visiveis();updateMap(routes.some(r=>r.code===mapa.code)?mapa.code:routes[0].code);return;
 }
 if(el.dataset.board){boardMode=el.dataset.board;main.innerHTML=painel();main.querySelector('[data-board="'+boardMode+'"]').focus({preventScroll:true});return}
 if(el.hasAttribute('data-benefit-search')){plan=defaultSearch();savePlan();go('buscar');return}
 const back=location.hash==='#voos/volta' && search.round && !!outbound;
 if(el.dataset.day){
  if(back){search.back=el.dataset.day;flight=null;draft=null}else{search.date=el.dataset.day;if(search.round && search.back<search.date)search.back=search.date;resetSelection()}
  remember();setPlanFromResults();saveSelection();go(back?'voos/volta':'voos');return;
 }
 if(el.hasAttribute('data-compare')){abrirComparacao(el);return}
 if(el.dataset.fare){selectFare(el.dataset.fare,back);return}
 if(el.dataset.tab){tab=el.dataset.tab;const b=document.querySelector('#booking');b.innerHTML=booking();b.querySelector('[data-tab="'+tab+'"]').focus();return}
 if(el.dataset.dest){bookDestination(el.dataset.dest,el.dataset.offerDate);return}
 if(el.hasAttribute('data-confirm')&&draft&&flight){
  el.disabled=true;
  try{
   const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;
   do{const vals=crypto.getRandomValues(new Uint8Array(6));code=Array.from(vals,n=>chars[n%chars.length]).join('')}while(localStorage.getItem(storagePrefix+code));
   const r={code,beneficio:precificacao.resumo(search,flight).beneficio,seatTotal:precificacao.resumo(search,flight).adicionais,query:{...search},flight:{...flight},names:[...draft.names],email:draft.email};
   localStorage.setItem(storagePrefix+code,JSON.stringify(r));resetSelection();go('emitida/'+code)
  }catch{el.disabled=false;document.querySelector('#save-status').textContent='Não foi possível salvar a reserva. Permita o armazenamento neste navegador e tente novamente.'}
 }
});
main.addEventListener('submit',e=>{
 e.preventDefault();const f=e.target,fd=new FormData(f);
 if(f.id==='searchform'){submitSearch(f);return}
 if(f.id==='passengerform'){
  const names=Array.from({length:search.count},(_,i)=>String(fd.get('name'+i)).trim());
  const invalid=names.findIndex(n=>n.length<2);if(invalid!==-1){const input=f.elements['name'+invalid];input.setCustomValidity('Informe um nome com pelo menos duas letras.');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return}
  draft={names,email:fd.get('email').trim()};go('revisao')
 }
 if(f.id==='lookupform'){
  const code=fd.get('code').trim().toUpperCase(),status=document.querySelector('#lookup-status');
  try{if(/^[A-Z0-9]{6}$/.test(code)&&getRecord(code)){go('reserva/'+code)}else{status.textContent='Reserva não encontrada. Confira o código e use o navegador em que fez a reserva.'}}catch{status.textContent='Não foi possível consultar o armazenamento deste navegador.'}
 }
 if(f.id==='contactform'){
  const status=document.querySelector('#contact-status');
  try{const r=getRecord(activeCode);r.email=fd.get('email').trim();localStorage.setItem(storagePrefix+activeCode,JSON.stringify(r));status.className='status';status.textContent='E-mail atualizado e salvo neste navegador.'}catch{status.className='error';status.textContent='Não foi possível salvar a alteração. Tente novamente.'}
 }
 if(f.id==='helpform'){const message=document.querySelector('#help-status');message.className='status';message.textContent='Prévia da mensagem: '+fd.get('message').trim()}
});
window.addEventListener('hashchange',render);
render();
