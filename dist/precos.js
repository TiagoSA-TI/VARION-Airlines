'use strict';
const precificacao = (() => {
  // Valores em reais de ida e volta para uma pessoa: novembro/dezembro, fevereiro.
  const referencias = {
    GRU:[685,420], GIG:[850,750], BSB:[780,480], POA:[900,540],
    SSA:[980,1010], REC:[1100,650], CWB:[820,660], FOR:[1000,540],
    EZE:[2800,2800], SCL:[1800,2000], MVD:[2200,1850],
    ASU:[1600,1350], LIM:[2650,2300], BOG:[2900,2450]
  };
  // Peso da referência de novembro/dezembro na interpolação com fevereiro,
  // e ajuste do mês em percentual. Férias de janeiro e julho têm maior demanda.
  const meses = [
    [85,103],[0,100],[20,98],[35,100],[20,97],[45,100],
    [80,103],[25,98],[30,99],[55,100],[100,100],[100,100]
  ];
  const faixas = [[3,135],[7,120],[15,110],[30,100],[60,95],[Infinity,90]];

  // Datas inclusivas em AAAA-MM-DD. Listas vazias não habilitam nenhum voo.
  const campanhas = ['Natal','Ano Novo'].map(nome=>({
    nome,ativa:false,descontoPercentual:0,validade:{inicio:null,fim:null},
    viagem:{inicio:null,fim:null},destinos:[],tarifas:[],acumulavel:false
  }));
  function desconto(centavos, codigo, tarifa, compra, partida) {
    const dentro=(data,periodo)=>periodo.inicio && periodo.fim && data>=periodo.inicio && data<=periodo.fim;
    const elegiveis=campanhas.filter(c=>c.ativa && c.descontoPercentual>0 && c.descontoPercentual<=100 &&
      c.destinos.includes(codigo) && c.tarifas.includes(tarifa) &&
      dentro(compra,c.validade) && dentro(partida,c.viagem));
    let combinado=1, isolado=1;
    for(const c of elegiveis){
      const fator=1-c.descontoPercentual/100;
      if(c.acumulavel)combinado*=fator;
      else isolado=Math.min(isolado,fator);
    }
    return Math.round(centavos*Math.min(combinado,isolado));
  }
  function antecedencia(compra,partida){
    // Datas civis, independentes da hora da consulta e da duração do dia local.
    const dias=(Date.parse(partida+'T00:00Z')-Date.parse(compra+'T00:00Z'))/86400000;
    return faixas.find(([limite])=>dias<=limite)[1];
  }
  function tarifas(rota,saida,compra,lugaresEconomica,voo) {
    const [novembro,fevereiro]=referencias[rota.code];
    const [peso,ajuste]=meses[Number(saida.data.slice(5,7))-1];
    const referenciaCentavos=novembro*peso+fevereiro*(100-peso);
    const hora=Number(saida.hora.slice(0,2));
    const pico=(hora>=6 && hora<9)||(hora>=17 && hora<21);
    const demanda=lugaresEconomica<=8?2:lugaresEconomica>=18?-2:0;
    const variacao=100+(pico?2:0)+demanda;
    const base=Math.round(referenciaCentavos*ajuste*antecedencia(compra,saida.data)*variacao/2000000);
    const disponiveis=cabinSeats(voo).filter(s=>s.state==='available');
    const executivos=disponiveis.filter(s=>s.category==='business').length;
    const economicos=Math.min(lugaresEconomica,disponiveis.length-executivos);
    return Object.entries(familiasTarifarias)
      .filter(([nome])=>nome!=='Executiva'||frota[voo.aircraft].businessRows)
      .map(([nome,regra])=>{
        const tabela=Math.round(base*regra.percentual/100);
        const preco=desconto(tabela,rota.code,nome,compra,saida.data);
        return {nome,valor:preco/100,emCampanha:preco<tabela,lugares:nome==='Executiva'?executivos:economicos};
      });
  }
  const centavos=valor=>Math.round(valor*100);
  function grupo(query,unitario){return seatCount(query)*centavos(unitario)/100}
  function resumo(query,voo,adicionalSalvo,beneficioSalvo){
    const trechos=bookingLegs(voo);
    const beneficio=beneficioSalvo || beneficios.cotar(query,trechos,beneficioSalvo!==null);
    const passagens=centavos(beneficio.final);
    const adicionais=adicionalSalvo==null?trechos.reduce((s,t)=>s+centavos(seatFees(t)),0):centavos(adicionalSalvo);
    return {beneficio,passagens:passagens/100,adicionais:adicionais/100,total:(passagens+adicionais)/100};
  }
  return {tarifas,grupo,resumo};
})();
