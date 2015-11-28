import Cell from './Cell.jsx';

/**
* A two dimensional grid of cells.
*/
class CellGrid {
	/**
	 * Creates a new empty grid.
	 * @constructor
	 */
	constructor(){
		this.cells = [];
	}
	
	/**
	 * Returns the cell at a given position.
	 * @param  {int} x The x coordinate of the cell.
	 * @param  {int} y The y coordinate of the cell.
	 * @return {Cell}   The cell at position x, y.
	 */
	get(x, y){
		var row = this.cells[y];

		if(!row) return null;
		return row[x] || null;
	}

	/**
	 * Replaces the first row of this grid with row.
	 * @param {Cell[]} row an array of cells to be
	 *                     inserted as the first row of this grid.
	 */
	addRow(row){
		this.cells[0] = _.clone(row);
	}

	/**
	 * Replaces the contents of a cell with given coordinates.
	 * @param {int} x  The x coordinate of the cell to replace.
	 * @param {int} y  The y coordinate of the cell to replace.
	 * @param {Cell} cell The new contents of this coordinates.
	 */
	set(x, y, cell){
		if(!cell instanceof Cell) throw new Error("ass");
		if(!this.cells[y]) this.cells[y] = [];
		this.cells[y][x] = cell;
	}
	
	/**
	 * Shifts this grid down by one row, deleting the last row
	 * and adding an empty one on top.
	 * @return {CellGrid} single row grid with the last row,
	 * which was deleted.
	 */
	shift(){
		var last = this.last();

		this.cells.pop();

		var nl = [];
		for(var z = 0; z < this.width; z++){
			nl.push(new Cell());
		}

		this.cells.shift(nl);

		return last;
	}

	/**
	 * Inserts a shape into the grid at (0, 0).
	 * @param  {Shape} shape The shape to be inserted.
	 */
	addShape(shape){
		for(let cell of shape.cells){
			this.set(cell.x - shape.x, cell.y - shape.y, cell);
		}
	}

	unresolve(){
		for(let cell of this){
			cell.resolved = (cell.isEmpty());
		}
	}

	/**
	 * Deletes all cells in this grid.
	 */
	clear(){
		this.cells = [];
	}

	/**
	 * Returns the cell above a given cell.
	 * @param  {Cell} cell A cell.
	 * @return {Cell} The cell above the given cell.
	 */
	above(cell){
		return this.get(cell.x, cell.y - 1);
	}

	/**
	 * Returns the cell below a given cell.
	 * @param  {Cell} cell A cell.
	 * @return {Cell} The cell below the given cell.
	 */
	below(cell){
		return this.get(cell.x, cell.y + 1);
	}

	/**
	 * Returns the cell left of a given cell.
	 * @param  {Cell} cell A cell.
	 * @return {Cell} The cell left of the given cell.
	 */
	left(cell){
		return this.get(cell.x - 1, cell.y);
	}

	/**
	 * Returns the cell right of a given cell.
	 * @param  {Cell} cell A cell.
	 * @return {Cell} The cell right of the given cell.
	 */
	right(cell){
		return this.get(cell.x + 1, cell.y);
	}

	/**
	 * Checks whether or not this grid is empty.
	 * @return {Boolean} true if this grid is empty, false otherwise.
	 */
	isEmpty(){
		if(!this.width || !this.height) return true;

		for(let cell of this){
			if(!cell.isEmpty()) return false;
		}
		return true;
	}

	/**
	 * Checks whether or not this grid is full.
	 * @return {Boolean} true if this grid contains no empty cells,
	 *                        false otherwise.
	 */
	isFull(){
		if(!this.width || !this.height) return false;

		for(let cell of this){
			if(cell.isEmpty()) return false;
		}
		return true;
	}

	/**
	 * Returns the last row of this grid.
	 * @return {CellGrid} A new cell grid with the
	 * same contents as the last row of this grid.
	 */
	last(){
		var c = [];
		
		if(this.cells.length)
			c = this.cells[this.cells.length - 1];
		
		var grid = new CellGrid();
		grid.addRow(c);

		return grid;
	}

	/**
	 * Returns the height of this grid.
	 * @return {int} the height of this grid.
	 */
	get height(){
		return this.cells.length;
	}

	/**
	 * Returns the width of this grid.
	 * @return {int} width of this grid.
	 */
	get width(){
		if(!this.cells.length) return 0;
		return this.cells[0].length;
	}

	/**
	 * An iterator of each row in this cell grid.
	 */
	[Symbol.iterator]() {
		let cx = -1, cy = 0;
		let self = this;
		return {
			next() {
				var done = false;
				// Check size
				if(!self.cells.length){
					return { done: true, value: null };
				}

				// Iterate through cols first.
				if(cx + 1 == self.cells[cy].length){
					cx = 0;
					cy++;
				}else{
					cx++;
				}

				// Check done condition
				if(cy == self.cells.length){
					done = true;
				}
				var val = self.get(cx, cy);
				if(val === null) done = true;

				return { done: done, value: val };
			}
		}
	}
}

export default CellGrid;
