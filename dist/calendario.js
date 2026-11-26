'use strict';

const calendario = (() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'trip-calendar';
  dialog.setAttribute('aria-labelledby','cal-title');
  dialog.innerHTML = `
    <div class="cal-header"><h2 id="cal-title">Datas da viagem</h2>
      <button type="button" data-cal="close" aria-label="Fechar calendário">×</button></div>
    <div class="cal-selection">
      <button type="button" data-cal="date"><small>Ida</small><strong></strong></button>
      <button type="button" data-cal="back"><small>Volta · opcional</small><strong></strong></button>
    </div>
    <div class="cal-nav"><button type="button" data-cal="prev" aria-label="Mês anterior">‹</button>
      <p class="cal-instruction" aria-live="polite"></p>
      <button type="button" data-cal="next" aria-label="Próximo mês">›</button></div>
    <div class="cal-scroll"><div class="cal-months"></div></div>
    <div class="cal-footer"><div><button type="button" data-cal="clear">Limpar datas</button>
      <button type="button" data-cal="remove">Remover volta</button></div>
      <button type="button" class="primary" data-cal="apply">Confirmar</button></div>`;
  document.body.append(dialog);
  const months = dialog.querySelector('.cal-months');
  const action = name => dialog.querySelector('[data-cal="'+name+'"]');
  const compact = matchMedia('(max-width:650px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const monthFormat = new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});
  const longDate = new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeZone:'UTC'});
  const week = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let anchor, edit, step, first, earliest, closeTimer, frame;
  function monthOf(s) {return s.slice(0,7)+'-01'}
  function shiftMonth(iso,n) {
    const date=new Date(iso+'T12:00:00Z');
    date.setUTCMonth(date.getUTCMonth()+n);
    return date.toISOString().slice(0,10);
  }
  function reason(d) {
    if(d<earliest)return 'Data passada';
    if(step==='back' && d<edit.date)return 'Anterior à ida';
    if(plan.from && plan.to) {
      const route=rede.porCodigo[plan.from===rede.hub?plan.to:plan.from];
      if(route && !route.dias.includes(new Date(d+'T12:00:00Z').getUTCDay()))return 'Sem voo nesta rota';
    }
    return '';
  }
  function monthMarkup(iso) {
    const start=new Date(iso+'T12:00:00Z');
    const end=shiftMonth(iso,1);
    let cells='<i aria-hidden="true"></i>'.repeat(start.getUTCDay());
    for(let d=iso;d<end;d=rede.adicionar(d,1)){
      const why=reason(d);
      const atStart=d===edit.date, atEnd=d===edit.back, inside=edit.date && edit.back && d>edit.date && d<edit.back;
      const cls=[atStart?'departure':'',atEnd?'returning':'',inside?'in-range':'',d===earliest?'is-today':''].join(' ');
      const label=longDate.format(new Date(d+'T12:00:00Z'))+(atStart?', ida':'')+(atEnd?', volta':'')+(why?', '+why:'');
      cells+='<button type="button" class="cal-day '+cls+'" data-iso="'+d+'" aria-label="'+label+'" aria-pressed="'+(atStart||atEnd)+'" '+(why?'disabled title="'+why+'"':'')+'>'+Number(d.slice(-2))+'</button>';
    }
    const label=monthFormat.format(start);
    return '<section class="cal-month" aria-label="'+label+'"><h3>'+label+'</h3><div class="cal-week" aria-hidden="true">'+week.map(s=>'<span>'+s+'</span>').join('')+'</div><div class="cal-grid">'+cells+'</div></section>';
  }
  function paint(animate=false) {
    ['date','back'].forEach(key=>{
      const btn=action(key);btn.setAttribute('aria-pressed',String(step===key));
      btn.querySelector('strong').textContent=edit[key]?dateText(edit[key]):'Selecionar';
    });
    action('back').disabled=!edit.date;
    action('prev').disabled=first<=monthOf(earliest);
    action('remove').hidden=!edit.back;
    action('clear').disabled=!edit.date && !edit.back;
    action('apply').disabled=!edit.date && !plan.date;
    dialog.querySelector('.cal-instruction').textContent=step==='date'?'Escolha a ida':'Escolha a volta ou confirme';
    months.innerHTML=monthMarkup(first)+(compact.matches?'':monthMarkup(shiftMonth(first,1)));
    if(animate && !reduced.matches)months.animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:150,easing:'ease-out'});
    position();
  }
  function position(){
    if(!dialog.open || compact.matches)return;
    const margin=12,rect=anchor.getBoundingClientRect(),w=dialog.offsetWidth,h=dialog.offsetHeight;
    const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
    const top=rect.bottom+8+h<=innerHeight-margin?rect.bottom+8:rect.top-h-8>=margin?rect.top-h-8:clamp((innerHeight-h)/2,margin,innerHeight-h-margin);
    dialog.style.left=clamp(rect.left+rect.width/2-w/2,margin,innerWidth-w-margin)+'px';
    dialog.style.top=top+'px';
  }
  function fecharImediato(){
    clearTimeout(closeTimer);cancelAnimationFrame(frame);
    if(!dialog.open)return;
    dialog.close();document.body.classList.remove('cal-open');
    anchor?.setAttribute('aria-expanded','false');
    dialog.classList.remove('closing','ready');
  }
  function close(){
    if(!dialog.open || dialog.classList.contains('closing'))return;
    if(reduced.matches){fecharImediato();return}
    dialog.classList.add('closing');closeTimer=setTimeout(fecharImediato,130);
  }
  function abrir(trigger) {
    if(dialog.open)fecharImediato();
    anchor=trigger;earliest=today();
    edit={date:plan.date>=earliest?plan.date:'',back:plan.back>=earliest?plan.back:''};
    step=trigger.dataset.dateField==='back'&&edit.date?'back':'date';
    first=monthOf(edit[step]||edit.date||earliest);
    anchor.setAttribute('aria-expanded','true');
    document.body.classList.add('cal-open');dialog.showModal();paint();
    action(step).focus({preventScroll:true});
    frame=requestAnimationFrame(()=>dialog.classList.add('ready'));
  }
  function focusDay(d) {
    const exact=months.querySelector('[data-iso="'+d+'"]:not(:disabled)');
    (exact||action(step)).focus({preventScroll:true});
  }
  function changeStep(key){
    step=key;first=monthOf(edit[key]||edit.date||earliest);paint();
  }
  function apply() {
    plan.date=edit.date;plan.back=edit.back;savePlan();
    const form=anchor.closest('form');
    form.querySelectorAll('[data-date-field]').forEach(button=>{
      const key=button.dataset.dateField,value=plan[key],label=button.querySelector('b');
      label.textContent=value?dateText(value):key==='date'?'Selecionar ida':'Adicionar volta';
      label.classList.toggle('placeholder',!value);
    });
    close();
  }
  dialog.addEventListener('click',e=>{
    if(e.target===dialog){
      const r=dialog.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
      return;
    }
    const btn=e.target.closest('button');
    if(!btn||btn.disabled)return;
    if(btn.dataset.iso){
      const d=btn.dataset.iso;if(reason(d))return;
      if(step==='date'){edit.date=d;if(edit.back<d)edit.back='';step='back'}else edit.back=d;
      paint();focusDay(d);return;
    }
    switch(btn.dataset.cal){
      case 'date':case 'back':changeStep(btn.dataset.cal);break;
      case 'prev':case 'next':first=shiftMonth(first,btn.dataset.cal==='next'?1:-1);paint(true);break;
      case 'clear':edit={date:'',back:''};changeStep('date');action('date').focus();break;
      case 'remove':edit.back='';changeStep('back');action('back').focus();break;
      case 'apply':apply();break;
      case 'close':close();break;
    }
  });
  dialog.addEventListener('keydown',e=>{
    const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
    if(!delta||!e.target.dataset.iso)return;
    e.preventDefault();let d=e.target.dataset.iso;
    for(let i=0;i<8;i++){
      d=rede.adicionar(d,i===0?delta:Math.sign(delta));
      if(d<earliest || (step==='back' && d<edit.date))return;
      if(!reason(d))break;
    }
    if(!months.querySelector('[data-iso="'+d+'"]')){first=monthOf(d);paint(true)}
    focusDay(d);
  });
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  document.addEventListener('click',e=>{const trigger=e.target.closest('[data-date-field]');if(trigger)abrir(trigger)});
  window.addEventListener('resize',position);
  compact.addEventListener('change',()=>{if(dialog.open)paint()});
  return {abrir,fecharImediato};
})();
