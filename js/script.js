// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.getElementById('getImagesButton');
const randomFactText = document.getElementById('randomFactText');
const randomFactMeta = document.getElementById('randomFactMeta');

// API settings for NASA Astronomy Picture of the Day
const apodApiKey = 'y8kLQmfJX6psSOL5hOD6840dIuwm3YaJs8m9bVHX';
const apodApiUrl = 'https://api.nasa.gov/planetary/apod';

// Build one reusable modal for APOD image details.
const imageModal = createImageModal();

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Load one random APOD fact when the page first opens.
fetchRandomFact();

// Fetch APOD entries when the user clicks the button
getImagesButton.addEventListener('click', async () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showMessage('Please select both a start date and end date.');
    return;
  }

  if (startDate > endDate) {
    showMessage('Start date must be before or equal to the end date.');
    return;
  }

  showMessage('Loading images from NASA...');

  try {
    const requestUrl = `${apodApiUrl}?api_key=${apodApiKey}&start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error('Could not fetch APOD data from NASA.');
    }

    const data = await response.json();
    const apodItems = Array.isArray(data) ? data : [data];

    // Show newest images first
    apodItems.sort((a, b) => b.date.localeCompare(a.date));
    renderGallery(apodItems);
  } catch (error) {
    showMessage('Something went wrong while loading APOD data. Please try again.');
  }
});

function showMessage(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔭</div>
      <p>${message}</p>
    </div>
  `;
}

function renderGallery(apodItems) {
  gallery.innerHTML = '';

  if (apodItems.length === 0) {
    showMessage('No APOD results were found for this date range.');
    return;
  }

  apodItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-item';

    const title = document.createElement('h3');
    title.textContent = `${item.date} - ${item.title}`;
    card.appendChild(title);

    if (item.media_type === 'image') {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'image-wrapper';

      const image = document.createElement('img');
      image.src = item.hdurl || item.url;
      image.alt = item.title;
      image.className = 'apod-image';

      const hoverLabel = document.createElement('span');
      hoverLabel.className = 'hover-label';
      hoverLabel.textContent = 'Click image for details';

      image.addEventListener('click', () => {
        openImageModal(item);
      });

      imageWrapper.appendChild(image);
      imageWrapper.appendChild(hoverLabel);
      card.appendChild(imageWrapper);
    } else {
      const mediaNote = document.createElement('p');
      mediaNote.className = 'media-note';
      mediaNote.textContent = 'This APOD item is a video. Use the link below to open it:';

      const mediaLink = document.createElement('a');
      mediaLink.href = item.url;
      mediaLink.target = '_blank';
      mediaLink.rel = 'noopener noreferrer';
      mediaLink.textContent = 'Open media';

      card.appendChild(mediaNote);
      card.appendChild(mediaLink);

      const explanation = document.createElement('p');
      explanation.textContent = item.explanation;
      card.appendChild(explanation);
    }

    gallery.appendChild(card);
  });
}

function createImageModal() {
  const overlay = document.createElement('div');
  overlay.className = 'image-modal-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';

  const title = document.createElement('h3');
  title.className = 'modal-title';

  const image = document.createElement('img');
  image.className = 'modal-image';

  const description = document.createElement('p');
  description.className = 'modal-description';

  modal.appendChild(closeButton);
  modal.appendChild(title);
  modal.appendChild(image);
  modal.appendChild(description);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  closeButton.addEventListener('click', closeImageModal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeImageModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeImageModal();
    }
  });

  return { overlay, title, image, description };
}

function openImageModal(item) {
  imageModal.title.textContent = `${item.date} - ${item.title}`;
  imageModal.image.src = item.hdurl || item.url;
  imageModal.image.alt = item.title;
  imageModal.description.textContent = item.explanation;

  imageModal.overlay.classList.add('is-visible');
  imageModal.overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeImageModal() {
  imageModal.overlay.classList.remove('is-visible');
  imageModal.overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

async function fetchRandomFact() {
  randomFactText.textContent = 'Loading a random NASA fact...';
  randomFactMeta.textContent = '';

  try {
    // count=1 gives one random APOD result.
    const requestUrl = `${apodApiUrl}?api_key=${apodApiKey}&count=1`;
    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error('Could not fetch a random fact from NASA.');
    }

    const data = await response.json();
    const randomItem = Array.isArray(data) ? data[0] : data;
    const shortFact = getFirstSentence(randomItem.explanation);

    randomFactText.textContent = shortFact;
    randomFactMeta.textContent = `Source: ${randomItem.title} (${randomItem.date})`;
  } catch (error) {
    randomFactText.textContent = 'Something went wrong while loading a random fact. Please try again.';
    randomFactMeta.textContent = '';
  }
}

function getFirstSentence(text) {
  if (!text) {
    return 'No fact text was provided for this item.';
  }

  const firstSentence = text.match(/[^.!?]+[.!?]/);
  return firstSentence ? firstSentence[0].trim() : text.trim();
}
