// ============================================================
// MAIN.JS — Uygulama başlatma, event listener'lar
// ============================================================

function initUI() {

  // ===== CANAVAR ALANINA TIKLAMA =====
  const monsterArea = document.getElementById('monster-area');
  if (monsterArea) {
    monsterArea.addEventListener('click', () => {
      if (!gameState.battle.defeated) {
        playerClickMonster();
        // Ek shake efekti (showSlashEffect'in yanında)
        const monsterEl = document.getElementById('monster-sprite');
        if (monsterEl) {
          monsterEl.classList.add('shake');
          setTimeout(() => monsterEl.classList.remove('shake'), 400);
        }
      }
    });
  }

  // ===== KARAKTER WRAPPER — TEK EVENT NOKTASI =====
  // Tüm karakter etkileşimi (skill kullan, canlandır, ekip aç) burada yönetilir.
  // Bu şekilde skill mini-icon'un stopPropagation sorunu ortadan kalkar.
  for (const charId of ACTIVE_CHARACTER_IDS) {
    const wrapper = document.getElementById(`char-wrapper-${charId}`);
    if (!wrapper) continue;

    wrapper.addEventListener('click', (e) => {
      const char = gameState.characters[charId];
      if (!char || !char.unlocked) return;

      // Skill mini-icon'a tıklandıysa → skill kullan
      if (e.target.closest(`#skill-icon-${charId}`)) {
        if (!char.isDead && char.currentMana >= CHARACTERS[charId].skill.manaCost) {
          useSkill(charId);
        }
        return;
      }

      // Canlanmaya hazırsa → canlandır (ikon tıklaması)
      if (char.isDead && char.reviveReady) {
        reviveCharacter(charId);
        renderAll();
        return;
      }

      // Ölüyse ama henüz hazır değilse → hiç event verme
      if (char.isDead) return;

      // Aksi hâlde → ekip panelini aç + bu karakteri seç
      openTeamPanel();
      setTimeout(() => selectCharacter(charId), 50);
    });
  }

  // ===== EKİP PANELİ BUTONU =====
  const teamBtn = document.getElementById('team-btn');
  if (teamBtn) {
    teamBtn.addEventListener('click', openTeamPanel);
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

  // ===== GÜÇ ARTIŞLARI PANELİ =====
  const powerBtn = document.getElementById('power-btn');
  if (powerBtn) {
    powerBtn.addEventListener('click', openPowerPanel);
  }

  const powerClose = document.getElementById('power-panel-close');
  if (powerClose) {
    powerClose.addEventListener('click', closePowerPanel);
  }

  const powerOverlay = document.getElementById('power-panel-overlay');
  if (powerOverlay) {
    powerOverlay.addEventListener('click', (e) => {
      if (e.target === powerOverlay) closePowerPanel();
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

  // ===== UPGRADE TOAST KAPAT =====
  const utoastClose = document.getElementById('utoast-close');
  if (utoastClose) {
    utoastClose.addEventListener('click', () => {
      hideUpgradeToast();
      // 30sn snooze
      upgradeToastSnoozed      = true;
      upgradeToastSnoozeUntil  = Date.now() + 30000;
    });
  }

  // ===== CHAPTER UNLOCK TOAST KAPAT =====
  const cuttoastClose = document.getElementById('cuttoast-close');
  if (cuttoastClose) {
    cuttoastClose.addEventListener('click', hideChapterUnlockToast);
  }

  // ===== KAYDET =====
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const ok = saveGame(gameState);
      showNotification(ok ? '💾 Kaydedildi!' : '❌ Kayıt başarısız!', ok ? 'info' : 'error');
      if (ok) {
        saveBtn.textContent = '✅';
        setTimeout(() => { saveBtn.textContent = '💾'; }, 1500);
      }
    });
  }

  // ===== SIFIRLA (iki adımlı onay — confirm() yerine) =====
  let resetPending = false;
  let resetTimer = null;
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!resetPending) {
        // İlk tıklama: onay bekle
        resetPending = true;
        resetBtn.textContent = '⚠️';
        resetBtn.title = 'Tekrar tıkla → SİL';
        resetBtn.style.borderColor = '#e05252';
        resetBtn.style.color = '#e05252';
        resetTimer = setTimeout(() => {
          // 3 saniye içinde onaylanmadı → iptal
          resetPending = false;
          resetBtn.textContent = '🗑️';
          resetBtn.title = 'Sıfırla';
          resetBtn.style.borderColor = '';
          resetBtn.style.color = '';
        }, 3000);
      } else {
        // İkinci tıklama: sıfırla
        clearTimeout(resetTimer);
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
