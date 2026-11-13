// عامل الخدمة: يخزّن واجهة الموقع لتعمل أسرع ويصح تثبيته كتطبيق. غيّر رقم الإصدار عند أي تحديث كبير.
const C='kl-v3',F=['./','index.html','style.css','app.js','quiz.js','auth.js','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(u).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api')||u.pathname.startsWith('/.netlify'))return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r)));
});