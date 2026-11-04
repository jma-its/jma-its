(function(){
 'use strict';
 const H=window.JHTS_HELPERS, {db,t,E,save,log,notify,title}=H;
 const tr=window.JHTSTraining;
 const choiceKeys={
  dept:['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent'],
  document:['myna','certificate'],
  insurance:['verified','needs_review','expired','unverified'],
  insuranceAction:['clear','review'],
  status:['scheduled','arrived','cancelled'],
  idDecision:['accept','reject'],matchDecision:['match','mismatch'],validDecision:['valid','invalid'],
  yesno:['yes','no'],stopDecision:['proceed','stop'],dupDecision:['duplicate','not_duplicate'],
  receptionAction:['register','stop_cancelled','stop_arrived']
 };
 function pickOptions(kind,name,placeholder){
   const opts=choiceKeys[kind]||[];
   return `<select class="select" name="${name}" required><option value="" disabled selected>${E(placeholder||t('select_answer'))}</option>${opts.map(x=>`<option value="${E(x)}">${E(t('opt_'+x))}</option>`).join('')}</select>`;
 }
 function taskFields(task){
   if(task.kind==='full')return `<div class="case-form">${H.field(t('patient_id'),`<input class="input" name="patientId" placeholder="P-10001" autocomplete="off" required>`)}${H.field(t('step_insurance'),pickOptions('insuranceAction','insuranceAction'))}${H.field(t('step_reception'),pickOptions('receptionAction','receptionAction'))}</div>`;
   if(choiceKeys[task.kind])return H.field(t('your_decision'),pickOptions(task.kind,'answer'));
   return H.field(t('answer'),`<input class="input" name="answer" autocomplete="off" required placeholder="${task.key==='find_dob'?'YYYY-MM-DD':''}">`);
 }
 const countByLevel={1:6,2:7,3:8};
 function newRun(level,mode){
   const s=db();
   if(s.mission&&!confirm(t('confirm_new_run')))return;
   const tasks=tr.generate(s,level,countByLevel[level]);
   if(!tasks.length){notify(t('no_records'));return;}
   s.mission={version:2,level,mode,tasks,idx:0,wrong:0,firstTry:0,earned:0,possible:tasks.length*10,
    currentWrong:0,hinted:false,waiting:false,feedback:'',startedAt:new Date().toISOString(),history:[]};
   save();renderMissions();
 }
 function finish(){
   const s=db(),m=s.mission;if(!m)return;
   const run={version:2,level:m.level,mode:m.mode,total:m.tasks.length,firstTry:m.firstTry,wrong:m.wrong,
     score:Math.round(m.earned/m.possible*100),earned:m.earned,possible:m.possible,
     startedAt:m.startedAt,finishedAt:new Date().toISOString(),history:m.history};
   s.runs.unshift(run);s.runs=s.runs.slice(0,100);s.mission=null;
   log('complete_training',`mode=${run.mode} level=${run.level} score=${run.score} correct_first=${run.firstTry}/${run.total}`);
   renderMissions();
 }
 function advance(){const m=db().mission;if(!m)return;
   m.idx++;m.waiting=false;m.currentWrong=0;m.hinted=false;m.feedback='';
   if(m.idx>=m.tasks.length)finish();else{save();renderMissions();}
 }
 function recordResult(correct,skipped){
   const m=db().mission,task=m.tasks[m.idx];
   let points=skipped?0:correct?(m.currentWrong?6:10):0;
   if(m.hinted)points=Math.max(0,points-2);
   if(correct&&!m.currentWrong)m.firstTry++;
   m.earned+=points;
   m.history.push({key:task.key,skill:task.skill,correct:!!correct,firstTry:!!(correct&&!m.currentWrong),skipped:!!skipped,
      errors:m.currentWrong,hint:m.hinted,points,possible:10,at:new Date().toISOString()});
   m.waiting=true;m.feedback=skipped?'skipped':correct?'correct':'incorrect';save();renderMissions();
 }
 function checkAnswer(form){
   const m=db().mission;if(!m||m.waiting)return;
   const task=m.tasks[m.idx],v=new FormData(form);
   const ans=task.kind==='full'?[v.get('patientId'),v.get('insuranceAction'),v.get('receptionAction')]:v.get('answer');
   if(task.kind==='full'&&ans.some(x=>!x)){notify(t('required'));return;}
   if(task.kind!=='full'&&!ans){notify(t('required'));return;}
   const good=tr.evaluate(task,ans);
   if(good){recordResult(true,false);return;}
   m.currentWrong++;m.wrong++;
   if(m.mode==='challenge'){recordResult(false,false);return;}
   save();const el=document.getElementById('mission-feedback');
   el.className='band warning';el.textContent=t('wrong_retry');
 }
 function takeHint(){const m=db().mission;if(!m||m.waiting||m.mode==='challenge')return;
  m.hinted=true;save();const item=m.tasks[m.idx];
  const el=document.getElementById('mission-hint');el.hidden=false;el.textContent=t(item.hint);
 }
 function skillSummary(run){
  if(!run.history)return '';
  const skills={};for(const h of run.history){if(!h.skill||typeof h.points!=='number')continue;const k=h.skill;if(!skills[k])skills[k]={n:0,points:0};skills[k].n++;skills[k].points+=h.points||0;}
  return `<div class="skill-list">${Object.entries(skills).map(([skill,v])=>`<div><strong>${E(t('skill_'+skill))}</strong><span>${Math.round(v.points/(v.n*10)*100)}%</span></div>`).join('')}</div>`;
 }
 function renderMissions(){
  const s=db(),m=s.mission;
  let html=title('mission_title','mission_sub')+`<div class="band">${E(t('mission_notice_v11'))}</div>`;
  if(!m){
   html+=`<section class="section"><h2>${E(t('choose_mode'))}</h2><div class="mode-grid">${['learn','practice','challenge'].map(x=>`<div class="card mode-card"><h3>${E(t('mode_'+x))}</h3><p>${E(t('mode_'+x+'_desc'))}</p></div>`).join('')}</div></section>`;
   html+=`<section class="section"><h2>${E(t('select_level'))}</h2><div class="level-grid">${[1,2,3].map(n=>`<div class="card level"><div class="modicon">${n}</div><h3>${E(t('level'+n))}</h3><p>${E(t('level'+n+'_info_v11'))}</p><div class="field"><label>${E(t('choose_mode'))}</label><select class="select" id="mode-${n}">${['learn','practice','challenge'].map(x=>`<option value="${x}">${E(t('mode_'+x))}</option>`).join('')}</select></div><button class="btn primary" data-start="${n}">${E(t('start'))}</button></div>`).join('')}</div></section>`;
   if(s.runs.length){const r=s.runs[0],score=r.score??Math.round((r.firstTry||0)/(r.total||1)*100);
    html+=`<section class="section card"><h2>${E(t('last_result'))}</h2><div class="result-line"><strong>${score}%</strong><span>${E(t('level'+r.level))} · ${E(t('mode_'+(r.mode||'practice')))}</span></div>${skillSummary(r)}</section>`;
   }
  }else if(m.version!==2){
   html+=`<div class="card section"><h2>${E(t('old_run'))}</h2><p>${E(t('old_run_text'))}</p><button class="btn primary" id="discard-old">${E(t('restart_training'))}</button></div>`;
  }else{
   const task=m.tasks[m.idx];
   html+=`<section class="section card mission-card"><div class="row-between"><span class="pill">${E(t('mode_'+m.mode))} · ${E(t('level'+m.level))}</span><strong>${E(t('task'))} ${m.idx+1} / ${m.tasks.length}</strong></div><div class="progress"><div style="width:${Math.round(m.idx/m.tasks.length*100)}%"></div></div>
    <div class="eyebrow">${E(t('skill_'+task.skill))}</div><h2>${E(t(task.prompt))}</h2>
    <div class="case-reference"><strong>${E(task.ref)}</strong>${task.detail?`<div class="case-detail">${E(t('ticket_detail'))}: ${E(task.detail)}</div>`:''}</div>
    <p class="small muted">${E(t('use_other_sections'))} <a href="patients.html">${E(t('patients'))}</a> · <a href="appointments.html">${E(t('appointments'))}</a> · <a href="insurance.html">${E(t('insurance'))}</a></p>
    ${m.waiting?`<div class="band ${m.feedback==='correct'?'':'warning'}" role="status">${E(t('feedback_'+m.feedback))}</div><div class="buttons section"><button id="next-task" class="btn primary">${E(t('next'))} →</button></div>`:
    `<form id="task-form" class="form section">${taskFields(task)}<div id="mission-feedback" role="status"></div><div id="mission-hint" class="band" ${m.hinted?'':'hidden'}>${m.hinted?E(t(task.hint)):''}</div><div class="buttons"><button type="submit" class="btn primary">${E(t('verify'))}</button>${m.mode!=='challenge'?`<button type="button" class="btn secondary" id="hint-task">${E(t('show_hint'))}</button>`:''}<button type="button" class="btn" id="skip-task">${E(t('skip_task'))}</button></div></form>`}
    <p class="small muted">${E(t('run_score'))}: ${m.earned}/${m.possible} · ${E(t('wrong_tries'))}: ${m.wrong}</p>
   </section>`;
  }
  html+=`<p class="footer-note">${E(t('do_not_use_real'))} ${E(t('local_note'))}</p>`;
  document.getElementById('content').innerHTML=html;
  document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>newRun(+b.dataset.start,document.getElementById('mode-'+b.dataset.start).value)));
  document.getElementById('next-task')?.addEventListener('click',advance);
  document.getElementById('hint-task')?.addEventListener('click',takeHint);
  document.getElementById('skip-task')?.addEventListener('click',()=>recordResult(false,true));
  document.getElementById('discard-old')?.addEventListener('click',()=>{db().mission=null;save();renderMissions();});
  document.getElementById('task-form')?.addEventListener('submit',e=>{e.preventDefault();checkAnswer(e.currentTarget);});
 }
 window.JHTSPages.missions=renderMissions;
})();
