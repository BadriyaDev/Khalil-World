
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* ===== شرح الأزرار بعدة لغات ===== */
const T={
ar:{home:'الصفحة الرئيسية',lens:'العدسة. صوّر شيئاً لتتعلم اسمه',chat:'حوار الخليل. تحدّث مع المعلّم الذكي',journey:'رحلة عُمان. محطات لتعلّم الكلمات',about:'عن المشروع والفيديو',voicelang:'اختر لغة شرح الأزرار',guide:'تشغيل أو إيقاف الشرح الصوتي',try:'ابدأ باستخدام العدسة',video:'اذهب إلى الفيديو التوضيحي',cam:'تشغيل الكاميرا',capture:'التقاط صورة',upload:'رفع صورة من جهازك',listen:'استمع إلى النطق',slow:'استمع ببطء',save:'احفظ الكلمة في قائمتك',level:'اختر المستوى',topic:'اختر موضوع الحوار',mic:'اضغط وتحدث بالعربية',send:'أرسل الرسالة',done:'سجّل إنهاء هذه المحطة'},
en:{home:'Home page',lens:'Lens. Take a photo to learn its Arabic name',chat:'Chat with Al-Khalil, your smart tutor',journey:'Oman journey. Stations to learn words',about:'About the project and video',voicelang:'Choose the language of button explanations',guide:'Turn the audio guide on or off',try:'Start using the lens',video:'Go to the demo video',cam:'Turn on the camera',capture:'Take a picture',upload:'Upload a photo from your device',listen:'Listen to the pronunciation',slow:'Listen slowly',save:'Save the word to your list',level:'Choose your level',topic:'Choose the chat topic',mic:'Press and speak in Arabic',send:'Send the message',done:'Mark this station as finished'},
hi:{home:'होम पेज',lens:'लेंस। किसी चीज़ की फ़ोटो लें और उसका अरबी नाम सीखें',chat:'अल-ख़लील से बातचीत, आपका स्मार्ट शिक्षक',journey:'ओमान यात्रा। शब्द सीखने के पड़ाव',about:'प्रोजेक्ट और वीडियो के बारे में',voicelang:'बटन समझाने की भाषा चुनें',guide:'ऑडियो गाइड चालू या बंद करें',try:'लेंस का उपयोग शुरू करें',video:'डेमो वीडियो पर जाएँ',cam:'कैमरा चालू करें',capture:'फ़ोटो लें',upload:'अपने फ़ोन से फ़ोटो अपलोड करें',listen:'उच्चारण सुनें',slow:'धीरे सुनें',save:'शब्द को अपनी सूची में सहेजें',level:'अपना स्तर चुनें',topic:'बातचीत का विषय चुनें',mic:'दबाएँ और अरबी में बोलें',send:'संदेश भेजें',done:'इस पड़ाव को पूरा करें'},
ur:{home:'ہوم پیج',lens:'لینس۔ کسی چیز کی تصویر لیں اور اس کا عربی نام سیکھیں',chat:'الخلیل سے گفتگو، آپ کا سمارٹ استاد',journey:'عُمان کا سفر۔ الفاظ سیکھنے کے مراحل',about:'پروجیکٹ اور ویڈیو کے بارے میں',voicelang:'بٹن سمجھانے کی زبان منتخب کریں',guide:'آڈیو گائیڈ آن یا آف کریں',try:'لینس استعمال کرنا شروع کریں',video:'ڈیمو ویڈیو پر جائیں',cam:'کیمرا آن کریں',capture:'تصویر لیں',upload:'اپنے فون سے تصویر اپلوڈ کریں',listen:'تلفظ سنیں',slow:'آہستہ سنیں',save:'لفظ اپنی فہرست میں محفوظ کریں',level:'اپنا درجہ منتخب کریں',topic:'گفتگو کا موضوع منتخب کریں',mic:'دبائیں اور عربی میں بولیں',send:'پیغام بھیجیں',done:'یہ مرحلہ مکمل کریں'}
};
const VL={ar:'ar-SA',en:'en-US',hi:'hi-IN',ur:'ur-PK'};
let lang=localStorage.getItem('ul')||'ar',guide=true,cur=null;
$('#ui-lang').value=lang;

/* ===== الصوت ===== */
let voices=[];const loadV=()=>voices=speechSynthesis.getVoices();loadV();
speechSynthesis.onvoiceschanged=loadV;
function pick(l){const c=VL[l];return voices.find(v=>v.lang.replace('_','-')===c)||voices.find(v=>v.lang.startsWith(l))}
function say(text,l=lang,rate=.9,queue=false){
  if(!text||!window.speechSynthesis)return;
  if(!queue)speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang=VL[l];
  const v=pick(l);if(v)u.voice=v;u.rate=rate;speechSynthesis.speak(u);
}
/* ===== نطق العربية دون قراءة أسماء التشكيل ===== */
const sayAr=(t,r=.8,q=true)=>{
  if(!t)return;

  // إزالة علامات التشكيل قبل إرسال النص إلى محرك الصوت
  const cleanText=String(t)
    .replace(/[\u064B-\u065F\u0670\u0640]/g,'');

  say(cleanText,'ar',r,q);
};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-k]');
  if(b&&guide&&b.tagName!=='SELECT')say(T[lang][b.dataset.k]);
},true);
$('#ui-lang').addEventListener('change',e=>{lang=e.target.value;localStorage.setItem('ul',lang);say(T[lang].voicelang)});
$('#ui-lang').addEventListener('focus',()=>guide&&say(T[lang].voicelang));
$('#guide-toggle').onclick=e=>{
  guide=!guide;e.target.setAttribute('aria-pressed',guide);
  e.target.textContent='الشرح الصوتي: '+(guide?'تشغيل':'إيقاف');
};
$$('select[data-k]:not(#ui-lang)').forEach(s=>s.addEventListener('focus',()=>guide&&say(T[lang][s.dataset.k])));

/* ===== التنقل ===== */
function go(p){
  $$('.page').forEach(s=>s.hidden=s.id!==p);
  $$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.go===p));
  location.hash=p;scrollTo(0,0);
}
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
go(location.hash.slice(1)||'home');

/* ===== الاتصال بالذكاء الاصطناعي ===== */
const ask=body=>fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  .then(r=>{if(!r.ok)throw new Error();return r.json()}).then(j=>j.text);

/* ===== العدسة ===== */
const DEMO=[
['دَلَّةٌ','coffee pot','أَشْرَبُ القَهْوَةَ مِنَ الدَّلَّةِ.','object-dallah.jpg'],
['خِنْجَرٌ','dagger','الخِنْجَرُ رَمْزٌ عُمَانِيٌّ.','object-khanjar.jpg'],
['حَلْوَى','sweets','أُحِبُّ الحَلْوَى العُمَانِيَّةَ.','object-halwa.jpg'],
['لُبَانٌ','frankincense','رَائِحَةُ اللُّبَانِ جَمِيلَةٌ.','object-frankincense.png'],
['تَمْرٌ','dates','آكُلُ التَّمْرَ مَعَ القَهْوَةِ.','object-dates.jpg'],
['سَفِينَةٌ','ship','السَّفِينَةُ فِي المِينَاءِ.','object-dhow.png'],
['بَابٌ','door','البَابُ خَشَبِيٌّ وَمُزَخْرَفٌ.','object-door.png']];
$('#demo').innerHTML=DEMO.map((d,i)=>`<button class="chip" data-i="${i}"><img src="assets/img/${d[3]}" alt="" onerror="this.style.display='none'">${d[0]}<small>${d[1]}</small></button>`).join('');
$('#demo').onclick=e=>{const b=e.target.closest('.chip');if(b){const d=DEMO[b.dataset.i];show({ar:d[0],en:d[1],ex:d[2]})}};

function show(r){
  cur=r;$('#r-ar').textContent=r.ar;$('#r-en').textContent=r.en;$('#r-ex').textContent=r.ex;
  $('#res').hidden=false;sayAr(r.ar+'. '+r.ex);
}
const speakCur=rate=>cur&&sayAr(cur.ar+'. '+cur.ex,rate);
$('#b-listen').onclick=()=>speakCur(.8);
$('#b-slow').onclick=()=>speakCur(.5);

let mylist=LS('list',[]);
function renderList(){
  $('#mylist').innerHTML=mylist.length?mylist.map((w,i)=>`<button class="chip" data-i="${i}">${w.ar}<small>${w.en}</small></button>`).join(''):'<span class="hint">لا توجد كلمات محفوظة بعد.</span>';
}
$('#mylist').onclick=e=>{const b=e.target.closest('.chip');if(b)sayAr(mylist[b.dataset.i].ar,.8,false)};
$('#b-save').onclick=()=>{
  if(cur&&!mylist.some(w=>w.ar===cur.ar)){mylist.push(cur);save('list',mylist);renderList()}
};
renderList();

const cam=$('#cam'),snap=$('#snap');
$('#b-cam').onclick=async()=>{
  try{
    cam.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    cam.hidden=false;snap.hidden=true;$('#cam-hint').hidden=true;
  }catch(e){alert('تعذّر تشغيل الكاميرا. اسمح بالوصول أو ارفع صورة.')}
};
function identify(){
  $('#res').hidden=false;$('#r-ar').textContent='…';$('#r-en').textContent='';$('#r-ex').textContent='جارٍ التعرّف على الصورة';
  ask({mode:'lens',img:snap.toDataURL('image/jpeg',.7).split(',')[1]})
    .then(t=>show(JSON.parse(t.replace(/```json|```/g,'').trim())))
    .catch(()=>{$('#res').hidden=true;alert('تعذّر التعرّف الآن. جرّب إحدى الكلمات الجاهزة.')});
}
$('#b-cap').onclick=()=>{
  if(!cam.srcObject)return alert('شغّل الكاميرا أولاً.');
  snap.width=cam.videoWidth;snap.height=cam.videoHeight;snap.getContext('2d').drawImage(cam,0,0);
  identify();
};
$('#file').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const img=new Image();img.onload=()=>{
    const s=Math.min(1,800/img.width);snap.width=img.width*s;snap.height=img.height*s;
    snap.getContext('2d').drawImage(img,0,0,snap.width,snap.height);
    cam.hidden=true;snap.hidden=false;$('#cam-hint').hidden=true;identify();
  };img.src=URL.createObjectURL(f);
};

/* ===== حوار الخليل ===== */
const log=$('#log');let hist=[];
function bubble(cls,text){
  const d=document.createElement('div');d.className='bubble '+cls;
  const [main,fix]=text.split('تصحيح:');d.textContent=main.trim();
  if(fix){const f=document.createElement('div');f.className='fix';f.textContent='تصحيح: '+fix.trim();d.appendChild(f)}
  log.appendChild(d);log.scrollTop=log.scrollHeight;return main.trim();
}
function send(txt){
  txt=(txt||$('#msg').value).trim();if(!txt)return;
  $('#msg').value='';bubble('me',txt);hist.push({r:'user',t:txt});
  ask({mode:'chat',msg:txt,h:hist.slice(-6),level:$('#level').value,topic:$('#topic').value})
    .then(t=>{hist.push({r:'model',t});sayAr(bubble('bot',t),.8,false)})
    .catch(()=>bubble('bot','عُذْرًا، حَدَثَ خَطَأٌ. حَاوِلْ مَرَّةً أُخْرَى.'));
}
$('#b-send').onclick=()=>send();
$('#msg').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}});
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$('#b-mic').onclick=()=>{
  if(!SR)return alert('التعرف على الصوت يعمل في متصفح Chrome. اكتب رسالتك بدلاً من ذلك.');
  const r=new SR();r.lang='ar-SA';const m=$('#b-mic');m.classList.add('rec');
  r.onresult=e=>send(e.results[0][0].transcript);
  r.onend=()=>m.classList.remove('rec');r.start();
};

/* ===== رحلة في عُمان ===== */
const TJ={ar:['ابدأ اختبار المحطة','راجع الكلمات','انتقل إلى المحطة التالية'],en:['Start the station quiz','Review the words','Go to the next station'],hi:['पड़ाव का क्विज़ शुरू करें','शब्द दोहराएँ','अगले पड़ाव पर जाएँ'],ur:['مرحلے کا کوئز شروع کریں','الفاظ دہرائیں','اگلے مرحلے پر جائیں']};
Object.entries(TJ).forEach(([l,a])=>['stquiz','review','nextst'].forEach((k,i)=>T[l][k]=a[i]));

const IM='assets/img/';
const ST={
fort:{n:'القَلْعَة',img:'scene-fort.jpg',w:[
['قَلْعَةٌ','castle','object-castle.jpeg'],
['بَابٌ','door','object-door.png'],
['خِنْجَرٌ','dagger','object-khanjar.jpg'],
['بُرْجٌ','tower','object-tower.jpeg'],
['حَارِسٌ','guard','object-guard.jpeg']]},

souq:{n:'السُّوق',img:'scene-souq.jpg',w:[
['سُوقٌ','market','scene-souq.jpg'],
['تَمْرٌ','dates','object-dates.jpg'],
['لُبَانٌ','frankincense','object-frankincense.png'],
['حَلْوَى','sweets','object-halwa.jpg'],
['دَلَّةٌ','coffee pot','object-dallah.jpg']]},

port:{n:'المِينَاء',img:'scene-port.jpg',w:[
['مِينَاءٌ','harbor','scene-port.jpg'],
['سَفِينَةٌ','ship','object-dhow.png'],
['بَحْرٌ','sea','object-sea.jpeg'],
['مَوْجَةٌ','wave','object-sea.jpeg'],
['صَيَّادٌ','fisherman','object-fisherman.jpeg']]},

desert:{n:'الصَّحْرَاء',img:'scene-desert.jpg',w:[
['صَحْرَاءُ','desert','scene-desert.jpg'],
['خَيْمَةٌ','tent','object-tent.jpeg'],
['نَجْمَةٌ','star','object-star.jpeg'],
['دَلَّةٌ','coffee pot','object-dallah.jpg'],
['تَمْرٌ','dates','object-dates.jpg']]}
};

const ORDER=Object.keys(ST),PASS=70;
const shf=a=>[...a].sort(()=>Math.random()-.5);
let done=LS('done',{}),stc='',heard=new Set(),Q=[],qi=0,sc=0;

function renderSt(){
  const n=ORDER.filter(k=>done[k]).length;
  $('#j-prog').textContent=`أنجزت ${n} من ${ORDER.length} محطات`;
  $('#j-bar').style.width=(n/ORDER.length*100)+'%';
  $('#stations').innerHTML=ORDER.map((k,i)=>{
    const s=ST[k],ok=!i||done[ORDER[i-1]];
    return `<button class="st ${done[k]?'done':''} ${ok?'':'lock'}" data-s="${k}" ${ok?'':'disabled'}><img src="${IM}${s.img}" alt="" onerror="this.style.display='none'"><b>${i+1}. ${s.n}</b><span>${done[k]?'✓ مكتملة':ok?'متاحة':'🔒 أنهِ المحطة السابقة'}</span></button>`;
  }).join('');
}
$('#stations').onclick=e=>{const b=e.target.closest('.st');if(b&&!b.disabled)openSt(b.dataset.s)};

function openSt(k){
  stc=k;heard=new Set();const s=ST[k];
  $('#sv-title').textContent=s.n;sayAr(s.n,.8,false);
  $('#sv-words').innerHTML=s.w.map((w,i)=>`<button class="wcard" data-i="${i}">${w[2]?`<img src="${IM}${w[2]}" alt="" onerror="this.style.display='none'">`:''}<b>${w[0]}</b><small>${w[1]}</small></button>`).join('');
  $('#sv-quiz').hidden=true;$('#sv-learn').hidden=false;$('#station-view').hidden=false;
  updHeard();$('#station-view').scrollIntoView({behavior:'smooth'});
}
function updHeard(){
  const t=ST[stc].w.length;
  $('#sv-count').textContent=`استمعت إلى ${heard.size} من ${t} كلمات. اضغط كل بطاقة لتفتح الاختبار.`;
  $('#b-quiz').disabled=heard.size<t;
}
$('#sv-words').onclick=e=>{
  const b=e.target.closest('.wcard');if(!b)return;
  const i=+b.dataset.i;sayAr(ST[stc].w[i][0],.8,false);heard.add(i);b.classList.add('heard');updHeard();
};

$('#b-quiz').onclick=()=>{
  const W=ST[stc].w;
  Q=shf(W).map(w=>({w,img:!!w[2],o:shf([w,...shf(W.filter(x=>x!==w)).slice(0,2)])}));
  qi=0;sc=0;$('#sv-learn').hidden=true;$('#sv-quiz').hidden=false;showQ();
};
function showQ(){
  $('#sq-end').hidden=true;
  if(qi>=Q.length)return endQ();
  const q=Q[qi];
  $('#sq-n').textContent=`السؤال ${qi+1} من ${Q.length}`;
  $('#sq-bar').style.width=(qi/Q.length*100)+'%';
  $('#sq-img').innerHTML=q.img?`<img src="${IM}${q.w[2]}" alt="">`:`<button class="btn" id="sq-play" data-k="listen">استمع</button>`;
  $('#sq-t').textContent=q.img?'ما الكلمة المناسبة للصورة؟':'استمع، ثم اختر الكلمة التي سمعتها';
  $('#sq-o').innerHTML=q.o.map((o,i)=>`<button class="qopt" data-i="${i}">${o[0]}</button>`).join('');
  if(!q.img){sayAr(q.w[0],.7,false);$('#sq-play').onclick=()=>sayAr(q.w[0],.7)}
}
$('#sq-o').onclick=e=>{
  const b=e.target.closest('.qopt');if(!b||b.disabled)return;
  const q=Q[qi],ok=q.o[+b.dataset.i]===q.w;
  $$('#sq-o .qopt').forEach((x,i)=>{x.disabled=true;if(q.o[i]===q.w)x.classList.add('right')});
  if(ok)sc++;else b.classList.add('wrong');
  setTimeout(()=>{qi++;showQ()},900);
};
function endQ(){
  const p=Math.round(sc/Q.length*100),ok=p>=PASS,i=ORDER.indexOf(stc);
  $('#sq-bar').style.width='100%';$('#sq-n').textContent='';$('#sq-img').innerHTML='';$('#sq-o').innerHTML='';
  $('#sq-t').textContent=ok?`أحسنت! نتيجتك ${p}٪ وأنهيت محطة ${ST[stc].n} ✓`:`نتيجتك ${p}٪. تحتاج إلى ${PASS}٪ للنجاح، راجع الكلمات وحاول مرة أخرى.`;
  if(ok){done[stc]=Math.max(p,done[stc]||0);save('done',done);renderSt();sayAr('أَحْسَنْتَ!',.8,false)}
  $('#b-next').hidden=!(ok&&i<ORDER.length-1);$('#sq-end').hidden=false;
}
$('#b-review').onclick=()=>openSt(stc);
$('#b-next').onclick=()=>openSt(ORDER[ORDER.indexOf(stc)+1]);
renderSt();
