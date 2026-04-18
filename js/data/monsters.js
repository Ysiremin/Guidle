// Canavar statları chapter'a göre ölçeklenir
function getMonsterHP(chapter, isBoss, isMinibow) {
  const base = Math.floor(250 * Math.pow(1.32, chapter - 1));
  if (isBoss) return base * 6;
  if (isMinibow) return base * 3;
  return base;
}
function getMonsterATK(chapter, isBoss, isMinibow) {
  const base = Math.floor(6 * Math.pow(1.20, chapter - 1));
  if (isBoss) return Math.floor(base * 1.8);
  if (isMinibow) return Math.floor(base * 1.4);
  return base;
}
function getMonsterGold(chapter, isBoss, isMinibow) {
  const base = Math.floor(10 * Math.pow(1.18, chapter - 1));
  if (isBoss) return base * 5;
  if (isMinibow) return base * 3;
  return base;
}
function getMonsterEXP(chapter, isBoss, isMinibow) {
  const base = Math.floor(20 * Math.pow(1.2, chapter - 1));
  if (isBoss) return base * 4;
  if (isMinibow) return base * 2;
  return base;
}

// Loot tablosu: { materyal_id: drop_şansı_0-1 }
function getMonsterLoot(chapter, isBoss, isMinibow) {
  const loot = { gold: getMonsterGold(chapter, isBoss, isMinibow) };
  // Ch 1-10: Odun düşer, Ch 3+ Deri de düşer, Ch 7+ Demir de düşer
  if (chapter >= 1) loot.woodChance = isBoss ? 1.0 : (isMinibow ? 0.8 : 0.45);
  if (chapter >= 3) loot.leatherChance = isBoss ? 1.0 : (isMinibow ? 0.7 : 0.35);
  if (chapter >= 7) loot.ironChance = isBoss ? 1.0 : (isMinibow ? 0.6 : 0.25);
  // Ch 11+: Deri ve Demir ağırlıklı
  if (chapter >= 11) {
    loot.woodChance = 0.1;
    loot.leatherChance = isBoss ? 1.0 : (isMinibow ? 0.85 : 0.55);
    loot.ironChance = isBoss ? 1.0 : (isMinibow ? 0.7 : 0.40);
  }
  return loot;
}

const MONSTERS = {
  // ============ BÖLÜM 1-10: SLİME VADİSİ ============
  1: {
    id: 1, chapter: 1, region: 'Slime Vadisi',
    name: 'Küçük Yeşil Slime', emoji: '🫧',
    description: 'Temel düşman, zayıf',
    isBoss: false, isMinibow: false,
    attackSpeed: 2200
  },
  2: {
    id: 2, chapter: 2, region: 'Slime Vadisi',
    name: 'Mavi Slime', emoji: '💧',
    description: 'Biraz daha hızlı saldırır',
    isBoss: false, isMinibow: false,
    attackSpeed: 1900
  },
  3: {
    id: 3, chapter: 3, region: 'Slime Vadisi',
    name: 'Sarı Slime', emoji: '🟡',
    description: 'Zehirli görünümlü',
    isBoss: false, isMinibow: false,
    attackSpeed: 2000
  },
  4: {
    id: 4, chapter: 4, region: 'Slime Vadisi',
    name: 'Kırmızı Slime', emoji: '🔴',
    description: 'Ateşli renkte',
    isBoss: false, isMinibow: false,
    attackSpeed: 1800
  },
  5: {
    id: 5, chapter: 5, region: 'Slime Vadisi',
    name: 'Büyük Slime', emoji: '🫧',
    description: 'Yüksek HP, yavaş — Mini Boss',
    isBoss: false, isMinibow: true,
    attackSpeed: 2800,
    unlockCharacter: 'archer'
  },
  6: {
    id: 6, chapter: 6, region: 'Slime Vadisi',
    name: 'Buz Slime', emoji: '🩵',
    description: 'Soğuk ve tehlikeli',
    isBoss: false, isMinibow: false,
    attackSpeed: 2100
  },
  7: {
    id: 7, chapter: 7, region: 'Slime Vadisi',
    name: 'Karanlık Slime', emoji: '🖤',
    description: 'Karanlık hasar verir',
    isBoss: false, isMinibow: false,
    attackSpeed: 1700
  },
  8: {
    id: 8, chapter: 8, region: 'Slime Vadisi',
    name: 'Dev Slime', emoji: '💀',
    description: 'Güçlü, neredeyse boss gibi',
    isBoss: false, isMinibow: false,
    attackSpeed: 2500
  },
  9: {
    id: 9, chapter: 9, region: 'Slime Vadisi',
    name: 'Çift Başlı Slime', emoji: '👾',
    description: 'İki HP barı gibi dayanıklı',
    isBoss: false, isMinibow: false,
    attackSpeed: 2000
  },
  10: {
    id: 10, chapter: 10, region: 'Slime Vadisi',
    name: 'Slime Kral', emoji: '👑',
    description: 'Slime Vadisi Boss\'u!',
    isBoss: true, isMinibow: false,
    attackSpeed: 3000
  },

  // ============ BÖLÜM 11-20: GOBLİN ORMANI ============
  11: {
    id: 11, chapter: 11, region: 'Goblin Ormanı',
    name: 'Goblin Asker', emoji: '👺',
    description: 'Dengeli saldırı',
    isBoss: false, isMinibow: false,
    attackSpeed: 1800
  },
  12: {
    id: 12, chapter: 12, region: 'Goblin Ormanı',
    name: 'Goblin Okçu', emoji: '🏹',
    description: 'Uzaktan, hızlı hasar',
    isBoss: false, isMinibow: false,
    attackSpeed: 1400
  },
  13: {
    id: 13, chapter: 13, region: 'Goblin Ormanı',
    name: 'Goblin Şaman', emoji: '🧿',
    description: 'Büyü hasarı',
    isBoss: false, isMinibow: false,
    attackSpeed: 2200
  },
  14: {
    id: 14, chapter: 14, region: 'Goblin Ormanı',
    name: 'Zırhlı Goblin', emoji: '⚔️',
    description: 'Yüksek savunma',
    isBoss: false, isMinibow: false,
    attackSpeed: 2600
  },
  15: {
    id: 15, chapter: 15, region: 'Goblin Ormanı',
    name: 'Goblin Şef', emoji: '😤',
    description: 'AOE saldırı — Mini Boss',
    isBoss: false, isMinibow: true,
    attackSpeed: 2800
  },
  16: {
    id: 16, chapter: 16, region: 'Goblin Ormanı',
    name: 'Goblin Bombacı', emoji: '💣',
    description: 'Patlama hasarı',
    isBoss: false, isMinibow: false,
    attackSpeed: 2000
  },
  17: {
    id: 17, chapter: 17, region: 'Goblin Ormanı',
    name: 'Goblin Avcısı', emoji: '🎯',
    description: 'Kritik vuruş şansı yüksek',
    isBoss: false, isMinibow: false,
    attackSpeed: 1500
  },
  18: {
    id: 18, chapter: 18, region: 'Goblin Ormanı',
    name: 'Goblin Kara Büyücüsü', emoji: '🌑',
    description: 'Debuff uygular',
    isBoss: false, isMinibow: false,
    attackSpeed: 2300
  },
  19: {
    id: 19, chapter: 19, region: 'Goblin Ormanı',
    name: 'Goblin Kral Muhafızı', emoji: '🗡️',
    description: 'Tank tipi, çok HP',
    isBoss: false, isMinibow: false,
    attackSpeed: 2700
  },
  20: {
    id: 20, chapter: 20, region: 'Goblin Ormanı',
    name: 'Goblin Kral', emoji: '👑',
    description: 'Bölge Boss\'u — Çok güçlü!',
    isBoss: true, isMinibow: false,
    attackSpeed: 3200
  }
};

// Chapter'dan canavar verisi al (statlar dahil)
function getMonsterData(chapter) {
  const base = MONSTERS[chapter];
  if (!base) return null;
  const { isBoss, isMinibow } = base;
  return {
    ...base,
    maxHP: getMonsterHP(chapter, isBoss, isMinibow),
    atk: getMonsterATK(chapter, isBoss, isMinibow),
    loot: getMonsterLoot(chapter, isBoss, isMinibow),
    exp: getMonsterEXP(chapter, isBoss, isMinibow)
  };
}

// Bölge adı chapter'dan
function getRegionName(chapter) {
  if (chapter <= 10) return 'Slime Vadisi';
  if (chapter <= 20) return 'Goblin Ormanı';
  return 'Bilinmeyen Bölge';
}

// ============================================================
// CHAPTER SONUNDA NE AÇILIR
//
// Her chapter yenilince (monster ölünce, normal/boss fark etmez)
// aşağıdaki tabloya bakılır.
//
// CHAPTER_REWARDS[chapter] = {
//   unlockChar: 'charId' | null   ← o chapter sonunda açılacak karakter
//   items: ['itemId', ...]         ← verilecek item(lar) (hepsi garanti)
// }
// ============================================================

const CHAPTER_REWARDS = {
   1: { unlockChar: null,      items: [] },              // Savaşçı baştan açık, kılıç ile gelir
   2: { unlockChar: null,      items: ['shield'] },       // Savaşçının kalkanı
   3: { unlockChar: 'archer',  items: [] },              // Okçu yayı ile birlikte açılır
   4: { unlockChar: null,      items: ['arrow'] },        // Okçunun ok kılıfı
   5: { unlockChar: 'mage',    items: [] },              // Büyücü asası ile birlikte açılır
   6: { unlockChar: null,      items: ['spellbook'] },    // Büyücünün büyü kitabı
   7: { unlockChar: null,      items: ['armor'] },        // Savaşçının zırhı
   8: { unlockChar: null,      items: ['leatherArmor'] }, // Okçunun deri zırhı
   9: { unlockChar: null,      items: ['robe'] },         // Büyücünün cübbesi
  10: { unlockChar: 'priest',  items: [] },              // Rahip kutsal asası ile birlikte açılır
  11: { unlockChar: null,      items: ['holyBook'] },     // Rahibin kutsal kitabı
  12: { unlockChar: null,      items: ['helmet'] },       // Savaşçının miğferi
  13: { unlockChar: null,      items: ['gloves'] },       // Okçunun eldiveni
  14: { unlockChar: null,      items: ['necklace'] },     // Büyücünün kolyesi
  15: { unlockChar: null,      items: ['cowl'] },         // Rahibin başlığı
  16: { unlockChar: null,      items: ['ring'] },         // Rahibin yüzüğü
};

// Eski ITEM_DROP_CHAPTERS — artık kullanılmıyor, uyumluluk için boş bırakıldı
const ITEM_DROP_CHAPTERS = {};

