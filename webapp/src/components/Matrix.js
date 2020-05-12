import React, { Component } from "react";
import { sample, filter, cloneDeep, find, contains, findIndex, isEqual } from "lodash";
import "../scss/components/Matrix.scss";
import Letter from "./Letter";

class Matrix extends Component {
    constructor(props) {
        super(props);
        
        this.refMatrixPanel = React.createRef();
    }
    
    state = {
        matrix: null,
        visitedPaths: []
    }
    
    //METHODS:
    prepareMatrix = (matrix) => {
        let newMatrix = new Array(this.props.itemsPerRow);
        for (let i = 0; i < this.props.itemsPerRow; i++) {
            newMatrix[i] = new Array(this.props.itemsPerCol);
            for (let j = 0; j < this.props.itemsPerCol; j++) {
                newMatrix[i][j] = { letter: matrix[i][j], visited: false };
                this[`ltrR${i}C${j}_ref`] = React.createRef();
            }
        }
        return newMatrix;
    }
    
    setLetterMatrix = (matrix) => {
        matrix = this.prepareMatrix(matrix);
        this.setState({ matrix: matrix });
    }
    
    isVisitedPath = (visitedPaths, newPath) => {
        if (visitedPaths && visitedPaths.length > 0) {
            const result = visitedPaths && visitedPaths.length > 0 && visitedPaths.find(obj => {
                return isEqual(obj, newPath);
            });
            return !!result;
        }
        return false;
    }

    getNextChar = (path, chrSequence) => {
        let cont = 0;
        for (const chr of chrSequence) {
            if (!path || !path[cont] || (path[cont].letter !== chr)) {
                return chr;
            }
            cont++;
        }
        return null;
    }
    
    deleteLastChar = (lastNode) => {
        let tempMatrix = [...this.state.matrix];
        tempMatrix[lastNode.row][lastNode.col].visited = false;
        this.setState({ matrix: tempMatrix }, () => {
            this[`ltrR${lastNode.row}C${lastNode.col}_ref`].current.removeHighlight();
        });
    }
    
    clearCurrentSequence = (tempPath) => {
        let tempMatrix = this.resetVisitedStatus(this.state.matrix);
        this.setState({ matrix: tempMatrix }, () => {
            this.setState({ visitedPaths: [] }, () => {
                for (const node of tempPath) {
                    this[`ltrR${node.row}C${node.col}_ref`].current.removeHighlight();
                }
            });
        });
    }
    
    foundTop = (row, col, letter, visitedPaths, newPath, matrix) => {
        if ((row > 0) && (row < this.props.itemsPerRow)) {
            if ((col >= 0) && (col < this.props.itemsPerCol)) {
                let newNode = { letter: letter, row: row - 1, col: col};
                if (!find(newPath, newNode)) { newPath = [...newPath, newNode]; }
                if (matrix[row - 1][col].letter === letter && (!matrix[row - 1][col].visited || (matrix[row - 1][col].visited && !this.isVisitedPath(visitedPaths, newPath)))) {
                    return {row: row - 1, col: col};
                }
            }
        }
        return false;
    }
    
    foundBottom = (row, col, letter, visitedPaths, newPath, matrix) => {
        if ((row >= 0) && (row < (this.props.itemsPerRow - 1))) {
            if ((col >= 0) && (col < this.props.itemsPerCol)) {
                let newNode = { letter: letter, row: row + 1, col: col};
                if (!find(newPath, newNode)) { newPath = [...newPath, newNode]; }
                if (matrix[row + 1][col].letter === letter && (!matrix[row + 1][col].visited || (matrix[row + 1][col].visited && !this.isVisitedPath(visitedPaths, newPath)))) {
                    return {row: row + 1, col: col};
                }
            }
        }
        return false;
    }
    
    foundLeft = (row, col, letter, visitedPaths, newPath, matrix) => {
        if ((row >= 0) && (row < this.props.itemsPerRow)) {
            if ((col > 0) && (col < this.props.itemsPerCol)) {
                let newNode = { letter: letter, row: row, col: col - 1};
                if (!find(newPath, newNode)) { newPath = [...newPath, newNode]; }
                if (matrix[row][col - 1].letter === letter && (!matrix[row][col - 1].visited || (matrix[row][col - 1].visited && !this.isVisitedPath(visitedPaths, newPath)))) {
                    return {row: row, col: col - 1};
                }
            }
        }
        return false;
    }
    
    foundRight = (row, col, letter, visitedPaths, newPath, matrix) => {
        if ((row >= 0) && (row < this.props.itemsPerRow)) {
            if ((col >= 0) && (col < (this.props.itemsPerCol - 1))) {
                let newNode = { letter: letter, row: row, col: col + 1};
                if (!find(newPath, newNode)) { newPath = [...newPath, newNode]; }
                if (matrix[row][col + 1].letter === letter && (!matrix[row][col + 1].visited || (matrix[row][col + 1].visited && !this.isVisitedPath(visitedPaths, newPath)))) {
                    return {row: row, col: col + 1};
                }
            }
        }
        return false;
    }
    
    isNeighbour = (row, col, letter, visitedPaths, newPath, matrix) => {
        let top = this.foundTop(row, col, letter, visitedPaths, newPath, matrix);
        let right = this.foundRight(row, col, letter, visitedPaths, newPath, matrix);
        let bottom = this.foundBottom(row, col, letter, visitedPaths, newPath, matrix);
        let left = this.foundLeft(row, col, letter, visitedPaths, newPath, matrix);
        
        if (top) return top;
        if (right) return right;
        if (bottom) return bottom;
        if (left) return left;
        
        return false;
    }
    
    findNextNode(letter, startRow, startCol, visitedPaths, path, matrix) {
        if (path.length === 0) {
            for (let i = 0; i < this.props.itemsPerRow; i++) {
                for (let j = 0; j < this.props.itemsPerCol; j++) {
                    if (matrix[i][j].letter === letter && (!matrix[i][j].visited || (matrix[i][j].visited && !this.isVisitedPath(visitedPaths, [{ row: i, col: j, letter: letter}])) )) {
                        return {status: true, newItem: { letter: letter, row: i, col: j }};
                    }
                }
            }
            return {status: false, newItem: null};
        }
        else {
            let foundNeighbour = this.isNeighbour(startRow, startCol, letter, visitedPaths, path, matrix);
            if (foundNeighbour) {
                return {status: true, newItem: { letter: letter, row: foundNeighbour.row, col: foundNeighbour.col }}
            }
            else {
                return {status: false, newItem: null};
            }
        }
    }
    
    findPath(letter, updateChrSequence = false, matrix = [], chrSequence = [], path = [], visitedPaths = []) {
        if (updateChrSequence) {
            chrSequence = [...chrSequence, letter];
        }
        
        let addToPath = null;
        if (path && path.length > 0) {
            addToPath = this.findNextNode(letter, path[path.length - 1].row, path[path.length - 1].col, visitedPaths, path, matrix);
        }
        else {
            addToPath = this.findNextNode(letter, 0, 0, visitedPaths, path, matrix);
        }
            
        if (!addToPath.status) {
            if (!path || path.length === 0) {
                //the sequence doesn't exist
                chrSequence.pop();
                if (chrSequence.length > 0) {
                    //reset visited status for all nodes
                    matrix = this.resetVisitedStatus(matrix);
                    let newLetter = this.getNextChar(path, chrSequence);
                    return this.findPath(newLetter, false, matrix, chrSequence, path, visitedPaths);
                }
            }
            else {
                let lastPathNode = path.pop();
                this[`ltrR${lastPathNode.row}C${lastPathNode.col}_ref`].current.removeHighlight();
                let newLetter = this.getNextChar(path, chrSequence);
                visitedPaths = (path.length > 0) ? [...visitedPaths, cloneDeep(path)] : [...visitedPaths]; 
                return this.findPath(newLetter, false, matrix, chrSequence, path, visitedPaths); 
            }
        }
        else {
            path = [...path, addToPath.newItem];
            matrix[addToPath.newItem.row][addToPath.newItem.col].visited = true;
            this[`ltrR${addToPath.newItem.row}C${addToPath.newItem.col}_ref`].current.highlight();
            visitedPaths = (path.length > 0) ? [...visitedPaths, cloneDeep(path)] : [...visitedPaths]; 
            if (!updateChrSequence) {
                let newLetter = this.getNextChar(path, chrSequence);
                if (newLetter) {
                    return this.findPath(newLetter, false, matrix, chrSequence, path, visitedPaths);
                }
            }
        }
        
        return { matrix: matrix, chrSequence: chrSequence, path: path, visitedPaths: visitedPaths };
    }
    
    findLetterPath = (letter, chrSequence, path) => {
        let obj = this.findPath(letter, true, [...this.state.matrix], chrSequence, path, [...this.state.visitedPaths]);
        this.setState({ 
            matrix: [...obj.matrix], 
            visitedPaths: [...obj.visitedPaths] 
        });
        return obj;
    }
    
    visited = () => {
        let visited = '';
        for (let i = 0; i < this.props.itemsPerRow; i++) {
            for (let j = 0; j < this.props.itemsPerCol; j++) {
                if (this.state.matrix[i][j].visited) {
                    visited += `{letter: ${this.state.matrix[i][j].letter}, row: ${i}, col: ${j}},`;
                }
            }
        }
        return visited;
    }
    
    resetVisitedStatus = (matrix) => {
        let newMatrix = [...matrix];
        for (let i = 0; i < this.props.itemsPerRow; i++) {
            for (let j = 0; j < this.props.itemsPerCol; j++) {
                if (newMatrix[i][j].visited) {
                    newMatrix[i][j].visited = false;
                }
            }
        }
        return newMatrix;
    }
    
    //RENDER:
    render() {
        let letterWidth = `${parseFloat(100/this.props.itemsPerRow).toFixed(2)}%`;
        let matrixMinWidth =  `${(this.props.itemsPerRow * 3.6).toFixed(2)}em`;
        
        return (
           (this.state.matrix) ? (
                <div className={(this.props.gameEnded) ? "matrix-panel disabled" : "matrix-panel enabled"} ref={this.refMatrixPanel} style={{minWidth: matrixMinWidth}}>
                    <div className="letter-matrix" style={{minWidth: matrixMinWidth}}>
                    {
                        this.state.matrix.map((row, rowIndex) => {
                            return (
                                <div className="row" key={`row${rowIndex}`}>
                                {
                                    row.map((item, colIndex) => {
                                        return (
                                            <Letter key={`ltrR${rowIndex}C${colIndex}`} ref={this[`ltrR${rowIndex}C${colIndex}_ref`]} width={letterWidth} visited={item.visited}>{ item.letter }</Letter>
                                        )
                                    })
                                }
                                </div>
                            );
                        })
                    }
                    </div>
                </div>
            ) : ("")
        );
    }
    
}

export default Matrix;