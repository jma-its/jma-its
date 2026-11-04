(function(){
 'use strict';
 const {db,t,E,name,ins,fmtStatus,fmtDept,badge,button,field,input,deptOptions,insStatusOptions,deptSelect,save,log,notify,title,modal,isRealDate}=window.JHTS_HELPERS;
 function renderInsurance(){
  document.getElementById('content').innerHTML=title('insurance_title','insurance_sub')+`<div class="band warning">${E(t('insurance_note'))} ${E(t('not_real_check'))}</div><div class="section toolbar"><div class="field" style="flex:1;max-width:440px"><label>${t('find')}</label><input class="input" id="ins-search" placeholder="${E(t('search_placeholder'))}"></div></div><div id="insurance-table"></div>`;
  document.getElementById('ins-search').addEventListener('input',e=>drawInsurance(e.target.value));drawInsurance('');
 }
 function drawInsurance(q){
  let rows=db().insurance.filter(i=>(i.patientId+' '+name(i.patientId)).toLowerCase().includes(q.toLowerCase().trim()));
  document.getElementById('insurance-table').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr>${['patient_id','name','document','verification','checked_on','billing_rate','actions'].map(k=>`<th>${E(t(k))}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(i=>`<tr><td class="mono">${E(i.patientId)}</td><td>${E(name(i.patientId))}</td><td>${E(t(i.document))}</td><td>${badge(i.status)}</td><td>${E(i.checkedOn||'—')}</td><td>${i.trainingRate}%</td><td>${button(t('set_status'),'mini','data-edit-ins="'+E(i.patientId)+'"')}</td></tr>`).join(''):`<tr><td class="empty" colspan="7">${E(t('no_records'))}</td></tr>`}</tbody></table></div>`;
  document.querySelectorAll('[data-edit-ins]').forEach(b=>b.addEventListener('click',()=>insuranceModal(b.dataset.editIns)));
 }
 function insuranceModal(patientId){
   const i=ins(patientId);if(!i)return;
   const html=`<div class="band">${E(patientId)} · ${E(name(patientId))}</div>`+field(t('document'),`<select class="select" name="document"><option value="myna" ${i.document==='myna'?'selected':''}>${E(t('myna'))}</option><option value="certificate" ${i.document==='certificate'?'selected':''}>${E(t('certificate'))}</option></select>`)+field(t('verification'),`<select class="select" name="status">${insStatusOptions(i.status)}</select>`)+field(t('billing_rate'),`<select class="select" name="trainingRate">${[10,20,30].map(n=>`<option value="${n}" ${n===i.trainingRate?'selected':''}>${n}%</option>`).join('')}</select>`);
   modal(t('set_status'),html,(v,shade)=>{i.document=v.document;i.status=v.status;i.trainingRate=Number(v.trainingRate);i.checkedOn=new Date().toLocaleDateString('sv-SE');log('insurance_training_flag',patientId+':'+v.status);shade.remove();drawInsurance(document.getElementById('ins-search').value);notify(t('insurance_checked'));});
 }
 window.JHTSPages.insurance=renderInsurance;
})();
