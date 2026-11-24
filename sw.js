/* The release packager replaces the following declaration with verified hashes. */
const RELEASE = {"resources":{"TANZIL-LICENSE.txt":"72493509d507314f60c018fd33aa57d9064a0de42be8926745e4953f59925c62","about-tg.html":"fa6657996229c363e7c28e5555b90c81898a32577b52561461689bfbcba62760","about.html":"1c4a339d9d33b4ccf103329b05a5817a30a4b8c74222b030f37f50d65751c9a6","app.js":"e3e25a7812b019c4c2453105884761c2e1fcb3d6a85267b781abc80bf8bdaccb","arabic-reading-signs.html":"af4d5f8c1d9b4332f43686f51cdd141f5024b9aa1eff4276312ab1c7cdd9e3a4","data/caliph_history.json":"06cb2441265071050bebd69102acfc0177d079db3591a4c29ef47118a4e8514b","data/content.json":"276233a206d6d981be13e0edcb611c5d9557ecf39b9690b8ce4b0fcca773a6af","family-child-rights.html":"e9e4d859b46949bf222868b282b9ce7df75526c5acc7fe4933497c655d3c5349","family-child-safety.html":"115d9f07cbd23c92a3960641be0e5a0ccb84fefb27073f23e2f82d7bb8dea0b5","family-children.html":"e2f83007ca5c6170c823455c3b4115d816d353127f02c8546df88cbd7728810c","family-custody.html":"c1d2f8e28d4563dd9a513cdf464bb6cce8f9b56fe04a3bf6ca1a2030d8adc427","family-difficult-passages.html":"db4d4eee989d04cd42550697b5b65352ed08e8aab456fd6caaf177ffb9b80498","family-filial-duties.html":"4f5682837f63443b33f64dfd05f44181b049cdf69b3cfc7253c479816a8fcb44","family-mahr.html":"323bac5a212ceec385393b22659a5a7598bb1a12c82723bf1e462da17eb4f709","family-nikah.html":"236d05c85cdf6daaf7d2bf19bf961daeac5bb5fdab9197d6ea54d993cb9c935b","family-parent-duties.html":"e83c2e6cdece748e409d1367827ed6b6168cb7c740c93cb8e35ec393ec8b49b5","family-prophetic-example.html":"47207c8027fc13985d626ac8d4fac70dfbbec68dc5baed3eba53237f633eb3b7","family-rights.html":"ee5bdf505870773f040a5b27e9dbdfbdd0bc335a701d4ac95a694e4b1ad6ed59","family-teen-dialogue.html":"19f6a11298ba034aa051e1fbea1eb84489122de9e272838a2f38c110ef4b2b8b","five-pillars.html":"12add840b4cc435153727f929d01fcbee737d171474b526b727680fe4975384c","fonts/Amiri-Regular.ttf":"ab391c4147d054c48976e98322ad0eefe1427aa0e0502a12a4c75d80a70cfcd7","fonts/NotoSans-Regular.ttf":"bfb7bb691513f12e734dc346c03a03f784912432d7e3fa8e56efcf906fe86b3d","i18n.js":"cfd2b5503c5e308aa4c2a1fa2b74c83ca9feb7a94288f0e5cc7b452a9d58daa9","icon.svg":"c0eef5c9d4af053f85c891fcf1c9c87218896c4ce01c12db84b60ce60d15a378","icons/Icon-192.png":"226c456396eaf25a4f37c5a87ade4a66859c68f06e21875c3fd4a0007345b1cb","icons/Icon-512.png":"ed87401fc3f2f816a898824f7ed5f5e956c9491c4fbacbc5a45582ebff72ee2b","icons/Icon-maskable-512.png":"1fdf59ce235975b3535270988f0635ea02e6a3a1760d0ad263ebe3df7994ca40","icons/apple-touch-icon.png":"dafe9f567c5117112bd4391dbfc2e92dbc6cfbbe0e273f589223fa5af17c7571","index.html":"b1d5d24c686b184601c7c3fa5312aee27b16ed05b5d82ba6b49109c4a06ceff1","manifest.webmanifest":"aea91513a5afb66d3f85f4ad180462780837543bed06f3c30790208abbf11fe7","pillar-hajj.html":"1fa8483ed9edc69edfc53d18854bcfe7e66864632ef6bcfcd28b7d1e53814556","pillar-salah.html":"f8f160389bb63ca9b1aedc01d9d4fb7179a49bb1ea2107726462b79be71942a9","pillar-sawm.html":"3b1c362202c34d01b968309ce50a7141bdb19ea1ba585f7fcf39c5885509b483","pillar-shahada.html":"f62efec40a3ede137636787971ab64316cc60e1b075c2d7eabb27e0a4f1be258","pillar-zakat.html":"96e37808889d0576b276a33515fb93a7a1b1d5a0e1a679fc799ec3e431f7a99c","pillars-common.css":"1adf667f7bfa67a0ae299c1e04cead45eff15e59af3716d429bd849def414285","salah-steps.html":"b740db52b46b8df1e54e565fe28d3ac1951d51623c438d58a7c67df58f40a856","stories-tg.html":"666fe38b54149e2d127b039c58a419f385dcd2bace6814ed85c91c78d6f87bb9","stories.html":"348fd2001b8da315e099d2d782b9ebdfa8c9bd8ebc635efc10e1a9b63c00087b","style.css":"ce630065c78d4c7e8bd476538360a7d607ab10459720610a250eb1b5a3160ad5","wudu-steps.html":"9003959b7d8156f85d776473b3a96d643b28170d6d954b536f4e2bb101cefc75"},"version":"64d9a4f4a2f4321e6875e739f4d0c622b446599df3d9a028f2744271bd1e2671"};
const PREFIX = `nfs-dua-preview-v1:${self.registration.scope}:`;
const META_CACHE = `${PREFIX}clients`;
const READY_URL = new URL("__nfs_pwa_ready__", self.registration.scope).href;
const cacheName = (version) => `${PREFIX}content:${version}`;
const assetUrl = (path) => new URL(path, self.registration.scope).href;
const LEGACY_CACHE = "nfs-dua-preview-v1";
const LEGACY_INDEX_SHA = "b9998022c86ac6fccead503dd96af8dca41db751302b07f0a454c1c752e74910";
const MIGRATION_PENDING_URL = assetUrl("__nfs_pwa_migration__/pending");
const MIGRATION_DONE_URL = assetUrl("__nfs_pwa_migration__/completed");

async function legacyMigrationNeeded() {
  const meta = await caches.open(META_CACHE);
  if (await meta.match(MIGRATION_DONE_URL)) return false;
  if (!(await caches.keys()).includes(LEGACY_CACHE)) return false;
  const legacy = await caches.open(LEGACY_CACHE);
  const index = await legacy.match(assetUrl("index.html"));
  if (!index) return false;
  const digest = await crypto.subtle.digest("SHA-256", await index.arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  return hash === LEGACY_INDEX_SHA;
}

async function migrateLegacyClients() {
  const meta = await caches.open(META_CACHE);
  const pending = await meta.match(MIGRATION_PENDING_URL);
  if (!pending || await pending.text() !== RELEASE.version || !(await legacyMigrationNeeded())) return;
  const scope = new URL(self.registration.scope);
  const targets = [];
  for (const client of await self.clients.matchAll({ type: "window", includeUncontrolled: true })) {
    const url = new URL(client.url);
    if (url.origin === scope.origin && url.pathname.startsWith(scope.pathname) && !(await clientVersion(client.id))) {
      targets.push(client);
    }
  }
  // Commit before reloading. Later releases retain the normal voluntary update.
  await meta.put(MIGRATION_DONE_URL, new Response(RELEASE.version));
  await meta.delete(MIGRATION_PENDING_URL);
  for (const client of targets) {
    // Do not await navigation inside activate: its fetch waits for activation.
    // Preserve query/hash and every localStorage key; only the legacy shell moves.
    // Navigating to the identical URL with a fragment can be a same-document
    // hash navigation. A temporary appended query token forces a real document
    // load; the new shell immediately removes just that token with replaceState.
    const hashAt = client.url.indexOf("#");
    const base = hashAt < 0 ? client.url : client.url.slice(0, hashAt);
    const fragment = hashAt < 0 ? "" : client.url.slice(hashAt);
    const target = base + (base.includes("?") ? "&" : "?") + "__nfs_legacy_migration=" + RELEASE.version + fragment;
    client.navigate(target).catch(() => {});
  }
}

async function releaseInfo(version) {
  if (!version || !/^[a-f0-9]{64}$/.test(version)) return null;
  const cache = await caches.open(cacheName(version));
  const marker = await cache.match(READY_URL);
  return marker ? marker.json() : null;
}

async function notify(message) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of windows) client.postMessage(message);
}

async function verifiedResponse(path, expectedHash) {
  const response = await fetch(assetUrl(path), {
    cache: "reload", credentials: "same-origin", redirect: "follow"
  });
  if (!response.ok || response.type === "opaque") throw new Error(`Resource unavailable: ${path}`);
  if (response.url && !response.url.startsWith(self.registration.scope)) throw new Error(`Resource left the app scope: ${path}`);
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (hash !== expectedHash) throw new Error(`Resource changed during installation: ${path}`);
  // Navigations use redirect mode "manual". A fetched Cloudflare HTML redirect
  // must become a plain verified response before it is served from the cache.
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  return new Response(bytes, { status: response.status, statusText: response.statusText, headers });
}

async function installRelease() {
  if (!RELEASE) throw new Error("The offline release manifest has not been prepared");
  if (await releaseInfo(RELEASE.version)) return;
  const pendingName = `${PREFIX}pending:${RELEASE.version}`;
  await caches.delete(pendingName);
  const pending = await caches.open(pendingName);
  let complete = 0;
  try {
    for (const [path, hash] of Object.entries(RELEASE.resources)) {
      await pending.put(assetUrl(path), await verifiedResponse(path, hash));
      complete += 1;
      await notify({ type: "NFS_PWA_PROGRESS", version: RELEASE.version,
        completed: complete, total: Object.keys(RELEASE.resources).length });
    }
    const ready = await caches.open(cacheName(RELEASE.version));
    for (const path of Object.keys(RELEASE.resources)) {
      await ready.put(assetUrl(path), await pending.match(assetUrl(path)));
    }
    // This marker is committed last. A failed installation never becomes ready.
    await ready.put(READY_URL, new Response(JSON.stringify(RELEASE), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    if (!(await releaseInfo(RELEASE.version))) await caches.delete(cacheName(RELEASE.version));
    throw error;
  } finally {
    await caches.delete(pendingName);
  }
}

function clientUrl(id) {
  return assetUrl(`__nfs_pwa_client__/${encodeURIComponent(id)}`);
}

async function bindClient(id, version) {
  if (!id) return;
  const meta = await caches.open(META_CACHE);
  await meta.put(clientUrl(id), new Response(version));
}

async function clientVersion(id) {
  if (!id) return null;
  const meta = await caches.open(META_CACHE);
  const value = await meta.match(clientUrl(id));
  return value ? value.text() : null;
}

async function removeUnusedCaches() {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const protectedVersions = new Set([RELEASE.version]);
  for (const client of windows) {
    const version = await clientVersion(client.id);
    // An unbound page may still be loading an older release. Keep its caches.
    if (!version) return;
    protectedVersions.add(version);
  }
  const contentPrefix = `${PREFIX}content:`;
  const candidates = (await caches.keys()).filter((name) => name.startsWith(contentPrefix));
  // Retain two additional complete releases for in-flight navigations.
  for (const name of candidates.slice(-2)) protectedVersions.add(name.slice(contentPrefix.length));
  for (const name of candidates) {
    if (!protectedVersions.has(name.slice(contentPrefix.length))) await caches.delete(name);
  }
  const liveIds = new Set(windows.map((client) => client.id));
  const meta = await caches.open(META_CACHE);
  for (const request of await meta.keys()) {
    if (!request.url.startsWith(assetUrl("__nfs_pwa_client__/"))) continue;
    const id = decodeURIComponent(new URL(request.url).pathname.split("/").pop());
    if (!liveIds.has(id)) await meta.delete(request);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    await installRelease();
    // The archived shell has no update prompt. Migrate this exact edition once,
    // only after the complete verified release has been committed successfully.
    if (await legacyMigrationNeeded()) {
      const meta = await caches.open(META_CACHE);
      await meta.put(MIGRATION_PENDING_URL, new Response(RELEASE.version));
      await self.skipWaiting();
    }
  })().catch(async (error) => {
    await notify({ type: "NFS_PWA_INSTALL_ERROR", version: RELEASE?.version });
    throw error;
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await removeUnusedCaches();
    await self.clients.claim();
    await migrateLegacyClients();
    await notify({ type: "NFS_PWA_ACTIVATED", version: RELEASE.version });
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "NFS_PWA_ACTIVATE") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type === "NFS_PWA_STATUS") {
    event.waitUntil((async () => {
      const id = event.source?.id;
      let version = await clientVersion(id);
      if (!version) {
        version = RELEASE?.version;
        if (version) await bindClient(id, version);
      }
      const info = await releaseInfo(version);
      const cache = info ? await caches.open(cacheName(version)) : null;
      const resources = info ? await Promise.all(Object.keys(info.resources).map((path) => cache.match(assetUrl(path)))) : [];
      const complete = info && resources.every(Boolean);
      event.ports[0]?.postMessage({ state: complete ? "ready" : "error", version,
        activeVersion: RELEASE?.version, total: info ? Object.keys(info.resources).length : 0 });
    })());
  }
});

async function serve(event) {
  const navigation = event.request.mode === "navigate";
  const version = navigation ? RELEASE.version : (await clientVersion(event.clientId) || RELEASE.version);
  const info = await releaseInfo(version);
  if (!info) return new Response("Офлайн-материалы недоступны. Подключитесь к интернету и обновите Талаб аль-Хакк.", { status: 503 });
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  const requestedPath = decodeURI(url.pathname.slice(scope.pathname.length));
  let path = requestedPath;
  if (navigation && !(path in info.resources)) {
    path = `${requestedPath}.html` in info.resources ? `${requestedPath}.html` : "index.html";
  }
  if (!(path in info.resources)) return fetch(event.request);
  const cache = await caches.open(cacheName(version));
  let response = await cache.match(assetUrl(path));
  if (!response) {
    try {
      response = await verifiedResponse(path, info.resources[path]);
      await cache.put(assetUrl(path), response.clone());
    } catch (_) {
      await notify({ type: "NFS_PWA_CACHE_ERROR", version });
      return new Response("Для восстановления материала подключитесь к интернету и обновите Талаб аль-Хакк.", { status: 503 });
    }
  }
  if (navigation) await bindClient(event.resultingClientId || event.clientId, version);
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (event.request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(serve(event));
});
