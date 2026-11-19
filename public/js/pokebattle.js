    // ==========================================
    // ⚔️ POKEMON BATTLE ENGINE (3v3 TEAM & 348 ITEMS & 87 MEGA EVOLUTIONS)
    // ==========================================
    var allPokemonData = [];
    var allPokemonItems = [];
    var allMegaEvolutions = [];
    var pokeTypeChart = {};

    var currentMinigame = 'voltorb';
    var pokeBattleMode = '3v3'; // '3v3' or '1v1'
    var streamerSetupSlotIdx = 0;
    var viewersSetupSlotIdx = 0;
    var pokePickerTarget = 'streamer';
    var pokePickerSlotIdx = 0;
    var currentPokeTypeFilter = 'all';

    var streamerTeamHasMegaEvolved = false;
    var viewersTeamHasMegaEvolved = false;
    var streamerMegaSelected = false;

    var streamerTeam = [
      { pokemon: null, item: 'charizardite_x', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false },
      { pokemon: null, item: 'gengarite', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false },
      { pokemon: null, item: 'focus_sash', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false }
    ];

    var viewersTeam = [
      { pokemon: null, item: 'focus_sash', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false },
      { pokemon: null, item: 'blastoisinite', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false },
      { pokemon: null, item: 'choice_band', currentHP: 0, maxHP: 0, fainted: false, isMega: false, choiceMove: null, itemUsed: false, rankAtk: 0, rankDef: 0, rankSpA: 0, rankSpD: 0, rankSpe: 0, status: null, toxicTurns: 0, destinyBond: false, flinched: false }
    ];

    var streamerActiveIdx = 0;
    var viewersActiveIdx = 0;
    var streamerActionTab = 'moves'; // 'moves' or 'switch'

    var pokeBattleState = {
      active: false,
      round: 1,
      phase: 'idle',
      streamerAction: null,
      viewersAction: null,
      streamerTimerInterval: null,
      streamerTimerRemaining: 30,
      streamerTimerTotal: 30,
      viewersTimerInterval: null,
      viewersTimerRemaining: 30,
      viewersTimerTotal: 30,
      faintTimerInterval: null,
      faintTimerRemaining: 15,
      faintTimerTotal: 15,
      stats: { totalRounds: 0, streamerDamage: 0, viewersDamage: 0, crits: 0, superEffective: 0 }
    };

    let pokeVoteUsers = new Map();
    let pokeVoteCounts = {};
    let faintVoteUsers = new Map();
    let faintVoteCounts = {};
    let currentFaintTarget = null; // 'streamer' or 'viewers'

    // 👥 Viewers Faction Battle Mode (시청자 진영 대항전: Red vs Blue) State
    var pokeBattleSubMode = 'streamer_vs_viewers'; // 'streamer_vs_viewers' | 'faction_battle'
    var factionAssignMethod = 'random_equal'; // 'random_equal' | 'viewer_choice'
    var factionTeamNames = { red: '레드팀', blue: '블루팀' };
    var factionRecruiting = false;
    var factionRecruitRemaining = 30;
    var factionRecruitTotal = 30;
    var factionRecruitTimerInterval = null;
    var recruitedViewersMap = new Map(); // uid -> { uid, nickname, time }
    var factionChoiceRecruits = { red: new Map(), blue: new Map() }; // uid -> { uid, nickname, time }
    var factionUserMap = new Map(); // uid -> 'red' | 'blue'
    var factionRedMembers = []; // array of { uid, nickname }
    var factionBlueMembers = []; // array of { uid, nickname }

    // Dual Voting & Turn State for Faction Mode
    var factionRedVoteUsers = new Map(); // uid -> choiceKey
    var factionRedVoteCounts = {};
    var factionBlueVoteUsers = new Map(); // uid -> choiceKey
    var factionBlueVoteCounts = {};
    var factionFaintSide = null; // 'red' | 'blue'
    var factionFaintVoteUsers = new Map(); // uid -> slotIdx
    var factionFaintVoteCounts = {};
    var factionFaintAliveSlotsCached = [];
    var factionBattleStats = {
      redDamage: 0,
      blueDamage: 0,
      userContributionMap: new Map() // uid -> { nickname, team, votesCount, damageDealt }
    };

    function switchMinigame(mode) {
      currentMinigame = mode;
      const subTabVoltorbBtn = document.getElementById('subTabVoltorbBtn');
      const subTabPokeBattleBtn = document.getElementById('subTabPokeBattleBtn');
      const voltorbSection = document.getElementById('voltorbGameSection');
      const pokeBattleSection = document.getElementById('pokeBattleGameSection');
      const pokeQuizSection = document.getElementById('pokeQuizGameSection');

      if (mode === 'voltorb') {
        if (subTabVoltorbBtn) subTabVoltorbBtn.classList.add('active');
        if (subTabPokeBattleBtn) subTabPokeBattleBtn.classList.remove('active');
        if (voltorbSection) voltorbSection.style.display = 'flex';
        if (pokeBattleSection) pokeBattleSection.style.display = 'none';
        if (pokeQuizSection) pokeQuizSection.style.display = 'none';
      } else if (mode === 'pokebattle') {
        if (subTabPokeBattleBtn) subTabPokeBattleBtn.classList.add('active');
        if (subTabVoltorbBtn) subTabVoltorbBtn.classList.remove('active');
        if (voltorbSection) voltorbSection.style.display = 'none';
        if (pokeBattleSection) pokeBattleSection.style.display = 'flex';
        if (pokeQuizSection) pokeQuizSection.style.display = 'none';
        if (typeof updateBgmUIControls === 'function') updateBgmUIControls();
        if (typeof updateSfxUIControls === 'function') updateSfxUIControls();
        if (allPokemonData.length === 0) {
          loadPokemonDataset();
        } else {
          if (typeof renderPokeSetupPreview === 'function') renderPokeSetupPreview();
        }
      } else if (mode === 'pokequiz') {
        if (subTabVoltorbBtn) subTabVoltorbBtn.classList.remove('active');
        if (subTabPokeBattleBtn) subTabPokeBattleBtn.classList.remove('active');
        if (voltorbSection) voltorbSection.style.display = 'none';
        if (pokeBattleSection) pokeBattleSection.style.display = 'none';
        if (pokeQuizSection) pokeQuizSection.style.display = 'flex';
        loadPokemonQuizDataset().then(() => {
          updateQuizStreamerProfileUI();
        });
      }
      if (bgCharGame) bgCharGame.style.backgroundImage = "url('voltorb-bg.png')";
      if (typeof updateSettingsSummaryBadges === 'function') updateSettingsSummaryBadges();
    }

    async function loadPokemonDataset() {
      try {
        const res = await fetch('/pokemon_data.json?v=5.4.0');
        const data = await res.json();
        allPokemonData = data.pokemons || [];
        allPokemonData.sort((a, b) => (a.id - b.id) || (a.code || '').localeCompare(b.code || ''));
        allPokemonItems = data.items || [];
        allMegaEvolutions = data.mega_evolutions || [];
        if (allMegaEvolutions.length > 0) {
          allMegaEvolutions.sort((a, b) => (a.basePokeId - b.basePokeId) || (a.formSlug || '').localeCompare(b.formSlug || ''));
        }
        pokeTypeChart = data.type_chart || {};
        loadPokerogueMoveAnims();
      } catch (e) {
        console.warn('Failed to load pokemon_data.json', e);
      }

      if (allPokemonData.length > 0) {
        // Default team setups (Clean deep clones)
        const s0 = allPokemonData.find(p => p.id === 6) || allPokemonData[0];   // Charizard
        const s1 = allPokemonData.find(p => p.id === 94) || allPokemonData[1];  // Gengar
        const s2 = allPokemonData.find(p => p.id === 445) || allPokemonData[2]; // Garchomp
        streamerTeam[0].basePokeCode = s0.code || String(s0.id);
        streamerTeam[0].pokemon = JSON.parse(JSON.stringify(s0));
        streamerTeam[1].basePokeCode = s1.code || String(s1.id);
        streamerTeam[1].pokemon = JSON.parse(JSON.stringify(s1));
        streamerTeam[2].basePokeCode = s2.code || String(s2.id);
        streamerTeam[2].pokemon = JSON.parse(JSON.stringify(s2));

        const v0 = allPokemonData.find(p => p.id === 25) || allPokemonData[3];  // Pikachu
        const v1 = allPokemonData.find(p => p.id === 9) || allPokemonData[4];   // Blastoise
        const v2 = allPokemonData.find(p => p.id === 68) || allPokemonData[5];  // Machamp
        viewersTeam[0].basePokeCode = v0.code || String(v0.id);
        viewersTeam[0].pokemon = JSON.parse(JSON.stringify(v0));
        viewersTeam[1].basePokeCode = v1.code || String(v1.id);
        viewersTeam[1].pokemon = JSON.parse(JSON.stringify(v1));
        viewersTeam[2].basePokeCode = v2.code || String(v2.id);
        viewersTeam[2].pokemon = JSON.parse(JSON.stringify(v2));

        populateItemDropdowns();
        renderPokeSetupPreview();
        renderPokemonPickerFilters();
      }
    }

    function revertPokemonToBaseForm(slot) {
      if (!slot || !slot.pokemon) return;
      const targetCodeOrId = slot.basePokeCode || slot.pokemon.code || String(slot.pokemon.id);
      const base = allPokemonData.find(p => (p.code && p.code === targetCodeOrId) || String(p.id) === String(targetCodeOrId));
      if (base) {
        slot.pokemon = JSON.parse(JSON.stringify(base));
        slot.basePokeCode = base.code || String(base.id);
      }
      slot.isMega = false;
    }

    function getItemObj(itemId) {
      if (!itemId || itemId === 'none') {
        return { id: 'none', slug: 'none', name: '없음', emoji: '⚪', desc: '지닌 도구 없음', sprite: '' };
      }
      const found = allPokemonItems.find(x => x.id === itemId || x.slug === itemId);
      if (found) return found;
      return { id: itemId, slug: itemId, name: itemId, emoji: '🎒', desc: '', sprite: '' };
    }

    function getAvailableMegaEvolution(poke, itemId) {
      if (!poke || !allMegaEvolutions || allMegaEvolutions.length === 0) return null;
      const itemObj = getItemObj(itemId);
      const candidates = allMegaEvolutions.filter(m => m.basePokeId === poke.id);
      if (candidates.length === 0) return null;

      for (const c of candidates) {
        if (c.requiredStoneId && (c.requiredStoneId === itemObj.id || c.requiredStoneId === itemObj.slug)) {
          return c;
        }
        const stoneName = (itemObj.name || '').toLowerCase();
        const stoneSlug = (itemObj.slug || '').toLowerCase();
        if (itemObj.categoryKo === '메가돌' || itemObj.category === 'mega-stones' || stoneName.includes('나이트') || stoneName.includes('스톤') || stoneSlug.includes('ite')) {
          if (c.nameKo.includes('X') && (stoneName.includes('x') || stoneSlug.includes('-x'))) return c;
          if (c.nameKo.includes('Y') && (stoneName.includes('y') || stoneSlug.includes('-y'))) return c;
          if (c.nameKo.includes('Z') && (stoneName.includes('z') || stoneSlug.includes('-z'))) return c;
          if (!c.nameKo.includes('X') && !c.nameKo.includes('Y') && !c.nameKo.includes('Z') && !stoneName.includes('x') && !stoneName.includes('y') && !stoneName.includes('z')) {
            const baseName = c.nameKo.replace('메가', '').replace(/[XYZ]/g, '');
            if (stoneName.includes(baseName)) return c;
          }
        }
      }

      if (poke.id === 384 && (itemObj.id.includes('rayquaza') || itemObj.name.includes('레쿠쟈'))) {
        return candidates[0];
      }
      return null;
    }

    function populateItemDropdowns() {
      const sSel = document.getElementById('streamerItemSelect');
      const vSel = document.getElementById('viewersItemSelect');
      const items = allPokemonItems.length > 0 ? allPokemonItems : [];

      if (items.length === 0) return;

      const competitiveIds = [
        'life-orb', 'focus-sash', 'leftovers', 'choice-scarf', 'choice-band', 'choice-specs',
        'assault-vest', 'sitrus-berry', 'lum-berry', 'expert-belt', 'rocky-helmet', 'eviolite',
        'scope-lens', 'kings-rock', 'black-sludge', 'big-root', 'white-herb', 'weakness-policy',
        'focus-band', 'covert-cloak', 'punching-glove', 'clear-amulet', 'booster-energy', 'loaded-dice',
        'heavy-duty-boots', 'safety-goggles', 'air-balloon', 'eject-button', 'red-card'
      ];

      const competitive = items.filter(it => competitiveIds.includes(it.id) || competitiveIds.includes(it.slug) || competitiveIds.includes(it.id.replace(/_/g, '-')));
      const megaStones = items.filter(it => it.categoryKo === '메가돌' || it.category === 'mega-stones' || it.name.includes('나이트') || it.name.includes('스톤') || it.id.includes('ite') || it.slug.includes('ite'));
      const plates = items.filter(it => it.categoryKo === '플레이트' || it.categoryKo === '보석' || it.categoryKo === '주얼' || it.categoryKo === '필드 시드');
      const berries = items.filter(it => it.categoryKo === '위기상황' || it.name.includes('열매'));
      const others = items.filter(it => it.id !== 'none' && !competitive.includes(it) && !megaStones.includes(it) && !plates.includes(it) && !berries.includes(it));

      let html = `<option value="none">⚪ 없음 - 지닌 도구 없음</option>`;

      html += `<optgroup label="⭐ 추천 실전 배틀 도구">`;
      competitive.forEach(it => {
        html += `<option value="${it.id}">${it.emoji} ${it.name} - ${it.desc}</option>`;
      });
      html += `</optgroup>`;

      html += `<optgroup label="💎 메가스톤 (Mega Stones - 전용 메가진화)">`;
      megaStones.forEach(it => {
        html += `<option value="${it.id}">${it.emoji} ${it.name} - ${it.desc}</option>`;
      });
      html += `</optgroup>`;

      html += `<optgroup label="🔮 플레이트 & 주얼 & 필드시드 (속성 강화)">`;
      plates.forEach(it => {
        html += `<option value="${it.id}">${it.emoji} ${it.name} - ${it.desc}</option>`;
      });
      html += `</optgroup>`;

      html += `<optgroup label="🍒 나무열매 & 위기 회복">`;
      berries.forEach(it => {
        html += `<option value="${it.id}">${it.emoji} ${it.name} - ${it.desc}</option>`;
      });
      html += `</optgroup>`;

      if (others.length > 0) {
        html += `<optgroup label="🎒 기타 도구">`;
        others.forEach(it => {
          html += `<option value="${it.id}">${it.emoji} ${it.name} - ${it.desc}</option>`;
        });
        html += `</optgroup>`;
      }

      if (sSel) sSel.innerHTML = html;
      if (vSel) vSel.innerHTML = html;
    }

    function handleBattleSubModeChange() {
      const sel = document.getElementById('pokeBattleSubModeSelect');
      if (sel) pokeBattleSubMode = sel.value;
      const drawerSel = document.getElementById('drawerPokeBattleSubModeSelect');
      if (drawerSel && drawerSel.value !== pokeBattleSubMode) {
        drawerSel.value = pokeBattleSubMode;
      }

      const banner = document.getElementById('factionSetupBanner');
      const startBtn = document.getElementById('startPokeBattleBtn');
      const sBadgeName = document.getElementById('pokeStreamerSetupName');
      const sBadgeAvatar = document.getElementById('pokeStreamerSetupAvatar');
      const sBadge = document.getElementById('pokeStreamerSetupBadge');
      const vBadge = document.getElementById('viewersPokeCard')?.querySelector('.badge-tag');

      const drawerMethodGroup = document.getElementById('drawerFactionAssignMethodGroup');
      if (pokeBattleSubMode === 'faction_battle') {
        if (banner) banner.style.display = 'block';
        if (drawerMethodGroup) drawerMethodGroup.style.display = 'block';
        if (startBtn) {
          startBtn.innerHTML = factionAssignMethod === 'viewer_choice' ? '🚩 시청자 진영 선택 시작' : '📢 시청자 참가 모집 시작';
          startBtn.style.background = 'linear-gradient(135deg, #00ffa3, #38bdf8)';
          startBtn.style.color = '#080c10';
        }
        if (sBadgeName) sBadgeName.innerText = `🔴 ${factionTeamNames.red}`;
        if (sBadgeAvatar) sBadgeAvatar.style.display = 'none';
        if (sBadge) {
          sBadge.style.background = 'rgba(239, 68, 68, 0.2)';
          sBadge.style.color = '#f87171';
        }
        if (vBadge) {
          vBadge.innerText = `🔵 ${factionTeamNames.blue}`;
          vBadge.style.background = 'rgba(56, 189, 248, 0.2)';
          vBadge.style.color = '#38bdf8';
        }
        showToast('🔴 👥 시청자 진영 대항전 모드가 활성화되었습니다!', '⚔️');
      } else {
        if (banner) banner.style.display = 'none';
        if (drawerMethodGroup) drawerMethodGroup.style.display = 'none';
        if (startBtn) {
          startBtn.innerHTML = '⚔️ 배틀 시작!';
          startBtn.style.background = '';
          startBtn.style.color = '';
        }
        const sAvatar = typeof getStreamerAvatar === 'function' ? getStreamerAvatar() : '';
        if (sBadgeAvatar) {
          if (sAvatar) {
            sBadgeAvatar.src = sAvatar;
            sBadgeAvatar.style.display = 'inline-block';
          } else {
            sBadgeAvatar.style.display = 'none';
          }
        }
        if (sBadge) {
          sBadge.style.background = 'rgba(255, 215, 0, 0.2)';
          sBadge.style.color = '#ffd700';
        }
        if (vBadge) {
          vBadge.innerText = '👥 시청자 팀';
          vBadge.style.background = 'rgba(56, 189, 248, 0.2)';
          vBadge.style.color = '#38bdf8';
        }
      }
      renderPokeSetupPreview();
      updateSettingsSummaryBadges();
    }
    window.handleBattleSubModeChange = handleBattleSubModeChange;

    function syncPokeBattleSubMode(val) {
      const sel = document.getElementById('pokeBattleSubModeSelect');
      if (sel) sel.value = val;
      handleBattleSubModeChange();
    }
    window.syncPokeBattleSubMode = syncPokeBattleSubMode;

    function handleFactionAssignMethodChange() {
      const sel = document.getElementById('factionAssignMethodSelect');
      if (sel) factionAssignMethod = sel.value;
      const drawerSel = document.getElementById('drawerFactionAssignMethodSelect');
      if (drawerSel && drawerSel.value !== factionAssignMethod) drawerSel.value = factionAssignMethod;

      const desc = document.getElementById('factionSetupMethodDesc');
      const badge = document.getElementById('factionSetupMethodBadge');
      const startBtn = document.getElementById('startPokeBattleBtn');

      if (pokeBattleSubMode === 'faction_battle' && startBtn) {
        startBtn.innerHTML = factionAssignMethod === 'viewer_choice' ? '🚩 시청자 진영 선택 시작' : '📢 시청자 참가 모집 시작';
      }

      if (desc && badge) {
        if (factionAssignMethod === 'viewer_choice') {
          badge.innerText = '시청자 직접 선택';
          badge.style.color = '#38bdf8';
          badge.style.background = 'rgba(56, 189, 248, 0.15)';
          desc.innerHTML = `시청자가 채팅창에 <b>1 (또는 '레드')</b> / <b>2 (또는 '블루')</b>를 쳐서 참가할 진영을 직접 선택합니다.`;
        } else {
          badge.innerText = '50:50 자유채팅 무작위';
          badge.style.color = '#00ffa3';
          badge.style.background = 'rgba(0, 255, 163, 0.15)';
          desc.innerHTML = `모집 시간 동안 채팅을 친 시청자들을 50:50으로 무작위 추첨하여 레드팀/블루팀에 균등 배정합니다.`;
        }
      }
    }
    window.handleFactionAssignMethodChange = handleFactionAssignMethodChange;

    function syncFactionAssignMethod(val) {
      factionAssignMethod = val;
      const sel = document.getElementById('factionAssignMethodSelect');
      if (sel) sel.value = val;
      handleFactionAssignMethodChange();
    }
    window.syncFactionAssignMethod = syncFactionAssignMethod;

    function handleFactionTeamNameChange() {
      const rInput = document.getElementById('factionRedNameInput');
      const bInput = document.getElementById('factionBlueNameInput');
      if (rInput && rInput.value.trim()) factionTeamNames.red = rInput.value.trim();
      if (bInput && bInput.value.trim()) factionTeamNames.blue = bInput.value.trim();

      const sBadgeName = document.getElementById('pokeStreamerSetupName');
      const vBadge = document.getElementById('viewersPokeCard')?.querySelector('.badge-tag');
      if (pokeBattleSubMode === 'faction_battle') {
        if (sBadgeName) sBadgeName.innerText = `🔴 ${factionTeamNames.red}`;
        if (vBadge) vBadge.innerText = `🔵 ${factionTeamNames.blue}`;
      }
    }
    window.handleFactionTeamNameChange = handleFactionTeamNameChange;

    function handleBattleModeChange() {
      const sel = document.getElementById('pokeBattleModeSelect');
      if (sel) pokeBattleMode = sel.value;
      const drawerSelect = document.getElementById('drawerPokeBattleModeSelect');
      if (drawerSelect && drawerSelect.value !== pokeBattleMode) {
        drawerSelect.value = pokeBattleMode;
      }
      const sRow = document.getElementById('streamerSlotTabsRow');
      const vRow = document.getElementById('viewersSlotTabsRow');
      const banner = document.getElementById('pokeModeBannerText');

      if (pokeBattleMode === '1v1') {
        if (sRow) sRow.style.display = 'none';
        if (vRow) vRow.style.display = 'none';
        if (banner) banner.innerText = '1v1 에이스 진검승부';
        streamerSetupSlotIdx = 0;
        viewersSetupSlotIdx = 0;
      } else {
        if (sRow) sRow.style.display = 'flex';
        if (vRow) vRow.style.display = 'flex';
        if (banner) banner.innerText = '3v3 팀 엔트리 교체 배틀';
      }
      renderPokeSetupPreview();
      updateSettingsSummaryBadges();
    }

    function switchPokeSetupSlot(side, slotIdx) {
      if (side === 'streamer') {
        streamerSetupSlotIdx = slotIdx;
        for (let i = 0; i < 3; i++) {
          const btn = document.getElementById(`sSlotBtn${i}`);
          if (btn) btn.classList.toggle('active', i === slotIdx);
        }
      } else {
        viewersSetupSlotIdx = slotIdx;
        for (let i = 0; i < 3; i++) {
          const btn = document.getElementById(`vSlotBtn${i}`);
          if (btn) btn.classList.toggle('active', i === slotIdx);
        }
      }
      renderPokeSetupPreview();
    }
    function switchSetupSlot(side, slotIdx) {
      switchPokeSetupSlot(side, slotIdx);
    }
    window.switchSetupSlot = switchPokeSetupSlot;
    window.switchPokeSetupSlot = switchPokeSetupSlot;

    function handleItemChange(side, itemId) {
      const it = getItemObj(itemId);
      if (side === 'streamer') {
        streamerTeam[streamerSetupSlotIdx].item = itemId;
        if (it) showToast(`👑 ${getStreamerName()} ${streamerSetupSlotIdx+1}번 포켓몬 도구: [${it.emoji} ${it.name}]`, '🎒');
      } else {
        viewersTeam[viewersSetupSlotIdx].item = itemId;
        if (it) showToast(`👥 시청자 ${viewersSetupSlotIdx+1}번 포켓몬 도구: [${it.emoji} ${it.name}]`, '🎒');
      }
    }

    function renderPokeSetupPreview() {
      if (allPokemonData.length === 0) return;

      const sSlot = streamerTeam[streamerSetupSlotIdx];
      const vSlot = viewersTeam[viewersSetupSlotIdx];

      // Streamer Card
      if (sSlot && sSlot.pokemon) {
        const p = sSlot.pokemon;
        document.getElementById('streamerPokeNumber').innerText = `#${String(p.id).padStart(3, '0')}`;
        document.getElementById('streamerPokeSprite').src = p.sprite_front;
        document.getElementById('streamerPokeName').innerText = `${p.name} ${pokeBattleMode === '3v3' ? `(${streamerSetupSlotIdx+1}번)` : ''}`;
        document.getElementById('streamerPokeTypes').innerHTML = p.types.map(t => `<span class="type-badge type-${t}">${getTypeEmoji(t)} ${t}</span>`).join('');
        document.getElementById('streamerItemSelect').value = sSlot.item || 'none';

        const sHP = calculateLevel50HP(p.stats.hp);
        document.getElementById('streamerStatHP').innerText = sHP;
        document.getElementById('streamerStatAtk').innerText = p.stats.atk;
        document.getElementById('streamerStatDef').innerText = p.stats.def;
        document.getElementById('streamerStatSpA').innerText = p.stats.spa;
        document.getElementById('streamerStatSpD').innerText = p.stats.spd;
        document.getElementById('streamerStatSpe').innerText = p.stats.spe;

        document.getElementById('streamerPokeMovesPreview').innerHTML = p.moves.map((m, i) => `
          <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; text-align: left; font-size: 11px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 800; color: #fff;">${i+1}. ${m.name}</span>
              <span class="type-badge type-${m.type}" style="font-size: 9px; padding: 1px 4px;">${m.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-sub); font-size: 10px; margin-top: 2px;">
              <span>${m.category === '변화' ? '🛡️ 랭크업/상태' : `위력 ${m.power} / 명중 ${m.acc}%`}</span>
              <span style="color: #ffd700; font-weight: 800;">PP ${m.pp || 15}</span>
            </div>
          </div>
        `).join('');
      }

      // Viewers Card
      if (vSlot && vSlot.pokemon) {
        const p = vSlot.pokemon;
        document.getElementById('viewersPokeNumber').innerText = `#${String(p.id).padStart(3, '0')}`;
        document.getElementById('viewersPokeSprite').src = p.sprite_front;
        document.getElementById('viewersPokeName').innerText = `${p.name} ${pokeBattleMode === '3v3' ? `(${viewersSetupSlotIdx+1}번)` : ''}`;
        document.getElementById('viewersPokeTypes').innerHTML = p.types.map(t => `<span class="type-badge type-${t}">${getTypeEmoji(t)} ${t}</span>`).join('');
        document.getElementById('viewersItemSelect').value = vSlot.item || 'none';

        const vHP = calculateLevel50HP(p.stats.hp);
        document.getElementById('viewersStatHP').innerText = vHP;
        document.getElementById('viewersStatAtk').innerText = p.stats.atk;
        document.getElementById('viewersStatDef').innerText = p.stats.def;
        document.getElementById('viewersStatSpA').innerText = p.stats.spa;
        document.getElementById('viewersStatSpD').innerText = p.stats.spd;
        document.getElementById('viewersStatSpe').innerText = p.stats.spe;

        document.getElementById('viewersPokeMovesPreview').innerHTML = p.moves.map((m, i) => `
          <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; text-align: left; font-size: 11px; border: 1px solid rgba(255,255,255,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 800; color: #fff;">${i+1}. ${m.name}</span>
              <span class="type-badge type-${m.type}" style="font-size: 9px; padding: 1px 4px;">${m.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: var(--text-sub); font-size: 10px; margin-top: 2px;">
              <span>${m.category === '변화' ? '🛡️ 랭크업/상태' : `위력 ${m.power} / 명중 ${m.acc}%`}</span>
              <span style="color: #ffd700; font-weight: 800;">PP ${m.pp || 15}</span>
            </div>
          </div>
        `).join('');
      }

      if (typeof updateBgmUIControls === 'function') updateBgmUIControls();
      if (typeof updateSfxUIControls === 'function') updateSfxUIControls();
    }

    function calculateLevel50HP(base) {
      return Math.floor(((2 * base + 31 + 10) * 50) / 100 + 50 + 10);
    }

    function getTypeEmoji(t) {
      const map = { "불꽃": "🔥", "물": "💧", "풀": "🌿", "전기": "⚡", "얼음": "❄️", "격투": "🥊", "독": "☠️", "땅": "🏜️", "비행": "🦅", "에스퍼": "🔮", "벌레": "🐛", "바위": "🪨", "고스트": "👻", "드래곤": "🐉", "악": "🌙", "강철": "⚙️", "페어리": "✨", "노말": "⚪" };
      return map[t] || "⚪";
    }

    // --- Pokemon Picker Modal (213 Pokemon Search & Filter) ---
    function openPokemonPicker(target) {
      pokePickerTarget = target;
      pokePickerSlotIdx = target === 'streamer' ? streamerSetupSlotIdx : viewersSetupSlotIdx;
      const modal = document.getElementById('pokemonPickerModal');
      const label = document.getElementById('pokemonPickerTargetLabel');
      if (label) {
        label.innerText = target === 'streamer' 
          ? `👑 ${getStreamerName()} [${pokeBattleMode === '3v3' ? `${pokePickerSlotIdx+1}번 포켓몬` : '에이스'}]을 선택하세요`
          : `👥 시청자 연합 [${pokeBattleMode === '3v3' ? `${pokePickerSlotIdx+1}번 포켓몬` : '에이스'}]을 선택하세요`;
      }
      renderPokemonPickerFilters();
      filterPokemonGrid();
      if (modal) modal.classList.add('active');
    }

    function closePokemonPickerModal() {
      const modal = document.getElementById('pokemonPickerModal');
      if (modal) modal.classList.remove('active');
    }

    function renderPokemonPickerFilters() {
      const container = document.getElementById('pokeTypeFilterContainer');
      if (!container) return;
      const types = ['all', '노말', '불꽃', '물', '풀', '전기', '얼음', '격투', '독', '땅', '비행', '에스퍼', '벌레', '바위', '고스트', '드래곤', '악', '강철', '페어리'];
      
      container.innerHTML = types.map(t => `
        <button type="button" class="filter-chip-btn ${currentPokeTypeFilter === t ? 'active' : ''}" style="white-space: nowrap; padding: 4px 10px; font-size: 11px;" onclick="setPokeTypeFilter('${t}')">
          <span>${t === 'all' ? '🌈 전체' : `${getTypeEmoji(t)} ${t}`}</span>
        </button>
      `).join('');
    }

    function setPokeTypeFilter(type) {
      currentPokeTypeFilter = type;
      renderPokemonPickerFilters();
      filterPokemonGrid();
    }

    function resetPokemonPickerFilters() {
      const searchInput = document.getElementById('pokeSearchInput');
      if (searchInput) searchInput.value = '';
      currentPokeTypeFilter = 'all';
      renderPokemonPickerFilters();
      filterPokemonGrid();
    }

    function filterPokemonGrid() {
      const grid = document.getElementById('pokeGridContainer');
      const searchInput = document.getElementById('pokeSearchInput');
      if (!grid) return;

      const q = (searchInput ? searchInput.value : '').trim().toLowerCase();

      const filtered = allPokemonData.filter(p => {
        const matchesType = (currentPokeTypeFilter === 'all' || p.types.includes(currentPokeTypeFilter));
        const matchesQuery = (!q || p.name.toLowerCase().includes(q) || String(p.id).includes(q) || p.code.toLowerCase().includes(q));
        return matchesType && matchesQuery;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-sub); padding: 40px 0; font-size: 13px;">일치하는 포켓몬이 없습니다.</div>';
        return;
      }

      grid.innerHTML = filtered.map(p => {
        const hasMega = allMegaEvolutions.some(m => m.basePokeId === p.id);
        return `
          <div class="poke-grid-item" onclick="selectPokemonFromPicker('${p.code || p.id}')">
            <div style="position: relative; width: 72px; height: 72px; margin: 0 auto;">
              <img src="${p.sprite_front}" alt="${p.name}" style="width: 72px; height: 72px; object-fit: contain; image-rendering: pixelated;" onerror="this.src='pokemon/25.png'">
              ${hasMega ? '<span class="mega-tag-badge" style="position: absolute; bottom: 0; right: -4px; font-size: 9px;">🧬 MEGA</span>' : ''}
            </div>
            <div style="font-size: 10px; color: var(--text-sub); margin-top: 2px;">#${String(p.id).padStart(3, '0')}</div>
            <div style="font-size: 13px; font-weight: 800; color: #fff; margin: 2px 0 4px;">${p.name}</div>
            <div style="display: flex; gap: 3px; flex-wrap: wrap; justify-content: center;">
              ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    function selectPokemonFromPicker(pokeCodeOrId) {
      const found = allPokemonData.find(p => (p.code && p.code === pokeCodeOrId) || String(p.id) === String(pokeCodeOrId));
      if (!found) return;

      const team = pokePickerTarget === 'streamer' ? streamerTeam : viewersTeam;
      team[pokePickerSlotIdx].basePokeCode = found.code || String(found.id);
      team[pokePickerSlotIdx].pokemon = JSON.parse(JSON.stringify(found));
      team[pokePickerSlotIdx].isMega = false;

      // Auto-suggest Mega Stone if available
      const megaForm = allMegaEvolutions.find(m => m.basePokeId === found.id);
      if (megaForm && megaForm.requiredStoneId) {
        team[pokePickerSlotIdx].item = megaForm.requiredStoneId;
      }

      if (pokePickerTarget === 'streamer') {
        showToast(`👑 ${getStreamerName()} [${found.name}] 선택 완료! ${megaForm ? `(💎 ${getItemObj(team[pokePickerSlotIdx].item).name} 자동 장착)` : ''}`, '🔥');
      } else {
        showToast(`👥 시청자 [${found.name}] 선택 완료! ${megaForm ? `(💎 ${getItemObj(team[pokePickerSlotIdx].item).name} 자동 장착)` : ''}`, '⚡');
      }
      renderPokeSetupPreview();
      closePokemonPickerModal();
    }

    function randomizeSlotItem(side) {
      const team = side === 'streamer' ? streamerTeam : viewersTeam;
      const currentSlot = team[side === 'streamer' ? streamerSetupSlotIdx : viewersSetupSlotIdx];
      const poke = currentSlot.pokemon;
      const megaForm = poke ? allMegaEvolutions.find(m => m.basePokeId === poke.id) : null;

      // 40% chance to equip matching Mega Stone if pokemon can mega evolve
      if (megaForm && megaForm.requiredStoneId && Math.random() < 0.45) {
        currentSlot.item = megaForm.requiredStoneId;
      } else {
        const itemPool = allPokemonItems.filter(x => x.id !== 'none');
        const randItem = itemPool[Math.floor(Math.random() * itemPool.length)];
        currentSlot.item = randItem.id;
      }

      const itemObj = getItemObj(currentSlot.item);
      const sel = document.getElementById(side === 'streamer' ? 'streamerItemSelect' : 'viewersItemSelect');
      if (sel) sel.value = currentSlot.item;

      showToast(`${side === 'streamer' ? `👑 ${getStreamerName()}` : '👥 시청자'} 도구: [${itemObj.emoji} ${itemObj.name}] 배정!`, '🎒');
    }

    function randomizeCurrentSlot(target) {
      if (allPokemonData.length === 0) return;
      const rand = allPokemonData[Math.floor(Math.random() * allPokemonData.length)];
      const team = target === 'streamer' ? streamerTeam : viewersTeam;
      const slotIdx = target === 'streamer' ? streamerSetupSlotIdx : viewersSetupSlotIdx;

      team[slotIdx].basePokeCode = rand.code || String(rand.id);
      team[slotIdx].pokemon = JSON.parse(JSON.stringify(rand));
      team[slotIdx].isMega = false;
      randomizeSlotItem(target);

      showToast(`${target === 'streamer' ? `👑 ${getStreamerName()}` : '👥 시청자'} ${slotIdx+1}번: [${rand.name}] 랜덤 배정!`, '🎲');
      renderPokeSetupPreview();
    }

    function randomizeAllTeams() {
      if (allPokemonData.length < 6) return;
      const shuffled = [...allPokemonData].sort(() => 0.5 - Math.random());

      for (let i = 0; i < 3; i++) {
        streamerTeam[i].basePokeCode = shuffled[i].code || String(shuffled[i].id);
        streamerTeam[i].pokemon = JSON.parse(JSON.stringify(shuffled[i]));
        streamerTeam[i].isMega = false;
        const sMega = allMegaEvolutions.find(m => m.basePokeId === shuffled[i].id);
        if (sMega && sMega.requiredStoneId && Math.random() < 0.5) {
          streamerTeam[i].item = sMega.requiredStoneId;
        } else {
          const randIt = allPokemonItems[Math.floor(Math.random() * allPokemonItems.length)];
          streamerTeam[i].item = randIt.id;
        }

        viewersTeam[i].basePokeCode = shuffled[i + 3].code || String(shuffled[i + 3].id);
        viewersTeam[i].pokemon = JSON.parse(JSON.stringify(shuffled[i + 3]));
        viewersTeam[i].isMega = false;
        const vMega = allMegaEvolutions.find(m => m.basePokeId === shuffled[i + 3].id);
        if (vMega && vMega.requiredStoneId && Math.random() < 0.5) {
          viewersTeam[i].item = vMega.requiredStoneId;
        } else {
          const randIt = allPokemonItems[Math.floor(Math.random() * allPokemonItems.length)];
          viewersTeam[i].item = randIt.id;
        }
      }

      showToast('🎲 양팀 포켓몬 및 도구(메가스톤 포함)가 무작위로 구성되었습니다!', '✨');
      renderPokeSetupPreview();
    }

    // --- Battle Arena Execution Engine ---
    function startPokeBattle() {
      const sel = document.getElementById('pokeBattleModeSelect');
      if (sel) pokeBattleMode = sel.value;
      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;

      for (let i = 0; i < teamSize; i++) {
        if (!streamerTeam[i].pokemon || !viewersTeam[i].pokemon) {
          showToast('포켓몬 엔트리가 완성되지 않았습니다.', '⚠️');
          return;
        }
      }

      if (pokeBattleSubMode === 'faction_battle') {
        startFactionRecruitment();
        return;
      }

      launchPokeBattleActual();
    }
    window.startPokeBattle = startPokeBattle;

    // ==========================================
    // 👥 FACTION RECRUITMENT & DRAFT ENGINE
    // ==========================================
    function startFactionRecruitment() {
      factionRecruiting = true;
      recruitedViewersMap.clear();
      factionChoiceRecruits = { red: new Map(), blue: new Map() };

      const modal = document.getElementById('factionRecruitModal');
      const timerText = document.getElementById('factionRecruitTimerText');
      const timerFill = document.getElementById('factionRecruitTimerFill');
      const countBadge = document.getElementById('factionRecruitedCountBadge');
      const chattersList = document.getElementById('factionRecruitChattersList');

      const durSel = document.getElementById('factionRecruitDurationSelect');
      factionRecruitTotal = parseFloat(durSel?.value || 30.0) || 30.0;
      factionRecruitRemaining = factionRecruitTotal;

      if (timerText) timerText.innerText = `${factionRecruitRemaining.toFixed(1)}s`;
      if (timerFill) timerFill.style.width = '100%';

      const statusBadge = document.getElementById('factionRecruitStatusBadge');
      const modalTitle = document.getElementById('factionRecruitModalTitle');
      const modalDesc = document.getElementById('factionRecruitModalDesc');
      const randomSec = document.getElementById('factionRecruitRandomSection');
      const choiceSec = document.getElementById('factionRecruitChoiceSection');
      const confirmBtn = document.getElementById('factionRecruitConfirmBtn');

      if (factionAssignMethod === 'viewer_choice') {
        if (statusBadge) {
          statusBadge.innerHTML = '🚩 시청자 직접 진영 선택 중';
          statusBadge.style.color = '#38bdf8';
          statusBadge.style.background = 'rgba(56, 189, 248, 0.15)';
        }
        if (modalTitle) modalTitle.innerText = '시청자 진영 선택 참가자 모집';
        if (modalDesc) {
          modalDesc.innerHTML = `
            원하는 팀 키워드를 채팅창에 입력하여 진영을 직접 선택하세요!<br>
            <div style="margin-top: 6px; display: inline-flex; gap: 14px; font-size: 12px; font-weight: 800; flex-wrap: wrap; justify-content: center;">
              <span style="color: #f87171;">🔴 [${escapeHtml(factionTeamNames.red)}]: "1", "레드", "${escapeHtml(factionTeamNames.red)}"</span>
              <span style="color: #38bdf8;">🔵 [${escapeHtml(factionTeamNames.blue)}]: "2", "블루", "${escapeHtml(factionTeamNames.blue)}"</span>
            </div>
          `;
        }
        if (randomSec) randomSec.style.display = 'none';
        if (choiceSec) choiceSec.style.display = 'block';
        if (confirmBtn) confirmBtn.innerHTML = '⚡ 즉시 마감 & 진영 확정';

        const redTitle = document.getElementById('recruitChoiceRedTitle');
        const blueTitle = document.getElementById('recruitChoiceBlueTitle');
        const redBadge = document.getElementById('recruitChoiceRedBadge');
        const blueBadge = document.getElementById('recruitChoiceBlueBadge');
        const redList = document.getElementById('recruitChoiceRedList');
        const blueList = document.getElementById('recruitChoiceBlueList');

        if (redTitle) redTitle.innerText = `🔴 ${factionTeamNames.red} ('1' or '레드')`;
        if (blueTitle) blueTitle.innerText = `🔵 ${factionTeamNames.blue} ('2' or '블루')`;
        if (redBadge) redBadge.innerText = '0명';
        if (blueBadge) blueBadge.innerText = '0명';
        if (redList) redList.innerHTML = `<div id="recruitChoiceRedEmpty" style="width: 100%; text-align: center; color: var(--text-sub); font-size: 11px; padding: 20px 0;">채팅에 '1' 또는 '레드' 입력 대기 중...</div>`;
        if (blueList) blueList.innerHTML = `<div id="recruitChoiceBlueEmpty" style="width: 100%; text-align: center; color: var(--text-sub); font-size: 11px; padding: 20px 0;">채팅에 '2' 또는 '블루' 입력 대기 중...</div>`;
      } else {
        if (statusBadge) {
          statusBadge.innerHTML = '📢 자유 채팅 자동 참여 중';
          statusBadge.style.color = '#00ffa3';
          statusBadge.style.background = 'rgba(0, 255, 163, 0.15)';
        }
        if (modalTitle) modalTitle.innerText = '시청자 진영 대항전 참가자 모집';
        if (modalDesc) {
          modalDesc.innerHTML = `
            지금 채팅창에 <b style="color: #00ffa3;">아무 말</b>이나 입력하세요!<br>
            <span style="font-size: 11px; color: #64748b;">(예: "ㅋㅋ", "안녕", "가즈아", "1" 등 모든 채팅 자동 참여)</span>
          `;
        }
        if (randomSec) randomSec.style.display = 'block';
        if (choiceSec) choiceSec.style.display = 'none';
        if (confirmBtn) confirmBtn.innerHTML = '⚡ 즉시 마감 & 팀 추첨';

        if (countBadge) countBadge.innerText = '0명';
        if (chattersList) {
          chattersList.innerHTML = `
            <div id="factionRecruitEmptyPlaceholder" style="width: 100%; text-align: center; color: var(--text-sub); font-size: 11px; padding: 24px 0;">
              💬 채팅을 치면 닉네임이 여기에 실시간으로 등록됩니다...
            </div>
          `;
        }
      }

      if (modal) modal.classList.add('active');
      playPokeBattleBgm('pinch', 300);

      clearInterval(factionRecruitTimerInterval);
      factionRecruitTimerInterval = setInterval(() => {
        factionRecruitRemaining -= 0.1;
        if (timerText) timerText.innerText = `${Math.max(0, factionRecruitRemaining).toFixed(1)}s`;
        if (timerFill) {
          const pct = (Math.max(0, factionRecruitRemaining) / factionRecruitTotal) * 100;
          timerFill.style.width = `${pct}%`;
        }
        if (factionRecruitRemaining <= 0) {
          clearInterval(factionRecruitTimerInterval);
          finishFactionRecruitmentEarly();
        }
      }, 100);

      if (factionAssignMethod === 'viewer_choice') {
        showToast(`🚩 ${factionRecruitTotal}초 동안 진영 선택 모집이 시작되었습니다! '1(레드)' 또는 '2(블루)'를 입력하세요!`, '🚩');
      } else {
        showToast(`📢 ${factionRecruitTotal}초 동안 시청자 진영 모집이 시작되었습니다! 아무 채팅이나 입력하세요!`, '👥');
      }
    }
    window.startFactionRecruitment = startFactionRecruitment;

    function renderFactionChoiceBucketsUI() {
      const redBadge = document.getElementById('recruitChoiceRedBadge');
      const blueBadge = document.getElementById('recruitChoiceBlueBadge');
      const redList = document.getElementById('recruitChoiceRedList');
      const blueList = document.getElementById('recruitChoiceBlueList');

      const redArray = Array.from(factionChoiceRecruits.red.values());
      const blueArray = Array.from(factionChoiceRecruits.blue.values());

      if (redBadge) redBadge.innerText = `${redArray.length}명`;
      if (blueBadge) blueBadge.innerText = `${blueArray.length}명`;

      if (redList) {
        if (redArray.length === 0) {
          redList.innerHTML = `<div id="recruitChoiceRedEmpty" style="width: 100%; text-align: center; color: var(--text-sub); font-size: 11px; padding: 20px 0;">채팅에 '1' 또는 '레드' 입력 대기 중...</div>`;
        } else {
          redList.innerHTML = redArray.map(u => `
            <span class="badge-tag" onclick="openUserChatByNickOrUid('${escapeJsArg(u.uid)}', '${escapeJsArg(u.nickname)}')" title="${escapeHtml(u.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="background: rgba(239, 68, 68, 0.2); color: #f87171; font-size: 11px; font-weight: 700; padding: 3px 8px; border: 1px solid rgba(239,68,68,0.35); animation: voteGlowAnim 0.5s ease-out; cursor: pointer;">
              ${escapeHtml(u.nickname)}
            </span>
          `).join('');
        }
      }

      if (blueList) {
        if (blueArray.length === 0) {
          blueList.innerHTML = `<div id="recruitChoiceBlueEmpty" style="width: 100%; text-align: center; color: var(--text-sub); font-size: 11px; padding: 20px 0;">채팅에 '2' 또는 '블루' 입력 대기 중...</div>`;
        } else {
          blueList.innerHTML = blueArray.map(u => `
            <span class="badge-tag" onclick="openUserChatByNickOrUid('${escapeJsArg(u.uid)}', '${escapeJsArg(u.nickname)}')" title="${escapeHtml(u.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 3px 8px; border: 1px solid rgba(56,189,248,0.35); animation: voteGlowAnim 0.5s ease-out; cursor: pointer;">
              ${escapeHtml(u.nickname)}
            </span>
          `).join('');
        }
      }
    }
    window.renderFactionChoiceBucketsUI = renderFactionChoiceBucketsUI;

    function handleFactionOmniChat(nickname, msg, uid) {
      if (!factionRecruiting) return;
      const cleanNick = (nickname || '시청자').trim();
      const actualUid = uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const cleanMsg = (msg || '').trim();

      // Case 1: Viewer Choice Mode (시청자 직접 진영 선택)
      if (factionAssignMethod === 'viewer_choice') {
        const lowerMsg = cleanMsg.toLowerCase().replace(/\s+/g, '');
        const redCustom = factionTeamNames.red.toLowerCase().replace(/\s+/g, '');
        const blueCustom = factionTeamNames.blue.toLowerCase().replace(/\s+/g, '');

        let targetTeam = null;

        if (
          lowerMsg === '1' || lowerMsg === '!1' ||
          lowerMsg === '레드' || lowerMsg === '레드팀' || lowerMsg === 'red' ||
          lowerMsg === redCustom ||
          (cleanMsg.includes('레드') && !cleanMsg.includes('블루')) ||
          (cleanMsg.includes(factionTeamNames.red) && !cleanMsg.includes(factionTeamNames.blue))
        ) {
          targetTeam = 'red';
        } else if (
          lowerMsg === '2' || lowerMsg === '!2' ||
          lowerMsg === '블루' || lowerMsg === '블루팀' || lowerMsg === 'blue' ||
          lowerMsg === blueCustom ||
          (cleanMsg.includes('블루') && !cleanMsg.includes('레드')) ||
          (cleanMsg.includes(factionTeamNames.blue) && !cleanMsg.includes(factionTeamNames.red))
        ) {
          targetTeam = 'blue';
        }

        if (!targetTeam) return;

        if (targetTeam === 'red') {
          factionChoiceRecruits.blue.delete(actualUid);
          factionChoiceRecruits.red.set(actualUid, { uid: actualUid, nickname: cleanNick, time: Date.now() });
        } else {
          factionChoiceRecruits.red.delete(actualUid);
          factionChoiceRecruits.blue.set(actualUid, { uid: actualUid, nickname: cleanNick, time: Date.now() });
        }

        renderFactionChoiceBucketsUI();
        return;
      }

      // Case 2: Random 50:50 Mode (자유 채팅 자동 편입)
      const isNew = !recruitedViewersMap.has(actualUid);

      recruitedViewersMap.set(actualUid, {
        uid: actualUid,
        nickname: cleanNick,
        time: Date.now()
      });

      const countBadge = document.getElementById('factionRecruitedCountBadge');
      if (countBadge) countBadge.innerText = `${recruitedViewersMap.size}명`;

      const emptyEl = document.getElementById('factionRecruitEmptyPlaceholder');
      if (emptyEl) emptyEl.style.display = 'none';

      const chattersList = document.getElementById('factionRecruitChattersList');
      if (chattersList && isNew) {
        const chip = document.createElement('span');
        chip.className = 'badge-tag';
        chip.style.cssText = 'background: rgba(0, 255, 163, 0.15); color: #00ffa3; font-size: 11px; font-weight: 700; padding: 3px 8px; border: 1px solid rgba(0,255,163,0.3); animation: voteGlowAnim 0.5s ease-out; cursor: pointer;';
        chip.title = `${cleanNick} (클릭하여 시청자 UID 및 정보 보기)`;
        chip.onclick = () => openUserChatByNickOrUid(actualUid, cleanNick);
        chip.innerText = cleanNick;
        chattersList.prepend(chip);
      }
    }
    window.handleFactionOmniChat = handleFactionOmniChat;

    function finishFactionRecruitmentEarly() {
      clearInterval(factionRecruitTimerInterval);
      factionRecruiting = false;
      const modal = document.getElementById('factionRecruitModal');
      if (modal) modal.classList.remove('active');
      finishFactionRecruitmentAndDraft();
    }
    window.finishFactionRecruitmentEarly = finishFactionRecruitmentEarly;

    function cancelFactionRecruitment() {
      clearInterval(factionRecruitTimerInterval);
      factionRecruiting = false;
      const modal = document.getElementById('factionRecruitModal');
      if (modal) modal.classList.remove('active');
      stopPokeBattleBgm(300);
      showToast('시청자 진영 모집이 취소되었습니다.', '✕');
    }
    window.cancelFactionRecruitment = cancelFactionRecruitment;

    function finishFactionRecruitmentAndDraft() {
      clearInterval(factionRecruitTimerInterval);
      factionRecruiting = false;
      const recruitModal = document.getElementById('factionRecruitModal');
      if (recruitModal) recruitModal.classList.remove('active');

      factionRedMembers = [];
      factionBlueMembers = [];
      factionUserMap.clear();

      const revealModal = document.getElementById('factionRevealModal');
      const revealIcon = document.getElementById('factionRevealIcon');
      const revealTitle = document.getElementById('factionRevealTitle');
      const summaryText = document.getElementById('factionRevealSummaryText');
      const redTitle = document.getElementById('factionRevealRedTitle');
      const blueTitle = document.getElementById('factionRevealBlueTitle');
      const redBadge = document.getElementById('factionRevealRedCountBadge');
      const blueBadge = document.getElementById('factionRevealBlueCountBadge');
      const redList = document.getElementById('factionRevealRedList');
      const blueList = document.getElementById('factionRevealBlueList');

      if (factionAssignMethod === 'viewer_choice') {
        factionRedMembers = Array.from(factionChoiceRecruits.red.values());
        factionBlueMembers = Array.from(factionChoiceRecruits.blue.values());

        // Fallback: If both empty
        if (factionRedMembers.length === 0 && factionBlueMembers.length === 0) {
          for (let i = 1; i <= 3; i++) {
            factionRedMembers.push({ uid: `demo_red_${i}`, nickname: `레드시청자${i}`, time: Date.now() });
            factionBlueMembers.push({ uid: `demo_blue_${i}`, nickname: `블루시청자${i}`, time: Date.now() });
          }
          showToast('참여 시청자가 없어 가상 시청자 6명(3:3)으로 진영이 편성되었습니다.', '🤖');
        } else {
          if (factionRedMembers.length === 0) {
            for (let i = 1; i <= 2; i++) {
              factionRedMembers.push({ uid: `demo_red_${i}`, nickname: `가상 레드${i}`, time: Date.now() });
            }
            showToast('레드팀 참가자가 없어 가상 시청자가 보충되었습니다.', '🤖');
          }
          if (factionBlueMembers.length === 0) {
            for (let i = 1; i <= 2; i++) {
              factionBlueMembers.push({ uid: `demo_blue_${i}`, nickname: `가상 블루${i}`, time: Date.now() });
            }
            showToast('블루팀 참가자가 없어 가상 시청자가 보충되었습니다.', '🤖');
          }
        }

        factionRedMembers.forEach(u => factionUserMap.set(u.uid, 'red'));
        factionBlueMembers.forEach(u => factionUserMap.set(u.uid, 'blue'));

        if (revealIcon) revealIcon.innerText = '🚩';
        if (revealTitle) revealTitle.innerText = '시청자 자율 진영 선택 완료!';
        if (summaryText) summaryText.innerText = `시청자들이 직접 선택한 진영으로 배정이 완료되었습니다! (🔴 ${factionRedMembers.length}명 vs 🔵 ${factionBlueMembers.length}명)`;
        if (redTitle) redTitle.innerText = `🔴 ${factionTeamNames.red}`;
        if (blueTitle) blueTitle.innerText = `🔵 ${factionTeamNames.blue}`;
        if (redBadge) redBadge.innerText = `${factionRedMembers.length}명`;
        if (blueBadge) blueBadge.innerText = `${factionBlueMembers.length}명`;

        if (redList) {
          redList.innerHTML = factionRedMembers.map(m => `
            <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(239,68,68,0.25); cursor: pointer; transition: all 0.15s ease;">
              <span style="font-weight: 800; color: #f87171;">🔴 ${escapeHtml(m.nickname)}</span>
              <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 1px 5px; border-radius: 4px; font-weight: 800;">🔍 UID</span>
            </div>
          `).join('');
        }

        if (blueList) {
          blueList.innerHTML = factionBlueMembers.map(m => `
            <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(56,189,248,0.25); cursor: pointer; transition: all 0.15s ease;">
              <span style="font-weight: 800; color: #38bdf8;">🔵 ${escapeHtml(m.nickname)}</span>
              <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 1px 5px; border-radius: 4px; font-weight: 800;">🔍 UID</span>
            </div>
          `).join('');
        }

        if (revealModal) revealModal.classList.add('active');
        playPokeBattleBgm('victory', 300);
        return;
      }

      // Case 2: random_equal
      let list = Array.from(recruitedViewersMap.values());

      // If fewer than 2 viewers joined, fill with virtual participants
      if (list.length === 0) {
        for (let i = 1; i <= 6; i++) {
          list.push({ uid: `demo_viewer_${i}`, nickname: `시청자${i}`, time: Date.now() });
        }
        showToast('참여 시청자가 없어 가상 시청자 6명으로 팀이 편성되었습니다.', '🤖');
      } else if (list.length === 1) {
        list.push({ uid: `demo_viewer_2`, nickname: '가상 시청자2', time: Date.now() });
      }

      // Fisher-Yates Shuffle
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }

      list.forEach((u, idx) => {
        if (idx % 2 === 0) {
          factionRedMembers.push(u);
          factionUserMap.set(u.uid, 'red');
        } else {
          factionBlueMembers.push(u);
          factionUserMap.set(u.uid, 'blue');
        }
      });

      if (revealIcon) revealIcon.innerText = '⚖️';
      if (revealTitle) revealTitle.innerText = '50:50 무작위 균등 배정 완료!';
      if (summaryText) summaryText.innerText = `총 ${list.length}명의 시청자가 양 진영에 50:50 (${factionRedMembers.length}명 vs ${factionBlueMembers.length}명) 황금 밸런스로 배정되었습니다!`;
      if (redTitle) redTitle.innerText = `🔴 ${factionTeamNames.red}`;
      if (blueTitle) blueTitle.innerText = `🔵 ${factionTeamNames.blue}`;
      if (redBadge) redBadge.innerText = `${factionRedMembers.length}명`;
      if (blueBadge) blueBadge.innerText = `${factionBlueMembers.length}명`;

      if (redList) {
        redList.innerHTML = factionRedMembers.map(m => `
          <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(239,68,68,0.25); cursor: pointer; transition: all 0.15s ease;">
            <span style="font-weight: 800; color: #f87171;">🔴 ${escapeHtml(m.nickname)}</span>
            <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 1px 5px; border-radius: 4px; font-weight: 800;">🔍 UID</span>
          </div>
        `).join('');
      }

      if (blueList) {
        blueList.innerHTML = factionBlueMembers.map(m => `
          <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 정보 보기)" style="display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(56,189,248,0.25); cursor: pointer; transition: all 0.15s ease;">
            <span style="font-weight: 800; color: #38bdf8;">🔵 ${escapeHtml(m.nickname)}</span>
            <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 1px 5px; border-radius: 4px; font-weight: 800;">🔍 UID</span>
          </div>
        `).join('');
      }

      if (revealModal) revealModal.classList.add('active');
      playPokeBattleBgm('victory', 300);
    }
    window.finishFactionRecruitmentAndDraft = finishFactionRecruitmentAndDraft;

    function proceedToFactionBattleArena() {
      const revealModal = document.getElementById('factionRevealModal');
      if (revealModal) revealModal.classList.remove('active');
      launchPokeBattleActual();
    }
    window.proceedToFactionBattleArena = proceedToFactionBattleArena;

    function launchPokeBattleActual() {
      const sel = document.getElementById('pokeBattleModeSelect');
      if (sel) pokeBattleMode = sel.value;
      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;

      if (pokeBattleMode === '1v1') {
        streamerActiveIdx = 0;
        viewersActiveIdx = 0;
      }

      for (let i = 0; i < teamSize; i++) {
        revertPokemonToBaseForm(streamerTeam[i]);
        revertPokemonToBaseForm(viewersTeam[i]);

        const sP = streamerTeam[i].pokemon;
        streamerTeam[i].maxHP = calculateLevel50HP(sP.stats.hp);
        streamerTeam[i].currentHP = streamerTeam[i].maxHP;
        streamerTeam[i].fainted = false;
        streamerTeam[i].isMega = false;
        streamerTeam[i].choiceMove = null;
        streamerTeam[i].itemUsed = false;
        streamerTeam[i].rankAtk = 0;
        streamerTeam[i].rankDef = 0;
        streamerTeam[i].rankSpA = 0;
        streamerTeam[i].rankSpD = 0;
        streamerTeam[i].rankSpe = 0;
        streamerTeam[i].status = null;
        streamerTeam[i].toxicTurns = 0;
        streamerTeam[i].destinyBond = false;
        streamerTeam[i].flinched = false;

        streamerTeam[i].movesPP = sP.moves.map(m => ({
          name: m.name,
          currentPP: (m.pp !== undefined ? m.pp : (m.max_pp || 15)),
          maxPP: (m.pp !== undefined ? m.pp : (m.max_pp || 15))
        }));

        const vP = viewersTeam[i].pokemon;
        viewersTeam[i].maxHP = calculateLevel50HP(vP.stats.hp);
        viewersTeam[i].currentHP = viewersTeam[i].maxHP;
        viewersTeam[i].fainted = false;
        viewersTeam[i].isMega = false;
        viewersTeam[i].choiceMove = null;
        viewersTeam[i].itemUsed = false;
        viewersTeam[i].rankAtk = 0;
        viewersTeam[i].rankDef = 0;
        viewersTeam[i].rankSpA = 0;
        viewersTeam[i].rankSpD = 0;
        viewersTeam[i].rankSpe = 0;
        viewersTeam[i].status = null;
        viewersTeam[i].toxicTurns = 0;
        viewersTeam[i].destinyBond = false;
        viewersTeam[i].flinched = false;
        viewersTeam[i].movesPP = vP.moves.map(m => ({
          name: m.name,
          currentPP: (m.pp !== undefined ? m.pp : (m.max_pp || 15)),
          maxPP: (m.pp !== undefined ? m.pp : (m.max_pp || 15))
        }));
      }

      // Reset arena sprites & animations
      const sSpr = document.getElementById('arenaStreamerSprite');
      if (sSpr) {
        sSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged', 'poke-sprite-crit', 'poke-lunge-right', 'poke-lunge-left', 'poke-hop');
        sSpr.style.opacity = '1';
        sSpr.style.transform = 'none';
        sSpr.style.filter = 'none';
      }
      const vSpr = document.getElementById('arenaViewersSprite');
      if (vSpr) {
        vSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged', 'poke-sprite-crit', 'poke-lunge-right', 'poke-lunge-left', 'poke-hop');
        vSpr.style.opacity = '1';
        vSpr.style.transform = 'none';
        vSpr.style.filter = 'none';
      }
      const arenaBox = document.getElementById('pokeArenaContainer');
      if (arenaBox) {
        arenaBox.classList.remove('arena-shake-light', 'arena-shake-heavy');
      }
      const vfxCanvas = document.getElementById('pokeBattleVfxCanvas');
      if (vfxCanvas) {
        const vfxCtx = vfxCanvas.getContext('2d');
        if (vfxCtx) vfxCtx.clearRect(0, 0, vfxCanvas.width, vfxCanvas.height);
      }

      streamerActiveIdx = 0;
      viewersActiveIdx = 0;
      streamerActionTab = 'moves';
      streamerTeamHasMegaEvolved = false;
      viewersTeamHasMegaEvolved = false;
      streamerMegaSelected = false;

      pokeBattleState.active = true;
      pokeBattleState.round = 1;
      pokeBattleState.streamerStealthRock = false;
      pokeBattleState.viewersStealthRock = false;
      pokeBattleState.phase = 'simultaneous_turn';
      pokeBattleState.streamerAction = null;
      pokeBattleState.viewersAction = null;
      pokeBattleState.stats = { totalRounds: 0, streamerDamage: 0, viewersDamage: 0, crits: 0, superEffective: 0 };
      factionBattleStats = { redDamage: 0, blueDamage: 0, userContributionMap: new Map() };

      document.getElementById('pokeBattleSetupStage').style.display = 'none';
      document.getElementById('pokeBattleArenaStage').style.display = 'flex';

      updateArenaActivePokemonUI();
      renderArenaTeamBallsHUD();
      updateArenaHPBars();
      updateBgmUIControls();
      updateSfxUIControls();

      // Setup Billboards & Caster Controls
      renderCinematicBillboards();

      const casterBar = document.getElementById('arenaCasterControlBar');
      const redVoteHud = document.getElementById('arenaViewersVoteHud');
      const blueVoteHud = document.getElementById('arenaBlueTeamVoteHud');
      const streamerDeckWrapper = document.getElementById('streamerActionDeckWrapper');
      const redVoteTitle = document.getElementById('arenaRedVoteTitle');
      const redVoteLiveDot = document.getElementById('arenaVoteLiveDot');
      const redVoteBadge = document.getElementById('arenaVoteParticipantsBadge');

      if (pokeBattleSubMode === 'faction_battle') {
        if (casterBar) casterBar.style.display = 'block';
        if (blueVoteHud) blueVoteHud.style.display = 'flex';
        if (streamerDeckWrapper) streamerDeckWrapper.style.display = 'none';
        if (redVoteHud) {
          redVoteHud.style.borderColor = 'rgba(239, 68, 68, 0.45)';
          redVoteHud.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.15)';
        }
        if (redVoteTitle) {
          redVoteTitle.innerText = `🔴 ${factionTeamNames.red} 실시간 채팅 투표`;
          redVoteTitle.style.color = '#f87171';
        }
        if (redVoteLiveDot) redVoteLiveDot.style.background = '#f87171';
        if (redVoteBadge) {
          redVoteBadge.style.color = '#f87171';
          redVoteBadge.style.background = 'rgba(239, 68, 68, 0.18)';
          redVoteBadge.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        }
      } else {
        if (casterBar) casterBar.style.display = 'none';
        if (blueVoteHud) blueVoteHud.style.display = 'none';
        if (streamerDeckWrapper) streamerDeckWrapper.style.display = 'flex';
        if (redVoteHud) {
          redVoteHud.style.borderColor = 'rgba(56, 189, 248, 0.45)';
          redVoteHud.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.15)';
        }
        if (redVoteTitle) {
          redVoteTitle.innerText = '시청자 행동 실시간 채팅 투표';
          redVoteTitle.style.color = '#38bdf8';
        }
        if (redVoteLiveDot) redVoteLiveDot.style.background = '#38bdf8';
        if (redVoteBadge) {
          redVoteBadge.style.color = '#38bdf8';
          redVoteBadge.style.background = 'rgba(56, 189, 248, 0.18)';
          redVoteBadge.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        }
      }

      playPokeBattleBgm('normal', 400);
      startSimultaneousPokeTurn();
    }
    window.launchPokeBattleActual = launchPokeBattleActual;

    // ==========================================
    // 📜 CINEMATIC BILLBOARDS & VOTE GLOW ENGINE
    // ==========================================
    function renderCinematicBillboards() {
      const redBillboard = document.getElementById('arenaRedBillboard');
      const blueBillboard = document.getElementById('arenaBlueBillboard');
      const redTrack = document.getElementById('billboardRedScrollTrack');
      const blueTrack = document.getElementById('billboardBlueScrollTrack');
      const redTitle = document.getElementById('billboardRedTitle');
      const blueTitle = document.getElementById('billboardBlueTitle');
      const redBadge = document.getElementById('billboardRedCountBadge');
      const blueBadge = document.getElementById('billboardBlueCountBadge');

      if (pokeBattleSubMode !== 'faction_battle') {
        if (redBillboard) redBillboard.style.display = 'none';
        if (blueBillboard) blueBillboard.style.display = 'none';
        return;
      }

      if (redBillboard) redBillboard.style.display = 'flex';
      if (blueBillboard) blueBillboard.style.display = 'flex';
      if (redTitle) redTitle.innerText = `🔴 ${factionTeamNames.red}`;
      if (blueTitle) blueTitle.innerText = `🔵 ${factionTeamNames.blue}`;
      if (redBadge) redBadge.innerText = `${factionRedMembers.length}명`;
      if (blueBadge) blueBadge.innerText = `${factionBlueMembers.length}명`;

      function buildTrackChips(members, team) {
        if (members.length === 0) {
          return `<div style="text-align: center; font-size: 11px; color: var(--text-sub); padding: 20px 0;">대기 중...</div>`;
        }
        const list = members.length < 5 ? [...members, ...members, ...members, ...members] : [...members, ...members];
        return list.map((m, idx) => {
          const p = (typeof participants !== 'undefined') ? participants.get(m.uid) : null;
          let vipBadge = '';
          if (p) {
            if (p.isSubscriber) {
              vipBadge += `<span class="badge-tag badge-sub" style="font-size: 8px; padding: 0 3px; margin-left: 2px;" title="구독자">⭐</span>`;
            }
            if (p.isDonator) {
              vipBadge += `<span class="badge-tag badge-follow" style="font-size: 8px; padding: 0 3px; margin-left: 2px; background: rgba(255,215,0,0.25); color: #ffd700;" title="후원자">🧀</span>`;
            }
            if (p.donatorLevel && p.donatorLevel >= 2) {
              vipBadge += `<span class="badge-tag" style="font-size: 8px; padding: 0 3px; margin-left: 2px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #080c14; font-weight: 900;" title="VIP 열혈 후원자">VIP</span>`;
            }
          }
          return `
            <div class="billboard-user-chip" data-uid="${escapeHtml(m.uid)}" data-team="${team}" onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 정보 보기)">
              <div class="billboard-chip-left" style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                <span class="billboard-chip-icon">${team === 'red' ? '🔴' : '🔵'}</span>
                <span class="billboard-chip-name" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m.nickname)}</span>
                ${vipBadge}
              </div>
              <span class="billboard-chip-tag" id="chipTag_${team}_${escapeHtml(m.uid)}_${idx}">대기</span>
            </div>
          `;
        }).join('');
      }
      if (redTrack) redTrack.innerHTML = buildTrackChips(factionRedMembers, 'red');
      if (blueTrack) blueTrack.innerHTML = buildTrackChips(factionBlueMembers, 'blue');
    }
    window.renderCinematicBillboards = renderCinematicBillboards;

    function triggerBillboardVoteGlow(team, uid, choiceKey) {
      if (pokeBattleSubMode !== 'faction_battle') return;
      const chips = document.querySelectorAll(`.billboard-user-chip[data-uid="${uid}"]`);
      chips.forEach(chip => {
        chip.classList.remove('vote-glow');
        void chip.offsetWidth;
        chip.classList.add('vote-glow');
        const tag = chip.querySelector('.billboard-chip-tag');
        if (tag) {
          tag.innerText = choiceKey ? formatChoiceKeyShort(choiceKey) : '투표';
          tag.style.color = '#ffd700';
        }
        setTimeout(() => {
          chip.classList.remove('vote-glow');
        }, 800);
      });
    }
    window.triggerBillboardVoteGlow = triggerBillboardVoteGlow;

    function formatChoiceKeyShort(choiceKey) {
      if (!choiceKey) return '투표';
      if (choiceKey.startsWith('move_')) return `${choiceKey.replace('move_', '')}번`;
      if (choiceKey.startsWith('mega_')) return `메가${choiceKey.replace('mega_', '')}`;
      if (choiceKey.startsWith('switch_')) return '교체';
      if (choiceKey === 'struggle') return '발버둥';
      return String(choiceKey);
    }

    function handleLatecomerAutoBalance(uid, nickname, msg) {
      if (pokeBattleSubMode !== 'faction_battle' || !pokeBattleState.active) return null;
      if (factionUserMap.has(uid)) return factionUserMap.get(uid);

      let assignedTeam = null;

      // In viewer choice mode, check if the latecomer specified a team via keywords
      if (factionAssignMethod === 'viewer_choice' && msg) {
        const cleanMsg = String(msg).trim().toLowerCase().replace(/\s+/g, '');
        const redCustom = factionTeamNames.red.toLowerCase().replace(/\s+/g, '');
        const blueCustom = factionTeamNames.blue.toLowerCase().replace(/\s+/g, '');

        if (
          cleanMsg === '레드' || cleanMsg === '레드팀' || cleanMsg === 'red' || cleanMsg === redCustom ||
          (cleanMsg.includes('레드') && !cleanMsg.includes('블루')) ||
          (cleanMsg.includes(redCustom) && !cleanMsg.includes(blueCustom))
        ) {
          assignedTeam = 'red';
        } else if (
          cleanMsg === '블루' || cleanMsg === '블루팀' || cleanMsg === 'blue' || cleanMsg === blueCustom ||
          (cleanMsg.includes('블루') && !cleanMsg.includes('레드')) ||
          (cleanMsg.includes(blueCustom) && !cleanMsg.includes(redCustom))
        ) {
          assignedTeam = 'blue';
        }
      }

      // If not specified or random_equal mode, auto balance to smaller team
      if (!assignedTeam) {
        if (factionRedMembers.length > factionBlueMembers.length) {
          assignedTeam = 'blue';
        } else if (factionBlueMembers.length > factionRedMembers.length) {
          assignedTeam = 'red';
        } else {
          assignedTeam = Math.random() < 0.5 ? 'red' : 'blue';
        }
      }

      factionUserMap.set(uid, assignedTeam);
      const userObj = { uid, nickname: nickname || '시청자', time: Date.now() };
      if (assignedTeam === 'red') {
        factionRedMembers.push(userObj);
      } else {
        factionBlueMembers.push(userObj);
      }

      renderCinematicBillboards();
      const teamLabel = assignedTeam === 'red' ? factionTeamNames.red : factionTeamNames.blue;
      showToast(`⚡ [${nickname}]님이 ${assignedTeam === 'red' ? '🔴' : '🔵'} ${teamLabel}에 지원군으로 자동 편입되었습니다!`, '👥');
      return assignedTeam;
    }
    window.handleLatecomerAutoBalance = handleLatecomerAutoBalance;

    function parseChatVoteChoice(msg, slot, team, canMega) {
      const clean = msg.trim().toUpperCase().replace(/\s+/g, '');
      let choiceKey = null;

      const megaMatch = clean.match(/^(?:MEGA|메가|진화|M)([1-4])번?$/) || clean.match(/^([1-4])번?(?:MEGA|메가|진화|M)$/);
      if (megaMatch && canMega) {
        const moveNum = parseInt(megaMatch[1], 10);
        choiceKey = `mega_${moveNum}`;
      } else if (/^[1-4]$/.test(clean) || /^[1-4]번$/.test(clean)) {
        const num = parseInt(clean.replace('번', ''), 10);
        choiceKey = `move_${num}`;
      } else if (pokeBattleMode === '3v3' && (/^[5-6]$/.test(clean) || /^[5-6]번$/.test(clean))) {
        const num = parseInt(clean.replace('번', ''), 10);
        choiceKey = `switch_${num}`;
      } else if (canMega && (/^[7-9]$/.test(clean) || clean === '10' || /^[7-9]번$/.test(clean) || clean === '10번')) {
        const num = parseInt(clean.replace('번', ''), 10);
        choiceKey = `mega_${num - 6}`;
      } else if (canMega && pokeBattleMode !== '3v3' && (/^[5-8]$/.test(clean) || /^[5-8]번$/.test(clean))) {
        const num = parseInt(clean.replace('번', ''), 10);
        choiceKey = `mega_${num - 4}`;
      }

      if (!choiceKey && pokeBattleMode === '3v3') {
        const teamArr = team === 'red' ? streamerTeam : viewersTeam;
        const activeIdx = team === 'red' ? streamerActiveIdx : viewersActiveIdx;
        let switchCounter = 5;
        for (let i = 0; i < 3; i++) {
          if (i !== activeIdx) {
            if (!teamArr[i].fainted && teamArr[i].currentHP > 0) {
              const slotNum = i + 1;
              const pName = teamArr[i].pokemon.name.toUpperCase().replace(/\s+/g, '');
              if (
                clean === String(switchCounter) ||
                clean === `교체${slotNum}` ||
                clean === `${slotNum}번교체` ||
                clean === `${slotNum}번` ||
                clean === `${slotNum}교체` ||
                clean === `교체${pName}` ||
                clean === pName
              ) {
                choiceKey = `switch_${switchCounter}`;
                break;
              }
            }
            switchCounter++;
          }
        }
      }

      // Reject switch_5 / switch_6 if that bench slot is fainted
      if (choiceKey && choiceKey.startsWith('switch_') && pokeBattleMode === '3v3') {
        const teamArr = team === 'red' ? streamerTeam : viewersTeam;
        const activeIdx = team === 'red' ? streamerActiveIdx : viewersActiveIdx;
        let switchCounter = 5;
        let validSwitch = false;
        for (let i = 0; i < 3; i++) {
          if (i !== activeIdx) {
            if (`switch_${switchCounter}` === choiceKey && !teamArr[i].fainted && teamArr[i].currentHP > 0) {
              validSwitch = true;
            }
            switchCounter++;
          }
        }
        if (!validSwitch) choiceKey = null;
      }

      if (!choiceKey) {
        slot.pokemon.moves.forEach((m, idx) => {
          const mName = m.name.toUpperCase().replace(/\s+/g, '');
          if (clean === mName) {
            choiceKey = `move_${idx + 1}`;
          } else if (clean === `메가${mName}` && canMega) {
            choiceKey = `mega_${idx + 1}`;
          }
        });
      }

      const allOutOfPP = slot.movesPP && slot.movesPP.length > 0 && slot.movesPP.every(x => x.currentPP <= 0);
      if (allOutOfPP && (clean === '1' || clean === '발버둥' || clean === 'STRUGGLE' || clean === '1번')) {
        choiceKey = 'struggle';
      }

      if (choiceKey && (choiceKey.startsWith('move_') || choiceKey.startsWith('mega_'))) {
        const mIdx = parseInt(choiceKey.replace(/^(move_|mega_)/, ''), 10) - 1;
        const m = slot.pokemon.moves[mIdx];
        if (!m) {
          choiceKey = null;
        } else {
          const isOutOfPP = slot.movesPP && slot.movesPP[mIdx] && slot.movesPP[mIdx].currentPP <= 0;
          const isLocked = slot.choiceMove && slot.choiceMove.name !== m.name;
          const isAV = normalizePokeItemId(slot.item) === 'assault_vest' && m.category === '변화';
          const isBanned = (slot.pokemon.name === '왕구리' && m.name === '막치기') || (slot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          if (isOutOfPP || isLocked || isAV || isBanned) {
            choiceKey = null;
          }
        }
      }

      return choiceKey;
    }

    function recomputeFactionVotes(team) {
      if (team === 'red') {
        factionRedVoteCounts = {};
        for (const [u, c] of factionRedVoteUsers.entries()) {
          factionRedVoteCounts[c] = (factionRedVoteCounts[c] || 0) + 1;
        }
      } else {
        factionBlueVoteCounts = {};
        for (const [u, c] of factionBlueVoteUsers.entries()) {
          factionBlueVoteCounts[c] = (factionBlueVoteCounts[c] || 0) + 1;
        }
      }
    }

    function renderFactionVotingBarsUI(team, isReveal = false, winningKey = null) {
      const isRed = team === 'red';
      const container = document.getElementById(isRed ? 'arenaVoteCandidateBars' : 'arenaBlueVoteCandidateBars');
      const slot = isRed ? streamerTeam[streamerActiveIdx] : viewersTeam[viewersActiveIdx];
      if (!container || !slot) return;

      const voteUsers = isRed ? factionRedVoteUsers : factionBlueVoteUsers;
      const voteCounts = isRed ? factionRedVoteCounts : factionBlueVoteCounts;
      const total = voteUsers.size;

      const hasMegaEvolved = isRed ? streamerTeamHasMegaEvolved : viewersTeamHasMegaEvolved;
      const megaObj = getAvailableMegaEvolution(slot.pokemon, slot.item);
      const canMega = megaObj && !hasMegaEvolved && !slot.isMega;
      const allOutOfPP = slot.movesPP && slot.movesPP.length > 0 && slot.movesPP.every(x => x.currentPP <= 0);

      const pBadge = document.getElementById(isRed ? 'arenaVoteParticipantsBadge' : 'arenaBlueVoteParticipantsBadge');
      if (pBadge) {
        pBadge.innerHTML = `👥 투표 참여: <b>${total}</b>명`;
      }

      const instrEl = document.getElementById(isRed ? 'arenaVoteInstructionText' : 'arenaBlueVoteInstructionText');
      if (instrEl) {
        if (allOutOfPP) {
          instrEl.innerHTML = '(채팅: <b>1</b> 또는 <b>발버둥</b>)';
        } else if (pokeBattleMode === '3v3') {
          if (canMega) {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>4</b> / <b>5</b>,<b>6</b>)';
          } else {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>5</b>,<b>6</b>)';
          }
        } else {
          if (canMega) {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>4</b>)';
          } else {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b>)';
          }
        }
      }

      function renderCandidateCard(c) {
        if (!c) return '';
        const count = voteCounts[c.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isWinning = (winningKey === c.key);
        const glowClass = isWinning ? 'winning-vote-glow' : '';
        const teamColor = isRed ? '#f87171' : '#38bdf8';
        const gradient = isRed
          ? (isWinning ? 'linear-gradient(90deg, #ffd700, #f87171)' : 'linear-gradient(90deg, #f87171, #f97316)')
          : (isWinning ? 'linear-gradient(90deg, #ffd700, #38bdf8)' : 'linear-gradient(90deg, #38bdf8, #00ffa3)');

        return `
          <div class="vote-candidate-bar-row ${glowClass}" style="background: rgba(0,0,0,0.38); border: 1.5px solid ${isWinning ? '#ffd700' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 5px 9px; ${c.disabled ? 'opacity: 0.45;' : ''} display: flex; flex-direction: column; justify-content: space-between; gap: 4px; box-sizing: border-box; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 5px; overflow: hidden; white-space: nowrap;">
                <span class="type-badge ${c.tagClass}" style="font-size: 8.5px; padding: 1px 5px; flex-shrink: 0;">${c.tag}</span>
                <span style="font-weight: 800; color: #fff; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis;">${c.label}</span>
                ${isWinning ? '<span style="color: #ffd700; font-weight: 900; font-size: 10px; flex-shrink: 0;">👑 1위!</span>' : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; flex-shrink: 0;">
                <span style="color: var(--text-sub);">${c.ppText}</span>
                ${!isReveal ? `
                  <span style="color: #94a3b8; font-weight: 700; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px;">🔒 집계 중</span>
                ` : `
                  <span style="color: ${isWinning ? '#ffd700' : teamColor}; font-weight: 800;">${count}표 (${pct}%)</span>
                `}
              </div>
            </div>
            <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); position: relative;">
              ${!isReveal ? `
                <div style="height: 100%; width: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05)); background-size: 200% 100%; animation: votePulse 2s infinite linear; border-radius: 3px;"></div>
              ` : `
                <div style="height: 100%; width: ${pct}%; background: ${gradient}; border-radius: 3px; transition: width 0.4s ease-out;"></div>
              `}
            </div>
          </div>
        `;
      }

      let html = '';

      if (allOutOfPP) {
        html += renderCandidateCard({
          key: 'struggle',
          label: '💥 [발버둥] Struggle',
          ppText: '반동 25%',
          tag: '노말',
          tagClass: 'type-노말',
          disabled: false,
          isStruggle: true
        });
      } else {
        slot.pokemon.moves.forEach((m, i) => {
          const ppObj = slot.movesPP ? slot.movesPP[i] : null;
          const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
          const isOutOfPP = currentPP <= 0;
          const isLocked = slot.choiceMove && slot.choiceMove.name !== m.name;
          const isAV = slot.item === 'assault_vest' && m.category === '변화';
          const isBanned = (slot.pokemon.name === '왕구리' && m.name === '막치기') || (slot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          const disabled = isOutOfPP || isLocked || isAV || isBanned;

          const normalCard = {
            key: `move_${i + 1}`,
            label: `${i + 1}. ${m.name}`,
            ppText: `PP ${currentPP}/${ppObj ? ppObj.maxPP : 15}`,
            tag: m.type,
            tagClass: `type-${m.type}`,
            disabled: disabled,
            isMega: false
          };

          if (canMega && !disabled) {
            const megaCard = {
              key: `mega_${i + 1}`,
              label: `🧬 메가${i + 1}. ${m.name}`,
              ppText: `PP ${currentPP}/${ppObj ? ppObj.maxPP : 15}`,
              tag: '메가',
              tagClass: 'type-드래곤',
              disabled: false,
              isMega: true
            };
            html += `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                ${renderCandidateCard(normalCard)}
                ${renderCandidateCard(megaCard)}
              </div>
            `;
          } else {
            html += `
              <div style="width: 100%;">
                ${renderCandidateCard(normalCard)}
              </div>
            `;
          }
        });

        if (pokeBattleMode === '3v3') {
          const teamArr = isRed ? streamerTeam : viewersTeam;
          const activeIdx = isRed ? streamerActiveIdx : viewersActiveIdx;
          const switchCandidates = [];
          let switchCounter = 5;
          for (let i = 0; i < 3; i++) {
            if (i !== activeIdx) {
              const tSlot = teamArr[i];
              const isAlive = !tSlot.fainted && tSlot.currentHP > 0;
              switchCandidates.push({
                key: `switch_${switchCounter}`,
                label: `🔄 ${switchCounter}. [${tSlot.pokemon.name}] 교체`,
                ppText: `HP ${Math.round(tSlot.currentHP)}/${tSlot.maxHP}`,
                tag: '교체',
                tagClass: 'type-비행',
                disabled: !isAlive,
                isSwitch: true
              });
              switchCounter++;
            }
          }

          if (switchCandidates.length > 0) {
            if (switchCandidates.length === 2) {
              html += `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; width: 100%;">
                  ${renderCandidateCard(switchCandidates[0])}
                  ${renderCandidateCard(switchCandidates[1])}
                </div>
              `;
            } else {
              switchCandidates.forEach(sc => {
                html += `<div style="width: 100%;">${renderCandidateCard(sc)}</div>`;
              });
            }
          }
        }
      }

      container.innerHTML = html;
    }
    window.renderFactionVotingBarsUI = renderFactionVotingBarsUI;

    function resolveFactionTurnAction(team, slot) {
      const isRed = team === 'red';
      const voteCounts = isRed ? factionRedVoteCounts : factionBlueVoteCounts;
      const activeIdx = isRed ? streamerActiveIdx : viewersActiveIdx;
      const teamArr = isRed ? streamerTeam : viewersTeam;
      const hasMegaEvolved = isRed ? streamerTeamHasMegaEvolved : viewersTeamHasMegaEvolved;
      const megaForm = getAvailableMegaEvolution(slot.pokemon, slot.item);
      const canMega = megaForm && !hasMegaEvolved && !slot.isMega;

      const validCandidateKeys = [];
      const switchIndexMap = {};

      const allOutOfPP = slot.movesPP && slot.movesPP.length > 0 && slot.movesPP.every(x => x.currentPP <= 0);

      if (allOutOfPP) {
        validCandidateKeys.push('struggle');
      } else {
        slot.pokemon.moves.forEach((m, i) => {
          const ppObj = slot.movesPP ? slot.movesPP[i] : null;
          const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
          const isOutOfPP = currentPP <= 0;
          const isLocked = slot.choiceMove && slot.choiceMove.name !== m.name;
          const isAV = slot.item === 'assault_vest' && m.category === '변화';
          const isBanned = (slot.pokemon.name === '왕구리' && m.name === '막치기') || (slot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          if (!isLocked && !isAV && !isOutOfPP && !isBanned) {
            validCandidateKeys.push(`move_${i + 1}`);
            if (canMega) validCandidateKeys.push(`mega_${i + 1}`);
          }
        });
      }

      let switchCounter = 5;
      if (pokeBattleMode === '3v3') {
        for (let i = 0; i < 3; i++) {
          if (i !== activeIdx) {
            if (!teamArr[i].fainted && teamArr[i].currentHP > 0) {
              validCandidateKeys.push(`switch_${switchCounter}`);
              switchIndexMap[`switch_${switchCounter}`] = i;
            }
            switchCounter++;
          }
        }
      }

      let maxVotes = 0;
      let topChoices = [];
      for (const key of validCandidateKeys) {
        const v = voteCounts[key] || 0;
        if (v > maxVotes) {
          maxVotes = v;
          topChoices = [key];
        } else if (v === maxVotes && maxVotes > 0) {
          topChoices.push(key);
        }
      }

      let pickedKey = validCandidateKeys[0] || 'move_1';
      if (maxVotes > 0 && topChoices.length > 0) {
        pickedKey = topChoices[Math.floor(Math.random() * topChoices.length)];
      } else if (validCandidateKeys.length > 0) {
        pickedKey = validCandidateKeys[Math.floor(Math.random() * validCandidateKeys.length)];
      }

      if (pickedKey === 'struggle') {
        const struggleMove = { name: '발버둥', type: '노말', category: '물리', power: 50, acc: 100, isStruggle: true };
        return { type: 'move', moveIdx: -1, move: struggleMove, isMega: false, actionKey: 'struggle' };
      } else if (pickedKey.startsWith('switch_')) {
        const targetIdx = switchIndexMap[pickedKey];
        return { type: 'switch', targetIdx, actionKey: pickedKey };
      } else if (pickedKey.startsWith('mega_')) {
        const mIdx = parseInt(pickedKey.replace('mega_', ''), 10) - 1;
        return { type: 'move', moveIdx: mIdx, move: slot.pokemon.moves[mIdx], isMega: true, actionKey: pickedKey };
      } else {
        const mIdx = parseInt(pickedKey.replace('move_', ''), 10) - 1;
        return { type: 'move', moveIdx: mIdx, move: slot.pokemon.moves[mIdx], isMega: false, actionKey: pickedKey };
      }
    }
    window.resolveFactionTurnAction = resolveFactionTurnAction;

    function openFactionFaintSwitchVote(side, aliveSlots) {
      pokeBattleState.phase = 'faint_switch_faction';
      factionFaintSide = side;
      factionFaintAliveSlotsCached = aliveSlots || [];
      factionFaintVoteUsers.clear();
      factionFaintVoteCounts = {};

      const modal = document.getElementById('pokeFaintSwitchModal');
      const title = document.getElementById('pokeFaintSwitchTitle');
      const subTitle = document.getElementById('pokeFaintSwitchSubTitle');
      const teamName = side === 'red' ? factionTeamNames.red : factionTeamNames.blue;
      const teamColor = side === 'red' ? '#f87171' : '#38bdf8';
      const teamIcon = side === 'red' ? '🔴' : '🔵';

      if (title) {
        title.innerHTML = `${teamIcon} <span style="color: ${teamColor};">${teamName}</span>: 다음 출전 포켓몬 선택`;
      }
      if (subTitle) {
        subTitle.innerText = `${teamName}의 포켓몬이 쓰러졌습니다! 소속 시청자들은 채팅에 번호나 이름을 입력하세요. (15초)`;
      }

      renderFactionFaintVoteCandidatesUI(factionFaintAliveSlotsCached, false);
      if (modal) modal.classList.add('active');

      pokeBattleState.faintTimerTotal = 15.0;
      pokeBattleState.faintTimerRemaining = 15.0;
      renderFaintTimerUI();

      clearInterval(pokeBattleState.faintTimerInterval);
      pokeBattleState.faintTimerInterval = setInterval(() => {
        pokeBattleState.faintTimerRemaining -= 0.1;
        if (pokeBattleState.faintTimerRemaining <= 0) {
          pokeBattleState.faintTimerRemaining = 0;
          clearInterval(pokeBattleState.faintTimerInterval);
          finishFactionFaintSwitchVote(factionFaintAliveSlotsCached);
        }
        renderFaintTimerUI();
      }, 100);
    }
    window.openFactionFaintSwitchVote = openFactionFaintSwitchVote;

    function recomputeFactionFaintVotes() {
      factionFaintVoteCounts = {};
      for (const [u, slotIdx] of factionFaintVoteUsers.entries()) {
        factionFaintVoteCounts[slotIdx] = (factionFaintVoteCounts[slotIdx] || 0) + 1;
      }
    }

    function renderFactionFaintVoteCandidatesUI(aliveSlots, isReveal = false, winningSlot = null) {
      const list = document.getElementById('pokeFaintSwitchCandidatesList');
      if (!list) return;
      const isRed = factionFaintSide === 'red';
      const teamArr = isRed ? streamerTeam : viewersTeam;
      const total = factionFaintVoteUsers.size;

      list.innerHTML = aliveSlots.map(slotIdx => {
        const slotNum = slotIdx + 1;
        const slot = teamArr[slotIdx];
        const p = slot.pokemon;
        const it = getItemObj(slot.item);
        const count = factionFaintVoteCounts[slotIdx] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isWinning = (winningSlot === slotIdx);

        return `
          <div class="poke-switch-card" style="cursor: default; ${isWinning ? 'border-color: #ffd700; background: rgba(255, 215, 0, 0.12); box-shadow: 0 0 16px rgba(255, 215, 0, 0.35);' : ''}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${p.sprite_front}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated;">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #fff;">
                  [${slotNum}번 슬롯] ${p.name}
                  ${isWinning ? '<span style="color: #ffd700; font-size: 11px; margin-left: 6px;">👑 1위 출전 확정!</span>' : ''}
                </div>
                <div style="display: flex; gap: 4px; margin-top: 2px;">
                  ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
                  <span class="poke-item-badge" style="font-size: 9px;">${it.emoji} ${it.name}</span>
                </div>
              </div>
            </div>
            <div style="width: 190px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-sub); margin-bottom: 3px;">
                <span>채팅에 <b>${slotNum}</b> 또는 <b>${p.name}</b></span>
                ${!isReveal ? `
                  <span style="font-size: 10px; color: #94a3b8; font-weight: 700; background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">🔒 집계 중...</span>
                ` : `
                  <span style="color: ${isWinning ? '#ffd700' : (isRed ? '#f87171' : '#38bdf8')}; font-weight: 900;">${count}표 (${pct}%) ${isWinning ? '👑' : ''}</span>
                `}
              </div>
              <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); position: relative;">
                ${!isReveal ? `
                  <div style="height: 100%; width: 100%; background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05)); background-size: 200% 100%; animation: votePulse 2s infinite linear; border-radius: 3px;"></div>
                ` : `
                  <div style="height: 100%; width: ${pct}%; background: ${isWinning ? 'linear-gradient(90deg, #ffd700, #00ffa3)' : (isRed ? 'linear-gradient(90deg, #f87171, #f97316)' : 'linear-gradient(90deg, #38bdf8, #00ffa3)')}; border-radius: 3px; transition: width 0.4s ease-out;"></div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    async function finishFactionFaintSwitchVote(aliveSlots) {
      clearInterval(pokeBattleState.faintTimerInterval);
      const isRed = factionFaintSide === 'red';
      const teamArr = isRed ? streamerTeam : viewersTeam;
      const teamName = isRed ? factionTeamNames.red : factionTeamNames.blue;

      let maxVotes = 0;
      let topChoices = [];
      aliveSlots.forEach(slotIdx => {
        const v = factionFaintVoteCounts[slotIdx] || 0;
        if (v > maxVotes) {
          maxVotes = v;
          topChoices = [slotIdx];
        } else if (v === maxVotes && maxVotes > 0) {
          topChoices.push(slotIdx);
        }
      });

      let chosenSlotIdx = aliveSlots[0];
      if (maxVotes > 0 && topChoices.length > 0) {
        chosenSlotIdx = topChoices[Math.floor(Math.random() * topChoices.length)];
      } else {
        chosenSlotIdx = aliveSlots[Math.floor(Math.random() * aliveSlots.length)];
      }

      renderFactionFaintVoteCandidatesUI(aliveSlots, true, chosenSlotIdx);
      await new Promise(r => setTimeout(r, 1300));

      const modal = document.getElementById('pokeFaintSwitchModal');
      if (modal) modal.classList.remove('active');

      if (isRed) {
        streamerActiveIdx = chosenSlotIdx;
        const spr = document.getElementById('arenaStreamerSprite');
        if (spr) spr.classList.remove('poke-sprite-fainted');
      } else {
        viewersActiveIdx = chosenSlotIdx;
        const spr = document.getElementById('arenaViewersSprite');
        if (spr) spr.classList.remove('poke-sprite-fainted');
      }

      updateArenaActivePokemonUI();
      renderArenaTeamBallsHUD();
      updateArenaHPBars();

      setBattleDialogue(`${isRed ? '🔴' : '🔵'} <b>${teamName}</b>은 <b>[${teamArr[chosenSlotIdx].pokemon.name}]</b>(을)를 출전시켰다!`);
      await new Promise(r => setTimeout(r, 1000));

      pokeBattleState.round++;
      pokeBattleState.stats.totalRounds++;
      startSimultaneousPokeTurn();
    }
    window.finishFactionFaintSwitchVote = finishFactionFaintSwitchVote;

    // --- Caster Controls ---
    function forceFinishTurnEarly() {
      if (!pokeBattleState.active) return;
      if (pokeBattleState.phase === 'simultaneous_turn' || pokeBattleState.phase === 'viewers_vote') {
        showToast('⏭️ 중계자가 투표를 조기 마감하고 배틀 턴을 진행합니다!', '⚡');
        finishSimultaneousPokeTurn();
      } else if (pokeBattleState.phase === 'faint_switch_faction') {
        showToast('⏭️ 중계자가 교체 투표를 조기 마감합니다!', '⚡');
        finishFactionFaintSwitchVote(factionFaintAliveSlotsCached);
      } else if (pokeBattleState.phase === 'faint_switch_viewers') {
        showToast('⏭️ 중계자가 시청자 교체 투표를 조기 마감합니다!', '⚡');
        finishViewersFaintVote(faintAliveSlotsCached);
      }
    }
    window.forceFinishTurnEarly = forceFinishTurnEarly;

    function addTurnTimerSeconds(sec) {
      if (!pokeBattleState.active) return;
      if (pokeBattleState.phase === 'simultaneous_turn' || pokeBattleState.phase === 'viewers_vote') {
        pokeBattleState.turnTimerRemaining += sec;
        pokeBattleState.turnTimerTotal += sec;
        showToast(`⏱️ 배틀 투표 시간이 +${sec}초 연장되었습니다!`, '⏱️');
      } else if (pokeBattleState.phase === 'faint_switch_faction' || pokeBattleState.phase === 'faint_switch_viewers') {
        pokeBattleState.faintTimerRemaining += sec;
        pokeBattleState.faintTimerTotal += sec;
        showToast(`⏱️ 교체 투표 시간이 +${sec}초 연장되었습니다!`, '⏱️');
      }
    }
    window.addTurnTimerSeconds = addTurnTimerSeconds;

    function openFactionRosterModal() {
      const modal = document.getElementById('factionRosterModal');
      const searchInput = document.getElementById('rosterSearchInput');
      if (searchInput) searchInput.value = '';
      renderFactionRosterLists('');
      if (modal) modal.classList.add('active');
    }
    window.openFactionRosterModal = openFactionRosterModal;

    function filterFactionRosterModal(query) {
      renderFactionRosterLists(query || '');
    }
    window.filterFactionRosterModal = filterFactionRosterModal;

    function renderFactionRosterLists(searchQuery = '') {
      const redTitle = document.getElementById('rosterRedTitle');
      const blueTitle = document.getElementById('rosterBlueTitle');
      const redCount = document.getElementById('rosterRedCount');
      const blueCount = document.getElementById('rosterBlueCount');
      const redList = document.getElementById('rosterRedMembersList');
      const blueList = document.getElementById('rosterBlueMembersList');

      const q = (searchQuery || '').trim().toLowerCase();

      const redFiltered = q ? factionRedMembers.filter(m => (m.nickname || '').toLowerCase().includes(q)) : factionRedMembers;
      const blueFiltered = q ? factionBlueMembers.filter(m => (m.nickname || '').toLowerCase().includes(q)) : factionBlueMembers;

      if (redTitle) redTitle.innerText = `🔴 ${factionTeamNames.red}`;
      if (blueTitle) blueTitle.innerText = `🔵 ${factionTeamNames.blue}`;
      if (redCount) redCount.innerText = q ? `${redFiltered.length}명 (총 ${factionRedMembers.length}명)` : `${factionRedMembers.length}명`;
      if (blueCount) blueCount.innerText = q ? `${blueFiltered.length}명 (총 ${factionBlueMembers.length}명)` : `${factionBlueMembers.length}명`;

      if (redList) {
        if (redFiltered.length === 0) {
          redList.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 20px; font-size: 11px;">${q ? '검색된 시청자가 없습니다.' : '참가자가 없습니다.'}</div>`;
        } else {
          redList.innerHTML = redFiltered.map(m => {
            const p = (typeof participants !== 'undefined') ? participants.get(m.uid) : null;
            let vipBadgeHtml = '';
            if (p) {
              if (p.isSubscriber) vipBadgeHtml += `<span class="badge-tag badge-sub" style="font-size: 9px; padding: 1px 5px; margin-left: 4px;">⭐ 구독</span>`;
              if (p.isDonator) vipBadgeHtml += `<span class="badge-tag badge-follow" style="font-size: 9px; padding: 1px 5px; margin-left: 4px; background: rgba(255,215,0,0.25); color: #ffd700;">🧀 후원</span>`;
              if (p.donatorLevel && p.donatorLevel >= 2) vipBadgeHtml += `<span class="badge-tag" style="font-size: 9px; padding: 1px 5px; margin-left: 4px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #080c14; font-weight: 900;">👑 VIP</span>`;
            }
            return `
              <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 상세 정보 열기)" style="display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(239,68,68,0.25); cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(239,68,68,0.18)'; this.style.borderColor='rgba(239,68,68,0.6)';" onmouseout="this.style.background='rgba(0,0,0,0.35)'; this.style.borderColor='rgba(239,68,68,0.25)';">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                  <span style="color: #f87171; font-weight: 800; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🔴 ${escapeHtml(m.nickname)}</span>
                  ${vipBadgeHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                  <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 2px 7px; border-radius: 4px; font-weight: 800; border: 1px solid rgba(0,255,163,0.3);">🔍 UID 확인</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      if (blueList) {
        if (blueFiltered.length === 0) {
          blueList.innerHTML = `<div style="text-align: center; color: var(--text-sub); padding: 20px; font-size: 11px;">${q ? '검색된 시청자가 없습니다.' : '참가자가 없습니다.'}</div>`;
        } else {
          blueList.innerHTML = blueFiltered.map(m => {
            const p = (typeof participants !== 'undefined') ? participants.get(m.uid) : null;
            let vipBadgeHtml = '';
            if (p) {
              if (p.isSubscriber) vipBadgeHtml += `<span class="badge-tag badge-sub" style="font-size: 9px; padding: 1px 5px; margin-left: 4px;">⭐ 구독</span>`;
              if (p.isDonator) vipBadgeHtml += `<span class="badge-tag badge-follow" style="font-size: 9px; padding: 1px 5px; margin-left: 4px; background: rgba(255,215,0,0.25); color: #ffd700;">🧀 후원</span>`;
              if (p.donatorLevel && p.donatorLevel >= 2) vipBadgeHtml += `<span class="badge-tag" style="font-size: 9px; padding: 1px 5px; margin-left: 4px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #080c14; font-weight: 900;">👑 VIP</span>`;
            }
            return `
              <div onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 상세 정보 열기)" style="display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; background: rgba(0,0,0,0.35); border-radius: 6px; border: 1px solid rgba(56,189,248,0.25); cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(56,189,248,0.18)'; this.style.borderColor='rgba(56,189,248,0.6)';" onmouseout="this.style.background='rgba(0,0,0,0.35)'; this.style.borderColor='rgba(56,189,248,0.25)';">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                  <span style="color: #38bdf8; font-weight: 800; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🔵 ${escapeHtml(m.nickname)}</span>
                  ${vipBadgeHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                  <span style="font-size: 10px; color: var(--chzzk-green); background: rgba(0,255,163,0.12); padding: 2px 7px; border-radius: 4px; font-weight: 800; border: 1px solid rgba(0,255,163,0.3);">🔍 UID 확인</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    function closeFactionRosterModal() {
      const modal = document.getElementById('factionRosterModal');
      if (modal) modal.classList.remove('active');
    }
    window.closeFactionRosterModal = closeFactionRosterModal;

    function getPokeStatWithRank(baseStat, rank) {
      const clampedRank = Math.max(-6, Math.min(6, rank || 0));
      let mult = 1.0;
      if (clampedRank >= 0) mult = (2 + clampedRank) / 2;
      else mult = 2 / (2 - clampedRank);
      return Math.floor(baseStat * mult);
    }

    function getStatusBadgeHtml(status) {
      if (!status) return '';
      const map = {
        'brn': '<span class="poke-status-badge" style="background: #ef4444; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 5px;">🔥 화상</span>',
        'par': '<span class="poke-status-badge" style="background: #eab308; color: #000; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 5px;">⚡ 마비</span>',
        'psn': '<span class="poke-status-badge" style="background: #a855f7; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 5px;">🟣 독</span>',
        'tox': '<span class="poke-status-badge" style="background: #7e22ce; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 5px;">💀 맹독</span>',
        'frz': '<span class="poke-status-badge" style="background: #06b6d4; color: #fff; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; margin-left: 5px;">❄️ 얼음</span>'
      };
      return map[status] || '';
    }

    function getRanksBadgeHtml(slot) {
      if (!slot) return '';
      const badges = [];
      if (slot.rankAtk) badges.push(`공${slot.rankAtk > 0 ? '+' + slot.rankAtk : slot.rankAtk}`);
      if (slot.rankDef) badges.push(`방${slot.rankDef > 0 ? '+' + slot.rankDef : slot.rankDef}`);
      if (slot.rankSpA) badges.push(`특공${slot.rankSpA > 0 ? '+' + slot.rankSpA : slot.rankSpA}`);
      if (slot.rankSpD) badges.push(`특방${slot.rankSpD > 0 ? '+' + slot.rankSpD : slot.rankSpD}`);
      if (slot.rankSpe) badges.push(`스피드${slot.rankSpe > 0 ? '+' + slot.rankSpe : slot.rankSpe}`);
      if (badges.length === 0) return '';
      return `<span style="font-size: 9px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; padding: 1px 4px; color: #ffd700; margin-left: 4px;">${badges.join(' ')}</span>`;
    }

    function normalizePokeItemId(itemId) {
      if (!itemId) return 'none';
      return String(itemId).trim().toLowerCase().replace(/-/g, '_');
    }

    function calculateLevel50Stat(baseStat) {
      // Official Level 50 Flat Stat Formula (31 IV, 80 EV / +20 constant offset): floor(((2 * Base + 31 + 10) * 50) / 100) + 5 = Base + 20
      return Math.floor(((2 * (baseStat || 50) + 31) * 50) / 100) + 5;
    }

    function getPokeMovePriority(move, slot) {
      if (!move || !move.name) return 0;
      const name = move.name;
      if (name === '방어' || name === '판별' || name === '니들가드' || name === '킹실드') return 4;
      if (name === '속이기') return 3;
      if (name === '신속' || name === '만나자마자' || name === '페인트') return 2;
      const plus1Moves = [
        '전광석화', '야습', '기습', '얼음뭉치', '불릿펀치', '아쿠아제트',
        '그래스슬라이더', '마하펀치', '진공파', '물수리검', '그림자치기', '록액셀', '초롱초롱눈동자'
      ];
      if (plus1Moves.includes(name)) return 1;
      if (name === '날려버리기' || name === '울부짖기' || name === '드래곤테일' || name === '배대뒤치기') return -6;
      if (name === '트릭룸') return -7;
      // Ability-based priority: Gale Wings (질풍날개) at full HP or Prankster (짓궂은마음) on status moves
      const abilities = (slot && slot.pokemon && slot.pokemon.abilities) ? slot.pokemon.abilities : [];
      if (abilities.includes('gale-wings') && move.type === '비행' && slot.currentHP >= slot.maxHP) return 1;
      if (abilities.includes('prankster') && (move.category === '변화' || move.power === 0)) return 1;
      return 0;
    }

    function resetSlotOnSwitchOut(slot) {
      if (!slot) return;
      slot.choiceMove = null;
      slot.rankAtk = 0;
      slot.rankDef = 0;
      slot.rankSpA = 0;
      slot.rankSpD = 0;
      slot.rankSpe = 0;
      slot.flinched = false;
      slot.destinyBond = false;
      slot.protected = false;
      slot.protectCount = 0;
      if (slot.status === 'tox') {
        slot.toxicTurns = 1;
      }
    }

    function calculateBattleSpeed(slot) {
      if (!slot || !slot.pokemon) return 50;
      let spe = calculateLevel50Stat(slot.pokemon.stats.spe);
      if (slot.rankSpe) spe = getPokeStatWithRank(spe, slot.rankSpe);
      if (normalizePokeItemId(slot.item) === 'choice_scarf') spe = Math.floor(spe * 1.5);
      if (slot.status === 'par') spe = Math.floor(spe * 0.5); // 마비 시 스피드 50%
      return Math.max(1, spe);
    }

    function updateArenaActivePokemonUI() {
      const sSlot = streamerTeam[streamerActiveIdx];
      const vSlot = viewersTeam[viewersActiveIdx];
      const sP = sSlot.pokemon;
      const vP = vSlot.pokemon;

      const sNameEl = document.getElementById('arenaStreamerName');
      if (sNameEl) {
        const megaPrefix = sSlot.isMega ? `<span class="mega-tag-badge">🧬 MEGA</span> ` : '';
        sNameEl.innerHTML = `${megaPrefix}${sP.name}${getStatusBadgeHtml(sSlot.status)}${getRanksBadgeHtml(sSlot)}`;
      }
      const sSpr = document.getElementById('arenaStreamerSprite');
      if (sSpr) {
        sSpr.src = sP.sprite_back || sP.sprite_front;
        sSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged');
        sSpr.style.opacity = '1';
        sSpr.style.transform = 'none';
      }
      document.getElementById('arenaStreamerTypes').innerHTML = sP.types.map(t => `<span class="type-badge type-${t}" style="font-size: 9px; padding: 1px 4px;">${t}</span>`).join('');
      
      const sItem = getItemObj(sSlot.item);
      const sItemBadge = document.getElementById('arenaStreamerItemBadge');
      if (sItemBadge) {
        sItemBadge.innerHTML = sSlot.isMega ? `<span class="mega-tag-badge">🧬 MEGA</span> ${sItem.name}` : `${sItem.emoji} ${sItem.name}`;
        sItemBadge.style.display = sSlot.item === 'none' ? 'none' : 'inline-flex';
      }

      const vNameEl = document.getElementById('arenaViewersName');
      if (vNameEl) {
        const megaPrefix = vSlot.isMega ? `<span class="mega-tag-badge">🧬 MEGA</span> ` : '';
        vNameEl.innerHTML = `${megaPrefix}${vP.name}${getStatusBadgeHtml(vSlot.status)}${getRanksBadgeHtml(vSlot)}`;
      }
      const vSpr = document.getElementById('arenaViewersSprite');
      if (vSpr) {
        vSpr.src = vP.sprite_front;
        vSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged');
        vSpr.style.opacity = '1';
        vSpr.style.transform = 'none';
      }
      document.getElementById('arenaViewersTypes').innerHTML = vP.types.map(t => `<span class="type-badge type-${t}" style="font-size: 9px; padding: 1px 4px;">${t}</span>`).join('');

      const vItem = getItemObj(vSlot.item);
      const vItemBadge = document.getElementById('arenaViewersItemBadge');
      if (vItemBadge) {
        vItemBadge.innerHTML = vSlot.isMega ? `<span class="mega-tag-badge">🧬 MEGA</span> ${vItem.name}` : `${vItem.emoji} ${vItem.name}`;
        vItemBadge.style.display = vSlot.item === 'none' ? 'none' : 'inline-flex';
      }

      const sStatusLabel = document.getElementById('arenaStreamerStatusLabel');
      const sStatusName = document.getElementById('arenaStreamerStatusName');
      const sStatusAvatar = document.getElementById('arenaStreamerStatusAvatar');
      const vStatusLabel = document.getElementById('arenaViewersStatusTeamLabel');
      const sTopName = document.getElementById('arenaStreamerTopName');
      const sTopAvatar = document.getElementById('arenaStreamerTopAvatar');
      const sTopBadge = document.getElementById('arenaStreamerTeamBadge');

      if (pokeBattleSubMode === 'faction_battle') {
        if (sStatusName) sStatusName.innerText = `🔴 ${factionTeamNames.red}`;
        if (sStatusLabel) sStatusLabel.style.color = '#f87171';
        if (sStatusAvatar) sStatusAvatar.style.display = 'none';
        if (vStatusLabel) {
          vStatusLabel.innerText = `🔵 ${factionTeamNames.blue}`;
          vStatusLabel.style.color = '#38bdf8';
        }
        if (sTopName) sTopName.innerText = `🔴 ${factionTeamNames.red}`;
        if (sTopAvatar) sTopAvatar.style.display = 'none';
        if (sTopBadge) {
          sTopBadge.style.color = '#f87171';
          sTopBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        }
      } else {
        const sAvatarUrl = typeof getStreamerAvatar === 'function' ? getStreamerAvatar() : '';
        if (sStatusName) sStatusName.innerText = `👑 ${getStreamerName()}`;
        if (sStatusLabel) sStatusLabel.style.color = '#ffd700';
        if (sStatusAvatar) {
          if (sAvatarUrl) {
            sStatusAvatar.src = sAvatarUrl;
            sStatusAvatar.style.display = 'inline-block';
          } else {
            sStatusAvatar.style.display = 'none';
          }
        }
        if (vStatusLabel) {
          vStatusLabel.innerText = '👥 시청자 연합';
          vStatusLabel.style.color = '#38bdf8';
        }
        if (sTopName) sTopName.innerText = `👑 ${getStreamerName()}`;
        if (sTopAvatar) {
          if (sAvatarUrl) {
            sTopAvatar.src = sAvatarUrl;
            sTopAvatar.style.display = 'inline-block';
          } else {
            sTopAvatar.style.display = 'none';
          }
        }
        if (sTopBadge) {
          sTopBadge.style.color = '#ffd700';
          sTopBadge.style.background = 'rgba(255, 215, 0, 0.2)';
        }
      }
    }

    function renderArenaTeamBallsHUD() {
      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
      const sHUD = document.getElementById('arenaStreamerBallsHUD');
      const vHUD = document.getElementById('arenaViewersBallsHUD');

      if (sHUD) {
        sHUD.innerHTML = Array.from({length: teamSize}).map((_, i) => {
          const slot = streamerTeam[i];
          const isAct = i === streamerActiveIdx;
          const isFaint = slot.fainted;
          const cls = isFaint ? 'poke-ball-fainted' : (isAct ? 'poke-ball-active' : 'poke-ball-alive');
          return `<span class="poke-ball-indicator ${cls}" title="${slot.pokemon.name} (${isFaint ? '기절' : isAct ? '출전중' : '생존'})">${isFaint ? '✕' : isAct ? '⚔️' : '●'}</span>`;
        }).join('');
      }

      if (vHUD) {
        vHUD.innerHTML = Array.from({length: teamSize}).map((_, i) => {
          const slot = viewersTeam[i];
          const isAct = i === viewersActiveIdx;
          const isFaint = slot.fainted;
          const cls = isFaint ? 'poke-ball-fainted' : (isAct ? 'poke-ball-active' : 'poke-ball-alive');
          return `<span class="poke-ball-indicator ${cls}" title="${slot.pokemon.name} (${isFaint ? '기절' : isAct ? '출전중' : '생존'})">${isFaint ? '✕' : isAct ? '⚔️' : '●'}</span>`;
        }).join('');
      }
    }

    function updateArenaHPBars() {
      const sSlot = streamerTeam[streamerActiveIdx];
      const vSlot = viewersTeam[viewersActiveIdx];

      const sPct = Math.max(0, (sSlot.currentHP / sSlot.maxHP) * 100);
      const vPct = Math.max(0, (vSlot.currentHP / vSlot.maxHP) * 100);

      const sBar = document.getElementById('arenaStreamerHPBar');
      const vBar = document.getElementById('arenaViewersHPBar');
      const sText = document.getElementById('arenaStreamerHPText');
      const vText = document.getElementById('arenaViewersHPText');

      if (sBar) {
        sBar.style.width = `${sPct}%`;
        sBar.style.background = sPct > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : sPct > 25 ? 'linear-gradient(90deg, #eab308, #facc15)' : 'linear-gradient(90deg, #ef4444, #f87171)';
        sBar.classList.toggle('is-pinch', sPct <= 25 && sSlot.currentHP > 0);
      }
      if (vBar) {
        vBar.style.width = `${vPct}%`;
        vBar.style.background = vPct > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : vPct > 25 ? 'linear-gradient(90deg, #eab308, #facc15)' : 'linear-gradient(90deg, #ef4444, #f87171)';
        vBar.classList.toggle('is-pinch', vPct <= 25 && vSlot.currentHP > 0);
      }

      if (sText) sText.innerText = `${Math.max(0, Math.round(sSlot.currentHP))} / ${sSlot.maxHP}`;
      if (vText) vText.innerText = `${Math.max(0, Math.round(vSlot.currentHP))} / ${vSlot.maxHP}`;
      updateStreamerControllerPopout();
      checkPokeBattleBgmCondition();
    }

    function setBattleDialogue(html) {
      const dlg = document.getElementById('arenaDialogueText');
      if (dlg) dlg.innerHTML = html;
    }

    function switchPokeActionTab(tab) {
      if (pokeBattleMode === '1v1') {
        tab = 'moves';
      }
      streamerActionTab = tab;
      const movesBtn = document.getElementById('pokeActionMovesTabBtn');
      const switchBtn = document.getElementById('pokeActionSwitchTabBtn');
      const movesDeck = document.getElementById('arenaMoveButtonsDeck');
      const switchDeck = document.getElementById('arenaSwitchButtonsDeck');
      const megaContainer = document.getElementById('streamerMegaToggleContainer');
      const blindDeck = document.getElementById('streamerPrivacyBlindDeck');

      if (switchBtn) {
        switchBtn.style.display = pokeBattleMode === '1v1' ? 'none' : 'inline-flex';
      }

      if (streamerPrivacyBlind) {
        if (blindDeck) blindDeck.style.display = 'block';
        if (movesDeck) movesDeck.style.display = 'none';
        if (switchDeck) switchDeck.style.display = 'none';
        if (megaContainer) megaContainer.style.display = 'none';
        if (tab === 'moves') {
          if (movesBtn) movesBtn.classList.add('active');
          if (switchBtn) switchBtn.classList.remove('active');
        } else {
          if (switchBtn) switchBtn.classList.add('active');
          if (movesBtn) movesBtn.classList.remove('active');
          renderStreamerSwitchDeck();
        }
        return;
      }

      if (blindDeck) blindDeck.style.display = 'none';

      if (tab === 'moves') {
        if (movesBtn) movesBtn.classList.add('active');
        if (switchBtn) switchBtn.classList.remove('active');
        if (movesDeck) movesDeck.style.display = 'grid';
        if (switchDeck) switchDeck.style.display = 'none';
        
        const sSlot = streamerTeam[streamerActiveIdx];
        const megaForm = getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);
        if (megaContainer) {
          megaContainer.style.display = (megaForm && !streamerTeamHasMegaEvolved && !sSlot.isMega) ? 'block' : 'none';
        }
      } else {
        if (switchBtn) switchBtn.classList.add('active');
        if (movesBtn) movesBtn.classList.remove('active');
        if (movesDeck) movesDeck.style.display = 'none';
        if (switchDeck) switchDeck.style.display = 'flex';
        if (megaContainer) megaContainer.style.display = 'none';
        renderStreamerSwitchDeck();
      }
    }

    function renderStreamerSwitchDeck() {
      const container = document.getElementById('arenaSwitchButtonsDeck');
      if (!container) return;

      if (pokeBattleMode === '1v1') {
        container.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px; font-size: 12px;">1v1 에이스 배틀은 교체가 지원되지 않습니다.</div>';
        return;
      }

      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
      const candidates = [];
      for (let i = 0; i < teamSize; i++) {
        if (i !== streamerActiveIdx) {
          candidates.push({ idx: i, slot: streamerTeam[i] });
        }
      }

      if (candidates.length === 0) {
        container.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px; font-size: 12px;">교체 가능한 팀원 포켓몬이 없습니다.</div>';
        return;
      }

      container.innerHTML = candidates.map((c, sIdx) => {
        const p = c.slot.pokemon;
        const it = getItemObj(c.slot.item);
        const maxHP = c.slot.maxHP || 1;
        const curHP = Math.max(0, c.slot.currentHP || 0);
        const hpPct = Math.round((curHP / maxHP) * 100);
        const isFainted = c.slot.fainted || curHP <= 0;
        const isSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'switch' && pokeBattleState.streamerAction.targetIdx === c.idx;
        const shortcutNum = sIdx + 1;
        return `
          <div class="poke-switch-card ${isFainted ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" onclick="${isFainted ? '' : `handleStreamerSwitchSelect(${c.idx})`}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${p.sprite_front}" alt="${p.name}" style="width: 38px; height: 38px; object-fit: contain; image-rendering: pixelated;">
              <div>
                <div style="font-weight: 800; color: ${isSelected ? '#38bdf8' : '#fff'}; font-size: 13px;">
                  <kbd style="background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.4); border-radius: 4px; padding: 1px 5px; font-size: 10px; margin-right: 4px; font-family: monospace; color: #38bdf8;">${shortcutNum}</kbd>
                  ${c.idx + 1}번. ${p.name} ${isSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; font-weight: normal; margin-left: 2px;">(다시 클릭 시 취소)</span>' : ''}
                </div>
                <div style="display: flex; gap: 4px; align-items: center; margin-top: 2px;">
                  ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
                  <span class="poke-item-badge" style="font-size: 9px; padding: 1px 6px;">${it.emoji} ${it.name}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 800; color: ${isFainted ? '#ef4444' : '#4ade80'};">${isFainted ? '💀 기절' : `HP ${curHP}/${maxHP} (${hpPct}%)`}</div>
              ${isFainted ? '' : `<span class="badge-tag" style="background: rgba(0,255,163,0.2); color: ${isSelected ? '#38bdf8' : 'var(--chzzk-green)'}; font-size: 10px; margin-top: 2px;">${isSelected ? '선택됨' : '🔄 교체 출전'}</span>`}
            </div>
          </div>
        `;
      }).join('');
    }

    function toggleStreamerMega() {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;
      const sSlot = streamerTeam[streamerActiveIdx];
      const megaForm = getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);
      if (!megaForm || streamerTeamHasMegaEvolved || sSlot.isMega) {
        showToast('현재 출전 포켓몬은 메가진화할 수 없거나 이미 이번 매치에서 메가진화를 사용했습니다.', '⚠️');
        return;
      }

      streamerMegaSelected = !streamerMegaSelected;
      const btn = document.getElementById('streamerMegaToggleBtn');
      const pill = document.getElementById('streamerMegaPill');
      if (btn) btn.classList.toggle('active', streamerMegaSelected);
      if (pill) {
        pill.className = `mega-pill-badge ${streamerMegaSelected ? 'on' : 'off'}`;
        pill.innerText = streamerMegaSelected ? '🧬 MEGA ON' : 'OFF';
      }

      if (pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'move') {
        pokeBattleState.streamerAction.isMega = streamerMegaSelected;
        updateStreamerActionStatusUI(false);
      }

      renderStreamerMovesDeck();

      if (streamerMegaSelected) {
        showToast(`🧬 [메가진화] 장전 완료! 기술 선택 시 메가진화와 동시에 공격합니다.`, '✨');
      } else {
        showToast('메가진화가 취소되었습니다.', '⚪');
      }

      updateStreamerControllerPopout();
    }

    function updateStreamerActionStatusUI(isReveal = false) {
      const badge = document.getElementById('streamerActionStatusBadge');
      if (!badge) return;

      if (!pokeBattleState.streamerAction) {
        badge.innerHTML = `👑 <b>${getStreamerName()}</b>: 행동 선택 대기 중...`;
        badge.style.color = '#ffd700';
        badge.style.background = 'rgba(255, 215, 0, 0.1)';
        badge.style.borderColor = 'rgba(255, 215, 0, 0.4)';
      } else {
        if (isReveal) {
          if (pokeBattleState.streamerAction.type === 'move') {
            const m = pokeBattleState.streamerAction.move;
            const isMega = pokeBattleState.streamerAction.isMega;
            badge.innerHTML = `👑 <b>${getStreamerName()} 최종 선택</b>: [${isMega ? '🧬 MEGA ' : ''}${m.name}]! <span style="font-size: 10px; color: #4ade80;">(발동)</span>`;
            badge.style.color = '#00ffa3';
            badge.style.background = 'rgba(0, 255, 163, 0.2)';
            badge.style.borderColor = '#00ffa3';
          } else if (pokeBattleState.streamerAction.type === 'switch') {
            const tp = pokeBattleState.streamerAction.targetPokemon;
            badge.innerHTML = `👑 <b>${getStreamerName()} 최종 교체</b>: [${tp.name}]! <span style="font-size: 10px; color: #38bdf8;">(발동)</span>`;
            badge.style.color = '#38bdf8';
            badge.style.background = 'rgba(56, 189, 248, 0.2)';
            badge.style.borderColor = '#38bdf8';
          }
        } else {
          // Option B: Information Blind mode during selection
          badge.innerHTML = `👑 <b>${getStreamerName()}</b>: 행동 결정 완료! 🔒 <span style="font-size: 10px; color: #4ade80;">(종료 시 동시 공개)</span>`;
          badge.style.color = '#00ffa3';
          badge.style.background = 'rgba(0, 255, 163, 0.12)';
          badge.style.borderColor = 'rgba(0, 255, 163, 0.5)';
        }
      }
      updateStreamerControllerPopout();
    }

    // --- Simultaneous Turn Selection Engine ---
    function startSimultaneousPokeTurn() {
      const sActive = streamerTeam[streamerActiveIdx];
      const vActive = viewersTeam[viewersActiveIdx];
      if (sActive && (sActive.fainted || sActive.currentHP <= 0)) {
        sActive.fainted = true;
        handleFaintPhase('streamer');
        return;
      }
      if (vActive && (vActive.fainted || vActive.currentHP <= 0)) {
        vActive.fainted = true;
        handleFaintPhase('viewers');
        return;
      }

      pokeBattleState.phase = 'simultaneous_turn';
      pokeBattleState.streamerAction = null;
      pokeBattleState.viewersAction = null;
      streamerMegaSelected = false;

      pokeVoteUsers.clear();
      pokeVoteCounts = {};

      const roundBadge = document.getElementById('pokeBattleRoundBadge');
      if (roundBadge) roundBadge.innerText = `⚔️ ROUND ${pokeBattleState.round}`;

      const phaseBadge = document.getElementById('pokeBattlePhaseBadge');
      if (phaseBadge) {
        phaseBadge.innerText = '⚔️ 턴 행동 동시 선택 중';
        phaseBadge.style.background = 'linear-gradient(135deg, #6366f1, #00ffa3)';
      }

      setBattleDialogue(`⚔️ <b>Round ${pokeBattleState.round}</b>: 스트리머와 시청자가 행동을 동시에 선택합니다!`);

      updateStreamerActionStatusUI();

      // Setup Streamer Right Deck
      if (streamerPrivacyBlind) {
        const blindDeck = document.getElementById('streamerPrivacyBlindDeck');
        if (blindDeck) blindDeck.style.display = 'block';
        const tabsBar = document.getElementById('streamerActionTabsBar');
        if (tabsBar) tabsBar.style.display = 'none';
        const megaContainer = document.getElementById('streamerMegaToggleContainer');
        if (megaContainer) megaContainer.style.display = 'none';
        const movesDeck = document.getElementById('arenaMoveButtonsDeck');
        if (movesDeck) movesDeck.style.display = 'none';
        const switchDeck = document.getElementById('arenaSwitchButtonsDeck');
        if (switchDeck) switchDeck.style.display = 'none';
      } else {
        switchPokeActionTab('moves');
      }
      renderStreamerMovesDeck();
      renderStreamerSwitchDeck();
      updateStreamerControllerPopout();

      // Setup Viewers Left Deck
      const hud = document.getElementById('arenaViewersVoteHud');
      if (hud) hud.style.display = 'block';

      const vSlot = viewersTeam[viewersActiveIdx];
      const vMega = getAvailableMegaEvolution(vSlot.pokemon, vSlot.item);
      const canMega = vMega && !viewersTeamHasMegaEvolved && !vSlot.isMega;

      const switchGuides = [];
      let switchCounter = 5;
      if (pokeBattleMode === '3v3') {
        for (let i = 0; i < 3; i++) {
          if (i !== viewersActiveIdx && !viewersTeam[i].fainted) {
            switchGuides.push(`[<b>${switchCounter}</b>: ${i+1}번 ${viewersTeam[i].pokemon.name}]`);
            switchCounter++;
          }
        }
      }

      const instr = document.getElementById('arenaVoteInstructionText');
      if (instr) {
        if (pokeBattleMode === '1v1') {
          instr.innerHTML = canMega
            ? `(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>메가4</b>)`
            : `(채팅에 <b>1</b>~<b>4</b> 기술 입력)`;
        } else {
          instr.innerHTML = canMega
            ? (switchGuides.length > 0 ? `(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>메가4</b> / <b>5</b>, <b>6</b> 교체)` : `(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>메가4</b>)`)
            : (switchGuides.length > 0 ? `(채팅에 <b>1</b>~<b>4</b> 기술 / <b>5</b>, <b>6</b> 교체)` : `(채팅에 <b>1</b>~<b>4</b> 기술 입력)`);
        }
      }

      if (pokeBattleSubMode === 'faction_battle') {
        factionRedVoteUsers.clear();
        factionRedVoteCounts = {};
        factionBlueVoteUsers.clear();
        factionBlueVoteCounts = {};

        setBattleDialogue(`⚔️ <b>Round ${pokeBattleState.round}</b>: 🔴 ${factionTeamNames.red}와 🔵 ${factionTeamNames.blue}가 행동을 동시에 선택합니다! (실시간 채팅 투표)`);

        const casterStatus = document.getElementById('casterMatchStatusText');
        if (casterStatus) {
          casterStatus.innerText = `Round ${pokeBattleState.round}: 🔴 ${factionTeamNames.red} (${factionRedMembers.length}명) vs 🔵 ${factionTeamNames.blue} (${factionBlueMembers.length}명) - 턴 투표 진행 중`;
        }

        renderFactionVotingBarsUI('red');
        renderFactionVotingBarsUI('blue');
      } else {
        renderPokeVotingBarsUI();
      }

      // Unified Single Turn Countdown Timer
      pokeBattleState.turnTimerTotal = parseFloat(document.getElementById('pokeVoteDurationSelect')?.value || document.getElementById('drawerPokeVoteDurationSelect')?.value || 30.0) || 30.0;
      pokeBattleState.turnTimerRemaining = pokeBattleState.turnTimerTotal;
      pokeBattleState.viewersTimerTotal = pokeBattleState.turnTimerTotal;
      pokeBattleState.viewersTimerRemaining = pokeBattleState.turnTimerTotal;
      renderPokeTurnTimerUI();

      clearInterval(pokeBattleState.turnTimerInterval);
      clearInterval(pokeBattleState.viewersTimerInterval);
      clearInterval(pokeBattleState.streamerTimerInterval);

      const stepMs = 100;
      pokeBattleState.turnTimerInterval = setInterval(() => {
        pokeBattleState.turnTimerRemaining -= (stepMs / 1000);
        pokeBattleState.viewersTimerRemaining = pokeBattleState.turnTimerRemaining;
        if (pokeBattleState.turnTimerRemaining <= 0) {
          pokeBattleState.turnTimerRemaining = 0;
          pokeBattleState.viewersTimerRemaining = 0;
          clearInterval(pokeBattleState.turnTimerInterval);
          finishSimultaneousPokeTurn();
        }
        renderPokeTurnTimerUI();
      }, stepMs);
    }

    // Alias for backwards compatibility
    function startStreamerPokeTurn() {
      startSimultaneousPokeTurn();
    }
    function startViewersPokeVote() {
      // In simultaneous mode, viewers vote is initiated inside startSimultaneousPokeTurn
    }

    function renderStreamerMovesDeck() {
      const sSlot = streamerTeam[streamerActiveIdx];
      const megaForm = getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);
      const megaContainer = document.getElementById('streamerMegaToggleContainer');
      const megaBtnTitle = document.getElementById('streamerMegaBtnTitle');
      const megaBtn = document.getElementById('streamerMegaToggleBtn');
      const megaPill = document.getElementById('streamerMegaPill');

      if (megaForm && !streamerTeamHasMegaEvolved && !sSlot.isMega) {
        if (megaContainer) megaContainer.style.display = 'block';
        if (megaBtnTitle) megaBtnTitle.innerHTML = `<kbd style="background: rgba(0,255,163,0.2); border: 1px solid rgba(0,255,163,0.4); border-radius: 4px; padding: 1px 5px; font-size: 10px; margin-right: 4px; font-family: monospace; color: #00ffa3;">Space</kbd> 🧬 ${megaForm.nameKo} 메가진화 (동시 발동)`;
        if (megaBtn) megaBtn.classList.toggle('active', streamerMegaSelected);
        if (megaPill) {
          megaPill.className = `mega-pill-badge ${streamerMegaSelected ? 'on' : 'off'}`;
          megaPill.innerText = streamerMegaSelected ? '🧬 MEGA ON' : 'OFF';
        }
      } else {
        if (megaContainer) megaContainer.style.display = 'none';
        streamerMegaSelected = false;
      }

      // Check if all moves have 0 PP
      const allOutOfPP = sSlot.movesPP && sSlot.movesPP.length > 0 && sSlot.movesPP.every(x => x.currentPP <= 0);

      const deck = document.getElementById('arenaMoveButtonsDeck');
      if (deck) {
        if (allOutOfPP) {
          const isStruggleSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.move && pokeBattleState.streamerAction.move.name === '발버둥';
          deck.innerHTML = `
            <button type="button" class="poke-move-btn ${isStruggleSelected ? 'selected' : ''}" onclick="handleStreamerStruggleSelect()" style="grid-column: 1 / -1; border: 2px solid #ef4444; background: rgba(239,68,68,0.15); padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 900; font-size: 14px; color: #ef4444;"><kbd style="background: rgba(239,68,68,0.25); border: 1px solid #ef4444; border-radius: 4px; padding: 1px 5px; font-size: 10px; margin-right: 4px; font-family: monospace; color: #fff;">X</kbd> 💥 발버둥 (Struggle) ${isStruggleSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; font-weight: normal; margin-left: 2px;">(다시 클릭 시 취소)</span>' : ''}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-sub); margin-top: 4px;">
                <span>위력 50 (노말) / 명중 100%</span>
                <span style="color: #f87171; font-weight: 700;">⚠️ 최대 HP의 25% 반동 피해</span>
              </div>
            </button>
          `;
          return;
        }

        const keyShortcuts = ['Q', 'W', 'E', 'R'];
        deck.innerHTML = sSlot.pokemon.moves.map((m, i) => {
          const ppObj = sSlot.movesPP ? sSlot.movesPP[i] : null;
          const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
          const maxPP = ppObj ? ppObj.maxPP : (m.pp || 15);
          const isOutOfPP = currentPP <= 0;

          const isChoiceLocked = sSlot.choiceMove && sSlot.choiceMove.name !== m.name;
          const isAssaultVestBlocked = sSlot.item === 'assault_vest' && m.category === '변화';
          const isBanned = (sSlot.pokemon.name === '왕구리' && m.name === '막치기') || (sSlot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          const disabled = isChoiceLocked || isAssaultVestBlocked || isOutOfPP || isBanned;
          const isSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'move' && pokeBattleState.streamerAction.moveIdx === i;

          let ppColor = '#ffd700';
          if (currentPP <= 0) ppColor = '#ef4444';
          else if (currentPP <= 3) ppColor = '#f97316';
          else if (currentPP === maxPP) ppColor = '#4ade80';

          return `
            <button type="button" class="poke-move-btn ${isSelected ? 'selected' : ''}" ${disabled ? 'disabled' : ''} onclick="handleStreamerMoveSelect(${i})" style="${isOutOfPP || isBanned ? 'opacity: 0.45; border-color: rgba(239,68,68,0.3);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 800; font-size: 13px; color: ${isSelected ? '#00ffa3' : (isOutOfPP || isBanned ? '#94a3b8' : '#fff')};">
                  <kbd style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 4px; padding: 1px 5px; font-size: 10px; margin-right: 4px; font-family: monospace; color: #ffd700;">${keyShortcuts[i] || (i+1)}</kbd>
                  ${i+1}. ${m.name} ${isSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; font-weight: normal; margin-left: 2px;">(다시 클릭 시 취소)</span>' : ''}
                </span>
                <div style="display: flex; gap: 4px; align-items: center;">
                  <span class="type-badge type-${m.type}" style="font-size: 9px; padding: 1px 4px;">${m.type}</span>
                  <span style="font-size: 10px; font-weight: 800; color: ${ppColor}; background: rgba(0,0,0,0.4); padding: 1px 5px; border-radius: 4px;">PP ${currentPP}/${maxPP}</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-sub); margin-top: 2px;">
                <span>${m.category === '변화' ? '🛡️ 랭크업/상태' : `위력 ${m.power} / 명중 ${m.acc}%`}</span>
                <span>${isOutOfPP ? '<b style="color: #ef4444;">PP 0 소진</b>' : (isBanned ? '<b style="color: #ef4444;">🚫 M-C 규정 금지</b>' : '')}</span>
              </div>
              ${isChoiceLocked ? '<div style="font-size: 9px; color: #f43f5e;">구애도구로 기술 고정됨</div>' : ''}
              ${isAssaultVestBlocked ? '<div style="font-size: 9px; color: #f43f5e;">돌격조끼로 변화기 불가</div>' : ''}
              ${isBanned ? '<div style="font-size: 9px; color: #ef4444; font-weight: 800;">🚫 포챔스 레귤레이션 M-C 사용 금지 기술</div>' : ''}
            </button>
          `;
        }).join('');
      }
    }

    function cancelStreamerAction() {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;
      if (!pokeBattleState.streamerAction) return;

      pokeBattleState.streamerAction = null;
      renderStreamerMovesDeck();
      renderStreamerSwitchDeck();
      updateStreamerActionStatusUI(false);
      showToast(`👑 ${getStreamerName()} 행동 선택 취소됨`, '↩️');
      updateStreamerControllerPopout();
    }

    function handleStreamerStruggleSelect() {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;

      // Toggle cancellation if already selected struggle
      if (pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'move' && pokeBattleState.streamerAction.move && pokeBattleState.streamerAction.move.name === '발버둥') {
        cancelStreamerAction();
        return;
      }

      const struggleMove = { name: '발버둥', type: '노말', category: '물리', power: 50, acc: 100, isStruggle: true };
      pokeBattleState.streamerAction = { type: 'move', moveIdx: -1, move: struggleMove, isMega: false };
      renderStreamerMovesDeck();
      renderStreamerSwitchDeck();
      updateStreamerActionStatusUI(false);
      showToast(`👑 ${getStreamerName()} [발버둥] 선택 완료! 🔒 (다시 클릭시 취소)`, '💥');
      updateStreamerControllerPopout();
    }

    function updateStreamerControllerTimer() {
      if (!streamerControllerWindow || streamerControllerWindow.closed) return;
      try {
        const doc = streamerControllerWindow.document;
        if (!doc) return;
        const isFaintPhase = pokeBattleState.phase === 'faint_switch_streamer';
        const tText = doc.getElementById('popTimerText');
        const tFill = doc.getElementById('popTimerFill');
        if (isFaintPhase) {
          if (tText) tText.innerText = `${Math.max(0, pokeBattleState.faintTimerRemaining || 0).toFixed(1)}s`;
          if (tFill) {
            const pct = ((pokeBattleState.faintTimerRemaining || 0) / (pokeBattleState.faintTimerTotal || 30)) * 100;
            tFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
          }
        } else {
          if (tText) tText.innerText = `${Math.max(0, pokeBattleState.turnTimerRemaining || 0).toFixed(1)}s`;
          if (tFill) {
            const pct = ((pokeBattleState.turnTimerRemaining || 0) / (pokeBattleState.turnTimerTotal || 30)) * 100;
            tFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
          }
        }
      } catch (err) {}
    }

    function renderPokeTurnTimerUI() {
      const tText = document.getElementById('arenaVotingTimerText');
      const tFill = document.getElementById('arenaVotingTimerFill');
      if (tText) tText.innerText = `${Math.max(0, pokeBattleState.turnTimerRemaining).toFixed(1)}s`;
      if (tFill) {
        const pct = (Math.max(0, pokeBattleState.turnTimerRemaining) / pokeBattleState.turnTimerTotal) * 100;
        tFill.style.width = `${pct}%`;
      }
      updateStreamerControllerTimer();
    }

    function renderViewersVotingTimer() {
      renderPokeTurnTimerUI();
    }
    function renderStreamerTimerUI() {
      renderPokeTurnTimerUI();
    }

    function handleStreamerMoveSelect(moveIdx) {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;

      // Toggle cancellation if already selected this move
      if (pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'move' && pokeBattleState.streamerAction.moveIdx === moveIdx) {
        cancelStreamerAction();
        return;
      }

      const sSlot = streamerTeam[streamerActiveIdx];
      const ppObj = sSlot.movesPP ? sSlot.movesPP[moveIdx] : null;
      if (ppObj && ppObj.currentPP <= 0) {
        showToast(`⚠️ [${ppObj.name}]은(는) PP가 소진되어 사용할 수 없습니다!`, '⚠️');
        return;
      }
      const move = sSlot.pokemon.moves[moveIdx];
      if ((sSlot.pokemon.name === '왕구리' && move.name === '막치기') || (sSlot.pokemon.name === '브리두라스' && (move.name === '미러코트' || move.name === '메탈버스트'))) {
        showToast(`🚫 [${move.name}]은(는) 포챔스 레귤레이션 M-C 규정상 사용이 금지되어 있습니다.`, '🚫');
        return;
      }
      const willMega = streamerMegaSelected && !streamerTeamHasMegaEvolved && getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);

      pokeBattleState.streamerAction = { type: 'move', moveIdx, move, isMega: !!willMega };

      renderStreamerMovesDeck();
      renderStreamerSwitchDeck();
      updateStreamerActionStatusUI(false);

      showToast(`👑 ${getStreamerName()} 행동 선택 완료! 🔒 (다시 클릭시 취소)`, '🎯');
      updateStreamerControllerPopout();
    }

    function handleStreamerSwitchSelect(targetIdx) {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;
      if (streamerTeam[targetIdx].fainted) return;

      // Toggle cancellation if already selected this switch
      if (pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'switch' && pokeBattleState.streamerAction.targetIdx === targetIdx) {
        cancelStreamerAction();
        return;
      }

      pokeBattleState.streamerAction = { type: 'switch', targetIdx, targetPokemon: streamerTeam[targetIdx].pokemon, isMega: false };

      renderStreamerMovesDeck();
      renderStreamerSwitchDeck();
      updateStreamerActionStatusUI(false);

      showToast(`👑 ${getStreamerName()} 교체 결정 완료! 🔒 (다시 클릭시 취소)`, '🔄');
      updateStreamerControllerPopout();
    }

    // --- Streamer Privacy Mode & Keyboard Shortcuts Engine ---
    let streamerPrivacyBlind = false;
    let streamerControllerWindow = null;

    function handleStreamerShortcutSwitch(candidateOffset) {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'streamer_turn') return;
      if (pokeBattleMode === '1v1') {
        showToast('1v1 에이스 배틀은 교체가 지원되지 않습니다.', '⚠️');
        return;
      }
      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
      const candidates = [];
      for (let i = 0; i < teamSize; i++) {
        if (i !== streamerActiveIdx) candidates.push(i);
      }
      if (candidateOffset >= candidates.length) return;
      const targetIdx = candidates[candidateOffset];
      if (streamerTeam[targetIdx].fainted || streamerTeam[targetIdx].currentHP <= 0) {
        showToast(`⚠️ [${streamerTeam[targetIdx].pokemon.name}]은(는) 기절하여 교체할 수 없습니다!`, '⚠️');
        return;
      }
      handleStreamerSwitchSelect(targetIdx);
    }

    let streamerFaintAliveSlots = [];

    function handleStreamerShortcutFaint(candidateOffset) {
      if (pokeBattleState.phase !== 'faint_switch_streamer') return;
      let alive = streamerFaintAliveSlots;
      if (!alive || alive.length === 0) {
        const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
        alive = [];
        for (let i = 0; i < teamSize; i++) {
          if (!streamerTeam[i].fainted && streamerTeam[i].currentHP > 0) {
            alive.push(i);
          }
        }
      }
      if (candidateOffset >= alive.length) return;
      handleStreamerFaintSelect(alive[candidateOffset]);
    }

    function handleBattleGlobalKeydown(e) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT' || activeEl.isContentEditable)) {
        return;
      }

      if (!pokeBattleState.active) return;

      if (pokeBattleState.phase === 'simultaneous_turn' || pokeBattleState.phase === 'streamer_turn') {
        if (e.code === 'Escape' || e.code === 'Backspace') {
          e.preventDefault();
          cancelStreamerAction();
        } else if (e.code === 'KeyQ') {
          e.preventDefault();
          handleStreamerMoveSelect(0);
        } else if (e.code === 'KeyW') {
          e.preventDefault();
          handleStreamerMoveSelect(1);
        } else if (e.code === 'KeyE') {
          e.preventDefault();
          handleStreamerMoveSelect(2);
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          handleStreamerMoveSelect(3);
        } else if (e.code === 'Space' || e.code === 'KeyM') {
          e.preventDefault();
          toggleStreamerMega();
        } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          handleStreamerShortcutSwitch(0);
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          handleStreamerShortcutSwitch(1);
        } else if (e.code === 'KeyB') {
          e.preventDefault();
          toggleStreamerPrivacyBlind();
        } else if (e.code === 'KeyO') {
          e.preventDefault();
          openStreamerControllerPopout();
        } else if (e.code === 'KeyX') {
          const sSlot = streamerTeam[streamerActiveIdx];
          const allOutOfPP = sSlot.movesPP && sSlot.movesPP.length > 0 && sSlot.movesPP.every(x => x.currentPP <= 0);
          if (allOutOfPP) {
            e.preventDefault();
            handleStreamerStruggleSelect();
          }
        }
      } else if (pokeBattleState.phase === 'faint_switch_streamer') {
        if (e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'KeyQ') {
          e.preventDefault();
          handleStreamerShortcutFaint(0);
        } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.code === 'KeyW') {
          e.preventDefault();
          handleStreamerShortcutFaint(1);
        }
      }
    }
    window.addEventListener('keydown', handleBattleGlobalKeydown);

    function toggleStreamerPrivacyBlind() {
      streamerPrivacyBlind = !streamerPrivacyBlind;

      const icon = document.getElementById('streamerBlindIcon');
      const label = document.getElementById('streamerBlindLabel');
      const btn = document.getElementById('streamerBlindToggleBtn');
      const blindDeck = document.getElementById('streamerPrivacyBlindDeck');
      const tabsBar = document.getElementById('streamerActionTabsBar');
      const megaContainer = document.getElementById('streamerMegaToggleContainer');
      const movesDeck = document.getElementById('arenaMoveButtonsDeck');
      const switchDeck = document.getElementById('arenaSwitchButtonsDeck');

      if (streamerPrivacyBlind) {
        if (icon) icon.innerText = '🔒';
        if (label) label.innerText = '방송 블라인드 ON';
        if (btn) {
          btn.style.background = 'rgba(0, 255, 163, 0.2)';
          btn.style.borderColor = '#00ffa3';
          btn.style.color = '#00ffa3';
          btn.classList.add('active');
        }
        if (blindDeck) blindDeck.style.display = 'block';
        if (tabsBar) tabsBar.style.display = 'none';
        if (megaContainer) megaContainer.style.display = 'none';
        if (movesDeck) movesDeck.style.display = 'none';
        if (switchDeck) switchDeck.style.display = 'none';
        showToast('🔒 방송 화면 블라인드가 활성화되었습니다. (단축키/제어창으로 안전 조작)', '🛡️');
      } else {
        if (icon) icon.innerText = '👁️';
        if (label) label.innerText = '방송 블라인드 OFF';
        if (btn) {
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
          btn.classList.remove('active');
        }
        if (blindDeck) blindDeck.style.display = 'none';
        if (tabsBar) tabsBar.style.display = 'flex';
        switchPokeActionTab(streamerActionTab);
        showToast('👁️ 방송 화면 블라인드가 해제되었습니다.', '👀');
      }

      updateStreamerControllerPopout();
    }

    function openStreamerControllerPopout() {
      // Auto-enable privacy blind on main broadcast screen when popout is opened
      if (!streamerPrivacyBlind) {
        toggleStreamerPrivacyBlind();
      }

      if (streamerControllerWindow && !streamerControllerWindow.closed) {
        streamerControllerWindow.focus();
        updateStreamerControllerPopout();
        return;
      }

      const width = 460;
      const height = 640;
      const left = window.screen.width ? (window.screen.width - width - 30) : 100;
      const top = 50;

      try {
        streamerControllerWindow = window.open('', 'StreamerPokemonController', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
      } catch (err) {
        console.error('Popout window open error:', err);
      }

      if (!streamerControllerWindow) {
        showToast('⚠️ 팝업 차단이 감지되었습니다. 브라우저 주소창의 팝업 허용 설정을 확인해주세요.', '⚠️');
        return;
      }

      const doc = streamerControllerWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>🎮 포켓몬 배틀 - 스트리머 비밀 제어기</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif; }
    body { background: #080c14; color: #f8fafc; padding: 12px; user-select: none; font-size: 13px; line-height: 1.4; }
    .header-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; }
    .title { font-weight: 900; font-size: 14px; color: #ffd700; display: flex; align-items: center; gap: 6px; }
    .timer-wrap { display: flex; align-items: center; gap: 8px; }
    .timer-text { font-weight: 900; color: #00ffa3; font-family: monospace; font-size: 14px; }
    .progress-bar { width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
    .progress-fill { height: 100%; width: 100%; background: linear-gradient(90deg, #38bdf8, #00ffa3); transition: width 0.1s linear; }
    
    .card { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px; margin-bottom: 8px; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
    .kbd { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 3px; padding: 1px 4px; font-size: 10px; color: #ffd700; font-family: monospace; }
    
    .active-poke-row { display: flex; align-items: center; gap: 10px; }
    .poke-img { width: 56px; height: 56px; object-fit: contain; image-rendering: pixelated; }
    .hp-bar-track { width: 100%; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .hp-bar-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); transition: width 0.3s ease; }
    
    .status-alert { background: rgba(255, 215, 0, 0.1); border: 1px dashed rgba(255, 215, 0, 0.4); border-radius: 8px; padding: 6px 10px; font-size: 11px; color: #ffd700; text-align: center; font-weight: 800; margin-bottom: 8px; }
    .status-alert.selected { background: rgba(0, 255, 163, 0.15); border: 1px solid #00ffa3; color: #00ffa3; }

    .mega-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(168, 85, 247, 0.15); border: 1.5px solid rgba(168, 85, 247, 0.5); border-radius: 8px; cursor: pointer; color: #fff; margin-bottom: 8px; font-weight: 800; font-size: 12px; transition: all 0.2s; }
    .mega-btn:hover { background: rgba(168, 85, 247, 0.25); transform: translateY(-1px); }
    .mega-btn.active { background: linear-gradient(135deg, rgba(236,72,153,0.35), rgba(168,85,247,0.35)); border-color: #ec4899; box-shadow: 0 0 12px rgba(236,72,153,0.4); color: #00ffa3; }

    .moves-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
    .move-btn { background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px 10px; cursor: pointer; text-align: left; color: #fff; transition: all 0.15s; display: flex; flex-direction: column; gap: 3px; position: relative; }
    .move-btn * { pointer-events: none; }
    .move-btn:hover:not(:disabled) { transform: translateY(-2px); border-color: #00ffa3; background: rgba(0, 255, 163, 0.12); }
    .move-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .move-btn.selected { border: 2px solid #00ffa3 !important; background: rgba(0, 255, 163, 0.2) !important; box-shadow: 0 0 12px rgba(0, 255, 163, 0.4) !important; }

    .switch-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
    .switch-card { display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 10px; cursor: pointer; transition: all 0.15s; }
    .switch-card * { pointer-events: none; }
    .switch-card:hover:not(.disabled) { border-color: #38bdf8; background: rgba(56, 189, 248, 0.12); }
    .switch-card.selected { border: 1.5px solid #38bdf8 !important; background: rgba(56, 189, 248, 0.2) !important; box-shadow: 0 0 10px rgba(56, 189, 248, 0.3); }
    .switch-card.disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-cancel { background: rgba(239, 68, 68, 0.25); border: 1px solid #ef4444; color: #fca5a5; border-radius: 6px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: 800; transition: all 0.15s; }
    .btn-cancel:hover { background: rgba(239, 68, 68, 0.45); color: #fff; }

    .quick-tools { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 6px; }
    .btn-small { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 8px; color: #cbd5e1; font-size: 11px; cursor: pointer; font-weight: 700; }
    .btn-small:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .btn-small.active { background: rgba(0,255,163,0.2); border-color: #00ffa3; color: #00ffa3; }

    .type-badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: 800; display: inline-block; color: #fff; }
    .type-노말 { background: #9fa19f; } .type-불꽃 { background: #e62829; } .type-물 { background: #2980ef; }
    .type-풀 { background: #3fa129; } .type-전기 { background: #fac000; color: #000; } .type-얼음 { background: #3dcef3; color: #000; }
    .type-격투 { background: #ff8000; } .type-독 { background: #9141cb; } .type-땅 { background: #915121; }
    .type-비행 { background: #81b9ef; } .type-에스퍼 { background: #ef4179; } .type-벌레 { background: #91a119; }
    .type-바위 { background: #afa981; } .type-고스트 { background: #704170; } .type-드래곤 { background: #5060e1; }
    .type-악 { background: #50413f; } .type-강철 { background: #60a1b8; } .type-페어리 { background: #ef70ef; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="title">
      <span>🎮</span> <span id="popTitle">스트리머 비밀 제어기</span>
    </div>
    <div class="timer-wrap">
      <span class="badge" style="background: rgba(255,215,0,0.2); color: #ffd700;" id="popRoundBadge">ROUND 1</span>
      <span class="timer-text" id="popTimerText">30.0s</span>
    </div>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" id="popTimerFill"></div>
  </div>

  <div id="popStatusAlert" class="status-alert">
    행동 선택 대기 중...
  </div>

  <!-- Active Pokemon Summary -->
  <div class="card" id="popActivePokeCard">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <span style="font-size: 11px; font-weight: 800; color: #ffd700;">내 출전 포켓몬</span>
      <span id="popPokeItemBadge" class="badge" style="background: rgba(255,215,0,0.15); color: #ffd700;">🎒 도구</span>
    </div>
    <div class="active-poke-row">
      <img id="popPokeSprite" class="poke-img" src="" alt="포켓몬">
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span id="popPokeName" style="font-size: 14px; font-weight: 900; color: #fff;"></span>
          <span id="popPokeHPText" style="font-size: 12px; font-weight: 800; color: #4ade80;"></span>
        </div>
        <div class="hp-bar-track">
          <div id="popPokeHPBar" class="hp-bar-fill"></div>
        </div>
        <div id="popPokeTypes" style="display: flex; gap: 4px; margin-top: 4px;"></div>
      </div>
    </div>
  </div>

  <!-- Opponent Pokemon Quick Hint -->
  <div class="card" id="popOpponentCard" style="background: rgba(30, 41, 59, 0.5); padding: 6px 10px; margin-bottom: 8px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img id="popOpponentSprite" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated;" src="" alt="상대">
        <div>
          <span style="font-size: 11px; color: #94a3b8;">상대(시청자):</span>
          <b id="popOpponentName" style="color: #38bdf8; font-size: 12px; margin-left: 4px;"></b>
        </div>
      </div>
      <div id="popOpponentTypes" style="display: flex; gap: 3px;"></div>
    </div>
  </div>

  <!-- Mega Evolution Toggle -->
  <div id="popMegaContainer" style="display: none;">
    <button type="button" id="popMegaBtn" class="mega-btn" onclick="triggerMega()">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">🧬</span>
        <span id="popMegaTitle">메가진화 (동시 발동)</span>
      </div>
      <span id="popMegaPill" class="badge" style="background: rgba(255,255,255,0.1); color: #fff;">
        <kbd class="kbd">Space</kbd> OFF
      </span>
    </button>
  </div>

  <!-- 4 Moves Grid -->
  <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 4px; display: flex; justify-content: space-between;">
    <span>⚔️ 기술 선택 (단축키: Q, W, E, R)</span>
    <span id="popChoiceLockedAlert" style="color: #f43f5e; font-size: 10px; display: none;">구애 도구 고정</span>
  </div>
  <div class="moves-grid" id="popMovesGrid">
    <!-- Populated by updateStreamerControllerPopout -->
  </div>

  <!-- Switch Teammates Section -->
  <div id="popSwitchSection" style="margin-top: 4px;">
    <div style="font-size: 11px; font-weight: 800; color: #94a3b8; margin-bottom: 4px;">
      🔄 팀원 교체 (단축키: 1, 2)
    </div>
    <div class="switch-row" id="popSwitchList">
      <!-- Populated by updateStreamerControllerPopout -->
    </div>
  </div>

  <!-- Faint Switch Section (Only when fainted) -->
  <div id="popFaintSection" style="display: none; margin-top: 4px;">
    <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 8px; margin-bottom: 8px; text-align: center;">
      <div style="color: #ef4444; font-weight: 900; font-size: 13px;">💀 출전 포켓몬 기절!</div>
      <div style="font-size: 11px; color: #fca5a5;">다음 출전 포켓몬을 선택하세요 (단축키: 1, 2)</div>
    </div>
    <div class="switch-row" id="popFaintList"></div>
  </div>

  <!-- Bottom Quick Tools -->
  <div class="quick-tools">
    <button type="button" id="popBlindBtn" class="btn-small" onclick="triggerBlind()">
      👁️ 방송 블라인드 <kbd class="kbd">B</kbd>
    </button>
    <div style="font-size: 10px; color: #64748b;">
      ※ 키보드로 제어기 창에서도 즉시 선택 가능
    </div>
  </div>

  <script>
    function triggerMove(i) {
      if (window.opener && !window.opener.closed) {
        window.opener.handleStreamerMoveSelect(i);
      }
    }
    function triggerCancel() {
      if (window.opener && !window.opener.closed) {
        window.opener.cancelStreamerAction();
      }
    }
    function triggerStruggle() {
      if (window.opener && !window.opener.closed) {
        window.opener.handleStreamerStruggleSelect();
      }
    }
    function triggerMega() {
      if (window.opener && !window.opener.closed) {
        window.opener.toggleStreamerMega();
      }
    }
    function triggerSwitch(i) {
      if (window.opener && !window.opener.closed) {
        window.opener.handleStreamerSwitchSelect(i);
      }
    }
    function triggerFaintSelect(i) {
      if (window.opener && !window.opener.closed) {
        window.opener.handleStreamerFaintSelect(i);
      }
    }
    function triggerBlind() {
      if (window.opener && !window.opener.closed) {
        window.opener.toggleStreamerPrivacyBlind();
      }
    }

    window.addEventListener('keydown', (e) => {
      if (window.opener && !window.opener.closed) {
        if (e.code === 'Escape' || e.code === 'Backspace') {
          e.preventDefault();
          window.opener.cancelStreamerAction();
          return;
        }
        window.opener.handleBattleGlobalKeydown(e);
      }
    });
  <\/script>
</body>
</html>`);
      doc.close();

      setTimeout(() => {
        updateStreamerControllerPopout();
      }, 50);
      showToast('🎮 스트리머 독립 제어창이 열렸습니다. 보조 모니터로 이동해 사용하세요!', '🚀');
    }

    function updateStreamerControllerPopout() {
      if (!streamerControllerWindow || streamerControllerWindow.closed) return;

      try {
        const doc = streamerControllerWindow.document;
        if (!doc || !doc.getElementById('popMovesGrid')) return;

        const isFaintPhase = pokeBattleState.phase === 'faint_switch_streamer';

        const rBadge = doc.getElementById('popRoundBadge');
        if (rBadge) rBadge.innerText = `ROUND ${pokeBattleState.round || 1}`;

        const tText = doc.getElementById('popTimerText');
        const tFill = doc.getElementById('popTimerFill');
        if (isFaintPhase) {
          if (tText) tText.innerText = `${Math.max(0, pokeBattleState.faintTimerRemaining || 0).toFixed(1)}s`;
          if (tFill) {
            const pct = ((pokeBattleState.faintTimerRemaining || 0) / (pokeBattleState.faintTimerTotal || 30)) * 100;
            tFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
          }
        } else {
          if (tText) tText.innerText = `${Math.max(0, pokeBattleState.turnTimerRemaining || 0).toFixed(1)}s`;
          if (tFill) {
            const pct = ((pokeBattleState.turnTimerRemaining || 0) / (pokeBattleState.turnTimerTotal || 30)) * 100;
            tFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
          }
        }

        const popBlindBtn = doc.getElementById('popBlindBtn');
        if (popBlindBtn) {
          popBlindBtn.className = `btn-small ${streamerPrivacyBlind ? 'active' : ''}`;
          popBlindBtn.innerHTML = `🔒 방송 블라인드: <b>${streamerPrivacyBlind ? 'ON' : 'OFF'}</b> <kbd class="kbd">B</kbd>`;
        }

        const statusEl = doc.getElementById('popStatusAlert');
        if (statusEl) {
          if (!pokeBattleState.streamerAction) {
            statusEl.className = 'status-alert';
            statusEl.innerHTML = '👑 <b>행동 선택 대기 중...</b> (단축키: Q, W, E, R / 1, 2)';
          } else {
            statusEl.className = 'status-alert selected';
            let actSummary = '';
            if (pokeBattleState.streamerAction.type === 'move') {
              const m = pokeBattleState.streamerAction.move;
              const isMega = pokeBattleState.streamerAction.isMega;
              actSummary = `[${isMega ? '🧬 MEGA ' : ''}${m.name}]`;
            } else if (pokeBattleState.streamerAction.type === 'switch') {
              const tp = pokeBattleState.streamerAction.targetPokemon;
              actSummary = `[${tp.name} 교체]`;
            }
            statusEl.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <div style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  👑 <b>선택 완료</b>: <b style="color: #fff;">${actSummary}</b> 🔒
                </div>
                <button type="button" class="btn-cancel" onclick="triggerCancel()">
                  ✖️ 선택 취소 (Esc)
                </button>
              </div>
            `;
          }
        }

        const sSlot = streamerTeam[streamerActiveIdx];
        const sP = sSlot ? sSlot.pokemon : null;
        const vSlot = viewersTeam[viewersActiveIdx];
        const vP = vSlot ? vSlot.pokemon : null;

        if (sSlot && sP) {
          const sSpr = doc.getElementById('popPokeSprite');
          if (sSpr) sSpr.src = sP.sprite_front || sP.sprite_back;

          const sName = doc.getElementById('popPokeName');
          if (sName) sName.innerHTML = sSlot.isMega ? `<span style="color: #00ffa3;">🧬 MEGA</span> ${sP.name}` : sP.name;

          const sHPText = doc.getElementById('popPokeHPText');
          if (sHPText) sHPText.innerText = `${Math.max(0, Math.round(sSlot.currentHP))} / ${sSlot.maxHP}`;

          const sHPBar = doc.getElementById('popPokeHPBar');
          if (sHPBar) {
            const hpPct = Math.max(0, (sSlot.currentHP / sSlot.maxHP) * 100);
            sHPBar.style.width = `${hpPct}%`;
            sHPBar.style.background = hpPct > 50 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : hpPct > 20 ? 'linear-gradient(90deg, #eab308, #facc15)' : 'linear-gradient(90deg, #ef4444, #f87171)';
          }

          const sTypes = doc.getElementById('popPokeTypes');
          if (sTypes) {
            sTypes.innerHTML = sP.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
          }

          const sItem = getItemObj(sSlot.item);
          const sItemBadge = doc.getElementById('popPokeItemBadge');
          if (sItemBadge) {
            sItemBadge.innerHTML = sSlot.isMega ? '🧬 MEGA' : `${sItem.emoji} ${sItem.name}`;
          }

          if (vSlot && vP) {
            const oSpr = doc.getElementById('popOpponentSprite');
            if (oSpr) oSpr.src = vP.sprite_front;
            const oName = doc.getElementById('popOpponentName');
            if (oName) oName.innerText = vSlot.isMega ? `[MEGA] ${vP.name}` : vP.name;
            const oTypes = doc.getElementById('popOpponentTypes');
            if (oTypes) {
              oTypes.innerHTML = vP.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');
            }
          }

          const megaForm = getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);
          const megaCont = doc.getElementById('popMegaContainer');
          const megaBtn = doc.getElementById('popMegaBtn');
          const megaTitle = doc.getElementById('popMegaTitle');
          const megaPill = doc.getElementById('popMegaPill');

          if (megaForm && !streamerTeamHasMegaEvolved && !sSlot.isMega && !isFaintPhase) {
            if (megaCont) megaCont.style.display = 'block';
            if (megaTitle) megaTitle.innerText = `🧬 ${megaForm.nameKo} 메가진화 (동시 발동)`;
            if (megaBtn) megaBtn.className = `mega-btn ${streamerMegaSelected ? 'active' : ''}`;
            if (megaPill) {
              megaPill.className = `badge ${streamerMegaSelected ? 'active' : ''}`;
              megaPill.style.background = streamerMegaSelected ? 'rgba(0,255,163,0.3)' : 'rgba(255,255,255,0.1)';
              megaPill.style.color = streamerMegaSelected ? '#00ffa3' : '#fff';
              megaPill.innerHTML = `<kbd class="kbd">Space</kbd> ${streamerMegaSelected ? '🧬 MEGA ON' : 'OFF'}`;
            }
          } else {
            if (megaCont) megaCont.style.display = 'none';
          }

          const movesGrid = doc.getElementById('popMovesGrid');
          const choiceAlert = doc.getElementById('popChoiceLockedAlert');
          if (choiceAlert) {
            choiceAlert.style.display = sSlot.choiceMove ? 'inline-block' : 'none';
          }

          const allOutOfPP = sSlot.movesPP && sSlot.movesPP.length > 0 && sSlot.movesPP.every(x => x.currentPP <= 0);
          if (movesGrid) {
            if (allOutOfPP) {
              const isStruggleSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.move && pokeBattleState.streamerAction.move.name === '발버둥';
              movesGrid.innerHTML = `
                <button type="button" class="move-btn ${isStruggleSelected ? 'selected' : ''}" onclick="triggerStruggle()" style="grid-column: 1 / -1; border-color: #ef4444; background: rgba(239,68,68,0.2);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 900; color: #ef4444;"><kbd class="kbd">X</kbd> 💥 발버둥 (Struggle) ${isStruggleSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; margin-left: 2px;">(취소)</span>' : ''}</span>
                    <span class="badge" style="background: #ef4444; color: #fff;">모든 PP 소진</span>
                  </div>
                  <div style="font-size: 11px; color: #fca5a5; margin-top: 3px;">위력 50 / 최대 HP의 25% 반동 피해</div>
                </button>
              `;
            } else {
              const keyShortcuts = ['Q', 'W', 'E', 'R'];
              movesGrid.innerHTML = sSlot.pokemon.moves.map((m, i) => {
                const ppObj = sSlot.movesPP ? sSlot.movesPP[i] : null;
                const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
                const maxPP = ppObj ? ppObj.maxPP : (m.pp || 15);
                const isOutOfPP = currentPP <= 0;

                const isChoiceLocked = sSlot.choiceMove && sSlot.choiceMove.name !== m.name;
                const isAssaultVestBlocked = normalizePokeItemId(sSlot.item) === 'assault_vest' && m.category === '변화';
                const isBanned = (sSlot.pokemon.name === '왕구리' && m.name === '막치기') || (sSlot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
                const disabled = isChoiceLocked || isAssaultVestBlocked || isOutOfPP || isBanned || isFaintPhase;
                const isSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'move' && pokeBattleState.streamerAction.moveIdx === i;

                let effectTag = '';
                if (vP && m.power > 0) {
                  let mult = 1.0;
                  vP.types.forEach(defType => {
                    if (pokeTypeChart[m.type] && pokeTypeChart[m.type][defType] !== undefined) {
                      mult *= pokeTypeChart[m.type][defType];
                    }
                  });
                  if (mult >= 2.0) {
                    effectTag = `<span class="badge" style="background: rgba(239,68,68,0.25); color: #f87171; border: 1px solid #ef4444; font-size: 9px;">${mult}x 효과발군</span>`;
                  } else if (mult > 0 && mult < 1.0) {
                    effectTag = `<span class="badge" style="background: rgba(148,163,184,0.2); color: #94a3b8; font-size: 9px;">${mult}x 반감</span>`;
                  } else if (mult === 0) {
                    effectTag = `<span class="badge" style="background: rgba(100,116,139,0.3); color: #64748b; font-size: 9px;">0x 무효</span>`;
                  }
                }

                let ppColor = '#ffd700';
                if (currentPP <= 0) ppColor = '#ef4444';
                else if (currentPP <= 3) ppColor = '#f97316';
                else if (currentPP === maxPP) ppColor = '#4ade80';

                return `
                  <button type="button" class="move-btn ${isSelected ? 'selected' : ''}" ${disabled ? 'disabled' : ''} onclick="triggerMove(${i})">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 800; color: ${isSelected ? '#00ffa3' : '#fff'}; font-size: 12px;">
                        <kbd class="kbd">${keyShortcuts[i]}</kbd> ${m.name} ${isSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; margin-left: 2px;">(취소)</span>' : ''}
                      </span>
                      <span class="type-badge type-${m.type}">${m.type}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: ${isSelected ? '#86efac' : '#94a3b8'}; margin-top: 2px;">
                      <span>${m.category === '변화' ? '🛡️ 변화' : `위력 ${m.power}`}</span>
                      <span style="color: ${ppColor}; font-weight: 800;">PP ${currentPP}/${maxPP}</span>
                    </div>
                    ${effectTag ? `<div style="margin-top: 2px;">${effectTag}</div>` : ''}
                  </button>
                `;
              }).join('');
            }
          }

          const switchSection = doc.getElementById('popSwitchSection');
          const switchList = doc.getElementById('popSwitchList');
          if (switchSection && switchList) {
            if (pokeBattleMode === '1v1') {
              switchSection.style.display = 'none';
            } else {
              switchSection.style.display = isFaintPhase ? 'none' : 'block';
              const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
              const candidates = [];
              for (let i = 0; i < teamSize; i++) {
                if (i !== streamerActiveIdx) candidates.push({ idx: i, slot: streamerTeam[i] });
              }

              switchList.innerHTML = candidates.map((c, sIdx) => {
                const p = c.slot.pokemon;
                const curHP = Math.max(0, c.slot.currentHP || 0);
                const maxHP = c.slot.maxHP || 1;
                const isFainted = c.slot.fainted || curHP <= 0;
                const isSelected = pokeBattleState.streamerAction && pokeBattleState.streamerAction.type === 'switch' && pokeBattleState.streamerAction.targetIdx === c.idx;
                const shortcutNum = sIdx + 1;

                return `
                  <div class="switch-card ${isFainted ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" onclick="${isFainted ? '' : `triggerSwitch(${c.idx})`}">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <kbd class="kbd">${shortcutNum}</kbd>
                      <img src="${p.sprite_front}" alt="${p.name}" style="width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated;">
                      <div>
                        <div style="font-weight: 800; font-size: 12px; color: ${isSelected ? '#38bdf8' : '#fff'};">${c.idx+1}번. ${p.name} ${isSelected ? '✓ <span style="font-size: 10px; color: #fca5a5; margin-left: 2px;">(취소)</span>' : ''}</div>
                        <div style="display: flex; gap: 3px; margin-top: 1px;">
                          ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
                        </div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-size: 11px; font-weight: 800; color: ${isFainted ? '#ef4444' : '#4ade80'};">${isFainted ? '💀 기절' : `HP ${curHP}/${maxHP}`}</span>
                    </div>
                  </div>
                `;
              }).join('');
            }
          }

          const faintSection = doc.getElementById('popFaintSection');
          const faintList = doc.getElementById('popFaintList');
          if (faintSection && faintList) {
            if (isFaintPhase) {
              faintSection.style.display = 'block';
              const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
              const aliveSlots = [];
              for (let i = 0; i < teamSize; i++) {
                if (!streamerTeam[i].fainted && streamerTeam[i].currentHP > 0) aliveSlots.push(i);
              }
              faintList.innerHTML = aliveSlots.map((idx, fIdx) => {
                const slot = streamerTeam[idx];
                const p = slot.pokemon;
                const shortcutNum = fIdx + 1;
                return `
                  <div class="switch-card" onclick="triggerFaintSelect(${idx})" style="border-color: #ffd700; background: rgba(255,215,0,0.1);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <kbd class="kbd">${shortcutNum}</kbd>
                      <img src="${p.sprite_front}" alt="${p.name}" style="width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated;">
                      <div>
                        <div style="font-weight: 800; font-size: 13px; color: #ffd700;">[${idx+1}번] ${p.name}</div>
                        <div style="display: flex; gap: 3px; margin-top: 2px;">
                          ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button type="button" class="btn-small" style="background: #ffd700; color: #000; font-weight: 900;">⚡ 출전</button>
                    </div>
                  </div>
                `;
              }).join('');
            } else {
              faintSection.style.display = 'none';
            }
          }
        }
      } catch (err) {
        console.error('Error updating streamer popout window:', err);
      }
    }

    function finishSimultaneousPokeTurn() {
      if (pokeBattleState.phase !== 'simultaneous_turn' && pokeBattleState.phase !== 'viewers_vote') return;
      clearInterval(pokeBattleState.turnTimerInterval);
      pokeBattleState.phase = 'turn_revealing';

      if (pokeBattleSubMode === 'faction_battle') {
        const redSlot = streamerTeam[streamerActiveIdx];
        const redAction = resolveFactionTurnAction('red', redSlot);
        pokeBattleState.streamerAction = redAction;

        const blueSlot = viewersTeam[viewersActiveIdx];
        const blueAction = resolveFactionTurnAction('blue', blueSlot);
        pokeBattleState.viewersAction = blueAction;

        renderFactionVotingBarsUI('red', true, redAction.actionKey);
        renderFactionVotingBarsUI('blue', true, blueAction.actionKey);

        const rLabel = redAction.type === 'switch' ? `[교체 ➡️ ${streamerTeam[redAction.targetIdx].pokemon.name}]` : `[${redAction.move.name}]`;
        const bLabel = blueAction.type === 'switch' ? `[교체 ➡️ ${viewersTeam[blueAction.targetIdx].pokemon.name}]` : `[${blueAction.move.name}]`;

        setBattleDialogue(`⚔️ <b>Round ${pokeBattleState.round}</b>: 🔴 ${factionTeamNames.red} <b>${rLabel}</b> vs 🔵 ${factionTeamNames.blue} <b>${bLabel}</b>!`);

        setTimeout(() => {
          executeBattleTurnSequence();
        }, 1200);
        return;
      }

      // 1. Resolve Streamer Action
      const sSlot = streamerTeam[streamerActiveIdx];
      if (!pokeBattleState.streamerAction) {
        const allStreamerOutOfPP = sSlot.movesPP && sSlot.movesPP.length > 0 && sSlot.movesPP.every(x => x.currentPP <= 0);
        if (allStreamerOutOfPP) {
          const struggleMove = { name: '발버둥', type: '노말', category: '물리', power: 50, acc: 100, isStruggle: true };
          pokeBattleState.streamerAction = { type: 'move', moveIdx: -1, move: struggleMove, isMega: false };
          showToast(`⏱️ ${getStreamerName()} 선택 시간 초과! [발버둥] 자동 발동`, '💥');
        } else {
          let validMoveIdx = 0;
          if (sSlot.choiceMove) {
            const idx = sSlot.pokemon.moves.findIndex(m => m.name === sSlot.choiceMove.name);
            if (idx !== -1 && (!sSlot.movesPP || sSlot.movesPP[idx].currentPP > 0)) validMoveIdx = idx;
          } else {
            const available = sSlot.pokemon.moves
              .map((m, idx) => ({ m, idx, pp: sSlot.movesPP ? sSlot.movesPP[idx].currentPP : (m.pp || 15) }))
              .filter(x => {
                const isBanned = (sSlot.pokemon.name === '왕구리' && x.m.name === '막치기') || (sSlot.pokemon.name === '브리두라스' && (x.m.name === '미러코트' || x.m.name === '메탈버스트'));
                return x.pp > 0 && !isBanned && !(normalizePokeItemId(sSlot.item) === 'assault_vest' && x.m.category === '변화');
              });
            if (available.length > 0) {
              validMoveIdx = available[Math.floor(Math.random() * available.length)].idx;
            }
          }
          const move = sSlot.pokemon.moves[validMoveIdx];
          const willMega = streamerMegaSelected && !streamerTeamHasMegaEvolved && getAvailableMegaEvolution(sSlot.pokemon, sSlot.item);
          pokeBattleState.streamerAction = { type: 'move', moveIdx: validMoveIdx, move, isMega: !!willMega };
          showToast(`⏱️ ${getStreamerName()} 선택 시간 초과! [${move.name}] 자동 발동`, '🎲');
        }
      }

      // 2. Resolve Viewers Vote Action
      const vSlot = viewersTeam[viewersActiveIdx];
      const validCandidateKeys = [];
      const vMega = getAvailableMegaEvolution(vSlot.pokemon, vSlot.item);
      const canMega = vMega && !viewersTeamHasMegaEvolved && !vSlot.isMega;

      const allViewersOutOfPP = vSlot.movesPP && vSlot.movesPP.length > 0 && vSlot.movesPP.every(x => x.currentPP <= 0);

      if (allViewersOutOfPP) {
        validCandidateKeys.push('struggle');
      } else {
        vSlot.pokemon.moves.forEach((m, i) => {
          const ppObj = vSlot.movesPP ? vSlot.movesPP[i] : null;
          const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
          const isOutOfPP = currentPP <= 0;

          const isLocked = vSlot.choiceMove && vSlot.choiceMove.name !== m.name;
          const isAV = vSlot.item === 'assault_vest' && m.category === '변화';
          const isBanned = (vSlot.pokemon.name === '왕구리' && m.name === '막치기') || (vSlot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          if (!isLocked && !isAV && !isOutOfPP && !isBanned) {
            validCandidateKeys.push(`move_${i + 1}`);
            if (canMega) validCandidateKeys.push(`mega_${i + 1}`);
          }
        });
      }

      let switchCounter = 5;
      const switchIndexMap = {};
      if (pokeBattleMode === '3v3') {
        for (let i = 0; i < 3; i++) {
          if (i !== viewersActiveIdx) {
            if (!viewersTeam[i].fainted && viewersTeam[i].currentHP > 0) {
              validCandidateKeys.push(`switch_${switchCounter}`);
              switchIndexMap[`switch_${switchCounter}`] = i;
            }
            switchCounter++;
          }
        }
      }

      let maxVotes = 0;
      let topChoices = [];
      for (const key of validCandidateKeys) {
        const v = pokeVoteCounts[key] || 0;
        if (v > maxVotes) {
          maxVotes = v;
          topChoices = [key];
        } else if (v === maxVotes && maxVotes > 0) {
          topChoices.push(key);
        }
      }

      let pickedKey = validCandidateKeys[0] || 'move_1';
      if (maxVotes > 0 && topChoices.length > 0) {
        pickedKey = topChoices[Math.floor(Math.random() * topChoices.length)];
      } else {
        pickedKey = validCandidateKeys[Math.floor(Math.random() * validCandidateKeys.length)] || validCandidateKeys[0] || 'struggle';
      }

      let viewersChoiceName = '';
      if (pickedKey === 'struggle') {
        const struggleMove = { name: '발버둥', type: '노말', category: '물리', power: 50, acc: 100, isStruggle: true };
        pokeBattleState.viewersAction = { type: 'move', moveIdx: -1, move: struggleMove, isMega: false };
        viewersChoiceName = '발버둥';
      } else if (pickedKey.startsWith('move_')) {
        const moveIdx = parseInt(pickedKey.replace('move_', ''), 10) - 1;
        const move = vSlot.pokemon.moves[moveIdx];
        pokeBattleState.viewersAction = { type: 'move', moveIdx, move, isMega: false };
        viewersChoiceName = move.name;
      } else if (pickedKey.startsWith('mega_')) {
        const moveIdx = parseInt(pickedKey.replace('mega_', ''), 10) - 1;
        const move = vSlot.pokemon.moves[moveIdx];
        pokeBattleState.viewersAction = { type: 'move', moveIdx, move, isMega: true };
        viewersChoiceName = `🧬 MEGA ${move.name}`;
      } else if (pickedKey.startsWith('switch_')) {
        const targetIdx = switchIndexMap[pickedKey];
        pokeBattleState.viewersAction = { type: 'switch', targetIdx, targetPokemon: viewersTeam[targetIdx].pokemon, isMega: false };
        viewersChoiceName = `${viewersTeam[targetIdx].pokemon.name} 교체`;
      }

      // 3. Reveal phase: Reveal both streamer's choice and viewers' vote counts
      renderPokeVotingBarsUI(true, pickedKey);
      updateStreamerActionStatusUI(true);

      const sAct = pokeBattleState.streamerAction;
      const sName = sAct.type === 'switch' ? `${sAct.targetPokemon.name} 교체` : `${sAct.isMega ? '🧬 MEGA ' : ''}${sAct.move.name}`;

      setBattleDialogue(`📊 <b>투표 종료 & 공개!</b> 시청자: <b>[${viewersChoiceName}]</b> (👑 당선) vs 스트리머: <b>[${sName}]</b>`);

      // 4. Delay 2.0s so everyone sees the revealed votes before attacking
      setTimeout(() => {
        executeBattleTurnSequence();
      }, 2000);
    }

    function finishViewersPokeVote() {
      finishSimultaneousPokeTurn();
    }

    function handleLivePokeBattleChatVote(nickname, msg, uid, now) {
      if (!pokeBattleState.active) return;

      // Case FACTION BATTLE: Both sides voted by faction viewers!
      if (pokeBattleSubMode === 'faction_battle') {
        if (pokeBattleState.phase === 'simultaneous_turn') {
          let team = factionUserMap.get(uid);
          if (!team) {
            team = handleLatecomerAutoBalance(uid, nickname, msg);
          }
          if (!team) return;

          const slot = team === 'red' ? streamerTeam[streamerActiveIdx] : viewersTeam[viewersActiveIdx];
          const hasMegaEvolved = team === 'red' ? streamerTeamHasMegaEvolved : viewersTeamHasMegaEvolved;
          const megaObj = getAvailableMegaEvolution(slot.pokemon, slot.item);
          const canMega = megaObj && !hasMegaEvolved && !slot.isMega;

          const choiceKey = parseChatVoteChoice(msg, slot, team, canMega);
          if (choiceKey) {
            if (team === 'red') {
              factionRedVoteUsers.set(uid, choiceKey);
              recomputeFactionVotes('red');
              renderFactionVotingBarsUI('red');
              triggerBillboardVoteGlow('red', uid, choiceKey);
            } else {
              factionBlueVoteUsers.set(uid, choiceKey);
              recomputeFactionVotes('blue');
              renderFactionVotingBarsUI('blue');
              triggerBillboardVoteGlow('blue', uid, choiceKey);
            }
          }
          return;
        }

        if (pokeBattleState.phase === 'faint_switch_faction') {
          let team = factionUserMap.get(uid);
          if (!team) {
            team = handleLatecomerAutoBalance(uid, nickname, msg);
          }
          if (team !== factionFaintSide) return;

          const clean = msg.trim().toUpperCase().replace(/\s+/g, '');
          const teamArr = team === 'red' ? streamerTeam : viewersTeam;
          const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
          let choiceSlotIdx = null;

          for (let i = 0; i < teamSize; i++) {
            if (!teamArr[i].fainted && teamArr[i].currentHP > 0) {
              const slotNum = i + 1;
              const pName = teamArr[i].pokemon.name.toUpperCase().replace(/\s+/g, '');
              if (
                clean === String(slotNum) ||
                clean === `${slotNum}번` ||
                clean === `${slotNum}번출전` ||
                clean === `${slotNum}출전` ||
                clean === pName ||
                clean === `출전${pName}`
              ) {
                choiceSlotIdx = i;
                break;
              }
            }
          }

          if (choiceSlotIdx !== null) {
            factionFaintVoteUsers.set(uid, choiceSlotIdx);
            recomputeFactionFaintVotes();
            renderFactionFaintVoteCandidatesUI(factionFaintAliveSlotsCached, false);
            triggerBillboardVoteGlow(team, uid, `${choiceSlotIdx + 1}번`);
          }
          return;
        }
        return;
      }

      // Case A: Normal Turn Viewers Vote (Simultaneous)
      if (pokeBattleState.phase === 'simultaneous_turn' || pokeBattleState.phase === 'viewers_vote') {
        const clean = msg.trim().toUpperCase().replace(/\s+/g, '');
        const vSlot = viewersTeam[viewersActiveIdx];
        const vMega = getAvailableMegaEvolution(vSlot.pokemon, vSlot.item);
        const canMega = vMega && !viewersTeamHasMegaEvolved && !vSlot.isMega;

        let choiceKey = null;

        // Mega Move Detection: "MEGA 1", "메가1", "M1", "진화1", "1MEGA", "1메가", "메가1번", "1번메가", "M1번", etc.
        const megaMatch = clean.match(/^(?:MEGA|메가|진화|M)([1-4])번?$/) || clean.match(/^([1-4])번?(?:MEGA|메가|진화|M)$/);
        if (megaMatch && canMega) {
          const moveNum = parseInt(megaMatch[1], 10);
          choiceKey = `mega_${moveNum}`;
        }
        // Exact numbers 1~4
        else if (/^[1-4]$/.test(clean) || /^[1-4]번$/.test(clean)) {
          const num = parseInt(clean.replace('번', ''), 10);
          choiceKey = `move_${num}`;
        }
        // Exact numbers 5~6 (switch in 3v3)
        else if (pokeBattleMode === '3v3' && (/^[5-6]$/.test(clean) || /^[5-6]번$/.test(clean))) {
          const num = parseInt(clean.replace('번', ''), 10);
          choiceKey = `switch_${num}`;
        }
        // Numeric aliases for mega: 7~10 (3v3) or 5~8 / 7~10 (1v1)
        else if (canMega && (/^[7-9]$/.test(clean) || clean === '10' || /^[7-9]번$/.test(clean) || clean === '10번')) {
          const num = parseInt(clean.replace('번', ''), 10);
          choiceKey = `mega_${num - 6}`;
        }
        else if (canMega && pokeBattleMode !== '3v3' && (/^[5-8]$/.test(clean) || /^[5-8]번$/.test(clean))) {
          const num = parseInt(clean.replace('번', ''), 10);
          choiceKey = `mega_${num - 4}`;
        }

        // Check for 3v3 switch keywords: "교체1", "1번교체", "1번", "교체2", "2번", "교체3", "3번", or Pokemon names
        if (!choiceKey && pokeBattleMode === '3v3') {
          let switchCounter = 5;
          for (let i = 0; i < 3; i++) {
            if (i !== viewersActiveIdx) {
              if (!viewersTeam[i].fainted && viewersTeam[i].currentHP > 0) {
                const slotNum = i + 1; // 1, 2, or 3
                const pName = viewersTeam[i].pokemon.name.toUpperCase().replace(/\s+/g, '');
                if (
                  clean === String(switchCounter) ||
                  clean === `교체${slotNum}` ||
                  clean === `${slotNum}번교체` ||
                  clean === `${slotNum}번` ||
                  clean === `${slotNum}교체` ||
                  clean === `교체${pName}` ||
                  clean === pName
                ) {
                  choiceKey = `switch_${switchCounter}`;
                  break;
                }
              }
              switchCounter++;
            }
          }
        }

        // Reject switch_5 / switch_6 if that bench slot is fainted
        if (choiceKey && choiceKey.startsWith('switch_') && pokeBattleMode === '3v3') {
          let switchCounter = 5;
          let validSwitch = false;
          for (let i = 0; i < 3; i++) {
            if (i !== viewersActiveIdx) {
              if (`switch_${switchCounter}` === choiceKey && !viewersTeam[i].fainted && viewersTeam[i].currentHP > 0) {
                validSwitch = true;
              }
              switchCounter++;
            }
          }
          if (!validSwitch) choiceKey = null;
        }

        // Match move names
        if (!choiceKey) {
          vSlot.pokemon.moves.forEach((m, idx) => {
            const mName = m.name.toUpperCase().replace(/\s+/g, '');
            if (clean === mName) {
              choiceKey = `move_${idx + 1}`;
            } else if (clean === `메가${mName}` && canMega) {
              choiceKey = `mega_${idx + 1}`;
            }
          });
        }

        // Check struggle vote if all moves are out of PP
        const allViewersOutOfPP = vSlot.movesPP && vSlot.movesPP.length > 0 && vSlot.movesPP.every(x => x.currentPP <= 0);
        if (allViewersOutOfPP && (clean === '1' || clean === '발버둥' || clean === 'STRUGGLE' || clean === '1번')) {
          choiceKey = 'struggle';
        }

        // Reject vote if move is out of PP, Choice-locked, Assault-Vest-blocked, or Regulation M-C Banned
        if (choiceKey && (choiceKey.startsWith('move_') || choiceKey.startsWith('mega_'))) {
          const mIdx = parseInt(choiceKey.replace(/^(move_|mega_)/, ''), 10) - 1;
          const m = vSlot.pokemon.moves[mIdx];
          if (!m) {
            choiceKey = null;
          } else {
            const isOutOfPP = vSlot.movesPP && vSlot.movesPP[mIdx] && vSlot.movesPP[mIdx].currentPP <= 0;
            const isLocked = vSlot.choiceMove && vSlot.choiceMove.name !== m.name;
            const isAV = normalizePokeItemId(vSlot.item) === 'assault_vest' && m.category === '변화';
            const isBanned = (vSlot.pokemon.name === '왕구리' && m.name === '막치기') || (vSlot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
            if (isOutOfPP || isLocked || isAV || isBanned) {
              choiceKey = null;
            }
          }
        }

        if (choiceKey) {
          pokeVoteUsers.set(uid, choiceKey);
          recomputePokeVotes();
          renderPokeVotingBarsUI();
        }
        return;
      }

      // Case B: Faint Replacement Viewers Vote
      if (pokeBattleState.phase === 'faint_switch_viewers') {
        const clean = msg.trim().toUpperCase().replace(/\s+/g, '');
        let choiceSlotIdx = null;

        const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
        for (let i = 0; i < teamSize; i++) {
          if (!viewersTeam[i].fainted && viewersTeam[i].currentHP > 0) {
            const slotNum = i + 1;
            const pName = viewersTeam[i].pokemon.name.toUpperCase().replace(/\s+/g, '');
            if (
              clean === String(slotNum) ||
              clean === `${slotNum}번` ||
              clean === `${slotNum}번출전` ||
              clean === `${slotNum}출전` ||
              clean === pName ||
              clean === `출전${pName}`
            ) {
              choiceSlotIdx = i;
              break;
            }
          }
        }

        if (choiceSlotIdx !== null) {
          faintVoteUsers.set(uid, choiceSlotIdx);
          recomputeFaintVotes();
          renderFaintVoteCandidatesUI(faintAliveSlotsCached, false);
        }
      }
    }

    function recomputePokeVotes() {
      pokeVoteCounts = {};
      for (const [uid, choice] of pokeVoteUsers.entries()) {
        pokeVoteCounts[choice] = (pokeVoteCounts[choice] || 0) + 1;
      }
    }

    function renderPokeVotingBarsUI(isReveal = false, winningKey = null) {
      const container = document.getElementById('arenaVoteCandidateBars');
      const vSlot = viewersTeam[viewersActiveIdx];
      if (!container || !vSlot) return;

      const total = pokeVoteUsers.size;
      const candidates = [];
      const vMega = getAvailableMegaEvolution(vSlot.pokemon, vSlot.item);
      const canMega = vMega && !viewersTeamHasMegaEvolved && !vSlot.isMega;
      const allOutOfPP = vSlot.movesPP && vSlot.movesPP.length > 0 && vSlot.movesPP.every(x => x.currentPP <= 0);

      // Update HUD participant counter
      const pBadge = document.getElementById('arenaVoteParticipantsBadge');
      if (pBadge) {
        pBadge.innerHTML = `👥 투표 참여: <b>${total}</b>명`;
      }

      const instrEl = document.getElementById('arenaVoteInstructionText');
      if (instrEl) {
        if (allOutOfPP) {
          instrEl.innerHTML = '(채팅: <b>1</b> 또는 <b>발버둥</b>)';
        } else if (pokeBattleMode === '3v3') {
          if (canMega) {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>4</b> / <b>5</b>,<b>6</b>)';
          } else {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>5</b>,<b>6</b>)';
          }
        } else {
          if (canMega) {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b> / <b>메가1</b>~<b>4</b>)';
          } else {
            instrEl.innerHTML = '(채팅: <b>1</b>~<b>4</b>)';
          }
        }
      }

      if (allOutOfPP) {
        candidates.push({
          key: 'struggle',
          label: '💥 [발버둥] Struggle',
          ppText: '반동 25%',
          subtext: '1 또는 발버둥 (모든 기술 PP 소진)',
          tag: '노말',
          tagClass: 'type-노말',
          disabled: false,
          isStruggle: true
        });
      } else {
        // 4 Moves (and Mega Moves if available)
        vSlot.pokemon.moves.forEach((m, i) => {
          const ppObj = vSlot.movesPP ? vSlot.movesPP[i] : null;
          const currentPP = ppObj ? ppObj.currentPP : (m.pp || 15);
          const maxPP = ppObj ? ppObj.maxPP : (m.pp || 15);
          const isOutOfPP = currentPP <= 0;

          const isLocked = vSlot.choiceMove && vSlot.choiceMove.name !== m.name;
          const isAV = normalizePokeItemId(vSlot.item) === 'assault_vest' && m.category === '변화';
          const isBanned = (vSlot.pokemon.name === '왕구리' && m.name === '막치기') || (vSlot.pokemon.name === '브리두라스' && (m.name === '미러코트' || m.name === '메탈버스트'));
          const disabled = isLocked || isAV || isOutOfPP || isBanned;
          
          let note = '';
          if (isOutOfPP) note = 'PP 0 소진';
          else if (isBanned) note = '규정 금지';
          else if (isLocked) note = '구애 고정';
          else if (isAV) note = '돌격조끼';

          // Standard move option
          candidates.push({
            key: `move_${i + 1}`,
            label: `${i + 1}. ${m.name}`,
            ppText: `PP ${currentPP}/${maxPP}`,
            subtext: isOutOfPP ? 'PP 소진 (사용 불가)' : `${i + 1} 또는 ${m.name}`,
            tag: isOutOfPP ? '소진' : m.type,
            tagClass: isOutOfPP ? 'badge-tag' : `type-${m.type}`,
            disabled: disabled,
            note: note,
            powerAcc: m.category === '변화' ? '변화기' : `위력 ${m.power} / 명중 ${m.acc}%`
          });

          // Mega move option (if available or has votes)
          if (canMega || pokeVoteCounts[`mega_${i + 1}`]) {
            candidates.push({
              key: `mega_${i + 1}`,
              label: `🧬 메가${i + 1}. ${m.name}`,
              ppText: `PP ${currentPP}/${maxPP}`,
              subtext: isOutOfPP ? 'PP 소진 (사용 불가)' : `메가${i + 1} 또는 M${i + 1}`,
              tag: isOutOfPP ? '소진' : '메가',
              tagClass: isOutOfPP ? 'badge-tag' : 'type-드래곤',
              disabled: disabled,
              note: note,
              isMega: true,
              powerAcc: m.category === '변화' ? '변화기' : `위력 ${m.power} / 명중 ${m.acc}%`
            });
          }
        });
      }

      // Switch Candidates (if 3v3 mode)
      if (pokeBattleMode === '3v3') {
        let switchCounter = 5;
        for (let i = 0; i < 3; i++) {
          if (i !== viewersActiveIdx) {
            const slot = viewersTeam[i];
            const slotNum = i + 1;
            const isFainted = slot.fainted || slot.currentHP <= 0;
            candidates.push({
              key: `switch_${switchCounter}`,
              label: `${switchCounter}. [🔄 ${slotNum}번 교체] ${slot.pokemon.name}`,
              ppText: isFainted ? '💀 기절' : `HP ${slot.currentHP}/${slot.maxHP}`,
              subtext: isFainted ? '기절하여 교체 불가' : `${switchCounter} 또는 ${slotNum}번 / ${slot.pokemon.name}`,
              tag: isFainted ? '기절' : `HP ${Math.round((slot.currentHP/slot.maxHP)*100)}%`,
              tagClass: isFainted ? 'badge-tag' : 'type-노말',
              disabled: isFainted,
              targetIdx: i,
              isSwitch: true
            });
            switchCounter++;
          }
        }
      }

      container.innerHTML = candidates.map(c => {
        const count = pokeVoteCounts[c.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isWinning = isReveal && winningKey === c.key && count > 0;
        const cardBorder = isWinning ? '1.5px solid #00ffa3' : (c.disabled ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.08)');
        const cardBg = isWinning ? 'rgba(0, 255, 163, 0.18)' : (c.disabled ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.7)');

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 10px; border-radius: 8px; border: ${cardBorder}; background: ${cardBg}; opacity: ${c.disabled ? '0.45' : '1'}; transition: all 0.2s;">
            <!-- Left: Large Label & High-contrast Chat Guide -->
            <div style="flex: 0 0 200px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-weight: 900; color: ${c.isMega ? '#00ffa3' : (c.disabled ? '#94a3b8' : '#fff')}; font-size: 13.5px; letter-spacing: -0.2px;">${c.label}</span>
                <span class="type-badge ${c.tagClass}" style="font-size: 9px; padding: 1px 5px; font-weight: 800;">${c.tag}</span>
                ${c.ppText ? `<span style="font-size: 9px; color: #ffd700; font-weight: 800; background: rgba(0,0,0,0.4); padding: 1px 4px; border-radius: 4px;">${c.ppText}</span>` : ''}
                ${c.note ? `<span style="font-size: 9px; color: #f87171; font-weight: 800;">[${c.note}]</span>` : ''}
              </div>
              <div style="font-size: 11.5px; color: ${c.disabled ? '#64748b' : '#38bdf8'}; font-weight: 700; margin-top: 2px;">
                💬 채팅: <b>${c.subtext}</b>
              </div>
            </div>

            <!-- Middle: Progress Bar (Blind Mask vs Revealed) -->
            <div style="flex: 1; height: 12px; background: rgba(0,0,0,0.5); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); position: relative;">
              ${!isReveal ? `
                <div style="height: 100%; width: 100%; background: linear-gradient(90deg, rgba(56, 189, 248, 0.08), rgba(0, 255, 163, 0.2), rgba(56, 189, 248, 0.08)); background-size: 200% 100%; animation: votePulse 2s infinite linear; border-radius: 5px;"></div>
              ` : `
                <div style="height: 100%; width: ${pct}%; background: ${isWinning ? 'linear-gradient(90deg, #ffd700, #00ffa3)' : (c.isMega ? 'linear-gradient(90deg, #ec4899, #00ffa3)' : 'linear-gradient(90deg, #38bdf8, #00ffa3)')}; border-radius: 5px; transition: width 0.4s ease-out;"></div>
              `}
            </div>

            <!-- Right: Votes count (Blind vs Revealed) -->
            <div style="flex: 0 0 95px; text-align: right; white-space: nowrap;">
              ${!isReveal ? `
                <span style="font-size: 11px; color: #94a3b8; font-weight: 700; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">🔒 집계 중...</span>
              ` : `
                <span style="font-size: 11.5px; color: ${isWinning ? '#ffd700' : '#cbd5e1'}; font-weight: 900;">${count}표 (${pct}%) ${isWinning ? '👑' : ''}</span>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    // --- Turn Sequence Execution (Switching Priority +6 & Attack Ordering) ---
    async function executeBattleTurnSequence() {
      pokeBattleState.phase = 'executing';
      document.getElementById('arenaViewersVoteHud').style.display = 'none';

      try {
        const sAct = pokeBattleState.streamerAction;
        const vAct = pokeBattleState.viewersAction;

        // 1. Handle Switches First (Priority +6)
        if (sAct.type === 'switch') {
          await executeSwitchAnimation('streamer', sAct.targetIdx);
          if (streamerTeam[streamerActiveIdx].currentHP <= 0 || streamerTeam[streamerActiveIdx].fainted) {
            await handleFaintPhase('streamer');
            return;
          }
        }
        if (vAct.type === 'switch') {
          await executeSwitchAnimation('viewers', vAct.targetIdx);
          if (viewersTeam[viewersActiveIdx].currentHP <= 0 || viewersTeam[viewersActiveIdx].fainted) {
            await handleFaintPhase('viewers');
            return;
          }
        }

        // If both switched, round ends immediately
        if (sAct.type === 'switch' && vAct.type === 'switch') {
          await handleRoundEndEffects();
          return;
        }

        // 2. Authentic Gen 7+ / Champions Rule: Mega Evolution occurs BEFORE moves and immediately updates turn speed!
        const sSlot = streamerTeam[streamerActiveIdx];
        const vSlot = viewersTeam[viewersActiveIdx];
        const sWillMega = sAct.type === 'move' && sAct.isMega && !sSlot.isMega;
        const vWillMega = vAct.type === 'move' && vAct.isMega && !vSlot.isMega;
        if (sWillMega && vWillMega) {
          const preSSpeed = calculateBattleSpeed(sSlot);
          const preVSpeed = calculateBattleSpeed(vSlot);
          const sMegaFirst = preSSpeed > preVSpeed ? true : (preVSpeed > preSSpeed ? false : Math.random() < 0.5);
          if (sMegaFirst) {
            await executeMegaEvolution('streamer');
            await executeMegaEvolution('viewers');
          } else {
            await executeMegaEvolution('viewers');
            await executeMegaEvolution('streamer');
          }
          sAct.isMega = false;
          vAct.isMega = false;
        } else if (sWillMega) {
          await executeMegaEvolution('streamer');
          sAct.isMega = false;
        } else if (vWillMega) {
          await executeMegaEvolution('viewers');
          vAct.isMega = false;
        }

        // 3. Determine Action Order for Attacks (with full priority table & 50:50 Speed Tie)
        if (sAct.type === 'move' && vAct.type === 'move') {
          const sMove = sAct.move;
          const vMove = vAct.move;

          const sPriority = getPokeMovePriority(sMove, sSlot);
          const vPriority = getPokeMovePriority(vMove, vSlot);

          let sSpeed = calculateBattleSpeed(sSlot);
          let vSpeed = calculateBattleSpeed(vSlot);

          let streamerFirst = true;
          if (sPriority > vPriority) streamerFirst = true;
          else if (vPriority > sPriority) streamerFirst = false;
          else if (sSpeed > vSpeed) streamerFirst = true;
          else if (vSpeed > sSpeed) streamerFirst = false;
          else streamerFirst = Math.random() < 0.5; // Fair 50:50 Speed Tie

          const firstActor = streamerFirst ? 'streamer' : 'viewers';
          const secondActor = streamerFirst ? 'viewers' : 'streamer';
          const firstAct = streamerFirst ? sAct : vAct;
          const secondAct = streamerFirst ? vAct : sAct;

          // Attack 1
          const firstFainted = await executeSingleAttack(firstActor, firstAct.move, firstAct.isMega);
          if (firstFainted) {
            const sSlotNow = streamerTeam[streamerActiveIdx];
            const vSlotNow = viewersTeam[viewersActiveIdx];
            if (sSlotNow.currentHP <= 0) {
              await handleFaintPhase('streamer');
              return;
            }
            if (vSlotNow.currentHP <= 0) {
              await handleFaintPhase('viewers');
              return;
            }
          }

          await new Promise(r => setTimeout(r, 1000));

          // Attack 2 (if defender didn't faint)
          const secondFainted = await executeSingleAttack(secondActor, secondAct.move, secondAct.isMega);
          if (secondFainted) {
            const sSlotNow = streamerTeam[streamerActiveIdx];
            const vSlotNow = viewersTeam[viewersActiveIdx];
            if (sSlotNow.currentHP <= 0) {
              await handleFaintPhase('streamer');
              return;
            }
            if (vSlotNow.currentHP <= 0) {
              await handleFaintPhase('viewers');
              return;
            }
          }
        } else if (sAct.type === 'move' && vAct.type === 'switch') {
          const fainted = await executeSingleAttack('streamer', sAct.move, sAct.isMega);
          if (fainted) {
            const sSlotNow = streamerTeam[streamerActiveIdx];
            const vSlotNow = viewersTeam[viewersActiveIdx];
            if (vSlotNow.currentHP <= 0) {
              await handleFaintPhase('viewers');
              return;
            }
            if (sSlotNow.currentHP <= 0) {
              await handleFaintPhase('streamer');
              return;
            }
          }
        } else if (sAct.type === 'switch' && vAct.type === 'move') {
          const fainted = await executeSingleAttack('viewers', vAct.move, vAct.isMega);
          if (fainted) {
            const sSlotNow = streamerTeam[streamerActiveIdx];
            const vSlotNow = viewersTeam[viewersActiveIdx];
            if (sSlotNow.currentHP <= 0) {
              await handleFaintPhase('streamer');
              return;
            }
            if (vSlotNow.currentHP <= 0) {
              await handleFaintPhase('viewers');
              return;
            }
          }
        }

        await handleRoundEndEffects();
      } catch (seqErr) {
        console.error('Unexpected error in executeBattleTurnSequence:', seqErr);
        const sSlotNow = streamerTeam[streamerActiveIdx];
        const vSlotNow = viewersTeam[viewersActiveIdx];
        if (sSlotNow.currentHP <= 0) {
          sSlotNow.fainted = true;
          await handleFaintPhase('streamer');
          return;
        }
        if (vSlotNow.currentHP <= 0) {
          vSlotNow.fainted = true;
          await handleFaintPhase('viewers');
          return;
        }
        await handleRoundEndEffects();
      }
    }

    async function executeMegaEvolution(actor) {
      const isStreamer = actor === 'streamer';
      const team = isStreamer ? streamerTeam : viewersTeam;
      const activeIdx = isStreamer ? streamerActiveIdx : viewersActiveIdx;
      const slot = team[activeIdx];
      slot.pokemon = JSON.parse(JSON.stringify(slot.pokemon));
      const poke = slot.pokemon;
      const megaForm = getAvailableMegaEvolution(poke, slot.item);
      if (!megaForm) return;

      const teamName = isStreamer ? getStreamerName() : '시청자 연합';
      const stoneObj = getItemObj(slot.item);

      if (isStreamer) streamerTeamHasMegaEvolved = true;
      else viewersTeamHasMegaEvolved = true;
      slot.isMega = true;

      // Arena Flash & Aura
      const stage = document.getElementById('pokeBattleArenaStage');
      if (stage) {
        stage.classList.add('mega-flash');
        setTimeout(() => stage.classList.remove('mega-flash'), 900);
      }

      setBattleDialogue(`🧬 <b>[${teamName}]</b>의 <b>${poke.name}</b>의 <b>[${stoneObj.name}]</b>이(가) 트레이너의 마음에 반응했다!<br>✨ <b>${megaForm.nameKo}</b>(으)로 <b>메가진화(MEGA EVOLUTION)</b>!`);

      // Animate sprite
      const spr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      if (spr) {
        spr.style.filter = 'brightness(3) drop-shadow(0 0 25px #00ffa3)';
        spr.style.transform = 'scale(1.25)';
        setTimeout(() => {
          spr.src = isStreamer ? (megaForm.backSprite || megaForm.frontSprite) : megaForm.frontSprite;
          spr.style.filter = 'none';
          spr.style.transform = 'scale(1)';
        }, 450);
      }

      // Update Poke stats and types
      const oldMaxHP = slot.maxHP;
      poke.name = megaForm.nameKo;
      poke.types = megaForm.types;
      poke.stats = megaForm.stats;
      poke.abilities = megaForm.abilities || [];
      poke.sprite_front = megaForm.frontSprite;
      poke.sprite_back = megaForm.backSprite;

      const newMaxHP = calculateLevel50HP(megaForm.stats.hp || 80);
      const hpDiff = newMaxHP - oldMaxHP;
      slot.maxHP = newMaxHP;
      slot.currentHP = Math.min(slot.maxHP, slot.currentHP + Math.max(0, hpDiff));

      updateArenaActivePokemonUI();
      updateArenaHPBars();

      const itemBadge = document.getElementById(isStreamer ? 'arenaStreamerItemBadge' : 'arenaViewersItemBadge');
      if (itemBadge) {
        itemBadge.innerHTML = `<span class="mega-tag-badge">🧬 MEGA</span> ${stoneObj.name}`;
      }

      await new Promise(r => setTimeout(r, 1300));
    }

    async function executeSwitchAnimation(side, targetIdx) {
      if (side === 'streamer') {
        resetSlotOnSwitchOut(streamerTeam[streamerActiveIdx]);
        streamerActiveIdx = targetIdx;
        const sSlot = streamerTeam[targetIdx];
        const sP = sSlot.pokemon;
        setBattleDialogue(`👑 <b>[${getStreamerName()}]</b>은(는) <b>[${sP.name}]</b>(으)로 교체했다!`);
        updateArenaActivePokemonUI();
        renderArenaTeamBallsHUD();
        updateArenaHPBars();
        const spr = document.getElementById('arenaStreamerSprite');
        if (spr) {
          spr.style.transform = 'scale(0.5)';
          setTimeout(() => { spr.style.transform = 'scale(1)'; }, 300);
        }
        // Stealth rock check (Heavy-Duty Boots negates entry hazards)
        if (pokeBattleState.streamerStealthRock && sSlot.currentHP > 0 && normalizePokeItemId(sSlot.item) !== 'heavy_duty_boots') {
          let rockMult = 1.0;
          sP.types.forEach(t => {
            if (pokeTypeChart['바위'] && pokeTypeChart['바위'][t] !== undefined) rockMult *= pokeTypeChart['바위'][t];
          });
          const rockDmg = Math.max(1, Math.floor(sSlot.maxHP * 0.125 * rockMult));
          sSlot.currentHP = Math.max(0, sSlot.currentHP - rockDmg);
          updateArenaHPBars();
          setBattleDialogue(`🪨 날카로운 바위(스텔스록)가 <b>[${sP.name}]</b>에게 꽂혔다! (-${rockDmg})`);
          await new Promise(r => setTimeout(r, 800));
          if (sSlot.currentHP <= 0) {
            sSlot.fainted = true;
            renderArenaTeamBallsHUD();
            setBattleDialogue(`💀 <b>[${sP.name}]</b>은(는) 스텔스록 데미지로 쓰러졌다!`);
            await new Promise(r => setTimeout(r, 800));
          }
        }
      } else {
        resetSlotOnSwitchOut(viewersTeam[viewersActiveIdx]);
        viewersActiveIdx = targetIdx;
        const vSlot = viewersTeam[targetIdx];
        const vP = vSlot.pokemon;
        setBattleDialogue(`👥 <b>시청자 연합</b>은 <b>[${vP.name}]</b>(으)로 교체했다!`);
        updateArenaActivePokemonUI();
        renderArenaTeamBallsHUD();
        updateArenaHPBars();
        const spr = document.getElementById('arenaViewersSprite');
        if (spr) {
          spr.style.transform = 'scale(0.5)';
          setTimeout(() => spr.style.transform = 'scale(1)', 300);
        }
        // Stealth rock check (Heavy-Duty Boots negates entry hazards)
        if (pokeBattleState.viewersStealthRock && vSlot.currentHP > 0 && normalizePokeItemId(vSlot.item) !== 'heavy_duty_boots') {
          let rockMult = 1.0;
          vP.types.forEach(t => {
            if (pokeTypeChart['바위'] && pokeTypeChart['바위'][t] !== undefined) rockMult *= pokeTypeChart['바위'][t];
          });
          const rockDmg = Math.max(1, Math.floor(vSlot.maxHP * 0.125 * rockMult));
          vSlot.currentHP = Math.max(0, vSlot.currentHP - rockDmg);
          updateArenaHPBars();
          setBattleDialogue(`🪨 날카로운 바위(스텔스록)가 <b>[${vP.name}]</b>에게 꽂혔다! (-${rockDmg})`);
          await new Promise(r => setTimeout(r, 800));
          if (vSlot.currentHP <= 0) {
            vSlot.fainted = true;
            renderArenaTeamBallsHUD();
            setBattleDialogue(`💀 <b>[${vP.name}]</b>은(는) 스텔스록 데미지로 쓰러졌다!`);
            await new Promise(r => setTimeout(r, 800));
          }
        }
      }
      await new Promise(r => setTimeout(r, 900));
    }

    // ==========================================
    // Authentic Gen 5 Pokemon Dynamic BGM Engine
    // ==========================================
    const pokeBgmState = {
      enabled: true,
      volume: 0.35,
      currentTrackType: null, // 'normal' | 'pinch' | 'victory'
      audioElements: {},
      fadeInterval: null,
      isPinch: false
    };

    function getPokeBgmAudio(trackType) {
      if (!pokeBgmState.audioElements[trackType]) {
        let file = '';
        if (trackType === 'normal') file = 'bgm_battle_trainer.mp3';
        else if (trackType === 'pinch') file = 'bgm_battle_low_hp.mp3';
        else if (trackType === 'victory') file = 'bgm_victory_trainer.mp3';
        
        if (file) {
          const audio = new Audio('./battle_anims/audio/' + file);
          audio.loop = (trackType !== 'victory');
          audio.volume = 0;
          pokeBgmState.audioElements[trackType] = audio;
        }
      }
      return pokeBgmState.audioElements[trackType];
    }

    function playPokeBattleBgm(trackType, fadeMs = 400) {
      if (window.appGlobalMuted) return;
      if (!pokeBgmState.enabled && trackType !== 'victory') return;
      if (pokeBgmState.currentTrackType === trackType) {
        const curr = getPokeBgmAudio(trackType);
        if (curr && curr.paused) {
          curr.play().catch(e => console.warn('BGM play blocked:', e));
        }
        return;
      }

      const prevType = pokeBgmState.currentTrackType;
      const prevAudio = prevType ? getPokeBgmAudio(prevType) : null;
      const nextAudio = getPokeBgmAudio(trackType);
      if (!nextAudio) return;

      pokeBgmState.currentTrackType = trackType;
      pokeBgmState.isPinch = (trackType === 'pinch');

      if (pokeBgmState.fadeInterval) {
        clearInterval(pokeBgmState.fadeInterval);
        pokeBgmState.fadeInterval = null;
      }

      const targetVol = pokeBgmState.enabled ? pokeBgmState.volume : 0;
      nextAudio.volume = 0;
      nextAudio.currentTime = 0;
      const playPromise = nextAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn('BGM play autoplay prevented:', e));
      }

      const steps = 15;
      const stepTime = Math.max(10, Math.floor(fadeMs / steps));
      let step = 0;

      pokeBgmState.fadeInterval = setInterval(() => {
        step++;
        const progress = Math.min(1, step / steps);
        if (prevAudio) {
          prevAudio.volume = Math.max(0, targetVol * (1 - progress));
        }
        if (nextAudio && pokeBgmState.enabled) {
          nextAudio.volume = Math.min(targetVol, targetVol * progress);
        }
        if (step >= steps) {
          clearInterval(pokeBgmState.fadeInterval);
          pokeBgmState.fadeInterval = null;
          if (prevAudio) {
            prevAudio.pause();
            prevAudio.currentTime = 0;
          }
          if (nextAudio && pokeBgmState.enabled) {
            nextAudio.volume = targetVol;
          }
        }
      }, stepTime);

      updateBgmUIControls();
    }

    function stopPokeBattleBgm(fadeMs = 400) {
      if (pokeBgmState.fadeInterval) {
        clearInterval(pokeBgmState.fadeInterval);
        pokeBgmState.fadeInterval = null;
      }

      const curr = pokeBgmState.currentTrackType ? getPokeBgmAudio(pokeBgmState.currentTrackType) : null;
      pokeBgmState.currentTrackType = null;
      pokeBgmState.isPinch = false;

      if (!curr || curr.paused) {
        Object.values(pokeBgmState.audioElements).forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
        updateBgmUIControls();
        return;
      }

      const startVol = curr.volume;
      const steps = 12;
      const stepTime = Math.max(10, Math.floor(fadeMs / steps));
      let step = 0;

      const fadeOut = setInterval(() => {
        step++;
        const p = Math.min(1, step / steps);
        curr.volume = Math.max(0, startVol * (1 - p));
        if (step >= steps) {
          clearInterval(fadeOut);
          Object.values(pokeBgmState.audioElements).forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
          updateBgmUIControls();
        }
      }, stepTime);
    }

    function setPokeBgmVolume(val) {
      const num = Math.max(0, Math.min(1, parseFloat(val) || 0));
      pokeBgmState.volume = num;
      if (num > 0) pokeBgmState.enabled = true;
      try {
        localStorage.setItem('poke_bgm_volume', String(num));
        localStorage.setItem('poke_bgm_enabled', String(pokeBgmState.enabled));
      } catch (e) {}
      if (pokeBgmState.currentTrackType) {
        const audio = getPokeBgmAudio(pokeBgmState.currentTrackType);
        if (audio) audio.volume = pokeBgmState.enabled ? num : 0;
      }
      updateBgmUIControls();
    }

    function togglePokeBgm() {
      pokeBgmState.enabled = !pokeBgmState.enabled;
      try {
        localStorage.setItem('poke_bgm_enabled', String(pokeBgmState.enabled));
      } catch (e) {}
      if (pokeBgmState.currentTrackType) {
        const audio = getPokeBgmAudio(pokeBgmState.currentTrackType);
        if (audio) {
          if (!pokeBgmState.enabled) {
            audio.volume = 0;
          } else {
            audio.volume = pokeBgmState.volume;
            if (audio.paused) audio.play().catch(() => {});
          }
        }
      } else if (pokeBgmState.enabled && typeof pokeBattleState !== 'undefined' && pokeBattleState.active) {
        checkPokeBattleBgmCondition();
      }
      updateBgmUIControls();
    }

    function updateBgmUIControls() {
      const btn = document.getElementById('arenaBgmToggleBtn');
      const slider = document.getElementById('arenaBgmVolumeSlider');
      const setupBtn = document.getElementById('setupBgmToggleBtn');
      const setupSlider = document.getElementById('setupBgmVolumeSlider');
      const studioSlider = document.getElementById('animStudioBgmVolumeSlider');

      const title = pokeBgmState.enabled ? `BGM ON (${Math.round(pokeBgmState.volume * 100)}%)` : 'BGM 음소거됨';
      const icon = pokeBgmState.enabled ? (pokeBgmState.isPinch ? '🚨' : '🎵') : '🔇';
      const val = pokeBgmState.enabled ? pokeBgmState.volume : 0;

      if (btn) { btn.innerHTML = icon; btn.title = title; }
      if (slider) { slider.value = val; }
      if (setupBtn) { setupBtn.innerHTML = icon; setupBtn.title = title; }
      if (setupSlider) { setupSlider.value = val; }
      if (studioSlider) { studioSlider.value = val; }
    }

    // ==========================================
    // Authentic Gen 4/5 Pokemon SFX Volume Engine
    // ==========================================
    const pokeSfxState = {
      enabled: localStorage.getItem('poke_sfx_enabled') !== 'false',
      volume: localStorage.getItem('poke_sfx_volume') !== null ? Math.max(0, Math.min(1, parseFloat(localStorage.getItem('poke_sfx_volume')) || 0)) : 0.8
    };

    function setPokeSfxVolume(val) {
      const num = Math.max(0, Math.min(1, parseFloat(val) || 0));
      pokeSfxState.volume = num;
      if (num > 0) pokeSfxState.enabled = true;
      try {
        localStorage.setItem('poke_sfx_volume', String(num));
        localStorage.setItem('poke_sfx_enabled', String(pokeSfxState.enabled));
      } catch (e) {}
      updateSfxUIControls();
    }

    function togglePokeSfx() {
      pokeSfxState.enabled = !pokeSfxState.enabled;
      try {
        localStorage.setItem('poke_sfx_enabled', String(pokeSfxState.enabled));
      } catch (e) {}
      updateSfxUIControls();
    }

    function updateSfxUIControls() {
      const btn = document.getElementById('arenaSfxToggleBtn');
      const slider = document.getElementById('arenaSfxVolumeSlider');
      const setupBtn = document.getElementById('setupSfxToggleBtn');
      const setupSlider = document.getElementById('setupSfxVolumeSlider');
      const studioSlider = document.getElementById('animStudioSfxVolumeSlider');

      const title = pokeSfxState.enabled ? `효과음(SFX) ON (${Math.round(pokeSfxState.volume * 100)}%)` : '효과음 음소거됨';
      const icon = pokeSfxState.enabled ? '🔊' : '🔇';
      const val = pokeSfxState.enabled ? pokeSfxState.volume : 0;

      if (btn) { btn.innerHTML = icon; btn.title = title; }
      if (slider) { slider.value = val; }
      if (setupBtn) { setupBtn.innerHTML = icon; setupBtn.title = title; }
      if (setupSlider) { setupSlider.value = val; }
      if (studioSlider) { studioSlider.value = val; }
    }

    try {
      updateBgmUIControls();
      updateSfxUIControls();
    } catch (e) {}

    function checkPokeBattleBgmCondition() {
      if (typeof pokeBattleState === 'undefined' || !pokeBattleState.active) return;
      if (pokeBattleState.phase === 'ended') return;

      const sSlot = (Array.isArray(streamerTeam) && streamerTeam[streamerActiveIdx]) ? streamerTeam[streamerActiveIdx] : null;
      const sRatio = (sSlot && sSlot.maxHP > 0) ? (sSlot.currentHP / sSlot.maxHP) : 1.0;
      const sIsRed = !!(sSlot && !sSlot.fainted && sSlot.currentHP > 0 && sRatio <= 0.25);

      const vSlot = (Array.isArray(viewersTeam) && viewersTeam[viewersActiveIdx]) ? viewersTeam[viewersActiveIdx] : null;
      const vRatio = (vSlot && vSlot.maxHP > 0) ? (vSlot.currentHP / vSlot.maxHP) : 1.0;
      const vIsRed = !!(vSlot && !vSlot.fainted && vSlot.currentHP > 0 && vRatio <= 0.25);

      // Red HP emergency: whenever active battling Pokemon on field is in red danger zone (<= 25%)
      const shouldBePinch = (sIsRed || vIsRed);

      if (shouldBePinch) {
        if (pokeBgmState.currentTrackType !== 'pinch') {
          console.log('[BGM] 🚨 Pinch Low-HP Theme Triggered! (Streamer:', sIsRed, Math.round(sRatio * 100) + '%, Viewers:', vIsRed, Math.round(vRatio * 100) + '%)');
          playPokeBattleBgm('pinch', 500);
        }
      } else {
        if (pokeBgmState.currentTrackType === 'pinch') {
          console.log('[BGM] 🎵 Reverting to Normal Battle Theme (HP recovered / non-red)');
          playPokeBattleBgm('normal', 500);
        } else if (!pokeBgmState.currentTrackType && pokeBgmState.enabled) {
          playPokeBattleBgm('normal', 400);
        }
      }
    }

    // ==========================================
    // Authentic Gen 4/5 Pokemon Sound Effects & Presentation Engine
    // ==========================================
    const pokeAudioCache = {};

    function playAuthenticPokeSound(name, volume = 0.8) {
      if (!name || window.appGlobalMuted) return;
      if (typeof pokeSfxState !== 'undefined' && (!pokeSfxState.enabled || pokeSfxState.volume <= 0)) return;
      try {
        let audio = pokeAudioCache[name];
        if (!audio) {
          audio = new Audio('./battle_anims/audio/' + encodeURIComponent(name));
          pokeAudioCache[name] = audio;
        }
        audio.currentTime = 0;
        const sfxMult = (typeof pokeSfxState !== 'undefined') ? pokeSfxState.volume : 0.8;
        const effectiveVolume = Math.max(0, Math.min(1, (volume !== undefined ? volume : 0.8) * sfxMult));
        audio.volume = effectiveVolume;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            playSynthesizedPokeSound(name);
          });
        }
      } catch (e) {
        playSynthesizedPokeSound(name);
      }
    }

    function getMoveSoundFilename(moveName, category, type) {
      if (!moveName) return 'Blow1.m4a';

      // 1. Status / Buff / Setup moves (변화기) - Check first EXCEPT attacking moves that contain '춤' (like 불꽃춤)
      if (moveName === '불꽃춤') {
        return 'Fire1.m4a';
      }
      if (category === '변화' || /칼춤|용의춤|나비춤|명상|벌크업|철벽|록커트|날개쉬기|달의불빛|스텔스록|길동무|HP회복|하품|맹독|도깨비불|전기자석파|이상한빛|뽐내기/.test(moveName)) {
        return 'charge.wav';
      }

      // 2. High-Impact Crashing Slam / Reckless Tackle / Colossal Blows
      if (/대검돌격|브레이브버드|이판사판태클|역린|액셀브레이크|암흑강타|메테오매시|코멧펀치|헤비봄버|기가임팩트/.test(moveName)) {
        return 'Crash.m4a';
      }

      // 3. Ground / Earth / Subterranean Tremor
      if (/지진|10만마력|대지의힘|땅고르기|구멍파기|매그니튜드/.test(moveName)) {
        return 'PRSFX- Earthquake.wav';
      }

      // 4. Psychic Energy / Warp
      if (/사이코키네시스|사이코쇼크|와이드포스|사념의박치기/.test(moveName)) {
        return 'PRSFX- Psychic.wav';
      }

      // 5. Water Torrent / Wave / Splashing Deluge
      if (/파도타기|하이드로펌프|하이드로스나이프|탁류|폭포오르기|아쿠아브레이크|웨이브태클|열탕|물대포|아쿠아제트/.test(moveName)) {
        return 'PRSFX- Muddy Water.wav';
      }

      // 6. Ice Freeze / Crystal Shatter
      if (/냉동빔|눈보라|얼음뭉치|고드름떨구기|눈사태|프리즈드라이/.test(moveName)) {
        return 'PRSFX- Ice Beam.wav';
      }

      // 7. Rock / Boulder Avalanche / Draco Meteor
      if (/스톤샤워|스톤에지|원시의힘|암석봉인|락블라스트|용성군/.test(moveName)) {
        return 'PRSFX- Rock Slide.wav';
      }

      // 8. Sharp Blades / Slashing Claws / Cutting Wings
      if (/에어슬래시|시저크로스|깜짝베기|리프블레이드|섀도크루|드래곤크루|드래곤클로|만나자마자|그래스슬라이더|성스러운칼|자르기|연속자르기|베기/.test(moveName)) {
        return 'PRSFX- Air Slash1.wav';
      }

      // 9. Fire Streams / Explosions
      if (/플레어드라이브/.test(moveName)) return 'Fire3.m4a';
      if (/화염방사|불대문자|오버히트|열풍|화염볼|불꽃펀치|열사의대지/.test(moveName)) {
        return 'Fire1.m4a';
      }

      // 10. Energy Beams / Electric Zaps / Soundwaves / Special Piercing Blasts
      if (/10만볼트|번개|볼트체인지|오버드라이브|이나즈마드라이브|솔라빔|용의파동|러스터캐논|철제광선|악의파동|파괴광선|문포스|매지컬샤인|하이퍼보이스|폭음파|벌레의야단법석|파동탄|파워젬/.test(moveName)) {
        return 'beam.wav';
      }

      // 11. Rapid Heavy Punches / Direct Physical Strikes / Jabs
      if (/불릿펀치|인파이트|드레인펀치|야습|아이언헤드|번개펀치|볼트태클|와일드볼트|기습|탁쳐서떨구기|유턴|독찌르기|지옥찌르기|드럼어택|치근거리기|무릎차기|누르기|객기|흡혈|소울크래시/.test(moveName)) {
        return 'PRSFX- Bullet Punch.wav';
      }

      // 12. Spherical Bombs & Sludge
      if (/섀도볼|에너지볼|오물폭탄|오물웨이브|더스트슈트|기가드레인/.test(moveName)) {
        return 'Blow1.m4a';
      }

      // 13. Struggle / Last Resort
      if (/발버둥/.test(moveName)) {
        return 'Damage1.m4a';
      }

      // 14. Intelligent Fallback by Type & Category for Custom / Unknown Moves
      if (type === '전기') return 'beam.wav';
      if (type === '불꽃') return 'Fire1.m4a';
      if (type === '물') return 'PRSFX- Muddy Water.wav';
      if (type === '얼음') return 'PRSFX- Ice Beam.wav';
      if (type === '땅') return 'PRSFX- Earthquake.wav';
      if (type === '바위') return 'PRSFX- Rock Slide.wav';
      if (type === '비행') return 'PRSFX- Air Slash1.wav';
      if (type === '격투') return 'PRSFX- Bullet Punch.wav';
      if (type === '에스퍼') return 'PRSFX- Psychic.wav';
      if (category === '특수') return 'beam.wav';
      if (category === '물리') return 'PRSFX- Bullet Punch.wav';

      return 'Blow1.m4a';
    }

    function playHitReactionSound(hitResult) {
      if (!hitResult || !hitResult.hit) {
        playAuthenticPokeSound('flee.wav', 0.85);
        return;
      }
      if (hitResult.isCrit || (hitResult.typeMult && hitResult.typeMult >= 2.0)) {
        playAuthenticPokeSound('hit_strong.wav', 0.9);
      } else if (hitResult.typeMult && hitResult.typeMult < 1.0 && hitResult.typeMult > 0) {
        playAuthenticPokeSound('hit_weak.wav', 0.7);
      } else {
        playAuthenticPokeSound('hit.wav', 0.8);
      }
    }

    // Robust Animation Loop for 60fps presentation (Immune to headless or background throttling)
    function runPokeAnimLoop(duration, renderStep) {
      return new Promise(resolve => {
        const start = performance.now();
        let frameTimer = null;
        let isDone = false;

        function frame() {
          if (isDone) return;
          const now = performance.now();
          const elapsed = now - start;
          const progress = Math.min(1, Math.max(0, elapsed / duration));
          renderStep(progress, elapsed);
          if (progress < 1) {
            frameTimer = setTimeout(frame, 16);
          } else {
            isDone = true;
            if (frameTimer) clearTimeout(frameTimer);
            resolve();
          }
        }

        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            if (frameTimer) clearTimeout(frameTimer);
            renderStep(1, duration);
            resolve();
          }
        }, duration + 80);

        frame();
      });
    }

    // Dynamic Camera Rumble on #pokeArenaContainer
    let arenaRumbleTimer = null;
    function triggerArenaCameraRumble(intensity = 12, durationMs = 500) {
      const arena = document.getElementById('pokeArenaContainer');
      if (!arena) return;
      if (arenaRumbleTimer) {
        clearTimeout(arenaRumbleTimer);
        arenaRumbleTimer = null;
      }
      const start = performance.now();
      function rumbleStep() {
        const now = performance.now();
        const elapsed = now - start;
        if (elapsed >= durationMs) {
          arena.style.transform = '';
          arenaRumbleTimer = null;
          return;
        }
        const decay = 1 - (elapsed / durationMs);
        const curInt = intensity * decay;
        const rx = (Math.random() * 2 - 1) * curInt;
        const ry = (Math.random() * 2 - 1) * curInt * 0.75;
        const rot = (Math.random() * 2 - 1) * (curInt * 0.08);
        arena.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        arenaRumbleTimer = setTimeout(rumbleStep, 16);
      }
      rumbleStep();
    }

    // Screen Dimming & Elemental Atmosphere Tint
    function getPokeTypeAtmosphereTint(type, moveName) {
      if (moveName === '지진') return 'rgba(0, 0, 0, 0.65)';
      if (moveName === '사이코키네시스' || moveName === '사이코쇼크') return 'rgba(130, 20, 170, 0.45)';
      if (moveName === '파도타기') return 'rgba(10, 50, 150, 0.42)';
      switch (type) {
        case '불꽃': return 'rgba(180, 40, 0, 0.35)';
        case '물': return 'rgba(10, 80, 180, 0.35)';
        case '전기': return 'rgba(180, 140, 0, 0.35)';
        case '풀': return 'rgba(20, 120, 40, 0.35)';
        case '얼음': return 'rgba(20, 150, 200, 0.35)';
        case '고스트':
        case '악': return 'rgba(30, 10, 50, 0.45)';
        case '에스퍼': return 'rgba(150, 20, 100, 0.35)';
        case '드래곤': return 'rgba(50, 20, 140, 0.35)';
        case '독': return 'rgba(90, 15, 120, 0.35)';
        case '땅':
        case '바위': return 'rgba(100, 60, 20, 0.35)';
        case '페어리': return 'rgba(180, 60, 120, 0.30)';
        default: return 'rgba(0, 0, 0, 0.28)';
      }
    }

    // Full-screen White Flash for Critical / Super-Effective Hits
    function triggerWhiteFlash(durationMs = 280) {
      const canvas = document.getElementById('pokeBattleVfxCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      runPokeAnimLoop(durationMs, (progress) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (progress < 1) {
          const alpha = Math.max(0, (1 - progress) * 0.85);
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      });
    }

    // Floating Miss Pill Badge Animation
    async function renderPokeMissBadge(canvas, targetX, targetY) {
      const ctx = canvas.getContext('2d');
      await runPokeAnimLoop(650, (progress) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const floatY = targetY - progress * 32;
        const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(targetX, floatY);

        const badgeW = 100;
        const badgeH = 32;
        const r = 16;

        ctx.fillStyle = 'rgba(220, 38, 38, 0.92)';
        ctx.strokeStyle = '#fecaca';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, r);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText('💨 빗나감!', 0, 1);

        ctx.restore();
      });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- EBDX Cinematic: 1. Earthquake (지진) ---
    async function playEarthquakeCinematic(actor, hitResult) {
      const isStreamer = actor === 'streamer';
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
      const canvas = document.getElementById('pokeBattleVfxCanvas');
      if (!canvas || !attackerSpr || !defenderSpr) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.offsetWidth || 800;
      canvas.height = rect.height || canvas.offsetHeight || 320;
      const ctx = canvas.getContext('2d');

      const atkRect = attackerSpr.getBoundingClientRect();
      const defRect = defenderSpr.getBoundingClientRect();
      const p1 = { x: atkRect.left - rect.left + atkRect.width / 2, y: atkRect.top - rect.top + atkRect.height / 2 };
      const p2 = { x: defRect.left - rect.left + defRect.width / 2, y: defRect.top - rect.top + defRect.height / 2 };

      attackerSpr.classList.add('poke-hop');
      setTimeout(() => attackerSpr.classList.remove('poke-hop'), 400);

      playAuthenticPokeSound('PRSFX- Earthquake.wav', 0.95);
      triggerArenaCameraRumble(25, 950);

      const groundY = Math.max(p1.y, p2.y) + 35;
      const fissureStartX = Math.min(p1.x, p2.x) - 40;
      const fissureEndX = Math.max(p1.x, p2.x) + 40;
      const segCount = 14;
      const fissurePoints = [];
      for (let i = 0; i <= segCount; i++) {
        const fx = fissureStartX + (fissureEndX - fissureStartX) * (i / segCount);
        const fy = groundY + (i === 0 || i === segCount ? 0 : (Math.random() * 2 - 1) * 12);
        fissurePoints.push({ x: fx, y: fy });
      }

      const shards = Array.from({ length: 30 }, () => ({
        x: fissureStartX + Math.random() * (fissureEndX - fissureStartX),
        y: groundY + (Math.random() - 0.5) * 10,
        vy: -(3.5 + Math.random() * 5.5),
        vx: (Math.random() - 0.5) * 3,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        size: 4 + Math.random() * 7,
        color: Math.random() > 0.4 ? '#b45309' : (Math.random() > 0.5 ? '#78350f' : '#f59e0b')
      }));

      await runPokeAnimLoop(850, (progress) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Dark atmosphere screen dimming
        const dimAlpha = Math.sin(progress * Math.PI) * 0.65;
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 2. Fissure split glow & line
        const drawProgress = Math.min(1, progress * 1.8);
        const pointsToDraw = Math.floor(fissurePoints.length * drawProgress);
        if (pointsToDraw > 1) {
          ctx.save();
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 24;
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(fissurePoints[0].x, fissurePoints[0].y);
          for (let i = 1; i < pointsToDraw; i++) {
            ctx.lineTo(fissurePoints[i].x, fissurePoints[i].y);
          }
          ctx.stroke();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }

        // 3. Flying earth shards
        shards.forEach(s => {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.22;
          s.rot += s.vRot;
          const alpha = Math.max(0, 1 - progress);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rot);
          ctx.fillStyle = s.color;
          ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
          ctx.restore();
        });
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      playHitReactionSound(hitResult);
      if (hitResult.isCrit) {
        triggerWhiteFlash(320);
        defenderSpr.classList.add('poke-sprite-crit');
        setTimeout(() => defenderSpr.classList.remove('poke-sprite-crit'), 650);
      } else {
        defenderSpr.classList.add('poke-hit-shake');
        setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 450);
      }
    }

    // --- EBDX Cinematic: 2. Psychic (사이코키네시스) ---
    async function playPsychicCinematic(actor, hitResult) {
      const isStreamer = actor === 'streamer';
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
      const canvas = document.getElementById('pokeBattleVfxCanvas');
      if (!canvas || !attackerSpr || !defenderSpr) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.offsetWidth || 800;
      canvas.height = rect.height || canvas.offsetHeight || 320;
      const ctx = canvas.getContext('2d');

      const defRect = defenderSpr.getBoundingClientRect();
      const p2 = { x: defRect.left - rect.left + defRect.width / 2, y: defRect.top - rect.top + defRect.height / 2 };

      attackerSpr.classList.add('poke-hop');
      setTimeout(() => attackerSpr.classList.remove('poke-hop'), 400);

      playAuthenticPokeSound('PRSFX- Psychic.wav', 0.9);

      const liftDistance = 34;
      defenderSpr.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.35s ease';
      defenderSpr.style.transform = `translateY(-${liftDistance}px)`;
      defenderSpr.style.filter = 'drop-shadow(0 0 26px #c084fc) brightness(1.4) contrast(1.2)';

      await runPokeAnimLoop(800, (progress, elapsed) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Cosmic purple screen dimming
        const dimAlpha = Math.sin(progress * Math.PI) * 0.45;
        ctx.save();
        ctx.fillStyle = `rgba(130, 20, 170, ${dimAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 2. Swirling psychic distortion rings
        ctx.save();
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 20;
        for (let i = 0; i < 4; i++) {
          const ringAngle = progress * Math.PI * 4 + i * (Math.PI / 2);
          const rx = 38 + Math.sin(progress * Math.PI * 3 + i) * 16;
          const ry = 16 + Math.cos(progress * Math.PI * 3 + i) * 8;
          ctx.save();
          ctx.translate(p2.x, p2.y - liftDistance * 0.8);
          ctx.rotate(ringAngle);
          ctx.strokeStyle = i % 2 === 0 ? '#ec4899' : '#a855f7';
          ctx.lineWidth = 3;
          ctx.globalAlpha = Math.max(0, Math.sin(progress * Math.PI) * 0.85);
          ctx.beginPath();
          ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        if (elapsed > 200 && elapsed < 550) {
          const shakeX = (Math.random() * 2 - 1) * 5;
          defenderSpr.style.transform = `translate(${shakeX.toFixed(1)}px, -${liftDistance}px)`;
        }
      });

      defenderSpr.style.transition = 'transform 0.12s cubic-bezier(0.8, 0, 1, 1), filter 0.12s ease';
      defenderSpr.style.transform = 'translateY(0)';
      defenderSpr.style.filter = '';

      playHitReactionSound(hitResult);
      triggerArenaCameraRumble(19, 500);

      await runPokeAnimLoop(260, (prog) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 18;
        ctx.lineWidth = Math.max(1, (1 - prog) * 7);
        ctx.globalAlpha = Math.max(0, 1 - prog);
        ctx.beginPath();
        ctx.ellipse(p2.x, p2.y + 20, prog * 70, prog * 28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (hitResult.isCrit) {
        triggerWhiteFlash(320);
        defenderSpr.classList.add('poke-sprite-crit');
        setTimeout(() => defenderSpr.classList.remove('poke-sprite-crit'), 650);
      } else {
        defenderSpr.classList.add('poke-hit-shake');
        setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 450);
      }
    }

    // --- EBDX Cinematic: 3. Surf (파도타기) ---
    async function playSurfCinematic(actor, hitResult) {
      const isStreamer = actor === 'streamer';
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
      const canvas = document.getElementById('pokeBattleVfxCanvas');
      if (!canvas || !attackerSpr || !defenderSpr) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.offsetWidth || 800;
      canvas.height = rect.height || canvas.offsetHeight || 320;
      const ctx = canvas.getContext('2d');

      const atkRect = attackerSpr.getBoundingClientRect();
      const defRect = defenderSpr.getBoundingClientRect();
      const p1 = { x: atkRect.left - rect.left + atkRect.width / 2, y: atkRect.top - rect.top + atkRect.height / 2 };
      const p2 = { x: defRect.left - rect.left + defRect.width / 2, y: defRect.top - rect.top + defRect.height / 2 };

      attackerSpr.classList.add('poke-hop');
      setTimeout(() => attackerSpr.classList.remove('poke-hop'), 400);

      playAuthenticPokeSound('PRSFX- Muddy Water.wav', 0.9);
      triggerArenaCameraRumble(16, 750);

      const droplets = Array.from({ length: 35 }, () => ({
        x: p1.x + (p2.x - p1.x) * (0.3 + Math.random() * 0.7),
        y: p2.y + (Math.random() - 0.5) * 40,
        vx: (isStreamer ? 1 : -1) * (2 + Math.random() * 4),
        vy: -(2.5 + Math.random() * 5),
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#bae6fd' : '#ffffff')
      }));

      await runPokeAnimLoop(750, (progress) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Ocean blue screen tint
        const dimAlpha = Math.sin(progress * Math.PI) * 0.42;
        ctx.save();
        ctx.fillStyle = `rgba(10, 50, 150, ${dimAlpha.toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // 2. Rolling tsunami wave crest moving across screen
        const waveX = p1.x + (p2.x - p1.x) * progress;
        const waveHeight = Math.sin(progress * Math.PI) * 70;
        const baseY = canvas.height * 0.75;

        ctx.save();
        // Wave layer 1: Deep blue body
        ctx.fillStyle = 'rgba(30, 58, 138, 0.75)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, baseY);
        for (let x = 0; x <= canvas.width; x += 20) {
          const crest = Math.exp(-Math.pow((x - waveX) / 85, 2)) * waveHeight;
          ctx.lineTo(x, baseY - crest);
        }
        ctx.lineTo(canvas.width, baseY);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Wave layer 2: Cyan foam
        ctx.fillStyle = 'rgba(6, 182, 212, 0.65)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, baseY + 10);
        for (let x = 0; x <= canvas.width; x += 20) {
          const crest = Math.exp(-Math.pow((x - (waveX - 15)) / 75, 2)) * (waveHeight * 0.9);
          ctx.lineTo(x, baseY + 10 - crest);
        }
        ctx.lineTo(canvas.width, baseY + 10);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Wave crest spray line (white foam)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 15) {
          const crest = Math.exp(-Math.pow((x - waveX) / 70, 2)) * waveHeight;
          if (x === 0) ctx.moveTo(x, baseY - crest);
          else ctx.lineTo(x, baseY - crest);
        }
        ctx.stroke();
        ctx.restore();

        if (progress > 0.4) {
          droplets.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            d.vy += 0.2;
            ctx.save();
            ctx.fillStyle = d.color;
            ctx.globalAlpha = Math.max(0, 1 - progress);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        if (progress > 0.55 && progress < 0.85) {
          defenderSpr.style.transform = 'translateY(18px)';
        } else {
          defenderSpr.style.transform = '';
        }
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      defenderSpr.style.transform = '';

      playHitReactionSound(hitResult);
      if (hitResult.isCrit) {
        triggerWhiteFlash(320);
        defenderSpr.classList.add('poke-sprite-crit');
        setTimeout(() => defenderSpr.classList.remove('poke-sprite-crit'), 650);
      } else {
        defenderSpr.classList.add('poke-hit-shake');
        setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 450);
      }
    }

    // Web Audio API Synthesis Fallback
    let battleAudioCtx = null;
    function getBattleAudioContext() {
      try {
        if (!battleAudioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) battleAudioCtx = new AudioCtx();
        }
        if (battleAudioCtx && battleAudioCtx.state === 'suspended') {
          battleAudioCtx.resume().catch(() => {});
        }
        return battleAudioCtx;
      } catch (e) {
        return null;
      }
    }

    function playSynthesizedPokeSound(soundType) {
      if (window.appGlobalMuted) return;
      if (typeof pokeSfxState !== 'undefined' && (!pokeSfxState.enabled || pokeSfxState.volume <= 0)) return;
      try {
        const ctx = getBattleAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const sfxDest = ctx.createGain();
        const sfxMult = (typeof pokeSfxState !== 'undefined') ? pokeSfxState.volume : 0.8;
        sfxDest.gain.setValueAtTime(sfxMult, now);
        sfxDest.connect(ctx.destination);

        if (soundType === 'hit_normal') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc.stop(now + 0.16);

          const bufferSize = Math.floor(ctx.sampleRate * 0.08);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(1100, now);
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.22, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(sfxDest);
          noise.start(now);
          noise.stop(now + 0.09);

        } else if (soundType === 'hit_heavy') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);
          gain.gain.setValueAtTime(0.38, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc.stop(now + 0.36);

          const bufferSize = Math.floor(ctx.sampleRate * 0.25);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'lowpass';
          noiseFilter.frequency.setValueAtTime(450, now);
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.32, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(sfxDest);
          noise.start(now);
          noise.stop(now + 0.26);

        } else if (soundType === 'slash') {
          const bufferSize = Math.floor(ctx.sampleRate * 0.18);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(3200, now);
          filter.frequency.exponentialRampToValueAtTime(700, now + 0.18);
          filter.Q.value = 3;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(sfxDest);
          noise.start(now);
          noise.stop(now + 0.19);

        } else if (soundType === 'projectile') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(820, now + 0.28);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
          osc.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc.stop(now + 0.29);

        } else if (soundType === 'beam') {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc2.type = 'square';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.linearRampToValueAtTime(160, now + 0.42);
          osc2.frequency.setValueAtTime(484, now);
          osc2.frequency.linearRampToValueAtTime(162, now + 0.42);
          gain.gain.setValueAtTime(0.26, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
          osc.connect(gain);
          osc2.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.44);
          osc2.stop(now + 0.44);

        } else if (soundType === 'earthquake') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(70, now);
          osc.frequency.linearRampToValueAtTime(32, now + 0.55);
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
          osc.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc.stop(now + 0.57);

        } else if (soundType === 'buff') {
          const freqs = [523.25, 659.25, 783.99, 1046.50];
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteStart = now + idx * 0.08;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);
            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.005, noteStart + 0.26);
            osc.connect(gain);
            gain.connect(sfxDest);
            osc.start(noteStart);
            osc.stop(noteStart + 0.28);
          });

        } else if (soundType === 'ailment') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(130, now + 0.38);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
          osc.connect(gain);
          gain.connect(sfxDest);
          osc.start(now);
          osc.stop(now + 0.4);

        } else if (soundType === 'miss') {
          const bufferSize = Math.floor(ctx.sampleRate * 0.12);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(900, now);
          filter.frequency.exponentialRampToValueAtTime(300, now + 0.12);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(sfxDest);
          noise.start(now);
          noise.stop(now + 0.13);
        }
      } catch (err) {
        // audio muted or unsupported
      }
    }

    // Alias playBattleSoundFx for backward compatibility
    function playBattleSoundFx(soundType) {
      playSynthesizedPokeSound(soundType);
    }

    function getPokeMoveMotionType(move) {
      if (!move) return 'heavy_tackle';
      const name = move.name || '';
      const cat = move.category || '';
      const type = move.type || '';

      // 1. Unique Signature VFX
      if (name === '불대문자') return 'fire_blast';
      if (name === '파도타기') return 'surf';
      if (name === '기가드레인') return 'drain';
      if (name === '파워젬') return 'gem';
      if (name === '치근거리기') return 'fairy_play';
      if (name === '역린') return 'outrage';
      if (name === '깨물어부수기') return 'bite';
      if (name === '기습' || name === '탁쳐서떨구기') return 'dark_strike';
      if (name === '하이퍼보이스' || name === '벌레의야단법석') return 'sonic';
      if (name === '사이코키네시스' || name === '사이코쇼크') return 'psychic';
      if (name === '문포스' || name === '매지컬샤인') return 'moonforce';
      if (name === '고드름떨구기' || name === '얼음뭉치') return 'icicle';
      if (name === '독찌르기' || name === '더스트슈트') return 'poison_jab';
      if (name === '플레어드라이브') return 'rush_fire';
      if (name === '볼트태클') return 'rush_electric';
      if (name === '브레이브버드') return 'rush_flying';
      if (name === '아쿠아브레이크' || name === '폭포오르기') return 'rush_water';
      if (/펀치|인파이트/.test(name)) return 'fist';

      // 2. Buff / Status
      if (cat === '변화' || move.power === 0) {
        if (/맹독|도깨비불|전기자석파|길동무|최면술|수면|하품|이상한빛|뽐내기|유혹|헤롱헤롱|압정|그림자분신/.test(name)) {
          return 'ailment';
        }
        return 'buff';
      }

      // 3. Slash / Blade
      if (/베기|클로|크루|블레이드|에어슬래시|깜짝베기|시저크로스|섀도크루|야습|드래곤크루|스톤에지|자르기|절각|연속자르기/.test(name)) {
        return 'slash';
      }

      // 4. Ground / Earthquake
      if (/지진|대지의힘|땅고르기|구멍파기|암석봉인|스톤샤워|매그니튜드|모래바람|락블라스트/.test(name)) {
        return 'ground';
      }

      // 5. Continuous Stream
      if (/화염방사|하이드로펌프|열탕|물대포|오물폭탄|오물웨이브|용의숨결|눈보라|오로라빔/.test(name)) {
        return 'stream';
      }

      // 6. Beam / Cannon / Ray
      if (/솔라빔|10만볼트|번개|냉동빔|용의파동|파동탄|러스터캐논|악의파동|파괴광선/.test(name)) {
        return 'beam';
      }

      // 7. Projectile
      if (/섀도볼|에너지볼|기합탄|불꽃세례|원시의힘|씨기관총|암석|바위날리기|미사일|고속스핀/.test(name)) {
        return 'projectile';
      }

      // 8. Heavy Tackle / Body contact
      return 'heavy_tackle';
    }

    function getPokeTypeVfxColors(type) {
      const colorMap = {
        '불꽃': { primary: '#ff4d00', secondary: '#ffa500', glow: 'rgba(255, 77, 0, 0.85)' },
        '물': { primary: '#0ea5e9', secondary: '#7dd3fc', glow: 'rgba(14, 165, 233, 0.85)' },
        '풀': { primary: '#22c55e', secondary: '#a7f3d0', glow: 'rgba(34, 197, 94, 0.85)' },
        '전기': { primary: '#eab308', secondary: '#fef08a', glow: 'rgba(234, 179, 8, 0.9)' },
        '얼음': { primary: '#06b6d4', secondary: '#cffafe', glow: 'rgba(6, 182, 212, 0.85)' },
        '격투': { primary: '#dc2626', secondary: '#fca5a5', glow: 'rgba(220, 38, 38, 0.85)' },
        '독': { primary: '#9333ea', secondary: '#e9d5ff', glow: 'rgba(147, 51, 234, 0.85)' },
        '땅': { primary: '#b45309', secondary: '#fde68a', glow: 'rgba(180, 83, 9, 0.85)' },
        '비행': { primary: '#38bdf8', secondary: '#e0f2fe', glow: 'rgba(56, 189, 248, 0.85)' },
        '에스퍼': { primary: '#ec4899', secondary: '#fbcfe8', glow: 'rgba(236, 72, 153, 0.85)' },
        '벌레': { primary: '#84cc16', secondary: '#d9f99d', glow: 'rgba(132, 204, 22, 0.85)' },
        '바위': { primary: '#78716c', secondary: '#e7e5e4', glow: 'rgba(120, 113, 108, 0.85)' },
        '고스트': { primary: '#6366f1', secondary: '#c7d2fe', glow: 'rgba(99, 102, 241, 0.85)' },
        '드래곤': { primary: '#4338ca', secondary: '#a5b4fc', glow: 'rgba(67, 56, 202, 0.85)' },
        '악': { primary: '#334155', secondary: '#94a3b8', glow: 'rgba(51, 65, 85, 0.85)' },
        '강철': { primary: '#64748b', secondary: '#f8fafc', glow: 'rgba(100, 116, 139, 0.85)' },
        '페어리': { primary: '#f43f5e', secondary: '#fecdd3', glow: 'rgba(244, 63, 94, 0.85)' },
        '노말': { primary: '#cbd5e1', secondary: '#ffffff', glow: 'rgba(203, 213, 225, 0.85)' }
      };
      return colorMap[type] || { primary: '#00ffa3', secondary: '#ffffff', glow: 'rgba(0, 255, 163, 0.85)' };
    }

    // --- PokéRogue Authentic Move Animation Engine ---
    let pokerogueMoveAnims = null;
    const pokerogueSpritesheetCache = {};

    async function loadPokerogueMoveAnims() {
      if (pokerogueMoveAnims) return;
      try {
        const res = await fetch('./battle_anims/all_move_anims.json');
        if (res.ok) {
          pokerogueMoveAnims = await res.json();
          console.log('[PokéRogue] Loaded authentic move animation database:', Object.keys(pokerogueMoveAnims).length, 'moves');
        }
      } catch (e) {
        console.warn('Failed to load battle_anims/all_move_anims.json', e);
      }
    }

    function getPokerogueSpritesheet(name) {
      if (!name) return null;
      if (pokerogueSpritesheetCache[name]) return pokerogueSpritesheetCache[name];
      const img = new Image();
      img.src = './battle_anims/images/' + encodeURIComponent(name) + '.png';
      pokerogueSpritesheetCache[name] = img;
      return img;
    }

    async function playPokerogueMoveAnim(actor, moveName, hitResult = { hit: true, isCrit: false, typeMult: 1.0, finalDamage: 50 }, tint = null) {
      if (!pokerogueMoveAnims) {
        await loadPokerogueMoveAnims();
      }
      const animData = pokerogueMoveAnims ? pokerogueMoveAnims[moveName] : null;
      if (!animData) return false;

      const isStreamer = actor === 'streamer';
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
      const canvas = document.getElementById('pokeBattleVfxCanvas');
      if (!attackerSpr || !defenderSpr || !canvas) return false;

      const configs = Array.isArray(animData) ? animData : [animData];
      const hasSeparateOpp = configs.length > 1;
      const config = (hasSeparateOpp && !isStreamer) ? configs[1] : configs[0];
      if (!config || !config.frames || config.frames.length === 0) return false;

      const img = getPokerogueSpritesheet(config.graphic);
      if (!img) return false;
      if (!img.complete) {
        await new Promise(resolve => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      }
      if (!img.naturalWidth) return false;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.offsetWidth || 800;
      canvas.height = rect.height || canvas.offsetHeight || 320;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const atkRect = attackerSpr.getBoundingClientRect();
      const defRect = defenderSpr.getBoundingClientRect();
      const pUser = {
        x: atkRect.left - rect.left + atkRect.width / 2,
        y: atkRect.top - rect.top + atkRect.height / 2
      };
      const pTarget = {
        x: defRect.left - rect.left + defRect.width / 2,
        y: defRect.top - rect.top + defRect.height / 2
      };

      const canvasDx = pTarget.x - pUser.x;
      const canvasDy = pTarget.y - pUser.y;
      const canvasDist = Math.sqrt(canvasDx * canvasDx + canvasDy * canvasDy);
      const refDist = Math.sqrt(128 * 128 + 64 * 64);
      const arenaScale = Math.max(0.8, Math.min(2.0, canvasDist / refDist));

      const normalX = -canvasDy / (canvasDist || 1);
      const normalY = canvasDx / (canvasDist || 1);
      const flipHoriz = (!hasSeparateOpp && !isStreamer);

      // Play attacker motion
      attackerSpr.classList.add(isStreamer ? 'poke-lunge-right' : 'poke-lunge-left');
      setTimeout(() => attackerSpr.classList.remove('poke-lunge-right', 'poke-lunge-left'), 400);

      const frameDelay = 45;
      for (let f = 0; f < config.frames.length; f++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        attackerSpr.style.transform = '';
        defenderSpr.style.transform = '';

        const frameItems = config.frames[f];
        for (const item of frameItems) {
          const target = item.target;
          if (target === 0) {
            const nudgeX = flipHoriz ? -item.x : item.x;
            attackerSpr.style.transform = `translate(${nudgeX * 0.3}px, ${item.y * 0.3}px)`;
            continue;
          }
          if (target === 1) {
            const nudgeX = flipHoriz ? -item.x : item.x;
            defenderSpr.style.transform = `translate(${nudgeX * 0.3}px, ${item.y * 0.3}px)`;
            continue;
          }
          if (target === 2 && item.visible !== false) {
            let posX = pTarget.x;
            let posY = pTarget.y;
            const focus = item.focus;

            if (focus === 1) { // TARGET
              const offX = (item.x - 128) * (flipHoriz ? -1 : 1);
              const offY = (item.y + 64);
              posX = pTarget.x + offX * arenaScale;
              posY = pTarget.y + offY * arenaScale;
            } else if (focus === 2) { // USER
              const offX = item.x * (flipHoriz ? -1 : 1);
              posX = pUser.x + offX * arenaScale;
              posY = pUser.y + item.y * arenaScale;
            } else if (focus === 3) { // USER_TARGET
              const t = item.x / 128;
              const refPerp = item.y - (-64 * t);
              posX = pUser.x + t * canvasDx + normalX * refPerp * arenaScale;
              posY = pUser.y + t * canvasDy + normalY * refPerp * arenaScale;
            } else if (focus === 4) { // SCREEN
              const offX = item.x * (flipHoriz ? -1 : 1);
              posX = canvas.width / 2 + offX * arenaScale;
              posY = canvas.height / 2 + item.y * arenaScale;
            }

            const cellIdx = item.graphicFrame || 0;
            const col = cellIdx % 5;
            const row = Math.floor(cellIdx / 5);
            const srcX = col * 96;
            const srcY = row * 96;

            const zoomX = (item.zoomX != null ? item.zoomX : 100) / 100;
            const zoomY = (item.zoomY != null ? item.zoomY : 100) / 100;
            const mirrorSign = (item.mirror ? -1 : 1) * (flipHoriz ? -1 : 1);
            const scaleX = zoomX * mirrorSign * arenaScale;
            const scaleY = zoomY * arenaScale;
            const opacity = (item.opacity != null ? item.opacity : 255) / 255;
            const angle = (-(item.angle || 0)) * (Math.PI / 180) * (flipHoriz ? -1 : 1);

            ctx.save();
            ctx.translate(posX, posY);
            ctx.rotate(angle);
            ctx.scale(scaleX, scaleY);
            ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
            if (item.blendType === 1) {
              ctx.globalCompositeOperation = 'lighter';
            }
            ctx.drawImage(img, srcX, srcY, 96, 96, -48, -48, 96, 96);
            ctx.restore();
          }
        }

        await new Promise(r => setTimeout(r, frameDelay));
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      attackerSpr.style.transform = '';
      defenderSpr.style.transform = '';

      if (hitResult.hit) {
        playHitReactionSound(hitResult);
        if (hitResult.isCrit) {
          triggerWhiteFlash(320);
          triggerArenaCameraRumble(22, 650);
          defenderSpr.classList.add('poke-sprite-crit');
          setTimeout(() => defenderSpr.classList.remove('poke-sprite-crit'), 650);
        } else if (hitResult.typeMult >= 2.0) {
          triggerWhiteFlash(200);
          triggerArenaCameraRumble(16, 500);
          defenderSpr.classList.add('poke-hit-shake');
          setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 450);
        } else if (hitResult.typeMult < 1.0 && hitResult.typeMult > 0) {
          triggerArenaCameraRumble(6, 300);
          defenderSpr.classList.add('poke-hit-shake');
          setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 350);
        } else {
          triggerArenaCameraRumble(10, 400);
          defenderSpr.classList.add('poke-hit-shake');
          setTimeout(() => defenderSpr.classList.remove('poke-hit-shake'), 450);
        }
      }
      return true;
    }

    async function playPokeMoveAnimation(actor, move, hitResult = { hit: true, isCrit: false, typeMult: 1.0, finalDamage: 10 }) {
      // 1. Enhanced Miss Feedback: dodge animation, flee sound, floating badge & 1.2s dialogue pause
      if (!hitResult || !hitResult.hit) {
        playAuthenticPokeSound('flee.wav', 0.85);
        const isStreamer = actor === 'streamer';
        const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
        const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
        const canvas = document.getElementById('pokeBattleVfxCanvas');

        if (attackerSpr) {
          attackerSpr.classList.add('poke-hop');
          setTimeout(() => attackerSpr.classList.remove('poke-hop'), 400);
        }
        if (defenderSpr) {
          const dodgeClass = isStreamer ? 'poke-miss-dodge-right' : 'poke-miss-dodge-left';
          defenderSpr.classList.add(dodgeClass);
          setTimeout(() => defenderSpr.classList.remove(dodgeClass), 650);
        }
        if (canvas && defenderSpr) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width || canvas.offsetWidth || 800;
          canvas.height = rect.height || canvas.offsetHeight || 320;
          const defRect = defenderSpr.getBoundingClientRect();
          const targetX = defRect.left - rect.left + defRect.width / 2;
          const targetY = defRect.top - rect.top + 20;
          await renderPokeMissBadge(canvas, targetX, targetY);
        } else {
          await new Promise(r => setTimeout(r, 650));
        }
        await new Promise(r => setTimeout(r, 550));
        return;
      }

      // 2. EBDX Cinematic Special Routines: Earthquake, Psychic, Surf
      if (move.name === '지진') {
        await playEarthquakeCinematic(actor, hitResult);
        return;
      }
      if (move.name === '사이코키네시스') {
        await playPsychicCinematic(actor, hitResult);
        return;
      }
      if (move.name === '파도타기') {
        await playSurfCinematic(actor, hitResult);
        return;
      }

      // 3. Play Authentic Move Cast Sound
      const castSfx = getMoveSoundFilename(move.name, move.category, move.type);
      playAuthenticPokeSound(castSfx);

      const tint = getPokeTypeAtmosphereTint(move.type, move.name);

      // 4. Prioritize authentic PokéRogue 4th/5th gen sprite animation
      const prSuccess = await playPokerogueMoveAnim(actor, move.name, hitResult, tint);
      if (prSuccess) {
        return;
      }

      // 2. Fallback to procedural Canvas VFX

      const isStreamer = actor === 'streamer';
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');
      const arenaBox = document.getElementById('pokeArenaContainer');
      const canvas = document.getElementById('pokeBattleVfxCanvas');

      if (!attackerSpr || !defenderSpr || !canvas) {
        return;
      }

      const colors = getPokeTypeVfxColors(move.type);
      const motionType = getPokeMoveMotionType(move);

      // Coordinate alignment
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || canvas.offsetWidth || 800;
      canvas.height = rect.height || canvas.offsetHeight || 320;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const atkRect = attackerSpr.getBoundingClientRect();
      const defRect = defenderSpr.getBoundingClientRect();
      const p1 = {
        x: atkRect.left - rect.left + atkRect.width / 2,
        y: atkRect.top - rect.top + atkRect.height / 2
      };
      const p2 = {
        x: defRect.left - rect.left + defRect.width / 2,
        y: defRect.top - rect.top + defRect.height / 2
      };

      // Attacker sprite motion
      const isLunge = ['fist', 'bite', 'rush_fire', 'rush_electric', 'rush_flying', 'rush_water', 'heavy_tackle', 'outrage', 'dark_strike', 'slash'].includes(motionType);
      if (isLunge) {
        attackerSpr.classList.add(isStreamer ? 'poke-lunge-right' : 'poke-lunge-left');
        setTimeout(() => attackerSpr.classList.remove('poke-lunge-right', 'poke-lunge-left'), 480);
      } else {
        attackerSpr.classList.add('poke-hop');
        setTimeout(() => attackerSpr.classList.remove('poke-hop'), 480);
      }

      // If attack misses
      if (!hitResult.hit) {
        playBattleSoundFx('miss');
        await new Promise(r => setTimeout(r, 450));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      try {
        // --- 1. BUFF (칼춤, 용의춤, 나비춤 등) ---
        if (motionType === 'buff') {
          playBattleSoundFx('buff');
          const startTime = performance.now();
          const duration = 600;
          const sparkles = Array.from({ length: 26 }, () => ({
            x: p1.x + (Math.random() - 0.5) * 80,
            y: p1.y + 40 - Math.random() * 20,
            speedY: 1.2 + Math.random() * 2.0,
            speedX: (Math.random() - 0.5) * 0.8,
            size: 3 + Math.random() * 4,
            life: 0,
            maxLife: 300 + Math.random() * 280
          }));

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderBuff(t) {
              const elapsed = t - startTime;
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const ringAlpha = Math.max(0, Math.min(1, Math.sin((elapsed / duration) * Math.PI) * 0.75));
              ctx.save();
              ctx.strokeStyle = colors.primary;
              ctx.lineWidth = 4;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 15;
              ctx.globalAlpha = ringAlpha;
              ctx.beginPath();
              ctx.ellipse(p1.x, p1.y + 35, 45 + elapsed * 0.05, 18, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();

              sparkles.forEach(s => {
                s.life += 16;
                s.y -= s.speedY;
                s.x += s.speedX;
                const alpha = Math.max(0, Math.min(1, 1 - (s.life / s.maxLife)));
                if (alpha > 0) {
                  ctx.save();
                  ctx.globalAlpha = alpha;
                  ctx.fillStyle = colors.secondary;
                  ctx.shadowColor = colors.glow;
                  ctx.shadowBlur = 10;
                  ctx.beginPath();
                  ctx.arc(s.x, s.y, Math.max(0.1, s.size), 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              });

              if (elapsed < duration) requestAnimationFrame(renderBuff);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderBuff);
          });
          return;
        }

        // --- 2. AILMENT (도깨비불, 맹독, 전기자석파, 길동무) ---
        if (motionType === 'ailment') {
          playBattleSoundFx('ailment');
          const startTime = performance.now();
          const duration = 550;
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderAilment(t) {
              const elapsed = t - startTime;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              const alpha = Math.max(0, Math.min(1, Math.sin(progress * Math.PI) * 0.85));

              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.strokeStyle = colors.primary;
              ctx.lineWidth = 3;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 12;
              for (let i = 0; i < 3; i++) {
                const r = Math.max(5, 30 + i * 15 - (progress * 25));
                ctx.beginPath();
                ctx.ellipse(p2.x, p2.y + Math.sin(progress * 8 + i) * 10, r, Math.max(3, r * 0.5), 0, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.restore();

              if (elapsed < duration) requestAnimationFrame(renderAilment);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderAilment);
          });
          return;
        }

        // --- 3. FIRE BLAST (불대문자: 거대한 大자 화염성 회전 비행 & 폭발) ---
        if (motionType === 'fire_blast') {
          playBattleSoundFx('projectile');
          const duration = 520;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderFireBlast(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const curX = p1.x + (p2.x - p1.x) * progress;
              const curY = p1.y + (p2.y - p1.y) * progress - Math.sin(progress * Math.PI) * 35;
              const scale = 0.6 + progress * 0.8;
              const rot = progress * Math.PI * 2;

              ctx.save();
              ctx.translate(curX, curY);
              ctx.rotate(rot);
              ctx.scale(scale, scale);
              ctx.shadowColor = '#ff4d00';
              ctx.shadowBlur = 24;

              // Draw '大' star fiery limbs
              const arms = [
                { x: 0, y: -26 },
                { x: 0, y: 0 },
                { x: -28, y: -4 },
                { x: 28, y: -4 },
                { x: -22, y: 26 },
                { x: 22, y: 26 }
              ];

              ctx.strokeStyle = '#ff3300';
              ctx.lineWidth = 12;
              ctx.lineCap = 'round';
              ctx.beginPath();
              // Top to center
              ctx.moveTo(0, -26); ctx.lineTo(0, 0);
              // Horizontal bar
              ctx.moveTo(-28, -4); ctx.lineTo(28, -4);
              // Bottom left leg
              ctx.moveTo(0, 0); ctx.lineTo(-22, 26);
              // Bottom right leg
              ctx.moveTo(0, 0); ctx.lineTo(22, 26);
              ctx.stroke();

              // Inner yellow hot core
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 5;
              ctx.stroke();

              arms.forEach(a => {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(a.x, a.y, 5, 0, Math.PI * 2);
                ctx.fill();
              });

              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderFireBlast);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderFireBlast);
          });
        }

        // --- 4. SURF (파도타기: 거대한 청록빛 해일 파도가 솟구쳐 덮침) ---
        else if (motionType === 'surf') {
          playBattleSoundFx('earthquake');
          const duration = 540;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderSurf(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const waveX = p1.x + (p2.x - p1.x) * progress;
              const waveH = Math.sin(progress * Math.PI) * 90;

              ctx.save();
              ctx.shadowColor = '#0ea5e9';
              ctx.shadowBlur = 20;

              // Wave body gradient
              const grad = ctx.createLinearGradient(waveX - 60, p1.y, waveX + 40, p1.y);
              grad.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
              grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.85)');
              grad.addColorStop(1, 'rgba(125, 211, 252, 0.95)');

              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(waveX - 70, p2.y + 40);
              ctx.quadraticCurveTo(waveX, p2.y + 40 - waveH * 1.3, waveX + 35, p2.y + 40 - waveH * 0.9);
              ctx.quadraticCurveTo(waveX + 10, p2.y + 40 - waveH * 0.3, waveX + 35, p2.y + 40);
              ctx.closePath();
              ctx.fill();

              // Foaming white crest
              ctx.fillStyle = '#ffffff';
              for (let i = 0; i < 5; i++) {
                const fx = waveX + (i - 2) * 12;
                const fy = p2.y + 40 - waveH * 1.1 + Math.sin(elapsed * 0.03 + i) * 6;
                ctx.beginPath();
                ctx.arc(fx, fy, Math.max(0.1, 7 - i), 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderSurf);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderSurf);
          });
        }

        // --- 5. FIST (인파이트, 드레인펀치, 불릿펀치, 코멧펀치: 다중 고속 연타 펀치) ---
        else if (motionType === 'fist') {
          playBattleSoundFx('hit_heavy');
          const duration = 460;
          const startTime = performance.now();
          const punches = [
            { t: 0.1, dx: -18, dy: -12, color: colors.primary },
            { t: 0.35, dx: 16, dy: 10, color: colors.secondary },
            { t: 0.6, dx: -8, dy: 14, color: colors.primary },
            { t: 0.82, dx: 14, dy: -14, color: '#ffffff' }
          ];
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderFist(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              punches.forEach(p => {
                if (progress >= p.t && progress <= p.t + 0.28) {
                  const subP = (progress - p.t) / 0.28;
                  const alpha = Math.max(0, Math.min(1, Math.sin(subP * Math.PI)));
                  const r = 16 + subP * 28;

                  ctx.save();
                  ctx.globalAlpha = alpha;
                  ctx.strokeStyle = p.color;
                  ctx.lineWidth = 4;
                  ctx.shadowColor = colors.glow;
                  ctx.shadowBlur = 18;
                  ctx.beginPath();
                  ctx.arc(p2.x + p.dx, p2.y + p.dy, r, 0, Math.PI * 2);
                  ctx.stroke();

                  // Punch impact cross lines
                  ctx.beginPath();
                  ctx.moveTo(p2.x + p.dx - r * 0.8, p2.y + p.dy);
                  ctx.lineTo(p2.x + p.dx + r * 0.8, p2.y + p.dy);
                  ctx.moveTo(p2.x + p.dx, p2.y + p.dy - r * 0.8);
                  ctx.lineTo(p2.x + p.dx, p2.y + p.dy + r * 0.8);
                  ctx.stroke();
                  ctx.restore();
                }
              });

              if (progress < 1) requestAnimationFrame(renderFist);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderFist);
          });
        }

        // --- 6. BITE (깨물어부수기: 상하에서 닫히는 보라빛 암흑 송곳니 턱) ---
        else if (motionType === 'bite') {
          playBattleSoundFx('hit_heavy');
          const duration = 420;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderBite(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const closeP = progress < 0.6 ? (progress / 0.6) : 1;
              const gap = (1 - closeP) * 45;
              const alpha = progress < 0.6 ? 1 : Math.max(0, 1 - (progress - 0.6) / 0.4);

              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.fillStyle = '#a855f7';
              ctx.shadowColor = '#6b21a8';
              ctx.shadowBlur = 20;

              // Top jaw teeth
              for (let i = -2; i <= 2; i++) {
                const tx = p2.x + i * 14;
                const ty = p2.y - gap - 6;
                ctx.beginPath();
                ctx.moveTo(tx - 6, ty - 18);
                ctx.lineTo(tx + 6, ty - 18);
                ctx.lineTo(tx, ty);
                ctx.closePath();
                ctx.fill();
              }

              // Bottom jaw teeth
              for (let i = -2; i <= 2; i++) {
                const tx = p2.x + i * 14;
                const ty = p2.y + gap + 6;
                ctx.beginPath();
                ctx.moveTo(tx - 6, ty + 18);
                ctx.lineTo(tx + 6, ty + 18);
                ctx.lineTo(tx, ty);
                ctx.closePath();
                ctx.fill();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderBite);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderBite);
          });
        }

        // --- 7. RUSH FIRE / ELECTRIC / FLYING / WATER (돌진기들) ---
        else if (motionType === 'rush_fire' || motionType === 'rush_electric' || motionType === 'rush_flying' || motionType === 'rush_water') {
          playBattleSoundFx(motionType === 'rush_electric' ? 'beam' : 'earthquake');
          const duration = 380;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderRush(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const curX = p1.x + (p2.x - p1.x) * progress;
              const curY = p1.y + (p2.y - p1.y) * progress;

              ctx.save();
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 24;

              // Aura sphere
              ctx.fillStyle = colors.primary;
              ctx.beginPath();
              ctx.arc(curX, curY, 26 + Math.sin(progress * 12) * 4, 0, Math.PI * 2);
              ctx.fill();

              // Inner core
              ctx.fillStyle = colors.secondary;
              ctx.beginPath();
              ctx.arc(curX, curY, 14, 0, Math.PI * 2);
              ctx.fill();

              // Trailing particles
              ctx.strokeStyle = colors.secondary;
              ctx.lineWidth = 3;
              for (let i = 0; i < 4; i++) {
                const ang = Math.PI + (Math.random() - 0.5) * 1.5;
                const len = 20 + Math.random() * 30;
                ctx.beginPath();
                ctx.moveTo(curX, curY);
                ctx.lineTo(curX + Math.cos(ang) * len, curY + Math.sin(ang) * len);
                ctx.stroke();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderRush);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderRush);
          });
        }

        // --- 8. HEAVY TACKLE (10만마력, 몸통박치기, 이판사판태클, 사념의박치기 등: 소닉붐 충격파) ---
        else if (motionType === 'heavy_tackle') {
          playBattleSoundFx('hit_heavy');
          const duration = 340;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderTackle(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const curX = p1.x + (p2.x - p1.x) * progress;
              const curY = p1.y + (p2.y - p1.y) * progress;

              ctx.save();
              ctx.strokeStyle = colors.primary;
              ctx.lineWidth = 4;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 18;
              ctx.globalAlpha = Math.max(0, 1 - progress * 0.4);

              // Sonic rings expanding behind attacker toward defender
              for (let r = 1; r <= 3; r++) {
                const ringProgress = Math.max(0, progress - r * 0.15);
                if (ringProgress > 0) {
                  ctx.beginPath();
                  ctx.ellipse(p1.x + (p2.x - p1.x) * ringProgress, p1.y + (p2.y - p1.y) * ringProgress, 18 * r, 28 * r, 0, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderTackle);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderTackle);
          });
        }

        // --- 9. ICICLE (고드름떨구기, 얼음뭉치: 상공에서 떨어지는 대형 고드름 낙하) ---
        else if (motionType === 'icicle') {
          playBattleSoundFx('slash');
          const duration = 440;
          const startTime = performance.now();
          const icicles = [
            { x: p2.x - 22, startT: 0 },
            { x: p2.x + 18, startT: 0.15 },
            { x: p2.x - 4, startT: 0.3 }
          ];
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderIcicles(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              icicles.forEach(ic => {
                if (progress >= ic.startT) {
                  const subP = Math.min(1, (progress - ic.startT) / 0.45);
                  const curY = (p2.y - 140) + 140 * subP;

                  ctx.save();
                  ctx.fillStyle = '#67e8f9';
                  ctx.shadowColor = '#06b6d4';
                  ctx.shadowBlur = 15;
                  ctx.beginPath();
                  ctx.moveTo(ic.x - 7, curY - 35);
                  ctx.lineTo(ic.x + 7, curY - 35);
                  ctx.lineTo(ic.x, curY);
                  ctx.closePath();
                  ctx.fill();

                  // Inner ice shine
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.moveTo(ic.x - 2, curY - 30);
                  ctx.lineTo(ic.x + 2, curY - 30);
                  ctx.lineTo(ic.x, curY - 5);
                  ctx.closePath();
                  ctx.fill();
                  ctx.restore();
                }
              });

              if (progress < 1) requestAnimationFrame(renderIcicles);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderIcicles);
          });
        }

        // --- 10. POISON JAB (독찌르기, 더스트슈트: 독침 관통 및 맹독 기포 분출) ---
        else if (motionType === 'poison_jab') {
          playBattleSoundFx('slash');
          const duration = 380;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderPoisonJab(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.shadowColor = '#a855f7';
              ctx.shadowBlur = 20;

              // Venom stabs
              for (let i = 0; i < 3; i++) {
                const stabP = Math.sin((progress + i * 0.2) * Math.PI);
                ctx.strokeStyle = i % 2 === 0 ? '#9333ea' : '#c084fc';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(p1.x + (p2.x - p1.x) * 0.7, p2.y + (i - 1) * 16);
                ctx.lineTo(p2.x + 25 * stabP, p2.y + (i - 1) * 16);
                ctx.stroke();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderPoisonJab);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderPoisonJab);
          });
        }

        // --- 11. FAIRY PLAY (치근거리기: 핑크빛 만화풍 난투 구름 및 별/하트 이펙트) ---
        else if (motionType === 'fairy_play') {
          playBattleSoundFx('hit_normal');
          const duration = 440;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderFairyPlay(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 18;

              // Cartoon dust clouds
              for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + progress * 4;
                const dist = 24 + Math.sin(progress * 10 + i) * 12;
                ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 205, 211, 0.7)' : 'rgba(244, 63, 94, 0.75)';
                ctx.beginPath();
                ctx.arc(p2.x + Math.cos(ang) * dist, p2.y + Math.sin(ang) * dist, Math.max(0.1, 14 - progress * 4), 0, Math.PI * 2);
                ctx.fill();
              }

              // Floating starbursts
              ctx.fillStyle = '#ffd700';
              for (let j = 0; j < 4; j++) {
                const sx = p2.x + Math.sin(progress * 8 + j) * 35;
                const sy = p2.y + Math.cos(progress * 8 + j) * 30;
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderFairyPlay);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderFairyPlay);
          });
        }

        // --- 12. OUTRAGE (역린: 핏빛 용의 분노 오라와 3연속 붉은 참격) ---
        else if (motionType === 'outrage') {
          playBattleSoundFx('slash');
          const duration = 440;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderOutrage(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.strokeStyle = '#dc2626';
              ctx.lineWidth = 6;
              ctx.lineCap = 'round';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 24;

              // 3 brutal staggered bloody claw slashes
              for (let i = 0; i < 3; i++) {
                const subP = Math.min(1, Math.max(0, (progress - i * 0.2) / 0.4));
                if (subP > 0 && subP < 1) {
                  const len = Math.sin(subP * Math.PI) * 65;
                  const yOff = (i - 1) * 18;
                  ctx.beginPath();
                  ctx.moveTo(p2.x - len * 0.7, p2.y + yOff - len * 0.7);
                  ctx.lineTo(p2.x + len * 0.7, p2.y + yOff + len * 0.7);
                  ctx.stroke();
                }
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderOutrage);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderOutrage);
          });
        }

        // --- 13. DARK STRIKE (기습, 탁쳐서떨구기: 암흑 그림자 참격) ---
        else if (motionType === 'dark_strike') {
          playBattleSoundFx('slash');
          const duration = 340;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderDarkStrike(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const slashLen = Math.sin(progress * Math.PI) * 80;
              ctx.save();
              ctx.strokeStyle = '#3b0764';
              ctx.lineWidth = 7;
              ctx.shadowColor = '#a855f7';
              ctx.shadowBlur = 25;
              ctx.beginPath();
              ctx.moveTo(p2.x + slashLen * 0.7, p2.y - slashLen * 0.7);
              ctx.lineTo(p2.x - slashLen * 0.7, p2.y + slashLen * 0.7);
              ctx.stroke();

              // Inner neon violet edge
              ctx.strokeStyle = '#e9d5ff';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderDarkStrike);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderDarkStrike);
          });
        }

        // --- 14. SONIC (하이퍼보이스, 벌레의야단법석: 동심원 진동 음파) ---
        else if (motionType === 'sonic') {
          playBattleSoundFx('beam');
          const duration = 460;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderSonic(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.strokeStyle = colors.primary;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 18;

              for (let i = 0; i < 4; i++) {
                const ringP = Math.max(0, progress - i * 0.18);
                if (ringP > 0) {
                  const ringX = p1.x + (p2.x - p1.x) * ringP;
                  const ringY = p1.y + (p2.y - p1.y) * ringP;
                  ctx.lineWidth = Math.max(1, (1 - ringP) * 5);
                  ctx.globalAlpha = Math.max(0, 1 - ringP);
                  ctx.beginPath();
                  ctx.arc(ringX, ringY, 18 + ringP * 45, 0, Math.PI * 2);
                  ctx.stroke();
                }
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderSonic);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderSonic);
          });
        }

        // --- 15. PSYCHIC (사이코키네시스, 사이코쇼크: 시공간 왜곡 사이키델릭 소용돌이) ---
        else if (motionType === 'psychic') {
          playBattleSoundFx('beam');
          const duration = 480;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderPsychic(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.shadowColor = '#ec4899';
              ctx.shadowBlur = 20;

              for (let i = 0; i < 3; i++) {
                const rot = progress * Math.PI * 3 + i * (Math.PI / 3);
                const rx = 35 + Math.sin(progress * Math.PI) * 20;
                const ry = 18 + Math.sin(progress * Math.PI) * 10;
                ctx.save();
                ctx.translate(p2.x, p2.y);
                ctx.rotate(rot);
                ctx.strokeStyle = i % 2 === 0 ? '#ec4899' : '#f472b6';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderPsychic);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderPsychic);
          });
        }

        // --- 16. MOONFORCE (문포스, 매지컬샤인: 천상의 보름달 및 무지개 프리즘 광선) ---
        else if (motionType === 'moonforce') {
          playBattleSoundFx('beam');
          const duration = 480;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderMoonforce(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              // Moon disc above attacker
              ctx.save();
              ctx.shadowColor = '#fbcfe8';
              ctx.shadowBlur = 25;
              ctx.fillStyle = 'rgba(255, 241, 242, 0.9)';
              ctx.beginPath();
              ctx.arc(p1.x, p1.y - 45, 24, 0, Math.PI * 2);
              ctx.fill();

              // Radiant rainbow starbeam
              if (progress > 0.2) {
                const beamP = (progress - 0.2) / 0.8;
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = Math.max(1, Math.sin(beamP * Math.PI) * 18);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y - 45);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1, Math.sin(beamP * Math.PI) * 6);
                ctx.stroke();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderMoonforce);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderMoonforce);
          });
        }

        // --- 17. DRAIN (기가드레인: 적에게서 에너지를 흡수하는 녹색 나선) ---
        else if (motionType === 'drain') {
          playBattleSoundFx('buff');
          const duration = 500;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderDrain(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.shadowColor = '#22c55e';
              ctx.shadowBlur = 15;
              ctx.fillStyle = '#4ade80';

              for (let i = 0; i < 5; i++) {
                const orbP = Math.min(1, Math.max(0, (progress - i * 0.12) / 0.6));
                if (orbP > 0 && orbP < 1) {
                  // Flows from defender (p2) to attacker (p1)
                  const ox = p2.x + (p1.x - p2.x) * orbP;
                  const oy = p2.y + (p1.y - p2.y) * orbP + Math.sin(orbP * Math.PI * 4 + i) * 20;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 6, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderDrain);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderDrain);
          });
        }

        // --- 18. GEM (파워젬: 보석 다각 파편 회전 및 폭발) ---
        else if (motionType === 'gem') {
          playBattleSoundFx('projectile');
          const duration = 440;
          const startTime = performance.now();
          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderGem(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              ctx.save();
              ctx.shadowColor = '#eab308';
              ctx.shadowBlur = 18;

              for (let i = 0; i < 5; i++) {
                const ang = (i / 5) * Math.PI * 2 + progress * 6;
                const dist = (1 - progress) * 50;
                const gx = p2.x + Math.cos(ang) * dist;
                const gy = p2.y + Math.sin(ang) * dist;

                ctx.fillStyle = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i];
                ctx.beginPath();
                ctx.arc(gx, gy, 7, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderGem);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderGem);
          });
        }

        // --- 19. CONTINUOUS STREAM (화염방사, 하이드로펌프, 눈보라, 오물폭탄: 안전 알파 클램핑 적용) ---
        else if (motionType === 'stream') {
          playBattleSoundFx('projectile');
          const duration = 480;
          const startTime = performance.now();
          const droplets = [];

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderStream(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));

              if (progress < 0.8) {
                for (let i = 0; i < 3; i++) {
                  droplets.push({
                    prog: 0,
                    speed: 0.035 + Math.random() * 0.02,
                    spreadY: (Math.random() - 0.5) * 40,
                    size: 6 + Math.random() * 7
                  });
                }
              }

              ctx.clearRect(0, 0, canvas.width, canvas.height);

              droplets.forEach(d => {
                d.prog += d.speed;
                if (d.prog <= 1) {
                  const dx = p1.x + (p2.x - p1.x) * d.prog;
                  const dy = p1.y + (p2.y - p1.y) * d.prog + d.spreadY * Math.sin(Math.max(0, Math.min(1, d.prog)) * Math.PI);
                  const safeAlpha = Math.max(0, Math.min(1, Math.sin(Math.max(0, Math.min(1, d.prog)) * Math.PI) * 0.9));
                  ctx.save();
                  ctx.globalAlpha = safeAlpha;
                  ctx.fillStyle = colors.primary;
                  ctx.shadowColor = colors.glow;
                  ctx.shadowBlur = 12;
                  ctx.beginPath();
                  ctx.arc(dx, dy, Math.max(0.1, d.size), 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              });

              if (elapsed < duration) requestAnimationFrame(renderStream);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderStream);
          });
        }

        // --- 20. BEAM / CANNON (10만볼트, 번개, 냉동빔, 솔라빔, 러스터캐논 등: 고출력 광선) ---
        else if (motionType === 'beam') {
          playBattleSoundFx('beam');
          const duration = 440;
          const startTime = performance.now();

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderBeam(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const pulse = Math.sin(progress * Math.PI);
              const beamWidth = 24 * pulse;

              ctx.save();
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 25;

              // Outer beam
              ctx.strokeStyle = colors.primary;
              ctx.lineWidth = Math.max(1, beamWidth);
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();

              // Inner laser core
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = Math.max(1, beamWidth * 0.4);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();

              // Electric zigzag arcs
              for (let j = 0; j < 2; j++) {
                ctx.strokeStyle = colors.secondary;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                const segments = 6;
                for (let s = 1; s < segments; s++) {
                  const segP = s / segments;
                  const sx = p1.x + (p2.x - p1.x) * segP + (Math.random() - 0.5) * 20;
                  const sy = p1.y + (p2.y - p1.y) * segP + (Math.random() - 0.5) * 20;
                  ctx.lineTo(sx, sy);
                }
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
              ctx.restore();

              if (elapsed < duration) requestAnimationFrame(renderBeam);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderBeam);
          });
        }

        // --- 21. GROUND (지진, 스톤샤워, 대지의힘: 대지 충격파 및 암석 기둥) ---
        else if (motionType === 'ground') {
          playBattleSoundFx('earthquake');
          const duration = 500;
          const startTime = performance.now();

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderGround(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const curWaveX = p1.x + (p2.x - p1.x) * progress;
              const curWaveY = p1.y + 40 + (p2.y - p1.y) * progress;

              ctx.save();
              ctx.strokeStyle = colors.primary;
              ctx.lineWidth = 4;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 15;
              ctx.globalAlpha = Math.max(0, Math.min(1, Math.sin(progress * Math.PI)));
              ctx.beginPath();
              ctx.ellipse(curWaveX, curWaveY, Math.max(1, 35 * progress), Math.max(1, 12 * progress), 0, 0, Math.PI * 2);
              ctx.stroke();

              // Earth pillars erupting under defender
              if (progress > 0.45) {
                const rockP = (progress - 0.45) / 0.55;
                ctx.fillStyle = colors.secondary;
                for (let r = 0; r < 4; r++) {
                  const rx = p2.x + (r - 1.5) * 16;
                  const ry = p2.y + 40;
                  const h = Math.sin(rockP * Math.PI) * (30 + r * 6);
                  ctx.beginPath();
                  ctx.moveTo(rx - 8, ry);
                  ctx.lineTo(rx, ry - h);
                  ctx.lineTo(rx + 8, ry);
                  ctx.closePath();
                  ctx.fill();
                }
              }
              ctx.restore();

              if (elapsed < duration) requestAnimationFrame(renderGround);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderGround);
          });
        }

        // --- 22. SLASH (스톤에지, 시저크로스, 섀도크루, 리프블레이드, 에어슬래시 등: 쾌속 참격) ---
        else if (motionType === 'slash') {
          playBattleSoundFx('slash');
          const duration = 280;
          const startTime = performance.now();

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderSlash(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              const slashLen = 70 * Math.sin(progress * Math.PI);
              ctx.save();
              ctx.strokeStyle = colors.primary;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 20;
              ctx.lineWidth = 5;
              ctx.lineCap = 'round';

              // Slash 1: Diagonal \
              ctx.beginPath();
              ctx.moveTo(p2.x - slashLen * 0.7, p2.y - slashLen * 0.7);
              ctx.lineTo(p2.x + slashLen * 0.7, p2.y + slashLen * 0.7);
              ctx.stroke();

              // Slash 2: Diagonal /
              if (progress > 0.2) {
                ctx.strokeStyle = colors.secondary;
                ctx.beginPath();
                ctx.moveTo(p2.x + slashLen * 0.7, p2.y - slashLen * 0.7);
                ctx.lineTo(p2.x - slashLen * 0.7, p2.y + slashLen * 0.7);
                ctx.stroke();
              }
              ctx.restore();

              if (elapsed < duration) requestAnimationFrame(renderSlash);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderSlash);
          });
        }

        // --- 23. PROJECTILE (에너지볼, 섀도볼: 궤적 투사체) ---
        else {
          playBattleSoundFx('projectile');
          const duration = 360;
          const startTime = performance.now();
          const trail = [];

          await new Promise(resolve => {
            let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, duration + 80);
            function renderProj(t) {
              const elapsed = t - startTime;
              const progress = Math.min(1, Math.max(0, elapsed / duration));
              const easeP = progress * progress;
              const curX = p1.x + (p2.x - p1.x) * easeP;
              const curY = p1.y + (p2.y - p1.y) * easeP - Math.sin(progress * Math.PI) * 45;

              trail.push({ x: curX, y: curY, alpha: 1, radius: 10 + Math.random() * 4 });
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              trail.forEach(pt => {
                pt.alpha *= 0.82;
                if (pt.alpha > 0.05) {
                  ctx.save();
                  ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha * 0.7));
                  ctx.fillStyle = colors.secondary;
                  ctx.shadowColor = colors.glow;
                  ctx.shadowBlur = 12;
                  ctx.beginPath();
                  ctx.arc(pt.x, pt.y, Math.max(0.1, pt.radius * pt.alpha), 0, Math.PI * 2);
                  ctx.fill();
                  ctx.restore();
                }
              });

              ctx.save();
              ctx.fillStyle = colors.primary;
              ctx.shadowColor = colors.glow;
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(curX, curY, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(curX, curY, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              if (progress < 1) requestAnimationFrame(renderProj);
              else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
            }
            requestAnimationFrame(renderProj);
          });
        }
      } catch (err) {
        console.error('Error during move VFX rendering:', err);
      } finally {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // ==========================================
      // UNIVERSAL IMPACT EVENT (Sparks, Shake, Audio)
      // ==========================================
      const isHeavy = hitResult.isCrit || hitResult.typeMult >= 2.0 || hitResult.finalDamage >= 60;
      playHitReactionSound(hitResult);
      if (hitResult.isCrit) {
        triggerWhiteFlash(320);
        triggerArenaCameraRumble(22, 650);
      } else if (hitResult.typeMult >= 2.0) {
        triggerWhiteFlash(200);
        triggerArenaCameraRumble(16, 500);
      } else {
        triggerArenaCameraRumble(10, 400);
      }

      // Defender Sprite Hit Reaction
      defenderSpr.classList.remove('poke-sprite-damaged', 'poke-sprite-crit');
      void defenderSpr.offsetWidth;
      defenderSpr.classList.add(hitResult.isCrit ? 'poke-sprite-crit' : 'poke-sprite-damaged');
      setTimeout(() => {
        defenderSpr.classList.remove('poke-sprite-damaged', 'poke-sprite-crit');
      }, 550);

      // Arena Screen Shake
      if (arenaBox) {
        arenaBox.classList.remove('arena-shake-light', 'arena-shake-heavy');
        void arenaBox.offsetWidth;
        arenaBox.classList.add(isHeavy ? 'arena-shake-heavy' : 'arena-shake-light');
        setTimeout(() => {
          arenaBox.classList.remove('arena-shake-light', 'arena-shake-heavy');
        }, isHeavy ? 600 : 400);
      }

      // Explosive Hit Sparks
      const sparkDuration = 320;
      const sparkStart = performance.now();
      const sparkCount = isHeavy ? 28 : 18;
      const sparks = Array.from({ length: sparkCount }, () => {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2.5 + Math.random() * (isHeavy ? 6.5 : 4.0);
        return {
          x: p2.x,
          y: p2.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.4 ? colors.primary : colors.secondary
        };
      });

      await new Promise(resolve => {
        let doneTimer = setTimeout(() => { ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }, sparkDuration + 80);
        function renderSparks(t) {
          const elapsed = t - sparkStart;
          const progress = Math.min(1, Math.max(0, elapsed / sparkDuration));
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const ringR = Math.max(0.1, progress * (isHeavy ? 60 : 40));
          ctx.save();
          ctx.strokeStyle = colors.primary;
          ctx.shadowColor = colors.glow;
          ctx.shadowBlur = 15;
          ctx.lineWidth = Math.max(1, (1 - progress) * 6);
          ctx.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          sparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            const curR = Math.max(0.1, s.size * (1 - progress * 0.7));
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, 1 - progress));
            ctx.fillStyle = s.color;
            ctx.shadowColor = colors.glow;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(s.x, s.y, curR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          if (elapsed < sparkDuration) requestAnimationFrame(renderSparks);
          else { clearTimeout(doneTimer); ctx.clearRect(0, 0, canvas.width, canvas.height); resolve(); }
        }
        requestAnimationFrame(renderSparks);
      });
    }


    const pokeMoveDatabase = {
      "에너지볼": {
            "name": "에너지볼",
            "type": "풀",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "솔라빔": {
            "name": "솔라빔",
            "type": "풀",
            "category": "특수",
            "power": 120,
            "accuracy": 100
      },
      "오물폭탄": {
            "name": "오물폭탄",
            "type": "독",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "기가드레인": {
            "name": "기가드레인",
            "type": "풀",
            "category": "특수",
            "power": 75,
            "accuracy": 100
      },
      "화염방사": {
            "name": "화염방사",
            "type": "불꽃",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "불대문자": {
            "name": "불대문자",
            "type": "불꽃",
            "category": "특수",
            "power": 110,
            "accuracy": 100
      },
      "에어슬래시": {
            "name": "에어슬래시",
            "type": "비행",
            "category": "특수",
            "power": 75,
            "accuracy": 100
      },
      "도깨비불": {
            "name": "도깨비불",
            "type": "불꽃",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "파도타기": {
            "name": "파도타기",
            "type": "물",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "하이드로펌프": {
            "name": "하이드로펌프",
            "type": "물",
            "category": "특수",
            "power": 110,
            "accuracy": 100
      },
      "폭포오르기": {
            "name": "폭포오르기",
            "type": "물",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "아쿠아브레이크": {
            "name": "아쿠아브레이크",
            "type": "물",
            "category": "물리",
            "power": 85,
            "accuracy": 100
      },
      "벌레의야단법석": {
            "name": "벌레의야단법석",
            "type": "벌레",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "시저크로스": {
            "name": "시저크로스",
            "type": "벌레",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "나비춤": {
            "name": "나비춤",
            "type": "벌레",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "누르기": {
            "name": "누르기",
            "type": "노말",
            "category": "물리",
            "power": 85,
            "accuracy": 100
      },
      "이판사판태클": {
            "name": "이판사판태클",
            "type": "노말",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "칼춤": {
            "name": "칼춤",
            "type": "노말",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "독찌르기": {
            "name": "독찌르기",
            "type": "독",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "더스트슈트": {
            "name": "더스트슈트",
            "type": "독",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "맹독": {
            "name": "맹독",
            "type": "독",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "10만볼트": {
            "name": "10만볼트",
            "type": "전기",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "번개": {
            "name": "번개",
            "type": "전기",
            "category": "특수",
            "power": 110,
            "accuracy": 100
      },
      "볼트태클": {
            "name": "볼트태클",
            "type": "전기",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "전기자석파": {
            "name": "전기자석파",
            "type": "전기",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "사이코키네시스": {
            "name": "사이코키네시스",
            "type": "에스퍼",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "문포스": {
            "name": "문포스",
            "type": "페어리",
            "category": "특수",
            "power": 95,
            "accuracy": 100
      },
      "치근거리기": {
            "name": "치근거리기",
            "type": "페어리",
            "category": "물리",
            "power": 90,
            "accuracy": 100
      },
      "매지컬샤인": {
            "name": "매지컬샤인",
            "type": "페어리",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "달의불빛": {
            "name": "달의불빛",
            "type": "페어리",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "플레어드라이브": {
            "name": "플레어드라이브",
            "type": "불꽃",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "냉동빔": {
            "name": "냉동빔",
            "type": "얼음",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "명상": {
            "name": "명상",
            "type": "에스퍼",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "스톤에지": {
            "name": "스톤에지",
            "type": "바위",
            "category": "물리",
            "power": 100,
            "accuracy": 100
      },
      "인파이트": {
            "name": "인파이트",
            "type": "격투",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "사이코쇼크": {
            "name": "사이코쇼크",
            "type": "에스퍼",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "사념의박치기": {
            "name": "사념의박치기",
            "type": "에스퍼",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "파동탄": {
            "name": "파동탄",
            "type": "격투",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "드레인펀치": {
            "name": "드레인펀치",
            "type": "격투",
            "category": "물리",
            "power": 75,
            "accuracy": 100
      },
      "벌크업": {
            "name": "벌크업",
            "type": "격투",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "섀도볼": {
            "name": "섀도볼",
            "type": "고스트",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "섀도크루": {
            "name": "섀도크루",
            "type": "고스트",
            "category": "물리",
            "power": 70,
            "accuracy": 100
      },
      "길동무": {
            "name": "길동무",
            "type": "고스트",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "하이퍼보이스": {
            "name": "하이퍼보이스",
            "type": "노말",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "유턴": {
            "name": "유턴",
            "type": "벌레",
            "category": "물리",
            "power": 70,
            "accuracy": 100
      },
      "지진": {
            "name": "지진",
            "type": "땅",
            "category": "물리",
            "power": 100,
            "accuracy": 100
      },
      "스톤샤워": {
            "name": "스톤샤워",
            "type": "바위",
            "category": "물리",
            "power": 75,
            "accuracy": 100
      },
      "록커트": {
            "name": "록커트",
            "type": "바위",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "역린": {
            "name": "역린",
            "type": "드래곤",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "드래곤크루": {
            "name": "드래곤크루",
            "type": "드래곤",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "용의춤": {
            "name": "용의춤",
            "type": "드래곤",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "리프블레이드": {
            "name": "리프블레이드",
            "type": "풀",
            "category": "물리",
            "power": 90,
            "accuracy": 100
      },
      "악의파동": {
            "name": "악의파동",
            "type": "악",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "깨물어부수기": {
            "name": "깨물어부수기",
            "type": "악",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "탁쳐서떨구기": {
            "name": "탁쳐서떨구기",
            "type": "악",
            "category": "물리",
            "power": 65,
            "accuracy": 100
      },
      "기습": {
            "name": "기습",
            "type": "악",
            "category": "물리",
            "power": 70,
            "accuracy": 100
      },
      "코멧펀치": {
            "name": "코멧펀치",
            "type": "강철",
            "category": "물리",
            "power": 90,
            "accuracy": 100
      },
      "러스터캐논": {
            "name": "러스터캐논",
            "type": "강철",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "불릿펀치": {
            "name": "불릿펀치",
            "type": "강철",
            "category": "물리",
            "power": 40,
            "accuracy": 100
      },
      "아이언헤드": {
            "name": "아이언헤드",
            "type": "강철",
            "category": "물리",
            "power": 80,
            "accuracy": 100
      },
      "철벽": {
            "name": "철벽",
            "type": "강철",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "야습": {
            "name": "야습",
            "type": "고스트",
            "category": "물리",
            "power": 40,
            "accuracy": 100
      },
      "눈보라": {
            "name": "눈보라",
            "type": "얼음",
            "category": "특수",
            "power": 110,
            "accuracy": 100
      },
      "고드름떨구기": {
            "name": "고드름떨구기",
            "type": "얼음",
            "category": "물리",
            "power": 85,
            "accuracy": 100
      },
      "얼음뭉치": {
            "name": "얼음뭉치",
            "type": "얼음",
            "category": "물리",
            "power": 40,
            "accuracy": 100
      },
      "브레이브버드": {
            "name": "브레이브버드",
            "type": "비행",
            "category": "물리",
            "power": 120,
            "accuracy": 100
      },
      "파워젬": {
            "name": "파워젬",
            "type": "바위",
            "category": "특수",
            "power": 80,
            "accuracy": 100
      },
      "대지의힘": {
            "name": "대지의힘",
            "type": "땅",
            "category": "특수",
            "power": 90,
            "accuracy": 100
      },
      "10만마력": {
            "name": "10만마력",
            "type": "땅",
            "category": "물리",
            "power": 95,
            "accuracy": 100
      },
      "스텔스록": {
            "name": "스텔스록",
            "type": "바위",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      },
      "용의파동": {
            "name": "용의파동",
            "type": "드래곤",
            "category": "특수",
            "power": 85,
            "accuracy": 100
      },
      "날개쉬기": {
            "name": "날개쉬기",
            "type": "비행",
            "category": "변화",
            "power": 0,
            "accuracy": 100
      }
};
    // ==========================================
    // Pokemon Move Animation Studio Controller
    // ==========================================
    let animStudioActor = 'streamer';
    let animStudioMult = 1.0;

    function openPokeAnimStudioModal() {
      if (typeof closeSettingsDrawer === 'function') {
        closeSettingsDrawer();
      }
      const modal = document.getElementById('pokeAnimStudioModal');
      if (!modal) return;

      const sel = document.getElementById('animStudioMoveSelect');
      if (sel && sel.options.length === 0) {
        populateAnimStudioMoves();
      }

      ensureArenaSpritesReady();
      updateAnimStudioDetail();
      modal.style.opacity = '';
      modal.style.pointerEvents = '';
      modal.classList.add('active');
    }

    function closePokeAnimStudioModal() {
      const modal = document.getElementById('pokeAnimStudioModal');
      if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('studio-playing');
        modal.style.opacity = '';
        modal.style.pointerEvents = '';
      }
      if (typeof pokeBattleState === 'undefined' || !pokeBattleState.active) {
        stopPokeBattleBgm(300);
        const arenaStage = document.getElementById('pokeBattleArenaStage');
        const setupStage = document.getElementById('pokeBattleSetupStage');
        if (arenaStage && setupStage) {
          arenaStage.style.display = 'none';
          setupStage.style.display = 'block';
        }
      }
    }

    function setAnimStudioActor(actor) {
      animStudioActor = actor;
      const sBtn = document.getElementById('animStudioActorStreamer');
      const vBtn = document.getElementById('animStudioActorViewers');
      if (sBtn) sBtn.classList.toggle('active', actor === 'streamer');
      if (vBtn) vBtn.classList.toggle('active', actor === 'viewers');
    }

    function setAnimStudioMult(mult) {
      animStudioMult = mult;
      const nBtn = document.getElementById('animStudioMultNormal');
      const sBtn = document.getElementById('animStudioMultSuper');
      const wBtn = document.getElementById('animStudioMultWeak');
      if (nBtn) nBtn.classList.toggle('active', mult === 1.0);
      if (sBtn) sBtn.classList.toggle('active', mult === 2.0);
      if (wBtn) wBtn.classList.toggle('active', mult === 0.5);
    }

    function populateAnimStudioMoves() {
      const sel = document.getElementById('animStudioMoveSelect');
      if (!sel || typeof pokeMoveDatabase === 'undefined') return;

      sel.innerHTML = '';
      
      // 1. EBDX Specials
      const specialGroup = document.createElement('optgroup');
      specialGroup.label = '🌟 EBDX 시네마틱 스페셜 기술 (카메라 럼블 + 고유 연출)';
      const specials = ['지진', '사이코키네시스', '파도타기'];
      specials.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `🎬 [EBDX 시네마틱] ${name}`;
        specialGroup.appendChild(opt);
      });
      sel.appendChild(specialGroup);

      // 2. All 72 Moves
      const normalGroup = document.createElement('optgroup');
      normalGroup.label = '⚔️ 본가 4/5세대 도트 애니메이션 기술 (72종)';
      const allMoves = Object.values(pokeMoveDatabase);
      allMoves.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

      allMoves.forEach(m => {
        if (specials.includes(m.name)) return;
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.type} / ${m.category} / 위력 ${m.power || 0})`;
        normalGroup.appendChild(opt);
      });
      sel.appendChild(normalGroup);

      sel.addEventListener('change', updateAnimStudioDetail);
    }

    function updateAnimStudioDetail() {
      const sel = document.getElementById('animStudioMoveSelect');
      const detail = document.getElementById('animStudioMoveDetail');
      if (!sel || !detail || typeof pokeMoveDatabase === 'undefined') return;

      const moveName = sel.value;
      let move = null;
      for (const m of Object.values(pokeMoveDatabase)) {
        if (m.name === moveName) {
          move = m;
          break;
        }
      }
      if (!move) {
        detail.innerHTML = `<span>선택된 기술: <b>${moveName}</b></span>`;
        return;
      }

      const isEbdx = ['지진', '사이코키네시스', '파도타기'].includes(moveName);
      detail.innerHTML = `
        <span class="badge-tag" style="background: rgba(255,255,255,0.1); color: #fff; font-size: 11px;">속성: <b>${move.type}</b></span>
        <span style="color: ${move.category === '물리' ? '#f87171' : (move.category === '특수' ? '#60a5fa' : '#a78bfa')}; font-weight: 800; font-size: 11px;">분류: ${move.category}</span>
        <span style="font-size: 11px;">위력: <b>${move.power || 0}</b></span>
        <span style="font-size: 11px;">명중률: <b>${move.accuracy || 100}%</b></span>
        ${isEbdx ? '<span style="color: #ffd700; font-weight: 800; background: rgba(255,215,0,0.15); padding: 2px 6px; border-radius: 4px; font-size: 10px;">🌟 EBDX 전용 시네마틱</span>' : '<span style="color: #38bdf8; font-weight: 800; background: rgba(56,189,248,0.15); padding: 2px 6px; border-radius: 4px; font-size: 10px;">🎮 NDS 원작 도트</span>'}
      `;
    }

    function ensureArenaSpritesReady() {
      const sSpr = document.getElementById('arenaStreamerSprite');
      const vSpr = document.getElementById('arenaViewersSprite');
      if (sSpr && (!sSpr.src || sSpr.src.endsWith('/') || sSpr.src.includes('about:blank'))) {
        sSpr.src = 'pokemon/6.png';
      }
      if (vSpr && (!vSpr.src || vSpr.src.endsWith('/') || vSpr.src.includes('about:blank'))) {
        vSpr.src = 'pokemon/25.png';
      }
      const arenaStage = document.getElementById('pokeBattleArenaStage');
      if (arenaStage && arenaStage.style.display === 'none') {
        arenaStage.style.display = 'flex';
        const setupStage = document.getElementById('pokeBattleSetupStage');
        if (setupStage) setupStage.style.display = 'none';
      }
    }

    async function triggerAnimStudioPlay() {
      const sel = document.getElementById('animStudioMoveSelect');
      if (!sel) return;
      const moveName = sel.value;
      const hit = document.getElementById('animStudioHitToggle').checked;
      const isCrit = document.getElementById('animStudioCritToggle').checked;
      const typeMult = animStudioMult;

      let moveObj = { name: moveName, type: '노말', category: '물리', power: 80 };
      if (typeof pokeMoveDatabase !== 'undefined') {
        for (const m of Object.values(pokeMoveDatabase)) {
          if (m && m.name === moveName) {
            moveObj = Object.assign({}, m);
            break;
          }
        }
      }

      ensureArenaSpritesReady();

      const modal = document.getElementById('pokeAnimStudioModal');
      const playBtn = document.getElementById('animStudioPlayBtn');
      if (playBtn) playBtn.disabled = true;

      // Semi-transparent overlay so the entire stadium battle arena is visible
      if (modal) {
        modal.classList.add('studio-playing');
      }

      try {
        await playPokeMoveAnimation(animStudioActor, moveObj, {
          hit: hit,
          isCrit: isCrit,
          typeMult: typeMult,
          finalDamage: 65
        });
      } finally {
        if (modal) {
          modal.classList.remove('studio-playing');
        }
        if (playBtn) playBtn.disabled = false;
      }
    }


    // Global Developer Test Helper for Pokemon Battle Animations
    window.testPokeAnim = async function(moveName = '지진', actor = 'streamer', isCrit = false, typeMult = 1.0) {
      let dummyMove = { name: moveName, type: '노말', category: '물리', power: 80 };
      if (typeof pokeMoveDatabase !== 'undefined') {
        for (const m of Object.values(pokeMoveDatabase)) {
          if (m && m.name === moveName) {
            dummyMove = Object.assign({}, m);
            break;
          }
        }
      }
      return await playPokeMoveAnimation(actor, dummyMove, { hit: true, isCrit, typeMult, finalDamage: 65 });
    };

    async function executeSingleAttack(actor, move, isMega = false) {
      const isStreamer = actor === 'streamer';
      const attackerSlot = isStreamer ? streamerTeam[streamerActiveIdx] : viewersTeam[viewersActiveIdx];
      const defenderSlot = isStreamer ? viewersTeam[viewersActiveIdx] : streamerTeam[streamerActiveIdx];

      // Handle Mega Evolution first in the exact same turn!
      if (isMega && !attackerSlot.isMega) {
        await executeMegaEvolution(actor);
      }

      const attacker = attackerSlot.pokemon;
      const defender = defenderSlot.pokemon;
      const attackerSpr = isStreamer ? document.getElementById('arenaStreamerSprite') : document.getElementById('arenaViewersSprite');
      const defenderSpr = isStreamer ? document.getElementById('arenaViewersSprite') : document.getElementById('arenaStreamerSprite');

      // Authentic Destiny Bond rule: clears at the start of the user's next action
      attackerSlot.destinyBond = false;
      const isProtectMove = (move.name === '방어' || move.name === '판별' || move.name === '니들가드' || move.name === '킹실드');
      if (!isProtectMove) {
        attackerSlot.protectCount = 0;
      }

      // 1. Flinch (풀죽음) Check
      if (attackerSlot.flinched) {
        attackerSlot.flinched = false;
        setBattleDialogue(`💫 <b>${attacker.name}</b>은(는) 풀이 죽어 기술을 쓸 수 없었다!`);
        await new Promise(r => setTimeout(r, 800));
        return false;
      }

      // 2. Freeze (얼음) Check & Self-Thaw Moves (플레어드라이브, 열탕 등)
      const selfThawMoves = ['플레어드라이브', '화염바퀴', '신성한불꽃', '열탕', '스팀버스트', '불꽃의춤'];
      if (attackerSlot.status === 'frz') {
        if (selfThawMoves.includes(move.name) || Math.random() < 0.2) {
          attackerSlot.status = null;
          updateArenaActivePokemonUI();
          setBattleDialogue(`❄️ <b>${attacker.name}</b>의 얼음이 녹았다!`);
          await new Promise(r => setTimeout(r, 600));
        } else {
          setBattleDialogue(`❄️ <b>${attacker.name}</b>은(는) 꽁꽁 얼어붙어 움직일 수 없다!`);
          await new Promise(r => setTimeout(r, 800));
          return false;
        }
      }

      // 3. Paralysis (마비 25% 행동 불가) Check
      if (attackerSlot.status === 'par' && Math.random() < 0.25) {
        setBattleDialogue(`⚡ <b>${attacker.name}</b>은(는) 몸이 저려 기술을 쓸 수 없었다!`);
        await new Promise(r => setTimeout(r, 800));
        return false;
      }

      const atkItemNorm = normalizePokeItemId(attackerSlot.item);
      const defItemNorm = normalizePokeItemId(defenderSlot.item);

      // Choice Item Lock
      if (atkItemNorm === 'choice_band' || atkItemNorm === 'choice_specs' || atkItemNorm === 'choice_scarf') {
        attackerSlot.choiceMove = move;
      }

      // PP Deduction & Struggle Check
      const isStruggle = move.isStruggle || move.name === '발버둥';
      let ppRemainingText = '';
      if (!isStruggle) {
        const ppObj = attackerSlot.movesPP ? attackerSlot.movesPP.find(x => x.name === move.name) : null;
        if (ppObj) {
          ppObj.currentPP = Math.max(0, ppObj.currentPP - 1);
          ppRemainingText = `<span style="font-size: 11px; color: ${ppObj.currentPP <= 2 ? '#f87171' : '#ffd700'};">(남은 PP: ${ppObj.currentPP}/${ppObj.maxPP})</span>`;
        }
      }

      // Announce attack
      setBattleDialogue(`${isStreamer ? '👑' : '👥'} <b>${attacker.name}</b>의 <b>[${move.name}]</b>! ${ppRemainingText}`);

      // 4. Sucker Punch (기습: 상대가 공격기를 쓰지 않거나 이미 행동했으면 실패) Check
      if (move.name === '기습') {
        const opponentAct = isStreamer ? pokeBattleState.viewersAction : pokeBattleState.streamerAction;
        const isOpponentAttacking = opponentAct && opponentAct.type === 'move' && opponentAct.move && opponentAct.move.category !== '변화';
        if (!isOpponentAttacking) {
          await new Promise(r => setTimeout(r, 500));
          setBattleDialogue(`💨 하지만 기습은 실패했다!`);
          await new Promise(r => setTimeout(r, 800));
          return false;
        }
      }

      // 5. Protect / Detect (방어/판별) Activation & Block Check
      if (isProtectMove) {
        const pCount = attackerSlot.protectCount || 0;
        const successRate = Math.pow(1 / 3, pCount);
        if (Math.random() < successRate) {
          attackerSlot.protected = true;
          attackerSlot.protectCount = pCount + 1;
          await new Promise(r => setTimeout(r, 500));
          setBattleDialogue(`🛡️ <b>${attacker.name}</b>은(는) 방어 태세에 들어갔다!`);
        } else {
          attackerSlot.protected = false;
          attackerSlot.protectCount = 0;
          await new Promise(r => setTimeout(r, 500));
          setBattleDialogue(`💨 하지만 <b>${attacker.name}</b>의 방어는 실패했다!`);
        }
        await new Promise(r => setTimeout(r, 800));
        return false;
      }

      // If Defender is Protected (unless attacker has Unseen Fist on contact move)
      const isSpecial = move.category === '특수';
      const hasUnseenFist = !isSpecial && (attacker.abilities || []).includes('unseen-fist');
      if (defenderSlot.protected && !isStruggle && !hasUnseenFist && move.target !== 'self') {
        const selfBuffMoves = ['칼춤', '철벽', '록커트', '용의춤', '나비춤', '명상', '벌크업', '날개쉬기', '달의불빛', '스텔스록', '길동무'];
        if (!selfBuffMoves.includes(move.name)) {
          await new Promise(r => setTimeout(r, 500));
          setBattleDialogue(`🛡️ <b>${defender.name}</b>은(는) 공격으로부터 몸을 지켰다!`);
          await new Promise(r => setTimeout(r, 800));
          return false;
        }
      }

      // Accuracy check (Struggle never misses, No Guard ability never misses)
      const hasNoGuard = (attacker.abilities || []).includes('no-guard') || (defender.abilities || []).includes('no-guard');
      let effectiveAcc = move.acc || 100;
      if (atkItemNorm === 'wide_lens') effectiveAcc = Math.floor(effectiveAcc * 1.1);
      const hit = isStruggle || hasNoGuard || (Math.random() * 100 <= effectiveAcc);

      // Status / Buff moves check
      const isStatusMove = !isStruggle && (move.category === '변화' || move.power === 0);

      // Damage calculation
      let isCrit = false;
      let typeMult = 1.0;
      let finalDamage = 0;
      let effectiveMoveType = move ? move.type : '노말';

      if (hit && !isStatusMove) {
        // Psyshock / Psystrike / Secret Sword target physical Defense even though they are Special moves!
        const targetsPhysicalDef = !isSpecial || (move.name === '사이코쇼크' || move.name === '사이코브레이크' || move.name === '신비의칼');
        let atkStat = calculateLevel50Stat(isSpecial ? attacker.stats.spa : attacker.stats.atk);
        let defStat = calculateLevel50Stat(targetsPhysicalDef ? defender.stats.def : defender.stats.spd);

        // Critical Hit (High critical moves like Stone Edge, Shadow Claw have higher rate)
        const isHighCritMove = (move.name === '스톤에지' || move.name === '섀도크루' || move.name === '깜짝베기' || move.name === '하이드로스나이프' || move.name === '리프블레이드' || move.name === '크로스촙');
        let critChance = 0.0625;
        if (atkItemNorm === 'scope_lens') critChance = 0.125;
        if (isHighCritMove) critChance = (atkItemNorm === 'scope_lens') ? 0.5 : 0.25;
        if ((defender.abilities || []).includes('shell-armor') || (defender.abilities || []).includes('battle-armor')) {
          critChance = 0; // 조가비갑옷 / 전투무장 급소 면역
        }
        isCrit = Math.random() < critChance;

        // Rank modifiers (Authentic rule: Critical hits ignore negative attack ranks and positive defense ranks!)
        if (isSpecial) {
          const effAtkRank = (isCrit && (attackerSlot.rankSpA || 0) < 0) ? 0 : (attackerSlot.rankSpA || 0);
          if (effAtkRank) atkStat = getPokeStatWithRank(atkStat, effAtkRank);
        } else {
          const effAtkRank = (isCrit && (attackerSlot.rankAtk || 0) < 0) ? 0 : (attackerSlot.rankAtk || 0);
          if (effAtkRank) atkStat = getPokeStatWithRank(atkStat, effAtkRank);
          // Burn halves physical attack power (unless Facade 객기)
          if (attackerSlot.status === 'brn' && move.name !== '객기') atkStat = Math.floor(atkStat * 0.5);
          // Huge Power / Pure Power (천하장사 / 순수한힘) doubles physical attack
          if ((attacker.abilities || []).includes('huge-power') || (attacker.abilities || []).includes('pure-power')) {
            atkStat = Math.floor(atkStat * 2.0);
          }
        }

        if (targetsPhysicalDef) {
          const effDefRank = (isCrit && (defenderSlot.rankDef || 0) > 0) ? 0 : (defenderSlot.rankDef || 0);
          if (effDefRank) defStat = getPokeStatWithRank(defStat, effDefRank);
        } else {
          const effDefRank = (isCrit && (defenderSlot.rankSpD || 0) > 0) ? 0 : (defenderSlot.rankSpD || 0);
          if (effDefRank) defStat = getPokeStatWithRank(defStat, effDefRank);
        }

        // Item offensive buffs
        if (!isSpecial && atkItemNorm === 'choice_band') atkStat = Math.floor(atkStat * 1.5);
        if (isSpecial && atkItemNorm === 'choice_specs') atkStat = Math.floor(atkStat * 1.5);
        if (!isSpecial && atkItemNorm === 'muscle_band') atkStat = Math.floor(atkStat * 1.1);
        if (isSpecial && atkItemNorm === 'wise_glasses') atkStat = Math.floor(atkStat * 1.1);

        // Item defensive buffs
        if (!targetsPhysicalDef && defItemNorm === 'assault_vest') defStat = Math.floor(defStat * 1.5);
        if (defItemNorm === 'eviolite') {
          defStat = Math.floor(defStat * 1.5);
        }

        // Effective move type & Aerilate/Pixilate (비행스킨/페어리스킨)
        let aerilateBoost = 1.0;
        if (!isStruggle && (attacker.abilities || []).includes('aerilate') && move.type === '노말') {
          effectiveMoveType = '비행';
          aerilateBoost = 1.2;
        } else if (!isStruggle && (attacker.abilities || []).includes('pixilate') && move.type === '노말') {
          effectiveMoveType = '페어리';
          aerilateBoost = 1.2;
        }

        // STAB (자속 보정: 적응력 Adaptability 시 2.0배)
        const hasAdaptability = (attacker.abilities || []).includes('adaptability');
        const stab = (!isStruggle && attacker.types.includes(effectiveMoveType)) ? (hasAdaptability ? 2.0 : 1.5) : 1.0;

        // Type Effectiveness (Struggle deals neutral damage; Freeze-Dry hits Water for 2x!)
        if (!isStruggle) {
          defender.types.forEach(defType => {
            if (move.name === '프리즈드라이' && defType === '물') {
              typeMult *= 2.0;
            } else if (pokeTypeChart[effectiveMoveType] && pokeTypeChart[effectiveMoveType][defType] !== undefined) {
              typeMult *= pokeTypeChart[effectiveMoveType][defType];
            }
          });
        }

        // Levitate & Air Balloon (부유 & 풍선 - 땅타입 공격 무효, 단 틀깨기 Mold Breaker는 부유 무시)
        if (!isStruggle && effectiveMoveType === '땅') {
          const hasMoldBreaker = (attacker.abilities || []).includes('mold-breaker');
          const hasLevitate = !hasMoldBreaker && (defender.abilities || []).includes('levitate');
          const hasBalloon = defItemNorm === 'air_balloon' && !defenderSlot.itemUsed;
          if (hasLevitate || hasBalloon) {
            typeMult = 0;
          }
        }

        // Thick Fat (두꺼운지방 - 불꽃/얼음 데미지 반감)
        if (!isStruggle && (defender.abilities || []).includes('thick-fat') && (effectiveMoveType === '불꽃' || effectiveMoveType === '얼음')) {
          typeMult *= 0.5;
        }

        // Item: Expert Belt
        if (!isStruggle && atkItemNorm === 'expert_belt' && typeMult >= 2.0) {
          typeMult *= 1.2;
        }

        // Gems (1회용 속성 강화 주얼)
        let gemMult = 1.0;
        const typeToEng = {
          '노말': 'normal', '불꽃': 'fire', '물': 'water', '전기': 'electric',
          '풀': 'grass', '얼음': 'ice', '격투': 'fighting', '독': 'poison',
          '땅': 'ground', '비행': 'flying', '에스퍼': 'psychic', '벌레': 'bug',
          '바위': 'rock', '고스트': 'ghost', '드래곤': 'dragon', '악': 'dark',
          '강철': 'steel', '페어리': 'fairy'
        };
        const engType = typeToEng[effectiveMoveType] || effectiveMoveType;
        const gemId = engType + '_gem';
        const gemSlug = engType + '-gem';
        if (!isStruggle && (attackerSlot.item === gemId || attackerSlot.item === gemSlug)) {
          gemMult = 1.3;
          attackerSlot.itemUsed = true;
          attackerSlot.item = 'none';
        }

        const critMult = isCrit ? 1.5 : 1.0;
        if (isCrit) pokeBattleState.stats.crits++;
        if (typeMult >= 2.0) pokeBattleState.stats.superEffective++;

        // Life Orb bonus
        const itemDmgMult = atkItemNorm === 'life_orb' ? 1.3 : 1.0;

        // Ability: Sharpness (예리함 - 메가앱솔Z 베기 기술 1.5배)
        let sharpnessMult = 1.0;
        const slicingMoves = ['깜짝베기', '사이코커터', '베어가르기', '에어슬래시', '성스러운칼', '리프블레이드', '아쿠아커터', '셸블레이드', '크로스쵸프', '섀도크루', '대검돌격', '아쿠아브레이크'];
        if (attacker.abilities && attacker.abilities.includes('sharpness') && slicingMoves.includes(move.name)) {
          sharpnessMult = 1.5;
        }

        // Ability: Tough Claws (단단한발톱 - 메가갑주무사 접촉기 1.3배)
        let toughClawsMult = 1.0;
        if (!isSpecial && attacker.abilities && attacker.abilities.includes('tough-claws')) {
          toughClawsMult = 1.3;
        }

        // Ability: Aura Shield / Wave Defense (파동의 방호 - 메가루카리오Z 접촉기 50% 반감)
        let auraShieldMult = 1.0;
        if (!isSpecial && defender.abilities && (defender.abilities.includes('aura-shield') || defender.abilities.includes('wave-defense'))) {
          auraShieldMult = 0.5;
        }

        const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;
        let baseDmg = Math.floor((((2 * 50 / 5 + 2) * move.power * (atkStat / Math.max(1, defStat))) / 50) + 2);
        finalDamage = Math.max(1, Math.floor(baseDmg * stab * typeMult * critMult * itemDmgMult * aerilateBoost * sharpnessMult * toughClawsMult * auraShieldMult * gemMult * randomFactor));
        if (typeMult === 0) finalDamage = 0;
      }

      // Execute Motion & Visual FX Animation
      await playPokeMoveAnimation(actor, move, { hit, isCrit, typeMult, finalDamage });

      if (!hit) {
        setBattleDialogue(`💨 하지만 공격은 빗나갔다!`);
        await new Promise(r => setTimeout(r, 800));
        return false;
      }

      // ==========================================
      // AUTHENTIC STATUS & BUFF MOVES RESOLUTION
      // ==========================================
      if (isStatusMove) {
        if (move.name === '도깨비불') {
          if (defender.types.includes('불꽃')) {
            setBattleDialogue(`💨 불꽃 타입인 <b>${defender.name}</b>에게는 화상이 통하지 않는다!`);
          } else if (defenderSlot.status) {
            setBattleDialogue(`💨 <b>${defender.name}</b>은(는) 이미 상태이상에 걸려 있다!`);
          } else {
            defenderSlot.status = 'brn';
            updateArenaActivePokemonUI();
            setBattleDialogue(`🔥 <b>${defender.name}</b>은(는) 화상을 입었다! (물리공격력 50% 반감 및 지속 피해)`);
          }
        } else if (move.name === '전기자석파') {
          if (defender.types.includes('전기') || defender.types.includes('땅')) {
            setBattleDialogue(`💨 <b>${defender.name}</b>에게는 전기가 통하지 않는다!`);
          } else if (defenderSlot.status) {
            setBattleDialogue(`💨 <b>${defender.name}</b>은(는) 이미 상태이상에 걸려 있다!`);
          } else {
            defenderSlot.status = 'par';
            updateArenaActivePokemonUI();
            setBattleDialogue(`⚡ <b>${defender.name}</b>은(는) 마비되었다! (스피드 50% 반감 및 25% 확률 행동불가)`);
          }
        } else if (move.name === '맹독') {
          if (defender.types.includes('독') || defender.types.includes('강철')) {
            setBattleDialogue(`💨 <b>${defender.name}</b>에게는 맹독이 통하지 않는다!`);
          } else if (defenderSlot.status) {
            setBattleDialogue(`💨 <b>${defender.name}</b>은(는) 이미 상태이상에 걸려 있다!`);
          } else {
            defenderSlot.status = 'tox';
            defenderSlot.toxicTurns = 1;
            updateArenaActivePokemonUI();
            setBattleDialogue(`🟣 <b>${defender.name}</b>은(는) 맹독에 걸렸다! (매 턴 누적 독 피해)`);
          }
        } else if (move.name === '날개쉬기' || move.name === '달의불빛') {
          const heal = Math.floor(attackerSlot.maxHP * 0.5);
          attackerSlot.currentHP = Math.min(attackerSlot.maxHP, attackerSlot.currentHP + heal);
          updateArenaHPBars();
          setBattleDialogue(`💚 <b>${attacker.name}</b>은(는) 체력을 ${heal} 회복했다!`);
        } else if (move.name === '칼춤') {
          attackerSlot.rankAtk = Math.min(6, (attackerSlot.rankAtk || 0) + 2);
          updateArenaActivePokemonUI();
          setBattleDialogue(`⚔️ <b>${attacker.name}</b>의 공격력이 크게 상승했다! (+2랭크)`);
        } else if (move.name === '철벽') {
          attackerSlot.rankDef = Math.min(6, (attackerSlot.rankDef || 0) + 2);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🛡️ <b>${attacker.name}</b>의 방어력이 크게 상승했다! (+2랭크)`);
        } else if (move.name === '록커트') {
          attackerSlot.rankSpe = Math.min(6, (attackerSlot.rankSpe || 0) + 2);
          updateArenaActivePokemonUI();
          setBattleDialogue(`⚡ <b>${attacker.name}</b>의 스피드가 크게 상승했다! (+2랭크)`);
        } else if (move.name === '용의춤') {
          attackerSlot.rankAtk = Math.min(6, (attackerSlot.rankAtk || 0) + 1);
          attackerSlot.rankSpe = Math.min(6, (attackerSlot.rankSpe || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🐉 <b>${attacker.name}</b>의 공격력과 스피드가 상승했다! (+1랭크)`);
        } else if (move.name === '나비춤') {
          attackerSlot.rankSpA = Math.min(6, (attackerSlot.rankSpA || 0) + 1);
          attackerSlot.rankSpD = Math.min(6, (attackerSlot.rankSpD || 0) + 1);
          attackerSlot.rankSpe = Math.min(6, (attackerSlot.rankSpe || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🦋 <b>${attacker.name}</b>의 특수공격, 특수방어, 스피드가 상승했다! (+1랭크)`);
        } else if (move.name === '명상') {
          attackerSlot.rankSpA = Math.min(6, (attackerSlot.rankSpA || 0) + 1);
          attackerSlot.rankSpD = Math.min(6, (attackerSlot.rankSpD || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🧘 <b>${attacker.name}</b>의 특수공격과 특수방어가 상승했다! (+1랭크)`);
        } else if (move.name === '벌크업') {
          attackerSlot.rankAtk = Math.min(6, (attackerSlot.rankAtk || 0) + 1);
          attackerSlot.rankDef = Math.min(6, (attackerSlot.rankDef || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`💪 <b>${attacker.name}</b>의 공격력과 방어력이 상승했다! (+1랭크)`);
        } else if (move.name === '스텔스록') {
          if (isStreamer) pokeBattleState.viewersStealthRock = true;
          else pokeBattleState.streamerStealthRock = true;
          setBattleDialogue(`🪨 상대 진영 주위에 날카로운 바위(스텔스록)가 흩뿌려졌다!`);
        } else if (move.name === '길동무') {
          attackerSlot.destinyBond = true;
          setBattleDialogue(`👻 <b>${attacker.name}</b>은(는) 상대를 길동무로 삼으려 하고 있다!`);
        } else {
          attackerSlot.rankAtk = Math.min(6, (attackerSlot.rankAtk || 0) + 1);
          attackerSlot.rankSpA = Math.min(6, (attackerSlot.rankSpA || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`✨ <b>${attacker.name}</b>의 랭크가 상승했다!`);
        }
        // Check Lum Berry after status move (도깨비불/전기자석파/맹독)
        if (defenderSlot.status && normalizePokeItemId(defenderSlot.item) === 'lum_berry' && !defenderSlot.itemUsed) {
          await new Promise(r => setTimeout(r, 500));
          defenderSlot.status = null;
          defenderSlot.itemUsed = true;
          defenderSlot.item = 'none';
          updateArenaActivePokemonUI();
          setBattleDialogue(`🍒 <b>${defender.name}</b>은(는) <b>리샘열매</b>를 먹고 상태이상을 즉시 회복했다!`);
        }
        await new Promise(r => setTimeout(r, 800));
        return false;
      }

      // Apply damage
      const prevHP = defenderSlot.currentHP;
      let remainingHP = Math.max(0, prevHP - finalDamage);

      // Item: Focus Sash (기합의띠)
      if (prevHP === defenderSlot.maxHP && remainingHP === 0 && defItemNorm === 'focus_sash' && !defenderSlot.itemUsed) {
        remainingHP = 1;
        defenderSlot.itemUsed = true;
        setBattleDialogue(`🥋 <b>[${defender.name}]</b>은(는) <b>기합의띠</b>로 버텼다! (HP 1 남음)`);
      }

      // Item: Focus Band (기합의머리띠 10%)
      if (remainingHP === 0 && defItemNorm === 'focus_band' && Math.random() < 0.1) {
        remainingHP = 1;
        setBattleDialogue(`🎗️ <b>[${defender.name}]</b>은(는) <b>기합의머리띠</b>로 버텼다! (HP 1 남음)`);
      }

      defenderSlot.currentHP = remainingHP;
      if (isStreamer) {
        pokeBattleState.stats.streamerDamage += (prevHP - remainingHP);
      } else {
        pokeBattleState.stats.viewersDamage += (prevHP - remainingHP);
      }

      updateArenaHPBars();

      // Dialogue feedback
      let feedback = `💥 <b>${finalDamage}</b>의 데미지를 입혔다!`;
      if (isCrit) feedback += ` <b style="color: #f59e0b;">(급소에 맞았다!)</b>`;
      if (typeMult >= 2.0) feedback += ` <b style="color: #ef4444;">(효과가 굉장했다!)</b>`;
      else if (typeMult > 0 && typeMult < 1.0) feedback += ` <b style="color: #64748b;">(효과가 별로인 듯하다...)</b>`;
      else if (typeMult === 0) feedback += ` <b style="color: #64748b;">(효과가 전혀 없다...)</b>`;

      setBattleDialogue(feedback);
      await new Promise(r => setTimeout(r, 800));

      // Fire-type damaging moves thaw frozen defender!
      if (finalDamage > 0 && defenderSlot.currentHP > 0 && defenderSlot.status === 'frz' && (effectiveMoveType === '불꽃' || move.name === '열탕' || move.name === '스팀버스트')) {
        defenderSlot.status = null;
        updateArenaActivePokemonUI();
        setBattleDialogue(`🔥 불꽃 열기로 인해 <b>${defender.name}</b>의 얼음이 녹았다!`);
        await new Promise(r => setTimeout(r, 600));
      }

      // 1. Drain Leech (기가드레인, 드레인펀치: 데미지의 50% 흡수, 큰뿌리 Big Root 착용 시 1.3배)
      if ((move.name === '기가드레인' || move.name === '드레인펀치' || move.name === '흡혈' || move.name === '드레인키스') && attackerSlot.currentHP > 0 && finalDamage > 0) {
        const rootMult = atkItemNorm === 'big_root' ? 1.3 : 1.0;
        const drainHeal = Math.max(1, Math.floor(finalDamage * 0.5 * rootMult));
        attackerSlot.currentHP = Math.min(attackerSlot.maxHP, attackerSlot.currentHP + drainHeal);
        updateArenaHPBars();
        setBattleDialogue(`💚 <b>${attacker.name}</b>은(는) 상대의 체력을 흡수했다! (+${drainHeal})`);
        await new Promise(r => setTimeout(r, 600));
      }

      // 2. Recoil Moves (플레어드라이브, 볼트태클, 브레이브버드, 이판사판태클: 데미지의 33% 반동)
      if ((move.name === '플레어드라이브' || move.name === '볼트태클' || move.name === '브레이브버드' || move.name === '이판사판태클' || move.name === '우드해머' || move.name === '양날박치기') && attackerSlot.currentHP > 0 && finalDamage > 0) {
        const recoilDmg = Math.max(1, Math.floor(finalDamage / 3));
        attackerSlot.currentHP = Math.max(0, attackerSlot.currentHP - recoilDmg);
        updateArenaHPBars();
        setBattleDialogue(`💥 <b>${attacker.name}</b>은(는) 반동으로 상처를 입었다! (-${recoilDmg})`);
        await new Promise(r => setTimeout(r, 600));
      }

      // 3. Self Stat Drops (인파이트, 오버히트, 용성군, 사이코부스트 등) & White Herb (하양허브)
      if (attackerSlot.currentHP > 0 && finalDamage > 0) {
        let statDropped = false;
        if (move.name === '인파이트' || move.name === '드래곤어센트') {
          attackerSlot.rankDef = Math.max(-6, (attackerSlot.rankDef || 0) - 1);
          attackerSlot.rankSpD = Math.max(-6, (attackerSlot.rankSpD || 0) - 1);
          statDropped = true;
          setBattleDialogue(`💥 <b>${attacker.name}</b>의 방어와 특수방어가 떨어졌다! (-1랭크)`);
        } else if (move.name === '오버히트' || move.name === '용성군' || move.name === '리프스톰' || move.name === '플뢰르캐논') {
          attackerSlot.rankSpA = Math.max(-6, (attackerSlot.rankSpA || 0) - 2);
          statDropped = true;
          setBattleDialogue(`💥 <b>${attacker.name}</b>의 특수공격이 크게 떨어졌다! (-2랭크)`);
        } else if (move.name === '엄청난힘') {
          attackerSlot.rankAtk = Math.max(-6, (attackerSlot.rankAtk || 0) - 1);
          attackerSlot.rankDef = Math.max(-6, (attackerSlot.rankDef || 0) - 1);
          statDropped = true;
          setBattleDialogue(`💥 <b>${attacker.name}</b>의 공격과 방어가 떨어졌다! (-1랭크)`);
        }
        if (statDropped) {
          updateArenaActivePokemonUI();
          await new Promise(r => setTimeout(r, 600));
          if (atkItemNorm === 'white_herb' && !attackerSlot.itemUsed) {
            attackerSlot.itemUsed = true;
            attackerSlot.item = 'none';
            if ((attackerSlot.rankAtk || 0) < 0) attackerSlot.rankAtk = 0;
            if ((attackerSlot.rankDef || 0) < 0) attackerSlot.rankDef = 0;
            if ((attackerSlot.rankSpA || 0) < 0) attackerSlot.rankSpA = 0;
            if ((attackerSlot.rankSpD || 0) < 0) attackerSlot.rankSpD = 0;
            if ((attackerSlot.rankSpe || 0) < 0) attackerSlot.rankSpe = 0;
            updateArenaActivePokemonUI();
            setBattleDialogue(`🌿 <b>${attacker.name}</b>은(는) <b>하양허브</b>로 떨어진 능력을 원래대로 되돌렸다!`);
            await new Promise(r => setTimeout(r, 600));
          }
        }
      }

      // 4. Struggle Recoil Damage (25% max HP)
      if (isStruggle && attackerSlot.currentHP > 0) {
        const struggleRecoil = Math.max(1, Math.floor(attackerSlot.maxHP * 0.25));
        attackerSlot.currentHP = Math.max(0, attackerSlot.currentHP - struggleRecoil);
        updateArenaHPBars();
        setBattleDialogue(`💥 <b>${attacker.name}</b>은(는) 발버둥의 반동으로 상처를 입었다! (-${struggleRecoil})`);
        await new Promise(r => setTimeout(r, 600));
      }

      // 5. Post-hit Item Effects
      if (atkItemNorm === 'life_orb' && attackerSlot.currentHP > 0 && finalDamage > 0) {
        const recoil = Math.max(1, Math.floor(attackerSlot.maxHP * 0.1));
        attackerSlot.currentHP = Math.max(0, attackerSlot.currentHP - recoil);
        updateArenaHPBars();
        setBattleDialogue(`🔴 <b>${attacker.name}</b>은(는) 생명의구슬 반동으로 HP가 깎였다! (-${recoil})`);
        await new Promise(r => setTimeout(r, 600));
      }

      // Rocky Helmet (울퉁불퉁멧 - 펀치글러브 착용 시 비접촉 보호)
      if (!isSpecial && defItemNorm === 'rocky_helmet' && atkItemNorm !== 'punching_glove' && attackerSlot.currentHP > 0 && finalDamage > 0) {
        const recoil = Math.max(1, Math.floor(attackerSlot.maxHP / 6));
        attackerSlot.currentHP = Math.max(0, attackerSlot.currentHP - recoil);
        updateArenaHPBars();
        setBattleDialogue(`🪖 <b>${attacker.name}</b>은(는) 상대의 울퉁불퉁멧에 상처를 입었다! (-${recoil})`);
        await new Promise(r => setTimeout(r, 600));
      }

      // Air Balloon (풍선 터짐)
      if (finalDamage > 0 && defItemNorm === 'air_balloon' && !defenderSlot.itemUsed) {
        defenderSlot.itemUsed = true;
        defenderSlot.item = 'none';
        setBattleDialogue(`🎈 <b>${defender.name}</b>의 <b>풍선</b>이 공격을 받아 펑 터졌다!`);
        await new Promise(r => setTimeout(r, 600));
      }

      // Thermal Exchange (열교환 - 불꽃 피격 시 공격 +1랭크)
      if (effectiveMoveType === '불꽃' && (defender.abilities || []).includes('thermal-exchange') && defenderSlot.currentHP > 0) {
        defenderSlot.rankAtk = Math.min(6, (defenderSlot.rankAtk || 0) + 1);
        updateArenaActivePokemonUI();
        setBattleDialogue(`🔥 <b>${defender.name}</b>의 특성 <b>「열교환」</b> 발동! 공격력이 상승했다! (+1랭크)`);
        await new Promise(r => setTimeout(r, 600));
      }

      // Eject Button (탈출버튼 - 피격 시 벤치로 자동 교체)
      if (finalDamage > 0 && defenderSlot.currentHP > 0 && defItemNorm === 'eject_button' && !defenderSlot.itemUsed) {
        defenderSlot.itemUsed = true;
        defenderSlot.item = 'none';
        const defTeam = isStreamer ? viewersTeam : streamerTeam;
        const defSide = isStreamer ? 'viewers' : 'streamer';
        const defActive = isStreamer ? viewersActiveIdx : streamerActiveIdx;
        const benchAvailable = defTeam.findIndex((p, idx) => idx !== defActive && p.currentHP > 0);
        if (benchAvailable >= 0) {
          setBattleDialogue(`🔘 <b>${defender.name}</b>의 <b>탈출버튼</b>이 작동했다!`);
          await new Promise(r => setTimeout(r, 600));
          await executeSwitchAnimation(defSide, benchAvailable);
        }
      }

      // Red Card (레드카드 - 피격 시 공격자를 벤치로 강제 교체)
      if (finalDamage > 0 && defItemNorm === 'red_card' && !defenderSlot.itemUsed && attackerSlot.currentHP > 0) {
        defenderSlot.itemUsed = true;
        defenderSlot.item = 'none';
        const atkTeam = isStreamer ? streamerTeam : viewersTeam;
        const atkSide = isStreamer ? 'streamer' : 'viewers';
        const atkActive = isStreamer ? streamerActiveIdx : viewersActiveIdx;
        const benchCandidates = atkTeam.map((p, idx) => (idx !== atkActive && p.currentHP > 0) ? idx : -1).filter(i => i >= 0);
        if (benchCandidates.length > 0) {
          const forcedIdx = benchCandidates[Math.floor(Math.random() * benchCandidates.length)];
          setBattleDialogue(`🟥 <b>${defender.name}</b>의 <b>레드카드</b> 발동! <b>${attacker.name}</b>을(를) 강제 퇴장시켰다!`);
          await new Promise(r => setTimeout(r, 600));
          await executeSwitchAnimation(atkSide, forcedIdx);
        }
      }

      if (typeMult >= 2.0 && defItemNorm === 'weakness_policy' && !defenderSlot.itemUsed && defenderSlot.currentHP > 0) {
        defenderSlot.itemUsed = true;
        defenderSlot.rankAtk = Math.min(6, (defenderSlot.rankAtk || 0) + 2);
        defenderSlot.rankSpA = Math.min(6, (defenderSlot.rankSpA || 0) + 2);
        updateArenaActivePokemonUI();
        setBattleDialogue(`🛡️ <b>${defender.name}</b>은(는) 약점보험이 발동하여 공격/특수공격이 크게 상승했다!`);
        await new Promise(r => setTimeout(r, 800));
      }

      if (defItemNorm === 'sitrus_berry' && !defenderSlot.itemUsed && defenderSlot.currentHP > 0 && defenderSlot.currentHP <= defenderSlot.maxHP * 0.5) {
        const heal = Math.max(1, Math.round(defenderSlot.maxHP * 0.25));
        defenderSlot.currentHP = Math.min(defenderSlot.maxHP, defenderSlot.currentHP + heal);
        defenderSlot.itemUsed = true;
        updateArenaHPBars();
        setBattleDialogue(`🍋 <b>${defender.name}</b>은(는) 자뭉열매를 먹고 ${heal} HP를 회복했다!`);
        await new Promise(r => setTimeout(r, 800));
      }

      // 6. Secondary Status / Debuff Effects on Defender (if alive)
      if (defenderSlot.currentHP > 0 && !defenderSlot.fainted) {
        // Burn 10%
        if ((move.name === '화염방사' || move.name === '불대문자' || move.name === '플레어드라이브') && !defender.types.includes('불꽃') && !(defender.abilities && defender.abilities.includes('thermal-exchange')) && !defenderSlot.status && Math.random() < 0.1) {
          defenderSlot.status = 'brn';
          updateArenaActivePokemonUI();
          setBattleDialogue(`🔥 <b>${defender.name}</b>은(는) 화상을 입었다!`);
          await new Promise(r => setTimeout(r, 600));
        }
        // Paralysis
        const parChance = (move.name === '번개') ? 0.3 : ((move.name === '10만볼트' || move.name === '볼트태클') ? 0.1 : 0);
        if (parChance > 0 && !defender.types.includes('전기') && !defender.types.includes('땅') && !defenderSlot.status && Math.random() < parChance) {
          defenderSlot.status = 'par';
          updateArenaActivePokemonUI();
          setBattleDialogue(`⚡ <b>${defender.name}</b>은(는) 마비되었다!`);
          await new Promise(r => setTimeout(r, 600));
        }
        // Poison 30%
        if ((move.name === '오물폭탄' || move.name === '독찌르기' || move.name === '더스트슈트') && !defender.types.includes('독') && !defender.types.includes('강철') && !defenderSlot.status && Math.random() < 0.3) {
          defenderSlot.status = 'psn';
          updateArenaActivePokemonUI();
          setBattleDialogue(`🟣 <b>${defender.name}</b>은(는) 독에 걸렸다!`);
          await new Promise(r => setTimeout(r, 600));
        }
        // Freeze 10%
        if ((move.name === '냉동빔' || move.name === '눈보라') && !defender.types.includes('얼음') && !defenderSlot.status && Math.random() < 0.1) {
          defenderSlot.status = 'frz';
          updateArenaActivePokemonUI();
          setBattleDialogue(`❄️ <b>${defender.name}</b>은(는) 꽁꽁 얼어붙었다!`);
          await new Promise(r => setTimeout(r, 600));
        }
        // Stat drops
        if (move.name === '깨물어부수기' && Math.random() < 0.2) {
          defenderSlot.rankDef = Math.max(-6, (defenderSlot.rankDef || 0) - 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🛡️ <b>${defender.name}</b>의 방어력이 떨어졌다! (-1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        }
        if ((move.name === '섀도볼' || move.name === '에너지볼' || move.name === '대지의힘') && Math.random() < (move.name === '섀도볼' ? 0.2 : 0.1)) {
          defenderSlot.rankSpD = Math.max(-6, (defenderSlot.rankSpD || 0) - 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🔮 <b>${defender.name}</b>의 특수방어력이 떨어졌다! (-1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        }
        if (move.name === '문포스' && Math.random() < 0.3) {
          defenderSlot.rankSpA = Math.max(-6, (defenderSlot.rankSpA || 0) - 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`✨ <b>${defender.name}</b>의 특수공격력이 떨어졌다! (-1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        }
        // Flinch (Covert Cloak 은밀망토 착용 시 부가효과 면역, King's Rock 왕의징표석 10% 추가)
        if (defItemNorm !== 'covert_cloak') {
          let flinchChance = (move.name === '악의파동') ? 0.2 : ((move.name === '에어슬래시' || move.name === '아이언헤드' || move.name === '스톤샤워' || move.name === '고드름떨구기' || move.name === '사념의박치기') ? 0.3 : 0);
          if (flinchChance === 0 && atkItemNorm === 'kings_rock' && finalDamage > 0) flinchChance = 0.1;
          if (flinchChance > 0 && Math.random() < flinchChance) {
            defenderSlot.flinched = true;
          }
        }
        // Lum Berry (리샘열매 - 상태이상 즉시 1회 치료)
        if (defenderSlot.status && defItemNorm === 'lum_berry' && !defenderSlot.itemUsed) {
          defenderSlot.status = null;
          defenderSlot.itemUsed = true;
          defenderSlot.item = 'none';
          updateArenaActivePokemonUI();
          setBattleDialogue(`🍒 <b>${defender.name}</b>은(는) <b>리샘열매</b>를 먹고 상태이상을 회복했다!`);
          await new Promise(r => setTimeout(r, 600));
        }
        // White Herb (하양허브 - 능력치 하락 시 1회 복구)
        if (defItemNorm === 'white_herb' && !defenderSlot.itemUsed && ((defenderSlot.rankAtk || 0) < 0 || (defenderSlot.rankDef || 0) < 0 || (defenderSlot.rankSpA || 0) < 0 || (defenderSlot.rankSpD || 0) < 0 || (defenderSlot.rankSpe || 0) < 0)) {
          defenderSlot.itemUsed = true;
          defenderSlot.item = 'none';
          if ((defenderSlot.rankAtk || 0) < 0) defenderSlot.rankAtk = 0;
          if ((defenderSlot.rankDef || 0) < 0) defenderSlot.rankDef = 0;
          if ((defenderSlot.rankSpA || 0) < 0) defenderSlot.rankSpA = 0;
          if ((defenderSlot.rankSpD || 0) < 0) defenderSlot.rankSpD = 0;
          if ((defenderSlot.rankSpe || 0) < 0) defenderSlot.rankSpe = 0;
          updateArenaActivePokemonUI();
          setBattleDialogue(`🌿 <b>${defender.name}</b>은(는) <b>하양허브</b>로 떨어진 능력을 원래대로 되돌렸다!`);
          await new Promise(r => setTimeout(r, 600));
        }
      }

      // 7. Faint Check & Destiny Bond Trigger
      if (defenderSlot.currentHP <= 0) {
        defenderSlot.fainted = true;
        playAuthenticPokeSound('faint.wav', 0.9);
        if (defenderSpr) defenderSpr.classList.add('poke-sprite-fainted');
        renderArenaTeamBallsHUD();
        await new Promise(r => setTimeout(r, 800));
        setBattleDialogue(`💀 <b>${defender.name}</b>은(는) 쓰러졌다!`);

        // Destiny Bond (길동무 동귀어진)
        if (defenderSlot.destinyBond && attackerSlot.currentHP > 0) {
          attackerSlot.currentHP = 0;
          attackerSlot.fainted = true;
          playAuthenticPokeSound('faint.wav', 0.9);
          if (attackerSpr) attackerSpr.classList.add('poke-sprite-fainted');
          renderArenaTeamBallsHUD();
          updateArenaHPBars();
          await new Promise(r => setTimeout(r, 800));
          setBattleDialogue(`👻 <b>${defender.name}</b>의 길동무로 인해 <b>${attacker.name}</b>도 함께 쓰러졌다!`);
        }
        return true;
      }

      if (attackerSlot.currentHP <= 0) {
        attackerSlot.fainted = true;
        playAuthenticPokeSound('faint.wav', 0.9);
        if (attackerSpr) attackerSpr.classList.add('poke-sprite-fainted');
        renderArenaTeamBallsHUD();
        await new Promise(r => setTimeout(r, 800));
        setBattleDialogue(`💀 <b>${attacker.name}</b>은(는) 반동으로 쓰러졌다!`);
        return true;
      }

      return false;
    }

    async function handleRoundEndEffects() {
      const sSlot = streamerTeam[streamerActiveIdx];
      const vSlot = viewersTeam[viewersActiveIdx];

      if (sSlot && (sSlot.fainted || sSlot.currentHP <= 0)) {
        sSlot.fainted = true;
        await handleFaintPhase('streamer');
        return;
      }
      if (vSlot && (vSlot.fainted || vSlot.currentHP <= 0)) {
        vSlot.fainted = true;
        await handleFaintPhase('viewers');
        return;
      }

      // Burn / Poison / Toxic damage
      const slots = [
        { slot: sSlot, side: 'streamer' },
        { slot: vSlot, side: 'viewers' }
      ];

      for (const item of slots) {
        const sl = item.slot;
        if (sl.fainted || sl.currentHP <= 0) continue;

        // Burn damage: 1/16 max HP
        if (sl.status === 'brn') {
          const dmg = Math.max(1, Math.floor(sl.maxHP / 16));
          sl.currentHP = Math.max(0, sl.currentHP - dmg);
          updateArenaHPBars();
          setBattleDialogue(`🔥 <b>${sl.pokemon.name}</b>은(는) 화상 데미지를 입었다! (-${dmg})`);
          await new Promise(r => setTimeout(r, 600));
          if (sl.currentHP <= 0) {
            sl.fainted = true;
            renderArenaTeamBallsHUD();
            setBattleDialogue(`💀 <b>${sl.pokemon.name}</b>은(는) 화상으로 쓰러졌다!`);
            await new Promise(r => setTimeout(r, 800));
            await handleFaintPhase(item.side);
            return;
          }
        }

        // Poison damage: 1/8 max HP
        if (sl.status === 'psn') {
          const dmg = Math.max(1, Math.floor(sl.maxHP / 8));
          sl.currentHP = Math.max(0, sl.currentHP - dmg);
          updateArenaHPBars();
          setBattleDialogue(`🟣 <b>${sl.pokemon.name}</b>은(는) 독 데미지를 입었다! (-${dmg})`);
          await new Promise(r => setTimeout(r, 600));
          if (sl.currentHP <= 0) {
            sl.fainted = true;
            renderArenaTeamBallsHUD();
            setBattleDialogue(`💀 <b>${sl.pokemon.name}</b>은(는) 독으로 쓰러졌다!`);
            await new Promise(r => setTimeout(r, 800));
            await handleFaintPhase(item.side);
            return;
          }
        }

        // Toxic damage: cumulative 1/16 per turn (Turn 1 = 1/16, Turn 2 = 2/16, ...)
        if (sl.status === 'tox') {
          const curToxTurn = sl.toxicTurns || 1;
          const dmg = Math.max(1, Math.floor(sl.maxHP * Math.min(15, curToxTurn) / 16));
          sl.toxicTurns = curToxTurn + 1;
          sl.currentHP = Math.max(0, sl.currentHP - dmg);
          updateArenaHPBars();
          setBattleDialogue(`💀 <b>${sl.pokemon.name}</b>은(는) 맹독 데미지를 입었다! (-${dmg})`);
          await new Promise(r => setTimeout(r, 600));
          if (sl.currentHP <= 0) {
            sl.fainted = true;
            renderArenaTeamBallsHUD();
            setBattleDialogue(`💀 <b>${sl.pokemon.name}</b>은(는) 맹독으로 쓰러졌다!`);
            await new Promise(r => setTimeout(r, 800));
            await handleFaintPhase(item.side);
            return;
          }
        }
      }

      // Leftovers & Black Sludge recovery/damage
      for (const item of slots) {
        const sl = item.slot;
        if (!sl || sl.fainted || sl.currentHP <= 0) continue;
        const normIt = normalizePokeItemId(sl.item);
        if (normIt === 'leftovers' && sl.currentHP < sl.maxHP) {
          const heal = Math.max(1, Math.round(sl.maxHP / 16));
          sl.currentHP = Math.min(sl.maxHP, sl.currentHP + heal);
          updateArenaHPBars();
          setBattleDialogue(`🍎 <b>${sl.pokemon.name}</b>은(는) 먹다남은음식으로 체력을 조금 회복했다! (+${heal})`);
          await new Promise(r => setTimeout(r, 600));
        } else if (normIt === 'black_sludge') {
          if (sl.pokemon.types.includes('독')) {
            if (sl.currentHP < sl.maxHP) {
              const heal = Math.max(1, Math.round(sl.maxHP / 16));
              sl.currentHP = Math.min(sl.maxHP, sl.currentHP + heal);
              updateArenaHPBars();
              setBattleDialogue(`🟣 <b>${sl.pokemon.name}</b>은(는) 검은진흙으로 체력을 조금 회복했다! (+${heal})`);
              await new Promise(r => setTimeout(r, 600));
            }
          } else {
            const dmg = Math.max(1, Math.floor(sl.maxHP / 8));
            sl.currentHP = Math.max(0, sl.currentHP - dmg);
            updateArenaHPBars();
            setBattleDialogue(`🟣 <b>${sl.pokemon.name}</b>은(는) 검은진흙 때문에 데미지를 입었다! (-${dmg})`);
            await new Promise(r => setTimeout(r, 600));
            if (sl.currentHP <= 0) {
              sl.fainted = true;
              renderArenaTeamBallsHUD();
              await handleFaintPhase(item.side);
              return;
            }
          }
        }
      }

      // Field Seeds activation (그래스시드, 사이코시드, 일렉트릭시드, 미스트시드)
      for (const item of slots) {
        const sl = item.slot;
        if (sl.fainted || sl.currentHP <= 0 || sl.itemUsed) continue;
        if (sl.item === 'grassy_seed' || sl.item === 'grassy-seed') {
          sl.itemUsed = true; sl.item = 'none';
          sl.rankDef = Math.min(6, (sl.rankDef || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🌱 <b>${sl.pokemon.name}</b>의 <b>그래스시드</b> 발동! 방어가 상승했다! (+1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        } else if (sl.item === 'electric_seed' || sl.item === 'electric-seed') {
          sl.itemUsed = true; sl.item = 'none';
          sl.rankDef = Math.min(6, (sl.rankDef || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`⚡ <b>${sl.pokemon.name}</b>의 <b>일렉트릭시드</b> 발동! 방어가 상승했다! (+1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        } else if (sl.item === 'psychic_seed' || sl.item === 'psychic-seed') {
          sl.itemUsed = true; sl.item = 'none';
          sl.rankSpD = Math.min(6, (sl.rankSpD || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🔮 <b>${sl.pokemon.name}</b>의 <b>사이코시드</b> 발동! 특수방어가 상승했다! (+1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        } else if (sl.item === 'misty_seed' || sl.item === 'misty-seed') {
          sl.itemUsed = true; sl.item = 'none';
          sl.rankSpD = Math.min(6, (sl.rankSpD || 0) + 1);
          updateArenaActivePokemonUI();
          setBattleDialogue(`🌫️ <b>${sl.pokemon.name}</b>의 <b>미스트시드</b> 발동! 특수방어가 상승했다! (+1랭크)`);
          await new Promise(r => setTimeout(r, 600));
        }
      }

      // Reset 1-turn effects (Note: Destiny Bond persists until the user's next action)
      sSlot.flinched = false;
      sSlot.protected = false;
      vSlot.flinched = false;
      vSlot.protected = false;

      pokeBattleState.round++;
      pokeBattleState.stats.totalRounds++;
      updateArenaHPBars();
      startSimultaneousPokeTurn();
    }


    // --- Faint Phase & Replacement Selection ---
    async function handleFaintPhase(faintedSide) {
      const teamSize = pokeBattleMode === '3v3' ? 3 : 1;
      const team = faintedSide === 'streamer' ? streamerTeam : viewersTeam;
      const aliveSlots = [];

      for (let i = 0; i < teamSize; i++) {
        if (!team[i].fainted && team[i].currentHP > 0) {
          aliveSlots.push(i);
        }
      }

      // If no alive members left -> Match Over!
      if (aliveSlots.length === 0) {
        const winner = faintedSide === 'streamer' ? 'viewers' : 'streamer';
        finishPokeBattle(winner);
        return;
      }

      // Prompt Replacement
      currentFaintTarget = faintedSide;
      if (pokeBattleSubMode === 'faction_battle') {
        const fSide = faintedSide === 'streamer' ? 'red' : 'blue';
        openFactionFaintSwitchVote(fSide, aliveSlots);
        return;
      }
      if (faintedSide === 'streamer') {
        openStreamerFaintSwitchModal(aliveSlots);
      } else {
        openViewersFaintSwitchVote(aliveSlots);
      }
    }

    function openStreamerFaintSwitchModal(aliveSlots) {
      pokeBattleState.phase = 'faint_switch_streamer';
      streamerFaintAliveSlots = aliveSlots || [];
      const modal = document.getElementById('pokeFaintSwitchModal');
      const title = document.getElementById('pokeFaintSwitchTitle');
      const subTitle = document.getElementById('pokeFaintSwitchSubTitle');
      const list = document.getElementById('pokeFaintSwitchCandidatesList');

      if (title) title.innerText = `👑 ${getStreamerName()}: 다음 출전 포켓몬 선택`;
      if (subTitle) subTitle.innerText = '포켓몬이 쓰러졌습니다! 경기장에 투입할 다음 포켓몬을 선택하세요. (단축키: 1, 2 또는 제어창)';

      if (list) {
        list.innerHTML = aliveSlots.map((idx, fIdx) => {
          const slot = streamerTeam[idx];
          const p = slot.pokemon;
          const it = getItemObj(slot.item);
          const slotNum = idx + 1;
          const shortcutNum = fIdx + 1;
          return `
            <div class="poke-switch-card" onclick="handleStreamerFaintSelect(${idx})">
              <div style="display: flex; align-items: center; gap: 10px;">
                <kbd style="background: rgba(255,215,0,0.2); border: 1px solid rgba(255,215,0,0.4); border-radius: 4px; padding: 2px 6px; font-size: 12px; font-family: monospace; color: #ffd700; font-weight: 900;">${shortcutNum}</kbd>
                <img src="${p.sprite_front}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated;">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: #fff;">[${slotNum}번] ${p.name}</div>
                  <div style="display: flex; gap: 4px; margin-top: 2px;">
                    ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
                    <span class="poke-item-badge" style="font-size: 9px;">${it.emoji} ${it.name}</span>
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; font-weight: 800; color: #4ade80;">HP ${slot.currentHP} / ${slot.maxHP}</div>
                <button type="button" class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; margin-top: 4px;">⚡ ${slotNum}번 출전 <kbd style="font-size: 9px; opacity: 0.8; margin-left: 2px;">[${shortcutNum}]</kbd></button>
              </div>
            </div>
          `;
        }).join('');
      }

      if (modal) modal.classList.add('active');
      updateStreamerControllerPopout();

      // Timer for Streamer (synced with pokeStreamerDurationSelect)
      const sTimer = parseFloat(document.getElementById('pokeStreamerDurationSelect')?.value || document.getElementById('drawerPokeStreamerDurationSelect')?.value || 30.0) || 30.0;
      pokeBattleState.faintTimerTotal = sTimer;
      pokeBattleState.faintTimerRemaining = sTimer;
      renderFaintTimerUI();

      clearInterval(pokeBattleState.faintTimerInterval);
      pokeBattleState.faintTimerInterval = setInterval(() => {
        pokeBattleState.faintTimerRemaining -= 0.1;
        if (pokeBattleState.faintTimerRemaining <= 0) {
          pokeBattleState.faintTimerRemaining = 0;
          clearInterval(pokeBattleState.faintTimerInterval);
          handleStreamerFaintSelect(aliveSlots[0]);
        }
        renderFaintTimerUI();
      }, 100);
    }

    function renderFaintTimerUI() {
      const tText = document.getElementById('pokeFaintSwitchTimerText');
      const tFill = document.getElementById('pokeFaintSwitchTimerFill');
      if (tText) tText.innerText = `${Math.max(0, pokeBattleState.faintTimerRemaining).toFixed(1)}s`;
      if (tFill) {
        const pct = (Math.max(0, pokeBattleState.faintTimerRemaining) / pokeBattleState.faintTimerTotal) * 100;
        tFill.style.width = `${pct}%`;
      }
      updateStreamerControllerTimer();
    }

    async function handleStreamerFaintSelect(idx) {
      clearInterval(pokeBattleState.faintTimerInterval);
      const modal = document.getElementById('pokeFaintSwitchModal');
      if (modal) modal.classList.remove('active');

      streamerActiveIdx = idx;
      updateArenaActivePokemonUI();
      renderArenaTeamBallsHUD();
      updateArenaHPBars();
      updateStreamerControllerPopout();

      const spr = document.getElementById('arenaStreamerSprite');
      if (spr) spr.classList.remove('poke-sprite-fainted');

      setBattleDialogue(`👑 <b>[${getStreamerName()}]</b>은(는) <b>[${streamerTeam[idx].pokemon.name}]</b>(을)를 출전시켰다!`);
      await new Promise(r => setTimeout(r, 1000));

      pokeBattleState.round++;
      pokeBattleState.stats.totalRounds++;
      startSimultaneousPokeTurn();
    }

    let faintAliveSlotsCached = [];

    function openViewersFaintSwitchVote(aliveSlots) {
      pokeBattleState.phase = 'faint_switch_viewers';
      faintVoteUsers.clear();
      faintVoteCounts = {};
      aliveSlots.forEach(slotIdx => { faintVoteCounts[slotIdx] = 0; });
      faintAliveSlotsCached = aliveSlots;

      const modal = document.getElementById('pokeFaintSwitchModal');
      const title = document.getElementById('pokeFaintSwitchTitle');
      const subTitle = document.getElementById('pokeFaintSwitchSubTitle');

      if (title) title.innerText = '👥 시청자 연합: 다음 출전 포켓몬 투표';
      const slotNumList = aliveSlots.map(s => `${s + 1}번`).join(', ');
      if (subTitle) subTitle.innerText = `포켓몬이 쓰러졌습니다! 채팅창에 출전시킬 번호 [${slotNumList}] 또는 포켓몬명을 입력하세요. (🔒 블라인드 투표)`;

      renderFaintVoteCandidatesUI(aliveSlots, false);
      if (modal) modal.classList.add('active');

      // Timer for Viewers (synced with pokeVoteDurationSelect)
      const vTimer = parseFloat(document.getElementById('pokeVoteDurationSelect')?.value || document.getElementById('drawerPokeVoteDurationSelect')?.value || 30.0) || 30.0;
      pokeBattleState.faintTimerTotal = vTimer;
      pokeBattleState.faintTimerRemaining = vTimer;
      renderFaintTimerUI();

      clearInterval(pokeBattleState.faintTimerInterval);
      pokeBattleState.faintTimerInterval = setInterval(() => {
        pokeBattleState.faintTimerRemaining -= 0.1;
        if (pokeBattleState.faintTimerRemaining <= 0) {
          pokeBattleState.faintTimerRemaining = 0;
          clearInterval(pokeBattleState.faintTimerInterval);
          finishViewersFaintVote(aliveSlots);
        }
        renderFaintTimerUI();
      }, 100);
    }

    function recomputeFaintVotes() {
      for (const k of Object.keys(faintVoteCounts)) { faintVoteCounts[k] = 0; }
      for (const [uid, slotIdx] of faintVoteUsers.entries()) {
        if (faintVoteCounts[slotIdx] !== undefined) {
          faintVoteCounts[slotIdx] = (faintVoteCounts[slotIdx] || 0) + 1;
        }
      }
    }

    function renderFaintVoteCandidatesUI(aliveSlots, isReveal = false, winningSlot = null) {
      if (aliveSlots && aliveSlots.length > 0) {
        faintAliveSlotsCached = aliveSlots;
      } else if (faintAliveSlotsCached && faintAliveSlotsCached.length > 0) {
        aliveSlots = faintAliveSlotsCached;
      } else {
        aliveSlots = [];
        for (let i = 0; i < (pokeBattleMode === '3v3' ? 3 : 1); i++) {
          if (!viewersTeam[i].fainted) aliveSlots.push(i);
        }
        faintAliveSlotsCached = aliveSlots;
      }

      const list = document.getElementById('pokeFaintSwitchCandidatesList');
      if (!list) return;

      const total = faintVoteUsers.size;

      list.innerHTML = aliveSlots.map(slotIdx => {
        const slotNum = slotIdx + 1;
        const slot = viewersTeam[slotIdx];
        const p = slot.pokemon;
        const it = getItemObj(slot.item);
        const count = faintVoteCounts[slotIdx] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isWinning = (winningSlot === slotIdx);

        return `
          <div class="poke-switch-card" style="cursor: default; ${isWinning ? 'border-color: #ffd700; background: rgba(255, 215, 0, 0.12); box-shadow: 0 0 16px rgba(255, 215, 0, 0.35);' : ''}">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${p.sprite_front}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated;">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #fff;">
                  [${slotNum}번 슬롯] ${p.name}
                  ${isWinning ? '<span style="color: #ffd700; font-size: 11px; margin-left: 6px;">👑 1위 출전 확정!</span>' : ''}
                </div>
                <div style="display: flex; gap: 4px; margin-top: 2px;">
                  ${p.types.map(t => `<span class="type-badge type-${t}" style="font-size: 8px; padding: 1px 4px;">${t}</span>`).join('')}
                  <span class="poke-item-badge" style="font-size: 9px;">${it.emoji} ${it.name}</span>
                </div>
              </div>
            </div>
            <div style="width: 190px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-sub); margin-bottom: 3px;">
                <span>채팅에 <b>${slotNum}</b> 또는 <b>${p.name}</b></span>
                ${!isReveal ? `
                  <span style="font-size: 10px; color: #94a3b8; font-weight: 700; background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">🔒 집계 중...</span>
                ` : `
                  <span style="color: ${isWinning ? '#ffd700' : '#38bdf8'}; font-weight: 900;">${count}표 (${pct}%) ${isWinning ? '👑' : ''}</span>
                `}
              </div>
              <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); position: relative;">
                ${!isReveal ? `
                  <div style="height: 100%; width: 100%; background: linear-gradient(90deg, rgba(56, 189, 248, 0.1), rgba(0, 255, 163, 0.25), rgba(56, 189, 248, 0.1)); background-size: 200% 100%; animation: votePulse 2s infinite linear; border-radius: 3px;"></div>
                ` : `
                  <div style="height: 100%; width: ${pct}%; background: ${isWinning ? 'linear-gradient(90deg, #ffd700, #00ffa3)' : 'linear-gradient(90deg, #38bdf8, #00ffa3)'}; border-radius: 3px; transition: width 0.4s ease-out;"></div>
                `}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    async function finishViewersFaintVote(aliveSlots) {
      clearInterval(pokeBattleState.faintTimerInterval);

      let maxVotes = 0;
      let topChoices = [];
      aliveSlots.forEach(slotIdx => {
        const v = faintVoteCounts[slotIdx] || 0;
        if (v > maxVotes) {
          maxVotes = v;
          topChoices = [slotIdx];
        } else if (v === maxVotes && maxVotes > 0) {
          topChoices.push(slotIdx);
        }
      });

      let chosenSlotIdx = aliveSlots[0];
      if (maxVotes > 0 && topChoices.length > 0) {
        chosenSlotIdx = topChoices[Math.floor(Math.random() * topChoices.length)];
      } else {
        chosenSlotIdx = aliveSlots[Math.floor(Math.random() * aliveSlots.length)];
      }

      // 1. Reveal final vote results and winning Pokemon for 1.3 seconds
      renderFaintVoteCandidatesUI(aliveSlots, true, chosenSlotIdx);
      await new Promise(r => setTimeout(r, 1300));

      const modal = document.getElementById('pokeFaintSwitchModal');
      if (modal) modal.classList.remove('active');

      viewersActiveIdx = chosenSlotIdx;
      updateArenaActivePokemonUI();
      renderArenaTeamBallsHUD();
      updateArenaHPBars();

      const spr = document.getElementById('arenaViewersSprite');
      if (spr) spr.classList.remove('poke-sprite-fainted');

      setBattleDialogue(`👥 <b>시청자 연합</b>은 <b>[${viewersTeam[chosenSlotIdx].pokemon.name}]</b>(을)를 출전시켰다!`);
      await new Promise(r => setTimeout(r, 1000));

      pokeBattleState.round++;
      pokeBattleState.stats.totalRounds++;
      startSimultaneousPokeTurn();
    }

    // --- Victory & Result Screen ---
    function finishPokeBattle(winnerActor) {
      pokeBattleState.active = false;
      pokeBattleState.phase = 'ended';
      updateStreamerControllerPopout();

      const isStreamerWinner = winnerActor === 'streamer';
      const winnerTeam = isStreamerWinner ? streamerTeam : viewersTeam;
      const mvpSlot = winnerTeam.find(s => !s.fainted) || winnerTeam[0];

      const modal = document.getElementById('pokeBattleResultModal');
      const title = document.getElementById('pokeResultTitle');
      const subTitle = document.getElementById('pokeResultSubTitle');
      const sprite = document.getElementById('pokeResultWinnerSprite');
      const statsBox = document.getElementById('pokeResultStatsBox');

      if (pokeBattleSubMode === 'faction_battle') {
        const isRedWinner = winnerActor === 'streamer';
        const winName = isRedWinner ? factionTeamNames.red : factionTeamNames.blue;
        const winColor = isRedWinner ? '#f87171' : '#38bdf8';
        const winIcon = isRedWinner ? '🔴' : '🔵';
        const winMembers = isRedWinner ? factionRedMembers : factionBlueMembers;

        if (title) {
          title.innerHTML = `${winIcon} <span style="color: ${winColor};">${winName}</span>의 대승리!`;
          title.style.color = winColor;
        }
        if (subTitle) {
          subTitle.innerText = `${winName} 소속 시청자들의 집단지성이 상대 진영을 모두 제압하고 챔피언에 등극했습니다!`;
        }
        if (sprite && mvpSlot && mvpSlot.pokemon) {
          sprite.src = mvpSlot.pokemon.sprite_front;
        }
        if (statsBox) {
          const chipsHtml = (winMembers && winMembers.length > 0) ? winMembers.map(m => {
            const p = (typeof participants !== 'undefined') ? participants.get(m.uid) : null;
            let vipBadge = '';
            if (p) {
              if (p.isSubscriber) {
                vipBadge += `<span class="badge-tag badge-sub" style="font-size: 8px; padding: 0 3px;" title="구독자">⭐</span>`;
              }
              if (p.isDonator) {
                vipBadge += `<span class="badge-tag badge-follow" style="font-size: 8px; padding: 0 3px; background: rgba(255,215,0,0.25); color: #ffd700;" title="후원자">🧀</span>`;
              }
              if (p.donatorLevel && p.donatorLevel >= 2) {
                vipBadge += `<span class="badge-tag" style="font-size: 8px; padding: 0 3px; background: linear-gradient(135deg, #ffd700, #ff8800); color: #080c14; font-weight: 900;" title="VIP 열혈 후원자">VIP</span>`;
              }
            }
            return `
              <div class="glory-user-chip" onclick="openUserChatByNickOrUid('${escapeJsArg(m.uid)}', '${escapeJsArg(m.nickname)}')" title="${escapeHtml(m.nickname)} (클릭하여 시청자 UID 및 상세 정보 보기)">
                <span>${winIcon}</span>
                ${vipBadge}
                <span style="font-weight: 800; color: #fff;">${escapeHtml(m.nickname)}</span>
                <span style="font-size: 9.5px; color: var(--chzzk-green); background: rgba(0,255,163,0.15); padding: 1px 5px; border-radius: 4px; font-weight: 800; display: inline-flex; align-items: center; gap: 2px;">
                  <span>🔍</span><span>UID</span>
                </span>
              </div>
            `;
          }).join('') : '<div style="color: var(--text-sub); font-size: 11px; padding: 10px 0;">참가자가 없습니다.</div>';

          statsBox.innerHTML = `
            <div>⚔️ 배틀 모드: <b>시청자 진영 대항전 (${pokeBattleMode === '3v3' ? '3v3 팀 엔트리 교체' : '1v1 에이스'})</b></div>
            <div>⚔️ 총 진행 라운드: <b>${pokeBattleState.round}라운드</b></div>
            <div>🔴 ${factionTeamNames.red} 참가자: <b>${factionRedMembers.length}명</b> / 총 데미지: <b style="color: #f87171;">${pokeBattleState.stats.streamerDamage}</b></div>
            <div>🔵 ${factionTeamNames.blue} 참가자: <b>${factionBlueMembers.length}명</b> / 총 데미지: <b style="color: #38bdf8;">${pokeBattleState.stats.viewersDamage}</b></div>
            <div>💥 급소(크리티컬) 발생: <b>${pokeBattleState.stats.crits}회</b> / 약점 강타: <b>${pokeBattleState.stats.superEffective}회</b></div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.12); text-align: left;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <div style="font-weight: 900; color: #ffd700; font-size: 12.5px; display: flex; align-items: center; gap: 6px;">
                  <span>👑</span>
                  <span>승리 진영 (${escapeHtml(winName)}) 영광의 참가자</span>
                  <span class="badge-tag" style="background: rgba(255,215,0,0.2); color: #ffd700; font-size: 10.5px; font-weight: 800; padding: 1px 6px;">${winMembers.length}명</span>
                </div>
                <button type="button" class="btn-chip btn-chip-secondary" onclick="openFactionRosterModal()" style="font-size: 11px; padding: 3px 8px; border-radius: 5px; color: #38bdf8; border-color: rgba(56,189,248,0.4); display: inline-flex; align-items: center; gap: 4px;" title="양 진영 전체 참가자 명단 및 검색 열기">
                  <span>📋</span><span>전체 명단 & 검색</span>
                </button>
              </div>
              <div style="font-size: 10.5px; color: var(--text-sub); margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                <span>💡</span><span>시청자를 클릭하면 <b>고유 UID</b> 및 <b>상세 정보(후원/구독/채팅 기록)</b>를 확인할 수 있습니다.</span>
              </div>
              <div id="pokeResultGloryChipsContainer" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 140px; overflow-y: auto; padding: 4px 2px;">
                ${chipsHtml}
              </div>
            </div>
          `;
        }
        if (modal) modal.classList.add('active');
        playPokeBattleBgm('victory', 400);
        launchConfetti();
        return;
      }

      if (title) {
        title.innerText = isStreamerWinner ? `👑 ${getStreamerName()}의 대승리!` : '👥 시청자 연합의 집단지성 승리!';
        title.style.color = isStreamerWinner ? '#ffd700' : '#38bdf8';
      }
      if (subTitle) {
        subTitle.innerText = `${isStreamerWinner ? getStreamerName() : '시청자 연합'}이 상대의 모든 포켓몬을 쓰러뜨리고 매치 챔피언에 올랐습니다!`;
      }
      if (sprite && mvpSlot && mvpSlot.pokemon) {
        sprite.src = mvpSlot.pokemon.sprite_front;
      }
      if (statsBox) {
        statsBox.innerHTML = `
          <div>⚔️ 배틀 모드: <b>${pokeBattleMode === '3v3' ? '3v3 팀 엔트리 교체 배틀' : '1v1 에이스 배틀'}</b></div>
          <div>⚔️ 총 진행 라운드: <b>${pokeBattleState.round}라운드</b></div>
          <div>👑 ${getStreamerName()} 총 데미지: <b style="color: #ffd700;">${pokeBattleState.stats.streamerDamage}</b></div>
          <div>👥 시청자 연합 총 데미지: <b style="color: #38bdf8;">${pokeBattleState.stats.viewersDamage}</b></div>
          <div>💥 급소(크리티컬) 발생: <b>${pokeBattleState.stats.crits}회</b> / 약점 강타: <b>${pokeBattleState.stats.superEffective}회</b></div>
        `;
      }

      if (modal) modal.classList.add('active');
      playPokeBattleBgm('victory', 400);
      launchConfetti();
    }
    window.finishPokeBattle = finishPokeBattle;

    function rematchPokeBattle() {
      closePokeResultModal();
      startPokeBattle();
    }

    function quitPokeBattle() {
      pokeBattleState.active = false;
      stopPokeBattleBgm(300);
      clearInterval(pokeBattleState.streamerTimerInterval);
      clearInterval(pokeBattleState.viewersTimerInterval);
      clearInterval(pokeBattleState.faintTimerInterval);
      const faintModal = document.getElementById('pokeFaintSwitchModal');
      if (faintModal) faintModal.classList.remove('active');

      // Revert all team slots to clean base form
      for (let i = 0; i < 3; i++) {
        if (streamerTeam[i]) revertPokemonToBaseForm(streamerTeam[i]);
        if (viewersTeam[i]) revertPokemonToBaseForm(viewersTeam[i]);
      }

      // Reset arena sprites & animations
      const sSpr = document.getElementById('arenaStreamerSprite');
      if (sSpr) {
        sSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged', 'poke-sprite-crit', 'poke-lunge-right', 'poke-lunge-left', 'poke-hop');
        sSpr.style.opacity = '1';
        sSpr.style.transform = 'none';
        sSpr.style.filter = 'none';
      }
      const vSpr = document.getElementById('arenaViewersSprite');
      if (vSpr) {
        vSpr.classList.remove('poke-sprite-fainted', 'poke-sprite-attacker', 'poke-sprite-damaged', 'poke-sprite-crit', 'poke-lunge-right', 'poke-lunge-left', 'poke-hop');
        vSpr.style.opacity = '1';
        vSpr.style.transform = 'none';
        vSpr.style.filter = 'none';
      }

      const arenaBox = document.getElementById('pokeArenaContainer');
      if (arenaBox) {
        arenaBox.classList.remove('arena-shake-light', 'arena-shake-heavy');
      }
      const vfxCanvas = document.getElementById('pokeBattleVfxCanvas');
      if (vfxCanvas) {
        const vfxCtx = vfxCanvas.getContext('2d');
        if (vfxCtx) vfxCtx.clearRect(0, 0, vfxCanvas.width, vfxCanvas.height);
      }

      document.getElementById('pokeBattleArenaStage').style.display = 'none';
      document.getElementById('pokeBattleSetupStage').style.display = 'block';
      renderPokeSetupPreview();
    }

    function closePokeResultModal() {
      const modal = document.getElementById('pokeBattleResultModal');
      if (modal) modal.classList.remove('active');
      quitPokeBattle();
    }
