import {COLORS} from './constants.jsx';

/**
 * A single cell in a board.
 */
class Cell {
	/**
	 * Creates a new cell with coordinates.
	 * @param {int} x The x coordinate of this cell.
	 * @param {int} y The y coordinate of this cell.
	 * @constructor
	 */
	constructor(x, y){
		this.color = COLORS["DEFAULT"];
		this.resolved = true;
		this.shape = null;
		this.x = x;
		this.y = y;
	}
	
	/**
	 * Checks if this cell is empty.
	 * @return {boolean} true if this cell is empty, false otherwise.
	 */
	isEmpty(){
		return (this.shape === null);
	}

	/**
	 * Empties this cell.
	 */
	clear(){
		this.shape = null;
		this.resolved = true;
		this.color = COLORS["DEFAULT"];
		return this;
	}

	/**
	 * Sets the resolution status of this cell as resolved.
	 */
	resolve(){
		this.resolved = true;
	}

	/**
	 * Sets the position of this cell.
	 * @param  {int} x The new x coordinate of this cell.
	 * @param  {int} y The new y coordinate of this cell.
	 */
	move(x, y){
		this.x = x;
		this.y = y;
	}
}

export default Cell;
