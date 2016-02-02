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

	static get CLOCKWISE(){
		return 1;
	}

	static get COUNTER_CLOCKWISE(){
		return 2;
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
	 * Replaces the contents of a cell with given coordinates.
	 * @param {int} x  The x coordinate of the cell to replace.
	 * @param {int} y  The y coordinate of the cell to replace.
	 * @param {Cell} cell The new contents of this coordinates.
	 */
	set(x, y, cell){
		//if(!cell instanceof Cell) throw new Error("Must be a cell!");
		if(!this.cells[y]) this.cells[y] = [];
		this.cells[y][x] = cell;
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

	/**
	 * Set all the non-empty cells of this grid as unresolved.
	 */
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
	 * Rotates this grid in a clockwise direction.
	 */
	rotate(direction){
		var newCells = [];

		// Cant rotate emptiness
		if(this.height == 0 || this.width == 0) return;

		// The origin x and y
		var ox, oy;

		console.log(direction == CellGrid.CLOCKWISE);
		if(direction == CellGrid.CLOCKWISE){
			for(let i = 0; i < this.width; i++){
				newCells[i] = [];

				for(let k = this.height - 1; k >= 0; k--){
					var cell = this.get(i, k);
					if(cell){
						if(!ox){
							ox = cell.shape.x;
							oy = cell.shape.y;
						}
						cell.move(ox - k + this.height - 1, oy + i);
					}
					newCells[i].push(cell);
				}
			}
		}else{
			for(let i = this.width - 1; i >= 0; i--){
				var y = this.width - 1 - i;

				newCells[y] = [];

			 	for(let k = 0; k < this.height; k++){
					var cell = this.get(i, k);
					if(cell){
						if(!ox){
							ox = cell.shape.x;
							oy = cell.shape.y;
						}
			 			cell.move(ox + k, oy + y);
			 		}
			 		newCells[y].push(cell);
			 	}
			}
		}

		this.cells = newCells;
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
	 * An iterator of each cell in this cell grid, iterating over columns first,
	 * then by rows.
	 */
	[Symbol.iterator]() {
		let cx = -1, cy = 0;
		let self = this;

		return {
			next() {
				var done = false, val;
				// Check size
				if(!self.cells.length){
					return { done: true, value: null };
				}

				// Skips null values (non-shape cells)
				while(!done && !val){
					// Iterate through cols first.
					if(!self.cells[cy] || cx + 1 == self.cells[cy].length){
						cx = 0;
						cy++;
					}else{
						cx++;
					}

					// Check done condition
					if(cy >= self.cells.length){
						done = true;
					}
					val = self.get(cx, cy);
				}

				return { done: done, value: val };
			}
		}
	}
}

export default CellGrid;
