(function(){
'use strict';
const D=window.JHTSDay, {db,t,E,fmtDept,save,notify,title}=window.JHTS_HELPERS;
function renderDay(){
 const d=D.active(),s=db();
 let html=title('hd_title','hd_sub')+`<div class="band">${E(t('hd_privacy_notice'))}</div>`;
 if(!d){
  html+=`<section class="section"><div class="grid"><div class="card"><h2>${E(t('hd_how_title'))}</h2><p>${E(t('hd_how_1'))}</p><p>${E(t('hd_how_2'))}</p><p>${E(t('hd_how_3'))}</p></div><div class="card"><h2>${E(t('hd_choose'))}</h2><div class="field"><label>${E(t('choose_mode'))}</label><select class="select" id="hd-mode"><option value="learn">${E(t('mode_learn'))}</option><option value="practice" selected>${E(t('mode_practice'))}</option><option value="challenge">${E(t('mode_challenge'))}</option></select></div><div class="field"><label>${E(t('hd_patients_count'))}</label><select class="select" id="hd-count"><option value="5">5 · ${E(t('hd_basic'))}</option><option value="10" selected>10 · ${E(t('hd_standard'))}</option><option value="12">12 · ${E(t('hd_full'))}</option></select></div><button class="btn primary" id="hd-start">${E(t('hd_start_shift'))}</button></div></div></section>`;
  if(s.dayRuns?.length){const r=s.dayRuns[0];html+=`<section class="section card"><h2>${E(t('hd_previous'))}</h2><div class="result-line"><strong>${r.score}%</strong><span>${E(t('mode_'+r.mode))} · ${r.total} ${E(t('hd_patients_count'))} · ${r.critical} ${E(t('hd_critical'))}</span></div><div class="skill-list">${Object.entries(D.summarySkills(r)).map(([k,v])=>`<div><strong>${E(t('hd_stage_'+k))}</strong><span>${v.percent}%</span></div>`).join('')}</div></section>`;}
 } else {
  const c=D.current(),stage=D.stageNow(),progress=d.cases.filter(x=>x.result).length;
  const points=d.cases.reduce((a,x)=>a+D.scoreCase(x),0),wrong=d.events.filter(x=>!x.correct).length,critical=d.events.filter(x=>x.critical).length;
  html+=`<section class="section card"><div class="row-between"><div><div class="eyebrow">${E(t('hd_active_shift'))} · ${E(t('mode_'+d.mode))}</div><h2>${E(t('hd_patient'))} ${d.idx+1} / ${d.total}</h2></div><div class="small muted">${progress}/${d.total} ${E(t('completed'))}</div></div><div class="progress"><div style="width:${Math.round(progress/d.total*100)}%"></div></div><div class="grid" style="margin-top:16px"><div class="stat"><strong>${points}</strong><small>${E(t('hd_points'))}</small></div><div class="stat"><strong>${wrong}</strong><small>${E(t('wrong_tries'))}</small></div><div class="stat"><strong>${critical}</strong><small>${E(t('hd_critical'))}</small></div></div></section>`;
  html+=`<section class="section card"><div class="eyebrow">${E(t('hd_arrival_ticket'))} · ${E(c.id)}</div><div class="hd-ticket-large"><div><small>${E(t('patient_id'))}</small><strong>${E(c.ticketPatientId)}</strong></div><div><small>${E(t('name'))}</small><strong>${E(c.claimedName)}</strong></div><div><small>${E(t('dob'))}</small><strong>${E(c.claimedDob)}</strong></div><div><small>${E(t('appointment_id'))}</small><strong>${E(c.apptId)}</strong></div><div><small>${E(t('date'))} / ${E(t('time'))}</small><strong>${E(c.ticketDate)} ${E(c.ticketTime)}</strong></div><div><small>${E(t('department'))}</small><strong>${E(fmtDept(c.ticketDept))}</strong></div></div><p class="small muted">${E(t('hd_ticket_explain'))}</p></section>`;
  const rows=[['identity','patients.html'],['appointment','appointments.html'],['insurance','insurance.html'],['decision','reception.html']];
  html+=`<section class="section card"><h2>${E(t('hd_required_steps'))}</h2><div class="hd-steps">${rows.map(([key,url],i)=>{const z=c.steps[i],on=stage===key,disabled=!on;return `<div class="hd-step ${z.done?'finished':''} ${on?'current':''}"><span class="hd-step-num">${z.done?'✓':i+1}</span><span><strong>${E(t('hd_stage_'+key))}</strong><br><small>${z.done?E(t('completed'))+' · '+z.points+'/'+D.weights[key]+' '+E(t('hd_points')):on?E(t('hd_step_ready')):E(t('hd_step_later'))}</small></span><span>${on?`<a class="btn primary mini" href="${url}">${E(t('hd_open_section'))}</a>`:''}</span></div>`;}).join('')}</div>${!stage?`<div class="band">${E(t('hd_case_done'))} · ${D.scoreCase(c)}/100 ${E(t('hd_points'))}</div><div class="buttons section"><button id="hd-next" class="btn primary">${E(d.idx===d.total-1?t('hd_finish_shift'):t('hd_next_patient'))}</button></div>`:''}</section>`;
  html+=`<section class="section"><button class="btn danger" id="hd-abort">${E(t('hd_abort_shift'))}</button></section>`;
 }
 html+=`<p class="footer-note">${E(t('do_not_use_real'))} · ${E(t('local_note'))}</p>`;
 document.getElementById('content').innerHTML=html;
 document.getElementById('hd-start')?.addEventListener('click',()=>{try{D.start(document.getElementById('hd-mode').value,+document.getElementById('hd-count').value);renderDay();}catch(e){notify(e.message);}});
 document.getElementById('hd-next')?.addEventListener('click',()=>{D.nextCase();renderDay();});
 document.getElementById('hd-abort')?.addEventListener('click',()=>{if(confirm(t('hd_confirm_abort'))){D.abort();renderDay();}});
}
window.JHTSPages.hospital_day=renderDay;
})();
