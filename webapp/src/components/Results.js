import React, { Component } from "react";
import "../scss/components/Results.scss";
import base from "../base/base.js";

class Results extends Component {
    constructor(props) {
        super(props);
        
        this.refLetter = React.createRef();
        this.timer = null;
    }
    
    state = {
        numWords: 0,
        totalScore: 0,
        refreshTime: 1000,
        allScores: []
    }
    
    //METHODS:
    
    getPlayerResults = async (board_id, player) => {
        const response = await base.getData(`http://192.168.100.13:4000/player/results/${board_id}/${player}`);
        
        if (response.status === 200) {
            console.log("getPlayerResults:", response.data);
            this.setState({
                numWords: response.data.playerResults.num_words,
                totalScore: response.data.playerResults.score,
                allScores: response.data.allScores
            }, () => {
                this.timer = window.setInterval(this.refreshAllScores, this.state.refreshTime);
                return true;
            });
        }
        return false;
    }
    
    refreshAllScores = async () => {
        const response = await base.getData(`http://192.168.100.13:4000/all/scores/${this.props.board_id}/${this.props.player}`);
        
        if (response.status === 200) {
            console.log("refreshing all scores:", response.data);
            this.setState({
                allScores: response.data
            }, () => {
                return true;
            });
        }
        return false;
    }
    
    //MOUNTED / UNMOUNTED:
    componentDidMount() {
        
    }
    
    componentWillUnmount() {
        console.log("Results component dispose");
        window.clearInterval(this.timer);
    }
    
    //RENDER:
    render() {
        return (
        (this.props.gameEnded) ? (        
            <div className="results-panel">
                <h1 className="title">Resultados:</h1>
                <p>Encontraste <span className="bold500">{ this.state.numWords }</span> palabra(s)!</p>
                <p>Puntaje total: <span className="bold500">{ this.state.totalScore }</span></p>
                
            {(this.state.allScores && this.state.allScores.length > 0) ? (
                <div className="all-scores">
                    <h3>Puntajes:</h3> 
                    <ul>
                    {
                        this.state.allScores.map((item, index) => {
                            return (
                                <li key={index}>
                                    <p>
                                        <span className="player">{ (item.player === this.props.player) ? `***${item.player}` : item.player }</span>
                                        <span className="score">({ item.score } pts)</span>
                                    </p>
                                </li>
                            )
                        })
                    }    
                    </ul>
                </div>
            ) : ("") }
            </div>
        ) : ("")
        );
    }
    
}

export default Results;