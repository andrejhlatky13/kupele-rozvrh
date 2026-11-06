'use strict';
const KEY='kupelny-rozvrh-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const DN=['nedeľa','pondelok','utorok','streda','štvrtok','piatok','sobota'];
const fmtDate=s=>{const d=new Date(s+'T12:00');return DN[d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1)+'.'};
const empty=()=>({patient:{name:'',room:'',spa:'',doctor:''},stay:{from:'',to:''},
 meals:{shift:1,items:[{name:'Raňajky',time:'08:00',end:'09:00'},{name:'Obed',time:'12:00',end:'13:00'},{name:'Večera',time:'18:00',end:'19:00'}],skipLunch:false},
 tipRules:[{match:'vírivka|bazén|inhalácia man',tip:'🩳 Zober si plavky'}],notifyMinutes:[30,15],fontSize:19,events:[]});
const BMC_URL='https://www.buymeacoffee.com/andrejhlatt';

let S, view='home', pending=null, timers=[];
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}}
function save(){localStorage.setItem(KEY,JSON.stringify(S));applyFont();reschedule()}
function applyFont(){document.documentElement.style.setProperty('--fs',(S?.fontSize||19)+'px')}
function datesBetween(a,b){const r=[];if(!a||!b)return r;let d=new Date(a+'T12:00'),e=new Date(b+'T12:00');while(d<=e){r.push(ymd(d));d.setDate(d.getDate()+1)}return r}
function allEvents(){
 const ev=S.events.map(e=>({...e,kind:e.kind||'procedure'}));
 const hasMealEvents=ev.some(e=>e.kind==='meal');
 if(!hasMealEvents){for(const d of datesBetween(S.stay.from,S.stay.to))for(const m of S.meals.items){
  if(S.meals.skipLunch&&/obed/i.test(m.name))continue;
  ev.push({date:d,time:m.time,end:m.end,name:m.name,room:'',kind:'meal'})}}
 return ev.map(e=>({...e,at:new Date(e.date+'T'+e.time)})).filter(e=>!isNaN(e.at)).sort((a,b)=>a.at-b.at);
}
function tipFor(e){const out=[];for(const r of S.tipRules){try{if(r.match&&new RegExp(r.match,'i').test(e.name))out.push(r.tip)}catch(x){}}return out}
function evIcon(e){return e.kind==='meal'?'🍽️ ':''}
function msg(e,min){const lines=[evIcon(e)+e.name+' o '+e.time];
 if(e.kind==='meal'&&e.end)lines.push('Čas: '+e.time+'–'+e.end);
 if(e.room)lines.push('Miestnosť '+e.room);return{title:'O '+min+' minút',body:lines.concat(tipFor(e)).join('\n')}}

// ---------- notifications ----------
const Cap=window.Capacitor, isNative=!!(Cap&&Cap.isNativePlatform&&Cap.isNativePlatform());
const LN=isNative?Cap.Plugins.LocalNotifications:null;
async function askPermission(){
 if(LN){const p=await LN.requestPermissions();try{await LN.createChannel({id:'kupele',name:'Pripomienky procedúr',importance:5,sound:'default',vibration:true,visibility:1})}catch(e){}return p.display==='granted'}
 if(!('Notification'in window))return false;return (await Notification.requestPermission())==='granted';
}
async function reschedule(){
 timers.forEach(clearTimeout);timers=[];
 const now=Date.now(),list=[];let id=1;
 for(const e of allEvents())for(const m of S.notifyMinutes){const t=e.at.getTime()-m*60000;if(t>now+5000)list.push({id:id++,t,e,m});else id++}
 if(LN){
  try{const p=await LN.getPending();if(p.notifications.length)await LN.cancel({notifications:p.notifications.map(n=>({id:n.id}))});
   const batch=list.slice(0,400).map(x=>{const mm=msg(x.e,x.m);return{id:x.id,title:mm.title,body:mm.body,largeBody:mm.body,channelId:'kupele',schedule:{at:new Date(x.t),allowWhileIdle:true}}});
   for(let i=0;i<batch.length;i+=50)await LN.schedule({notifications:batch.slice(i,i+50)});}catch(err){console.warn(err)}
  return;
 }
 // web: best-effort while app/tab is alive
 for(const x of list){const dt=x.t-now;if(dt>2**31-1)continue;
  timers.push(setTimeout(()=>showWeb(msg(x.e,x.m),'kr'+x.id),dt))}
}
async function showWeb(m,tag){
 if(!('Notification'in window)||Notification.permission!=='granted')return;
 try{const r=await navigator.serviceWorker?.ready;if(r){r.showNotification(m.title,{body:m.body,tag,icon:'icon.svg',vibrate:[300,100,300],requireInteraction:true});beep();return}}catch(e){}
 new Notification(m.title,{body:m.body,tag});beep();
}
function beep(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.3;o.start();setTimeout(()=>{o.frequency.value=660},250);setTimeout(()=>o.stop(),600)}catch(e){}}

// ---------- views ----------
function render(){
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
 $('#sub').textContent=[S.patient.spa,S.patient.name,S.patient.room&&('izba '+S.patient.room)].filter(Boolean).join(' · ');
 $('#view').innerHTML=({home,today,photo,settings,review,onboard}[view])()+'<p class="foot">Osobný plán klienta – nie je to oficiálna aplikácia kúpeľov. Pri zmene sa vždy riaď pokynmi kúpeľov.</p>';
 bind();
}
function evRow(e,now){const past=e.at<now;const t=tipFor(e);
 return `<div class="ev ${past?'past':''}"><div class="t">${e.time}</div><div><b>${evIcon(e)}${esc(e.name)}</b>${e.room?'<br>Miestnosť '+esc(e.room):''}${e.end?'<br>do '+e.end:''}${t.map(x=>'<br><span class="tip">'+esc(x)+'</span>').join('')}</div></div>`}
function home(){
 if(!S.events.length){const hdr=S.stay.from?`<h2>Pobyt je pripravený</h2><p>${esc(S.patient.spa||'Kúpele')} · ${S.stay.from?fmtDate(S.stay.from):''}${S.stay.to?' – '+fmtDate(S.stay.to):''}</p><p>Teraz pridaj rozvrh procedúr.</p>`:`<h2>Vitaj! 👋</h2><p>Zatiaľ nemáš žiadny rozvrh. Začni novým pobytom alebo rovno pridaj plán.</p>`;
  return `<div class="card">${hdr}${S.stay.from?'':'<button data-go="onboard">🆕 Nový pobyt</button>'}<button data-go="photo">📋 Pridať rozvrh</button><button class="btn2" data-go="photo">📷 Odfotiť plán</button><button class="btn2" id="manual">✍️ Zadať ručne</button></div>${S.stay.from?notifCard():''}`}
 const now=new Date(),nx=allEvents().find(e=>e.at>now);
 if(!nx)return `<div class="card"><h2>Žiadne ďalšie procedúry</h2><p>Pobyt je ukončený alebo plán je prázdny.</p><button data-go="photo">📷 Pridať plán</button></div>`;
 const t=tipFor(nx);
 return `<div class="card"><div>Najbližšie:</div><h2 style="margin:.2em 0">${evIcon(nx)}${esc(nx.name)}</h2>
 <div>${fmtDate(nx.date)} o <b>${nx.time}</b>${nx.room?' · Miestnosť <b>'+esc(nx.room)+'</b>':''}</div>
 <p class="big" id="cd"></p>${t.map(x=>'<p class="tip">'+esc(x)+'</p>').join('')}</div>
 ${notifCard()}<button class="btn2" data-go="today">📋 Celý dnešný deň</button>`;
}
function notifCard(){
 if(isNative)return '';
 const p=('Notification'in window)?Notification.permission:'none';
 if(p==='granted')return `<div class="card">🔔 Upozornenia zapnuté (${S.notifyMinutes.join(' a ')} min vopred). <small>Vo webovej verzii prídu len keď je appka otvorená v pozadí – pre spoľahlivé upozornenia použi Android aplikáciu.</small></div>`;
 return `<div class="card"><button id="perm">🔔 Zapnúť upozornenia</button></div>`;
}
function today(){
 const now=new Date(),d=ymd(now),list=allEvents().filter(e=>e.date===d);
 const nextDay=allEvents().find(e=>e.date>d);
 return `<div class="card"><h2>Dnes – ${fmtDate(d)}</h2>${list.length?list.map(e=>evRow(e,now)).join(''):'<p>Dnes nemáš nič naplánované.</p>'}</div>`+
 (nextDay?`<div class="card"><h3>Zajtra a ďalej</h3>${allEvents().filter(e=>e.date===nextDay.date).map(e=>evRow(e,now)).join('')}<small>${fmtDate(nextDay.date)}</small></div>`:'');
}
function photo(){return `<div class="card"><h2>Nahrať plán z fotky</h2><p>Odfoť papier, ktorý si dostal v kúpeľoch. Potom všetko skontroluješ.</p>
 <label class="btn" style="display:block;text-align:center">📋 Plán procedúr<input type="file" accept="image/*" capture="environment" id="fp" hidden></label>
 <label class="btn btn2" style="display:block;text-align:center">🍽️ Strava (časy jedla)<input type="file" accept="image/*" capture="environment" id="fm" hidden></label>
 <button class="btn2" id="manual">✍️ Pridať ručne</button><div id="ocrst"></div></div>`}
function onboard(){const m=empty().meals.items;return `<div class="card"><h2>Nový pobyt</h2><p>Začni všeobecnými kúpeľmi, napíš vlastný názov, alebo načítaj údaje z fotky kúpeľného preukazu / plánu.</p>
 <div class="row" style="flex-wrap:wrap;gap:.5rem;margin:.6rem 0">
  <button type="button" class="btn2" id="o_mode_gen" data-mode="gen">Všeobecné kúpele</button>
  <button type="button" class="btn2" id="o_mode_custom" data-mode="custom">Vlastný názov</button>
  <button type="button" class="btn2" id="o_mode_photo" data-mode="photo">📷 Načítať z fotky</button>
 </div>
 <div id="o_custom_wrap" style="display:none"><label>Názov kúpeľov</label><input id="o_spa" placeholder="napr. tvoje kúpele"></div>
 <label>Meno (nepovinné)</label><input id="o_name"><label>Izba (nepovinné)</label><input id="o_room">
 <h3>Časy jedál</h3><div id="o_meals">${m.map((x,i)=>`<label>${x.name}</label><div class="row"><input type="time" data-om="${i}" value="${x.time}"><input type="time" data-oe="${i}" value="${x.end}"></div>`).join('')}</div>
 <label class="tog">Bez obeda<input type="checkbox" id="o_skl"></label>
 <div class="row"><div><label>Príchod</label><input type="date" id="o_from"></div><div><label>Odchod</label><input type="date" id="o_to"></div></div>
 <button id="o_ok">Pokračovať → pridať rozvrh</button>${S.events.length||S.stay.from?'':'<button class="btn2" id="o_skip">Preskočiť</button>'}</div>`}
function review(){const r=pending.rows;
 return `<div class="card"><h2>Skontroluj ${pending.type==='meal'?'stravu':'procedúry'}</h2><p>Oprav čo treba. Nič sa neuloží, kým nestlačíš Uložiť.</p>
 ${pending.img?'<details><summary>Ukázať fotku</summary><img class="prev" src="'+pending.img+'"></details>':''}
 <div id="rows">${r.map((x,i)=>`<div class="rev" data-i="${i}">
  ${pending.type==='meal'?'':`<input type="date" data-f="date" value="${x.date||''}">`}
  <div class="row"><input type="time" data-f="time" value="${x.time||''}">${pending.type==='meal'?`<input type="time" data-f="end" value="${x.end||''}">`:`<input data-f="room" placeholder="Miestnosť" value="${esc(x.room)}">`}</div>
  <input data-f="name" placeholder="Názov" value="${esc(x.name)}"><button class="danger" data-del="${i}">Zmazať riadok</button></div>`).join('')}</div>
 <button class="btn2" id="addrow">➕ Pridať riadok</button>
 ${pending.type==='meal'?'':'<label class="tog">Nahradiť existujúce procedúry v týchto dňoch<input type="checkbox" id="repl" checked></label>'}
 <button id="savere">✅ Uložiť</button><button class="btn2" data-go="photo">Zrušiť</button>
 ${pending.raw?'<details><summary>Rozpoznaný text</summary><pre style="white-space:pre-wrap;font-size:.8em">'+esc(pending.raw)+'</pre></details>':''}</div>`}
function settings(){return `<div class="card"><h2>Upozornenia</h2>
 ${[60,30,15,5].map(m=>`<label class="tog">${m} minút vopred<input type="checkbox" data-nm="${m}" ${S.notifyMinutes.includes(m)?'checked':''}></label>`).join('')}
 <button class="btn2" id="test">🔔 Skúšobné upozornenie</button></div>
 <div class="card"><h2>Tipy k procedúram</h2><p><small>Ak názov procedúry obsahuje slovo (viac oddeľ znakom |), zobrazí sa tip.</small></p>
 ${S.tipRules.map((r,i)=>`<div class="rev"><input data-tm="${i}" value="${esc(r.match)}" placeholder="napr. vírivka|bazén"><input data-tt="${i}" value="${esc(r.tip)}" placeholder="Tip"><button class="danger" data-tdel="${i}">Zmazať</button></div>`).join('')}
 <button class="btn2" id="tadd">➕ Pridať tip</button></div>
 <div class="card"><h2>Strava</h2>${S.meals.items.map((m,i)=>`<div class="row"><input data-mn="${i}" value="${esc(m.name)}"><div class="row"><input type="time" data-mt="${i}" value="${m.time}"><input type="time" data-me="${i}" value="${m.end||''}"></div></div>`).join('')}
 <label class="tog">Bez obeda<input type="checkbox" id="skl" ${S.meals.skipLunch?'checked':''}></label></div>
 <div class="card"><h2>Pobyt</h2><label>Kúpele</label><input id="s_spa" value="${esc(S.patient.spa)}" placeholder="Všeobecné kúpele alebo vlastný názov"><label>Meno</label><input id="s_name" value="${esc(S.patient.name)}"><label>Izba</label><input id="s_room" value="${esc(S.patient.room)}">
 <div class="row"><div><label>Od</label><input type="date" id="s_from" value="${S.stay.from}"></div><div><label>Do</label><input type="date" id="s_to" value="${S.stay.to}"></div></div></div>
 <div class="card"><h2>Veľkosť písma</h2><input type="range" min="17" max="28" id="fs" value="${S.fontSize||19}"></div>
 <div class="card"><h2>Podpora autora</h2><p>Appka je zadarmo. Ak chceš podporiť autora:</p><a class="btn btn2" href="${BMC_URL}" target="_blank" rel="noopener">☕ Buy Me a Coffee</a></div>
 <div class="card"><button class="danger" id="clear">🗑️ Vymazať pobyt</button></div>`}

// ---------- OCR ----------
function parseProcedures(text){const rows=[];let cur='';const yr=new Date().getFullYear();
 for(let line of text.split(/\n/)){line=line.trim();if(!line)continue;
  const dm=line.match(/(\d{1,2})\s*[.\/]\s*(\d{1,2})\s*[.\/]?\s*(\d{4})?/);
  const tm=line.match(/\b([01]?\d|2[0-3])\s*[:.,]\s*([0-5]\d)\b/);
  if(dm&&(!tm||dm.index<tm.index)&&+dm[1]<=31&&+dm[2]<=12){cur=(dm[3]||yr)+'-'+pad(dm[2])+'-'+pad(dm[1]);if(!tm)continue;line=line.slice(dm.index+dm[0].length)}
  const t=line.match(/\b([01]?\d|2[0-3])\s*[:.,]\s*([0-5]\d)\b/);if(!t)continue;
  let rest=line.replace(t[0],' ');const rm=rest.match(/\b([A-Z]{1,2}\s?\d{1,3})\b/);let room='';if(rm){room=rm[1].replace(/\s/,'');rest=rest.replace(rm[0],' ')}
  const name=rest.replace(/[|_~*]+/g,' ').replace(/\s+/g,' ').trim();
  rows.push({date:cur,time:pad(t[1])+':'+t[2],name,room,kind:'procedure'})}
 return rows}
function parseMeals(text){const out=[];const N={'raňajk':'Raňajky','ranajk':'Raňajky','desiat':'Desiata','obed':'Obed','olovrant':'Olovrant','večer':'Večera','vecer':'Večera'};
 for(const line of text.toLowerCase().split(/\n/)){const k=Object.keys(N).find(k=>line.includes(k));if(!k)continue;
  const ts=[...line.matchAll(/([01]?\d|2[0-3])\s*[:.,]\s*([0-5]\d)/g)].map(m=>pad(m[1])+':'+m[2]);
  out.push({name:N[k],time:ts[0]||'',end:ts[1]||''})}
 return out}
let tessP=null;
function loadTess(){return tessP||(tessP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='vendor/tess/tesseract.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)}))}
async function doOcr(file,type){
 const st=$('#ocrst');const img=URL.createObjectURL(file);st.innerHTML='<p>⏳ Čítam text z fotky… (môže trvať 30–60 s)</p>';
 let raw='';
 try{await loadTess();const w=await Tesseract.createWorker(['slk','eng'],1,{workerPath:new URL('vendor/tess/worker.min.js',location.href).href,corePath:new URL('vendor/tess/',location.href).href,langPath:new URL('vendor/tess/lang',location.href).href,gzip:false,workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')st.innerHTML='<p>⏳ Čítam… '+Math.round(m.progress*100)+' %</p>'}});
  const r=await w.recognize(file);raw=r.data.text;await w.terminate()}catch(e){st.innerHTML='<p>Text sa nepodarilo prečítať (bez internetu?). Doplň riadky ručne.</p>'}
 let rows=type==='meal'?parseMeals(raw):parseProcedures(raw);
 if(!rows.length)rows=type==='meal'?S.meals.items.map(x=>({...x})):[{date:ymd(new Date()),time:'',name:'',room:''}];
 pending={type,rows,raw,img};view='review';render();
}
function readRows(){document.querySelectorAll('.rev[data-i]').forEach(el=>{const r=pending.rows[+el.dataset.i];el.querySelectorAll('[data-f]').forEach(i=>r[i.dataset.f]=i.value.trim())})}

// ---------- bind ----------
function bind(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{view=b.dataset.go;render()});
 const on=(id,ev,f)=>{const el=$(id);if(el)el[ev]=f};
 on('#perm','onclick',async()=>{await askPermission();reschedule();render()});
 on('#fp','onchange',e=>e.target.files[0]&&doOcr(e.target.files[0],'procedure'));
 on('#fm','onchange',e=>e.target.files[0]&&doOcr(e.target.files[0],'meal'));
 on('#manual','onclick',()=>{pending={type:'procedure',rows:[{date:ymd(new Date()),time:'',name:'',room:''}]};view='review';render()});
 on('#addrow','onclick',()=>{readRows();const last=pending.rows[pending.rows.length-1]||{};pending.rows.push({date:last.date||ymd(new Date()),time:'',name:'',room:''});render()});
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{readRows();pending.rows.splice(+b.dataset.del,1);render()});
 on('#savere','onclick',()=>{readRows();const ok=pending.rows.filter(r=>r.time&&r.name);
  if(pending.type==='meal'){if(ok.length){S.meals.items=ok.map(r=>({name:r.name,time:r.time,end:r.end}));S.meals.skipLunch=!ok.some(r=>/obed/i.test(r.name))}}
  else{const bad=ok.filter(r=>!r.date);if(bad.length){alert('Doplň dátum pri každom riadku.');return}
   if($('#repl')?.checked){const ds=new Set(ok.map(r=>r.date));S.events=S.events.filter(e=>!ds.has(e.date))}
   S.events.push(...ok.map(r=>({date:r.date,time:r.time,name:r.name,room:r.room||'',therapist:'',kind:'procedure'})));
   const ds=S.events.map(e=>e.date).sort();if(!S.stay.from||ds[0]<S.stay.from)S.stay.from=ds[0];if(!S.stay.to||ds.at(-1)>S.stay.to)S.stay.to=ds.at(-1)}
  if(pending.img)URL.revokeObjectURL(pending.img);pending=null;save();view='today';render();alert('Uložené ✅')});
 let oMode='gen';
 const setMode=m=>{oMode=m;const w=$('#o_custom_wrap');if(w)w.style.display=m==='custom'?'block':'none';
  ['gen','custom','photo'].forEach(k=>{const b=$('#o_mode_'+k);if(b)b.classList.toggle('on',oMode===k)})};
 on('#o_mode_gen','onclick',()=>setMode('gen'));
 on('#o_mode_custom','onclick',()=>setMode('custom'));
 on('#o_mode_photo','onclick',()=>{setMode('photo');const fs=S?.fontSize||19;S=empty();S.fontSize=fs;S.patient.spa='';S.patient.name=$('#o_name')?.value||'';S.patient.room=$('#o_room')?.value||'';S.stay={from:$('#o_from')?.value||'',to:$('#o_to')?.value||''};save();view='photo';render()});
 setMode('gen');
 on('#o_skip','onclick',()=>{view='home';render()});
 on('#o_ok','onclick',()=>{const fs=S?.fontSize||19;S=empty();S.fontSize=fs;
  S.meals.items.forEach((x,i)=>{const a=document.querySelector(`[data-om="${i}"]`),b=document.querySelector(`[data-oe="${i}"]`);if(a)x.time=a.value||x.time;if(b)x.end=b.value});S.meals.skipLunch=$('#o_skl').checked;
  const spaCustom=($('#o_spa')?.value||'').trim();
  S.patient.spa=oMode==='custom'?(spaCustom||'Vlastné kúpele'):(spaCustom||'Všeobecné kúpele');
  S.patient.name=$('#o_name').value;S.patient.room=$('#o_room').value;S.stay={from:$('#o_from').value,to:$('#o_to').value};save();askPermission();view='home';render()});
 document.querySelectorAll('[data-nm]').forEach(c=>c.onchange=()=>{S.notifyMinutes=[...document.querySelectorAll('[data-nm]:checked')].map(x=>+x.dataset.nm).sort((a,b)=>b-a);save()});
 document.querySelectorAll('[data-tm],[data-tt]').forEach(i=>i.onchange=()=>{const k=+(i.dataset.tm??i.dataset.tt);S.tipRules[k][i.dataset.tm!=null?'match':'tip']=i.value;save()});
 document.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{S.tipRules.splice(+b.dataset.tdel,1);save();render()});
 on('#tadd','onclick',()=>{S.tipRules.push({match:'',tip:''});save();render()});
 document.querySelectorAll('[data-mn],[data-mt],[data-me]').forEach(i=>i.onchange=()=>{const d=i.dataset,k=+(d.mn??d.mt??d.me);S.meals.items[k][d.mn!=null?'name':d.mt!=null?'time':'end']=i.value;save()});
 on('#skl','onchange',e=>{S.meals.skipLunch=e.target.checked;save()});
 ['spa','name','room'].forEach(k=>on('#s_'+k,'onchange',e=>{S.patient[k]=e.target.value;save();render()}));
 ['from','to'].forEach(k=>on('#s_'+k,'onchange',e=>{S.stay[k]=e.target.value;save()}));
 on('#fs','oninput',e=>{S.fontSize=+e.target.value;applyFont()});on('#fs','onchange',()=>save());
 on('#test','onclick',async()=>{await askPermission();const m={title:'O 15 minút',body:'Vírivka celotelová o 12:30\nMiestnosť B8\n🩳 Zober si plavky'};
  if(LN)await LN.schedule({notifications:[{id:99999,title:m.title,body:m.body,channelId:'kupele',schedule:{at:new Date(Date.now()+3000)}}]});else showWeb(m,'test')});
 on('#clear','onclick',()=>{if(confirm('Naozaj vymazať celý pobyt?')){S=empty();save();view='home';render()}});
}
function tick(){const el=$('#cd');if(!el)return;const nx=allEvents().find(e=>e.at>new Date());if(!nx){return}
 let s=Math.max(0,Math.floor((nx.at-new Date())/1000));const h=Math.floor(s/3600),m=Math.floor(s%3600/60);s%=60;
 el.textContent=(h?h+' h ':'')+pad(m)+' min '+pad(s)+' s';}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{view=b.dataset.v;render()});
(async()=>{load();if(!S){S=empty();view='onboard'}applyFont();render();reschedule();setInterval(tick,1000);tick();
 setInterval(()=>{if(view==='home'||view==='today'){const a=document.activeElement;if(!a||a===document.body)render()}},60000);
 if('serviceWorker'in navigator&&!isNative)navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(LN)askPermission().then(reschedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();reschedule()}});})();
