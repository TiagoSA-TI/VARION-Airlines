'use strict';
// Dimensões gráficas e zonas de tarifa das cabines simuladas.
const frota = {
  max8: {name:'Boeing 737 MAX 8', rows:29, businessRows:3, businessLetters:'ACDF', letters:'ABCDEF', width:222, nose:125, tail:108, wing:13, sweep:155, extra:[4,15,16], preferred:8},
  a319: {name:'Airbus A319', rows:24, letters:'ABCDEF', width:232, nose:95, tail:90, wing:10, sweep:115, extra:[1,11], preferred:6},
  e190: {name:'Embraer E190-E2', rows:27, letters:'ABCD', width:166, nose:116, tail:104, wing:12, sweep:125, extra:[1,13], preferred:5}
};
function capacidade(id){
  const m=frota[id],n=m.businessRows||0;
  return (m.rows-n)*m.letters.length+n*(m.businessLetters?.length||0);
}
const seatTypes={
  business:{label:'Poltrona executiva',fee:0,benefits:['Poltrona reclinável com divisória e apoio para as pernas.','Escolha de janela ou corredor.']},
  standard:{label:'Assento padrão',fee:29.90,benefits:['Escolha antecipada do seu lugar.','Janela, corredor ou assento central, conforme a cabine e a disponibilidade.']},
  preferred:{label:'Fileiras dianteiras',fee:49.90,benefits:['Lugar na parte dianteira da cabine.','Mais agilidade no desembarque.']},
  extra:{label:'Mais espaço',fee:79.90,benefits:['Espaço adicional para as pernas.','Mais liberdade de movimento durante o voo.']}
};
function categoryFee(leg,category) {
  if(familiasTarifarias[leg.fare]?.inclui.includes(category))return 0;
  return seatTypes[category].fee;
}
function exitEligible(q,index) {
  const p=partyFor(q);
  return index<p.adults && index>=p.infants;
}
function cabinSeats(leg) {
  const model=frota[leg.aircraft], seats=[];
  let seed=2166136261;
  for(const char of [leg.date,leg.number,leg.from,leg.to].join('|'))seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
  for(let row=1;row<=model.rows;row++){
    const business=row<=model.businessRows;
    const letters=business?model.businessLetters:model.letters;
    const category=business?'business':model.extra.includes(row)?'extra':row<=model.preferred?'preferred':'standard';
    for(const [i,letter] of [...letters].entries()){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const occupancy=seed/4294967296;
      const side=Math.min(i,letters.length-1-i);
      seats.push({id:row+letter,row,col:i,category,position:side===0?'Janela':side===letters.length/2-1?'Corredor':'Central',
        state:leg.fare && (leg.fare==='Executiva')!==business?'other':occupancy<.05?'blocked':occupancy<.33?'occupied':'available',exit:row>(model.businessRows||0)+1 && model.extra.includes(row),fee:categoryFee(leg,category)});
    }
  }
  return seats;
}
function restoredSeats(leg, saved, count, query, accepted=[]){
  if(!Array.isArray(saved))return [];
  const available=new Map(cabinSeats(leg).filter(s=>s.state==='available').map(s=>[s.id,s]));
  return Array.from({length:count},(_,i)=>{
    const seat=available.get(saved[i]);
    if(!seat || (seat.exit && !(exitEligible(query,i) && accepted?.[i]===seat.id)))return null;
    available.delete(seat.id);
    return seat.id;
  });
}
function seatFees(leg,legacy=false){
  if(!leg.seats?.some(Boolean) || !frota[leg.aircraft])return 0;
  const selected=new Set(leg.seats);
  // Reservas anteriores à primeira revisão de preços ainda usam a cabine original.
  if(legacy && leg.aircraft==='max8'){
    let total=0;
    for(const id of selected){
      const row=parseInt(id,10);
      if(row>=1 && row<=30)total+=[1,15,16].includes(row)?75:row<=8?35:0;
    }
    return total;
  }
  const oldFees={standard:0,preferred:35,extra:75};
  const cents=cabinSeats(leg).reduce((n,s)=>n+(selected.has(s.id)?Math.round(100*(legacy?oldFees[s.category]:s.fee)):0),0);
  return cents/100;
}
function bookingLegs(f){return f.returnLeg?[f,f.returnLeg]:[f]}
function travelerTitle(q,index) {
  const p=partyFor(q);
  if(index<p.adults)return 'Adulto '+(index+1);
  if(index<p.adults+p.children)return 'Criança '+(index-p.adults+1);
  return 'Bebê '+(index-p.adults-p.children+1);
}
