/* JHTS 1.2 Hospital Day — fictional independent shift, cross-page skill assessment. */
(function(){
'use strict';
const S=window.JHTSStore;
const H=()=>window.JHTS_HELPERS;
const stages=['identity','appointment','insurance','decision'];
const weights={identity:35,appointment:20,insurance:15,decision:30};
const issues=['normal','name_mismatch','dob_mismatch','wrong_patient_id','wrong_department','wrong_date','wrong_time','insurance_review','insurance_expired','insurance_unverified','cancelled','already_arrived'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const clone=x=>JSON.parse(JSON.stringify(x));
const pad=n=>String(n).padStart(2,'0');
function shiftDate(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function shiftTime(time){const [h,m]=time.split(':').map(Number);let x=(h*60+m+40)%(24*60);return pad(Math.floor(x/60))+':'+pad(x%60);}
function createCase(s,a,issue,n){
 const p=s.patients.find(x=>x.id===a.patientId);if(!p)return null;
 const ins=s.insurance.find(x=>x.patientId===p.id);
 const wrong=pick(s.patients.filter(x=>x.id!==p.id));
 const appt={...a};
 const c={id:'HD-'+pad(n),patientId:p.id,apptId:'HD-A-'+pad(n),issue,claimedName:p.name,claimedDob:p.dob,ticketPatientId:p.id,
    ticketDept:a.dept,ticketDate:a.date,ticketTime:a.time, actualDept:a.dept,actualDate:a.date,actualTime:a.time,
    appointmentStatus:'scheduled', insuranceStatus:ins?.status||'unverified',actualName:p.name,actualDob:p.dob,
    steps:stages.map(stage=>({stage,done:false,points:0,errors:0,hinted:false})),result:'',registered:false};
 switch(issue){
  case 'name_mismatch':c.claimedName=wrong.name;break;
  case 'dob_mismatch':c.claimedDob=wrong.dob===p.dob?'2000-01-01':wrong.dob;break;
  case 'wrong_patient_id':c.ticketPatientId=wrong.id;break;
  case 'wrong_department':c.ticketDept=pick(['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent'].filter(x=>x!==a.dept));break;
  case 'wrong_date':c.ticketDate=shiftDate(a.date,1);break;
  case 'wrong_time':c.ticketTime=shiftTime(a.time);break;
  case 'insurance_review':c.insuranceStatus='needs_review';break;
  case 'insurance_expired':c.insuranceStatus='expired';break;
  case 'insurance_unverified':c.insuranceStatus='unverified';break;
  case 'cancelled':c.appointmentStatus='cancelled';break;
  case 'already_arrived':c.appointmentStatus='arrived';break;
  default:c.insuranceStatus='verified';break;
 }
 // For an isolated conflict case, keep the other two checks clean.
 if(!issue.startsWith('insurance_')&&issue!=='normal')c.insuranceStatus='verified';
 return c;
}
function start(mode,total){
 if(!['learn','practice','challenge'].includes(mode)||![5,10,12].includes(total))throw Error('bad mode');
 const s=S.get();if(s.day)return false;
 const available=shuffle(s.appointments.filter(a=>s.patients.some(p=>p.id===a.patientId)));
 if(available.length<total)throw Error('not enough fictional appointment records');
 const caseTypes=total===5?['normal','name_mismatch','wrong_department','insurance_review','cancelled']:
      total===10?['normal','name_mismatch','dob_mismatch','wrong_patient_id','wrong_department','wrong_date','insurance_review','insurance_expired','cancelled','already_arrived']:shuffle([...issues]);
 const cases=caseTypes.map((k,i)=>createCase(s,available[i],k,i+1));
 if(cases.some(c=>!c))throw Error('invalid shift data');
 s.day={version:1,mode,total,idx:0,cases,events:[],startedAt:new Date().toISOString(),finishedAt:''};
 S.log('hospital_day_start',mode+' '+total+' cases');return true;
}
const active=()=>S.get().day;
const current=()=>{const d=active();return d?d.cases[d.idx]:null;};
const stageNow=()=>{const c=current();return c?.steps.find(x=>!x.done)?.stage||null;};
function expected(c,stage){
 if(stage==='identity')return c.ticketPatientId===c.patientId&&c.claimedName===c.actualName&&c.claimedDob===c.actualDob?'match':'mismatch';
 if(stage==='appointment')return c.appointmentStatus==='scheduled'&&c.ticketDept===c.actualDept&&c.ticketDate===c.actualDate&&c.ticketTime===c.actualTime?'confirmed':'issue';
 if(stage==='insurance')return c.insuranceStatus==='verified'?'clear':'review';
 if(stage==='decision'){
  if(expected(c,'identity')!=='match'||c.appointmentStatus==='cancelled'||c.appointmentStatus==='arrived')return 'stop';
  if(expected(c,'appointment')!=='confirmed'||expected(c,'insurance')!=='clear')return 'review';
  return 'register';
 }
 return '';
}
function isCritical(c,stage,choice){return (stage==='decision'&&choice==='register'&&expected(c,stage)!=='register')||(stage==='identity'&&choice==='match'&&expected(c,stage)!=='match');}
function submit(stage,choice){
 const d=active(),c=current(); if(!d||!c||stageNow()!==stage)return {ok:false,message:'wrong_step'};
 const step=c.steps.find(x=>x.stage===stage),truth=expected(c,stage),correct=choice===truth;
 const critical=isCritical(c,stage,choice);
 let points=0,complete=false;
 if(correct){
  const penalty=Math.min(weights[stage],step.errors*(stage==='identity'?15:stage==='decision'?12:7)+(step.hinted?5:0));
  points=Math.max(0,weights[stage]-penalty);step.points=points;step.done=true;complete=true;
 }else{
  step.errors++;
  if(d.mode==='challenge'){step.done=true;complete=true;}
 }
 const event={caseId:c.id,stage,choice,correct,critical,points,at:new Date().toISOString()};d.events.push(event);
 if(stage==='decision'&&complete){c.registered=correct&&choice==='register';c.result=correct?'complete':'incorrect';}
 S.save();
 return {ok:correct,complete,critical,points,message:correct?'step_correct':critical?'critical_warning':'step_wrong'};
}
function hint(){const d=active(),c=current(),stage=stageNow();if(!d||d.mode==='challenge'||!stage)return false;
 c.steps.find(x=>x.stage===stage).hinted=true;S.save();return true;
}
function scoreCase(c){return c.steps.reduce((v,x)=>v+x.points,0);}
function nextCase(){const d=active(),c=current();if(!d||!c||stageNow())return false;
 if(d.idx<d.total-1){d.idx++;S.save();return true;}
 const score=Math.round(d.cases.reduce((n,x)=>n+scoreCase(x),0)/(d.total*100)*100);
 const summary={type:'hospital-day',mode:d.mode,total:d.total,score,startedAt:d.startedAt,finishedAt:new Date().toISOString(),
    cases:d.cases.map(x=>({id:x.id,patientId:x.patientId,issue:x.issue,score:scoreCase(x),result:x.result,registered:x.registered,
    stages:x.steps.map(z=>({stage:z.stage,errors:z.errors,points:z.points,hinted:z.hinted}))})),
    critical:d.events.filter(x=>x.critical).length,wrong:d.events.filter(x=>!x.correct).length,
    events:clone(d.events)};
 const s=S.get();s.dayRuns.unshift(summary);s.dayRuns=s.dayRuns.slice(0,50);s.day=null;
 S.log('hospital_day_complete',`score=${score} critical=${summary.critical} cases=${d.total}`);return true;
}
function abort(){if(!active())return false;S.get().day=null;S.log('hospital_day_aborted','Current shift cancelled');return true;}
function myStagePage(stage){return {identity:'patients.html',appointment:'appointments.html',insurance:'insurance.html',decision:'reception.html'}[stage];}
function stageLabel(stage){return H().t('hd_stage_'+stage);}
function banner(){
 const d=active();if(!d)return '';
 const {t,E}=H(); const c=current(),stage=stageNow();
 return `<div class="day-banner"><span><strong>${E(t('hospital_day'))}</strong> · ${E(t('hd_case'))} ${d.idx+1}/${d.total} · ${E(t('mode_'+d.mode))} · ${E(stage?stageLabel(stage):t('hd_ready_next'))}</span><a class="btn secondary mini" href="hospital-day.html">${E(t('hd_open_shift'))}</a></div>`;
}
function panel(stage){
 const d=active(),c=current();if(!d||stageNow()!==stage)return '';
 const {t,E,fmtDept}=H();
 const steps={identity:[['match','hd_match'],['mismatch','hd_mismatch']],appointment:[['confirmed','hd_confirmed'],['issue','hd_issue']],insurance:[['clear','hd_clear'],['review','hd_review']],decision:[['register','hd_register'],['review','hd_hold'],['stop','hd_stop']]};
 let data='';
 if(stage==='identity') data=`${t('patient_id')}: <strong>${E(c.patientId)}</strong> · ${t('name')}: <strong>${E(c.actualName)}</strong> · ${t('dob')}: <strong>${E(c.actualDob)}</strong>`;
 if(stage==='appointment')data=`${t('appointment_id')}: <strong>${E(c.apptId)}</strong> · ${t('patient_id')}: ${E(c.patientId)}<br>${t('department')}: <strong>${E(fmtDept(c.actualDept))}</strong> · ${t('date')}: <strong>${E(c.actualDate)}</strong> · ${t('time')}: <strong>${E(c.actualTime)}</strong> · ${t('status')}: <strong>${E(t(c.appointmentStatus))}</strong>`;
 if(stage==='insurance')data=`${t('patient_id')}: <strong>${E(c.patientId)}</strong> · ${t('verification')}: <strong>${E(H().fmtStatus(c.insuranceStatus))}</strong>`;
 if(stage==='decision')data=`${E(t('hd_decision_help'))}<br>${t('appointment_id')}: <strong>${E(c.apptId)}</strong>`;
 const buttons=steps[stage].map(([choice,k])=>`<button class="btn ${choice==='register'||choice==='match'||choice==='confirmed'||choice==='clear'?'primary':'secondary'}" data-hd-choice="${choice}">${E(t(k))}</button>`).join('');
 const hint=d.mode==='challenge'?'':`<button class="btn" data-hd-hint="1">${E(t('show_hint'))}</button>`;
 return `<section class="day-panel card" id="hd-panel"><div class="eyebrow">${E(t('hd_shift_record'))} · ${E(c.id)}</div><h2>${E(stageLabel(stage))}</h2><p class="small muted">${E(t('hd_ticket_compare'))}</p><div class="hd-ticket"><strong>${E(t('hd_paper_ticket'))}</strong><br>${t('patient_id')}: ${E(c.ticketPatientId)} · ${t('name')}: ${E(c.claimedName)} · ${t('dob')}: ${E(c.claimedDob)}<br>${t('department')}: ${E(fmtDept(c.ticketDept))} · ${t('date')}: ${E(c.ticketDate)} · ${t('time')}: ${E(c.ticketTime)}</div><div class="hd-record">${data}</div><div class="buttons section">${buttons}${hint}</div><div id="hd-step-message" class="small" role="status"></div></section>`;
}
function decorate(){
 const main=document.getElementById('content');if(!main)return;
 main.querySelectorAll('.day-banner,.day-panel').forEach(x=>x.remove());
 if(!active())return;
 main.insertAdjacentHTML('afterbegin',banner());
 const page=document.body.dataset.page,stage={patients:'identity',appointments:'appointment',insurance:'insurance',reception:'decision'}[page];
 if(stage&&stageNow()===stage){main.querySelector('.day-banner').insertAdjacentHTML('afterend',panel(stage));bind();}
 // Distinguish existing editable demo records from isolated Hospital Day cases.
 if(stage||page==='lab_orders'||page==='lab_results'){for(const el of main.querySelectorAll('#add-patient,#add-appt,[data-edit-p],[data-edit-a],[data-edit-ins],[data-checkin],#new-lab,#lab-receive,#lab-hold,#lab-record,#lab-forward')){el.disabled=true;el.title=H().t('hd_base_locked');}}
}
function bind(){const panelEl=document.getElementById('hd-panel');if(!panelEl)return;
 const {t}=H();
 panelEl.querySelectorAll('[data-hd-choice]').forEach(el=>el.addEventListener('click',()=>{
  const stage=stageNow(),res=submit(stage,el.dataset.hdChoice);
  if(!res)return;
  const msg=panelEl.querySelector('#hd-step-message');
  msg.textContent=t(res.message)+(res.ok?' +' + res.points+' / '+weights[stage]:'');
  msg.className=res.ok?'band':'band warning';
  if(res.complete){panelEl.querySelectorAll('button').forEach(b=>b.disabled=true);msg.insertAdjacentHTML('beforeend',` <a href="${stageNow()?myStagePage(stageNow()):'hospital-day.html'}">${H().E(t('hd_continue'))} →</a>`);}
 }));
 panelEl.querySelector('[data-hd-hint]')?.addEventListener('click',()=>{
  if(hint()){const m=panelEl.querySelector('#hd-step-message');m.textContent=t('hd_hint_'+stageNow());m.className='band';}
 });
}
function summarySkills(run){const groups={};for(const c of run.cases)for(const st of c.stages){if(!groups[st.stage])groups[st.stage]={score:0,max:0,errors:0};let g=groups[st.stage];g.score+=st.points;g.max+=weights[st.stage];g.errors+=st.errors;}
 return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,{percent:Math.round(v.score/v.max*100),errors:v.errors}]));}
window.JHTSDay={start,active,current,stageNow,expected,submit,hint,nextCase,abort,scoreCase,summarySkills,decorate,stageLabel,weights,issues};
})();
