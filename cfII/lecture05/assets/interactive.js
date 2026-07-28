
document.addEventListener('DOMContentLoaded',()=>{
 const lang=document.documentElement.lang==='ja'?'ja':'en';
 const T={
  en:{
   opened:(o,t)=>`Answers opened: ${o} / ${t}`,
   media:{electrical:'Electrical signal in copper.',optical:'Light signal in fiber.',radio:'Radio waves through the air.'},
   role:{
    switch:['Switch','Connects devices inside one LAN and forwards local traffic toward the correct port.'],
    router:['Router','Connects different networks and chooses the next path for IP packets.'],
    ap:['Access point','Connects Wi‑Fi devices to the local wired network.'],
    dns:['DNS','Translates a domain name into an IP address.'],
    server:['Server','Receives client requests and provides data or services.'],
    onu:['Modem / ONU','Converts the Internet provider’s physical line signal for the local router.']
   },
   packet:['Client creates a request.','The switch forwards it inside the LAN.','The router sends it toward another network.','Internet routers move it across networks.','The server receives the request and can respond.'],
   ipPrivate:'Private IPv4 address: normally used inside a local network.',
   ipPublic:'Public IPv4 address: globally routable unless reserved for another special purpose.',
   ipInvalid:'Not a valid usable IPv4 address for this simple exercise.',
   dnsResult:(d,ip)=>`${d} → ${ip}`,
   wifi:{
    weak:'Move closer, check walls/interference, compare signal on another device, and check access-point placement.',
    auth:'Verify the correct SSID, password or enterprise credentials, date/time, and account status.',
    nointernet:'The Wi‑Fi radio link works. Check router/gateway, DNS, provider line, and whether many devices are affected.',
    one:'Focus on the local device: Wi‑Fi setting, saved profile, adapter, IP configuration, and authentication.',
    many:'Focus on shared infrastructure: access point, switch, router, DHCP/DNS, power, or provider service.'
   },
   one:'ONE DEVICE',many:'MANY DEVICES',
   scopeOk:'All cases are classified correctly.',
   scopeBad:'Some cases are still incorrect. One device suggests a local issue; many devices suggest shared infrastructure or service.',
   score:(n,t)=>`Final score: ${n} / ${t}. ${n>=13?'Excellent.':n>=10?'Good. Review the highlighted questions.':'Review the network chain and troubleshooting sequence, then try again.'}`
  },
  ja:{
   opened:(o,t)=>`開いた答え: ${o} / ${t}`,
   media:{electrical:'銅線内の電気信号です。',optical:'光ファイバー内の光信号です。',radio:'空間を通る電波です。'},
   role:{
    switch:['スイッチ','1つのLAN内の機器を接続し、ローカル通信を正しいポートへ送ります。'],
    router:['ルーター','異なるネットワークを接続し、IPパケットの次の経路を選びます。'],
    ap:['アクセスポイント','Wi‑Fi機器をローカル有線ネットワークへ接続します。'],
    dns:['DNS','ドメイン名をIPアドレスへ変換します。'],
    server:['サーバー','クライアント要求を受け、データやサービスを提供します。'],
    onu:['モデム／ONU','事業者回線の物理信号をローカルルーターで使える形へ変換します。']
   },
   packet:['クライアントが要求を作ります。','スイッチがLAN内で転送します。','ルーターが別ネットワークへ送ります。','インターネットのルーターがネットワーク間を転送します。','サーバーが要求を受けて応答できます。'],
   ipPrivate:'プライベートIPv4アドレス：通常はローカルネットワーク内で使います。',
   ipPublic:'パブリックIPv4アドレス：他の予約用途でなければグローバルにルーティングできます。',
   ipInvalid:'この簡単な練習では有効なIPv4アドレスではありません。',
   dnsResult:(d,ip)=>`${d} → ${ip}`,
   wifi:{
    weak:'近づく、壁や干渉を確認する、別機器と比較する、アクセスポイント位置を確認します。',
    auth:'正しいSSID、パスワード／企業認証、日時、アカウント状態を確認します。',
    nointernet:'Wi‑Fi無線リンクは動いています。ルーター、ゲートウェイ、DNS、事業者回線、多数機器への影響を確認します。',
    one:'ローカル機器を中心に確認します：Wi‑Fi設定、保存プロファイル、アダプタ、IP設定、認証です。',
    many:'共有設備を中心に確認します：アクセスポイント、スイッチ、ルーター、DHCP/DNS、電源、事業者サービスです。'
   },
   one:'1台の問題',many:'多数の問題',
   scopeOk:'すべて正しく分類できました。',
   scopeBad:'まだ誤りがあります。1台だけならローカル問題、多数なら共有設備・サービスを考えてください。',
   score:(n,t)=>`最終スコア: ${n} / ${t}。${n>=13?'とても良いです。':n>=10?'良いです。色が付いた問題を復習してください。':'ネットワークの流れと確認順序を復習して、もう一度挑戦してください。'}`
  }
 }[lang];

 // Checkpoint progress
 const details=[...document.querySelectorAll('details[data-checkpoint]')];
 const fill=document.getElementById('progress-fill'),label=document.getElementById('progress-label');
 function progress(){
  const opened=details.filter(d=>d.open).length;
  if(fill)fill.style.width=(details.length?opened/details.length*100:0)+'%';
  if(label)label.textContent=T.opened(opened,details.length);
 }
 details.forEach(d=>d.addEventListener('toggle',progress));progress();

 // Slide modal
 const modal=document.getElementById('slide-modal');
 if(modal){
  const img=modal.querySelector('img');
  document.querySelectorAll('.image-button').forEach(b=>b.addEventListener('click',()=>{img.src=b.dataset.full;modal.classList.add('open');document.body.style.overflow='hidden';}));
  function close(){modal.classList.remove('open');img.src='';document.body.style.overflow='';}
  modal.querySelector('button').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 }

 // Media
 const mediaFeedback=document.getElementById('media-feedback');
 document.querySelectorAll('.media-card').forEach(card=>card.addEventListener('click',()=>{
  document.querySelectorAll('.media-card').forEach(x=>x.classList.remove('electrical','optical','radio'));
  card.classList.add(card.dataset.kind);
  mediaFeedback.className='feedback ok';mediaFeedback.textContent=T.media[card.dataset.kind];
 }));

 // Roles
 const roleInfo=document.getElementById('role-info');
 document.querySelectorAll('.role-card').forEach(card=>card.addEventListener('click',()=>{
  document.querySelectorAll('.role-card').forEach(x=>x.classList.remove('active'));card.classList.add('active');
  const d=T.role[card.dataset.role];roleInfo.innerHTML=`<h4>${d[0]}</h4><p>${d[1]}</p>`;
 }));
 document.querySelector('.role-card')?.click();

 // Packet
 const nodes=[...document.querySelectorAll('.path-node')],packetStatus=document.getElementById('packet-status');
 let packetStep=-1;
 function packetShow(){
  nodes.forEach((n,i)=>n.classList.toggle('active',i===packetStep));
  packetStatus.textContent=packetStep>=0?T.packet[packetStep]:(lang==='ja'?'「次の段階」を押してください。':'Press “Next step” to start.');
 }
 document.getElementById('packet-next')?.addEventListener('click',()=>{packetStep=(packetStep+1)%nodes.length;packetShow();});
 document.getElementById('packet-reset')?.addEventListener('click',()=>{packetStep=-1;packetShow();});packetShow();

 // IPv4 simple classification
 function validIPv4(s){
  const p=s.trim().split('.');if(p.length!==4)return null;
  const n=p.map(x=>Number(x));if(n.some((v,i)=>!Number.isInteger(v)||v<0||v>255||String(v)!==String(Number(p[i]))))return null;
  return n;
 }
 document.getElementById('check-ip')?.addEventListener('click',()=>{
  const fb=document.getElementById('ip-feedback'),n=validIPv4(document.getElementById('ip-input').value);
  let text=T.ipInvalid,ok=false;
  if(n){
   const privateIP=n[0]===10||(n[0]===172&&n[1]>=16&&n[1]<=31)||(n[0]===192&&n[1]===168);
   const unusable=n[0]===0||n[0]===127||n[0]>=224||(n[0]===169&&n[1]===254)||n.every(v=>v===255);
   if(!unusable){text=privateIP?T.ipPrivate:T.ipPublic;ok=true;}
  }
  fb.className='feedback '+(ok?'ok':'bad');fb.textContent=text;
 });

 // DNS
 document.getElementById('dns-lookup')?.addEventListener('click',()=>{
  const d=document.getElementById('dns-input').value.trim()||'hospital.example';
  let h=0;for(const ch of d)h=(h*31+ch.charCodeAt(0))>>>0;
  const ip=`203.0.113.${(h%200)+1}`;
  document.getElementById('dns-result').textContent=T.dnsResult(d,ip);
 });

 // WiFi advice
 const wifi=document.getElementById('wifi-problem'),advice=document.getElementById('wifi-advice');
 function updateWifi(){if(wifi&&advice)advice.textContent=T.wifi[wifi.value];}
 wifi?.addEventListener('change',updateWifi);updateWifi();

 // Scope cards cycle one/many/blank
 document.querySelectorAll('.scope-card').forEach(card=>card.addEventListener('click',()=>{
  const current=card.dataset.choice||'';
  const next=current==='one'?'many':current==='many'?'':'one';
  card.dataset.choice=next;card.classList.remove('one','many');
  if(next)card.classList.add(next);
  card.querySelector('strong').textContent=next?(next==='one'?T.one:T.many):'';
 }));
 document.getElementById('check-scope')?.addEventListener('click',()=>{
  const cards=[...document.querySelectorAll('.scope-card')],ok=cards.every(c=>c.dataset.choice===c.dataset.answer);
  const fb=document.getElementById('scope-feedback');fb.className='feedback '+(ok?'ok':'bad');fb.textContent=ok?T.scopeOk:T.scopeBad;
 });

 // Quiz
 const quiz=document.getElementById('final-quiz');
 if(quiz){
  const cards=[...quiz.querySelectorAll('.quiz-card')],score=document.getElementById('quiz-score');
  document.getElementById('check-quiz').addEventListener('click',()=>{
   let n=0;cards.forEach(c=>{c.classList.remove('correct','wrong');const s=c.querySelector('input:checked');if(s&&s.value===c.dataset.answer){n++;c.classList.add('correct')}else c.classList.add('wrong')});
   score.style.display='block';score.textContent=T.score(n,cards.length);
  });
  document.getElementById('reset-quiz').addEventListener('click',()=>{quiz.reset();cards.forEach(c=>c.classList.remove('correct','wrong'));score.style.display='none'});
 }
});
