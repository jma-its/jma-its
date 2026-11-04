/* JHTS 1.1 — synthetic repeatable practice generator. No real patient information. */
(function(){
 'use strict';
 const rand=n=>Math.floor(Math.random()*n);
 const one=arr=>arr[rand(arr.length)];
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
 const patient=(s)=>one(s.patients);
 const appt=(s)=>one(s.appointments);
 const other=(s,id)=>one(s.patients.filter(p=>p.id!==id));
 const fakeDOB='1999-01-01';
 function make(s){
  const p=patient(s),a=appt(s),active=one(s.appointments.filter(x=>x.status!=='cancelled'))||a,q=s.patients.find(z=>z.id===a.patientId),i=s.insurance.find(z=>z.patientId===p.id);
  const insA=s.insurance.find(z=>z.patientId===a.patientId);
  const mismatch=other(s,p.id), different=other(s,a.patientId);
  const safeDOB=p.dob===fakeDOB?'2000-01-01':fakeDOB;
  const fullAction=a.status==='scheduled'?'register':a.status==='cancelled'?'stop_cancelled':'stop_arrived';
  const actionIns=(insA&&insA.status==='verified')?'clear':'review';
  const cases=[
   {key:'find_id',level:1,skill:'identity',prompt:'c_find_id',ref:p.name,expected:p.id,kind:'text',hint:'h_patients'},
   {key:'find_dob',level:1,skill:'identity',prompt:'c_find_dob',ref:p.id,expected:p.dob,kind:'text',hint:'h_patients'},
   {key:'find_city',level:1,skill:'identity',prompt:'c_find_city',ref:p.id,expected:p.city,kind:'text',hint:'h_patients'},
   {key:'find_name',level:1,skill:'identity',prompt:'c_find_name',ref:p.id,expected:p.name,kind:'text',hint:'h_patients'},
   {key:'find_dept',level:1,skill:'appointments',prompt:'c_find_dept',ref:a.id,expected:a.dept,kind:'dept',hint:'h_appointments'},
   {key:'find_appt_date',level:1,skill:'appointments',prompt:'c_find_date',ref:a.id,expected:a.date,kind:'text',hint:'h_appointments'},
   {key:'find_appt_time',level:1,skill:'appointments',prompt:'c_find_time',ref:a.id,expected:a.time,kind:'text',hint:'h_appointments'},
   {key:'find_appt_pid',level:1,skill:'relationships',prompt:'c_find_appt_pid',ref:a.id,expected:a.patientId,kind:'text',hint:'h_appointments'},
   {key:'find_doc',level:2,skill:'insurance',prompt:'c_find_doc',ref:p.id,expected:i?.document||'certificate',kind:'document',hint:'h_insurance'},
   {key:'find_ins_status',level:2,skill:'insurance',prompt:'c_find_status',ref:p.id,expected:i?.status||'unverified',kind:'insurance',hint:'h_insurance'},
   {key:'ins_action',level:2,skill:'insurance',prompt:'c_ins_action',ref:p.id,expected:i?.status==='verified'?'clear':'review',kind:'insuranceAction',hint:'h_insurance'},
   {key:'appt_status',level:2,skill:'appointments',prompt:'c_appt_status',ref:a.id,expected:a.status,kind:'status',hint:'h_appointments'},
   {key:'appt_name',level:2,skill:'relationships',prompt:'c_appt_name',ref:a.id,expected:q?.name||'',kind:'text',hint:'h_appointments'},
   {key:'id_collision',level:2,skill:'validation',prompt:'c_id_collision',ref:p.id,expected:'reject',kind:'idDecision',hint:'h_duplicate'},
   {key:'dob_match',level:2,skill:'validation',prompt:'c_dob_match',ref:p.id,detail:safeDOB,expected:'mismatch',kind:'matchDecision',hint:'h_patients'},
   {key:'dob_valid',level:2,skill:'validation',prompt:'c_dob_valid',ref:'2039-13-42',expected:'invalid',kind:'validDecision',hint:'h_dates'},
   {key:'can_checkin',level:3,skill:'reception',prompt:'c_can_checkin',ref:a.id,expected:a.status==='scheduled'?'yes':'no',kind:'yesno',hint:'h_reception'},
   {key:'wrong_patient',level:3,skill:'identity',prompt:'c_wrong_patient',ref:a.id,detail:different.id,expected:'stop',kind:'stopDecision',hint:'h_identity'},
   {key:'same_patient',level:3,skill:'identity',prompt:'c_same_patient',ref:a.id,detail:a.patientId,expected:'proceed',kind:'stopDecision',hint:'h_identity'},
   {key:'dup_appt',level:3,skill:'validation',prompt:'c_dup_appt',ref:active.id,detail:active.date+' · '+active.time,expected:'duplicate',kind:'dupDecision',hint:'h_appointments'},
   {key:'different_time',level:3,skill:'validation',prompt:'c_different_time',ref:active.id,detail:active.date+' · '+(active.time==='16:40'?'16:20':'16:40'),expected:'not_duplicate',kind:'dupDecision',hint:'h_appointments'},
   {key:'ins_followup',level:3,skill:'insurance',prompt:'c_ins_followup',ref:a.id,expected:actionIns,kind:'insuranceAction',hint:'h_insurance'},
   {key:'full_reception',level:3,skill:'reception',prompt:'c_full_reception',ref:a.id,expected:[a.patientId,actionIns,fullAction],kind:'full',hint:'h_reception'},
   {key:'appointment_patient',level:3,skill:'relationships',prompt:'c_appointment_patient',ref:a.id,detail:different.id,expected:'stop',kind:'stopDecision',hint:'h_relationships'}
  ];
  return cases;
 }
 // 24 distinct scenario templates, with new fictional record selections on each run.
 function generate(s,level,count){
  let tasks=[]; const used=new Set(); let attempts=0;
  while(tasks.length<count&&attempts<30){
   attempts++;const candidates=shuffle(make(s).filter(x=>x.level===level&&!used.has(x.key)));
   if(!candidates.length)break;
   let item=candidates[0]; used.add(item.key); tasks.push(item);
  }
  return shuffle(tasks);
 }
 function normalize(v){return String(v==null?'':v).trim().replace(/\s+/g,' ').toLocaleLowerCase();}
 function evaluate(task,value){
  if(task.kind==='full')return Array.isArray(value)&&Array.isArray(task.expected)&&value.length===3&&value.every((v,j)=>normalize(v)===normalize(task.expected[j]));
  return normalize(value)===normalize(task.expected);
 }
 window.JHTSTraining={generate,evaluate,templates:24};
})();
