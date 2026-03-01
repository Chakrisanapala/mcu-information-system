// ============================================================
// MARVEL CINEMATIC UNIVERSE — APPLICATION LOGIC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Cache DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const sidebar        = $('#sidebar');
  const mobileMenuBtn  = $('#mobileMenuBtn');
  const globalSearch   = $('#globalSearch');
  const searchDropdown = $('#searchDropdown');
  const loadingScreen  = $('#loadingScreen');
  const modalOverlay   = $('#modalOverlay');
  const modalClose     = $('#modalClose');

  // ── Loading Screen ──
  setTimeout(() => loadingScreen.classList.add('hidden'), 1500);

  // ── Helper: Format money strings ──
  function formatMoney(str) {
    if (!str) return '$0';
    const num = parseInt(str.replace(/[$,]/g, ''));
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(0) + 'M';
    if (num >= 1e3) return '$' + (num / 1e3).toFixed(0) + 'K';
    return '$' + num;
  }

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════
  function navigateTo(pageId) {
    $$('.page').forEach(p => p.classList.remove('active'));
    $$('.nav-item').forEach(n => n.classList.remove('active'));

    const page = $(`#page-${pageId}`);
    const nav  = $(`.nav-item[data-page="${pageId}"]`);

    if (page) page.classList.add('active');
    if (nav)  nav.classList.add('active');

    // Animate power bars if characters page
    if (pageId === 'characters') {
      setTimeout(animatePowerBars, 300);
    }

    // Close mobile sidebar
    sidebar.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Mobile menu
  mobileMenuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && !sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
      sidebar.classList.remove('open');
    }
  });

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD — Populate stats
  // ═══════════════════════════════════════════════════════════
  function initDashboard() {
    const { characters, movies, actors, teams, phases } = MCU_DATA;

    // Sidebar badges
    $('#charCount').textContent  = characters.length;
    $('#movieCount').textContent = movies.length;
    $('#actorCount').textContent = actors.length;
    $('#teamCount').textContent  = teams.length;

    // Dashboard stats
    animateNumber($('#totalMovies'), movies.length);
    animateNumber($('#totalCharacters'), characters.length);
    animateNumber($('#totalVillains'), characters.filter(c => c.type === 'villain').length);
    animateNumber($('#totalTeams'), teams.length);
    animateNumber($('#totalActors'), actors.length);

    // Total box office (use real worldwide data)
    let totalBO = 0;
    movies.forEach(m => {
      if (m.worldwideBO) {
        totalBO += parseInt(m.worldwideBO.replace(/[$,]/g, ''));
      } else {
        const num = parseFloat(m.boxOffice.replace(/[\$,BMK]/g, ''));
        if (m.boxOffice.includes('B')) totalBO += num * 1e9;
        else if (m.boxOffice.includes('M')) totalBO += num * 1e6;
      }
    });
    $('#totalBoxOffice').textContent = `$${(totalBO / 1e9).toFixed(1)}B`;

    // Phase cards
    const phaseContainer = $('#phaseCards');
    phaseContainer.innerHTML = phases.map(p => `
      <div class="phase-card" onclick="document.querySelector('.nav-item[data-page=timeline]').click()">
        <h3>${p.name}</h3>
        <div class="phase-years">${p.years}</div>
        <div class="phase-count">${p.movieCount} Movies · ${p.keyEvent}</div>
      </div>
    `).join('');
  }

  function animateNumber(el, target) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 30);
  }

  // ═══════════════════════════════════════════════════════════
  // CHARACTERS — Render cards
  // ═══════════════════════════════════════════════════════════
  let currentCharFilter = 'all';

  function renderCharacters(filter = 'all') {
    currentCharFilter = filter;
    const grid = $('#charactersGrid');
    let chars = MCU_DATA.characters;

    if (filter === 'hero' || filter === 'villain' || filter === 'supporting') {
      chars = chars.filter(c => c.type === filter);
    } else if (filter === 'alive') {
      chars = chars.filter(c => c.status.toLowerCase().includes('alive'));
    } else if (filter === 'dead') {
      chars = chars.filter(c => c.status.toLowerCase().includes('dead'));
    }

    grid.innerHTML = chars.map(c => {
      const statusClass = c.status.toLowerCase().includes('alive') ? 'alive'
                        : c.status.toLowerCase().includes('dead') ? 'dead'
                        : c.status.toLowerCase().includes('retired') ? 'retired'
                        : 'unknown';
      return `
        <div class="char-card ${c.type}" data-id="${c.id}">
          <div class="char-card-header">
            <div class="char-avatar">${c.icon}</div>
            <div class="char-info">
              <h3>${c.name}</h3>
              <div class="char-real-name">${c.realName} · ${c.species}</div>
            </div>
            <span class="char-status ${statusClass}">${c.status}</span>
          </div>
          <div class="char-card-body">
            <div class="char-tags">
              ${c.powers.slice(0, 3).map(p => `<span class="char-tag">${p}</span>`).join('')}
            </div>
            <div class="char-meta">
              <div class="char-meta-item">
                <label>Team</label>
                <span>${c.team}</span>
              </div>
              <div class="char-meta-item">
                <label>Movies</label>
                <span>${c.movies.length} Films</span>
              </div>
              <div class="char-meta-item">
                <label>First Seen</label>
                <span>${c.firstAppearance.split('(')[0].trim()}</span>
              </div>
              <div class="char-meta-item">
                <label>Gender</label>
                <span>${c.gender}</span>
              </div>
            </div>
            <div class="char-power-bars">
              ${renderPowerBars(c.stats)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    $$('.char-card').forEach(card => {
      card.addEventListener('click', () => openCharModal(parseInt(card.dataset.id)));
    });

    setTimeout(animatePowerBars, 100);
  }

  function renderPowerBars(stats) {
    const keys = ['strength', 'intelligence', 'speed', 'durability', 'energy'];
    return keys.map(k => `
      <div class="power-bar-item">
        <label>${k}</label>
        <div class="power-bar-track">
          <div class="power-bar-fill ${k}" data-value="${stats[k]}"></div>
        </div>
        <span class="power-bar-value">${stats[k]}</span>
      </div>
    `).join('');
  }

  function animatePowerBars() {
    $$('.power-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.value + '%';
    });
  }

  // Character filters
  $('#charFilterBar').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      $$('#charFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderCharacters(e.target.dataset.filter);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // CHARACTER MODAL
  // ═══════════════════════════════════════════════════════════
  function openCharModal(charId) {
    const c = MCU_DATA.characters.find(ch => ch.id === charId);
    if (!c) return;

    const statusClass = c.status.toLowerCase().includes('alive') ? 'alive'
                      : c.status.toLowerCase().includes('dead') ? 'dead'
                      : c.status.toLowerCase().includes('retired') ? 'retired'
                      : 'unknown';

    $('#modalHero').innerHTML = `
      <div class="modal-hero-inner">
        <div class="modal-avatar">${c.icon}</div>
        <div>
          <h2>${c.name}</h2>
          <div class="modal-subtitle">${c.realName} · ${c.nickname} · <span class="char-status ${statusClass}" style="position:static;display:inline-block;">${c.status}</span></div>
        </div>
      </div>
    `;

    $('#modalBody').innerHTML = `
      <!-- Basic Info -->
      <div class="modal-section">
        <h4>🔹 Basic Information</h4>
        <div class="modal-grid">
          <div class="modal-field"><label>Character Name</label><span>${c.name}</span></div>
          <div class="modal-field"><label>Real Name</label><span>${c.realName}</span></div>
          <div class="modal-field"><label>Nickname</label><span>${c.nickname}</span></div>
          <div class="modal-field"><label>Age</label><span>${c.age}</span></div>
          <div class="modal-field"><label>Gender</label><span>${c.gender}</span></div>
          <div class="modal-field"><label>Species</label><span>${c.species}</span></div>
          <div class="modal-field"><label>Status</label><span>${c.status}</span></div>
          <div class="modal-field"><label>First Appearance</label><span>${c.firstAppearance}</span></div>
        </div>
      </div>

      <!-- Powers & Skills -->
      <div class="modal-section">
        <h4>⚡ Powers & Skills</h4>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Powers</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">
          ${c.powers.map(p => `<span class="modal-tag">${p}</span>`).join('')}
        </div>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Skills</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">
          ${c.skills.map(s => `<span class="modal-tag">${s}</span>`).join('')}
        </div>
        <div class="modal-grid">
          <div class="modal-field"><label>Weapons</label><span>${c.weapons.join(', ')}</span></div>
          <div class="modal-field"><label>Weakness</label><span>${c.weakness}</span></div>
        </div>
      </div>

      <!-- Power Stats -->
      <div class="modal-section">
        <h4>📊 Power Rating (out of 100)</h4>
        <div class="char-power-bars" style="max-width:500px">
          ${renderPowerBars(c.stats)}
        </div>
      </div>

      <!-- Movie Appearances -->
      <div class="modal-section">
        <h4>🎬 Movie Appearances (${c.movies.length})</h4>
        <div class="modal-tag-list">
          ${c.movies.map(m => `<span class="modal-tag movie">${m}</span>`).join('')}
        </div>
      </div>

      <!-- Relationships -->
      <div class="modal-section">
        <h4>🤝 Relationships</h4>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Allies</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">
          ${c.allies.map(a => `<span class="modal-tag ally">${a}</span>`).join('')}
        </div>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Enemies</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">
          ${c.enemies.map(e => `<span class="modal-tag enemy">${e}</span>`).join('')}
        </div>
        <div class="modal-field" style="margin-top:10px"><label>Team</label><span style="color:var(--gold);font-weight:700">${c.team}</span></div>
      </div>
    `;

    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Animate modal power bars
    setTimeout(animatePowerBars, 200);
  }

  function closeModal() {
    modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ═══════════════════════════════════════════════════════════
  // MOVIES — Render
  // ═══════════════════════════════════════════════════════════
  function renderMovies(phaseFilter = 'all') {
    const grid = $('#moviesGrid');
    let movies = MCU_DATA.movies;

    if (phaseFilter !== 'all') {
      movies = movies.filter(m => m.phase === parseInt(phaseFilter));
    }

    grid.innerHTML = movies.map(m => {
      // Generate gradient colors per phase
      const gradients = {
        1: 'linear-gradient(135deg, rgba(231,76,60,0.2), rgba(10,10,10,0.9))',
        2: 'linear-gradient(135deg, rgba(52,152,219,0.2), rgba(10,10,10,0.9))',
        3: 'linear-gradient(135deg, rgba(155,89,182,0.2), rgba(10,10,10,0.9))',
        4: 'linear-gradient(135deg, rgba(46,204,113,0.2), rgba(10,10,10,0.9))',
        5: 'linear-gradient(135deg, rgba(243,156,18,0.2), rgba(10,10,10,0.9))'
      };
      return `
        <div class="movie-card">
          <div class="movie-card-poster" style="background:${gradients[m.phase]}">
            <span class="imdb-badge">⭐ ${m.imdbRating}</span>
            ${m.tomatoMeter ? `<span class="rt-badge ${m.tomatoMeter >= 75 ? 'fresh' : m.tomatoMeter >= 60 ? 'mixed' : 'rotten'}">🍅 ${m.tomatoMeter}%</span>` : ''}
            <span style="font-size:3rem">🎬</span>
            <span class="phase-indicator phase-${m.phase}">Phase ${m.phase}</span>
          </div>
          <div class="movie-card-body">
            <h3>${m.name}</h3>
            <div class="movie-year">${m.releaseDate.split('-')[0]} · ${m.duration} · ${m.director}</div>
            <div class="movie-summary">${m.summary}</div>
            <div class="movie-meta-row">
              <div class="movie-meta-item">💰 <strong>${m.boxOffice}</strong></div>
              <div class="movie-meta-item">🦸 <strong>${m.mainHero}</strong></div>
              <div class="movie-meta-item">🦹 <strong>${m.mainVillain}</strong></div>
            </div>
            ${m.productionBudget ? `
            <div class="movie-finance-row">
              <div class="finance-item"><span class="finance-label">Budget</span><span class="finance-val">${formatMoney(m.productionBudget)}</span></div>
              <div class="finance-item"><span class="finance-label">Opening</span><span class="finance-val">${formatMoney(m.openingWeekend)}</span></div>
              <div class="finance-item"><span class="finance-label">Domestic</span><span class="finance-val">${formatMoney(m.domesticBO)}</span></div>
            </div>
            <div class="movie-scores-row">
              <div class="score-pill rt">🍅 ${m.tomatoMeter}%</div>
              <div class="score-pill audience">🍿 ${m.audienceScore}%</div>
              <div class="score-pill imdb">⭐ ${m.imdbRating}</div>
            </div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Movie filters
  $('#movieFilterBar').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      $$('#movieFilterBar .filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderMovies(e.target.dataset.filter);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // ACTORS — Render
  // ═══════════════════════════════════════════════════════════
  function renderActors() {
    const grid = $('#actorsGrid');
    grid.innerHTML = MCU_DATA.actors.map(a => `
      <div class="actor-card">
        <div class="actor-card-top">
          <div class="actor-avatar">${a.avatar}</div>
          <div>
            <h3>${a.name}</h3>
            <div class="actor-character">as ${a.character}</div>
          </div>
        </div>
        <div class="actor-details">
          <div class="actor-detail-item"><label>Born</label><span>${a.dob}</span></div>
          <div class="actor-detail-item"><label>Age</label><span>${a.age}</span></div>
          <div class="actor-detail-item"><label>Nationality</label><span>${a.nationality}</span></div>
          <div class="actor-detail-item"><label>MCU Active</label><span>${a.yearsActive}</span></div>
        </div>
        <div class="actor-other-movies">
          ${a.otherMovies.map(m => `<span class="actor-movie-tag">${m}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // TEAMS — Render
  // ═══════════════════════════════════════════════════════════
  function renderTeams() {
    const grid = $('#teamsGrid');
    grid.innerHTML = MCU_DATA.teams.map(t => `
      <div class="team-card">
        <div class="team-card-header">
          <div class="team-icon">${t.icon}</div>
          <div>
            <h3>${t.name}</h3>
            <div class="team-leader">Leader: ${t.leader}</div>
          </div>
        </div>
        <div class="team-card-body">
          <div class="team-members">
            ${t.members.map(m => `<span class="team-member-tag">${m}</span>`).join('')}
          </div>
          <div class="team-info-row">
            <div class="team-info-item"><label>First Appearance</label><span>${t.firstAppearance}</span></div>
            <div class="team-info-item"><label>Base</label><span>${t.base}</span></div>
          </div>
          <div style="margin-top:12px">
            <label style="color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;letter-spacing:1px">Enemies</label>
            <div class="team-members" style="margin-top:6px">
              ${t.enemies.map(e => `<span class="team-member-tag" style="background:rgba(244,67,54,0.1);border-color:rgba(244,67,54,0.2);color:#ef5350">${e}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // TIMELINE — Render
  // ═══════════════════════════════════════════════════════════
  let currentTimelineOrder = 'release';

  function renderTimeline(order = 'release') {
    currentTimelineOrder = order;
    const container = $('#timelineContainer');
    let movies = [...MCU_DATA.movies];

    if (order === 'release') {
      movies.sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    } else {
      movies.sort((a, b) => a.phase - b.phase || new Date(a.releaseDate) - new Date(b.releaseDate));
    }

    let currentPhase = 0;
    let html = '';

    movies.forEach((m, i) => {
      if (order === 'phase' && m.phase !== currentPhase) {
        currentPhase = m.phase;
        const phase = MCU_DATA.phases.find(p => p.id === currentPhase);
        html += `
          <div class="timeline-item" style="animation-delay:${i * 0.05}s">
            <div class="timeline-item-content" style="border-left:3px solid ${phase.color};background:rgba(226,54,54,0.03)">
              <h4 style="color:${phase.color};font-size:1.5rem">${phase.name}</h4>
              <div class="timeline-meta">${phase.description}</div>
            </div>
          </div>
        `;
      }

      html += `
        <div class="timeline-item" style="animation-delay:${i * 0.05}s">
          <div class="timeline-item-content">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
              <h4>${m.name}</h4>
              <span class="phase-indicator phase-${m.phase}" style="position:static">Phase ${m.phase}</span>
            </div>
            <div class="timeline-date">${new Date(m.releaseDate).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</div>
            <div class="timeline-meta">
              ${m.director} · ${m.duration} · ⭐ ${m.imdbRating} · 💰 ${m.boxOffice}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Timeline tabs
  $('#timelineTabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('timeline-tab')) {
      $$('.timeline-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderTimeline(e.target.dataset.order);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // STATISTICS — Render
  // ═══════════════════════════════════════════════════════════
  function renderStatistics() {
    const chars = MCU_DATA.characters;
    const movies = MCU_DATA.movies;

    // Helper to render ranking list
    function rankingHTML(items, valueLabel) {
      return items.slice(0, 7).map((item, i) => {
        const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return `
          <li class="ranking-item">
            <span class="ranking-position ${posClass}">${i + 1}</span>
            <div class="ranking-info">
              <div class="ranking-name">${item.icon || ''} ${item.name}</div>
              <div class="ranking-detail">${item.detail || ''}</div>
            </div>
            <span class="ranking-value">${item.value}${valueLabel}</span>
          </li>
        `;
      }).join('');
    }

    // Strength
    const byStrength = chars.map(c => ({
      name: c.name, icon: c.icon,
      detail: c.type.toUpperCase(),
      value: c.stats.strength
    })).sort((a, b) => b.value - a.value);
    $('#strengthRanking').innerHTML = rankingHTML(byStrength, '/100');

    // Intelligence
    const byIntel = chars.map(c => ({
      name: c.name, icon: c.icon,
      detail: c.type.toUpperCase(),
      value: c.stats.intelligence
    })).sort((a, b) => b.value - a.value);
    $('#intelligenceRanking').innerHTML = rankingHTML(byIntel, '/100');

    // Energy
    const byEnergy = chars.map(c => ({
      name: c.name, icon: c.icon,
      detail: c.type.toUpperCase(),
      value: c.stats.energy
    })).sort((a, b) => b.value - a.value);
    $('#energyRanking').innerHTML = rankingHTML(byEnergy, '/100');

    // Box Office
    const byBO = movies.map(m => {
      const raw = m.boxOffice.replace('$', '');
      let numVal = parseFloat(raw);
      if (raw.includes('B')) numVal *= 1000;
      return {
        name: m.name, icon: '🎬',
        detail: `Phase ${m.phase} · ${m.releaseDate.split('-')[0]}`,
        value: m.boxOffice,
        numVal
      };
    }).sort((a, b) => b.numVal - a.numVal);
    $('#boxOfficeRanking').innerHTML = rankingHTML(byBO.map(b => ({...b, value: b.value})), '');

    // IMDb Rating
    const byRating = movies.map(m => ({
      name: m.name, icon: '⭐',
      detail: `Phase ${m.phase} · ${m.director}`,
      value: m.imdbRating
    })).sort((a, b) => b.value - a.value);
    $('#ratingRanking').innerHTML = rankingHTML(byRating, '');

    // Most Appearances
    const byAppearances = chars.map(c => ({
      name: c.name, icon: c.icon,
      detail: c.type.toUpperCase(),
      value: c.movies.length
    })).sort((a, b) => b.value - a.value);
    $('#appearanceRanking').innerHTML = rankingHTML(byAppearances, ' films');

    // Relationships
    const relList = $('#relList');
    relList.innerHTML = MCU_DATA.relationships.map(r => {
      let typeClass = 'friend';
      const t = r.type.toLowerCase();
      if (t.includes('enemy'))   typeClass = 'enemy';
      if (t.includes('mentor'))  typeClass = 'mentor';
      if (t.includes('love'))    typeClass = 'love';
      if (t.includes('brother') || t.includes('sister') || t.includes('cousin')) typeClass = 'family';
      if (t.includes('leader') || t.includes('founder') || t.includes('successor')) typeClass = 'leader';

      return `
        <div class="rel-item">
          <span class="rel-from">${r.from}</span>
          <span class="rel-arrow">→</span>
          <span class="rel-type ${typeClass}">${r.type}</span>
          <span class="rel-arrow">→</span>
          <span class="rel-to">${r.to}</span>
        </div>
      `;
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // GLOBAL SEARCH
  // ═══════════════════════════════════════════════════════════
  globalSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      searchDropdown.classList.remove('show');
      return;
    }

    const results = [];

    // Search characters
    MCU_DATA.characters.forEach(c => {
      if (c.name.toLowerCase().includes(query) || c.realName.toLowerCase().includes(query)) {
        results.push({ icon: c.icon, name: c.name, type: c.type, page: 'characters', id: c.id });
      }
    });

    // Search movies
    MCU_DATA.movies.forEach(m => {
      if (m.name.toLowerCase().includes(query)) {
        results.push({ icon: '🎬', name: m.name, type: `Phase ${m.phase} Movie`, page: 'movies' });
      }
    });

    // Search actors
    MCU_DATA.actors.forEach(a => {
      if (a.name.toLowerCase().includes(query) || a.character.toLowerCase().includes(query)) {
        results.push({ icon: '🎭', name: a.name, type: `Actor · ${a.character}`, page: 'actors' });
      }
    });

    // Search teams
    MCU_DATA.teams.forEach(t => {
      if (t.name.toLowerCase().includes(query)) {
        results.push({ icon: t.icon, name: t.name, type: 'Team / Organization', page: 'teams' });
      }
    });

    if (results.length === 0) {
      searchDropdown.innerHTML = `<div class="search-result-item"><span class="sr-icon">😕</span><div><div class="sr-name">No results found</div><div class="sr-type">Try a different search</div></div></div>`;
    } else {
      searchDropdown.innerHTML = results.slice(0, 10).map(r => `
        <div class="search-result-item" data-page="${r.page}" data-id="${r.id || ''}">
          <span class="sr-icon">${r.icon}</span>
          <div>
            <div class="sr-name">${r.name}</div>
            <div class="sr-type">${r.type}</div>
          </div>
        </div>
      `).join('');
    }

    searchDropdown.classList.add('show');

    // Click handler for results
    searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        const id   = item.dataset.id;
        navigateTo(page);
        searchDropdown.classList.remove('show');
        globalSearch.value = '';

        if (page === 'characters' && id) {
          setTimeout(() => openCharModal(parseInt(id)), 300);
        }
      });
    });
  });

  // Close search on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchDropdown.classList.remove('show');
    }
  });

  // ═══════════════════════════════════════════════════════════
  // RADAR CHART (Canvas API — Pentagon Spider Chart)
  // ═══════════════════════════════════════════════════════════
  function drawRadarChart(canvas, statsList, colors, names) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width; const h = canvas.height;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 35;
    const labels = ['Strength', 'Intelligence', 'Speed', 'Durability', 'Energy'];
    const n = labels.length;
    const step = (2 * Math.PI) / n;
    const start = -Math.PI / 2;

    ctx.clearRect(0, 0, w, h);

    // Grid levels
    for (let lvl = 1; lvl <= 5; lvl++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = start + (i % n) * step;
        const lr = (r * lvl) / 5;
        const x = cx + lr * Math.cos(a), y = cy + lr * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const a = start + i * step;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#b0b0b0';
    ctx.font = '600 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const a = start + i * step;
      const lx = cx + (r + 22) * Math.cos(a);
      const ly = cy + (r + 22) * Math.sin(a);
      ctx.fillText(labels[i], lx, ly);
    }

    // Data layers
    statsList.forEach((stats, idx) => {
      const vals = [stats.strength, stats.intelligence, stats.speed, stats.durability, stats.energy];
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = start + (i % n) * step;
        const vr = (r * vals[i % n]) / 100;
        const x = cx + vr * Math.cos(a), y = cy + vr * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = colors[idx] + '30';
      ctx.fill();
      ctx.strokeStyle = colors[idx];
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots
      for (let i = 0; i < n; i++) {
        const a = start + i * step;
        const vr = (r * vals[i]) / 100;
        ctx.beginPath();
        ctx.arc(cx + vr * Math.cos(a), cy + vr * Math.sin(a), 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[idx];
        ctx.fill();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PIE CHART (Canvas API)
  // ═══════════════════════════════════════════════════════════
  function drawPieChart(canvas, data, legendEl) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width; const h = canvas.height;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2, cy = h / 2, radius = Math.min(cx, cy) - 15;
    const total = data.reduce((s, d) => s + d.value, 0);
    let currentAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, w, h);

    data.forEach(d => {
      const sliceAngle = (d.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label inside
      const midAngle = currentAngle + sliceAngle / 2;
      const lx = cx + (radius * 0.65) * Math.cos(midAngle);
      const ly = cy + (radius * 0.65) * Math.sin(midAngle);
      if (sliceAngle > 0.3) {
        ctx.fillStyle = 'white';
        ctx.font = '700 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.value, lx, ly);
      }

      currentAngle += sliceAngle;
    });

    // Center hole (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Total in center
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy);

    // Legend
    if (legendEl) {
      legendEl.innerHTML = data.map(d =>
        `<div class="pie-legend-item"><div class="pie-legend-dot" style="background:${d.color}"></div>${d.label} (${d.value})</div>`
      ).join('');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // NETWORK GRAPH (Canvas API)
  // ═══════════════════════════════════════════════════════════
  function drawNetworkGraph() {
    const canvas = document.getElementById('networkGraph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = 900, h = 500;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Collect unique nodes
    const nodeNames = new Set();
    MCU_DATA.relationships.forEach(r => { nodeNames.add(r.from); nodeNames.add(r.to); });
    const nodes = Array.from(nodeNames);

    // Position nodes in an ellipse
    const cx = w / 2, cy = h / 2;
    const rx = w * 0.40, ry = h * 0.38;
    const positions = {};
    nodes.forEach((name, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      positions[name] = { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
    });

    // Draw connections
    MCU_DATA.relationships.forEach(r => {
      const from = positions[r.from], to = positions[r.to];
      if (!from || !to) return;
      const t = r.type.toLowerCase();
      let color = '#66bb6a';
      if (t.includes('enemy'))  color = '#ef5350';
      if (t.includes('mentor')) color = '#42a5f5';
      if (t.includes('love'))   color = '#ec407a';
      if (t.includes('brother') || t.includes('sister') || t.includes('cousin')) color = '#ffca28';
      if (t.includes('leader') || t.includes('founder') || t.includes('successor')) color = '#ab47bc';

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color + '60';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(name => {
      const pos = positions[name];
      const ch = MCU_DATA.characters.find(c => c.name === name);
      const isHero = ch && ch.type === 'hero';
      const isVillain = ch && ch.type === 'villain';
      const nodeColor = isVillain ? '#9c27b0' : isHero ? '#e23636' : '#1e88e5';

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor + '40';
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 10px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayName = name.length > 12 ? name.substring(0, 10) + '..' : name;
      ctx.fillText(displayName, pos.x, pos.y + 28);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CHARACTER COMPARISON TOOL
  // ═══════════════════════════════════════════════════════════
  function initComparison() {
    const sel1 = $('#compChar1'), sel2 = $('#compChar2');
    if (!sel1 || !sel2) return;

    const options = MCU_DATA.characters.map(c =>
      `<option value="${c.id}">${c.icon} ${c.name} (${c.type})</option>`
    ).join('');

    sel1.innerHTML = options;
    sel2.innerHTML = options;
    sel1.value = '1'; // Iron Man
    sel2.value = '13'; // Thanos

    const doCompare = () => compareCharacters(parseInt(sel1.value), parseInt(sel2.value));
    sel1.addEventListener('change', doCompare);
    sel2.addEventListener('change', doCompare);
    doCompare();
  }

  function compareCharacters(id1, id2) {
    const c1 = MCU_DATA.characters.find(c => c.id === id1);
    const c2 = MCU_DATA.characters.find(c => c.id === id2);
    if (!c1 || !c2) return;

    const stats = ['strength', 'intelligence', 'speed', 'durability', 'energy'];
    let score1 = 0, score2 = 0;
    stats.forEach(s => { if (c1.stats[s] > c2.stats[s]) score1++; else if (c2.stats[s] > c1.stats[s]) score2++; });

    const winner = score1 > score2 ? c1 : score2 > score1 ? c2 : null;

    const statRows = stats.map(s => {
      const v1 = c1.stats[s], v2 = c2.stats[s];
      const w1 = v1 >= v2 ? 'winner' : 'loser';
      const w2 = v2 >= v1 ? 'winner' : 'loser';
      return `
        <div style="display:grid;grid-template-columns:1fr 80px 1fr;gap:0;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-right:10px">
            <span class="comp-stat-value ${w1}">${v1}</span>
            <div style="width:${v1}%;max-width:100%;height:8px;border-radius:4px;background:linear-gradient(90deg,rgba(226,54,54,0.3),#e23636)"></div>
          </div>
          <div style="text-align:center;font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:700">${s}</div>
          <div style="display:flex;align-items:center;gap:10px;padding-left:10px">
            <div style="width:${v2}%;max-width:100%;height:8px;border-radius:4px;background:linear-gradient(90deg,#f0b90b,rgba(240,185,11,0.3))"></div>
            <span class="comp-stat-value ${w2}">${v2}</span>
          </div>
        </div>`;
    }).join('');

    const totalPower1 = stats.reduce((s, k) => s + c1.stats[k], 0);
    const totalPower2 = stats.reduce((s, k) => s + c2.stats[k], 0);

    // Universe data
    const uv1 = MCU_DATA.universeData[c1.name] || {};
    const uv2 = MCU_DATA.universeData[c2.name] || {};

    const resultHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:25px">
        <div style="text-align:center;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:30px 20px;animation:slideInLeft 0.5s ease">
          <div style="font-size:3.5rem;margin-bottom:8px">${c1.icon}</div>
          <h3 style="font-family:'Bebas Neue',cursive;font-size:1.8rem;letter-spacing:1px">${c1.name}</h3>
          <div style="color:var(--text-muted);font-size:0.85rem">${c1.realName} · ${c1.species}</div>
          <div style="color:var(--red);font-weight:700;margin-top:6px;font-family:'Orbitron',sans-serif;font-size:1.1rem">Total: ${totalPower1}/500</div>
          ${uv1.universe ? `<div style="margin-top:6px;font-size:0.75rem;color:var(--cyan)">${uv1.universe} ${uv1.variant ? '· ⚡ VARIANT' : ''}</div>` : ''}
        </div>
        <div style="text-align:center;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:30px 20px;animation:slideInRight 0.5s ease">
          <div style="font-size:3.5rem;margin-bottom:8px">${c2.icon}</div>
          <h3 style="font-family:'Bebas Neue',cursive;font-size:1.8rem;letter-spacing:1px">${c2.name}</h3>
          <div style="color:var(--text-muted);font-size:0.85rem">${c2.realName} · ${c2.species}</div>
          <div style="color:var(--gold);font-weight:700;margin-top:6px;font-family:'Orbitron',sans-serif;font-size:1.1rem">Total: ${totalPower2}/500</div>
          ${uv2.universe ? `<div style="margin-top:6px;font-size:0.75rem;color:var(--cyan)">${uv2.universe} ${uv2.variant ? '· ⚡ VARIANT' : ''}</div>` : ''}
        </div>
      </div>

      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:25px">
        <h4 style="text-align:center;font-family:'Bebas Neue',cursive;font-size:1.3rem;color:var(--text-muted);margin-bottom:15px;letter-spacing:1px">STAT COMPARISON</h4>
        ${statRows}
      </div>

      <div class="comp-radar-section">
        <h3>RADAR CHART OVERLAY</h3>
        <div class="comp-legend">
          <div class="comp-legend-item"><div class="comp-legend-dot" style="background:#e23636"></div> ${c1.name}</div>
          <div class="comp-legend-item"><div class="comp-legend-dot" style="background:#f0b90b"></div> ${c2.name}</div>
        </div>
        <div class="radar-chart-container"><canvas id="compRadarCanvas" width="350" height="350"></canvas></div>
      </div>

      ${winner ? `
        <div class="comp-winner-banner">
          <h3>🏆 ${winner.icon} ${winner.name} WINS!</h3>
          <p>${winner.name} leads in ${winner === c1 ? score1 : score2} out of 5 stat categories with a total power of ${winner === c1 ? totalPower1 : totalPower2}/500</p>
        </div>
      ` : `
        <div class="comp-winner-banner">
          <h3>🤝 IT'S A TIE!</h3>
          <p>Both characters are equally matched with identical win counts</p>
        </div>
      `}
    `;

    $('#compResult').innerHTML = resultHTML;

    // Draw dual radar chart
    setTimeout(() => {
      drawRadarChart($('#compRadarCanvas'), [c1.stats, c2.stats], ['#e23636', '#f0b90b'], [c1.name, c2.name]);
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════
  // QUIZ SYSTEM
  // ═══════════════════════════════════════════════════════════
  let quizState = { questions: [], current: 0, score: 0, timer: null, timeLeft: 15, answered: false };

  function initQuiz() {
    const startBtn = $('#startQuizBtn');
    if (startBtn) startBtn.addEventListener('click', startQuiz);
  }

  function startQuiz() {
    // Shuffle and pick 10
    const allQ = [...MCU_DATA.quizQuestions];
    for (let i = allQ.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQ[i], allQ[j]] = [allQ[j], allQ[i]];
    }
    quizState = { questions: allQ.slice(0, 10), current: 0, score: 0, timer: null, timeLeft: 15, answered: false };

    $('#quizStart').style.display = 'none';
    $('#quizActive').style.display = 'block';
    $('#quizResultArea').style.display = 'none';
    showQuestion();
  }

  function showQuestion() {
    const q = quizState.questions[quizState.current];
    quizState.answered = false;
    quizState.timeLeft = 15;

    $('#quizProgressText').textContent = `${quizState.current + 1} / ${quizState.questions.length}`;
    $('#quizProgressFill').style.width = ((quizState.current) / quizState.questions.length * 100) + '%';
    $('#quizTimer').textContent = '⏱ 15s';

    const letters = ['A', 'B', 'C', 'D'];
    $('#quizQuestionArea').innerHTML = `
      <div class="quiz-question-card">
        <span class="quiz-difficulty ${q.difficulty}">${q.difficulty}</span>
        <div class="quiz-question-text">${q.question}</div>
      </div>
    `;

    $('#quizOptions').innerHTML = q.options.map((opt, i) => `
      <div class="quiz-option" data-index="${i}">
        <span class="option-letter">${letters[i]}</span>
        <span>${opt}</span>
      </div>
    `).join('');

    $$('.quiz-option').forEach(el => {
      el.addEventListener('click', () => selectAnswer(parseInt(el.dataset.index)));
    });

    // Timer
    clearInterval(quizState.timer);
    quizState.timer = setInterval(() => {
      quizState.timeLeft--;
      $('#quizTimer').textContent = `⏱ ${quizState.timeLeft}s`;
      if (quizState.timeLeft <= 5) $('#quizTimer').style.color = '#ef5350';
      else $('#quizTimer').style.color = '#f0b90b';
      if (quizState.timeLeft <= 0) {
        clearInterval(quizState.timer);
        selectAnswer(-1); // time out
      }
    }, 1000);
  }

  function selectAnswer(index) {
    if (quizState.answered) return;
    quizState.answered = true;
    clearInterval(quizState.timer);

    const q = quizState.questions[quizState.current];
    const options = $$('.quiz-option');

    options.forEach(el => el.classList.add('disabled'));

    if (index === q.correct) {
      quizState.score++;
      options[index].classList.add('correct');
    } else {
      if (index >= 0) options[index].classList.add('wrong');
      options[q.correct].classList.add('correct');
    }

    setTimeout(() => {
      quizState.current++;
      if (quizState.current < quizState.questions.length) {
        showQuestion();
      } else {
        showQuizResult();
      }
    }, 1200);
  }

  function showQuizResult() {
    $('#quizActive').style.display = 'none';
    $('#quizResultArea').style.display = 'block';

    const pct = (quizState.score / quizState.questions.length) * 100;
    let rank, rankClass, emoji;
    if (pct >= 90)      { rank = 'MCU LEGEND'; rankClass = 'rank-legend'; emoji = '👑'; }
    else if (pct >= 70) { rank = 'MCU HERO'; rankClass = 'rank-hero'; emoji = '🦸'; }
    else if (pct >= 50) { rank = 'MCU SIDEKICK'; rankClass = 'rank-sidekick'; emoji = '🤝'; }
    else                { rank = 'MCU CIVILIAN'; rankClass = 'rank-civilian'; emoji = '🧑'; }

    $('#quizResultArea').innerHTML = `
      <div class="quiz-result-card">
        <div class="result-icon">${emoji}</div>
        <h3>QUIZ COMPLETE!</h3>
        <div class="result-score">${quizState.score} / ${quizState.questions.length}</div>
        <div class="result-detail">You got ${pct.toFixed(0)}% correct answers</div>
        <div class="result-rank ${rankClass}">${rank}</div>
        <div style="margin-top:10px">
          <button class="btn btn-primary" onclick="document.getElementById('quizStart').style.display='block';document.getElementById('quizResultArea').style.display='none';">🔄 PLAY AGAIN</button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // ADMIN PANEL (CRUD — localStorage)
  // ═══════════════════════════════════════════════════════════
  let adminTab = 'add-char';

  function initAdmin() {
    const tabs = $('#adminTabs');
    if (!tabs) return;
    tabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('admin-tab')) {
        $$('.admin-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        adminTab = e.target.dataset.tab;
        renderAdminContent();
      }
    });
    renderAdminContent();
  }

  function renderAdminContent() {
    const container = $('#adminContent');
    if (!container) return;

    if (adminTab === 'add-char') {
      container.innerHTML = `
        <div class="admin-form">
          <h3>➕ ADD NEW CHARACTER</h3>
          <div class="form-grid">
            <div class="form-group"><label>Character Name</label><input type="text" id="ac_name" placeholder="e.g. Moon Knight" /></div>
            <div class="form-group"><label>Real Name</label><input type="text" id="ac_realName" placeholder="e.g. Marc Spector" /></div>
            <div class="form-group"><label>Type</label>
              <select id="ac_type"><option value="hero">Hero</option><option value="villain">Villain</option><option value="supporting">Supporting</option></select>
            </div>
            <div class="form-group"><label>Species</label><input type="text" id="ac_species" placeholder="Human, Asgardian..." /></div>
            <div class="form-group"><label>Status</label>
              <select id="ac_status"><option value="Alive">Alive</option><option value="Dead">Dead</option><option value="Unknown">Unknown</option></select>
            </div>
            <div class="form-group"><label>Team</label><input type="text" id="ac_team" placeholder="Avengers..." /></div>
            <div class="form-group"><label>Strength (0-100)</label><input type="number" id="ac_str" min="0" max="100" value="50" /></div>
            <div class="form-group"><label>Intelligence (0-100)</label><input type="number" id="ac_int" min="0" max="100" value="50" /></div>
            <div class="form-group"><label>Speed (0-100)</label><input type="number" id="ac_spd" min="0" max="100" value="50" /></div>
            <div class="form-group"><label>Durability (0-100)</label><input type="number" id="ac_dur" min="0" max="100" value="50" /></div>
            <div class="form-group"><label>Energy Power (0-100)</label><input type="number" id="ac_eng" min="0" max="100" value="50" /></div>
            <div class="form-group"><label>First Appearance</label><input type="text" id="ac_first" placeholder="Movie name (year)" /></div>
            <div class="form-group full-width"><label>Powers (comma separated)</label><input type="text" id="ac_powers" placeholder="Flight, Super Strength..." /></div>
            <div class="form-group full-width"><label>Weakness</label><input type="text" id="ac_weakness" placeholder="Description..." /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.querySelectorAll('.admin-form input').forEach(i=>i.value='')">Clear</button>
            <button class="btn btn-primary" id="addCharBtn">➕ Add Character</button>
          </div>
        </div>`;

      $('#addCharBtn').addEventListener('click', addNewCharacter);

    } else if (adminTab === 'add-movie') {
      container.innerHTML = `
        <div class="admin-form">
          <h3>🎬 ADD NEW MOVIE</h3>
          <div class="form-grid">
            <div class="form-group"><label>Movie Name</label><input type="text" id="am_name" placeholder="e.g. Avengers: Secret Wars" /></div>
            <div class="form-group"><label>Release Date</label><input type="date" id="am_date" /></div>
            <div class="form-group"><label>Phase</label>
              <select id="am_phase"><option value="1">Phase 1</option><option value="2">Phase 2</option><option value="3">Phase 3</option><option value="4">Phase 4</option><option value="5" selected>Phase 5</option><option value="6">Phase 6</option></select>
            </div>
            <div class="form-group"><label>Duration</label><input type="text" id="am_duration" placeholder="2h 30m" /></div>
            <div class="form-group"><label>Director</label><input type="text" id="am_director" placeholder="Director name" /></div>
            <div class="form-group"><label>Box Office</label><input type="text" id="am_boxoffice" placeholder="$1.2B" /></div>
            <div class="form-group"><label>IMDb Rating</label><input type="number" id="am_rating" min="0" max="10" step="0.1" value="7.0" /></div>
            <div class="form-group"><label>Main Hero</label><input type="text" id="am_hero" placeholder="Main hero" /></div>
            <div class="form-group"><label>Main Villain</label><input type="text" id="am_villain" placeholder="Main villain" /></div>
            <div class="form-group"><label>Producer</label><input type="text" id="am_producer" placeholder="Kevin Feige" value="Kevin Feige" /></div>
            <div class="form-group full-width"><label>Story Summary</label><textarea id="am_summary" placeholder="Brief plot summary..."></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="document.querySelectorAll('.admin-form input, .admin-form textarea').forEach(i=>i.value='')">Clear</button>
            <button class="btn btn-primary" id="addMovieBtn">🎬 Add Movie</button>
          </div>
        </div>`;

      $('#addMovieBtn').addEventListener('click', addNewMovie);

    } else if (adminTab === 'manage') {
      const customChars = JSON.parse(localStorage.getItem('mcu_custom_chars') || '[]');
      const customMovies = JSON.parse(localStorage.getItem('mcu_custom_movies') || '[]');

      container.innerHTML = `
        <div class="admin-form">
          <h3>📋 MANAGE DATABASE</h3>
          <p style="color:var(--text-muted);margin-bottom:20px">Custom entries you have added (stored in your browser)</p>

          <h4 style="color:var(--red);font-family:'Bebas Neue',cursive;font-size:1.2rem;margin-top:15px;letter-spacing:1px">CUSTOM CHARACTERS (${customChars.length})</h4>
          ${customChars.length === 0 ? '<p style="color:var(--text-muted);font-size:0.9rem;margin:10px 0">No custom characters added yet.</p>' : `
            <table class="admin-table">
              <tr><th>Name</th><th>Type</th><th>Team</th><th>Power</th><th>Action</th></tr>
              ${customChars.map((c, i) => `
                <tr>
                  <td>${c.icon || '🦸'} ${c.name}</td>
                  <td style="text-transform:capitalize">${c.type}</td>
                  <td>${c.team}</td>
                  <td>${Object.values(c.stats).reduce((a,b) => a+b, 0)}/500</td>
                  <td><button class="btn btn-danger btn-sm" onclick="deleteCustomChar(${i})">🗑️ Delete</button></td>
                </tr>
              `).join('')}
            </table>`}

          <h4 style="color:var(--red);font-family:'Bebas Neue',cursive;font-size:1.2rem;margin-top:25px;letter-spacing:1px">CUSTOM MOVIES (${customMovies.length})</h4>
          ${customMovies.length === 0 ? '<p style="color:var(--text-muted);font-size:0.9rem;margin:10px 0">No custom movies added yet.</p>' : `
            <table class="admin-table">
              <tr><th>Name</th><th>Phase</th><th>Rating</th><th>Box Office</th><th>Action</th></tr>
              ${customMovies.map((m, i) => `
                <tr>
                  <td>🎬 ${m.name}</td>
                  <td>Phase ${m.phase}</td>
                  <td>⭐ ${m.imdbRating}</td>
                  <td>${m.boxOffice}</td>
                  <td><button class="btn btn-danger btn-sm" onclick="deleteCustomMovie(${i})">🗑️ Delete</button></td>
                </tr>
              `).join('')}
            </table>`}
        </div>`;
    }
  }

  function addNewCharacter() {
    const name = $('#ac_name').value.trim();
    if (!name) return showToast('Please enter character name', true);

    const icons = ['🦸','🦹','👤','⚡','🔥','💀','🌟','🗡️','🛡️','🎯'];
    const newChar = {
      id: MCU_DATA.characters.length + 1000 + Math.floor(Math.random()*999),
      type: $('#ac_type').value,
      name: name,
      realName: $('#ac_realName').value || name,
      nickname: name,
      age: '?',
      gender: 'Unknown',
      species: $('#ac_species').value || 'Unknown',
      status: $('#ac_status').value,
      firstAppearance: $('#ac_first').value || 'TBD',
      powers: ($('#ac_powers').value || 'Unknown').split(',').map(s => s.trim()),
      skills: [],
      weapons: [],
      weakness: $('#ac_weakness').value || 'Unknown',
      movies: [],
      allies: [],
      enemies: [],
      team: $('#ac_team').value || 'Independent',
      stats: {
        strength:    parseInt($('#ac_str').value) || 50,
        intelligence:parseInt($('#ac_int').value) || 50,
        speed:       parseInt($('#ac_spd').value) || 50,
        durability:  parseInt($('#ac_dur').value) || 50,
        energy:      parseInt($('#ac_eng').value) || 50
      },
      icon: icons[Math.floor(Math.random()*icons.length)],
      custom: true
    };

    MCU_DATA.characters.push(newChar);

    // Persist custom chars
    const customs = JSON.parse(localStorage.getItem('mcu_custom_chars') || '[]');
    customs.push(newChar);
    localStorage.setItem('mcu_custom_chars', JSON.stringify(customs));

    renderCharacters(currentCharFilter);
    updateCounts();
    showToast(`✅ ${name} added successfully!`);
    document.querySelectorAll('.admin-form input').forEach(i => i.value = '');
  }

  function addNewMovie() {
    const name = $('#am_name').value.trim();
    if (!name) return showToast('Please enter movie name', true);

    const newMovie = {
      id: MCU_DATA.movies.length + 1000 + Math.floor(Math.random()*999),
      name: name,
      releaseDate: $('#am_date').value || '2025-01-01',
      phase: parseInt($('#am_phase').value),
      duration: $('#am_duration').value || '2h 0m',
      director: $('#am_director').value || 'Unknown',
      producer: $('#am_producer').value || 'Kevin Feige',
      boxOffice: $('#am_boxoffice').value || '$0M',
      imdbRating: parseFloat($('#am_rating').value) || 7.0,
      mainHero: $('#am_hero').value || 'TBD',
      mainVillain: $('#am_villain').value || 'TBD',
      summary: $('#am_summary').value || 'No summary available.',
      poster: '🎬',
      custom: true
    };

    MCU_DATA.movies.push(newMovie);

    const customs = JSON.parse(localStorage.getItem('mcu_custom_movies') || '[]');
    customs.push(newMovie);
    localStorage.setItem('mcu_custom_movies', JSON.stringify(customs));

    renderMovies('all');
    renderTimeline(currentTimelineOrder);
    updateCounts();
    showToast(`✅ ${name} added successfully!`);
    document.querySelectorAll('.admin-form input, .admin-form textarea').forEach(i => i.value = '');
  }

  // Global delete functions
  window.deleteCustomChar = function(index) {
    const customs = JSON.parse(localStorage.getItem('mcu_custom_chars') || '[]');
    const removed = customs.splice(index, 1)[0];
    localStorage.setItem('mcu_custom_chars', JSON.stringify(customs));
    MCU_DATA.characters = MCU_DATA.characters.filter(c => !(c.custom && c.name === removed.name));
    renderCharacters(currentCharFilter);
    renderAdminContent();
    updateCounts();
    showToast(`🗑️ ${removed.name} deleted`);
  };

  window.deleteCustomMovie = function(index) {
    const customs = JSON.parse(localStorage.getItem('mcu_custom_movies') || '[]');
    const removed = customs.splice(index, 1)[0];
    localStorage.setItem('mcu_custom_movies', JSON.stringify(customs));
    MCU_DATA.movies = MCU_DATA.movies.filter(m => !(m.custom && m.name === removed.name));
    renderMovies('all');
    renderTimeline(currentTimelineOrder);
    renderAdminContent();
    updateCounts();
    showToast(`🗑️ ${removed.name} deleted`);
  };

  function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'admin-toast' + (isError ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function updateCounts() {
    $('#charCount').textContent  = MCU_DATA.characters.length;
    $('#movieCount').textContent = MCU_DATA.movies.length;
    animateNumber($('#totalMovies'), MCU_DATA.movies.length);
    animateNumber($('#totalCharacters'), MCU_DATA.characters.length);
    animateNumber($('#totalVillains'), MCU_DATA.characters.filter(c => c.type === 'villain').length);
  }

  // Load custom data from localStorage on startup
  function loadCustomData() {
    const customChars = JSON.parse(localStorage.getItem('mcu_custom_chars') || '[]');
    const customMovies = JSON.parse(localStorage.getItem('mcu_custom_movies') || '[]');
    customChars.forEach(c => {
      if (!MCU_DATA.characters.find(ch => ch.name === c.name && ch.custom)) MCU_DATA.characters.push(c);
    });
    customMovies.forEach(m => {
      if (!MCU_DATA.movies.find(mv => mv.name === m.name && mv.custom)) MCU_DATA.movies.push(m);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // LOGIN SYSTEM (localStorage)
  // ═══════════════════════════════════════════════════════════
  let currentUser = null;

  function initLogin() {
    const loginBtn = $('#loginBtn');
    const loginOverlay = $('#loginModalOverlay');
    const loginClose = $('#loginModalClose');
    const loginForm = $('#loginForm');

    if (!loginBtn || !loginOverlay) return;

    // Check saved session
    const savedUser = localStorage.getItem('mcu_current_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      updateUserUI();
    }

    loginBtn.addEventListener('click', () => {
      if (currentUser) {
        // Logout
        if (confirm('Logout from ' + currentUser.username + '?')) {
          currentUser = null;
          localStorage.removeItem('mcu_current_user');
          updateUserUI();
          showToast('👋 Logged out');
        }
      } else {
        loginOverlay.classList.add('show');
      }
    });

    loginClose.addEventListener('click', () => loginOverlay.classList.remove('show'));
    loginOverlay.addEventListener('click', (e) => { if (e.target === loginOverlay) loginOverlay.classList.remove('show'); });

    // Login tabs
    $$('.login-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.login-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isRegister = tab.dataset.ltab === 'register';
        $('#loginSubmitBtn').textContent = isRegister ? 'REGISTER' : 'LOGIN';
      });
    });

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = $('#loginUsername').value.trim();
      const password = $('#loginPassword').value.trim();
      if (!username || !password) return showToast('Fill all fields', true);

      const isRegister = $$('.login-tab.active')[0]?.dataset.ltab === 'register';
      const users = JSON.parse(localStorage.getItem('mcu_users') || '{}');

      if (isRegister) {
        if (users[username]) return showToast('Username already exists', true);
        users[username] = { password, favorites: [], ratings: {} };
        localStorage.setItem('mcu_users', JSON.stringify(users));
        currentUser = { username, favorites: [], ratings: {} };
        localStorage.setItem('mcu_current_user', JSON.stringify(currentUser));
        showToast(`✅ Welcome ${username}! Registered successfully.`);
      } else {
        if (!users[username]) return showToast('User not found', true);
        if (users[username].password !== password) return showToast('Wrong password', true);
        currentUser = { username, favorites: users[username].favorites || [], ratings: users[username].ratings || {} };
        localStorage.setItem('mcu_current_user', JSON.stringify(currentUser));
        showToast(`✅ Welcome back, ${username}!`);
      }

      updateUserUI();
      loginOverlay.classList.remove('show');
      loginForm.reset();
    });
  }

  function updateUserUI() {
    const area = $('#userArea');
    if (!area) return;
    if (currentUser) {
      area.innerHTML = `
        <div class="user-info-display">
          <span class="user-name">👤 ${currentUser.username}</span>
          <button class="login-btn logged-in" id="loginBtn" title="Click to logout">⚡ ${currentUser.favorites.length} favs</button>
        </div>`;
      // Re-bind
      area.querySelector('#loginBtn')?.addEventListener('click', () => {
        if (confirm('Logout from ' + currentUser.username + '?')) {
          currentUser = null;
          localStorage.removeItem('mcu_current_user');
          updateUserUI();
          showToast('👋 Logged out');
        }
      });
    } else {
      area.innerHTML = `<button class="login-btn" id="loginBtn">👤 Login</button>`;
      area.querySelector('#loginBtn')?.addEventListener('click', () => {
        $('#loginModalOverlay').classList.add('show');
      });
    }
  }

  function toggleFavorite(charId) {
    if (!currentUser) return showToast('Login to save favorites', true);
    const idx = currentUser.favorites.indexOf(charId);
    if (idx >= 0) currentUser.favorites.splice(idx, 1);
    else currentUser.favorites.push(charId);

    // Save
    localStorage.setItem('mcu_current_user', JSON.stringify(currentUser));
    const users = JSON.parse(localStorage.getItem('mcu_users') || '{}');
    if (users[currentUser.username]) {
      users[currentUser.username].favorites = currentUser.favorites;
      localStorage.setItem('mcu_users', JSON.stringify(users));
    }
    updateUserUI();
  }

  // ═══════════════════════════════════════════════════════════
  // ENHANCED MODAL — Radar + Universe + Favorites
  // ═══════════════════════════════════════════════════════════
  // Override the existing openCharModal to add radar chart + universe + fav button
  const _originalOpenCharModal = openCharModal;

  openCharModal = function(charId) {
    const c = MCU_DATA.characters.find(ch => ch.id === charId);
    if (!c) return;

    const statusClass = c.status.toLowerCase().includes('alive') ? 'alive'
                      : c.status.toLowerCase().includes('dead') ? 'dead'
                      : c.status.toLowerCase().includes('retired') ? 'retired'
                      : 'unknown';

    const uv = MCU_DATA.universeData?.[c.name] || {};
    const isFav = currentUser && currentUser.favorites.includes(charId);

    $('#modalHero').innerHTML = `
      <div class="modal-hero-inner">
        <div class="modal-avatar">${c.icon}</div>
        <div>
          <h2>${c.name}</h2>
          <div class="modal-subtitle">${c.realName} · ${c.nickname} · <span class="char-status ${statusClass}" style="position:static;display:inline-block;">${c.status}</span></div>
          ${uv.universe ? `<div style="margin-top:4px;font-size:0.82rem;color:#00bcd4">🌐 ${uv.universe} ${uv.variant ? '· <span style="color:#f0b90b">⚡ VARIANT</span>' : ''}</div>` : ''}
          ${uv.variantNote ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${uv.variantNote}</div>` : ''}
        </div>
      </div>
    `;

    $('#modalBody').innerHTML = `
      <button class="fav-btn ${isFav ? 'favorited' : ''}" id="modalFavBtn" title="Toggle Favorite">${isFav ? '❤️' : '🤍'}</button>

      <div class="modal-section">
        <h4>🔹 Basic Information</h4>
        <div class="modal-grid">
          <div class="modal-field"><label>Character Name</label><span>${c.name}</span></div>
          <div class="modal-field"><label>Real Name</label><span>${c.realName}</span></div>
          <div class="modal-field"><label>Nickname</label><span>${c.nickname}</span></div>
          <div class="modal-field"><label>Age</label><span>${c.age}</span></div>
          <div class="modal-field"><label>Gender</label><span>${c.gender}</span></div>
          <div class="modal-field"><label>Species</label><span>${c.species}</span></div>
          <div class="modal-field"><label>Status</label><span>${c.status}</span></div>
          <div class="modal-field"><label>First Appearance</label><span>${c.firstAppearance}</span></div>
        </div>
      </div>

      <div class="modal-section">
        <h4>⚡ Powers & Skills</h4>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Powers</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">${c.powers.map(p => `<span class="modal-tag">${p}</span>`).join('')}</div>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Skills</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">${c.skills.map(s => `<span class="modal-tag">${s}</span>`).join('')}</div>
        <div class="modal-grid">
          <div class="modal-field"><label>Weapons</label><span>${c.weapons.join(', ')}</span></div>
          <div class="modal-field"><label>Weakness</label><span>${c.weakness}</span></div>
        </div>
      </div>

      <div class="modal-section">
        <h4>📊 Power Radar Chart</h4>
        <div class="radar-chart-container"><canvas id="modalRadarCanvas" width="300" height="300"></canvas></div>
        <div class="char-power-bars" style="max-width:500px;margin:0 auto">${renderPowerBars(c.stats)}</div>
      </div>

      <div class="modal-section">
        <h4>🎬 Movie Appearances (${c.movies.length})</h4>
        <div class="modal-tag-list">${c.movies.map(m => `<span class="modal-tag movie">${m}</span>`).join('')}</div>
      </div>

      <div class="modal-section">
        <h4>🤝 Relationships</h4>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Allies</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">${c.allies.map(a => `<span class="modal-tag ally">${a}</span>`).join('')}</div>
        <div style="margin-bottom:10px"><label style="color:var(--text-muted);font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px">Enemies</label></div>
        <div class="modal-tag-list" style="margin-bottom:14px">${c.enemies.map(e => `<span class="modal-tag enemy">${e}</span>`).join('')}</div>
        <div class="modal-field" style="margin-top:10px"><label>Team</label><span style="color:var(--gold);font-weight:700">${c.team}</span></div>
      </div>
    `;

    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Draw radar chart
    setTimeout(() => {
      const typeColor = c.type === 'villain' ? '#9c27b0' : c.type === 'supporting' ? '#1e88e5' : '#e23636';
      drawRadarChart($('#modalRadarCanvas'), [c.stats], [typeColor], [c.name]);
      animatePowerBars();
    }, 200);

    // Favorite button
    $('#modalFavBtn')?.addEventListener('click', () => {
      toggleFavorite(charId);
      const isNowFav = currentUser && currentUser.favorites.includes(charId);
      $('#modalFavBtn').textContent = isNowFav ? '❤️' : '🤍';
      $('#modalFavBtn').classList.toggle('favorited', isNowFav);
    });
  };

  // ═══════════════════════════════════════════════════════════
  // ENHANCED ANALYTICS — Pie Charts
  // ═══════════════════════════════════════════════════════════
  function renderAnalytics() {
    const chars = MCU_DATA.characters;
    const movies = MCU_DATA.movies;

    // Heroes vs Villains vs Supporting
    const heroCount = chars.filter(c => c.type === 'hero').length;
    const villainCount = chars.filter(c => c.type === 'villain').length;
    const supportCount = chars.filter(c => c.type === 'supporting').length;
    drawPieChart($('#pieHeroVillain'), [
      { label: 'Heroes', value: heroCount, color: '#e23636' },
      { label: 'Villains', value: villainCount, color: '#9c27b0' },
      { label: 'Supporting', value: supportCount, color: '#1e88e5' }
    ], $('#legendHeroVillain'));

    // Alive vs Dead
    const alive = chars.filter(c => c.status.toLowerCase().includes('alive')).length;
    const dead  = chars.filter(c => c.status.toLowerCase().includes('dead')).length;
    const other = chars.length - alive - dead;
    drawPieChart($('#pieAliveStatus'), [
      { label: 'Alive', value: alive, color: '#4caf50' },
      { label: 'Dead', value: dead, color: '#ef5350' },
      { label: 'Other', value: other, color: '#ff9800' }
    ], $('#legendAliveStatus'));

    // Movies by Phase
    const phases = [1,2,3,4,5];
    const phaseColors = ['#e74c3c','#3498db','#9b59b6','#2ecc71','#f39c12'];
    drawPieChart($('#piePhaseMovies'), phases.map((p, i) => ({
      label: `Phase ${p}`,
      value: movies.filter(m => m.phase === p).length,
      color: phaseColors[i]
    })), $('#legendPhaseMovies'));
  }

  // ═══════════════════════════════════════════════════════════
  // HORIZONTAL TIMELINE
  // ═══════════════════════════════════════════════════════════
  function renderHorizontalTimeline() {
    const container = $('#hTimeline');
    if (!container) return;
    const movies = [...MCU_DATA.movies].sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));
    const phaseColors = { 1:'#e74c3c', 2:'#3498db', 3:'#9b59b6', 4:'#2ecc71', 5:'#f39c12' };

    container.innerHTML = movies.map(m => `
      <div class="h-timeline-item">
        <div class="h-timeline-year">${m.releaseDate.split('-')[0]}</div>
        <div class="h-timeline-dot" style="background:${phaseColors[m.phase] || '#e23636'}"></div>
        <div class="h-timeline-card">
          <h4>${m.name}</h4>
          <div class="h-tl-phase" style="color:${phaseColors[m.phase]}">Phase ${m.phase} · ⭐ ${m.imdbRating}</div>
        </div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALIZE EVERYTHING
  // ═══════════════════════════════════════════════════════════
  loadCustomData();
  initDashboard();
  renderCharacters();
  renderMovies();
  renderActors();
  renderTeams();
  renderTimeline();
  renderStatistics();
  initComparison();
  initQuiz();
  initAdmin();
  initLogin();
  renderAnalytics();
  renderHorizontalTimeline();

  // Draw network graph when statistics page is viewed
  let networkDrawn = false;
  const origNavigate = navigateTo;
  navigateTo = function(pageId) {
    origNavigate(pageId);
    if (pageId === 'statistics' && !networkDrawn) {
      setTimeout(() => { drawNetworkGraph(); networkDrawn = true; }, 300);
    }
    if (pageId === 'comparison') {
      setTimeout(() => {
        const s1 = $('#compChar1'), s2 = $('#compChar2');
        if (s1 && s2) compareCharacters(parseInt(s1.value), parseInt(s2.value));
      }, 200);
    }
  };
});
