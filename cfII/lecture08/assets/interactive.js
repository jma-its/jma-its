
document.addEventListener('DOMContentLoaded',()=>{
 const lang=document.documentElement.lang==='ja'?'ja':'en';
 const T={
 en:{opened:(o,t)=>`Answers opened: ${o} / ${t}`,safe:'SAFE',risky:'RISKY',
 chainOk:'Correct chain: User action → Windows → Driver → Hardware → Result.',chainBad:'Not yet. The driver sits between Windows and hardware.',
 category:{wifi:'Network adapters',sound:'Sound devices',display:'Display adapters',camera:'Cameras',usb:'USB controllers / HID'},
 categoryOk:'Correct category for the symptom.',categoryBad:'Try another category. Match the symptom to the hardware area.',
 status:{normal:'Normal: record the device name and status if needed.',warning:'Yellow warning: read Device status and screenshot it.',unknown:'Unknown device: Windows sees something but cannot identify it. Do not guess a driver.',disabled:'Disabled: Windows knows the device, but it is turned off in Windows. Read status before action.'},
 safetyOk:'All classifications are correct.',safetyBad:'Some actions are misclassified. Observation is safe; changing drivers is risky.',
 update:{afterupdate:'Possible rollback case, but only with permission or expert guidance.',newdevice:'May need a manufacturer driver, but identify the device and follow official source/policy.',random:'Do not update randomly. Newest is not always safest.',observe:'Observation practice means read, screenshot, and report only.'},
 case:{wifi:'Category: Network adapters. Report adapter name, status, warning icon, and whether one or many PCs are affected.',display:'Category: Display adapters. Look for basic display driver, warning icon, adapter name, and recent Windows install/update.',camera:'Category: Cameras. Check visibility, warning icon, app permission, and screenshot before changing anything.',usb:'Category: USB controllers / HID. Check cable/port first, then status. Do not uninstall USB controllers in class.'},
 score:(n,t)=>`Final score: ${n} / ${t}. ${n>=13?'Excellent.':n>=10?'Good. Review highlighted questions.':'Review the safe observation rules and try again.'}`},
 ja:{opened:(o,t)=>`開いた答え: ${o} / ${t}`,safe:'安全',risky:'危険',
 chainOk:'正しいチェーン：User action → Windows → Driver → Hardware → Result。',chainBad:'まだ違います。ドライバーはWindowsとハードウェアの間にあります。',
 category:{wifi:'Network adapters',sound:'Sound devices',display:'Display adapters',camera:'Cameras',usb:'USB controllers / HID'},
 categoryOk:'症状に合うカテゴリです。',categoryBad:'別のカテゴリを試してください。症状をハードウェア領域に対応させます。',
 status:{normal:'正常：必要ならデバイス名と状態を記録します。',warning:'黄色警告：Device statusを読み、スクリーンショットを取ります。',unknown:'Unknown device：Windowsは何かを検出しましたが識別できません。推測でドライバーを入れません。',disabled:'Disabled：Windowsは知っていますが、Windows内で無効です。行動前に状態を読みます。'},
 safetyOk:'すべて正しく分類できました。',safetyBad:'まだ誤りがあります。観察は安全、ドライバー変更は危険です。',
 update:{afterupdate:'ロールバック候補ですが、許可または専門家の指示がある時だけです。',newdevice:'メーカー専用ドライバーが必要な場合があります。公式情報と方針に従います。',random:'理由なく更新しません。最新版が常に安全とは限りません。',observe:'観察練習では読む、スクリーンショット、報告だけです。'},
 case:{wifi:'カテゴリ：Network adapters。アダプタ名、状態、警告、1台か多数かを報告します。',display:'カテゴリ：Display adapters。基本表示ドライバー、警告、アダプタ名、最近のインストール／更新を確認します。',camera:'カテゴリ：Cameras。表示、警告、アプリ権限を確認し、変更前にスクリーンショットを取ります。',usb:'カテゴリ：USB controllers / HID。まずケーブルとポートを確認し、その後状態を見ます。授業ではUSB controllerを削除しません。'},
 score:(n,t)=>`最終スコア: ${n} / ${t}。${n>=13?'とても良いです。':n>=10?'良いです。色付き問題を復習してください。':'安全な観察ルールを復習して再挑戦してください。'}`}
 }[lang];

 const details=[...document.querySelectorAll('details[data-checkpoint]')],fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
 function progress(){const o=details.filter(d=>d.open).length;if(fill)fill.style.width=(o/details.length*100)+'%';if(label)label.textContent=T.opened(o,details.length)}
 details.forEach(d=>d.addEventListener('toggle',progress));progress();

 const modal=document.getElementById('slide-modal');if(modal){const img=modal.querySelector('img');document.querySelectorAll('.image-button').forEach(b=>b.onclick=()=>{img.src=b.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden'});const close=()=>{modal.classList.remove('open');img.src='';document.body.style.overflow=''};modal.querySelector('button').onclick=close;modal.onclick=e=>{if(e.target===modal)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}

 const order=['user','windows','driver','hardware','result'];document.querySelectorAll('.chain-step').forEach((b,i)=>{b.dataset.pos=i;b.onclick=()=>{b.classList.toggle('active')}});document.getElementById('check-chain')?.addEventListener('click',()=>{const chosen=[...document.querySelectorAll('.chain-step.active')].map(b=>b.dataset.key);const ok=chosen.join(',')===order.join(',');const f=document.getElementById('chain-feedback');f.className='feedback '+(ok?'ok':'bad');f.textContent=ok?T.chainOk:T.chainBad});

 const catCase=document.getElementById('category-case'),catFb=document.getElementById('category-feedback');document.querySelectorAll('#category-choices button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#category-choices button').forEach(x=>x.classList.remove('active'));b.classList.add('active');const ok=b.dataset.choice===T.category[catCase.value];catFb.className='feedback '+(ok?'ok':'bad');catFb.textContent=ok?T.categoryOk:T.categoryBad});catCase?.addEventListener('change',()=>{document.querySelectorAll('#category-choices button').forEach(x=>x.classList.remove('active'));catFb.textContent=''});

 const statusInfo=document.getElementById('status-info');document.querySelectorAll('.status-card').forEach(b=>b.onclick=()=>{document.querySelectorAll('.status-card').forEach(x=>x.classList.remove('normal','warning','unknown','disabled'));b.classList.add(b.dataset.kind);statusInfo.textContent=T.status[b.dataset.kind]});document.querySelector('.status-card')?.click();

 document.querySelectorAll('.safety-card').forEach(c=>c.onclick=()=>{const n=c.dataset.choice==='safe'?'risky':c.dataset.choice==='risky'?'':'safe';c.dataset.choice=n;c.classList.remove('safe','risky');if(n)c.classList.add(n);c.querySelector('strong').textContent=n?(n==='safe'?T.safe:T.risky):''});document.getElementById('check-safety')?.addEventListener('click',()=>{const ok=[...document.querySelectorAll('.safety-card')].every(c=>c.dataset.choice===c.dataset.answer),f=document.getElementById('safety-feedback');f.className='feedback '+(ok?'ok':'bad');f.textContent=ok?T.safetyOk:T.safetyBad});

 const uc=document.getElementById('update-case'),uf=document.getElementById('update-feedback');function up(){uf.className='feedback ok';uf.textContent=T.update[uc.value]}uc?.addEventListener('change',up);up();

 document.getElementById('build-report')?.addEventListener('click',()=>{const d=document.getElementById('report-device').value,s=document.getElementById('report-status').value,c=document.getElementById('report-change').value;document.getElementById('report-output').textContent=`Device: ${d}\nSymptom: device or feature does not work correctly.\nDevice Manager status: ${s}\nWhat changed: ${c}\nChecked: category opened, device name/status read, screenshot taken.\nNeed help: Please check driver or hardware safely.`});

 const caseInfo=document.getElementById('case-info');document.querySelectorAll('.case-card').forEach(b=>b.onclick=()=>{document.querySelectorAll('.case-card').forEach(x=>x.classList.remove('active'));b.classList.add('active');caseInfo.textContent=T.case[b.dataset.case]});document.querySelector('.case-card')?.click();

 const quiz=document.getElementById('final-quiz');if(quiz){const cards=[...quiz.querySelectorAll('.quiz-card')],score=document.getElementById('quiz-score');document.getElementById('check-quiz').onclick=()=>{let n=0;cards.forEach(c=>{c.classList.remove('correct','wrong');const s=c.querySelector('input:checked');if(s&&s.value===c.dataset.answer){n++;c.classList.add('correct')}else c.classList.add('wrong')});score.style.display='block';score.textContent=T.score(n,cards.length)};document.getElementById('reset-quiz').onclick=()=>{quiz.reset();cards.forEach(c=>c.classList.remove('correct','wrong'));score.style.display='none'}}
});
