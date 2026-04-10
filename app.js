import { festivalData } from "./data/schedule.js";

const { meta, events } = festivalData;
const cookieKey = meta.cookieKey ?? "blavicon_plan";
const dayMap = new Map(meta.days.map((day) => [day.id, day]));
const venueMap = new Map(meta.venues.map((venue) => [venue.id, venue]));
const eventMap = new Map(events.map((event) => [event.id, event]));
const eventByPlanIndex = new Map(events.map((event) => [event.planIndex, event]));
const maxPlanIndex = Math.max(...events.map((event) => event.planIndex));
const supportedPlanVersions = new Set([1, meta.planSchemaVersion]);
const legacyPlanIndexEventIds = {
  1: new Map([
    [47, ["fri-povidani-medovina"]]
  ])
};
const SCHEDULE_START_MINUTES = 9 * 60;
const SCHEDULE_END_MINUTES = 24 * 60;
const TIMELINE_MINUTE_HEIGHT = 2;
const TIMELINE_HEIGHT = (SCHEDULE_END_MINUTES - SCHEDULE_START_MINUTES) * TIMELINE_MINUTE_HEIGHT;
const festivalDayOrder = meta.days.map((day) => day.id);
const isoWeekdayByDayId = { thu: 4, fri: 5, sat: 6 };
const isoWeekdayByShortName = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const MAP_URL = "./data/mapa.jpg";

const pragueNowFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: meta.timezone,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23"
});

const typeMeta = {
  concert: { label: "Koncert", colorVar: "--type-concert" },
  performance: { label: "Představení", colorVar: "--type-performance" },
  talk: { label: "Přednáška", colorVar: "--type-talk" },
  tabletop: { label: "Šítovka", colorVar: "--type-tabletop" },
  workshop: { label: "Workshop", colorVar: "--type-workshop" }
};

const refs = {
  dayTabs: document.querySelector("#day-tabs"),
  notice: document.querySelector("#notice"),
  overviewMeta: document.querySelector("#overview-meta"),
  overviewCards: document.querySelector("#overview-cards"),
  planActionsButton: document.querySelector("#plan-actions-button"),
  planActionsBackdrop: document.querySelector("#plan-actions-backdrop"),
  planActionsPanel: document.querySelector("#plan-actions-panel"),
  restoreDefaultsButton: document.querySelector("#restore-defaults-button"),
  clearSelectionButton: document.querySelector("#clear-selection-button"),
  shareCode: document.querySelector("#share-code"),
  shareLink: document.querySelector("#share-link"),
  copyCodeButton: document.querySelector("#copy-code-button"),
  copyLinkButton: document.querySelector("#copy-link-button"),
  importInput: document.querySelector("#import-input"),
  importButton: document.querySelector("#import-button"),
  mapLink: document.querySelector("#map-link"),
  itineraryContent: document.querySelector("#itinerary-content"),
  scheduleContent: document.querySelector("#schedule-content"),
  eventDetailBackdrop: document.querySelector("#event-detail-backdrop"),
  eventDetailPanel: document.querySelector("#event-detail-panel"),
  eventDetailContent: document.querySelector("#event-detail-content")
};

const defaultSelectedIds = new Set(
  events.filter((event) => event.defaultSelected).map((event) => event.id)
);

const state = {
  activeDayId: meta.days[0]?.id ?? "",
  now: getPragueNow(),
  notice: { kind: "", text: "" },
  planSource: "Výchozí plán",
  selectedEventIds: new Set(defaultSelectedIds),
  planActionsOpen: false,
  activeEventId: null
};

let noticeTimer = null;
let clockTimer = null;

initialize();

function initialize() {
  const imported = loadPlanFromUrl();
  if (imported.applied) {
    state.selectedEventIds = imported.selectedEventIds;
    state.planSource = "Sdílený odkaz";
    showNotice("Načetl jsem sdílený plán z odkazu.", "info");
    savePlanToCookie(encodePlan(state.selectedEventIds));
    clearPlanParameterFromUrl();
  } else {
    const fromCookie = loadPlanFromCookie();
    if (fromCookie.applied) {
      state.selectedEventIds = fromCookie.selectedEventIds;
      state.planSource = "Obnovené z cookie";
    } else {
      state.selectedEventIds = new Set(defaultSelectedIds);
      state.planSource = "Výchozí plán";
    }

    if (imported.error) {
      showNotice(imported.error, "warning");
    }
  }

  state.activeDayId = chooseInitialDayId();
  bindStaticEvents();
  startClock();
  render();
}

function bindStaticEvents() {
  refs.dayTabs.addEventListener("click", handleDayTabClick);
  refs.overviewCards.addEventListener("click", handleEventCardClick);
  refs.itineraryContent.addEventListener("click", handleEventCardClick);
  refs.scheduleContent.addEventListener("click", handleEventCardClick);
  refs.planActionsButton.addEventListener("click", handlePlanActionsToggle);
  refs.planActionsBackdrop.addEventListener("click", closePlanActions);
  refs.planActionsPanel.addEventListener("click", handlePlanActionsPanelClick);
  refs.restoreDefaultsButton.addEventListener("click", handleRestoreDefaults);
  refs.clearSelectionButton.addEventListener("click", handleClearSelection);
  refs.eventDetailBackdrop.addEventListener("click", closeEventDetail);
  refs.eventDetailPanel.addEventListener("click", handleEventDetailClick);
  refs.copyCodeButton.addEventListener("click", () => handleCopy(refs.shareCode, "Kód plánu zkopírován."));
  refs.copyLinkButton.addEventListener("click", () => handleCopy(refs.shareLink, "Sdílecí odkaz zkopírován."));
  refs.importButton.addEventListener("click", handleImport);
  refs.mapLink.href = MAP_URL;
  refs.importInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleImport();
    }
  });
  document.addEventListener("keydown", handleDocumentKeydown);
}

function render() {
  state.now = getPragueNow();
  renderDayTabs();
  renderOverview();
  renderPlanActions();
  renderItinerary();
  renderSchedule();
  renderEventDetail();
  renderNotice();
}

function startClock() {
  if (clockTimer) {
    window.clearInterval(clockTimer);
  }

  clockTimer = window.setInterval(() => {
    render();
  }, 30000);
}

function renderDayTabs() {
  refs.dayTabs.innerHTML = meta.days
    .map((day) => {
      const selectedCount = getSelectedEvents(day.id).length;
      return `
        <button
          class="day-tab ${day.id === state.activeDayId ? "is-active" : ""}"
          type="button"
          role="tab"
          aria-selected="${String(day.id === state.activeDayId)}"
          data-day-id="${day.id}"
        >
          ${escapeHtml(day.label)} <span class="sr-only">(${selectedCount} vybraných)</span>
        </button>
      `;
    })
    .join("");
}

function renderOverview() {
  const selectedEvents = getSelectedEvents(state.activeDayId);
  const dayTimeline = getDayTimelineState(state.activeDayId, state.now);
  const nextSelection = getGlobalNextSelectedEvent(state.now);
  const festivalCalendar = getFestivalCalendar(state.now);
  const conflictIds = getConflictIds(selectedEvents);
  const todayLabel = dayMap.get(state.activeDayId)?.label ?? state.activeDayId;
  const currentEvent = dayTimeline.currentEvents[0] ?? null;
  const currentCard = currentEvent
    ? buildOverviewCard({
        label: "Právě teď",
        event: currentEvent,
        timeText: formatTimeRange(currentEvent),
        copyText: `${venueMap.get(currentEvent.venueId)?.label ?? ""}${dayTimeline.currentEvents.length > 1 ? ` a ještě ${dayTimeline.currentEvents.length - 1} další vybraná akce` : ""}`
      })
    : `
      <article class="overview-card">
        <p class="card-label">Právě teď</p>
        <h3 class="card-title">${dayTimeline.isToday ? "Nic vybraného neběží" : `Teď neběží ${escapeHtml(todayLabel.toLowerCase())}`}</h3>
        <p class="card-copy">${dayTimeline.isToday ? "Další vybranou akci najdeš hned vedle nebo níž v itineráři." : "Aktivní den si můžeš projít dopředu a otevřít si detail z dalších karet."}</p>
      </article>
    `;

  const nextCard = nextSelection
    ? buildOverviewCard({
        label: "Další",
        event: nextSelection.event,
        timeText: `${formatFestivalDayLabel(nextSelection.event.dayId, festivalCalendar)} • ${formatTimeRange(nextSelection.event)}`,
        copyText: `${venueMap.get(nextSelection.event.venueId)?.label ?? ""}${nextSelection.relativeLabel ? ` • ${nextSelection.relativeLabel}` : ""}`
      })
    : `
      <article class="overview-card">
        <p class="card-label">Další</p>
        <h3 class="card-title">Pro tenhle plán hotovo</h3>
        <p class="card-copy">Žádná další vybraná akce už nenásleduje.</p>
      </article>
    `;

  refs.overviewMeta.innerHTML = `
    <span class="summary-pill">${escapeHtml(todayLabel)} • ${pluralize(selectedEvents.length, ["1 vybraná událost", "2 vybrané události", "5 vybraných událostí"])}</span>
    <span class="summary-pill">${pluralize(state.selectedEventIds.size, ["1 bod celkem", "2 body celkem", "5 bodů celkem"])}</span>
    <span class="summary-pill ${conflictIds.size ? "is-warning" : ""}">${conflictIds.size ? pluralize(conflictIds.size, ["1 kolize", "2 kolize", "5 kolizí"]) : "Bez kolizí"}</span>
    <span class="summary-pill is-muted">${escapeHtml(state.planSource)}</span>
  `;

  refs.overviewCards.innerHTML = `
    ${currentCard}
    ${nextCard}
  `;
}

function buildOverviewCard({ label, event, timeText, copyText }) {
  return `
    <article
      class="overview-card is-interactive"
      data-open-event-id="${event.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(`Detail události ${event.title}`)}"
    >
      <p class="card-label">${escapeHtml(label)}</p>
      <h3 class="card-title">${escapeHtml(event.title)}</h3>
      <p class="card-time">${escapeHtml(timeText)}</p>
      <p class="card-copy">${escapeHtml(copyText)}</p>
    </article>
  `;
}

function renderPlanActions() {
  refs.planActionsButton.setAttribute("aria-expanded", String(state.planActionsOpen));
  refs.planActionsBackdrop.hidden = !state.planActionsOpen;
  refs.planActionsPanel.hidden = !state.planActionsOpen;

  const planCode = encodePlan(state.selectedEventIds);
  refs.shareCode.value = planCode;
  refs.shareLink.value = buildShareLink(planCode);
  syncModalBodyState();
}

function renderItinerary() {
  const selectedEvents = getSelectedEvents(state.activeDayId);
  const dayTimeline = getDayTimelineState(state.activeDayId, state.now);
  const conflictIds = getConflictIds(selectedEvents);

  if (!selectedEvents.length) {
    refs.itineraryContent.innerHTML = `
      <div class="empty-state">
        <h3 class="itinerary-title">Pro tenhle den zatím nic vybraného není</h3>
        <p class="itinerary-subcopy">
          Přidej si něco dole v programu, nebo vrať výchozí plán.
        </p>
      </div>
    `;
    return;
  }

  refs.itineraryContent.innerHTML = `
    <div class="itinerary-list">
      ${selectedEvents
        .map((event) => {
          const badges = [];

          if (dayTimeline.currentEvents.some((currentEvent) => currentEvent.id === event.id)) {
            badges.push(`<span class="chip is-highlight">Právě běží</span>`);
          }

          if (dayTimeline.nextEvent?.id === event.id) {
            badges.push(`<span class="chip">Další</span>`);
          }

          if (conflictIds.has(event.id)) {
            badges.push(`<span class="chip is-warning">Kolize</span>`);
          }

          return `
            <article
              class="itinerary-card"
              data-open-event-id="${event.id}"
              tabindex="0"
              role="button"
              aria-label="${escapeHtml(`Detail události ${event.title}`)}"
            >
              <div class="itinerary-title-row">
                <div>
                  <h3 class="itinerary-title">${escapeHtml(event.title)}</h3>
                  <p class="itinerary-subcopy">
                    ${formatTimeRange(event)} • ${escapeHtml(venueMap.get(event.venueId)?.label ?? "")}
                  </p>
                </div>
                <div class="card-badge-row">${badges.join("")}</div>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSchedule() {
  const selectedEvents = new Set(state.selectedEventIds);
  const selectedForDay = getSelectedEvents(state.activeDayId);
  const conflictIds = getConflictIds(selectedForDay);
  const dayTimeline = getDayTimelineState(state.activeDayId, state.now);
  const dayEvents = getEventsForDay(state.activeDayId);
  const currentMinutes = state.now.hour * 60 + state.now.minute;
  const shouldShowCurrentLine = dayTimeline.isToday && isMinuteWithinSchedule(currentMinutes);
  const currentLineMarkup = shouldShowCurrentLine
    ? `
      <div
        class="schedule-current-line"
        style="grid-column: 2 / ${meta.venues.length + 2}; grid-row: 2; margin-top: ${getTimelineOffset(currentMinutes)}px;"
      >
        <span class="schedule-current-line-label">${escapeHtml(state.now.timeString)}</span>
      </div>
    `
    : "";

  refs.scheduleContent.innerHTML = `
    <div class="schedule-board-scroll">
      <div class="schedule-board" style="--timeline-height: ${TIMELINE_HEIGHT}px; --venue-count: ${meta.venues.length};">
        <div class="schedule-axis-head" style="grid-column: 1; grid-row: 1;">
          <h3 class="venue-heading">Čas</h3>
          <p class="venue-note">09:00 nahoře, 24:00 dole</p>
        </div>

        ${meta.venues
          .map((venue, index) => {
            const venueEvents = dayEvents.filter((event) => event.venueId === venue.id);

            return `
              <header class="schedule-venue-head" id="venue-${venue.id}" style="grid-column: ${index + 2}; grid-row: 1;">
                <h3 class="venue-heading">${escapeHtml(venue.label)}</h3>
                <p class="venue-note">${pluralize(venueEvents.length, ["1 položka", "2 položky", "5 položek"])} v programu</p>
              </header>
            `;
          })
          .join("")}

        <div class="schedule-axis-track" style="grid-column: 1; grid-row: 2;">
          ${buildScheduleTimeMarkers()}
        </div>

        ${currentLineMarkup}

        ${meta.venues
          .map((venue, index) => {
            const venueEvents = dayEvents.filter((event) => event.venueId === venue.id);

            return `
              <section
                class="schedule-venue-track"
                aria-labelledby="venue-${venue.id}"
                style="grid-column: ${index + 2}; grid-row: 2;"
              >
                ${venueEvents
                  .map((event) => {
                    const selected = selectedEvents.has(event.id);
                    const durationMinutes = parseTime(event.end) - parseTime(event.start);
                    const type = typeMeta[event.type] ?? typeMeta.talk;
                    const isCurrent = dayTimeline.currentEvents.some((currentEvent) => currentEvent.id === event.id);
                    const isNext = dayTimeline.nextEvent?.id === event.id;
                    const isConflict = conflictIds.has(event.id);
                    const badges = [];

                    if (isNext) {
                      badges.push('<span class="chip">Další</span>');
                    }

                    if (selected) {
                      badges.push('<span class="chip is-highlight">Ve tvém plánu</span>');
                    }

                    if (isConflict) {
                      badges.push('<span class="chip is-warning">Kolize</span>');
                    }

                    return `
                      <article
                        class="event-card ${selected ? "is-selected" : ""} ${isConflict ? "is-conflict" : ""} ${isCurrent ? "is-current" : ""} ${durationMinutes <= 30 ? "is-short" : ""} ${durationMinutes <= 15 ? "is-tiny" : ""}"
                        data-open-event-id="${event.id}"
                        tabindex="0"
                        role="button"
                        aria-label="${escapeHtml(`Detail události ${event.title}`)}"
                        style="--event-color: var(${type.colorVar}); top: ${getTimelineOffset(parseTime(event.start))}px; height: ${getTimelineHeight(durationMinutes)}px;"
                      >
                        <button
                          class="event-toggle ${selected ? "is-active" : ""}"
                          type="button"
                          data-event-id="${event.id}"
                          aria-pressed="${String(selected)}"
                          aria-label="${escapeHtml(selected ? `Odebrat ${event.title} z plánu` : `Přidat ${event.title} do plánu`)}"
                          title="${escapeHtml(selected ? "Odebrat z plánu" : "Přidat do plánu")}"
                        >
                          ${selected ? "✓" : "+"}
                        </button>

                        <div class="event-header">
                          <span class="event-time">${formatTimeRange(event)}</span>
                        </div>

                        <div>
                          <h4 class="event-title">${escapeHtml(event.title)}</h4>
                          <p class="event-copy">${escapeHtml(type.label)}</p>
                        </div>

                        <div class="event-meta">
                          <span class="type-pill">${escapeHtml(type.label)}</span>
                          ${badges.join("")}
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </section>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderEventDetail() {
  const activeEvent = state.activeEventId ? eventMap.get(state.activeEventId) : null;
  if (!activeEvent) {
    refs.eventDetailBackdrop.hidden = true;
    refs.eventDetailPanel.hidden = true;
    refs.eventDetailContent.innerHTML = "";
    syncModalBodyState();
    return;
  }

  const selected = state.selectedEventIds.has(activeEvent.id);
  const type = typeMeta[activeEvent.type] ?? typeMeta.talk;
  const selectedForDay = getSelectedEvents(activeEvent.dayId);
  const conflictIds = getConflictIds(selectedForDay);
  const dayTimeline = getDayTimelineState(activeEvent.dayId, state.now);
  const globalNextEventId = getGlobalNextSelectedEvent(state.now)?.event.id ?? null;
  const chips = [];

  if (selected) {
    chips.push('<span class="chip is-highlight">Ve tvém plánu</span>');
  }

  if (dayTimeline.currentEvents.some((event) => event.id === activeEvent.id)) {
    chips.push('<span class="chip is-highlight">Právě běží</span>');
  } else if (dayTimeline.nextEvent?.id === activeEvent.id || globalNextEventId === activeEvent.id) {
    chips.push('<span class="chip">Další v plánu</span>');
  }

  if (conflictIds.has(activeEvent.id)) {
    chips.push('<span class="chip is-warning">Kolize</span>');
  }

  refs.eventDetailContent.innerHTML = `
    <div class="event-detail-card" style="--event-color: var(${type.colorVar})">
      <button class="event-detail-close" type="button" data-close-event-detail aria-label="Zavřít detail">
        ×
      </button>
      <p class="section-kicker">Detail události</p>
      <h3 id="event-detail-title" class="event-detail-title">${escapeHtml(activeEvent.title)}</h3>
      <p class="event-detail-meta">
        ${escapeHtml(dayMap.get(activeEvent.dayId)?.label ?? "")} • ${formatTimeRange(activeEvent)} • ${escapeHtml(venueMap.get(activeEvent.venueId)?.label ?? "")}
      </p>
      <div class="event-detail-badges">
        <span class="type-pill">${escapeHtml(type.label)}</span>
        ${chips.join("")}
      </div>
      <div class="event-detail-actions">
        <button
          class="primary-button event-detail-toggle ${selected ? "is-selected" : ""}"
          type="button"
          data-event-id="${activeEvent.id}"
          aria-pressed="${String(selected)}"
        >
          ${selected ? "Odebrat z plánu" : "Přidat do plánu"}
        </button>
        <button class="ghost-button" type="button" data-close-event-detail>Zavřít</button>
      </div>
    </div>
  `;

  refs.eventDetailBackdrop.hidden = false;
  refs.eventDetailPanel.hidden = false;
  syncModalBodyState();
}

function buildScheduleTimeMarkers() {
  const markers = [];

  for (let minutes = SCHEDULE_START_MINUTES; minutes <= SCHEDULE_END_MINUTES; minutes += 60) {
    const position = getTimelineOffset(minutes);
    const markerClass =
      minutes === SCHEDULE_START_MINUTES
        ? "schedule-time-marker is-start"
        : minutes === SCHEDULE_END_MINUTES
          ? "schedule-time-marker is-end"
          : "schedule-time-marker";

    markers.push(`
      <div class="${markerClass}" style="top: ${position}px;">
        <span>${formatMinuteLabel(minutes)}</span>
      </div>
    `);
  }

  return markers.join("");
}

function handleDayTabClick(event) {
  const button = event.target.closest("[data-day-id]");
  if (!button) {
    return;
  }

  const { dayId } = button.dataset;
  if (!dayMap.has(dayId)) {
    return;
  }

  state.activeDayId = dayId;
  render();
}

function handleEventCardClick(event) {
  const toggleButton = event.target.closest(".event-toggle[data-event-id]");
  if (toggleButton) {
    toggleEventSelection(toggleButton.dataset.eventId);
    return;
  }

  const eventCard = event.target.closest("[data-open-event-id]");
  if (!eventCard) {
    return;
  }

  openEventDetail(eventCard.dataset.openEventId);
}

function handlePlanActionsPanelClick(event) {
  const closeButton = event.target.closest("[data-close-plan-actions]");
  if (closeButton) {
    closePlanActions();
  }
}

function handleEventDetailClick(event) {
  const closeButton = event.target.closest("[data-close-event-detail]");
  if (closeButton) {
    closeEventDetail();
    return;
  }

  const toggleButton = event.target.closest(".event-detail-toggle[data-event-id]");
  if (toggleButton) {
    toggleEventSelection(toggleButton.dataset.eventId);
  }
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape") {
    if (state.planActionsOpen) {
      closePlanActions();
      return;
    }

    if (state.activeEventId) {
      closeEventDetail();
      return;
    }
  }

  if ((event.key === "Enter" || event.key === " ") && document.activeElement?.matches?.("[data-open-event-id]")) {
    event.preventDefault();
    openEventDetail(document.activeElement.dataset.openEventId);
    return;
  }
}

function handlePlanActionsToggle() {
  state.planActionsOpen = !state.planActionsOpen;
  if (state.planActionsOpen) {
    state.activeEventId = null;
  }
  render();
}

function handleRestoreDefaults() {
  state.selectedEventIds = new Set(defaultSelectedIds);
  state.planSource = "Výchozí plán";
  state.planActionsOpen = false;
  persistCurrentPlan();
  showNotice("Vrátil jsem výchozí plán.", "info");
  render();
}

function handleClearSelection() {
  state.selectedEventIds = new Set();
  state.planSource = "Ruční výběr";
  state.planActionsOpen = false;
  persistCurrentPlan();
  showNotice("Výběr je prázdný.", "info");
  render();
}

function handleImport() {
  const rawValue = refs.importInput.value.trim();
  if (!rawValue) {
    showNotice("Nejdřív vlož kód plánu nebo celý odkaz.", "warning");
    return;
  }

  const extractedCode = extractPlanCode(rawValue);
  if (!extractedCode) {
    showNotice("Zadaný text neobsahuje platný parametr plan ani kód ve formátu vN....", "warning");
    return;
  }

  const decoded = decodePlan(extractedCode);
  if (!decoded.ok) {
    showNotice(decoded.error, "danger");
    return;
  }

  state.selectedEventIds = decoded.selectedEventIds;
  state.planSource = "Ruční import";
  state.planActionsOpen = false;
  refs.importInput.value = "";
  persistCurrentPlan();
  showNotice("Plán byl naimportovaný.", "info");
  render();
}

function handleCopy(input, successMessage) {
  copyText(input.value)
    .then(() => showNotice(successMessage, "info"))
    .catch(() => showNotice("Kopírování selhalo, ale text zůstal v poli připravený k ručnímu zkopírování.", "warning"));
}

function toggleEventSelection(eventId) {
  if (!eventMap.has(eventId)) {
    return;
  }

  const nextSelection = new Set(state.selectedEventIds);
  if (nextSelection.has(eventId)) {
    nextSelection.delete(eventId);
  } else {
    nextSelection.add(eventId);
  }

  state.selectedEventIds = nextSelection;
  state.planSource = "Ruční výběr";
  persistCurrentPlan();
  render();
}

function openEventDetail(eventId) {
  if (!eventMap.has(eventId)) {
    return;
  }

  state.planActionsOpen = false;
  state.activeEventId = eventId;
  render();
}

function closeEventDetail() {
  if (!state.activeEventId) {
    return;
  }

  state.activeEventId = null;
  render();
}

function closePlanActions() {
  if (!state.planActionsOpen) {
    return;
  }

  state.planActionsOpen = false;
  render();
}

function syncModalBodyState() {
  document.body.classList.toggle("has-modal", Boolean(state.activeEventId || state.planActionsOpen));
}

function persistCurrentPlan() {
  const saveResult = savePlanToCookie(encodePlan(state.selectedEventIds));
  if (!saveResult.ok) {
    showNotice("Cookies jsou zřejmě vypnuté. Výběr zůstává jen do zavření stránky.", "warning");
  }
}

function chooseInitialDayId() {
  const nextSelection = getGlobalNextSelectedEvent(state.now);
  if (nextSelection) {
    return nextSelection.event.dayId;
  }

  return getCurrentFestivalDayId(state.now) ?? meta.days[0]?.id ?? "";
}

function loadPlanFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const planCode = params.get("plan");
  if (!planCode) {
    return { applied: false, error: "" };
  }

  const decoded = decodePlan(planCode);
  if (!decoded.ok) {
    return { applied: false, error: decoded.error };
  }

  return { applied: true, selectedEventIds: decoded.selectedEventIds };
}

function loadPlanFromCookie() {
  const cookieValue = getCookie(cookieKey);
  if (!cookieValue) {
    return { applied: false };
  }

  const decoded = decodePlan(cookieValue);
  if (!decoded.ok) {
    return { applied: false };
  }

  return { applied: true, selectedEventIds: decoded.selectedEventIds };
}

function savePlanToCookie(planCode) {
  try {
    document.cookie = `${cookieKey}=${encodeURIComponent(planCode)}; Max-Age=31536000; Path=/; SameSite=Lax`;
    const persistedValue = getCookie(cookieKey);
    if (persistedValue !== planCode) {
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function encodePlan(selectedEventIds) {
  const byteLength = Math.floor(maxPlanIndex / 8) + 1;
  const bytes = new Uint8Array(byteLength);

  for (const eventId of selectedEventIds) {
    const event = eventMap.get(eventId);
    if (!event) {
      continue;
    }

    const byteIndex = Math.floor(event.planIndex / 8);
    const bitOffset = event.planIndex % 8;
    bytes[byteIndex] |= 1 << bitOffset;
  }

  const payload = bytesToBase64Url(bytes);
  return `v${meta.planSchemaVersion}.${payload}`;
}

function decodePlan(planCode) {
  const trimmed = planCode.trim();
  const [versionPart, payload] = trimmed.split(".");
  if (!versionPart || !payload || !/^v\d+$/.test(versionPart)) {
    return { ok: false, error: "Kód plánu není ve správném formátu." };
  }

  const version = Number.parseInt(versionPart.slice(1), 10);
  if (!supportedPlanVersions.has(version)) {
    return {
      ok: false,
      error: `Kód používá verzi ${version}, ale tahle aplikace umí jen verze ${formatSupportedPlanVersions()}.`
    };
  }

  let bytes;
  try {
    bytes = base64UrlToBytes(payload);
  } catch (error) {
    return { ok: false, error: "Kód plánu nejde dekódovat." };
  }

  const selectedEventIds = new Set();
  for (let planIndex = 0; planIndex <= maxPlanIndex; planIndex += 1) {
    const byteIndex = Math.floor(planIndex / 8);
    const bitOffset = planIndex % 8;
    const byte = bytes[byteIndex] ?? 0;

    if ((byte & (1 << bitOffset)) === 0) {
      continue;
    }

    const eventIds = getEventIdsForPlanIndex(planIndex, version);
    for (const eventId of eventIds) {
      selectedEventIds.add(eventId);
    }
  }

  return { ok: true, selectedEventIds };
}

function formatSupportedPlanVersions() {
  return [...supportedPlanVersions]
    .sort((leftVersion, rightVersion) => leftVersion - rightVersion)
    .join(" a ");
}

function getEventIdsForPlanIndex(planIndex, version) {
  const legacyEventIds = legacyPlanIndexEventIds[version]?.get(planIndex);
  if (legacyEventIds) {
    return legacyEventIds;
  }

  const event = eventByPlanIndex.get(planIndex);
  return event ? [event.id] : [];
}

function getEventsForDay(dayId) {
  return events
    .filter((event) => event.dayId === dayId)
    .sort((a, b) => parseTime(a.start) - parseTime(b.start) || parseTime(a.end) - parseTime(b.end));
}

function getSelectedEvents(dayId) {
  return getEventsForDay(dayId).filter((event) => state.selectedEventIds.has(event.id));
}

function getDayTimelineState(dayId, now = state.now) {
  const isToday = dayId === getCurrentFestivalDayId(now);
  if (!isToday) {
    return {
      isToday: false,
      currentEvents: [],
      nextEvent: null,
      minutesUntilNext: null
    };
  }

  const selectedEvents = getSelectedEvents(dayId);
  const currentMinute = now.hour * 60 + now.minute;
  const currentEvents = selectedEvents.filter(
    (event) => parseTime(event.start) <= currentMinute && currentMinute < parseTime(event.end)
  );
  const nextEvent = selectedEvents.find((event) => parseTime(event.start) > currentMinute) ?? null;

  return {
    isToday: true,
    currentEvents,
    nextEvent,
    minutesUntilNext: nextEvent ? parseTime(nextEvent.start) - currentMinute : null
  };
}

function getGlobalNextSelectedEvent(now = state.now) {
  const festivalCalendar = getFestivalCalendar(now);
  const nowSortKey = getDateOrdinal(now) * 1440 + now.hour * 60 + now.minute;

  const nextEvent = [...state.selectedEventIds]
    .map((eventId) => eventMap.get(eventId))
    .filter(Boolean)
    .filter((event) => getEventStartSortKey(event, festivalCalendar) > nowSortKey)
    .sort((leftEvent, rightEvent) => getEventStartSortKey(leftEvent, festivalCalendar) - getEventStartSortKey(rightEvent, festivalCalendar))[0] ?? null;

  if (!nextEvent) {
    return null;
  }

  return {
    event: nextEvent,
    relativeLabel: getRelativeEventLabel(nextEvent, festivalCalendar, now)
  };
}

function getConflictIds(selectedEvents) {
  const sortedEvents = [...selectedEvents].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  const conflictIds = new Set();

  for (let outerIndex = 0; outerIndex < sortedEvents.length; outerIndex += 1) {
    const outerEvent = sortedEvents[outerIndex];

    for (let innerIndex = outerIndex + 1; innerIndex < sortedEvents.length; innerIndex += 1) {
      const innerEvent = sortedEvents[innerIndex];

      if (parseTime(innerEvent.start) >= parseTime(outerEvent.end)) {
        break;
      }

      if (parseTime(innerEvent.end) > parseTime(outerEvent.start)) {
        conflictIds.add(outerEvent.id);
        conflictIds.add(innerEvent.id);
      }
    }
  }

  return conflictIds;
}

function buildShareLink(planCode) {
  const shareUrl = new URL(window.location.href);
  shareUrl.searchParams.set("plan", planCode);
  return shareUrl.toString();
}

function extractPlanCode(inputValue) {
  if (/^v\d+\./.test(inputValue)) {
    return inputValue;
  }

  try {
    const url = new URL(inputValue);
    return url.searchParams.get("plan");
  } catch (error) {
    return null;
  }
}

function clearPlanParameterFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("plan")) {
    return;
  }

  url.searchParams.delete("plan");
  window.history.replaceState({}, document.title, url.toString());
}

function showNotice(text, kind = "info") {
  state.notice = { text, kind };
  renderNotice();

  if (noticeTimer) {
    window.clearTimeout(noticeTimer);
  }

  noticeTimer = window.setTimeout(() => {
    state.notice = { text: "", kind: "" };
    renderNotice();
  }, 4200);
}

function renderNotice() {
  refs.notice.textContent = state.notice.text;
  refs.notice.className = `notice ${state.notice.kind ? `is-${state.notice.kind}` : ""}`.trim();
}

function getCookie(name) {
  const cookieEntry = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookieEntry) {
    return "";
  }

  const [, value = ""] = cookieEntry.split("=");
  return decodeURIComponent(value);
}

function getPragueNow() {
  const parts = Object.fromEntries(
    pragueNowFormatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const year = Number.parseInt(parts.year, 10);
  const month = Number.parseInt(parts.month, 10);
  const day = Number.parseInt(parts.day, 10);
  const hour = Number.parseInt(parts.hour, 10);
  const minute = Number.parseInt(parts.minute, 10);

  return {
    year,
    month,
    day,
    hour,
    minute,
    isoWeekday: isoWeekdayByShortName[parts.weekday],
    dateKey: toDateKey({ year, month, day }),
    timeString: `${padNumber(hour)}:${padNumber(minute)}`
  };
}

function getFestivalCalendar(now = state.now) {
  const thursdayOffset = now.isoWeekday === 7 ? isoWeekdayByDayId.thu : isoWeekdayByDayId.thu - now.isoWeekday;
  const currentDate = { year: now.year, month: now.month, day: now.day };
  const thursdayDate = addDays(currentDate, thursdayOffset);

  return Object.fromEntries(
    festivalDayOrder.map((dayId, index) => {
      const date = addDays(thursdayDate, index);
      return [
        dayId,
        {
          ...date,
          dateKey: toDateKey(date),
          ordinal: getDateOrdinal(date)
        }
      ];
    })
  );
}

function getCurrentFestivalDayId(now = state.now) {
  const festivalCalendar = getFestivalCalendar(now);
  return festivalDayOrder.find((dayId) => festivalCalendar[dayId].dateKey === now.dateKey) ?? null;
}

function getEventStartSortKey(event, festivalCalendar) {
  return festivalCalendar[event.dayId].ordinal * 1440 + parseTime(event.start);
}

function getRelativeEventLabel(event, festivalCalendar, now = state.now) {
  const eventDateKey = festivalCalendar[event.dayId].dateKey;
  const tomorrowKey = toDateKey(addDays({ year: now.year, month: now.month, day: now.day }, 1));

  if (eventDateKey === now.dateKey) {
    const minutesUntil = getEventStartSortKey(event, festivalCalendar) - (getDateOrdinal(now) * 1440 + now.hour * 60 + now.minute);
    return `dnes za ${minutesUntil} min`;
  }

  if (eventDateKey === tomorrowKey) {
    return "zítra";
  }

  return "";
}

function formatFestivalDayLabel(dayId, festivalCalendar = getFestivalCalendar(state.now)) {
  const dayInfo = festivalCalendar[dayId];
  const dayLabel = dayMap.get(dayId)?.label ?? dayId;
  return `${dayLabel} ${padNumber(dayInfo.day)}.${padNumber(dayInfo.month)}.`;
}

function addDays(dateLike, daysToAdd) {
  const date = new Date(Date.UTC(dateLike.year, dateLike.month - 1, dateLike.day));
  date.setUTCDate(date.getUTCDate() + daysToAdd);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function toDateKey(dateLike) {
  return `${dateLike.year}-${padNumber(dateLike.month)}-${padNumber(dateLike.day)}`;
}

function getDateOrdinal(dateLike) {
  return Math.floor(Date.UTC(dateLike.year, dateLike.month - 1, dateLike.day) / 86400000);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatMinuteLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;
  return `${padNumber(hours)}:${padNumber(minutesPart)}`;
}

function getTimelineOffset(minutes) {
  return Math.max(0, minutes - SCHEDULE_START_MINUTES) * TIMELINE_MINUTE_HEIGHT;
}

function getTimelineHeight(durationMinutes) {
  return Math.max(durationMinutes, 15) * TIMELINE_MINUTE_HEIGHT;
}

function isMinuteWithinSchedule(minutes) {
  return minutes >= SCHEDULE_START_MINUTES && minutes <= SCHEDULE_END_MINUTES;
}

function parseTime(timeString) {
  const [hours = "0", minutes = "0"] = timeString.split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function formatTimeRange(event) {
  return `${event.start}–${event.end}`;
}

function bytesToBase64Url(bytes) {
  const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binaryString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binaryString = atob(padded);
  return Uint8Array.from(binaryString, (character) => character.charCodeAt(0));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackInput = document.createElement("textarea");
  fallbackInput.value = value;
  fallbackInput.setAttribute("readonly", "");
  fallbackInput.style.position = "absolute";
  fallbackInput.style.left = "-9999px";
  document.body.append(fallbackInput);
  fallbackInput.select();
  const copied = document.execCommand("copy");
  fallbackInput.remove();

  if (!copied) {
    throw new Error("Fallback copy failed");
  }
}

function pluralize(count, variants) {
  const mod100 = count % 100;

  if (count === 1) {
    return variants[0];
  }

  if (mod100 >= 12 && mod100 <= 14) {
    return `${count} ${variants[2].slice(2)}`;
  }

  if (count >= 2 && count <= 4) {
    return `${count} ${variants[1].slice(2)}`;
  }

  const mod10 = count % 10;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} ${variants[1].slice(2)}`;
  }

  return `${count} ${variants[2].slice(2)}`;
}
