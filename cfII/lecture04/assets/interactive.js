
document.addEventListener('DOMContentLoaded',()=>{
 const lang=document.documentElement.lang==='ja'?'ja':'en';
 const cards=[...document.querySelectorAll('.slide-card')],fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
 function progress(){let seen=0;cards.forEach(c=>{if(c.getBoundingClientRect().top<innerHeight*.72)seen++;});if(fill)fill.style.width=(seen/cards.length*100)+'%';if(label)label.textContent=lang==='ja'?`${seen} / ${cards.length} スライド`:`${seen} / ${cards.length} slides`;}
 addEventListener('scroll',progress,{passive:true});progress();
 const modal=document.getElementById('image-modal'),img=document.getElementById('modal-image');
 document.querySelectorAll('.image-button').forEach(b=>b.onclick=()=>{img.src=b.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden';});
 function close(){modal.classList.remove('open');img.src='';document.body.style.overflow='';}
 document.getElementById('modal-close')?.addEventListener('click',close);modal?.addEventListener('click',e=>{if(e.target===modal)close()});addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.querySelectorAll('.classify-card').forEach(b=>b.onclick=()=>{b.classList.remove('input','output','both');b.classList.add(b.dataset.type);});
 const tabBtns=[...document.querySelectorAll('.device-tabs button')],panel=document.getElementById('device-panel');
 const data={
  monitor:['Output','Shows text, images, and video.','出力','文字、画像、動画を表示します。'],
  keyboard:['Input','Sends typed data to the computer.','入力','入力した文字や数字を送ります。'],
  printer:['Output','Creates paper documents and labels.','出力','文書やラベルを紙に出します。'],
  scanner:['Input','Changes paper into a digital image.','入力','紙をデジタル画像にします。'],
  barcode:['Input','Reads a machine-readable code.','入力','機械可読コードを読み取ります。'],
  touchscreen:['Input and output','Shows information and detects touch.','入力と出力','情報を表示し、タッチを検出します。']
 };
 tabBtns.forEach(b=>b.onclick=()=>{tabBtns.forEach(x=>x.classList.remove('active'));b.classList.add('active');const d=data[b.dataset.device];panel.innerHTML=lang==='ja'?`<h3>${d[2]}</h3><p>${d[3]}</p>`:`<h3>${d[0]}</h3><p>${d[1]}</p>`;});
 tabBtns[0]?.click();
 const sel=document.getElementById('problem-select'),tr=document.getElementById('trouble-result');
 const checks={
  monitor:['Check power, video cable, input source, and another monitor.','電源、映像ケーブル、入力切替、別モニターを確認します。'],
  keyboard:['Check USB cable, another port, stuck keys, and liquid damage.','USB、別ポート、キー詰まり、液体損傷を確認します。'],
  mouse:['Check cable or battery, receiver, sensor, and surface.','ケーブル／電池、受信機、センサー、使用面を確認します。'],
  printer:['Check paper, jam, toner or ink, selected printer, and connection.','用紙、紙詰まり、トナー／インク、選択プリンター、接続を確認します。'],
  scanner:['Check power, USB, document position, glass, and software.','電源、USB、原稿位置、ガラス、ソフトウェアを確認します。'],
  barcode:['Check code condition, reader light, USB, and active input field.','コード状態、読み取り光、USB、入力欄を確認します。'],
  network:['Check one device or many, cable/Wi-Fi, switch/router, and server.','1台か複数台か、ケーブル／Wi-Fi、スイッチ／ルーター、サーバーを確認します。']
 };
 function updateTrouble(){if(tr&&sel){const d=checks[sel.value];tr.textContent=lang==='ja'?d[1]:d[0];}}sel?.addEventListener('change',updateTrouble);updateTrouble();
 const quiz=document.getElementById('quiz-form');if(quiz){const q=[...quiz.querySelectorAll('.quiz-card')],r=document.getElementById('quiz-result');quiz.querySelector('[data-action="check"]').onclick=()=>{let s=0;q.forEach(c=>{c.classList.remove('correct','wrong');const x=c.querySelector('input:checked');if(x&&Number(x.value)===Number(c.dataset.answer)){s++;c.classList.add('correct')}else c.classList.add('wrong')});r.style.display='block';r.textContent=`${r.dataset.label}: ${s} / ${q.length}. ${r.dataset.review}`;};quiz.querySelector('[data-action="reset"]').onclick=()=>{quiz.reset();q.forEach(c=>c.classList.remove('correct','wrong'));r.style.display='none';};}
});
