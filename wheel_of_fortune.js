"use strict";

const PRIZE_WIN = 'WIN';
const PRIZE_TRY_AGAIN = 'Try Again';
const MAX_SPIN_TRIES = 2;
let spinTriesLeft = MAX_SPIN_TRIES;
let wheelPrizes = [];

/* HTML creation */
function createMainHtml() { 
  return `
  <div id="wheel-of-fortune">
    <h1 class="u-text-center">Wheel of Fortune</h1>
    <p class="u-text-center">Fill in the form and spin the wheel!</p>
    <form id="wof-form" class="form">
      <div class="form-row">
        <label for="wof_name">Name</label>
        <input id="wof_name" type="text" data-errelid="wof_name_error" />
      </div>
      <div class="form-error" id="wof_name_error"></div>
      <div class="form-row">
        <label for="wof_surname">Surname</label>
        <input id="wof_surname" type="text" data-errelid="wof_surname_error" />
      </div>
      <div class="form-error" id="wof_surname_error"></div>
      <div class="form-row">
        <label for="wof_email">E-mail</label>
        <input id="wof_email" type="email" data-errelid="wof_email_error" />
        </div>
      <div class="form-error" id="wof_email_error"></div>
      <button id="wof-form-submit" type="submit">Submit</button>
    </form>
    <div id="wof-game">
      <div class="spin-btn-wr">
        <button type="button" id="wof-spin-btn" class="spin-btn">Spin</button>
      </div>
      <div id="wof-spin-result">Click "Spin" to play!<div class="subline">You have ${spinTriesLeft} spins left</div></div>
      <div id="wof-wheel-wr"></div>
    </div>
  </div>`;
}

function createWheelHtml() {
  let slicesHtml = '';
  for (let i = 1; i <= wheelPrizes.length; i++) {
    slicesHtml += `
      <li class="slice">
        <div class="slice-contents" data-slice-content="${i}">${i}</div>
      </li>`;
  }
  return `
    <div id="wof-wheel-pointer">&#9660;</div>
    <ul id="wof-wheel">
      ${slicesHtml}
    </ul>`;
}


/* DOM updates and queries */
function insertWidgetToDom() {
  const widgetEl = document.querySelector('#wheel-of-fortune');
  if (!widgetEl) {
    return;
  }
  widgetEl.outerHTML = createMainHtml();
}

function getForm() {
  return document.querySelector('#wof-form');
}

function getFormSubmitButton() { 
  return document.querySelector('#wof-form-submit');
}

function updateWheelInDom() {
  const wheelContainer = document.querySelector('#wof-wheel-wr');
  if (!wheelContainer) {
    return;
  }
  wheelContainer.innerHTML = createWheelHtml();
}

function displaySpinResultMessage(messageHtml) {
  const spinResult = document.querySelector('#wof-spin-result');
  if (!spinResult || !messageHtml) {
    return;
  }
  spinResult.innerHTML = messageHtml;
}

function getSpinButton() {
  return document.querySelector('#wof-spin-btn');
}

function removeSpinButtonFromDom() {
  const spinBtn = getSpinButton();
  if (!spinBtn) {
    return;
  }
  spinBtn.remove();
}

function disableSpinButton(removeFromDom = false) {
  const spinBtn = getSpinButton();
  spinBtn.removeEventListener('click', spinWheel);
  if (removeFromDom) {
    removeSpinButtonFromDom();
  } else {
    spinBtn.disabled = true;
  }
}


/* Form functions */
function validateInput(input, errorEl) {
  if (!input || !errorEl) {
    return;
  }
  const value = input.value;
  if (input.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      errorEl.textContent = 'Invalid email address';
      return false; 
    }
  } else {
    if (!value.trim()) {
      errorEl.textContent = 'Required';
      return false;
    }
  }
  errorEl.textContent = '';
  return true;
}

function validateForm(e) {
  e.preventDefault();
  const form = document.querySelector('#wof-form');
  if (!form) {
    return;
  }
  const formInputs = form.querySelectorAll('input');
  let validations = [];
  formInputs.forEach(input => {
    validations.push(validateInput(input, document.querySelector(`#${input.dataset.errelid}`)));
  });
  const allInputsValid = validations.reduce((acc, curr) => acc && curr);
  if (allInputsValid) {
    const game = document.querySelector('#wof-game');
    if (!game) {
      return;
    }
    // CLose the form
    formInputs.forEach(input => input.disabled = true);
    const formSubmitBtn = getFormSubmitButton();
    formSubmitBtn.removeEventListener('click', validateForm);
    formSubmitBtn.remove();

    // Display the game
    game.classList.add('show');
    initWheelForSpin();
    getSpinButton().addEventListener('click', spinWheel);
  }
}

/* Wheel of fortune logic functions */

/** Fetch prize info */
async function fetchPrize() {
  const res = await fetch('prize.json');
  const data = await res.json();
  return data.prize;
}

/**
 * Get a random number between 0 and maxNr - 1, by default 0-11
 * @param {number} [maxNr=12]
 * @returns {number}
 */
function getRandNr(maxNr = 12) {
  const randNr = Math.floor(Math.random() * maxNr);
  return randNr;
}

function initWheelForSpin() {
  const resultsForPicking = Array(12).fill(PRIZE_WIN, 0, 4).fill(PRIZE_TRY_AGAIN, 4, 12);
  wheelPrizes = [];
  for (let i = 1; i < 13; i++) {
    const randNr = getRandNr(resultsForPicking.length);
    const prizeType = resultsForPicking[randNr];
    resultsForPicking.splice(randNr, 1);
    wheelPrizes.push(prizeType);
  }
  updateWheelInDom();
}

/** Main spin flow function */
function spinWheel() {
  if (spinTriesLeft < MAX_SPIN_TRIES) { // reset the prizes and wheel for subsequent spins
    initWheelForSpin();
  }
  let randNr = null;
  let result = null;
  const wheel = document.querySelector('#wof-wheel');
  wheel.classList.add('spin');
  let spinResultMessage = 'Spinning...';
  displaySpinResultMessage(spinResultMessage);
  spinTriesLeft--;
  if (spinTriesLeft === 0) {
    disableSpinButton();
  }

  /* Determine spin result after 1s */
  setTimeout(async () => {
    randNr = getRandNr();
    wheel.style.setProperty('--wheel-rotate', randNr * -30 + 'deg');
    result = wheelPrizes[randNr];
    spinResultMessage = `Wheel stopped on ${randNr + 1}: `
    if (result === PRIZE_WIN) {
      const prize = await fetchPrize();
      if (prize) {
        spinResultMessage += `WIN!<br>Your prize: ${prize}`;
      } else {
        spinResultMessage += `WIN!<br>Please contact customer support to claim your prize.`;	
      }
    } else if (result === PRIZE_TRY_AGAIN) {
      if (spinTriesLeft === 0) {
        spinResultMessage += `no win.<div class="subline">You have played your ${MAX_SPIN_TRIES} spins.</div>Thank you for playing!`;
      } else {
        spinResultMessage += `no win.<div class="subline">You have ${spinTriesLeft} ${spinTriesLeft === 1 ? 'spin' : 'spins'} left</div>`;
      }
    }
  }, 1000);
  
  /* Display spin result on spin animation end */
  setTimeout(() => {
    wheel.classList.remove('spin');
    wheel.querySelector(`[data-slice-content="${randNr + 1}"]`).textContent = result;
    displaySpinResultMessage(spinResultMessage);
    if (result === PRIZE_WIN) {
      disableSpinButton(true);
    }
  }, 2800);
}


/* Init */
insertWidgetToDom();
getFormSubmitButton().addEventListener('click', validateForm);

