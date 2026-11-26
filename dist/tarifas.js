'use strict';
const experienciaExecutiva={
  antes:['Check-in exclusivo','Acesso à sala VIP','Embarque prioritário'],
  durante:['Poltrona reclinável com divisória','Apoio para as pernas','Mesa individual e entrada USB','Bebida de boas-vindas','Escolha de prato em voos longos','Tela individual com filmes e séries','Fones com cancelamento de ruído para uso durante o voo'],
  apos:['Entrega prioritária da bagagem']
};
const familiasTarifarias={
  'Básica':{percentual:100,inclui:[],beneficios:['Item pessoal e bagagem de mão'],condicoes:['Bagagem despachada à parte','Seleção antecipada de assento paga','Remarcação com taxa']},
  Standard:{percentual:115,inclui:['standard'],beneficios:['Item pessoal e bagagem de mão','1 bagagem despachada de 23 kg','Escolha de assento padrão'],condicoes:['Fileiras dianteiras e Mais espaço à parte','Remarcação com taxa']},
  Flex:{percentual:130,inclui:['standard','preferred'],beneficios:['Item pessoal e bagagem de mão','1 bagagem despachada de 23 kg','Assento padrão ou nas fileiras dianteiras','Remarcação sem taxa','Possibilidade de reembolso antes do voo'],condicoes:['Assentos Mais espaço à parte','Eventual diferença tarifária na remarcação']},
  Executiva:{percentual:200,inclui:['business'],beneficios:['Seleção de assento executivo',...experienciaExecutiva.antes,...experienciaExecutiva.durante,...experienciaExecutiva.apos],condicoes:['Escolha de prato disponível apenas nos voos longos']}
};
function compararVoos(f,i,back=false){
  const lugares=seatCount(search),disponiveis=f.tarifas.filter(t=>t.lugares>=lugares);
  const cotar=t=>beneficios.tarifa(search,t,back?outbound:null);
  const melhor=disponiveis.map(cotar).sort((a,b)=>a.final-b.final)[0];
  const menor=melhor?.final??null;
  const lista=itens=>'<ul>'+itens.map(v=>'<li>'+v+'</li>').join('')+'</ul>';
  const opcoes=f.tarifas.map((t,j)=>{
    const info=familiasTarifarias[t.nome],executiva=t.nome==='Executiva';
    const b=cotar(t);
    return `<section class="fare-column ${executiva?'business-fare':''}"><h3>${t.nome}</h3><strong class="fare-unit">${money(t.valor)}</strong><small>por passageiro com assento${b.plano?' · antes do desconto':''}</small>
      ${b.plano?beneficios.detalhe(b):lugares>1?`<p class="fare-party">${money(b.final)} pelo grupo</p>`:''}
      <h4>Incluído</h4>${executiva?lista(['Assento executivo reclinável com divisória','Check-in exclusivo e sala VIP','Embarque e bagagem prioritários'])+'<details><summary>Todos os benefícios</summary>'+lista(info.beneficios)+'</details>':lista(info.beneficios)}<h4>Condições</h4>${lista(info.condicoes)}
      <button class="primary" data-fare="${i}-${j}" ${t.lugares<lugares?'disabled':''}>${t.lugares<lugares?'Sem lugares para o grupo':'Selecionar '+t.nome}</button></section>`;
  }).join('');
  return `<article class="fare-flight"><button class="flight-toggle" type="button" data-compare="${i}" aria-expanded="false" aria-controls="fares-${i}">
    <span class="flight-meta"><b>${f.number}</b><span>${frota[f.aircraft].name} · ${f.capacity} assentos</span></span>
    <span class="fare-itinerary"><span><strong>${f.departure}</strong><small>${airportLabel(f.from)}</small></span><span class="fare-line">${icon('fly')}<small>${duration(f.minutes)} · Direto</small></span><span><strong>${arrivalLabel(f)}</strong><small>${airportLabel(f.to)}</small></span></span>
    <span class="fare-low"><small>${menor===null?'Disponibilidade':lugares>1?'A partir de · pelo grupo':'A partir de · por pessoa'}</small><b>${menor===null?'Grupo sem opção':money(menor)}</b>${melhor?.plano?`<small>Varion ${melhor.plano} · ${melhor.percentual}%</small>`:''}<span>Comparar tarifas <i aria-hidden="true">⌄</i></span></span></button>
    <div id="fares-${i}" class="fare-fold" inert><div><div class="fare-matrix">${opcoes}</div></div></div></article>`;
}
function abrirComparacao(btn){
  const aberto=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!aberto));
  document.getElementById(btn.getAttribute('aria-controls')).inert=aberto;
}
function paginaExecutiva(){
  return `<div class="wrap sub exec-page"><a class="crumb" href="#servicos">← Serviços</a>
    <div class="exec-hero"><div><p>Boeing 737 MAX 8</p><h1>Classe executiva</h1><p>Doze poltronas em três fileiras de dois pares. Escolha janela ou corredor e encontre seu espaço a bordo.</p><a href="#buscar">Buscar voos <span aria-hidden="true">↗</span></a></div><img src="assets/cabine-executiva.webp" alt="Ilustração de poltronas executivas lado a lado, com divisória e luz natural da janela"></div>
    <div class="exec-moments">${[['Antes do voo',experienciaExecutiva.antes],['Durante o voo',experienciaExecutiva.durante],['Após o voo',experienciaExecutiva.apos]].map(([nome,itens])=>`<section><h2>${nome}</h2><ul>${itens.map(v=>'<li>'+v+'</li>').join('')}</ul></section>`).join('')}</div>
    <p class="exec-note">A Executiva é exclusiva dos voos operados pelo Boeing 737 MAX 8. A escolha da poltrona na cabine executiva está incluída na tarifa.</p></div>`;
}
