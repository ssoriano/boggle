import React, { Component } from "react";
import "../scss/components/Status.scss";

class Status extends Component {
    constructor(props) {
        super(props);
    }
    
    state = {
        
    }
    
    //METHODS:
    
    
    
    
    //RENDER:
    render() {
        return (
            (this.props.pendingWordLookups && this.props.pendingWordLookups.length > 0) ? (
                <div className="status-panel">
                    <p>Consulting external dictionaries:</p>
                    <div className="status-list">
                    {
                        this.props.pendingWordLookups.map((item, index) => {
                            return (
                                <div className="status" key={index}>
                                    <span className="item-msg">{item.word}</span>
                                    <span className={`item-status ${item.status}`}>{item.status}</span>
                                </div>
                            )
                        })
                    }
                    </div>
                </div>
            ) : ("")
        );
    }
    
}

export default Status;