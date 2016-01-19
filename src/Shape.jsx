import CellGrid from './CellGrid.jsx';
import Emitter from './Emitter.jsx';
import Cell from './Cell.jsx';

/**
 * A collection of cells in a specific arrangement.
 */
class Shape extends Emitter {
	/**
	 * Creates a new shape with a given scheme.
	 * @param  {boolean[]} scheme a boolean array describing
	 *                            the arrangement of this shape, where
	 *                            true represents a filled cell and false
	 *                            represents an empty cell.
	 * @constructor
	 */
	constructor(color){
		super();

		this.cells = new CellGrid();
		this._color = color;
		this.x = 0;
		this.y = 0;
	}

	static fromScheme(scheme, color){
		var shape = new Shape(color);

		// Initialize the cells
		for(let i = 0; i < scheme.length; i++){
			for(let k = 0; k < scheme[i].length; k++){
				var cell;
				
				if(scheme[i][k]){
					cell = new Cell(k, i);
					cell.shape = shape;
					cell.color = color;
					cell.resolved = false;
					shape.cells.set(k, i, cell);
				}else{
					shape.cells.set(k, i, null);
				}
			}
		}

		return shape;
	}

	/**
	 * Returns a new copy of the shape that a cell belongs to.
	 * @param  {Cell} cell A cell belonging to a shape.
	 * @return {Shape} A clone of the shape to which the cell belongs.
	 */
	static fromCell(cell){
		return cell.shape.clone();
	}	

	/**
	 * Marks all the cells in this shape as resolved.
	 * @return {[type]} [description]
	 */
	resolve(){
		for(let cell of this.cells){
			cell.resolve();
		}
	}

	/**
	 * Moves this shape to new coordinates.
	 * Precondition: the move is valid.
	 * @param  {int} x The new x coordinate.
	 * @param  {int} y The new y coordinate.
	 */
	move(x, y, flag){
		if(!flag) var old = this.clone();
		
		var dx = x - this.x,
			dy = y - this.y; 

		this.x = x;
		this.y = y;

		for(let cell of this.cells){
			cell.move(cell.x + dx, cell.y + dy);
		}

		if(!flag)  this.emit("change", old, this);
	}

	/**
	 * Returns a new copy of this shape.
	 * @return {Shape} a new Shape with exactly the same
	 *                   attributes as this shape.
	 */
	clone(){
		// Copy meta to new shape
		var shape =  new Shape(this.color);
		shape.x = this.x;
		shape.y = this.y;

		// Clone each cell
		for(let y = 0; y < this.height; y++){
			for(let x = 0; x < this.width; x++){
				var cell = this.cells.get(x, y);
				if(cell) cell = cell.clone(shape);

				shape.cells.set(
					x, y, cell
				);
			}
		}

		return shape;
	}

	rotate(){
		var rotated = this.clone();

		rotated.cells.rotate();
		this.emit("rotate", this, rotated);
	}

	deleteLine(line){
		// Split shape into two or less shapes
		var rline = line - this.y;

		// Above
		if(rline > 0){
			var aboveShape = new Shape(this.color);
			aboveShape.x = this.x;
			aboveShape.y = this.y;

			// Copy all cells up to, excluding rline
			for(let y = 0; y < rline; y++){
				for(let x = 0; x < this.width; x++){
					var cell = this.cells.get(x, y);

					if(cell) cell.shape = aboveShape;

					aboveShape.cells.set(
						x, y, cell
					);
				}
			}
		}

		// Below
		if(rline < this.height){
			var belowShape = new Shape(this.color);
			belowShape.x = this.x;
			belowShape.y = line + 1;

			// Copy all cells up to, excluding rline
			for(let y = rline + 1; y < this.height; y++){
				for(let x = 0; x < this.width; x++){
					var cell = this.cells.get(x, y);

					if(cell) cell.shape = belowShape;

					belowShape.cells.set(
						x, y, cell
					);
				}
			}
		}
	}

	/**
	 * Returns the height of this shape.
	 * @return {int} the height of this shape.
	 */
	get height(){
		return this.cells.height;
	}

	/**
	 * Returns the width of this shape.
	 * @return {int} width of this shape.
	 */
	get width(){
		return this.cells.width; 
	}


	get color(){
		return this._color;
	}

	set color(color){
		this._color = color;
		for(let cell of this.cells){
			cell.color = color;
		}
	}
};

export default Shape;