/* ◇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◇
   OBIVERSE NOSTR — Sovereign identity on the open web

   Zero dependencies for relay I/O.
   Uses @noble/secp256k1 + @noble/hashes for crypto
   (loaded as ES modules from esm.sh CDN).

   Every visitor gets a keypair. Post to public relays.
   Connect wallet later to bridge identities.
   ◇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◇ */

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

const STORAGE_KEY = 'obi-nostr';
const TAG = '[nostr]';

/* ━━━ CRYPTO (loaded dynamically) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let schnorr = null;
let sha256 = null;
let utils = null;
let cryptoReady = false;

async function loadCrypto() {
  if (cryptoReady) return;
  try {
    const secp = await import('https://esm.sh/@noble/secp256k1@2.2.3');
    const hashes = await import('https://esm.sh/@noble/hashes@1.7.1/sha256');
    schnorr = secp.schnorr;
    utils = secp.utils;
    sha256 = hashes.sha256;
    cryptoReady = true;
  } catch (e) {
    console.error(TAG, 'Failed to load crypto:', e);
  }
}

/* ━━━ BECH32 (npub/nsec encoding) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}

function bech32Encode(hrp, data5bit) {
  const hrpExpand = [];
  for (let i = 0; i < hrp.length; i++) hrpExpand.push(hrp.charCodeAt(i) >> 5);
  hrpExpand.push(0);
  for (let i = 0; i < hrp.length; i++) hrpExpand.push(hrp.charCodeAt(i) & 31);
  const values = hrpExpand.concat(data5bit).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ 1;
  const checksum = [];
  for (let i = 0; i < 6; i++) checksum.push((polymod >> (5 * (5 - i))) & 31);
  let result = hrp + '1';
  for (const d of data5bit.concat(checksum)) result += BECH32_CHARSET[d];
  return result;
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0, bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;
  for (const d of data) {
    acc = (acc << fromBits) | d;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }
  if (pad && bits > 0) result.push((acc << (toBits - bits)) & maxv);
  return result;
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function npubEncode(hexPubkey) {
  const data = Array.from(hexToBytes(hexPubkey));
  return bech32Encode('npub', convertBits(data, 8, 5, true));
}

/* ━━━ KEY MANAGEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function getStoredIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function storeIdentity(privkey, pubkey) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ privkey, pubkey }));
}

async function getOrCreateIdentity() {
  await loadCrypto();
  if (!cryptoReady) return null;

  let identity = getStoredIdentity();
  if (identity && identity.privkey && identity.pubkey) return identity;

  // Generate new keypair
  const privBytes = crypto.getRandomValues(new Uint8Array(32));
  const privkey = bytesToHex(privBytes);
  const pubBytes = schnorr.getPublicKey(privkey);
  const pubkey = bytesToHex(pubBytes);

  storeIdentity(privkey, pubkey);
  return { privkey, pubkey };
}

/* ━━━ NOSTR EVENT CREATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function serializeEvent(evt) {
  return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
}

async function createEvent(privkey, pubkey, kind, content, tags) {
  if (!cryptoReady) throw new Error('Crypto not loaded');

  const evt = {
    pubkey: pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: kind,
    tags: tags || [],
    content: content
  };

  // Compute event ID = sha256(serialized)
  const serialized = serializeEvent(evt);
  const encoder = new TextEncoder();
  const hashBytes = sha256(encoder.encode(serialized));
  evt.id = bytesToHex(hashBytes);

  // Sign with schnorr
  const sig = schnorr.sign(evt.id, privkey);
  evt.sig = bytesToHex(sig);

  return evt;
}

/* ━━━ RELAY CONNECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

class NostrRelay {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.subs = {};        // subscriptionId → callback
    this.connected = false;
    this.queue = [];        // messages to send once connected
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
      } catch (e) {
        reject(e);
        return;
      }

      this.ws.onopen = () => {
        this.connected = true;
        // Flush queued messages
        for (const msg of this.queue) this.ws.send(msg);
        this.queue = [];
        resolve();
      };

      this.ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && this.subs[data[1]]) {
            this.subs[data[1]](data[2]);
          } else if (data[0] === 'EOSE' && this.subs[data[1] + ':eose']) {
            this.subs[data[1] + ':eose']();
          } else if (data[0] === 'OK') {
            // Event publish acknowledgment
            if (this.subs['ok:' + data[1]]) this.subs['ok:' + data[1]](data[2], data[3]);
          }
        } catch (err) { /* ignore parse errors */ }
      };

      this.ws.onerror = () => {
        this.connected = false;
        reject(new Error('WebSocket error: ' + this.url));
      };

      this.ws.onclose = () => {
        this.connected = false;
      };
    });
  }

  send(msg) {
    const raw = JSON.stringify(msg);
    if (this.connected && this.ws && this.ws.readyState === 1) {
      this.ws.send(raw);
    } else {
      this.queue.push(raw);
    }
  }

  subscribe(filters, onEvent, onEose) {
    const id = 'sub_' + Math.random().toString(36).substr(2, 8);
    this.subs[id] = onEvent;
    if (onEose) this.subs[id + ':eose'] = onEose;
    this.send(['REQ', id, filters]);
    return id;
  }

  unsubscribe(id) {
    this.send(['CLOSE', id]);
    delete this.subs[id];
    delete this.subs[id + ':eose'];
  }

  publish(event) {
    return new Promise((resolve) => {
      this.subs['ok:' + event.id] = (success, msg) => {
        delete this.subs['ok:' + event.id];
        resolve({ success, msg });
      };
      this.send(['EVENT', event]);
      // Timeout: resolve anyway after 5s
      setTimeout(() => {
        if (this.subs['ok:' + event.id]) {
          delete this.subs['ok:' + event.id];
          resolve({ success: false, msg: 'timeout' });
        }
      }, 5000);
    });
  }

  close() {
    if (this.ws) this.ws.close();
    this.connected = false;
    this.subs = {};
  }
}

/* ━━━ RELAY POOL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

class RelayPool {
  constructor(urls) {
    this.relays = urls.map(u => new NostrRelay(u));
    this.connectedCount = 0;
  }

  async connect() {
    const results = await Promise.allSettled(this.relays.map(r => r.connect()));
    this.connectedCount = results.filter(r => r.status === 'fulfilled').length;
    return this.connectedCount;
  }

  subscribe(filters, onEvent, onEose) {
    const ids = [];
    const seen = new Set();
    const deduped = (evt) => {
      if (seen.has(evt.id)) return;
      seen.add(evt.id);
      onEvent(evt);
    };
    for (const relay of this.relays) {
      if (relay.connected) {
        ids.push({ relay, id: relay.subscribe(filters, deduped, onEose) });
      }
    }
    return ids;
  }

  async publish(event) {
    const results = await Promise.allSettled(
      this.relays.filter(r => r.connected).map(r => r.publish(event))
    );
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    return successes;
  }

  close() {
    for (const r of this.relays) r.close();
    this.connectedCount = 0;
  }
}

/* ━━━ HIGH-LEVEL API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

let pool = null;
let identity = null;

async function init() {
  identity = await getOrCreateIdentity();
  if (!identity) return { ok: false, error: 'crypto' };

  pool = new RelayPool(RELAYS);
  const connected = await pool.connect();
  if (connected === 0) return { ok: false, error: 'relays' };

  return {
    ok: true,
    pubkey: identity.pubkey,
    npub: npubEncode(identity.pubkey),
    relays: connected
  };
}

async function postNote(content) {
  if (!pool || !identity) throw new Error('Not initialized');
  if (!content || !content.trim()) throw new Error('Empty content');

  const evt = await createEvent(identity.privkey, identity.pubkey, 1, content.trim(), []);
  const relayCount = await pool.publish(evt);
  return { event: evt, relays: relayCount };
}

function fetchGlobalNotes(limit, onNote, onDone) {
  if (!pool) return;
  return pool.subscribe(
    { kinds: [1], limit: limit || 20 },
    onNote,
    onDone
  );
}

function fetchNotesByAuthor(pubkey, limit, onNote, onDone) {
  if (!pool) return;
  return pool.subscribe(
    { kinds: [1], authors: [pubkey], limit: limit || 20 },
    onNote,
    onDone
  );
}

function disconnect() {
  if (pool) pool.close();
  pool = null;
}

function getIdentity() {
  return identity;
}

function getNpub() {
  if (!identity) return null;
  return npubEncode(identity.pubkey);
}

/* ━━━ TIMESTAMP FORMATTING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function timeAgo(unixSeconds) {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

/* ━━━ EXPORTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export {
  init,
  postNote,
  fetchGlobalNotes,
  fetchNotesByAuthor,
  disconnect,
  getIdentity,
  getNpub,
  npubEncode,
  timeAgo,
  RELAYS
};
