// ============================================================
// UI/UPGRADES-PANEL.JS — Güç Artışları Panel render & aç/kapat
// ============================================================

// ============ AÇ / KAPAT ============
function openPowerPanel() {
  const overlay = document.getElementById('power-panel-overlay');
  if (overlay) overlay.classList.add('show');
  renderUpgradesPanel();
}

function closePowerPanel() {
  const overlay = document.getElementById('power-panel-overlay');
  if (overlay) overlay.classList.remove('show');
}

// ============ ANA RENDER ============
function renderUpgradesPanel() {
  const overlay = document.getElementById('power-panel-overlay');
  if (!overlay || !overlay.classList.contains('show')) return;

  // Toplam bonus gösterimi
  const clickTotalEl = document.getElementById('pp-click-total');
  const autoTotalEl  = document.getElementById('pp-auto-total');
  if (clickTotalEl) clickTotalEl.textContent = `⚔️ Click Hasarı Bonusu: +${formatNumber(getTotalClickBonus())}`;
  if (autoTotalEl)  autoTotalEl.textContent  = `🗡️ Auto Hasar Bonusu: +${formatNumber(getTotalAutoBonus())}`;

  // Liste render
  _renderUpgradeList('pp-click-list', CLICK_UPGRADES, 'click');
  _renderUpgradeList('pp-auto-list',  AUTO_UPGRADES,  'auto');
}

// ============ LISTE RENDER ============
function _renderUpgradeList(containerId, upgrades, category) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  const gold = gameState.inventory.gold;

  for (const upg of upgrades) {
    const state     = gameState.upgrades?.[category]?.[upg.id];
    const count     = state?.count  ?? 0;
    const cost      = state?.cost   ?? upg.baseCost;
    const canBuy    = gold >= cost;

    const card = document.createElement('div');
    card.className = `pp-card${canBuy ? ' pp-can-buy' : ''}`;

    card.innerHTML = `
      <div class="pp-card-left">
        <span class="pp-card-icon">${upg.icon}</span>
        <div class="pp-card-info">
          <div class="pp-card-name">${upg.name} <span class="pp-card-count">${count > 0 ? `×${count}` : ''}</span></div>
          <div class="pp-card-bonus">+${formatNumber(upg.bonus)} ${category === 'click' ? 'tıklama' : 'auto'} hasarı</div>
        </div>
      </div>
      <button class="pp-buy-btn${canBuy ? '' : ' pp-btn-disabled'}"
              ${canBuy ? '' : 'disabled'}
              data-category="${category}"
              data-id="${upg.id}">
        <span class="pp-btn-cost">💰 ${formatNumber(cost)}</span>
        <span class="pp-btn-label">AL</span>
      </button>
    `;

    // Satın al click
    const btn = card.querySelector('.pp-buy-btn');
    if (btn && canBuy) {
      btn.addEventListener('click', () => {
        const success = buyUpgrade(category, upg.id);
        if (success) {
          // Kart üzerinde anlık geri bildirim
          btn.classList.add('pp-btn-bought');
          setTimeout(() => btn.classList.remove('pp-btn-bought'), 250);
        }
      });
    }

    container.appendChild(card);
  }
}
