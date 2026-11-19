    // ==========================================
    // 📊 LIVE POLL & CHEESE BATTLE ENGINE
    // ==========================================
    const pollModeChatTabBtn = document.getElementById('pollModeChatTabBtn');
    const pollModeCheeseTabBtn = document.getElementById('pollModeCheeseTabBtn');
    const pollChatConfigBox = document.getElementById('pollChatConfigBox');
    const pollCheeseConfigBox = document.getElementById('pollCheeseConfigBox');

    const pollTitleInput = document.getElementById('pollTitleInput');
    const presetPollOxBtn = document.getElementById('presetPollOxBtn');
    const presetPollYesNoBtn = document.getElementById('presetPollYesNoBtn');
    const presetPoll123Btn = document.getElementById('presetPoll123Btn');

    const pollOptionCount = document.getElementById('pollOptionCount');
    const pollOptionsList = document.getElementById('pollOptionsList');
    const addPollOptionBtn = document.getElementById('addPollOptionBtn');
    const clearAllPollOptionsBtn = document.getElementById('clearAllPollOptionsBtn');

    const pollVoteTypeSelect = document.getElementById('pollVoteTypeSelect');
    const pollDuplicateModeSelect = document.getElementById('pollDuplicateModeSelect');
    const pollAudienceFilterSelect = document.getElementById('pollAudienceFilterSelect');
    const pollMinCheeseSelect = document.getElementById('pollMinCheeseSelect');
    const pollCheeseWeightSelect = document.getElementById('pollCheeseWeightSelect');
    const pollDurationSelect = document.getElementById('pollDurationSelect');

    const startPollBtn = document.getElementById('startPollBtn');
    const pausePollBtn = document.getElementById('pausePollBtn');
    const stopPollBtn = document.getElementById('stopPollBtn');
    const resetPollBtn = document.getElementById('resetPollBtn');
    const convertPollToRouletteBtn = document.getElementById('convertPollToRouletteBtn');
    const exportPollSummaryBtn = document.getElementById('exportPollSummaryBtn');
    const exportPollVotersBtn = document.getElementById('exportPollVotersBtn');

    const pollStatusBadge = document.getElementById('pollStatusBadge');
    const pollTotalVotesCount = document.getElementById('pollTotalVotesCount');
    const pollVoteUnitText = document.getElementById('pollVoteUnitText');
    const pollTimerDisplay = document.getElementById('pollTimerDisplay');
    const pollActiveQuestionText = document.getElementById('pollActiveQuestionText');
    const pollTimerGaugeTrack = document.getElementById('pollTimerGaugeTrack');
    const pollTimerGaugeFill = document.getElementById('pollTimerGaugeFill');
    const pollVisualBarsContainer = document.getElementById('pollVisualBarsContainer');
    const pollFeedCount = document.getElementById('pollFeedCount');
    const pollLiveFeedBox = document.getElementById('pollLiveFeedBox');

    const pollResultModal = document.getElementById('pollResultModal');
    const pollResultWinnerTitle = document.getElementById('pollResultWinnerTitle');
    const pollResultStatsText = document.getElementById('pollResultStatsText');
    const pollResultBreakdownList = document.getElementById('pollResultBreakdownList');
    const convertPollResultModalRouletteBtn = document.getElementById('convertPollResultModalRouletteBtn');
    const exportPollResultModalBtn = document.getElementById('exportPollResultModalBtn');
    const closePollResultModalBtn = document.getElementById('closePollResultModalBtn');

    // Poll State
    let currentPollMode = 'chat'; // 'chat' or 'cheese'
    let isPollRunning = false;
    let isPollPaused = false;
    let pollOptions = [
      { id: 1, text: '선택지 1' },
      { id: 2, text: '선택지 2' }
    ];
    let pollUserVotes = new Map(); // uid -> { optionId, optionText, nickname, time, isSub, isDonor, cheeseAmount }
    let pollOptionVotes = new Map(); // optionId -> total score/votes
    let pollLiveFeedItems = [];
    let pollTimerInterval = null;
    let pollTotalDurationSec = 0;
    let pollRemainingSec = 0;

    function switchPollMode(mode) {
      if (isPollRunning) {
        showToast('투표 진행 중에는 모드를 변경할 수 없습니다.', '⚠️');
        return;
      }
      currentPollMode = mode;
      if (mode === 'chat') {
        pollModeChatTabBtn.classList.add('active');
        pollModeCheeseTabBtn.classList.remove('active');
        pollChatConfigBox.style.display = 'block';
        pollCheeseConfigBox.style.display = 'none';
        pollVoteUnitText.innerText = '표';
      } else {
        pollModeCheeseTabBtn.classList.add('active');
        pollModeChatTabBtn.classList.remove('active');
        pollCheeseConfigBox.style.display = 'block';
        pollChatConfigBox.style.display = 'none';
        pollVoteUnitText.innerText = pollCheeseWeightSelect.value === 'amount' ? '치즈' : '표';
      }
      renderPollVisualBars();
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    pollModeChatTabBtn.addEventListener('click', () => switchPollMode('chat'));
    pollModeCheeseTabBtn.addEventListener('click', () => switchPollMode('cheese'));

    if (pollTitleInput) {
      pollTitleInput.addEventListener('input', () => {
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      });
    }

    if (spinDurationSelect) {
      spinDurationSelect.addEventListener('change', () => {
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      });
    }

    if (pollVoteTypeSelect) {
      pollVoteTypeSelect.addEventListener('change', () => {
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      });
    }

    pollCheeseWeightSelect.addEventListener('change', () => {
      if (currentPollMode === 'cheese') {
        pollVoteUnitText.innerText = pollCheeseWeightSelect.value === 'amount' ? '치즈' : '표';
      }
      renderPollVisualBars();
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    });

    function renderPollOptionsList() {
      pollOptionsList.innerHTML = '';
      pollOptions.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'poll-option-row';
        row.innerHTML = `
          <span class="row-index-badge">${idx + 1}</span>
          <input type="text" class="row-item-input" value="${escapeHtml(opt.text)}" placeholder="선택지 이름 입력 (예: 찬성, 롤)" ${isPollRunning ? 'disabled' : ''}>
          <button type="button" class="row-delete-btn" title="삭제" ${isPollRunning ? 'disabled' : ''}>✕</button>
        `;

        const input = row.querySelector('.row-item-input');
        const delBtn = row.querySelector('.row-delete-btn');

        input.addEventListener('input', (e) => {
          pollOptions[idx].text = e.target.value;
          renderPollVisualBars();
          if (typeof scheduleSessionBackup === 'function') scheduleSessionBackup();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !isPollRunning) {
            e.preventDefault();
            addPollOption('', true);
          }
        });

        delBtn.addEventListener('click', () => {
          if (isPollRunning) return;
          if (pollOptions.length <= 2) {
            showToast('투표 선택지는 최소 2개 이상이어야 합니다.', '⚠️');
            return;
          }
          removePollOption(idx);
        });

        pollOptionsList.appendChild(row);
      });

      pollOptionCount.innerText = `총 ${pollOptions.length}개 항목`;
      renderPollVisualBars();
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    function addPollOption(text = '', focus = false) {
      if (pollOptions.length >= 10) {
        showToast('선택지는 최대 10개까지 추가할 수 있습니다.', '⚠️');
        return;
      }
      const nextId = pollOptions.length > 0 ? Math.max(...pollOptions.map(o => o.id)) + 1 : 1;
      pollOptions.push({ id: nextId, text: text || `선택지 ${pollOptions.length + 1}` });
      renderPollOptionsList();
      if (focus) {
        const inputs = pollOptionsList.querySelectorAll('.row-item-input');
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
          inputs[inputs.length - 1].select();
        }
      }
    }

    function removePollOption(idx) {
      pollOptions.splice(idx, 1);
      renderPollOptionsList();
    }

    addPollOptionBtn.addEventListener('click', () => addPollOption('', true));
    clearAllPollOptionsBtn.addEventListener('click', () => {
      if (isPollRunning) {
        showToast('투표 진행 중에는 삭제할 수 없습니다.', '⚠️');
        return;
      }
      pollOptions = [
        { id: 1, text: '선택지 1' },
        { id: 2, text: '선택지 2' }
      ];
      renderPollOptionsList();
    });

    // Presets
    function applyPollPreset(title, optionTexts) {
      if (isPollRunning) {
        showToast('투표 진행 중에는 프리셋을 적용할 수 없습니다.', '⚠️');
        return;
      }
      pollTitleInput.value = title;
      pollOptions = optionTexts.map((txt, i) => ({ id: i + 1, text: txt }));
      renderPollOptionsList();
      showToast(`'${title}' 프리셋이 적용되었습니다.`, '⚡');
    }

    presetPollOxBtn.addEventListener('click', () => applyPollPreset('O / X 실시간 투표', ['⭕ O (그렇다)', '❌ X (아니다)']));
    presetPollYesNoBtn.addEventListener('click', () => applyPollPreset('찬성 / 반대 실시간 투표', ['👍 찬성 (동의합니다)', '👎 반대 (반대합니다)']));
    presetPoll123Btn.addEventListener('click', () => applyPollPreset('1번 vs 2번 vs 3번 선택', ['1번 선택지', '2번 선택지', '3번 선택지']));

    if (pollTitleInput) {
      pollTitleInput.addEventListener('input', () => {
        if (typeof scheduleSessionBackup === 'function') scheduleSessionBackup();
      });
    }

    // Custom Poll Presets (chzzk_poll_presets_v1)
    const POLL_CUSTOM_PRESETS_KEY = 'chzzk_poll_presets_v1';
    function getStoredPollPresets() {
      try {
        const raw = localStorage.getItem(POLL_CUSTOM_PRESETS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
      } catch (e) {
        return {};
      }
    }
    function renderPollCustomPresets() {
      const sel = document.getElementById('pollCustomPresetSelect');
      if (!sel) return;
      const presets = getStoredPollPresets();
      const prevVal = sel.value;
      sel.innerHTML = '<option value="">📂 내 프리셋...</option>';
      Object.keys(presets).forEach(name => {
        const p = presets[name];
        const count = (p && Array.isArray(p.options)) ? p.options.length : 0;
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = `${name} (${count}개)`;
        sel.appendChild(opt);
      });
      if (prevVal && presets[prevVal]) sel.value = prevVal;
    }
    async function savePollCustomPreset() {
      const titleText = (pollTitleInput?.value || '').trim() || '사용자 지정 투표';
      const validOpts = pollOptions.map(o => String(o.text || '').trim()).filter(Boolean);
      if (validOpts.length < 2) {
        showToast('프리셋으로 저장하려면 최소 2개 이상의 선택지가 필요합니다.', '⚠️');
        return;
      }
      const name = await showAppPrompt('저장할 투표 프리셋 이름을 입력하세요:', {
        title: '투표 프리셋 저장',
        defaultValue: titleText.slice(0, 24),
        placeholder: '예: 오늘 2부 게임 투표',
        confirmText: '저장'
      });
      if (!name) return;
      const presets = getStoredPollPresets();
      presets[name] = { title: titleText, options: validOpts };
      try { localStorage.setItem(POLL_CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch (e) {}
      renderPollCustomPresets();
      const sel = document.getElementById('pollCustomPresetSelect');
      if (sel) sel.value = name;
      showToast(`💾 투표 프리셋 '${name}'이 저장되었습니다!`, '✅');
    }
    function loadPollCustomPreset(name) {
      const targetName = name || document.getElementById('pollCustomPresetSelect')?.value || '';
      if (!targetName) return;
      const presets = getStoredPollPresets();
      const preset = presets[targetName];
      if (!preset || !Array.isArray(preset.options) || preset.options.length < 2) {
        showToast('유효한 투표 프리셋을 찾을 수 없습니다.', '⚠️');
        return;
      }
      applyPollPreset(preset.title || targetName, preset.options);
      if (typeof scheduleSessionBackup === 'function') scheduleSessionBackup();
    }
    async function deletePollCustomPreset() {
      const sel = document.getElementById('pollCustomPresetSelect');
      const name = sel ? sel.value : '';
      if (!name) {
        showToast('삭제할 투표 프리셋을 먼저 선택해 주세요.', '⚠️');
        return;
      }
      const ok = await showAppConfirm(`'${name}' 투표 프리셋을 삭제하시겠습니까?`, {
        title: '프리셋 삭제',
        confirmText: '삭제',
        danger: true
      });
      if (!ok) return;
      const presets = getStoredPollPresets();
      delete presets[name];
      try { localStorage.setItem(POLL_CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch (e) {}
      renderPollCustomPresets();
      showToast(`🗑️ '${name}' 프리셋이 삭제되었습니다.`, '🗑️');
    }

    // Visual Bars Rendering
    function renderPollVisualBars() {
      if (!pollVisualBarsContainer) return;
      pollVisualBarsContainer.innerHTML = '';

      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);
      if (validOptions.length === 0) {
        pollVisualBarsContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 60px 0; font-size: 13px;">선택지를 입력하거나 프리셋을 선택해 주세요.</div>';
        return;
      }

      // Calculate total votes
      let totalVotes = 0;
      validOptions.forEach(opt => {
        totalVotes += (pollOptionVotes.get(opt.id) || 0);
      });

      pollTotalVotesCount.innerText = totalVotes.toLocaleString();

      // Find leader
      let maxScore = 0;
      let leaderId = -1;
      if (totalVotes > 0) {
        validOptions.forEach(opt => {
          const score = pollOptionVotes.get(opt.id) || 0;
          if (score > maxScore) {
            maxScore = score;
            leaderId = opt.id;
          }
        });
      }

      const unit = currentPollMode === 'cheese' && pollCheeseWeightSelect.value === 'amount' ? '치즈' : '표';

      validOptions.forEach((opt, idx) => {
        const score = pollOptionVotes.get(opt.id) || 0;
        const pct = totalVotes > 0 ? ((score / totalVotes) * 100).toFixed(1) : '0.0';
        const isLeader = totalVotes > 0 && opt.id === leaderId && score > 0;

        const barItem = document.createElement('div');
        barItem.className = `poll-bar-item ${isLeader ? 'winner-leader' : ''}`;

        barItem.innerHTML = `
          <div class="poll-bar-header">
            <div class="poll-bar-title-wrap">
              <span class="poll-num-chip">${isLeader ? '👑 ' : ''}${idx + 1}번</span>
              <span style="word-break: break-all;">${escapeHtml(opt.text)}</span>
            </div>
            <div class="poll-bar-stats">
              <span class="poll-percent-val">${pct}%</span>
              <span class="poll-count-val">(${score.toLocaleString()} ${unit})</span>
            </div>
          </div>
          <div class="poll-progress-track">
            <div class="poll-progress-fill" style="width: ${pct}%;"></div>
          </div>
        `;

        pollVisualBarsContainer.appendChild(barItem);
      });
    }

    // Start / Pause / Stop / Reset Controls
    function startPoll() {
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);
      if (validOptions.length < 2) {
        showToast('투표를 시작하려면 최소 2개 이상의 선택지 이름이 필요합니다.', '⚠️');
        return;
      }

      isPollRunning = true;
      isPollPaused = false;

      // Update Controls UI
      startPollBtn.style.display = 'none';
      pausePollBtn.style.display = 'inline-flex';
      pausePollBtn.innerText = '⏸️ 일시 정지';
      stopPollBtn.style.display = 'inline-flex';
      pollTitleInput.disabled = true;
      document.querySelectorAll('#pollOptionsList input, #pollOptionsList button').forEach(el => el.disabled = true);
      addPollOptionBtn.disabled = true;
      clearAllPollOptionsBtn.disabled = true;

      // Status
      pollStatusBadge.className = 'live-badge-pill live';
      pollStatusBadge.innerText = '🔴 투표 진행 중';
      pollActiveQuestionText.innerText = pollTitleInput.value.trim() || '실시간 시청자 투표 진행 중';

      // Timer Setup
      const durationSec = parseInt(pollDurationSelect.value) || 0;
      if (durationSec > 0) {
        pollTotalDurationSec = durationSec;
        pollRemainingSec = durationSec;
        pollTimerDisplay.style.display = 'inline-block';
        pollTimerGaugeTrack.style.display = 'block';
        updatePollTimerUI();

        if (pollTimerInterval) clearInterval(pollTimerInterval);
        pollTimerInterval = setInterval(() => {
          if (!isPollPaused) {
            pollRemainingSec--;
            updatePollTimerUI();
            if (pollRemainingSec <= 0) {
              clearInterval(pollTimerInterval);
              stopPoll(true);
            }
          }
        }, 1000);
      } else {
        pollTimerDisplay.style.display = 'none';
        pollTimerGaugeTrack.style.display = 'none';
      }

      showToast('투표가 시작되었습니다! 채팅/후원이 실시간 집계됩니다.', '🚀');
    }

    function updatePollTimerUI() {
      const mins = Math.floor(pollRemainingSec / 60);
      const secs = pollRemainingSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      pollTimerDisplay.innerText = `남은 시간: ${formatted}`;

      if (pollTotalDurationSec > 0) {
        const pct = (pollRemainingSec / pollTotalDurationSec) * 100;
        pollTimerGaugeFill.style.width = `${Math.max(0, pct)}%`;
        if (pct < 20) {
          pollTimerGaugeFill.style.background = '#ff4757';
        } else if (pct < 50) {
          pollTimerGaugeFill.style.background = '#ffa502';
        } else {
          pollTimerGaugeFill.style.background = 'var(--chzzk-green)';
        }
      }
    }

    function togglePausePoll() {
      if (!isPollRunning) return;
      isPollPaused = !isPollPaused;
      if (isPollPaused) {
        pausePollBtn.innerText = '▶️ 이어서 진행';
        pollStatusBadge.className = 'live-badge-pill offline';
        pollStatusBadge.innerText = '⏸️ 일시 정지';
        showToast('투표가 일시 정지되었습니다.', '⏸️');
      } else {
        pausePollBtn.innerText = '⏸️ 일시 정지';
        pollStatusBadge.className = 'live-badge-pill live';
        pollStatusBadge.innerText = '🔴 투표 진행 중';
        showToast('투표가 다시 시작되었습니다.', '▶️');
      }
    }

    function stopPoll(autoByTimer = false) {
      if (!isPollRunning) return;
      isPollRunning = false;
      isPollPaused = false;
      if (pollTimerInterval) clearInterval(pollTimerInterval);

      // UI
      startPollBtn.style.display = 'inline-flex';
      pausePollBtn.style.display = 'none';
      stopPollBtn.style.display = 'none';
      pollTitleInput.disabled = false;
      document.querySelectorAll('#pollOptionsList input, #pollOptionsList button').forEach(el => el.disabled = false);
      addPollOptionBtn.disabled = false;
      clearAllPollOptionsBtn.disabled = false;

      pollStatusBadge.className = 'live-badge-pill';
      pollStatusBadge.style.background = 'rgba(255, 215, 0, 0.2)';
      pollStatusBadge.style.color = '#ffd700';
      pollStatusBadge.innerText = '🏁 투표 마감';

      // Calculate Winner
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);
      let totalVotes = 0;
      validOptions.forEach(opt => totalVotes += (pollOptionVotes.get(opt.id) || 0));

      const sorted = [...validOptions].sort((a, b) => {
        return (pollOptionVotes.get(b.id) || 0) - (pollOptionVotes.get(a.id) || 0);
      });

      const topOption = sorted[0];
      const topScore = topOption ? (pollOptionVotes.get(topOption.id) || 0) : 0;
      const topPct = totalVotes > 0 ? ((topScore / totalVotes) * 100).toFixed(1) : '0.0';
      const unit = currentPollMode === 'cheese' && pollCheeseWeightSelect.value === 'amount' ? '치즈' : '표';

      if (topOption && topScore > 0) {
        pollResultWinnerTitle.innerText = topOption.text;
        pollResultStatsText.innerText = `총 ${topScore.toLocaleString()} ${unit} (${topPct}%) 획득으로 최종 1위!`;
      } else {
        pollResultWinnerTitle.innerText = '득표 결과 없음';
        pollResultStatsText.innerText = '참여 인원이 없어 순위가 집계되지 않았습니다.';
      }

      // Ranking breakdown list
      pollResultBreakdownList.innerHTML = '';
      sorted.forEach((opt, idx) => {
        const sc = pollOptionVotes.get(opt.id) || 0;
        const p = totalVotes > 0 ? ((sc / totalVotes) * 100).toFixed(1) : '0.0';
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '6px 0';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        row.style.fontSize = '12px';
        row.innerHTML = `
          <div>
            <span style="font-weight: 800; color: ${idx === 0 ? '#ffd700' : 'var(--text-sub)'}; margin-right: 6px;">${idx + 1}위</span>
            <span style="color: #fff; font-weight: 700;">${escapeHtml(opt.text)}</span>
          </div>
          <div style="font-weight: 700; color: var(--chzzk-green); font-family: 'Outfit';">
            ${sc.toLocaleString()} ${unit} (${p}%)
          </div>
        `;
        pollResultBreakdownList.appendChild(row);
      });

      launchConfetti();
      pollResultModal.classList.add('active');
      showToast(autoByTimer ? '⏰ 제한 시간이 종료되어 투표가 마감되었습니다!' : '투표가 마감되었습니다!', '🏁');
    }

    async function resetPoll() {
      const ok = await showAppConfirm('투표 진행 상황과 모든 득표/치즈 집계 내역을 초기화하시겠습니까?', {
        title: '투표 초기화',
        confirmText: '초기화',
        danger: true
      });
      if (ok) {
        isPollRunning = false;
        isPollPaused = false;
        if (pollTimerInterval) clearInterval(pollTimerInterval);

        pollUserVotes.clear();
        pollOptionVotes.clear();
        pollLiveFeedItems = [];

        startPollBtn.style.display = 'inline-flex';
        pausePollBtn.style.display = 'none';
        stopPollBtn.style.display = 'none';
        pollTitleInput.disabled = false;
        document.querySelectorAll('#pollOptionsList input, #pollOptionsList button').forEach(el => el.disabled = false);
        addPollOptionBtn.disabled = false;
        clearAllPollOptionsBtn.disabled = false;

        pollStatusBadge.className = 'live-badge-pill offline';
        pollStatusBadge.innerText = '대기 중';
        pollActiveQuestionText.innerText = '투표를 시작하면 주제가 여기에 표시됩니다.';
        pollTimerDisplay.style.display = 'none';
        pollTimerGaugeTrack.style.display = 'none';

        pollLiveFeedBox.innerHTML = '<div style="color: var(--text-sub); font-size: 11px; padding: 8px 0; width: 100%; text-align: center;">투표가 시작되면 실시간 투표 참여자가 여기에 표시됩니다.</div>';
        pollFeedCount.innerText = '최신 0건';

        renderPollVisualBars();
        if (typeof scheduleSessionBackup === 'function') scheduleSessionBackup();
        showToast('투표가 초기화되었습니다.', '🔄');
      }
    }

    startPollBtn.addEventListener('click', startPoll);
    pausePollBtn.addEventListener('click', togglePausePoll);
    stopPollBtn.addEventListener('click', () => stopPoll(false));
    resetPollBtn.addEventListener('click', resetPoll);

    closePollResultModalBtn.addEventListener('click', () => {
      pollResultModal.classList.remove('active');
    });
    pollResultModal.addEventListener('click', (e) => {
      if (e.target === pollResultModal) pollResultModal.classList.remove('active');
    });

    // Handle Incoming Live Chat Poll
    function handleLivePollChat(nickname, msg, uid, isSubscriber, isDonator, timeStr) {
      if (!isPollRunning || isPollPaused || currentPollMode !== 'chat') return;

      // Check Audience Filter
      const audFilter = pollAudienceFilterSelect.value;
      if (audFilter === 'subscriber' && !isSubscriber) return;
      if (audFilter === 'donator' && !isDonator) return;

      const trimmedMsg = msg.trim();
      const voteType = pollVoteTypeSelect.value;
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);

      let matchedOption = null;

      // 1. Number matching (!1, 1, !2, 2...)
      if (voteType === 'both' || voteType === 'numberOnly') {
        const numMatch = trimmedMsg.match(/^!?([1-9]|10)\b/);
        if (numMatch) {
          const optIndex = parseInt(numMatch[1]) - 1;
          if (optIndex >= 0 && optIndex < validOptions.length) {
            matchedOption = validOptions[optIndex];
          }
        }
      }

      // 2. Keyword matching
      if (!matchedOption && (voteType === 'both' || voteType === 'keywordOnly')) {
        for (const opt of validOptions) {
          const lowerOpt = opt.text.trim().toLowerCase();
          if (lowerOpt.length > 0 && trimmedMsg.toLowerCase().includes(lowerOpt)) {
            matchedOption = opt;
            break;
          }
        }
      }

      if (!matchedOption) return;

      const dupMode = pollDuplicateModeSelect.value;
      const hasVoted = pollUserVotes.has(uid);

      if (dupMode === 'single' && hasVoted) {
        return; // Ignore duplicate vote
      }

      if (dupMode === 'allowRevote' && hasVoted) {
        const prevVote = pollUserVotes.get(uid);
        if (prevVote.optionId === matchedOption.id) return; // Same option
        // Decrement previous option vote
        const curPrev = pollOptionVotes.get(prevVote.optionId) || 0;
        pollOptionVotes.set(prevVote.optionId, Math.max(0, curPrev - 1));
      }

      // Record vote
      pollUserVotes.set(uid, {
        optionId: matchedOption.id,
        optionText: matchedOption.text,
        nickname: nickname,
        time: timeStr,
        uid: uid,
        isSubscriber: isSubscriber,
        isDonator: isDonator,
        cheeseAmount: 0
      });

      const curCount = pollOptionVotes.get(matchedOption.id) || 0;
      pollOptionVotes.set(matchedOption.id, curCount + 1);

      addPollFeedItem(nickname, matchedOption.text, timeStr, false, 0);
      renderPollVisualBars();
    }

    // Handle Incoming Live Cheese Donation Poll
    function handleLivePollDonation(nickname, msg, uid, amount, timeStr) {
      if (!isPollRunning || isPollPaused || currentPollMode !== 'cheese') return;

      const minCheese = Number(pollMinCheeseSelect ? pollMinCheeseSelect.value : 1000) || 1000;
      if (amount < minCheese) return;

      const trimmedMsg = msg.trim();
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);

      let matchedOption = null;

      // Match number (!1, 1, 2...)
      const numMatch = trimmedMsg.match(/^!?([1-9]|10)\b/);
      if (numMatch) {
        const optIndex = parseInt(numMatch[1]) - 1;
        if (optIndex >= 0 && optIndex < validOptions.length) {
          matchedOption = validOptions[optIndex];
        }
      }

      // Match keyword
      if (!matchedOption) {
        for (const opt of validOptions) {
          const lowerOpt = opt.text.trim().toLowerCase();
          if (lowerOpt.length > 0 && trimmedMsg.toLowerCase().includes(lowerOpt)) {
            matchedOption = opt;
            break;
          }
        }
      }

      if (!matchedOption) return;

      const weightMode = pollCheeseWeightSelect.value;
      const addScore = weightMode === 'amount' ? amount : 1;

      if (weightMode === 'count' || weightMode === '1vote') {
        const dupMode = pollDuplicateModeSelect ? pollDuplicateModeSelect.value : 'unlimited';
        const hasVoted = pollUserVotes.has(uid);
        if (dupMode === 'single' && hasVoted) {
          return; // Ignore duplicate 1-vote donation from same user
        }
        if (dupMode === 'allowRevote' && hasVoted) {
          const prevVote = pollUserVotes.get(uid);
          if (prevVote && prevVote.optionId === matchedOption.id) return;
          if (prevVote) {
            const curPrev = pollOptionVotes.get(prevVote.optionId) || 0;
            pollOptionVotes.set(prevVote.optionId, Math.max(0, curPrev - 1));
          }
        }
        pollUserVotes.set(uid, {
          optionId: matchedOption.id,
          optionText: matchedOption.text,
          nickname: nickname,
          time: timeStr,
          uid: uid,
          isSubscriber: false,
          isDonator: true,
          cheeseAmount: amount
        });
      } else {
        pollUserVotes.set(`${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, {
          optionId: matchedOption.id,
          optionText: matchedOption.text,
          nickname: nickname,
          time: timeStr,
          uid: uid,
          isSubscriber: false,
          isDonator: true,
          cheeseAmount: amount
        });
      }

      const curScore = pollOptionVotes.get(matchedOption.id) || 0;
      pollOptionVotes.set(matchedOption.id, curScore + addScore);

      addPollFeedItem(nickname, matchedOption.text, timeStr, true, amount);
      renderPollVisualBars();
    }

    function addPollFeedItem(nickname, optionText, timeStr, isCheese, amount) {
      if (pollLiveFeedItems.length === 0) {
        pollLiveFeedBox.innerHTML = '';
      }

      pollLiveFeedItems.unshift({ nickname, optionText, timeStr, isCheese, amount });
      if (pollLiveFeedItems.length > 25) pollLiveFeedItems.pop();

      const chip = document.createElement('div');
      chip.style.display = 'inline-flex';
      chip.style.alignItems = 'center';
      chip.style.gap = '5px';
      chip.style.background = isCheese ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.06)';
      chip.style.border = isCheese ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)';
      chip.style.padding = '3px 8px';
      chip.style.borderRadius = '16px';
      chip.style.fontSize = '11px';
      chip.style.animation = 'chatSlideIn 0.25s ease';

      chip.innerHTML = `
        <span style="font-weight: 700; color: ${isCheese ? '#ffd700' : 'var(--chzzk-green)'};">${escapeHtml(nickname)}</span>
        <span style="color: var(--text-sub);">➔</span>
        <span style="font-weight: 800; color: #fff;">${escapeHtml(optionText)}</span>
        ${isCheese ? `<span style="font-size: 9px; color: #ffd700; font-weight: 800;">(+${amount.toLocaleString()}🧀)</span>` : ''}
      `;

      pollLiveFeedBox.insertBefore(chip, pollLiveFeedBox.firstChild);
      pollFeedCount.innerText = `최신 ${pollLiveFeedItems.length}건`;
    }

    // Export Poll Summary & Voters
    function exportPollSummary() {
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);
      if (validOptions.length === 0) {
        showToast('저장할 투표 결과가 없습니다.', '⚠️');
        return;
      }

      let totalVotes = 0;
      validOptions.forEach(opt => totalVotes += (pollOptionVotes.get(opt.id) || 0));

      const question = pollTitleInput.value.trim() || '실시간 투표';
      const unit = currentPollMode === 'cheese' && pollCheeseWeightSelect.value === 'amount' ? '치즈' : '표';

      let csv = `\uFEFF투표 주제,${sanitizeCsvCell(question)}\n총 집계,${totalVotes}${unit}\n\n순위,선택지 번호,선택지 이름,득표/치즈수,득표율(%)\n`;

      const sorted = [...validOptions].sort((a, b) => {
        return (pollOptionVotes.get(b.id) || 0) - (pollOptionVotes.get(a.id) || 0);
      });

      sorted.forEach((opt, idx) => {
        const sc = pollOptionVotes.get(opt.id) || 0;
        const p = totalVotes > 0 ? ((sc / totalVotes) * 100).toFixed(1) : '0.0';
        csv += `${idx + 1}위,${opt.id}번,${sanitizeCsvCell(opt.text)},${sc},${p}%\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, "");
      a.href = url;
      a.download = `chzzk_poll_summary_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('투표 요약 엑셀 파일을 다운로드했습니다.', '📊');
    }

    function exportPollVoters() {
      if (pollUserVotes.size === 0) {
        showToast('저장할 투표 참여자 내역이 없습니다.', '⚠️');
        return;
      }

      let csv = "\uFEFF순번,닉네임,선택한 항목,치즈 후원액,투표 시간,구독 여부,후원자 여부,고유식별자(UID)\n";
      let seq = 1;

      pollUserVotes.forEach((v) => {
        csv += `${seq++},${sanitizeCsvCell(v.nickname || '')},${sanitizeCsvCell(v.optionText || '')},${v.cheeseAmount || 0},${sanitizeCsvCell(v.time || '')},${v.isSubscriber ? '구독자' : '일반'},${v.isDonator ? '후원자' : '일반'},${sanitizeCsvCell(v.uid || '')}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, "");
      a.href = url;
      a.download = `chzzk_poll_voters_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`총 ${pollUserVotes.size}명의 투표자 명단을 저장했습니다.`, '👥');
    }

    // Convert Poll / Cheese Battle Items to Visual Roulette Wheel
    async function convertCheesePollToRoulette() {
      const validOptions = pollOptions.filter(o => o.text && o.text.trim().length > 0);
      if (validOptions.length < 2) {
        showToast('룰렛으로 전환할 투표 선택지가 최소 2개 이상 필요합니다.', '⚠️');
        return;
      }

      // Build converted roulette rows from poll options with current votes/cheese as weights
      const convertedRows = validOptions.map(opt => {
        let score = pollOptionVotes.get(opt.id) || 0;
        let weight = score > 0 ? score : 1;
        return {
          text: opt.text.trim(),
          weight: weight
        };
      });

      // Check if manualRouletteRows already has existing items
      const existingCount = manualRouletteRows.filter(r => r.text && r.text.trim().length > 0).length;
      let shouldAppend = false;

      if (existingCount > 0) {
        shouldAppend = await showAppConfirm(
          `기존에 작성된 룰렛 항목이 ${existingCount}개 있습니다.\n투표 항목(${convertedRows.length}개)을 룰렛에 어떻게 반영할까요?`,
          {
            title: '투표 항목 룰렛 전환',
            confirmText: '기존 룰렛 뒤에 추가',
            cancelText: '새로 덮어쓰기'
          }
        );
      }

      if (shouldAppend) {
        manualRouletteRows = manualRouletteRows.concat(convertedRows);
        showToast(`기존 룰렛에 투표 항목 ${convertedRows.length}개가 추가되었습니다! (총 ${manualRouletteRows.length}개)`, '➕');
      } else {
        manualRouletteRows = convertedRows;
        showToast(`치즈 투표 항목 ${convertedRows.length}개가 룰렛으로 전환되었습니다!`, '🎰');
      }

      if (pollResultModal) pollResultModal.classList.remove('active');

      // Switch directly to roulette tab
      switchMainTab('roulette');
      switchRouletteMode('manual');
      renderManualRouletteRows();
      drawRouletteWheel();
      if (typeof scheduleSessionBackup === 'function') scheduleSessionBackup();
    }

    if (convertPollToRouletteBtn) {
      convertPollToRouletteBtn.addEventListener('click', convertCheesePollToRoulette);
    }
    if (convertPollResultModalRouletteBtn) {
      convertPollResultModalRouletteBtn.addEventListener('click', convertCheesePollToRoulette);
    }
