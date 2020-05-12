import React, { Component } from "react";
import "../scss/components/Wordbox.scss";
import { sample, filter, cloneDeep, find, contains, findIndex, isEqual } from "lodash";
import base from "../base/base.js";
import Config from "./Config";
import Matrix from "./Matrix";
import WordList from "./WordList";
import Results from "./Results";
import Status from "./Status";

class Wordbox extends Component {
    constructor(props) {
        super(props);
        
        this.refContainer = React.createRef();
        this.refMatrix = React.createRef();
        this.refWordList = React.createRef();
        this.refResults = React.createRef();
    }
    
    state = {
        itemsPerRow: 4,
        itemsPerCol: 4,
        path: [],
        chrSequence: [],
        message: "",
        timing: true,
        timePerBoard: 120000, //2 minutes
        timer: null,
        clock: null,
        timerStartTime: null,
        timerRemainingTime: null,
        configSet: false,
        gameEnded: false,
        consultExternalDics: false,
        player: "",
        errorMsg: "",
        board_id: null,
        board_name: "",
        pendingWordLookups: []
    }
    
    //METHODS:
    
    initialize = async (player, consultExternalDics) => {
        const boardData = await this.getNewBoardData(this.state.itemsPerRow, this.state.itemsPerCol, player);
        if (boardData) {
            this.setState({
                configSet: true,
                board_id: boardData.id,
                board_name: `Tablero_${boardData.id}`,
                player: player,
                consultExternalDics: consultExternalDics
            }, () => {
                this.refMatrix.current.setLetterMatrix(boardData.matrix);
                if (boardData.alreadyPlaying) {
                    let initialWordList = boardData.wordList;
                    this.refWordList.current.setInitialWordList(initialWordList);
                    this.setState({ gameEnded: true }, async () => {
                        await this.refResults.current.getPlayerResults(boardData.id, player);
                    });
                }
                else {
                    this.startGame();
                }
            });
        }
    }
    
    getNewBoardData = async (rows, cols, player) => {
        const response = await base.getData(`http://192.168.100.13:4000/new/board/${rows}/${cols}/${player}`);
        
        console.log("RESPONSE:", response);
        if (response.status === 200) {
            return response.data;
        }
        return null;
    }
    
    startGame = () => {
        if (this.state.timing) {
            this.timerStart();
        }
        document.addEventListener("keydown", this.onKeyPressed);
    }
    
    endGame = async () => {
        await this.refResults.current.getPlayerResults(this.state.board_id, this.state.player);
        this.setState({ gameEnded: true });
        document.removeEventListener("keydown", this.onKeyPressed);
    }
    
    timerStart = () => {
        this.setState((state) => ({ 
            timerStartTime: state.timePerBoard/1000, 
            timerRemainingTime: state.timePerBoard/1000,
            timer: window.setTimeout(this.time, this.state.timePerBoard),
            clock: window.setInterval(this.timerGetRemainingTime, 999)
        }));
    }
    
    time = () => {
        if (this.state.timing) {
            this.timerStop();
            this.endGame();
        }
    }
    
    timerStop = () => {
        window.clearInterval(this.state.clock);
        window.clearTimeout(this.state.timer);
    }
    
    timerPause = () => {
        this.timerStop();
        this.setState((state) => ({ 
            timerStartTime: state.timerRemainingTime
        }));
    }
    
    timerResume = () => {
        this.setState({ 
            timer: window.setTimeout(this.time, this.state.timerRemainingTime * 1000), 
            clock: window.setInterval(this.timerGetRemainingTime, 999) 
        });
    }
    
    timerGetRemainingTime = () => {
        if (this.state.timing && this.state.timerRemainingTime) {
            this.setState((state) => ({ timerRemainingTime: state.timerRemainingTime - 1 }));
        }
        else {
            this.setState({ timerRemainingTime: null });
        }
    }
    
    word = () => {
        let str = '';
        for (const item of this.state.path) {
            str += item.letter;
        }
        return str;
    }
    
    deleteLastChar = () => {
        if (this.state.chrSequence && this.state.chrSequence.length > 0) {
            let chrSequence = this.state.chrSequence;
            let lastChar = chrSequence.pop();
            this.setState((state) => ({ chrSequence: chrSequence }), () => {
                if (this.state.path && this.state.path[this.state.path.length - 1].letter === lastChar) {
                    let path = this.state.path;
                    let lastNode = path.pop();
                    this.setState((state) => ({ path: path }), () => {
                        this.refMatrix.current.deleteLastChar(lastNode);
                    });
                }
            });
        }
    }
    
    clearCurrentSeq = () => {
        if (this.state.chrSequence && this.state.chrSequence.length > 0) {
            this.setState((state) => ({ chrSequence: [] }), () => {
                let tempPath = this.state.path;
                if (this.state.path && this.state.path.length > 0) {
                    this.setState((state) => ({ path: [] }), () => {
                        this.refMatrix.current.clearCurrentSequence(tempPath);
                    });
                }
            });
        }
    }
    
    isValidWord = async (word) => {
        this.setState({ message: "Loading..." });
        let response = await base.getData(`http://192.168.100.13:4000/check/word/${this.state.board_id}/${this.state.player}/${word}`);
        console.log("Response:", response);
        if (response.status === 200) {
            console.log("Response data:", response.data);
            this.setState({ message: "" });
            return response.data;
        }
        else {
            if (this.state.consultExternalDics && response.status === 206) {
                //this.timerPause();
                //this.setState({ message: "Consultando diccionario externo..." });
                
                let pendingWordLookups = [...this.state.pendingWordLookups];
                pendingWordLookups.push({ word: word, status: "pending" });
                this.setState({ pendingWordLookups: pendingWordLookups, message: "" });
                this.clearCurrentSeq();
                
                response = await base.getData(`http://192.168.100.13:4000/consult/external/dics/${this.state.board_id}/${this.state.player}/${word}`);
                console.log("Response:", response);
                
                if (response.status === 200) {
                    pendingWordLookups = [...this.state.pendingWordLookups];
                    find(pendingWordLookups, { word: word }).status = "found";
                    this.setState({ pendingWordLookups: pendingWordLookups, message: "" });
                    
                    //this.timerResume();
                    console.log("Response data:", response.data);
                    return response.data;
                }
                else {
                    pendingWordLookups = [...this.state.pendingWordLookups];
                    find(pendingWordLookups, { word: word }).status = "not-found";
                    this.setState({ pendingWordLookups: pendingWordLookups, message: "" });
                }
                //this.timerResume();
                return null;
            }
            else {
                return null;
            }
        }
    }
    
    addWord = async () => {
        let word = this.word();
        if (word.length <= 2) {
            this.setState({ message: "Words need to be at least 3 characters long." });
        }
        else {
            //this.setState({ message: "Loading..." });
            //document.removeEventListener("keydown", this.onKeyPressed);
            const dbWordScore = await this.isValidWord(word);
            if (dbWordScore) {
                let wordAddedSuccessfully = this.refWordList.current.addWord(word, dbWordScore);
                if (wordAddedSuccessfully) {
                    this.clearCurrentSeq();
                    //this.setState({ message: "" });
                    //document.addEventListener("keydown", this.onKeyPressed);
                }
                else {
                    /*this.setState({ message: "This word has already been added." }, () => {
                        document.addEventListener("keydown", this.onKeyPressed);
                    });*/
                }
            }
            else {
                /*this.setState({ message: "Word not found." }, () => {
                    document.addEventListener("keydown", this.onKeyPressed);
                });*/
            }
            //this.setState({ message: "" });
        }
    }
    
    resetMsg = () => {
        this.setState({ message: "" });
    }
    
    //EVENTS:
    onKeyPressed = (event) => {
        this.resetMsg();
        
        if (event && event.target) {
            if ((event.keyCode >= 65 && event.keyCode <= 90) || (event.keyCode >= 97 && event.keyCode <= 122) || (event.keyCode === 192)) {
                let letter = (event.keyCode === 192) ? "ñ" : String.fromCharCode(event.keyCode).toLowerCase();
                let obj = this.refMatrix.current.findLetterPath(letter, [...this.state.chrSequence], [...this.state.path]);
                this.setState({ 
                    chrSequence: [...obj.chrSequence], 
                    path: [...obj.path]
                });
            }
            else {
                if (event.keyCode === 8) {
                    this.deleteLastChar();
                }
                
                if (event.keyCode === 46) {
                    this.clearCurrentSeq();
                }
                
                if (event.keyCode === 13) {
                    this.addWord();
                }
            }
        }
    }
    
    
    
    //MOUNTED / UNMOUNTED:
    componentDidMount() {
        
    }
    
    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyPressed);
    }
    
    //RENDER:
    render() {
        let letterWidth = `${parseFloat(100/this.state.itemsPerRow).toFixed(2)}%`;
        let matrixMinWidth =  `${(this.state.itemsPerRow * 3.6).toFixed(2)}em`;
        
        return (
            <div className={(this.state.gameEnded) ? "wordbox disabled" : "wordbox enabled"} ref={this.refContainer}>
                <h1>Buscapalabras</h1>
                <Config configSet={this.state.configSet} callBack={this.initialize} />
            { (this.state.configSet) ? (
                <div className="game">
                    <header>
                        <div className="word-info-panel">
                            <p className="word">{ this.word() }</p>
                            <p className="info">{ this.state.message }</p>
                        </div>
                    { (this.state.timing && this.state.timerRemainingTime) ? (
                        <p className="timer">
                            Quedan <span className="time">{this.state.timerRemainingTime}</span> segundos
                        </p>
                        ) : ("")
                    }
                    </header>
                    <section className="content">
                        <Status pendingWordLookups={this.state.pendingWordLookups} />
                        <Matrix ref={this.refMatrix} gameEnded={this.state.gameEnded} itemsPerCol={this.state.itemsPerCol} itemsPerRow={this.state.itemsPerRow} />
                        <WordList ref={this.refWordList} />
                        <Results ref={this.refResults} gameEnded={this.state.gameEnded} player={this.state.player} board_id={this.state.board_id} />
                    </section>
                </div>
            ) : ("") }
            </div>
        );
    }
    
}

export default Wordbox;