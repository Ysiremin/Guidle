// ============================================================
// LOOT.JS — Etkileşimli loot toplama sistemi
// Hover (PC) veya dokunma (Mobile) ile toplama
// ============================================================

const PICKUP_RADIUS   = 48;   // px — bu yarıçap içinde toplama tetiklenir
const LOOT_LIFETIME   = 15000; // ms — toplanmazsa otomatik kaybolur (inventory'e eklenir)
const COMBAT_DROP_CHANCE = 0.06; // Saldırı başına %6 combat drop şansı

// Aktif loot öğeleri
let activeLootItems = [];

// ============ BAŞLAT ============
function initLootSystem() {
  document.addEventListener('mousemove', _onMouseMove);
  document.addEventListener('touchmove', _onTouchMove, { passive: true });
}

function _onMouseMove(e) {
  _pickupNearby(e.clientX, e.clientY);
}

function _onTouchMove(e) {
  for (let t = 0; t < e.touches.length; t++) {
    _pickupNearby(e.touches[t].clientX, e.touches[t].clientY);
  }
}

// ============ TOPLAMA KONTROLÜ ============
function _pickupNearby(cx, cy) {
  for (let i = activeLootItems.length - 1; i >= 0; i--) {
    const item = activeLootItems[i];
    if (item.collecting || item.settling) continue;
    const rect = item.el.getBoundingClientRect();
    const lx = rect.left + rect.width  / 2;
    const ly = rect.top  + rect.height / 2;
    if (Math.hypot(cx - lx, cy - ly) < PICKUP_RADIUS) {
      _collectLoot(i);
    }
  }
}

function _collectLoot(index) {
  const item = activeLootItems[index];
  item.collecting = true;
  clearTimeout(item.expireTimer);

  // Inventory'e ekle
  if (item.type === 'gold') {
    gameState.inventory.gold     += item.amount;
    gameState.stats.totalGold    += item.amount;
    _bounceGold();
  } else {
    gameState.inventory[item.type] = (gameState.inventory[item.type] || 0) + item.amount;
  }

  activeLootItems.splice(index, 1);
  renderInventory();
  _animateCollect(item.el, item.type);
}

function _bounceGold() {
  const el = document.getElementById('gold-amount');
  if (!el) return;
  el.classList.add('gold-bounce');
  setTimeout(() => el.classList.remove('gold-bounce'), 360);
}

function _animateCollect(el, type) {
  const targetId = { gold: 'gold-amount', wood: 'wood-amount', leather: 'leather-amount', iron: 'iron-amount' }[type] || 'gold-amount';
  const targetEl = document.getElementById(targetId);

  el.style.transition = 'none';
  el.classList.add('loot-collecting');

  if (targetEl) {
    const tr = targetEl.getBoundingClientRect();
    const lr = el.getBoundingClientRect();
    const dx = (tr.left + tr.width  / 2) - (lr.left + lr.width  / 2);
    const dy = (tr.top  + tr.height / 2) - (lr.top  + lr.height / 2);
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.32s ease-in, opacity 0.32s ease-in';
      el.style.transform  = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2)`;
      el.style.opacity    = '0';
    });
  } else {
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
      el.style.transform  = 'translate(-50%, -50%) scale(0)';
      el.style.opacity    = '0';
    });
  }
  setTimeout(() => el.remove(), 370);
}

// ============ CANAVAR ÖLÜM LOOТУ ============
function spawnKillLoot(loot, monster) {
  const wrap = document.getElementById('monster-emoji-wrap');
  if (!wrap) return;
  const r  = wrap.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;

  const items = [];

  // Altın — birden fazla coin
  if (loot.gold > 0) {
    const coinCount = Math.min(6, Math.max(2, Math.ceil(loot.gold / 15)));
    const base = Math.floor(loot.gold / coinCount);
    const rem  = loot.gold - base * coinCount;
    for (let i = 0; i < coinCount; i++) {
      items.push({ type: 'gold', amount: base + (i === 0 ? rem : 0), emoji: '💰' });
    }
  }

  // Materyaller
  const bossBonus    = monster.isBoss    ? 3 : monster.isMinibow ? 1 : 0;
  const ironBossBonus= monster.isBoss    ? 2 : 0;
  if (loot.woodChance    && Math.random() < loot.woodChance)    items.push({ type: 'wood',    amount: 1 + bossBonus,     emoji: '🪵' });
  if (loot.leatherChance && Math.random() < loot.leatherChance) items.push({ type: 'leather', amount: 1 + bossBonus,     emoji: '🟤' });
  if (loot.ironChance    && Math.random() < loot.ironChance)    items.push({ type: 'iron',    amount: 1 + ironBossBonus, emoji: '⚙️' });

  // Saçılı spawn (farklı açı & mesafelerle)
  items.forEach((item, i) => {
    setTimeout(() => _spawnItem(item.type, item.amount, item.emoji, cx, cy, false), i * 65);
  });
}

// ============ COMBAT DROP ============
function spawnCombatDrop() {
  const wrap = document.getElementById('monster-emoji-wrap');
  if (!wrap) return;
  const r  = wrap.getBoundingClientRect();
  const cx = r.left + r.width  / 2;
  const cy = r.top  + r.height / 2;

  const roll = Math.random();
  if      (roll < 0.50) _spawnItem('gold',    1 + Math.floor(Math.random() * 3), '💰', cx, cy, true);
  else if (roll < 0.65) _spawnItem('wood',    1, '🪵', cx, cy, true);
  else if (roll < 0.78) _spawnItem('leather', 1, '🟤', cx, cy, true);
  else if (roll < 0.88) _spawnItem('iron',    1, '⚙️', cx, cy, true);
  // %12 — düşmüyor
}

// ============ ITEM SPAWN ============
function _spawnItem(type, amount, emoji, cx, cy, isSmall) {
  const el = document.createElement('div');
  el.className = `loot-item${isSmall ? ' loot-small' : ''}`;

  const iconEl = document.createElement('span');
  iconEl.className = 'loot-icon';
  iconEl.textContent = emoji;
  el.appendChild(iconEl);

  if (amount > 1) {
    const badge = document.createElement('span');
    badge.className = 'loot-badge';
    badge.textContent = `+${amount}`;
    el.appendChild(badge);
  }

  // Başlangıç: canavar merkezinden
  el.style.cssText = `left:${cx}px; top:${cy}px; transform:translate(-50%,-50%) scale(0); position:fixed; z-index:601;`;
  document.body.appendChild(el);

  // Hedef konum: rastgele saçılma
  const angle = Math.random() * Math.PI * 2;
  const minD  = isSmall ? 28 : 55;
  const maxD  = isSmall ? 75 : 130;
  const dist  = minD + Math.random() * (maxD - minD);
  const tx    = cx + Math.cos(angle) * dist;
  const ty    = cy + Math.sin(angle) * dist;

  // Settling flag — animasyon biterken toplamayı engelle
  const lootRef = { el, type, amount, expireTimer: null, collecting: false, settling: true };
  activeLootItems.push(lootRef);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.transition = `left .5s cubic-bezier(.34,1.56,.64,1), top .5s cubic-bezier(.34,1.56,.64,1), transform .4s cubic-bezier(.34,1.56,.64,1)`;
    el.style.left      = `${tx}px`;
    el.style.top       = `${ty}px`;
    el.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => { lootRef.settling = false; }, 550);
  }));

  // Expire — toplanmazsa yavaşça kaybolur, inventory'e eklenir
  lootRef.expireTimer = setTimeout(() => _expireLoot(lootRef), LOOT_LIFETIME);
}

// ============ SÜRESİ DOLAN LOOT ============
function _expireLoot(lootRef) {
  const idx = activeLootItems.indexOf(lootRef);
  if (idx !== -1) activeLootItems.splice(idx, 1);

  // Yine de inventory'e ekle (israf olmasın)
  if (typeof gameState !== 'undefined') {
    if (lootRef.type === 'gold') {
      gameState.inventory.gold  += lootRef.amount;
      gameState.stats.totalGold += lootRef.amount;
    } else {
      gameState.inventory[lootRef.type] = (gameState.inventory[lootRef.type] || 0) + lootRef.amount;
    }
    renderInventory();
  }

  const el = lootRef.el;
  el.style.transition = 'opacity .7s ease, transform .7s ease';
  el.style.opacity    = '0';
  el.style.transform  = 'translate(-50%,-50%) scale(.4)';
  setTimeout(() => el.remove(), 750);
}

// ============ TOPLU TEMİZLE ============
function clearAllLoot() {
  for (const item of activeLootItems) {
    clearTimeout(item.expireTimer);
    item.el.remove();
  }
  activeLootItems = [];
}
