/* JHTS 1.5 Training Academy. Workflow events are recorded from real application pages.
   This is local educational feedback, NOT an authenticated examination system. */
(function(){
'use strict';
let resources=null, loading=null;
const STAGE=['aca_phaselearn','aca_phaseguided','aca_phaseindependent','aca_phasecheck'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getLang=()=>localStorage.getItem('JHTS_LANG')==='ja'?'ja':'en';
const t=k=>window.JHTS_I18N[getLang()][k]||window.JHTS_I18N.en[k]||k;
const loc=x=>(x&&typeof x==='object'?(x[getLang()]||x.en||''):x)||'';
const db=()=>window.JHTSStore.get();
const save=()=>window.JHTSStore.save();
const now=()=>new Date().toISOString();
function ensure(){if(!db().academy)db().academy={version:1,active:null,passed:{},history:[]};return db().academy;}
function fetchAll(){
 if(loading)return loading;
 loading=Promise.all(['academy-config.json','academy-levels.json','academy-cases.json'].map(async n=>{
  const response=await fetch('data/'+n,{cache:'no-cache'});if(!response.ok)throw Error(n+': '+response.status);return response.json();
 })).then(([cfg,levels,cases])=>{
   if(cfg.version!==1||levels.version!==1||cases.version!==1||!Array.isArray(levels.levels)||!cases.pools||!Array.isArray(cfg.visibleLevels))throw Error('Academy configuration invalid');
   resources={cfg,levels:levels.levels,cases};ensure();return resources;
 }).catch(e=>{console.error('Academy load:',e);throw e;});
 return loading;
}
function level(n){return resources?.levels.find(x=>x.id===Number(n));}
function available(n){if(!resources?.cfg.visibleLevels.includes(n))return false;if(n===0)return true;
 return !resources.cfg.requireMasteryToUnlock || !!ensure().passed[String(n-1)]?.passed;
}
function shuffle(xs){const x=xs.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function start(n){
 n=Number(n);if(!resources||!level(n)||!available(n))return false;
 const a=ensure(),plan=level(n),assignments={},used=[];
 for(let p=0;p<4;p++)for(let i=0;i<plan.phases[p].length;i++){
   const step=plan.phases[p][i];
   if(step.type==='appointment_decision'){
     const possible=db().appointments.filter(a=>a.status===(step.pool==='cancelled'?'cancelled':'scheduled')&&db().patients.some(z=>z.id===a.patientId));
     if(!possible.length)throw Error('No appointments for this practice. Restore the practice database.');
     let unused=possible.filter(a=>!used.includes('appt:'+a.id));if(!unused.length)unused=possible;
     const a=shuffle(unused)[0],patient=db().patients.find(z=>z.id===a.patientId);
     const issue=step.issue||'none',depts=['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent'];
     const timeShift=tm=>{const [h,m]=tm.split(':').map(Number);const v=(h*60+m+20)%(24*60);return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');};
     const nextDate=x=>{const d=new Date(x+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
     const ticket={appointmentId:a.id,patientId:a.patientId,patientName:patient.name,dob:patient.dob,date:issue==='date_mismatch'?nextDate(a.date):a.date,time:issue==='time_mismatch'?timeShift(a.time):a.time,dept:issue==='dept_mismatch'?depts[(depts.indexOf(a.dept)+1)%depts.length]:a.dept};
     assignments[p+':'+i]={...ticket,issue};used.push('appt:'+a.id);continue;
   }
   if(step.type!=='patient_confirm'||!step.pool)continue;
   const pool=resources.cases.pools[step.pool]||[];
   const eligible=pool.filter(id=>db().patients.some(x=>x.id===id));
   let availableIds=eligible.filter(id=>!used.includes(id));if(!availableIds.length)availableIds=eligible;
   const selected=shuffle(availableIds)[0];if(!selected)throw Error('Patient pool is empty');
   assignments[p+':'+i]=selected;used.push(selected);
 }
 a.active={level:n,phase:0,step:0,startedAt:now(),earned:0,mistakes:0,critical:0,assignments,events:[],stepMistakes:0};save();return true;
}
function active(){return ensure().active;}
function stepInfo(){const r=active(),lvl=r&&level(r.level);if(!lvl)return null;const item=lvl.phases[r.phase]?.[r.step];if(!item)return null;
 const assignment=r.assignments[r.phase+':'+r.step];
 const id=item.type==='appointment_decision'?assignment?.appointmentId:item.id||assignment;
 return {r,lvl,item,id,assignment,patient:item.type==='appointment_decision'?null:id&&db().patients.find(p=>p.id===id)};
}
function ticket(info){
 if(info?.item.type==='appointment_decision'){
   const a=info.assignment;if(!a)return '';
   const dept=t('dept_'+a.dept)||a.dept;
   const labels=[['Patient ID','患者ID',a.patientId],['Name','氏名',a.patientName],['Date of birth','生年月日',a.dob],['Date','日付',a.date],['Time','時間',a.time],['Department','診療科',dept]];
   const fields=info.r.phase<=1?[['Appointment ID','予約ID',a.appointmentId],...labels]:labels;
   return `<div class="aca-ticket"><div class="aca-overline">${esc(t('aca_app_ticket'))}</div><div class="aca-details">${fields.map(([en,ja,v])=>`<div><small>${esc(getLang()==='ja'?ja:en)}</small><strong>${esc(v)}</strong></div>`).join('')}</div><p class="aca-small">${esc(t('aca_app_ticket_notice'))}</p></div>`;
 }
 const p=info?.patient;if(!p)return '';
 const mode=info.item.ticket||'id_dob';
 const fields=mode==='surname_dob'?[['Family name',p.name.trim().split(/\s+/).slice(-1)[0]],['Date of birth',p.dob]]:mode==='name_dob'?[['Name',p.name],['Date of birth',p.dob]]:[['Patient ID',p.id],['Date of birth',p.dob]];
 const jp={'Family name':'姓','Date of birth':'生年月日','Name':'氏名','Patient ID':'患者ID'};
 return `<div class="aca-ticket"><div class="aca-overline">${esc(t('aca_ticket'))}</div><div class="aca-details">${fields.map(([k,v])=>`<div><small>${esc(getLang()==='ja'?jp[k]:k)}</small><strong>${esc(v)}</strong></div>`).join('')}</div></div>`;
}
function graded(info){return info.r.phase>=2;}
function record(r,event,detail,correct,points=0){
 r.events.push({at:now(),level:r.level,phase:r.phase,step:r.step,event,detail:String(detail).slice(0,100),correct,points});
 r.events=r.events.slice(-140);
}
function success(event,detail){const info=stepInfo();if(!info)return;
 const {r,lvl}=info;let pts=0;
 if(graded(info)){pts=r.stepMistakes===0?10:r.phase===3?0:r.stepMistakes===1?6:3;r.earned+=pts;}
 record(r,event,detail,true,pts);r.step++;r.stepMistakes=0;
 if(r.step>=lvl.phases[r.phase].length){r.phase++;r.step=0;}
 if(r.phase===4){
   const total=lvl.phases.slice(2).reduce((n,s)=>n+s.length,0)*10;
   const percent=Math.round(r.earned/Math.max(1,total)*100);
   const cfg=resources.cfg;
   const passed=percent>=cfg.masteryPercent&&(!cfg.criticalMustBeZero||r.critical===0);
   const finished={level:r.level,startedAt:r.startedAt,finishedAt:now(),score:percent,passed,incorrect:r.mistakes,critical:r.critical,events:r.events};
   const a=ensure();a.history.unshift(finished);a.history=a.history.slice(0,100);
   if(passed){const old=a.passed[String(r.level)];if(!old||old.score<percent)a.passed[String(r.level)]={score:percent,passed:true,finishedAt:finished.finishedAt};}
   a.active=null;
 }
 save();updateUI();
 if(!active())window.JHTS_HELPERS?.notify(t('aca_end'));
 else window.JHTS_HELPERS?.notify(t('aca_success'));
}
function mistake(detail,{event='patient_confirm',critical=true}={}){const info=stepInfo();if(!info)return;
 const r=info.r;r.mistakes++;r.stepMistakes++;if(r.phase===3&&critical)r.critical++;
 record(r,event,detail,false,0);save();updateUI();window.JHTS_HELPERS?.notify(t(event==='appointment_decision'?'aca_app_wrong':'aca_error'));
}
function observe(event,details={}){const info=stepInfo();if(!info)return false;
 const {item,id}=info;
 if(item.type==='open_page'&&event==='open_page'&&item.page===details.page){success(event,details.page);return true;}
 if(item.type==='switch_language'&&event==='switch_language'&&item.lang===details.lang){success(event,details.lang);return true;}
 if(item.type==='search_patient'&&event==='patient_search'&&String(details.query).toUpperCase()===item.id.toUpperCase()){success(event,details.query);return true;}
 if(item.type==='appointment_search'&&event==='appointment_search'&&String(details.query).toUpperCase()===item.id.toUpperCase()){success(event,details.query);return true;}
 if(item.type==='appointment_decision'&&event==='appointment_decision'){
   const snapshot=info.assignment;
   const a=db().appointments.find(z=>z.id===snapshot?.appointmentId);
   const p=a&&db().patients.find(z=>z.id===a.patientId);
   const allMatch=!!(a&&p&&a.patientId===snapshot.patientId&&p.name===snapshot.patientName&&p.dob===snapshot.dob&&a.date===snapshot.date&&a.time===snapshot.time&&a.dept===snapshot.dept&&a.status==='scheduled');
   const expected=allMatch?'confirm':'review';
   const selected=details.decision;
   if(details.id===id&&selected===expected){
     success(event,id+' '+selected);
     document.getElementById('appointment-inspect-panel')?.remove();
     if(selected==='review')window.JHTS_HELPERS?.notify(t('aca_app_review_good'));
     return true;
   }
   mistake(details.id+' '+selected,{event:'appointment_decision',critical:selected==='confirm'});
   return false;
 }
 if(item.type==='patient_confirm'&&event==='patient_confirm'){
  if(id===details.id){success(event,details.id);const search=document.getElementById('patient-search');if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('patient-inspect-panel')?.remove();return true;}
  mistake(details.id);return false;
 }
 return false;
}
function ack(){const info=stepInfo();if(info?.item.type==='ack'){success('ack','read');return true;}return false;}
function targetPage(info){const x=info.item;
 if(x.type==='open_page')return x.page+'.html';
 if(['search_patient','patient_confirm'].includes(x.type))return 'patients.html';
 if(['appointment_decision','appointment_search'].includes(x.type))return 'appointments.html';
 return null;
}
function panelHTML(info,compact=false){
 const {r,item,lvl}=info;
 const prompt=loc(item.text);
 const hint=(r.phase<=1&&item.type!=='ack')?`<p class="aca-help">${esc(t(item.type==='appointment_decision'?'aca_app_status_rule':'aca_guide_tell'))}</p>`:'';
 const url=targetPage(info);
 const action=item.type==='ack'?`<button type="button" class="btn primary" id="aca-ack">${esc(t('aca_ack'))}</button>`:
   url&&(!compact||document.body.dataset.page!==(url.replace('.html','')))?`<a class="btn primary" href="${url}">${esc(t('aca_go'))}</a>`:'';
 const cur=r.step+1,total=lvl.phases[r.phase].length;
 return `<div class="aca-overline">${esc(t('aca_active'))} · ${esc(t('aca_stage'))} ${r.phase+1}/4 · ${esc(t('aca_task'))} ${cur}/${total}</div><h${compact?'3':'2'} class="aca-task-title">${esc(STAGE[r.phase]?t(STAGE[r.phase]):'')}</h${compact?'3':'2'}><p class="aca-task-prompt">${esc(prompt)}</p>${ticket(info)}${r.phase===3?`<p class="aca-small">${esc(t('aca_nohint'))}</p>`:hint}<div class="buttons">${action}<a class="btn secondary" href="academy.html">${esc(t('aca_back'))}</a></div>`;
}
function updateUI(){const page=document.body.dataset.page||'overview';
 if(page==='academy'&&window.JHTSPages?.academy){window.JHTSPages.academy();return;}
 const prev=document.getElementById('academy-floating');prev?.remove();
 const info=stepInfo();if(!info)return;
 const box=document.createElement('section');box.id='academy-floating';box.className='aca-floating';box.innerHTML=panelHTML(info,true);
 document.getElementById('content')?.prepend(box);box.querySelector('#aca-ack')?.addEventListener('click',ack);
}
function pageReady(page){fetchAll().then(()=>{observe('open_page',{page});updateUI();}).catch(()=>{if(page==='academy')document.getElementById('content').innerHTML='<div class="band danger">'+esc(t('aca_nodata'))+'</div>';});}
function getResources(){return resources;}
window.JHTSAcademy={fetchAll,level,available,start,active,stepInfo,observe,ack,pageReady,ticket,panelHTML,getResources,ensure,updateUI,loc,esc,t};
})();
