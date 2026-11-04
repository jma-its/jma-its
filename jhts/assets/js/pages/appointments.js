(function(){
 'use strict';
 const {db,t,E,name,ins,fmtStatus,fmtDept,badge,button,field,input,deptOptions,insStatusOptions,deptSelect,save,log,notify,title,modal,isRealDate}=window.JHTS_HELPERS;
 function renderAppointments(){
  document.getElementById('content').innerHTML=title('appt_list','appt_sub')+`<div class="toolbar"><div class="field" style="flex:1;max-width:420px"><label>${t('find')}</label><input class="input" id="appt-search" placeholder="${E(t('search_appt'))}"></div>${button('＋ '+t('add_appt'),'primary','id="add-appt"')}</div><div id="appt-table"></div><p class="footer-note">${E(t('intro_info'))}</p>`;
  document.getElementById('appt-search').addEventListener('input',e=>{drawAppts(e.target.value);window.JHTSAcademy?.observe('appointment_search',{query:e.target.value.trim()});});
  document.getElementById('add-appt').addEventListener('click',()=>apptModal());drawAppts('');
 }
 function drawAppts(q){
  let rows=db().appointments.filter(a=>(a.id+' '+a.patientId+' '+name(a.patientId)+' '+fmtDept(a.dept)).toLowerCase().includes(q.trim().toLowerCase()));
  document.getElementById('appt-table').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr>${['appointment_id','patient_id','name','date','time','department','status','actions'].map(k=>`<th>${E(t(k))}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(a=>`<tr><td class="mono">${E(a.id)}</td><td class="mono">${E(a.patientId)}</td><td>${E(name(a.patientId))}</td><td>${E(a.date)}</td><td>${E(a.time)}</td><td>${E(fmtDept(a.dept))}</td><td>${badge(a.status)}</td><td>${button(t('inspect'),'mini secondary','data-view-a="'+E(a.id)+'"')} ${button(t('edit'),'mini','data-edit-a="'+E(a.id)+'"')}</td></tr>`).join(''):`<tr><td colspan="8" class="empty">${E(t('no_records'))}</td></tr>`}</tbody></table></div>`;
  document.querySelectorAll('[data-edit-a]').forEach(b=>b.addEventListener('click',()=>apptModal(b.dataset.editA)));
  document.querySelectorAll('[data-view-a]').forEach(b=>b.addEventListener('click',()=>showAppointmentDetails(b.dataset.viewA)));
 }
 function showAppointmentDetails(id){
   const a=db().appointments.find(x=>x.id===id);if(!a)return;
   document.getElementById('appointment-inspect-panel')?.remove();
   const p=db().patients.find(x=>x.id===a.patientId);
   const panel=document.createElement('div');panel.id='appointment-inspect-panel';panel.className='card academy-inspect';
   const cells=[[t('appointment_id'),a.id],[t('patient_id'),a.patientId],[t('name'),p?.name||'—'],[t('dob'),p?.dob||'—'],[t('date'),a.date],[t('time'),a.time],[t('department'),fmtDept(a.dept)],[t('status'),fmtStatus(a.status)]];
   panel.innerHTML=`<div class="row-between"><h2>${E(t('aca_app_details'))}</h2><button type="button" class="btn mini" id="appointment-close">${E(t('close'))}</button></div><div class="academy-detail-grid">${cells.map(([k,v])=>`<div><small>${E(k)}</small><strong>${E(v)}</strong></div>`).join('')}</div><div class="buttons section"><button type="button" class="btn primary" id="appointment-confirm">${E(t('aca_confirm_appointment'))}</button><button type="button" class="btn secondary" id="appointment-review">${E(t('aca_appointment_review'))}</button></div><p class="small muted">${E(t('aca_app_check_note'))}</p>`;
   document.getElementById('appt-table').before(panel);
   panel.querySelector('#appointment-close').addEventListener('click',()=>panel.remove());
   panel.querySelector('#appointment-confirm').addEventListener('click',()=>window.JHTSAcademy?.observe('appointment_decision',{id:a.id,decision:'confirm'}));
   panel.querySelector('#appointment-review').addEventListener('click',()=>window.JHTSAcademy?.observe('appointment_decision',{id:a.id,decision:'review'}));
   panel.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function apptModal(id){
  const a=db().appointments.find(x=>x.id===id),creating=!a;if(a?.status==='arrived'){notify(t('already_checked'));return;}
  const opts=db().patients.map(p=>`<option value="${E(p.id)}" ${p.id===a?.patientId?'selected':''}>${E(p.id)} · ${E(p.name)}</option>`).join('');
  const statuses=['scheduled','cancelled',...(a?.status==='arrived'?['arrived']:[])].map(s=>`<option value="${s}" ${a?.status===s?'selected':''}>${E(fmtStatus(s))}</option>`).join('');
  const html=field(t('patient_id'),`<select class="select" name="patientId">${opts}</select>`)+field(t('date'),input('date',a?.date||window.JHTS_DEMO_DATE(0),'date','required'))+field(t('time'),input('time',a?.time||'09:00','time','required'))+field(t('department'),deptSelect(a?.dept||'internal'))+field(t('status'),`<select class="select" name="status">${statuses}</select>`);
  modal(t(creating?'add_appt':'edit_appt'),html,(v,shade)=>{
   if(!db().patients.some(x=>x.id===v.patientId)){notify(t('missing_patient'));return;}
   if(!isRealDate(v.date)||!/^\d\d:\d\d$/.test(v.time)){notify(t('invalid_date'));return;}
   if(v.status!=='cancelled'&&db().appointments.some(x=>x.id!==id&&x.patientId===v.patientId&&x.date===v.date&&x.time===v.time&&x.status!=='cancelled')){notify(t('appt_collision'));return;}
   if(creating){let record={id:window.JHTSStore.uniqueId('A-',db().appointments),...v};db().appointments.push(record);id=record.id;}
   else Object.assign(a,v);
   log(creating?'create_appointment':'edit_appointment',id);shade.remove();notify(t('saved_ok'));drawAppts(document.getElementById('appt-search').value);
  });
 }
 window.JHTSPages.appointments=renderAppointments;
})();
