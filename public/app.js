const API_ROOT = '/api/v1';
const PAGE_SIZE = 12;

const elements = {
  statusDot: document.querySelector('#status-dot'),
  statusLabel: document.querySelector('#status-label'),
  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  sortSelect: document.querySelector('#sort-select'),
  resultCount: document.querySelector('#result-count'),
  errorMessage: document.querySelector('#error-message'),
  modelGrid: document.querySelector('#model-grid'),
  previousButton: document.querySelector('#previous-button'),
  nextButton: document.querySelector('#next-button'),
  pageLabel: document.querySelector('#page-label'),
  dialog: document.querySelector('#model-dialog'),
};

const state = { page: 1, totalPages: 1, query: '', sort: 'release_desc' };

function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat().format(value);
}

function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return `${new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value)}`;
}

function addText(parent, tag, className, value) {
  const child = document.createElement(tag);
  if (className) child.className = className;
  child.textContent = value;
  parent.append(child);
  return child;
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.hidden = false;
}

function hideError() {
  elements.errorMessage.hidden = true;
  elements.errorMessage.textContent = '';
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return body;
}

function renderModel(model) {
  const card = document.createElement('article');
  card.className = 'model-card';

  const cardTop = document.createElement('div');
  cardTop.className = 'card-top';
  addText(cardTop, 'span', 'model-type', model.type || 'AI MODEL');
  if (model.isOpenSource) addText(cardTop, 'span', 'open-source', 'OPEN SOURCE');

  addText(card, 'h3', '', model.name);
  const lab = document.createElement('p');
  lab.className = 'model-lab';
  lab.textContent = model.lab.name;
  card.insertBefore(cardTop, card.firstChild);
  card.insertBefore(lab, card.children[2] || null);
  addText(card, 'p', 'model-description', model.description || 'A model ready to explore.');

  const tags = document.createElement('div');
  tags.className = 'tag-row';
  for (const modality of (model.inputModalities || []).slice(0, 3)) {
    addText(tags, 'span', 'tag', modality.toLowerCase());
  }
  if (!tags.childElementCount) addText(tags, 'span', 'tag', `${model.providerCount} providers`);
  card.append(tags);

  const bottom = document.createElement('div');
  bottom.className = 'card-bottom';
  const metrics = document.createElement('div');
  metrics.className = 'card-metrics';
  const context = document.createElement('div');
  addText(context, 'span', 'metric-label', 'CONTEXT');
  addText(context, 'span', 'metric-value', formatNumber(model.contextWindow));
  const price = document.createElement('div');
  addText(price, 'span', 'metric-label', 'FROM / 1M TOKENS');
  addText(price, 'span', 'metric-value', formatPrice(model.pricing.minInputPricePerMTok));
  metrics.append(context, price);

  const details = document.createElement('button');
  details.type = 'button';
  details.className = 'details-button';
  details.dataset.modelSlug = model.slug;
  details.append(document.createTextNode('Details '));
  addText(details, 'span', '', '↗');
  bottom.append(metrics, details);
  card.append(bottom);
  return card;
}

function renderEmpty(message) {
  elements.modelGrid.replaceChildren();
  addText(elements.modelGrid, 'p', 'empty-state', message);
}

async function loadModels() {
  hideError();
  elements.modelGrid.setAttribute('aria-busy', 'true');
  elements.modelGrid.replaceChildren();
  addText(elements.modelGrid, 'p', 'empty-state', 'Loading the catalog…');

  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(PAGE_SIZE),
    sort: state.sort,
  });
  if (state.query) params.set('q', state.query);

  try {
    const result = await fetchJson(`${API_ROOT}/models?${params}`);
    elements.modelGrid.replaceChildren();
    if (result.data.length === 0) {
      renderEmpty('No models match your search. Try another name or lab.');
    } else {
      result.data.forEach((model) => elements.modelGrid.append(renderModel(model)));
    }

    state.totalPages = result.meta.totalPages;
    elements.resultCount.textContent = `${formatNumber(result.meta.total)} models`;
    elements.pageLabel.textContent = `Page ${result.meta.page} of ${result.meta.totalPages}`;
    elements.previousButton.disabled = result.meta.page <= 1;
    elements.nextButton.disabled = result.meta.page >= result.meta.totalPages;
  } catch (error) {
    renderEmpty('The catalog could not be loaded.');
    showError(error.message || 'Unable to load models. Please try again.');
    elements.resultCount.textContent = '';
    elements.pageLabel.textContent = `Page ${state.page}`;
    elements.previousButton.disabled = state.page <= 1;
    elements.nextButton.disabled = true;
  } finally {
    elements.modelGrid.setAttribute('aria-busy', 'false');
  }
}

function addDetailRow(list, label, value, emptyMessage) {
  if (!value) {
    const row = addText(list, 'li', 'detail-empty', emptyMessage);
    return row;
  }
  const row = document.createElement('li');
  addText(row, 'span', '', label);
  addText(row, 'span', '', value);
  list.append(row);
  return row;
}

async function showModelDetails(slug) {
  const title = document.querySelector('#dialog-title');
  const subtitle = document.querySelector('#dialog-subtitle');
  const providers = document.querySelector('#provider-list');
  const benchmarks = document.querySelector('#benchmark-list');
  const detailError = document.querySelector('#detail-error');

  title.textContent = 'Loading model…';
  subtitle.textContent = '';
  document.querySelector('#detail-context').textContent = '—';
  document.querySelector('#detail-input-price').textContent = '—';
  document.querySelector('#detail-output-price').textContent = '—';
  providers.replaceChildren();
  benchmarks.replaceChildren();
  detailError.hidden = true;
  elements.dialog.showModal();

  try {
    const model = await fetchJson(`${API_ROOT}/models/${encodeURIComponent(slug)}`);
    title.textContent = model.name;
    subtitle.textContent = `${model.lab.name} · ${model.type}${model.isOpenSource ? ' · Open source' : ''}`;
    document.querySelector('#detail-context').textContent = formatNumber(model.contextWindow);
    document.querySelector('#detail-input-price').textContent = formatPrice(model.pricing.minInputPricePerMTok);
    document.querySelector('#detail-output-price').textContent = formatPrice(model.pricing.minOutputPricePerMTok);

    if (model.providers.length) {
      for (const entry of model.providers) {
        addDetailRow(
          providers,
          entry.provider.name,
          `${formatPrice(entry.pricing.inputPricePerMTok)} in · ${formatPrice(entry.pricing.outputPricePerMTok)} out`,
        );
      }
    } else {
      addDetailRow(providers, '', '', 'No provider pricing available.');
    }

    if (model.benchmarks.length) {
      for (const benchmark of model.benchmarks) {
        addDetailRow(benchmarks, benchmark.name, `${benchmark.score} ${benchmark.unit || ''}`.trim());
      }
    } else {
      addDetailRow(benchmarks, '', '', 'No benchmark results available.');
    }
  } catch (error) {
    detailError.textContent = error.message || 'Unable to load model details.';
    detailError.hidden = false;
  }
}

async function checkApiStatus() {
  try {
    await fetchJson('/health');
    elements.statusDot.className = 'status-dot online';
    elements.statusLabel.textContent = 'API online';
  } catch {
    elements.statusDot.className = 'status-dot offline';
    elements.statusLabel.textContent = 'API unavailable';
  }
}

elements.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.query = elements.searchInput.value.trim();
  state.page = 1;
  loadModels();
});

elements.sortSelect.addEventListener('change', () => {
  state.sort = elements.sortSelect.value;
  state.page = 1;
  loadModels();
});

elements.previousButton.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadModels();
  }
});

elements.nextButton.addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadModels();
  }
});

elements.modelGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-model-slug]');
  if (button) showModelDetails(button.dataset.modelSlug);
});

document.querySelector('#close-dialog').addEventListener('click', () => elements.dialog.close());
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !elements.dialog.open && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    elements.searchInput.focus();
  }
});

checkApiStatus();
loadModels();
