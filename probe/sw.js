// 极简缓存：首页 + 图标 + 二维码库。探针是纯静态页，离线必须能开。
const CACHE = 'pointer-tester-v9';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './vendor/qrcode.js',
                './icon-180.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // **导航请求走 network-first**：网页版改了版式，用户下次打开就该看到，而不是
  // 先被旧缓存喂一次、再开关一次才更新（v6.1/v6.2 连着踩了两回）。断网时回落缓存，
  // 所以「纯静态页离线也能开」这条不变。
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then((hit) => hit ||
        new Response('离线且没有缓存', { status: 503, headers: { 'Content-Type': 'text/plain' } })))
    );
    return;
  }
  // 其余静态资源仍然 cache-first：图标/二维码库不常变，走本地最快
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
