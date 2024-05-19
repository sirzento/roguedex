// import CryptoJS from '../libs/crypto-js.min.js';
// import Utils from "./utils.js";

const runningStatusDiv = document.createElement('div')
runningStatusDiv.textContent = 'RogueDex is running!'
runningStatusDiv.classList.add('text-base')
runningStatusDiv.classList.add('running-status')
document.body.insertBefore(runningStatusDiv, document.body.firstChild);
scriptInjector();

function scriptInjector() {
    const scriptElem = document.createElement("script");
    scriptElem.src = chrome.runtime.getURL("/content/utils.js");
    scriptElem.type = "module";
    document.head.appendChild(scriptElem);
    scriptElem.addEventListener("load", initUtilities);
}

let Utils;

function initUtilities(e) {
    Utils = new UtilsClass();
    Utils.init();
    Utils.addEventListener('isReadyChange', () => {
        if (Utils.isReady) {
            console.log("All Scripts Loaded!")
            touchControlListener();
            extensionSettingsListener();
        } else {
            console.log("Error Loading Scripts :(")
        }
    });
}

let wrapperDivPositions = {
    'enemies': {
        'top': '0',
        'left': '0',
        'opacity': '100'
    },
    'allies': {
        'top': '0',
        'left': '0',
        'opacity': '100'
    }
}

function createEnemyDiv() {
    const enemies = document.createElement("div");
    enemies.className = 'enemy-team'
    enemies.id = "enemies";
    return enemies;
}

function createAlliesDiv() {
    const allies = document.createElement("div");
    allies.className = 'allies-team'
    allies.id = "allies";
    return allies;
}

// Enables drag-and-drop functionality on an element
function enableDragElement(elmnt) {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    const dragStartElement = elmnt;

    // Attach the mousedown event handler
    dragStartElement.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        if (e.target.type === 'submit' || e.target.type === 'range') return
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = stopDragging;
        document.onmousemove = dragElement;
    }

    // Handles dragging movement
    function dragElement(e) {
        e = e || window.event;
        if (e.target.type === 'submit' || e.target.type === 'range') return
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    // Stops dragging on mouse release
    function stopDragging() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const enemiesDiv = createEnemyDiv()
const alliesDiv = createAlliesDiv()

enableDragElement(enemiesDiv);
enableDragElement(alliesDiv);

document.body.appendChild(enemiesDiv);
document.body.appendChild(alliesDiv);

let Types
(function (Types) {
    Types[Types["normal"] = 1] = 1;
    Types[Types["fighting"] = 2] = 2;
    Types[Types["flying"] = 3] = 3;
    Types[Types["poison"] = 4] = 4;
    Types[Types["ground"] = 5] = 5;
    Types[Types["rock"] = 6] = 6;
    Types[Types["bug"] = 7] = 7;
    Types[Types["ghost"] = 8] = 8;
    Types[Types["steel"] = 9] = 9;
    Types[Types["fire"] = 10] = 10;
    Types[Types["water"] = 11] = 11;
    Types[Types["grass"] = 12] = 12;
    Types[Types["electric"] = 13] = 13;
    Types[Types["psychic"] = 14] = 14;
    Types[Types["ice"] = 15] = 15;
    Types[Types["dragon"] = 16] = 16;
    Types[Types["dark"] = 17] = 17;
    Types[Types["fairy"] = 18] = 18;
})(Types || (Types = {}));

let Stat;
(function (Stat) {
    Stat[Stat["HP"] = 0] = "HP";
    Stat[Stat["ATK"] = 1] = "ATK";
    Stat[Stat["DEF"] = 2] = "DEF";
    Stat[Stat["SPATK"] = 3] = "SPATK";
    Stat[Stat["SPDEF"] = 4] = "SPDEF";
    Stat[Stat["SPD"] = 5] = "SPD";
})(Stat || (Stat = {}));


function createTooltipDiv(tip) {
    const tooltip = document.createElement('div')
    tooltip.classList.add('text-base')
    tooltip.classList.add('tooltiptext')
    tooltip.textContent = tip
    return tooltip
}

// Current values: weaknesses, resistances, immunities
function createTypeEffectivenessWrapper(typeEffectivenesses) {
    let typesHTML = `
		${Object.keys(typeEffectivenesses).map((effectiveness) => {
        if (typeEffectivenesses[effectiveness].length === 0) return ''
        const tooltipMap = {
            weaknesses: "Weak to",
            resistances: "Resists",
            immunities: "Immune to"
        };
        return `
	      <div class="pokemon-${effectiveness} tooltip">

	          ${typeEffectivenesses[effectiveness].map((type, counter) => `
	              ${/* The current html structure requires to wrap every third element in a div, the implementation here gets a bit ugly. */''}
	              ${((counter + 1) % 3 === 1) ?
            `<div>`
            : ''}

	              <div class="type-icon" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${Types[type]}.png')"></div>
	              
	              ${/* Closing div, after every third element or when the arrays max length is reached. */''}
	              ${((counter + 1) % 3 === 0) || ((counter + 1) === typeEffectivenesses[effectiveness].length) ?
            `</div>`
            : ''}
	          `).join('')}
	          ${createTooltipDiv(tooltipMap[effectiveness] || "")}
	      </div>
	  `
    }).join('')}
  `
    return typesHTML
}

function createTooltipDiv(tip) {
    const tooltipHtml = `
		<div class="text-base tooltiptext">${tip}</div>
	`
    return tooltipHtml
}


const pages = {
    "enemies": 0,
    "allies": 0,
}
const partySize = {
    "enemies": 0,
    "allies": 0
}
let weather = {};

function createArrowButtonsDiv(divId, upString, downString) {
    let result = {};
    result.idUp = `${divId}-up`
    result.idDown = `${divId}-down`

    result.html = `
		<div class="arrow-button-wrapper">
			<button class="text-base arrow-button" id="${result.idUp}">${upString}</button>
			<button class="text-base arrow-button" id="${result.idDown}">${downString}</button>
		</div>
	`

    return result
}

function createOpacitySliderDiv(divId, initialValue = "100", min = "10", max = "100") {
    let result = {};
    result.id = `${divId}-slider`
    result.html = `
  		<div class="slider-wrapper">
  			<div class="text-base">Opacity:</div>
  			<input type="range" min="${min}" max="${max}" value="${initialValue}" id="${result.id}">
  		</div>
  	`
    return result
}

function changeOpacity(e) {
    const divId = e.target.id.split("-")[0]
    const div = document.getElementById(divId)
    wrapperDivPositions[divId].opacity = e.target.value
    div.style.opacity = `${e.target.value / 100}`
}

async function changePage(click) {
    const buttonId = click.target.id
    const divId = buttonId.split("-")[0]
    const direction = buttonId.split("-")[1]
    if (direction === 'up') {
        if (pages[divId] > 0) {
            pages[divId] -= 1
        } else {
            pages[divId] = partySize[divId]
        }
    } else if (direction === 'down') {
        if (pages[divId] < partySize[divId]) {
            pages[divId] += 1
        } else {
            pages[divId] = partySize[divId]
        }
    }
    let sessionData = Utils.LocalStorage.getSessionData();
    await initCreation(sessionData);
}

async function createPokemonCardDiv(cardId, pokemon) {
    let opacityRangeMin = 10;
    let opacityRangeMax = 100;
    let pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    const opacitySlider = createOpacitySliderDiv(cardId, wrapperDivPositions[cardId].opacity, opacityRangeMin, opacityRangeMax);
    const typeEffectivenessHTML = createTypeEffectivenessWrapper(pokemon.typeEffectiveness);
    let cardHTML = `
  	<div class="pokemon-cards">
	    <div class="pokemon-card">
	      ${opacitySlider.html}
	      <div style="display: flex;">
	        <div class="pokemon-icon">
	            <img src="${pokemonImageUrl}">
	        </div>

					${/* Displays the 3 type effectiveness segemtns (weaknesses, resistances, immunities). */''}
	        ${typeEffectivenessHTML}
	        
	      </div>

	      <div class="text-base">
	      	<div class="tooltip ${pokemon.ability.isHidden ? 'hidden-ability' : ''}">
	        	Ability: ${pokemon.ability.name} 
	        	${createTooltipDiv(pokemon.ability.description)}
	        </div>
	        &nbsp-&nbsp 
	        <div class = "tooltip">
	        	Nature: ${pokemon.nature}
	        	${createTooltipDiv("")}
	        </div>
	      </div>
	      <div class="text-base">
	        HP: ${pokemon.ivs[Stat["HP"]]}, ATK: ${pokemon.ivs[Stat["ATK"]]}, DEF: ${pokemon.ivs[Stat["DEF"]]}
	      </div>
	      <div class="text-base">
	        SPE: ${pokemon.ivs[Stat["SPD"]]}, SPD: ${pokemon.ivs[Stat["SPDEF"]]}, SPA: ${pokemon.ivs[Stat["SPATK"]]}
	      </div>
	        
	      ${(weather.type && weather.turnsLeft) ?
        `<div class="text-base">Weather: ${weather.type}, Turns Left: ${weather.turnsLeft}</div>`
        : ''}
	    </div>
    </div>
  `

    const cardObj = {}
    cardObj.html = cardHTML;
    cardObj.slider = opacitySlider.id;

    return cardObj
}

function createWrapperDiv(divId) {
    const oldDiv = document.getElementById(divId)
    if (oldDiv) {
        wrapperDivPositions[divId].top = oldDiv.style.top;
        wrapperDivPositions[divId].left = oldDiv.style.left;
        oldDiv.remove();
    }
    const newDiv = divId === 'enemies' ? createEnemyDiv() : createAlliesDiv()
    enableDragElement(newDiv)
    newDiv.style.top = wrapperDivPositions[divId].top
    newDiv.style.left = wrapperDivPositions[divId].left
    newDiv.style.opacity = "" + (Number(wrapperDivPositions[divId].opacity) / 100)
    return newDiv;
}


async function createCardsDiv(divId, pokemon) {
    let newDiv = createWrapperDiv(divId);
    let divClass = divId === 'enemies' ? 'enemy-team' : 'allies-team'
    const cardObj = await createPokemonCardDiv(divId, pokemon);
    const buttonsObj = createArrowButtonsDiv(divId, "↑", "↓");
    const cardsHTML = `
  	${buttonsObj.html}
  	${cardObj.html}
  `;
    newDiv.insertAdjacentHTML("afterbegin", cardsHTML)
    document.body.appendChild(newDiv);
    document.getElementById(cardObj.slider).addEventListener('input', changeOpacity)
    // document.getElementById(buttonsObj.idUp).addEventListener('click', changePage)
    // document.getElementById(buttonsObj.idDown).addEventListener('click', changePage)
    return newDiv
    // let newDiv = createWrapperDiv(divId)
    // let buttonsDiv = createArrowButtonsDiv(divId)
    // newDiv.appendChild(buttonsDiv)
    // const pokemonCards = document.createElement("div");
    // pokemonCards.className = "pokemon-cards"
    // const card = await createPokemonCardDiv(divId, pokemon);
    // pokemonCards.appendChild(card);
    // newDiv.appendChild(pokemonCards)
    // document.body.appendChild(newDiv)
    // return newDiv
}


function deleteAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    element.innerHTML = '';
}

function deleteWrapperDivs() {
    try {
        console.log("DELETE CALLED")
        let enemies = document.getElementById("enemies");
        console.log(enemies);
        deleteAllChildren(enemies);
        let allies = document.getElementById("allies");
        deleteAllChildren(allies);
    } catch (e) {
        console.error(e)
    }
}


async function scaleElements() {
    const data = await browserApi.storage.sync.get('scaleFactor');
    const scaleFactorMulti = data.scaleFactor || 1;
    const baseWidth = 1920; // Assume a base width of 1920 pixels
    const baseHeight = 1080; // Assume a base height of 1080 pixels
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    const scaleFactor_width = currentWidth / baseWidth;
    const scaleFactor_height = currentHeight / baseHeight;
    let scaleFactor = scaleFactor_width < scaleFactor_height ? scaleFactor_width : scaleFactor_height;
    const enemiesDiv = document.getElementById('enemies');
    const alliesDiv = document.getElementById('allies');
    enemiesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
    alliesDiv.style.fontSize = `${16 * scaleFactor * scaleFactorMulti}px`;
}

async function initCreation(sessionData) {
    deleteWrapperDivs();
    let extensionSettings = await Utils.LocalStorage.getExtensionSettings();
    console.log(extensionSettings);
    if (extensionSettings.showEnemies) {
        await dataMapping("enemyParty", "enemies", sessionData);
    }
    if (extensionSettings.showParty) {
        await dataMapping("party", "allies", sessionData);
    }
}

async function dataMapping(pokemonLocation, divId, sessionData) {
    await Utils.PokeMapper.getPokemonArray(sessionData[pokemonLocation], sessionData.arena).then(async (pokemonData) => {
        weather = pokemonData.hasOwnProperty('weather') ? pokemonData.weather : null;
        partySize[divId] = pokemonData.pokemon.length;
        let pIndex = determinePage(divId, pokemonData.pokemon);
        await createCardsDiv(divId, pokemonData.pokemon[pIndex]).then(() => {
            scaleElements();
        });
    });
}

function determinePage(divId, pokemon) {
    if (pages[divId] >= pokemon.length) {
        pages[divId] = pokemon.length - 1;
        return pages[divId];
    } else {
        return pages[divId];
    }
}

function extensionSettingsListener() {
    browserApi.storage.onChanged.addListener(async function (changes, namespace) {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if (key === 'showMinified') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
            }
            if (key === 'scaleFactor') {
                await scaleElements();
            }
            if (key === 'showEnemies') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
            }
            if (key === 'showParty') {
                let sessionData = Utils.LocalStorage.getSessionData();
                await initCreation(sessionData);
            }
        }
    });
}


function touchControlListener() {
    const touchControlsElement = document.getElementById('touchControls')
    if (touchControlsElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(async (mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-ui-mode') {
                    const newValue = touchControlsElement.getAttribute('data-ui-mode');
                    console.log('New data-ui-mode:', newValue);
                    if (newValue === "MESSAGE" || newValue === "COMMAND" || newValue === "CONFIRM") {
                        Utils.LocalStorage.setSessionData();
                        let sessionData = Utils.LocalStorage.getSessionData();
                        await initCreation(sessionData);
                    }
                    if (newValue === "SAVE_SLOT") {
                        Utils.LocalStorage.clearAllSessionData();
                    }
                    if (newValue === "SAVE_SLOT" || newValue === "TITLE" || newValue === "MODIFIER_SELECT" || newValue === "STARTER_SELECT") {
                        deleteWrapperDivs()
                    }
                }
            });
        });

        window.addEventListener('resize', scaleElements);
        observer.observe(touchControlsElement, {attributes: true});
    }
}

