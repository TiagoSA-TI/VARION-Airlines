'use strict';
const transporteCore = (function coreFactory(){
 const routes=[
  {code:'CNF',terminal:'Rodoviária de Belo Horizonte',airport:'Aeroporto de Confins',cents:3990,minutes:60},
  {code:'GRU',terminal:'Terminal Rodoviário do Tietê',airport:'Aeroporto de Guarulhos',cents:3490,minutes:60},
  {code:'GIG',terminal:'Rodoviária Novo Rio',airport:'Aeroporto do Galeão',cents:2990,minutes:45},
  {code:'REC',terminal:'Terminal Integrado de Passageiros (TIP)',airport:'Aeroporto de Recife',cents:2490,minutes:50}
 ];
 const rules={hours:[0,2,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],beforeDomestic:120,beforeInternational:180,afterDomestic:45,afterInternational:60,maxWait:180,discount:10,offset:'-03:00'};
 const minute=60000;
 const get=code=>routes.find(r=>r.code===code);
 const dateAt=ms=>new Date(ms-3*3600000).toISOString().slice(0,10);
 const label=ms=>new Date(ms-3*3600000).toISOString().slice(11,16);
 const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
 const shift=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
 function slots(code,direction,date,now=Date.now()){
  const r=get(code);if(!r||!validDate(date)||!['to','from'].includes(direction))return [];
  return rules.hours.map(h=>{const start=Date.parse(date+'T'+String(h).padStart(2,'0')+':00:00'+rules.offset);return {code,direction,start,end:start+r.minutes*minute};}).filter(s=>s.start>=now);
 }
 function compatible(code,direction,flight,international=false,now=Date.now()){
  if(!get(code)||!Number.isFinite(flight.start)||!Number.isFinite(flight.end))return [];
  const to=direction==='to',anchor=to?flight.start:flight.end;
  const margin=to?(international?rules.beforeInternational:rules.beforeDomestic):(international?rules.afterInternational:rules.afterDomestic);
  const date=dateAt(anchor);
  return [-1,0,1].flatMap(d=>slots(code,direction,shift(date,d),now)).filter(s=>{
   const gap=(to?anchor-s.end:s.start-anchor)/minute;
   return gap>=margin&&gap<=margin+rules.maxWait;
  }).sort((a,b)=>a.start-b.start);
 }
 function quote(items){
  let subtotal=0,discount=0;
  const groups=new Map(),seen=new Set();
  for(const item of items){
   const r=get(item.code);if(!r||!['to','from'].includes(item.direction)||!Number.isFinite(item.start))continue;
   for(const p of new Set(item.passengers||[])){
    const key=JSON.stringify([item.code,item.direction,item.start,p]);if(seen.has(key))continue;seen.add(key);
    subtotal+=r.cents;
    const group=JSON.stringify([item.code,p]);const counts=groups.get(group)||{to:0,from:0,cents:r.cents};counts[item.direction]++;groups.set(group,counts);
   }
  }
  for(const g of groups.values())discount+=Math.round(Math.min(g.to,g.from)*2*g.cents*rules.discount/100);
  return {subtotal,discount,total:subtotal-discount};
 }
 return {routes,rules,get,dateAt,label,validDate,shift,slots,compatible,quote};
})();
if(typeof module!=='undefined' && module.exports) module.exports=transporteCore;
