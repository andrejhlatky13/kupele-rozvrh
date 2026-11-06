const C='kr-v3';const F=['./','index.html','style.css','app.js','icon.svg','manifest.webmanifest','seed-ciz.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>l[0]?l[0].focus():clients.openWindow('./')))});
self.addEventListener('message',e=>{if(e.data&&e.data.show){self.registration.showNotification(e.data.title,{body:e.data.body,tag:e.data.tag,icon:'icon.svg',vibrate:[300,100,300],requireInteraction:true})}});
