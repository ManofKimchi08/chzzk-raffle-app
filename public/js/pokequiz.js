    /* ============================================================== */
    /* ❓ POKEMON QUIZ SHOW & DEVELOPER INSPECTOR ENGINE               */
    /* ============================================================== */
    let allPokemonQuizData = [];
    let currentQuizCryAudio = null;

    const quizMatchState = {
      active: false,
      phase: 'idle', // 'idle' | 'question' | 'reveal' | 'ended'
      round: 1,
      targetScore: 5,
      streamerScore: 0,
      viewersScore: 0,
      viewerMode: 'speed', // 'speed' | 'voting'
      quizType: 'random', // 'random' | 'silhouette' | 'pokedex' | 'clues' | 'cry'
      timerDuration: 20,
      timerRemaining: 20,
      timerInterval: null,
      currentPokemon: null,
      currentQuestionType: 'silhouette',
      currentFlavorEntry: null,
      hintsRevealed: 0,
      firstCorrectUser: null,
      streamerSubmittedAnswer: null,
      streamerSubmittedTime: null,
      votingUsers: new Map(), // uid -> text
      voteCounts: {}, // text -> count
      history: []
    };

    let quizInspectorSelectedPokeId = 6;
    let quizInspectorFilterText = '';
    let quizInspectorGen = 'all';
    let quizInspectorType = 'all';

    async function loadPokemonQuizDataset() {
      if (allPokemonQuizData.length > 0) return allPokemonQuizData;
      try {
        const res = await fetch('/pokemon_quiz_data.json?v=5.4.0');
        const data = await res.json();
        allPokemonQuizData = data.pokemons || [];
        allPokemonQuizData.sort((a, b) => (a.id - b.id) || (a.code || '').localeCompare(b.code || ''));
        console.log(`Loaded ${allPokemonQuizData.length} pokemon quiz questions!`);
      } catch (e) {
        console.warn('Failed to load pokemon_quiz_data.json, generating fallback dataset', e);
        if (allPokemonData && allPokemonData.length > 0) {
          allPokemonQuizData = allPokemonData.map(p => ({
            id: p.id,
            code: p.code || String(p.id),
            name: p.name,
            chosung: getChosungText(p.name),
            aliases: [p.name, p.name.replace(/\s+/g, ''), getChosungText(p.name)],
            types: p.types || [],
            genus: (p.types && p.types[0] ? p.types[0] : '') + '포켓몬',
            generation: p.id <= 151 ? 1 : (p.id <= 251 ? 2 : (p.id <= 386 ? 3 : 4)),
            stats: p.stats || {},
            sprite_front: p.sprite_front,
            cry_url: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${p.id}.ogg`,
            pokedex_entries: [{ text: `${p.name}은(는) ${p.types ? p.types.join('/') : ''} 타입의 포켓몬이다.`, version: '기본' }]
          }));
        }
      }
      return allPokemonQuizData;
    }

    function getPureChosung(str) {
      if (!str) return '';
      const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code >= 0xAC00 && code <= 0xD7A3) {
          const idx = Math.floor((code - 0xAC00) / (21 * 28));
          result += CHOSUNG[idx];
        } else {
          result += str.charAt(i);
        }
      }
      return result;
    }

    function getChosungText(str) {
      if (!str) return '';
      const parenMatch = str.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        const baseName = parenMatch[1].trim();
        const form = parenMatch[2].trim();
        const baseCho = getPureChosung(baseName);
        
        if (form.includes('의 모습')) {
          const parts = form.split('/');
          const formattedParts = parts.map(part => {
            if (part.includes('의 모습')) {
              const prefix = part.split('의 모습')[0].trim();
              return '?'.repeat(prefix.length) + '의 모습';
            } else if (part.endsWith('종')) {
              const prefix = part.slice(0, -1).trim();
              return '?'.repeat(prefix.length) + '종';
            } else {
              return '?'.repeat(part.length);
            }
          });
          return `${baseCho} (${formattedParts.join('/')})`;
        } else if (form.includes('로토무')) {
          if (form === '로토무의 모습') return `${baseCho} (???의 모습)`;
          const prefix = form.replace('로토무', '').trim();
          return `${baseCho} (${'?'.repeat(prefix.length)}로토무)`;
        } else if (form.endsWith('종')) {
          const prefix = form.slice(0, -1).trim();
          return `${baseCho} (${'?'.repeat(prefix.length)}종)`;
        } else {
          return `${baseCho} (${'?'.repeat(form.length)})`;
        }
      }
      return getPureChosung(str);
    }

    function renderQuizChosungHtml(chosungStr, isRevealed = true) {
      if (!chosungStr) return '';
      const chars = chosungStr.split('');
      return chars.map(c => {
        if (c === ' ') {
          return '<span style="display:inline-block; width:8px;"></span>';
        }
        if (c === '(' || c === ')' || c === '/') {
          return `<span style="color:var(--text-sub); font-size:16px; font-weight:800; padding:0 3px; align-self:center;">${c}</span>`;
        }
        if (!isRevealed) {
          return '<span class="quiz-chosung-letter" style="color:var(--text-sub); border-color:rgba(255,255,255,0.1); min-width:32px; height:32px; font-size:14px;">?</span>';
        }
        if (c === '?') {
          return '<span class="quiz-chosung-letter" style="min-width:32px; height:32px; font-size:15px; color:#38bdf8; border-color:rgba(56,189,248,0.4); box-shadow:0 0 8px rgba(56,189,248,0.2);">?</span>';
        }
        const isKoreanFormWord = (c.charCodeAt(0) >= 0xAC00 && c.charCodeAt(0) <= 0xD7A3);
        if (isKoreanFormWord) {
          return `<span class="quiz-chosung-letter" style="min-width:32px; height:32px; font-size:13.5px; color:#fff; border-color:rgba(255,255,255,0.25); background:rgba(255,255,255,0.06); box-shadow:none;">${c}</span>`;
        }
        return `<span class="quiz-chosung-letter" style="min-width:32px; height:32px; font-size:16px;">${c}</span>`;
      }).join('');
    }

    function updateQuizStreamerProfileUI() {
      const nameElem = document.getElementById('quizStreamerName');
      const avatarElem = document.getElementById('quizStreamerAvatar');
      const fallbackElem = document.getElementById('quizStreamerAvatarFallback');
      const sName = getStreamerName();
      if (nameElem) nameElem.innerText = sName;
      if (currentChannelImageUrl && avatarElem && fallbackElem) {
        avatarElem.src = currentChannelImageUrl;
        avatarElem.style.display = 'inline-block';
        fallbackElem.style.display = 'none';
      } else if (avatarElem && fallbackElem) {
        avatarElem.style.display = 'none';
        fallbackElem.style.display = 'flex';
      }
    }

    function syncQuizViewerMode(val) {
      quizMatchState.viewerMode = val;
      const b = document.getElementById('quizViewerModeBadge');
      if (b) b.innerText = val === 'speed' ? '⚡ 스피드 선착순 모드' : '🗳️ 집단지성 다수결 모드';
      const feedTitle = document.getElementById('quizLiveFeedTitle');
      if (feedTitle) feedTitle.innerText = val === 'speed' ? '⚡ 실시간 시청자 정답 탐지' : '🗳️ 시청자 집단지성 실시간 투표';
      const speedBox = document.getElementById('quizSpeedModeFeedBox');
      const voteBox = document.getElementById('quizVotingModeBarsBox');
      if (speedBox && voteBox) {
        speedBox.style.display = val === 'speed' ? 'flex' : 'none';
        voteBox.style.display = val === 'voting' ? 'flex' : 'none';
      }
      const sel = document.getElementById('drawerQuizViewerModeSelect');
      if (sel) sel.value = val;
      updateSettingsSummaryBadges();
    }

    function syncQuizType(val) {
      quizMatchState.quizType = val;
      const b = document.getElementById('quizTypeBadge');
      const labels = {
        random: '🎲 랜덤 믹스',
        silhouette: '🖼️ 실루엣 퀴즈',
        pokedex: '📖 도감 설명 퀴즈',
        clues: '🧩 초성 & 3단 힌트',
        cry: '🔊 울음소리 퀴즈'
      };
      if (b) b.innerText = labels[val] || '🎲 랜덤 믹스';
      const sel = document.getElementById('drawerQuizTypeSelect');
      if (sel) sel.value = val;
    }

    function syncQuizTargetScore(val) {
      quizMatchState.targetScore = parseInt(val) || 5;
      const targetText = document.getElementById('quizMatchTargetText');
      const formatBadge = document.getElementById('quizMatchFormatBadge');
      if (targetText) targetText.innerText = `목표: ${quizMatchState.targetScore}점 선승`;
      if (formatBadge) formatBadge.innerText = `${quizMatchState.targetScore}점 선취 승리`;
      const sel = document.getElementById('drawerQuizTargetScoreSelect');
      if (sel) sel.value = String(quizMatchState.targetScore);
    }

    function syncQuizTimerDuration(val) {
      quizMatchState.timerDuration = parseFloat(val) || 20.0;
      const sel = document.getElementById('drawerQuizTimerDurationSelect');
      if (sel) sel.value = String(quizMatchState.timerDuration);
    }

    async function nextQuizQuestion() {
      if (allPokemonQuizData.length === 0) {
        await loadPokemonQuizDataset();
      }
      if (allPokemonQuizData.length === 0) {
        showToast('포켓몬 퀴즈 데이터를 불러오는 중입니다...', '⏳');
        return;
      }

      if (quizMatchState.phase === 'ended') {
        resetQuizMatch();
      }

      // Pick a random Pokemon
      const p = allPokemonQuizData[Math.floor(Math.random() * allPokemonQuizData.length)];
      quizMatchState.currentPokemon = p;

      // Determine Question Type
      let qType = quizMatchState.quizType;
      if (qType === 'random') {
        const types = ['silhouette', 'pokedex', 'clues', 'cry'];
        qType = types[Math.floor(Math.random() * types.length)];
      }
      quizMatchState.currentQuestionType = qType;
      quizMatchState.phase = 'question';
      quizMatchState.hintsRevealed = 0;
      quizMatchState.firstCorrectUser = null;
      quizMatchState.streamerSubmittedAnswer = null;
      quizMatchState.votingUsers.clear();
      quizMatchState.voteCounts = {};

      renderQuizStageUI();
      startQuizTurnTimer();
    }

    function renderQuizStageUI() {
      const p = quizMatchState.currentPokemon;
      const qType = quizMatchState.currentQuestionType;

      // Badges & Scoreboard
      const phaseBadge = document.getElementById('quizPhaseBadge');
      if (phaseBadge) {
        phaseBadge.className = 'live-badge-pill live';
        phaseBadge.innerText = `ROUND ${quizMatchState.round} 진행 중`;
      }
      const roundText = document.getElementById('quizRoundNumberText');
      if (roundText) roundText.innerText = `ROUND ${quizMatchState.round}`;

      const sScore = document.getElementById('quizStreamerScoreText');
      const vScore = document.getElementById('quizViewersScoreText');
      if (sScore) sScore.innerText = quizMatchState.streamerScore;
      if (vScore) vScore.innerText = quizMatchState.viewersScore;

      const sTag = document.getElementById('quizStreamerStatusTag');
      const vTag = document.getElementById('quizViewersStatusTag');
      if (sTag) { sTag.innerText = '응답 대기'; sTag.style.color = '#ffd700'; }
      if (vTag) { sTag.innerText = quizMatchState.viewerMode === 'voting' ? '투표 수집 중' : '채팅 수신 중'; vTag.style.color = '#38bdf8'; }

      const feedTitle = document.getElementById('quizLiveFeedTitle');
      if (feedTitle) {
        feedTitle.innerText = quizMatchState.viewerMode === 'voting'
          ? '🗳️ 시청자 집단지성 투표 집계'
          : '⚡ 실시간 시청자 정답 탐지';
      }

      const instr = document.getElementById('quizInstructionText');
      if (instr) {
        instr.innerText = quizMatchState.viewerMode === 'speed'
          ? '💬 시청자: 채팅창에 포켓몬 이름(또는 초성)을 가장 먼저 입력하세요!'
          : '🗳️ 시청자: 채팅창에 포켓몬 이름을 입력하여 다수결 투표에 참여하세요! (종료 시 공개)';
      }

      // Hide answer reveal overlay
      const overlay = document.getElementById('quizAnswerRevealOverlay');
      if (overlay) overlay.style.display = 'none';

      // Type title banner
      const typeTitles = {
        silhouette: { icon: '🖼️', title: '실루엣 퀴즈 (누구일까요?)' },
        pokedex: { icon: '📖', title: '포켓몬 공식 도감 설명 퀴즈' },
        clues: { icon: '🧩', title: '초성 & 3단 힌트 퀴즈' },
        cry: { icon: '🔊', title: '포켓몬 울음소리 퀴즈' }
      };
      const typeInfo = typeTitles[qType] || typeTitles.silhouette;
      const typeIconElem = document.getElementById('quizQuestionTypeIcon');
      const typeTitleElem = document.getElementById('quizQuestionTypeTitle');
      if (typeIconElem) typeIconElem.innerText = typeInfo.icon;
      if (typeTitleElem) typeTitleElem.innerText = typeInfo.title;

      // Containers
      const silBox = document.getElementById('quizSilhouetteBox');
      const dexBox = document.getElementById('quizPokedexBox');
      const clueBox = document.getElementById('quizCluesBox');
      const cryBox = document.getElementById('quizCryBox');

      if (silBox) silBox.style.display = qType === 'silhouette' ? 'flex' : 'none';
      if (dexBox) dexBox.style.display = qType === 'pokedex' ? 'block' : 'none';
      if (cryBox) cryBox.style.display = qType === 'cry' ? 'flex' : 'none';
      if (clueBox) clueBox.style.display = 'block'; // Always visible as Universal 3-Step Hint Deck

      if (!p) return;

      // 1. Silhouette Setup
      if (qType === 'silhouette') {
        const img = document.getElementById('quizSilhouetteImg');
        if (img) {
          img.src = p.sprite_front;
          img.className = 'quiz-silhouette-img';
        }
      }

      // 2. Pokedex Setup
      if (qType === 'pokedex') {
        const flavors = p.pokedex_entries || [];
        const entry = flavors.length > 0 ? flavors[Math.floor(Math.random() * flavors.length)] : { text: `${p.name}은(는) 강력한 포켓몬이다.`, version: '공식' };
        quizMatchState.currentFlavorEntry = entry;

        let maskedText = entry.text;
        // Mask name
        const nameRegex = new RegExp(p.name, 'g');
        maskedText = maskedText.replace(nameRegex, '<span style="color:#ffd700; font-weight:900; background:rgba(255,215,0,0.18); padding:2px 8px; border-radius:6px; border:1px dashed #ffd700;">[ ??? ]</span>');
        
        const fTextElem = document.getElementById('quizPokedexFlavorText');
        const vBadgeElem = document.getElementById('quizPokedexVersionBadge');
        if (fTextElem) fTextElem.innerHTML = `"${maskedText}"`;
        if (vBadgeElem) vBadgeElem.innerText = `${p.generation || 1}세대 공식 도감`;
      }

      // 3. Cry Setup
      if (qType === 'cry') {
        playPokemonCry(p.id, p.cry_url);
      }

      // Universal 3-Step Hint Deck Initialization
      const cCard1 = document.getElementById('quizClueCard1');
      const cStatus1 = document.getElementById('quizClueStatus1');
      const cContent1 = document.getElementById('quizClueContent1');

      const cCard2 = document.getElementById('quizClueCard2');
      const cStatus2 = document.getElementById('quizClueStatus2');
      const cContent2 = document.getElementById('quizClueContent2');

      const cCard3 = document.getElementById('quizClueCard3');
      const cStatus3 = document.getElementById('quizClueStatus3');
      const cContent3 = document.getElementById('quizClueContent3');

      const hintBadge = document.getElementById('quizCurrentHintBadge');
      const openHintBtn = document.getElementById('quizOpenHintBtn');

      if (qType === 'clues') {
        quizMatchState.hintsRevealed = 1;
        if (hintBadge) hintBadge.innerText = '힌트 1/3';
        if (cCard1) cCard1.className = 'quiz-clue-card active';
        if (cStatus1) { cStatus1.innerText = '공개됨'; cStatus1.style.color = 'var(--chzzk-green)'; }
        if (cContent1) {
          cContent1.innerHTML = p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join(' ');
        }
      } else {
        quizMatchState.hintsRevealed = 0;
        if (hintBadge) hintBadge.innerText = '힌트 0/3';
        if (cCard1) cCard1.className = 'quiz-clue-card locked';
        if (cStatus1) { cStatus1.innerText = '잠김 (1단계)'; cStatus1.style.color = 'var(--text-sub)'; }
        if (cContent1) cContent1.innerText = '🔒 1단계 힌트: 속성 타입';
      }

      if (cCard2) cCard2.className = 'quiz-clue-card locked';
      if (cStatus2) { cStatus2.innerText = '잠김 (2단계)'; cStatus2.style.color = 'var(--text-sub)'; }
      if (cContent2) cContent2.innerText = '🔒 2단계 힌트: 포켓몬 분류 및 세대';

      if (cCard3) cCard3.className = 'quiz-clue-card locked';
      if (cStatus3) { cStatus3.innerText = '잠김 (3단계)'; cStatus3.style.color = 'var(--text-sub)'; }
      if (cContent3) {
        const cho = p.chosung || getChosungText(p.name);
        cContent3.innerHTML = renderQuizChosungHtml(cho, false);
      }

      if (openHintBtn) {
        openHintBtn.innerText = `💡 힌트 열기 (${quizMatchState.hintsRevealed}/3)`;
        openHintBtn.disabled = false;
        openHintBtn.style.opacity = '1';
      }

      // Reset Live Feed UI
      const feedBox = document.getElementById('quizSpeedModeFeedBox');
      if (feedBox) {
        feedBox.innerHTML = '<div style="color: var(--text-sub); text-align: center; margin-top: 45px;">채팅창에 포켓몬 이름 또는 초성을 입력하면 실시간으로 정답자가 자동 인식됩니다.</div>';
      }
      renderQuizVotingBars(false);
      const countBadge = document.getElementById('quizChatCountBadge');
      if (countBadge) countBadge.innerText = '0건 수신';

      // Reset Streamer Answer Input Field
      const sInput = document.getElementById('quizStreamerAnswerInput');
      const submitBtn = document.getElementById('quizStreamerSubmitBtn');
      if (submitBtn) {
        submitBtn.innerText = '정답 제출 🎯';
        submitBtn.onclick = submitQuizStreamerAnswer;
      }
      if (sInput) {
        sInput.value = '';
        sInput.disabled = false;
        sInput.style.borderColor = 'rgba(255, 215, 0, 0.5)';
        sInput.style.boxShadow = 'none';
        setTimeout(() => sInput.focus(), 50);
      }
      const sFeedback = document.getElementById('quizStreamerInputFeedback');
      if (sFeedback) {
        sFeedback.innerText = '비공개 제출 후 타이머 종료 시 동시 채점';
        sFeedback.style.color = 'var(--text-sub)';
      }
      const sSubGuide = document.getElementById('quizStreamerInputSubGuide');
      if (sSubGuide) {
        sSubGuide.innerText = '비공개 제출 후 타이머 종료 시 동시 채점';
      }
    }

    function startQuizTurnTimer() {
      clearInterval(quizMatchState.timerInterval);
      quizMatchState.timerRemaining = quizMatchState.timerDuration;
      renderQuizTimerUI();

      const stepMs = 100;
      quizMatchState.timerInterval = setInterval(() => {
        quizMatchState.timerRemaining -= (stepMs / 1000);

        if (quizMatchState.timerRemaining <= 0) {
          quizMatchState.timerRemaining = 0;
          clearInterval(quizMatchState.timerInterval);

          if (quizMatchState.viewerMode === 'voting') {
            evaluateQuizVotingOutcome();
          } else {
            evaluateQuizSpeedOutcome();
          }
        }
        renderQuizTimerUI();
      }, stepMs);
    }

    function renderQuizTimerUI() {
      const tText = document.getElementById('quizTimerText');
      const tFill = document.getElementById('quizTimerFill');
      if (tText) tText.innerText = `${Math.max(0, quizMatchState.timerRemaining).toFixed(1)}s`;
      if (tFill) {
        const pct = (Math.max(0, quizMatchState.timerRemaining) / quizMatchState.timerDuration) * 100;
        tFill.style.width = `${pct}%`;
      }
    }

    function applyQuizHintStep(targetStep) {
      const p = quizMatchState.currentPokemon;
      if (!p) return;
      quizMatchState.hintsRevealed = Math.min(3, Math.max(quizMatchState.hintsRevealed, targetStep));
      const curStep = quizMatchState.hintsRevealed;

      const hintBadge = document.getElementById('quizCurrentHintBadge');
      if (hintBadge) hintBadge.innerText = `힌트 ${curStep}/3`;

      const openHintBtn = document.getElementById('quizOpenHintBtn');
      if (openHintBtn) {
        if (curStep >= 3) {
          openHintBtn.innerText = '💡 모든 힌트 공개됨 (3/3)';
          openHintBtn.disabled = true;
          openHintBtn.style.opacity = '0.6';
        } else {
          openHintBtn.innerText = `💡 힌트 열기 (${curStep}/3)`;
          openHintBtn.disabled = false;
          openHintBtn.style.opacity = '1';
        }
      }

      // Step 1: Type
      if (curStep >= 1) {
        const cCard1 = document.getElementById('quizClueCard1');
        const cStatus1 = document.getElementById('quizClueStatus1');
        const cContent1 = document.getElementById('quizClueContent1');
        if (cCard1) cCard1.className = 'quiz-clue-card active';
        if (cStatus1) { cStatus1.innerText = '공개됨'; cStatus1.style.color = 'var(--chzzk-green)'; }
        if (cContent1) {
          cContent1.innerHTML = p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join(' ');
        }
        if (quizMatchState.currentQuestionType === 'silhouette') {
          const img = document.getElementById('quizSilhouetteImg');
          if (img) img.classList.add('hinted');
        }
      }

      // Step 2: Genus & Generation
      if (curStep >= 2) {
        const cCard2 = document.getElementById('quizClueCard2');
        const cStatus2 = document.getElementById('quizClueStatus2');
        const cContent2 = document.getElementById('quizClueContent2');
        if (cCard2) cCard2.className = 'quiz-clue-card active';
        if (cStatus2) { cStatus2.innerText = '공개됨'; cStatus2.style.color = '#ffd700'; }
        if (cContent2) {
          cContent2.innerHTML = `<span style="color:#ffd700; font-weight:800;">🏷️ ${p.genus || (p.types[0] + '포켓몬')}</span> <span class="badge-tag" style="background:rgba(255,255,255,0.08); font-size:10px; color:var(--text-sub); margin-left:4px;">${p.generation || 1}세대</span>`;
        }
      }

      // Step 3: Consonants / Chosung
      if (curStep >= 3) {
        const cCard3 = document.getElementById('quizClueCard3');
        const cStatus3 = document.getElementById('quizClueStatus3');
        const cContent3 = document.getElementById('quizClueContent3');
        if (cCard3) cCard3.className = 'quiz-clue-card active';
        if (cStatus3) { cStatus3.innerText = '공개됨'; cStatus3.style.color = '#ec4899'; }
        if (cContent3) {
          const cho = p.chosung || getChosungText(p.name);
          cContent3.innerHTML = renderQuizChosungHtml(cho, true);
        }
      }
    }

    function manuallyOpenNextQuizHint() {
      if (quizMatchState.phase !== 'question') return;
      if (quizMatchState.hintsRevealed >= 3) {
        showToast('💡 이미 모든 힌트가 공개되었습니다. (3/3)', '💡');
        return;
      }
      const nextStep = quizMatchState.hintsRevealed + 1;
      applyQuizHintStep(nextStep);
      const hintNames = ['', '속성 타입', '분류 & 세대', '한글 초성'];
      showToast(`💡 ${nextStep}단계 힌트 오픈! [${hintNames[nextStep]}]`, '💡');
    }

    function normalizeQuizAnswer(str) {
      if (!str) return '';
      return str.trim().toUpperCase().replace(/[\s\-_!?.,~]/g, '');
    }

    function checkQuizAnswerMatch(input, targetPokemon) {
      if (!input || !targetPokemon) return { isMatch: false, matchType: 'none' };
      const cleanInput = normalizeQuizAnswer(input);
      const cleanTarget = normalizeQuizAnswer(targetPokemon.name);
      const cleanChosung = normalizeQuizAnswer(targetPokemon.chosung || getChosungText(targetPokemon.name));

      // 1. Exact name match
      if (cleanInput === cleanTarget) {
        return { isMatch: true, matchType: 'exact' };
      }

      // 2. Base name match (e.g. "나인테일" or "ㄴㅇㅌㅇ" for "나인테일 (알로라의 모습)")
      const parenMatch = targetPokemon.name.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        const baseNameClean = normalizeQuizAnswer(parenMatch[1]);
        const baseChosungClean = normalizeQuizAnswer(getPureChosung(parenMatch[1]));
        if (cleanInput === baseNameClean) {
          return { isMatch: true, matchType: 'base_name' };
        }
        if (cleanInput === baseChosungClean && baseChosungClean.length >= 2) {
          return { isMatch: true, matchType: 'base_chosung' };
        }
      }

      // 3. Exact chosung match
      if (cleanInput === cleanChosung && cleanChosung.length >= 2) {
        return { isMatch: true, matchType: 'chosung' };
      }

      // 4. Aliases match
      if (targetPokemon.aliases && Array.isArray(targetPokemon.aliases)) {
        for (const alias of targetPokemon.aliases) {
          if (normalizeQuizAnswer(alias) === cleanInput) {
            return { isMatch: true, matchType: 'alias' };
          }
        }
      }

      // 5. Substring exact match (e.g. "정답 리자몽 입니다")
      if (cleanInput.includes(cleanTarget) && cleanTarget.length >= 2) {
        return { isMatch: true, matchType: 'contains' };
      }
      if (parenMatch) {
        const baseNameClean = normalizeQuizAnswer(parenMatch[1]);
        if (cleanInput.includes(baseNameClean) && baseNameClean.length >= 2) {
          return { isMatch: true, matchType: 'contains_base' };
        }
      }

      return { isMatch: false, matchType: 'none' };
    }

    function handleLivePokeQuizChat(nickname, msg, uid, now) {
      if (quizMatchState.phase !== 'question' || !quizMatchState.currentPokemon) return;
      if (!msg) return;

      const p = quizMatchState.currentPokemon;

      // Update total chat badge
      const countBadge = document.getElementById('quizChatCountBadge');
      if (countBadge) {
        const cur = parseInt(countBadge.innerText, 10) || 0;
        countBadge.innerText = `${cur + 1}건 수신`;
      }

      // --- Mode 1: Speed First-to-Answer ---
      if (quizMatchState.viewerMode === 'speed') {
        const matchRes = checkQuizAnswerMatch(msg, p);
        const feedBox = document.getElementById('quizSpeedModeFeedBox');

        if (matchRes.isMatch) {
          if (!quizMatchState.firstCorrectUser) {
            quizMatchState.firstCorrectUser = { nickname, uid, msg, time: now };
          }
          if (feedBox) {
            if (feedBox.children.length > 20) feedBox.lastElementChild.remove();
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '4px 8px';
            item.style.borderRadius = '6px';
            item.style.background = 'rgba(0, 255, 163, 0.15)';
            item.style.border = '1px solid rgba(0, 255, 163, 0.35)';
            item.style.marginBottom = '4px';
            item.innerHTML = `<span><b style="color:#00ffa3;">${escapeHtml(nickname)}</b>: ${escapeHtml(msg)}</span><span style="font-size:10px; color:#00ffa3; font-weight:800;">정답 수신됨</span>`;
            feedBox.prepend(item);
          }
        } else {
          // Regular chat item
          if (feedBox) {
            if (feedBox.children.length > 20) feedBox.lastElementChild.remove();
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '3px 6px';
            item.style.borderRadius = '4px';
            item.style.background = 'rgba(255,255,255,0.02)';
            item.style.marginBottom = '3px';
            item.innerHTML = `<span><b>${escapeHtml(nickname)}</b>: ${escapeHtml(msg)}</span>`;
            feedBox.prepend(item);
          }
        }
      }

      // --- Mode 2: Collective Intelligence Voting ---
      else if (quizMatchState.viewerMode === 'voting') {
        const cleanAnswer = msg.trim();
        // Consolidate answers that match the target Pokemon (e.g. chosung/alias) under the official Pokemon name
        const matchCheck = checkQuizAnswerMatch(cleanAnswer, p);
        const canonicalAnswer = matchCheck.isMatch ? p.name : cleanAnswer;
        quizMatchState.votingUsers.set(uid, canonicalAnswer);

        // Recompute vote counts
        quizMatchState.voteCounts = {};
        for (const ans of quizMatchState.votingUsers.values()) {
          const norm = ans.toUpperCase();
          quizMatchState.voteCounts[norm] = (quizMatchState.voteCounts[norm] || 0) + 1;
        }

        renderQuizVotingBars();
      }
    }

    function renderQuizVotingBars(isRevealed = false) {
      const voteBox = document.getElementById('quizVotingModeBarsBox');
      if (!voteBox) return;

      const totalVotes = quizMatchState.votingUsers.size;

      // During active question phase and not yet revealed -> Blind Collection State!
      if (!isRevealed && quizMatchState.phase === 'question') {
        voteBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:11px; color:var(--text-sub);">
            <span>👥 총 참여: <b style="color:#ffd700; font-size:13px;">${totalVotes}</b>명</span>
            <span class="live-badge-pill live" style="font-size:10px; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3);">🔒 실시간 수집 중</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:105px; gap:6px; text-align:center; background:rgba(0,0,0,0.25); border-radius:8px; border:1px dashed rgba(255,255,255,0.1); padding:6px 10px;">
            <div style="font-size:22px; filter:drop-shadow(0 0 8px rgba(56,189,248,0.5));">🔒</div>
            <div style="font-size:12px; font-weight:800; color:#38bdf8;">시청자 집단지성 답변 수집 중...</div>
            <div style="font-size:10.5px; color:var(--text-sub); line-height:1.4;">
              채팅창에 자유롭게 포켓몬 이름을 입력하세요.<br>
              <span style="color:#ffd700; font-weight:700;">상세 답변 및 득표율은 타이머 종료 시 일괄 공개됩니다.</span>
            </div>
          </div>
        `;
        return;
      }

      // Revealed state (when timer ended or reveal called)
      const entries = Object.entries(quizMatchState.voteCounts).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        voteBox.innerHTML = '<div style="color: var(--text-sub); text-align: center; margin-top: 45px;">시청자 투표 참여자가 없습니다.</div>';
        return;
      }

      const top4 = entries.slice(0, 4);
      voteBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:11px; color:var(--text-sub);">
          <span>👥 총 투표: <b style="color:#ffd700;">${totalVotes}</b>명</span>
          <span style="color:var(--chzzk-green); font-weight:800; font-size:11px;">✅ 투표 집계 완료</span>
        </div>
      ` + top4.map(([ans, count], idx) => {
        const pct = Math.round((count / totalVotes) * 100);
        const isLeader = idx === 0;
        return `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; justify-content: space-between; font-weight: ${isLeader ? '800' : '600'}; color: ${isLeader ? '#ffd700' : '#fff'};">
              <span>${idx + 1}. ${escapeHtml(ans)} ${isLeader ? '<span class="badge-tag" style="background:#ffd700; color:#000; font-size:9px; font-weight:900; margin-left:4px;">👑 1위 당선</span>' : ''}</span>
              <span>${count}표 (${pct}%)</span>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${isLeader ? 'linear-gradient(90deg, #ffd700, #ff8800)' : 'linear-gradient(90deg, #38bdf8, #00ffa3)'};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    function evaluateQuizVotingOutcome() {
      const p = quizMatchState.currentPokemon;
      const totalVotes = quizMatchState.votingUsers.size;
      const entries = Object.entries(quizMatchState.voteCounts).sort((a, b) => b[1] - a[1]);

      // 1. Reveal voting bars
      renderQuizVotingBars(true);

      // 2. Check Streamer answer
      const streamerAns = quizMatchState.streamerSubmittedAnswer;
      const streamerMatch = streamerAns ? checkQuizAnswerMatch(streamerAns, p) : { isMatch: false };

      // 3. Check Viewers top answer
      const topVoteEntry = entries.length > 0 ? entries[0] : null;
      const viewersMatch = topVoteEntry ? checkQuizAnswerMatch(topVoteEntry[0], p) : { isMatch: false };

      if (topVoteEntry) {
        const pct = Math.round((topVoteEntry[1] / Math.max(1, totalVotes)) * 100);
        quizMatchState.topVotedAnswer = `${topVoteEntry[0]} (${pct}% 득표)`;
      } else {
        quizMatchState.topVotedAnswer = null;
      }

      // 4. Outcome Resolution
      if (streamerMatch.isMatch && viewersMatch.isMatch) {
        // Both Correct!
        quizMatchState.streamerScore++;
        quizMatchState.viewersScore++;
        revealQuizAnswer('both', 'voting_both');
      } else if (streamerMatch.isMatch && !viewersMatch.isMatch) {
        // Streamer Won!
        quizMatchState.streamerScore++;
        revealQuizAnswer('streamer', 'voting_streamer');
      } else if (!streamerMatch.isMatch && viewersMatch.isMatch) {
        // Viewers Won!
        quizMatchState.viewersScore++;
        revealQuizAnswer('viewers', 'voting_viewers');
      } else {
        // Neither
        revealQuizAnswer(null, 'voting_none');
      }
    }

    function evaluateQuizSpeedOutcome() {
      const p = quizMatchState.currentPokemon;
      const streamerAns = quizMatchState.streamerSubmittedAnswer;
      const streamerMatch = streamerAns ? checkQuizAnswerMatch(streamerAns, p) : { isMatch: false };
      const viewerUser = quizMatchState.firstCorrectUser;
      const viewerMatch = !!viewerUser;

      if (streamerMatch.isMatch && viewerMatch) {
        const sTime = quizMatchState.streamerSubmittedTime || 0;
        const vTime = viewerUser.time || 0;
        if (sTime <= vTime) {
          quizMatchState.streamerScore++;
          revealQuizAnswer('streamer', 'speed_streamer_faster');
        } else {
          quizMatchState.viewersScore++;
          revealQuizAnswer('viewers', 'speed_viewers_faster');
        }
      } else if (streamerMatch.isMatch && !viewerMatch) {
        quizMatchState.streamerScore++;
        revealQuizAnswer('streamer', 'speed_streamer_only');
      } else if (!streamerMatch.isMatch && viewerMatch) {
        quizMatchState.viewersScore++;
        revealQuizAnswer('viewers', 'speed_viewers_only');
      } else {
        revealQuizAnswer(null, 'speed_timeout_none');
      }
    }

    function submitQuizStreamerAnswer() {
      const inputElem = document.getElementById('quizStreamerAnswerInput');
      const feedbackElem = document.getElementById('quizStreamerInputFeedback');
      const submitBtn = document.getElementById('quizStreamerSubmitBtn');
      const subGuide = document.getElementById('quizStreamerInputSubGuide');
      if (!inputElem) return;
      const val = inputElem.value.trim();
      if (!val) {
        showToast('정답을 입력해주세요!', '⚠️');
        return;
      }

      if (quizMatchState.phase !== 'question' || !quizMatchState.currentPokemon) {
        showToast('진행 중인 퀴즈 문제가 없습니다. [퀴즈 시작]을 눌러주세요.', '⚠️');
        return;
      }

      // Record answer and lock until timer finishes (Wait for timer expiry in both modes!)
      quizMatchState.streamerSubmittedAnswer = val;
      quizMatchState.streamerSubmittedTime = Date.now();
      inputElem.disabled = true;

      if (feedbackElem) {
        feedbackElem.innerText = `🔒 답안 제출 완료: "${val}" (타이머 종료 시 채점)`;
        feedbackElem.style.color = '#ffd700';
      }
      if (subGuide) {
        subGuide.innerText = `🔒 답안 제출 완료 ("${val}") (종료 시 채점)`;
      }
      if (submitBtn) {
        submitBtn.innerText = '수정 ✏️';
        submitBtn.onclick = () => {
          inputElem.disabled = false;
          inputElem.focus();
          inputElem.select();
          submitBtn.innerText = '정답 제출 🎯';
          submitBtn.onclick = submitQuizStreamerAnswer;
          if (feedbackElem) {
            feedbackElem.innerText = '답안을 수정한 뒤 다시 제출하세요.';
            feedbackElem.style.color = 'var(--text-sub)';
          }
          if (subGuide) {
            subGuide.innerText = '비공개 제출 후 타이머 종료 시 동시 채점';
          }
        };
      }
      showToast(`🔒 스트리머 답안("${val}")이 안전하게 제출되었습니다! 타이머 종료 시 결과가 공개됩니다.`, '👑');
    }

    function awardQuizStreamerPoint() {
      submitQuizStreamerAnswer();
    }

    function awardQuizViewersPoint(reason) {
      if (quizMatchState.phase !== 'question') return;
      clearInterval(quizMatchState.timerInterval);
      quizMatchState.viewersScore++;
      revealQuizAnswer('viewers', reason || 'manual');
    }

    function passQuizQuestion() {
      if (quizMatchState.phase !== 'question') return;
      clearInterval(quizMatchState.timerInterval);
      revealQuizAnswer(null, 'pass');
    }

    function handleManualQuizReveal() {
      if (quizMatchState.phase !== 'question') return;
      clearInterval(quizMatchState.timerInterval);
      if (quizMatchState.viewerMode === 'voting') {
        evaluateQuizVotingOutcome();
      } else {
        evaluateQuizSpeedOutcome();
      }
    }

    function resetQuizMatch() {
      clearInterval(quizMatchState.timerInterval);
      quizMatchState.active = false;
      quizMatchState.phase = 'idle';
      quizMatchState.round = 1;
      quizMatchState.streamerScore = 0;
      quizMatchState.viewersScore = 0;
      quizMatchState.currentPokemon = null;
      quizMatchState.streamerSubmittedAnswer = null;
      quizMatchState.streamerSubmittedTime = null;
      quizMatchState.firstCorrectUser = null;

      const phaseBadge = document.getElementById('quizPhaseBadge');
      if (phaseBadge) {
        phaseBadge.className = 'live-badge-pill offline';
        phaseBadge.innerText = '대기 중';
      }
      const sScore = document.getElementById('quizStreamerScoreText');
      const vScore = document.getElementById('quizViewersScoreText');
      if (sScore) sScore.innerText = '0';
      if (vScore) vScore.innerText = '0';

      const sInput = document.getElementById('quizStreamerAnswerInput');
      const submitBtn = document.getElementById('quizStreamerSubmitBtn');
      if (submitBtn) {
        submitBtn.innerText = '정답 제출 🎯';
        submitBtn.onclick = submitQuizStreamerAnswer;
      }
      if (sInput) {
        sInput.value = '';
        sInput.disabled = false;
        sInput.style.borderColor = 'rgba(255, 215, 0, 0.5)';
        sInput.style.boxShadow = 'none';
      }
      const sFeedback = document.getElementById('quizStreamerInputFeedback');
      if (sFeedback) {
        sFeedback.innerText = '비공개 제출 후 타이머 종료 시 동시 채점';
        sFeedback.style.color = 'var(--text-sub)';
      }
      const sSubGuide = document.getElementById('quizStreamerInputSubGuide');
      if (sSubGuide) {
        sSubGuide.innerText = '비공개 제출 후 타이머 종료 시 동시 채점';
      }

      quizMatchState.hintsRevealed = 0;
      const hintBadge = document.getElementById('quizCurrentHintBadge');
      if (hintBadge) hintBadge.innerText = '힌트 0/3';
      const openHintBtn = document.getElementById('quizOpenHintBtn');
      if (openHintBtn) {
        openHintBtn.innerText = '💡 힌트 열기 (+1)';
        openHintBtn.disabled = false;
        openHintBtn.style.opacity = '1';
      }

      const overlay = document.getElementById('quizAnswerRevealOverlay');
      if (overlay) overlay.style.display = 'none';

      const instr = document.getElementById('quizInstructionText');
      if (instr) instr.innerText = '[퀴즈 시작] 버튼을 눌러 문제를 출제하세요.';

      showToast('🔄 퀴즈 매치 점수가 초기화되었습니다.', '🔄');
    }

    function revealQuizAnswer(winner, reason) {
      quizMatchState.phase = 'reveal';
      clearInterval(quizMatchState.timerInterval);

      const sInput = document.getElementById('quizStreamerAnswerInput');
      if (sInput) sInput.disabled = true;

      const p = quizMatchState.currentPokemon;
      const overlay = document.getElementById('quizAnswerRevealOverlay');
      const winTitle = document.getElementById('quizAnswerWinnerTitle');
      const pSprite = document.getElementById('quizAnswerPokemonSprite');
      const pName = document.getElementById('quizAnswerPokemonName');
      const pInfo = document.getElementById('quizAnswerPokemonInfo');
      const winDetail = document.getElementById('quizAnswerWinnerDetail');

      if (p && pSprite) pSprite.src = p.sprite_front;
      if (p && pName) pName.innerText = p.name;
      if (p && pInfo) pInfo.innerText = `${p.genus || (p.types[0] + '포켓몬')} · ${p.types.join(' / ')}`;

      // Reveal silhouette image
      const silImg = document.getElementById('quizSilhouetteImg');
      if (silImg) silImg.classList.add('revealed');

      const streamerAns = quizMatchState.streamerSubmittedAnswer;
      const safeStreamerAns = escapeHtml(streamerAns || '미제출');
      const safeSName = escapeHtml(getStreamerName());
      const streamerMatch = streamerAns && p ? checkQuizAnswerMatch(streamerAns, p) : { isMatch: false };
      const totalVotes = quizMatchState.votingUsers.size;
      const entries = Object.entries(quizMatchState.voteCounts).sort((a, b) => b[1] - a[1]);
      const topVote = entries.length > 0 ? entries[0] : null;
      const safeTopVote = topVote ? escapeHtml(topVote[0]) : '';
      const firstViewer = quizMatchState.firstCorrectUser;
      const safeFirstNick = firstViewer ? escapeHtml(firstViewer.nickname) : '';
      const safeFirstMsg = firstViewer ? escapeHtml(firstViewer.msg) : '';

      if (winner === 'both') {
        if (winTitle) { winTitle.innerText = '🎉 스트리머 & 시청자 공동 정답! (양측 +1점)'; winTitle.style.color = '#00ffa3'; }
        if (winDetail) {
          if (quizMatchState.viewerMode === 'voting') {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#ffd700;">"${safeStreamerAns}"</span> (✅ 정답 +1점)</div>
                <div>👥 <b>시청자 1위</b>: <span style="color:#38bdf8;">"${safeTopVote}"</span> (${topVote ? Math.round((topVote[1]/Math.max(1,totalVotes))*100) : 0}% 득표, ✅ 정답 +1점)</div>
              </div>
            `;
          } else {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#ffd700;">"${safeStreamerAns}"</span> (✅ 정답 +1점)</div>
                <div>👥 <b>최초 정답 시청자</b>: <span style="color:#38bdf8;">${safeFirstNick}</span> ("${safeFirstMsg}", ✅ 정답 +1점)</div>
              </div>
            `;
          }
        }
        launchConfetti();
      } else if (winner === 'viewers') {
        if (winTitle) {
          winTitle.innerText = quizMatchState.viewerMode === 'voting'
            ? '🎉 시청자 집단지성 승리! (+1점)'
            : '🎉 시청자 스피드 승리! (+1점)';
          winTitle.style.color = '#38bdf8';
        }
        if (winDetail) {
          if (quizMatchState.viewerMode === 'voting') {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#f87171;">"${safeStreamerAns}"</span> (❌ 오답)</div>
                <div>👥 <b>시청자 1위</b>: <span style="color:#38bdf8;">"${safeTopVote}"</span> (${topVote ? Math.round((topVote[1]/Math.max(1,totalVotes))*100) : 0}% 득표, ✅ 정답 +1점)</div>
              </div>
            `;
          } else {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:${streamerMatch.isMatch ? '#ffd700' : '#f87171'};">"${safeStreamerAns}"</span> (${streamerMatch.isMatch ? '시청자가 더 빠름' : '❌ 오답'})</div>
                <div>👥 <b>최초 정답 시청자</b>: <b style="color:#38bdf8;">${safeFirstNick}</b> ("${safeFirstMsg}", ✅ 승리)</div>
              </div>
            `;
          }
        }
        launchConfetti();
      } else if (winner === 'streamer') {
        if (winTitle) { winTitle.innerText = `👑 ${getStreamerName()} 승리! (+1점)`; winTitle.style.color = '#ffd700'; }
        if (winDetail) {
          if (quizMatchState.viewerMode === 'voting') {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#ffd700;">"${safeStreamerAns}"</span> (✅ 정답 +1점)</div>
                <div>👥 <b>시청자 1위</b>: <span style="color:#f87171;">"${safeTopVote || '미참여'}"</span> (❌ 오답)</div>
              </div>
            `;
          } else {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#ffd700;">"${safeStreamerAns}"</span> (✅ 정답 +1점)</div>
                <div>👥 <b>시청자</b>: <span style="color:${firstViewer ? '#38bdf8' : '#f87171'};">${firstViewer ? safeFirstNick + ' ("' + safeFirstMsg + '", 스트리머가 더 빠름)' : '정답자 없음'}</span></div>
              </div>
            `;
          }
        }
        launchConfetti();
      } else {
        if (winTitle) { winTitle.innerText = '❌ 양측 모두 오답 / 시간 초과 (정답 공개)'; winTitle.style.color = '#f87171'; }
        if (winDetail) {
          if (quizMatchState.viewerMode === 'voting') {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#f87171;">"${safeStreamerAns}"</span> (❌ 오답)</div>
                <div>👥 <b>시청자 1위</b>: <span style="color:#f87171;">"${safeTopVote || '미참여'}"</span> (❌ 오답)</div>
                <div style="margin-top:2px; color:#ffd700;">정답: <b>${p ? escapeHtml(p.name) : '-'}</b></div>
              </div>
            `;
          } else {
            winDetail.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:4px; text-align:left; font-size:12px;">
                <div>👑 <b>${safeSName}</b>: <span style="color:#f87171;">"${safeStreamerAns}"</span> (❌ 오답)</div>
                <div>👥 <b>시청자</b>: <span style="color:#f87171;">정답자 없음</span></div>
                <div style="margin-top:2px; color:#ffd700;">정답: <b>${p ? escapeHtml(p.name) : '-'}</b></div>
              </div>
            `;
          }
        }
      }

      // Update Scores UI
      const sScore = document.getElementById('quizStreamerScoreText');
      const vScore = document.getElementById('quizViewersScoreText');
      if (sScore) sScore.innerText = quizMatchState.streamerScore;
      if (vScore) vScore.innerText = quizMatchState.viewersScore;

      if (overlay) overlay.style.display = 'flex';

      // Check Match Victory Condition
      if (quizMatchState.streamerScore >= quizMatchState.targetScore || quizMatchState.viewersScore >= quizMatchState.targetScore) {
        finishQuizMatch();
      } else {
        quizMatchState.round++;
      }
    }

    function finishQuizMatch() {
      quizMatchState.phase = 'ended';
      const isDraw = quizMatchState.streamerScore === quizMatchState.viewersScore;
      const isStreamerWinner = quizMatchState.streamerScore > quizMatchState.viewersScore;
      const winnerName = isDraw ? '공동 우승 (무승부)' : (isStreamerWinner ? getStreamerName() : '시청자 연합');

      const winTitle = document.getElementById('quizAnswerWinnerTitle');
      if (winTitle) {
        winTitle.innerText = isDraw ? `🏆 최종 매치 공동 우승 (무승부)! 🏆` : `🏆 최종 매치 우승: ${winnerName}! 🏆`;
        winTitle.style.color = isDraw ? '#00ffa3' : (isStreamerWinner ? '#ffd700' : '#38bdf8');
      }
      const winDetail = document.getElementById('quizAnswerWinnerDetail');
      if (winDetail) {
        winDetail.innerHTML = `최종 스코어: 👑 ${escapeHtml(getStreamerName())} ${quizMatchState.streamerScore}점 vs 👥 시청자 ${quizMatchState.viewersScore}점`;
      }
      launchConfetti();
    }

    function playCurrentQuizCry() {
      const p = quizMatchState.currentPokemon;
      if (p && p.cry_url) {
        playPokemonCry(p.id, p.cry_url);
      }
    }

    function playPokemonCry(id, url) {
      if (window.appGlobalMuted) return;
      try {
        if (currentQuizCryAudio) {
          currentQuizCryAudio.pause();
          currentQuizCryAudio = null;
        }
        const audioUrl = url || `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
        currentQuizCryAudio = new Audio(audioUrl);
        currentQuizCryAudio.volume = 0.7;
        currentQuizCryAudio.play().catch(e => console.log('Audio autoplay prevented or error:', e));
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }

    /* ============================================================== */
    /* 🛠️ DEVELOPER INSPECTOR & SIMULATOR LOGIC                       */
    /* ============================================================== */
    async function openQuizInspectorModal() {
      if (allPokemonQuizData.length === 0) {
        await loadPokemonQuizDataset();
      }
      const modal = document.getElementById('quizInspectorModal');
      if (modal) modal.classList.add('active');

      filterQuizInspectorList();
      selectQuizInspectorPokemon(quizInspectorSelectedPokeId || (allPokemonQuizData[0] ? allPokemonQuizData[0].id : 6));
    }

    function closeQuizInspectorModal() {
      const modal = document.getElementById('quizInspectorModal');
      if (modal) modal.classList.remove('active');
      if (currentQuizCryAudio) {
        currentQuizCryAudio.pause();
        currentQuizCryAudio = null;
      }
    }

    function filterQuizInspectorList() {
      const searchInput = document.getElementById('quizInspectorSearchInput');
      const genSelect = document.getElementById('quizInspectorGenSelect');
      const typeSelect = document.getElementById('quizInspectorTypeSelect');
      const listContainer = document.getElementById('quizInspectorList');
      const countText = document.getElementById('quizInspectorCountText');

      quizInspectorFilterText = searchInput ? searchInput.value.trim().toLowerCase() : '';
      quizInspectorGen = genSelect ? genSelect.value : 'all';
      quizInspectorType = typeSelect ? typeSelect.value : 'all';

      if (!listContainer) return;

      const filtered = allPokemonQuizData.filter(p => {
        // Gen filter
        if (quizInspectorGen !== 'all' && String(p.generation) !== quizInspectorGen) return false;
        // Type filter
        if (quizInspectorType !== 'all' && !p.types.includes(quizInspectorType)) return false;
        // Search text
        if (quizInspectorFilterText) {
          const matchName = p.name.toLowerCase().includes(quizInspectorFilterText);
          const matchChosung = (p.chosung || '').includes(quizInspectorFilterText);
          const matchId = String(p.id).includes(quizInspectorFilterText);
          const matchGenus = (p.genus || '').includes(quizInspectorFilterText);
          if (!matchName && !matchChosung && !matchId && !matchGenus) return false;
        }
        return true;
      });

      if (countText) countText.innerText = `검색 결과: 총 ${filtered.length}마리 / 전체 ${allPokemonQuizData.length}마리`;

      listContainer.innerHTML = filtered.map(p => {
        const pKey = p.code || String(p.id);
        const isSelected = pKey === quizInspectorSelectedPokeId || p.id === quizInspectorSelectedPokeId;
        return `
          <div class="quiz-inspector-card ${isSelected ? 'active' : ''}" onclick="selectQuizInspectorPokemon('${pKey}')">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <img src="${p.sprite_front}" alt="${p.name}" style="width: 32px; height: 32px; object-fit: contain;">
                <div>
                  <div style="font-weight: 800; color: #fff; font-size: 12px;">${p.name} <span style="font-size: 10px; color: var(--text-sub);">#${p.id}</span></div>
                  <div style="font-size: 10px; color: #ffd700;">초성: ${p.chosung || getChosungText(p.name)}</div>
                </div>
              </div>
              <div style="display: flex; gap: 2px;">
                ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    function selectQuizInspectorPokemon(idOrCode) {
      quizInspectorSelectedPokeId = idOrCode;
      const p = allPokemonQuizData.find(x => x.code === idOrCode || x.id === idOrCode || x.name === idOrCode || String(x.id) === String(idOrCode)) || allPokemonQuizData[0];
      if (!p) return;

      // Update active card in list
      const pKey = p.code || String(p.id);
      const cards = document.querySelectorAll('.quiz-inspector-card');
      cards.forEach(c => {
        const oc = c.getAttribute('onclick') || '';
        c.classList.toggle('active', oc.includes(`'${pKey}'`) || oc.includes(`'${p.id}'`));
      });

      // Header Card
      const sImg = document.getElementById('quizInspSprite');
      const nameElem = document.getElementById('quizInspName');
      const idElem = document.getElementById('quizInspId');
      const genElem = document.getElementById('quizInspGen');
      const genusElem = document.getElementById('quizInspGenus');
      const typesElem = document.getElementById('quizInspTypes');

      if (sImg) sImg.src = p.sprite_front;
      if (nameElem) nameElem.innerText = p.name;
      if (idElem) idElem.innerText = `#${String(p.id).padStart(3, '0')}`;
      if (genElem) genElem.innerText = `${p.generation || 1}세대`;
      if (genusElem) genusElem.innerText = p.genus || '포켓몬';
      if (typesElem) {
        typesElem.innerHTML = p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 10px; padding: 2px 6px;">${t}</span>`).join('');
      }

      // Preview 1: Silhouette
      const silImg = document.getElementById('quizInspSilhouetteImg');
      const silToggle = document.getElementById('quizInspSilhouetteToggle');
      if (silImg) {
        silImg.src = p.sprite_front;
        silImg.style.filter = (silToggle && silToggle.checked) ? 'brightness(0)' : 'brightness(1)';
      }

      // Preview 2: Consonants & Aliases
      const chosungBox = document.getElementById('quizInspChosungBox');
      const aliasesElem = document.getElementById('quizInspAliases');
      if (chosungBox) {
        const cho = p.chosung || getChosungText(p.name);
        chosungBox.innerHTML = renderQuizChosungHtml(cho, true);
      }
      if (aliasesElem) {
        aliasesElem.innerText = (p.aliases && p.aliases.length > 0) ? p.aliases.join(', ') : p.name;
      }

      // Preview 3: Pokedex Entries
      renderInspFlavorText();

      // Clear Matcher input & test
      const testInput = document.getElementById('quizInspTestInput');
      if (testInput && testInput.value) {
        testQuizAnswerMatcher(testInput.value);
      }
    }

    function toggleInspSilhouette(isMasked) {
      const silImg = document.getElementById('quizInspSilhouetteImg');
      if (silImg) {
        silImg.style.filter = isMasked ? 'brightness(0)' : 'brightness(1)';
      }
    }

    function getSelectedInspectorPokemon() {
      const idOrCode = quizInspectorSelectedPokeId;
      return allPokemonQuizData.find(x => x.code === idOrCode || x.id === idOrCode || x.name === idOrCode || String(x.id) === String(idOrCode)) || allPokemonQuizData[0];
    }

    function renderInspFlavorText(isMasked) {
      const p = getSelectedInspectorPokemon();
      if (!p) return;

      const maskToggle = document.getElementById('quizInspMaskToggle');
      const shouldMask = isMasked !== undefined ? isMasked : (maskToggle ? maskToggle.checked : true);
      const countElem = document.getElementById('quizInspFlavorCount');
      const listElem = document.getElementById('quizInspFlavorList');

      const flavors = p.pokedex_entries || [];
      if (countElem) countElem.innerText = flavors.length;

      if (!listElem) return;

      if (flavors.length === 0) {
        listElem.innerHTML = '<div style="color: var(--text-sub);">등록된 도감 설명이 없습니다.</div>';
        return;
      }

      listElem.innerHTML = flavors.map((f, idx) => {
        let txt = f.text;
        if (shouldMask) {
          const nameRegex = new RegExp(p.name, 'g');
          txt = txt.replace(nameRegex, '<b style="color:#ffd700; background:rgba(255,215,0,0.18); padding:1px 6px; border-radius:4px;">[ ??? ]</b>');
        }
        return `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 8px 10px;">
            <div style="font-size: 10px; color: var(--chzzk-green); font-weight: 700; margin-bottom: 2px;">#${idx + 1} (${f.version || '공식'})</div>
            <div>${txt}</div>
          </div>
        `;
      }).join('');
    }

    function playInspectorCry() {
      const p = getSelectedInspectorPokemon();
      if (p) {
        playPokemonCry(p.id, p.cry_url);
      }
    }

    function testQuizAnswerMatcher(input) {
      const p = getSelectedInspectorPokemon();
      const badge = document.getElementById('quizInspTestResultBadge');
      const detail = document.getElementById('quizInspTestDetail');
      if (!p || !badge || !detail) return;

      if (!input || !input.trim()) {
        badge.innerText = '입력 대기 중';
        badge.style.background = 'rgba(255,255,255,0.08)';
        badge.style.color = 'var(--text-sub)';
        detail.innerText = '';
        return;
      }

      const res = checkQuizAnswerMatch(input, p);
      if (res.isMatch) {
        const typeMap = {
          exact: '완전 일치',
          chosung: '초성 일치',
          alias: '별칭 일치',
          contains: '포함 일치'
        };
        badge.innerText = `✅ 정답 인정 (${typeMap[res.matchType] || res.matchType})`;
        badge.style.background = 'rgba(0, 255, 163, 0.2)';
        badge.style.color = 'var(--chzzk-green)';
        badge.style.border = '1px solid var(--chzzk-green)';
        detail.innerText = `입력값 "${input}" ➡️ 정답 [${p.name}] 매칭 성공!`;
      } else {
        badge.innerText = '❌ 오답 (미인정)';
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#ef4444';
        badge.style.border = '1px solid #ef4444';
        detail.innerText = `입력값 "${input}" 은 [${p.name}] 의 이름, 초성(${p.chosung}), 별칭과 일치하지 않습니다.`;
      }
    }

    // Initialize
    loadSavedCookies();
    initGlobalMuteUI();
    initObsChromaUI();
    renderManualRouletteRows();
    renderRouletteCustomPresets();
    renderPollOptionsList();
    renderPollCustomPresets();
    initNewMatch(true);
    loadPokemonDataset();
    updateSettingsSummaryBadges();
    initDockedChatSidebar();
    renderRecentChannels();
    checkAndShowSessionRestoreBanner();

    // 🚀 NEW: Initialize Start Screen vs Workspace view state
    function initWelcomeScreen() {
      const welcome = document.getElementById('welcomeLandingScreen');
      const workspace = document.getElementById('appWorkspaceArea');
      const backBtn = document.getElementById('welcomeBackToWorkspaceBtn');
      if (isConnected) {
        if (welcome) welcome.style.display = 'none';
        if (workspace) workspace.style.display = 'block';
        if (backBtn) backBtn.style.display = 'inline-flex';
      } else {
        if (welcome) welcome.style.display = 'flex';
        if (workspace) workspace.style.display = 'none';
      }
      if (typeof updateFloatingChatTabUI === 'function') updateFloatingChatTabUI();
    }
    initWelcomeScreen();
