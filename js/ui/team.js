// ============================================================
// UI/TEAM.JS — Ekip paneli UI
// ============================================================

let selectedCharId = null;

function openTeamPanel() {
  const panel = document.getElementById('team-panel');
  if (panel) {
    panel.classList.add('show');
    renderTeamPanel();
  }
}

function closeTeamPanel() {
  const panel = document.getElementById('team-panel');
  if (panel) panel.classList.remove('show');
  selectedCharId = null;
}

function renderTeamPanel() {
  const container = document.getElementById('team-chars');
  if (!container) return;

  container.innerHTML = '';

  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    const charData = CHARACTERS[charId];

    const card = document.createElement('div');
    card.className = `team-char-card ${!char.unlocked ? 'locked' : ''} ${selectedCharId === charId ? 'selected' : ''}`;
    card.id = `team-card-${charId}`;

    if (!char.unlocked) {
      card.innerHTML = `
        <div class="team-char-portrait locked">🔒</div>
        <div class="team-char-name">${charData.name}</div>
        <div class="team-char-role">${charData.role}</div>
        ${charData.unlocksAtChapter < 999 ? `<div class="team-char-locked-hint">Bölüm ${charData.unlocksAtChapter}'de açılır</div>` : '<div class="team-char-locked-hint">Yakında</div>'}
      `;
    } else {
      const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
      const expPct = Math.min(100, (char.exp / expRequired(char.level)) * 100);

      card.innerHTML = `
        <div class="team-char-portrait" style="color:${charData.color}">${charData.portrait}</div>
        <div class="team-char-info">
          <div class="team-char-name">${charData.name}</div>
          <div class="team-char-role">${charData.role}</div>
          <div class="team-char-level">Seviye ${char.level}</div>
          <div class="team-exp-bar-wrap">
            <div class="team-exp-bar" style="width:${expPct}%"></div>
          </div>
          <div class="team-exp-text">${char.exp} / ${expRequired(char.level)} EXP</div>
        </div>
      `;

      card.addEventListener('click', () => selectCharacter(charId));
    }

    container.appendChild(card);
  }

  // Seçili karakter detayı
  if (selectedCharId) {
    renderCharacterDetail(selectedCharId);
  }
}

function selectCharacter(charId) {
  selectedCharId = charId;
  // Tüm kartları güncelle
  for (const id of ACTIVE_CHARACTER_IDS) {
    const card = document.getElementById(`team-card-${id}`);
    if (card) card.classList.toggle('selected', id === charId);
  }
  renderCharacterDetail(charId);
}

function renderCharacterDetail(charId) {
  const detail = document.getElementById('char-detail');
  if (!detail) return;

  const char = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
  const skill = charData.skill;

  detail.innerHTML = `
    <div class="char-detail-header">
      <div class="char-detail-portrait" style="color:${charData.color}">${charData.portrait}</div>
      <div class="char-detail-info">
        <div class="char-detail-name">${charData.name}</div>
        <div class="char-detail-role">${charData.role}</div>
        <div class="char-detail-level">Seviye ${char.level}</div>
      </div>
    </div>

    <div class="char-stats-grid">
      <div class="stat-item">
        <span class="stat-icon">❤️</span>
        <span class="stat-label">HP</span>
        <span class="stat-value">${stats.hp}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⚔️</span>
        <span class="stat-label">ATK</span>
        <span class="stat-value">${stats.atk}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🛡️</span>
        <span class="stat-label">DEF</span>
        <span class="stat-value">${stats.def}</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">💧</span>
        <span class="stat-label">Mana</span>
        <span class="stat-value">${stats.manaMax}</span>
      </div>
    </div>

    <div class="char-skill-box">
      <div class="skill-header">${skill.icon} ${skill.name} <span class="skill-cost">${skill.manaCost} Mana</span></div>
      <div class="skill-desc">${skill.description}</div>
    </div>

    <div class="char-items-section">
      <div class="section-title">📦 Item Slotları</div>
      <div class="item-slots-grid">
        ${charData.itemSlots.map((defaultItemId, idx) => renderItemSlot(charId, idx)).join('')}
      </div>
    </div>
  `;

  // Geliştir butonlarına event ekle
  detail.querySelectorAll('.upgrade-btn').forEach(btn => {
    const charId = btn.dataset.char;
    const slot = parseInt(btn.dataset.slot);
    btn.addEventListener('click', () => {
      upgradeItem(charId, slot);
      renderCharacterDetail(charId);
      renderInventory();
    });
  });
}

function renderItemSlot(charId, slotIndex) {
  const char = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const equip = char.items[slotIndex];
  const defaultItemId = charData.itemSlots[slotIndex];
  const itemDef = ITEMS[defaultItemId];

  if (!equip) {
    // Boş slot
    const dropCh = ITEM_DROP_CHAPTERS[defaultItemId];
    return `
      <div class="item-slot empty">
        <div class="item-slot-icon">❓</div>
        <div class="item-slot-name">${itemDef ? itemDef.name : '?'}</div>
        <div class="item-slot-hint">Bölüm ${dropCh || '?'}'de düşer</div>
      </div>
    `;
  }

  const item = ITEMS[equip.itemId];
  const nextLevel = equip.level + 1;
  const costs = item.upgradeCosts(equip.level);
  const inv = gameState.inventory;

  // Materyal yeterli mi?
  const canUpgrade = Object.entries(costs).every(([mat, amt]) => (inv[mat] || 0) >= amt);
  const costStr = Object.entries(costs).map(([mat, amt]) => {
    const have = inv[mat] || 0;
    const enough = have >= amt;
    const matInfo = MATERIALS[mat];
    return `<span class="${enough ? 'cost-ok' : 'cost-nok'}">${matInfo.icon}${amt}</span>`;
  }).join(' ');

  return `
    <div class="item-slot filled">
      <div class="item-slot-icon">${item.icon}</div>
      <div class="item-slot-name">${item.name}</div>
      <div class="item-slot-level">+${equip.level}</div>
      <div class="item-slot-bonus">+${item.baseBonus + item.bonusPerLevel * (equip.level - 1)} ${item.stat.toUpperCase()}</div>
      <div class="item-upgrade-cost">${costStr}</div>
      <button class="upgrade-btn ${canUpgrade ? 'can-upgrade' : 'cant-upgrade'}"
        data-char="${charId}" data-slot="${slotIndex}">
        ${canUpgrade ? '⬆️ Geliştir' : '🔒 Yetersiz'}
      </button>
    </div>
  `;
}
