    // ==========================================
    // ⚡ VOLTORB FLIP BATTLE SYSTEM ENGINE (세트 매치 & 턴 제한 배틀)
    // ==========================================
    const gamePhaseBadge = document.getElementById('gamePhaseBadge');
    const gameMatchFormatSelect = document.getElementById('gameMatchFormatSelect');
    const gameLevelSelect = document.getElementById('gameLevelSelect');
    const gameTurnLimitSelect = document.getElementById('gameTurnLimitSelect');
    const gameVoteDurationSelect = document.getElementById('gameVoteDurationSelect');

    const gameStreamerScoreText = document.getElementById('gameStreamerScoreText');
    const gameStreamerStatusTag = document.getElementById('gameStreamerStatusTag');
    const gameStreamerSetWinsBadge = document.getElementById('gameStreamerSetWinsBadge');
    const gameViewersScoreText = document.getElementById('gameViewersScoreText');
    const gameViewersStatusTag = document.getElementById('gameViewersStatusTag');
    const gameViewersSetWinsBadge = document.getElementById('gameViewersSetWinsBadge');
    const gameCurrentCoinsText = document.getElementById('gameCurrentCoinsText');
    const gameRemainingTargetCards = document.getElementById('gameRemainingTargetCards');
    const gameTurnProgressBadge = document.getElementById('gameTurnProgressBadge');
    const gameMatchRoundBadge = document.getElementById('gameMatchRoundBadge');

    const startGameStreamerBtn = document.getElementById('startGameStreamerBtn');
    const startGameViewersBtn = document.getElementById('startGameViewersBtn');
    const gameCashOutBtn = document.getElementById('gameCashOutBtn');
    const resetGameBtn = document.getElementById('resetGameBtn');
    const toggleMemoModeBtn = document.getElementById('toggleMemoModeBtn');
    const memoModeStateText = document.getElementById('memoModeStateText');
    const showShowdownResultBtn = document.getElementById('showShowdownResultBtn');

    const gameBoardRoundLevelBadge = document.getElementById('gameBoardRoundLevelBadge');
    const gameInstructionText = document.getElementById('gameInstructionText');
    const voltorbBoardContainer = document.getElementById('voltorbBoardContainer');

    const gameViewersVotingHud = document.getElementById('gameViewersVotingHud');
    const gameHudLiveDot = document.getElementById('gameHudLiveDot');
    const gameHudTitle = document.getElementById('gameHudTitle');
    const gameHudSubTitle = document.getElementById('gameHudSubTitle');
    const gameVotingTimerText = document.getElementById('gameVotingTimerText');
    const gameVotingTimerFill = document.getElementById('gameVotingTimerFill');
    const gameTopVotedCandidatesList = document.getElementById('gameTopVotedCandidatesList');

    const gameResultModal = document.getElementById('gameResultModal');
    const gameResultChampionTrophy = document.getElementById('gameResultChampionTrophy');
    const gameModalSubHeader = document.getElementById('gameModalSubHeader');
    const gameResultWinnerHeader = document.getElementById('gameResultWinnerHeader');
    const gameModalSetScoreBanner = document.getElementById('gameModalSetScoreBanner');
    const gameModalSetScoreText = document.getElementById('gameModalSetScoreText');
    const gameModalStreamerCoins = document.getElementById('gameModalStreamerCoins');
    const gameModalStreamerDetail = document.getElementById('gameModalStreamerDetail');
    const gameModalViewersCoins = document.getElementById('gameModalViewersCoins');
    const gameModalViewersDetail = document.getElementById('gameModalViewersDetail');
    const gameModalSummaryText = document.getElementById('gameModalSummaryText');
    const gameModalNextRoundBtn = document.getElementById('gameModalNextRoundBtn');
    const closeGameResultModalBtn = document.getElementById('closeGameResultModalBtn');

    // Voltorb Flip Level Configuration Table
    const VOLTORB_LEVEL_CONFIGS = {
      1: { total2: 3, total3: 1, voltorbs: 6 },
      2: { total2: 4, total3: 2, voltorbs: 7 },
      3: { total2: 4, total3: 3, voltorbs: 8 },
      4: { total2: 3, total3: 5, voltorbs: 8 },
      5: { total2: 5, total3: 5, voltorbs: 10 },
      6: { total2: 3, total3: 7, voltorbs: 10 },
      7: { total2: 7, total3: 4, voltorbs: 10 },
      8: { total2: 6, total3: 6, voltorbs: 10 }
    };

    let gameLevel = 1;
    let gameTurnLimit = 0; // 0 = unlimited, 3, 5, 7
    let streamerTurnCount = 0;
    let viewersTurnCount = 0;
    let battleEndReason = ''; // 'cleared' | 'exploded' | 'turn_limit' | 'cashed_out'

    // Match / Set State (단판 / 3선2승 / 5선3승 / 7선4승)
    let matchFormat = 'single'; // 'single' | 'bo3' | 'bo5' | 'bo7'
    let matchTargetWins = 1;
    let matchCurrentRound = 1;
    let matchStreamerWins = 0;
    let matchViewersWins = 0;
    let isMatchConcluded = false;
    let lastRoundWinner = 'none'; // 'streamer' | 'viewers' | 'draw'

    let gamePhase = 'idle'; // 'idle' | 'streamer' | 'viewers' | 'ended'
    let isMemoMode = false;
    let activeMemoTool = 1; // 1 | 2 | 3 | 'v'

    let boardTiles = []; // 25 elements: { index, numIdx, row, col, coord, val, flipped, memos }
    let rowSums = [0, 0, 0, 0, 0];
    let rowVoltorbs = [0, 0, 0, 0, 0];
    let colSums = [0, 0, 0, 0, 0];
    let colVoltorbs = [0, 0, 0, 0, 0];
    let totalTargetCards = 0;
    let currentBoardCoins = 0;
    let remainingTargetCardsCount = 0;

    let streamerResult = { score: 0, flippedCount: 0, status: 'none' };
    let viewersResult = { score: 0, flippedCount: 0, status: 'none' };

    let currentTurnTimerInterval = null;
    let currentTurnRemainingSeconds = 30.0;
    let currentTurnTotalDuration = 30.0;
    let currentVoteCounts = {}; // coordKey -> count
    let currentVoteUsers = new Map(); // uid -> coordKey

    function initNewMatch(resetSets = true) {
      if (resetSets) {
        matchCurrentRound = 1;
        matchStreamerWins = 0;
        matchViewersWins = 0;
        isMatchConcluded = false;
      }

      matchFormat = gameMatchFormatSelect ? gameMatchFormatSelect.value : 'single';
      matchTargetWins = matchFormat === 'bo3' ? 2 : (matchFormat === 'bo5' ? 3 : (matchFormat === 'bo7' ? 4 : 1));

      // Update Match Round & Set Score Badges
      if (matchFormat === 'single') {
        if (gameStreamerSetWinsBadge) gameStreamerSetWinsBadge.style.display = 'none';
        if (gameViewersSetWinsBadge) gameViewersSetWinsBadge.style.display = 'none';
        if (gameMatchRoundBadge) gameMatchRoundBadge.innerText = '단판 승부';
      } else {
        const fmtName = matchFormat === 'bo3' ? '3판 2선승제 (BO3)' : (matchFormat === 'bo5' ? '5판 3선승제 (BO5)' : '7판 4선승제 (BO7)');
        if (gameStreamerSetWinsBadge) {
          gameStreamerSetWinsBadge.style.display = 'inline-flex';
          gameStreamerSetWinsBadge.innerText = `⭐ ${matchStreamerWins}/${matchTargetWins}승`;
        }
        if (gameViewersSetWinsBadge) {
          gameViewersSetWinsBadge.style.display = 'inline-flex';
          gameViewersSetWinsBadge.innerText = `⭐ ${matchViewersWins}/${matchTargetWins}승`;
        }
        if (gameMatchRoundBadge) {
          gameMatchRoundBadge.innerText = `⚔️ ${matchCurrentRound}세트 [${fmtName}]`;
        }
      }

      initNewGameRound(false);
    }

    function initNewGameRound(keepScores = false) {
      clearInterval(currentTurnTimerInterval);
      gameTurnLimit = parseInt(gameTurnLimitSelect.value, 10) || 0;
      streamerTurnCount = 0;
      viewersTurnCount = 0;
      battleEndReason = '';

      if (!keepScores) {
        streamerResult = { score: 0, flippedCount: 0, status: 'none' };
        viewersResult = { score: 0, flippedCount: 0, status: 'none' };
        gameStreamerScoreText.innerText = '0';
        gameStreamerStatusTag.className = 'badge-tag';
        gameStreamerStatusTag.style.background = 'rgba(255,255,255,0.08)';
        gameStreamerStatusTag.style.color = 'var(--text-sub)';
        gameStreamerStatusTag.innerText = '대기';

        gameViewersScoreText.innerText = '0';
        gameViewersStatusTag.className = 'badge-tag';
        gameViewersStatusTag.style.background = 'rgba(255,255,255,0.08)';
        gameViewersStatusTag.style.color = 'var(--text-sub)';
        gameViewersStatusTag.innerText = '대기';

        showShowdownResultBtn.style.display = 'none';
      }

      gameLevel = parseInt(gameLevelSelect.value, 10) || 1;
      gameBoardRoundLevelBadge.innerText = `Lv.${gameLevel}`;
      gamePhase = 'idle';
      gamePhaseBadge.className = 'live-badge-pill offline';
      gamePhaseBadge.innerText = '대기 중';
      gameInstructionText.innerText = matchFormat === 'single'
        ? '[배틀 시작] 버튼을 눌러 게임을 시작하세요. (1턴씩 번갈아 카드를 오픈합니다)'
        : `[배틀 시작] 버튼을 눌러 ${matchCurrentRound}세트를 시작하세요! (목표: ${matchTargetWins}승)`;
      gameViewersVotingHud.style.display = 'none';

      const starterGroup = document.getElementById('voltorbStarterBtnsGroup');
      if (starterGroup) starterGroup.style.display = 'flex';

      generateVoltorbBoard(gameLevel);
      updateBoardStatsUI();
      renderBoardUI();
    }

    function generateVoltorbBoard(lvl) {
      const cfg = VOLTORB_LEVEL_CONFIGS[lvl] || VOLTORB_LEVEL_CONFIGS[1];
      const count2 = cfg.total2;
      const count3 = cfg.total3;
      const count0 = cfg.voltorbs;
      const count1 = 25 - (count2 + count3 + count0);

      const pool = [
        ...Array(count0).fill(0),
        ...Array(count2).fill(2),
        ...Array(count3).fill(3),
        ...Array(count1).fill(1)
      ];

      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      boardTiles = [];
      rowSums = [0, 0, 0, 0, 0];
      rowVoltorbs = [0, 0, 0, 0, 0];
      colSums = [0, 0, 0, 0, 0];
      colVoltorbs = [0, 0, 0, 0, 0];

      const colLetters = ['A', 'B', 'C', 'D', 'E'];

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          const val = pool[idx];
          const coord = `${colLetters[c]}${r + 1}`;
          const numIdx = idx + 1;

          boardTiles.push({
            index: idx,
            numIdx: numIdx,
            row: r,
            col: c,
            coord: coord,
            val: val,
            flipped: false,
            memos: { 1: false, 2: false, 3: false, v: false }
          });

          rowSums[r] += val;
          if (val === 0) rowVoltorbs[r]++;
          colSums[c] += val;
          if (val === 0) colVoltorbs[c]++;
        }
      }

      totalTargetCards = count2 + count3;
      remainingTargetCardsCount = totalTargetCards;
      currentBoardCoins = 0;
    }

    function renderBoardUI() {
      if (!voltorbBoardContainer) return;
      voltorbBoardContainer.innerHTML = '';

      for (let r = 0; r < 5; r++) {
        // 5 Tiles for this row
        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          const tile = boardTiles[idx];
          const tileEl = document.createElement('div');
          tileEl.className = `voltorb-tile ${tile.flipped ? 'flipped' : ''}`;
          tileEl.id = `voltorbTile_${idx}`;
          tileEl.onclick = () => handleTileClick(idx);

          tileEl.innerHTML = `
            <div class="voltorb-tile-inner">
              <div class="voltorb-tile-front">
                <span class="voltorb-coord-badge">${tile.coord}</span>
                <div class="voltorb-memo-grid">
                  <span class="memo-mark m-1 ${tile.memos[1] ? 'active' : ''}">1</span>
                  <span class="memo-mark m-2 ${tile.memos[2] ? 'active' : ''}">2</span>
                  <span class="memo-mark m-3 ${tile.memos[3] ? 'active' : ''}">3</span>
                  <span class="memo-mark m-v ${tile.memos['v'] ? 'active' : ''}"><img src="voltorb-icon.png" alt="V"></span>
                </div>
              </div>
              <div class="voltorb-tile-back val-${tile.val}">
                ${tile.val === 0 ? '<img src="voltorb-icon.png" alt="찌리리공" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">' : (tile.val === 1 ? '1' : `x${tile.val}`)}
              </div>
            </div>
          `;
          voltorbBoardContainer.appendChild(tileEl);
        }

        // Row Hint Card (on the right)
        const rowHint = document.createElement('div');
        rowHint.className = `voltorb-hint-card hint-color-${r}`;
        rowHint.innerHTML = `
          <div class="hint-row-val">
            <span class="hint-coin-icon">🪙</span>
            <span>${String(rowSums[r]).padStart(2, '0')}</span>
          </div>
          <div class="hint-row-val">
            <span class="hint-voltorb-icon"><img src="voltorb-icon.png" alt="찌리리공"></span>
            <span>${rowVoltorbs[r]}</span>
          </div>
        `;
        voltorbBoardContainer.appendChild(rowHint);
      }

      // Bottom 5 Column Hint Cards
      for (let c = 0; c < 5; c++) {
        const colHint = document.createElement('div');
        colHint.className = `voltorb-hint-card hint-color-${c}`;
        colHint.innerHTML = `
          <div class="hint-row-val">
            <span class="hint-coin-icon">🪙</span>
            <span>${String(colSums[c]).padStart(2, '0')}</span>
          </div>
          <div class="hint-row-val">
            <span class="hint-voltorb-icon"><img src="voltorb-icon.png" alt="찌리리공"></span>
            <span>${colVoltorbs[c]}</span>
          </div>
        `;
        voltorbBoardContainer.appendChild(colHint);
      }

      // Bottom-Right Corner Panel (Memo Selector)
      const cornerPanel = document.createElement('div');
      cornerPanel.className = 'voltorb-corner-panel';
      cornerPanel.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px;">
          <button type="button" class="memo-select-btn ${isMemoMode && activeMemoTool === 1 ? 'active' : ''}" onclick="selectMemoTool(1)" title="1번 메모 (다시 누르면 메모 모드 해제)">1</button>
          <button type="button" class="memo-select-btn ${isMemoMode && activeMemoTool === 2 ? 'active' : ''}" onclick="selectMemoTool(2)" style="color: #f59e0b;" title="2번 메모 (다시 누르면 메모 모드 해제)">2</button>
          <button type="button" class="memo-select-btn ${isMemoMode && activeMemoTool === 3 ? 'active' : ''}" onclick="selectMemoTool(3)" style="color: #38bdf8;" title="3번 메모 (다시 누르면 메모 모드 해제)">3</button>
          <button type="button" class="memo-select-btn ${isMemoMode && activeMemoTool === 'v' ? 'active' : ''}" onclick="selectMemoTool('v')" title="찌리리공 메모 (다시 누르면 메모 모드 해제)"><img src="voltorb-icon.png" alt="V" style="width: 14px; height: 14px; object-fit: contain;"></button>
        </div>
      `;
      voltorbBoardContainer.appendChild(cornerPanel);
    }

    function selectMemoTool(tool) {
      if (isMemoMode && activeMemoTool === tool) {
        // 이미 활성화된 메모 도구를 다시 누르면 메모 모드 OFF!
        isMemoMode = false;
        memoModeStateText.innerText = 'OFF';
        memoModeStateText.style.color = 'var(--text-sub)';
        showToast('메모 모드가 해제되었습니다. (타일을 클릭하면 뒤집힙니다)', '🛑');
      } else {
        // 새로 켜거나 다른 메모 도구로 전환
        isMemoMode = true;
        activeMemoTool = tool;
        memoModeStateText.innerText = 'ON';
        memoModeStateText.style.color = 'var(--chzzk-green)';
        const toolName = (tool === 'v' ? '찌리리공 폭탄' : tool);
        showToast(`메모 모드 [${toolName}] 활성화! (타일을 클릭해 마킹 / 다시 누르면 해제)`, '📝');
      }
      renderBoardUI();
    }

    function updateBoardStatsUI() {
      currentBoardCoins = (streamerResult.score || 0) + (viewersResult.score || 0);
      gameCurrentCoinsText.innerText = currentBoardCoins.toLocaleString();
      gameRemainingTargetCards.innerText = Math.max(0, remainingTargetCardsCount);

      if (gameTurnProgressBadge) {
        if (gameTurnLimit === 0) {
          gameTurnProgressBadge.innerText = '모드: ♾️ 무제한 데스매치';
          gameTurnProgressBadge.style.color = '#38bdf8';
        } else {
          gameTurnProgressBadge.innerText = `진행: 👑스트리머(${streamerTurnCount}/${gameTurnLimit}) · 👥시청자(${viewersTurnCount}/${gameTurnLimit})`;
          gameTurnProgressBadge.style.color = '#ffd700';
        }
      }

      if (matchFormat !== 'single') {
        if (gameStreamerSetWinsBadge) gameStreamerSetWinsBadge.innerText = `⭐ ${matchStreamerWins}/${matchTargetWins}승`;
        if (gameViewersSetWinsBadge) gameViewersSetWinsBadge.innerText = `⭐ ${matchViewersWins}/${matchTargetWins}승`;
      }
    }

    function handleTileClick(idx) {
      if (gamePhase !== 'streamer') return;
      const tile = boardTiles[idx];
      if (!tile || tile.flipped) return;

      if (isMemoMode) {
        tile.memos[activeMemoTool] = !tile.memos[activeMemoTool];
        renderBoardUI();
        return;
      }

      flipTile(tile, 'streamer');
    }

    function flipTile(tile, player = 'streamer') {
      clearInterval(currentTurnTimerInterval);
      if (tile.flipped) return;
      tile.flipped = true;

      if (player === 'streamer') {
        streamerResult.flippedCount++;
        streamerTurnCount++;
      } else {
        viewersResult.flippedCount++;
        viewersTurnCount++;
      }

      if (tile.val === 0) {
        // 💥 Voltorb Exploded!
        battleEndReason = 'exploded';
        updateBoardStatsUI();
        renderBoardUI();

        if (player === 'streamer') {
          streamerResult.score = 0;
          streamerResult.status = 'exploded';
          viewersResult.status = 'survived';

          gameStreamerScoreText.innerText = '0';
          gameStreamerStatusTag.className = 'badge-tag';
          gameStreamerStatusTag.style.background = 'rgba(239, 68, 68, 0.2)';
          gameStreamerStatusTag.style.color = '#ef4444';
          gameStreamerStatusTag.innerText = '💥 폭발 패배';

          gameViewersStatusTag.className = 'badge-tag';
          gameViewersStatusTag.style.background = 'rgba(56, 189, 248, 0.2)';
          gameViewersStatusTag.style.color = '#38bdf8';
          gameViewersStatusTag.innerText = '🏆 승리!';

          showToast(`💥 ${getStreamerName()}님이 찌리리공을 밟아 폭발했습니다! 시청자 연합 승리!`, '💣');
        } else {
          viewersResult.score = 0;
          viewersResult.status = 'exploded';
          streamerResult.status = 'survived';

          gameViewersScoreText.innerText = '0';
          gameViewersStatusTag.className = 'badge-tag';
          gameViewersStatusTag.style.background = 'rgba(239, 68, 68, 0.2)';
          gameViewersStatusTag.style.color = '#ef4444';
          gameViewersStatusTag.innerText = '💥 폭발 패배';

          gameStreamerStatusTag.className = 'badge-tag';
          gameStreamerStatusTag.style.background = 'rgba(255, 215, 0, 0.2)';
          gameStreamerStatusTag.style.color = '#ffd700';
          gameStreamerStatusTag.innerText = '🏆 승리!';

          showToast(`💥 시청자 연합이 찌리리공을 밟아 폭발했습니다! ${getStreamerName()} 승리!`, '💣');
        }

        endBattle();
        revealEntireBoard();
        return;
      }

      // Safe tile: 1, 2, 3
      if (player === 'streamer') {
        streamerResult.score = (streamerResult.score === 0 ? tile.val : (tile.val > 1 ? streamerResult.score * tile.val : streamerResult.score + 1));
        gameStreamerScoreText.innerText = streamerResult.score.toLocaleString();
      } else {
        viewersResult.score = (viewersResult.score === 0 ? tile.val : (tile.val > 1 ? viewersResult.score * tile.val : viewersResult.score + 1));
        gameViewersScoreText.innerText = viewersResult.score.toLocaleString();
      }

      if (tile.val >= 2) {
        remainingTargetCardsCount--;
      }

      updateBoardStatsUI();
      renderBoardUI();

      // Check Clear Condition
      if (remainingTargetCardsCount <= 0) {
        battleEndReason = 'cleared';
        streamerResult.status = 'cleared';
        viewersResult.status = 'cleared';
        showToast('🎉 보드의 모든 2배·3배 카드를 찾아 클리어했습니다!', '🏆');
        endBattle();
        revealEntireBoard();
        return;
      }

      // Check Turn Limit Condition
      if (gameTurnLimit > 0 && streamerTurnCount >= gameTurnLimit && viewersTurnCount >= gameTurnLimit) {
        battleEndReason = 'turn_limit';
        streamerResult.status = 'turn_end';
        viewersResult.status = 'turn_end';
        showToast(`🏁 ${gameTurnLimit}턴 배틀이 모두 종료되었습니다! 최종 점수를 판정합니다.`, '🏆');
        endBattle();
        revealEntireBoard();
        return;
      }

      // Turn Alternation: Lock phase during 1.2s transition to prevent multi-click race conditions!
      if (player === 'streamer') {
        gamePhase = 'transition';
        showToast(`👑 ${getStreamerName()}: ${tile.coord} [${tile.val === 1 ? '1' : 'x' + tile.val}] 오픈! 시청자 턴으로 전환됩니다.`, '➡️');
        setTimeout(() => {
          if (gamePhase !== 'ended' && gamePhase !== 'idle') startViewersTurn();
        }, 1200);
      } else {
        gamePhase = 'transition';
        showToast(`👥 시청자 연합: ${tile.coord} [${tile.val === 1 ? '1' : 'x' + tile.val}] 오픈! ${getStreamerName()} 턴으로 전환됩니다.`, '➡️');
        setTimeout(() => {
          if (gamePhase !== 'ended' && gamePhase !== 'idle') startStreamerTurn();
        }, 1200);
      }
    }

    function revealEntireBoard() {
      boardTiles.forEach(t => { t.flipped = true; });
      renderBoardUI();
    }

    // --- Streamer Phase ---
    function startStreamerTurn() {
      if (gamePhase === 'ended') return;
      clearInterval(currentTurnTimerInterval);

      // Hide starter buttons when game starts
      const starterGroup = document.getElementById('voltorbStarterBtnsGroup');
      if (starterGroup) starterGroup.style.display = 'none';

      gamePhase = 'streamer';
      gamePhaseBadge.className = 'live-badge-pill live';
      gamePhaseBadge.style.background = 'linear-gradient(135deg, #eab308, #ca8a04)';
      gamePhaseBadge.innerText = gameTurnLimit > 0 
        ? `👑 ${getStreamerName()} 턴 (${streamerTurnCount + 1}/${gameTurnLimit})`
        : `👑 1단계: ${getStreamerName()} 턴`;
      gameInstructionText.innerText = `${getStreamerName()} 턴: 타일을 1장 선택하세요 (시간 초과 시 랜덤 자동 오픈됩니다)`;

      gameStreamerStatusTag.className = 'badge-tag';
      gameStreamerStatusTag.style.background = 'rgba(255, 215, 0, 0.2)';
      gameStreamerStatusTag.style.color = '#ffd700';
      gameStreamerStatusTag.innerText = gameTurnLimit > 0 ? `${streamerTurnCount + 1}턴 선택 중` : '선택 중';

      gameViewersStatusTag.className = 'badge-tag';
      gameViewersStatusTag.style.background = 'rgba(255, 255, 255, 0.08)';
      gameViewersStatusTag.style.color = 'var(--text-sub)';
      gameViewersStatusTag.innerText = '대기';

      // Setup HUD for Streamer Turn
      gameViewersVotingHud.style.display = 'block';
      gameHudLiveDot.style.background = '#ffd700';
      gameHudTitle.style.color = '#ffd700';
      gameHudTitle.innerText = gameTurnLimit > 0 
        ? `👑 ${getStreamerName()} 턴 [${streamerTurnCount + 1}/${gameTurnLimit}턴]`
        : `👑 ${getStreamerName()} 턴 (타일 1장 선택)`;
      gameHudSubTitle.innerText = '(타일을 클릭하세요. 시간 초과 시 랜덤 오픈)';
      gameTopVotedCandidatesList.innerHTML = `<div style="color: #ffd700; text-align: center; padding: 4px 0; font-weight: 700;">${getStreamerName()}님이 신중하게 카드를 고르는 중입니다...</div>`;

      currentTurnTotalDuration = parseFloat(gameVoteDurationSelect.value) || 30.0;
      currentTurnRemainingSeconds = currentTurnTotalDuration;
      renderVoltorbTurnTimerUI('streamer');

      const stepMs = 100;
      currentTurnTimerInterval = setInterval(() => {
        currentTurnRemainingSeconds -= (stepMs / 1000);
        if (currentTurnRemainingSeconds <= 0) {
          currentTurnRemainingSeconds = 0;
          clearInterval(currentTurnTimerInterval);
          // Streamer Timeout -> Pick random unflipped card
          showToast(`⏰ ${getStreamerName()} 시간 초과! 랜덤 카드가 자동으로 오픈됩니다!`, '⚠️');
          const unflipped = boardTiles.filter(t => !t.flipped);
          if (unflipped.length > 0) {
            const randomTile = unflipped[Math.floor(Math.random() * unflipped.length)];
            flipTile(randomTile, 'streamer');
          }
        }
        renderVoltorbTurnTimerUI('streamer');
      }, stepMs);
    }

    // --- Viewers Phase ---
    function startViewersTurn() {
      if (gamePhase === 'ended') return;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showToast('시청자 투표 턴을 진행하려면 방송에 먼저 연결해 주세요.', '⚠️');
      }
      clearInterval(currentTurnTimerInterval);

      // Hide starter buttons when game starts
      const starterGroup = document.getElementById('voltorbStarterBtnsGroup');
      if (starterGroup) starterGroup.style.display = 'none';

      gamePhase = 'viewers';
      gamePhaseBadge.className = 'live-badge-pill live';
      gamePhaseBadge.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
      gamePhaseBadge.innerText = gameTurnLimit > 0 
        ? `👥 시청자 투표 턴 (${viewersTurnCount + 1}/${gameTurnLimit})`
        : '👥 2단계: 시청자 투표 턴';
      gameInstructionText.innerText = '👥 시청자 투표 턴: 채팅창에 좌표(A1~E5) 또는 [stop] 을 입력하세요!';

      gameViewersStatusTag.className = 'badge-tag';
      gameViewersStatusTag.style.background = 'rgba(56, 189, 248, 0.2)';
      gameViewersStatusTag.style.color = '#38bdf8';
      gameViewersStatusTag.innerText = gameTurnLimit > 0 ? `${viewersTurnCount + 1}턴 투표 중` : '투표 진행 중';

      gameStreamerStatusTag.className = 'badge-tag';
      gameStreamerStatusTag.style.background = 'rgba(255, 255, 255, 0.08)';
      gameStreamerStatusTag.style.color = 'var(--text-sub)';
      gameStreamerStatusTag.innerText = '대기';

      // Setup HUD for Viewers Turn
      currentVoteUsers.clear();
      currentVoteCounts = {};
      gameViewersVotingHud.style.display = 'block';
      gameHudLiveDot.style.background = '#38bdf8';
      gameHudTitle.style.color = '#38bdf8';
      gameHudTitle.innerText = gameTurnLimit > 0 
        ? `👥 시청자 실시간 좌표 투표 [${viewersTurnCount + 1}/${gameTurnLimit}턴]`
        : '👥 시청자 실시간 좌표 투표 중';
      gameHudSubTitle.innerHTML = '(채팅 입력: 좌표 <b>A1~E5</b> 또는 홀드 <b>stop</b>)';

      currentTurnTotalDuration = parseFloat(gameVoteDurationSelect.value) || 30.0;
      currentTurnRemainingSeconds = currentTurnTotalDuration;
      renderVoltorbTurnTimerUI('viewers');
      renderVotingBarsUI();

      const stepMs = 100;
      currentTurnTimerInterval = setInterval(() => {
        currentTurnRemainingSeconds -= (stepMs / 1000);
        if (currentTurnRemainingSeconds <= 0) {
          currentTurnRemainingSeconds = 0;
          clearInterval(currentTurnTimerInterval);
          executeViewersVotedTile();
        }
        renderVoltorbTurnTimerUI('viewers');
      }, stepMs);
    }

    function renderVoltorbTurnTimerUI(turn) {
      if (!gameVotingTimerText || !gameVotingTimerFill) return;
      gameVotingTimerText.innerText = `${Math.max(0, currentTurnRemainingSeconds).toFixed(1)}s`;
      const fillPct = (Math.max(0, currentTurnRemainingSeconds) / currentTurnTotalDuration) * 100;
      gameVotingTimerFill.style.width = `${fillPct}%`;

      if (turn === 'streamer') {
        gameVotingTimerFill.style.background = 'linear-gradient(90deg, #ffd700, #ff8800)';
      } else {
        gameVotingTimerFill.style.background = 'linear-gradient(90deg, #38bdf8, #00ffa3)';
      }
    }

    function handleLiveGameChatVote(nickname, msg, uid, now) {
      if (gamePhase !== 'viewers') return;
      if (!msg) return;

      const clean = msg.trim().toUpperCase().replace(/\s+/g, '');
      
      // Check for STOP (홀드/그만두기) command
      if (clean === 'STOP' || clean === '스톱' || clean === '스탑' || clean === '그만' || clean === 'HOLD' || clean === '0') {
        currentVoteUsers.set(uid, 'STOP');
        recomputeVoteCounts();
        renderVotingBarsUI();
        return;
      }

      let targetTile = null;
      const coordMatch = clean.match(/^([A-E])([1-5])$/);
      if (coordMatch) {
        const colLetter = coordMatch[1];
        const rowNum = parseInt(coordMatch[2], 10) - 1;
        const colNum = ['A', 'B', 'C', 'D', 'E'].indexOf(colLetter);
        const idx = rowNum * 5 + colNum;
        targetTile = boardTiles[idx];
      } else if (/^[1-9]$|^1[0-9]$|^2[0-5]$/.test(clean)) {
        const num = parseInt(clean, 10);
        targetTile = boardTiles[num - 1];
      }

      if (targetTile && !targetTile.flipped) {
        currentVoteUsers.set(uid, targetTile.coord);
        recomputeVoteCounts();
        renderVotingBarsUI();
      }
    }

    function recomputeVoteCounts() {
      currentVoteCounts = {};
      for (const [uid, coord] of currentVoteUsers.entries()) {
        currentVoteCounts[coord] = (currentVoteCounts[coord] || 0) + 1;
      }
    }

    function renderVotingBarsUI() {
      if (!gameTopVotedCandidatesList || gamePhase !== 'viewers') return;

      const totalVotes = currentVoteUsers.size;
      const sortedCandidates = Object.entries(currentVoteCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      if (sortedCandidates.length === 0) {
        gameTopVotedCandidatesList.innerHTML = `<div style="color: var(--text-sub); text-align: center; padding: 4px 0;">시청자들이 채팅창에 좌표(예: A1, B3) 또는 [stop] 을 입력하면 실시간 집계됩니다.</div>`;
        return;
      }

      let html = '';
      sortedCandidates.forEach(([coord, count], i) => {
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isStop = (coord === 'STOP');
        const labelText = isStop ? '🛑 STOP (홀드)' : coord;
        const barBg = isStop 
          ? 'linear-gradient(90deg, #ef4444, #f97316)' 
          : (i === 0 ? 'linear-gradient(90deg, #ffd700, #ff8800)' : 'linear-gradient(90deg, #38bdf8, #0284c7)');
        const labelColor = isStop ? '#ef4444' : (i === 0 ? '#ffd700' : '#fff');

        html += `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; color: ${labelColor}; min-width: ${isStop ? '95px' : '28px'}; font-size: ${isStop ? '11px' : '12px'};">${labelText}</span>
            <div style="flex: 1; height: 12px; background: rgba(255,255,255,0.08); border-radius: 6px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: ${barBg}; transition: width 0.15s;"></div>
            </div>
            <span style="font-size: 10px; color: var(--text-sub); width: 60px; text-align: right;">${count}표 (${pct}%)</span>
          </div>
        `;
      });
      gameTopVotedCandidatesList.innerHTML = html;
    }

    function executeViewersVotedTile() {
      if (gamePhase !== 'viewers') return;

      const unflipped = boardTiles.filter(t => !t.flipped);
      if (unflipped.length === 0) {
        endBattle();
        return;
      }

      let maxVotes = 0;
      let topCandidates = [];

      // Choices include unflipped coords AND 'STOP' if voted
      const validChoices = [...unflipped.map(t => t.coord)];
      if ((currentVoteCounts['STOP'] || 0) > 0) {
        validChoices.push('STOP');
      }

      for (const choice of validChoices) {
        const votes = currentVoteCounts[choice] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          topCandidates = [choice];
        } else if (votes === maxVotes && maxVotes > 0) {
          topCandidates.push(choice);
        }
      }

      let selectedChoice = null;
      if (maxVotes > 0 && topCandidates.length > 0) {
        if (topCandidates.length > 1) {
          showToast(`⚡ 동점 발생 (${maxVotes}표)! 동점 항목 [${topCandidates.join(', ')}] 중 1개가 무작위 추첨됩니다.`, '🎲');
        }
        selectedChoice = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      } else {
        showToast('시청자 투표가 없어 미오픈 타일 중 1개가 무작위로 오픈됩니다!', '🎲');
        const randomTile = unflipped[Math.floor(Math.random() * unflipped.length)];
        selectedChoice = randomTile.coord;
      }

      if (selectedChoice === 'STOP') {
        showToast(`🛑 시청자 연합이 [STOP]에 최다 투표하여 ${viewersResult.score} 코인을 안전하게 확보하고 마감했습니다!`, '💰');
        cashOutGame();
      } else {
        const targetTile = boardTiles.find(t => t.coord === selectedChoice);
        if (targetTile) {
          flipTile(targetTile, 'viewers');
        }
      }
    }

    let voltorbInitialStarter = 'streamer';

    // Cash Out (그만둔다)
    async function cashOutGame() {
      if (gamePhase === 'ended' || gamePhase === 'idle' || gamePhase === 'transition') return;
      if (gamePhase === 'streamer' && streamerResult.score < viewersResult.score) {
        const ok = await showAppConfirm(
          `현재 점수(${streamerResult.score}점)가 시청자 연합(${viewersResult.score}점)보다 낮습니다.\n지금 그만두면 이번 세트는 패배 처리됩니다. 정말 마감하시겠습니까?`,
          { title: 'STOP (게임 마감 확인)', confirmText: '그래도 마감', cancelText: '계속 진행', danger: true }
        );
        if (!ok || gamePhase !== 'streamer') {
          return;
        }
      }
      clearInterval(currentTurnTimerInterval);
      battleEndReason = 'cashed_out';

      if (gamePhase === 'streamer') {
        streamerResult.status = 'cashed_out';
        showToast(`🛑 ${getStreamerName()}님이 ${streamerResult.score} 코인을 안전하게 확보하고 마감했습니다!`, '💰');
      } else if (gamePhase === 'viewers') {
        viewersResult.status = 'cashed_out';
        showToast(`🛑 시청자 연합이 ${viewersResult.score} 코인을 안전하게 확보하고 마감했습니다!`, '💰');
      }

      endBattle();
      revealEntireBoard();
    }

    function endBattle() {
      gamePhase = 'ended';
      clearInterval(currentTurnTimerInterval);
      gameViewersVotingHud.style.display = 'none';

      // Determine Round Winner
      if (streamerResult.status === 'exploded' && viewersResult.status !== 'exploded') {
        lastRoundWinner = 'viewers';
      } else if (viewersResult.status === 'exploded' && streamerResult.status !== 'exploded') {
        lastRoundWinner = 'streamer';
      } else if (streamerResult.score > viewersResult.score) {
        lastRoundWinner = 'streamer';
      } else if (viewersResult.score > streamerResult.score) {
        lastRoundWinner = 'viewers';
      } else {
        lastRoundWinner = 'draw';
      }

      // Update Set Scores
      if (lastRoundWinner === 'streamer') matchStreamerWins++;
      else if (lastRoundWinner === 'viewers') matchViewersWins++;

      // Check Match Conclusion
      if (matchFormat === 'single') {
        isMatchConcluded = true;
      } else if (matchStreamerWins >= matchTargetWins || matchViewersWins >= matchTargetWins) {
        isMatchConcluded = true;
      } else {
        isMatchConcluded = false;
      }

      updateBoardStatsUI();

      gamePhaseBadge.className = 'live-badge-pill offline';
      gamePhaseBadge.innerText = isMatchConcluded ? '매치 종료' : `${matchCurrentRound}세트 종료`;
      gameInstructionText.innerText = isMatchConcluded 
        ? '매치가 종료되었습니다! [🏆 최종 결과 발표] 버튼을 눌러 승자를 확인하세요.'
        : `${matchCurrentRound}세트가 종료되었습니다. 다음 라운드를 진행하세요.`;
      showShowdownResultBtn.style.display = 'inline-flex';

      const starterGroup = document.getElementById('voltorbStarterBtnsGroup');
      if (starterGroup) starterGroup.style.display = 'flex';

      showShowdownResult();
    }

    // --- Showdown Result Modal ---
    function showShowdownResult() {
      gameResultModal.classList.add('active');
      const sName = getStreamerName();
      const modalStreamerLabel = document.getElementById('gameModalStreamerLabel');
      if (modalStreamerLabel) modalStreamerLabel.innerText = `👑 ${sName}`;

      gameModalStreamerCoins.innerText = streamerResult.score.toLocaleString();
      gameModalStreamerDetail.innerText = `${streamerResult.flippedCount}개 타일 오픈 (${streamerResult.status === 'cleared' ? '🏆 클리어' : streamerResult.status === 'exploded' ? '💥 폭발' : streamerResult.status === 'turn_end' ? '🏁 턴 완료' : streamerResult.status === 'survived' ? '🛡️ 생존' : '🛑 안전 마감'})`;

      gameModalViewersCoins.innerText = viewersResult.score.toLocaleString();
      gameModalViewersDetail.innerText = `${viewersResult.flippedCount}개 타일 오픈 (${viewersResult.status === 'cleared' ? '🏆 클리어' : viewersResult.status === 'exploded' ? '💥 폭발' : viewersResult.status === 'turn_end' ? '🏁 턴 완료' : viewersResult.status === 'survived' ? '🛡️ 생존' : '🛑 안전 마감'})`;

      // Multi-Set Banner UI
      if (matchFormat !== 'single') {
        gameModalSetScoreBanner.style.display = 'block';
        gameModalSetScoreText.innerText = `👑 ${matchStreamerWins} : ${matchViewersWins} 👥 (목표: ${matchTargetWins}선승)`;
      } else {
        gameModalSetScoreBanner.style.display = 'none';
      }

      const fmtName = matchFormat === 'bo3' ? '3판 2선승제' : (matchFormat === 'bo5' ? '5판 3선승제' : (matchFormat === 'bo7' ? '7판 4선승제' : '단판 승부'));

      if (isMatchConcluded) {
        // Final Champion Decided!
        gameResultChampionTrophy.innerText = '🏆';
        if (matchStreamerWins > matchViewersWins) {
          gameResultWinnerHeader.innerText = matchFormat === 'single' ? `${sName}의 대승리!` : `👑 ${sName} 최종 매치 우승!`;
          gameResultWinnerHeader.style.color = '#ffd700';
          gameModalSummaryText.innerText = matchFormat === 'single'
            ? `${sName}님이 ${streamerResult.score.toLocaleString()} 코인을 획득하여 승리했습니다!`
            : `[${fmtName}] ${sName}님이 세트 스코어 ${matchStreamerWins} : ${matchViewersWins}로 최종 우승을 차지했습니다!`;
        } else if (matchViewersWins > matchStreamerWins) {
          gameResultWinnerHeader.innerText = matchFormat === 'single' ? '시청자 연합의 집단지성 승리!' : `👥 시청자 연합 최종 매치 우승!`;
          gameResultWinnerHeader.style.color = '#38bdf8';
          gameModalSummaryText.innerText = matchFormat === 'single'
            ? `시청자 연합이 ${viewersResult.score.toLocaleString()} 코인을 획득하여 승리했습니다!`
            : `[${fmtName}] 시청자 연합이 세트 스코어 ${matchViewersWins} : ${matchStreamerWins}로 최종 우승을 차지했습니다!`;
        } else {
          gameResultWinnerHeader.innerText = '황금빛 무승부!';
          gameResultWinnerHeader.style.color = '#00ffa3';
          gameModalSummaryText.innerText = `양측이 동점으로 매치를 마감했습니다!`;
        }

        gameModalNextRoundBtn.innerText = '🔄 새로운 매치 시작';
        gameModalNextRoundBtn.onclick = () => {
          gameResultModal.classList.remove('active');
          initNewMatch(true);
          if (voltorbInitialStarter === 'viewers') startViewersTurn();
          else startStreamerTurn();
        };

        launchConfetti();
      } else {
        // Intermediate Round Result (Next Round Pending)
        gameResultChampionTrophy.innerText = '🔥';
        if (lastRoundWinner === 'streamer') {
          gameResultWinnerHeader.innerText = `🔥 ${matchCurrentRound}세트 승리: ${sName}!`;
          gameResultWinnerHeader.style.color = '#ffd700';
          gameModalSummaryText.innerText = `${sName}님이 이번 라운드를 가져가며 세트 스코어 👑 ${matchStreamerWins} : ${matchViewersWins} 👥 가 되었습니다!`;
        } else if (lastRoundWinner === 'viewers') {
          gameResultWinnerHeader.innerText = `🔥 ${matchCurrentRound}세트 승리: 시청자 연합!`;
          gameResultWinnerHeader.style.color = '#38bdf8';
          gameModalSummaryText.innerText = `시청자 연합이 이번 라운드를 가져가며 세트 스코어 👑 ${matchStreamerWins} : ${matchViewersWins} 👥 가 되었습니다!`;
        } else {
          gameResultWinnerHeader.innerText = `🔥 ${matchCurrentRound}세트: 무승부!`;
          gameResultWinnerHeader.style.color = '#00ffa3';
          gameModalSummaryText.innerText = `이번 라운드는 무승부로 종료되어 세트 스코어가 유지됩니다! (👑 ${matchStreamerWins} : ${matchViewersWins} 👥)`;
        }

        gameModalNextRoundBtn.innerText = `⚔️ 다음 세트 (Round ${matchCurrentRound + 1}) 시작`;
        gameModalNextRoundBtn.onclick = () => {
          gameResultModal.classList.remove('active');
          matchCurrentRound++;
          initNewMatch(false);
          // Alternate first player each set for fairness
          const isOddSet = (matchCurrentRound % 2 === 1);
          const nextStarter = isOddSet ? voltorbInitialStarter : (voltorbInitialStarter === 'streamer' ? 'viewers' : 'streamer');
          if (nextStarter === 'viewers') startViewersTurn();
          else startStreamerTurn();
        };
      }
    }

    // Event Listeners
    startGameStreamerBtn.addEventListener('click', () => {
      voltorbInitialStarter = 'streamer';
      initNewMatch(true);
      startStreamerTurn();
    });
    startGameViewersBtn.addEventListener('click', () => {
      voltorbInitialStarter = 'viewers';
      initNewMatch(true);
      startViewersTurn();
    });
    gameCashOutBtn.addEventListener('click', cashOutGame);
    resetGameBtn.addEventListener('click', () => initNewMatch(true));
    showShowdownResultBtn.addEventListener('click', showShowdownResult);

    toggleMemoModeBtn.addEventListener('click', () => {
      isMemoMode = !isMemoMode;
      memoModeStateText.innerText = isMemoMode ? 'ON' : 'OFF';
      memoModeStateText.style.color = isMemoMode ? 'var(--chzzk-green)' : 'var(--text-sub)';
      showToast(`메모 모드: ${isMemoMode ? 'ON (타일을 누르면 메모가 토글됩니다)' : 'OFF (타일을 누르면 뒤집힙니다)'}`, '📝');
      renderBoardUI();
    });

    gameMatchFormatSelect.addEventListener('change', () => {
      const drawerSelect = document.getElementById('drawerGameMatchFormatSelect');
      if (drawerSelect && drawerSelect.value !== gameMatchFormatSelect.value) drawerSelect.value = gameMatchFormatSelect.value;
      updateSettingsSummaryBadges();
      initNewMatch(true);
    });
    gameLevelSelect.addEventListener('change', () => {
      const drawerSelect = document.getElementById('drawerGameLevelSelect');
      if (drawerSelect && drawerSelect.value !== gameLevelSelect.value) drawerSelect.value = gameLevelSelect.value;
      updateSettingsSummaryBadges();
      initNewGameRound(false);
    });
    gameTurnLimitSelect.addEventListener('change', () => {
      const drawerSelect = document.getElementById('drawerGameTurnLimitSelect');
      if (drawerSelect && drawerSelect.value !== gameTurnLimitSelect.value) drawerSelect.value = gameTurnLimitSelect.value;
      updateSettingsSummaryBadges();
      initNewGameRound(false);
    });
    gameVoteDurationSelect.addEventListener('change', () => {
      const drawerSelect = document.getElementById('drawerGameVoteDurationSelect');
      if (drawerSelect && drawerSelect.value !== gameVoteDurationSelect.value) drawerSelect.value = gameVoteDurationSelect.value;
      updateSettingsSummaryBadges();
    });
    closeGameResultModalBtn.addEventListener('click', () => {
      gameResultModal.classList.remove('active');
    });

    window.addEventListener('resize', () => {
      if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
      }
    });
