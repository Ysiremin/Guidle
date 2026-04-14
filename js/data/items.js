const ITEMS = {
  // === SAVAŞÇI ===
  sword: {
    id: 'sword',
    name: 'Kılıç',
    icon: '⚔️',
    characterId: 'warrior',
    slot: 0,
    slotName: 'Slot 1',
    stat: 'atk',
    baseBonus: 5,
    bonusPerLevel: 3,
    dropChapter: 1,
    upgradeCosts: (level) => ({ wood: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Savaşçının temel silahı. ATK artırır.'
  },
  shield: {
    id: 'shield',
    name: 'Kalkan',
    icon: '🛡️',
    characterId: 'warrior',
    slot: 1,
    slotName: 'Slot 2',
    stat: 'def',
    baseBonus: 4,
    bonusPerLevel: 2,
    dropChapter: 3,
    upgradeCosts: (level) => ({ wood: Math.floor(3 * Math.pow(level, 1.3)), leather: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Hasar azaltır. DEF artırır.'
  },
  armor: {
    id: 'armor',
    name: 'Zırh',
    icon: '🥋',
    characterId: 'warrior',
    slot: 2,
    slotName: 'Slot 3',
    stat: 'hp',
    baseBonus: 30,
    bonusPerLevel: 20,
    dropChapter: 6,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)), iron: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Maksimum HP artırır.'
  },
  helmet: {
    id: 'helmet',
    name: 'Miğfer',
    icon: '⛑️',
    characterId: 'warrior',
    slot: 3,
    slotName: 'Slot 4',
    stat: 'atk',
    baseBonus: 4,
    bonusPerLevel: 3,
    dropChapter: 9,
    upgradeCosts: (level) => ({ iron: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Savaşçının kaskı. ATK artırır.'
  },

  // === OKÇU ===
  bow: {
    id: 'bow',
    name: 'Yay',
    icon: '🏹',
    characterId: 'archer',
    slot: 0,
    slotName: 'Slot 1',
    stat: 'atk',
    baseBonus: 6,
    bonusPerLevel: 4,
    dropChapter: 11,
    upgradeCosts: (level) => ({ wood: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Okçunun ana silahı. ATK artırır.'
  },
  arrow: {
    id: 'arrow',
    name: 'Ok Kılıfı',
    icon: '🪃',
    characterId: 'archer',
    slot: 1,
    slotName: 'Slot 2',
    stat: 'atk',
    baseBonus: 3,
    bonusPerLevel: 2,
    dropChapter: 13,
    upgradeCosts: (level) => ({ wood: Math.floor(4 * Math.pow(level, 1.3)), leather: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Ek ATK sağlar.'
  },
  leatherArmor: {
    id: 'leatherArmor',
    name: 'Deri Zırh',
    icon: '🧥',
    characterId: 'archer',
    slot: 2,
    slotName: 'Slot 3',
    stat: 'hp',
    baseBonus: 20,
    bonusPerLevel: 15,
    dropChapter: 15,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Okçunun hafif zırhı. HP artırır.'
  },
  gloves: {
    id: 'gloves',
    name: 'Eldiven',
    icon: '🧤',
    characterId: 'archer',
    slot: 3,
    slotName: 'Slot 4',
    stat: 'atk',
    baseBonus: 4,
    bonusPerLevel: 3,
    dropChapter: 18,
    upgradeCosts: (level) => ({ leather: Math.floor(3 * Math.pow(level, 1.3)), iron: Math.floor(3 * Math.pow(level, 1.2)) }),
    description: 'Hız eldivenleri. ATK artırır.'
  }
};

// Karakter başına item listesi
const CHARACTER_ITEMS = {
  warrior: ['sword', 'shield', 'armor', 'helmet'],
  archer: ['bow', 'arrow', 'leatherArmor', 'gloves']
};
