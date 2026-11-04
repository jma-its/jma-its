(function(){
 'use strict';
 const PAGES=[['index.html','overview','▦'],['academy.html','academy','🎓'],['patients.html','patients','♙'],['appointments.html','appointments','▦'],['insurance.html','insurance','⬡'],['reception.html','reception','✚'],['missions.html','missions','◎'],['hospital-day.html','hospital_day','▣'],['lab-orders.html','lab_orders','◈'],['lab-results.html','lab_results','⚗'],['billing.html','billing','¥'],['payments.html','payments','▤'],['billing-practice.html','billing_practice','◎'],['reports.html','reports','⇩']];
 const page=document.body.dataset.page||'overview';
 let lang=localStorage.getItem('JHTS_LANG')==='ja'?'ja':'en';
 const db=()=>window.JHTSStore.get();
 const t=(key)=>window.JHTS_I18N[lang][key]||window.JHTS_I18N.en[key]||key;
 const E=(v)=>String(v==null?'':v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const name=(id)=>db().patients.find(p=>p.id===id)?.name||'—';
 const ins=(id)=>db().insurance.find(x=>x.patientId===id);
 const fmtStatus=(s)=>({scheduled:t('scheduled'),arrived:t('arrived'),cancelled:t('cancelled'),verified:t('insured_verified'),needs_review:t('insured_review'),expired:t('insured_expired'),unverified:t('insured_unverified')}[s]||s);
 const fmtDept=(d)=>t('dept_'+d);
 const badge=(s)=>`<span class="pill ${E(s)}">${E(fmtStatus(s))}</span>`;
 const button=(label,cls='',attrs='')=>`<button type="button" class="btn ${cls}" ${attrs}>${E(label)}</button>`;
 const field=(label,input)=>`<div class="field"><label>${E(label)}</label>${input}</div>`;
 const input=(name,val='',type='text',extra='')=>`<input class="input" type="${E(type)}" name="${E(name)}" value="${E(val)}" ${extra}>`;
 const deptOptions=(sel)=>['internal','orthopedics','dermatology','pediatrics','ophthalmology','ent'].map(k=>`<option value="${k}" ${k===sel?'selected':''}>${E(fmtDept(k))}</option>`).join('');
 const insStatusOptions=(sel)=>['verified','needs_review','expired','unverified'].map(k=>`<option value="${k}" ${k===sel?'selected':''}>${E(fmtStatus(k))}</option>`).join('');
 const deptSelect=(sel)=>`<select class="select" name="dept">${deptOptions(sel)}</select>`;
 const save=()=>window.JHTSStore.save();
 const log=(act,details)=>window.JHTSStore.log(act,details);
 function notify(msg){document.querySelector('.toast')?.remove();let el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3800);}
 function renderFrame(){
  document.documentElement.lang=lang; document.title=t('app')+' — '+t(page);
  document.getElementById('app').innerHTML=`<div class="shell"><aside class="side"><div class="logo"><div class="logo-icon">✚</div><div><div class="brand">${t('brand')}</div><div class="tagline">${E(t('tagline'))}</div></div></div><nav class="nav" aria-label="Main navigation">${PAGES.map(([file,key,ic])=>`<a href="${file}" class="${page===key?'active':''}"><span class="ico" aria-hidden="true">${ic}</span><span>${E(t(key))}</span></a>`).join('')}</nav><div class="side-footer">${E(t('demo'))}<br>${E(t('do_not_use_real'))}</div></aside><div class="main"><header class="topbar"><div class="crumb">${E(t(page))}</div><div class="lang" aria-label="Language"><button type="button" data-lang="en" class="${lang==='en'?'on':''}" aria-pressed="${lang==='en'}">English</button><button type="button" data-lang="ja" class="${lang==='ja'?'on':''}" aria-pressed="${lang==='ja'}">日本語</button></div></header><main class="content" id="content"></main></div></div>`;
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{lang=b.dataset.lang;localStorage.setItem('JHTS_LANG',lang);renderFrame();render();window.JHTSAcademy?.observe('switch_language',{lang});window.JHTSAcademy?.updateUI();}));
 }
 function title(head,sub){return `<div class="eyebrow">${E(t('practice_for'))}</div><h1 class="h1">${E(t(head))}</h1><p class="lead">${E(t(sub))}</p>`;}
 function render(){
  const fn=window.JHTSPages[page];
  fn();
  if(window.JHTSDay)window.JHTSDay.decorate();
  if(window.JHTSAcademy)window.JHTSAcademy.pageReady(page);
 }
 function modal(title,form,submit){
   document.querySelector('.modal-shade')?.remove();
   const shade=document.createElement('div');shade.className='modal-shade';shade.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><h2>${E(title)}</h2><form class="form" id="modal-form">${form}<div class="form-actions">${button(t('cancel'),'','data-close="1"')}<button class="btn primary" type="submit">${E(t('save_record'))}</button></div></form></div>`;
   document.body.appendChild(shade);
   shade.querySelector('[data-close]').addEventListener('click',()=>shade.remove());
   shade.addEventListener('click',e=>{if(e.target===shade)shade.remove();});
   const esc=e=>{if(e.key==='Escape'){shade.remove();document.removeEventListener('keydown',esc);}}; document.addEventListener('keydown',esc,{once:true});
   shade.querySelector('form').addEventListener('submit',e=>{e.preventDefault();submit(Object.fromEntries(new FormData(e.currentTarget).entries()),shade);});
   shade.querySelector('input,select')?.focus();
 }
 function isRealDate(x){if(!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;const d=new Date(x+'T12:00:00');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===x;}

 window.JHTSPages={};
 window.JHTS_HELPERS={db,t,E,name,ins,fmtStatus,fmtDept,badge,button,field,input,deptOptions,insStatusOptions,deptSelect,save,log,notify,title,modal,isRealDate};
 document.addEventListener('DOMContentLoaded',()=>{renderFrame();render();});
})();
