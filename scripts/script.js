/* SETTINGS */
const N = 10;   // number of rows and number of squares in a row - default: 10
const dimensions = '500px';  // height and width of the field - default: 500px

const battleships = 1;  // default: 1 battleship
const cruisers = 2;     // default: 2 cruisers
const destroyers = 3;   // default: 3 destroyers    // zero is not allowed - remove record from ships array instead
const submarines = 4;   // default: 4 submarines

const ships = [         // In masts decreasing order!
    [4, battleships],   // default: 4 masts for battleship
    [3, cruisers],      // default: 3 masts for cruiser
    [2, destroyers],    // default: 2 masts for destroyer
    [1, submarines],    // default: 1 mast for submarine 
];

/* HTML structure */
const body = document.body;
const menu = document.createElement('div');
const gameField = document.createElement('div');
const userField = document.createElement('div');
const aiField = document.createElement('div');
const fieldWrapper = document.createElement('div');
const randomPlacementButton = document.createElement('a');
const startButton = document.createElement('a');
const resetGameButton = document.createElement('a');
const information = document.createElement('h3');
const textYou = document.createElement('h2');
const textAi = document.createElement('h2');
const playerMastsDestroyed = document.createElement('h2');
const aiMastsDestroyed = document.createElement('h2');

let countOfShips = 0;
for (let i = 0; i < ships.length; i++) {
    countOfShips += ships[i][0]*ships[i][1];
}

menu.id = 'menu';
gameField.id = 'game-field';
randomPlacementButton.innerText = 'RANDOM PLACEMENT';
startButton.innerText = 'START';
resetGameButton.innerText = 'RESET GAME';
randomPlacementButton.classList.add('btn');
startButton.classList.add('btn', 'disabled');
textYou.innerText = 'Your field';
textAi.innerText = `AI's field`;
playerMastsDestroyed.classList.add('masts-count');
aiMastsDestroyed.classList.add('masts-count');
resetGameButton.classList.add('btn', 'disabled');
playerMastsDestroyed.innerText = `masts destroyed: 0/${countOfShips}`;
aiMastsDestroyed.innerText = `masts destroyed: 0/${countOfShips}`;
information.innerText = 'Place your ships or choose "Random placement". When ready click "START".'
fieldWrapper.classList.add('wrapper');
userField.style.width = dimensions;
userField.style.height = dimensions;
aiField.style.width = dimensions;
aiField.style.height = dimensions;

body.appendChild(menu);
body.appendChild(gameField);
menu.appendChild(startButton);
menu.appendChild(randomPlacementButton);
menu.appendChild(resetGameButton);
createShipsInMenu();
gameField.appendChild(information);
gameField.appendChild(textYou);
gameField.appendChild(textAi);
gameField.appendChild(fieldWrapper);
fieldWrapper.appendChild(userField);
fieldWrapper.appendChild(aiField);
gameField.appendChild(playerMastsDestroyed);
gameField.appendChild(aiMastsDestroyed);

/* fill up userField and aiField with squares */
fillWithSquares(userField);
fillWithSquares(aiField);
document.querySelectorAll('.square').forEach((element) => {
    element.style.fontSize = parseInt(dimensions) / N - 10 + 'px';
});

/* initialize representation of created fields */
let userFieldArray = initializeArray();
let aiFieldArray = initializeArray();

/* events */
let placedRandomly = false,
listenerHighlightShipIsActive = true,
listenerPlaceShipIsActive = false,
listenerStartButtonIsActive = false,
listenerRandomPlacementButtonIsActive = false,
direction = 0,
playersHits = 0,
aiHits = 0;

// AI variables - intelligent shot
// deep copy an array
let aiAvailableShipsArray = [];
for (let i = 0; i < ships.length; i++) {
    aiAvailableShipsArray.push([]);
    for (let j = 0; j < ships[i].length; j++) {
        aiAvailableShipsArray[i].push(ships[i][j]);
    }
}

let aiPerspectiveArray = initializeArray(),
aiChooseRandomly = true,
squaresHit = 1,
nextCheck = 0,
goToFirstSquareHit = false,
firstSquareHitX, firstSquareHitY, lastSquareHitX, lastSquareHitY,
aiDirectionOfDetectedShip, aiDirectionOfShipIsDetected = false;

let highlightThisShip = function() { highlightShip(this); };

let rotateThisShip = function(event) {   // right mouse button
    event.preventDefault();
    if (direction == 0)
        direction = 1;
    else
        direction = 0;
    if (listenerPlaceShipIsActive == true) {
        this.removeEventListener('click', placeThisShip);
        listenerPlaceShipIsActive = false;
    }
    highlightShip(this);
};

let placeRandomShips = () => {
    userFieldArray = randomPlacement();
    updateField(userField, userFieldArray);
    placedRandomly = true;

    body.querySelectorAll('#menu > div').forEach((element) => {
        element.classList.add('menu-wrapper');
        element.style.display = 'block';
    });

    if (listenerHighlightShipIsActive == true) {
        userField.querySelectorAll('.square').forEach((element) => {
            element.removeEventListener('mouseover', highlightThisShip);
            element.removeEventListener('contextmenu', rotateThisShip);
            element.removeEventListener('mouseout', removeHighlightFromField);
        });
        listenerHighlightShipIsActive = false;
    }

    /* start button */
    if (listenerStartButtonIsActive == false) {
        startButton.classList.remove('disabled');
        startButton.addEventListener('click', startGame);
        listenerStartButtonIsActive = true;
    }
};

let removeHighlightFromField = function() {
    userFieldArray.forEach((element) => {
        element.forEach((object) => {
            object.highlightedGreen = false;
            object.highlightedRed = false;
        });
    });
    updateField(userField, userFieldArray);

    if (listenerPlaceShipIsActive == true) {
        this.removeEventListener('click', placeThisShip);
        listenerPlaceShipIsActive = false;
    }
}

let placeThisShip = function() { placeShip(this); };

userField.querySelectorAll('.square').forEach((element) => {
    element.addEventListener('mouseover', highlightThisShip);
    element.addEventListener('contextmenu', rotateThisShip);  // right mouse button
    element.addEventListener('mouseout', removeHighlightFromField);
});

let playerShootThis = function() { playerShoot(this); }

/* random placement button */
if (listenerRandomPlacementButtonIsActive == false) {
    randomPlacementButton.addEventListener('click', placeRandomShips);
    listenerRandomPlacementButtonIsActive = true;
}

/////////////////////////////////////////////////////////////
// <--------------------- FUNCTIONS ---------------------> //
/////////////////////////////////////////////////////////////

function fillWithSquares(field) {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let div = document.createElement('div');
            div.id = 'yx' + i.toString() + '-' + j.toString();
            div.classList.add('square');
            div.style.width = parseInt(dimensions) / N + 'px';
            div.style.height = parseInt(dimensions) / N + 'px';
            field.appendChild(div);
        }
    }
}

function initializeArray() {
    let array = [];
    for (let i = 0; i < N + 2; i++) {
        array.push([]);
        for (let j = 0; j < N + 2; j++) {
            if (i == 0 || i == N + 1 || j == 0 || j == N + 1)
                array[i].push({ mast: false, available: false, buffer: true, highlightedRed: false, highlightedGreen: false, shotDown: false });
            else
                array[i].push({ mast: false, available: true, buffer: false, highlightedRed: false, highlightedGreen: false, shotDown: false });
        }
    }
    return array;
}

function randomPlacement() {
    let array = initializeArray();
    if (menu.querySelector('.menu-wrapper-active'))
        menu.querySelector('.menu-wrapper-active').classList.remove('menu-wrapper-active');

    let x, y, direction, confirmation;
    for (let i = 0; i < ships.length; i++) {
        for (let j = 0; j < ships[i][1]; j++) {
            do {
                x = Math.floor((Math.random() * N) + 1);    // random number from 1 to N
                y = Math.floor((Math.random() * N) + 1);    // random number from 1 to N
                direction = Math.floor(Math.random() * 2);  // 0 - horizontal or 1 - vertical
                confirmation = true;
                if (direction == 0)
                    for (let k = x; k < x + ships[i][0]; k++) {
                        if (array[y][k].available == false) { 
                            confirmation = false;
                            break;
                        }
                    }
                else
                    for (let k = y; k < y + ships[i][0]; k++) {
                        if (array[k][x].available == false) { 
                            confirmation = false;
                            break;
                        }
                    }
            } while (confirmation == false)

            if (direction == 0) {
                array[y][x - 1].available = false; array[y][x + ships[i][0]].available = false;
                array[y - 1][x - 1].available = false; array[y - 1][x + ships[i][0]].available = false;
                array[y + 1][x - 1].available = false; array[y + 1][x + ships[i][0]].available = false;

                for (let k = x; k < x + ships[i][0]; k++) {
                    array[y][k].mast = true;
                    array[y][k].available = false;
                    array[y - 1][k].available = false;
                    array[y + 1][k].available = false;
                }
            }
            else {
                array[y - 1][x].available = false; array[y + ships[i][0]][x].available = false;
                array[y - 1][x - 1].available = false; array[y + ships[i][0]][x - 1].available = false;
                array[y - 1][x + 1].available = false; array[y + ships[i][0]][x + 1].available = false;

                for (let k = y; k < y + ships[i][0]; k++) {
                    array[k][x].mast = true;
                    array[k][x].available = false;
                    array[k][x + 1].available = false;
                    array[k][x - 1].available = false;
                }
            }
        }
    }
    return array;
}

function updateField(field, array) {
    let elementToUpdate;
    for (let i = 1; i < N + 1; i++) {
        for (let j = 1; j < N + 1; j++) {
            elementToUpdate = field.querySelector('#yx' + (i - 1).toString() + '-' + (j - 1).toString());

            if (array[i][j].mast == true)
                elementToUpdate.classList.add('mast');
            else
                elementToUpdate.classList.remove('mast');

            if (array[i][j].highlightedGreen == true)
                elementToUpdate.classList.add('highlighted-green');
            else
                elementToUpdate.classList.remove('highlighted-green');

            if (array[i][j].highlightedRed == true)
                elementToUpdate.classList.add('highlighted-red');
            else
                elementToUpdate.classList.remove('highlighted-red');
        }
    }
}

function createShipsInMenu() {
    let wrapper, mast;
    for (let i = 0; i < ships.length; i++) {
        for (let j = 0; j < ships[i][1]; j++) {
            wrapper = document.createElement('div');
            for (let k = 0; k < ships[i][0]; k++) {
                mast = document.createElement('div');
                mast.classList.add('menu-mast');
                wrapper.appendChild(mast);
            }
            wrapper.classList.add('menu-wrapper');
            if (i == 0 && j == 0) wrapper.classList.add('menu-wrapper-active');

            function addColor() {
                this.style.backgroundColor = 'rgb(0, 150, 0)';
            }

            function removeColor() {
                this.style.backgroundColor = 'gray';
            }

            function markShip() {
                if (listenerStartButtonIsActive == true) {
                    startButton.classList.add('disabled');
                    startButton.removeEventListener('click', startGame);
                    listenerStartButtonIsActive = false;
                }

                if (menu.querySelector('.menu-wrapper-active'))
                    menu.querySelector('.menu-wrapper-active').classList.remove('menu-wrapper-active');
                this.classList.add('menu-wrapper-active');

                if (placedRandomly == true) {
                    userFieldArray = initializeArray();
                    updateField(userField, userFieldArray);
                    placedRandomly = false;
                }

                if (listenerHighlightShipIsActive == false) {
                    userField.querySelectorAll('.square').forEach((element) => {
                        element.addEventListener('mouseover', highlightThisShip);
                        element.addEventListener('contextmenu', rotateThisShip);
                        element.addEventListener('mouseout', removeHighlightFromField);
                    });
                    listenerHighlightShipIsActive = true;
                }
            }

            wrapper.addEventListener('mouseover', addColor);
            wrapper.addEventListener('mouseout', removeColor);
            wrapper.addEventListener('click', markShip);

            menu.appendChild(wrapper);
        }
    }
}

function highlightShip(square) {
    userFieldArray.forEach((element) => {
        element.forEach((object) => {
            object.highlightedGreen = false;
            object.highlightedRed = false;
        });
    });

    let canBePlaced = true;
    let masts = menu.querySelector('.menu-wrapper-active').children.length;
    let y = idToYX(square.id)[0];
    let x = idToYX(square.id)[1];

    if (direction == 0) {
        for (let i = 0, pos = x; i < masts; i++, pos++) {
            if (userFieldArray[y][pos].buffer == true) {          // if reached the edge
                pos -= masts + 1;
                i--;
            }
            else
                userFieldArray[y][pos].highlightedGreen = true;
        }
    }
    else {
        for (let i = 0, pos = y; i < masts; i++, pos++) {
            if (userFieldArray[pos][x].buffer == true) {         // if reached the edge
                pos -= masts + 1;
                i--;
            }
            else
                userFieldArray[pos][x].highlightedGreen = true;
        }
    }

    userFieldArray.forEach((element) => {
        element.forEach((object) => {
            if (object.highlightedGreen == true && object.available == false)
                canBePlaced = false;
        });
    });

    if (canBePlaced == false) {   // highlight on red
        userFieldArray.forEach((element) => {
            element.forEach((object) => {
                if (object.highlightedGreen == true) {
                    object.highlightedGreen = false;
                    object.highlightedRed = true;
                }
            });
        });
    }
    else {
        if (listenerPlaceShipIsActive == false) {
            square.addEventListener('click', placeThisShip);
            listenerPlaceShipIsActive = true;
        }
    }

    updateField(userField, userFieldArray);
}

function placeShip(square) {
    if (listenerPlaceShipIsActive == true) {
        square.removeEventListener('click', placeThisShip);
        listenerPlaceShipIsActive = false;
    }

    userFieldArray.forEach((element, i) => {
        element.forEach((object, j) => {
            if (object.highlightedGreen == true) {
                object.mast = true;
                object.highlightedGreen = false;
                object.available = false;
                userFieldArray[i - 1][j - 1].available = false;
                userFieldArray[i - 1][j].available = false;
                userFieldArray[i - 1][j + 1].available = false;
                userFieldArray[i][j - 1].available = false;
                userFieldArray[i][j + 1].available = false;
                userFieldArray[i + 1][j - 1].available = false;
                userFieldArray[i + 1][j].available = false;
                userFieldArray[i + 1][j + 1].available = false;
            }
        });
    });
    updateField(userField, userFieldArray);

    if (menu.querySelector('.menu-wrapper-active')) {
        menu.querySelector('.menu-wrapper-active').style.display = 'none';
        menu.querySelector('.menu-wrapper-active').classList.remove('menu-wrapper', 'menu-wrapper-active');
    }
    if (menu.querySelector('.menu-wrapper'))
        menu.querySelector('.menu-wrapper').classList.add('menu-wrapper-active');

    // if all ships are placed
    else {
        if (listenerHighlightShipIsActive == true) {
            userField.querySelectorAll('.square').forEach((element) => {
                element.removeEventListener('mouseover', highlightThisShip);
                element.removeEventListener('contextmenu', rotateThisShip);
                element.removeEventListener('mouseout', removeHighlightFromField);
            });
            listenerHighlightShipIsActive = false;
        }
        if (listenerStartButtonIsActive == false) {
            startButton.classList.remove('disabled');
            startButton.addEventListener('click', startGame);
            listenerStartButtonIsActive = true;
        }
    }
}

function startGame() {
    /* disabling stuff */
    if (listenerRandomPlacementButtonIsActive == true) {
        randomPlacementButton.classList.add('disabled');
        randomPlacementButton.removeEventListener('click', placeRandomShips);
        listenerRandomPlacementButtonIsActive = false;
    }
    if (listenerStartButtonIsActive == true) {
        startButton.classList.add('disabled');
        startButton.removeEventListener('click', startGame);
        listenerStartButtonIsActive = false;
    }
    menu.querySelectorAll('.menu-wrapper').forEach((element) => {
        element.style.display = 'none';
    });


    /* actual start */
    information.innerText = 'AI is placing ships...'
    setTimeout(() => {
        aiFieldArray = randomPlacement();
        enableShooting();
    }, 3000)
}

function enableShooting() {
    information.innerText = 'Your turn. Shoot!';
    resetGameButton.classList.remove('disabled');
    resetGameButton.addEventListener('click', resetGame);

    aiField.querySelectorAll('.square').forEach((element) => {
        let y = idToYX(element.id)[0];
        let x = idToYX(element.id)[1];
        if (aiFieldArray[y][x].shotDown == false) {
            element.addEventListener('click', playerShootThis);
            element.style.cursor = 'crosshair';
        }
    });
}

function disableShooting() {
    information.innerText = `AI is shooting...`;
    resetGameButton.classList.add('disabled');
    resetGameButton.removeEventListener('click', resetGame);

    aiField.querySelectorAll('.square').forEach((element) => {
        let y = idToYX(element.id)[0];
        let x = idToYX(element.id)[1];
        if (aiFieldArray[y][x].shotDown == false) {
            element.removeEventListener('click', playerShootThis);
            element.style.cursor = 'default';
        }
    });
}

function playerShoot(square) {
    square.removeEventListener('click', playerShootThis);
    square.style.cursor = 'default';
   
    let y = idToYX(square.id)[0];
    let x = idToYX(square.id)[1];
    
    aiFieldArray[y][x].shotDown = true;
    
    if (aiFieldArray[y][x].mast == true) {  // hit
        square.innerHTML = 'X';
        playersHits++;
        handleMastsHits(aiMastsDestroyed, playersHits);
    }
    else {                                  // miss
        square.innerHTML = '&sdot;';
        disableShooting();
        aiShoot();
    }
}

function aiShoot() {
    setTimeout(() => {
        // random shot
        if (aiChooseRandomly == true) {
            let x, y;
            goToFirstSquareHit = false;
            aiDirectionOfShipIsDetected = false;

            do {
                x = Math.floor((Math.random() * N) + 1);
                y = Math.floor((Math.random() * N) + 1);
            } while(aiPerspectiveArray[y][x].available == false);
            
            aiPerspectiveArray[y][x].available = false;

            let square = userField.querySelector('#yx' + (y - 1).toString() + '-' + (x - 1).toString());

            if (userFieldArray[y][x].mast == true) {  // hit
                aiPerspectiveArray[y][x].mast = true;
                square.innerHTML = 'X';
                aiHits++;
                handleMastsHits(playerMastsDestroyed, aiHits);
                if (aiHits != countOfShips) {
                    if (aiAvailableShipsArray[0][0] == 1) {   // if only one mast ships are left
                        aiChooseRandomly = true;
                        updateAvailable(aiPerspectiveArray);  // update after shooting down a ship
                    }
                    else {
                        aiChooseRandomly = false;
                        firstSquareHitX = x;
                        firstSquareHitY = y;
                        lastSquareHitX = x;
                        lastSquareHitY = y;
                    }
    
                    aiShoot();
                }
            }
            else {                                  // miss
                square.innerHTML = '&sdot;';
                enableShooting();
            }
        }

        // intelligent shot - after a hit and before destroying a ship
        else {
            // nextCheck: top - 1, right - 2, bottom - 3, left - 4 of the lastSquareHit
            if (aiDirectionOfShipIsDetected == true) {
                if (aiDirectionOfDetectedShip == 1) {   // vertical ship
                    if (nextCheck == 1) {
                        if (aiPerspectiveArray[lastSquareHitY - 1][lastSquareHitX].available == false) {
                            nextCheck = 3;
                            goToFirstSquareHit = true;
                        }
                    }
                    else {
                        if (aiPerspectiveArray[lastSquareHitY + 1][lastSquareHitX].available == false) {
                            shipIsDestroyed();
                        }
                    }
                }
                else {                                  // horizontal ship
                    if (nextCheck == 2) {
                        if (aiPerspectiveArray[lastSquareHitY][lastSquareHitX + 1].available == false) {
                            nextCheck = 4;
                            goToFirstSquareHit = true;
                        }
                    }
                    else {
                        if (aiPerspectiveArray[lastSquareHitY][lastSquareHitX - 1].available == false) {
                            shipIsDestroyed();
                        }
                    }
                }
            }
            else {
                nextCheck++;
            }

            if (nextCheck == 1)
                makeAnIntelligentShot(nextCheck);

            if (nextCheck == 2)
                makeAnIntelligentShot(nextCheck);

            if (nextCheck == 3) {
                if (goToFirstSquareHit == true)
                    makeAnIntelligentShotFirstSquare(nextCheck);
                else
                    makeAnIntelligentShot(nextCheck);
            }

            if (nextCheck == 4) {
                if (goToFirstSquareHit == true)
                    makeAnIntelligentShotFirstSquare(nextCheck);
                else
                    makeAnIntelligentShot(nextCheck);
            }

            if (nextCheck > 4) {
                shipIsDestroyed();
            }
        }
    }, 1000);
}

function updateAvailable(array) {
    array.forEach((element, i) => {
        element.forEach((element, j) => {
            if (element.mast == true) {
                array[i][j].available = false;
                array[i - 1][j - 1].available = false;
                array[i - 1][j].available = false;
                array[i - 1][j + 1].available = false;
                array[i][j - 1].available = false;
                array[i][j + 1].available = false;
                array[i + 1][j - 1].available = false;
                array[i + 1][j].available = false;
                array[i + 1][j + 1].available = false;
            }
        });
    });
}

function makeAnIntelligentShot(ShotDirection) {
    let square, currentSquareCoordinatesY, currentSquareCoordinatesX;

    if (ShotDirection == 1) {
        square = userField.querySelector('#yx' + (lastSquareHitY - 2).toString() + '-' + (lastSquareHitX - 1).toString());
        currentSquareCoordinatesY = lastSquareHitY - 1; currentSquareCoordinatesX = lastSquareHitX;
    }
    else if (ShotDirection == 2) {
        square = userField.querySelector('#yx' + (lastSquareHitY - 1).toString() + '-' + (lastSquareHitX).toString());
        currentSquareCoordinatesY = lastSquareHitY; currentSquareCoordinatesX = lastSquareHitX + 1;
    }
    else if (ShotDirection == 3) {
        square = userField.querySelector('#yx' + (lastSquareHitY).toString() + '-' + (lastSquareHitX - 1).toString());
        currentSquareCoordinatesY = lastSquareHitY + 1; currentSquareCoordinatesX = lastSquareHitX;
    }
    else if (ShotDirection == 4) {
        square = userField.querySelector('#yx' + (lastSquareHitY - 1).toString() + '-' + (lastSquareHitX - 2).toString());
        currentSquareCoordinatesY = lastSquareHitY; currentSquareCoordinatesX = lastSquareHitX - 1;
    }

    if (aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available == true) {
        if (userFieldArray[currentSquareCoordinatesY][currentSquareCoordinatesX].mast == true) {  // hit
            square.innerHTML = 'X';
            aiHits++;
            handleMastsHits(playerMastsDestroyed, aiHits);
            if (aiHits != countOfShips) {
                squaresHit++;
                aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].mast = true;
                aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available = false;
                if (ShotDirection == 1 || ShotDirection == 3)
                    aiDirectionOfDetectedShip = 1;
                else
                    aiDirectionOfDetectedShip = 0;
                aiDirectionOfShipIsDetected = true;
                if (aiAvailableShipsArray[0][0] == squaresHit) {  // if destroyed the largest ship
                    let countOfLargestShip = aiAvailableShipsArray[0][1];
                    countOfLargestShip--;
                    if (countOfLargestShip == 0) aiAvailableShipsArray.shift();
                    aiChooseRandomly = true;
                    squaresHit = 1;
                    nextCheck = 0;
                    aiDirectionOfShipIsDetected = false;
                    updateAvailable(aiPerspectiveArray);
                }
                if (ShotDirection == 1)
                    lastSquareHitY--;
                else if (ShotDirection == 2)
                    lastSquareHitX++;
                else if (ShotDirection == 3)
                    lastSquareHitY++;
                else if (ShotDirection == 4)
                    lastSquareHitX--;
        
                aiShoot();
            }
        }
        else {  // miss
            square.innerHTML = '&sdot;';
            aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available = false;
            if (squaresHit > 1)
                goToFirstSquareHit = true;
            enableShooting();
        }
    }
    else {
        nextCheck++;
    }
}

function makeAnIntelligentShotFirstSquare(ShotDirection) {
    let square, currentSquareCoordinatesY, currentSquareCoordinatesX;

    if (ShotDirection == 3) {
        square = userField.querySelector('#yx' + (firstSquareHitY).toString() + '-' + (firstSquareHitX - 1).toString());
        currentSquareCoordinatesY = firstSquareHitY + 1; currentSquareCoordinatesX = firstSquareHitX;
    }
    else if (ShotDirection == 4) {
        square = userField.querySelector('#yx' + (firstSquareHitY - 1).toString() + '-' + (firstSquareHitX - 2).toString());
        currentSquareCoordinatesY = firstSquareHitY; currentSquareCoordinatesX = firstSquareHitX - 1;
    }

    if (aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available == true) {
        if (userFieldArray[currentSquareCoordinatesY][currentSquareCoordinatesX].mast == true) {  // hit
            square.innerHTML = 'X';
            aiHits++;
            handleMastsHits(playerMastsDestroyed, aiHits);
            if (aiHits != countOfShips) {
                squaresHit++;
                aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].mast = true;
                aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available = false;
                goToFirstSquareHit = false;

                if (aiAvailableShipsArray[0][0] == squaresHit) {  // if destroyed the largest ship
                    let countOfLargestShip = aiAvailableShipsArray[0][1];
                    countOfLargestShip--;
                    if (countOfLargestShip == 0) aiAvailableShipsArray.shift();
                    aiChooseRandomly = true;
                    squaresHit = 1;
                    nextCheck = 0;
                    aiDirectionOfShipIsDetected = false;
                    updateAvailable(aiPerspectiveArray);
                }
                
                if (ShotDirection == 3)
                    lastSquareHitY = currentSquareCoordinatesY;
                else
                    lastSquareHitX = currentSquareCoordinatesX;
                aiShoot();
            }
        }
        else {  // miss
            // ship is destroyed but player shoots
            for (let i = 0; i < aiAvailableShipsArray.length; i++) {
                if (aiAvailableShipsArray[i][0] == squaresHit)
                    if (aiAvailableShipsArray[i][1] == 1)
                        aiAvailableShipsArray.splice(i, 1);
                    else
                        aiAvailableShipsArray[i][1]--;
            }
            aiChooseRandomly = true;
            squaresHit = 1;
            nextCheck = 0;
            aiDirectionOfShipIsDetected = false;
            updateAvailable(aiPerspectiveArray);

            square.innerHTML = '&sdot;';
            aiPerspectiveArray[currentSquareCoordinatesY][currentSquareCoordinatesX].available = false;
            enableShooting();
        }
    }
    else {
        shipIsDestroyed();
    }
}

function shipIsDestroyed() {
    for (let i = 0; i < aiAvailableShipsArray.length; i++) {
        if (aiAvailableShipsArray[i][0] == squaresHit)
            if (aiAvailableShipsArray[i][1] == 1)
                aiAvailableShipsArray.splice(i, 1);
            else
                aiAvailableShipsArray[i][1]--;
    }
    aiChooseRandomly = true;
    squaresHit = 1;
    nextCheck = 0;
    aiDirectionOfShipIsDetected = false;
    updateAvailable(aiPerspectiveArray);
    aiShoot();
}

function idToYX(id) {
    let y = parseInt(id.substring(2, id.indexOf('-'))) + 1;
    let x = parseInt(id.substr(id.indexOf('-') + 1)) + 1;
    let arr = [y, x];
    return arr;
}

function handleMastsHits(element, count) {
    element.innerText = `masts destroyed: ${count}/${countOfShips}`;

    // if someone wins
    if (aiHits == countOfShips) {
        information.innerText = `Ai won!`;
        resetGameButton.classList.remove('disabled');
        resetGameButton.addEventListener('click', resetGame);
        updateField(aiField, aiFieldArray);
    }
    else if (playersHits == countOfShips) {
        disableShooting();
        information.innerText = `Player won!`;
        resetGameButton.classList.remove('disabled');
        resetGameButton.addEventListener('click', resetGame);
        updateField(aiField, aiFieldArray);
    }
}

function resetGame() {
    disableShooting();
    information.innerText = 'Resetting the game...';

    setTimeout(() => {
        information.innerText = 'Place your ships or choose "Random placement". When ready click "START".';
        playerMastsDestroyed.innerText = `masts destroyed: 0/${countOfShips}`;
        aiMastsDestroyed.innerText = `masts destroyed: 0/${countOfShips}`;
    
        body.querySelectorAll('#menu > div').forEach((element, index) => {
            element.classList.add('menu-wrapper');
            element.style.display = 'block';
            if (index == 0)
                element.classList.add('menu-wrapper-active');
        });
    
    
        /* initialize representation of created fields */
        userFieldArray = initializeArray();
        aiFieldArray = initializeArray();
    
        updateField(userField, userFieldArray);
        updateField(aiField, aiFieldArray);
    
        userField.querySelectorAll('.square').forEach((element) => {
            element.innerText = '';
        });
        aiField.querySelectorAll('.square').forEach((element) => {
            element.innerText = '';
        });
        
        /* events */
        placedRandomly = false;
        listenerHighlightShipIsActive = true;
        listenerPlaceShipIsActive = false;
        listenerStartButtonIsActive = false;
        listenerRandomPlacementButtonIsActive = false;
        direction = 0;
        playersHits = 0;
        aiHits = 0;
    
        // AI variables - intelligent shot
        // deep copy an array
        aiAvailableShipsArray = [];
        for (let i = 0; i < ships.length; i++) {
            aiAvailableShipsArray.push([]);
            for (let j = 0; j < ships[i].length; j++) {
                aiAvailableShipsArray[i].push(ships[i][j]);
            }
        }

        aiPerspectiveArray = initializeArray();
        aiChooseRandomly = true;
        squaresHit = 1;
        nextCheck = 0;
        goToFirstSquareHit = false;
        aiDirectionOfShipIsDetected = false;
        
        userField.querySelectorAll('.square').forEach((element) => {
            element.addEventListener('mouseover', highlightThisShip);
            element.addEventListener('contextmenu', rotateThisShip);
            element.addEventListener('mouseout', removeHighlightFromField);
        });
    
        if (listenerRandomPlacementButtonIsActive == false) {
            randomPlacementButton.classList.remove('disabled');
            randomPlacementButton.addEventListener('click', placeRandomShips);
            listenerRandomPlacementButtonIsActive = true;
        }
    }, 3000);
}