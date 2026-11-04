/* JHTS 1.1 — local simulated records, import checks, repeatable training. */
(function(){
 'use strict';
 const KEY='JHTS_DEMO_V1_6_STATE'; // separate localStorage namespace from 1.0
 const clone=o=>JSON.parse(JSON.stringify(o));
 const allowedDept=new Set(['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent']);
 const allowedAppt=new Set(['scheduled','arrived','cancelled']);
 const allowedIns=new Set(['verified','needs_review','expired','unverified']);
 const allowedDoc=new Set(['myna','certificate']);
 const str=(x,max=120)=>typeof x==='string'&&x.length<=max;
 const date=x=>str(x,10)&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x+'T12:00:00').toISOString().slice(0,10)===x;
 const id=(v)=>str(v,30)&&/^[A-Za-z0-9-]+$/.test(v);
 const uniq=(arr,f)=>new Set(arr.map(f)).size===arr.length;
 function seed(){let s={schema:'jhts-training-v1',patients:clone(window.JHTS_PATIENTS),insurance:clone(window.JHTS_INSURANCE),appointments:clone(window.JHTS_APPOINTMENTS),visits:[],mission:null,runs:[],day:null,dayRuns:[],labOrders:[],labEvents:[],bills:[],billingEvents:[],billingRuns:[],academy:null,log:[]}; initializeLab(s);migrateBilling(s);return s;}
 const LABTYPES={glucose:'mg/dL',hemoglobin:'g/dL',crp:'mg/dL',urine_ph:'pH'};
 const LABVALUES={glucose:96,hemoglobin:13.8,crp:0.4,urine_ph:6.0};
 function initializeLab(s){
   // Two synthetic completed registrations make the laboratory exercise runnable without changing unrelated bookings.
   let v=s.visits.filter(x=>s.appointments.some(a=>a.id===x.appointmentId));
   for(const a of s.appointments){
     if(v.length>=2)break;
     if(a.status==='scheduled'&&!s.visits.some(x=>x.appointmentId===a.id)){
       a.status='arrived'; const id='V-L'+String(v.length+1).padStart(3,'0');
       const visit={id,appointmentId:a.id,patientId:a.patientId,date:a.date,insuranceFollowUp:false};s.visits.push(visit);v.push(visit);
     }
   }
   if(!v.length){s.labOrders=[];s.labEvents=[];return;}
   const plan=[['glucose','ordered',false],['hemoglobin','ordered',true],['crp','received',false],['urine_ph','recorded',false],['hemoglobin','ordered',false],['glucose','review',false]];
   s.labOrders=plan.map(([testType,status,wrong],i)=>{
     const vis=v[i%v.length],id='L-'+String(101+i);
     const specimenId='SP-'+String(5101+i);
     const patientId=vis.patientId;
     const altered=s.patients.find(z=>z.id!==patientId)?.id||'P-99999';
     return {id,visitId:vis.id,patientId,testType,specimenId,slipPatientId:wrong?altered:patientId,slipSpecimenId:specimenId,slipValue:LABVALUES[testType],status,resultValue:status==='recorded'||status==='review'?LABVALUES[testType]:null,holdReason:''};
   });
   s.labEvents=[];
 }

 function validDay(d){
  if(!d||typeof d!=='object'||Array.isArray(d)||d.version!==1||!['learn','practice','challenge'].includes(d.mode)||![5,10,12].includes(d.total))return false;
  if(!Array.isArray(d.cases)||d.cases.length!==d.total||!Number.isInteger(d.idx)||d.idx<0||d.idx>=d.total)return false;
  if(!Array.isArray(d.events)||d.events.length>500||!d.events.every(e=>e&&str(e.stage,30)&&str(e.choice,40)&&str(e.caseId,30)&&Number.isFinite(e.points)))return false;
  const stageSet=new Set(['identity','appointment','insurance','decision']);
  if(!d.cases.every(c=>c&&id(c.id)&&id(c.patientId)&&id(c.apptId)&&str(c.issue,40)&&str(c.claimedName,70)&&date(c.claimedDob)&&str(c.ticketDept,30)&&str(c.ticketTime,5)&&date(c.ticketDate)&&str(c.actualDept,30)&&str(c.actualTime,5)&&date(c.actualDate)&&str(c.appointmentStatus,20)&&str(c.insuranceStatus,20)&&Array.isArray(c.steps)&&c.steps.length===4&&c.steps.every(x=>x&&stageSet.has(x.stage)&&typeof x.done==='boolean'&&typeof x.points==='number'&&x.points>=0&&x.points<=35&&Number.isInteger(x.errors)&&x.errors>=0&&x.errors<=100)&&str(c.result||'',20)))return false;
  return true;
 }
 function valid(s){
  if(!s||typeof s!=='object'||Array.isArray(s)||s.schema!=='jhts-training-v1')return false;
  for(const [key,max] of [['patients',400],['insurance',400],['appointments',2000],['visits',2000],['runs',200],['dayRuns',100],['log',500]]){
    if(!Array.isArray(s[key])||s[key].length>max)return false;
  }
  if(!s.patients.every(p=>p&&id(p.id)&&str(p.name,70)&&date(p.dob)&&str(p.city,60))||!uniq(s.patients,x=>x.id))return false;
  const patients=new Set(s.patients.map(x=>x.id));
  if(!s.insurance.every(i=>i&&id(i.id)&&patients.has(i.patientId)&&allowedIns.has(i.status)&&allowedDoc.has(i.document)&&(!i.checkedOn||date(i.checkedOn)))||!uniq(s.insurance,x=>x.id)||!uniq(s.insurance,x=>x.patientId))return false;
  if(!s.appointments.every(a=>a&&id(a.id)&&patients.has(a.patientId)&&date(a.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time)&&allowedDept.has(a.dept)&&allowedAppt.has(a.status))||!uniq(s.appointments,x=>x.id))return false;
  const active=s.appointments.filter(a=>a.status!=='cancelled');
  if(!uniq(active,a=>[a.patientId,a.date,a.time].join('|')))return false;
  const apps=new Map(s.appointments.map(a=>[a.id,a]));
  if(!s.visits.every(v=>v&&id(v.id)&&apps.has(v.appointmentId)&&apps.get(v.appointmentId).patientId===v.patientId&&apps.get(v.appointmentId).status==='arrived'&&date(v.date)&&apps.get(v.appointmentId).date===v.date)||!uniq(s.visits,x=>x.id)||!uniq(s.visits,x=>x.appointmentId))return false;
  if(!s.dayRuns.every(r=>r&&r.type==='hospital-day'&&Number.isFinite(Number(r.score))&&r.score>=0&&r.score<=100&&Number.isInteger(r.total)&&r.total>=1&&r.total<=20&&Array.isArray(r.cases)&&r.cases.length<=20))return false;
  if(s.day!==null&&!validDay(s.day))return false;
  if(!s.runs.every(r=>r&&[1,2,3].includes(r.level)&&Number.isFinite(Number(r.total))&&Number.isFinite(Number(r.firstTry))&&Number.isFinite(Number(r.wrong))))return false;
  if(!Array.isArray(s.labOrders)||s.labOrders.length>500||!Array.isArray(s.labEvents)||s.labEvents.length>500)return false;
  const visits=new Map(s.visits.map(x=>[x.id,x]));
  const labStatuses=new Set(['ordered','received','recorded','review','hold']);
  if(!uniq(s.labOrders,x=>x.id)||!uniq(s.labOrders,x=>x.specimenId)||!s.labOrders.every(o=>o&&id(o.id)&&id(o.specimenId)&&id(o.visitId)&&id(o.patientId)&&visits.has(o.visitId)&&visits.get(o.visitId).patientId===o.patientId&&Object.prototype.hasOwnProperty.call(LABTYPES,o.testType)&&labStatuses.has(o.status)&&id(o.slipPatientId)&&id(o.slipSpecimenId)&&Number.isFinite(o.slipValue)&&o.slipValue>=0&&o.slipValue<=1000&&(o.resultValue===null||Number.isFinite(o.resultValue)&&o.resultValue>=0&&o.resultValue<=1000)&&str(o.holdReason||'',90)))return false;
  if(!Array.isArray(s.bills)||s.bills.length>500||!Array.isArray(s.billingEvents)||s.billingEvents.length>500||!Array.isArray(s.billingRuns)||s.billingRuns.length>100)return false;
  if(!uniq(s.bills,b=>b.id)||!uniq(s.bills,b=>b.visitId))return false;
  const serviceCodes=new Set(['first_visit','followup','lab_glucose','lab_hemoglobin','lab_crp','lab_urine_ph']);
  const pointsMap={first_visit:120,followup:80,lab_glucose:70,lab_hemoglobin:90,lab_crp:65,lab_urine_ph:40};
  const billIds=new Set(s.bills.map(x=>x.id));
  if(!s.bills.every(b=>{
    if(!b||!id(b.id)||!visits.has(b.visitId)||visits.get(b.visitId).patientId!==b.patientId||![10,20,30].includes(b.rate)||!['draft','issued'].includes(b.status)||!Array.isArray(b.lines)||b.lines.length>10||!Array.isArray(b.payments)||b.payments.length>20||!str(b.issuedAt||'',50)||!str(b.createdAt,50))return false;
    if(!uniq(b.lines,l=>l.code+'|'+(l.labOrderId||'')))return false;
    const matchingOrders=new Map(s.labOrders.map(x=>[x.id,x]));
    if(!b.lines.every(l=>l&&serviceCodes.has(l.code)&&Number.isInteger(l.points)&&l.points===pointsMap[l.code]&&(!l.code.startsWith('lab_')||(id(l.labOrderId)&&matchingOrders.has(l.labOrderId)&&matchingOrders.get(l.labOrderId).visitId===b.visitId&&l.code==='lab_'+matchingOrders.get(l.labOrderId).testType))))return false;
    if(b.lines.filter(l=>['first_visit','followup'].includes(l.code)).length>1)return false;
    if(b.status==='issued'&&b.lines.length===0)return false;
    if(!b.payments.every(x=>x&&id(x.id)&&Number.isInteger(x.amount)&&x.amount>0&&x.amount<=1000000&&['cash','card'].includes(x.method)&&str(x.at,50))||!uniq(b.payments,x=>x.id))return false;
    const total=b.lines.reduce((a,l)=>a+l.points*10,0),patientDue=Math.round(total*b.rate/100);
    return b.payments.reduce((a,x)=>a+x.amount,0)<=patientDue&&(b.status!=='draft'||b.payments.length===0);
  }))return false;
  if(!s.billingEvents.every(e=>e&&str(e.at,60)&&str(e.billId,30)&&str(e.action,60)&&str(e.details,200)))return false;
  if(!s.billingRuns.every(r=>r&&r.type==='billing-practice'&&Number.isInteger(r.total)&&r.total>=1&&r.total<=10&&Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=r.total&&str(r.finishedAt,60)))return false;
  if(!s.insurance.every(i=>[10,20,30].includes(i.trainingRate)))return false;
  if(!s.labEvents.every(e=>e&&str(e.at,60)&&str(e.orderId,30)&&str(e.action,60)&&str(e.details,200)))return false;
  if(!s.log.every(l=>l&&str(l.action,90)&&str(l.details,400)&&str(l.at,60)))return false;
  if(s.academy!==null&&s.academy!==undefined){
    const a=s.academy;
    if(!a||typeof a!=='object'||Array.isArray(a)||a.version!==1||!Array.isArray(a.history)||a.history.length>150||!a.passed||typeof a.passed!=='object'||Array.isArray(a.passed))return false;
    if(a.active!==null&&a.active!==undefined){
      const r=a.active;
      if(!r||![0,1,2].includes(r.level)||!Number.isInteger(r.phase)||r.phase<0||r.phase>3||!Number.isInteger(r.step)||r.step<0||r.step>20||!Number.isFinite(r.earned)||r.earned<0||r.earned>500||!Number.isInteger(r.mistakes)||r.mistakes<0||r.mistakes>500||!Number.isInteger(r.critical)||r.critical<0||r.critical>100||!Array.isArray(r.events)||r.events.length>150||!r.assignments||typeof r.assignments!=='object')return false;
    }
  }
  if(s.studentName!==undefined&&!str(s.studentName,100))return false;
  // V1 missions are tolerated, but will be reset on entering the v1.1 mission page.
  if(s.mission!==null&&s.mission!==undefined){
    if(!s.mission||typeof s.mission!=='object'||Array.isArray(s.mission)||!Array.isArray(s.mission.tasks)||s.mission.tasks.length>30)return false;
  }
  if(!s.runs.every(r=>(!r.history||Array.isArray(r.history)&&r.history.length<=35)&&(!('score' in r)||typeof r.score==='number'&&r.score>=0&&r.score<=100)))return false;
  return true;
 }
 function migrateBilling(s){
   if(s.academy===undefined)s.academy=null;
   if(!Array.isArray(s.bills))s.bills=[];
   if(!Array.isArray(s.billingEvents))s.billingEvents=[];
   if(!Array.isArray(s.billingRuns))s.billingRuns=[];
   if(Array.isArray(s.insurance))s.insurance.forEach((i,idx)=>{if(i.trainingRate===undefined)i.trainingRate=[30,20,10][idx%3];});
   return s;
 }
 function load(){for(const key of [KEY,'JHTS_DEMO_V1_5_STATE','JHTS_DEMO_V1_4_STATE','JHTS_DEMO_V1_3_STATE','JHTS_DEMO_V1_2_STATE','JHTS_DEMO_V1_1_STATE','JHTS_DEMO_V1_STATE']){try{const raw=localStorage.getItem(key);if(!raw)continue;const s=JSON.parse(raw);if(key==='JHTS_DEMO_V1_1_STATE'||key==='JHTS_DEMO_V1_STATE'){s.day=null;s.dayRuns=[];}if(!s.dayRuns)s.dayRuns=[];if(s.day===undefined)s.day=null;if(!Array.isArray(s.labOrders)||!Array.isArray(s.labEvents)){initializeLab(s);}migrateBilling(s);if(valid(s))return s;}catch(e){}}return seed();}
 let current=load();
 function save(){try{localStorage.setItem(KEY,JSON.stringify(current));return true;}catch(e){alert('Browser storage is unavailable. Export your work before leaving.');return false;}}
 function replace(s){const copy=clone(s);if(copy&&copy.schema==='jhts-training-v1'&&(!Array.isArray(copy.labOrders)||!Array.isArray(copy.labEvents)))initializeLab(copy);migrateBilling(copy);if(!valid(copy))throw Error('Invalid training file or broken record links.');current=copy;save();}
 function reset(){current=seed();save();}
 function get(){return current;}
 function log(action,details){current.log.unshift({at:new Date().toISOString(),action:String(action).slice(0,90),details:String(details).slice(0,400)});current.log=current.log.slice(0,200);save();}
 function uniqueId(prefix,records){const n=Math.max(0,...records.map(x=>Number(String(x.id).replace(/\D/g,''))||0))+1;return prefix+String(n).padStart(3,'0');}
 window.JHTSStore={get,save,reset,replace,log,uniqueId,valid,LABTYPES};
})();
