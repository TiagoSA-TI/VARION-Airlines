'use strict';
// Malha oficial. Horários de partida no hub, durações, tarifas e lotações são demonstrativos.
const rede = (() => {
  const hub = 'CNF';
  const brasil = 'America/Sao_Paulo';
  const diario = [0, 1, 2, 3, 4, 5, 6];
  const aeroportos = {};
  const rotas = [];
  function aeroporto(code, cidade, aeroporto, regiao, pais, lon, lat, zona) {
    aeroportos[code] = {code, cidade, aeroporto, regiao, pais, lon, lat, zona};
  }
  aeroporto(hub,'Belo Horizonte','Confins','Minas Gerais','Brasil',-43.972,-19.635,brasil);
  // Cada partida programada atende a ida e seu retorno operacional com a mesma aeronave.
  const partida = (hora,aircraft) => ({hora,aircraft});
  function rota(code,cidade,nome,regiao,pais,lon,lat,zona,minutos,partidas,dias=diario) {
    aeroporto(code,cidade,nome,regiao,pais,lon,lat,zona);
    const frequencia = dias.length === 7
      ? partidas.length === 1 ? '1 voo diário' : partidas.length+' voos diários'
      : dias.length+' voos semanais';
    rotas.push({code,minutos,partidas,dias,frequencia,internacional:pais!=='Brasil',numero:2100+rotas.length*10});
  }
  rota('GRU','São Paulo','Guarulhos','São Paulo','Brasil',-46.473,-23.436,brasil,80,[partida('06:10','max8'), partida('12:45','e190'), partida('18:40','a319')]);
  rota('GIG','Rio de Janeiro','Galeão','Rio de Janeiro','Brasil',-43.251,-22.810,brasil,65,[partida('07:10','a319'), partida('16:20','max8')]);
  rota('BSB','Brasília','Presidente Juscelino Kubitschek','Distrito Federal','Brasil',-47.921,-15.871,brasil,85,[partida('07:40','e190'), partida('17:20','a319')]);
  rota('POA','Porto Alegre','Salgado Filho','Rio Grande do Sul','Brasil',-51.171,-29.994,brasil,140,[partida('09:15','a319')]);
  rota('SSA','Salvador','Deputado Luís Eduardo Magalhães','Bahia','Brasil',-38.323,-12.908,brasil,100,[partida('08:30','a319')]);
  rota('REC','Recife','Guararapes','Pernambuco','Brasil',-34.919,-8.126,brasil,145,[partida('10:20','max8')]);
  rota('CWB','Curitiba','Afonso Pena','Paraná','Brasil',-49.176,-25.529,brasil,100,[partida('14:15','e190')]);
  rota('FOR','Fortaleza','Pinto Martins','Ceará','Brasil',-38.533,-3.776,brasil,165,[partida('09:45','max8')]);
  rota('EZE','Buenos Aires','Ezeiza','Buenos Aires','Argentina',-58.536,-34.822,'America/Argentina/Buenos_Aires',215,[partida('08:10','max8')]);
  rota('SCL','Santiago','Arturo Merino Benítez','Santiago','Chile',-70.786,-33.393,'America/Santiago',285,[partida('09:05','max8')],[1,2,4,5,0]);
  rota('MVD','Montevidéu','Carrasco','Canelones','Uruguai',-56.030,-34.838,'America/Montevideo',165,[partida('11:10','a319')],[1,3,5,6]);
  rota('ASU','Assunção','Silvio Pettirossi','Central','Paraguai',-57.520,-25.240,'America/Asuncion',140,[partida('12:10','e190')],[2,4,6,0]);
  rota('LIM','Lima','Jorge Chávez','Callao','Peru',-77.114,-12.022,'America/Lima',330,[partida('07:05','max8')],[1,4,6]);
  rota('BOG','Bogotá','El Dorado','Bogotá','Colômbia',-74.147,4.702,'America/Bogota',370,[partida('06:45','max8')],[2,5,0]);
  const porCodigo = Object.fromEntries(rotas.map(r=>[r.code,r]));
  const destinos = origem => origem===hub ? rotas.map(r=>r.code) : porCodigo[origem] ? [hub] : [];
  const formatadores = new Map();
  function local(ms,code) {
    const zona=aeroportos[code].zona;
    if (!formatadores.has(zona)) formatadores.set(zona,new Intl.DateTimeFormat('sv-SE',{timeZone:zona,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}));
    const [data,hora]=formatadores.get(zona).format(ms).split(' ');
    return {data,hora};
  }
  function adicionar(data,dias) {return new Date(Date.parse(data+'T12:00:00Z')+dias*86400000).toISOString().slice(0,10)}
  function dataValida(s) {return typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T12:00:00Z')) && adicionar(s,0)===s}
  function voos(from,to,data,compra=local(Date.now(),hub).data) {
    if (!dataValida(data) || !destinos(from).includes(to)) return [];
    const ida=from===hub, rota=porCodigo[ida?to:from];
    if (!rota.dias.includes(new Date(data+'T12:00:00Z').getUTCDay())) return [];
    return rota.partidas.map(({hora,aircraft},i)=>{
      const alvo=Date.parse(data+'T'+hora+':00Z');
      const noHub=local(alvo,hub);
      const base=alvo+(alvo-Date.parse(noHub.data+'T'+noHub.hora+':00Z'));
      const partida=ida?base:base+(rota.minutos+65)*60000;
      const chegada=partida+rota.minutos*60000;
      const saida=local(partida,from), fim=local(chegada,to);
      const numero=rota.numero+2*i+(ida?0:1);
      const seq=Math.floor(alvo/86400000)+numero;
      const voo={from,to,aircraft,capacity:capacidade(aircraft),date:saida.data,arrivalDate:fim.data,departure:saida.hora,arrival:fim.hora,start:partida,end:chegada,minutes:rota.minutos,number:'VN '+numero};
      voo.tarifas=precificacao.tarifas(rota,saida,compra,3+seq%21,voo);
      return voo;
    });
  }
  return {hub,aeroportos,rotas,porCodigo,destinos,voos,local,adicionar,dataValida};
})();
