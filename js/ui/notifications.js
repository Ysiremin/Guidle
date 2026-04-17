// ============================================================
// UI/NOTIFICATIONS.JS — Bildirimler, efektler, animasyonlar
// ============================================================

function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `notification notif-${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ============ HASAR SAYISI - CANAVAR ============
function showDamageNumber(damage, isClick = false, isSkill = false) {
  const area = document.getElementById('monster-area');
  if (!area) return;

  const el = document.createElement('div');
  el.className = `damage-number ${isClick ? 'click-dmg' : ''} ${isSkill ? 'skill-dmg' : ''}`;
  el.textContent = `-${damage}`;

  const x = 25 + Math.random() * 50;
  el.style.left = `${x}%`;
  el.style.top = `${35 + Math.random() * 15}%`;
  area.appendChild(el);

  setTimeout(() => el.classList.add('fly'), 10);
  setTimeout(() => el.remove(), 1200);
}

// ============ KARAKTER HASAR EFEKTİ ============
function showCharacterDamage(charId, damage) {
  const icon = document.getElementById(`char-icon-${charId}`);
  if (!icon) return;
  icon.classList.add('shake');
  setTimeout(() => icon.classList.remove('shake'), 400);

  const el = document.createElement('div');
  el.className = 'char-damage-number';
  el.textContent = `-${damage}`;
  icon.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ============ SLASH EFEKTİ ============
function showSlashEffect(type = 'auto') {
  const area = document.getElementById('monster-area');
  if (!area) return;

  const el = document.createElement('div');
  el.className = `slash-effect slash-${type}`;

  // Rastgele pozisyon (canavarın üstünde)
  const x = 20 + Math.random() * 55;
  const y = 25 + Math.random() * 30;
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;

  // Rastgele açı varyasyonu
  const baseAngle = type === 'click' ? -38 : -30;
  const angle = baseAngle + (Math.random() * 20 - 10);
  el.style.setProperty('--slash-angle', `${angle}deg`);

  area.appendChild(el);
  setTimeout(() => el.classList.add('slash-anim'), 10);
  setTimeout(() => el.remove(), 400);
}

// ============ CANAVAR SALLANTISI (auto attack için) ============
function showMonsterShake() {
  const sprite = document.getElementById('monster-sprite');
  if (!sprite) return;
  sprite.classList.add('shake');
  setTimeout(() => sprite.classList.remove('shake'), 380);
}

// ============ LOOT BİLDİRİMİ ============
function showLootNotification(gold, materials) {
  let parts = [`+${gold}💰`];
  if (materials.wood)    parts.push(`+${materials.wood}🪵`);
  if (materials.leather) parts.push(`+${materials.leather}🟤`);
  if (materials.iron)    parts.push(`+${materials.iron}⚙️`);
  showNotification(parts.join('  '), 'loot');
}

// ============ CANAVAR ÖLÜM EFEKTİ ============
function showKillEffect(loot, monsterData) {
  const monsterArea = document.getElementById('monster-area');
  const emojiWrap   = document.getElementById('monster-emoji-wrap');
  if (!monsterArea || !emojiWrap) return;

  // 1) Beyaz flaş (ölüm ışıması)
  const flash = document.createElement('div');
  flash.className = 'death-flash';
  emojiWrap.appendChild(flash);
  setTimeout(() => flash.remove(), 500);

  // 2) Kill text
  const killEl = document.createElement('div');
  killEl.className = 'kill-text';
  const killTexts = ['SMASHED!', 'DEFEATED!', 'DESTROYED!', 'CRUSHED!'];
  killEl.textContent = killTexts[Math.floor(Math.random() * killTexts.length)];
  monsterArea.appendChild(killEl);
  setTimeout(() => killEl.remove(), 950);

  // 3) Boss / miniboss ise ekran sarsıntısı
  const gameRoot = document.getElementById('game-root');
  if (gameRoot && monsterData && (monsterData.isBoss || monsterData.isMinibow)) {
    gameRoot.classList.add('shake');
    setTimeout(() => gameRoot.classList.remove('shake'), 400);
  }

  // Not: Loot partikelleri artık js/loot.js tarafından
  // interaktif toplanabilir itemlar olarak oluşturuluyor.
}

// ============ LOOT PARTICLES ============
function spawnLootParticles(loot, sourceEl, targetEl) {
  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  // Kaynaktan merkez koordinatları
  const sx = sourceRect.left + sourceRect.width / 2;
  const sy = sourceRect.top + sourceRect.height / 2;
  // Hedef merkez
  const tx = targetRect.left + targetRect.width / 2;
  const ty = targetRect.top + targetRect.height / 4;

  // Hangi loot düşecek?
  const particles = [];
  const goldCount = Math.min(5, Math.max(2, Math.floor(loot.gold / 20)));
  for (let i = 0; i < goldCount; i++) particles.push('💰');
  if (loot.woodChance  && Math.random() < 0.8) particles.push('🪵');
  if (loot.leatherChance && Math.random() < 0.8) particles.push('🟤');
  if (loot.ironChance  && Math.random() < 0.8) particles.push('⚙️');

  particles.forEach((emoji, idx) => {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'loot-particle';
      p.textContent = emoji;

      // Başlangıç: canavar pozisyonu + küçük rastgele spread
      const startX = sx + (Math.random() - 0.5) * 40;
      const startY = sy + (Math.random() - 0.5) * 30;
      p.style.left = `${startX}px`;
      p.style.top  = `${startY}px`;
      p.style.transform = 'translate(-50%, -50%) scale(0)';
      document.body.appendChild(p);

      // Fırlatma yönü (önce yukarı-rastgele, sonra hedefe)
      const midX = startX + (Math.random() - 0.5) * 80;
      const midY = startY - 60 - Math.random() * 50;

      animateLootParticle(p, startX, startY, midX, midY, tx, ty);
    }, idx * 55);
  });
}

function animateLootParticle(el, sx, sy, mx, my, tx, ty) {
  const duration = 750;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);

    let x, y, scale, opacity;

    if (t < 0.4) {
      // Faze 1: yukarı fırla (0 → 0.4)
      const p = t / 0.4;
      x = lerp(sx, mx, easeOut(p));
      y = lerp(sy, my, easeOut(p));
      scale = lerp(0, 1.2, easeOut(p));
      opacity = 1;
    } else {
      // Faze 2: hedefe süzül (0.4 → 1.0)
      const p = (t - 0.4) / 0.6;
      x = lerp(mx, tx, easeIn(p));
      y = lerp(my, ty, easeIn(p));
      scale = lerp(1.2, 0.5, p);
      opacity = lerp(1, 0, Math.max(0, (p - 0.6) / 0.4));
    }

    el.style.left      = `${x}px`;
    el.style.top       = `${y}px`;
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    el.style.opacity   = opacity;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(step);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 2); }
function easeIn(t)  { return t * t; }

// ============ OFFLİNE POPUP ============
function showOfflinePopup(earnings) {
  const popup = document.getElementById('offline-popup');
  if (!popup) return;

  document.getElementById('offline-time').textContent =
    `${earnings.hours}s ${earnings.minutes}dk`;
  document.getElementById('offline-gold').textContent = `+${earnings.gold} 💰`;
  const w = document.getElementById('offline-wood');
  const l = document.getElementById('offline-leather');
  const i = document.getElementById('offline-iron');
  if (w) w.textContent = earnings.wood > 0     ? `+${earnings.wood} 🪵`    : '';
  if (l) l.textContent = earnings.leather > 0  ? `+${earnings.leather} 🟤` : '';
  if (i) i.textContent = earnings.iron > 0     ? `+${earnings.iron} ⚙️`    : '';

  popup.classList.add('show');
}

function collectOfflineEarnings() {
  const popup = document.getElementById('offline-popup');
  const goldEl    = document.getElementById('offline-gold');
  const woodEl    = document.getElementById('offline-wood');
  const leatherEl = document.getElementById('offline-leather');
  const ironEl    = document.getElementById('offline-iron');

  const gold    = goldEl    ? parseInt(goldEl.textContent.replace(/\D/g,''))    || 0 : 0;
  const wood    = woodEl    ? parseInt(woodEl.textContent.replace(/\D/g,''))    || 0 : 0;
  const leather = leatherEl ? parseInt(leatherEl.textContent.replace(/\D/g,'')) || 0 : 0;
  const iron    = ironEl    ? parseInt(ironEl.textContent.replace(/\D/g,''))    || 0 : 0;

  applyOfflineEarnings({ gold, wood, leather, iron });
  if (popup) popup.classList.remove('show');
}

// ============ YENİLGİ / CANLANMA EKRANI ============
function showDefeatScreen()  { const s = document.getElementById('defeat-screen'); if (s) s.classList.add('show'); }
function hideDefeatScreen()  { const s = document.getElementById('defeat-screen'); if (s) s.classList.remove('show'); }

// ============ CHAPTER UNLOCK TOAST (soldan kayar) ============
let chapterUnlockToastTimer = null;

function showChapterUnlockToast(chapter) {
  const toast    = document.getElementById('chapter-unlock-toast');
  const monster  = MONSTERS[chapter];
  if (!toast || !monster) return;

  // DOM doldur
  const g = (id) => document.getElementById(id);
  if (g('cuttoast-emoji'))   g('cuttoast-emoji').textContent   = monster.emoji;
  if (g('cuttoast-chapter')) g('cuttoast-chapter').textContent = `Bölüm ${chapter}`;
  if (g('cuttoast-monster')) g('cuttoast-monster').textContent = monster.name;
  if (g('cuttoast-region'))  g('cuttoast-region').textContent  = monster.region;

  // "Git" butonu
  const goBtn = g('cuttoast-go-btn');
  if (goBtn) {
    goBtn.textContent = `→ Bölüm ${chapter}'e Git`;
    goBtn.onclick = () => {
      switchChapter(chapter);
      hideChapterUnlockToast();
      clearNewChapterUnlock(chapter);
    };
  }

  // Toast'u göster
  toast.classList.add('visible');

  // 8sn sonra otomatik kapat
  clearTimeout(chapterUnlockToastTimer);
  chapterUnlockToastTimer = setTimeout(hideChapterUnlockToast, 8000);
}

function hideChapterUnlockToast() {
  const toast = document.getElementById('chapter-unlock-toast');
  if (toast) toast.classList.remove('visible');
  clearTimeout(chapterUnlockToastTimer);
}

// ============ CHAPTER BAR — YENİ UNLOCK PULSE ============
function markNewChapterUnlock(chapter) {
  // gameState Set'e ekle (bar rebuild'de kaybolmasın)
  if (gameState && gameState.pendingNewUnlocks) {
    gameState.pendingNewUnlocks.add(chapter);
  }
  // DOM'da zaten render edildiyse direkt class ekle
  const item = document.getElementById(`cb-item-${chapter}`);
  if (item) item.classList.add('cb-new-unlock');
}

function clearNewChapterUnlock(chapter) {
  if (gameState && gameState.pendingNewUnlocks) {
    gameState.pendingNewUnlocks.delete(chapter);
  }
  const item = document.getElementById(`cb-item-${chapter}`);
  if (item) item.classList.remove('cb-new-unlock');
}

// ============ UPGRADE TOAST ============
let upgradeToastTimer   = null;
let upgradeToastCharId  = null;
let upgradeToastSlot    = null;
let upgradeToastSnoozed = false;  // 'X' butonu ile kapatıldıysa bir süre gösterme
let upgradeToastSnoozeUntil = 0;

function checkAndShowUpgradeToast() {
  const now = Date.now();
  if (upgradeToastSnoozed && now < upgradeToastSnoozeUntil) return;
  upgradeToastSnoozed = false;

  // Toast zaten açıksa güncelle (materyal değişmiş olabilir)
  const toast = document.getElementById('upgrade-toast');
  if (toast && toast.classList.contains('visible')) {
    refreshUpgradeToastButton();
    return;
  }

  // İlk yükseltilebilir item'ı bul
  for (const charId of window.ACTIVE_CHARACTER_IDS || []) {
    const char = gameState.characters[charId];
    if (!char || !char.unlocked) continue;

    for (let slot = 0; slot < char.items.length; slot++) {
      const equip = char.items[slot];
      if (!equip) continue;

      const item  = ITEMS[equip.itemId];
      const costs = item.upgradeCosts(equip.level);
      const inv   = gameState.inventory;
      const canUpgrade = Object.entries(costs).every(([mat, amt]) => (inv[mat] || 0) >= amt);

      if (canUpgrade) {
        showUpgradeToast(charId, slot);
        return;
      }
    }
  }
}

function showUpgradeToast(charId, slotIdx) {
  const toast = document.getElementById('upgrade-toast');
  if (!toast) return;

  const char     = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const equip    = char.items[slotIdx];
  if (!equip) return;

  const item       = ITEMS[equip.itemId];
  const currentLv  = equip.level;
  const nextLv     = currentLv + 1;
  const currBonus  = item.baseBonus + item.bonusPerLevel * (currentLv - 1);
  const nextBonus  = item.baseBonus + item.bonusPerLevel * currentLv;
  const statLabel  = item.stat.toUpperCase();
  const costs      = item.upgradeCosts(currentLv);
  const inv        = gameState.inventory;

  // DOM doldur
  const g = (id) => document.getElementById(id);
  if (g('utoast-icon'))       g('utoast-icon').textContent       = item.icon;
  if (g('utoast-char'))       g('utoast-char').textContent       = charData.name;
  if (g('utoast-name'))       g('utoast-name').textContent       = item.name;
  if (g('utoast-lv-old'))     g('utoast-lv-old').textContent     = `+${currentLv}`;
  if (g('utoast-lv-new'))     g('utoast-lv-new').textContent     = `+${nextLv}`;
  if (g('utoast-stat-label')) g('utoast-stat-label').textContent = `${statLabel}:`;
  if (g('utoast-stat-old'))   g('utoast-stat-old').textContent   = `+${currBonus}`;
  if (g('utoast-stat-new'))   g('utoast-stat-new').textContent   = `+${nextBonus}`;

  // Maliyet satırları
  const costEl = g('utoast-cost');
  if (costEl) {
    costEl.innerHTML = '';
    for (const [mat, amt] of Object.entries(costs)) {
      const have  = inv[mat] || 0;
      const ok    = have >= amt;
      const matData = MATERIALS[mat];
      const span  = document.createElement('div');
      span.className = `utoast-cost-item ${ok ? 'ok' : 'nok'}`;
      span.textContent = `${matData ? matData.icon : mat}${amt}`;
      costEl.appendChild(span);
    }
  }

  // Geliştir butonu
  const btn = g('utoast-btn');
  if (btn) {
    btn.disabled = false;
    btn.onclick  = () => {
      const success = upgradeItem(charId, slotIdx);
      if (success) {
        hideUpgradeToast();
        showNotification(`✅ ${item.icon} ${item.name} +${nextLv} yapıldı!`, 'upgrade');
        // Yeni geliştirilebilir bir şey var mı kısa süre sonra kontrol et
        setTimeout(checkAndShowUpgradeToast, 1800);
      }
    };
  }

  // State kaydet
  upgradeToastCharId = charId;
  upgradeToastSlot   = slotIdx;

  // Toast'u göster
  toast.classList.add('visible');

  // 10sn sonra otomatik kapat
  clearTimeout(upgradeToastTimer);
  upgradeToastTimer = setTimeout(() => hideUpgradeToast(), 10000);
}

function refreshUpgradeToastButton() {
  if (upgradeToastCharId === null || upgradeToastSlot === null) return;
  const char  = gameState.characters[upgradeToastCharId];
  if (!char) return;
  const equip = char.items[upgradeToastSlot];
  if (!equip) return;
  const item  = ITEMS[equip.itemId];
  const costs = item.upgradeCosts(equip.level);
  const inv   = gameState.inventory;
  const canUpgrade = Object.entries(costs).every(([mat, amt]) => (inv[mat] || 0) >= amt);
  const btn = document.getElementById('utoast-btn');
  if (btn) btn.disabled = !canUpgrade;
}

function hideUpgradeToast() {
  const toast = document.getElementById('upgrade-toast');
  if (toast) toast.classList.remove('visible');
  clearTimeout(upgradeToastTimer);
  upgradeToastCharId = null;
  upgradeToastSlot   = null;
}
