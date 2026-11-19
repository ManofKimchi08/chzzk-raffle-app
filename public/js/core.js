    // State management
    let ws = null;
    let isConnected = false;
    let isManualDisconnect = false;
    let reconnectAttempts = 0;
    let serverIndexOffset = 0;

    let currentChannelId = '';
    let currentChatChannelId = '';
    let currentChannelName = '';
    let currentChannelImageUrl = '';
    let currentAccessToken = '';

    // =========================================================
    // 🛡️ v5.4.0 Shared Utilities: CSPRNG, CSV Sanitizer, Non-blocking Modals,
    //    Global Escape, Audio Mute, OBS Chroma Key, Session Backup
    // =========================================================
    function secureRandom() {
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] / 4294967296;
      }
      return Math.random();
    }

    function secureRandomInt(max) {
      const bound = Math.floor(Number(max));
      if (!Number.isFinite(bound) || bound <= 1) return 0;
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const range = 0x100000000;
        const limit = range - (range % bound);
        const arr = new Uint32Array(1);
        let r = 0;
        do {
          window.crypto.getRandomValues(arr);
          r = arr[0];
        } while (r >= limit);
        return r % bound;
      }
      return Math.floor(Math.random() * bound);
    }

    function sanitizeCsvCell(val) {
      let s = (val === null || val === undefined) ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      return `"${s.replace(/"/g, '""')}"`;
    }

    // Promise-queued non-blocking replacement for alert / confirm / prompt
    let _appDialogQueue = Promise.resolve();
    function _enqueueAppDialog(config) {
      const run = () => new Promise(resolve => {
        const modal = document.getElementById('appDialogModal');
        const titleEl = document.getElementById('appDialogTitle');
        const msgEl = document.getElementById('appDialogMessage');
        const inputWrap = document.getElementById('appDialogInputWrap');
        const inputEl = document.getElementById('appDialogInput');
        const cancelBtn = document.getElementById('appDialogCancelBtn');
        const confirmBtn = document.getElementById('appDialogConfirmBtn');
        const closeXBtn = document.getElementById('appDialogCloseXBtn');

        if (!modal || !titleEl || !msgEl || !confirmBtn || !cancelBtn) {
          resolve(config.mode === 'confirm' ? true : (config.mode === 'prompt' ? (config.defaultValue || null) : undefined));
          return;
        }

        titleEl.innerText = config.title || '안내';
        msgEl.innerText = config.message || '';
        confirmBtn.innerText = config.confirmText || '확인';
        cancelBtn.innerText = config.cancelText || '취소';
        cancelBtn.style.display = config.mode === 'alert' ? 'none' : 'inline-flex';
        confirmBtn.className = config.danger ? 'btn btn-danger' : 'btn btn-primary';

        if (config.mode === 'prompt' && inputWrap && inputEl) {
          inputWrap.style.display = 'block';
          inputEl.value = config.defaultValue || '';
          inputEl.placeholder = config.placeholder || '값을 입력하세요...';
        } else if (inputWrap && inputEl) {
          inputWrap.style.display = 'none';
          inputEl.value = '';
        }

        let settled = false;
        const finish = (val) => {
          if (settled) return;
          settled = true;
          if (document.activeElement && modal.contains(document.activeElement)) {
            try { document.activeElement.blur(); } catch (e) {}
          }
          modal.classList.remove('active');
          confirmBtn.onclick = null;
          cancelBtn.onclick = null;
          if (closeXBtn) closeXBtn.onclick = null;
          modal.onclick = null;
          document.removeEventListener('keydown', dialogKeyHandler, true);
          resolve(val);
        };

        const confirmAction = () => {
          if (config.mode === 'confirm') finish(true);
          else if (config.mode === 'prompt') finish(inputEl ? inputEl.value.trim() : '');
          else finish(undefined);
        };
        const cancelAction = () => {
          if (config.mode === 'confirm') finish(false);
          else if (config.mode === 'prompt') finish(null);
          else finish(undefined);
        };

        const dialogKeyHandler = (e) => {
          if (!modal.classList.contains('active')) return;
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelAction();
          } else if (e.key === 'Enter') {
            if (config.mode === 'prompt' && document.activeElement !== inputEl && document.activeElement !== confirmBtn) return;
            if (document.activeElement !== cancelBtn) {
              e.preventDefault();
              e.stopPropagation();
              confirmAction();
            }
          }
        };

        confirmBtn.onclick = confirmAction;
        cancelBtn.onclick = cancelAction;
        if (closeXBtn) closeXBtn.onclick = cancelAction;
        modal.onclick = (e) => { if (e.target === modal) cancelAction(); };
        document.addEventListener('keydown', dialogKeyHandler, true);
        modal.classList.add('active');

        setTimeout(() => {
          if (config.mode === 'prompt' && inputEl) {
            inputEl.focus();
            inputEl.select();
          } else {
            confirmBtn.focus();
          }
        }, 20);
      });

      const next = _appDialogQueue.then(run, run);
      _appDialogQueue = next.catch(() => {});
      return next;
    }

    function showAppAlert(message, title = '안내', confirmText = '확인') {
      return _enqueueAppDialog({ mode: 'alert', message, title, confirmText });
    }
    function showAppConfirm(message, opts = {}) {
      return _enqueueAppDialog({
        mode: 'confirm',
        message,
        title: opts.title || '확인',
        confirmText: opts.confirmText || '확인',
        cancelText: opts.cancelText || '취소',
        danger: !!opts.danger
      });
    }
    function showAppPrompt(message, opts = {}) {
      return _enqueueAppDialog({
        mode: 'prompt',
        message,
        title: opts.title || '입력',
        defaultValue: opts.defaultValue || '',
        placeholder: opts.placeholder || '이름을 입력하세요...',
        confirmText: opts.confirmText || '저장',
        cancelText: opts.cancelText || '취소'
      });
    }

    // Global Mute Controller
    window.appGlobalMuted = (localStorage.getItem('chzzk_global_muted') === '1');
    function syncGlobalMuteUI() {
      const btn = document.getElementById('globalMuteToggleBtn');
      if (!btn) return;
      if (window.appGlobalMuted) {
        btn.innerText = '🔇 음소거중';
        btn.classList.add('muted');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.innerText = '🔊';
        btn.classList.remove('muted');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
    function initGlobalMuteUI() {
      syncGlobalMuteUI();
    }
    function toggleGlobalMute() {
      window.appGlobalMuted = !window.appGlobalMuted;
      try { localStorage.setItem('chzzk_global_muted', window.appGlobalMuted ? '1' : '0'); } catch (e) {}
      syncGlobalMuteUI();
      if (window.appGlobalMuted) {
        if (typeof stopPokeBattleBgm === 'function') stopPokeBattleBgm(150);
        if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (e) {}
        if (typeof currentQuizCryAudio !== 'undefined' && currentQuizCryAudio) {
          try { currentQuizCryAudio.pause(); } catch (e) {}
        }
        if (typeof showToast === 'function') showToast('🔇 모든 플랫폼 사운드가 음소거되었습니다.', '🔇');
      } else {
        if (typeof pokeBattleState !== 'undefined' && pokeBattleState.active && typeof checkPokeBattleBgmCondition === 'function') {
          checkPokeBattleBgmCondition();
        }
        if (typeof showToast === 'function') showToast('🔊 플랫폼 사운드가 켜졌습니다.', '🔊');
      }
    }

    // OBS Chroma Key Controller
    let obsChromaMode = localStorage.getItem('chzzk_obs_chroma') || 'default';
    function applyObsChromaMode() {
      document.body.classList.remove('obs-chroma-green', 'obs-chroma-blue');
      const btn = document.getElementById('obsChromaToggleBtn');
      if (btn) btn.classList.remove('active-chroma-green', 'active-chroma-blue');

      if (obsChromaMode === 'green') {
        document.body.classList.add('obs-chroma-green');
        if (btn) {
          btn.classList.add('active-chroma-green');
          btn.innerText = '🎥 OBS (그린)';
        }
      } else if (obsChromaMode === 'blue') {
        document.body.classList.add('obs-chroma-blue');
        if (btn) {
          btn.classList.add('active-chroma-blue');
          btn.innerText = '🎥 OBS (블루)';
        }
      } else {
        obsChromaMode = 'default';
        if (btn) btn.innerText = '🎥 OBS';
      }
    }
    function initObsChromaUI() {
      applyObsChromaMode();
    }
    function cycleObsChromaMode() {
      const order = ['default', 'green', 'blue'];
      const nextIdx = (order.indexOf(obsChromaMode) + 1) % order.length;
      obsChromaMode = order[nextIdx];
      try { localStorage.setItem('chzzk_obs_chroma', obsChromaMode); } catch (e) {}
      applyObsChromaMode();
      const labelMap = { default: '기본 다크 배경', green: 'OBS 그린 크로마키', blue: 'OBS 블루 크로마키' };
      if (typeof showToast === 'function') showToast(`🎥 배경 모드: ${labelMap[obsChromaMode]}`, '🎥');
    }

    // Global Escape Key Handler for Modals & Drawers
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const appDlg = document.getElementById('appDialogModal');
      if (appDlg && appDlg.classList.contains('active')) return;
      const activeEl = document.activeElement;
      if (activeEl && activeEl.id === 'donationSearchInput' && activeEl.value) return;

      const specialClosers = [
        ['userChatModal', () => typeof closeUserChatModal === 'function' ? closeUserChatModal() : document.getElementById('userChatModal')?.classList.remove('active')],
        ['pokeFaintSwitchModal', () => document.getElementById('pokeFaintSwitchModal')?.classList.remove('active')],
        ['pokemonPickerModal', () => typeof closePokemonPickerModal === 'function' ? closePokemonPickerModal() : document.getElementById('pokemonPickerModal')?.classList.remove('active')],
        ['pokeAnimStudioModal', () => typeof closePokeAnimStudioModal === 'function' ? closePokeAnimStudioModal() : document.getElementById('pokeAnimStudioModal')?.classList.remove('active')],
        ['quizInspectorModal', () => typeof closeQuizInspectorModal === 'function' ? closeQuizInspectorModal() : document.getElementById('quizInspectorModal')?.classList.remove('active')],
        ['factionRosterModal', () => typeof closeFactionRosterModal === 'function' ? closeFactionRosterModal() : document.getElementById('factionRosterModal')?.classList.remove('active')],
        ['factionRevealModal', () => typeof closeFactionRevealModal === 'function' ? closeFactionRevealModal() : document.getElementById('factionRevealModal')?.classList.remove('active')],
        ['factionRecruitModal', () => document.getElementById('factionRecruitModal')?.classList.remove('active')],
        ['pokeBattleResultModal', () => typeof closePokeResultModal === 'function' ? closePokeResultModal() : document.getElementById('pokeBattleResultModal')?.classList.remove('active')],
        ['rouletteWinnerModal', () => document.getElementById('rouletteWinnerModal')?.classList.remove('active')],
        ['pollResultModal', () => document.getElementById('pollResultModal')?.classList.remove('active')],
        ['gameResultModal', () => document.getElementById('gameResultModal')?.classList.remove('active')],
        ['connectionModal', () => typeof closeConnectModal === 'function' ? closeConnectModal() : document.getElementById('connectionModal')?.classList.remove('active')],
        ['settingsDrawer', () => typeof closeSettingsDrawer === 'function' ? closeSettingsDrawer() : null],
        ['chatDrawer', () => typeof closeChatDrawer === 'function' ? closeChatDrawer() : null]
      ];
      for (const [id, closeFn] of specialClosers) {
        const el = document.getElementById(id);
        if (el && el.classList.contains('active')) {
          e.preventDefault();
          closeFn();
          return;
        }
      }
    });

    // Session Backup & Recovery + beforeunload Guard
    const SESSION_BACKUP_STORAGE_KEY = 'chzzk_session_backup_v1';
    let sessionBackupTimer = null;

    function hasActiveSessionData() {
      const hasDrawn = Array.isArray(drawnWinners) && drawnWinners.length > 0;
      const hasDonations = typeof donationRouletteList !== 'undefined' && Array.isArray(donationRouletteList) && donationRouletteList.length > 0;
      const hasHistory = typeof rouletteHistory !== 'undefined' && Array.isArray(rouletteHistory) && rouletteHistory.length > 0;
      const hasPollRunning = typeof isPollRunning !== 'undefined' && !!isPollRunning;
      const hasPokeActive = typeof pokeBattleState !== 'undefined' && !!pokeBattleState.active;
      const hasQuizActive = typeof quizMatchState !== 'undefined' && !!quizMatchState.active;
      return hasDrawn || hasDonations || hasHistory || hasPollRunning || hasPokeActive || hasQuizActive;
    }

    function saveSessionBackupNow() {
      try {
        const manualValid = (typeof manualRouletteRows !== 'undefined' && Array.isArray(manualRouletteRows))
          ? manualRouletteRows.slice(0, 200)
          : [];
        const donList = (typeof donationRouletteList !== 'undefined' && Array.isArray(donationRouletteList))
          ? donationRouletteList.slice(0, 500)
          : [];
        const removedDonList = (typeof removedDonationRouletteList !== 'undefined' && Array.isArray(removedDonationRouletteList))
          ? removedDonationRouletteList.slice(0, 200)
          : [];
        const rHist = (typeof rouletteHistory !== 'undefined' && Array.isArray(rouletteHistory))
          ? rouletteHistory.slice(0, 100)
          : [];
        const payload = {
          savedAt: Date.now(),
          channelId: currentChannelId || '',
          channelName: currentChannelName || '',
          currentDrawRound: currentDrawRound || 0,
          drawnWinners: Array.isArray(drawnWinners) ? drawnWinners.slice(0, 300) : [],
          manualRouletteRows: manualValid,
          donationRouletteList: donList,
          removedDonationRouletteList: removedDonList,
          rouletteHistory: rHist,
          pollTitle: document.getElementById('pollTitleInput')?.value || '',
          pollOptions: (typeof pollOptions !== 'undefined' && Array.isArray(pollOptions)) ? pollOptions.slice(0, 10) : []
        };
        const hasMeaningful = payload.drawnWinners.length > 0 || payload.donationRouletteList.length > 0 || payload.rouletteHistory.length > 0;
        if (hasMeaningful) {
          localStorage.setItem(SESSION_BACKUP_STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (e) {}
    }

    function scheduleSessionBackup() {
      if (sessionBackupTimer) clearTimeout(sessionBackupTimer);
      sessionBackupTimer = setTimeout(saveSessionBackupNow, 600);
    }

    function checkAndShowSessionRestoreBanner() {
      const banner = document.getElementById('sessionRestoreBanner');
      const textEl = document.getElementById('sessionRestoreSummaryText');
      if (!banner || !textEl) return;
      try {
        const raw = localStorage.getItem(SESSION_BACKUP_STORAGE_KEY);
        if (!raw) { banner.style.display = 'none'; return; }
        const data = JSON.parse(raw);
        if (!data || !data.savedAt || (Date.now() - data.savedAt) > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(SESSION_BACKUP_STORAGE_KEY);
          banner.style.display = 'none';
          return;
        }
        const donCnt = Array.isArray(data.donationRouletteList) ? data.donationRouletteList.length : 0;
        const winCnt = Array.isArray(data.drawnWinners) ? data.drawnWinners.length : 0;
        const histCnt = Array.isArray(data.rouletteHistory) ? data.rouletteHistory.length : 0;
        if (donCnt === 0 && winCnt === 0 && histCnt === 0) {
          banner.style.display = 'none';
          return;
        }
        const parts = [];
        if (winCnt > 0) parts.push(`추첨 당첨자 ${winCnt}명`);
        if (donCnt > 0) parts.push(`도네 룰렛 ${donCnt}건`);
        if (histCnt > 0) parts.push(`룰렛 기록 ${histCnt}건`);
        const timeStr = new Date(data.savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        textEl.innerText = `이전 세션(${timeStr} 저장) 데이터 복구 가능: ${parts.join(' · ')}`;
        banner.style.display = 'flex';
      } catch (e) {
        banner.style.display = 'none';
      }
    }

    function restoreSessionBackup() {
      try {
        const raw = localStorage.getItem(SESSION_BACKUP_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data) return;

        if (Array.isArray(data.drawnWinners) && data.drawnWinners.length > 0) {
          drawnWinners = data.drawnWinners;
          currentDrawRound = data.currentDrawRound || 1;
          cumulativeDrawnUIDs.clear();
          drawnWinners.forEach(w => { if (w && w.uid) cumulativeDrawnUIDs.add(String(w.uid).toLowerCase()); });
          renderWinnersTable(drawnWinners);
          if (exportBtn) exportBtn.disabled = false;
          const copyBtn = document.getElementById('copyWinnersBtn');
          if (copyBtn) copyBtn.disabled = false;
        }

        if (typeof manualRouletteRows !== 'undefined' && Array.isArray(data.manualRouletteRows) && data.manualRouletteRows.length > 0) {
          manualRouletteRows = data.manualRouletteRows;
          if (typeof renderManualRouletteRows === 'function') renderManualRouletteRows();
        }
        if (typeof donationRouletteList !== 'undefined' && Array.isArray(data.donationRouletteList)) {
          donationRouletteList = data.donationRouletteList;
        }
        if (typeof removedDonationRouletteList !== 'undefined' && Array.isArray(data.removedDonationRouletteList)) {
          removedDonationRouletteList = data.removedDonationRouletteList;
        } else if (typeof removedDonationRouletteList !== 'undefined' && Array.isArray(data.removedDonationList)) {
          removedDonationRouletteList = data.removedDonationList;
        }
        if (typeof rouletteHistory !== 'undefined' && Array.isArray(data.rouletteHistory)) {
          rouletteHistory = data.rouletteHistory;
          if (typeof renderRouletteHistory === 'function') renderRouletteHistory();
        }
        if (typeof renderDonationFeed === 'function') renderDonationFeed();
        if (typeof drawRouletteWheel === 'function') drawRouletteWheel();
        if (typeof pollTitleInput !== 'undefined' && pollTitleInput && data.pollTitle) {
          pollTitleInput.value = data.pollTitle;
        }
        if (typeof pollOptions !== 'undefined' && Array.isArray(data.pollOptions) && data.pollOptions.length >= 2) {
          pollOptions = data.pollOptions;
          if (typeof renderPollOptionsList === 'function') renderPollOptionsList();
          if (typeof renderPollVisualBars === 'function') renderPollVisualBars();
        }

        const banner = document.getElementById('sessionRestoreBanner');
        if (banner) banner.style.display = 'none';
        if (typeof showToast === 'function') showToast('♻️ 이전 방송 세션 데이터를 성공적으로 복구했습니다!', '✅');
      } catch (e) {
        console.error('Session restore failed:', e);
      }
    }

    function dismissSessionBackup() {
      const banner = document.getElementById('sessionRestoreBanner');
      if (banner) banner.style.display = 'none';
      try { localStorage.removeItem(SESSION_BACKUP_STORAGE_KEY); } catch (e) {}
    }

    window.addEventListener('beforeunload', (e) => {
      saveSessionBackupNow();
      if (hasActiveSessionData()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Recent & Favorite Channels Storage
    const RECENT_CHANNELS_STORAGE_KEY = 'chzzk_recent_channels_v1';
    function loadRecentChannels() {
      try {
        const raw = localStorage.getItem(RECENT_CHANNELS_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    }
    function saveRecentChannelsList(list) {
      const sorted = [...list].sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      const trimmed = sorted.slice(0, 5);
      try { localStorage.setItem(RECENT_CHANNELS_STORAGE_KEY, JSON.stringify(trimmed)); } catch (e) {}
      return trimmed;
    }
    function recordRecentChannel(ch) {
      if (!ch || !ch.channelId) return;
      const list = loadRecentChannels();
      const idx = list.findIndex(item => item.channelId === ch.channelId);
      const existingPin = idx >= 0 ? !!list[idx].pinned : false;
      const entry = {
        channelId: ch.channelId,
        channelName: ch.channelName || (idx >= 0 ? list[idx].channelName : '') || ch.channelId.substring(0, 8),
        channelImageUrl: ch.channelImageUrl || (idx >= 0 ? list[idx].channelImageUrl : '') || '',
        pinned: existingPin,
        updatedAt: Date.now()
      };
      if (idx >= 0) list.splice(idx, 1);
      list.unshift(entry);
      saveRecentChannelsList(list);
      renderRecentChannels();
    }
    function togglePinRecentChannel(channelId, ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      const list = loadRecentChannels();
      const target = list.find(item => item.channelId === channelId);
      if (target) {
        target.pinned = !target.pinned;
        saveRecentChannelsList(list);
        renderRecentChannels();
      }
    }
    function removeRecentChannel(channelId, ev) {
      if (ev) { ev.preventDefault(); ev.stopPropagation(); }
      const filtered = loadRecentChannels().filter(item => item.channelId !== channelId);
      saveRecentChannelsList(filtered);
      renderRecentChannels();
    }
    function renderRecentChannels() {
      const section = document.getElementById('welcomeRecentChannelsSection');
      const container = document.getElementById('welcomeRecentChannelsList');
      if (!section || !container) return;
      const list = loadRecentChannels();
      if (list.length === 0) {
        section.style.display = 'none';
        container.innerHTML = '';
        return;
      }
      section.style.display = 'block';
      container.innerHTML = list.map(c => {
        const avatarUrl = c.channelImageUrl || 'delibird.png';
        const safeName = escapeHtml(c.channelName || c.channelId);
        return `
          <div class="recent-channel-chip ${c.pinned ? 'pinned' : ''}" onclick="selectSearchStreamer('${escapeJsArg(c.channelId)}', '${escapeJsArg(c.channelName || '')}', '${escapeJsArg(c.channelImageUrl || '')}', false)" title="${safeName} 방송으로 바로 연결">
            <img src="${escapeHtml(avatarUrl)}" class="recent-channel-avatar" alt="${safeName}" onerror="this.src='delibird.png'">
            <span class="recent-channel-name">${safeName}</span>
            <button type="button" class="recent-channel-pin-btn ${c.pinned ? 'active' : ''}" onclick="togglePinRecentChannel('${escapeJsArg(c.channelId)}', event)" aria-label="채널 즐겨찾기 고정" title="${c.pinned ? '고정 해제' : '즐겨찾기 고정'}">${c.pinned ? '★' : '☆'}</button>
            <button type="button" class="recent-channel-del-btn" onclick="removeRecentChannel('${escapeJsArg(c.channelId)}', event)" aria-label="최근 채널 목록에서 제거" title="목록에서 제거">✕</button>
          </div>
        `;
      }).join('');
    }

    function getStreamerName() {
      return (isConnected && currentChannelName && currentChannelName.trim()) ? currentChannelName : '스트리머';
    }

    function getStreamerAvatar() {
      return (isConnected && currentChannelImageUrl) ? currentChannelImageUrl : '';
    }

    function updateStreamerProfileUI() {
      const name = getStreamerName();
      const avatar = getStreamerAvatar();

      // 1. Header connection pill avatar
      const headerAvatar = document.getElementById('headerChannelAvatar');
      if (headerAvatar) {
        if (avatar) {
          headerAvatar.src = avatar;
          headerAvatar.style.display = 'inline-block';
        } else {
          headerAvatar.style.display = 'none';
        }
      }

      // 2. Voltorb Flip (찌리리공 뒤집기)
      const voltorbPlayerLabel = document.getElementById('gameStreamerPlayerLabel');
      if (voltorbPlayerLabel) voltorbPlayerLabel.innerText = `PLAYER 1 (${name})`;

      const voltorbCrown = document.getElementById('gameStreamerCrown');
      const voltorbAvatar = document.getElementById('gameStreamerAvatarImg');
      if (voltorbAvatar && voltorbCrown) {
        if (avatar) {
          voltorbAvatar.src = avatar;
          voltorbAvatar.style.display = 'block';
          voltorbCrown.style.display = 'none';
        } else {
          voltorbAvatar.style.display = 'none';
          voltorbCrown.style.display = 'block';
        }
      }

      const startStreamerBtn = document.getElementById('startGameStreamerBtn');
      if (startStreamerBtn) {
        startStreamerBtn.innerHTML = `⚔️ 배틀 시작 (${escapeHtml(name)} 선공)`;
      }

      // 3. Pokemon Battle Setup
      const pokeSetupName = document.getElementById('pokeStreamerSetupName');
      if (pokeSetupName) pokeSetupName.innerText = `👑 ${name} 팀`;

      const pokeSetupAvatar = document.getElementById('pokeStreamerSetupAvatar');
      if (pokeSetupAvatar) {
        if (avatar) {
          pokeSetupAvatar.src = avatar;
          pokeSetupAvatar.style.display = 'inline-block';
        } else {
          pokeSetupAvatar.style.display = 'none';
        }
      }

      const pokeDurationLabel = document.getElementById('pokeStreamerDurationLabel');
      if (pokeDurationLabel) pokeDurationLabel.innerText = `⏱️ ${name} 턴`;

      // 4. Pokemon Battle Arena
      const arenaTopName = document.getElementById('arenaStreamerTopName');
      if (arenaTopName) arenaTopName.innerText = `👑 ${name}`;

      const arenaTopAvatar = document.getElementById('arenaStreamerTopAvatar');
      if (arenaTopAvatar) {
        if (avatar) {
          arenaTopAvatar.src = avatar;
          arenaTopAvatar.style.display = 'inline-block';
        } else {
          arenaTopAvatar.style.display = 'none';
        }
      }

      const arenaStatusName = document.getElementById('arenaStreamerStatusName');
      if (arenaStatusName) arenaStatusName.innerText = `👑 ${name}`;

      const arenaStatusAvatar = document.getElementById('arenaStreamerStatusAvatar');
      if (arenaStatusAvatar) {
        if (avatar) {
          arenaStatusAvatar.src = avatar;
          arenaStatusAvatar.style.display = 'inline-block';
        } else {
          arenaStatusAvatar.style.display = 'none';
        }
      }

      const arenaTimerTitle = document.getElementById('arenaStreamerTimerTitle');
      if (arenaTimerTitle) arenaTimerTitle.innerText = `👑 ${name} 선택 제한시간`;
    }

    let participants = new Map(); // uid -> participant Object
    let userChatHistory = new Map(); // uid -> Array of full chat history
    let activeTrackingUserUID = null; // UID currently being inspected in real-time modal

    let cumulativeDrawnUIDs = new Set(); // Multi-round auto-excluded UIDs
    let fileExcludedTokens = new Set(); // Excel/CSV uploaded excluded UIDs and Nicknames (lowercase)
    let manualExcludePairs = []; // [{ nick: '...', uid: '...' }, ...]

    let chatLogCount = 0;
    let drawnWinners = [];
    let currentDrawRound = 0;
    let pingInterval = null;
    let liveStatusPollingInterval = null;

    // Elements
    const channelInput = document.getElementById('channelInput');
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const drawBtn = document.getElementById('drawBtn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const connectBtnLabel = document.getElementById('connectBtnLabel');
    const participantCountEl = document.getElementById('participantCount');
    const filteredCountEl = document.getElementById('filteredCount');
    const excludedCountEl = document.getElementById('excludedCount');
    const chatFeed = document.getElementById('chatFeed');
    const winnerOverlay = document.getElementById('winnerOverlay');
    const rollText = document.getElementById('rollText');
    const subRollText = document.getElementById('subRollText');
    const winnersTableBody = document.getElementById('winnersTableBody');
    const exportBtn = document.getElementById('exportBtn');
    const drawnWinnerCountEl = document.getElementById('drawnWinnerCount');

    // Connection Modal & Chat Drawer Elements
    const connectionModal = document.getElementById('connectionModal');
    const openConnectModalBtn = document.getElementById('openConnectModalBtn');
    const closeConnectModalBtn = document.getElementById('closeConnectModalBtn');
    const connectModalCancelBtn = document.getElementById('connectModalCancelBtn');

    const chatDrawer = document.getElementById('chatDrawer');
    const chatDrawerBackdrop = document.getElementById('chatDrawerBackdrop');
    const openChatDrawerBtn = document.getElementById('openChatDrawerBtn');
    const closeChatDrawerBtn = document.getElementById('closeChatDrawerBtn');
    const chatBadgeCount = document.getElementById('chatBadgeCount');
    const drawerChatCount = document.getElementById('drawerChatCount');

    // Winner User Chat Tracker Modal Elements
    const userChatModal = document.getElementById('userChatModal');
    const userChatModalNick = document.getElementById('userChatModalNick');
    const userChatModalUid = document.getElementById('userChatModalUid');
    const userChatModalBadges = document.getElementById('userChatModalBadges');
    const userChatModalMsgCount = document.getElementById('userChatModalMsgCount');
    const userChatModalFeed = document.getElementById('userChatModalFeed');
    const closeUserChatModalBtn = document.getElementById('closeUserChatModalBtn');
    const closeUserChatModalBottomBtn = document.getElementById('closeUserChatModalBottomBtn');
    const copyUserUidBtn = document.getElementById('copyUserUidBtn');

    // Real-time Chat TTS Elements
    const ttsEnabledToggle = document.getElementById('ttsEnabledToggle');
    const ttsStatusPill = document.getElementById('ttsStatusPill');
    const ttsConfigCollapseBtn = document.getElementById('ttsConfigCollapseBtn');
    const ttsDetailConfigPanel = document.getElementById('ttsDetailConfigPanel');
    const ttsVoiceSelect = document.getElementById('ttsVoiceSelect');
    const testTtsBtn = document.getElementById('testTtsBtn');
    const ttsRateRange = document.getElementById('ttsRateRange');
    const ttsRateVal = document.getElementById('ttsRateVal');
    const ttsPitchRange = document.getElementById('ttsPitchRange');
    const ttsPitchVal = document.getElementById('ttsPitchVal');
    const ttsVolumeRange = document.getElementById('ttsVolumeRange');
    const ttsVolumeVal = document.getElementById('ttsVolumeVal');
    const ttsIncludeNickToggle = document.getElementById('ttsIncludeNickToggle');

    // Live Broadcast State & Elements
    let isChannelLive = false;
    let currentLiveTitle = '';
    let currentViewerCount = 0;
    let currentCategory = '';
    let offlinePollCount = 0;
    let lastChatReceivedTime = 0;

    const statusLiveBadge = document.getElementById('statusLiveBadge');
    const statusViewerInfo = document.getElementById('statusViewerInfo');
    const drawerLiveBadge = document.getElementById('drawerLiveBadge');
    const modalStreamerCard = document.getElementById('modalStreamerCard');
    const modalLiveBadge = document.getElementById('modalLiveBadge');
    const modalChannelName = document.getElementById('modalChannelName');
    const modalViewerCount = document.getElementById('modalViewerCount');
    const modalLiveTitle = document.getElementById('modalLiveTitle');

    // Advanced Filter Elements & State
    let isKeywordFilterActive = false;
    let isDonorFilterActive = false;
    let isSubFilterActive = false;

    const keywordFilterPanel = document.getElementById('keywordFilterPanel');
    const keywordInput = document.getElementById('keywordInput');
    const keywordChipBadge = document.getElementById('keywordChipBadge');

    const donorFilterPanel = document.getElementById('donorFilterPanel');
    const donorLevelSelect = document.getElementById('donorLevelSelect');
    const subFilterPanel = document.getElementById('subFilterPanel');
    const minSubMonths = document.getElementById('minSubMonths');
    const subTierSelect = document.getElementById('subTierSelect');

    // Duplicate Prevention & Exclusion Elements
    const excludeFilterPanel = document.getElementById('excludeFilterPanel');
    const excludeBadge = document.getElementById('excludeBadge');
    const autoExcludePreviousToggle = document.getElementById('autoExcludePreviousToggle');
    const fileExcludeToggle = document.getElementById('fileExcludeToggle');
    const fileExcludeBox = document.getElementById('fileExcludeBox');
    const excludeFileInput = document.getElementById('excludeFileInput');
    const fileExcludeStatus = document.getElementById('fileExcludeStatus');

    const manualExcludeToggle = document.getElementById('manualExcludeToggle');
    const manualExcludeBox = document.getElementById('manualExcludeBox');
    const tablePasteInput = document.getElementById('tablePasteInput');
    const excludeRulesBody = document.getElementById('excludeRulesBody');

    // ==========================================
    // 🗂️ MODAL & DRAWER HANDLERS (A안)
    // ==========================================
    function openConnectModal() {
      openChangeChannelScreen();
    }
    function closeConnectModal() {
      connectionModal.classList.remove('active');
    }
    closeConnectModalBtn.addEventListener('click', closeConnectModal);
    connectModalCancelBtn.addEventListener('click', closeConnectModal);

    function openChatDrawer() {
      chatDrawer.classList.add('active');
      chatDrawerBackdrop.classList.add('active');
    }
    function closeChatDrawer() {
      chatDrawer.classList.remove('active');
      chatDrawerBackdrop.classList.remove('active');
    }
    if (openChatDrawerBtn) openChatDrawerBtn.addEventListener('click', openChatDrawer);
    if (closeChatDrawerBtn) closeChatDrawerBtn.addEventListener('click', closeChatDrawer);
    if (chatDrawerBackdrop) chatDrawerBackdrop.addEventListener('click', closeChatDrawer);

    // ==========================================
    // 🎯 FILTER & EXCLUSION TOGGLE CONTROLS
    // ==========================================
    function toggleFilter(type) {
      if (type === 'keyword') {
        isKeywordFilterActive = !isKeywordFilterActive;
        if (isKeywordFilterActive && keywordInput.value.trim() === '') {
          setTimeout(() => keywordInput.focus(), 60);
        }
      } else if (type === 'donor') {
        isDonorFilterActive = !isDonorFilterActive;
      } else if (type === 'sub') {
        isSubFilterActive = !isSubFilterActive;
      }
      updateFilterUI();
    }

    function setFilterMode(mode) {
      if (mode === 'all') {
        isKeywordFilterActive = false;
        keywordInput.value = '';
        isDonorFilterActive = false;
        isSubFilterActive = false;
        updateFilterUI();
      }
    }

    function toggleExcludePanel() {
      const isOpen = excludeFilterPanel.style.display !== 'none';
      excludeFilterPanel.style.display = isOpen ? 'none' : 'block';
      document.getElementById('chipExcludeToggle').classList.toggle('active', !isOpen);
    }

    function updateFilterUI() {
      const chipAll = document.getElementById('chipAllToggle');
      const chipKeyword = document.getElementById('chipKeywordToggle');
      const chipDonor = document.getElementById('chipDonorToggle');
      const chipSub = document.getElementById('chipSubToggle');

      // Keyword Filter UI
      chipKeyword.classList.toggle('active', isKeywordFilterActive);
      keywordFilterPanel.style.display = isKeywordFilterActive ? 'block' : 'none';
      if (isKeywordFilterActive && keywordInput.value.trim().length > 0) {
        keywordChipBadge.style.display = 'inline-block';
        keywordChipBadge.innerText = `"${keywordInput.value.trim()}"`;
      } else {
        keywordChipBadge.style.display = 'none';
      }

      // Donor Filter UI
      chipDonor.classList.toggle('active', isDonorFilterActive);
      donorFilterPanel.style.display = isDonorFilterActive ? 'block' : 'none';

      // Sub Filter UI
      chipSub.classList.toggle('active', isSubFilterActive);
      subFilterPanel.style.display = isSubFilterActive ? 'block' : 'none';

      // All Mode Toggle
      const isAll = !isKeywordFilterActive && !isDonorFilterActive && !isSubFilterActive;
      chipAll.classList.toggle('active', isAll);

      updateFilteredStats();
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    function updateExcludeBadge() {
      if (!excludeBadge) return;
      const count = (autoExcludePreviousToggle.checked ? 1 : 0) +
                    (fileExcludeToggle.checked ? 1 : 0) +
                    (manualExcludeToggle.checked ? 1 : 0);

      if (count === 0) {
        excludeBadge.innerText = '제외 없음';
        excludeBadge.style.background = 'rgba(255, 255, 255, 0.08)';
        excludeBadge.style.color = 'var(--text-sub)';
      } else if (autoExcludePreviousToggle.checked && count === 1) {
        excludeBadge.innerText = '기본 중복제외 ON';
        excludeBadge.style.background = 'rgba(0, 255, 163, 0.15)';
        excludeBadge.style.color = 'var(--chzzk-green)';
      } else {
        excludeBadge.innerText = `${count}개 제외 적용 중`;
        excludeBadge.style.background = 'rgba(0, 255, 163, 0.2)';
        excludeBadge.style.color = 'var(--chzzk-green)';
      }
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    keywordInput.addEventListener('input', () => {
      if (keywordInput.value.trim().length > 0) {
        isKeywordFilterActive = true;
      }
      updateFilterUI();
    });

    document.querySelectorAll('input[name="keywordMatchMode"]').forEach(r => {
      r.addEventListener('change', updateFilteredStats);
    });

    donorLevelSelect.addEventListener('change', updateFilteredStats);
    minSubMonths.addEventListener('input', updateFilteredStats);
    subTierSelect.addEventListener('change', updateFilteredStats);

    autoExcludePreviousToggle.addEventListener('change', () => {
      updateExcludeBadge();
      updateFilteredStats();
    });

    fileExcludeToggle.addEventListener('change', () => {
      fileExcludeBox.style.display = fileExcludeToggle.checked ? 'block' : 'none';
      updateExcludeBadge();
      updateFilteredStats();
    });

    manualExcludeToggle.addEventListener('change', () => {
      manualExcludeBox.style.display = manualExcludeToggle.checked ? 'block' : 'none';
      updateExcludeBadge();
      updateFilteredStats();
    });

    // File Upload Exclude Logic
    excludeFileInput.addEventListener('change', handleExcludeFileUpload);
    function handleExcludeFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        parseExcludeFileText(text, file.name);
      };
      reader.readAsText(file, 'utf-8');
    }

    function parseExcludeFileText(text, fileName) {
      fileExcludedTokens.clear();
      const lines = text.split(/\r\n|\n|\r/);
      let count = 0;

      lines.forEach(line => {
        const clean = line.trim();
        if (!clean) return;
        const tokens = clean.split(/[,;\t]/);
        tokens.forEach(tok => {
          let t = tok.trim().replace(/^"|"$/g, '').toLowerCase();
          if (t && t.length > 1) {
            fileExcludedTokens.add(t);
            count++;
          }
        });
      });

      fileExcludeStatus.innerText = `✅ [${fileName}] 총 ${fileExcludedTokens.size.toLocaleString()}개 키워드/UID 제외 등록 완료`;
      fileExcludeToggle.checked = true;
      fileExcludeBox.style.display = 'block';
      updateFilteredStats();
    }

    // Manual Rule Table Paste
    tablePasteInput.addEventListener('paste', (e) => {
      setTimeout(() => {
        const raw = tablePasteInput.value;
        if (!raw.trim()) return;

        const lines = raw.split(/\r\n|\n|\r/);
        lines.forEach(line => {
          if (!line.trim()) return;
          const cols = line.split('\t');
          let nick = cols[0] ? cols[0].trim().toLowerCase() : '';
          let uid = cols[1] ? cols[1].trim().toLowerCase() : '';
          if (nick || uid) {
            manualExcludePairs.push({ nick: nick, uid: uid });
          }
        });

        tablePasteInput.value = '';
        renderManualRules();
        updateFilteredStats();
      }, 50);
    });

    function renderManualRules() {
      excludeRulesBody.innerHTML = '';
      manualExcludePairs.forEach((rule, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(rule.nick || '-')}</td>
          <td>${escapeHtml(rule.uid || '-')}</td>
          <td><button type="button" class="btn-chip btn-chip-danger" style="padding: 2px 4px; font-size: 10px;" onclick="removeManualRule(${idx})">✕</button></td>
        `;
        excludeRulesBody.appendChild(tr);
      });
    }

    function removeManualRule(idx) {
      manualExcludePairs.splice(idx, 1);
      renderManualRules();
      updateFilteredStats();
    }

    // Helper: Extract Channel ID
    function extractChannelId(input) {
      if (!input) return '';
      input = input.trim();
      const hexMatch = input.match(/[a-fA-F0-9]{32}/);
      if (hexMatch) return hexMatch[0];
      const urlMatch = input.match(/chzzk\.naver\.com\/(?:live\/)?([a-zA-Z0-9]+)/);
      if (urlMatch && urlMatch[1]) return urlMatch[1];
      return input.replace(/https?:\/\//i, '').split('/')[0].split('?')[0].trim();
    }

    function getChzzkChatServers(chatCid) {
      let hash = 0;
      for (let i = 0; i < chatCid.length; i++) {
        hash = ((hash << 5) - hash) + chatCid.charCodeAt(i);
        hash |= 0;
      }
      const serverNum = (Math.abs(hash) % 10) + 1;
      return [
        `wss://kr-ss${serverNum}.chat.naver.com/chat`,
        `wss://kr-ss1.chat.naver.com/chat`,
        `wss://kr-ss2.chat.naver.com/chat`,
        `wss://kr-ss3.chat.naver.com/chat`
      ];
    }

    function updateLiveStatusUI(isLive, channelName, liveTitle, viewerCount, channelImage) {
      if (isLive !== undefined && isLive !== null) {
        if (isLive) {
          offlinePollCount = 0;
          isChannelLive = true;
        } else {
          // Prevent momentary flicker: if recent chat received within 60s, keep live
          const hasRecentChat = (Date.now() - lastChatReceivedTime) < 60000;
          if (hasRecentChat) {
            offlinePollCount = 0;
          } else {
            offlinePollCount++;
            if (offlinePollCount >= 2 || !isConnected) {
              isChannelLive = false;
            }
          }
        }
      }
      if (channelName) currentChannelName = channelName;
      if (liveTitle !== undefined) currentLiveTitle = liveTitle;
      if (viewerCount !== undefined) currentViewerCount = viewerCount;
      if (channelImage !== undefined && channelImage !== null) currentChannelImageUrl = channelImage;

      updateStreamerProfileUI();

      if (isConnected) {
        statusLiveBadge.style.display = 'inline-flex';
        statusViewerInfo.style.display = 'inline';
        if (drawerLiveBadge) drawerLiveBadge.style.display = 'inline-flex';

        if (isChannelLive) {
          statusLiveBadge.className = 'live-badge-pill live';
          statusLiveBadge.innerHTML = '🔴 LIVE';
          if (drawerLiveBadge) {
            drawerLiveBadge.className = 'live-badge-pill live';
            drawerLiveBadge.innerHTML = '🔴 LIVE';
          }
          statusText.innerText = currentChannelName;
          statusViewerInfo.innerText = `(👀 ${currentViewerCount.toLocaleString()}명)`;
          statusViewerInfo.title = currentLiveTitle ? `[생방송] ${currentLiveTitle}` : '생방송 진행 중';
        } else {
          statusLiveBadge.className = 'live-badge-pill offline';
          statusLiveBadge.innerHTML = '⚪ OFFLINE';
          if (drawerLiveBadge) {
            drawerLiveBadge.className = 'live-badge-pill offline';
            drawerLiveBadge.innerHTML = '⚪ OFFLINE';
          }
          statusText.innerText = currentChannelName;
          statusViewerInfo.innerText = '(오프라인)';
          statusViewerInfo.title = '현재 방송 중이 아닙니다 (대기 중).';
        }

        // Update modal preview card
        if (modalStreamerCard) {
          modalStreamerCard.style.display = 'block';
          modalChannelName.innerText = currentChannelName;
          const modalAvatar = document.getElementById('modalStreamerAvatar');
          if (modalAvatar) {
            if (currentChannelImageUrl) {
              modalAvatar.src = currentChannelImageUrl;
              modalAvatar.style.display = 'inline-block';
            } else {
              modalAvatar.style.display = 'none';
            }
          }
          if (isChannelLive) {
            modalLiveBadge.className = 'live-badge-pill live';
            modalLiveBadge.innerHTML = '🔴 생방송 중';
            modalViewerCount.innerText = `👀 시청자 ${currentViewerCount.toLocaleString()}명`;
            modalLiveTitle.innerText = currentLiveTitle || '치지직 라이브';
          } else {
            modalLiveBadge.className = 'live-badge-pill offline';
            modalLiveBadge.innerHTML = '⚪ 방송 오프라인';
            modalViewerCount.innerText = '방송 대기';
            modalLiveTitle.innerText = currentLiveTitle ? `최근 방송: ${currentLiveTitle}` : '현재 방송 중이 아닙니다.';
          }
        }
      } else {
        statusLiveBadge.style.display = 'none';
        statusViewerInfo.style.display = 'none';
        if (drawerLiveBadge) drawerLiveBadge.style.display = 'none';
      }

      // Sync Docked Chat Sidebar Live Pill
      const dockedLive = document.getElementById('dockedChatLivePill');
      if (dockedLive) {
        dockedLive.className = (isConnected && isChannelLive) ? 'live-badge-pill live' : 'live-badge-pill offline';
        dockedLive.innerHTML = (isConnected && isChannelLive) ? '🔴 LIVE' : '⚪ OFFLINE';
      }
    }

    function setStatus(status, text, liveData = null) {
      statusDot.className = 'status-dot ' + status;
      
      if (status === 'connected') {
        isConnected = true;
        connectBtnLabel.innerText = '방송 변경';
        disconnectBtn.style.display = 'inline-flex';
        if (liveData) {
          updateLiveStatusUI(
            liveData.isLive !== undefined ? liveData.isLive : isChannelLive,
            liveData.channelName || currentChannelName,
            liveData.liveTitle !== undefined ? liveData.liveTitle : currentLiveTitle,
            liveData.concurrentUserCount !== undefined ? liveData.concurrentUserCount : currentViewerCount,
            liveData.channelImageUrl || currentChannelImageUrl
          );
        } else {
          updateLiveStatusUI(isChannelLive, currentChannelName, currentLiveTitle, currentViewerCount, currentChannelImageUrl);
        }
      } else if (status === 'connecting') {
        isConnected = false;
        connectBtnLabel.innerText = currentChannelId ? '재연결 중...' : '연결 중...';
        disconnectBtn.style.display = currentChannelId ? 'inline-flex' : 'none';
        statusText.innerText = currentChannelName ? `${currentChannelName} (재접속 중...)` : text;
        if (isChannelLive) {
          statusLiveBadge.style.display = 'inline-flex';
          statusLiveBadge.className = 'live-badge-pill live';
          statusLiveBadge.innerHTML = '🔴 LIVE';
          statusViewerInfo.style.display = 'inline';
          const dockedLive = document.getElementById('dockedChatLivePill');
          if (dockedLive) {
            dockedLive.className = 'live-badge-pill live';
            dockedLive.innerHTML = '🔴 LIVE';
          }
        } else {
          statusLiveBadge.style.display = 'none';
          statusViewerInfo.style.display = 'none';
        }
        if (drawerLiveBadge) drawerLiveBadge.style.display = isChannelLive ? 'inline-flex' : 'none';
      } else {
        isConnected = false;
        connectBtnLabel.innerText = '방송 연결';
        disconnectBtn.style.display = 'none';
        statusText.innerText = text;
        statusLiveBadge.style.display = 'none';
        statusViewerInfo.style.display = 'none';
        if (drawerLiveBadge) drawerLiveBadge.style.display = 'none';
        currentChannelImageUrl = '';
        isChannelLive = false;
        offlinePollCount = 0;
        currentLiveTitle = '';
        currentViewerCount = 0;
        updateStreamerProfileUI();
        updateLiveStatusUI(false, '', '', 0, '');
      }
    }

    // ==========================================
    // 🔞 19세(연령 제한) 방송 네이버 쿠키 관리
    // ==========================================
    function toggleAdultCookieSettings(forceOpen = null) {
      const fields = document.getElementById('adultCookieFields');
      const icon = document.getElementById('adultCookieToggleIcon');
      if (!fields || !icon) return;
      const isOpen = forceOpen !== null ? forceOpen : (fields.style.display !== 'none');
      if (isOpen) {
        fields.style.display = 'none';
        icon.innerText = '▼ 열기';
      } else {
        fields.style.display = 'block';
        icon.innerText = '▲ 닫기';
      }
    }

    function updateAdultCookieBadge() {
      const badge = document.getElementById('adultCookieStatusBadge');
      const nidAuth = (document.getElementById('nidAuthInput')?.value || '').trim();
      const nidSes = (document.getElementById('nidSesInput')?.value || '').trim();
      if (!badge) return;
      if (nidAuth && nidSes) {
        badge.style.background = 'rgba(0, 255, 163, 0.2)';
        badge.style.color = 'var(--chzzk-green)';
        badge.innerText = '✓ 쿠키 설정됨';
      } else {
        badge.style.background = 'rgba(255,255,255,0.1)';
        badge.style.color = 'var(--text-sub)';
        badge.innerText = '선택사항';
      }
    }

    function loadSavedCookies() {
      const savedAuth = sessionStorage.getItem('chzzk_nid_aut') || localStorage.getItem('chzzk_nid_aut') || '';
      const savedSes = sessionStorage.getItem('chzzk_nid_ses') || localStorage.getItem('chzzk_nid_ses') || '';
      const authInput = document.getElementById('nidAuthInput');
      const sesInput = document.getElementById('nidSesInput');
      const qAuth = document.getElementById('quickNidAuthInput');
      const qSes = document.getElementById('quickNidSesInput');
      const wAuth = document.getElementById('welcomeNidAuthInput');
      const wSes = document.getElementById('welcomeNidSesInput');
      if (authInput && savedAuth) authInput.value = savedAuth;
      if (sesInput && savedSes) sesInput.value = savedSes;
      if (qAuth && savedAuth) qAuth.value = savedAuth;
      if (qSes && savedSes) qSes.value = savedSes;
      if (wAuth && savedAuth) wAuth.value = savedAuth;
      if (wSes && savedSes) wSes.value = savedSes;
      updateAdultCookieBadge();
    }

    function clearSavedCookies() {
      sessionStorage.removeItem('chzzk_nid_aut');
      sessionStorage.removeItem('chzzk_nid_ses');
      localStorage.removeItem('chzzk_nid_aut');
      localStorage.removeItem('chzzk_nid_ses');
      const authInput = document.getElementById('nidAuthInput');
      const sesInput = document.getElementById('nidSesInput');
      const qAuth = document.getElementById('quickNidAuthInput');
      const qSes = document.getElementById('quickNidSesInput');
      const wAuth = document.getElementById('welcomeNidAuthInput');
      const wSes = document.getElementById('welcomeNidSesInput');
      if (authInput) authInput.value = '';
      if (sesInput) sesInput.value = '';
      if (qAuth) qAuth.value = '';
      if (qSes) qSes.value = '';
      if (wAuth) wAuth.value = '';
      if (wSes) wSes.value = '';
      updateAdultCookieBadge();
      if (typeof showToast === 'function') {
        showToast('저장된 19세 인증 쿠키가 삭제되었습니다.', '🗑️');
      }
    }

    // =========================================================
    // 🚀 NEW: Welcome Landing Screen & Channel Search Handlers
    // =========================================================
    let searchDebounceTimer = null;
    let welcomeSearchAbortController = null;

    function handleWelcomeSearchInput(val) {
      const clearBtn = document.getElementById('welcomeClearSearchBtn');
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }

      const q = (val || '').trim();
      if (!q) {
        const resBox = document.getElementById('welcomeSearchResultsBox');
        if (resBox) resBox.style.display = 'none';
        return;
      }

      // Real-time live search with 250ms debounce
      searchDebounceTimer = setTimeout(() => {
        executeWelcomeSearch(true);
      }, 250);
    }

    function clearWelcomeSearch() {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }
      const input = document.getElementById('welcomeSearchInput');
      if (input) {
        input.value = '';
        input.focus();
      }
      const clearBtn = document.getElementById('welcomeClearSearchBtn');
      if (clearBtn) clearBtn.style.display = 'none';
      const resBox = document.getElementById('welcomeSearchResultsBox');
      if (resBox) resBox.style.display = 'none';
    }

    function quickSearchStreamer(streamerName) {
      const input = document.getElementById('welcomeSearchInput');
      if (input) {
        input.value = streamerName;
        const clearBtn = document.getElementById('welcomeClearSearchBtn');
        if (clearBtn) clearBtn.style.display = 'block';
        executeWelcomeSearch();
      }
    }

    function quickConnectSampleChannel(channelId = '1ad5aa0f6c6741b072528fad5e5e76b1') {
      selectSearchStreamer(channelId, '기본 테스트 채널', '', false);
    }

    function toggleWelcomeAdultSettings() {
      const fields = document.getElementById('welcomeAdultFields');
      const icon = document.getElementById('welcomeAdultToggleIcon');
      if (!fields || !icon) return;
      const isOpen = fields.style.display !== 'none';
      if (isOpen) {
        fields.style.display = 'none';
        icon.innerText = '▼';
      } else {
        fields.style.display = 'block';
        icon.innerText = '▲';
        setTimeout(() => document.getElementById('welcomeNidAuthInput')?.focus(), 50);
      }
    }

    function formatFollowerCount(num) {
      if (!num) return '0명';
      if (num >= 10000) {
        return (num / 10000).toFixed(1).replace(/\.0$/, '') + '만명';
      }
      return Number(num).toLocaleString() + '명';
    }

    async function executeWelcomeSearch(isLiveInput = false) {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
      }
      const input = document.getElementById('welcomeSearchInput');
      const query = (input?.value || '').trim();
      if (!query) {
        if (!isLiveInput) {
          showAppAlert('스트리머 이름 또는 치지직 채널 주소를 입력해주세요.', '입력 확인');
          input?.focus();
        }
        const resBox = document.getElementById('welcomeSearchResultsBox');
        if (resBox) resBox.style.display = 'none';
        return;
      }

      if (welcomeSearchAbortController) {
        try { welcomeSearchAbortController.abort(); } catch (e) {}
      }
      welcomeSearchAbortController = new AbortController();
      const searchSignal = welcomeSearchAbortController.signal;

      const directChannelId = extractChannelId(query);
      const isDirectIdOrUrl = directChannelId && (query.startsWith('http') || query.length === 32 || query.includes('/live/') || query.includes('/channel/'));

      const resBox = document.getElementById('welcomeSearchResultsBox');
      const listContainer = document.getElementById('welcomeSearchResultsList');
      const countText = document.getElementById('searchResultCountText');
      const btnText = document.getElementById('welcomeSearchBtnText');
      const btnIcon = document.getElementById('welcomeSearchBtnIcon');

      if (btnText) btnText.innerText = '검색 중...';
      if (btnIcon) btnIcon.innerText = '⏳';
      if (resBox) resBox.style.display = 'flex';
      if (listContainer && (!listContainer.children.length || !isLiveInput)) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-sub);"><div class="spinner" style="margin: 0 auto 10px; width: 24px; height: 24px;"></div>채널을 검색하고 팔로워 순으로 정렬하는 중...</div>';
      }

      try {
        let channels = [];
        let directCardHtml = '';
        if (isDirectIdOrUrl) {
          directCardHtml = `
            <div class="streamer-search-card" style="border: 1.5px solid var(--chzzk-green); background: rgba(0, 255, 163, 0.08);" onclick="selectSearchStreamer('${escapeJsArg(directChannelId)}', '입력한 방송', '', false)">
              <div style="font-size: 26px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(0,255,163,0.15); border-radius: 50%;">📡</div>
              <div class="streamer-card-info">
                <div class="streamer-card-name-row">
                  <span class="streamer-card-name" style="color: var(--chzzk-green);">입력한 주소/ID로 즉시 연결</span>
                </div>
                <div class="streamer-card-meta">
                  <span>채널 ID: <b>${escapeHtml(directChannelId)}</b></span>
                </div>
              </div>
              <button type="button" class="btn btn-primary streamer-card-connect-btn">
                <span>즉시 연결 ➔</span>
              </button>
            </div>
          `;
        }

        // Try local server proxy first
        try {
          const res = await fetch(`/api/chzzk/search?keyword=${encodeURIComponent(query)}`, { signal: searchSignal });
          if (res.ok) {
            const data = await res.json();
            channels = data.channels || [];
          }
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          console.warn('Local search proxy error, trying direct API:', e);
        }

        if (searchSignal.aborted) return;

        // Direct Chzzk API fallback
        if (channels.length === 0 && !isDirectIdOrUrl) {
          try {
            const directRes = await fetch(`https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(query)}&offset=0&size=20`, { signal: searchSignal });
            if (directRes.ok) {
              const directData = await directRes.json();
              const rawData = directData?.content?.data || [];
              channels = rawData.map(item => {
                const ch = item.channel || {};
                return {
                  channelId: ch.channelId,
                  channelName: ch.channelName || '',
                  channelImageUrl: ch.channelImageUrl || '',
                  followerCount: ch.followerCount || 0,
                  openLive: !!ch.openLive,
                  verifiedMark: !!ch.verifiedMark
                };
              });
            }
          } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.warn('Direct Chzzk API error:', e);
          }
        }

        if (searchSignal.aborted) return;

        // Sort by followerCount descending as requested!
        channels.sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0));

        if (countText) {
          countText.innerText = `검색 결과 ${channels.length}건`;
        }

        if (channels.length === 0 && !directCardHtml) {
          if (listContainer) {
            listContainer.innerHTML = `
              <div style="text-align: center; padding: 24px; color: var(--text-sub); line-height: 1.6;">
                <div style="font-size: 28px; margin-bottom: 6px;">🔍</div>
                '<b>${escapeHtml(query)}</b>' 관련 채널을 찾을 수 없습니다.<br>
                정확한 스트리머 닉네임이나 치지직 방송 URL을 입력해주세요.
              </div>
            `;
          }
          return;
        }

        let html = directCardHtml;
        channels.forEach(c => {
          const avatarUrl = c.channelImageUrl || 'delibird.png';
          const liveBadge = c.openLive
            ? '<span class="live-badge-pill live" style="font-size: 10px; padding: 2px 6px;">🔴 LIVE</span>'
            : '<span class="live-badge-pill offline" style="font-size: 10px; padding: 2px 6px;">⚪ OFFLINE</span>';
          const verifiedBadge = c.verifiedMark
            ? '<span style="background: var(--chzzk-green); color: #000; font-size: 9px; font-weight: 900; border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center;" title="치지직 인증 채널">✓</span>'
            : '';
          const followerStr = formatFollowerCount(c.followerCount);
          const rawName = c.channelName || '치지직 스트리머';
          const safeName = escapeHtml(rawName);
          const safeId = escapeHtml(c.channelId);

          html += `
            <div class="streamer-search-card" onclick="selectSearchStreamer('${escapeJsArg(c.channelId)}', '${escapeJsArg(rawName)}', '${escapeJsArg(c.channelImageUrl || '')}', ${!!c.openLive})">
              <img src="${escapeHtml(avatarUrl)}" class="streamer-card-avatar" alt="${safeName}" onerror="this.src='delibird.png'">
              <div class="streamer-card-info">
                <div class="streamer-card-name-row">
                  <span class="streamer-card-name">${safeName}</span>
                  ${verifiedBadge}
                  ${liveBadge}
                </div>
                <div class="streamer-card-meta">
                  <span>👥 팔로워 <b>${followerStr}</b></span>
                  <span style="color: rgba(255,255,255,0.3); font-size: 10px;">ID: ${safeId.substring(0, 10)}...</span>
                </div>
              </div>
              <button type="button" class="btn btn-primary streamer-card-connect-btn">
                <span>연결 ➔</span>
              </button>
            </div>
          `;
        });

        if (listContainer) listContainer.innerHTML = html;

      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.error('검색 오류:', err);
        if (listContainer) {
          listContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #f87171;">검색 중 오류가 발생했습니다: ${escapeHtml(err.message)}</div>`;
        }
      } finally {
        if (btnText) btnText.innerText = '검색';
        if (btnIcon) btnIcon.innerText = '🔍';
      }
    }

    function selectSearchStreamer(channelId, channelName, avatarUrl, isLive) {
      currentChannelId = channelId;
      if (channelName && channelName !== '입력한 방송') currentChannelName = channelName;
      if (avatarUrl) currentChannelImageUrl = avatarUrl;
      if (isLive !== undefined && isLive !== null) isChannelLive = !!isLive;
      const mInput = document.getElementById('channelInput');
      const qInput = document.getElementById('quickChannelInput');
      if (mInput) mInput.value = channelId;
      if (qInput) qInput.value = channelId;

      enterWorkspace();
      showToast(`📡 ${currentChannelName} 방송에 연결을 시작합니다...`, '🚀');

      isManualDisconnect = false;
      reconnectAttempts = 0;
      serverIndexOffset = 0;
      startConnectionFlow();
    }

    function enterWorkspace() {
      const welcome = document.getElementById('welcomeLandingScreen');
      const workspace = document.getElementById('appWorkspaceArea');
      const backBtn = document.getElementById('welcomeBackToWorkspaceBtn');
      if (welcome) welcome.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      if (backBtn) backBtn.style.display = 'inline-flex';
      sessionStorage.setItem('entered_workspace', 'true');
      if (typeof updateFloatingChatTabUI === 'function') updateFloatingChatTabUI();
    }

    function enterWorkspaceOffline() {
      enterWorkspace();
      showToast('⚡ 방송 연결 없이 오프라인 작업대로 입장했습니다.', '💡');
    }

    function openChangeChannelScreen() {
      const connModal = document.getElementById('connectionModal');
      if (connModal) connModal.classList.remove('active');
      const welcome = document.getElementById('welcomeLandingScreen');
      const workspace = document.getElementById('appWorkspaceArea');
      const backBtn = document.getElementById('welcomeBackToWorkspaceBtn');
      if (workspace) workspace.style.display = 'none';
      if (welcome) welcome.style.display = 'flex';
      if (backBtn) backBtn.style.display = 'inline-flex';
      const floatingBtn = document.getElementById('floatingChatTabBtn');
      if (floatingBtn) floatingBtn.style.display = 'none';
      if (typeof renderRecentChannels === 'function') renderRecentChannels();
      const input = document.getElementById('welcomeSearchInput');
      if (input) {
        input.focus();
        input.select();
      }
    }

    function returnToWorkspace() {
      const welcome = document.getElementById('welcomeLandingScreen');
      const workspace = document.getElementById('appWorkspaceArea');
      if (welcome) welcome.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      if (typeof updateFloatingChatTabUI === 'function') updateFloatingChatTabUI();
    }

    // ==========================================
    // 📺 Top Quick Broadcast Connect Bar Handlers
    // ==========================================
    function handleQuickChannelInputChange(val) {
      const modalInput = document.getElementById('channelInput');
      if (modalInput) modalInput.value = val;
      const clearBtn = document.getElementById('quickClearInputBtn');
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
    }

    function clearQuickChannelInput() {
      const qInput = document.getElementById('quickChannelInput');
      const mInput = document.getElementById('channelInput');
      if (qInput) qInput.value = '';
      if (mInput) mInput.value = '';
      const clearBtn = document.getElementById('quickClearInputBtn');
      if (clearBtn) clearBtn.style.display = 'none';
      if (qInput) qInput.focus();
    }

    function fillQuickSampleChannel(channelId = '1ad5aa0f6c6741b072528fad5e5e76b1') {
      const qInput = document.getElementById('quickChannelInput');
      const mInput = document.getElementById('channelInput');
      if (qInput) qInput.value = channelId;
      if (mInput) mInput.value = channelId;
      const clearBtn = document.getElementById('quickClearInputBtn');
      if (clearBtn) clearBtn.style.display = 'block';
      showToast('💡 샘플 채널이 입력되었습니다.', '📡');
    }

    function toggleQuickAdultSettings() {
      const fields = document.getElementById('quickAdultFields');
      const icon = document.getElementById('quickAdultToggleIcon');
      if (!fields || !icon) return;
      const isOpen = fields.style.display !== 'none';
      if (isOpen) {
        fields.style.display = 'none';
        icon.innerText = '▼';
      } else {
        fields.style.display = 'block';
        icon.innerText = '▲';
        setTimeout(() => document.getElementById('quickNidAuthInput')?.focus(), 50);
      }
    }

    function syncAdultCookieInputs(source) {
      let auth = '', ses = '';
      if (source === 'welcome') {
        auth = (document.getElementById('welcomeNidAuthInput')?.value || '').trim();
        ses = (document.getElementById('welcomeNidSesInput')?.value || '').trim();
      } else if (source === 'quick') {
        auth = (document.getElementById('quickNidAuthInput')?.value || '').trim();
        ses = (document.getElementById('quickNidSesInput')?.value || '').trim();
      } else {
        auth = (document.getElementById('nidAuthInput')?.value || '').trim();
        ses = (document.getElementById('nidSesInput')?.value || '').trim();
      }

      const wAuth = document.getElementById('welcomeNidAuthInput');
      const wSes = document.getElementById('welcomeNidSesInput');
      const qAuth = document.getElementById('quickNidAuthInput');
      const qSes = document.getElementById('quickNidSesInput');
      const mAuth = document.getElementById('nidAuthInput');
      const mSes = document.getElementById('nidSesInput');

      if (wAuth) wAuth.value = auth;
      if (wSes) wSes.value = ses;
      if (qAuth) qAuth.value = auth;
      if (qSes) qSes.value = ses;
      if (mAuth) mAuth.value = auth;
      if (mSes) mSes.value = ses;

      updateAdultCookieBadge();
    }

    let wsReconnectTimer = null;
    let wsLastActivityTime = 0;

    function getCurrentAdultCredentials() {
      const nidAuth = (
        document.getElementById('welcomeNidAuthInput')?.value
        || document.getElementById('quickNidAuthInput')?.value
        || document.getElementById('nidAuthInput')?.value
        || sessionStorage.getItem('chzzk_nid_aut')
        || localStorage.getItem('chzzk_nid_aut')
        || ''
      ).trim();
      const nidSes = (
        document.getElementById('welcomeNidSesInput')?.value
        || document.getElementById('quickNidSesInput')?.value
        || document.getElementById('nidSesInput')?.value
        || sessionStorage.getItem('chzzk_nid_ses')
        || localStorage.getItem('chzzk_nid_ses')
        || ''
      ).trim();
      return { nidAuth, nidSes };
    }

    function cleanupWebSocket(shouldClearReconnect = true) {
      if (shouldClearReconnect && wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
      }
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (ws) {
        try {
          ws.onopen = null;
          ws.onmessage = null;
          ws.onerror = null;
          ws.onclose = null;
          ws.close();
        } catch (e) {}
        ws = null;
      }
    }

    async function submitQuickBroadcastConnect() {
      const qInput = document.getElementById('quickChannelInput');
      const rawVal = (qInput?.value || '').trim();
      currentChannelId = extractChannelId(rawVal);
      if (!currentChannelId) {
        await showAppAlert('올바른 치지직 채널 ID 또는 방송 URL을 입력해주세요.', '입력 오류');
        if (qInput) qInput.focus();
        return;
      }
      const mInput = document.getElementById('channelInput');
      if (mInput) mInput.value = rawVal;
      isManualDisconnect = false;
      reconnectAttempts = 0;
      serverIndexOffset = 0;
      await startConnectionFlow();
    }

    function promptChangeBroadcastChannel() {
      openChangeChannelScreen();
    }


    // Connect Entry
    if (connectBtn) {
      connectBtn.addEventListener('click', async () => {
        currentChannelId = extractChannelId(channelInput.value);
        if (!currentChannelId) {
          await showAppAlert('올바른 치지직 채널 ID 또는 방송 URL을 입력해주세요.', '입력 오류');
          return;
        }

        closeConnectModal();
        isManualDisconnect = false;
        reconnectAttempts = 0;
        serverIndexOffset = 0;

        await startConnectionFlow();
      });
    }

    async function startConnectionFlow(isSilentReconnect = false) {
      if (!isSilentReconnect) {
        setStatus('connecting', '치지직 방송 접근 토큰 요청 중...');
      }

      const { nidAuth, nidSes } = getCurrentAdultCredentials();

      if (nidAuth) sessionStorage.setItem('chzzk_nid_aut', nidAuth);
      if (nidSes) sessionStorage.setItem('chzzk_nid_ses', nidSes);

      if (document.getElementById('saveCookieCheck')?.checked) {
        if (nidAuth) localStorage.setItem('chzzk_nid_aut', nidAuth);
        if (nidSes) localStorage.setItem('chzzk_nid_ses', nidSes);
      } else {
        localStorage.removeItem('chzzk_nid_aut');
        localStorage.removeItem('chzzk_nid_ses');
      }

      try {
        const res = await fetch('/api/chzzk/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: currentChannelId,
            nidAuth,
            nidSes
          })
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          if (isSilentReconnect) {
            console.warn('Silent reconnect token refresh failed:', data.error);
            if (!isManualDisconnect) {
              wsReconnectTimer = setTimeout(() => connectWebSocketServer(), 5000);
            }
            return;
          }
          setStatus('disconnected', '연결 실패');
          if (data.isAdult) {
            openChangeChannelScreen();
            const fields = document.getElementById('welcomeAdultFields');
            if (fields && fields.style.display === 'none') {
              toggleWelcomeAdultSettings();
            }
            setTimeout(() => document.getElementById('welcomeNidAuthInput')?.focus(), 200);
            await showAppAlert(data.error || '🔞 19세(연령 제한) 방송입니다. [19세 방송 연결 설정]에 NID_AUT와 NID_SES 쿠키를 입력해주세요.', '🔞 19세 방송 인증 필요');
          } else {
            await showAppAlert('오류: ' + (data.error || '방송 정보를 불러올 수 없습니다.'), '연결 오류');
          }
          return;
        }

        currentChannelName = data.channelName || '치지직 방송';
        currentChatChannelId = data.chatChannelId;
        currentAccessToken = data.accessToken;
        currentChannelImageUrl = data.channelImageUrl || '';
        isChannelLive = !!data.isLive;
        currentLiveTitle = data.liveTitle || '';
        currentViewerCount = data.concurrentUserCount || 0;
        currentCategory = data.categoryType || data.liveCategoryValue || '종합게임';

        recordRecentChannel({
          channelId: currentChannelId,
          channelName: currentChannelName,
          channelImageUrl: currentChannelImageUrl
        });

        updateStreamerProfileUI();
        startLiveStatusPolling();
        connectWebSocketServer();

      } catch (err) {
        if (isSilentReconnect) {
          console.warn('Silent reconnect network error:', err);
          if (!isManualDisconnect) {
            wsReconnectTimer = setTimeout(() => connectWebSocketServer(), 5000);
          }
          return;
        }
        await showAppAlert('서버통신 오류: ' + err.message, '연결 오류');
        setStatus('disconnected', '오류 발생');
      }
    }

    function connectWebSocketServer() {
      if (!currentChatChannelId || !currentAccessToken) {
        setStatus('disconnected', '접근 토큰 없음');
        return;
      }

      const serverList = getChzzkChatServers(currentChatChannelId);
      const targetWsUrl = serverList[serverIndexOffset % serverList.length];

      setStatus('connecting', `웹소켓 접속 중...`);
      cleanupWebSocket(true);

      let localWs = null;
      try {
        localWs = new WebSocket(targetWsUrl);
        ws = localWs;
      } catch (err) {
        console.error('WebSocket init error:', err);
        setStatus('connecting', '웹소켓 재연결 준비 중...');
        return;
      }

      localWs.onopen = () => {
        if (ws !== localWs) return;
        wsLastActivityTime = Date.now();
        const connectPayload = {
          ver: "2",
          cmd: 100,
          svcid: "game",
          cid: currentChatChannelId,
          bdy: {
            accTkn: currentAccessToken,
            auth: "READ",
            devType: 2001,
            uid: null
          },
          tid: 1
        };
        localWs.send(JSON.stringify(connectPayload));

        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (ws !== localWs) return;
          if (Date.now() - wsLastActivityTime > 50000) {
            console.warn('WebSocket zombie timeout detected (>50s idle). Triggering reconnect...');
            try { localWs.close(); } catch (e) {}
            return;
          }
          if (localWs.readyState === WebSocket.OPEN) {
            localWs.send(JSON.stringify({ ver: "2", cmd: 0 }));
          }
        }, 20000);
      };

      localWs.onmessage = (event) => {
        if (ws !== localWs) return;
        wsLastActivityTime = Date.now();
        try {
          const data = JSON.parse(event.data);

          // Heartbeat Ping from Chzzk Server (cmd: 0) -> MUST reply with Pong (cmd: 10000)
          if (data.cmd === 0) {
            if (localWs.readyState === WebSocket.OPEN) {
              localWs.send(JSON.stringify({ ver: "2", cmd: 10000 }));
            }
            return;
          }

          // Connection ACK (10100) or Server Pong response (10000)
          if (data.cmd === 10100 || data.cmd === 10000) {
            reconnectAttempts = 0;
            if (!isConnected) {
              setStatus('connected', currentChannelName, {
                isLive: isChannelLive,
                channelName: currentChannelName,
                liveTitle: currentLiveTitle,
                concurrentUserCount: currentViewerCount,
                channelImageUrl: currentChannelImageUrl
              });
            }
            return;
          }

          // Live Chat / Donation / Sub Messages (93101, 93102, 93103, 93104, 93105, 93106, etc.)
          if (data && ((data.cmd >= 93000 && data.cmd <= 93999) || data.cmd === 93101 || data.cmd === 93102 || data.cmd === 93103 || data.cmd === 93104 || data.cmd === 93105 || data.cmd === 93106)) {
            const bdyList = Array.isArray(data.bdy) ? data.bdy : (data.bdy ? [data.bdy] : (Array.isArray(data.body) ? data.body : (data.body ? [data.body] : [])));
            bdyList.forEach(item => {
              if (item) processChatMessage(item, data.cmd);
            });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      localWs.onerror = (e) => {
        if (ws !== localWs) return;
        console.warn('WebSocket error:', e);
        if (!isManualDisconnect) setStatus('connecting', '웹소켓 재연결 시도 중...');
      };

      localWs.onclose = () => {
        if (ws !== localWs) return;
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
        if (!isManualDisconnect) {
          reconnectAttempts++;
          serverIndexOffset++;
          const waitTime = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
          setStatus('connecting', `연결 끊김 (${reconnectAttempts}회차 재접속 중...)`);
          if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
          wsReconnectTimer = setTimeout(() => {
            if (isManualDisconnect) return;
            if (reconnectAttempts % 2 === 0) {
              startConnectionFlow(true);
            } else {
              connectWebSocketServer();
            }
          }, waitTime);
        } else {
          setStatus('disconnected', '방송 미연결');
        }
      };
    }

    function disconnectBroadcast() {
      isManualDisconnect = true;
      cleanupWebSocket(true);
      if (liveStatusPollingInterval) {
        clearInterval(liveStatusPollingInterval);
        liveStatusPollingInterval = null;
      }
      setStatus('disconnected', '방송 미연결');
      const barDisc = document.getElementById('broadcastBarDisconnected');
      const barConn = document.getElementById('broadcastBarConnected');
      if (barDisc) barDisc.style.display = 'block';
      if (barConn) barConn.style.display = 'none';
      openChangeChannelScreen();
    }

    disconnectBtn.addEventListener('click', () => {
      disconnectBroadcast();
    });

    function startLiveStatusPolling() {
      if (liveStatusPollingInterval) clearInterval(liveStatusPollingInterval);
      const poll = async () => {
        if (!currentChannelId || isManualDisconnect) return;
        try {
          const { nidAuth, nidSes } = getCurrentAdultCredentials();
          const res = await fetch('/api/chzzk/live-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId: currentChannelId,
              nidAuth,
              nidSes
            })
          });
          const data = await res.json();
          if (data && !data.error) {
            updateLiveStatusUI(data.isLive, data.channelName, data.liveTitle, data.concurrentUserCount, data.channelImageUrl);
          }
        } catch (e) {}
      };
      liveStatusPollingInterval = setInterval(poll, 15000);
      setTimeout(poll, 2500);
    }

    // Donator Level Parser
    function parseDonatorStatus(profileData) {
      let isDonator = false;
      let donatorLevel = 0;

      const badges = [...(profileData.viewerBadges || []), ...(profileData.activityBadges || [])];
      for (const b of badges) {
        const badgeObj = b.badge || b;
        const bId = String(badgeObj.badgeId || badgeObj.badgeNo || badgeObj.name || '').toLowerCase();
        const bTitle = String(badgeObj.title || badgeObj.name || badgeObj.badgeName || '').toLowerCase();
        const bDesc = String(badgeObj.description || badgeObj.text || '').toLowerCase();
        const text = bId + ' ' + bTitle + ' ' + bDesc;

        if (text.includes('donation') || text.includes('cheese') || text.includes('fan') || text.includes('후원') || text.includes('치즈')) {
          isDonator = true;
          if (text.includes('1억') || text.includes('lv5') || text.includes('level5')) donatorLevel = Math.max(donatorLevel, 5);
          else if (text.includes('1000만') || text.includes('1,000만') || text.includes('lv4') || text.includes('level4')) donatorLevel = Math.max(donatorLevel, 4);
          else if (text.includes('100만') || text.includes('1,000,000') || text.includes('lv3') || text.includes('level3')) donatorLevel = Math.max(donatorLevel, 3);
          else if (text.includes('10만') || text.includes('100,000') || text.includes('lv2') || text.includes('level2')) donatorLevel = Math.max(donatorLevel, 2);
          else if (text.includes('lv1') || text.includes('level1')) donatorLevel = Math.max(donatorLevel, 1);
          else if (donatorLevel === 0) donatorLevel = 1;
        }
      }

      return { isDonator, donatorLevel };
    }

    function parseChatExtras(rawExtras) {
      if (!rawExtras) return null;
      if (typeof rawExtras === 'object') return rawExtras;
      if (typeof rawExtras === 'string') {
        try {
          return JSON.parse(rawExtras);
        } catch (e) {
          try {
            const amtMatch = rawExtras.match(/"(?:payAmount|donationAmount|cheeseAmount|amount|pay_amount|cheese|totalPayAmount)":\s*"?(\d+)"?/i);
            const msgMatch = rawExtras.match(/"(?:message|msg|text)":\s*"([^"]*)"/i);
            return {
              payAmount: amtMatch ? parseInt(amtMatch[1], 10) : 0,
              message: msgMatch ? msgMatch[1] : ''
            };
          } catch (err2) {}
        }
      }
      return null;
    }

    let statsUpdateRafId = null;
    function scheduleFilteredStatsUpdate() {
      if (statsUpdateRafId) return;
      statsUpdateRafId = requestAnimationFrame(() => {
        statsUpdateRafId = null;
        updateFilteredStats();
      });
    }

    let isRaffleCollecting = true;
    const nickToUidIndex = new Map();
    const MAX_CHAT_HISTORY_USERS = 2000;

    function toggleRaffleCollection(forceState = null) {
      isRaffleCollecting = (forceState !== null) ? !!forceState : !isRaffleCollecting;
      const btn = document.getElementById('raffleCollectToggleBtn');
      if (btn) {
        if (isRaffleCollecting) {
          btn.className = 'btn-chip btn-chip-primary';
          btn.innerText = '🟢 모집 중 (클릭 시 마감)';
        } else {
          btn.className = 'btn-chip btn-chip-danger';
          btn.innerText = '🛑 모집 마감됨 (클릭 시 재개)';
        }
      }
      if (typeof showToast === 'function') {
        showToast(
          isRaffleCollecting
            ? '🟢 시청자 추첨 참여자 모집이 재개되었습니다.'
            : '🛑 시청자 추첨 참여자 신규 모집이 마감되었습니다.',
          isRaffleCollecting ? '🟢' : '🛑'
        );
      }
    }

    function processChatMessage(item, cmd = 0) {
      if (!item) return;
      lastChatReceivedTime = Date.now();
      chatLogCount++;
      if (chatBadgeCount) chatBadgeCount.innerText = chatLogCount.toLocaleString();
      if (drawerChatCount) drawerChatCount.innerText = `${chatLogCount.toLocaleString()}개`;

      let profileData = {};
      if (item.profile) {
        if (typeof item.profile === 'object') {
          profileData = item.profile;
        } else if (typeof item.profile === 'string') {
          try { profileData = JSON.parse(item.profile); } catch (e) {}
        }
      }

      // Unified safe extraction of extras with regex fallback
      const extras = parseChatExtras(item.extras);

      // Safe UID extraction (never crash on undefined/anonymous)
      const rawUid = String(item.uid || (profileData && profileData.userIdHash) || (item.userId) || '').trim();
      const uid = rawUid || ('anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));

      // Safe nickname extraction
      let nickname = profileData.nickname || (rawUid ? rawUid.substring(0, 8) : '익명');
      if (extras && extras.isAnonymous) {
        nickname = '익명 후원자';
      }
      if (nickname) {
        nickToUidIndex.set(nickname, uid);
      }

      // Safe message text extraction (check extras.message if item.msg is empty)
      const msgText = String(item.msg || (extras && (extras.message || extras.msg || extras.text)) || profileData.msg || item.content || '').trim();

      const sp = profileData.streamingProperty || {};
      const subInfo = sp.subscription || null;
      
      const isSubscriber = !!subInfo;
      const subMonth = subInfo ? (subInfo.accumulativeMonth || 1) : 0;
      const subTier = subInfo ? (subInfo.tier || 1) : 0;

      const { isDonator, donatorLevel } = parseDonatorStatus(profileData);
      const now = new Date().toLocaleTimeString('ko-KR');

      if (isRaffleCollecting) {
        if (!participants.has(uid)) {
          participants.set(uid, {
            nickname: nickname,
            msg: msgText,
            messages: msgText ? [msgText] : [],
            time: now,
            uid: uid,
            isSubscriber: isSubscriber,
            subMonth: subMonth,
            subTier: subTier,
            isDonator: isDonator,
            donatorLevel: donatorLevel
          });

          scheduleFilteredStatsUpdate();
        } else {
          const p = participants.get(uid);
          p.nickname = nickname || p.nickname;
          p.msg = msgText;
          if (!Array.isArray(p.messages)) {
            p.messages = [];
          }
          if (msgText && p.messages[p.messages.length - 1] !== msgText) {
            p.messages.push(msgText);
            if (p.messages.length > 30) {
              p.messages.shift();
            }
          }
          p.time = now;
          if (isSubscriber) {
            p.isSubscriber = true;
            p.subMonth = subMonth;
            p.subTier = subTier;
          }
          if (isDonator) {
            p.isDonator = true;
            p.donatorLevel = Math.max(p.donatorLevel, donatorLevel);
          }
          scheduleFilteredStatsUpdate();
        }
      }

      // Record chat log per user UID with LRU eviction bounded by MAX_CHAT_HISTORY_USERS
      if (!userChatHistory.has(uid)) {
        if (userChatHistory.size >= MAX_CHAT_HISTORY_USERS) {
          let evicted = false;
          for (const oldUid of userChatHistory.keys()) {
            const lowerOld = String(oldUid).toLowerCase();
            if (oldUid !== activeTrackingUserUID && !cumulativeDrawnUIDs.has(lowerOld)) {
              userChatHistory.delete(oldUid);
              evicted = true;
              break;
            }
          }
          if (!evicted) {
            for (const oldUid of userChatHistory.keys()) {
              if (oldUid !== activeTrackingUserUID) {
                userChatHistory.delete(oldUid);
                break;
              }
            }
          }
        }
        userChatHistory.set(uid, []);
      } else {
        // Refresh insertion order for true LRU
        const existingHist = userChatHistory.get(uid);
        userChatHistory.delete(uid);
        userChatHistory.set(uid, existingHist);
      }
      const chatRecord = {
        nickname: nickname,
        msg: msgText,
        time: now,
        isSubscriber: isSubscriber,
        subMonth: subMonth,
        subTier: subTier,
        isDonator: isDonator,
        donatorLevel: donatorLevel
      };
      const userHist = userChatHistory.get(uid);
      userHist.push(chatRecord);
      if (userHist.length > 200) {
        userHist.shift();
      }

      // If User Chat Tracker Modal is currently open for this user, append live!
      if (activeTrackingUserUID === uid) {
        appendUserChatMessage(chatRecord, true);
      }

      // Handle Live Poll Chat & Donation
      handleLivePollChat(nickname, msgText, uid, isSubscriber, isDonator, now);

      // Handle Live Voltorb Flip Coordinate Vote for Viewers' Turn
      handleLiveGameChatVote(nickname, msgText, uid, now);

      // Handle Live Pokemon 1v1 Battle Move Vote for Viewers' Turn
      if (typeof factionRecruiting !== 'undefined' && factionRecruiting) {
        handleFactionOmniChat(nickname, msgText, uid);
      }
      handleLivePokeBattleChatVote(nickname, msgText, uid, now);

      // Handle Live Pokemon Quiz Show Answer
      handleLivePokeQuizChat(nickname, msgText, uid, now);

      // Parse and Handle Live Cheese Donation for Roulette & Cheese Poll
      const donationInfo = parseLiveDonation(item, profileData, cmd, extras);
      if (donationInfo.isDonation && donationInfo.payAmount > 0) {
        handleLiveDonation(nickname, msgText, uid, donationInfo.payAmount, now);
        handleLivePollDonation(nickname, msgText, uid, donationInfo.payAmount, now);
      }

      addChatToFeed(nickname, msgText, now, isSubscriber, isDonator, donationInfo.isDonation ? donationInfo.payAmount : 0, uid, donationInfo.isDonation);
      const quickChatCountEl = document.getElementById('quickCollectedChatCount');
      if (quickChatCountEl) quickChatCountEl.innerText = chatLogCount.toLocaleString();
    }

    function parseLiveDonation(item, profileData, cmd = 0, preParsedExtras = null) {
      const msgType = Number(item.msgTypeCode);
      let isDonation = (cmd === 93102) || (cmd === 93105) || (cmd === 93106) || 
                       (item.cmd === 93102) || (item.cmd === 93105) ||
                       msgType === 10 || msgType === 11 || msgType === 12 || msgType === 13 || msgType === 14 || msgType === 15;
      let payAmount = 0;
      let donationType = 'CHAT';

      const extras = preParsedExtras || parseChatExtras(item.extras);

      if (extras) {
        const rawAmt = extras.payAmount ?? extras.donationAmount ?? extras.cheeseAmount ?? extras.amount ?? extras.pay_amount ?? extras.cheese ?? extras.totalPayAmount;
        if (rawAmt !== undefined && rawAmt !== null && Number(rawAmt) > 0) {
          isDonation = true;
          payAmount = Number(rawAmt);
        }
        if (extras.donationType) {
          isDonation = true;
          donationType = extras.donationType;
        }
      }

      if (!payAmount && item.payAmount) {
        isDonation = true;
        payAmount = Number(item.payAmount) || 0;
      }
      if (!payAmount && item.amount) {
        isDonation = true;
        payAmount = Number(item.amount) || 0;
      }
      if (!payAmount && profileData && profileData.streamingProperty && profileData.streamingProperty.donation) {
        isDonation = true;
        payAmount = Number(profileData.streamingProperty.donation.amount || 0);
      }

      return { isDonation, payAmount, donationType, extras };
    }

    function isExcluded(p) {
      const lowerNick = p.nickname.trim().toLowerCase();
      const lowerUid = p.uid.trim().toLowerCase();

      if (autoExcludePreviousToggle.checked && cumulativeDrawnUIDs.has(lowerUid)) {
        return true;
      }

      if (fileExcludeToggle.checked && fileExcludedTokens.size > 0) {
        if (fileExcludedTokens.has(lowerUid) || fileExcludedTokens.has(lowerNick)) {
          return true;
        }
      }

      if (manualExcludeToggle.checked && manualExcludePairs.length > 0) {
        for (const rule of manualExcludePairs) {
          if (rule.nick && rule.uid) {
            if (lowerNick === rule.nick && lowerUid === rule.uid) return true;
          } else if (rule.nick) {
            if (lowerNick === rule.nick) return true;
          } else if (rule.uid) {
            if (lowerUid === rule.uid) return true;
          }
        }
      }

      return false;
    }

    function checkParticipantCriteria(p, targetKeyword, matchMode, isDonorOnly, reqDonorLevel, isSubOnly, reqSubMonths, reqSubTier) {
      if (targetKeyword) {
        const lowerKw = targetKeyword.trim().toLowerCase();
        const msgList = (Array.isArray(p.messages) && p.messages.length > 0) ? p.messages : [p.msg || ''];
        const matchedAny = msgList.some(rawM => {
          const m = String(rawM || '').trim().toLowerCase();
          if (!m) return false;
          if (matchMode === 'exact') {
            return m === lowerKw || m.split(/\s+/).includes(lowerKw);
          }
          return m.includes(lowerKw);
        });
        if (!matchedAny) return false;
      }

      if (isDonorOnly) {
        if (!p.isDonator) return false;
        if (reqDonorLevel > 0 && p.donatorLevel < reqDonorLevel) return false;
      }

      if (isSubOnly) {
        if (!p.isSubscriber) return false;
        if (reqSubMonths > 0 && p.subMonth < reqSubMonths) return false;
        if (reqSubTier > 0 && p.subTier < reqSubTier) return false;
      }

      return true;
    }

    function getEligibleParticipants() {
      const all = Array.from(participants.values());
      
      const targetKeyword = (isKeywordFilterActive && keywordInput) ? keywordInput.value.trim() : '';
      const matchModeRadio = document.querySelector('input[name="keywordMatchMode"]:checked');
      const matchMode = matchModeRadio ? matchModeRadio.value : 'exact';

      const isDonorOnly = isDonorFilterActive;
      const reqDonorLevel = parseInt(donorLevelSelect.value) || 0;

      const isSubOnly = isSubFilterActive;
      const reqSubMonths = parseInt(minSubMonths.value) || 0;
      const reqSubTier = parseInt(subTierSelect.value) || 0;

      return all.filter(p => {
        if (isExcluded(p)) return false;
        return checkParticipantCriteria(p, targetKeyword, matchMode, isDonorOnly, reqDonorLevel, isSubOnly, reqSubMonths, reqSubTier);
      });
    }

    function updateFilteredStats() {
      participantCountEl.innerText = participants.size.toLocaleString();

      const targetKeyword = (isKeywordFilterActive && keywordInput) ? keywordInput.value.trim() : '';
      const matchModeRadio = document.querySelector('input[name="keywordMatchMode"]:checked');
      const matchMode = matchModeRadio ? matchModeRadio.value : 'exact';
      const isDonorOnly = isDonorFilterActive;
      const reqDonorLevel = parseInt(donorLevelSelect.value) || 0;
      const isSubOnly = isSubFilterActive;
      const reqSubMonths = parseInt(minSubMonths.value) || 0;
      const reqSubTier = parseInt(subTierSelect.value) || 0;

      let excludedCount = 0;
      let eligibleCount = 0;
      participants.forEach(p => {
        if (isExcluded(p)) {
          excludedCount++;
        } else if (checkParticipantCriteria(p, targetKeyword, matchMode, isDonorOnly, reqDonorLevel, isSubOnly, reqSubMonths, reqSubTier)) {
          eligibleCount++;
        }
      });

      excludedCountEl.innerText = excludedCount.toLocaleString();
      filteredCountEl.innerText = eligibleCount.toLocaleString();
      drawBtn.disabled = (eligibleCount === 0);
    }

    // ==========================================
    // 💬 Docked Chat Sidebar Logic & Feed
    // ==========================================
    let chatAutoScrollEnabled = true;
    let chatShowDonations = (localStorage.getItem('chzzk_chat_show_donations') !== 'false');
    let dockedChatActiveFilter = 'all'; // 'all' | 'sub' | 'cheese'
    let dockedChatSearchQuery = '';
    let chatRateCount = 0;
    let chatRateInterval = null;
    let popoutWindowRef = null;

    function updateFloatingChatTabUI(isCollapsed = null) {
      const layout = document.getElementById('appMainLayout');
      const floatingBtn = document.getElementById('floatingChatTabBtn');
      const tabIcon = document.getElementById('floatingChatTabIcon');
      const tabText = document.getElementById('floatingChatTabText');
      const badge = document.getElementById('floatingChatBadgeCount');
      if (!floatingBtn) return;

      const workspace = document.getElementById('appWorkspaceArea');
      const inWorkspace = workspace && workspace.style.display !== 'none';
      if (!inWorkspace) {
        floatingBtn.style.display = 'none';
        return;
      }

      if (isCollapsed === null) {
        isCollapsed = layout ? layout.classList.contains('sidebar-collapsed') : false;
      }

      floatingBtn.style.display = 'flex';
      if (isCollapsed) {
        floatingBtn.classList.remove('is-open');
        floatingBtn.title = '실시간 채팅창 펼치기';
        if (tabIcon) tabIcon.innerText = '💬';
        if (tabText) tabText.innerText = '채팅창';
        if (badge) badge.style.display = 'inline-block';
      } else {
        floatingBtn.classList.add('is-open');
        floatingBtn.title = '실시간 채팅창 닫기';
        if (tabIcon) tabIcon.innerText = '✕';
        if (tabText) tabText.innerText = '닫기';
        if (badge) badge.style.display = 'none';
      }

      const openDrawerBtn = document.getElementById('openChatDrawerBtn');
      if (openDrawerBtn) {
        if (isCollapsed) {
          openDrawerBtn.classList.remove('active');
        } else {
          openDrawerBtn.classList.add('active');
        }
      }
    }

    function initDockedChatSidebar() {
      // Restore user sidebar preference
      const savedCollapsed = localStorage.getItem('chat_sidebar_collapsed');
      const layout = document.getElementById('appMainLayout');
      const workspace = document.getElementById('appWorkspaceArea');
      const stateText = document.getElementById('quickChatSidebarStateText');

      const isCollapsed = (savedCollapsed === 'true');
      if (layout) {
        if (isCollapsed) layout.classList.add('sidebar-collapsed');
        else layout.classList.remove('sidebar-collapsed');
      }
      if (workspace) {
        if (isCollapsed) workspace.classList.remove('has-docked-sidebar');
        else workspace.classList.add('has-docked-sidebar');
      }
      if (stateText) stateText.innerText = isCollapsed ? '펼치기' : '접기';
      updateFloatingChatTabUI(isCollapsed);

      // Restore chat donation display toggle preference
      const donationToggle = document.getElementById('chatShowDonationsToggle');
      if (donationToggle) {
        donationToggle.checked = chatShowDonations;
      }

      // Track scroll on feed to show/hide floating new message button
      const feed = document.getElementById('dockedChatFeed');
      if (feed) {
        feed.addEventListener('scroll', () => {
          const isAtBottom = (feed.scrollHeight - feed.scrollTop - feed.clientHeight) < 40;
          const floatBtn = document.getElementById('chatNewMsgFloatingBtn');
          if (isAtBottom && floatBtn) {
            floatBtn.style.display = 'none';
          }
        });
      }

      // Calculate chats per second
      if (chatRateInterval) clearInterval(chatRateInterval);
      chatRateInterval = setInterval(() => {
        const speedEl = document.getElementById('dockedChatViewerSpeed');
        if (speedEl) {
          speedEl.innerText = `초당 ${chatRateCount}건`;
        }
        chatRateCount = 0;
      }, 1000);
    }

    function toggleDockedChatSidebar(forceState = null) {
      const layout = document.getElementById('appMainLayout');
      if (!layout) return;

      if (forceState !== null) {
        if (forceState) layout.classList.remove('sidebar-collapsed');
        else layout.classList.add('sidebar-collapsed');
      } else {
        layout.classList.toggle('sidebar-collapsed');
      }

      const isCollapsed = layout.classList.contains('sidebar-collapsed');
      const workspace = document.getElementById('appWorkspaceArea');
      if (workspace) {
        if (isCollapsed) workspace.classList.remove('has-docked-sidebar');
        else workspace.classList.add('has-docked-sidebar');
      }
      const stateText = document.getElementById('quickChatSidebarStateText');

      updateFloatingChatTabUI(isCollapsed);

      if (stateText) stateText.innerText = isCollapsed ? '펼치기' : '접기';
      localStorage.setItem('chat_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    }

    function toggleChatAutoScroll(enabled) {
      chatAutoScrollEnabled = !!enabled;
      if (chatAutoScrollEnabled) {
        scrollChatToBottom();
      }
    }

    function scrollChatToBottom() {
      const feed = document.getElementById('dockedChatFeed');
      if (feed) {
        feed.scrollTop = feed.scrollHeight;
      }
      const floatBtn = document.getElementById('chatNewMsgFloatingBtn');
      if (floatBtn) floatBtn.style.display = 'none';
    }

    function clearDockedChatFeed() {
      const feed = document.getElementById('dockedChatFeed');
      if (!feed) return;
      feed.innerHTML = `
        <div id="dockedChatEmptyGuide" class="docked-chat-empty-guide">
          <div style="font-size: 32px; margin-bottom: 8px;">🧹</div>
          <div style="font-weight: 800; font-size: 13px; color: #fff; margin-bottom: 4px;">채팅 피드가 초기화되었습니다</div>
          <div style="font-size: 11.5px; color: var(--text-sub);">새로운 채팅이 올라오면 실시간으로 추가됩니다.</div>
        </div>
      `;
      const floatBtn = document.getElementById('chatNewMsgFloatingBtn');
      if (floatBtn) floatBtn.style.display = 'none';
    }

    function toggleChatShowDonations(enabled) {
      chatShowDonations = !!enabled;
      localStorage.setItem('chzzk_chat_show_donations', chatShowDonations ? 'true' : 'false');
      applyDockedChatFilters();
    }
    window.toggleChatShowDonations = toggleChatShowDonations;

    function setChatSidebarFilter(type) {
      dockedChatActiveFilter = type;
      ['all', 'sub', 'cheese'].forEach(t => {
        const btn = document.getElementById(`chatFilter${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (btn) btn.classList.toggle('active', t === type);
      });
      applyDockedChatFilters();
    }

    function filterDockedChatItems(query) {
      dockedChatSearchQuery = (query || '').trim().toLowerCase();
      applyDockedChatFilters();
    }

    function clearChatSidebarSearch() {
      const input = document.getElementById('chatSidebarSearchInput');
      if (input) input.value = '';
      dockedChatSearchQuery = '';
      applyDockedChatFilters();
    }

    function applyDockedChatFilters() {
      const feed = document.getElementById('dockedChatFeed');
      if (!feed) return;
      const items = feed.querySelectorAll('.docked-chat-item');
      items.forEach(el => {
        const isSub = el.dataset.sub === 'true';
        const isDonor = el.dataset.donor === 'true';
        const nick = (el.dataset.nick || '').toLowerCase();
        const msg = (el.dataset.msg || '').toLowerCase();

        let matchFilter = true;
        // If donation messages are toggled off, hide donation items unless explicitly viewing cheese tab
        if (!chatShowDonations && isDonor && dockedChatActiveFilter !== 'cheese') {
          matchFilter = false;
        }
        if (dockedChatActiveFilter === 'sub' && !isSub) matchFilter = false;
        if (dockedChatActiveFilter === 'cheese' && !isDonor) matchFilter = false;

        let matchQuery = true;
        if (dockedChatSearchQuery && !nick.includes(dockedChatSearchQuery) && !msg.includes(dockedChatSearchQuery)) {
          matchQuery = false;
        }

        el.style.display = (matchFilter && matchQuery) ? 'flex' : 'none';
      });
    }

    function popoutChatWindow() {
      if (popoutWindowRef && !popoutWindowRef.closed) {
        popoutWindowRef.focus();
        return;
      }
      const title = `${currentChannelName || '치지직'} 실시간 채팅`;
      popoutWindowRef = window.open('', 'ChzzkChatPopout', 'width=420,height=750,menubar=no,toolbar=no,location=no,status=no');
      if (!popoutWindowRef) {
        showAppAlert('팝업 차단이 감지되었습니다. 브라우저 주소창에서 팝업을 허용해주세요.', '팝업 차단 안내');
        return;
      }
      popoutWindowRef.document.write(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(title)}</title>
          <style>
            body { margin: 0; padding: 12px; background: #080c14; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; }
            .header { padding: 10px 14px; background: #121826; border-radius: 8px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border: 1px solid #232a3b; }
            #feed { display: flex; flex-direction: column; gap: 6px; }
            .item { padding: 8px 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; line-height: 1.4; word-break: break-all; }
            .nick { font-weight: 800; color: #00ffa3; margin-right: 6px; cursor: pointer; border-radius: 3px; padding: 1px 3px; transition: all 0.15s ease; }
            .nick:hover { text-decoration: underline; background: rgba(0, 255, 163, 0.18); }
            .badge { display: inline-block; padding: 1px 5px; font-size: 10px; font-weight: 800; border-radius: 4px; margin-right: 4px; background: rgba(255,215,0,0.2); color: #ffd700; }
            .badge-sub { background: rgba(168,85,247,0.2); color: #c084fc; }
            .time { font-size: 10px; color: #64748b; float: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <span>💬 ${escapeHtml(title)}</span>
            <span style="color:#00ffa3; font-size:11px;">🔴 LIVE</span>
          </div>
          <div id="feed"></div>
        </body>
        </html>
      `);
      popoutWindowRef.document.close();
    }

    function escapeJsArg(text) {
      if (text === null || text === undefined) return '';
      return escapeHtml(String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\r/g, '').replace(/\n/g, ' '));
    }

    let pendingChatItems = [];
    let chatFeedRafId = null;

    function addChatToFeed(nickname, msg, time, isSub, isDonor, payAmount = 0, uid = '', isDonation = false) {
      chatRateCount++;
      if (!uid && nickname && nickToUidIndex.has(nickname)) {
        uid = nickToUidIndex.get(nickname);
      }

      pendingChatItems.push({ nickname, msg, time, isSub, isDonor, payAmount, uid, isDonation });
      if (pendingChatItems.length > 400) {
        pendingChatItems.splice(0, pendingChatItems.length - 200);
      }
      if (!chatFeedRafId) {
        chatFeedRafId = requestAnimationFrame(flushChatFeedBatch);
      }
    }

    function flushChatFeedBatch() {
      chatFeedRafId = null;
      if (pendingChatItems.length === 0) return;

      const batch = pendingChatItems.splice(0, pendingChatItems.length);
      const isDrawerOpen = !!(chatDrawer && chatDrawer.classList.contains('active'));
      const dockedFeed = document.getElementById('dockedChatFeed');

      const drawerFrag = (chatFeed && isDrawerOpen) ? document.createDocumentFragment() : null;
      const dockedFrag = dockedFeed ? document.createDocumentFragment() : null;
      const popoutFrag = (popoutWindowRef && !popoutWindowRef.closed) ? popoutWindowRef.document.createDocumentFragment() : null;

      if (dockedFeed) {
        const emptyGuide = document.getElementById('dockedChatEmptyGuide');
        if (emptyGuide) emptyGuide.style.display = 'none';
      }

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const nickname = item.nickname || '';
        const msg = item.msg || '';
        const time = item.time || '';
        const isSub = !!item.isSub;
        const payAmount = item.payAmount || 0;
        const uid = item.uid || '';
        const isCheeseDonation = item.isDonor || payAmount > 0 || item.isDonation;

        const renderedMsgHtml = (msg && String(msg).trim().length > 0)
          ? escapeHtml(msg)
          : (isCheeseDonation ? '<span style="color: #94a3b8; font-style: italic;">(메시지 없는 후원)</span>' : '');

        if (drawerFrag && (chatShowDonations || !isCheeseDonation)) {
          const div = document.createElement('div');
          div.className = 'chat-item';
          let badgesHtml = '';
          if (isSub) badgesHtml += `<span class="badge-tag badge-sub">⭐ 구독</span>`;
          if (isCheeseDonation) badgesHtml += `<span class="badge-tag badge-follow">🧀 ${payAmount ? payAmount.toLocaleString() + '치즈' : '후원'}</span>`;
          div.innerHTML = `
            ${badgesHtml}
            <span class="chat-nick" onclick="openUserChatByNickOrUid('${escapeJsArg(uid)}', '${escapeJsArg(nickname)}')" title="${escapeHtml(nickname)} 시청자 채팅 추적 및 상세 정보 열기">${escapeHtml(nickname)}</span>
            <span class="chat-msg">${renderedMsgHtml}</span>
            <span class="chat-time">${escapeHtml(time)}</span>
          `;
          drawerFrag.appendChild(div);
        }

        if (dockedFrag) {
          const itemEl = document.createElement('div');
          itemEl.className = 'docked-chat-item' + (isCheeseDonation ? ' is-donation' : '');
          itemEl.dataset.sub = isSub ? 'true' : 'false';
          itemEl.dataset.donor = isCheeseDonation ? 'true' : 'false';
          itemEl.dataset.nick = nickname;
          itemEl.dataset.uid = uid;
          itemEl.dataset.msg = msg;

          let badgesHtml = '';
          if (isSub) {
            badgesHtml += `<span class="badge-tag badge-sub" style="font-size: 9.5px; padding: 1px 5px;">⭐ 구독</span>`;
          }
          if (isCheeseDonation) {
            badgesHtml += `<span class="badge-tag badge-follow" style="font-size: 9.5px; padding: 1px 5px; background: rgba(255, 215, 0, 0.25); color: #ffd700; border: 1px solid rgba(255,215,0,0.4);">🧀 ${payAmount ? payAmount.toLocaleString() + '치즈' : '후원'}</span>`;
          }

          const nickClass = isCheeseDonation ? 'docked-chat-nick donor' : (isSub ? 'docked-chat-nick sub' : 'docked-chat-nick');
          itemEl.innerHTML = `
            <div class="docked-chat-header-row">
              ${badgesHtml}
              <span class="${nickClass}" onclick="openUserChatByNickOrUid('${escapeJsArg(uid)}', '${escapeJsArg(nickname)}')" title="${escapeHtml(nickname)} 시청자 채팅 추적 및 상세 정보 열기">${escapeHtml(nickname)}</span>
              <span class="docked-chat-time">${escapeHtml(time)}</span>
            </div>
            <div class="docked-chat-msg">${renderedMsgHtml}</div>
          `;

          let visible = true;
          if (!chatShowDonations && isCheeseDonation && dockedChatActiveFilter !== 'cheese') visible = false;
          if (dockedChatActiveFilter === 'sub' && !isSub) visible = false;
          if (dockedChatActiveFilter === 'cheese' && !isCheeseDonation) visible = false;
          if (dockedChatSearchQuery) {
            const lowerNick = nickname.toLowerCase();
            const lowerMsg = String(msg).toLowerCase();
            if (!lowerNick.includes(dockedChatSearchQuery) && !lowerMsg.includes(dockedChatSearchQuery)) {
              visible = false;
            }
          }
          itemEl.style.display = visible ? 'flex' : 'none';
          dockedFrag.appendChild(itemEl);
        }

        if (popoutFrag && (chatShowDonations || !isCheeseDonation)) {
          try {
            const pDiv = popoutWindowRef.document.createElement('div');
            pDiv.className = 'item';
            let pBadge = '';
            if (isSub) pBadge += '<span class="badge badge-sub">⭐구독</span>';
            if (isCheeseDonation) pBadge += `<span class="badge">🧀${payAmount ? payAmount.toLocaleString() + '치즈' : '후원'}</span>`;
            pDiv.innerHTML = `
              <span class="time">${escapeHtml(time)}</span>
              ${pBadge}
              <span class="nick" onclick="window.opener && window.opener.openUserChatByNickOrUid('${escapeJsArg(uid)}', '${escapeJsArg(nickname)}'); try{window.opener.focus();}catch(e){}" style="cursor: pointer;" title="${escapeHtml(nickname)} 시청자 채팅 추적 및 상세 정보 열기">${escapeHtml(nickname)}</span>
              <span>${renderedMsgHtml}</span>
            `;
            popoutFrag.appendChild(pDiv);
          } catch (e) {}
        }
      }

      if (drawerFrag && chatFeed) {
        chatFeed.appendChild(drawerFrag);
        while (chatFeed.children.length > 60) {
          chatFeed.removeChild(chatFeed.firstChild);
        }
        chatFeed.scrollTop = chatFeed.scrollHeight;
      }

      if (dockedFrag && dockedFeed) {
        const isNearBottom = (dockedFeed.scrollHeight - dockedFeed.scrollTop - dockedFeed.clientHeight) < 60;
        dockedFeed.appendChild(dockedFrag);

        const guideEl = document.getElementById('dockedChatEmptyGuide');
        const guideOffset = (guideEl && guideEl.parentNode === dockedFeed) ? 1 : 0;
        let excess = (dockedFeed.childElementCount - guideOffset) - 150;
        let cursor = dockedFeed.firstElementChild;
        while (excess > 0 && cursor) {
          const next = cursor.nextElementSibling;
          if (cursor.classList && cursor.classList.contains('docked-chat-item')) {
            cursor.remove();
            excess--;
          }
          cursor = next;
        }

        if (chatAutoScrollEnabled || isNearBottom) {
          dockedFeed.scrollTop = dockedFeed.scrollHeight;
        } else {
          const floatBtn = document.getElementById('chatNewMsgFloatingBtn');
          if (floatBtn) floatBtn.style.display = 'block';
        }

        const countBadge = document.getElementById('dockedChatCountBadge');
        if (countBadge) countBadge.innerText = chatLogCount.toLocaleString();
        const floatingBadge = document.getElementById('floatingChatBadgeCount');
        if (floatingBadge) floatingBadge.innerText = chatLogCount.toLocaleString();
      }

      if (popoutFrag && popoutWindowRef && !popoutWindowRef.closed) {
        try {
          const pFeed = popoutWindowRef.document.getElementById('feed');
          if (pFeed) {
            pFeed.appendChild(popoutFrag);
            while (pFeed.children.length > 80) pFeed.removeChild(pFeed.firstChild);
            popoutWindowRef.window.scrollTo(0, popoutWindowRef.document.body.scrollHeight);
          }
        } catch (e) {}
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && pendingChatItems.length > 0) {
        flushChatFeedBatch();
      }
    });

    function escapeHtml(text) {
      if (text === null || text === undefined) return '';
      return String(text).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }

    // Raffle Execution
    drawBtn.addEventListener('click', () => {
      const eligibleList = getEligibleParticipants();
      const totalEligible = eligibleList.length;

      if (totalEligible === 0) {
        if (typeof showToast === 'function') showToast('설정한 필터 조건에 부합하거나 제외되지 않은 유효 참여자가 없습니다.', '⚠️');
        else showAppAlert('설정한 필터 조건에 부합하거나 제외되지 않은 유효 참여자가 없습니다.');
        return;
      }

      const countNeeded = parseInt(document.getElementById('winnerCount').value) || 1;
      const actualWinnerCount = Math.min(countNeeded, totalEligible);

      drawBtn.disabled = true;
      winnerOverlay.classList.add('drawing');
      rollText.innerHTML = `<img src="delibird.png" alt="Delibird" class="delibird-icon" style="height: 38px;"> 필터 조건에 맞춰 추첨 진행 중...`;
      subRollText.innerText = `유효 응모자 ${totalEligible.toLocaleString()}명 중 ${actualWinnerCount.toLocaleString()}명을 공정하게 추첨합니다.`;

      let rollCounter = 0;

      const rollTimer = setInterval(() => {
        rollCounter++;
        const sampleNick = eligibleList[secureRandomInt(eligibleList.length)].nickname;
        rollText.innerHTML = `<img src="delibird.png" alt="Delibird" class="delibird-icon" style="height: 38px;"> 추첨 중... [${escapeHtml(sampleNick)}]`;

        if (rollCounter > 20) {
          clearInterval(rollTimer);
          currentDrawRound++;

          for (let i = eligibleList.length - 1; i > 0; i--) {
            const j = secureRandomInt(i + 1);
            [eligibleList[i], eligibleList[j]] = [eligibleList[j], eligibleList[i]];
          }

          const currentWinners = eligibleList.slice(0, actualWinnerCount).map(w => ({
            ...w,
            round: currentDrawRound
          }));

          currentWinners.forEach(w => cumulativeDrawnUIDs.add(w.uid.toLowerCase()));

          drawnWinners = drawnWinners.concat(currentWinners);
          renderWinnersTable(drawnWinners);
          updateFilteredStats();

          winnerOverlay.classList.remove('drawing');
          rollText.innerHTML = `<img src="delibird.png" alt="Delibird" class="delibird-icon" style="height: 38px;"> 🎉 제 ${currentDrawRound}회차 ${actualWinnerCount.toLocaleString()}명 당첨 완료!`;
          subRollText.innerText = `다음 회차 추첨 시 이전 당첨자는 고유 ID 기반으로 자동 제외됩니다.`;
          exportBtn.disabled = false;
          const copyBtn = document.getElementById('copyWinnersBtn');
          if (copyBtn) copyBtn.disabled = false;
          drawBtn.disabled = false;
          scheduleSessionBackup();
        }
      }, 80);
    });

    function renderWinnersTable(winners) {
      drawnWinnerCountEl.innerText = winners.length.toLocaleString();
      winnersTableBody.innerHTML = '';

      if (winners.length === 0) {
        winnersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-sub); padding: 40px 0;">당첨자가 없습니다.</td></tr>`;
        return;
      }

      let lastRound = null;
      winners.forEach((w, index) => {
        const roundNum = w.round || 1;

        if (roundNum !== lastRound) {
          lastRound = roundNum;
          const headerTr = document.createElement('tr');
          headerTr.innerHTML = `
            <td colspan="4" style="background: linear-gradient(90deg, rgba(0, 255, 163, 0.15), rgba(168, 85, 247, 0.15)); color: #00ffa3; font-weight: 800; font-size: 13px; padding: 10px 16px; border-top: 1px solid rgba(0,255,163,0.3); border-bottom: 1px solid rgba(0,255,163,0.3); letter-spacing: 0.5px;">
              🏆 제 ${roundNum} 회차 당첨자
            </td>
          `;
          winnersTableBody.appendChild(headerTr);
        }

        let badgesHtml = `<span class="badge-tag" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); font-weight: 700;">🎉 ${roundNum}회차</span>`;
        if (w.isSubscriber) {
          badgesHtml += `<span class="badge-tag badge-sub">⭐ 구독 (${w.subMonth}개월)</span>`;
          if (w.subTier > 0) badgesHtml += `<span class="badge-tag badge-tier">${w.subTier}티어</span>`;
        }
        if (w.isDonator) {
          let lvlText = '';
          if (w.donatorLevel === 5) lvlText = ' (1억 치즈+)';
          else if (w.donatorLevel === 4) lvlText = ' (1,000만 치즈+)';
          else if (w.donatorLevel === 3) lvlText = ' (100만 치즈+)';
          else if (w.donatorLevel === 2) lvlText = ' (10만 치즈+)';
          else if (w.donatorLevel === 1) lvlText = ' (후원자)';
          badgesHtml += `<span class="badge-tag badge-follow">🧀 후원자${lvlText}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="rank-num">${index + 1}</span></td>
          <td>
            <button type="button" class="user-chat-link-btn" onclick="openUserChatModal('${escapeJsArg(w.uid)}', '${escapeJsArg(w.nickname)}')" title="클릭하여 실시간 채팅 내역 및 추가 채팅 추적 열기">
              💬 <span>${escapeHtml(w.nickname)}</span>
            </button>
          </td>
          <td style="font-size: 12px; font-family: monospace; color: var(--chzzk-green);">${escapeHtml(w.uid)}</td>
          <td>${badgesHtml}</td>
        `;
        winnersTableBody.appendChild(tr);
      });
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const q = (e.target.value || '').toLowerCase();
      const filtered = drawnWinners.filter(w =>
        (w.nickname || '').toLowerCase().includes(q)
        || (w.msg || '').toLowerCase().includes(q)
        || (w.uid || '').toLowerCase().includes(q)
      );
      renderWinnersTable(filtered);
    });

    function copyRaffleWinnersToClipboard() {
      if (!drawnWinners || drawnWinners.length === 0) {
        if (typeof showToast === 'function') showToast('복사할 당첨자가 없습니다.', '⚠️');
        return;
      }
      const byRound = new Map();
      drawnWinners.forEach(w => {
        const r = w.round || 1;
        if (!byRound.has(r)) byRound.set(r, []);
        byRound.get(r).push(w.nickname);
      });
      const lines = [];
      for (const [r, nicks] of byRound.entries()) {
        lines.push(`[${r}회차 당첨자 (${nicks.length}명)] ${nicks.join(', ')}`);
      }
      const text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (typeof showToast === 'function') showToast(`📋 당첨자 ${drawnWinners.length}명 명단이 클립보드에 복사되었습니다!`, '✅');
        }).catch(() => {
          showAppAlert(text, '당첨자 명단 복사');
        });
      } else {
        showAppAlert(text, '당첨자 명단 복사');
      }
    }

    // CSV Download
    const exportConfigBtn = document.getElementById('exportConfigBtn');
    const csvConfigBox = document.getElementById('csvConfigBox');
    const selectAllColsBtn = document.getElementById('selectAllColsBtn');
    const deselectAllColsBtn = document.getElementById('deselectAllColsBtn');

    exportConfigBtn.addEventListener('click', () => {
      csvConfigBox.style.display = csvConfigBox.style.display === 'none' ? 'block' : 'none';
    });

    selectAllColsBtn.addEventListener('click', () => {
      document.querySelectorAll('.csv-col-check').forEach(cb => cb.checked = true);
    });

    deselectAllColsBtn.addEventListener('click', () => {
      document.querySelectorAll('.csv-col-check').forEach(cb => cb.checked = false);
    });

    const COLUMN_MAP = {
      rank: { label: "순위", getVal: (w, idx) => idx + 1 },
      round: { label: "추첨회차", getVal: (w) => `${w.round || 1}회차` },
      nickname: { label: "닉네임", getVal: (w) => sanitizeCsvCell(w.nickname) },
      isSub: { label: "구독여부", getVal: (w) => w.isSubscriber ? "구독자" : "미구독" },
      subMonth: { label: "구독개월", getVal: (w) => w.subMonth },
      subTier: { label: "구독티어", getVal: (w) => `${w.subTier}티어` },
      isDonor: { label: "후원여부", getVal: (w) => w.isDonator ? "후원자" : "미후원" },
      donorLevel: {
        label: "후원등급",
        getVal: (w) => {
          if (!w.isDonator) return "일반";
          if (w.donatorLevel === 5) return "1억 치즈 이상";
          if (w.donatorLevel === 4) return "1000만 치즈 이상";
          if (w.donatorLevel === 3) return "100만 치즈 이상";
          if (w.donatorLevel === 2) return "10만 치즈 이상";
          return "일반 후원자";
        }
      },
      msg: { label: "채팅내용", getVal: (w) => sanitizeCsvCell(w.msg || '') },
      time: { label: "참여시간", getVal: (w) => sanitizeCsvCell(w.time || '') },
      uid: { label: "고유식별자(UID)", getVal: (w) => sanitizeCsvCell(w.uid || '') }
    };

    exportBtn.addEventListener('click', () => {
      if (drawnWinners.length === 0) return;

      const activeChecks = Array.from(document.querySelectorAll('.csv-col-check:checked')).map(cb => cb.value);
      if (activeChecks.length === 0) {
        if (typeof showToast === 'function') showToast('엑셀에 저장할 항목을 최소 1개 이상 선택해 주세요.', '⚠️');
        else showAppAlert('엑셀에 저장할 항목을 최소 1개 이상 선택해 주세요.');
        return;
      }

      const headers = activeChecks.map(key => COLUMN_MAP[key].label).join(',');
      let csvContent = "\uFEFF" + headers + "\n";

      drawnWinners.forEach((w, idx) => {
        const rowValues = activeChecks.map(key => COLUMN_MAP[key].getVal(w, idx));
        csvContent += rowValues.join(',') + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0,19).replace(/[^0-9]/g, "");
      a.href = url;
      a.download = `chzzk_multi_round_winners_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    document.getElementById('resetBtn').addEventListener('click', async () => {
      const ok = await showAppConfirm('수집된 참여자 및 누적 당첨자 명단을 초기화하시겠습니까?', {
        title: '명단 초기화',
        confirmText: '초기화',
        danger: true
      });
      if (ok) {
        participants.clear();
        nickToUidIndex.clear();
        cumulativeDrawnUIDs.clear();
        fileExcludedTokens.clear();
        manualExcludePairs = [];
        drawnWinners = [];
        currentDrawRound = 0;
        chatLogCount = 0;
        if (chatBadgeCount) chatBadgeCount.innerText = '0';
        drawerChatCount.innerText = '0';
        participantCountEl.innerText = '0';
        filteredCountEl.innerText = '0';
        excludedCountEl.innerText = '0';
        userChatHistory.clear();
        activeTrackingUserUID = null;
        drawnWinnerCountEl.innerText = '0';
        chatFeed.innerHTML = '<div style="color: #64748b; text-align: center; margin-top: 80px; font-size: 12px;">초기화되었습니다.</div>';
        rollText.innerHTML = `<img src="delibird.png" alt="Delibird" style="height: 38px; vertical-align: middle;"> 대기 중`;
        subRollText.innerText = "참여자를 모은 뒤 '추첨하기' 버튼을 눌러주세요.";
        winnersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-sub); padding: 40px 0;">아직 추첨 결과가 없습니다.</td></tr>';
        exportBtn.disabled = true;
        const copyBtn = document.getElementById('copyWinnersBtn');
        if (copyBtn) copyBtn.disabled = true;
        drawBtn.disabled = true;
        scheduleSessionBackup();
      }
    });

    // ==========================================
    // 💬 WINNER & VIEWER REAL-TIME CHAT TRACKER
    // ==========================================
    function openUserChatByNickOrUid(uid, fallbackNick) {
      openUserChatModal(uid, fallbackNick);
    }

    function openUserChatModal(uid, fallbackNick) {
      let targetUid = uid;
      let p = null;

      // 1. Try finding in participants map or drawnWinners
      if (targetUid && participants.has(targetUid)) {
        p = participants.get(targetUid);
      } else if (targetUid) {
        p = drawnWinners.find(w => w.uid === targetUid);
      }

      // 2. If not found, search by nickname
      if (!p && fallbackNick) {
        for (const [pUid, part] of participants.entries()) {
          if (part.nickname === fallbackNick) {
            p = part;
            targetUid = pUid;
            break;
          }
        }
      }

      // 3. Fallback object if not registered yet
      if (!p) {
        p = {
          nickname: fallbackNick || (targetUid ? targetUid.substring(0, 8) : '시청자'),
          uid: targetUid || '-',
          isSubscriber: false,
          isDonator: false
        };
      }

      activeTrackingUserUID = p.uid || targetUid || fallbackNick;

      userChatModalNick.innerText = p.nickname;
      userChatModalUid.innerText = p.uid;

      // Badges
      let badgesHtml = '';
      if (p.isSubscriber) {
        badgesHtml += `<span class="badge-tag badge-sub">⭐ 구독 (${p.subMonth || 1}개월)</span>`;
        if (p.subTier > 0) badgesHtml += `<span class="badge-tag badge-tier">${p.subTier}티어</span>`;
      }
      if (p.isDonator) {
        let lvlText = '';
        if (p.donatorLevel === 5) lvlText = ' (1억 치즈+)';
        else if (p.donatorLevel === 4) lvlText = ' (1,000만 치즈+)';
        else if (p.donatorLevel === 3) lvlText = ' (100만 치즈+)';
        else if (p.donatorLevel === 2) lvlText = ' (10만 치즈+)';
        else if (p.donatorLevel === 1) lvlText = ' (후원자)';
        badgesHtml += `<span class="badge-tag badge-follow">🧀 후원자${lvlText}</span>`;
      }
      if (!p.isSubscriber && !p.isDonator) {
        badgesHtml += `<span class="badge-tag" style="background: rgba(255,255,255,0.06); color: var(--text-sub);">일반 시청자</span>`;
      }
      userChatModalBadges.innerHTML = badgesHtml;

      // Populate existing chat history
      userChatModalFeed.innerHTML = '';
      let history = userChatHistory.get(activeTrackingUserUID) || [];
      if (history.length === 0 && p.uid && userChatHistory.has(p.uid)) {
        history = userChatHistory.get(p.uid);
      }
      if (history.length === 0 && p.nickname) {
        for (const [hUid, msgs] of userChatHistory.entries()) {
          if (msgs.some(m => m.nickname === p.nickname)) {
            history = msgs;
            activeTrackingUserUID = hUid;
            p.uid = hUid;
            userChatModalUid.innerText = hUid;
            break;
          }
        }
      }

      // If history is empty but participant had an initial msg, populate it
      if (history.length === 0 && p.msg) {
        history.push({
          nickname: p.nickname,
          msg: p.msg,
          time: p.time || new Date().toLocaleTimeString('ko-KR'),
          isSubscriber: p.isSubscriber,
          isDonator: p.isDonator
        });
        userChatHistory.set(activeTrackingUserUID, history);
      }

      userChatModalMsgCount.innerText = history.length.toLocaleString();

      if (history.length === 0) {
        userChatModalFeed.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 80px 0; font-size: 16px; font-weight: 600;">아직 수집된 채팅 내역이 없습니다.<br><span style="font-size: 14px; color: #64748b; margin-top: 8px; display: inline-block;">해당 시청자가 방송에서 채팅을 입력하면 실시간으로 여기에 자동 추가됩니다.</span></div>';
      } else {
        history.forEach(item => {
          appendUserChatMessage(item, false);
        });
      }

      // Reset TTS detail panel to collapsed by default
      ttsDetailConfigPanel.style.display = 'none';
      ttsConfigCollapseBtn.innerText = '⚙️ 음성 세부 설정 펼치기 ▼';

      userChatModal.classList.add('active');
    }

    function appendUserChatMessage(item, isLive = false) {
      // If placeholder exists, remove it
      const placeholder = userChatModalFeed.querySelector('div[style*="text-align: center"]');
      if (placeholder) {
        userChatModalFeed.innerHTML = '';
      }

      const row = document.createElement('div');
      row.className = `user-chat-msg-row ${isLive ? 'new-live' : ''}`;
      row.innerHTML = `
        <div class="user-chat-msg-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: var(--chzzk-green); font-size: 16px;">${escapeHtml(item.nickname)}</span>
            ${isLive ? '<span class="badge-tag" style="background: rgba(0,255,163,0.2); color: var(--chzzk-green); font-size: 11px; padding: 2px 6px; border: 1px solid rgba(0,255,163,0.4); font-weight: 800;">🔴 LIVE NEW</span>' : ''}
          </div>
          <span class="user-chat-msg-time">${item.time}</span>
        </div>
        <div class="user-chat-msg-content">${escapeHtml(item.msg || '(메시지 없음)')}</div>
      `;
      userChatModalFeed.appendChild(row);

      const curCount = userChatHistory.get(activeTrackingUserUID)?.length || userChatModalFeed.children.length;
      userChatModalMsgCount.innerText = curCount.toLocaleString();

      userChatModalFeed.scrollTop = userChatModalFeed.scrollHeight;

      // 🔊 Real-time TTS Readout for Live Incoming Messages
      if (isLive && ttsEnabledToggle.checked) {
        const textToRead = ttsIncludeNickToggle.checked
          ? `${item.nickname} 님, ${item.msg}`
          : item.msg;
        speakTTS(textToRead);
      }
    }

    function closeUserChatModal() {
      userChatModal.classList.remove('active');
      activeTrackingUserUID = null;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    closeUserChatModalBtn.addEventListener('click', closeUserChatModal);
    closeUserChatModalBottomBtn.addEventListener('click', closeUserChatModal);
    userChatModal.addEventListener('click', (e) => {
      if (e.target === userChatModal) closeUserChatModal();
    });

    copyUserUidBtn.addEventListener('click', () => {
      if (!activeTrackingUserUID) return;
      navigator.clipboard.writeText(activeTrackingUserUID).then(() => {
        const originalText = copyUserUidBtn.innerText;
        copyUserUidBtn.innerText = '✓ 복사됨!';
        copyUserUidBtn.style.color = 'var(--chzzk-green)';
        setTimeout(() => {
          copyUserUidBtn.innerText = originalText;
          copyUserUidBtn.style.color = '';
        }, 1500);
      });
    });

    // ==========================================
    // 🔊 REAL-TIME TTS (TEXT-TO-SPEECH) ENGINE
    // ==========================================
    let availableVoices = [];

    function populateTTSVoices() {
      if (!window.speechSynthesis) return;
      availableVoices = window.speechSynthesis.getVoices();
      if (!ttsVoiceSelect) return;

      const savedVoiceURI = localStorage.getItem('chzzk_tts_voice_uri') || '';

      ttsVoiceSelect.innerHTML = '';

      if (availableVoices.length === 0) {
        ttsVoiceSelect.innerHTML = '<option value="">시스템 음성을 지원하지 않거나 로딩 중입니다.</option>';
        return;
      }

      // Group voices: Korean vs Others
      const koreanVoices = availableVoices.filter(v => 
        (v.lang && v.lang.toLowerCase().startsWith('ko')) ||
        v.name.includes('Korean') ||
        v.name.includes('한국어') ||
        v.name.includes('Heami') ||
        v.name.includes('SunHi') ||
        v.name.includes('InJoon')
      );
      const otherVoices = availableVoices.filter(v => !koreanVoices.includes(v));

      if (koreanVoices.length > 0) {
        const koGroup = document.createElement('optgroup');
        koGroup.label = '🇰🇷 한국어 추천 음성';
        koreanVoices.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.voiceURI || v.name;
          opt.innerText = `${v.name} (${v.lang})`;
          if (savedVoiceURI ? (v.voiceURI === savedVoiceURI || v.name === savedVoiceURI) : false) {
            opt.selected = true;
          }
          koGroup.appendChild(opt);
        });
        ttsVoiceSelect.appendChild(koGroup);
      }

      if (otherVoices.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = '🌐 기타 언어 음성';
        otherVoices.slice(0, 40).forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.voiceURI || v.name;
          opt.innerText = `${v.name} (${v.lang})`;
          if (savedVoiceURI && (v.voiceURI === savedVoiceURI || v.name === savedVoiceURI)) {
            opt.selected = true;
          }
          otherGroup.appendChild(opt);
        });
        ttsVoiceSelect.appendChild(otherGroup);
      }

      // If nothing was selected and we have korean voices, default to first korean voice
      if (!ttsVoiceSelect.value && koreanVoices.length > 0) {
        ttsVoiceSelect.selectedIndex = 0;
      }
    }

    if (window.speechSynthesis) {
      populateTTSVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateTTSVoices;
      }
    }

    function speakTTS(text, forceTest = false) {
      if (!window.speechSynthesis) return;
      if (window.appGlobalMuted) return;
      if (!forceTest && !ttsEnabledToggle.checked) return;

      try {
        window.speechSynthesis.cancel(); // Cancel previous utterance for snappy response

        const cleanText = text.replace(/https?:\/\/\S+/gi, '링크').trim();
        if (!cleanText) return;

        const utter = new SpeechSynthesisUtterance(cleanText);
        
        // Find selected voice
        const selectedVoiceURI = ttsVoiceSelect.value;
        if (selectedVoiceURI && availableVoices.length > 0) {
          const voice = availableVoices.find(v => (v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI));
          if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
          }
        }

        utter.rate = parseFloat(ttsRateRange.value) || 1.0;
        utter.pitch = parseFloat(ttsPitchRange.value) || 1.0;
        utter.volume = (parseFloat(ttsVolumeRange.value) || 100) / 100;

        window.speechSynthesis.speak(utter);
      } catch (e) {
        console.warn('TTS playback error:', e);
      }
    }

    // TTS UI Event Listeners
    ttsEnabledToggle.addEventListener('change', () => {
      const isOn = ttsEnabledToggle.checked;
      ttsStatusPill.innerText = isOn ? 'ON' : 'OFF';
      ttsStatusPill.style.background = isOn ? 'rgba(0, 255, 163, 0.15)' : 'rgba(255, 255, 255, 0.1)';
      ttsStatusPill.style.color = isOn ? 'var(--chzzk-green)' : 'var(--text-sub)';
      localStorage.setItem('chzzk_tts_enabled', isOn ? '1' : '0');
    });

    ttsConfigCollapseBtn.addEventListener('click', () => {
      const isHidden = ttsDetailConfigPanel.style.display === 'none';
      ttsDetailConfigPanel.style.display = isHidden ? 'block' : 'none';
      ttsConfigCollapseBtn.innerText = isHidden ? '⚙️ 세부 설정 접기 ▲' : '⚙️ 음성 세부 설정 펼치기 ▼';
    });

    ttsVoiceSelect.addEventListener('change', () => {
      localStorage.setItem('chzzk_tts_voice_uri', ttsVoiceSelect.value);
    });

    ttsRateRange.addEventListener('input', (e) => {
      ttsRateVal.innerText = `${parseFloat(e.target.value).toFixed(1)}x`;
      localStorage.setItem('chzzk_tts_rate', e.target.value);
    });

    ttsPitchRange.addEventListener('input', (e) => {
      ttsPitchVal.innerText = `${parseFloat(e.target.value).toFixed(1)}x`;
      localStorage.setItem('chzzk_tts_pitch', e.target.value);
    });

    ttsVolumeRange.addEventListener('input', (e) => {
      ttsVolumeVal.innerText = `${e.target.value}%`;
      localStorage.setItem('chzzk_tts_volume', e.target.value);
    });

    ttsIncludeNickToggle.addEventListener('change', () => {
      localStorage.setItem('chzzk_tts_include_nick', ttsIncludeNickToggle.checked ? '1' : '0');
    });

    testTtsBtn.addEventListener('click', () => {
      speakTTS('안녕하세요! 당첨자 실시간 채팅 음성 테스트입니다.', true);
    });

    // Load saved TTS settings from localStorage
    function loadSavedTTSSettings() {
      const savedEnabled = localStorage.getItem('chzzk_tts_enabled');
      if (savedEnabled !== null) {
        ttsEnabledToggle.checked = savedEnabled === '1';
        ttsEnabledToggle.dispatchEvent(new Event('change'));
      }
      const savedRate = localStorage.getItem('chzzk_tts_rate');
      if (savedRate) {
        ttsRateRange.value = savedRate;
        ttsRateVal.innerText = `${parseFloat(savedRate).toFixed(1)}x`;
      }
      const savedPitch = localStorage.getItem('chzzk_tts_pitch');
      if (savedPitch) {
        ttsPitchRange.value = savedPitch;
        ttsPitchVal.innerText = `${parseFloat(savedPitch).toFixed(1)}x`;
      }
      const savedVolume = localStorage.getItem('chzzk_tts_volume');
      if (savedVolume) {
        ttsVolumeRange.value = savedVolume;
        ttsVolumeVal.innerText = `${savedVolume}%`;
      }
      const savedNick = localStorage.getItem('chzzk_tts_include_nick');
      if (savedNick !== null) {
        ttsIncludeNickToggle.checked = savedNick === '1';
      }
    }
    loadSavedTTSSettings();
