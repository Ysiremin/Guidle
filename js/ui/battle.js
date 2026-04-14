// ============================================================
// UI/BATTLE.JS — Savaş ekranı UI render
// ============================================================

let lastRenderTime = 0;
const RENDER_THROTTLE = 50; // ms (20fps)

function renderAll() {
  const now = performance.now();
  if (now - lastRenderTime < RENDER_THROTTLE) return;
  lastRenderTime = now;

  renderMonster();
  renderCharacters();
  renderInventory();
  renderEffects();
  renderChapterSelector();
}

// ============ CANAVAR ============
function renderMonster() {
  const monster = gameState.monster;

  const emojiEl = document.getElementById('monster-emoji');
  const nameEl = document.getElementById('monster-name');
  const hpBarEl = document.getElementById('monster-hp-bar');
  const hpTextEl = document.getElementById('monster-hp-text');
  const regionEl = document.getElementById('region-name');
  const tagEl = document.getElementById('monster-tag');

  if (!monster) {
    if (emojiEl) emojiEl.textContent = '⏳';
    if (nameEl) nameEl.textContent = 'Yükleniyor...';
    if (hpBarEl) hpBarEl.style.width = '0%';
    return;
  }

  if (emojiEl) emojiEl.textContent = monster.emoji;
  if (nameEl) nameEl.textContent = monster.name;
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
      tagEl.className = 'monster-tag boss';
    } else if (monster.isMinibow) {
      tagEl.textContent = 'Mini Boss';
      tagEl.className = 'monster-tag miniboss';
    } else {
      tagEl.textContent = '';
      tagEl.className = 'monster-tag';
    }
  }
}

// ============ KARAKTERLER ============
function renderCharacters() {
  for (const charId of ACTIVE_CHARACTER_IDS) {
    renderCharacterIcon(charId);
  }
}

function renderCharacterIcon(charId) {
  const char = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const icon = document.getElementById(`char-icon-${charId}`);
  if (!icon) return;

  // Kilitli karakter
  if (!char.unlocked) {
    icon.className = 'char-icon locked';
    const unlockChapter = charData.unlocksAtChapter;
    if (unlockChapter < 999) {
      icon.innerHTML = `
        <div class="char-portrait locked-portrait">🔒</div>
        <div class="char-name">${charData.name}</div>
        <div class="char-unlock-hint">Bölüm ${unlockChapter}'de açılır</div>
      `;
    } else {
      icon.innerHTML = `
        <div class="char-portrait locked-portrait">🔒</div>
        <div class="char-name">${charData.name}</div>
        <div class="char-unlock-hint">Yakında</div>
      `;
    }
    return;
  }

  // DPS hesapla
  const dps = (char.atk / charData.baseStats.attackSpeed * 1000).toFixed(1);

  // Durum sınıfı
  let statusClass = '';
  if (char.isDead && char.reviveReady) statusClass = 'revive-ready';
  else if (char.isDead) statusClass = 'dead';

  // Skill hazır mı?
  const skill = charData.skill;
  const skillReady = char.currentMana >= skill.manaCost && !char.isDead;

  // Mana yüzdesi
  const manaPct = (char.currentMana / char.maxMana) * 100;
  const hpPct = (char.currentHP / char.maxHP) * 100;

  // Taunt aktif mi?
  const now = Date.now();
  const tauntActive = gameState.effects.taunt && now < gameState.effects.taunt.endsAt && charId === 'warrior';

  // Cooldown süresi
  let cooldownText = '';
  if (char.isDead && !char.reviveReady && char.reviveReadyAt) {
    const remaining = Math.max(0, Math.ceil((char.reviveReadyAt - now) / 1000));
    cooldownText = `${remaining}s`;
  }

  icon.className = `char-icon ${statusClass} ${skillReady ? 'skill-ready' : ''} ${tauntActive ? 'taunting' : ''}`;

  icon.innerHTML = `
    <div class="char-dps">${dps} DPS</div>
    <div class="char-portrait">${charData.portrait}</div>
    <div class="char-name">${charData.name}</div>
    <div class="char-level">Lv.${char.level}</div>
    ${char.isDead && !char.reviveReady ? `<div class="char-cooldown">${cooldownText}</div>` : ''}
    ${char.isDead && char.reviveReady ? `<div class="char-revive-hint">TAP!</div>` : ''}
    <div class="char-bars">
      <div class="char-hp-bar-wrap">
        <div class="char-hp-bar" style="width:${Math.max(0, hpPct)}%"></div>
      </div>
      <div class="char-mana-bar-wrap">
        <div class="char-mana-bar" style="width:${Math.max(0, manaPct)}%"></div>
      </div>
    </div>
    ${skillReady ? `<div class="skill-indicator">${skill.icon}</div>` : ''}
  `;
}

// ============ ENVANTER ============
function renderInventory() {
  const inv = gameState.inventory;
  const el = (id) => document.getElementById(id);

  if (el('gold-amount')) el('gold-amount').textContent = formatNumber(inv.gold);
  if (el('wood-amount')) el('wood-amount').textContent = formatNumber(inv.wood);
  if (el('leather-amount')) el('leather-amount').textContent = formatNumber(inv.leather);
  if (el('iron-amount')) el('iron-amount').textContent = formatNumber(inv.iron);

  // Toplam seviye (karakter levelları toplamı)
  const totalLevel = ACTIVE_CHARACTER_IDS.reduce((sum, id) => {
    const c = gameState.characters[id];
    return sum + (c.unlocked ? c.level : 0);
  }, 0);
  if (el('total-level')) el('total-level').textContent = `Güç: ${totalLevel}`;
}

// ============ AKTİF EFEKTLER ============
function renderEffects() {
  const now = Date.now();
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

// ============ CHAPTER SELECTOR ============
function renderChapterSelector() {
  // Sadece mevcut chapter göster (header'da)
  const el = document.getElementById('current-chapter-display');
  if (el) el.textContent = `Bölüm ${gameState.currentChapter}`;
}

function updateChapterSelector() {
  const modal = document.getElementById('chapter-modal');
  if (!modal || !modal.classList.contains('show')) return;
  renderChapterModal();
}

function renderChapterModal() {
  const grid = document.getElementById('chapter-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // İki bölge
  const regions = [
    { name: 'Slime Vadisi', chapters: Array.from({length: 10}, (_, i) => i + 1) },
    { name: 'Goblin Ormanı', chapters: Array.from({length: 10}, (_, i) => i + 11) }
  ];

  for (const region of regions) {
    const regionEl = document.createElement('div');
    regionEl.className = 'chapter-region';

    const regionTitle = document.createElement('div');
    regionTitle.className = 'chapter-region-title';
    regionTitle.textContent = region.name;
    regionEl.appendChild(regionTitle);

    const chapterList = document.createElement('div');
    chapterList.className = 'chapter-list';

    for (const ch of region.chapters) {
      const monster = MONSTERS[ch];
      const btn = document.createElement('button');
      const unlocked = ch <= gameState.highestUnlockedChapter;
      const current = ch === gameState.currentChapter;

      btn.className = `chapter-btn ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''} ${monster.isBoss ? 'is-boss' : ''} ${monster.isMinibow ? 'is-miniboss' : ''}`;
      btn.innerHTML = `
        <span class="ch-emoji">${monster.emoji}</span>
        <span class="ch-num">${ch}</span>
        <span class="ch-name">${monster.name}</span>
        ${monster.isBoss ? '<span class="ch-tag">BOSS</span>' : ''}
        ${monster.isMinibow ? '<span class="ch-tag min">Mini</span>' : ''}
        ${!unlocked ? '<span class="ch-lock">🔒</span>' : ''}
      `;

      if (unlocked) {
        btn.addEventListener('click', () => {
          switchChapter(ch);
          closeChapterModal();
        });
      }

      chapterList.appendChild(btn);
    }

    regionEl.appendChild(chapterList);
    grid.appendChild(regionEl);
  }
}

function openChapterModal() {
  const modal = document.getElementById('chapter-modal');
  if (modal) {
    modal.classList.add('show');
    renderChapterModal();
  }
}

function closeChapterModal() {
  const modal = document.getElementById('chapter-modal');
  if (modal) modal.classList.remove('show');
}

// ============ YARDIMCI ============
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}
