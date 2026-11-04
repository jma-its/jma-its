(function(){
 'use strict';
 const {db,t,E,name,ins,fmtStatus,fmtDept,badge,button,field,input,deptOptions,insStatusOptions,deptSelect,save,log,notify,title,modal,isRealDate}=window.JHTS_HELPERS;
 function renderReception(){
  const s=db();
  document.getElementById('content').innerHTML=title('reception_title','reception_sub')+`<div class="band">${E(t('intro_info'))}</div><div class="section toolbar"><div class="field" style="flex:1;max-width:440px"><label>${t('lookup')}</label><input class="input" id="rec-search" placeholder="${E(t('search_appt'))}"></div></div><div id="rec-table"></div>`;
  document.getElementById('rec-search').addEventListener('input',e=>drawReception(e.target.value));drawReception('');
 }
 function drawReception(q){
  const rows=db().appointments.filter(a=>a.status!=='cancelled'&&(a.id+' '+a.patientId+' '+name(a.patientId)).toLowerCase().includes(q.toLowerCase().trim()));
  document.getElementById('rec-table').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr>${['appointment_id','patient_id','name','department','date','time','verification','status','actions'].map(k=>`<th>${E(t(k))}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(a=>`<tr><td class="mono">${E(a.id)}</td><td class="mono">${E(a.patientId)}</td><td>${E(name(a.patientId))}</td><td>${E(fmtDept(a.dept))}</td><td>${E(a.date)}</td><td>${E(a.time)}</td><td>${badge(ins(a.patientId)?.status||'unverified')}</td><td>${badge(a.status)}</td><td>${a.status==='scheduled'?button(t('checkin'),'primary mini','data-checkin="'+E(a.id)+'"'):button(t('arrived'),'mini','disabled')}</td></tr>`).join(''):`<tr><td colspan="9" class="empty">${E(t('no_records'))}</td></tr>`}</tbody></table></div>`;
  document.querySelectorAll('[data-checkin]').forEach(b=>b.addEventListener('click',()=>checkinModal(b.dataset.checkin)));
 }
 function checkinModal(id){
   const a=db().appointments.find(x=>x.id===id);if(!a)return;
   const s=ins(a.patientId);
   const warning=s?.status!=='verified'?`<div class="band warning">${E(t('insurance_attention'))}</div>`:'';
   const html=`<div class="band">${E(a.id)} · ${E(name(a.patientId))} · ${E(fmtDept(a.dept))}<br><span class="small">${E(a.date)} ${E(a.time)}</span></div>${warning}`+field(t('confirm_pid'),input('patientId','','text','required placeholder="P-10001"'));
   modal(t('reception_title'),html,(v,shade)=>{
     if(v.patientId.trim().toUpperCase()!==a.patientId){notify(t('mismatch'));return;}
     if(a.status!=='scheduled'||db().visits.some(x=>x.appointmentId===a.id)){notify(t('already_checked'));return;}
     a.status='arrived';db().visits.push({id:window.JHTSStore.uniqueId('V-',db().visits),appointmentId:a.id,patientId:a.patientId,date:a.date,insuranceFollowUp:s?.status!=='verified'});
     log('reception_checkin',a.id+' '+a.patientId);shade.remove();drawReception(document.getElementById('rec-search').value);notify(t('done_checkin'));
   });
 }
 window.JHTSPages.reception=renderReception;
})();
