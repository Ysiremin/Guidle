// ============================================================
// GAME.JS — Ana oyun motoru, savaş döngüsü
// ============================================================

// ============ GAME STATE ============
let gameState = {
  // İlerleme
  currentChapter: 1,
  highestUnlockedChapter: 1,

  // Envanter
  inventory: { gold: 50, wood: 0, leather: 0, iron: 0 },

  // Karakter state'leri (runtime)
  characters: {},

  // Aktif canavar
  monster: null,

  // Aktif efektler
  effects: {
    taunt: null,        // { targetId, endsAt }
    poisonArrow: null,  // { endsAt, damageMultiplier }
    taunted: false      // canavar sadece savaşçıya mı vurucak
  },

  // Savaş state
  battle: {
    running: false,
    defeated: false // Ekip yenildi mi
  },

  // Dropped items listesi (tekrar düşmesin)
  droppedItems: [],

  // Karakter ölüm/canlanma cooldown'ları
  reviveCooldowns: {}, // charId -> endsAt timestamp

  // İstatistikler
  stats: {
    totalKills: 0,
    totalGold: 0
  }
};

// ============ INIT ============
function initGame() {
  // Save'yi yükle ya da default başla
  const saved = loadGame();
  const isFirstRun = !saved;

  if (saved) {
    gameState.currentChapter = saved.progress.currentChapter || 1;
    gameState.highestUnlockedChapter = saved.progress.highestUnlockedChapter || 1;
    gameState.inventory = { ...saved.inventory };
    gameState.droppedItems = saved.droppedItems || [];
  } else {
    const def = getDefaultSave();
    gameState.inventory = { ...def.inventory };
    gameState.droppedItems = [];
  }

  // Karakterleri başlat
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const charData = CHARACTERS[charId];
    const savedChar = saved?.characters?.[charId];

    const level = savedChar?.level || 1;
    const unlocked = savedChar ? savedChar.unlocked : (charId === 'warrior');
    const items = savedChar?.items || [null, null, null, null];

    const stats = getCharacterStats(charId, level, items.filter(Boolean));

    gameState.characters[charId] = {
      id: charId,
      level,
      exp: savedChar?.exp || 0,
      unlocked,
      items,
      // Runtime stats
      currentHP: stats.hp,
      maxHP: stats.hp,
      currentMana: 0,
      maxMana: stats.manaMax,
      atk: stats.atk,
      def: stats.def,
      attackSpeed: charData.baseStats.attackSpeed,
      manaPerAttack: charData.baseStats.manaPerAttack,
      // Zamanlama
      nextAttackAt: 0,
      // Ölüm/canlanma
      isDead: false,
      reviveReadyAt: null,
      reviveReady: false
    };
    gameState.reviveCooldowns[charId] = null;
  }

  // Canavari spawn et
  spawnMonster(gameState.currentChapter);

  // Offline kazanç hesapla
  let offlineEarnings = null;
  if (saved && saved.lastOnline && !isFirstRun) {
    offlineEarnings = calculateOfflineEarnings(saved.lastOnline, gameState);
  }

  // Otomatik kayıt başlat
  startAutosave(() => gameState);

  // Savaşı başlat
  gameState.battle.running = true;
  gameState.battle.defeated = false;
  requestAnimationFrame(gameLoop);

  // UI'yı başlat
  initUI();
  renderAll();

  // Offline kazanç popup'ı göster
  if (offlineEarnings) {
    setTimeout(() => showOfflinePopup(offlineEarnings), 500);
  }
}

// ============ CANAVAR SPAWN ============
function spawnMonster(chapter) {
  const data = getMonsterData(chapter);
  if (!data) return;
  gameState.monster = {
    ...data,
    currentHP: data.maxHP,
    nextAttackAt: Date.now() + data.attackSpeed
  };
}

// ============ OYUN DÖNGÜSÜ ============
let lastTimestamp = 0;
function gameLoop(timestamp) {
  if (!gameState.battle.running || gameState.battle.defeated) {
    requestAnimationFrame(gameLoop);
    renderAll();
    return;
  }

  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  const now = Date.now();

  // Efekt süre kontrolleri
  updateEffects(now);

  // Karakter saldırıları
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked || char.isDead) continue;
    if (now >= char.nextAttackAt) {
      performCharacterAttack(charId, now);
    }
  }

  // Canavar saldırısı
  if (gameState.monster && now >= gameState.monster.nextAttackAt) {
    performMonsterAttack(now);
  }

  // Canlanma kontrolü
  checkRevives(now);

  // UI güncelle (her frame değil, throttle)
  renderAll();

  requestAnimationFrame(gameLoop);
}

// ============ KARAKTER SALDIRISI ============
function performCharacterAttack(charId, now) {
  const char = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const monster = gameState.monster;
  if (!monster) return;

  // Hasar hesapla
  let damage = Math.max(1, char.atk - 0); // Canavar DEF yok (demo)

  // Zehirli ok efekti varsa düşman %10 fazla hasar alır
  if (gameState.effects.poisonArrow && now < gameState.effects.poisonArrow.endsAt) {
    damage = Math.floor(damage * 1.1);
  }

  // Canavar HP'yi düşür
  monster.currentHP = Math.max(0, monster.currentHP - damage);

  // Mana doldur
  char.currentMana = Math.min(char.maxMana, char.currentMana + char.manaPerAttack);

  // Sonraki saldırı zamanı
  char.nextAttackAt = now + char.attackSpeed;

  // Hasar animasyonu
  showDamageNumber(damage, false);

  // Canavar öldü mü?
  if (monster.currentHP <= 0) {
    onMonsterDeath();
    return;
  }
}

// ============ CANAVAR ÖLÜMÜ ============
function onMonsterDeath() {
  const monster = gameState.monster;
  if (!monster) return;

  gameState.stats.totalKills++;

  // Loot dağıt
  const loot = monster.loot;
  gameState.inventory.gold += loot.gold;
  gameState.stats.totalGold += loot.gold;

  const materialsGained = {};
  if (loot.woodChance && Math.random() < loot.woodChance) {
    const amt = 1 + (monster.isBoss ? 3 : (monster.isMinibow ? 1 : 0));
    gameState.inventory.wood += amt;
    materialsGained.wood = amt;
  }
  if (loot.leatherChance && Math.random() < loot.leatherChance) {
    const amt = 1 + (monster.isBoss ? 3 : (monster.isMinibow ? 1 : 0));
    gameState.inventory.leather += amt;
    materialsGained.leather = amt;
  }
  if (loot.ironChance && Math.random() < loot.ironChance) {
    const amt = 1 + (monster.isBoss ? 2 : 0);
    gameState.inventory.iron += amt;
    materialsGained.iron = amt;
  }

  // EXP dağıt (tüm canlı karakterlere)
  const exp = monster.exp;
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked || char.isDead) continue;
    char.exp += exp;
    checkLevelUp(charId);
  }

  // Chapter aç (boss yenildiyse)
  if (monster.isBoss || monster.isMinibow) {
    const nextChapter = monster.chapter + 1;
    if (nextChapter <= 20 && nextChapter > gameState.highestUnlockedChapter) {
      gameState.highestUnlockedChapter = nextChapter;
      showNotification(`🗺️ ${nextChapter > 10 ? 'Goblin Ormanı' : 'Slime Vadisi'} — Bölüm ${nextChapter} açıldı!`, 'chapter');
    }
    // Karakter açma
    if (monster.unlockCharacter) {
      unlockCharacter(monster.unlockCharacter);
    }
  } else {
    // Normal canavar: sadece bir sonraki chapter kilidi
    const nextChapter = monster.chapter + 1;
    if (nextChapter <= 20 && nextChapter > gameState.highestUnlockedChapter) {
      gameState.highestUnlockedChapter = nextChapter;
    }
  }

  // Item drop kontrolü
  checkItemDrop(monster.chapter);

  // Loot bildirimi göster
  showLootNotification(loot.gold, materialsGained);

  // Aynı chapter'da yeni canavar spawn et (farming sistemi)
  setTimeout(() => {
    spawnMonster(gameState.currentChapter);
    renderAll();
  }, 400);

  gameState.monster = null; // Kısa süreliğine null
  renderAll();
}

// ============ CANAVAR SALDIRISI ============
function performMonsterAttack(now) {
  const monster = gameState.monster;
  if (!monster) return;

  // Hangi karakteri hedef al?
  let targetId = null;

  // Taunt aktifse sadece Savaşçı'ya vur
  if (gameState.effects.taunt && now < gameState.effects.taunt.endsAt) {
    const warrior = gameState.characters['warrior'];
    if (warrior && warrior.unlocked && !warrior.isDead) {
      targetId = 'warrior';
    }
  }

  // Taunt yoksa rastgele canlı karakter
  if (!targetId) {
    const living = ACTIVE_CHARACTER_IDS.filter(id => {
      const c = gameState.characters[id];
      return c.unlocked && !c.isDead;
    });
    if (living.length === 0) {
      // Tüm karakter öldü — yenilgi
      triggerDefeat();
      return;
    }
    targetId = living[Math.floor(Math.random() * living.length)];
  }

  const target = gameState.characters[targetId];
  let damage = Math.max(1, monster.atk - target.def);

  // Taunt aktifse Savaşçı %50 az hasar alır
  if (gameState.effects.taunt && targetId === 'warrior' && now < gameState.effects.taunt.endsAt) {
    damage = Math.floor(damage * 0.5);
  }

  target.currentHP = Math.max(0, target.currentHP - damage);
  monster.nextAttackAt = now + monster.attackSpeed;

  // Hasar animasyonu (karakter üzerinde)
  showCharacterDamage(targetId, damage);

  // Karakter öldü mü?
  if (target.currentHP <= 0) {
    killCharacter(targetId, now);
  }
}

// ============ KARAKTER ÖLÜM / CANLANMA ============
function killCharacter(charId, now) {
  const char = gameState.characters[charId];
  char.isDead = true;
  char.currentHP = 0;
  char.currentMana = 0;
  char.reviveReady = false;
  char.reviveReadyAt = now + 30000; // 30 saniye cooldown

  showNotification(`💀 ${CHARACTERS[charId].name} savaştan düştü!`, 'death');

  // Tüm ekip öldü mü?
  const allDead = ACTIVE_CHARACTER_IDS.every(id => {
    const c = gameState.characters[id];
    return !c.unlocked || c.isDead;
  });
  if (allDead) {
    setTimeout(() => triggerDefeat(), 300);
  }
}

function checkRevives(now) {
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (char.isDead && !char.reviveReady && char.reviveReadyAt && now >= char.reviveReadyAt) {
      char.reviveReady = true;
      showNotification(`✅ ${CHARACTERS[charId].name} savaşa hazır! İkona tıkla.`, 'revive');
    }
  }
}

function reviveCharacter(charId) {
  const char = gameState.characters[charId];
  if (!char.isDead || !char.reviveReady) return;

  const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
  char.currentHP = stats.hp;
  char.maxHP = stats.hp;
  char.currentMana = 0;
  char.isDead = false;
  char.reviveReady = false;
  char.reviveReadyAt = null;
  char.nextAttackAt = Date.now() + char.attackSpeed;

  showNotification(`⚔️ ${CHARACTERS[charId].name} savaşa geri döndü!`, 'revive');
}

// ============ YENİLGİ ============
function triggerDefeat() {
  gameState.battle.defeated = true;
  showDefeatScreen();
}

function restartBattle() {
  // Tüm karakterleri tam HP ile canlandır
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked) continue;
    const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
    char.currentHP = stats.hp;
    char.maxHP = stats.hp;
    char.currentMana = 0;
    char.isDead = false;
    char.reviveReady = false;
    char.reviveReadyAt = null;
    char.nextAttackAt = Date.now() + 1000;
  }

  gameState.effects = { taunt: null, poisonArrow: null, taunted: false };
  gameState.battle.defeated = false;

  spawnMonster(gameState.currentChapter);
  hideDefeatScreen();
  renderAll();
}

// ============ CHAPTER DEĞİŞTİR ============
function switchChapter(chapter) {
  if (chapter > gameState.highestUnlockedChapter) return;
  if (chapter < 1 || chapter > 20) return;

  gameState.currentChapter = chapter;
  gameState.effects = { taunt: null, poisonArrow: null, taunted: false };
  spawnMonster(chapter);
  renderAll();
  updateChapterSelector();
}

// ============ SKİLL SİSTEMİ ============
function useSkill(charId) {
  const char = gameState.characters[charId];
  const charData = CHARACTERS[charId];
  const skill = charData.skill;

  if (char.isDead || !char.unlocked) return;
  if (char.currentMana < skill.manaCost) return;
  if (!gameState.monster) return;

  char.currentMana -= skill.manaCost;
  const now = Date.now();

  if (skill.effect === 'taunt') {
    gameState.effects.taunt = { endsAt: now + skill.duration };
    showNotification(`🛡️ Taunt! Canavar 4sn boyunca sadece Savaşçı'ya vuruyor.`, 'skill');
  } else if (skill.effect === 'poisonArrow') {
    // Önce 2x hasar ver
    const normalDmg = Math.max(1, char.atk);
    const harm = normalDmg * 2;
    gameState.monster.currentHP = Math.max(0, gameState.monster.currentHP - harm);
    showDamageNumber(harm, false, true);
    gameState.effects.poisonArrow = { endsAt: now + skill.duration };
    showNotification(`☠️ Zehirli Ok! Canavar 5sn boyunca %10 fazla hasar alıyor.`, 'skill');
    if (gameState.monster.currentHP <= 0) {
      onMonsterDeath();
      return;
    }
  }

  renderAll();
}

// ============ EFEKTLERİ GÜNCELLE ============
function updateEffects(now) {
  if (gameState.effects.taunt && now >= gameState.effects.taunt.endsAt) {
    gameState.effects.taunt = null;
  }
  if (gameState.effects.poisonArrow && now >= gameState.effects.poisonArrow.endsAt) {
    gameState.effects.poisonArrow = null;
  }
}

// ============ LEVEL UP ============
function checkLevelUp(charId) {
  const char = gameState.characters[charId];
  const needed = expRequired(char.level);
  if (char.exp >= needed) {
    char.exp -= needed;
    char.level++;
    // Stat'ları güncelle
    const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
    const hpDiff = stats.hp - char.maxHP;
    char.maxHP = stats.hp;
    char.currentHP = Math.min(char.maxHP, char.currentHP + hpDiff);
    char.atk = stats.atk;
    char.def = stats.def;
    char.maxMana = stats.manaMax;
    showNotification(`⬆️ ${CHARACTERS[charId].name} seviye ${char.level}'e ulaştı!`, 'levelup');
  }
}

// ============ KARAKTER AÇMA ============
function unlockCharacter(charId) {
  const char = gameState.characters[charId];
  if (char.unlocked) return;
  char.unlocked = true;
  const stats = getCharacterStats(charId, char.level, []);
  char.currentHP = stats.hp;
  char.maxHP = stats.hp;
  char.currentMana = 0;
  char.maxMana = stats.manaMax;
  char.atk = stats.atk;
  char.def = stats.def;
  char.nextAttackAt = Date.now() + 2000;
  showNotification(`🎉 ${CHARACTERS[charId].name} ekibe katıldı!`, 'unlock');
}

// ============ ITEM DROP ============
function checkItemDrop(chapter) {
  // Bu chapter'da drop olacak itemler
  for (const [itemId, dropChapter] of Object.entries(ITEM_DROP_CHAPTERS)) {
    if (chapter !== dropChapter) continue;
    if (gameState.droppedItems.includes(itemId)) continue;
    // %30 şans her öldürmede, boss/miniboss garanti
    const monster = MONSTERS[chapter];
    const guaranteed = monster.isBoss || monster.isMinibow;
    if (guaranteed || Math.random() < 0.3) {
      giveItem(itemId);
    }
  }
}

function giveItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  if (gameState.droppedItems.includes(itemId)) return;

  const charState = gameState.characters[item.characterId];
  if (!charState) return;

  gameState.droppedItems.push(itemId);
  charState.items[item.slot] = { itemId, level: 1 };

  // Stat'ları güncelle
  const stats = getCharacterStats(item.characterId, charState.level, charState.items.filter(Boolean));
  const hpDiff = stats.hp - charState.maxHP;
  charState.maxHP = stats.hp;
  charState.currentHP = Math.min(charState.maxHP, charState.currentHP + Math.max(0, hpDiff));
  charState.atk = stats.atk;
  charState.def = stats.def;

  showNotification(`🎁 ${item.icon} ${item.name} kazanıldı! (${CHARACTERS[item.characterId].name})`, 'item');
}

// ============ ITEM GELİŞTİRME ============
function upgradeItem(charId, slotIndex) {
  const charState = gameState.characters[charId];
  const equip = charState.items[slotIndex];
  if (!equip) return false;

  const item = ITEMS[equip.itemId];
  const costs = item.upgradeCosts(equip.level);

  // Materyal yeterli mi?
  for (const [mat, amount] of Object.entries(costs)) {
    if ((gameState.inventory[mat] || 0) < amount) {
      showNotification('❌ Yetersiz materyal!', 'error');
      return false;
    }
  }

  // Materyalleri düş
  for (const [mat, amount] of Object.entries(costs)) {
    gameState.inventory[mat] -= amount;
  }

  equip.level++;

  // Stat'ları güncelle
  const stats = getCharacterStats(charId, charState.level, charState.items.filter(Boolean));
  const hpDiff = stats.hp - charState.maxHP;
  charState.maxHP = stats.hp;
  charState.currentHP = Math.min(charState.maxHP, charState.currentHP + Math.max(0, hpDiff));
  charState.atk = stats.atk;
  charState.def = stats.def;

  showNotification(`⬆️ ${item.icon} ${item.name} +${equip.level} seviyeye yükseltildi!`, 'upgrade');
  saveGame(gameState);
  return true;
}

// ============ TIKLAMA HASARI ============
function playerClickMonster() {
  if (!gameState.monster || !gameState.battle.running || gameState.battle.defeated) return;

  // Toplam ekip ATK'nın %5'i
  let totalATK = 0;
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const c = gameState.characters[charId];
    if (c.unlocked && !c.isDead) totalATK += c.atk;
  }
  const clickDamage = Math.max(1, Math.floor(totalATK * 0.05));

  // Zehirli ok aktifse
  let dmg = clickDamage;
  if (gameState.effects.poisonArrow && Date.now() < gameState.effects.poisonArrow.endsAt) {
    dmg = Math.floor(dmg * 1.1);
  }

  gameState.monster.currentHP = Math.max(0, gameState.monster.currentHP - dmg);
  showDamageNumber(dmg, true);

  if (gameState.monster.currentHP <= 0) {
    onMonsterDeath();
  }
}

// ============ OFFLINE KAZAN UYGULA ============
function applyOfflineEarnings(earnings) {
  gameState.inventory.gold += earnings.gold;
  gameState.inventory.wood += earnings.wood;
  gameState.inventory.leather += earnings.leather;
  gameState.inventory.iron += earnings.iron;
  renderInventory();
}
