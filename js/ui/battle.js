// ============================================================
// UI/BATTLE.JS — Savaş ekranı UI render
// ============================================================

let lastRenderTime = 0;
const RENDER_THROTTLE = 50; // ~20fps

function renderAll() {
  const now = performance.now();
  if (now - lastRenderTime < RENDER_THROTTLE) return;
  lastRenderTime = now;

  renderMonster();
  renderCharacters();
  renderInventory();
  renderEffects();
  renderChapterBar();
}

// ============ CANAVAR ============
function renderMonster() {
  const monster = gameState.monster;

  const emojiEl  = document.getElementById('monster-emoji');
  const nameEl   = document.getElementById('monster-name');
  const hpBarEl  = document.getElementById('monster-hp-bar');
  const hpTextEl = document.getElementById('monster-hp-text');
  const regionEl = document.getElementById('region-name');
  const tagEl    = document.getElementById('monster-tag');
  const wrapEl   = document.getElementById('monster-emoji-wrap');

  if (!monster) {
    if (emojiEl) emojiEl.textContent = '⏳';
    if (nameEl)  nameEl.textContent = 'Hazırlanıyor...';
    if (hpBarEl) hpBarEl.style.width = '0%';
    hideBossTimer();
    return;
  }

  if (emojiEl)  emojiEl.textContent = monster.emoji;
  if (nameEl)   nameEl.textContent  = monster.name;
  if (regionEl) regionEl.textContent = `${monster.region} — Bölüm ${monster.chapter}`;

  const hpPct = (monster.currentHP / monster.maxHP) * 100;
  if (hpBarEl) {
    hpBarEl.style.width = `${Math.max(0, hpPct)}%`;
    hpBarEl.style.backgroundColor = hpPct > 50 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336';
  }
  if (hpTextEl) hpTextEl.textContent = `${formatNumber(Math.ceil(monster.currentHP))} / ${formatNumber(monster.maxHP)}`;

  if (tagEl) {
    if (monster.isBoss) {
      tagEl.textContent = 'BOSS';
      tagEl.className   = 'monster-tag boss';
    } else if (monster.isMinibow) {
      tagEl.textContent = 'Mini Boss';
      tagEl.className   = 'monster-tag miniboss';
    } else {
      tagEl.textContent = '';
      tagEl.className   = 'monster-tag';
    }
  }

  // Emoji wrap glow (boss/miniboss için)
  if (wrapEl) {
    wrapEl.className = '';
    if (monster.isBoss)    wrapEl.className = 'boss-glow';
    if (monster.isMinibow) wrapEl.className = 'miniboss-glow';
  }

  // Boss timer güncelle
  if (monster.isBoss || monster.isMinibow) {
    renderBossTimer();
  } else {
    hideBossTimer();
  }
}

// ============ KARAKTERLER ============
function renderCharacters() {
  for (const charId of ACTIVE_CHARACTER_IDS) {
    renderCharacterIcon(charId);
  }
}

function renderCharacterIcon(charId) {
  const char     = gameState.characters[charId];
  const charData = CHARACTERS[charId];

  const icon       = document.getElementById(`char-icon-${charId}`);
  const barsOuter  = document.querySelector(`#char-wrapper-${charId} .char-bars-outer`);
  const skillMini  = document.getElementById(`skill-icon-${charId}`);

  if (!icon) return;

  // ---- KİLİTLİ ----
  if (!char.unlocked) {
    icon.className = 'char-icon locked';
    icon.innerHTML = `
      <div class="char-portrait locked-portrait">🔒</div>
      <div class="char-name-level">
        <span class="char-name">${charData.name}</span>
        <span class="char-level locked-hint">${charData.unlocksAtChapter < 999 ? 'Bl.' + charData.unlocksAtChapter : 'Yakında'}</span>
      </div>
    `;
    if (barsOuter) barsOuter.classList.add('faded');
    if (skillMini) skillMini.classList.add('hidden');
    return;
  }

  // ---- ÖLÜM DURUMU ----
  const now = Date.now();
  let statusClass = '';
  if (char.isDead && char.reviveReady) statusClass = 'revive-ready';
  else if (char.isDead)                statusClass = 'dead';

  // Taunt aktif mi?
  const tauntActive = gameState.effects.taunt && now < gameState.effects.taunt.endsAt && charId === 'warrior';

  icon.className = `char-icon ${statusClass} ${tauntActive ? 'taunting' : ''}`;

  // Cooldown / revive gösterimi
  let overlayHTML = '';
  if (char.isDead && !char.reviveReady && char.reviveReadyAt) {
    const remaining = Math.max(0, Math.ceil((char.reviveReadyAt - now) / 1000));
    overlayHTML = `
      <div class="char-cooldown-overlay">
        <span class="char-cooldown-time">${remaining}s</span>
        <span class="char-cooldown-label">👋 Geri Dönüyor</span>
      </div>`;
  } else if (char.isDead && char.reviveReady) {
    overlayHTML = `<div class="char-revive-tap">⬆️ DOKUNUN</div>`;
  }

  icon.innerHTML = `
    <div class="char-portrait">${charData.portrait}</div>
    <div class="char-name-level">
      <span class="char-name">${charData.name}</span>
      <span class="char-level">Lv.${char.level}</span>
    </div>
    ${overlayHTML}
  `;

  // ---- HP / MANA BARS (icon dışında) ----
  if (barsOuter) {
    barsOuter.classList.remove('faded');
    const hpPct   = Math.max(0, (char.currentHP / char.maxHP) * 100);
    const manaPct = Math.max(0, (char.currentMana / char.maxMana) * 100);
    const hpBar   = barsOuter.querySelector('.char-hp-bar');
    const manaBar = barsOuter.querySelector('.char-mana-bar');
    if (hpBar)   hpBar.style.width   = `${hpPct}%`;
    if (manaBar) manaBar.style.width = `${manaPct}%`;
  }

  // ---- SKİLL MİNİ-İKON (slide from behind animasyonu) ----
  const skill      = charData.skill;
  const skillReady = char.currentMana >= skill.manaCost && !char.isDead;

  if (skillMini) {
    skillMini.textContent = skill.icon;
    skillMini.title       = `${skill.name} — ${skill.manaCost} Mana`;

    const isVisible     = skillMini.classList.contains('visible');
    const isSlidingBack = skillMini.classList.contains('sliding-back');

    if (skillReady && !isVisible && !isSlidingBack) {
      // Yukarı kaydır (char-icon arkasından çık)
      requestAnimationFrame(() => skillMini.classList.add('visible'));
    } else if (!skillReady && isVisible && !isSlidingBack) {
      // Mana düştüyse (skill kullanılmadan): aniden gizle
      skillMini.classList.remove('visible');
    }
  }
}

// ============ ENVANTER ============
function renderInventory() {
  const inv = gameState.inventory;
  const el  = (id) => document.getElementById(id);

  if (el('gold-amount'))    el('gold-amount').textContent    = formatNumber(inv.gold);
  if (el('wood-amount'))    el('wood-amount').textContent    = formatNumber(inv.wood);
  if (el('leather-amount')) el('leather-amount').textContent = formatNumber(inv.leather);
  if (el('iron-amount'))    el('iron-amount').textContent    = formatNumber(inv.iron);

  const totalLevel = ACTIVE_CHARACTER_IDS.reduce((sum, id) => {
    const c = gameState.characters[id];
    return sum + (c.unlocked ? c.level : 0);
  }, 0);
  if (el('total-level')) el('total-level').textContent = `Güç: ${totalLevel}`;
}

// ============ AKTİF EFEKTLER ============
function renderEffects() {
  const now   = Date.now();
  const effEl = document.getElementById('active-effects');
  if (!effEl) return;

  const parts = [];
  if (gameState.effects.taunt && now < gameState.effects.taunt.endsAt) {
    const rem = Math.ceil((gameState.effects.taunt.endsAt - now) / 1000);
    parts.push(`🛡️ Taunt (${rem}s)`);
  }
  if (gameState.effects.poisonArrow && now < gameState.effects.poisonArrow.endsAt) {
    const rem = Math.ceil((gameState.effects.poisonArrow.endsAt - now) / 1000);
    parts.push(`☠️ Zehir (${rem}s)`);
  }
  effEl.textContent = parts.join('  ');
}

// ============ CHAPTER BAR ============
let chapterBarInitialized = false;

function renderChapterBar() {
  const track = document.getElementById('chapter-bar-track');
  if (!track) return;

  // İlk kez ya da unlock sayısı değişince yeniden render
  if (!chapterBarInitialized) {
    buildChapterBar(track);
    chapterBarInitialized = true;
  }

  // Sadece sınıf güncellemesi yap (her frame rebuild'den kaçın)
  for (let ch = 1; ch <= 20; ch++) {
    const item = document.getElementById(`cb-item-${ch}`);
    if (!item) continue;

    const unlocked = ch <= gameState.highestUnlockedChapter;
    const active   = ch === gameState.currentChapter;
    const monster  = MONSTERS[ch];

    item.className = [
      'chapter-bar-item',
      active   ? 'cb-active'   : '',
      unlocked && !active ? 'cb-unlocked' : '',
      !unlocked ? 'cb-locked'  : '',
      monster.isBoss    ? 'cb-boss'    : '',
      monster.isMinibow ? 'cb-miniboss': ''
    ].filter(Boolean).join(' ');
  }
}

function buildChapterBar(track) {
  track.innerHTML = '';

  // Hangi chapter'larda 'yeni unlock' pulse var? (gameState'den oku)
  const newUnlocks = gameState.pendingNewUnlocks || new Set();

  for (let ch = 1; ch <= 20; ch++) {
    const monster  = MONSTERS[ch];
    const unlocked = ch <= gameState.highestUnlockedChapter;
    const active   = ch === gameState.currentChapter;
    const isNew    = newUnlocks.has(ch);

    const item = document.createElement('div');
    item.id        = `cb-item-${ch}`;
    item.className = [
      'chapter-bar-item',
      active   ? 'cb-active'   : '',
      unlocked && !active ? 'cb-unlocked' : '',
      !unlocked ? 'cb-locked'  : '',
      monster.isBoss    ? 'cb-boss'    : '',
      monster.isMinibow ? 'cb-miniboss': '',
      isNew ? 'cb-new-unlock' : ''
    ].filter(Boolean).join(' ');

    item.innerHTML = `
      <div class="cb-emoji">${monster.emoji}</div>
      <div class="cb-num">Ch.${ch}</div>
    `;

    if (unlocked || active) {
      item.addEventListener('click', () => {
        if (ch > gameState.highestUnlockedChapter) return;
        switchChapter(ch);
        scrollChapterBarToActive();
        // Yeni unlock pulse'u kapat
        clearNewChapterUnlock(ch);
        // Sol toast açıksa kapat
        if (document.getElementById('chapter-unlock-toast')?.classList.contains('visible')) {
          hideChapterUnlockToast();
        }
      });
    }

    track.appendChild(item);
  }

  scrollChapterBarToActive();
}

function scrollChapterBarToActive() {
  setTimeout(() => {
    const activeItem = document.getElementById(`cb-item-${gameState.currentChapter}`);
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 50);
}

// Chapter değişince track'i sıfırla (unlock güncellemeleri için)
function updateChapterSelector() {
  chapterBarInitialized = false;
}

// Yardımcı
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ============ BOSS TIMER RENDER ============
function renderBossTimer() {
  const wrap    = document.getElementById('boss-timer-wrap');
  const bar     = document.getElementById('boss-timer-bar');
  const timeEl  = document.getElementById('boss-timer-time');
  if (!wrap || !bar || !timeEl) return;

  const bt = gameState.bossTimer;
  if (!bt || !bt.active) {
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');

  const now       = Date.now();
  const remaining = Math.max(0, bt.endsAt - now);
  const pct       = (remaining / (bt.duration * 1000)) * 100;
  const isDanger  = pct < 30;

  // Zaman metni MM:SS
  const secs = Math.ceil(remaining / 1000);
  const mm   = Math.floor(secs / 60);
  const ss   = secs % 60;
  timeEl.textContent = `${mm}:${ss.toString().padStart(2, '0')}`;
  timeEl.classList.toggle('danger', isDanger);

  bar.style.width = `${pct}%`;
  bar.classList.toggle('danger', isDanger);
}

function hideBossTimer() {
  const wrap = document.getElementById('boss-timer-wrap');
  if (wrap) wrap.classList.add('hidden');
}
