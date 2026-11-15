
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

/* ===== شرح الأزرار بعدة لغات ===== */
const T={
ar:{
home:'الصفحة الرئيسية',
lens:'القاموس المصوّر. تعلّم الكلمات من خلال الصور واستمع إلى نطقها',
chat:'حوار الخليل. تحدّث مع المعلّم الذكي',
journey:'رحلة عُمان. محطات لتعلّم الكلمات',
about:'عن المشروع والفيديو',
voicelang:'اختر لغة شرح الأزرار',
guide:'تشغيل أو إيقاف الشرح الصوتي',
try:'اكتشف القاموس المصوّر',
listen:'استمع إلى النطق',
slow:'استمع ببطء',
save:'احفظ الكلمة في قائمتك',
level:'اختر المستوى',
topic:'اختر موضوع الحوار',
mic:'اضغط وتحدث بالعربية',
send:'أرسل الرسالة',
done:'سجّل إنهاء هذه المحطة'
},
en:{
home:'Home page',
lens:'Picture Dictionary. Learn words through pictures and listen to their pronunciation',
chat:'Chat with Al-Khalil, your smart tutor',
journey:'Oman journey. Stations to learn words',
about:'About the project and video',
voicelang:'Choose the language of button explanations',
guide:'Turn the audio guide on or off',
try:'Explore the Picture Dictionary',
listen:'Listen to the pronunciation',
slow:'Listen slowly',
save:'Save the word to your list',
level:'Choose your level',
topic:'Choose the chat topic',
mic:'Press and speak in Arabic',
send:'Send the message',
done:'Mark this station as finished'
},
hi:{
home:'होम पेज',
lens:'चित्र शब्दकोश। चित्रों के माध्यम से शब्द सीखें और उनका उच्चारण सुनें',
chat:'अल-ख़लील से बातचीत, आपका स्मार्ट शिक्षक',
journey:'ओमान यात्रा। शब्द सीखने के पड़ाव',
about:'प्रोजेक्ट और वीडियो के बारे में',
voicelang:'बटन समझाने की भाषा चुनें',
guide:'ऑडियो गाइड चालू या बंद करें',
try:'चित्र शब्दकोश देखें',
listen:'उच्चारण सुनें',
slow:'धीरे सुनें',
save:'शब्द को अपनी सूची में सहेजें',
level:'अपना स्तर चुनें',
topic:'बातचीत का विषय चुनें',
mic:'दबाएँ और अरबी में बोलें',
send:'संदेश भेजें',
done:'इस पड़ाव को पूरा करें'
},
ur:{
home:'ہوم پیج',
lens:'تصویری لغت۔ تصاویر کے ذریعے الفاظ سیکھیں اور ان کا تلفظ سنیں',
chat:'الخلیل سے گفتگو، آپ کا سمارٹ استاد',
journey:'عُمان کا سفر۔ الفاظ سیکھنے کے مراحل',
about:'پروجیکٹ اور ویڈیو کے بارے میں',
voicelang:'بٹن سمجھانے کی زبان منتخب کریں',
guide:'آڈیو گائیڈ آن یا آف کریں',
try:'تصویری لغت دیکھیں',
listen:'تلفظ سنیں',
slow:'آہستہ سنیں',
save:'لفظ اپنی فہرست میں محفوظ کریں',
level:'اپنا درجہ منتخب کریں',
topic:'گفتگو کا موضوع منتخب کریں',
mic:'دبائیں اور عربی میں بولیں',
send:'پیغام بھیجیں',
done:'یہ مرحلہ مکمل کریں'
}
};

const VL={ar:'ar-SA',en:'en-US',hi:'hi-IN',ur:'ur-PK'};
let lang=localStorage.getItem('ul')||'ar';
let guide=false,cur=null;

$('#ui-lang').value=lang;
$('#guide-toggle').setAttribute('aria-pressed','false');
$('#guide-toggle').textContent='الشرح الصوتي: إيقاف';

/* ===== الصوت ===== */
let voices=[];
const loadV=()=>voices=speechSynthesis.getVoices();
loadV();
speechSynthesis.onvoiceschanged=loadV;

function pick(l){
  const c=VL[l];
  return voices.find(v=>v.lang.replace('_','-')===c)||voices.find(v=>v.lang.startsWith(l));
}

function say(text,l=lang,rate=.9,queue=false){
  if(!text||!window.speechSynthesis)return;
  if(!queue)speechSynthesis.cancel();

  const u=new SpeechSynthesisUtterance(text);
  u.lang=VL[l];

  const v=pick(l);
  if(v)u.voice=v;

  u.rate=rate;
  speechSynthesis.speak(u);
}

/* ===== نطق العربية دون قراءة أسماء التشكيل ===== */
const sayAr=(t,r=.8,q=true)=>{
  if(!t)return;

  const cleanText=String(t)
    .replace(/[\u064B-\u065F\u0670\u0640]/g,'');

  say(cleanText,'ar',r,q);
};

/* ===== الشرح الصوتي للأزرار ===== */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-k]');

  if(b&&guide&&b.tagName!=='SELECT'){
    const message=T[lang]?.[b.dataset.k];
    if(message)say(message);
  }
},true);

$('#ui-lang').addEventListener('change',e=>{
  lang=e.target.value;
  localStorage.setItem('ul',lang);

  const message=T[lang]?.voicelang;
  if(message)say(message);
});

$('#ui-lang').addEventListener('focus',()=>{
  if(guide&&T[lang]?.voicelang)say(T[lang].voicelang);
});

$('#guide-toggle').onclick=e=>{
  guide=!guide;

  e.target.setAttribute('aria-pressed',guide);
  e.target.textContent='الشرح الصوتي: '+(guide?'تشغيل':'إيقاف');

  if(!guide&&window.speechSynthesis)speechSynthesis.cancel();
};

$$('select[data-k]:not(#ui-lang)').forEach(s=>{
  s.addEventListener('focus',()=>{
    if(guide&&T[lang]?.[s.dataset.k])say(T[lang][s.dataset.k]);
  });
});

/* ===== التنقل ===== */
function go(p){
  $$('.page').forEach(s=>s.hidden=s.id!==p);

  $$('nav button').forEach(b=>{
    b.classList.toggle('on',b.dataset.go===p);
  });

  location.hash=p;
  scrollTo(0,0);
}

$$('[data-go]').forEach(b=>{
  b.addEventListener('click',()=>go(b.dataset.go));
});

go(location.hash.slice(1)||'home');

/* ===== القاموس المصوّر ===== */
const DEMO=[
['دَلَّةٌ','coffee pot','أَشْرَبُ القَهْوَةَ مِنَ الدَّلَّةِ.','object-dallah.jpg'],
['خِنْجَرٌ','dagger','الخِنْجَرُ رَمْزٌ عُمَانِيٌّ.','object-khanjar.jpg'],
['حَلْوَى','sweets','أُحِبُّ الحَلْوَى العُمَانِيَّةَ.','object-halwa.jpg'],
['لُبَانٌ','frankincense','رَائِحَةُ اللُّبَانِ جَمِيلَةٌ.','object-frankincense.png'],
['تَمْرٌ','dates','آكُلُ التَّمْرَ مَعَ القَهْوَةِ.','object-dates.jpg'],
['سَفِينَةٌ','ship','السَّفِينَةُ فِي المِينَاءِ.','object-dhow.png'],
['بَابٌ','door','البَابُ خَشَبِيٌّ وَمُزَخْرَفٌ.','object-door.png']
];

/* عرض الكلمات المصوّرة */
$('#demo').innerHTML=DEMO.map((d,i)=>`
  <button class="chip" data-i="${i}">
    <img src="assets/img/${d[3]}" alt="${d[0]}" onerror="this.style.display='none'">
    ${d[0]}
    <small>${d[1]}</small>
  </button>
`).join('');

/* اختيار كلمة من القاموس */
$('#demo').onclick=e=>{
  const b=e.target.closest('.chip');
  if(!b)return;

  const d=DEMO[b.dataset.i];

  show({
    ar:d[0],
    en:d[1],
    ex:d[2]
  });
};

/* عرض تفاصيل الكلمة */
function show(r){
  cur=r;

  $('#r-ar').textContent=r.ar;
  $('#r-en').textContent=r.en;
  $('#r-ex').textContent=r.ex;

  $('#res').hidden=false;

  sayAr(r.ar+'. '+r.ex);
}

/* تشغيل نطق الكلمة والمثال */
const speakCur=rate=>{
  if(cur)sayAr(cur.ar+'. '+cur.ex,rate);
};

$('#b-listen').onclick=()=>speakCur(.8);
$('#b-slow').onclick=()=>speakCur(.5);

/* ===== قائمتي ===== */
let mylist=LS('list',[]);

function renderList(){
  $('#mylist').innerHTML=mylist.length
    ?mylist.map((w,i)=>`
      <button class="chip" data-i="${i}">
        ${w.ar}
        <small>${w.en}</small>
      </button>
    `).join('')
    :'<span class="hint">لا توجد كلمات محفوظة بعد.</span>';
}

$('#mylist').onclick=e=>{
  const b=e.target.closest('.chip');
  if(!b)return;

  const w=mylist[b.dataset.i];
  if(w)sayAr(w.ar+'. '+(w.ex||''),.8,false);
};

$('#b-save').onclick=()=>{
  if(cur&&!mylist.some(w=>w.ar===cur.ar)){
    mylist.push(cur);
    save('list',mylist);
    renderList();
  }
};

renderList();

/* ===== رحلة في عُمان ===== */
const TJ={
ar:['ابدأ اختبار المحطة','راجع الكلمات','انتقل إلى المحطة التالية'],
en:['Start the station quiz','Review the words','Go to the next station'],
hi:['पड़ाव का क्विज़ शुरू करें','शब्द दोहराएँ','अगले पड़ाव पर जाएँ'],
ur:['مرحلے کا کوئز شروع کریں','الفاظ دہرائیں','اگلے مرحلے پر جائیں']
};

Object.entries(TJ).forEach(([l,a])=>{
  ['stquiz','review','nextst'].forEach((k,i)=>{
    T[l][k]=a[i];
  });
});

const IM='assets/img/';

const ST={
fort:{
n:'القَلْعَة',
img:'scene-fort.jpg',
w:[
['قَلْعَةٌ','castle','object-castle.jpeg'],
['بَابٌ','door','object-door.png'],
['خِنْجَرٌ','dagger','object-khanjar.jpg'],
['بُرْجٌ','tower','object-tower.jpeg'],
['حَارِسٌ','guard','object-guard.jpeg']
]
},

souq:{
n:'السُّوق',
img:'scene-souq.jpg',
w:[
['سُوقٌ','market','scene-souq.jpg'],
['تَمْرٌ','dates','object-dates.jpg'],
['لُبَانٌ','frankincense','object-frankincense.png'],
['حَلْوَى','sweets','object-halwa.jpg'],
['دَلَّةٌ','coffee pot','object-dallah.jpg']
]
},

port:{
n:'المِينَاء',
img:'scene-port.jpg',
w:[
['مِينَاءٌ','harbor','scene-port.jpg'],
['سَفِينَةٌ','ship','object-dhow.png'],
['بَحْرٌ','sea','object-sea.jpeg'],
['مَوْجَةٌ','wave','object-sea.jpeg'],
['صَيَّادٌ','fisherman','object-fisherman.jpeg']
]
},

desert:{
n:'الصَّحْرَاء',
img:'scene-desert.jpg',
w:[
['صَحْرَاءُ','desert','scene-desert.jpg'],
['خَيْمَةٌ','tent','object-tent.jpeg'],
['نَجْمَةٌ','star','object-star.jpeg'],
['دَلَّةٌ','coffee pot','object-dallah.jpg'],
['تَمْرٌ','dates','object-dates.jpg']
]
}
};

const ORDER=Object.keys(ST),PASS=70;
const shf=a=>[...a].sort(()=>Math.random()-.5);

let done=LS('done',{});
let stc='',heard=new Set(),Q=[],qi=0,sc=0;

function renderSt(){
  const n=ORDER.filter(k=>done[k]).length;

  $('#j-prog').textContent=`أنجزت ${n} من ${ORDER.length} محطات`;
  $('#j-bar').style.width=(n/ORDER.length*100)+'%';

  $('#stations').innerHTML=ORDER.map((k,i)=>{
    const s=ST[k],ok=!i||done[ORDER[i-1]];

    return `
      <button class="st ${done[k]?'done':''} ${ok?'':'lock'}"
        data-s="${k}" ${ok?'':'disabled'}>
        <img src="${IM}${s.img}" alt="" onerror="this.style.display='none'">
        <b>${i+1}. ${s.n}</b>
        <span>${done[k]?'✓ مكتملة':ok?'متاحة':'🔒 أنهِ المحطة السابقة'}</span>
      </button>
    `;
  }).join('');
}

$('#stations').onclick=e=>{
  const b=e.target.closest('.st');
  if(b&&!b.disabled)openSt(b.dataset.s);
};

function openSt(k){
  stc=k;
  heard=new Set();

  const s=ST[k];

  $('#sv-title').textContent=s.n;
  sayAr(s.n,.8,false);

  $('#sv-words').innerHTML=s.w.map((w,i)=>`
    <button class="wcard" data-i="${i}">
      ${w[2]?`<img src="${IM}${w[2]}" alt="" onerror="this.style.display='none'">`:''}
      <b>${w[0]}</b>
      <small>${w[1]}</small>
    </button>
  `).join('');

  $('#sv-quiz').hidden=true;
  $('#sv-learn').hidden=false;
  $('#station-view').hidden=false;

  updHeard();

  $('#station-view').scrollIntoView({behavior:'smooth'});
}

function updHeard(){
  const t=ST[stc].w.length;

  $('#sv-count').textContent=`استمعت إلى ${heard.size} من ${t} كلمات. اضغط كل بطاقة لتفتح الاختبار.`;
  $('#b-quiz').disabled=heard.size<t;
}

$('#sv-words').onclick=e=>{
  const b=e.target.closest('.wcard');
  if(!b)return;

  const i=+b.dataset.i;

  sayAr(ST[stc].w[i][0],.8,false);

  heard.add(i);
  b.classList.add('heard');

  updHeard();
};

$('#b-quiz').onclick=()=>{
  const W=ST[stc].w;

  Q=shf(W).map(w=>({
    w,
    img:!!w[2],
    o:shf([w,...shf(W.filter(x=>x!==w)).slice(0,2)])
  }));

  qi=0;
  sc=0;

  $('#sv-learn').hidden=true;
  $('#sv-quiz').hidden=false;

  showQ();
};

function showQ(){
  $('#sq-end').hidden=true;

  if(qi>=Q.length)return endQ();

  const q=Q[qi];

  $('#sq-n').textContent=`السؤال ${qi+1} من ${Q.length}`;
  $('#sq-bar').style.width=(qi/Q.length*100)+'%';

  $('#sq-img').innerHTML=q.img
    ?`<img src="${IM}${q.w[2]}" alt="">`
    :`<button class="btn" id="sq-play" data-k="listen">استمع</button>`;

  $('#sq-t').textContent=q.img
    ?'ما الكلمة المناسبة للصورة؟'
    :'استمع، ثم اختر الكلمة التي سمعتها';

  $('#sq-o').innerHTML=q.o.map((o,i)=>`
    <button class="qopt" data-i="${i}">${o[0]}</button>
  `).join('');

  if(!q.img){
    sayAr(q.w[0],.7,false);
    $('#sq-play').onclick=()=>sayAr(q.w[0],.7);
  }
}

$('#sq-o').onclick=e=>{
  const b=e.target.closest('.qopt');
  if(!b||b.disabled)return;

  const q=Q[qi];
  const ok=q.o[+b.dataset.i]===q.w;

  $$('#sq-o .qopt').forEach((x,i)=>{
    x.disabled=true;
    if(q.o[i]===q.w)x.classList.add('right');
  });

  if(ok)sc++;
  else b.classList.add('wrong');

  setTimeout(()=>{
    qi++;
    showQ();
  },900);
};

function endQ(){
  const p=Math.round(sc/Q.length*100);
  const ok=p>=PASS;
  const i=ORDER.indexOf(stc);

  $('#sq-bar').style.width='100%';
  $('#sq-n').textContent='';
  $('#sq-img').innerHTML='';
  $('#sq-o').innerHTML='';

  $('#sq-t').textContent=ok
    ?`أحسنت! نتيجتك ${p}٪ وأنهيت محطة ${ST[stc].n} ✓`
    :`نتيجتك ${p}٪. تحتاج إلى ${PASS}٪ للنجاح، راجع الكلمات وحاول مرة أخرى.`;

  if(ok){
    done[stc]=Math.max(p,done[stc]||0);
    save('done',done);
    renderSt();
    sayAr('أَحْسَنْتَ!',.8,false);
  }

  $('#b-next').hidden=!(ok&&i<ORDER.length-1);
  $('#sq-end').hidden=false;
}

$('#b-review').onclick=()=>openSt(stc);

$('#b-next').onclick=()=>{
  openSt(ORDER[ORDER.indexOf(stc)+1]);
};

renderSt();
