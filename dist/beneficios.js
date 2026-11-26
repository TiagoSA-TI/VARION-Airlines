'use strict';
const beneficios = (() => {
  const planos = {
    Family:{taxa:10, titulo:'Três ou quatro pessoas', descricao:'Viaje em um grupo de três ou quatro passageiros com assento. O desconto vale para as passagens de todos no grupo.'},
    Duo:{taxa:7, titulo:'Viagem a dois', descricao:'Duas pessoas com assento na mesma reserva já formam uma dupla. Vale para amigos, colegas, familiares ou um casal.'},
    Student:{taxa:12, titulo:'Estudantes de escolas bilíngues', descricao:'Identifique quem estuda em uma escola bilíngue ao escolher o voo ou preencher os dados dos passageiros. O desconto vale para as passagens desses estudantes.'}
  };
  const politica={combinarComCampanhas:false};
  function lugares(q) {
    const p=partyFor(q);
    return [['adults',p.adults],['children',p.children]].flatMap(([tipo,n])=>
      Array.from({length:n},(_,i)=>({id:tipo+'-'+(i+1),nome:(tipo==='adults'?'Adulto ':'Criança ')+(i+1)})));
  }
  function estudantes(q){
    return lugares(q).map(p=>p.id).filter(id=>Array.isArray(q.students) && q.students.includes(id));
  }
  function cotar(q,trechos,permitir=true){
    const qtd=seatCount(q),alunos=estudantes(q).length;
    const custos=trechos.map(t=>Math.round(t.price*100));
    const original=custos.reduce((v,c)=>v+c*qtd,0);
    let escolhido=null,economia=0,descontos=custos.map(()=>0);
    if(permitir && (politica.combinarComCampanhas || !trechos.some(t=>t.emCampanha))){
      for(const [nome,quantidade] of [['Family',qtd===3||qtd===4?qtd:0],['Duo',qtd===2?qtd:0],['Student',alunos]]){
        const valores=custos.map(c=>Math.round(c*planos[nome].taxa/100)*quantidade);
        const soma=valores.reduce((a,b)=>a+b,0);
        if(soma>economia){escolhido=nome;economia=soma;descontos=valores}
      }
    }
    return {plano:escolhido,percentual:planos[escolhido]?.taxa||0,original:original/100,economia:economia/100,
      final:(original-economia)/100,elegiveis:escolhido==='Student'?alunos:escolhido?qtd:0,
      trechos:custos.map((c,i)=>({original:c*qtd/100,economia:descontos[i]/100,final:(c*qtd-descontos[i])/100}))};
  }
  function tarifa(q,t,ida){
    const perna={price:t.valor,emCampanha:t.emCampanha};
    const quote=cotar(q,ida?[ida,perna]:[perna]);
    return {...quote,...quote.trechos.at(-1)};
  }
  function detalhe(b){
    if(!b?.plano)return '';
    const quem=b.plano==='Student'?' · '+b.elegiveis+(b.elegiveis===1?' estudante':' estudantes'):'';
    return `<section class="benefit-saving" aria-label="Benefício aplicado"><strong>Varion ${b.plano} · ${b.percentual}%</strong><small>Passagens${quem}</small><dl><div><dt>Valor original</dt><dd>${money(b.original)}</dd></div><div><dt>Economia</dt><dd>− ${money(b.economia)}</dd></div><div><dt>Com desconto</dt><dd>${money(b.final)}</dd></div></dl></section>`;
  }
  function declaracao(q){
    const ids=estudantes(q);
    return `<details class="student-declaration"><summary>Algum passageiro estuda em escola bilíngue?</summary><fieldset><legend>Declaro que estes passageiros são estudantes de escola bilíngue</legend>${lugares(q).map(p=>`<label><input type="checkbox" data-student="${p.id}" ${ids.includes(p.id)?'checked':''}> ${p.nome}</label>`).join('')}<p>Declaração simulada, sem documentos. Aplicamos o plano que gerar a maior economia para a reserva.</p></fieldset></details>`;
  }
  function inicio(){
    return `<section class="benefit-home wrap"><img loading="lazy" src="assets/rio.jpg" alt="Baía de Guanabara e Pão de Açúcar no Rio de Janeiro"><div><p class="eyebrow">Benefícios VARION</p><h2>Com quem você vai?</h2><p>Em dupla, em grupo ou como estudante de escola bilíngue, sua viagem pode ter um desconto nas passagens.</p><a href="#beneficios">Conhecer os planos gratuitos <span aria-hidden="true">↗</span></a></div></section>`;
  }
  function pagina(){
    return `<article class="wrap sub benefit-guide">${homeLink}<div class="benefit-intro"><div><p class="eyebrow">Benefícios VARION</p><h1>Planos para quem viaja com você</h1><p>Três planos gratuitos. A cada reserva, aplicamos automaticamente o que oferece a maior economia.</p><button class="primary" data-benefit-search>Buscar passagens →</button></div><img src="assets/recife.jpg" alt="Orla do Recife vista do alto"></div>${Object.entries(planos).map(([nome,p])=>`<section class="benefit-rule"><div><small>${p.titulo}</small><h2>Varion ${nome}</h2></div><strong>${p.taxa}<small>%</small></strong><p>${p.descricao}</p></section>`).join('')}<div class="benefit-terms"><h2>Como calculamos a economia</h2><p>Contamos adultos e crianças com assento para o Duo e o Family. Bebês de colo viajam sem tarifa. O desconto incide sobre as passagens de ida e de volta. A escolha de assentos, bagagens e outros adicionais mantêm seus preços.</p><p>Os planos são gratuitos, sem assinatura ou mensalidade. Usamos um único plano por reserva. Descontos de campanhas e planos comerciais são aplicados separadamente.</p></div></article>`;
  }
  return {cotar,tarifa,estudantes,detalhe,declaracao,inicio,pagina};
})();
