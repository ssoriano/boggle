const _ = require("lodash");
const Database = require('./database');

const getActiveBoard = () => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT id, name_sp AS name, matrix FROM board WHERE status='active'", 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0]);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}

const insertBoard = (matrix, status) => {
    return new Promise((resolve, reject) => {
        Database.pool.query('INSERT INTO board (matrix, status) VALUES ($1, $2) RETURNING id, name_sp as name, matrix', 
        [matrix, status], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0]);
        });
    })
    .catch((err) => { 
        console.log(err);
    })
}

const updateBoardStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        Database.pool.query('UPDATE board SET status = $1 WHERE id = $2 RETURNING id',
        [status, id],
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0])
        });
    })
    .catch((err) => { 
        console.log(err);
    })
}

const getPlayerResults = (board_id, player) => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT player, COUNT(word) AS num_words, SUM(score) AS score FROM player_board WHERE board_id = $1 AND player = $2 GROUP BY board_id, player", 
        [board_id, player], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0]);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}


const getPlayerWordList = (board_id, player) => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT word, score FROM player_board WHERE board_id = $1 AND player = $2", 
        [board_id, player], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}

const playingBoard = (board_id, player) => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT DISTINCT board_id, player FROM player_board WHERE board_id = $1 AND player = $2", 
        [board_id, player], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0]);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}

const getAllScores = (board_id) => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT player, SUM(score) AS score FROM player_board WHERE board_id = $1 GROUP BY board_id, player ORDER BY SUM(score) DESC", 
        [board_id], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}

const randInt = (max = 10) => { //generates a random int from 1 to 10
    return (Math.floor(Math.random() * Math.floor(max)) + 1);
}

/*const generateRandomLetter = (rowNum, colNum) => {
    const vowels = ['a','e','i','o','u'];
    const consonants = ['b','c','d','f','g','h','j','k','l','m','n','ñ','p','q','r','s','t','v','w','x','y','z'];
    const easyConsonants = ['b','c','d','f','g','h','l','m','n','p','r','s','t','v','z'];
    const middleConsonants = ['r','s'];
    const hardConsonants = ['j','k','q','ñ','w','x','y'];

    let generateVowel = null;
    
    if ((rowNum + 1) % 2 !== 0) {
        generateVowel = ((colNum + 1) % 2 !== 0) ? true : false;
    }
    else {
        generateVowel = ((colNum + 1) % 2 !== 0) ? false : true;
    }
    
    if (generateVowel) {
        if (randInt() <= 8) {
            const rnd = randInt();
            if (rnd <= 2) return vowels[0];
            if (rnd <= 4) return vowels[1];
            if (rnd <= 6) return vowels[2];
            if (rnd <= 8) return vowels[3];
            if (rnd <= 10) return vowels[4];
        }
        return _.sample(middleConsonants);
    }
    else {
        return (Math.random() <= 9) ?  _.sample(easyConsonants) : _.sample(hardConsonants);
    }
}*/

const generateRandomLetter = (rowNum, colNum, specialCoords) => {
    const vowels = ['a','e','i','o','u'];
    const consonants = ['b','c','d','f','g','h','j','k','l','m','n','ñ','p','q','r','s','t','v','w','x','y','z'];
    const easyConsonants = ['b','c','d','f','g','h','m','n','p','s','t','v','z'];
    const middleConsonants = ['r','l'];
    const combineConsonants = ['b','c','d','f','g','p','t'];
    const hardConsonants = ['j','k','q','ñ','w','x','y'];
    
    console.log("specialCoords:", specialCoords);
    
    if (specialCoords && specialCoords.length > 0) {
        for (const specialCoord of specialCoords) {
            if ((specialCoord.row === rowNum) && (specialCoord.col === colNum)) {
                if (specialCoord.status === "start") return _.sample(combineConsonants);
                if (specialCoord.status === "middle") return _.sample(middleConsonants);
                if (specialCoord.status === "end") return _.sample(vowels);
            }
        }
    }
    
    
    let generateVowel = null;
    if ((rowNum + 1) % 2 !== 0) {
        generateVowel = ((colNum + 1) % 2 !== 0) ? true : false;
    }
    else {
        generateVowel = ((colNum + 1) % 2 !== 0) ? false : true;
    }
    
    if (generateVowel) {
        const rnd = randInt();
        if (rnd <= 2) return vowels[0];
        if (rnd <= 4) return vowels[1];
        if (rnd <= 6) return vowels[2];
        if (rnd <= 9) return vowels[3];
        if (rnd <= 10) return vowels[4];
    }
    else {
        return (Math.random() <= 9) ?  _.sample(easyConsonants) : _.sample(hardConsonants);
    }
}

const generateRndNeighbourCoord = (row, col, itemsPerRow, itemsPerCol, status, specialCoords) => {
    if (row === 0) {
        if (col === 0) {
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
        
        else if (col === (itemsPerCol - 1)) {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
        
        else {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
    }
    
    if (row > 0 && row < (itemsPerRow - 1)) {
        if (col === 0) {
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
        
        else if (col === (itemsPerCol - 1)) {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
        
        else {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
            if (!_.find(specialCoords, {row: row + 1, col: col})) return { row: row + 1, col: col, status: status }; //down
        }
    }
    
    if (row === (itemsPerRow - 1)) {
        if (col === 0) {
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
        }
        
        else if (col === (itemsPerCol - 1)) {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
        }
        
        else {
            if (!_.find(specialCoords, {row: row, col: col - 1})) return { row: row, col: col - 1, status: status }; //left
            if (!_.find(specialCoords, {row: row, col: col + 1})) return { row: row, col: col + 1, status: status }; //right
            if (!_.find(specialCoords, {row: row - 1, col: col})) return { row: row - 1, col: col, status: status }; //top
        }
    }
}

const generateMatrix = (itemsPerRow = 4, itemsPerCol = 4) => {
    let coordsRnd = [];
    let point1 = { row: randInt(itemsPerRow/2) - 1, col: randInt(itemsPerCol) - 1, status: "start" };
    let point2 = { row: randInt(itemsPerRow/2) + (itemsPerRow/2) - 1, col: randInt(itemsPerCol) - 1, status: "start" };
    coordsRnd.push(point1);
    coordsRnd.push(generateRndNeighbourCoord(point1.row, point1.col, itemsPerRow, itemsPerCol, "middle"));
    coordsRnd.push(generateRndNeighbourCoord(coordsRnd[coordsRnd.length - 1].row, coordsRnd[coordsRnd.length - 1].col, itemsPerRow, itemsPerCol, "end"));
    coordsRnd.push(point2);
    coordsRnd.push(generateRndNeighbourCoord(point2.row, point2.col, itemsPerRow, itemsPerCol, "middle"));
    coordsRnd.push(generateRndNeighbourCoord(coordsRnd[coordsRnd.length - 1].row, coordsRnd[coordsRnd.length - 1].col, itemsPerRow, itemsPerCol, "end"));
    
    let matrix = new Array(itemsPerRow);
    for (let i = 0; i < itemsPerRow; i++) {
        matrix[i] = new Array(itemsPerCol);
        for (let j = 0; j < itemsPerCol; j++) {
            matrix[i][j] = generateRandomLetter(i,j,coordsRnd);
        }
    }
    //OJO: let matrix = [["a","n","a","d"],["m","a","h","e"],["a","p","a","r"],["c","a","c","a"]];
    //let matrix = [["i","z","a","r"],["b","a","c","a"],["a","n","a","d"],["p","a","z","u"]];
    /*
    //let matrix = [["a","s"],["r","e"]]; //2x2
    //let matrix = [["a","s","o"],["r","e","m"],["i","t","a"]]; //3x3
    let matrix = [["a","s","o","r"],["r","e","m","a"],["i","t","a","s"],["e","i","t","r"]]; //4x4
    //let matrix = [["i","o","i","e","a"],["e","b","b","a","d"],["m","r","e","e","g"],["o","n","o","b","t"],["i","d","b","r","a"]]; //5x5
    //let matrix = [["i","o","i","e","a","d"],["e","b","b","a","d","s"],["m","r","e","e","g","a"],["o","n","o","b","t","i"],["i","d","b","r","a","p"],["h","l","o","p","u","o"]]; //6x6
    */
    return matrix;
}

const newBoard = async (request, response) => {
    try {
        const player = request.params.player;
        const activeBoard = await getActiveBoard();
        if (activeBoard) {
            const isPlayingBoard = await playingBoard(activeBoard.id, player);
            
            if (isPlayingBoard) {
                /*const playerWordList = await getPlayerWordList(activeBoard.id, player);
                const playerResults = await getPlayerResults(board_id, player);
                const allScores = await getAllScores(board_id);
                
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({...activeBoard, alreadyPlaying: true, wordList: playerWordList, playerResults: playerResults, allScores: allScores}));*/
                const playerWordList = await getPlayerWordList(activeBoard.id, player);
                
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({...activeBoard, alreadyPlaying: true, wordList: playerWordList }));
            }
            else {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({...activeBoard, alreadyPlaying: false }));
            }
        }
        else {
            const itemsPerRow = request.params.rows;
            const itemsPerCol = request.params.cols;
            const matrix = JSON.stringify(generateMatrix(itemsPerRow, itemsPerCol));
            const board = await insertBoard(matrix, "active");
            if (board) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({...board, alreadyPlaying: false }));
                setTimeout(() => { updateBoardStatus(board.id, "inactive"); }, 2 * 60 * 1000);
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: `Couldn't retrieve the board data` }));
            }
        }
    }
    catch(err) { 
        console.log(err);
        response.writeHead(404, {"Content-Type": "application/json"});
        response.end(JSON.stringify({ err }));
    }
}

const playerResults = async (request, response) => {
    try {
        const board_id = request.params.board_id;
        const player = request.params.player;
            
        const playerResults = await getPlayerResults(board_id, player);
        
        if (playerResults) {
            const allScores = await getAllScores(board_id);
            if (allScores) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({playerResults: playerResults, allScores: allScores}));
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: `The scores for board ${board_id} couldn't be retrieved` }));
            }
        }
        else {
            response.writeHead(404, {"Content-Type": "application/json"});
            response.end(JSON.stringify({ err: `The score for "${player}" couldn't be registered` }));
        }
    }
    catch(err) { 
        console.log(err);
        response.writeHead(404, {"Content-Type": "application/json"});
        response.end(JSON.stringify({ err }));
    }
}

const allScores = async (request, response) => {
    try {
        const board_id = request.params.board_id;
        const player = request.params.player;
        const isPlayingBoard = await playingBoard(board_id, player);
        
        if (isPlayingBoard) {
            const allScores = await getAllScores(board_id);
            if (allScores) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify(allScores));
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: `The scores for board ${board_id} couldn't be retrieved` }));
            }
        }
        else {
            response.writeHead(404, {"Content-Type": "application/json"});
            response.end(JSON.stringify({ err: `'${player}' is not a player of board ${board_id}` }));
        }
    }
    catch(err) { 
        console.log(err);
        response.writeHead(404, {"Content-Type": "application/json"});
        response.end(JSON.stringify({ err }));
    }
}

module.exports = {
    newBoard,
    playerResults,
    allScores
}