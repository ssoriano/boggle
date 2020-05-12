const express = require("express");
const bodyParser= require("body-parser") ;
const cors = require("cors"); // using CORS to enable cross origin domain requests.
const Config = require('./constants');
const Board = require('./board.js');
const Wordbox = require('./wordbox.js');

const port = Config.PORT || 4000;
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json({
    type: ['application/json', 'text/plain']
}))

//new board
app.get("/new/board/:rows/:cols/:player", Board.newBoard);

//check word
app.get("/check/word/:board_id/:player/:word", Wordbox.checkWord);

//consult dictionary
app.get("/consult/external/dics/:board_id/:player/:word", Wordbox.consultExternalDics);

//get player results
app.get("/player/results/:board_id/:player", Board.playerResults);

//get player results
app.get("/all/scores/:board_id/:player", Board.allScores);

// Fire it up
app.listen(port, () => {
    console.log(`Server ready on port ${Config.PORT}`);
});
