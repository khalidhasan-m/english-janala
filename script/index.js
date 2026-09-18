// api base url
const API_BASE = "https://openapi.programming-hero.com/api";

// localStorage key of the saved words box
const SAVED_WORDS_KEY = "english-janala-saved-words";

// the initial "select a lesson" markup, restored when nothing is selected
let defaultWordStateHtml = "";

// all words are fetched once and reused while searching
let allWordsCache = null;

// every new content request invalidates the requests that came before it
let contentRequestToken = 0;

// ---------------- small helpers ----------------

const getElement = (id) => document.getElementById(id);

const showElement = (element) => {
  if (element) element.classList.remove("hidden");
};

const hideElement = (element) => {
  if (element) element.classList.add("hidden");
};

// stops falsy api values like undefined / null from reaching the ui
const safeText = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

// api data is injected inside html, so it has to be escaped first
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const debounce = (callback, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
};

// one place to talk with the api, with a real error for failed requests
const fetchData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const json = await response.json();
  return json?.data ?? null;
};

// ---------------- speech ----------------

//speech added here
function pronounceWord(word) {
  const text = safeText(word, "");
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // stop the word that is being spoken
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-EN"; // English
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

const createElements = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const htmlElements = arr.map(
    (el) => `<span class="btn">${escapeHtml(el)}</span>`,
  );
  return htmlElements.join(" ");
};

const manageSpinner = (status) => {
  const spinner = getElement("spinner");
  const wordContainer = getElement("word-container");
  if (status === true) {
    showElement(spinner);
    hideElement(wordContainer);
  } else {
    hideElement(spinner);
    showElement(wordContainer);
  }
};

// ---------------- empty states (no data found) ----------------

const emptyStateHtml = (message, title) => `
  <div class="text-center col-span-full rounded-xl py-10 space-y-6 font-bangla">
    <img class="mx-auto" src="./assets/alert-error.png" alt="" />
    <p class="text-gray-400">${message}</p>
    <h2 class="font-medium text-4xl">${title}</h2>
  </div>
`;

const emptyLessonHtml = () =>
  emptyStateHtml(
    "এই Lesson এ এখনো কোন Vocabulary যুক্ত করা হয়নি।",
    "নেক্সট Lesson এ যান",
  );

const emptySearchHtml = (query) =>
  emptyStateHtml(
    `"${escapeHtml(safeText(query, ""))}" এর সাথে মিলে এমন কোন Vocabulary পাওয়া যায়নি।`,
    "অন্য শব্দ দিয়ে খুঁজে দেখুন",
  );

const emptyWordsLoadErrorHtml = () =>
  emptyStateHtml(
    "Vocabulary গুলো লোড করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।",
    "আবার চেষ্টা করুন",
  );

const emptyLessonsLoadErrorHtml = `
  <p class="font-bangla text-gray-400">
    Lesson গুলো লোড করা যায়নি। ইন্টারনেট সংযোগ চেক করে পেজটি রিফ্রেশ করুন।
  </p>
`;

// ---------------- saved words box (localStorage) ----------------

const getSavedWords = () => {
  try {
    const stored = localStorage.getItem(SAVED_WORDS_KEY);
    const savedWords = stored ? JSON.parse(stored) : [];
    return Array.isArray(savedWords) ? savedWords : [];
  } catch (error) {
    console.warn("Saved words could not be read.", error);
    return [];
  }
};

const persistSavedWords = (savedWords) => {
  try {
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(savedWords));
  } catch (error) {
    console.warn("Saved words could not be stored in this browser.", error);
  }
};

const isWordSaved = (id) =>
  getSavedWords().some((word) => String(word.id) === String(id));

const toggleSavedWord = (word) => {
  const savedWords = getSavedWords();
  const alreadySaved = savedWords.some(
    (item) => String(item.id) === String(word.id),
  );

  const nextSavedWords = alreadySaved
    ? savedWords.filter((item) => String(item.id) !== String(word.id))
    : [
        ...savedWords,
        {
          id: word.id,
          word: word.word ?? null,
          meaning: word.meaning ?? null,
          pronunciation: word.pronunciation ?? null,
          level: word.level ?? null,
        },
      ];

  persistSavedWords(nextSavedWords);
  displaySavedWords(); // keep the saved box in sync
  return !alreadySaved;
};

const clearSavedWords = () => {
  persistSavedWords([]);
  displaySavedWords();
  syncSaveButtons();
};

const displaySavedWords = () => {
  const section = getElement("saved-section");
  const container = getElement("saved-container");
  const count = getElement("saved-count");
  if (!section || !container) return;

  const savedWords = getSavedWords();
  container.innerHTML = "";
  if (count) count.textContent = `(${savedWords.length})`;

  if (savedWords.length === 0) {
    hideElement(section);
    return;
  }

  savedWords.forEach((word) => container.append(createWordCard(word)));
  showElement(section);
};

const syncSaveButton = (button) => {
  if (!button) return;
  const saved = isWordSaved(button.dataset.wordId);
  button.classList.toggle("is-saved", saved);
  button.title = saved ? "Remove from saved words" : "Save word";
  button.setAttribute("aria-pressed", saved ? "true" : "false");
  button.innerHTML = `<i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
};

const syncSaveButtons = () => {
  document.querySelectorAll(".save-btn[data-word-id]").forEach(syncSaveButton);
};

// ---------------- vocabulary card ----------------

const createWordCard = (word) => {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow-sm text-center py-10 px-5 space-y-4 flex flex-col justify-between";
  card.innerHTML = `
    <div class="space-y-4">
      <h2 class="font-bold text-2xl">${escapeHtml(
        safeText(word?.word, "শব্দ পাওয়া যায়নি"),
      )}</h2>
      <p class="font-semibold">Meaning /Pronounciation</p>
      <div class="text-2xl font-medium font-bangla">"${escapeHtml(
        safeText(word?.meaning, "অর্থ পাওয়া যায়নি"),
      )} / ${escapeHtml(safeText(word?.pronunciation, "উচ্চারণ পাওয়া যায়নি"))}"</div>
    </div>
    <div class="flex justify-center items-center gap-4">
      <button type="button" class="details-btn btn bg-[#1a91ff10] hover:bg-[#1a91ff80]" title="Word details" aria-label="Word details">
        <i class="fa-solid fa-circle-info"></i>
      </button>
      <button type="button" class="pronounce-btn btn bg-[#1a91ff10] hover:bg-[#1a91ff80]" title="Listen pronunciation" aria-label="Listen pronunciation">
        <i class="fa-solid fa-volume-high"></i>
      </button>
      <button type="button" class="save-btn btn bg-[#1a91ff10] hover:bg-[#1a91ff80]" data-word-id="${escapeHtml(
        word?.id,
      )}" title="Save word" aria-label="Save word" aria-pressed="false">
        <i class="fa-regular fa-heart"></i>
      </button>
    </div>
  `;

  card
    .querySelector(".details-btn")
    .addEventListener("click", () => loadWordDetail(word.id));
  card
    .querySelector(".pronounce-btn")
    .addEventListener("click", () => pronounceWord(word.word));

  const saveBtn = card.querySelector(".save-btn");
  saveBtn.addEventListener("click", () => {
    toggleSavedWord(word);
    syncSaveButtons();
  });
  syncSaveButton(saveBtn);

  return card;
};

// ---------------- rendering ----------------

const renderWords = (words, emptyState = emptyLessonHtml()) => {
  const wordContainer = getElement("word-container");
  const wordList = Array.isArray(words) ? words : [];

  wordContainer.innerHTML = "";

  if (wordList.length === 0) {
    wordContainer.innerHTML = emptyState; // relevant message when nothing is found
    manageSpinner(false);
    return;
  }

  wordList.forEach((word) => wordContainer.append(createWordCard(word)));
  manageSpinner(false);
};

const displayLevelWord = (words) => {
  renderWords(words, emptyLessonHtml());
};

const displaySearchWords = (words, query) => {
  renderWords(words, emptySearchHtml(query));
};

const displayLessons = (lessons) => {
  //   1. get the container & empty it
  const levelContainer = getElement("level-container");
  levelContainer.innerHTML = "";

  //   2. no lesson found
  if (!Array.isArray(lessons) || lessons.length === 0) {
    levelContainer.innerHTML = emptyLessonsLoadErrorHtml;
    return;
  }

  //   3. create a button for every lesson
  for (const lesson of lessons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = `lesson-btn-${lesson.level_no}`;
    btn.className = "btn btn-outline btn-primary lesson-btn";
    btn.innerHTML = `<i class="fa-solid fa-book-open"></i> Lesson - ${escapeHtml(
      safeText(lesson.level_no, ""),
    )}`;
    btn.addEventListener("click", () => loadLevelWord(lesson.level_no));
    levelContainer.append(btn);
  }
};

// ---------------- api calls ----------------

const loadLessons = async () => {
  try {
    const lessons = await fetchData(`${API_BASE}/levels/all`);
    displayLessons(lessons);
  } catch (error) {
    console.error("Lessons could not be loaded.", error);
    getElement("level-container").innerHTML = emptyLessonsLoadErrorHtml;
  }
};

const removeActive = () => {
  const lessonButtons = document.querySelectorAll(".lesson-btn");
  lessonButtons.forEach((btn) => btn.classList.remove("active"));
};

const loadLevelWord = async (id) => {
  manageSpinner(true);
  getElement("input-search").value = ""; // a lesson click clears the search box
  const requestToken = ++contentRequestToken;

  try {
    const words = await fetchData(`${API_BASE}/level/${id}`);
    if (requestToken !== contentRequestToken) return; // a newer request took over

    removeActive(); // remove all active class
    const clickBtn = getElement(`lesson-btn-${id}`);
    if (clickBtn) clickBtn.classList.add("active"); //add active class
    displayLevelWord(words);
  } catch (error) {
    console.error("The words of this lesson could not be loaded.", error);
    if (requestToken !== contentRequestToken) return;
    removeActive();
    renderWords([], emptyWordsLoadErrorHtml());
  }
};

const loadWordDetail = async (id) => {
  const detailsBox = getElement("details-container");
  detailsBox.innerHTML = `
    <div class="flex justify-center items-center py-8">
      <span class="loading loading-bars loading-lg"></span>
    </div>
  `;
  getElement("my_modal_5").showModal();

  try {
    const word = await fetchData(`${API_BASE}/word/${id}`);
    displayWordDetails(word);
  } catch (error) {
    console.error("The word details could not be loaded.", error);
    displayWordDetails(null);
  }
};

const displayWordDetails = (word) => {
  const detailsBox = getElement("details-container");
  const hasDetails =
    word && typeof word === "object" && Object.keys(word).length > 0;

  // api-03 answers with an empty object for unknown ids
  if (!hasDetails) {
    detailsBox.innerHTML = `
      <div class="text-center py-6 space-y-4 font-bangla">
        <img class="mx-auto" src="./assets/alert-error.png" alt="" />
        <p class="text-gray-400">এই শব্দের বিস্তারিত তথ্য পাওয়া যায়নি।</p>
        <h2 class="font-medium text-2xl">অন্য শব্দ খুঁজে দেখুন</h2>
      </div>
    `;
    return;
  }

  const synonyms = createElements(word.synonyms);

  detailsBox.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <h2 class="text-2xl font-bold">
        ${escapeHtml(safeText(word.word, "শব্দ পাওয়া যায়নি"))} ( <i class="fa-solid fa-microphone-lines"></i>: ${escapeHtml(
          safeText(word.pronunciation, "উচ্চারণ পাওয়া যায়নি"),
        )})
      </h2>
      <button type="button" class="details-pronounce-btn btn btn-sm btn-circle bg-[#1a91ff10] hover:bg-[#1a91ff80]" title="Listen pronunciation" aria-label="Listen pronunciation">
        <i class="fa-solid fa-volume-high"></i>
      </button>
    </div>
    <div class="">
      <h2 class="font-bold">Meaning</h2>
      <p>${escapeHtml(safeText(word.meaning, "অর্থ পাওয়া যায়নি"))}</p>
    </div>
    <div class="">
      <h2 class="font-bold">Example</h2>
      <p>${escapeHtml(safeText(word.sentence, "উদাহরণ পাওয়া যায়নি"))}</p>
    </div>
    <div class="">
      <h2 class="font-bold">সমার্থক শব্দ গুলো</h2>
      <div class="flex flex-wrap gap-2 pt-2">
        ${
          synonyms ||
          `<span class="font-bangla text-gray-400">সমার্থক শব্দ পাওয়া যায়নি</span>`
        }
      </div>
    </div>
  `;

  detailsBox
    .querySelector(".details-pronounce-btn")
    .addEventListener("click", () => pronounceWord(word.word));
};

// ---------------- search ----------------

const getAllWords = async () => {
  if (!allWordsCache) {
    allWordsCache = await fetchData(`${API_BASE}/words/all`);
  }
  return allWordsCache;
};

const searchWords = async (query) => {
  const searchValue = safeText(query, "").toLowerCase();
  removeActive(); // searching resets the active lesson button

  // empty input -> back to the "select a lesson" message
  if (!searchValue) {
    contentRequestToken++; // stop the requests that are still in flight
    renderWords([], defaultWordStateHtml);
    return;
  }

  const requestToken = ++contentRequestToken;
  manageSpinner(true);
  try {
    const allWords = await getAllWords();
    if (requestToken !== contentRequestToken) return; // a newer request took over

    const wordList = Array.isArray(allWords) ? allWords : [];
    const matchedWords = wordList.filter((word) =>
      safeText(word?.word, "").toLowerCase().includes(searchValue),
    );
    displaySearchWords(matchedWords, query);
  } catch (error) {
    console.error("The search could not be completed.", error);
    if (requestToken !== contentRequestToken) return;
    renderWords(
      [],
      emptyStateHtml(
        "Search করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।",
        "আবার চেষ্টা করুন",
      ),
    );
  }
};

// ---------------- hero form & navbar ----------------

const showHeroError = (message) => {
  const errorBox = getElement("hero-error");
  if (!errorBox) return;
  errorBox.textContent = message;
  showElement(errorBox);
};

const scrollToSection = (id) => {
  const section = getElement(id);
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
};

const handleGetStarted = (event) => {
  event.preventDefault();

  const nameInput = getElement("input-name");
  const passwordInput = getElement("input-password");
  const name = nameInput.value.trim();
  const password = passwordInput.value;

  if (!name) {
    showHeroError("Please enter your name to continue.");
    nameInput.focus();
    return;
  }

  if (name.length < 3) {
    showHeroError("Your name must be at least 3 characters long.");
    nameInput.focus();
    return;
  }

  if (password.length < 6) {
    showHeroError("Password must be at least 6 characters long.");
    passwordInput.focus();
    return;
  }

  hideElement(getElement("hero-error"));
  hideElement(getElement("hero-section")); // banner hidden after a valid login
  scrollToSection("learn-section");
};

const handleLogout = () => {
  const nameInput = getElement("input-name");
  const passwordInput = getElement("input-password");

  contentRequestToken++; // ignore responses that are still on their way
  nameInput.value = "";
  passwordInput.value = "";
  getElement("input-search").value = "";
  hideElement(getElement("hero-error"));
  showElement(getElement("hero-section"));
  removeActive(); // no lesson stays selected
  renderWords([], defaultWordStateHtml); // back to the default message
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ---------------- start the app ----------------

const init = () => {
  // keep the initial "select a lesson" markup so it can be restored later
  defaultWordStateHtml = getElement("word-container").innerHTML;

  // hero form
  getElement("signup-form").addEventListener("submit", handleGetStarted);

  // navbar logout button (mobile + desktop)
  document
    .querySelectorAll(".logout-btn")
    .forEach((button) => button.addEventListener("click", handleLogout));

  // search: button click, Enter key and live search while typing
  const searchInput = getElement("input-search");
  getElement("btn-search").addEventListener("click", () =>
    searchWords(searchInput.value),
  );
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchWords(searchInput.value);
    }
  });
  searchInput.addEventListener(
    "input",
    debounce(() => searchWords(searchInput.value)),
  );

  // saved words
  getElement("btn-clear-saved").addEventListener("click", clearSavedWords);

  displaySavedWords();
  loadLessons();
};

init();



