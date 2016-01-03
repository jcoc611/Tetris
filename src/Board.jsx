import {COLORS, SHAPES} from './constants.jsx';
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
		this.on("down", this.rotateCounterclockwise);
		this.on("up", this.rotateClockwise);

		this.on("add", this.handleAdd);

	}

	/**
	 * Returns the next shape color.
	 * @return {String} next color in #RRGGBB format.
	 */
	nextColor(){
		if(this.colorIndex + 1 == COLORS.length){
			this.colorIndex = 0;
		}else this.colorIndex++;

		return COLORS[this.colorIndex];
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

			this.move(cell.shape, "down");
			flag = false;
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

	set(x, y, cell){
		if(y < 0) return this.queue.set(
			x,
			this.queue.height + y,
			cell
		);
		else return this.cells.set(
			x,
			y,
			cell
		);
	}

	handleAdd(){
		var sh = Shape.fromScheme(SHAPES[2], this.nextColor());
		sh.move(0, -sh.height);
		this.addShape(sh);
	}

	/**
	 * Enqueues a shape to this board.
	 * @param {Shape} shape The shape to be enqueued.
	 */
	addShape(shape){
		shape.on("change", this.shapeChanged.bind(this));

		this.queue.clear();
		this.queue.addShape(shape);
	}

	deleteShape(shape){
		for(let cell of shape.cells){
			this.set(cell.x, cell.y, new Cell(cell.x, cell.y));
		}
	}

	addShapeCool(shape){
		for(let cell of shape.cells){
			this.set(cell.x, cell.y, cell);
		}
	}

	/**
	 * Handles the mutation of a shape.
	 * @param  {Shape} shape The shape that changed.
	 * @param  {int} ox  The original x coordinate of the shape.
	 * @param  {int} oy  The original y coordinate of the shape.
	 * @param  {int} nx  The new x coordinate of the shape.
	 * @param  {int} ny  The new y coordinate of the shape.
	 */
	shapeChanged(old, newShape){
		// Shape has moved from (ox, oy) to (nx, ny)
		// Delete shape at (ox, oy).
		// this.deleteScheme(old.x, old.y, newShape.scheme);
		this.deleteShape(old);

		// Add shape at (nx, ny)
		this.addShapeCool(newShape);
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
			return false;
		}
		// Right bound
		if(shape.x + dx + shape.width > this.width){
			return false;
		}
		// Bottom bound
		if(shape.y + dy + shape.height > this.height){
			shape.resolve();
			return false;
		}

		for(let cell of shape.cells){
			if(cell.isEmpty()) continue;

			// Cell located at (cell.x + dx, cell.y + dy)
			// must either be empty or belong to this shape
			var dcell = this.get(cell.x + dx, cell.y + dy);

			if(!dcell || dcell.shape == shape) continue;
			if(!dcell.isEmpty()){
				shape.resolve();
				return false;
			}
		}

		// Move
		shape.move(shape.x + dx, shape.y + dy);
		shape.resolve();
		return true;
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
		this.emit("change");
	}

	/**
	 * Moves the current active shape right
	 * if such is a valid move.
	 */
	moveRight(){
		if(!this.activeShape) return;
		this.move(this.activeShape, "right");
		this.emit("change");
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

	rotateCounterclockwise(){
		if(!this.activeShape) return;
		this.activeShape.rotate(CellGrid.COUNTER_CLOCKWISE);
	}

	rotateClockwise(){
		if(!this.activeShape) return;
		this.activeShape.rotate(CellGrid.CLOCKWISE);
	}
}

export default Board;