import React, { Component } from "react";
import { find } from "lodash";
import "../scss/components/WordList.scss";

class WordList extends Component {
    constructor(props) {
        super(props);
        
        this.refWordListPanel = React.createRef();
    }
    
    state = {
        wordList: []
    }
    
    //METHODS:
    
    normalizeStr = (str) => {
        return (str.trim() && str.trim().length > 0) ? str.trim().toLowerCase().replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i").replace(/ó/g,"o").replace(/ú/g,"u") : "";
    }
    
    addWord = (word, dbWordScore) => {
        let wordList = [...this.state.wordList];
        if (!find(wordList, { word: word })) {
            wordList.unshift({ word: word, dbWord: dbWordScore.word, score: dbWordScore.score });
            this.setState({ wordList: wordList });
            return true;
        }
        return false;
    }
    
    setInitialWordList = (initialWordList) => {
        let wordList = [];
        for (const item of initialWordList) {
            wordList.push({ word: this.normalizeStr(item.word), dbWord: item.word, score: item.score });
        }
        this.setState({ wordList: wordList });
    }
    
    //RENDER:
    render() {
        return (
            (this.state.wordList) ? (    
                <div className="words-panel" ref={this.refWordListPanel}>
                    <h1 className="title">Palabras:</h1>
                { (this.state.wordList.length > 0) ? (
                    <ul className="word-list">
                        {
                            this.state.wordList.map((item, index) => {
                                return (
                                    <li key={index}>
                                        <p>
                                            <span className="word">{ item.dbWord }</span>
                                            <span className="score">({ item.score } pts)</span>
                                        </p>
                                    </li>
                                )
                            })
                        }
                    </ul>
                ) : (<p className="no-content">-- Ninguna --</p>) }    
                </div>
            ) : ("")
        );
    }
    
}

export default WordList;