import {GHOST_COLOR, LOCK_TIMEOUT, BOARD_WIDTH} from './constants.jsx';
import CellGrid from './CellGrid.jsx';
import Emitter from './Emitter.jsx';
import Shape from './Shape.jsx';
import Cell from './Cell.jsx';
import Bag from './Bag.jsx';

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
	constructor(h){
		super();

		// Settings
		this.width = BOARD_WIDTH;
		this.height = Math.max(h, 20);

		// Grids
		this.cells = new CellGrid();
		this.queue = new CellGrid();

		// Shapes
		this._ghostShape = null;
		this._activeShape = null;

		// Timeouts
		this.lockTimeout = null;

		// 7-bag of tetrominos
		this.bag = new Bag(3);

		// Scores
		this.score = 0;

		// Initialize cells
		for(let i = 0; i < this.height; i++){
			for(let k = 0; k < this.width; k++){
				this.cells.set(k, i, new Cell(k, i));
			}
		}

		// Handlers
		this.on("left", this.moveLeft);
		this.on("right", this.moveRight);
		this.on("down", this.step);
		this.on("up", this.rotateClockwise);

		this.on("add", this.moveBottom);

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


		if(!this.activeShape){
			// Since there is no active shape, add a new one.
			this.insertShape();
		}
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
		// Check for full lines + delete
		var el = this.fullLines;
		if(el.length) this.clearLines(el);

		var sh = this.bag.grab();

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

	get fullLines(){
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

	get firstLine(){
		for(let row = 0; row < this.cells.height; row++){
			// Check if full
			
			for(let col = 0; col < this.cells.width; col++){
				var cell = this.cells.get(col, row);
				if(!cell || cell.isEmpty()
					|| cell.shape == this._ghostShape){
					
				}else return row;
			}
		}

		return null;
	}

	clearLines(lines){
		// Precondition, lines are full
		for(let line of lines){
			// Group all shapes into two (above line and below)

			// Above
			if(line > 0){
				var aboveShape = new Shape(), sy = null;
				var fl = this.firstLine;

				aboveShape.x = 0;
				aboveShape.y = fl;
				aboveShape.on("change", this.shapeChanged.bind(this));

				// Copy all cells up to, excluding line.
				// Skip empty lines before first non-empty cell.
				for(let y = fl; y < line; y++){
					for(let x = 0; x < this.cells.width; x++){
						var cell = this.cells.get(x, y);

						if(cell && (!cell.shape || cell.shape == this._ghostShape)) cell = null;
						if(cell){
							cell.shape = aboveShape;
							cell.move(x, y); // Fixes some bugs
						}

						aboveShape.cells.set(
							x, y - fl, cell
						);
					}
				}
			}

			// Below
			if(line + 1 < this.cells.height){
				var belowShape = new Shape();
				belowShape.x = 0;
				belowShape.y = line + 1;
				belowShape.on("change", this.shapeChanged.bind(this));

				// Copy all cells up to, excluding rline
				for(let y = line + 1; y < this.height; y++){
					for(let x = 0; x < this.width; x++){
						var cell = this.cells.get(x, y);

						if(cell && (!cell.shape || cell.shape == this._ghostShape)) cell = null;
						if(cell) cell.shape = belowShape;

						belowShape.cells.set(
							x, y - line - 1, cell
						);
					}
				}
			}

			// Empty cells of this line
			for(let col = 0; col < this.cells.width; col++){
				this.cells.set(col, line, new Cell(col, line));
			}

			
		}

		// Add score, exponential
		this.score += Math.pow(2, lines.length) * 10;
		this.emit("score:change", this.score);

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

	get score(){
		return this._score;
	}

	set score(s){
		this._score = s;
		this.emit("score:change", s);
	}
}

export default Board;