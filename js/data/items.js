const ITEMS = {
  // ============ SAVAŞÇI ============
  sword: {
    id: 'sword', name: 'Kılıç', icon: '⚔️',
    characterId: 'warrior', slot: 0, slotName: 'Slot 1', stat: 'atk',
    baseBonus: 5, bonusPerLevel: 3,
    upgradeCosts: (level) => ({ wood: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Savaşçının temel silahı. ATK artırır.'
  },
  shield: {
    id: 'shield', name: 'Kalkan', icon: '🛡️',
    characterId: 'warrior', slot: 1, slotName: 'Slot 2', stat: 'def',
    baseBonus: 4, bonusPerLevel: 2,
    upgradeCosts: (level) => ({ wood: Math.floor(3 * Math.pow(level, 1.3)), leather: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Hasar azaltır. DEF artırır.'
  },
  armor: {
    id: 'armor', name: 'Zırh', icon: '🥋',
    characterId: 'warrior', slot: 2, slotName: 'Slot 3', stat: 'hp',
    baseBonus: 30, bonusPerLevel: 20,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)), iron: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Maksimum HP artırır.'
  },
  helmet: {
    id: 'helmet', name: 'Miğfer', icon: '⛑️',
    characterId: 'warrior', slot: 3, slotName: 'Slot 4', stat: 'atk',
    baseBonus: 4, bonusPerLevel: 3,
    upgradeCosts: (level) => ({ iron: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Savaşçının kaskı. ATK artırır.'
  },

  // ============ OKÇU ============
  bow: {
    id: 'bow', name: 'Yay', icon: '🏹',
    characterId: 'archer', slot: 0, slotName: 'Slot 1', stat: 'atk',
    baseBonus: 6, bonusPerLevel: 4,
    upgradeCosts: (level) => ({ wood: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Okçunun ana silahı. ATK artırır.'
  },
  arrow: {
    id: 'arrow', name: 'Ok Kılıfı', icon: '🪃',
    characterId: 'archer', slot: 1, slotName: 'Slot 2', stat: 'atk',
    baseBonus: 3, bonusPerLevel: 2,
    upgradeCosts: (level) => ({ wood: Math.floor(4 * Math.pow(level, 1.3)), leather: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Ek ATK sağlar.'
  },
  leatherArmor: {
    id: 'leatherArmor', name: 'Deri Zırh', icon: '🧥',
    characterId: 'archer', slot: 2, slotName: 'Slot 3', stat: 'hp',
    baseBonus: 20, bonusPerLevel: 15,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Okçunun hafif zırhı. HP artırır.'
  },
  gloves: {
    id: 'gloves', name: 'Eldiven', icon: '🧤',
    characterId: 'archer', slot: 3, slotName: 'Slot 4', stat: 'atk',
    baseBonus: 4, bonusPerLevel: 3,
    upgradeCosts: (level) => ({ leather: Math.floor(3 * Math.pow(level, 1.3)), iron: Math.floor(3 * Math.pow(level, 1.2)) }),
    description: 'Hız eldivenleri. ATK artırır.'
  },

  // ============ BÜYÜCÜ ============
  staff: {
    id: 'staff', name: 'Asa', icon: '🪄',
    characterId: 'mage', slot: 0, slotName: 'Slot 1', stat: 'atk',
    baseBonus: 10, bonusPerLevel: 6,
    upgradeCosts: (level) => ({ iron: Math.floor(4 * Math.pow(level, 1.3)), wood: Math.floor(3 * Math.pow(level, 1.2)) }),
    description: 'Büyücünün gücünü artırır. ATK artırır.'
  },
  spellbook: {
    id: 'spellbook', name: 'Büyü Kitabı', icon: '📖',
    characterId: 'mage', slot: 1, slotName: 'Slot 2', stat: 'atk',
    baseBonus: 6, bonusPerLevel: 4,
    upgradeCosts: (level) => ({ leather: Math.floor(4 * Math.pow(level, 1.3)), iron: Math.floor(3 * Math.pow(level, 1.2)) }),
    description: 'Büyü gücünü artırır.'
  },
  robe: {
    id: 'robe', name: 'Büyücü Cübbesi', icon: '🥻',
    characterId: 'mage', slot: 2, slotName: 'Slot 3', stat: 'hp',
    baseBonus: 25, bonusPerLevel: 18,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'Maksimum HP artırır.'
  },
  necklace: {
    id: 'necklace', name: 'Büyü Kolyesi', icon: '📿',
    characterId: 'mage', slot: 3, slotName: 'Slot 4', stat: 'atk',
    baseBonus: 7, bonusPerLevel: 5,
    upgradeCosts: (level) => ({ iron: Math.floor(6 * Math.pow(level, 1.3)) }),
    description: 'Büyücünün güç kolyesi. ATK artırır.'
  },

  // ============ RAHİP ============
  holyStaff: {
    id: 'holyStaff', name: 'Kutsal Asa', icon: '✨',
    characterId: 'priest', slot: 0, slotName: 'Slot 1', stat: 'atk',
    baseBonus: 8, bonusPerLevel: 5,
    upgradeCosts: (level) => ({ wood: Math.floor(4 * Math.pow(level, 1.3)), iron: Math.floor(2 * Math.pow(level, 1.2)) }),
    description: 'Rahibin silahı. ATK artırır.'
  },
  holyBook: {
    id: 'holyBook', name: 'Kutsal Kitap', icon: '📜',
    characterId: 'priest', slot: 1, slotName: 'Slot 2', stat: 'atk',
    baseBonus: 5, bonusPerLevel: 4,
    upgradeCosts: (level) => ({ leather: Math.floor(5 * Math.pow(level, 1.3)) }),
    description: 'İlahi güç. ATK artırır.'
  },
  cowl: {
    id: 'cowl', name: 'Kutsal Başlık', icon: '👒',
    characterId: 'priest', slot: 2, slotName: 'Slot 3', stat: 'hp',
    baseBonus: 35, bonusPerLevel: 22,
    upgradeCosts: (level) => ({ leather: Math.floor(4 * Math.pow(level, 1.3)), iron: Math.floor(3 * Math.pow(level, 1.2)) }),
    description: 'Rahibin koruyucu başlığı. HP artırır.'
  },
  ring: {
    id: 'ring', name: 'Kutsal Yüzük', icon: '💍',
    characterId: 'priest', slot: 3, slotName: 'Slot 4', stat: 'atk',
    baseBonus: 6, bonusPerLevel: 4,
    upgradeCosts: (level) => ({ iron: Math.floor(7 * Math.pow(level, 1.3)) }),
    description: 'İlahi güç yüzüğü. ATK artırır.'
  }
};

// Karakter başına item listesi
const CHARACTER_ITEMS = {
  warrior: ['sword', 'shield', 'armor', 'helmet'],
  archer:  ['bow', 'arrow', 'leatherArmor', 'gloves'],
  mage:    ['staff', 'spellbook', 'robe', 'necklace'],
  priest:  ['holyStaff', 'holyBook', 'cowl', 'ring']
};
