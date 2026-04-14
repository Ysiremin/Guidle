// ============================================================
// SAVE.JS — localStorage kayıt/yükleme & offline kazanç
// ============================================================

const SAVE_KEY = 'idlerp_save_v1';
const AUTOSAVE_INTERVAL = 30000; // 30 saniye

// Başlangıç save datası
function getDefaultSave() {
  return {
    version: 1,
    lastOnline: Date.now(),
    progress: {
      currentChapter: 1,
      highestUnlockedChapter: 1
    },
    inventory: {
      gold: 50,
      wood: 0,
      leather: 0,
      iron: 0
    },
    characters: {
      warrior: {
        level: 1,
        exp: 0,
        unlocked: true,
        items: [
          // { itemId: 'sword', level: 1 }  — başta null
          null, null, null, null
        ]
      },
      archer: {
        level: 1,
        exp: 0,
        unlocked: false,
        items: [null, null, null, null]
      },
      mage: {
        level: 1,
        exp: 0,
        unlocked: false,
        items: [null, null, null, null]
      },
      priest: {
        level: 1,
        exp: 0,
        unlocked: false,
        items: [null, null, null, null]
      }
    },
    droppedItems: [], // Hangi itemler zaten düştü (tekrar düşmesin)
    firstRun: true
  };
}

// Kaydet
function saveGame(gameState) {
  try {
    const data = {
      version: 1,
      lastOnline: Date.now(),
      progress: {
        currentChapter: gameState.currentChapter,
        highestUnlockedChapter: gameState.highestUnlockedChapter
      },
      inventory: { ...gameState.inventory },
      characters: {},
      droppedItems: [...(gameState.droppedItems || [])],
      firstRun: false
    };

    // Karakter verilerini kaydet
    for (const charId of ACTIVE_CHARACTER_IDS) {
      const char = gameState.characters[charId];
      data.characters[charId] = {
        level: char.level,
        exp: char.exp,
        unlocked: char.unlocked,
        items: char.items.map(item => item ? { itemId: item.itemId, level: item.level } : null)
      };
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

// Yükle
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

// Offline kazanç hesapla
function calculateOfflineEarnings(lastOnline, gameState) {
  const now = Date.now();
  const elapsedMs = now - lastOnline;
  const elapsedSeconds = elapsedMs / 1000;

  // Minimum: 60 saniye, Maximum: 8 saat
  const MIN_SECONDS = 60;
  const MAX_SECONDS = 8 * 3600;

  if (elapsedSeconds < MIN_SECONDS) return null;

  const effectiveSeconds = Math.min(elapsedSeconds, MAX_SECONDS);

  // Ortalama savaş hızı: bir canavarı yenmek kaç saniye sürer?
  // Toplam ekip DPS hesapla (aktif karakterler)
  let totalDPS = 0;
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const charState = gameState.characters[charId];
    if (!charState || !charState.unlocked) continue;
    const charData = CHARACTERS[charId];
    const equippedItems = charState.items.filter(Boolean);
    const stats = getCharacterStats(charId, charState.level, equippedItems);
    const dps = (stats.atk / charData.baseStats.attackSpeed) * 1000;
    totalDPS += dps;
  }

  if (totalDPS <= 0) totalDPS = 10;

  // Chapter'a göre canavar HP ve altın
  const chapter = gameState.currentChapter || 1;
  const monster = MONSTERS[chapter];
  const { isBoss, isMinibow } = monster;
  const monsterHP = getMonsterHP(chapter, isBoss, isMinibow);
  const goldPerKill = getMonsterGold(chapter, isBoss, isMinibow);

  // Kaç canavar öldürüldü?
  const timePerKill = monsterHP / totalDPS;
  const killCount = Math.floor(effectiveSeconds / timePerKill);

  if (killCount <= 0) return null;

  // Altın (tam kazanç)
  const gold = Math.floor(killCount * goldPerKill);

  // Materyal (beklenen değer)
  const loot = getMonsterLoot(chapter, isBoss, isMinibow);
  let wood = 0, leather = 0, iron = 0;
  if (loot.woodChance) wood = Math.floor(killCount * loot.woodChance * 0.5);
  if (loot.leatherChance) leather = Math.floor(killCount * loot.leatherChance * 0.5);
  if (loot.ironChance) iron = Math.floor(killCount * loot.ironChance * 0.5);

  const hours = Math.floor(effectiveSeconds / 3600);
  const minutes = Math.floor((effectiveSeconds % 3600) / 60);

  return {
    elapsedSeconds: effectiveSeconds,
    hours,
    minutes,
    gold,
    wood,
    leather,
    iron,
    killCount
  };
}

// Kaydet butonunu başlat (otomatik)
let autosaveTimer = null;
function startAutosave(getState) {
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = setInterval(() => {
    saveGame(getState());
  }, AUTOSAVE_INTERVAL);
}

function stopAutosave() {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}
