//Global selections and variables
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll(".color-hex");
const popup = document.querySelector(".copy-container");
const adjustButton = document.querySelectorAll(".adjust");
const lockButton = document.querySelectorAll(".lock");
const closeAdjustments = document.querySelectorAll(".close-adjustment");
const sliderContainers = document.querySelectorAll(".sliders");
let initialColors;
//This is for local storage
let savedPalettes = [];

//Add our event listeners
//generateBtn.addEventListener("click", randomColors);

sliders.forEach(slider => {
    slider.addEventListener('input', hslControls);
});
colorDivs.forEach((div, index) => {
    div.addEventListener("change", () => {
        updateTextUI(index);
    });
});
currentHexes.forEach(hex => {
    hex.addEventListener("click", () => {
        copyToClipboard(hex);
    });
});
popup.addEventListener("transitionend", () => {
    const popupBox = popup.children[0];
    popup.classList.remove("active");
    popupBox.classList.remove("active");
});
adjustButton.forEach((button, index) => {
    button.addEventListener("click", () => {
        openAdjustmentPanel(index);
    });
});
closeAdjustments.forEach((button, index) => {
    button.addEventListener("click", () => {
        closeAdjustmentPanel(index);
    });
});
lockButton.forEach((button, index) => {
    button.addEventListener("click", e => {
        lockLayer(e, index);
    });
});

//Functions
//Color Generator
function generateHex() {
    const hexColor = chroma.random();
    return hexColor;
}

function randomColors() {
    initialColors = [];

    colorDivs.forEach((div, index) => {
        const hexText = div.nextElementSibling.querySelector('.color-hex');
        const randomColor = generateHex();
        //Add it to the array
        initialColors.push(chroma(randomColor).hex());

        //Add the color to the bg
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;

        //Initial Colorize Sliders
        const color = chroma(randomColor);
        const sliders = div.parentElement.querySelectorAll(`input[type="range"]`);
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];

        colorizeSliders(color, hue, brightness, saturation);
    });
    //Reset Inputs
    resetInputs();
}

function colorizeSliders(color, hue, brightness, saturation) {
    //Scale Saturation
    const noSat = color.set("hsl.s", 0);
    const fullSat = color.set("hsl.s", 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);
    //Scale Brightness
    const midBright = color.set("hsl.l", 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);

    //Update Input Colors
    saturation.style.backgroundImage = `linear-gradient(to right,${scaleSat(
    0
  )}, ${scaleSat(1)})`;
    brightness.style.backgroundImage = `linear-gradient(to right,${scaleBright(
    0
  )},${scaleBright(0.5)} ,${scaleBright(1)})`;
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75),rgb(204,204,75),rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204),rgb(204,75,75))`;
}

function hslControls(e) {
    const index =
        e.target.getAttribute("data-bright") ||
        e.target.getAttribute("data-sat") ||
        e.target.getAttribute("data-hue");

    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');

    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    const bgColor = initialColors[index];

    let color = chroma(bgColor)
        .set("hsl.s", saturation.value)
        .set("hsl.l", brightness.value)
        .set("hsl.h", hue.value);

    colorDivs[index].style.backgroundColor = color;

    colorDivs[index].nextElementSibling.querySelector('.color-hex').innerHTML = color;

    //Colorize inputs/sliders
    colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
    const activeDiv = colorDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector("h2");
    textHex.innerText = color.hex();
}

function resetInputs() {
    const sliders = document.querySelectorAll(".sliders input");
    sliders.forEach(slider => {
        if (slider.name === "hue") {
            const hueColor = initialColors[slider.getAttribute("data-hue")];
            const hueValue = chroma(hueColor).hsl()[0];
            slider.value = Math.floor(hueValue);
        }
        if (slider.name === "brightness") {
            const brightColor = initialColors[slider.getAttribute("data-bright")];
            const brightValue = chroma(brightColor).hsl()[2];
            slider.value = Math.floor(brightValue * 100) / 100;
        }
        if (slider.name === "saturation") {
            const satColor = initialColors[slider.getAttribute("data-sat")];
            const satValue = chroma(satColor).hsl()[1];
            slider.value = Math.floor(satValue * 100) / 100;
        }
    });
}

function copyToClipboard(hex) {
    const el = document.createElement("textarea");
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    //Pop up animation
    const popupBox = popup.children[0];
    popup.classList.add("active");
    popupBox.classList.add("active");
}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle("active");
}

function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove("active");
}

function lockLayer(e, index) {
    const lockSVG = e.target.children[0];
    const activeBg = colorDivs[index];
    activeBg.classList.toggle("locked");

    if (lockSVG.classList.contains("fa-lock-open")) {
        e.target.innerHTML = '<i class="fas fa-lock"></i>';
    } else {
        e.target.innerHTML = '<i class="fas fa-lock-open"></i>';
    }
}

//Implement Save to palette and LOCAL STORAGE STUFF
const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".open-add-container");
const saveInputName = document.querySelector(".save-name");
const saveInputType = document.querySelector(".save-type");
const libraryContainer = document.querySelector(".custom-palette-wrapper");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");
const openAddBtn = document.querySelector(".add-color-btn");
const openAddContainer = document.querySelector(".open-add-container");
const openChangeContainer = document.querySelector(".open-change-container");
const closeAdd = document.querySelector(".close-add");
const closeChange = document.querySelector(".close-change");

//Event Listeners
//saveBtn.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
closeAdd.addEventListener("click", closeAddColor);
submitSave.addEventListener("click", savePalette);
openAddBtn.addEventListener("click", openAddColor);
//libraryBtn.addEventListener("click", openLibrary);
//closeLibraryBtn.addEventListener("click", closeLibrary);

function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add("active");
    popup.classList.add("active");
}

function openAddColor(e) {
    const popup = openAddContainer.children[0];
    openAddContainer.classList.add("active");
    popup.classList.add("active");
}

function closeAddColor(e) {
    const popup = openAddContainer.children[0];
    openAddContainer.classList.remove("active");
    popup.classList.add("remove");
}

function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove("active");
    popup.classList.add("remove");
}

libraryContainer.addEventListener(`dragstart`, (evt) => {
    evt.target.classList.add(`selected`);
});

libraryContainer.addEventListener(`dragend`, (evt) => {
    evt.target.classList.remove(`selected`);

    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    const customPalettes = document.querySelectorAll('.custom-palette');

    for (let index = 0; index < customPalettes.length; index++) {
        const paletteElem = customPalettes[index];
        paletteElem.setAttribute('nr', index);

        let name = paletteElem.querySelector('.color-title-cell').innerText
        let type = paletteElem.querySelector('.color-type-cell').innerText;
        let color = paletteElem.querySelector('.color-code-cell').innerText;
        let nr = paletteElem.getAttribute('nr');

        paletteObjects[nr].name = name;
        paletteObjects[nr].colorType = type;
        paletteObjects[nr].colors = [color];
    }

    localStorage.setItem("palettes", JSON.stringify(paletteObjects));

    hexToRgb();
    updateColor(r,g,b);
    updateRenderer();
});

const getNextElement = (cursorPosition, currentElement) => {
    const currentElementCoord = currentElement.getBoundingClientRect();
    const currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;
    
    const nextElement = (cursorPosition < currentElementCenter) ?
      currentElement :
      currentElement.nextElementSibling;
    
    return nextElement;
  };

libraryContainer.addEventListener(`dragover`, (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    const activeElement = libraryContainer.querySelector(`.selected`);
    const currentElement = evt.target.parentElement
    const isMoveable = activeElement !== currentElement &&
      currentElement.classList.contains(`custom-palette`);
      
    if (!isMoveable) {
      return;
    }

    const nextElement = getNextElement(evt.clientY, currentElement);

    if (nextElement && activeElement === nextElement.previousElementSibling || activeElement === nextElement) {
        return;
    }
          
    libraryContainer.insertBefore(activeElement, nextElement);
});

function savePalette(e) {
    saveContainer.classList.remove("active");
    popup.classList.remove("active");
    const name = saveInputName.value;
    const colorType = saveInputType.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    });
    //Generate Object
    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    if (paletteObjects) {
        paletteNr = paletteObjects.length;
    } else {
        paletteNr = savedPalettes.length;
    }

    const paletteObj = { name, colorType, colors, nr: paletteNr };
    savedPalettes.push(paletteObj);
    //Save to localStorage
    savetoLocal(paletteObj);
    saveInputName.value = "";
    //Generate the palette for Library
    const palette = document.createElement("div");
    palette.classList.add("custom-palette");
    palette.setAttribute('nr', paletteObj.nr);
    const title = document.createElement("h4");
    title.classList.add('color-title-cell');
    title.innerText = paletteObj.name;
    const type = document.createElement("h4");
    type.classList.add('color-type-cell');
    type.innerText = colorType;
    const preview = document.createElement("div");
    preview.classList.add("small-preview");
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    });
    const color = document.createElement("h4");
    color.classList.add('color-code-cell');
    color.innerHTML = paletteObj.colors

    //Attach event to the btn
    const paletteChangeBtn = document.createElement("button");
    paletteChangeBtn.classList.add("pick-palette-btn");
    paletteChangeBtn.classList.add("change-color");
    paletteChangeBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.8701 3.60447C13.0429 3.41283 13.2481 3.26081 13.4739 3.1571C13.6997 3.05338 13.9417 3 14.1861 3C14.4306 3 14.6726 3.05338 14.8984 3.1571C15.1242 3.26081 15.3293 3.41283 15.5022 3.60447C15.675 3.79611 15.8121 4.02362 15.9056 4.27401C15.9991 4.5244 16.0473 4.79277 16.0473 5.06379C16.0473 5.33481 15.9991 5.60317 15.9056 5.85356C15.8121 6.10395 15.675 6.33146 15.5022 6.5231L6.61905 16.3735L3 17.468L3.98701 13.4549L12.8701 3.60447Z" stroke="#8D8D8D" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    `;

    const paletteDeleteBtn = document.createElement("button");
    paletteDeleteBtn.classList.add("pick-palette-btn");
    paletteDeleteBtn.classList.add("delete-color");
    paletteDeleteBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M15 4H4L5.26923 16H13.7308L15 4ZM13.8887 5H5.11135L6.16904 15H12.831L13.8887 5Z" fill="#8D8D8D"/>
    <rect x="4" y="3" width="11" height="2" fill="#8D8D8D"/>
    </svg>
    `;

    //Attach event to the btn
    paletteDeleteBtn.addEventListener("click", e => {
        const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
        const findIndex = e.target.parentElement.getAttribute('nr');
        const colorRow = document.querySelector(`.custom-palette[nr="${findIndex}"]`);
        colorRow.remove();
        
        paletteObjects.splice(findIndex, 1);
        localStorage.setItem("palettes", JSON.stringify(paletteObjects));

        const customPalettes = document.querySelectorAll('.custom-palette');

        for (let index = 0; index < paletteObjects.length; index++) {
            const element = paletteObjects[index];
            element.nr = index;
        }

        for (let index = 0; index < customPalettes.length; index++) {
            const element = customPalettes[index];
            element.setAttribute('nr', index);
        }

        localStorage.setItem("palettes", JSON.stringify(paletteObjects));

        hexToRgb();
        updateColor(r,g,b);
        updateRenderer();
    });


    paletteChangeBtn.addEventListener("click", e => {
        const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
        const changePopup = document.querySelector('.open-add-container');
        changePopup.classList.add('active');
        const changePopupBtn = document.createElement("button");
        const savePopuBtn = document.querySelector('.submit-save');
        changePopupBtn.classList.add('change-color-btn');
        changePopupBtn.innerHTML = 'Изменить';
        changePopup.firstElementChild.appendChild(changePopupBtn);
        savePopuBtn.classList.add('disable');
        const nr = e.target.parentElement.getAttribute('nr');

        const currentPallete = document.querySelector(`.custom-palette[nr='${nr}']`);
        const currentPalleteColor = currentPallete.querySelector('.color-title-cell');
        const currentPalleteType = currentPallete.querySelector('.color-type-cell');
        const currentPalleteCode = currentPallete.querySelector('.color-code-cell');
        const currentPalletePreview = currentPallete.querySelector('.small-preview > div');

        const changePopupColorText = changePopup.querySelector('.color-hex');
        const changePopupColor = changePopup.querySelector('.color');

        saveInputName.value = currentPalleteColor.innerText;
        saveInputType.value = currentPalleteType.innerText;
        changePopupColorText.innerText = currentPalleteCode.innerText;
        changePopupColor.style.backgroundColor = currentPalleteCode.innerText;
        
        changePopupBtn.addEventListener("click", e => {
            const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
            const name = document.querySelector('.save-name').value;
            const type = document.querySelector('.save-type').value;
            const color = document.querySelector('.color-hex').innerText;
            paletteObjects[nr].name = name;
            paletteObjects[nr].colorType = type;
            paletteObjects[nr].colors = [color];
            localStorage.setItem("palettes", JSON.stringify(paletteObjects));
            currentPalleteColor.innerHTML = name;
            currentPalleteType.innerHTML = type;
            currentPalleteCode.innerHTML = [color];
            currentPalletePreview.style.backgroundColor = color;
            closeAddColor();
            changePopupBtn.remove();
            savePopuBtn.classList.remove('disable');
            saveInputName.value = "";
            saveInputType.value = "";

            hexToRgb();
            updateColor(r,g,b);
            updateRenderer();
        });
    });


    //Append to Library
    palette.appendChild(preview);
    palette.appendChild(title);
    palette.appendChild(type);
    palette.appendChild(color)
    palette.appendChild(paletteChangeBtn);
    palette.appendChild(paletteDeleteBtn);
    libraryContainer.appendChild(palette);

    const paletteElems = libraryContainer.querySelectorAll(`.custom-palette`);

    for (const palette of paletteElems) {
        palette.draggable = true;
    }

    closePalette();
}

function savetoLocal(paletteObj) {
    let localPalettes;
    if (localStorage.getItem("palettes") === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem("palettes"));
    }
    localPalettes.push(paletteObj);
    localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add("active");
    popup.classList.add("active");
}

function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove("active");
    popup.classList.remove("active");
}

function getLocal() {
    if (localStorage.getItem("palettes") === null) {
        //Local Palettes
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
        // *2

        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            //Generate the palette for Library
            const palette = document.createElement("div");
            palette.classList.add("custom-palette");
            palette.setAttribute('nr', paletteObj.nr);
            const title = document.createElement("h4");
            title.classList.add('color-title-cell');
            title.innerText = paletteObj.name;
            const type = document.createElement("h4");
            type.classList.add('color-type-cell');
            type.innerText = paletteObj.colorType;
            const preview = document.createElement("div");
            preview.classList.add("small-preview");
            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement("div");
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            });
            const color = document.createElement("h4");
            color.classList.add('color-code-cell');
            color.innerHTML = paletteObj.colors

            const paletteChangeBtn = document.createElement("button");
            paletteChangeBtn.classList.add("pick-palette-btn");
            paletteChangeBtn.classList.add("change-color");
            paletteChangeBtn.setAttribute('nr', paletteObj.nr);
            paletteChangeBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.8701 3.60447C13.0429 3.41283 13.2481 3.26081 13.4739 3.1571C13.6997 3.05338 13.9417 3 14.1861 3C14.4306 3 14.6726 3.05338 14.8984 3.1571C15.1242 3.26081 15.3293 3.41283 15.5022 3.60447C15.675 3.79611 15.8121 4.02362 15.9056 4.27401C15.9991 4.5244 16.0473 4.79277 16.0473 5.06379C16.0473 5.33481 15.9991 5.60317 15.9056 5.85356C15.8121 6.10395 15.675 6.33146 15.5022 6.5231L6.61905 16.3735L3 17.468L3.98701 13.4549L12.8701 3.60447Z" stroke="#8D8D8D" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            `;
        
            const paletteDeleteBtn = document.createElement("button");
            paletteDeleteBtn.classList.add("pick-palette-btn");
            paletteDeleteBtn.classList.add("delete-color");
            paletteDeleteBtn.setAttribute('nr', paletteObj.nr);
            paletteDeleteBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 4H4L5.26923 16H13.7308L15 4ZM13.8887 5H5.11135L6.16904 15H12.831L13.8887 5Z" fill="#8D8D8D"/>
            <rect x="4" y="3" width="11" height="2" fill="#8D8D8D"/>
            </svg>
            `;

            //Attach event to the btn
            paletteDeleteBtn.addEventListener("click", e => {
                const findIndex = e.target.parentElement.getAttribute('nr');
                const colorRow = document.querySelector(`.custom-palette[nr="${findIndex}"]`);
                colorRow.remove();
                
                paletteObjects.splice(findIndex, 1);
                localStorage.setItem("palettes", JSON.stringify(paletteObjects));

                const customPalettes = document.querySelectorAll('.custom-palette');

                for (let index = 0; index < paletteObjects.length; index++) {
                    const element = paletteObjects[index];
                    element.nr = index;
                }

                for (let index = 0; index < customPalettes.length; index++) {
                    const element = customPalettes[index];
                    element.setAttribute('nr', index);
                }

                localStorage.setItem("palettes", JSON.stringify(paletteObjects));

                hexToRgb();
                updateColor(r,g,b);
                updateRenderer();
            });

            paletteChangeBtn.addEventListener("click", e => {
                const changePopup = document.querySelector('.open-add-container');
                changePopup.classList.add('active');
                const changePopupBtn = document.createElement("button");
                const savePopuBtn = document.querySelector('.submit-save');
                changePopupBtn.classList.add('change-color-btn');
                changePopupBtn.innerHTML = 'Изменить';
                changePopup.firstElementChild.appendChild(changePopupBtn);
                savePopuBtn.classList.add('disable');
                const nr = e.target.parentElement.getAttribute('nr');
        
                const currentPallete = document.querySelector(`.custom-palette[nr='${nr}']`);
                const currentPalleteColor = currentPallete.querySelector('.color-title-cell');
                const currentPalleteType = currentPallete.querySelector('.color-type-cell');
                const currentPalleteCode = currentPallete.querySelector('.color-code-cell');
                const currentPalletePreview = currentPallete.querySelector('.small-preview > div');
        
                const changePopupColorText = changePopup.querySelector('.color-hex');
                const changePopupColor = changePopup.querySelector('.color');
        
                saveInputName.value = currentPalleteColor.innerText;
                saveInputType.value = currentPalleteType.innerText;
                changePopupColorText.innerText = currentPalleteCode.innerText;
                changePopupColor.style.backgroundColor = currentPalleteCode.innerText;
                
                changePopupBtn.addEventListener("click", e => {
                    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
                    const name = document.querySelector('.save-name').value;
                    const type = document.querySelector('.save-type').value;
                    const color = document.querySelector('.color-hex').innerText;
                    paletteObjects[nr].name = name;
                    paletteObjects[nr].colorType = type;
                    paletteObjects[nr].colors = [color];
                    localStorage.setItem("palettes", JSON.stringify(paletteObjects));
                    currentPalleteColor.innerHTML = name;
                    currentPalleteType.innerHTML = type;
                    currentPalleteCode.innerHTML = [color];
                    currentPalletePreview.style.backgroundColor = color;
                    closeAddColor();
                    changePopupBtn.remove();
                    savePopuBtn.classList.remove('disable');
                    saveInputName.value = "";
                    saveInputType.value = "";

                    hexToRgb();
                    updateColor(r,g,b);
                    updateRenderer();
                });
            });

            //Append to Library
            palette.appendChild(preview);
            palette.appendChild(title);
            palette.appendChild(type);
            palette.appendChild(color)
            palette.appendChild(paletteChangeBtn);
            palette.appendChild(paletteDeleteBtn);
            libraryContainer.appendChild(palette);

            const paletteElems = libraryContainer.querySelectorAll(`.custom-palette`);

            for (const palette of paletteElems) {
                palette.draggable = true;
            }
        });
    }
}

getLocal();
randomColors();