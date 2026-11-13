/* ===== الحساب والملف الشخصي ===== */
const SB_URL='YOUR-PROJECT-URL',SB_KEY='YOUR-ANON-KEY';
let sb=null,user=null,guest=LS('guest',false),ptab='info';
const fromOAuth=new URLSearchParams(location.search).has('code');
try{if(window.supabase&&!SB_URL.startsWith('YOUR'))sb=supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'pkce'}})}catch(e){}

const KEYS=['profile','history','badges','settings','done','level','list'];
const snapshot=()=>Object.fromEntries(KEYS.map(k=>[k,LS(k,null)]));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let pt;
function push(){
  if(!sb||!user)return;
  clearTimeout(pt);
  return sb.from('profiles').upsert({id:user.id,data:snapshot(),updated_at:new Date().toISOString()});
}
function pushSoon(){clearTimeout(pt);pt=setTimeout(push,1200)}

async function pull(){
  if(!sb||!user)return;
  const {data}=await sb.from('profiles').select('data').eq('id',user.id).maybeSingle();
  const r=data?.data||{};
  save('profile',{...LS('profile',{}),...(r.profile||{})});
  save('settings',{...LS('settings',{}),...(r.settings||{})});
  const dn={...LS('done',{})};Object.entries(r.done||{}).forEach(([k,v])=>dn[k]=Math.max(v,dn[k]||0));save('done',dn);
  save('badges',{...(r.badges||{}),...LS('badges',{})});
  const seen=new Set(),hs=[...(r.history||[]),...LS('history',[])].filter(h=>!seen.has(h.d)&&seen.add(h.d));
  save('history',hs.sort((a,b)=>b.d-a.d).slice(0,100));
  const ls=[...LS('list',[])];(r.list||[]).forEach(w=>{if(!ls.some(x=>x.ar===w.ar))ls.push(w)});save('list',ls);
  if(r.level&&!LS('level',0))save('level',r.level);
  await push();
  if(typeof renderSt==='function')renderSt();
  if(typeof renderList==='function'){mylist=LS('list',[]);renderList()}
  applySet();
}

function setSet(k,v){const s=LS('settings',{});s[k]=v;save('settings',s);applySet()}
function applySet(){
  const s=LS('settings',{});
  document.documentElement.style.fontSize=({normal:'100%',large:'115%',xl:'130%'})[s.font||'normal'];
  $('#auto-say').checked=s.auto!==false;
}
$('#auto-say').onchange=e=>setSet('auto',e.target.checked);

function refresh(){
  const b=$('#nav-acc');
  if(user){b.textContent='حسابي';b.dataset.go='profile'}else{b.textContent='دخول';b.dataset.go='login'}
}

/* ===== تسجيل الدخول ===== */
const msg=t=>$('#a-msg').textContent=t;
async function authDo(kind){
  if(!sb)return msg('الدخول غير مفعّل بعد: ضع بيانات Supabase في أول ملف auth.js.');
  const email=$('#a-email').value.trim(),password=$('#a-pass').value;
  if(!email||password.length<6)return msg('اكتب بريدًا صحيحًا وكلمة مرور من ٦ أحرف على الأقل.');
  msg('لحظة…');
  const r=kind==='up'?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
  if(r.error)return msg(/invalid login/i.test(r.error.message)?'البريد أو كلمة المرور غير صحيحة.':'تعذّر: '+r.error.message);
  if(kind==='up'&&!r.data.session)return msg('تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.');
  msg('');go('profile');
}
$('#a-in').onclick=()=>authDo('in');
$('#a-up').onclick=()=>authDo('up');
$('#a-google').onclick=()=>sb?sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}):msg('الدخول غير مفعّل بعد: ضع بيانات Supabase في أول ملف auth.js.');
$('#a-guest').onclick=()=>{guest=true;save('guest',true);go('home')};

function logout(){
  Promise.resolve(sb&&sb.auth.signOut()).then(()=>{
    KEYS.forEach(k=>localStorage.removeItem(k));
    location.hash='';location.reload();
  });
}

/* ===== الصفحة الشخصية ===== */
const PT=[['info','البيانات الشخصية'],['results','سجل الاختبارات والنتائج'],['badges','إنجازاتي وشهاداتي'],['audio','إعدادات الصوت واللغة'],['site','إعدادات الموقع']];

function tabInfo(){
  const p=LS('profile',{});
  return `<div class="qbox"><h3>البيانات الشخصية</h3>
  <label>الاسم<input id="p-name" type="text" value="${esc(p.name||'')}"></label>
  <label>البريد<input type="text" value="${esc(user.email||'')}" disabled dir="ltr"></label>
  <label>بلدك<input id="p-country" type="text" value="${esc(p.country||'')}"></label>
  <label>لغتك الأم<input id="p-native" type="text" value="${esc(p.native||'')}"></label>
  <button class="btn gold" id="p-save">حفظ</button> <span class="hint" id="p-ok"></span></div>`;
}
function tabResults(){
  const h=LS('history',[]),lv=LS('level',0),dn=LS('done',{}),n=ORDER.filter(k=>dn[k]).length;
  return `<div class="qbox"><h3>سجل الاختبارات والنتائج</h3>
  <p>مستواك الحالي: <b>${lv?LV[lv][0]+' ('+LV[lv][1]+')':'لم تُجرِ اختبار المستوى بعد'}</b></p>
  <p>محطات الرحلة: <b>${n} من ${ORDER.length}</b></p>
  ${h.length?h.map(x=>`<div class="hrow"><b>${esc(x.n)}</b><span>${x.t==='level'?esc(x.l):x.p+'٪'}</span><small>${new Date(x.d).toLocaleDateString('ar')}</small></div>`).join(''):'<p class="hint">لا توجد نتائج بعد.</p>'}</div>`;
}
function tabBadges(){
  const b=LS('badges',{}),all=Object.keys(BADGES),got=all.filter(k=>b[k]).length,dn=LS('done',{});
  return `<div class="qbox"><h3>إنجازاتي وشهاداتي</h3><p class="hint">حصلت على ${got} من ${all.length} شارات</p>
  <div class="bgrid">${all.map(k=>{
    const [n,s,e,d]=BADGES[k];
    return `<div class="badge ${b[k]?'':'off'}">${s?`<img src="assets/img/badge-${s}.jpg" alt="" onerror="this.outerHTML='<span class=emo>${e}</span>'">`:`<span class="emo">${e}</span>`}<b>${n}</b><small>${d}</small></div>`}).join('')}</div>
  ${ORDER.every(k=>dn[k])?'<button class="btn gold" id="p-cert">اطبع شهادة إتمام الرحلة</button>':'<p class="hint">أنهِ المحطات الأربع لتحصل على شهادة.</p>'}</div>`;
}
function tabAudio(){
  const s=LS('settings',{}),r=s.rate||.8;
  const opt=(a,sel)=>a.map(([v,n])=>`<option value="${v}" ${sel(v)?'selected':''}>${n}</option>`).join('');
  return `<div class="qbox"><h3>إعدادات الصوت واللغة</h3>
  <label>سرعة النطق<select id="s-rate">${opt([['.6','بطيئة'],['.8','عادية'],['1','سريعة']],v=>+v===r)}</select></label>
  <label><input type="checkbox" id="s-auto" ${s.auto!==false?'checked':''}> قراءة ردود الخليل تلقائيًا</label>
  <label>لغة شرح الأزرار<select id="s-lang">${opt([['ar','العربية'],['en','English'],['hi','हिन्दी'],['ur','اردو']],v=>v===lang)}</select></label>
  <button class="btn ghost" id="s-test">جرّب الصوت</button></div>`;
}
function tabSite(){
  const f=LS('settings',{}).font||'normal';
  return `<div class="qbox"><h3>إعدادات الموقع</h3><p>حجم الخط</p>
  <div class="row wrap">${[['normal','عادي'],['large','كبير'],['xl','كبير جدًا']].map(([v,n])=>`<button class="btn ${f===v?'':'ghost'}" data-fs="${v}">${n}</button>`).join('')}</div>
  <p class="hint">لحذف تقدّمك وبدء من جديد:</p>
  <button class="btn ghost" id="p-reset">إعادة ضبط تقدّمي</button></div>`;
}
function renderProfile(){
  const w=$('#pwrap');
  if(!user){w.innerHTML='<div class="qbox"><p>سجّل الدخول لتظهر صفحتك وتُحفظ نتائجك.</p><button class="btn gold" onclick="go(\'login\')">تسجيل الدخول</button></div>';return}
  const tabs=PT.map(([k,n])=>`<button class="ptab ${k===ptab?'on':''}" data-p="${k}">${n}</button>`).join('')+'<button class="ptab out" id="p-out">تسجيل الخروج</button>';
  w.innerHTML=`<div class="ptabs">${tabs}</div>`+({info:tabInfo,results:tabResults,badges:tabBadges,audio:tabAudio,site:tabSite})[ptab]();
}
function cert(){
  const n=LS('profile',{}).name||(user.email||'').split('@')[0];
  const w=open('','_blank');if(!w)return alert('اسمح بالنوافذ المنبثقة لطباعة الشهادة.');
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>شهادة</title><style>body{font-family:serif;text-align:center;padding:60px;border:12px double #1F7A7A;margin:20px;color:#2B2B2B}h1{color:#1F7A7A;font-size:3rem}h2{font-size:2.4rem;color:#b8860b}</style><h1>شهادة إتمام</h1><p>تشهد منصة «عدسة الخليل» بأن</p><h2>${esc(n)}</h2><p>أتمّ رحلة عُمان بمحطاتها الأربع في تعلّم العربية</p><p>${new Date().toLocaleDateString('ar')}</p><script>onload=()=>print()<\/script>`);
  w.document.close();
}
$('#pwrap').addEventListener('click',e=>{
  const id=e.target.id,t=e.target.closest('[data-p]');
  if(t){ptab=t.dataset.p;return renderProfile()}
  if(id==='p-out')return logout();
  if(id==='p-save'){save('profile',{name:$('#p-name').value.trim(),country:$('#p-country').value.trim(),native:$('#p-native').value.trim()});$('#p-ok').textContent='تم الحفظ ✓'}
  if(id==='p-cert')cert();
  if(id==='s-test')sayAr('مَرْحَبًا بِكَ فِي عَدَسَةِ الخَلِيلِ',.8,false);
  if(e.target.dataset.fs){setSet('font',e.target.dataset.fs);renderProfile()}
  if(id==='p-reset'&&confirm('سيُحذف تقدّمك على هذا الجهاز وفي حسابك. متأكد؟')){
    ['done','level','list','history','badges'].forEach(k=>localStorage.removeItem(k));
    Promise.resolve(push()).then(()=>location.reload());
  }
});
$('#pwrap').addEventListener('change',e=>{
  const id=e.target.id;
  if(id==='s-rate')setSet('rate',+e.target.value);
  if(id==='s-auto')setSet('auto',e.target.checked);
  if(id==='s-lang'){$('#ui-lang').value=e.target.value;$('#ui-lang').dispatchEvent(new Event('change'))}
});

/* ===== التشغيل ===== */
async function initAuth(){
  applySet();
  if(sb){
    const {data}=await sb.auth.getSession();
    user=data.session?.user||null;
    sb.auth.onAuthStateChange((ev,s)=>{
      const was=user;user=s?.user||null;refresh();
      if(user&&!was){setTimeout(async()=>{await pull();renderProfile();if(fromOAuth||pageNow==='login')go('profile')},0)}
    });
    if(user)await pull();
  }
  refresh();renderProfile();
}
initAuth();