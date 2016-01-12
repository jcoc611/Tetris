import {COLORS, GHOST_COLOR, SHAPES, LOCK_TIMEOUT} from './constants.jsx';
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

		// Shapes
		this._ghostShape = null;
		this._activeShape = null;

		this.lockTimeout = null;

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

		this.on("add", this.moveBottom);

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
			if(cell.shape == this._ghostShape) continue;

			this.move(cell.shape, "down");
			flag = false;
		}
		
		// Process board
		for(let cell of this.cells){
			if(cell.resolved) continue;
			if(cell.isEmpty()) continue;
			if(cell.shape == this._ghostShape) continue;
			
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

		// Is there an active shape that is falling?
		var isActiveFalling = (
			this.activeShape 
			&& this.isActiveShape(this.activeShape)
		);

		// If active shape has touched ground, start lock timeout
		// if it has started falling again, clear timeout
		if(this.lockTimeout == null
			&& this.activeShape
			&& !isActiveFalling) this.resetActiveLock();
		else if(isActiveFalling) this.clearActiveLock();


		// If there is no active shape, add a new one.
		if(!this.activeShape) this.insertShape();
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

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	insertShape(){
		var rand = this.getRandomInt(0, 6);
		var sh = Shape.fromScheme(SHAPES[rand], this.nextColor());

		sh.move(0, -sh.height);
		this._activeShape = sh;

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
		// Ignore ghost
		if(newShape == this._ghostShape) return;

		// Shape has moved from (ox, oy) to (nx, ny)
		// Delete shape at (ox, oy).
		this.deleteShape(old);

		// Add shape at (nx, ny)
		this.addShapeCool(newShape);

		// If this active den update ghost
		if(this.activeShape == newShape){
			this.updateGhost();
		}
	}

	updateGhost(){
		if(!this.activeShape) return;

		if(this._ghostShape){
			this.deleteShape(this._ghostShape);
		}

		var active = this.activeShape,
			ghost = active.clone();

		this.deleteShape(active);

		ghost.color = GHOST_COLOR;
		if(ghost.y < 0) ghost.move(ghost.x, 0, true);

		while(this.move(ghost, "down")){}

		this._ghostShape = ghost;
		this.addShapeCool(this._ghostShape);

		this.addShapeCool(active);
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
		
		for(let cell of shape.cells){
			if(cell.isEmpty()) continue;

			// Left bound
			if(cell.x + dx < 0){
				return false;
			}

			// Right bound
			if(cell.x + dx >= this.width){
				return false;
			}

			// Bottom bound
			if(cell.y + dy >= this.height){
				shape.resolve();
				return false;
			}

			// Cell located at (cell.x + dx, cell.y + dy)
			// must either be empty or belong to this shape
			var dcell = this.get(cell.x + dx, cell.y + dy);

			if(!dcell || dcell.shape == shape
				|| dcell.shape == this._ghostShape) continue;
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
		if(!shape) return false;

		for(let cell of shape.cells){
			if(cell.isEmpty()) continue;

			// Bottom bound
			if(cell.y + 1 >= this.height){
				return false;
			}

			// Cell located at (cell.x, cell.y + 1)
			// must either be empty or belong to this shape
			var dcell = this.get(cell.x, cell.y + 1);

			if(!dcell || dcell.shape == shape
				|| dcell.shape == this._ghostShape) continue;
			if(!dcell.isEmpty()) return false;
		}
		return true;
	}

	resetActiveLock(){
		this.clearActiveLock();

		var self = this;
		this.lockTimeout = setTimeout(function(){
			self.deactivateShape();
		}, LOCK_TIMEOUT);
	}

	clearActiveLock(){
		if(this.lockTimeout !== null){
			clearTimeout(this.lockTimeout);
			this.lockTimeout = null;
		}
	}

	/**
	 * Returns the current falling shape in the board, if there is one.
	 * @return {Shape} currently falling shape.
	 */
	get activeShape(){
		return this._activeShape;
	}

	/**
	 * Moves the current active shape left
	 * if such is a valid move.
	 */
	moveLeft(){
		if(!this.activeShape) return;
		this.move(this.activeShape, "left");
		if(this.lockTimeout !== null) this.resetActiveLock();
		this.emit("change");
	}

	/**
	 * Moves the current active shape right
	 * if such is a valid move.
	 */
	moveRight(){
		if(!this.activeShape) return;
		this.move(this.activeShape, "right");
		if(this.lockTimeout !== null) this.resetActiveLock();
		this.emit("change");
	}

	get emptyLines(){
		var lines = [];

		for(let row = 0; row < this.cells.height; row++){
			// Check if full
			var full = true;
			for(let col = 0; col < this.cells.width; col++){
				var cell = this.cells.get(col, row);
				if(!cell || cell.isEmpty()
					|| cell.shape == this._ghostShape){
					full = false;
					break;
				}
			}
			if(full) lines.push(row);
		}

		return lines;
	}

	clearLines(lines){
		for(var z = 0; z < lines.length; z++){
			var shapes = new Set();
		}
	}

	deactivateShape(){
		this.lockTimeout = null;
		this._activeShape = null;
		this._ghostShape = null;
	}

	/**
	 * Moves the current active shape down
	 * until it collides with another shape or
	 * the floor.
	 */
	moveBottom(){
		if(!this.activeShape) return;

		while(this.move(this.activeShape, "down")){}

		if(this.lockTimeout !== null) clearTimeout(this.lockTimeout);
		this.deactivateShape();
		this.insertShape();
	}

	rotateCounterclockwise(){
		if(!this.activeShape) return;
		this.activeShape.rotate(CellGrid.COUNTER_CLOCKWISE);
		if(this.lockTimeout !== null) this.resetActiveLock();
		this.emit("change");
	}

	rotateClockwise(){
		if(!this.activeShape) return;
		this.activeShape.rotate(CellGrid.CLOCKWISE);
		if(this.lockTimeout !== null) this.resetActiveLock();
		this.emit("change");
	}
}

export default Board;