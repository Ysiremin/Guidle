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
  },

  // Yeni açılan chapter'lar (bar'da pulse göstermek için)
  pendingNewUnlocks: new Set(),

  // Boss zaman sayıcı
  bossTimer: {
    active: false,
    endsAt: null,
    duration: 0   // saniye
  },

  // Güç Artışları (upgrades)
  upgrades: null  // initGame'de getDefaultUpgrades() ile doldurulur
};

// ============ INIT ============
function initGame() {
  // Save'yi yükle ya da default başla
  const saved = loadGame();
  const isFirstRun = !saved;

  // Upgrade state başlat (her zaman default ile başla, sonra üstüne yükle)
  gameState.upgrades = getDefaultUpgrades();

  if (saved) {
    gameState.currentChapter = saved.progress.currentChapter || 1;
    gameState.highestUnlockedChapter = saved.progress.highestUnlockedChapter || 1;
    gameState.inventory = { ...saved.inventory };
    gameState.droppedItems = saved.droppedItems || [];
    // Upgrade'leri kayıttan yükle
    if (saved.upgrades) {
      for (const u of CLICK_UPGRADES) {
        if (saved.upgrades.click?.[u.id]) {
          gameState.upgrades.click[u.id] = { ...saved.upgrades.click[u.id] };
        }
      }
      for (const u of AUTO_UPGRADES) {
        if (saved.upgrades.auto?.[u.id]) {
          gameState.upgrades.auto[u.id] = { ...saved.upgrades.auto[u.id] };
        }
      }
    }
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

  // Auto bonus'u yüklenmiş upgrade'lere göre uygula
  applyAutoBonus();

  // Savaşçı baştan açık — kılıcı (slot 0) ile birlikte başlasın
  if (isFirstRun) {
    const warriorStarterItemId = CHARACTERS['warrior'].itemSlots?.[0]; // 'sword'
    if (warriorStarterItemId && !gameState.droppedItems.includes(warriorStarterItemId)) {
      gameState.droppedItems.push(warriorStarterItemId);
      const warriorState = gameState.characters['warrior'];
      warriorState.items[0] = { itemId: warriorStarterItemId, level: 1 };
      // Stat’ları güncelle
      const ws = getCharacterStats('warrior', warriorState.level, warriorState.items.filter(Boolean));
      warriorState.atk = ws.atk;
      warriorState.def = ws.def;
      warriorState.maxHP = ws.hp;
      warriorState.currentHP = ws.hp;
    }
  }

  // Canavari spawn et
  spawnMonster(gameState.currentChapter);

  // Offline kazanç hesapla
  let offlineEarnings = null;
  if (saved && saved.lastOnline && !isFirstRun) {
    offlineEarnings = calculateOfflineEarnings(saved.lastOnline, gameState);
  }

  // Loot sistemini başlat
  initLootSystem();

  // Otomatik kayıt başlat
  startAutosave(() => gameState);

  // Geliştirme kontrol zamanlayıcısı (her 3 saniyede bir)
  setInterval(checkAndShowUpgradeToast, 3000);

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

  // Boss / Mini Boss için geri sayım başlat
  if (data.isBoss || data.isMinibow) {
    startBossTimer(data);
  } else {
    // Normal canavar — timer'i durdur
    gameState.bossTimer.active = false;
  }
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

  // Boss timer kontrolü
  if (gameState.bossTimer.active && now >= gameState.bossTimer.endsAt) {
    gameState.bossTimer.active = false;
    triggerBossEnrage();
    requestAnimationFrame(gameLoop);
    return;
  }

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

  // Hasar + efekt animasyonları
  showDamageNumber(damage, false);
  showMonsterShake();
  showSlashEffect('auto');

  // Savaş sırasında rastgele küçük drop (%6 şans)
  if (Math.random() < COMBAT_DROP_CHANCE) {
    spawnCombatDrop();
  }

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

  // Loot — artık otomatik eklenmez, ekrana saçılır ve oyuncu toplar
  const loot = monster.loot;
  spawnKillLoot(loot, monster);

  // EXP dağıt (tüm canlı karakterlere)
  const exp = monster.exp;
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked || char.isDead) continue;
    char.exp += exp;
    checkLevelUp(charId);
  }

  // Canavar öldüğünde tüm aktif efektleri sıfırla
  // (zehir, taunt vs. bir sonraki canavardan başlamasın)
  gameState.effects = { taunt: null, poisonArrow: null, taunted: false };

  // Canavar öldüğünde tüm karakterlerin HP'sini yenile + ölü olanları canlandır
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked) continue;
    const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
    if (char.isDead) {
      // Ölü karakteri canlandır
      char.isDead = false;
      char.reviveReady = false;
      char.reviveReadyAt = null;
      char.currentHP = stats.hp;
      char.maxHP = stats.hp;
      char.currentMana = 0;
      char.nextAttackAt = Date.now() + 1200;
      showNotification(`⚛️ ${CHARACTERS[charId].name} savaşa geri döndü!`, 'revive');
    } else {
      // Canlı karakterin HP'sini tam yenile
      char.currentHP = char.maxHP;
    }
  }

  // Chapter aç (boss veya miniboss yenildiyse)
  if (monster.isBoss || monster.isMinibow) {
    const nextChapter = monster.chapter + 1;
    if (nextChapter <= 20 && nextChapter > gameState.highestUnlockedChapter) {
      gameState.highestUnlockedChapter = nextChapter;
      // Sol taraf toast + chapter bar pulse
      setTimeout(() => {
        showChapterUnlockToast(nextChapter);
        markNewChapterUnlock(nextChapter);
      }, 600); // ölüm efekti bittikten sonra
    }
    // Karakter açma: CHAPTER_REWARDS üzerinden yönetiliyor
    // (monster.unlockCharacter artık kullanılmıyor)
  } else {
    // Normal canavar: sonraki chapter kilidini aç
    const nextChapter = monster.chapter + 1;
    if (nextChapter <= 20 && nextChapter > gameState.highestUnlockedChapter) {
      gameState.highestUnlockedChapter = nextChapter;
      // Sol taraf toast + chapter bar pulse
      setTimeout(() => {
        showChapterUnlockToast(nextChapter);
        markNewChapterUnlock(nextChapter);
      }, 600);
    }
  }

  // Chapter ödülleri: item + karakter açılışı (yeni sistem)
  applyChapterRewards(monster.chapter);

  // Canavar ölüm efekti (flash + particles + kill text)
  showKillEffect(loot, monster);

  // Chapter Bar güncelle (yeni unlock açıldıysa)
  updateChapterSelector();

  // Aynı chapter'da yeni canavar spawn et (farming sistemi)
  setTimeout(() => {
    spawnMonster(gameState.currentChapter);
    renderAll();
  }, 480);

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
  gameState.bossTimer.active = false;
  showDefeatScreen();
}

// ============ BOSS ENRAGE (süre dolarsa) ============
function startBossTimer(bossData) {
  // Ekip DPS hesapla
  let totalDPS = 0;
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const c = gameState.characters[charId];
    if (!c.unlocked || c.isDead) continue;
    const spd = CHARACTERS[charId].baseStats.attackSpeed;
    totalDPS += c.atk / (spd / 1000);
  }
  if (totalDPS <= 0) totalDPS = 5;

  // Beklenen süre × 1.8 katsayısı — min 60s, max 180s
  const expectedSec = bossData.maxHP / totalDPS;
  const duration    = Math.max(60, Math.min(180, Math.floor(expectedSec * 1.8)));

  gameState.bossTimer = {
    active: true,
    endsAt: Date.now() + duration * 1000,
    duration
  };

  showNotification(`⏱️ Boss timer: ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2,'0')}`, 'death');
}

function triggerBossEnrage() {
  const monster = gameState.monster;
  const name    = monster ? monster.name : 'Boss';

  // Tüm karakterleri öldür (ama defeat ekranı gösterme)
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const c = gameState.characters[charId];
    if (!c.unlocked || c.isDead) continue;
    c.currentHP = 0;
    c.isDead    = true;
    c.reviveReady    = false;
    c.reviveReadyAt  = null;
    c.currentMana    = 0;
  }

  showNotification(`💥 ${name} TÜM EKİBİ YOK ETTİ! Savaş yeniden başlıyor...`, 'death');
  renderAll();

  // 1.8sn sonra boss + ekip HP'sini sıfırla ve yeniden başlat
  setTimeout(() => {
    resetBossFight();
  }, 1800);
}

function resetBossFight() {
  const chapter = gameState.currentChapter;

  // Tüm karakterleri canlandır
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const c = gameState.characters[charId];
    if (!c.unlocked) continue;
    const stats = getCharacterStats(charId, c.level, c.items.filter(Boolean));
    c.isDead        = false;
    c.reviveReady   = false;
    c.reviveReadyAt = null;
    c.currentHP     = stats.hp;
    c.maxHP         = stats.hp;
    c.currentMana   = 0;
    c.nextAttackAt  = Date.now() + 1500;
  }

  // Boss'u yeniden spawn et (HP sıfırlanır)
  gameState.effects = { taunt: null, poisonArrow: null, taunted: false };
  spawnMonster(chapter);
  renderAll();
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
  gameState.bossTimer.active = false;

  spawnMonster(gameState.currentChapter);
  hideDefeatScreen();
  renderAll();
}

// ============ CHAPTER DEĞİŞTİR ============
function switchChapter(chapter) {
  if (chapter > gameState.highestUnlockedChapter) return;
  if (chapter < 1 || chapter > 20) return;

  // Ekrandaki lootları otomatik topla (kaybetme)
  collectAllLoot();

  gameState.currentChapter = chapter;
  // Aktif efektleri sıfırla
  gameState.effects = { taunt: null, poisonArrow: null, taunted: false };
  gameState.bossTimer.active = false;

  // Tüm karakterleri sıfırla: HP, mana, ölüm durumu
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const char = gameState.characters[charId];
    if (!char.unlocked) continue;
    const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
    char.currentHP  = stats.hp;
    char.maxHP      = stats.hp;
    char.currentMana = 0;
    char.isDead      = false;
    char.reviveReady = false;
    char.reviveReadyAt = null;
    char.nextAttackAt  = Date.now() + 1000;
  }

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
    showSlashEffect('skill');
    showMonsterShake();
    showNotification(`🛡️ Taunt! Canavar 4sn boyunca sadece Savaşçı'ya vuruyor.`, 'skill');
  } else if (skill.effect === 'poisonArrow') {
    const normalDmg = Math.max(1, char.atk);
    const harm = normalDmg * 2;
    gameState.monster.currentHP = Math.max(0, gameState.monster.currentHP - harm);
    showDamageNumber(harm, false, true);
    showSlashEffect('skill');
    showMonsterShake();
    gameState.effects.poisonArrow = { endsAt: now + skill.duration };
    showNotification(`☠️ Zehirli Ok! Canavar 5sn boyunca %10 fazla hasar alıyor.`, 'skill');
    if (gameState.monster.currentHP <= 0) {
      onMonsterDeath();
      return;
    }
  }

  // Mini-icon slide-back animasyonu
  const skillMini = document.getElementById(`skill-icon-${charId}`);
  if (skillMini) {
    skillMini.classList.remove('visible');
    skillMini.classList.add('sliding-back');
    setTimeout(() => skillMini.classList.remove('sliding-back'), 300);
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
    char.atk = stats.atk + getTotalAutoBonus();
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

  // İlk item (slot 0) otomatik takılı gelir
  const starterItemId = CHARACTERS[charId].itemSlots?.[0];
  if (starterItemId && !gameState.droppedItems.includes(starterItemId)) {
    gameState.droppedItems.push(starterItemId);
    char.items[0] = { itemId: starterItemId, level: 1 };
  }

  const stats = getCharacterStats(charId, char.level, char.items.filter(Boolean));
  char.currentHP = stats.hp;
  char.maxHP = stats.hp;
  char.currentMana = 0;
  char.maxMana = stats.manaMax;
  char.atk = stats.atk + getTotalAutoBonus();
  char.def = stats.def;
  char.nextAttackAt = Date.now() + 2000;

  const item = starterItemId ? ITEMS[starterItemId] : null;
  const itemText = item ? ` (${item.icon} ${item.name} ile)` : '';
  showNotification(`🎉 ${CHARACTERS[charId].name} ekibe katıldı${itemText}!`, 'unlock');
}

// ============ CHAPTER ÖDÜLLERİ (item + karakter açılışı) ============
function applyChapterRewards(chapter) {
  const reward = CHAPTER_REWARDS[chapter];
  if (!reward) return;

  // Karakter açılışı
  if (reward.unlockChar) {
    const char = gameState.characters[reward.unlockChar];
    if (char && !char.unlocked) {
      unlockCharacter(reward.unlockChar);
    }
  }

  // Item’lar garanti verilir (bir kez)
  for (const itemId of reward.items) {
    if (!gameState.droppedItems.includes(itemId)) {
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
  charState.atk = stats.atk + getTotalAutoBonus();
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
  charState.atk = stats.atk + getTotalAutoBonus();
  charState.def = stats.def;

  showNotification(`⬆️ ${item.icon} ${item.name} +${equip.level} seviyeye yükseltildi!`, 'upgrade');
  saveGame(gameState);
  return true;
}

// ============ TIKLAMA HASARI ============
function playerClickMonster() {
  if (!gameState.monster || !gameState.battle.running || gameState.battle.defeated) return;

  // Toplamekip ATK'sının %25'i + her level başına flat bonus
  const living = ACTIVE_CHARACTER_IDS.filter(id => {
    const c = gameState.characters[id];
    return c.unlocked && !c.isDead;
  });
  if (living.length === 0) return;

  let totalATK = 0;
  let totalLevel = 0;
  for (const charId of living) {
    const c = gameState.characters[charId];
    totalATK   += c.atk;
    totalLevel += c.level;
  }
  const avgLevel        = Math.floor(totalLevel / living.length);
  const baseClickDmg    = Math.max(1, Math.floor(totalATK * 0.25));
  const levelBonus      = avgLevel * 2;
  let clickDamage       = baseClickDmg + levelBonus + getTotalClickBonus();

  // Zehirli ok aktifse bonus
  if (gameState.effects.poisonArrow && Date.now() < gameState.effects.poisonArrow.endsAt) {
    clickDamage = Math.floor(clickDamage * 1.1);
  }

  gameState.monster.currentHP = Math.max(0, gameState.monster.currentHP - clickDamage);
  showDamageNumber(clickDamage, true);
  showSlashEffect('click');

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
