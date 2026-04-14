// ============================================================
// MAIN.JS — Uygulama başlatma, event listener'lar
// ============================================================

function initUI() {
  // ===== CANAVAR TIKLAMA =====
  const monsterArea = document.getElementById('monster-area');
  if (monsterArea) {
    monsterArea.addEventListener('click', () => {
      if (!gameState.battle.defeated) {
        playerClickMonster();
        // Sallantı animasyonu
        const monsterEl = document.getElementById('monster-sprite');
        if (monsterEl) {
          monsterEl.classList.add('shake');
          setTimeout(() => monsterEl.classList.remove('shake'), 400);
        }
      }
    });
  }

  // ===== KARAKTER İKON TIKLAMA =====
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const icon = document.getElementById(`char-icon-${charId}`);
    if (!icon) continue;

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const char = gameState.characters[charId];
      if (!char.unlocked) return;

      if (char.isDead && char.reviveReady) {
        reviveCharacter(charId);
        renderAll();
        return;
      }

      // Skill kullan (mana doluysa)
      const charData = CHARACTERS[charId];
      const skill = charData.skill;
      if (char.currentMana >= skill.manaCost && !char.isDead) {
        useSkill(charId);
        return;
      }

      // Yoksa detay panel aç
      openTeamPanel();
      setTimeout(() => selectCharacter(charId), 50);
    });
  }

  // ===== CHAPTER SELECTOR =====
  const chapterBtn = document.getElementById('chapter-select-btn');
  if (chapterBtn) {
    chapterBtn.addEventListener('click', openChapterModal);
  }

  const chapterModalClose = document.getElementById('chapter-modal-close');
  if (chapterModalClose) {
    chapterModalClose.addEventListener('click', closeChapterModal);
  }

  const chapterModalOverlay = document.getElementById('chapter-modal');
  if (chapterModalOverlay) {
    chapterModalOverlay.addEventListener('click', (e) => {
      if (e.target === chapterModalOverlay) closeChapterModal();
    });
  }

  // ===== EKİP PANELİ =====
  const teamBtn = document.getElementById('team-btn');
  if (teamBtn) {
    teamBtn.addEventListener('click', () => {
      openTeamPanel();
    });
  }

  const teamClose = document.getElementById('team-panel-close');
  if (teamClose) {
    teamClose.addEventListener('click', closeTeamPanel);
  }

  const teamOverlay = document.getElementById('team-panel');
  if (teamOverlay) {
    teamOverlay.addEventListener('click', (e) => {
      if (e.target === teamOverlay) closeTeamPanel();
    });
  }

  // ===== OFFLİNE POPUP =====
  const collectBtn = document.getElementById('offline-collect-btn');
  if (collectBtn) {
    collectBtn.addEventListener('click', collectOfflineEarnings);
  }

  // ===== YENİLGİ EKRANI =====
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', restartBattle);
  }

  // ===== KAYDET BUTONU =====
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const ok = saveGame(gameState);
      showNotification(ok ? '💾 Oyun kaydedildi!' : '❌ Kayıt başarısız!', ok ? 'info' : 'error');
    });
  }

  // ===== KAYDET SIFIRLAMA =====
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Tüm ilerleme silinecek. Emin misin?')) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
      }
    });
  }
}

// Sayfa yüklenince başlat
window.addEventListener('DOMContentLoaded', () => {
  initGame();
});
