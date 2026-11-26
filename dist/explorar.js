'use strict';
const imagens={
 EZE:['buenos-aires.webp','Puente de la Mujer iluminada em Puerto Madero'],
 SCL:['santiago.webp','Costanera Center e a paisagem de Santiago ao entardecer'],
 GRU:['sao-paulo.webp','Avenida Paulista vista do alto'],
 BSB:['brasilia.webp','Catedral de Brasília sob o céu azul'],
 SSA:['salvador.jpg','Casarões do Pelourinho, em Salvador'],
 REC:['recife.jpg','Orla do Recife'], GIG:['rio.jpg','Pão de Açúcar e Baía de Guanabara']
};
function foto(code){const [src,alt]=imagens[code];return '<img src="assets/'+src+'" alt="'+alt+'" loading="lazy">'}
function linkBusca(code,texto='Ver voos',data=''){return '<button class="dest-link" data-dest="'+code+'" '+(data?'data-offer-date="'+data+'"':'')+' aria-label="'+texto+' para '+city(code)+'">'+texto+' <span aria-hidden="true">↗</span></button>'}
function destaque(code) {
  const a=aeroportos[code],compra=today();
  // Cota a semana a partir de 21 dias e leva a data da oferta ao formulário.
  let oferta=null;
  for(let dias=21;dias<28;dias++){
    const data=rede.adicionar(compra,dias);
    for(const voo of rede.voos(rede.hub,code,data,compra)){
      const economica=voo.tarifas[0];
      if(economica.lugares>=seated(plan.party) && (!oferta || economica.valor<oferta.valor))
        oferta={data,valor:economica.valor};
    }
  }
  const preco=oferta?'<span>Por pessoa, só ida · '+dateText(oferta.data)+'<br>A partir de <b>'+money(oferta.valor)+'</b></span>':'';
  return '<article class="feature-photo" data-photo="'+code+'">'+foto(code)+'<div class="photo-notes"><small>'+a.pais+' / '+code+'</small><h3>'+city(code)+'</h3><div>'+preco+linkBusca(code,'Ver voos',oferta?.data)+'</div></div></article>';
}
function home() {
  return '<section class="brand-horizon"><div class="horizon-photo"><img src="assets/frota-varion.webp" alt="Aeronave da VARION Airlines na pista ao entardecer" fetchpriority="high"></div><div class="wrap horizon-copy"><h1>Seu próximo voo<br>começa aqui.</h1><p>Explore o Brasil e a América do Sul com a VARION.</p></div></section>'+
    '<section id="booking" class="wrap booking" aria-label="Planeje sua viagem">'+booking()+'</section>'+
    '<section class="wrap editorial-home"><div class="section-head"><div><h2>Para onde vamos?</h2><p>Voos diretos de Belo Horizonte para o Brasil e a América do Sul.</p></div><a href="#destinos">Explorar os 14 destinos ↗</a></div>'+
    '<div class="featured-routes">'+['SCL','SSA','GRU'].map(destaque).join('')+'</div></section>'+
    beneficios.inicio()+
    '<section class="network-band"><div class="wrap"><div class="network-type" aria-hidden="true">CNF<span>↗</span></div><div><h2>O ponto de partida é Minas.</h2><p>Explore no mapa as 14 rotas que se encontram em Confins.</p><a href="#malha">Ver mapa de rotas →</a></div></div></section>'+
    '<section class="homeinfo"><div class="wrap"><div><h2>Seu voo em Confins</h2><p>Consulte partidas e chegadas no painel demonstrativo.</p></div><a class="secondary" href="#painel">Abrir painel de voos →</a></div></section>';
}
function destinosPage(){
  return '<div class="wrap sub atlas">'+homeLink+'<div class="atlas-head"><div><h1>Nossos destinos</h1><p class="lead">Oito destinos no Brasil e seis na América do Sul, com voos diretos de Confins.</p></div><a class="secondary" href="#malha">Explorar no mapa ↗</a></div>'+
    [[false,'Brasil','BSB'],[true,'América do Sul','SCL']].map(([intl,label,code])=>{
      return '<section class="atlas-section"><div class="atlas-photo">'+foto(code)+'<div><span>'+aeroportos[code].regiao+' · '+code+'</span><h2>'+label+'</h2></div></div><div class="atlas-list"><h3>'+ (intl?'Destinos internacionais':'Destinos nacionais')+'</h3>'+rede.rotas.filter(r=>r.internacional===intl).map(r=>'<button data-dest="'+r.code+'" aria-label="Buscar voos para '+city(r.code)+'"><b class="airport-code">'+r.code+'</b><span><strong>'+city(r.code)+'</strong><small>'+(intl?aeroportos[r.code].pais:aeroportos[r.code].regiao)+'</small></span><span class="atlas-freq">'+r.frequencia+'</span><b aria-hidden="true">↗</b></button>').join('')+'</div></section>';
    }).join('')+'</div>';
}
const mapa={filtro:'Todas',code:'EZE'};
const filtros=['Todas','Nacionais','Internacionais'];
const visiveis=()=>rede.rotas.filter(r=>mapa.filtro==='Todas'||r.internacional===(mapa.filtro==='Internacionais'));
const ponto=(lon,lat)=>[(lon+85)*11.9,(11-lat)*12.8];
const coord=(lon,lat)=>ponto(lon,lat).map(n=>n.toFixed(1)).join(' ');
let contornos;
function mapaSVG(){
  if(!contornos)contornos=GEOGRAFIA.map(p=>'<path class="land '+(p.id==='BRA'?'brazil':'')+'" fill-rule="evenodd" d="'+p.aneis.map(r=>'M'+r.map(([x,y])=>coord(x,y)).join('L')+'Z').join('')+'"/>').join('');
  const hub=aeroportos.CNF,[hx,hy]=ponto(hub.lon,hub.lat);
  const view=mapa.filtro==='Nacionais'?'315 120 350 442':'0 15 705 633';
  const routes=visiveis().sort((a,b)=>(a.code===mapa.code)-(b.code===mapa.code));
  const curves=routes.map(r=>{const a=aeroportos[r.code],[x,y]=ponto(a.lon,a.lat),dx=x-hx,dy=y-hy;
    return '<path class="air-path '+(r.code===mapa.code?'selected':'')+'" d="M'+hx+' '+hy+' Q'+((x+hx)/2+dy*.19)+' '+((y+hy)/2-dx*.19)+' '+x+' '+y+'" pathLength="1"/>';}).join('');
  const offsets={GRU:[-9,3],CWB:[-9,5],EZE:[-12,17],MVD:[11,13],GIG:[10,12],POA:[10,3],ASU:[-10,4],BOG:[11,4],LIM:[-10,5],SCL:[-10,4]};
  const pins=routes.map(r=>{const a=aeroportos[r.code],[x,y]=ponto(a.lon,a.lat),[dx,dy]=offsets[r.code]||[10,2];
    return '<g class="map-pin '+(r.code===mapa.code?'selected':'')+'" data-pin="'+r.code+'" role="button" tabindex="0" aria-label="Selecionar '+city(r.code)+'" aria-pressed="'+(r.code===mapa.code)+'" transform="translate('+x+' '+y+')"><circle class="hit" r="12"/><circle class="dot" r="4.5"/><text x="'+dx+'" y="'+dy+'" text-anchor="'+(dx<0?'end':'start')+'">'+r.code+'</text></g>';}).join('');
  return '<svg viewBox="'+view+'" class="route-map" role="group" aria-label="Mapa das rotas diretas de Confins"><defs><pattern id="graticula" width="59.5" height="64" patternUnits="userSpaceOnUse"><path d="M0 64V0H59.5" fill="none" stroke="#a9c1ca" stroke-width=".65"/></pattern></defs><rect x="-50" y="-50" width="850" height="1000" fill="#dce8eb"/>'+contornos+'<rect x="-50" y="-50" width="850" height="1000" fill="url(#graticula)" pointer-events="none"/><text class="water-name" x="54" y="410" transform="rotate(-74 54 410)">PACÍFICO</text><text class="water-name" x="514" y="552" transform="rotate(-55 514 552)">ATLÂNTICO</text><text class="country-name" x="340" y="247">BRASIL</text>'+curves+pins+'<g class="hub" transform="translate('+hx+' '+hy+')"><circle r="9"/><circle r="4"/><text x="13" y="-4">CNF · Confins</text></g></svg>';
}
function mapaPanel(){
  const r=rede.porCodigo[mapa.code],a=aeroportos[r.code],dias=['dom','seg','ter','qua','qui','sex','sáb'];
  return '<div class="map-layout"><div class="map-canvas">'+mapaSVG()+'<small>Cartografia · Natural Earth</small></div><div class="map-detail"><label for="airport-map">Selecione um destino</label><select id="airport-map">'+visiveis().map(v=>'<option value="'+v.code+'" '+(v.code===r.code?'selected':'')+'>'+airportLabel(v.code)+'</option>').join('')+'</select><div class="map-detail-copy"><span class="eyebrow">'+a.pais+' · Voo direto</span><h2>'+a.cidade+'</h2><p>'+a.aeroporto+' ('+a.code+')</p><div class="map-itin"><b>CNF</b><i></i>'+icon('fly')+'<i></i><b>'+a.code+'</b></div><dl><div><dt>Frequência</dt><dd>'+r.frequencia+'</dd></div><div><dt>Operação</dt><dd>'+(r.dias.length===7?'Todos os dias':[1,2,3,4,5,6,0].filter(i=>r.dias.includes(i)).map(i=>dias[i]).join(', '))+'</dd></div><div><dt>Duração prevista</dt><dd>'+duration(r.minutos)+'</dd></div></dl>'+linkBusca(a.code,'Buscar passagens')+'</div></div></div>';
}
function paginaMapa(){return '<div class="wrap sub map-page">'+homeLink+'<h1>Mapa de rotas</h1><p class="lead">Parta de Confins e explore cada ligação da VARION.</p><div class="map-filters" role="group" aria-label="Filtrar rotas">'+filtros.map(f=>'<button data-filter="'+f+'" aria-pressed="'+(mapa.filtro===f)+'">'+f+'</button>').join('')+'</div><div id="map-body">'+mapaPanel()+'</div></div>'}
function updateMap(code,focus=''){
  if(!rede.porCodigo[code])return;
  mapa.code=code;document.getElementById('map-body').innerHTML=mapaPanel();
  if(focus)document.querySelector(focus)?.focus({preventScroll:true});
}
let boardDate=today(), boardMode='partidas';
function boardRows(){
  const outbound=boardMode==='partidas';
  const list=rede.rotas.flatMap(r=>rede.voos(outbound?'CNF':r.code,outbound?r.code:'CNF',boardDate)).filter(f=>(outbound?f.date:f.arrivalDate)===boardDate).sort((a,b)=>outbound?a.start-b.start:a.end-b.end);
  return list.map(f=>{
    const code=outbound?f.to:f.from,hh=outbound?f.departure:f.arrival;
    const [h,m]=hh.split(':').map(Number),delta=h*60+m-720;
    const status=outbound?(delta<0?'Partiu':delta<=35?'Em embarque':'Previsto'):(delta<0?'Chegou':delta<=40?'Em aproximação':'Previsto');
    return '<tr><td>'+hh+'</td><td>'+f.number+'</td><td>'+city(code)+' <small>'+code+'</small></td><td><span class="board-status '+(delta<0?'past':delta<=40?'soon':'')+'">'+status+'</span></td></tr>';
  }).join('');
}
function painel(){return '<div class="wrap sub board-page">'+homeLink+'<span class="eyebrow">Aeroporto de Confins · CNF</span><h1>Painel de voos</h1><p class="lead">Partidas e chegadas em Belo Horizonte. Status simulados para as 12h da data consultada, no horário de Confins.</p><div class="board-tools"><div class="map-filters">'+['partidas','chegadas'].map(m=>'<button data-board="'+m+'" aria-pressed="'+(m===boardMode)+'">'+(m==='partidas'?'Partidas':'Chegadas')+'</button>').join('')+'</div><label>Data <input type="date" id="board-date" required value="'+boardDate+'"></label></div><table class="board-table"><caption class="sr">'+boardMode+' em Confins</caption><thead><tr><th>Hora</th><th>Voo</th><th>'+(boardMode==='partidas'?'Destino':'Origem')+'</th><th>Status</th></tr></thead><tbody>'+boardRows()+'</tbody></table></div>'}
