// ============================================================
// UI/NOTIFICATIONS.JS — Bildirimler, loot, popup'lar
// ============================================================

const notificationQueue = [];
let notificationTimer = null;

function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `notification notif-${type}`;
  el.textContent = message;

  container.appendChild(el);

  // Animasyon için küçük gecikme
  setTimeout(() => el.classList.add('show'), 10);

  // 3 saniye sonra kaldır
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// Hasar sayısı uçar (canavar üzerinde)
let damageNumberId = 0;
function showDamageNumber(damage, isClick = false, isSkill = false) {
  const area = document.getElementById('monster-area');
  if (!area) return;

  const el = document.createElement('div');
  el.className = `damage-number ${isClick ? 'click-dmg' : ''} ${isSkill ? 'skill-dmg' : ''}`;
  el.textContent = `-${damage}`;

  // Rastgele yatay pozisyon
  const x = 30 + Math.random() * 40; // %
  el.style.left = `${x}%`;
  el.style.top = '40%';

  area.appendChild(el);

  setTimeout(() => el.classList.add('fly'), 10);
  setTimeout(() => el.remove(), 1200);
}

// Karakter hasar efekti
function showCharacterDamage(charId, damage) {
  const icon = document.getElementById(`char-icon-${charId}`);
  if (!icon) return;
  icon.classList.add('shake');
  setTimeout(() => icon.classList.remove('shake'), 400);

  // Küçük hasar sayısı
  const el = document.createElement('div');
  el.className = 'char-damage-number';
  el.textContent = `-${damage}`;
  icon.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Loot bildirimi
function showLootNotification(gold, materials) {
  let parts = [`+${gold}💰`];
  if (materials.wood) parts.push(`+${materials.wood}🪵`);
  if (materials.leather) parts.push(`+${materials.leather}🟤`);
  if (materials.iron) parts.push(`+${materials.iron}⚙️`);
  showNotification(parts.join('  '), 'loot');
}

// Offline popup
function showOfflinePopup(earnings) {
  const popup = document.getElementById('offline-popup');
  if (!popup) return;

  document.getElementById('offline-time').textContent =
    `${earnings.hours}s ${earnings.minutes}dk`;
  document.getElementById('offline-gold').textContent = `+${earnings.gold} 💰`;
  document.getElementById('offline-wood').textContent = earnings.wood > 0 ? `+${earnings.wood} 🪵` : '';
  document.getElementById('offline-leather').textContent = earnings.leather > 0 ? `+${earnings.leather} 🟤` : '';
  document.getElementById('offline-iron').textContent = earnings.iron > 0 ? `+${earnings.iron} ⚙️` : '';

  popup.classList.add('show');
}

function collectOfflineEarnings() {
  const popup = document.getElementById('offline-popup');
  // Kazanıları bul ve uygula
  const goldEl = document.getElementById('offline-gold');
  if (goldEl) {
    const gold = parseInt(goldEl.textContent.replace(/\D/g, '')) || 0;
    const woodEl = document.getElementById('offline-wood');
    const leatherEl = document.getElementById('offline-leather');
    const ironEl = document.getElementById('offline-iron');
    const wood = woodEl ? parseInt(woodEl.textContent.replace(/\D/g, '')) || 0 : 0;
    const leather = leatherEl ? parseInt(leatherEl.textContent.replace(/\D/g, '')) || 0 : 0;
    const iron = ironEl ? parseInt(ironEl.textContent.replace(/\D/g, '')) || 0 : 0;
    applyOfflineEarnings({ gold, wood, leather, iron });
  }
  if (popup) popup.classList.remove('show');
}

// Yenilgi ekranı
function showDefeatScreen() {
  const screen = document.getElementById('defeat-screen');
  if (screen) screen.classList.add('show');
}
function hideDefeatScreen() {
  const screen = document.getElementById('defeat-screen');
  if (screen) screen.classList.remove('show');
}
