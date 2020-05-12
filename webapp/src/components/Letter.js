import React, { Component } from "react";
import "../scss/components/Letter.scss";

class Letter extends Component {
    constructor(props) {
        super(props);
        
        this.refLetter = React.createRef();
    }
    
    state = {
        
    }
    
    //METHODS:
    
    highlight = () => {
        this.refLetter.current.classList.add("highlight");
    }
    
    removeHighlight = () => {
        this.refLetter.current.classList.remove("highlight");
    }
    
    notFound = () => {
        this.refLetter.current.classList.add("not-found");
    }
    
    removeNotFound = () => {
        this.refLetter.current.classList.remove("not-found");
    }
    
    
    //RENDER:
    render() {
        return (
            <div ref={this.refLetter} className="letter" style={{width: this.props.width}}>{ this.props.children }</div>
        );
    }
    
}

export default Letter;