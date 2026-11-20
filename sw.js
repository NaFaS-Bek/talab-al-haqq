/* The release packager replaces the following declaration with verified hashes. */
const RELEASE = null;
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
