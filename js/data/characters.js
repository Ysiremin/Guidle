const CHARACTERS = {
  warrior: {
    id: 'warrior',
    name: 'Savaşçı',
    icon: '⚔️',
    portrait: '🛡️',
    unlocksAtChapter: 1,
    role: 'Tank + Saldırı',
    color: '#c0392b',
    baseStats: {
      hp: 220,
      atk: 16,
      def: 8,
      manaMax: 50,
      attackSpeed: 1600, // ms between attacks
      manaPerAttack: 5
    },
    growthPerLevel: {
      hp: 0.12,
      atk: 0.08,
      def: 0.05
    },
    skill: {
      id: 'taunt',
      name: 'Taunt',
      icon: '🛡️',
      manaCost: 50,
      description: 'Canavar 4sn boyunca sadece Savaşçı\'ya vurur. Savaşçı bu sürede %50 az hasar alır.',
      duration: 4000, // ms
      effect: 'taunt'
    },
    itemSlots: ['sword', 'shield', 'armor', 'helmet']
  },
  archer: {
    id: 'archer',
    name: 'Okçu',
    icon: '🏹',
    portrait: '🧝',
    unlocksAtChapter: 5, // Büyük Slime (Ch.5 Mini Boss) yenilince açılır — demo
    role: 'Hızlı DPS',
    color: '#27ae60',
    baseStats: {
      hp: 130,
      atk: 24,
      def: 2,
      manaMax: 40,
      attackSpeed: 800,
      manaPerAttack: 4
    },
    growthPerLevel: {
      hp: 0.08,
      atk: 0.10,
      def: 0.03
    },
    skill: {
      id: 'poisonArrow',
      name: 'Zehirli Ok',
      icon: '☠️',
      manaCost: 40,
      description: 'Normal saldırısının 2 katı hasar + 5sn zehir: düşman %10 fazla hasar alır.',
      duration: 5000,
      effect: 'poisonArrow'
    },
    itemSlots: ['bow', 'arrow', 'leatherArmor', 'gloves']
  },
  // Kilitli karakterler (sonraki sürüm)
  mage: {
    id: 'mage',
    name: 'Büyücü',
    icon: '🔮',
    portrait: '🧙‍♂️',
    unlocksAtChapter: 999,
    role: 'Yavaş / Yüksek Hasar',
    color: '#8e44ad',
    locked: true,
    baseStats: { hp: 90, atk: 40, def: 1, manaMax: 60, attackSpeed: 2500, manaPerAttack: 8 },
    growthPerLevel: { hp: 0.06, atk: 0.12, def: 0.02 },
    skill: {
      id: 'fireball',
      name: 'Alev Topu',
      icon: '🔥',
      manaCost: 60,
      description: 'Yüksek anlık hasar + 4sn yanma hasarı (DoT).',
      duration: 4000,
      effect: 'fireball'
    },
    itemSlots: ['staff', 'spellbook', 'robe', 'necklace']
  },
  priest: {
    id: 'priest',
    name: 'Rahip',
    icon: '✨',
    portrait: '👼',
    unlocksAtChapter: 999,
    role: 'Destek + Saldırı',
    color: '#f39c12',
    locked: true,
    baseStats: { hp: 160, atk: 14, def: 4, manaMax: 45, attackSpeed: 2000, manaPerAttack: 6 },
    growthPerLevel: { hp: 0.10, atk: 0.07, def: 0.04 },
    skill: {
      id: 'blessing',
      name: 'Kutsama',
      icon: '🌟',
      manaCost: 45,
      description: 'Tüm ekibe sabit can yeniler + 5sn %15 hasar artışı buffu verir.',
      duration: 5000,
      effect: 'blessing'
    },
    itemSlots: ['holyStaff', 'holyBook', 'cowl', 'ring']
  }
};

// Aktif oynanabilir karakter listesi (sıra önemli — ekip düzeni)
const ACTIVE_CHARACTER_IDS = ['warrior', 'archer', 'mage', 'priest'];

// Karakter stat hesaplama (level bazlı)
function getCharacterStats(charId, level, equippedItems) {
  const base = CHARACTERS[charId].baseStats;
  const growth = CHARACTERS[charId].growthPerLevel;
  const lvl = level || 1;

  let stats = {
    hp: Math.floor(base.hp * (1 + growth.hp * (lvl - 1))),
    atk: Math.floor(base.atk * (1 + growth.atk * (lvl - 1))),
    def: Math.floor(base.def * (1 + (growth.def || 0) * (lvl - 1))),
    manaMax: base.manaMax,
    attackSpeed: base.attackSpeed,
    manaPerAttack: base.manaPerAttack
  };

  // Item bonusları ekle
  if (equippedItems) {
    equippedItems.forEach(equip => {
      if (!equip || !ITEMS[equip.itemId]) return;
      const item = ITEMS[equip.itemId];
      const itemLvl = equip.level || 1;
      const bonus = item.baseBonus + item.bonusPerLevel * (itemLvl - 1);
      stats[item.stat] = (stats[item.stat] || 0) + bonus;
    });
  }

  return stats;
}

// EXP gereksinimi hesaplama
function expRequired(level) {
  return Math.floor(50 * Math.pow(level, 1.5));
}
