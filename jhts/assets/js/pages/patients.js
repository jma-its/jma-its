(function(){
 'use strict';
 const {db,t,E,name,ins,fmtStatus,fmtDept,badge,button,field,input,deptOptions,insStatusOptions,deptSelect,save,log,notify,title,modal,isRealDate}=window.JHTS_HELPERS;
 function renderPatients(){
  document.getElementById('content').innerHTML=title('patient_list','patient_sub')+`<div class="toolbar"><div class="field" style="flex:1;max-width:440px"><label>${t('find')}</label><input id="patient-search" class="input" placeholder="${E(t('search_placeholder'))}" autocomplete="off"></div>${button('＋ '+t('add_patient'),'primary','id="add-patient"')}</div><div id="patient-table"></div><p class="footer-note">${E(t('edit_tip'))}</p>`;
  const search=document.getElementById('patient-search');search.addEventListener('input',()=>{drawPatients(search.value);window.JHTSAcademy?.observe('patient_search',{query:search.value.trim()});});
  document.getElementById('add-patient').addEventListener('click',()=>patientModal());drawPatients('');
 }
 function drawPatients(q){
  const rows=db().patients.filter(p=>(p.name+' '+p.id+' '+p.city).toLowerCase().includes(q.trim().toLowerCase()));
  document.getElementById('patient-table').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr>${['patient_id','name','dob','city','actions'].map(k=>`<th>${E(t(k))}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(p=>`<tr><td class="mono">${E(p.id)}</td><td>${E(p.name)}</td><td>${E(p.dob)}</td><td>${E(p.city)}</td><td>${button(t('inspect'),'mini secondary','data-view-p="'+E(p.id)+'"')} ${button(t('edit'),'mini','data-edit-p="'+E(p.id)+'"')}</td></tr>`).join(''):`<tr><td colspan="5" class="empty">${E(t('no_records'))}</td></tr>`}</tbody></table></div>`;
  document.querySelectorAll('[data-edit-p]').forEach(b=>b.addEventListener('click',()=>patientModal(b.dataset.editP)));
  document.querySelectorAll('[data-view-p]').forEach(b=>b.addEventListener('click',()=>showPatientDetails(b.dataset.viewP)));
 }
 function showPatientDetails(id){
  const p=db().patients.find(x=>x.id===id);if(!p)return;
  const old=document.getElementById('patient-inspect-panel');old?.remove();
  const panel=document.createElement('div');panel.className='card academy-inspect';panel.id='patient-inspect-panel';
  panel.innerHTML=`<div class="row-between"><h2>${E(t('patient_details'))}</h2><button type="button" class="btn mini" id="patient-close">${E(t('close'))}</button></div><div class="academy-detail-grid"><div><small>${E(t('patient_id'))}</small><strong>${E(p.id)}</strong></div><div><small>${E(t('name'))}</small><strong>${E(p.name)}</strong></div><div><small>${E(t('dob'))}</small><strong>${E(p.dob)}</strong></div><div><small>${E(t('city'))}</small><strong>${E(p.city)}</strong></div></div><div class="buttons section"><button type="button" class="btn primary" id="patient-confirm">${E(t('academy_confirm_patient'))}</button></div><p class="small muted">${E(t('academy_confirm_explain'))}</p>`;
  document.getElementById('patient-table').before(panel);
  document.getElementById('patient-close').addEventListener('click',()=>panel.remove());
  document.getElementById('patient-confirm').addEventListener('click',()=>window.JHTSAcademy?.observe('patient_confirm',{id:p.id}));
  panel.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function patientModal(id){
  const p=db().patients.find(x=>x.id===id),creating=!p;
  const html=field(t('patient_id'),input('id',p?.id||window.JHTSStore.uniqueId('P-',db().patients),'text',p?'readonly':'required'))+field(t('name'),input('name',p?.name||'','text','required maxlength="70"'))+field(t('dob'),input('dob',p?.dob||'','date','required'))+field(t('city'),input('city',p?.city||'','text','required maxlength="60"'));
  modal(t(creating?'add_patient':'edit_patient'),html,(v,shade)=>{
    if(!v.id.trim()||!v.name.trim()||!v.city.trim()){notify(t('required'));return;}
    if(!isRealDate(v.dob)){notify(t('invalid_dob'));return;}
    if(creating&&db().patients.some(x=>x.id===v.id.trim())){notify(t('invalid_id'));return;}
    if(creating){db().patients.push({id:v.id.trim(),name:v.name.trim(),dob:v.dob,city:v.city.trim()});db().insurance.push({id:window.JHTSStore.uniqueId('INS-',db().insurance),patientId:v.id.trim(),document:'certificate',status:'unverified',checkedOn:'',trainingRate:30});}
    else Object.assign(p,{name:v.name.trim(),dob:v.dob,city:v.city.trim()});
    log(creating?'create_patient':'edit_patient',v.id);shade.remove();notify(t('saved_ok'));drawPatients(document.getElementById('patient-search').value);
  });
 }
 window.JHTSPages.patients=renderPatients;
})();
