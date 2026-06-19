const EVENTS_MANIFEST_URL = "./data/events.json";
const EVENT_QUERY_PARAM = "event";
const MAX_COOKIE_AGE_SECONDS = 31536000;
const TIMELINE_MINUTE_HEIGHT = 2;
const TIMELINE_EDGE_PADDING = 14;
const ISO_WEEKDAY_BY_SHORT_NAME = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7
};

const DEFAULT_UI = {
  labels: {
    day: "Day",
    plan: "Plan",
    shareAndSettings: "Share and settings",
    shareCode: "Plan code",
    shareLink: "Share link",
    importPlan: "Import code or full link",
    importPlaceholder: "v1.... or link with ?plan=v1....",
    load: "Load",
    copy: "Copy",
    restoreDefaults: "Default plan",
    clearSelection: "Clear",
    close: "Close",
    scheduleTime: "Time",
    scheduleTimeNote: "",
    scheduleVenueCount: "{count}",
    planActionsCopy: "",
    eventDetail: "Event detail",
    openMap: "Open map",
    eventBrowserButton: "Browse events",
    eventBrowserTitle: "Choose event",
    eventBrowserCopy: "",
    openCurrentEvent: "Open",
    clearTypeFilter: "Reset filter"
  },
  sections: {
    overviewKicker: "Overview",
    overviewHeading: "Now and next",
    itineraryKicker: "Your day",
    itineraryHeading: "Selected itinerary",
    scheduleKicker: "Full schedule",
    scheduleHeading: "Schedule by venue",
    planKicker: "Plan"
  },
  cards: {
    current: "Now",
    next: "Next"
  },
  badges: {
    current: "Now running",
    next: "Next",
    nextInPlan: "Next in plan",
    selected: "Selected",
    conflict: "Conflict"
  },
  emptyStates: {
    currentNoneToday: "Nothing selected is running",
    currentNoneOtherDay: "No selection is running now",
    currentNoneTodayCopy: "The next selected item is shown next to it or below in the itinerary.",
    currentNoneOtherDayCopy: "You can browse the active day ahead and open details from the cards below.",
    nextDoneTitle: "This plan is complete",
    nextDoneCopy: "There are no more selected events.",
    itineraryEmptyTitle: "Nothing selected for this day yet",
    itineraryEmptyCopy: "Add items below in the schedule or restore the default plan."
  },
  summaries: {
    selectedForDay: "{count} selected in active day",
    selectedTotal: "{count} total selected",
    conflicts: "{count} conflicts",
    noConflicts: "No conflicts"
  },
  statuses: {
    defaultPlan: "Default plan",
    sharedLink: "Shared link",
    restoredCookie: "Restored from cookie",
    manualImport: "Imported manually",
    manualSelection: "Manual selection"
  },
  messages: {
    sharedPlanLoaded: "Loaded the shared plan from the link.",
    defaultsRestored: "Restored the default plan.",
    selectionCleared: "Selection is empty.",
    importSuccess: "Plan imported.",
    copyCodeSuccess: "Plan code copied.",
    copyLinkSuccess: "Share link copied.",
    copyFailed: "Copy failed, but the text remains in the field for manual copy.",
    importEmpty: "Paste a plan code or full link first.",
    importInvalid: "The provided text does not contain a valid plan parameter or code.",
    cookieUnavailable: "Cookies appear disabled. The selection will only last until the page is closed.",
    invalidCodeFormat: "The plan code format is invalid.",
    invalidCodeDecode: "The plan code could not be decoded.",
    versionMismatch: "The plan code uses version {version}, but this app only supports version {supportedVersion}.",
    currentEventBadge: "Current event",
    upcomingEventBadge: "Upcoming"
  },
  aria: {
    openEventDetail: "Open event detail: {title}",
    addToPlan: "Add {title} to the plan",
    removeFromPlan: "Remove {title} from the plan",
    closePlanMenu: "Close plan menu",
    closeEventDetail: "Close event detail",
    closeEventBrowser: "Close event browser",
    openEventCatalog: "Open event browser"
  }
};

const refs = {
  appTitle: document.querySelector("#app-title"),
  appDescriptionMeta: document.querySelector('meta[name="description"]'),
  brandEyebrow: document.querySelector("#brand-eyebrow"),
  brandTitle: document.querySelector("#brand-title"),
  brandCopy: document.querySelector("#brand-copy"),
  dayLabel: document.querySelector("#day-label"),
  dayTabs: document.querySelector("#day-tabs"),
  notice: document.querySelector("#notice"),
  overviewKicker: document.querySelector("#overview-kicker"),
  overviewHeading: document.querySelector("#overview-heading"),
  overviewMeta: document.querySelector("#overview-meta"),
  typeFilters: document.querySelector("#type-filters"),
  overviewCards: document.querySelector("#overview-cards"),
  itineraryKicker: document.querySelector("#itinerary-kicker"),
  itineraryHeading: document.querySelector("#itinerary-heading"),
  scheduleKicker: document.querySelector("#schedule-kicker"),
  scheduleHeading: document.querySelector("#schedule-heading"),
  planActionsButton: document.querySelector("#plan-actions-button"),
  planActionsBackdrop: document.querySelector("#plan-actions-backdrop"),
  planActionsPanel: document.querySelector("#plan-actions-panel"),
  planKicker: document.querySelector("#plan-kicker"),
  planActionsTitle: document.querySelector("#plan-actions-title"),
  planActionsCopy: document.querySelector("#plan-actions-copy"),
  restoreDefaultsButton: document.querySelector("#restore-defaults-button"),
  clearSelectionButton: document.querySelector("#clear-selection-button"),
  shareCodeLabel: document.querySelector("#share-code-label"),
  shareCode: document.querySelector("#share-code"),
  shareLinkLabel: document.querySelector("#share-link-label"),
  shareLink: document.querySelector("#share-link"),
  copyCodeButton: document.querySelector("#copy-code-button"),
  copyLinkButton: document.querySelector("#copy-link-button"),
  importLabel: document.querySelector("#import-label"),
  importInput: document.querySelector("#import-input"),
  importButton: document.querySelector("#import-button"),
  planActionsCloseButton: document.querySelector("#plan-actions-close-button"),
  planActionsCloseTextButton: document.querySelector("#plan-actions-close-text-button"),
  toolbarActionLinks: document.querySelector("#toolbar-action-links"),
  eventBrowserButton: document.querySelector("#event-browser-button"),
  eventBrowserBackdrop: document.querySelector("#event-browser-backdrop"),
  eventBrowserPanel: document.querySelector("#event-browser-panel"),
  eventBrowserKicker: document.querySelector("#event-browser-kicker"),
  eventBrowserTitle: document.querySelector("#event-browser-title"),
  eventBrowserCopy: document.querySelector("#event-browser-copy"),
  eventBrowserContent: document.querySelector("#event-browser-content"),
  eventBrowserCloseButton: document.querySelector("#event-browser-close-button"),
  eventBrowserCloseTextButton: document.querySelector("#event-browser-close-text-button"),
  itineraryContent: document.querySelector("#itinerary-content"),
  scheduleContent: document.querySelector("#schedule-content"),
  eventDetailBackdrop: document.querySelector("#event-detail-backdrop"),
  eventDetailPanel: document.querySelector("#event-detail-panel"),
  eventDetailContent: document.querySelector("#event-detail-content")
};

const state = {
  catalog: null,
  currentEventSlug: "",
  config: null,
  activeDayId: "",
  now: null,
  notice: { kind: "", text: "" },
  planSource: "",
  selectedEventIds: new Set(),
  activeTypeFilterIds: new Set(),
  planActionsOpen: false,
  activeEventId: null,
  eventBrowserOpen: false
};

let noticeTimer = null;
let clockTimer = null;
let scheduleScrollTeardown = null;

initialize().catch((error) => {
  console.error(error);
  renderFatalError("Nepodařilo se načíst konfiguraci aplikace.");
});

async function initialize() {
  state.catalog = await loadEventsCatalog();
  const eventEntry = resolveCurrentEventEntry(state.catalog);
  state.currentEventSlug = eventEntry.slug;

  const rawConfig = await loadJson(eventEntry.dataset);
  state.config = prepareConfig(rawConfig, { datasetUrl: eventEntry.dataset });
  state.now = getAppNow();

  applyDocumentMetadata();
  applyStaticContent();

  const imported = loadPlanFromUrl();
  if (imported.applied) {
    state.selectedEventIds = imported.selectedEventIds;
    state.planSource = getStatus("sharedLink");
    showNotice(getMessage("sharedPlanLoaded"), "info");
    savePlanToCookie(encodePlan(state.selectedEventIds));
    clearPlanParameterFromUrl();
  } else {
    const fromCookie = loadPlanFromCookie();
    if (fromCookie.applied) {
      state.selectedEventIds = fromCookie.selectedEventIds;
      state.planSource = getStatus("restoredCookie");
    } else {
      state.selectedEventIds = new Set(state.config.defaultSelectedIds);
      state.planSource = getStatus("defaultPlan");
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

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load JSON: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function loadEventsCatalog() {
  const manifest = await loadJson(EVENTS_MANIFEST_URL);

  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.events) || manifest.events.length === 0) {
    throw new Error("Invalid events manifest.");
  }

  const defaultEventSlug = typeof manifest.defaultEventSlug === "string" && manifest.defaultEventSlug
    ? manifest.defaultEventSlug
    : manifest.events[0].slug;

  for (const eventEntry of manifest.events) {
    if (
      !eventEntry
      || typeof eventEntry.slug !== "string"
      || typeof eventEntry.label !== "string"
      || typeof eventEntry.dataset !== "string"
      || typeof eventEntry.startsOn !== "string"
      || typeof eventEntry.endsOn !== "string"
    ) {
      throw new Error("Every manifest event must define slug, label, dataset, startsOn and endsOn.");
    }

    validateDate(eventEntry.startsOn, `events.${eventEntry.slug}.startsOn`);
    validateDate(eventEntry.endsOn, `events.${eventEntry.slug}.endsOn`);
  }

  if (!manifest.events.some((eventEntry) => eventEntry.slug === defaultEventSlug)) {
    throw new Error("Manifest defaultEventSlug does not exist in events.");
  }

  return {
    defaultEventSlug,
    events: manifest.events
  };
}

function resolveCurrentEventEntry(catalog) {
  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get(EVENT_QUERY_PARAM);
  if (requestedSlug) {
    return catalog.events.find((eventEntry) => eventEntry.slug === requestedSlug)
      ?? catalog.events.find((eventEntry) => eventEntry.slug === catalog.defaultEventSlug)
      ?? catalog.events[0];
  }

  const todayKey = getPragueTodayDateKey();
  const currentEvent = catalog.events.find((eventEntry) => eventEntry.startsOn <= todayKey && todayKey <= eventEntry.endsOn);
  if (currentEvent) {
    return currentEvent;
  }

  const upcomingEvent = [...catalog.events]
    .filter((eventEntry) => eventEntry.startsOn > todayKey)
    .sort((left, right) => left.startsOn.localeCompare(right.startsOn))[0];

  return upcomingEvent
    ?? catalog.events.find((eventEntry) => eventEntry.slug === catalog.defaultEventSlug)
    ?? catalog.events[0];
}

function resolveUrlFromDataset(datasetUrl, relativeUrl) {
  return new URL(relativeUrl, new URL(datasetUrl, window.location.href)).toString();
}

function prepareConfig(rawConfig, { datasetUrl }) {
  validateRoot(rawConfig);

  const app = rawConfig.app;
  const branding = rawConfig.branding ?? {};
  const assets = rawConfig.assets ?? {};
  const actionLinks = Array.isArray(assets.actions)
    ? assets.actions.filter(isToolbarActionLink).map((action) => ({
        ...action,
        href: resolveUrlFromDataset(datasetUrl, action.href)
      }))
    : [];
  const ui = mergeDeep(DEFAULT_UI, rawConfig.ui ?? {});
  const schedule = rawConfig.schedule;
  const scheduleStartMinutes = parseTime(schedule.dayStart);
  const scheduleEndMinutes = parseTime(schedule.dayEnd);

  if (scheduleEndMinutes <= scheduleStartMinutes) {
    throw new Error("schedule.dayEnd must be after schedule.dayStart.");
  }

  const days = schedule.days.map((day) => {
    validateDate(day.date, `schedule.days[${day.id}].date`);
    return {
      ...day,
      dateKey: day.date,
      dateParts: parseDateKey(day.date),
      ordinal: getDateOrdinal(parseDateKey(day.date))
    };
  });

  const events = schedule.events.map((event) => {
    const startMinutes = parseTime(event.start);
    const endMinutes = parseTime(event.end);
    if (endMinutes <= startMinutes) {
      throw new Error(`Event ${event.id} has invalid start/end time.`);
    }

    return {
      ...event,
      startMinutes,
      endMinutes,
      durationMinutes: endMinutes - startMinutes
    };
  });

  const dayMap = new Map(days.map((day) => [day.id, day]));
  const venueMap = new Map(schedule.venues.map((venue) => [venue.id, venue]));
  const typeMap = new Map(schedule.types.map((type) => [type.id, type]));
  const eventMap = new Map(events.map((event) => [event.id, event]));
  const eventByPlanIndex = new Map(events.map((event) => [event.planIndex, event]));
  const maxPlanIndex = Math.max(...events.map((event) => event.planIndex));

  validateDerivedReferences(days, schedule.venues, schedule.types, events, dayMap, venueMap, typeMap, eventByPlanIndex);

  return {
    app,
    branding,
    assets: {
      ...assets,
      actions: actionLinks
    },
    ui,
    schedule: {
      ...schedule,
      days,
      events
    },
    maps: {
      dayMap,
      venueMap,
      typeMap,
      eventMap,
      eventByPlanIndex
    },
    dayOrder: days.map((day) => day.id),
    defaultSelectedIds: new Set(events.filter((event) => event.defaultSelected).map((event) => event.id)),
    scheduleStartMinutes,
    scheduleEndMinutes,
    timelineHeight: (scheduleEndMinutes - scheduleStartMinutes) * TIMELINE_MINUTE_HEIGHT,
    maxPlanIndex,
    nowFormatter: new Intl.DateTimeFormat("en-GB", {
      timeZone: app.timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23"
    })
  };
}

function validateRoot(rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Dataset root must be an object.");
  }

  const requiredAppKeys = ["id", "title", "description", "locale", "timezone", "planSchemaVersion"];
  for (const key of requiredAppKeys) {
    if (!rawConfig.app || typeof rawConfig.app[key] !== "string" && key !== "planSchemaVersion") {
      if (key === "planSchemaVersion" && typeof rawConfig.app?.planSchemaVersion === "number") {
        continue;
      }
      throw new Error(`Missing app.${key} in dataset.`);
    }
  }

  if (!rawConfig.schedule || typeof rawConfig.schedule !== "object") {
    throw new Error("Missing schedule object in dataset.");
  }

  const requiredScheduleArrays = ["days", "venues", "types", "events"];
  for (const key of requiredScheduleArrays) {
    if (!Array.isArray(rawConfig.schedule[key]) || rawConfig.schedule[key].length === 0) {
      throw new Error(`schedule.${key} must be a non-empty array.`);
    }
  }

  if (typeof rawConfig.schedule.dayStart !== "string" || typeof rawConfig.schedule.dayEnd !== "string") {
    throw new Error("schedule.dayStart and schedule.dayEnd must be strings.");
  }
}

function validateDerivedReferences(days, venues, types, events, dayMap, venueMap, typeMap, eventByPlanIndex) {
  assertUniqueIds(days, "day");
  assertUniqueIds(venues, "venue");
  assertUniqueIds(types, "type");
  assertUniqueIds(events, "event");

  for (const event of events) {
    if (!dayMap.has(event.dayId)) {
      throw new Error(`Event ${event.id} references unknown dayId ${event.dayId}.`);
    }

    if (!venueMap.has(event.venueId)) {
      throw new Error(`Event ${event.id} references unknown venueId ${event.venueId}.`);
    }

    if (!typeMap.has(event.type)) {
      throw new Error(`Event ${event.id} references unknown type ${event.type}.`);
    }

    if (!Number.isInteger(event.planIndex) || event.planIndex < 0) {
      throw new Error(`Event ${event.id} has invalid planIndex.`);
    }
  }

  if (eventByPlanIndex.size !== events.length) {
    throw new Error("Event planIndex values must be unique.");
  }
}

function assertUniqueIds(items, label) {
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== "string" || !item.id) {
      throw new Error(`${label} is missing a valid id.`);
    }

    if (ids.has(item.id)) {
      throw new Error(`Duplicate ${label} id detected: ${item.id}.`);
    }

    ids.add(item.id);
  }
}

function validateDate(value, path) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${path} must use YYYY-MM-DD format.`);
  }
}

function mergeDeep(baseValue, overrideValue) {
  if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
    return overrideValue ?? baseValue;
  }

  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const merged = { ...baseValue };
    for (const [key, value] of Object.entries(overrideValue)) {
      merged[key] = key in baseValue ? mergeDeep(baseValue[key], value) : value;
    }
    return merged;
  }

  return overrideValue ?? baseValue;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isToolbarActionLink(value) {
  return isPlainObject(value) && typeof value.label === "string" && typeof value.href === "string";
}

function applyDocumentMetadata() {
  const { app } = state.config;
  document.documentElement.lang = app.locale || "en";
  document.title = app.title;
  refs.appTitle.textContent = app.title;
  refs.appDescriptionMeta.setAttribute("content", app.description);
}

function applyStaticContent() {
  const { app, branding, assets, ui } = state.config;

  refs.brandEyebrow.textContent = branding.eyebrow ?? "";
  refs.brandTitle.textContent = branding.headline ?? app.title;
  refs.brandCopy.textContent = branding.copy ?? app.description;

  refs.dayLabel.textContent = ui.labels.day;
  refs.overviewKicker.textContent = ui.sections.overviewKicker;
  refs.overviewHeading.textContent = ui.sections.overviewHeading;
  refs.itineraryKicker.textContent = ui.sections.itineraryKicker;
  refs.itineraryHeading.textContent = ui.sections.itineraryHeading;
  refs.scheduleKicker.textContent = ui.sections.scheduleKicker;
  refs.scheduleHeading.textContent = ui.sections.scheduleHeading;
  refs.planKicker.textContent = ui.sections.planKicker;
  refs.planActionsTitle.textContent = ui.labels.shareAndSettings;
  refs.planActionsButton.textContent = ui.labels.shareAndSettings;
  refs.planActionsCopy.textContent = ui.labels.planActionsCopy;
  refs.restoreDefaultsButton.textContent = ui.labels.restoreDefaults;
  refs.clearSelectionButton.textContent = ui.labels.clearSelection;
  refs.shareCodeLabel.textContent = ui.labels.shareCode;
  refs.shareLinkLabel.textContent = ui.labels.shareLink;
  refs.copyCodeButton.textContent = ui.labels.copy;
  refs.copyLinkButton.textContent = ui.labels.copy;
  refs.importLabel.textContent = ui.labels.importPlan;
  refs.importInput.placeholder = ui.labels.importPlaceholder;
  refs.importButton.textContent = ui.labels.load;
  refs.eventBrowserButton.textContent = ui.labels.eventBrowserButton;
  refs.eventBrowserButton.setAttribute("aria-label", getAria("openEventCatalog"));
  refs.eventBrowserKicker.textContent = ui.sections.planKicker;
  refs.eventBrowserTitle.textContent = ui.labels.eventBrowserTitle;
  refs.eventBrowserCopy.textContent = ui.labels.eventBrowserCopy;

  refs.planActionsCloseButton.setAttribute("aria-label", getAria("closePlanMenu"));
  refs.planActionsCloseTextButton.textContent = ui.labels.close;
  refs.planActionsCloseTextButton.setAttribute("aria-label", getAria("closePlanMenu"));
  refs.eventBrowserCloseButton.setAttribute("aria-label", getAria("closeEventBrowser"));
  refs.eventBrowserCloseTextButton.textContent = ui.labels.close;
  refs.dayTabs.setAttribute("aria-label", ui.labels.day);
  renderToolbarActionLinks(assets.actions);
  renderEventBrowser();
}

function renderToolbarActionLinks(actions = []) {
  if (!actions.length) {
    refs.toolbarActionLinks.innerHTML = "";
    refs.toolbarActionLinks.hidden = true;
    return;
  }

  refs.toolbarActionLinks.hidden = false;
  refs.toolbarActionLinks.innerHTML = actions
    .map((action) => {
      const target = action.newTab === false ? "_self" : "_blank";
      const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";
      return `
        <a class="toolbar-link-button" href="${escapeHtml(action.href)}" target="${target}"${rel}>
          ${escapeHtml(action.label)}
        </a>
      `;
    })
    .join("");
}

function bindStaticEvents() {
  refs.dayTabs.addEventListener("click", handleDayTabClick);
  refs.typeFilters.addEventListener("click", handleTypeFilterClick);
  refs.overviewCards.addEventListener("click", handleEventCardClick);
  refs.itineraryContent.addEventListener("click", handleEventCardClick);
  refs.scheduleContent.addEventListener("click", handleEventCardClick);
  refs.planActionsButton.addEventListener("click", handlePlanActionsToggle);
  refs.planActionsBackdrop.addEventListener("click", closePlanActions);
  refs.planActionsPanel.addEventListener("click", handlePlanActionsPanelClick);
  refs.eventBrowserButton.addEventListener("click", handleEventBrowserToggle);
  refs.eventBrowserBackdrop.addEventListener("click", closeEventBrowser);
  refs.eventBrowserPanel.addEventListener("click", handleEventBrowserPanelClick);
  refs.restoreDefaultsButton.addEventListener("click", handleRestoreDefaults);
  refs.clearSelectionButton.addEventListener("click", handleClearSelection);
  refs.eventDetailBackdrop.addEventListener("click", closeEventDetail);
  refs.eventDetailPanel.addEventListener("click", handleEventDetailClick);
  refs.copyCodeButton.addEventListener("click", () => handleCopy(refs.shareCode, getMessage("copyCodeSuccess")));
  refs.copyLinkButton.addEventListener("click", () => handleCopy(refs.shareLink, getMessage("copyLinkSuccess")));
  refs.importButton.addEventListener("click", handleImport);
  refs.importInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleImport();
    }
  });
  document.addEventListener("keydown", handleDocumentKeydown);
}

function render() {
  state.now = getAppNow();
  renderDayTabs();
  renderOverview();
  renderPlanActions();
  renderEventBrowser();
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
  refs.dayTabs.innerHTML = state.config.schedule.days
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
          ${escapeHtml(day.label)} <span class="sr-only">(${selectedCount})</span>
        </button>
      `;
    })
    .join("");
}

function renderOverview() {
  const currentDayId = getCurrentFestivalDayId(state.now);
  const selectedEvents = currentDayId ? getSelectedEvents(currentDayId) : [];
  const dayTimeline = currentDayId ? getDayTimelineState(currentDayId, state.now) : {
    isToday: false,
    currentEvents: [],
    nextEvent: null
  };
  const nextSelection = getGlobalNextSelectedEvent(state.now);
  const conflictIds = getConflictIds(selectedEvents);
  const currentEvent = dayTimeline.currentEvents[0] ?? null;

  const currentCard = currentEvent
    ? buildOverviewCard({
        label: state.config.ui.cards.current,
        event: currentEvent,
        timeText: formatTimeRange(currentEvent),
        copyText: buildCurrentVenueSummary(currentEvent, dayTimeline.currentEvents.length)
      })
    : `
      <article class="overview-card">
        <p class="card-label">${escapeHtml(state.config.ui.cards.current)}</p>
        <h3 class="card-title">${escapeHtml(getEmptyState("currentNoneToday"))}</h3>
        <p class="card-copy">${escapeHtml(getEmptyState("currentNoneTodayCopy"))}</p>
      </article>
    `;

  const nextCard = nextSelection
    ? buildOverviewCard({
        label: state.config.ui.cards.next,
        event: nextSelection.event,
        timeText: `${formatDayLabel(nextSelection.event.dayId)} • ${formatTimeRange(nextSelection.event)}`,
        copyText: getVenue(nextSelection.event.venueId)?.label ?? ""
      })
    : `
      <article class="overview-card">
        <p class="card-label">${escapeHtml(state.config.ui.cards.next)}</p>
        <h3 class="card-title">${escapeHtml(getEmptyState("nextDoneTitle"))}</h3>
        <p class="card-copy">${escapeHtml(getEmptyState("nextDoneCopy"))}</p>
      </article>
    `;

  refs.overviewMeta.innerHTML = `
    <span class="summary-pill">${escapeHtml(formatSummary("selectedForDay", { count: selectedEvents.length }))}</span>
    <span class="summary-pill">${escapeHtml(formatSummary("selectedTotal", { count: state.selectedEventIds.size }))}</span>
    <span class="summary-pill ${conflictIds.size ? "is-warning" : ""}">${escapeHtml(conflictIds.size ? formatSummary("conflicts", { count: conflictIds.size }) : getSummary("noConflicts"))}</span>
    <span class="summary-pill is-muted">${escapeHtml(state.planSource)}</span>
  `;

  renderTypeFilters();
  refs.overviewCards.innerHTML = `${currentCard}${nextCard}`;
}

function renderTypeFilters() {
  const filterButtons = state.config.schedule.types
    .map((type) => `
      <button
        class="chip type-filter-button ${state.activeTypeFilterIds.has(type.id) ? "is-active" : ""}"
        type="button"
        data-type-filter-id="${type.id}"
      >
        ${escapeHtml(type.label)}
      </button>
    `)
    .join("");

  const resetButton = state.activeTypeFilterIds.size
    ? `
      <button class="chip type-filter-button is-danger" type="button" data-clear-type-filter>
        × ${escapeHtml(state.config.ui.labels.clearTypeFilter)}
      </button>
    `
    : "";

  refs.typeFilters.innerHTML = `${filterButtons}${resetButton}`;
}

function getEventTitleParts(event) {
  if (typeof event?.subtitle === "string" && event.subtitle.trim()) {
    return {
      title: typeof event.title === "string" ? event.title.trim() : "",
      subtitle: event.subtitle.trim()
    };
  }

  if (typeof event?.title !== "string") {
    return { title: "", subtitle: "" };
  }

  const parts = event.title.split(" — ").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      title: parts[0],
      subtitle: parts.slice(1).join(" — ")
    };
  }

  return {
    title: event.title.trim(),
    subtitle: ""
  };
}

function getScheduleCardFlags(event) {
  const durationMinutes = event.durationMinutes ?? 0;
  return {
    isTiny: durationMinutes <= 15,
    isShort: durationMinutes <= 30,
    isCompact: durationMinutes <= 45
  };
}

function buildScheduleMeta(type, { selected, isNext, isConflict, isCompact }) {
  if (isCompact) {
    return "";
  }

  let statusBadge = "";
  if (isConflict) {
    statusBadge = `<span class="chip is-warning">${escapeHtml(getBadge("conflict"))}</span>`;
  } else if (isNext) {
    statusBadge = `<span class="chip">${escapeHtml(getBadge("next"))}</span>`;
  } else if (selected) {
    statusBadge = `<span class="chip is-highlight">${escapeHtml(getBadge("selected"))}</span>`;
  }

  return `
    <div class="event-meta">
      <span class="type-pill">${escapeHtml(type.label)}</span>
      ${statusBadge}
    </div>
  `;
}

function buildOverviewCard({ label, event, timeText, copyText }) {
  const { title, subtitle } = getEventTitleParts(event);
  return `
    <article
      class="overview-card is-interactive"
      data-open-event-id="${event.id}"
      tabindex="0"
      role="button"
      aria-label="${escapeHtml(getAria("openEventDetail", { title: event.title }))}"
    >
      <p class="card-label">${escapeHtml(label)}</p>
      <h3 class="card-title">${escapeHtml(title)}</h3>
      ${subtitle ? `<p class="card-subtitle">${escapeHtml(subtitle)}</p>` : ""}
      <p class="card-time">${escapeHtml(timeText)}</p>
      <p class="card-copy">${escapeHtml(copyText)}</p>
    </article>
  `;
}

function buildCurrentVenueSummary(event, currentCount) {
  const venueLabel = getVenue(event.venueId)?.label ?? "";
  if (currentCount <= 1) {
    return venueLabel;
  }

  return `${venueLabel} (+${currentCount - 1})`;
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

function renderEventBrowser() {
  const hasMultipleEvents = state.catalog.events.length > 1;
  refs.eventBrowserButton.hidden = !hasMultipleEvents;
  refs.eventBrowserButton.setAttribute("aria-expanded", String(state.eventBrowserOpen));
  refs.eventBrowserBackdrop.hidden = !state.eventBrowserOpen;
  refs.eventBrowserPanel.hidden = !state.eventBrowserOpen;
  refs.eventBrowserButton.textContent = state.config.ui.labels.eventBrowserButton;

  if (!hasMultipleEvents) {
    refs.eventBrowserContent.innerHTML = "";
    syncModalBodyState();
    return;
  }

  const todayKey = getPragueTodayDateKey();
  refs.eventBrowserContent.innerHTML = state.catalog.events
    .map((eventEntry) => {
      const isActive = eventEntry.slug === state.currentEventSlug;
      const statusBadge = buildCatalogEventBadge(eventEntry, todayKey);
      return `
        <button
          class="event-browser-item ${isActive ? "is-active" : ""}"
          type="button"
          data-open-event-slug="${escapeHtml(eventEntry.slug)}"
        >
          <div class="event-browser-title-row">
            <div>
              <h3 class="event-browser-title">${escapeHtml(eventEntry.label)}</h3>
              <p class="event-browser-meta">${escapeHtml(formatCatalogEventDateRange(eventEntry))}</p>
            </div>
            ${statusBadge}
          </div>
          ${eventEntry.summary ? `<p class="event-browser-copy">${escapeHtml(eventEntry.summary)}</p>` : ""}
        </button>
      `;
    })
    .join("");

  syncModalBodyState();
}

function renderItinerary() {
  const selectedEvents = getSelectedEvents(state.activeDayId);
  const dayTimeline = getDayTimelineState(state.activeDayId, state.now);
  const conflictIds = getConflictIds(selectedEvents);

  if (!selectedEvents.length) {
    refs.itineraryContent.innerHTML = `
      <div class="empty-state">
        <h3 class="itinerary-title">${escapeHtml(getEmptyState("itineraryEmptyTitle"))}</h3>
        <p class="itinerary-subcopy">${escapeHtml(getEmptyState("itineraryEmptyCopy"))}</p>
      </div>
    `;
    return;
  }

  refs.itineraryContent.innerHTML = `
    <div class="itinerary-list">
      ${selectedEvents
        .map((event) => {
          const { title, subtitle } = getEventTitleParts(event);
          const badges = [];

          if (dayTimeline.currentEvents.some((currentEvent) => currentEvent.id === event.id)) {
            badges.push(`<span class="chip is-highlight">${escapeHtml(getBadge("current"))}</span>`);
          }

          if (dayTimeline.nextEvent?.id === event.id) {
            badges.push(`<span class="chip">${escapeHtml(getBadge("next"))}</span>`);
          }

          if (conflictIds.has(event.id)) {
            badges.push(`<span class="chip is-warning">${escapeHtml(getBadge("conflict"))}</span>`);
          }

          return `
            <article
              class="itinerary-card"
              data-open-event-id="${event.id}"
              tabindex="0"
              role="button"
              aria-label="${escapeHtml(getAria("openEventDetail", { title: event.title }))}"
            >
              <div class="itinerary-title-row">
                <div>
                  <h3 class="itinerary-title">${escapeHtml(title)}</h3>
                  ${subtitle ? `<p class="itinerary-subtitle">${escapeHtml(subtitle)}</p>` : ""}
                  <p class="itinerary-subcopy">
                    ${escapeHtml(formatTimeRange(event))} • ${escapeHtml(getVenue(event.venueId)?.label ?? "")}
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
  const dayEvents = getVisibleEventsForDay(state.activeDayId);
  const visibleVenues = getVisibleVenuesForDay(state.activeDayId);
  const scheduleWindow = getDayScheduleWindow(state.activeDayId);

  if (!dayEvents.length || !visibleVenues.length || !scheduleWindow) {
    refs.scheduleContent.innerHTML = `
      <div class="empty-state">
        <h3 class="itinerary-title">Pro tenhle filtr tu nic není</h3>
        <p class="itinerary-subcopy">Zkus jinou kategorii nebo reset filtru.</p>
      </div>
    `;
    return;
  }

  const currentMinutes = state.now.hour * 60 + state.now.minute;
  const shouldShowCurrentLine = dayTimeline.isToday && isMinuteWithinSchedule(currentMinutes, scheduleWindow);
  const currentLineMarkup = shouldShowCurrentLine
    ? `
      <div
        class="schedule-current-line"
        style="grid-column: 2 / ${visibleVenues.length + 2}; grid-row: 2; margin-top: ${getTimelineOffset(currentMinutes, scheduleWindow.startMinutes)}px;"
      >
        <span class="schedule-current-line-label">${escapeHtml(state.now.timeString)}</span>
      </div>
    `
    : "";

  refs.scheduleContent.innerHTML = `
    <div class="schedule-mobile-venue-indicator" aria-hidden="true">
      <span class="schedule-mobile-venue-label">${escapeHtml(visibleVenues[0]?.label ?? "")}</span>
    </div>
    <div class="schedule-board-scroll">
      <div class="schedule-board" style="--timeline-height: ${getTimelineRangeHeight(scheduleWindow)}px; --venue-count: ${visibleVenues.length};">
        <div class="schedule-axis-head" style="grid-column: 1; grid-row: 1;">
          <h3 class="venue-heading">${escapeHtml(state.config.ui.labels.scheduleTime)}</h3>
          <p class="venue-note">${escapeHtml(formatScheduleWindowNote(scheduleWindow))}</p>
        </div>

        ${visibleVenues
          .map((venue, index) => {
            const venueEvents = dayEvents.filter((event) => event.venueId === venue.id);

            return `
              <header class="schedule-venue-head" id="venue-${venue.id}" style="grid-column: ${index + 2}; grid-row: 1;">
                <h3 class="venue-heading">${escapeHtml(venue.label)}</h3>
                <p class="venue-note">${escapeHtml(formatMessage(state.config.ui.labels.scheduleVenueCount ?? "{count}", { count: venueEvents.length }))}</p>
              </header>
            `;
          })
          .join("")}

        <div class="schedule-axis-track" style="grid-column: 1; grid-row: 2;">
          ${buildScheduleTimeMarkers(scheduleWindow)}
        </div>

        ${currentLineMarkup}

        ${visibleVenues
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
                    const { title, subtitle } = getEventTitleParts(event);
                    const { isTiny, isShort, isCompact } = getScheduleCardFlags(event);
                    const selected = selectedEvents.has(event.id);
                    const type = getType(event.type) ?? state.config.schedule.types[0];
                    const isCurrent = dayTimeline.currentEvents.some((currentEvent) => currentEvent.id === event.id);
                    const isNext = dayTimeline.nextEvent?.id === event.id;
                    const isConflict = conflictIds.has(event.id);

                    return `
                      <article
                        class="event-card ${selected ? "is-selected" : ""} ${isConflict ? "is-conflict" : ""} ${isCurrent ? "is-current" : ""} ${isCompact ? "is-compact" : ""} ${isShort ? "is-short" : ""} ${isTiny ? "is-tiny" : ""}"
                        data-open-event-id="${event.id}"
                        tabindex="0"
                        role="button"
                        aria-label="${escapeHtml(getAria("openEventDetail", { title: event.title }))}"
                        style="--event-color: var(${escapeHtml(type.colorVar)}); top: ${getTimelineOffset(event.startMinutes, scheduleWindow.startMinutes)}px; height: ${getTimelineHeight(event.durationMinutes)}px;"
                      >
                        <button
                          class="event-toggle ${selected ? "is-active" : ""}"
                          type="button"
                          data-event-id="${event.id}"
                          aria-pressed="${String(selected)}"
                          aria-label="${escapeHtml(selected ? getAria("removeFromPlan", { title: event.title }) : getAria("addToPlan", { title: event.title }))}"
                          title="${escapeHtml(selected ? getAria("removeFromPlan", { title: event.title }) : getAria("addToPlan", { title: event.title }))}"
                        >
                          ${selected ? "✓" : "+"}
                        </button>

                        <div class="event-header">
                          <h4 class="${isTiny ? "event-title is-inline" : "event-title"}">${escapeHtml(title)}</h4>
                          <span class="event-time">${escapeHtml(formatTimeRange(event))}</span>
                        </div>

                        <div class="${isTiny ? "event-body is-hidden" : "event-body"}">
                          ${subtitle && !isShort ? `<p class="event-subtitle">${escapeHtml(subtitle)}</p>` : ""}
                        </div>

                        ${buildScheduleMeta(type, { selected, isNext, isConflict, isCompact })}
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

  setupScheduleMobileVenueIndicator();
}

function setupScheduleMobileVenueIndicator() {
  if (scheduleScrollTeardown) {
    scheduleScrollTeardown();
    scheduleScrollTeardown = null;
  }

  const scrollEl = refs.scheduleContent.querySelector(".schedule-board-scroll");
  const labelEl = refs.scheduleContent.querySelector(".schedule-mobile-venue-label");
  const axisHeadEl = refs.scheduleContent.querySelector(".schedule-axis-head");
  const venueTrackEls = Array.from(refs.scheduleContent.querySelectorAll(".schedule-venue-track"));

  if (!scrollEl || !labelEl || !axisHeadEl || !venueTrackEls.length) {
    return;
  }

  const syncLabel = () => {
    const scrollRect = scrollEl.getBoundingClientRect();
    const axisRect = axisHeadEl.getBoundingClientRect();
    const targetLeft = scrollRect.left + axisRect.width + 8;

    let activeLabel = venueTrackEls[0].getAttribute("aria-labelledby") ?? "";
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const venueTrackEl of venueTrackEls) {
      const labelledBy = venueTrackEl.getAttribute("aria-labelledby") ?? "";
      const heading = labelledBy ? document.getElementById(labelledBy)?.querySelector(".venue-heading")?.textContent ?? "" : "";
      const distance = Math.abs(venueTrackEl.getBoundingClientRect().left - targetLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        activeLabel = heading;
      }
    }

    labelEl.textContent = activeLabel;
  };

  scrollEl.addEventListener("scroll", syncLabel, { passive: true });
  window.addEventListener("resize", syncLabel);
  syncLabel();

  scheduleScrollTeardown = () => {
    scrollEl.removeEventListener("scroll", syncLabel);
    window.removeEventListener("resize", syncLabel);
  };
}

function renderEventDetail() {
  const activeEvent = state.activeEventId ? getEvent(state.activeEventId) : null;
  if (!activeEvent) {
    refs.eventDetailBackdrop.hidden = true;
    refs.eventDetailPanel.hidden = true;
    refs.eventDetailContent.innerHTML = "";
    syncModalBodyState();
    return;
  }

  const selected = state.selectedEventIds.has(activeEvent.id);
  const type = getType(activeEvent.type) ?? state.config.schedule.types[0];
  const selectedForDay = getSelectedEvents(activeEvent.dayId);
  const conflictIds = getConflictIds(selectedForDay);
  const dayTimeline = getDayTimelineState(activeEvent.dayId, state.now);
  const globalNextEventId = getGlobalNextSelectedEvent(state.now)?.event.id ?? null;
  const chips = [];
  const { title, subtitle } = getEventTitleParts(activeEvent);

  if (selected) {
    chips.push(`<span class="chip is-highlight">${escapeHtml(getBadge("selected"))}</span>`);
  }

  if (dayTimeline.currentEvents.some((event) => event.id === activeEvent.id)) {
    chips.push(`<span class="chip is-highlight">${escapeHtml(getBadge("current"))}</span>`);
  } else if (dayTimeline.nextEvent?.id === activeEvent.id || globalNextEventId === activeEvent.id) {
    chips.push(`<span class="chip">${escapeHtml(getBadge("nextInPlan"))}</span>`);
  }

  if (conflictIds.has(activeEvent.id)) {
    chips.push(`<span class="chip is-warning">${escapeHtml(getBadge("conflict"))}</span>`);
  }

  refs.eventDetailContent.innerHTML = `
    <div class="event-detail-card" style="--event-color: var(${escapeHtml(type.colorVar)})">
      <button class="event-detail-close" type="button" data-close-event-detail aria-label="${escapeHtml(getAria("closeEventDetail"))}">
        ×
      </button>
      <p class="section-kicker">${escapeHtml(state.config.ui.labels.eventDetail)}</p>
      <h3 id="event-detail-title" class="event-detail-title">${escapeHtml(title)}</h3>
      ${subtitle ? `<p class="event-detail-subtitle">${escapeHtml(subtitle)}</p>` : ""}
      <p class="event-detail-meta">
        ${escapeHtml(formatDayLabel(activeEvent.dayId))} • ${escapeHtml(formatTimeRange(activeEvent))} • ${escapeHtml(getVenue(activeEvent.venueId)?.label ?? "")}
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
          ${escapeHtml(selected ? getAria("removeFromPlan", { title: activeEvent.title }) : getAria("addToPlan", { title: activeEvent.title }))}
        </button>
        <button class="ghost-button" type="button" data-close-event-detail>${escapeHtml(state.config.ui.labels.close)}</button>
      </div>
    </div>
  `;

  refs.eventDetailBackdrop.hidden = false;
  refs.eventDetailPanel.hidden = false;
  syncModalBodyState();
}

function buildScheduleTimeMarkers(scheduleWindow) {
  const markers = [];
  const firstMarker = Math.floor(scheduleWindow.startMinutes / 30) * 30;

  for (let minutes = firstMarker; minutes <= scheduleWindow.endMinutes; minutes += 30) {
    const position = getTimelineOffset(minutes, scheduleWindow.startMinutes);
    const markerClass =
      minutes === firstMarker
        ? "schedule-time-marker is-start"
        : minutes + 30 > scheduleWindow.endMinutes
          ? "schedule-time-marker is-end"
          : "schedule-time-marker";

    markers.push(`
      <div class="${markerClass}" style="top: ${position}px;">
        <span>${escapeHtml(formatMinuteLabel(minutes))}</span>
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
  if (!getDay(dayId)) {
    return;
  }

  state.activeDayId = dayId;
  render();
}

function handleTypeFilterClick(event) {
  const clearButton = event.target.closest("[data-clear-type-filter]");
  if (clearButton) {
    state.activeTypeFilterIds = new Set();
    render();
    return;
  }

  const filterButton = event.target.closest("[data-type-filter-id]");
  if (!filterButton) {
    return;
  }

  const { typeFilterId } = filterButton.dataset;
  const nextFilters = new Set(state.activeTypeFilterIds);
  if (nextFilters.has(typeFilterId)) {
    nextFilters.delete(typeFilterId);
  } else {
    nextFilters.add(typeFilterId);
  }
  state.activeTypeFilterIds = nextFilters;
  render();
}

function handleEventBrowserToggle() {
  state.eventBrowserOpen = !state.eventBrowserOpen;
  if (state.eventBrowserOpen) {
    state.planActionsOpen = false;
    state.activeEventId = null;
  }
  render();
}

function handleEventBrowserPanelClick(event) {
  const closeButton = event.target.closest("[data-close-event-browser]");
  if (closeButton) {
    closeEventBrowser();
    return;
  }

  const eventButton = event.target.closest("[data-open-event-slug]");
  if (!eventButton) {
    return;
  }

  openCatalogEvent(eventButton.dataset.openEventSlug);
}

function openCatalogEvent(selectedSlug) {
  if (!state.catalog.events.some((eventEntry) => eventEntry.slug === selectedSlug)) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(EVENT_QUERY_PARAM, selectedSlug);
  window.location.assign(url.toString());
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
    if (state.eventBrowserOpen) {
      closeEventBrowser();
      return;
    }

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
  }
}

function handlePlanActionsToggle() {
  state.planActionsOpen = !state.planActionsOpen;
  if (state.planActionsOpen) {
    state.activeEventId = null;
    state.eventBrowserOpen = false;
  }
  render();
}

function handleRestoreDefaults() {
  state.selectedEventIds = new Set(state.config.defaultSelectedIds);
  state.planSource = getStatus("defaultPlan");
  state.planActionsOpen = false;
  persistCurrentPlan();
  showNotice(getMessage("defaultsRestored"), "info");
  render();
}

function handleClearSelection() {
  state.selectedEventIds = new Set();
  state.planSource = getStatus("manualSelection");
  state.planActionsOpen = false;
  persistCurrentPlan();
  showNotice(getMessage("selectionCleared"), "info");
  render();
}

function handleImport() {
  const rawValue = refs.importInput.value.trim();
  if (!rawValue) {
    showNotice(getMessage("importEmpty"), "warning");
    return;
  }

  const extractedCode = extractPlanCode(rawValue);
  if (!extractedCode) {
    showNotice(getMessage("importInvalid"), "warning");
    return;
  }

  const decoded = decodePlan(extractedCode);
  if (!decoded.ok) {
    showNotice(decoded.error, "danger");
    return;
  }

  state.selectedEventIds = decoded.selectedEventIds;
  state.planSource = getStatus("manualImport");
  state.planActionsOpen = false;
  refs.importInput.value = "";
  persistCurrentPlan();
  showNotice(getMessage("importSuccess"), "info");
  render();
}

function handleCopy(input, successMessage) {
  copyText(input.value)
    .then(() => showNotice(successMessage, "info"))
    .catch(() => showNotice(getMessage("copyFailed"), "warning"));
}

function toggleEventSelection(eventId) {
  if (!getEvent(eventId)) {
    return;
  }

  const nextSelection = new Set(state.selectedEventIds);
  if (nextSelection.has(eventId)) {
    nextSelection.delete(eventId);
  } else {
    nextSelection.add(eventId);
  }

  state.selectedEventIds = nextSelection;
  state.planSource = getStatus("manualSelection");
  persistCurrentPlan();
  render();
}

function openEventDetail(eventId) {
  if (!getEvent(eventId)) {
    return;
  }

  state.planActionsOpen = false;
  state.eventBrowserOpen = false;
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

function closeEventBrowser() {
  if (!state.eventBrowserOpen) {
    return;
  }

  state.eventBrowserOpen = false;
  render();
}

function syncModalBodyState() {
  document.body.classList.toggle("has-modal", Boolean(state.activeEventId || state.planActionsOpen || state.eventBrowserOpen));
}

function persistCurrentPlan() {
  const saveResult = savePlanToCookie(encodePlan(state.selectedEventIds));
  if (!saveResult.ok) {
    showNotice(getMessage("cookieUnavailable"), "warning");
  }
}

function chooseInitialDayId() {
  const nextSelection = getGlobalNextSelectedEvent(state.now);
  if (nextSelection) {
    return nextSelection.event.dayId;
  }

  return getCurrentFestivalDayId(state.now) ?? state.config.schedule.days[0]?.id ?? "";
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
  const cookieValue = getCookie(getCookieKey());
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
    document.cookie = `${getCookieKey()}=${encodeURIComponent(planCode)}; Max-Age=${MAX_COOKIE_AGE_SECONDS}; Path=/; SameSite=Lax`;
    const persistedValue = getCookie(getCookieKey());
    if (persistedValue !== planCode) {
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function encodePlan(selectedEventIds) {
  const byteLength = Math.floor(state.config.maxPlanIndex / 8) + 1;
  const bytes = new Uint8Array(byteLength);

  for (const eventId of selectedEventIds) {
    const event = getEvent(eventId);
    if (!event) {
      continue;
    }

    const byteIndex = Math.floor(event.planIndex / 8);
    const bitOffset = event.planIndex % 8;
    bytes[byteIndex] |= 1 << bitOffset;
  }

  const payload = bytesToBase64Url(bytes);
  return `v${state.config.app.planSchemaVersion}.${payload}`;
}

function decodePlan(planCode) {
  const trimmed = planCode.trim();
  const [versionPart, payload] = trimmed.split(".");
  if (!versionPart || !payload || !/^v\d+$/.test(versionPart)) {
    return { ok: false, error: getMessage("invalidCodeFormat") };
  }

  const version = Number.parseInt(versionPart.slice(1), 10);
  if (version !== state.config.app.planSchemaVersion) {
    return {
      ok: false,
      error: formatMessage(getMessage("versionMismatch"), {
        version,
        supportedVersion: state.config.app.planSchemaVersion
      })
    };
  }

  let bytes;
  try {
    bytes = base64UrlToBytes(payload);
  } catch (error) {
    return { ok: false, error: getMessage("invalidCodeDecode") };
  }

  const selectedEventIds = new Set();
  for (let planIndex = 0; planIndex <= state.config.maxPlanIndex; planIndex += 1) {
    const byteIndex = Math.floor(planIndex / 8);
    const bitOffset = planIndex % 8;
    const byte = bytes[byteIndex] ?? 0;

    if ((byte & (1 << bitOffset)) === 0) {
      continue;
    }

    const event = state.config.maps.eventByPlanIndex.get(planIndex);
    if (event) {
      selectedEventIds.add(event.id);
    }
  }

  return { ok: true, selectedEventIds };
}

function getEventsForDay(dayId) {
  return state.config.schedule.events
    .filter((event) => event.dayId === dayId)
    .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
}

function getVisibleEventsForDay(dayId) {
  const dayEvents = getEventsForDay(dayId);
  if (!state.activeTypeFilterIds.size) {
    return dayEvents;
  }

  return dayEvents.filter((event) => state.activeTypeFilterIds.has(event.type));
}

function getVisibleVenuesForDay(dayId) {
  const usedVenueIds = new Set(getVisibleEventsForDay(dayId).map((event) => event.venueId));
  return state.config.schedule.venues.filter((venue) => usedVenueIds.has(venue.id));
}

function getDayScheduleWindow(dayId) {
  const dayEvents = getVisibleEventsForDay(dayId);
  if (!dayEvents.length) {
    return null;
  }

  const firstStart = Math.min(...dayEvents.map((event) => event.startMinutes));
  const lastEnd = Math.max(...dayEvents.map((event) => event.endMinutes));

  return {
    startMinutes: firstStart,
    endMinutes: lastEnd
  };
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
      nextEvent: null
    };
  }

  const selectedEvents = getSelectedEvents(dayId);
  const currentMinute = now.hour * 60 + now.minute;
  const currentEvents = selectedEvents.filter(
    (event) => event.startMinutes <= currentMinute && currentMinute < event.endMinutes
  );
  const nextEvent = selectedEvents.find((event) => event.startMinutes > currentMinute) ?? null;

  return {
    isToday: true,
    currentEvents,
    nextEvent
  };
}

function getGlobalNextSelectedEvent(now = state.now) {
  const nowSortKey = getDateOrdinal(now) * 1440 + now.hour * 60 + now.minute;

  const nextEvent = [...state.selectedEventIds]
    .map((eventId) => getEvent(eventId))
    .filter(Boolean)
    .filter((event) => getEventStartSortKey(event) > nowSortKey)
    .sort((leftEvent, rightEvent) => getEventStartSortKey(leftEvent) - getEventStartSortKey(rightEvent))[0] ?? null;

  if (!nextEvent) {
    return null;
  }

  return { event: nextEvent };
}

function getConflictIds(selectedEvents) {
  const sortedEvents = [...selectedEvents].sort((a, b) => a.startMinutes - b.startMinutes);
  const conflictIds = new Set();

  for (let outerIndex = 0; outerIndex < sortedEvents.length; outerIndex += 1) {
    const outerEvent = sortedEvents[outerIndex];

    for (let innerIndex = outerIndex + 1; innerIndex < sortedEvents.length; innerIndex += 1) {
      const innerEvent = sortedEvents[innerIndex];

      if (innerEvent.startMinutes >= outerEvent.endMinutes) {
        break;
      }

      if (innerEvent.endMinutes > outerEvent.startMinutes) {
        conflictIds.add(outerEvent.id);
        conflictIds.add(innerEvent.id);
      }
    }
  }

  return conflictIds;
}

function buildShareLink(planCode) {
  const shareUrl = new URL(window.location.href);
  if (state.currentEventSlug !== state.catalog.defaultEventSlug) {
    shareUrl.searchParams.set(EVENT_QUERY_PARAM, state.currentEventSlug);
  } else {
    shareUrl.searchParams.delete(EVENT_QUERY_PARAM);
  }
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

function renderFatalError(message) {
  refs.notice.textContent = message;
  refs.notice.className = "notice is-danger";
  refs.overviewCards.innerHTML = "";
  refs.itineraryContent.innerHTML = "";
  refs.scheduleContent.innerHTML = "";
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

function getPragueTodayDateKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

function getAppNow() {
  const parts = Object.fromEntries(
    state.config.nowFormatter
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
    isoWeekday: ISO_WEEKDAY_BY_SHORT_NAME[parts.weekday],
    dateKey: toDateKey({ year, month, day }),
    timeString: `${padNumber(hour)}:${padNumber(minute)}`
  };
}

function formatCatalogEventDateRange(eventEntry) {
  const start = parseDateKey(eventEntry.startsOn);
  const end = parseDateKey(eventEntry.endsOn);
  return `${padNumber(start.day)}.${padNumber(start.month)}. - ${padNumber(end.day)}.${padNumber(end.month)}.`;
}

function buildCatalogEventBadge(eventEntry, todayKey) {
  if (eventEntry.startsOn <= todayKey && todayKey <= eventEntry.endsOn) {
    return `<span class="chip is-highlight">${escapeHtml(getMessage("currentEventBadge"))}</span>`;
  }

  if (eventEntry.startsOn > todayKey) {
    return `<span class="chip">${escapeHtml(getMessage("upcomingEventBadge"))}</span>`;
  }

  return "";
}

function getCurrentFestivalDayId(now = state.now) {
  return state.config.dayOrder.find((dayId) => getDay(dayId)?.dateKey === now.dateKey) ?? null;
}

function getEventStartSortKey(event) {
  const day = getDay(event.dayId);
  return day.ordinal * 1440 + event.startMinutes;
}

function formatDayLabel(dayId) {
  const day = getDay(dayId);
  if (!day) {
    return dayId;
  }

  const { day: dayOfMonth, month } = day.dateParts;
  return `${day.label} ${padNumber(dayOfMonth)}.${padNumber(month)}.`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  return { year, month, day };
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

function getTimelineOffset(minutes, startMinutes = state.config.scheduleStartMinutes) {
  return TIMELINE_EDGE_PADDING + Math.max(0, minutes - startMinutes) * TIMELINE_MINUTE_HEIGHT;
}

function getTimelineHeight(durationMinutes) {
  return Math.max(durationMinutes, 15) * TIMELINE_MINUTE_HEIGHT;
}

function getTimelineRangeHeight(scheduleWindow) {
  return Math.max(scheduleWindow.endMinutes - scheduleWindow.startMinutes, 30) * TIMELINE_MINUTE_HEIGHT + TIMELINE_EDGE_PADDING * 2;
}

function isMinuteWithinSchedule(minutes, scheduleWindow) {
  return minutes >= scheduleWindow.startMinutes && minutes <= scheduleWindow.endMinutes;
}

function formatScheduleWindowNote(scheduleWindow) {
  return `${formatMinuteLabel(scheduleWindow.startMinutes)} - ${formatMinuteLabel(scheduleWindow.endMinutes)}`;
}

function parseTime(timeString) {
  if (!/^\d{2}:\d{2}$/.test(timeString)) {
    throw new Error(`Invalid time string: ${timeString}`);
  }

  const [hours = "0", minutes = "0"] = timeString.split(":");
  const hoursNumber = Number.parseInt(hours, 10);
  const minutesNumber = Number.parseInt(minutes, 10);

  if (hoursNumber === 24 && minutesNumber === 0) {
    return 24 * 60;
  }

  if (hoursNumber < 0 || hoursNumber > 23 || minutesNumber < 0 || minutesNumber > 59) {
    throw new Error(`Invalid time string: ${timeString}`);
  }

  return hoursNumber * 60 + minutesNumber;
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

function formatMessage(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function getStatus(key) {
  return state.config.ui.statuses[key] ?? DEFAULT_UI.statuses[key] ?? key;
}

function getMessage(key) {
  return state.config.ui.messages[key] ?? DEFAULT_UI.messages[key] ?? key;
}

function getBadge(key) {
  return state.config.ui.badges[key] ?? DEFAULT_UI.badges[key] ?? key;
}

function getSummary(key) {
  return state.config.ui.summaries[key] ?? DEFAULT_UI.summaries[key] ?? key;
}

function formatSummary(key, values) {
  return formatMessage(getSummary(key), values);
}

function getEmptyState(key) {
  return state.config.ui.emptyStates[key] ?? DEFAULT_UI.emptyStates[key] ?? key;
}

function getAria(key, values) {
  return formatMessage(state.config.ui.aria[key] ?? DEFAULT_UI.aria[key] ?? key, values);
}

function getCookieKey() {
  return state.config.app.cookieKey ?? `${state.config.app.id}_plan`;
}

function getDay(dayId) {
  return state.config.maps.dayMap.get(dayId);
}

function getVenue(venueId) {
  return state.config.maps.venueMap.get(venueId);
}

function getType(typeId) {
  return state.config.maps.typeMap.get(typeId);
}

function getEvent(eventId) {
  return state.config.maps.eventMap.get(eventId);
}
