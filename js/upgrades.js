// ============================================================
// UPGRADES.JS — Güç Artışları: data, satın alma, bonus hesaplama
// ============================================================

const UPGRADE_COST_MULT = 1.8;

// ============ UPGRADE TANIMLAMALARI ============
const CLICK_UPGRADES = [
  { id: 'punch',  name: 'Güçlü Yumruk',    icon: '👊', bonus: 1,      baseCost: 10 },
  { id: 'sharp',  name: 'Keskin Darbe',     icon: '⚔️', bonus: 10,     baseCost: 150 },
  { id: 'master', name: 'Usta Vuruş',       icon: '🗡️', bonus: 100,    baseCost: 2000 },
  { id: 'hero',   name: 'Kahraman Darbesi', icon: '🔥', bonus: 1000,   baseCost: 25000 },
  { id: 'legend', name: 'Efsane Darbe',     icon: '💥', bonus: 10000,  baseCost: 300000 },
];

const AUTO_UPGRADES = [
  { id: 'synergy', name: 'Ekip Sinerji',  icon: '🤝', bonus: 1,      baseCost: 50 },
  { id: 'tactic',  name: 'Savaş Taktiği', icon: '🛡️', bonus: 10,     baseCost: 800 },
  { id: 'coord',   name: 'Koordinasyon',  icon: '🎯', bonus: 100,    baseCost: 10000 },
  { id: 'spirit',  name: 'Ekip Ruhu',     icon: '⚡', bonus: 1000,   baseCost: 120000 },
  { id: 'oath',    name: 'Zafer Andı',    icon: '👑', bonus: 10000,  baseCost: 1500000 },
];

// ============ DEFAULT UPGRADE STATE ============
function getDefaultUpgrades() {
  const clickState = {};
  for (const u of CLICK_UPGRADES) {
    clickState[u.id] = { count: 0, cost: u.baseCost };
  }
  const autoState = {};
  for (const u of AUTO_UPGRADES) {
    autoState[u.id] = { count: 0, cost: u.baseCost };
  }
  return { click: clickState, auto: autoState };
}

// ============ BONUS HESAPLAMA ============
function getTotalClickBonus() {
  if (!gameState.upgrades) return 0;
  return CLICK_UPGRADES.reduce((sum, u) => {
    return sum + u.bonus * (gameState.upgrades.click[u.id]?.count || 0);
  }, 0);
}

function getTotalAutoBonus() {
  if (!gameState.upgrades) return 0;
  return AUTO_UPGRADES.reduce((sum, u) => {
    return sum + u.bonus * (gameState.upgrades.auto[u.id]?.count || 0);
  }, 0);
}

// ============ AUTO BONUS UYGULA ============
// Tüm açık karakterlerin ATK'sına auto upgrade bonusu ekler
function applyAutoBonus() {
  const bonus = getTotalAutoBonus();
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char || !char.unlocked) continue;
    const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
    char.atk = stats.atk + bonus;
  }
}

// ============ SATIN ALMA ============
function buyUpgrade(category, upgradeId) {
  if (!gameState.upgrades) return false;

  const state = gameState.upgrades[category]?.[upgradeId];
  if (!state) return false;
  if (gameState.inventory.gold < state.cost) return false;

  // Altını düş
  gameState.inventory.gold -= state.cost;

  // Sayacı artır, fiyatı güncelle
  state.count++;
  state.cost = Math.ceil(state.cost * UPGRADE_COST_MULT);

  // Auto upgrade ise tüm aktif karakterlere uygula
  if (category === 'auto') {
    applyAutoBonus();
  }

  renderInventory();
  renderUpgradesPanel();
  saveGame(gameState);
  return true;
}
