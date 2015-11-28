import {COLORS, COLOR_KEYS, SHAPES} from './constants.jsx';
import CellGrid from './CellGrid.jsx';
import Emitter from './Emitter.jsx';
import Shape from './Shape.jsx';
import Cell from './Cell.jsx';

/**
 * A Tetris board.
 */
class Board extends Emitter {
	/**
	 * Creates a new tetris board.
	 * @param  {int} w The width of the new board.
	 * @param  {int} h The height of the new board.
	 * @constructor
	 */
	constructor(w, h){
		super();

		this.queueColor = "#000";
		this.colorIndex = 0;

		// Settings
		this.width = w;
		this.height = h;

		// Grids
		this.cells = new CellGrid();
		this.queue = new CellGrid();

		// Initialize cells
		for(let i = 0; i < h; i++){
			for(let k = 0; k < w; k++){
				this.cells.set(k, i, new Cell(k, i));
			}
		}

		// Handlers
		this.on("left", this.moveLeft);
		this.on("right", this.moveRight);
		this.on("down", this.moveBottom);
		this.on("add", this.handleAdd);
	}

	/**
	 * Returns the next shape color.
	 * @return {String} next color in #RRGGBB format.
	 */
	nextColor(){
		if(this.colorIndex == COLOR_KEYS.length){
			this.colorIndex = 0;
		}else this.colorIndex++;

		if(COLOR_KEYS[this.colorIndex] == "DEFAULT"){
			return this.nextColor();
		}else return COLORS[COLOR_KEYS[this.colorIndex]];
	}

	/**
	 * Resolves all the cells in the board, moving falling shapes
	 * down creating a gravity effect.
	 * @return {[type]} [description]
	 */
	resolve(){
		var flag = true;

		// Start at queue
		for(let cell of this.queue){
			if(cell.resolved) continue;
			if(cell.isEmpty()) continue;

			// if(this.isActiveShape(cell.shape)){
				this.move(cell.shape, "down");
				flag = false;
			// }else cell.shape.resolve();
		}
		
		// Process board
		for(let cell of this.cells){
			if(cell.resolved) continue;
			if(cell.isEmpty()) continue;
			
			if(this.isActiveShape(cell.shape)){
				this.move(cell.shape, "down");
				flag = false;
			}else cell.shape.resolve();
		}

		return flag;
	}

	/**
	 * Sets all non-empty cells of this board as
	 * not resolved.
	 */
	unresolve(){
		this.queue.unresolve();
		this.cells.unresolve();
	}

	step(){
		// Check if line is full, delete it
		if(this.cells.last().isFull()) this.cells.shift();

		// Gravity
		this.unresolve();
		this.resolve();
	}

	/**
	 * Returns the cell at the given coordinates.
	 * Negative coordinates correspond to the shape queue.
	 * @param  {int} x The x coordinate of the cell to retrieve.
	 * @param  {int} y The y coordinate of the cell to retrieve.
	 * @return {Cell}   The cell found at such coordinate,
	 *                      or null if no cell was found.
	 */
	get(x, y){
		if(y < 0) return this.queue.get(x, this.queue.height + y);
		else return this.cells.get(x, y);
	}

	handleAdd(){
		var sh = new Shape(SHAPES[1], this.nextColor());
		sh.move(0, -sh.height);
		this.addShape(sh);
	}

	/**
	 * Enqueues a shape to this board.
	 * @param {Shape} shape The shape to be enqueued.
	 */
	addShape(shape){
		shape.on("move", this.shapeMoved.bind(this));

		// shape.color = this.nextColor();
		this.queue.clear();
		this.queue.addShape(shape);
	}

	/**
	 * Clears the cells that match a shape scheme at given coordinates.
	 * @param  {int} x   The x coordinate of the shape scheme.
	 * @param  {int} y   The y coordinate of the shape scheme.
	 * @param  {boolean[][]} sheme A 2d boolean shape scheme.
	 */
	deleteScheme(x, y, scheme){
		for(let i = 0; i < scheme.length; i++){
			for(let k = 0; k < scheme[i].length; k++){
				if(!scheme[i][k]) continue;
				if(y + i < 0){
					console.log("deleting queue ("+(x + k)+","+(this.queue.height + y + i)+")");
					this.queue.set(x + k,
						this.queue.height + y + i,
						new Cell(x + k, y + i));
				}else{
					console.log("deleting cell ("+(x + k)+","+(this.queue.height + y + i)+")");
					this.cells.set(x + k, y + i,
						new Cell(x + k, y + i));
				}
			}
		}
	}

	/**
	 * Adds the cells of a shape to the board.
	 * @param {Shape} shape The shape whose cells will be added.
	 */
	addShapeCells(shape){
		var scheme = shape.scheme;
		var cells = shape.cells;
		var x = shape.x;
		var y = shape.y;

		for(let i = 0; i < scheme.length; i++){
			for(let k = 0; k < scheme[i].length; k++){
				if(!scheme[i][k]) continue;
				if(y + i < 0){
					this.queue.set(x + k,
						this.queue.height + y + i,
						cells.get(k, i));
				}else{
					this.cells.set(x + k, y + i,
						cells.get(k, i));
				}
			}
		}
	}

	/**
	 * Handles the movement of a shape.
	 * @param  {Shape} shape The shape that was moved.
	 * @param  {int} ox  The original x coordinate of the shape.
	 * @param  {int} oy  The original y coordinate of the shape.
	 * @param  {int} nx  The new x coordinate of the shape.
	 * @param  {int} ny  The new y coordinate of the shape.
	 */
	shapeMoved(shape, ox, oy, nx, ny){
		// Shape has moved from (ox, oy) to (nx, ny)
		// Delete shape at (ox, oy).
		this.deleteScheme(ox, oy, shape.scheme);

		// Add shape at (nx, ny)
		this.addShapeCells(shape);
	}

	/**
	 * Moves shape in a given direction if such move is valid.
	 * @param  {Shape} shape  The shape to be moved.
	 * @param  {String} direction The direction the shape
	 *                            should be moved.
	 */
	move(shape, direction){
		// Compute change in x, y.
		var dx, dy;
		switch(direction){
			case "left":
				dx = -1;
				dy = 0;
				break;
			case "right":
				dx = 1;
				dy = 0;
				break;
			case "down":
				dx = 0;
				dy = 1;
				break;
		}

		// Check that shape can be moved
		// Resolve shape if it cannot fall
		// Left bound
		if(shape.x + dx < 0){
			return;
		}
		// Right bound
		if(shape.x + dx + shape.width > this.width){
			return;
		}
		// Bottom bound
		if(shape.y + dy + shape.height > this.height){
			return shape.resolve();
		}

		for(let cell of shape.cells){
			if(cell.isEmpty()) continue;

			// Cell located at (cell.x + dx, cell.y + dy)
			// must either be empty or belong to this shape
			var dcell = this.get(cell.x + dx, cell.y + dy);

			if(!dcell || dcell.shape == shape) continue;
			if(!dcell.isEmpty()) return shape.resolve();
		}

		// Move
		shape.move(shape.x + dx, shape.y + dy);
		shape.resolve();
	}

	/**
	 * Checks whether a shape has no other shapes
	 * or board boundaries blocking its fall.
	 * @param  {Shape}  shape the shape to verify.
	 * @return {Boolean} true if there is nothing preventing
	 * the given shape from falling. False otherwise.
	 */
	isActiveShape(shape){
		// Bottom bound
		if(shape.y + 1 + shape.height > this.height){
			return false;
		}

		for(let cell of shape.cells){
			if(cell.isEmpty()) continue;

			// Cell located at (cell.x, cell.y + 1)
			// must either be empty or belong to this shape
			var dcell = this.get(cell.x, cell.y + 1);

			if(!dcell || dcell.shape == shape) continue;
			if(!dcell.isEmpty()) return false;
		}
		return true;
	}

	/**
	 * Returns the current falling shape in the board, if there is one.
	 * @return {Shape} currently falling shape.
	 */
	get activeShape(){
		for(let cell of this.queue){
			if(cell.isEmpty()) continue;

			if(this.isActiveShape(cell.shape)){
				return cell.shape;
			}
		}
		for(let cell of this.cells){
			if(cell.isEmpty()) continue;

			if(this.isActiveShape(cell.shape)){
				return cell.shape;
			}
		}
	}

	/**
	 * Moves the current active shape left
	 * if such is a valid move.
	 */
	moveLeft(){
		if(!this.activeShape) return;
		this.move(this.activeShape, "left");
	}

	/**
	 * Moves the current active shape right
	 * if such is a valid move.
	 */
	moveRight(){
		if(!this.activeShape) return;
		this.move(this.activeShape, "right");
	}

	/**
	 * Moves the current active shape down
	 * until it collides with another shape or
	 * the floor.
	 */
	moveBottom(){
		if(!this.activeShape) return;

		while(this.activeShape){
			this.unresolve();
			this.resolve();
		}
	}
}

export default Board;