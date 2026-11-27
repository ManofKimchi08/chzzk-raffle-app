    // ==========================================
    // 🎰 VISUAL ROULETTE SYSTEM ENGINE
    // ==========================================
    const tabRaffleBtn = document.getElementById('tabRaffleBtn');
    const tabRouletteBtn = document.getElementById('tabRouletteBtn');
    const tabPollBtn = document.getElementById('tabPollBtn');
    const tabGameBtn = document.getElementById('tabGameBtn');
    const raffleView = document.getElementById('raffleView');
    const rouletteView = document.getElementById('rouletteView');
    const pollView = document.getElementById('pollView');
    const gameView = document.getElementById('gameView');
    const bgCharRaffle = document.getElementById('bgCharRaffle');
    const bgCharRoulette = document.getElementById('bgCharRoulette');
    const bgCharPoll = document.getElementById('bgCharPoll');
    const bgCharGame = document.getElementById('bgCharGame');

    const rouletteManualTabBtn = document.getElementById('rouletteManualTabBtn');
    const rouletteDonationTabBtn = document.getElementById('rouletteDonationTabBtn');
    const rouletteManualBox = document.getElementById('rouletteManualBox');
    const rouletteDonationBox = document.getElementById('rouletteDonationBox');

    const rouletteItemsContainer = document.getElementById('rouletteItemsContainer');
    const manualItemCountEl = document.getElementById('manualItemCount');
    const addRouletteRowBtn = document.getElementById('addRouletteRowBtn');
    const clearAllRouletteRowsBtn = document.getElementById('clearAllRouletteRowsBtn');
    const rouletteImportFileInput = document.getElementById('rouletteImportFileInput');
    const importRouletteFileBtn = document.getElementById('importRouletteFileBtn');
    const exportRouletteItemsBtn = document.getElementById('exportRouletteItemsBtn');
    const downloadRouletteTemplateBtn = document.getElementById('downloadRouletteTemplateBtn');

    const minDonationCheeseSelect = document.getElementById('minDonationCheeseSelect');
    const donationWeightToggle = document.getElementById('donationWeightToggle');
    const donationMergeDuplicateToggle = document.getElementById('donationMergeDuplicateToggle');
    const donationItemCountEl = document.getElementById('donationItemCount');
    const donationTotalCheeseBadge = document.getElementById('donationTotalCheeseBadge');
    const donationSearchInput = document.getElementById('donationSearchInput');
    const clearDonationSearchBtn = document.getElementById('clearDonationSearchBtn');
    let donationSearchQuery = '';
    const donationFeedList = document.getElementById('donationFeedList');
    const removedDonationFeedList = document.getElementById('removedDonationFeedList');
    const donationFeedTabActiveBtn = document.getElementById('donationFeedTabActiveBtn');
    const donationFeedTabRemovedBtn = document.getElementById('donationFeedTabRemovedBtn');
    const donationActiveActionBar = document.getElementById('donationActiveActionBar');
    const donationRemovedActionBar = document.getElementById('donationRemovedActionBar');
    const donationActiveTabCount = document.getElementById('donationActiveTabCount');
    const donationRemovedTabCount = document.getElementById('donationRemovedTabCount');
    const restoreLastDonationBtn = document.getElementById('restoreLastDonationBtn');
    const restoreAllRemovedDonationsBtn = document.getElementById('restoreAllRemovedDonationsBtn');
    const purgeAllRemovedDonationsBtn = document.getElementById('purgeAllRemovedDonationsBtn');
    const clearDonationsBtn = document.getElementById('clearDonationsBtn');
    const clearDonationsFeedBtn = document.getElementById('clearDonationsFeedBtn');
    const manualDonationMsgInput = document.getElementById('manualDonationMsgInput');
    const manualDonationAmountInput = document.getElementById('manualDonationAmountInput');
    const addManualDonationBtn = document.getElementById('addManualDonationBtn');
    const copyDonationsBtn = document.getElementById('copyDonationsBtn');
    const restoreManualRowBtn = document.getElementById('restoreManualRowBtn');
    const removedManualCountBadge = document.getElementById('removedManualCountBadge');

    let removedDonationRouletteList = [];
    let removedManualRouletteRows = [];
    let currentDonationFeedView = 'active';

    const startRouletteDonationBtn = document.getElementById('startRouletteDonationBtn');
    const pauseRouletteDonationBtn = document.getElementById('pauseRouletteDonationBtn');
    const stopRouletteDonationBtn = document.getElementById('stopRouletteDonationBtn');
    const rouletteDonationStatusBadge = document.getElementById('rouletteDonationStatusBadge');
    const rouletteDonationDurationSelect = document.getElementById('rouletteDonationDurationSelect');
    const rouletteDonationTimerDisplay = document.getElementById('rouletteDonationTimerDisplay');

    let isRouletteDonationCollecting = false;
    let rouletteDonationTimerInterval = null;
    let rouletteDonationRemainingTime = 0;

    const autoRemoveWonItemToggle = document.getElementById('autoRemoveWonItemToggle');
    const rouletteSoundToggle = document.getElementById('rouletteSoundToggle');
    const spinDurationSelect = document.getElementById('spinDurationSelect');
    const spinRouletteBtn = document.getElementById('spinRouletteBtn');
    const spinBtnText = document.getElementById('spinBtnText');
    const currentRouletteItemPreview = document.getElementById('currentRouletteItemPreview');

    const rouletteCanvas = document.getElementById('rouletteCanvas');
    const rouletteCtx = rouletteCanvas.getContext('2d');
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');

    const rouletteWinnerModal = document.getElementById('rouletteWinnerModal');
    const rouletteWinnerTitle = document.getElementById('rouletteWinnerTitle');
    const rouletteWinnerSub = document.getElementById('rouletteWinnerSub');
    const closeRouletteModalBtn = document.getElementById('closeRouletteModalBtn');
    const removeAndCloseRouletteModalBtn = document.getElementById('removeAndCloseRouletteModalBtn');
    const rouletteHistoryBody = document.getElementById('rouletteHistoryBody');
    const clearRouletteHistoryBtn = document.getElementById('clearRouletteHistoryBtn');
    const exportRouletteHistoryBtn = document.getElementById('exportRouletteHistoryBtn');

    let currentRouletteMode = 'manual';
    let donationRouletteList = [];
    let rouletteHistory = [];
    let rouletteRound = 0;
    let isRouletteSpinning = false;
    let currentWheelAngle = 0;
    let currentWinnerObject = null;
    let lastTickSliceIndex = -1;

    let manualRouletteRows = [];

    const WHEEL_COLORS = [
      { bg: '#00ffa3', text: '#051911' },
      { bg: '#a855f7', text: '#ffffff' },
      { bg: '#3b82f6', text: '#ffffff' },
      { bg: '#ec4899', text: '#ffffff' },
      { bg: '#f59e0b', text: '#0f172a' },
      { bg: '#06b6d4', text: '#082f49' },
      { bg: '#10b981', text: '#ffffff' },
      { bg: '#6366f1', text: '#ffffff' },
      { bg: '#f43f5e', text: '#ffffff' },
      { bg: '#8b5cf6', text: '#ffffff' },
      { bg: '#eab308', text: '#1c1917' },
      { bg: '#d946ef', text: '#ffffff' },
      { bg: '#0ea5e9', text: '#ffffff' },
      { bg: '#84cc16', text: '#142704' },
      { bg: '#14b8a6', text: '#042f2e' }
    ];

    function switchMainTab(tab) {
      tabRaffleBtn.classList.toggle('active', tab === 'raffle');
      tabRouletteBtn.classList.toggle('active', tab === 'roulette');
      tabPollBtn.classList.toggle('active', tab === 'poll');
      if (tabGameBtn) tabGameBtn.classList.toggle('active', tab === 'game');

      tabRaffleBtn.setAttribute('aria-selected', tab === 'raffle' ? 'true' : 'false');
      tabRouletteBtn.setAttribute('aria-selected', tab === 'roulette' ? 'true' : 'false');
      tabPollBtn.setAttribute('aria-selected', tab === 'poll' ? 'true' : 'false');
      if (tabGameBtn) tabGameBtn.setAttribute('aria-selected', tab === 'game' ? 'true' : 'false');

      if (tab !== 'game') {
        if (typeof stopPokeBattleBgm === 'function') stopPokeBattleBgm(400);
        if (typeof currentQuizCryAudio !== 'undefined' && currentQuizCryAudio) {
          try { currentQuizCryAudio.pause(); } catch (e) {}
        }
      }

      raffleView.style.display = tab === 'raffle' ? 'block' : 'none';
      rouletteView.style.display = tab === 'roulette' ? 'flex' : 'none';
      pollView.style.display = tab === 'poll' ? 'flex' : 'none';
      if (gameView) gameView.style.display = tab === 'game' ? 'flex' : 'none';

      if (bgCharRaffle) bgCharRaffle.classList.toggle('active', tab === 'raffle');
      if (bgCharRoulette) bgCharRoulette.classList.toggle('active', tab === 'roulette');
      if (bgCharPoll) bgCharPoll.classList.toggle('active', tab === 'poll');
      if (bgCharGame) bgCharGame.classList.toggle('active', tab === 'game');

      if (tab === 'roulette') {
        if (currentRouletteMode === 'manual') renderManualRouletteRows();
        else drawRouletteWheel();
      } else if (tab === 'poll') {
        renderPollOptionsList();
        renderPollVisualBars();
      } else if (tab === 'game') {
        if (currentMinigame === 'voltorb') {
          if (boardTiles.length === 0) {
            initNewGameRound();
          }
        } else if (currentMinigame === 'pokebattle') {
          if (allPokemonData.length === 0) {
            loadPokemonDataset();
          } else {
            renderPokeSetupPreview();
          }
        }
      }
      updateSettingsSummaryBadges();
    }
    tabRaffleBtn.addEventListener('click', () => switchMainTab('raffle'));
    tabRouletteBtn.addEventListener('click', () => switchMainTab('roulette'));
    tabPollBtn.addEventListener('click', () => switchMainTab('poll'));
    if (tabGameBtn) tabGameBtn.addEventListener('click', () => switchMainTab('game'));

    // ==========================================
    // ⚙️ SLIDE-OUT LEFT SETTINGS DRAWER SYSTEM
    // ==========================================
    let currentDrawerTab = 'raffle';

    function openSettingsDrawer(tab) {
      const backdrop = document.getElementById('settingsDrawerBackdrop');
      const drawer = document.getElementById('settingsDrawer');
      if (!drawer || !backdrop) return;

      let targetTab = tab;
      if (!targetTab) {
        if (tabRouletteBtn && tabRouletteBtn.classList.contains('active')) targetTab = 'roulette';
        else if (tabPollBtn && tabPollBtn.classList.contains('active')) targetTab = 'poll';
        else if (tabGameBtn && tabGameBtn.classList.contains('active')) targetTab = 'game';
        else targetTab = 'raffle';
      }

      switchSettingsDrawerTab(targetTab);
      backdrop.classList.add('active');
      drawer.classList.add('active');
    }

    function closeSettingsDrawer() {
      const backdrop = document.getElementById('settingsDrawerBackdrop');
      const drawer = document.getElementById('settingsDrawer');
      if (backdrop) backdrop.classList.remove('active');
      if (drawer) drawer.classList.remove('active');
      updateSettingsSummaryBadges();
    }

    function switchSettingsDrawerTab(tab) {
      currentDrawerTab = tab;
      const tabRaffle = document.getElementById('drawerTabRaffleBtn');
      const tabRoulette = document.getElementById('drawerTabRouletteBtn');
      const tabPoll = document.getElementById('drawerTabPollBtn');
      const tabGame = document.getElementById('drawerTabGameBtn');

      const contentRaffle = document.getElementById('drawerRaffleContent');
      const contentRoulette = document.getElementById('drawerRouletteContent');
      const contentPoll = document.getElementById('drawerPollContent');
      const contentGame = document.getElementById('drawerGameContent');
      const subTitle = document.getElementById('settingsDrawerSubTitle');

      if (tabRaffle) tabRaffle.classList.toggle('active', tab === 'raffle');
      if (tabRoulette) tabRoulette.classList.toggle('active', tab === 'roulette');
      if (tabPoll) tabPoll.classList.toggle('active', tab === 'poll');
      if (tabGame) tabGame.classList.toggle('active', tab === 'game');

      if (contentRaffle) contentRaffle.style.display = tab === 'raffle' ? 'block' : 'none';
      if (contentRoulette) contentRoulette.style.display = tab === 'roulette' ? 'block' : 'none';
      if (contentPoll) contentPoll.style.display = tab === 'poll' ? 'block' : 'none';
      if (contentGame) contentGame.style.display = tab === 'game' ? 'block' : 'none';

      if (subTitle) {
        if (tab === 'raffle') subTitle.innerText = '추첨 대상 필터, 키워드, 구독/후원 조건 및 중복 제외 설정';
        else if (tab === 'roulette') subTitle.innerText = '룰렛 항목 목록 편집, 엑셀 불러오기, 치즈 연동 및 회전 옵션';
        else if (tab === 'poll') subTitle.innerText = '실시간 투표 주제(질문), 선택지 목록, 참여 규칙 및 치즈 도네 투표';
        else if (tab === 'game') subTitle.innerText = '미니게임 종목 선택 (찌리리공 뒤집기 / 포켓몬 배틀) 및 대결 옵션';
      }

      if (tab === 'roulette') {
        if (typeof renderManualRouletteRows === 'function') renderManualRouletteRows();
      } else if (tab === 'poll') {
        if (typeof renderPollOptionsList === 'function') renderPollOptionsList();
      }
      updateSettingsSummaryBadges();
    }

    function updateSettingsSummaryBadges() {
      // 1. Header Setting Button Text & Badge
      const headerBtnLabel = document.getElementById('settingsBtnLabel');
      const headerSummaryBadge = document.getElementById('settingsActiveSummaryBadge');

      const isRaffle = tabRaffleBtn && tabRaffleBtn.classList.contains('active');
      const isRoulette = tabRouletteBtn && tabRouletteBtn.classList.contains('active');
      const isPoll = tabPollBtn && tabPollBtn.classList.contains('active');
      const isGame = tabGameBtn && tabGameBtn.classList.contains('active');

      if (headerBtnLabel) {
        if (isRaffle) headerBtnLabel.innerText = '추첨 설정';
        else if (isRoulette) headerBtnLabel.innerText = '룰렛 설정';
        else if (isPoll) headerBtnLabel.innerText = '투표 설정';
        else if (isGame) headerBtnLabel.innerText = '게임 설정';
        else headerBtnLabel.innerText = '상세 설정';
      }

      if (headerSummaryBadge) {
        if (isRaffle) {
          if (isKeywordFilterActive && keywordInput && keywordInput.value.trim()) {
            headerSummaryBadge.innerText = `"${keywordInput.value.trim()}"`;
          } else if (isDonorFilterActive) {
            headerSummaryBadge.innerText = '후원자';
          } else if (isSubFilterActive) {
            headerSummaryBadge.innerText = '구독자';
          } else {
            headerSummaryBadge.innerText = '전체 참여자';
          }
        } else if (isRoulette) {
          if (currentRouletteMode === 'manual') {
            const count = manualRouletteRows ? manualRouletteRows.length : 0;
            headerSummaryBadge.innerText = `항목 ${count}개`;
          } else {
            headerSummaryBadge.innerText = `도네 연동 (${donationRouletteList ? donationRouletteList.length : 0}건)`;
          }
        } else if (isPoll) {
          const count = (typeof pollOptions !== 'undefined' && pollOptions) ? pollOptions.length : 0;
          headerSummaryBadge.innerText = `선택지 ${count}개`;
        } else if (isGame) {
          if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokebattle') {
            headerSummaryBadge.innerText = (typeof pokeBattleMode !== 'undefined' && pokeBattleMode === '3v3') ? '포켓몬 3v3' : '포켓몬 1v1';
          } else if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokequiz') {
            headerSummaryBadge.innerText = '포켓몬 퀴즈';
          } else {
            headerSummaryBadge.innerText = '찌리리공';
          }
        } else {
          headerSummaryBadge.innerText = '설정';
        }
      }

      // 2. Raffle View Summary Bar
      const raffleSummary = document.getElementById('raffleActiveFilterSummary');
      const raffleExclude = document.getElementById('raffleExcludeSummaryBadge');
      if (raffleSummary) {
        let filters = [];
        if (isKeywordFilterActive && keywordInput && keywordInput.value.trim()) {
          filters.push(`💬 키워드: "${keywordInput.value.trim()}"`);
        }
        if (isDonorFilterActive) {
          const lvl = donorLevelSelect ? donorLevelSelect.value : '1';
          filters.push(`🧀 후원자 LV${lvl}+`);
        }
        if (isSubFilterActive) {
          const months = minSubMonths ? (parseInt(minSubMonths.value, 10) || 0) : 0;
          const tier = subTierSelect ? subTierSelect.value : '0';
          filters.push(`⭐ 구독자 (${months > 0 ? months + '개월+' : '전체'}${tier !== '0' ? ', ' + tier + '티어+' : ''})`);
        }
        if (filters.length === 0) {
          raffleSummary.innerText = '👥 전체 참여자';
        } else {
          raffleSummary.innerText = filters.join(' + ');
        }
      }
      if (raffleExclude) {
        const count = (autoExcludePreviousToggle && autoExcludePreviousToggle.checked ? 1 : 0) +
                      (fileExcludeToggle && fileExcludeToggle.checked ? 1 : 0) +
                      (manualExcludeToggle && manualExcludeToggle.checked ? 1 : 0);
        if (count === 0) {
          raffleExclude.innerText = '제외 없음';
          raffleExclude.style.background = 'rgba(255, 255, 255, 0.08)';
          raffleExclude.style.color = 'var(--text-sub)';
        } else if (autoExcludePreviousToggle && autoExcludePreviousToggle.checked && count === 1) {
          raffleExclude.innerText = '기본 중복제외 ON';
          raffleExclude.style.background = 'rgba(0, 255, 163, 0.15)';
          raffleExclude.style.color = 'var(--chzzk-green)';
        } else {
          raffleExclude.innerText = `${count}개 제외 규칙 적용 중`;
          raffleExclude.style.background = 'rgba(0, 255, 163, 0.2)';
          raffleExclude.style.color = 'var(--chzzk-green)';
        }
      }

      // 3. Roulette View Summary Bar
      const rouletteSummary = document.getElementById('rouletteSummaryTag');
      const rouletteDuration = document.getElementById('rouletteDurationSummaryTag');
      if (rouletteSummary) {
        if (currentRouletteMode === 'manual') {
          const count = manualRouletteRows ? manualRouletteRows.length : 0;
          rouletteSummary.innerText = `✍️ 수동 항목 (${count}개 칸)`;
        } else {
          const count = donationRouletteList ? donationRouletteList.length : 0;
          const items = typeof getActiveRouletteItems === 'function' ? getActiveRouletteItems() : [];
          if (donationMergeDuplicateToggle && donationMergeDuplicateToggle.checked && items.length !== count) {
            rouletteSummary.innerText = `🧀 치즈 도네 연동 (${items.length}개 칸 / 총 ${count}건 합산)`;
          } else {
            rouletteSummary.innerText = `🧀 치즈 도네이션 연동 (${count}건)`;
          }
        }
      }
      if (rouletteDuration && spinDurationSelect) {
        rouletteDuration.innerText = `회전: ${spinDurationSelect.value}초`;
      }
      const miniDuration = document.getElementById('rouletteSpinDurationMiniBadge');
      if (miniDuration && spinDurationSelect) {
        miniDuration.innerText = `${spinDurationSelect.value}초`;
      }

      // 4. Poll View Summary Bar
      const pollSummary = document.getElementById('pollActiveQuestionSummary');
      const pollOptionsCountSummary = document.getElementById('pollOptionsCountSummary');
      if (pollSummary && typeof pollTitleInput !== 'undefined' && pollTitleInput) {
        const q = pollTitleInput.value.trim() || '투표 질문 미입력';
        pollSummary.innerText = `질문: ${q}`;
      }
      if (pollOptionsCountSummary && typeof pollOptions !== 'undefined' && pollOptions) {
        const modeText = (pollModeChatTabBtn && pollModeChatTabBtn.classList.contains('active')) ? '일반 채팅' : '치즈 도네';
        pollOptionsCountSummary.innerText = `선택지 ${pollOptions.length}개 (${modeText})`;
      }

      // 5. Game View Summary Bar
      const gameActiveSummary = document.getElementById('gameActiveSummaryTag');
      const gameModeSummary = document.getElementById('gameModeSummaryBadge');
      if (gameActiveSummary) {
        if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokebattle') {
          gameActiveSummary.innerText = '⚔️ 포켓몬 배틀';
        } else if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokequiz') {
          gameActiveSummary.innerText = '❓ 포켓몬 퀴즈 쇼';
        } else {
          gameActiveSummary.innerText = '⚡ 찌리리공 뒤집기';
        }
      }
      if (gameModeSummary) {
        if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokebattle') {
          gameModeSummary.innerText = (typeof pokeBattleMode !== 'undefined' && pokeBattleMode === '3v3') ? '3v3 팀 엔트리 배틀' : '1v1 에이스 배틀';
        } else if (typeof currentMinigame !== 'undefined' && currentMinigame === 'pokequiz') {
          const vMode = (typeof quizMatchState !== 'undefined' && quizMatchState.viewerMode === 'voting') ? '🗳️ 집단지성 다수결' : '⚡ 스피드 선착순';
          gameModeSummary.innerText = vMode;
        } else {
          const formatSelect = document.getElementById('gameMatchFormatSelect');
          gameModeSummary.innerText = formatSelect ? formatSelect.options[formatSelect.selectedIndex]?.text.split('(')[0].trim() : '단판 승부';
        }
      }

      // Drawer Minigame Toggle & Option box states
      const drawerVoltorbBtn = document.getElementById('drawerVoltorbSelectBtn');
      const drawerPokeBtn = document.getElementById('drawerPokeBattleSelectBtn');
      const drawerQuizBtn = document.getElementById('drawerPokeQuizSelectBtn');
      const drawerVoltorbBox = document.getElementById('drawerVoltorbOptionsBox');
      const drawerPokeBox = document.getElementById('drawerPokeBattleOptionsBox');
      const drawerQuizBox = document.getElementById('drawerPokeQuizOptionsBox');

      const cGame = (typeof currentMinigame === 'undefined') ? 'voltorb' : currentMinigame;
      if (drawerVoltorbBtn) drawerVoltorbBtn.classList.toggle('active', cGame === 'voltorb');
      if (drawerPokeBtn) drawerPokeBtn.classList.toggle('active', cGame === 'pokebattle');
      if (drawerQuizBtn) drawerQuizBtn.classList.toggle('active', cGame === 'pokequiz');

      if (drawerVoltorbBox) drawerVoltorbBox.style.display = (cGame === 'voltorb') ? 'block' : 'none';
      if (drawerPokeBox) drawerPokeBox.style.display = (cGame === 'pokebattle') ? 'block' : 'none';
      if (drawerQuizBox) drawerQuizBox.style.display = (cGame === 'pokequiz') ? 'block' : 'none';

      // Sync form values between Drawer and Main setup bar
      const mainMatchFmt = document.getElementById('gameMatchFormatSelect');
      const drawerMatchFmt = document.getElementById('drawerGameMatchFormatSelect');
      if (mainMatchFmt && drawerMatchFmt && drawerMatchFmt.value !== mainMatchFmt.value) {
        drawerMatchFmt.value = mainMatchFmt.value;
      }
      const mainLvl = document.getElementById('gameLevelSelect');
      const drawerLvl = document.getElementById('drawerGameLevelSelect');
      if (mainLvl && drawerLvl && drawerLvl.value !== mainLvl.value) {
        drawerLvl.value = mainLvl.value;
      }
      const mainTurnLim = document.getElementById('gameTurnLimitSelect');
      const drawerTurnLim = document.getElementById('drawerGameTurnLimitSelect');
      if (mainTurnLim && drawerTurnLim && drawerTurnLim.value !== mainTurnLim.value) {
        drawerTurnLim.value = mainTurnLim.value;
      }
      const mainVoteDurVolt = document.getElementById('gameVoteDurationSelect');
      const drawerVoteDurVolt = document.getElementById('drawerGameVoteDurationSelect');
      if (mainVoteDurVolt && drawerVoteDurVolt && drawerVoteDurVolt.value !== mainVoteDurVolt.value) {
        drawerVoteDurVolt.value = mainVoteDurVolt.value;
      }

      const mainVoteDur = document.getElementById('pokeVoteDurationSelect');
      const drawerVoteDur = document.getElementById('drawerPokeVoteDurationSelect');
      if (mainVoteDur && drawerVoteDur && drawerVoteDur.value !== mainVoteDur.value) {
        drawerVoteDur.value = mainVoteDur.value;
      }
      const mainStreamerDur = document.getElementById('pokeStreamerDurationSelect');
      const drawerStreamerDur = document.getElementById('drawerPokeStreamerDurationSelect');
      if (mainStreamerDur && drawerStreamerDur && drawerStreamerDur.value !== mainStreamerDur.value) {
        drawerStreamerDur.value = mainStreamerDur.value;
      }
      const mainBattleMode = document.getElementById('pokeBattleModeSelect');
      const drawerBattleMode = document.getElementById('drawerPokeBattleModeSelect');
      if (mainBattleMode && drawerBattleMode && drawerBattleMode.value !== mainBattleMode.value) {
        drawerBattleMode.value = pokeBattleMode || mainBattleMode.value;
      }
    }

    // Synchronizers between Drawer and Main Game View
    function syncVoltorbMatchFormat(val) {
      const mainSelect = document.getElementById('gameMatchFormatSelect');
      const drawerSelect = document.getElementById('drawerGameMatchFormatSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
        mainSelect.dispatchEvent(new Event('change'));
      }
      if (drawerSelect && drawerSelect.value !== val) drawerSelect.value = val;
      updateSettingsSummaryBadges();
    }

    function syncVoltorbLevel(val) {
      const mainSelect = document.getElementById('gameLevelSelect');
      const drawerSelect = document.getElementById('drawerGameLevelSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
        mainSelect.dispatchEvent(new Event('change'));
      }
      if (drawerSelect && drawerSelect.value !== val) drawerSelect.value = val;
      updateSettingsSummaryBadges();
    }

    function syncVoltorbTurnLimit(val) {
      const mainSelect = document.getElementById('gameTurnLimitSelect');
      const drawerSelect = document.getElementById('drawerGameTurnLimitSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
        mainSelect.dispatchEvent(new Event('change'));
      }
      if (drawerSelect && drawerSelect.value !== val) drawerSelect.value = val;
      updateSettingsSummaryBadges();
    }

    function syncVoltorbVoteDuration(val) {
      const mainSelect = document.getElementById('gameVoteDurationSelect');
      const drawerSelect = document.getElementById('drawerGameVoteDurationSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
        mainSelect.dispatchEvent(new Event('change'));
      }
      if (drawerSelect && drawerSelect.value !== val) drawerSelect.value = val;
      updateSettingsSummaryBadges();
    }

    function syncVoltorbTurnDuration(val) {
      syncVoltorbVoteDuration(val);
    }

    function syncPokeBattleMode(val) {
      const mainSelect = document.getElementById('pokeBattleModeSelect');
      const drawerSelect = document.getElementById('drawerPokeBattleModeSelect');
      pokeBattleMode = val;
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
      }
      if (drawerSelect && drawerSelect.value !== val) {
        drawerSelect.value = val;
      }
      handleBattleModeChange();
      updateSettingsSummaryBadges();
    }

    function syncPokeVoteDuration(val) {
      const mainSelect = document.getElementById('pokeVoteDurationSelect');
      const drawerSelect = document.getElementById('drawerPokeVoteDurationSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
      }
      if (drawerSelect && drawerSelect.value !== val) {
        drawerSelect.value = val;
      }
      // If live battle in viewers_vote or faint_switch_viewers phase, dynamically adjust timer
      if (typeof pokeBattleState !== 'undefined' && pokeBattleState) {
        if (pokeBattleState.phase === 'viewers_vote') {
          const newTotal = parseFloat(val) || 30.0;
          const currentElapsed = pokeBattleState.viewersTimerTotal - pokeBattleState.viewersTimerRemaining;
          pokeBattleState.viewersTimerTotal = newTotal;
          pokeBattleState.viewersTimerRemaining = Math.max(0.5, newTotal - currentElapsed);
          if (typeof renderViewersVotingTimer === 'function') renderViewersVotingTimer();
        } else if (pokeBattleState.phase === 'faint_switch_viewers') {
          const newTotal = parseFloat(val) || 30.0;
          const currentElapsed = pokeBattleState.faintTimerTotal - pokeBattleState.faintTimerRemaining;
          pokeBattleState.faintTimerTotal = newTotal;
          pokeBattleState.faintTimerRemaining = Math.max(0.5, newTotal - currentElapsed);
          if (typeof renderFaintTimerUI === 'function') renderFaintTimerUI();
        }
      }
      showToast(`⏱️ 시청자 턴 투표 시간: ${val}초로 설정되었습니다.`, '⏱️');
      updateSettingsSummaryBadges();
    }

    function syncPokeStreamerDuration(val) {
      const mainSelect = document.getElementById('pokeStreamerDurationSelect');
      const drawerSelect = document.getElementById('drawerPokeStreamerDurationSelect');
      if (mainSelect && mainSelect.value !== val) {
        mainSelect.value = val;
      }
      if (drawerSelect && drawerSelect.value !== val) {
        drawerSelect.value = val;
      }
      // If live battle in streamer_turn or faint_switch_streamer phase, dynamically adjust timer
      if (typeof pokeBattleState !== 'undefined' && pokeBattleState) {
        if (pokeBattleState.phase === 'streamer_turn') {
          const newTotal = parseFloat(val) || 30.0;
          const currentElapsed = pokeBattleState.streamerTimerTotal - pokeBattleState.streamerTimerRemaining;
          pokeBattleState.streamerTimerTotal = newTotal;
          pokeBattleState.streamerTimerRemaining = Math.max(0.5, newTotal - currentElapsed);
          if (typeof renderStreamerTimerUI === 'function') renderStreamerTimerUI();
        } else if (pokeBattleState.phase === 'faint_switch_streamer') {
          const newTotal = parseFloat(val) || 30.0;
          const currentElapsed = pokeBattleState.faintTimerTotal - pokeBattleState.faintTimerRemaining;
          pokeBattleState.faintTimerTotal = newTotal;
          pokeBattleState.faintTimerRemaining = Math.max(0.5, newTotal - currentElapsed);
          if (typeof renderFaintTimerUI === 'function') renderFaintTimerUI();
        }
      }
      showToast(`⏱️ 스트리머 턴 제한 시간: ${val}초로 설정되었습니다.`, '⏱️');
      updateSettingsSummaryBadges();
    }

    function syncPokeTurnDuration(val) {
      syncPokeVoteDuration(val);
    }

    window.openSettingsDrawer = openSettingsDrawer;
    window.closeSettingsDrawer = closeSettingsDrawer;
    window.switchSettingsDrawerTab = switchSettingsDrawerTab;
    window.updateSettingsSummaryBadges = updateSettingsSummaryBadges;
    window.openUserChatModal = openUserChatModal;
    window.closeUserChatModal = closeUserChatModal;
    window.openUserChatByNickOrUid = openUserChatByNickOrUid;
    window.userChatHistory = userChatHistory;
    window.participants = participants;
    window.drawnWinners = drawnWinners;
    window.syncVoltorbMatchFormat = syncVoltorbMatchFormat;
    window.syncVoltorbTurnDuration = syncVoltorbTurnDuration;
    window.syncPokeBattleMode = syncPokeBattleMode;
    window.syncPokeVoteDuration = syncPokeVoteDuration;
    window.syncPokeStreamerDuration = syncPokeStreamerDuration;
    window.syncPokeTurnDuration = syncPokeTurnDuration;


    function switchRouletteMode(mode) {
      currentRouletteMode = mode;
      if (mode === 'manual') {
        rouletteManualTabBtn.classList.add('active');
        rouletteDonationTabBtn.classList.remove('active');
        rouletteManualBox.style.display = 'block';
        rouletteDonationBox.style.display = 'none';
        renderManualRouletteRows();
      } else {
        rouletteDonationTabBtn.classList.add('active');
        rouletteManualTabBtn.classList.remove('active');
        rouletteDonationBox.style.display = 'block';
        rouletteManualBox.style.display = 'none';
        drawRouletteWheel();
      }
    }
    rouletteManualTabBtn.addEventListener('click', () => switchRouletteMode('manual'));
    rouletteDonationTabBtn.addEventListener('click', () => switchRouletteMode('donation'));

    function renderManualRouletteRows() {
      if (!rouletteItemsContainer) return;
      rouletteItemsContainer.innerHTML = '';

      if (manualRouletteRows.length === 0) {
        rouletteItemsContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 24px 0; font-size: 11px;">항목이 없습니다. 아래 [새 항목 추가] 버튼을 눌러 칸을 추가하세요.</div>';
      } else {
        manualRouletteRows.forEach((row, idx) => {
          const rowEl = document.createElement('div');
          rowEl.className = 'roulette-item-row';
          rowEl.innerHTML = `
            <span class="row-index-badge">${idx + 1}</span>
            <input type="text" class="row-item-input" value="${escapeHtml(row.text)}" placeholder="항목 이름 (예: 치킨, 꽝)">
            <div class="row-weight-wrap">
              <span class="row-weight-label">비율</span>
              <input type="number" class="row-weight-input" min="1" max="100" value="${row.weight}">
            </div>
            <button type="button" class="row-delete-btn" title="삭제">✕</button>
          `;

          const textInput = rowEl.querySelector('.row-item-input');
          const weightInput = rowEl.querySelector('.row-weight-input');
          const delBtn = rowEl.querySelector('.row-delete-btn');

          textInput.addEventListener('input', (e) => {
            manualRouletteRows[idx].text = e.target.value;
            updateManualItemCount();
            drawRouletteWheel();
          });

          textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addManualRouletteRow('', 1, true);
            }
          });

          weightInput.addEventListener('input', (e) => {
            manualRouletteRows[idx].weight = Math.max(1, parseInt(e.target.value) || 1);
            drawRouletteWheel();
          });

          delBtn.addEventListener('click', () => {
            removeManualRouletteRow(idx);
          });

          rouletteItemsContainer.appendChild(rowEl);
        });
      }

      updateManualItemCount();
      drawRouletteWheel();
    }

    function addManualRouletteRow(text = '', weight = 1, focusNew = false) {
      manualRouletteRows.push({ text: text, weight: weight });
      renderManualRouletteRows();
      if (focusNew) {
        const inputs = rouletteItemsContainer.querySelectorAll('.row-item-input');
        if (inputs.length > 0) {
          inputs[inputs.length - 1].focus();
        }
      }
    }

    function updateManualRestoreBadge() {
      if (restoreManualRowBtn && removedManualCountBadge) {
        removedManualCountBadge.innerText = removedManualRouletteRows.length;
        restoreManualRowBtn.style.display = removedManualRouletteRows.length > 0 ? 'inline-flex' : 'none';
      }
    }

    function removeManualRouletteRow(idx) {
      if (idx >= 0 && idx < manualRouletteRows.length) {
        const removed = manualRouletteRows.splice(idx, 1)[0];
        if (removed && removed.text && removed.text.trim()) {
          removedManualRouletteRows.push(removed);
          updateManualRestoreBadge();
        }
        renderManualRouletteRows();
      }
    }

    async function clearAllManualRouletteRows() {
      if (manualRouletteRows.length === 0) return;
      const ok = await showAppConfirm('모든 룰렛 항목 칸을 삭제하시겠습니까? (삭제 후 복구 가능)', {
        title: '수동 룰렛 항목 삭제',
        confirmText: '전체 삭제',
        danger: true
      });
      if (ok) {
        const valid = manualRouletteRows.filter(r => r.text && r.text.trim());
        if (valid.length > 0) {
          removedManualRouletteRows.push(...valid);
          updateManualRestoreBadge();
        }
        manualRouletteRows = [];
        renderManualRouletteRows();
        scheduleSessionBackup();
        showToast('모든 수동 항목이 삭제되었습니다. (복구 가능)', '🗑️');
      }
    }

    // Custom Roulette Presets (chzzk_roulette_presets_v1)
    const ROULETTE_CUSTOM_PRESETS_KEY = 'chzzk_roulette_presets_v1';
    function getStoredRoulettePresets() {
      try {
        const raw = localStorage.getItem(ROULETTE_CUSTOM_PRESETS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
      } catch (e) {
        return {};
      }
    }
    function renderRouletteCustomPresets() {
      const sel = document.getElementById('rouletteCustomPresetSelect');
      if (!sel) return;
      const presets = getStoredRoulettePresets();
      const prevVal = sel.value;
      sel.innerHTML = '<option value="">저장된 프리셋 선택...</option>';
      Object.keys(presets).forEach(name => {
        const rows = presets[name];
        const count = Array.isArray(rows) ? rows.length : 0;
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = `${name} (${count}개)`;
        sel.appendChild(opt);
      });
      if (prevVal && presets[prevVal]) sel.value = prevVal;
    }
    async function saveRouletteCustomPreset() {
      const valid = manualRouletteRows
        .filter(r => r && r.text && r.text.trim().length > 0)
        .map(r => ({ text: r.text.trim(), weight: Math.max(1, parseInt(r.weight, 10) || 1) }));
      if (valid.length === 0) {
        showToast('프리셋으로 저장할 유효한 룰렛 항목이 없습니다.', '⚠️');
        return;
      }
      const name = await showAppPrompt('저장할 룰렛 프리셋 이름을 입력하세요:', {
        title: '룰렛 프리셋 저장',
        placeholder: '예: 벌칙 룰렛 세트',
        confirmText: '저장'
      });
      if (!name) return;
      const presets = getStoredRoulettePresets();
      presets[name] = valid;
      try { localStorage.setItem(ROULETTE_CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch (e) {}
      renderRouletteCustomPresets();
      const sel = document.getElementById('rouletteCustomPresetSelect');
      if (sel) sel.value = name;
      showToast(`💾 룰렛 프리셋 '${name}' (${valid.length}개 항목)이 저장되었습니다!`, '✅');
    }
    function loadRouletteCustomPreset() {
      const sel = document.getElementById('rouletteCustomPresetSelect');
      const name = sel ? sel.value : '';
      if (!name) {
        showToast('불러올 프리셋을 먼저 선택해 주세요.', '⚠️');
        return;
      }
      const presets = getStoredRoulettePresets();
      const rows = presets[name];
      if (!Array.isArray(rows) || rows.length === 0) {
        showToast('선택한 프리셋 데이터를 찾을 수 없습니다.', '⚠️');
        return;
      }
      manualRouletteRows = rows.map(r => ({ text: String(r.text || ''), weight: Math.max(1, parseInt(r.weight, 10) || 1) }));
      renderManualRouletteRows();
      drawRouletteWheel();
      scheduleSessionBackup();
      showToast(`📂 '${name}' 프리셋(${rows.length}개 항목)을 불러왔습니다!`, '🎰');
    }
    async function deleteRouletteCustomPreset() {
      const sel = document.getElementById('rouletteCustomPresetSelect');
      const name = sel ? sel.value : '';
      if (!name) {
        showToast('삭제할 프리셋을 먼저 선택해 주세요.', '⚠️');
        return;
      }
      const ok = await showAppConfirm(`'${name}' 프리셋을 삭제하시겠습니까?`, {
        title: '프리셋 삭제',
        confirmText: '삭제',
        danger: true
      });
      if (!ok) return;
      const presets = getStoredRoulettePresets();
      delete presets[name];
      try { localStorage.setItem(ROULETTE_CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch (e) {}
      renderRouletteCustomPresets();
      showToast(`🗑️ '${name}' 프리셋이 삭제되었습니다.`, '🗑️');
    }

    addRouletteRowBtn.addEventListener('click', () => addManualRouletteRow('', 1, true));
    clearAllRouletteRowsBtn.addEventListener('click', clearAllManualRouletteRows);

    if (restoreManualRowBtn) {
      restoreManualRowBtn.addEventListener('click', () => {
        if (removedManualRouletteRows.length === 0) return;
        const restored = removedManualRouletteRows.pop();
        if (restored) {
          manualRouletteRows.push(restored);
          renderManualRouletteRows();
          updateManualRestoreBadge();
          showToast(`'${restored.text}' 항목이 복구되었습니다.`, '↩️');
        }
      });
    }

    // ==========================================
    // 🔔 TOAST NOTIFICATION UTILITY
    // ==========================================
    function showToast(msg, icon = '🎉') {
      const toast = document.getElementById('appToast');
      const toastText = document.getElementById('appToastText');
      const toastIcon = document.getElementById('appToastIcon');
      if (!toast) return;
      toastText.innerText = msg;
      toastIcon.innerText = icon;
      toast.classList.add('active');
      clearTimeout(window.__toastTimeout);
      window.__toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
      }, 2800);
    }

    // ==========================================
    // 📊 ROULETTE EXCEL / CSV IMPORT & EXPORT
    // ==========================================
    downloadRouletteTemplateBtn.addEventListener('click', () => {
      const templateCsv = "\uFEFF항목,비율\n치킨 1마리,1\n피자 1판,1\n문화상품권 1만원,1\n스타벅스 아메리카노,1\n꽝,2\n";
      const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chzzk_roulette_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('룰렛 엑셀 샘플 양식을 다운로드했습니다.', '📄');
    });

    exportRouletteItemsBtn.addEventListener('click', () => {
      const activeItems = manualRouletteRows.filter(r => r.text && r.text.trim().length > 0);
      if (activeItems.length === 0) {
        showToast('저장할 룰렛 항목이 없습니다. 항목을 추가해 주세요.', '⚠️');
        return;
      }

      let csvContent = "\uFEFF항목,비율\n";
      activeItems.forEach(item => {
        csvContent += `${sanitizeCsvCell(item.text)},${item.weight || 1}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0,19).replace(/[^0-9]/g, "");
      a.href = url;
      a.download = `chzzk_roulette_items_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`총 ${activeItems.length}개의 룰렛 항목을 저장했습니다.`, '💾');
    });

    importRouletteFileBtn.addEventListener('click', () => {
      rouletteImportFileInput.value = '';
      rouletteImportFileInput.click();
    });

    rouletteImportFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isXLSX && window.XLSX) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            parseRouletteArrayData(jsonRows, file.name);
          } catch (err) {
            console.error(err);
            showToast('엑셀 파일을 읽는 도중 오류가 발생했습니다.', '❌');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const text = evt.target.result;
          parseRouletteCsvText(text, file.name);
        };
        reader.readAsText(file, 'utf-8');
      }
    });

    function parseRouletteCsvText(text, fileName) {
      const lines = text.split(/\r\n|\n|\r/);
      const parsedRows = [];
      
      lines.forEach((line, lineIdx) => {
        const clean = line.trim();
        if (!clean) return;

        const parts = clean.split(/[,;\t]/);
        let itemText = parts[0] ? parts[0].trim().replace(/^"|"$/g, '') : '';
        let weight = parts[1] ? parseInt(parts[1].trim().replace(/^"|"$/g, '')) : 1;

        if (lineIdx === 0 && (itemText.toLowerCase() === '항목' || itemText.toLowerCase() === 'item' || itemText.toLowerCase() === '이름' || itemText.toLowerCase() === 'name')) {
          return;
        }

        if (itemText) {
          parsedRows.push({
            text: itemText,
            weight: isNaN(weight) || weight < 1 ? 1 : weight
          });
        }
      });

      if (parsedRows.length === 0) {
        showToast(`[${fileName}] 유효한 룰렛 항목이 없습니다.`, '⚠️');
        return;
      }

      applyImportedRouletteRows(parsedRows, fileName);
    }

    function parseRouletteArrayData(arrayData, fileName) {
      const parsedRows = [];
      arrayData.forEach((row, rowIdx) => {
        if (!Array.isArray(row) || row.length === 0) return;
        let itemText = row[0] !== undefined ? String(row[0]).trim() : '';
        let weight = row[1] !== undefined ? parseInt(row[1]) : 1;

        if (rowIdx === 0 && (itemText.toLowerCase() === '항목' || itemText.toLowerCase() === 'item' || itemText.toLowerCase() === '이름' || itemText.toLowerCase() === 'name')) {
          return;
        }

        if (itemText) {
          parsedRows.push({
            text: itemText,
            weight: isNaN(weight) || weight < 1 ? 1 : weight
          });
        }
      });

      if (parsedRows.length === 0) {
        showToast(`[${fileName}] 유효한 룰렛 항목이 없습니다.`, '⚠️');
        return;
      }

      applyImportedRouletteRows(parsedRows, fileName);
    }

    async function applyImportedRouletteRows(parsedRows, fileName) {
      const existingCount = manualRouletteRows.filter(r => r.text && r.text.trim().length > 0).length;
      let shouldAppend = false;

      if (existingCount > 0) {
        shouldAppend = await showAppConfirm(
          `현재 룰렛에 작성된 항목이 ${existingCount}개 있습니다.\n가져온 ${parsedRows.length}개 항목을 어떻게 반영할까요?`,
          {
            title: '룰렛 항목 가져오기',
            confirmText: '기존 뒤에 누적',
            cancelText: '새로 덮어쓰기'
          }
        );
      }

      if (shouldAppend) {
        manualRouletteRows = manualRouletteRows.concat(parsedRows);
        showToast(`[${fileName}] 기존 항목에 ${parsedRows.length}개가 추가되었습니다! (총 ${manualRouletteRows.length}개)`, '➕');
      } else {
        manualRouletteRows = parsedRows;
        showToast(`[${fileName}] ${parsedRows.length}개 항목으로 덮어썼습니다!`, '🎉');
      }

      renderManualRouletteRows();
      drawRouletteWheel();
      scheduleSessionBackup();
    }

    exportRouletteHistoryBtn.addEventListener('click', () => {
      if (rouletteHistory.length === 0) {
        showToast('저장할 룰렛 당첨 내역이 없습니다.', '⚠️');
        return;
      }

      let csvContent = "\uFEFF회차,당첨 항목,시간\n";
      rouletteHistory.forEach(h => {
        csvContent += `${h.round || 1}회차,${sanitizeCsvCell(h.text || h.item || '')},${sanitizeCsvCell(h.time || '')}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0,19).replace(/[^0-9]/g, "");
      a.href = url;
      a.download = `chzzk_roulette_winners_history_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`총 ${rouletteHistory.length}건의 룰렛 당첨 내역을 저장했습니다.`, '📊');
    });

    function updateManualItemCount() {
      const items = getActiveRouletteItems();
      manualItemCountEl.innerText = `총 ${items.length}개 항목`;
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    let lastUncollectedDonationHintTime = 0;
    function handleLiveDonation(nickname, msg, uid, amount, timeStr) {
      const minReqCheese = Number(minDonationCheeseSelect ? minDonationCheeseSelect.value : 1000) || 1000;
      const cheeseAmt = Number(amount) || 0;
      if (cheeseAmt < minReqCheese) return;

      const trimmedMsg = msg && String(msg).trim().length > 0 ? String(msg).trim() : '';
      // 메시지가 없는 단순 후원은 룰렛 항목으로 추가하지 않고 무시
      if (!trimmedMsg || trimmedMsg === '(메시지 없음)') return;

      if (!isRouletteDonationCollecting) {
        // 룰렛 탭 또는 치즈 도네 연동 모드에서 수집 시작 버튼을 누르지 않은 상태일 때 오해 방지 안내 (8초 쿨타임)
        const isRouletteVisible = rouletteView && rouletteView.style.display !== 'none';
        if ((isRouletteVisible || currentRouletteMode === 'donation') && Date.now() - lastUncollectedDonationHintTime > 8000) {
          lastUncollectedDonationHintTime = Date.now();
          showToast(`💡 [${nickname || '익명'}]님의 치즈 후원이 도착했습니다. (도네 수집 대기 중이어서 룰렛에는 미등록)`, '🧀');
        }
        return;
      }

      donationRouletteList.push({
        nickname: nickname || '익명',
        msg: trimmedMsg,
        amount: cheeseAmt,
        time: timeStr || new Date().toLocaleTimeString('ko-KR'),
        uid: uid || ('anon_' + Date.now())
      });
      renderDonationFeed();
      scheduleSessionBackup();

      if (isRouletteSpinning) {
        showToast(`🧀 [${nickname || '익명'}] ${trimmedMsg} (${cheeseAmt.toLocaleString()} 치즈 수집됨 · 회전 종료 후 원판 반영)`, '🎉');
        return;
      }
      if (currentRouletteMode === 'donation') {
        drawRouletteWheel();
      }
      showToast(`🧀 [${nickname || '익명'}] ${trimmedMsg} (${cheeseAmt.toLocaleString()} 치즈 수집됨)`, '🎉');
    }

    function startRouletteDonation() {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showToast('방송에 먼저 연결해 주세요.', '⚠️');
        return;
      }

      isRouletteDonationCollecting = true;

      if (rouletteDonationStatusBadge) {
        rouletteDonationStatusBadge.className = 'live-badge-pill live';
        rouletteDonationStatusBadge.innerText = '🔴 수집 진행 중';
      }

      if (startRouletteDonationBtn) startRouletteDonationBtn.style.display = 'none';
      if (pauseRouletteDonationBtn) pauseRouletteDonationBtn.style.display = 'inline-flex';
      if (stopRouletteDonationBtn) stopRouletteDonationBtn.style.display = 'inline-flex';

      const durationSec = parseInt(rouletteDonationDurationSelect.value, 10) || 0;
      if (durationSec > 0 && rouletteDonationRemainingTime <= 0) {
        rouletteDonationRemainingTime = durationSec;
      }

      clearInterval(rouletteDonationTimerInterval);
      if (durationSec > 0 || rouletteDonationRemainingTime > 0) {
        if (rouletteDonationTimerDisplay) {
          rouletteDonationTimerDisplay.style.display = 'inline-block';
          updateRouletteDonationTimerUI();
        }
        rouletteDonationTimerInterval = setInterval(() => {
          rouletteDonationRemainingTime--;
          updateRouletteDonationTimerUI();
          if (rouletteDonationRemainingTime <= 0) {
            stopRouletteDonation(true);
            showToast('치즈 도네이션 수집이 종료되었습니다! 룰렛을 돌려보세요.', '⏰');
          }
        }, 1000);
      } else {
        if (rouletteDonationTimerDisplay) rouletteDonationTimerDisplay.style.display = 'none';
      }

      showToast('치즈 도네이션 수집을 시작했습니다!', '📡');
    }

    function updateRouletteDonationTimerUI() {
      if (!rouletteDonationTimerDisplay) return;
      const mins = Math.floor(Math.max(0, rouletteDonationRemainingTime) / 60);
      const secs = Math.max(0, rouletteDonationRemainingTime) % 60;
      rouletteDonationTimerDisplay.innerText = `남은 시간: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function pauseRouletteDonation() {
      isRouletteDonationCollecting = false;
      clearInterval(rouletteDonationTimerInterval);

      if (rouletteDonationStatusBadge) {
        rouletteDonationStatusBadge.className = 'live-badge-pill offline';
        rouletteDonationStatusBadge.innerText = '일시 정지';
      }

      if (startRouletteDonationBtn) {
        startRouletteDonationBtn.style.display = 'inline-flex';
        startRouletteDonationBtn.innerText = '▶️ 도네 수집 재개';
      }
      if (pauseRouletteDonationBtn) pauseRouletteDonationBtn.style.display = 'none';
      if (stopRouletteDonationBtn) stopRouletteDonationBtn.style.display = 'inline-flex';

      showToast('치즈 도네이션 수집이 일시 정지되었습니다.', '⏸️');
    }

    function stopRouletteDonation(isTimeExpired = false) {
      isRouletteDonationCollecting = false;
      clearInterval(rouletteDonationTimerInterval);
      rouletteDonationRemainingTime = 0;

      if (rouletteDonationStatusBadge) {
        rouletteDonationStatusBadge.className = 'live-badge-pill offline';
        rouletteDonationStatusBadge.innerText = isTimeExpired ? '수집 마감 (완료)' : '대기 중';
      }

      if (rouletteDonationTimerDisplay) {
        if (isTimeExpired) {
          rouletteDonationTimerDisplay.innerText = '남은 시간: 00:00';
        } else {
          rouletteDonationTimerDisplay.style.display = 'none';
        }
      }

      if (startRouletteDonationBtn) {
        startRouletteDonationBtn.style.display = 'inline-flex';
        startRouletteDonationBtn.innerText = '▶️ 도네 수집 시작';
      }
      if (pauseRouletteDonationBtn) pauseRouletteDonationBtn.style.display = 'none';
      if (stopRouletteDonationBtn) stopRouletteDonationBtn.style.display = 'none';

      if (!isTimeExpired) {
        showToast('치즈 도네이션 수집이 마감되었습니다.', '⏹️');
      }
    }

    if (startRouletteDonationBtn) startRouletteDonationBtn.addEventListener('click', startRouletteDonation);
    if (pauseRouletteDonationBtn) pauseRouletteDonationBtn.addEventListener('click', pauseRouletteDonation);
    if (stopRouletteDonationBtn) stopRouletteDonationBtn.addEventListener('click', () => stopRouletteDonation(false));

    function handleDonationSearchInput(val) {
      donationSearchQuery = (val || '').trim().toLowerCase();
      if (clearDonationSearchBtn) {
        clearDonationSearchBtn.style.display = donationSearchQuery.length > 0 ? 'block' : 'none';
      }
      renderDonationFeed();
    }

    function clearDonationSearch() {
      donationSearchQuery = '';
      if (donationSearchInput) {
        donationSearchInput.value = '';
        donationSearchInput.focus();
      }
      if (clearDonationSearchBtn) {
        clearDonationSearchBtn.style.display = 'none';
      }
      renderDonationFeed();
    }

    function updateDonationFeedHeaderBadges() {
      const activeItems = donationRouletteList.filter(d => !d.excluded);
      if (donationItemCountEl) {
        donationItemCountEl.innerText = activeItems.length.toLocaleString();
      }
      const query = (donationSearchQuery || '').trim().toLowerCase();
      if (donationActiveTabCount) {
        if (query) {
          const matchCount = donationRouletteList.filter(d => 
            (d.nickname || '').toLowerCase().includes(query) ||
            (d.msg || '').toLowerCase().includes(query) ||
            String(d.amount || '').includes(query)
          ).length;
          donationActiveTabCount.innerText = `${matchCount}/${donationRouletteList.length}`;
        } else {
          donationActiveTabCount.innerText = donationRouletteList.length.toLocaleString();
        }
      }
      if (donationRemovedTabCount) {
        if (query) {
          const matchCount = removedDonationRouletteList.filter(d => 
            (d.nickname || '').toLowerCase().includes(query) ||
            (d.msg || '').toLowerCase().includes(query) ||
            String(d.amount || '').includes(query)
          ).length;
          donationRemovedTabCount.innerText = `${matchCount}/${removedDonationRouletteList.length}`;
        } else {
          donationRemovedTabCount.innerText = removedDonationRouletteList.length.toLocaleString();
        }
      }
      if (donationTotalCheeseBadge) {
        const total = activeItems.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        donationTotalCheeseBadge.innerText = `🧀 ${total.toLocaleString()}`;
      }
      if (restoreLastDonationBtn) {
        restoreLastDonationBtn.style.display = removedDonationRouletteList.length > 0 ? 'inline-flex' : 'none';
      }
    }

    function renderDonationFeed() {
      updateDonationFeedHeaderBadges();
      if (!donationFeedList || !removedDonationFeedList) return;

      const query = (donationSearchQuery || '').trim().toLowerCase();

      // 1. Render Active Items List
      if (donationRouletteList.length === 0) {
        donationFeedList.innerHTML = '<div style="text-align: center; color: var(--text-sub); padding: 50px 0;"><div style="font-size: 26px; margin-bottom: 6px;">📋</div><div style="font-weight: 700; color: #94a3b8;">아직 수집된 도네이션이 없습니다.</div><div style="font-size: 11px; color: #64748b; margin-top: 4px;">도네 수집 시작 버튼을 누르거나 위에서 항목을 수동 추가해 주세요.</div></div>';
      } else {
        let displayList = donationRouletteList.map((d, originalIdx) => ({ d, originalIdx }));
        if (query) {
          displayList = displayList.filter(({ d }) => 
            (d.nickname || '').toLowerCase().includes(query) ||
            (d.msg || '').toLowerCase().includes(query) ||
            String(d.amount || '').includes(query)
          );
        }

        if (displayList.length === 0) {
          donationFeedList.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 40px 0;"><div style="font-size: 24px; margin-bottom: 6px;">🔍</div><div style="font-weight: 700; color: #94a3b8;">'${escapeHtml(donationSearchQuery)}' 검색 결과가 없습니다.</div><div style="font-size: 11px; color: #64748b; margin-top: 4px;">검색어를 확인하거나 지워보세요.</div></div>`;
        } else {
          const activeEl = document.activeElement;
          const activeIdx = activeEl && activeEl.dataset ? activeEl.dataset.idx : null;
          const isMsgFocus = activeEl && activeEl.classList.contains('donation-edit-msg-input');
          const isAmtFocus = activeEl && activeEl.classList.contains('donation-edit-amount-input');

          donationFeedList.innerHTML = '';
          displayList.forEach(({ d, originalIdx }) => {
            const idx = originalIdx;
            const div = document.createElement('div');
            div.className = 'donation-feed-row' + (d.excluded ? ' is-excluded' : '');
            const isManual = d.isManual || d.nickname === '수동 추가' || d.nickname === '스트리머(수동)';
            const nickBadgeStyle = isManual
              ? 'background: rgba(0, 255, 163, 0.15); color: var(--chzzk-green); border: 1px solid rgba(0, 255, 163, 0.35); font-weight: 700;'
              : 'background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1);';
            
            const rowBg = d.excluded 
              ? 'background: rgba(255, 255, 255, 0.02); opacity: 0.55; border: 1px dashed rgba(255,255,255,0.18);' 
              : (isManual ? 'background: rgba(0, 255, 163, 0.03); border: 1px solid rgba(0, 255, 163, 0.15);' : 'background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.06);');
            
            div.style.cssText = `padding: 5px 8px; display: flex; align-items: center; gap: 6px; border-radius: 4px; margin-bottom: 3px; ${rowBg} transition: all 0.15s;`;
            
            const excludedBadge = d.excluded ? '<span style="font-size: 9px; padding: 1px 4px; background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-radius: 3px; font-weight: 700;">제외됨</span>' : '';

            div.innerHTML = `
              <span style="font-size: 10px; color: #64748b; font-family: 'Outfit'; font-weight: 700; width: 22px; text-align: center; flex-shrink: 0;">#${idx + 1}</span>
              <span style="font-size: 10px; padding: 2px 5px; border-radius: 4px; ${nickBadgeStyle} max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0;" title="${escapeHtml(d.nickname || '익명')}">
                ${escapeHtml(d.nickname || '익명')}
              </span>
              ${excludedBadge}
              <input type="text" class="donation-edit-msg-input" data-idx="${idx}" value="${escapeHtml(d.msg)}" style="flex: 1; min-width: 75px; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; padding: 3px 6px; color: ${d.excluded ? '#94a3b8' : '#fff'}; text-decoration: ${d.excluded ? 'line-through' : 'none'}; font-size: 11px; outline: none;" placeholder="항목 내용">
              <div style="display: flex; align-items: center; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; padding: 0 4px; width: 78px; flex-shrink: 0; box-sizing: border-box;">
                <span style="color: #ffd700; font-size: 10px; margin-right: 2px;">🧀</span>
                <input type="number" class="donation-edit-amount-input" data-idx="${idx}" value="${d.amount}" min="1" step="100" style="width: 100%; background: transparent; border: none; color: ${d.excluded ? '#94a3b8' : 'var(--chzzk-green)'}; font-size: 11px; font-weight: 700; text-align: right; outline: none; padding: 2px 0;" title="후원 금액 / 가중치">
              </div>
              <button type="button" class="btn-chip" style="padding: 2px 6px; font-size: 10px; flex-shrink: 0; ${d.excluded ? 'background: rgba(0, 255, 163, 0.15); color: var(--chzzk-green); border-color: rgba(0, 255, 163, 0.35); font-weight: 700;' : 'background: rgba(255,255,255,0.06); color: #94a3b8;'}" onclick="toggleExcludeDonation(${idx})" title="${d.excluded ? '원판에 다시 포함' : '원판에서 일시 제외'}">
                ${d.excluded ? '↩️ 포함' : '제외'}
              </button>
              <button type="button" class="btn-chip btn-chip-danger" style="padding: 2px 6px; font-size: 10px; flex-shrink: 0;" onclick="removeDonationEntry(${idx})" title="이 항목 제거 (보관함으로 이동)">✕</button>
            `;

            const msgInput = div.querySelector('.donation-edit-msg-input');
            const amtInput = div.querySelector('.donation-edit-amount-input');

            msgInput.addEventListener('change', function() {
              const i = parseInt(this.dataset.idx, 10);
              if (donationRouletteList[i]) {
                donationRouletteList[i].msg = this.value.trim() || '(메시지 없음)';
                if (currentRouletteMode === 'donation') drawRouletteWheel();
                if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
              }
            });
            msgInput.addEventListener('keydown', function(e) {
              if (e.key === 'Enter') this.blur();
            });

            amtInput.addEventListener('change', function() {
              const i = parseInt(this.dataset.idx, 10);
              if (donationRouletteList[i]) {
                const val = Math.max(1, parseInt(this.value, 10) || 1000);
                donationRouletteList[i].amount = val;
                this.value = val;
                updateDonationFeedHeaderBadges();
                if (currentRouletteMode === 'donation') drawRouletteWheel();
                if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
              }
            });
            amtInput.addEventListener('keydown', function(e) {
              if (e.key === 'Enter') this.blur();
            });

            donationFeedList.appendChild(div);
          });

          // Restore focus if user was editing
          if (activeIdx !== null) {
            const selector = isMsgFocus ? `.donation-edit-msg-input[data-idx="${activeIdx}"]` : (isAmtFocus ? `.donation-edit-amount-input[data-idx="${activeIdx}"]` : null);
            if (selector) {
              const target = donationFeedList.querySelector(selector);
              if (target) {
                target.focus();
                const len = target.value.length;
                target.setSelectionRange(len, len);
              }
            }
          }
        }
      }

      // 2. Render Removed Items List (Trash / Archive)
      if (removedDonationRouletteList.length === 0) {
        removedDonationFeedList.innerHTML = '<div style="text-align: center; color: var(--text-sub); padding: 50px 0;"><div style="font-size: 26px; margin-bottom: 6px;">🗑️</div><div style="font-weight: 700; color: #94a3b8;">제거된 항목이 없습니다.</div><div style="font-size: 11px; color: #64748b; margin-top: 4px;">등록된 항목을 삭제하거나 룰렛에서 당첨되어 빠진 항목이 여기에 보관됩니다.</div></div>';
      } else {
        let displayList = removedDonationRouletteList.map((d, originalIdx) => ({ d, originalIdx }));
        if (query) {
          displayList = displayList.filter(({ d }) => 
            (d.nickname || '').toLowerCase().includes(query) ||
            (d.msg || '').toLowerCase().includes(query) ||
            String(d.amount || '').includes(query)
          );
        }

        if (displayList.length === 0) {
          removedDonationFeedList.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 40px 0;"><div style="font-size: 24px; margin-bottom: 6px;">🔍</div><div style="font-weight: 700; color: #94a3b8;">'${escapeHtml(donationSearchQuery)}' 검색 결과가 없습니다.</div><div style="font-size: 11px; color: #64748b; margin-top: 4px;">검색어를 확인하거나 지워보세요.</div></div>`;
        } else {
          removedDonationFeedList.innerHTML = '';
          displayList.forEach(({ d, originalIdx }) => {
            const idx = originalIdx;
            const div = document.createElement('div');
            div.className = 'donation-feed-row is-removed';
            const isManual = d.isManual || d.nickname === '수동 추가' || d.nickname === '스트리머(수동)';
            const nickBadgeStyle = isManual
              ? 'background: rgba(0, 255, 163, 0.15); color: var(--chzzk-green); border: 1px solid rgba(0, 255, 163, 0.35); font-weight: 700;'
              : 'background: rgba(255, 255, 255, 0.08); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.1);';
            
            div.style.cssText = 'padding: 5px 8px; display: flex; align-items: center; gap: 6px; border-radius: 4px; margin-bottom: 3px; background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.12);';

            div.innerHTML = `
              <span style="font-size: 10px; color: #64748b; font-family: 'Outfit'; font-weight: 700; width: 22px; text-align: center; flex-shrink: 0;">#${idx + 1}</span>
              <span style="font-size: 10px; padding: 2px 5px; border-radius: 4px; ${nickBadgeStyle} max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0;" title="${escapeHtml(d.nickname || '익명')}">
                ${escapeHtml(d.nickname || '익명')}
              </span>
              <span style="flex: 1; min-width: 80px; color: #94a3b8; font-size: 11px; text-decoration: line-through; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(d.msg)}">
                ${escapeHtml(d.msg)}
              </span>
              <div style="display: flex; align-items: center; padding: 0 4px; flex-shrink: 0;">
                <span style="color: #ffd700; font-size: 10px; margin-right: 2px;">🧀</span>
                <span style="color: #94a3b8; font-size: 11px; font-weight: 700;">${(d.amount || 1000).toLocaleString()}</span>
              </div>
              <button type="button" class="btn-chip" style="padding: 2px 8px; font-size: 10px; background: rgba(0, 255, 163, 0.15); color: var(--chzzk-green); border-color: rgba(0, 255, 163, 0.35); font-weight: 700; flex-shrink: 0;" onclick="restoreSingleRemovedDonation(${idx})" title="이 항목을 룰렛으로 복구">
                ↩️ 복구
              </button>
              <button type="button" class="btn-chip btn-chip-danger" style="padding: 2px 6px; font-size: 10px; flex-shrink: 0;" onclick="purgeSingleRemovedDonation(${idx})" title="영구 삭제">✕</button>
            `;
            removedDonationFeedList.appendChild(div);
          });
        }
      }
    }

    function toggleExcludeDonation(idx) {
      if (idx >= 0 && idx < donationRouletteList.length) {
        donationRouletteList[idx].excluded = !donationRouletteList[idx].excluded;
        renderDonationFeed();
        if (currentRouletteMode === 'donation') drawRouletteWheel();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
        const isEx = donationRouletteList[idx].excluded;
        showToast(isEx ? `'${donationRouletteList[idx].msg}' 항목이 원판에서 일시 제외되었습니다.` : `'${donationRouletteList[idx].msg}' 항목이 원판에 다시 포함되었습니다.`, isEx ? '⏸️' : '▶️');
      }
    }

    function removeDonationEntry(idx) {
      if (idx >= 0 && idx < donationRouletteList.length) {
        const removed = donationRouletteList.splice(idx, 1)[0];
        if (removed) {
          removedDonationRouletteList.push(removed);
        }
        renderDonationFeed();
        if (currentRouletteMode === 'donation') drawRouletteWheel();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
        if (removed) {
          showToast(`'${removed.msg}' 항목이 제거되었습니다. (언제든 복구 가능)`, '🗑️');
        }
      }
    }

    function restoreSingleRemovedDonation(idx) {
      if (idx >= 0 && idx < removedDonationRouletteList.length) {
        const restored = removedDonationRouletteList.splice(idx, 1)[0];
        if (restored) {
          restored.excluded = false;
          donationRouletteList.push(restored);
        }
        renderDonationFeed();
        if (currentRouletteMode === 'donation') drawRouletteWheel();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
        if (restored) {
          showToast(`'${restored.msg}' 항목이 룰렛으로 복구되었습니다.`, '↩️');
        }
      }
    }

    function purgeSingleRemovedDonation(idx) {
      if (idx >= 0 && idx < removedDonationRouletteList.length) {
        removedDonationRouletteList.splice(idx, 1);
        renderDonationFeed();
        showToast('항목이 보관함에서 영구 삭제되었습니다.', '🗑️');
      }
    }

    function restoreLastDonation() {
      if (removedDonationRouletteList.length === 0) {
        showToast('복구할 최근 제거 항목이 없습니다.', '⚠️');
        return;
      }
      const restored = removedDonationRouletteList.pop();
      if (restored) {
        restored.excluded = false;
        donationRouletteList.push(restored);
        renderDonationFeed();
        if (currentRouletteMode === 'donation') drawRouletteWheel();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
        showToast(`'${restored.msg}' 항목이 룰렛으로 복구되었습니다.`, '↩️');
      }
    }

    function restoreAllRemovedDonations() {
      if (removedDonationRouletteList.length === 0) {
        showToast('복구할 제거된 항목이 없습니다.', '⚠️');
        return;
      }
      const count = removedDonationRouletteList.length;
      removedDonationRouletteList.forEach(d => { d.excluded = false; });
      donationRouletteList.push(...removedDonationRouletteList);
      removedDonationRouletteList = [];
      renderDonationFeed();
      if (currentRouletteMode === 'donation') drawRouletteWheel();
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      showToast(`제거되었던 ${count}개 항목이 모두 룰렛으로 복구되었습니다!`, '↩️');
    }

    async function purgeAllRemovedDonations() {
      if (removedDonationRouletteList.length === 0) {
        showToast('비울 보관함 내역이 없습니다.', '⚠️');
        return;
      }
      const ok = await showAppConfirm('제거된 항목 보관함을 완전히 비우시겠습니까?\n영구 삭제되어 복구할 수 없습니다.', {
        title: '보관함 영구 비우기',
        confirmText: '영구 삭제',
        danger: true
      });
      if (ok) {
        removedDonationRouletteList = [];
        renderDonationFeed();
        scheduleSessionBackup();
        showToast('제거 항목 보관함이 완전히 비워졌습니다.', '🗑️');
      }
    }

    function switchDonationFeedView(view) {
      currentDonationFeedView = view;
      if (view === 'active') {
        if (donationFeedTabActiveBtn) {
          donationFeedTabActiveBtn.classList.add('active');
          donationFeedTabActiveBtn.style.color = '#fff';
        }
        if (donationFeedTabRemovedBtn) {
          donationFeedTabRemovedBtn.classList.remove('active');
          donationFeedTabRemovedBtn.style.color = '#94a3b8';
        }
        if (donationActiveActionBar) donationActiveActionBar.style.display = 'flex';
        if (donationRemovedActionBar) donationRemovedActionBar.style.display = 'none';
        if (donationFeedList) donationFeedList.style.display = 'block';
        if (removedDonationFeedList) removedDonationFeedList.style.display = 'none';
      } else {
        if (donationFeedTabActiveBtn) {
          donationFeedTabActiveBtn.classList.remove('active');
          donationFeedTabActiveBtn.style.color = '#94a3b8';
        }
        if (donationFeedTabRemovedBtn) {
          donationFeedTabRemovedBtn.classList.add('active');
          donationFeedTabRemovedBtn.style.color = '#fff';
        }
        if (donationActiveActionBar) donationActiveActionBar.style.display = 'none';
        if (donationRemovedActionBar) donationRemovedActionBar.style.display = 'flex';
        if (donationFeedList) donationFeedList.style.display = 'none';
        if (removedDonationFeedList) removedDonationFeedList.style.display = 'block';
      }
    }

    if (donationFeedTabActiveBtn) donationFeedTabActiveBtn.addEventListener('click', () => switchDonationFeedView('active'));
    if (donationFeedTabRemovedBtn) donationFeedTabRemovedBtn.addEventListener('click', () => switchDonationFeedView('removed'));
    if (restoreLastDonationBtn) restoreLastDonationBtn.addEventListener('click', restoreLastDonation);
    if (restoreAllRemovedDonationsBtn) restoreAllRemovedDonationsBtn.addEventListener('click', restoreAllRemovedDonations);
    if (purgeAllRemovedDonationsBtn) purgeAllRemovedDonationsBtn.addEventListener('click', purgeAllRemovedDonations);

    function addManualDonationItem(text, amount) {
      const trimmed = (text || '').trim();
      if (!trimmed) {
        showToast('추가할 항목명을 입력해 주세요.', '⚠️');
        return;
      }
      const cheeseAmt = Math.max(1, parseInt(amount, 10) || 1000);
      donationRouletteList.push({
        nickname: '수동 추가',
        msg: trimmed,
        amount: cheeseAmt,
        time: new Date().toLocaleTimeString(),
        uid: 'manual_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        isManual: true,
        excluded: false
      });
      renderDonationFeed();
      scheduleSessionBackup();
      if (currentRouletteMode === 'donation' && !isRouletteSpinning) {
        drawRouletteWheel();
      }
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      showToast(`'${trimmed}' 항목(🧀 ${cheeseAmt.toLocaleString()})이 추가되었습니다.`, '➕');
      if (donationFeedList) {
        donationFeedList.scrollTop = donationFeedList.scrollHeight;
      }
    }

    if (addManualDonationBtn) {
      addManualDonationBtn.addEventListener('click', () => {
        const msg = manualDonationMsgInput ? manualDonationMsgInput.value : '';
        const amt = manualDonationAmountInput ? manualDonationAmountInput.value : 1000;
        addManualDonationItem(msg, amt);
        if (manualDonationMsgInput) {
          manualDonationMsgInput.value = '';
          manualDonationMsgInput.focus();
        }
      });
    }
    if (manualDonationMsgInput) {
      manualDonationMsgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (addManualDonationBtn) addManualDonationBtn.click();
        }
      });
    }

    if (copyDonationsBtn) {
      copyDonationsBtn.addEventListener('click', () => {
        if (donationRouletteList.length === 0) {
          showToast('복사할 도네이션 내역이 없습니다.', '⚠️');
          return;
        }
        const query = (donationSearchQuery || '').trim().toLowerCase();
        const targetList = query
          ? donationRouletteList.filter(d =>
              (d.nickname || '').toLowerCase().includes(query) ||
              (d.msg || '').toLowerCase().includes(query) ||
              String(d.amount || '').includes(query)
            )
          : donationRouletteList;

        if (targetList.length === 0) {
          showToast('현재 검색어와 일치하는 복사 대상이 없습니다.', '⚠️');
          return;
        }
        const text = targetList.map((d, i) => `${i + 1}. [${d.nickname || '익명'}] ${d.msg} (🧀 ${d.amount.toLocaleString()})${d.excluded ? ' [제외]' : ''}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
          showToast(query ? `검색된 ${targetList.length}건의 목록이 클립보드에 복사되었습니다.` : '수집된 전체 목록이 클립보드에 복사되었습니다.', '📋');
        }).catch(() => {
          showToast('클립보드 복사에 실패했습니다.', '⚠️');
        });
      });
    }

    async function handleClearAllDonations() {
      if (isRouletteDonationCollecting) {
        showToast('수집 진행 중에는 초기화할 수 없습니다. 먼저 수집을 마감해 주세요.', '⚠️');
        return;
      }
      if (donationRouletteList.length === 0) {
        showToast('비울 도네이션 내역이 없습니다.', '⚠️');
        return;
      }
      const query = (donationSearchQuery || '').trim().toLowerCase();
      if (query) {
        const matched = [];
        const remaining = [];
        donationRouletteList.forEach(d => {
          const isMatch = (d.nickname || '').toLowerCase().includes(query) ||
                          (d.msg || '').toLowerCase().includes(query) ||
                          String(d.amount || '').includes(query);
          if (isMatch) matched.push(d);
          else remaining.push(d);
        });
        if (matched.length === 0) {
          showToast('비울 검색 결과 항목이 없습니다.', '⚠️');
          return;
        }
        const okMatch = await showAppConfirm(
          `현재 검색된 '${donationSearchQuery}' 결과 ${matched.length}건만 비우시겠습니까?\n(제거 보관함으로 이동되며, 검색되지 않은 나머지 ${remaining.length}건은 안전하게 유지됩니다)`,
          { title: '검색 결과 비우기', confirmText: '선택 비우기', danger: true }
        );
        if (okMatch) {
          removedDonationRouletteList.push(...matched);
          donationRouletteList = remaining;
          clearDonationSearch();
          drawRouletteWheel();
          scheduleSessionBackup();
          if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
          showToast(`검색된 ${matched.length}건이 제거 보관함으로 이동되었습니다. (복구 가능)`, '🗑️');
        }
        return;
      }
      const okAll = await showAppConfirm('수집된 도네이션 룰렛 목록을 모두 비우시겠습니까?\n(제거 보관함으로 이동되어 복구 가능합니다)', {
        title: '도네이션 목록 전체 비우기',
        confirmText: '전체 비우기',
        danger: true
      });
      if (okAll) {
        removedDonationRouletteList.push(...donationRouletteList);
        donationRouletteList = [];
        stopRouletteDonation(false);
        renderDonationFeed();
        drawRouletteWheel();
        scheduleSessionBackup();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
        showToast('수집된 도네이션 목록이 비워졌습니다. (복구 가능)', '🗑️');
      }
    }

    if (clearDonationsBtn) clearDonationsBtn.addEventListener('click', handleClearAllDonations);
    if (clearDonationsFeedBtn) clearDonationsFeedBtn.addEventListener('click', handleClearAllDonations);

    if (donationWeightToggle) {
      donationWeightToggle.addEventListener('change', () => {
        if (currentRouletteMode === 'donation') drawRouletteWheel();
      });
    }
    if (donationMergeDuplicateToggle) {
      donationMergeDuplicateToggle.addEventListener('change', () => {
        if (currentRouletteMode === 'donation') drawRouletteWheel();
        if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
      });
    }
    if (minDonationCheeseSelect) {
      minDonationCheeseSelect.addEventListener('change', () => {
        if (currentRouletteMode === 'donation') drawRouletteWheel();
      });
    }

    function getActiveRouletteItems() {
      if (currentRouletteMode === 'manual') {
        return manualRouletteRows
          .filter(r => r.text && r.text.trim().length > 0)
          .map((r, idx) => ({
            id: idx,
            text: r.text.trim(),
            rawText: r.text.trim(),
            weight: r.weight || 1,
            count: 1
          }));
      } else {
        const useWeight = donationWeightToggle ? donationWeightToggle.checked : true;
        const mergeDuplicate = donationMergeDuplicateToggle ? donationMergeDuplicateToggle.checked : true;
        const minReq = Number(minDonationCheeseSelect ? minDonationCheeseSelect.value : 1000) || 1000;

        // 스트리머가 직접 수동 추가한 항목(isManual)은 최소 후원 치즈 기준(minReq)과 무관하게 원판에 포함
        const filtered = donationRouletteList.filter(d => !d.excluded && (d.isManual || d.amount >= minReq));

        if (!mergeDuplicate) {
          return filtered.map((d, idx) => {
            let rawText = d.msg && d.msg.trim().length > 0 ? d.msg.trim() : '(메시지 없음)';
            let text = rawText;
            let weight = useWeight ? Math.max(1, Math.round(d.amount / 1000)) : 1;
            return {
              id: idx,
              text: text,
              rawText: rawText,
              weight: weight,
              count: 1,
              totalAmount: d.amount,
              donor: d
            };
          });
        }

        // Merge duplicate messages into a single roulette slice
        const mergedMap = new Map();
        filtered.forEach((d) => {
          let text = d.msg && d.msg.trim().length > 0 ? d.msg.trim() : '(메시지 없음)';
          if (!mergedMap.has(text)) {
            mergedMap.set(text, {
              text: text,
              totalAmount: 0,
              count: 0,
              donors: []
            });
          }
          const item = mergedMap.get(text);
          item.totalAmount += d.amount;
          item.count += 1;
          item.donors.push(d);
        });

        let idx = 0;
        const items = [];
        mergedMap.forEach((entry, text) => {
          let weight = 1;
          if (useWeight) {
            weight = Math.max(1, Math.round(entry.totalAmount / 1000));
          } else {
            // When cheese amount weighting is off, each donation contributes 1 weight
            weight = entry.count;
          }

          let displayText = text;
          if (entry.count > 1) {
            displayText = `${text} (x${entry.count})`;
          }

          items.push({
            id: idx++,
            text: displayText,
            rawText: text,
            weight: weight,
            count: entry.count,
            totalAmount: entry.totalAmount,
            donors: entry.donors,
            donor: entry.donors[0]
          });
        });

        return items;
      }
    }

    window.handleDonationSearchInput = handleDonationSearchInput;
    window.clearDonationSearch = clearDonationSearch;
    window.toggleExcludeDonation = toggleExcludeDonation;
    window.removeDonationEntry = removeDonationEntry;
    window.restoreSingleRemovedDonation = restoreSingleRemovedDonation;
    window.purgeSingleRemovedDonation = purgeSingleRemovedDonation;
    window.restoreLastDonation = restoreLastDonation;
    window.restoreAllRemovedDonations = restoreAllRemovedDonations;
    window.purgeAllRemovedDonations = purgeAllRemovedDonations;
    window.handleClearAllDonations = handleClearAllDonations;
    window.addManualDonationItem = addManualDonationItem;

    // Audio SFX Synthesizer
    let audioCtx = null;

    function playTickSound() {
      if (window.appGlobalMuted || !rouletteSoundToggle.checked) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900 + Math.random() * 200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.035);
      } catch (e) {}
    }

    function playFanfareSound() {
      if (window.appGlobalMuted || !rouletteSoundToggle.checked) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.1);
          gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + i * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + i * 0.1);
          osc.stop(audioCtx.currentTime + i * 0.1 + 0.45);
        });
      } catch (e) {}
    }

    let lockedSpinItems = null;

    function drawRouletteWheel(overrideItems = null) {
      const items = overrideItems || ((isRouletteSpinning && lockedSpinItems) ? lockedSpinItems : getActiveRouletteItems());
      const canvasWidth = rouletteCanvas.width;
      const canvasHeight = rouletteCanvas.height;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = centerX - 12;

      rouletteCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (items.length < 2) {
        rouletteCtx.save();
        rouletteCtx.beginPath();
        rouletteCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        rouletteCtx.fillStyle = '#121826';
        rouletteCtx.fill();
        rouletteCtx.lineWidth = 6;
        rouletteCtx.strokeStyle = '#26334d';
        rouletteCtx.stroke();

        // Decorative subtle inner ring
        rouletteCtx.beginPath();
        rouletteCtx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
        rouletteCtx.lineWidth = 2;
        rouletteCtx.strokeStyle = 'rgba(0, 255, 163, 0.15)';
        rouletteCtx.stroke();

        // Guide text shifted below center mascot hub to eliminate overlap
        rouletteCtx.fillStyle = '#e2e8f0';
        rouletteCtx.font = 'bold 17px Pretendard, sans-serif';
        rouletteCtx.textAlign = 'center';
        rouletteCtx.textBaseline = 'middle';
        rouletteCtx.fillText('항목을 2개 이상 입력하세요', centerX, centerY + 85);

        rouletteCtx.fillStyle = '#64748b';
        rouletteCtx.font = '13px Pretendard, sans-serif';
        rouletteCtx.fillText('좌측에서 항목 칸을 추가하거나 프리셋을 선택하세요', centerX, centerY + 115);
        rouletteCtx.restore();

        spinRouletteBtn.disabled = true;
        currentRouletteItemPreview.innerText = items.length === 0 
          ? '좌측에서 항목 칸을 추가하거나 프리셋을 선택해주세요.' 
          : '룰렛을 돌리려면 최소 2개 이상의 항목이 필요합니다.';
        return;
      }

      spinRouletteBtn.disabled = isRouletteSpinning;
      const rawCount = donationRouletteList ? donationRouletteList.length : 0;
      if (currentRouletteMode === 'donation' && donationMergeDuplicateToggle && donationMergeDuplicateToggle.checked && items.length !== rawCount) {
        currentRouletteItemPreview.innerText = `현재 총 ${items.length}개 칸 등록됨 (후원 ${rawCount}건 자동 합산)`;
      } else {
        currentRouletteItemPreview.innerText = `현재 총 ${items.length}개 항목 등록됨`;
      }

      const totalWeight = items.reduce((acc, it) => acc + it.weight, 0);
      let currentAngle = currentWheelAngle;

      items.forEach((item, index) => {
        const sliceAngle = (item.weight / totalWeight) * 2 * Math.PI;
        const colorObj = WHEEL_COLORS[index % WHEEL_COLORS.length];

        rouletteCtx.save();
        rouletteCtx.beginPath();
        rouletteCtx.moveTo(centerX, centerY);
        rouletteCtx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        rouletteCtx.closePath();

        rouletteCtx.fillStyle = colorObj.bg;
        rouletteCtx.fill();

        rouletteCtx.lineWidth = 2.5;
        rouletteCtx.strokeStyle = '#0a0c10';
        rouletteCtx.stroke();

        const midAngle = currentAngle + sliceAngle / 2;
        rouletteCtx.save();
        rouletteCtx.translate(centerX, centerY);
        rouletteCtx.rotate(midAngle);
        rouletteCtx.textAlign = 'right';
        rouletteCtx.textBaseline = 'middle';
        rouletteCtx.fillStyle = colorObj.text;

        let fontSize = 15;
        if (items.length > 24) fontSize = 10;
        else if (items.length > 16) fontSize = 12;
        else if (items.length > 8) fontSize = 14;

        rouletteCtx.font = `bold ${fontSize}px Pretendard, sans-serif`;

        let displayText = item.text;
        const maxTextWidth = radius - 70;
        if (rouletteCtx.measureText(displayText).width > maxTextWidth) {
          while (rouletteCtx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 1) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }

        rouletteCtx.fillText(displayText, radius - 35, 0);
        rouletteCtx.restore();

        rouletteCtx.restore();

        currentAngle += sliceAngle;
      });

      rouletteCtx.save();
      rouletteCtx.beginPath();
      rouletteCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      rouletteCtx.lineWidth = 8;
      rouletteCtx.strokeStyle = '#121620';
      rouletteCtx.stroke();

      rouletteCtx.beginPath();
      rouletteCtx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
      rouletteCtx.lineWidth = 2;
      rouletteCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      rouletteCtx.stroke();
      rouletteCtx.restore();
    }

    function easeOutQuart(x) {
      return 1 - Math.pow(1 - x, 4);
    }

    function getSliceIndexAtTopPointer(angle, items) {
      const totalWeight = items.reduce((acc, it) => acc + it.weight, 0);
      let pointerAngle = (1.5 * Math.PI - angle) % (2 * Math.PI);
      if (pointerAngle < 0) pointerAngle += 2 * Math.PI;

      let accumulatedAngle = 0;
      for (let i = 0; i < items.length; i++) {
        const sliceAngle = (items[i].weight / totalWeight) * 2 * Math.PI;
        if (pointerAngle >= accumulatedAngle && pointerAngle < accumulatedAngle + sliceAngle) {
          return i;
        }
        accumulatedAngle += sliceAngle;
      }
      return 0;
    }

    function spinRoulette() {
      const items = getActiveRouletteItems();
      if (items.length < 2) {
        showToast('룰렛을 돌리려면 최소 2개 이상의 항목이 필요합니다.', '⚠️');
        return;
      }
      if (isRouletteSpinning) return;

      lockedSpinItems = items.map(it => ({ ...it }));
      isRouletteSpinning = true;
      spinRouletteBtn.disabled = true;
      spinBtnText.innerText = '룰렛 회전 중...';

      const durationSec = Number(spinDurationSelect.value) || 5;
      const durationMs = durationSec * 1000;

      const startAngle = currentWheelAngle;
      const fullRotations = (5 + Math.floor(secureRandom() * 5)) * 2 * Math.PI;
      const randomExtraAngle = secureRandom() * 2 * Math.PI;
      const targetAngle = startAngle + fullRotations + randomExtraAngle;

      const startTime = performance.now();
      lastTickSliceIndex = -1;

      function animateSpin(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const easeProgress = easeOutQuart(progress);

        currentWheelAngle = startAngle + (targetAngle - startAngle) * easeProgress;
        const spinItems = lockedSpinItems || items;
        drawRouletteWheel(spinItems);

        const currentSliceIdx = getSliceIndexAtTopPointer(currentWheelAngle, spinItems);
        if (currentSliceIdx !== lastTickSliceIndex) {
          lastTickSliceIndex = currentSliceIdx;
          playTickSound();
        }

        if (progress < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          const winningIndex = getSliceIndexAtTopPointer(currentWheelAngle, spinItems);
          currentWinnerObject = spinItems[winningIndex];
          isRouletteSpinning = false;
          lockedSpinItems = null;
          spinRouletteBtn.disabled = false;
          spinBtnText.innerText = '룰렛 돌리기 (SPIN)';

          showRouletteWinner(currentWinnerObject);
          drawRouletteWheel();
        }
      }

      requestAnimationFrame(animateSpin);
    }

    spinRouletteBtn.addEventListener('click', spinRoulette);

    function showRouletteWinner(winner) {
      rouletteRound++;
      playFanfareSound();
      launchConfetti();

      const displayText = winner.rawText || winner.text;
      rouletteWinnerTitle.innerText = displayText;
      if (winner.count && winner.count > 1) {
        rouletteWinnerSub.innerText = `🎉 제 ${rouletteRound}회차 룰렛 당첨! (총 ${winner.count}건 후원 합산 / 🧀 ${(winner.totalAmount || 0).toLocaleString()} 치즈)`;
      } else if (winner.totalAmount) {
        rouletteWinnerSub.innerText = `🎉 제 ${rouletteRound}회차 룰렛 당첨이 완료되었습니다! (🧀 ${winner.totalAmount.toLocaleString()} 치즈)`;
      } else {
        rouletteWinnerSub.innerText = `🎉 제 ${rouletteRound}회차 룰렛 당첨이 완료되었습니다!`;
      }
      rouletteWinnerModal.classList.add('active');

      const now = new Date().toLocaleTimeString('ko-KR');
      rouletteHistory.unshift({
        round: rouletteRound,
        text: winner.count && winner.count > 1 ? `${displayText} (x${winner.count} 합산)` : displayText,
        time: now
      });
      renderRouletteHistory();

      if (autoRemoveWonItemToggle.checked) {
        removeWinningItem(winner);
        winner._alreadyAutoRemoved = true;
        if (removeAndCloseRouletteModalBtn) removeAndCloseRouletteModalBtn.style.display = 'none';
      } else {
        winner._alreadyAutoRemoved = false;
        if (removeAndCloseRouletteModalBtn) removeAndCloseRouletteModalBtn.style.display = '';
      }
      scheduleSessionBackup();
    }

    function toggleDrawerCardSection(sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.classList.toggle('collapsed');
      }
    }
    window.toggleDrawerCardSection = toggleDrawerCardSection;

    function renderRouletteHistory() {
      const countBadge = document.getElementById('rouletteHistoryCountBadge');
      if (countBadge) {
        countBadge.innerText = `${rouletteHistory.length}건`;
      }

      if (rouletteHistory.length === 0) {
        rouletteHistoryBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align:center; color: var(--text-sub); font-size: 12px; padding: 45px 0;">
              <div style="font-size: 26px; margin-bottom: 6px;">📜</div>
              <div style="font-weight: 700; color: #94a3b8;">아직 룰렛 당첨 내역이 없습니다.</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">룰렛을 돌리면 당첨 회차와 항목이 여기에 실시간으로 기록됩니다.</div>
            </td>
          </tr>
        `;
        return;
      }

      rouletteHistoryBody.innerHTML = '';
      rouletteHistory.forEach(h => {
        const tr = document.createElement('tr');
        tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s;';
        tr.innerHTML = `
          <td style="text-align: center; padding: 12px 8px; vertical-align: middle;">
            <span class="rank-num" style="display: inline-block; padding: 2px 7px; background: rgba(0, 255, 163, 0.12); color: var(--chzzk-green); border: 1px solid rgba(0, 255, 163, 0.3); border-radius: 6px; font-weight: 800; font-size: 11px;">
              ${h.round}
            </span>
          </td>
          <td style="padding: 12px 10px; font-weight: 700; color: #fff; font-size: 13px; line-height: 1.5; word-break: break-all; white-space: normal; vertical-align: middle;">
            ${escapeHtml(h.text)}
          </td>
          <td style="color: var(--text-sub); font-size: 11px; padding: 12px 10px; white-space: nowrap; text-align: right; vertical-align: middle;">
            ${h.time}
          </td>
        `;
        rouletteHistoryBody.appendChild(tr);
      });
    }

    clearRouletteHistoryBtn.addEventListener('click', async () => {
      if (rouletteHistory.length === 0) return;
      const ok = await showAppConfirm('룰렛 당첨 히스토리를 초기화하시겠습니까?', {
        title: '히스토리 초기화',
        confirmText: '초기화',
        danger: true
      });
      if (ok) {
        rouletteHistory = [];
        rouletteRound = 0;
        renderRouletteHistory();
        scheduleSessionBackup();
      }
    });

    function removeWinningItem(winner) {
      if (!winner) return;
      if (currentRouletteMode === 'manual') {
        const removeIdx = manualRouletteRows.findIndex(r => r.text && r.text.trim() === (winner.rawText || winner.text));
        if (removeIdx !== -1) {
          removeManualRouletteRow(removeIdx);
        }
      } else {
        const targetText = winner.rawText || (winner.text ? winner.text.replace(/\s*\(x\d+\)$/, '') : '');
        const removeIdx = donationRouletteList.findIndex(d => {
          if (d.excluded) return false;
          const t = d.msg && d.msg.trim().length > 0 ? d.msg.trim() : (d.nickname || '(메시지 없음)');
          return t === targetText;
        });
        if (removeIdx !== -1) {
          const removed = donationRouletteList.splice(removeIdx, 1)[0];
          if (removed) {
            removedDonationRouletteList.push(removed);
          }
          renderDonationFeed();
          drawRouletteWheel();
          if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
          if (winner.count && winner.count > 1) {
            showToast(`'${targetText}' 1건 제거 보관함 이동 (남은 수량: ${winner.count - 1}건)`, '🗑️');
          } else {
            showToast(`'${targetText}' 항목이 제거 보관함으로 이동되었습니다. (언제든 복구 가능)`, '🗑️');
          }
        }
      }
    }

    closeRouletteModalBtn.addEventListener('click', () => {
      rouletteWinnerModal.classList.remove('active');
    });

    removeAndCloseRouletteModalBtn.addEventListener('click', () => {
      if (currentWinnerObject && !currentWinnerObject._alreadyAutoRemoved) {
        currentWinnerObject._alreadyAutoRemoved = true;
        removeWinningItem(currentWinnerObject);
      }
      rouletteWinnerModal.classList.remove('active');
    });

    // Confetti Engine
    let confettiParticles = [];
    let isConfettiRunning = false;

    function launchConfetti() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
      confettiParticles = [];

      const colors = ['#00ffa3', '#a855f7', '#ff0080', '#0070f3', '#f59e0b', '#fff'];

      for (let i = 0; i < 140; i++) {
        confettiParticles.push({
          x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
          y: confettiCanvas.height / 2 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.8) * 22,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRotation: (Math.random() - 0.5) * 12,
          opacity: 1
        });
      }

      if (!isConfettiRunning) {
        isConfettiRunning = true;
        animateConfetti();
      }
    }

    function animateConfetti() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let aliveCount = 0;

      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45;
        p.vx *= 0.98;
        p.rotation += p.vRotation;
        p.opacity -= 0.007;

        if (p.opacity > 0) {
          aliveCount++;
          confettiCtx.save();
          confettiCtx.translate(p.x, p.y);
          confettiCtx.rotate((p.rotation * Math.PI) / 180);
          confettiCtx.fillStyle = p.color;
          confettiCtx.globalAlpha = Math.max(0, p.opacity);
          confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          confettiCtx.restore();
        }
      });

      if (aliveCount > 0) {
        requestAnimationFrame(animateConfetti);
      } else {
        isConfettiRunning = false;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }
