import React, { Component } from "react";
import "../scss/components/Config.scss";

class Config extends Component {
    constructor(props) {
        super(props);
        
        this.defaultLabels = {
            player: "Sólo letras y números (3 a 10 caracteres)"
        }
        
        this.refConfig = React.createRef();
    }
    
    state = {
        consultExternalDics: false,
        player: "",
        errorMsg: ""
    }
    
    //METHODS:
    
    clearErrMsg = () => { 
        this.setState({ errorMsg: "" });
    }
    
    changeHandler = (event) => { 
        let type = event.target.type;
        let name = event.target.name;
        let value = event.target.value;
        
        if (type === "checkbox") {
            this.setState({ [name]: event.target.checked });
        }
        else {
            this.setState({ [name]: value });
        }
    }
    
    blurHandler = (event) => { 
        let name = event.target.name;
        let value = event.target.value;
        
        if (this.state[name] === "") {
            this.setState({ [name]: this.defaultLabels[name] });
        }
    }
    
    clickHandler = (event) => {  
        let name = event.target.name;
        
        if (this.state[name] === this.defaultLabels[name]) {
            this.setState({ [name]: "" });
        }
        
        this.clearErrMsg();
    }
    
    validatePlayer = (input) => {
        const re = /^[a-zA-Z0-9]{3,10}$/;
        return (input && re.test(input));
    }
    
    initialize = (event) => {
        (event) && event.preventDefault();
        
        if (this.state.player === this.defaultLabels["player"]) {
            this.setState({ errorMsg: "Para jugar, debes ingresar un nombre del jugador" });
        }
        else {
            if (this.validatePlayer(this.state.player)) {
                this.props.callBack(this.state.player, this.state.consultExternalDics);
            }
            else {
                this.setState({ errorMsg: "El nombre del jugador sólo puede tener letras y números (de 3 a 30 caracteres)" });
            }
        }
        
        return false;
    }
    
    //MOUNTED / UNMOUNTED:
    componentDidMount() {
        this.setState({ player: this.defaultLabels["player"] });
    }
    
    //RENDER:
    render() {
        return (
            (!this.props.configSet) ? (
                <div className="config" ref={this.refConfig}>
                    <form onSubmit={this.initialize}>
                        <div className="form-row">
                            <label htmlFor="txtbPlayer">Nombre del jugador:</label>
                            <input type="text" id="txtbPlayer" name="player" maxLength="10" value={this.state.player} onBlur={this.blurHandler} onChange={this.changeHandler} onClick={this.clickHandler} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="chkbConsultExternalDics">Consultar diccionarios externos:</label>
                            <input type="checkbox" id="chkbConsultExternalDics" name="consultExternalDics" value={this.state.consultExternalDics} onChange={this.changeHandler} />
                            <button type="submit">Jugar</button>
                        </div>
                        <div className="form-row error-message">
                            <p>{ this.state.errorMsg }</p>
                        </div>
                        <div className="explanation">
                            <p>Si la opción de <b>Consultar diccionarios externos</b> es habilitada, cuando encuentres una palabra que no esté registrada en nuestro diccionario, la buscaremos adicionalmente en diccionarios externos.</p>
                            <p>Esta búsqueda puede ayudarte a conseguir un mayor número de palabras, pero debes tomar en cuenta que demora un poco más.</p>
                            <p>La demora, sin embargo, no representa una penalización en el tiempo que tienes asignado para el juego, pues el temporizador se pausa cada vez que se realiza una búsqueda de este tipo.</p>
                        </div>
                    </form> 
                </div>
            ) : ("")
        );
    }
    
}

export default Config;