(function () {
  const WISHES_STORAGE_KEY = 'chungdoi_clone_wishes_subin_rosmy';
  const RSVP_STORAGE_KEY = 'chungdoi_clone_rsvp_subin_rosmy';
  const COMMUNITY_API_URL = '/api/community';

  const WISH_BATCHES = [
    [
      'Wishing the newlyweds the strength to face every challenge hand in hand.',
      'May you build a warm home filled with laughter and joy.',
      'May married life be the most wonderful journey the two of you ever take.',
      'Wishing you happiness together until your hair turns grey, side by side for life.',
      'May happiness be present in every moment you share together.'
    ],
    [
      'Wishing Subin and Rosmy a lifetime of love, understanding, and endless blessings.',
      'May today mark the beginning of your happiest chapter together.',
      'Sending heartfelt congratulations and warm wishes for a joyful marriage.',
      'May your bond grow deeper and sweeter with every passing year.',
      'Wishing you both a future overflowing with peace, love, and cherished memories.'
    ],
    [
      'Congratulations on finding your forever in each other. God bless your union!',
      'May your love story continue to inspire everyone around you.',
      'Wishing you countless sunrises filled with gratitude, laughter, and love.',
      'Here’s to a beautiful wedding day and an even more beautiful life together.',
      'May every day bring you new reasons to smile together.'
    ]
  ];

  const envelopeEl = document.getElementById('invite-envelope');
  const openBtn = document.getElementById('open-invite-btn');
  const waxSealEl = document.getElementById('wax-seal');
  const sealFxEl = document.getElementById('seal-fx');
  const coverGuestNameEl = document.getElementById('cover-guest-name');

  // --- Dynamic Guest Name Personalization (?to=Guest+Name) ---
  (function applyGuestPersonalization() {
    if (!coverGuestNameEl) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const guestName = (params.get('to') || '').trim();
      if (guestName) {
        coverGuestNameEl.textContent = guestName;
        coverGuestNameEl.classList.remove('hidden');
      } else {
        coverGuestNameEl.textContent = '';
        coverGuestNameEl.classList.add('hidden');
      }
    } catch (_) {}
  })();

  const addToCalLink = document.getElementById('add-to-calendar-link');

  const rsvpOpenBtn = document.getElementById('rsvp-open-btn');
  const rsvpModal = document.getElementById('rsvp-modal');
  const rsvpCloseBtn = document.getElementById('rsvp-close-btn');
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpNameInput = document.getElementById('rsvp-name');
  const rsvpOptYes = document.getElementById('rsvp-opt-yes');
  const rsvpOptNo = document.getElementById('rsvp-opt-no');
  const rsvpGuestsWrap = document.getElementById('rsvp-guests-wrap');
  const rsvpMsgWrap = document.getElementById('rsvp-msg-wrap');
  const rsvpMessageInput = document.getElementById('rsvp-message');
  const rsvpSubmitBtn = document.getElementById('rsvp-submit-btn');
  const guestsDecBtn = document.getElementById('guests-dec-btn');
  const guestsIncBtn = document.getElementById('guests-inc-btn');
  const guestsCountVal = document.getElementById('guests-count-val');

  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookName = document.getElementById('guestbook-name');
  const guestbookWishes = document.getElementById('guestbook-wishes');
  const wishesListEl = document.getElementById('wishes-list');

  const aiWishBtn = document.getElementById('ai-wish-btn');
  const wishesModal = document.getElementById('wishes-modal');
  const wishesCloseX = document.getElementById('wishes-close-x');
  const wishesCloseBtn = document.getElementById('wishes-close-btn');
  const wishesRegenBtn = document.getElementById('wishes-regenerate-btn');
  const suggestedWishesList = document.getElementById('suggested-wishes-list');

  const toasterEl = document.getElementById('toaster');

  let attendingChoice = null;
  let guestCount = 1;
  let currentWishBatch = 0;

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'bg-white text-gray-900 px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 text-sm font-medium flex items-center gap-2 transition-all duration-300';
    toast.style.pointerEvents = 'auto';
    toast.innerHTML = '<span style="color:#10b981;">✓</span><span></span>';
    toast.querySelector('span:last-child').textContent = message;
    toasterEl.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- Envelope Opening Transition ---
  function finishOpenImmediate() {
    if (envelopeEl) {
      envelopeEl.style.display = 'none';
    }
    document.body.style.overflow = '';
  }

  function playOpenAnimation() {
    if (!envelopeEl) return;
    if (openBtn) openBtn.setAttribute('aria-busy', 'true');

    // Expanding ring effect from seal
    if (sealFxEl) {
      const ring = document.createElement('div');
      ring.style.cssText = 'position:absolute;left:0;top:0;width:56px;height:56px;border-radius:9999px;border:2px solid #ffdfaf;animation:seal-ring 0.7s ease-out forwards;';
      sealFxEl.appendChild(ring);

      // Particle burst
      const colors = ['#ffdfaf', '#ffefd6', '#c39a5e', '#1b4a86'];
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const dist = 45 + (i % 3) * 18;
        const dx = Math.round(Math.cos(angle) * dist) + 'px';
        const dy = Math.round(Math.sin(angle) * dist) + 'px';
        const p = document.createElement('div');
        p.style.cssText =
          'position:absolute;left:0;top:0;width:8px;height:8px;border-radius:9999px;' +
          'background:' + colors[i % colors.length] + ';' +
          '--dx:' + dx + ';--dy:' + dy + ';--rot-start:15deg;--rot-end:180deg;' +
          'animation:particle-burst 0.7s ease-out forwards;';
        sealFxEl.appendChild(p);
      }
    }

    if (waxSealEl) {
      waxSealEl.style.animation = 'seal-break 0.55s ease-out forwards';
    }

    setTimeout(() => {
      envelopeEl.style.animation = 'envelope-away 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards';
      envelopeEl.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }, 280);

    setTimeout(() => {
      envelopeEl.style.display = 'none';
      if (typeof armAndScheduleAutoScroll === 'function') {
        armAndScheduleAutoScroll(450);
      }
    }, 1150);
  }

  if (new URLSearchParams(window.location.search).get('open') === '1') {
    finishOpenImmediate();
  } else {
    document.body.style.overflow = 'hidden';
  }

  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('open', '1');
        window.history.replaceState({}, '', url.toString());
      } catch (_) {}
      playOpenAnimation();
      if (typeof startBackgroundMusic === 'function') {
        startBackgroundMusic();
      }
    });
  }

  // --- Add to Calendar ---
  if (addToCalLink) {
    addToCalLink.addEventListener('click', function (e) {
      e.preventDefault();
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Subin & Rosmy Wedding//EN',
        'BEGIN:VEVENT',
        'UID:subin-rosmy-wedding-20270117@chungdoi-clone',
        'DTSTAMP:20261125T100000Z',
        'DTSTART:20270117T060000Z',
        'DTEND:20270117T090000Z',
        'SUMMARY:Wedding of Subin Sojan & Rosmy Davis',
        "LOCATION:St. Sebastian's Church, Rayarome (https://maps.app.goo.gl/sMGZ8GRjTnfYFtte8)",
        "DESCRIPTION:Wedding of Subin Sojan & Rosmy Davis at 11:30 AM at St. Sebastian's Church\\, Rayarome. *Reception at Church Parish Hall\\nMap: https://maps.app.goo.gl/sMGZ8GRjTnfYFtte8",
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subin-rosmy-wedding.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Calendar invite downloaded!');
    });
  }

  // --- RSVP Modal ---
  function openRsvpModal() {
    rsvpModal.classList.remove('hidden');
    rsvpModal.classList.add('flex');
  }

  function closeRsvpModal() {
    rsvpModal.classList.add('hidden');
    rsvpModal.classList.remove('flex');
  }

  function styleRadioOption(labelEl, active, tone) {
    const iconWrap = labelEl.querySelector('.rsvp-icon-wrap');
    const iconSvg = iconWrap.querySelector('svg');
    const textEl = labelEl.querySelector('.rsvp-label-text');

    labelEl.classList.remove(
      'border-gray-100', 'bg-gray-50/50', 'hover:border-gray-200', 'hover:bg-gray-50',
      'border-emerald-500', 'bg-emerald-50/50', 'border-rose-400', 'bg-rose-50/50'
    );
    iconWrap.classList.remove('bg-gray-200', 'bg-emerald-500', 'bg-rose-500');
    iconSvg.classList.remove('text-gray-500', 'text-white');
    textEl.classList.remove('text-gray-700', 'text-emerald-700', 'text-rose-700');

    if (active && tone === 'yes') {
      labelEl.classList.add('border-emerald-500', 'bg-emerald-50/50');
      iconWrap.classList.add('bg-emerald-500');
      iconSvg.classList.add('text-white');
      textEl.classList.add('text-emerald-700');
    } else if (active && tone === 'no') {
      labelEl.classList.add('border-rose-400', 'bg-rose-50/50');
      iconWrap.classList.add('bg-rose-500');
      iconSvg.classList.add('text-white');
      textEl.classList.add('text-rose-700');
    } else {
      labelEl.classList.add('border-gray-100', 'bg-gray-50/50', 'hover:border-gray-200', 'hover:bg-gray-50');
      iconWrap.classList.add('bg-gray-200');
      iconSvg.classList.add('text-gray-500');
      textEl.classList.add('text-gray-700');
    }
  }

  function updateRsvpChoice(choice) {
    attendingChoice = choice;
    styleRadioOption(rsvpOptYes, choice === 'yes', 'yes');
    styleRadioOption(rsvpOptNo, choice === 'no', 'no');

    if (choice === 'yes') {
      rsvpGuestsWrap.classList.remove('hidden');
      rsvpMsgWrap.classList.remove('hidden');
    } else {
      rsvpGuestsWrap.classList.add('hidden');
      rsvpMsgWrap.classList.remove('hidden');
    }
    rsvpSubmitBtn.disabled = false;
  }

  function updateGuestCounter(delta) {
    guestCount = Math.max(1, Math.min(20, guestCount + delta));
    guestsCountVal.textContent = String(guestCount);
    guestsDecBtn.disabled = guestCount <= 1;
    guestsIncBtn.disabled = guestCount >= 20;
  }

  rsvpOpenBtn.addEventListener('click', openRsvpModal);
  rsvpCloseBtn.addEventListener('click', closeRsvpModal);
  rsvpModal.addEventListener('click', function (e) {
    if (e.target === rsvpModal) closeRsvpModal();
  });

  rsvpOptYes.querySelector('input').addEventListener('change', function () {
    updateRsvpChoice('yes');
  });
  rsvpOptNo.querySelector('input').addEventListener('change', function () {
    updateRsvpChoice('no');
  });
  guestsDecBtn.addEventListener('click', function () {
    updateGuestCounter(-1);
  });
  guestsIncBtn.addEventListener('click', function () {
    updateGuestCounter(1);
  });

  const rsvpListWrap = document.getElementById('rsvp-list-wrap');
  const rsvpListEl = document.getElementById('rsvp-list');
  const rsvpSummaryTitle = document.getElementById('rsvp-summary-title');

  const SYNCED_KEYS_STORAGE_KEY = 'wedding_subin_rosmy_synced_keys';
  let remoteConfigured = false;
  let remoteWishes = null;
  let remoteRsvps = null;
  let backfillStarted = false;

  function readLocalArray(storageKey) {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function loadRsvps() {
    if (remoteConfigured && Array.isArray(remoteRsvps)) return remoteRsvps;
    return readLocalArray(RSVP_STORAGE_KEY);
  }

  function saveLocalRsvps(list) {
    try {
      localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function renderRsvps() {
    if (!rsvpListWrap || !rsvpListEl) return;
    const rsvps = loadRsvps();
    if (!rsvps.length) {
      rsvpListWrap.classList.add('hidden');
      rsvpListEl.innerHTML = '';
      return;
    }

    rsvpListWrap.classList.remove('hidden');
    if (rsvpSummaryTitle) {
      const totalAttending = rsvps.reduce((sum, item) => sum + (item.attending ? (item.guests || 1) : 0), 0);
      rsvpSummaryTitle.textContent =
        'Guest Responses (' + rsvps.length + (totalAttending ? ' · ' + totalAttending + ' Attending' : '') + ')';
    }

    rsvpListEl.innerHTML = '';
    rsvps.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border px-4 py-2.5 text-left';
      card.style.cssText = 'border-color: rgba(255, 223, 175, 0.3); background-color: rgba(15, 47, 87, 0.45);';

      const topRow = document.createElement('div');
      topRow.className = 'flex flex-wrap items-center justify-between gap-2';

      const nameEl = document.createElement('p');
      nameEl.className = 'text-sm font-semibold';
      nameEl.style.color = '#ffdfaf';
      nameEl.textContent = item.name;

      const badge = document.createElement('span');
      badge.className = 'rounded-full px-2.5 py-0.5 text-[11px] font-medium';
      if (item.attending) {
        const count = item.guests || 1;
        badge.style.cssText = 'background-color: rgba(16, 185, 129, 0.18); color: #a7f3d0; border: 1px solid rgba(16, 185, 129, 0.35);';
        badge.textContent = 'Attending · ' + count + (count === 1 ? ' Guest' : ' Guests');
      } else {
        badge.style.cssText = 'background-color: rgba(255, 239, 214, 0.1); color: rgba(255, 239, 214, 0.8); border: 1px solid rgba(255, 223, 175, 0.25);';
        badge.textContent = "Can't Make It";
      }

      topRow.appendChild(nameEl);
      topRow.appendChild(badge);
      card.appendChild(topRow);

      if (item.message) {
        const msgEl = document.createElement('p');
        msgEl.className = 'mt-1 text-xs whitespace-pre-line';
        msgEl.style.color = '#ffefd6';
        msgEl.textContent = item.message;
        card.appendChild(msgEl);
      }

      rsvpListEl.appendChild(card);
    });
  }

  rsvpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = rsvpNameInput.value.trim();
    if (!name || !attendingChoice) return;

    const entry = {
      name: name,
      attending: attendingChoice === 'yes',
      guests: attendingChoice === 'yes' ? guestCount : 0,
      message: rsvpMessageInput.value.trim(),
      createdAt: new Date().toISOString()
    };

    const existing = loadRsvps().slice();
    existing.unshift(entry);
    if (remoteConfigured) {
      remoteRsvps = existing;
    }
    saveLocalRsvps(existing);
    renderRsvps();
    postCommunityEntry('rsvp', entry);

    closeRsvpModal();
    rsvpForm.reset();
    attendingChoice = null;
    guestCount = 1;
    guestsCountVal.textContent = '1';
    styleRadioOption(rsvpOptYes, false, 'yes');
    styleRadioOption(rsvpOptNo, false, 'no');
    rsvpGuestsWrap.classList.add('hidden');
    rsvpMsgWrap.classList.add('hidden');
    rsvpSubmitBtn.disabled = true;
    showToast('Thank you! Your RSVP has been recorded.');
  });

  // --- Guestbook & Suggested Wishes ---
  function loadWishes() {
    if (remoteConfigured && Array.isArray(remoteWishes)) return remoteWishes;
    return readLocalArray(WISHES_STORAGE_KEY);
  }

  function saveLocalWishes(list) {
    try {
      localStorage.setItem(WISHES_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function entrySignature(kind, item) {
    if (!item || typeof item !== 'object') return '';
    const base = kind + '|' + String(item.name || '').trim().toLowerCase() + '|' + String(item.message || '').trim().toLowerCase();
    if (kind === 'rsvp') {
      return base + '|' + Boolean(item.attending) + '|' + (parseInt(item.guests, 10) || 0);
    }
    return base;
  }

  function readSyncedMap() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SYNCED_KEYS_STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function markSyncedSignature(sig) {
    if (!sig) return;
    try {
      const map = readSyncedMap();
      map[sig] = 1;
      localStorage.setItem(SYNCED_KEYS_STORAGE_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function renderWishes() {
    const wishes = loadWishes();
    if (!wishes.length) {
      wishesListEl.innerHTML =
        '<p class="text-center text-sm opacity-70 flex flex-col items-center"><span dir="auto">No wishes yet. Be the first!</span></p>';
      return;
    }
    wishesListEl.innerHTML = '';
    wishes.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border px-4 py-3 text-left';
      card.style.cssText = 'border-color: rgba(255, 223, 175, 0.35); background-color: rgba(15, 47, 87, 0.45);';
      const nameEl = document.createElement('p');
      nameEl.className = 'text-sm font-semibold';
      nameEl.style.color = '#ffdfaf';
      nameEl.textContent = item.name;
      const msgEl = document.createElement('p');
      msgEl.className = 'mt-1 text-sm whitespace-pre-line';
      msgEl.style.color = '#ffefd6';
      msgEl.textContent = item.message;
      card.appendChild(nameEl);
      card.appendChild(msgEl);
      wishesListEl.appendChild(card);
    });
  }

  function uploadEntryRequest(kind, entry) {
    return fetch(COMMUNITY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, entry: entry })
    }).then((res) => (res.ok ? res.json() : null));
  }

  function syncUnsyncedLocalEntries(serverWishes, serverRsvps) {
    if (backfillStarted) return Promise.resolve(false);
    backfillStarted = true;

    const syncedMap = readSyncedMap();
    const remoteSet = {};
    serverWishes.forEach((w) => {
      remoteSet[entrySignature('wish', w)] = true;
    });
    serverRsvps.forEach((r) => {
      remoteSet[entrySignature('rsvp', r)] = true;
    });

    const queue = [];
    const localWishes = readLocalArray(WISHES_STORAGE_KEY).slice().reverse();
    localWishes.forEach((w) => {
      const sig = entrySignature('wish', w);
      if (w && w.name && w.message && !remoteSet[sig] && !syncedMap[sig]) {
        remoteSet[sig] = true;
        queue.push({ kind: 'wish', entry: w, sig: sig });
      }
    });

    const localRsvps = readLocalArray(RSVP_STORAGE_KEY).slice().reverse();
    localRsvps.forEach((r) => {
      const sig = entrySignature('rsvp', r);
      if (r && r.name && !remoteSet[sig] && !syncedMap[sig]) {
        remoteSet[sig] = true;
        queue.push({ kind: 'rsvp', entry: r, sig: sig });
      }
    });

    if (!queue.length) return Promise.resolve(false);

    let chain = Promise.resolve(null);
    queue.forEach((item) => {
      chain = chain.then(() =>
        uploadEntryRequest(item.kind, item.entry)
          .then((resp) => {
            if (resp && resp.configured && resp.ok) {
              markSyncedSignature(item.sig);
            }
            return resp;
          })
          .catch(() => null)
      );
    });

    return chain.then((lastResp) => {
      if (lastResp && lastResp.configured && lastResp.ok) {
        if (Array.isArray(lastResp.wishes)) {
          remoteWishes = lastResp.wishes;
          saveLocalWishes(remoteWishes);
        }
        if (Array.isArray(lastResp.rsvps)) {
          remoteRsvps = lastResp.rsvps;
          saveLocalRsvps(remoteRsvps);
        }
        renderWishes();
        renderRsvps();
        return true;
      }
      return false;
    });
  }

  function fetchCommunityData() {
    fetch(COMMUNITY_API_URL, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.configured) {
          const nextWishes = Array.isArray(data.wishes) ? data.wishes : [];
          const nextRsvps = Array.isArray(data.rsvps) ? data.rsvps : [];
          syncUnsyncedLocalEntries(nextWishes, nextRsvps).then((didBackfill) => {
            remoteConfigured = true;
            if (!didBackfill) {
              remoteWishes = nextWishes;
              remoteRsvps = nextRsvps;
              saveLocalWishes(remoteWishes);
              saveLocalRsvps(remoteRsvps);
              renderWishes();
              renderRsvps();
            }
          });
        }
      })
      .catch(() => {});
  }

  function postCommunityEntry(kind, entry) {
    const sig = entrySignature(kind, entry);
    uploadEntryRequest(kind, entry)
      .then((data) => {
        if (data && data.configured && data.ok) {
          remoteConfigured = true;
          markSyncedSignature(sig);
          if (Array.isArray(data.wishes)) {
            remoteWishes = data.wishes;
            saveLocalWishes(remoteWishes);
            renderWishes();
          }
          if (Array.isArray(data.rsvps)) {
            remoteRsvps = data.rsvps;
            saveLocalRsvps(remoteRsvps);
            renderRsvps();
          }
        }
      })
      .catch(() => {});
  }

  guestbookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = guestbookName.value.trim();
    const message = guestbookWishes.value.trim();
    if (!name || !message) return;
    const entry = { name: name, message: message, createdAt: new Date().toISOString() };
    const wishes = loadWishes().slice();
    wishes.unshift(entry);
    if (remoteConfigured) {
      remoteWishes = wishes;
    }
    saveLocalWishes(wishes);
    guestbookForm.reset();
    renderWishes();
    postCommunityEntry('wish', entry);
    showToast('Your wishes have been sent!');
  });

  function renderSuggestedWishes() {
    const list = WISH_BATCHES[currentWishBatch % WISH_BATCHES.length];
    suggestedWishesList.innerHTML = '';
    list.forEach((text) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'w-full text-left p-4 border border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all';
      const p = document.createElement('p');
      p.className = 'text-gray-800';
      p.textContent = text;
      btn.appendChild(p);
      btn.addEventListener('click', function () {
        guestbookWishes.value = text;
        closeWishesModal();
      });
      suggestedWishesList.appendChild(btn);
    });
  }

  function openWishesModal() {
    renderSuggestedWishes();
    wishesModal.classList.remove('hidden');
    wishesModal.classList.add('flex');
  }

  function closeWishesModal() {
    wishesModal.classList.add('hidden');
    wishesModal.classList.remove('flex');
  }

  aiWishBtn.addEventListener('click', openWishesModal);
  wishesCloseX.addEventListener('click', closeWishesModal);
  wishesCloseBtn.addEventListener('click', closeWishesModal);
  wishesRegenBtn.addEventListener('click', function () {
    currentWishBatch = (currentWishBatch + 1) % WISH_BATCHES.length;
    renderSuggestedWishes();
  });
  wishesModal.addEventListener('click', function (e) {
    if (e.target === wishesModal) closeWishesModal();
  });

  // --- Live Wedding Countdown (Jan 17, 2027 11:30 AM IST) ---
  const cdDaysEl = document.getElementById('cd-days');
  const cdHoursEl = document.getElementById('cd-hours');
  const cdMinutesEl = document.getElementById('cd-minutes');
  const cdSecondsEl = document.getElementById('cd-seconds');
  const cdSubtitleEl = document.getElementById('countdown-subtitle');
  const weddingTargetMs = new Date('2027-01-17T11:30:00+05:30').getTime();

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    if (!cdDaysEl || !cdHoursEl || !cdMinutesEl || !cdSecondsEl) return;
    const diff = weddingTargetMs - Date.now();
    if (diff <= 0) {
      cdDaysEl.textContent = '00';
      cdHoursEl.textContent = '00';
      cdMinutesEl.textContent = '00';
      cdSecondsEl.textContent = '00';
      if (cdSubtitleEl) {
        cdSubtitleEl.innerHTML = '<span dir="auto">Today is our wedding day!</span>';
      }
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    cdDaysEl.textContent = pad2(days);
    cdHoursEl.textContent = pad2(hours);
    cdMinutesEl.textContent = pad2(minutes);
    cdSecondsEl.textContent = pad2(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // --- Moments of Love 3-Photo Auto Carousel (Scroll-Triggered) ---
  const momentsSection = document.getElementById('moments-section');
  const momentCards = Array.from(document.querySelectorAll('.moments-card'));
  const momentDots = Array.from(document.querySelectorAll('.moments-dot'));
  const momentsPrevBtn = document.getElementById('moments-prev-btn');
  const momentsNextBtn = document.getElementById('moments-next-btn');

  if (momentsSection && momentCards.length === 3) {
    let activeMoment = 0;
    let autoPlayTimer = null;
    let firstTriggerDone = false;

    function applyMomentState(index) {
      activeMoment = ((index % 3) + 3) % 3;
      const leftIdx = (activeMoment + 2) % 3;
      const rightIdx = (activeMoment + 1) % 3;

      momentCards.forEach((card, i) => {
        card.classList.remove('is-center', 'is-left', 'is-right');
        if (i === activeMoment) card.classList.add('is-center');
        else if (i === leftIdx) card.classList.add('is-left');
        else if (i === rightIdx) card.classList.add('is-right');
      });

      momentDots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === activeMoment);
      });
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        applyMomentState(activeMoment + 1);
      }, 2600);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function goToMoment(index) {
      applyMomentState(index);
      startAutoPlay();
    }

    if (momentsPrevBtn) {
      momentsPrevBtn.addEventListener('click', () => goToMoment(activeMoment - 1));
    }
    if (momentsNextBtn) {
      momentsNextBtn.addEventListener('click', () => goToMoment(activeMoment + 1));
    }
    momentDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToMoment(idx));
    });
    momentCards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx !== activeMoment) goToMoment(idx);
      });
    });

    // Touch swipe support on mobile
    let touchStartX = 0;
    momentsSection.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    momentsSection.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          goToMoment(dx < 0 ? activeMoment + 1 : activeMoment - 1);
        }
      }
    }, { passive: true });

    // Start rotating automatically when scrolled into view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!firstTriggerDone) {
              firstTriggerDone = true;
              setTimeout(() => {
                if (autoPlayTimer) return;
                applyMomentState(activeMoment + 1);
                startAutoPlay();
              }, 900);
            } else {
              startAutoPlay();
            }
          } else {
            stopAutoPlay();
          }
        });
      }, { threshold: 0.25 });
      observer.observe(momentsSection);
    } else {
      startAutoPlay();
    }
  }

  // --- Automatic Cinematic Smooth Scrolling ---
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  const AUTO_SCROLL_SPEED_PX_PER_SEC = 48;
  const AUTO_SCROLL_EASE_IN_MS = 1600;
  const AUTO_SCROLL_EASE_OUT_PX = 200;

  let autoScrollRafId = null;
  let autoScrollDelayTimer = null;
  let isAutoScrolling = false;
  let userInteracted = false;
  let scrollListenersArmed = false;
  let virtualScrollY = 0;
  let lastProgrammaticY = 0;
  let autoScrollStartTime = 0;
  let lastFrameTime = 0;

  function prefersReducedMotion() {
    return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
  }

  function getMaxScrollY() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function pauseAutoScroll() {
    userInteracted = true;
    isAutoScrolling = false;
    if (autoScrollDelayTimer) {
      clearTimeout(autoScrollDelayTimer);
      autoScrollDelayTimer = null;
    }
    if (autoScrollRafId !== null) {
      cancelAnimationFrame(autoScrollRafId);
      autoScrollRafId = null;
    }
  }

  function onUserPointerOrTouch() {
    pauseAutoScroll();
  }

  function onUserKeyDown(e) {
    if (
      e.key === 'ArrowDown' ||
      e.key === 'ArrowUp' ||
      e.key === 'PageDown' ||
      e.key === 'PageUp' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === ' ' ||
      e.key === 'Spacebar' ||
      e.key === 'Tab'
    ) {
      pauseAutoScroll();
    }
  }

  function onWindowScroll() {
    if (!isAutoScrolling) return;
    if (Math.abs(window.scrollY - lastProgrammaticY) > 10) {
      pauseAutoScroll();
    }
  }

  function armInteractionListeners() {
    if (scrollListenersArmed) return;
    scrollListenersArmed = true;
    window.addEventListener('wheel', onUserPointerOrTouch, { passive: true, capture: true });
    window.addEventListener('touchstart', onUserPointerOrTouch, { passive: true, capture: true });
    window.addEventListener('touchmove', onUserPointerOrTouch, { passive: true, capture: true });
    window.addEventListener('pointerdown', onUserPointerOrTouch, { passive: true, capture: true });
    window.addEventListener('keydown', onUserKeyDown, { passive: true, capture: true });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
  }

  function stepAutoScroll(now) {
    if (!isAutoScrolling || userInteracted || prefersReducedMotion()) {
      pauseAutoScroll();
      return;
    }

    if (document.hidden) {
      lastFrameTime = now;
      autoScrollRafId = requestAnimationFrame(stepAutoScroll);
      return;
    }

    const dt = lastFrameTime ? Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000)) : 0;
    lastFrameTime = now;

    const maxScroll = getMaxScrollY();
    if (maxScroll <= 0 || virtualScrollY >= maxScroll - 0.5) {
      if (maxScroll > 0) {
        window.scrollTo({ top: maxScroll, behavior: 'instant' });
      }
      isAutoScrolling = false;
      autoScrollRafId = null;
      return;
    }

    const elapsed = now - autoScrollStartTime;
    const easeInProgress = Math.min(1, elapsed / AUTO_SCROLL_EASE_IN_MS);
    const easeInFactor = easeInProgress * easeInProgress * (3 - 2 * easeInProgress);

    const remaining = maxScroll - virtualScrollY;
    const easeOutFactor = remaining < AUTO_SCROLL_EASE_OUT_PX
      ? Math.max(0.32, remaining / AUTO_SCROLL_EASE_OUT_PX)
      : 1;

    const deltaY = AUTO_SCROLL_SPEED_PX_PER_SEC * easeInFactor * easeOutFactor * dt;
    virtualScrollY = Math.min(maxScroll, virtualScrollY + deltaY);
    lastProgrammaticY = virtualScrollY;

    window.scrollTo({ top: virtualScrollY, behavior: 'instant' });

    if (virtualScrollY >= maxScroll - 0.5) {
      isAutoScrolling = false;
      autoScrollRafId = null;
      return;
    }

    autoScrollRafId = requestAnimationFrame(stepAutoScroll);
  }

  function startAutoScroll() {
    if (userInteracted || prefersReducedMotion()) return;
    if (envelopeEl && envelopeEl.style.display !== 'none') return;
    const maxScroll = getMaxScrollY();
    if (maxScroll <= 0 || window.scrollY >= maxScroll - 1) return;

    isAutoScrolling = true;
    virtualScrollY = window.scrollY;
    lastProgrammaticY = virtualScrollY;
    autoScrollStartTime = performance.now();
    lastFrameTime = autoScrollStartTime;
    autoScrollRafId = requestAnimationFrame(stepAutoScroll);
  }

  function armAndScheduleAutoScroll(delayMs) {
    if (prefersReducedMotion()) return;
    armInteractionListeners();
    if (autoScrollDelayTimer) clearTimeout(autoScrollDelayTimer);
    autoScrollDelayTimer = setTimeout(() => {
      autoScrollDelayTimer = null;
      startAutoScroll();
    }, delayMs);
  }

  if (reducedMotionQuery && typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', function (e) {
      if (e.matches) pauseAutoScroll();
    });
  }

  if (new URLSearchParams(window.location.search).get('open') === '1') {
    armAndScheduleAutoScroll(1200);
  }

  // --- Background YouTube Music (https://youtu.be/il7oBI7lpNU) ---
  const YT_VIDEO_ID = 'il7oBI7lpNU';
  const YT_START_SECONDS = 75; // 1:15
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicDiscIcon = document.getElementById('music-disc-icon');
  const musicTitleLabel = document.getElementById('music-title-label');
  const musicStatusBars = document.getElementById('music-status-bars');

  let ytPlayer = null;
  let ytReady = false;
  let wantMusicPlaying = false;
  let isMusicPlaying = false;
  let hasSeekedInitialStart = false;
  let fetchedTrackTitle = '';

  function formatTrackTitle(rawTitle) {
    if (!rawTitle) return 'Aaro Nee';
    const primary = rawTitle.split('|')[0].replace(/\(.*?\)/g, '').trim();
    return primary || rawTitle;
  }

  function updateMusicPillUI(playing) {
    isMusicPlaying = playing;
    if (!musicToggleBtn) return;
    if (musicDiscIcon) {
      musicDiscIcon.classList.toggle('music-disc-spinning', playing);
    }
    if (musicStatusBars) {
      musicStatusBars.style.opacity = playing ? '1' : '0.35';
    }
    if (musicTitleLabel) {
      const baseTitle = formatTrackTitle(fetchedTrackTitle);
      musicTitleLabel.textContent = playing ? baseTitle + ' ♪' : 'Play ' + baseTitle + ' ♪';
    }
  }

  function showMusicPill() {
    if (!musicToggleBtn) return;
    musicToggleBtn.classList.remove('hidden');
    musicToggleBtn.classList.add('flex');
  }

  function fetchTrackTitle() {
    fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + YT_VIDEO_ID + '&format=json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.title) {
          fetchedTrackTitle = data.title;
          updateMusicPillUI(isMusicPlaying);
        }
      })
      .catch(() => {});
  }

  function initYouTubePlayer() {
    if (ytPlayer || !document.getElementById('yt-music-player')) return;

    window.onYouTubeIframeAPIReady = function () {
      ytPlayer = new window.YT.Player('yt-music-player', {
        height: '2',
        width: '2',
        videoId: YT_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: YT_VIDEO_ID,
          start: YT_START_SECONDS,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: function (event) {
            ytReady = true;
            try {
              const data = event.target.getVideoData();
              if (data && data.title && !fetchedTrackTitle) {
                fetchedTrackTitle = data.title;
              }
            } catch (_) {}
            if (wantMusicPlaying) {
              try {
                event.target.unMute();
                event.target.setVolume(80);
                if (!hasSeekedInitialStart) {
                  hasSeekedInitialStart = true;
                  event.target.seekTo(YT_START_SECONDS, true);
                }
                event.target.playVideo();
              } catch (_) {}
            } else {
              updateMusicPillUI(false);
            }
          },
          onStateChange: function (event) {
            if (!window.YT || !window.YT.PlayerState) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (!hasSeekedInitialStart) {
                hasSeekedInitialStart = true;
                try {
                  if (event.target.getCurrentTime() < YT_START_SECONDS - 2) {
                    event.target.seekTo(YT_START_SECONDS, true);
                  }
                } catch (_) {}
              }
              try {
                const data = event.target.getVideoData();
                if (data && data.title && !fetchedTrackTitle) {
                  fetchedTrackTitle = data.title;
                }
              } catch (_) {}
              updateMusicPillUI(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              updateMusicPillUI(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              if (wantMusicPlaying) {
                event.target.seekTo(YT_START_SECONDS, true);
                event.target.playVideo();
              }
            }
          },
          onError: function () {
            updateMusicPillUI(false);
          }
        }
      });
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  }

  function startBackgroundMusic() {
    wantMusicPlaying = true;
    showMusicPill();
    if (ytReady && ytPlayer && typeof ytPlayer.playVideo === 'function') {
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(80);
        if (!hasSeekedInitialStart) {
          hasSeekedInitialStart = true;
          ytPlayer.seekTo(YT_START_SECONDS, true);
        }
        ytPlayer.playVideo();
      } catch (_) {}
    }
  }

  function toggleBackgroundMusic() {
    if (!ytReady || !ytPlayer) {
      wantMusicPlaying = !wantMusicPlaying;
      updateMusicPillUI(wantMusicPlaying);
      return;
    }
    if (isMusicPlaying) {
      wantMusicPlaying = false;
      try {
        ytPlayer.pauseVideo();
      } catch (_) {}
      updateMusicPillUI(false);
    } else {
      wantMusicPlaying = true;
      try {
        ytPlayer.unMute();
        ytPlayer.setVolume(80);
        ytPlayer.playVideo();
      } catch (_) {}
    }
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', toggleBackgroundMusic);
  }

  fetchTrackTitle();
  initYouTubePlayer();

  if (new URLSearchParams(window.location.search).get('open') === '1') {
    showMusicPill();
    updateMusicPillUI(false);
    wantMusicPlaying = true;
    // Unlock audio on first user interaction if browser blocks unmuted autoplay on direct ?open=1 load
    const unlockOnce = function () {
      if (wantMusicPlaying && !isMusicPlaying && ytReady && ytPlayer) {
        try {
          ytPlayer.unMute();
          ytPlayer.setVolume(80);
          ytPlayer.playVideo();
        } catch (_) {}
      }
      window.removeEventListener('pointerdown', unlockOnce, true);
      window.removeEventListener('touchstart', unlockOnce, true);
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true, capture: true });
    window.addEventListener('touchstart', unlockOnce, { passive: true, capture: true });
  }

  renderRsvps();
  renderWishes();
  fetchCommunityData();
  setInterval(function () {
    if (!document.hidden && remoteConfigured) {
      fetchCommunityData();
    }
  }, 20000);
})();
