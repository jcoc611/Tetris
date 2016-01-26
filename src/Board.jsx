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
		this.on("up", this.rotate);

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
		for(let row = this.height - 1; row >= 0; row--){
			for(let col = this.width - 1; col >= 0; col--){
				let cell = this.cells.get(col, row);

				if(cell.resolved) continue;
				if(cell.isEmpty()) continue;
				if(cell.shape == this._ghostShape) continue;
				
				if(this.isActiveShape(cell.shape)){
					this.move(cell.shape, "down");
					flag = false;
				}else cell.shape.resolve();
			}
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

	insertShape(){
		// Check for full lines + delete
		var el = this.fullLines;
		if(el.length) this.clearLines(el);

		var sh = this.bag.grab();

		sh.move(0, -sh.height);
		this._activeShape = sh;

		this.addShape(sh);

		this.queue.clear();
		this.queue.addShape(sh);

		this.emit("shape:add");
	}


	addShape(shape){
		shape.on("change", this.shapeChanged.bind(this));
		shape.on("rotate", this.shapeRotated.bind(this));
	}


	deleteShape(shape){
		for(let cell of shape.cells){
			this.set(cell.x, cell.y, new Cell(cell.x, cell.y));
		}
	}

	drawShape(shape){
		for(let cell of shape.cells){
			this.set(cell.x, cell.y, cell);
		}
	}

	shapeRotated(old, rotated){
		this.deleteShape(old);

		// Check collisions
		// If rotation takes shape off-screen
		// Move the shape into screen if possible
		// (If such move doesn't collide with another shape)
		for(let cell of rotated.cells){
			var boardCell = this.get(cell.x, cell.y);
			if(boardCell && boardCell.shape && boardCell.shape != old){
				return this.drawShape(old);
			}
			// Check bounds
			// Left bound
			if(cell.x < 0){
				if(!this.move(old, "right", true)) return this.drawShape(old);;
			}

			// Right bound
			if(cell.x >= this.width){
				if(!this.move(old, "left", true)) return this.drawShape(old);;
			}

			// Bottom bound
			if(cell.y >= this.height){
				shape.resolve();
				return this.drawShape(old);;
			}
		}

		// TODO: think of way to prevent rotating twice
		old.cells.rotate();
		this.drawShape(old);

		this.updateGhost();
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

		this.deleteShape(old);
		this.drawShape(newShape);

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

		while(this.move(ghost, "down")){}

		this._ghostShape = ghost;
		this.drawShape(this._ghostShape);

		this.drawShape(active);
	}

	/**
	 * Moves shape in a given direction if such move is valid.
	 * @param  {Shape} shape  The shape to be moved.
	 * @param  {String} direction The direction the shape
	 *                            should be moved.
	 */
	move(shape, direction, flag){
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
		shape.move(shape.x + dx, shape.y + dy, flag);
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
			if(self.lockTimeout !== null) self.deactivateShape();
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

	groupRange(start, end){
		if(start > end) return;

		// INCLUSIVE
		var shape = new Shape(), sy = null;

		shape.x = 0;
		shape.y = start;
		this.addShape(shape);

		// Copy all cells up to, excluding line.
		// Skip empty lines before first non-empty cell.
		for(let y = start; y <= end; y++){
			for(let x = 0; x < this.cells.width; x++){
				var cell = this.cells.get(x, y);

				if(cell && (!cell.shape || cell.shape == this._ghostShape)) cell = null;
				if(cell){
					cell.shape = shape;
					//cell.move(x, y); // Fixes some bugs
				}

				shape.cells.set(
					x, y - start, cell
				);
				this.cells.set(x, y, cell || new Cell(x, y));
			}
		}
	}

	clearLines(lines){
		// Precondition, lines are full

		// group before first line
		this.groupRange(this.firstLine, lines[0] - 1);

		// group between lines
		for(let z = 0; z < lines.length - 1; z++){
			this.groupRange(lines[z] + 1, lines[z+1] - 1);
		}

		// Group after last line
		this.groupRange(lines[lines.length-1] + 1, this.height);

		// Delete lines
		for(let line of lines){
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
		if(this._activeShape && this._activeShape.y < 0){
			this.emit("death");
		}
		if(this._activeShape && this.isActiveShape(this._activeShape)){
			return this.clearActiveLock();
		}
		// Undraw/delete ghost
		if(this._ghostShape){
			for(let cell of this._ghostShape.cells){
				if(this.get(cell.x, cell.y).shape == this._ghostShape){
					this.set(cell.x, cell.y, new Cell(cell.x, cell.y));
				}
			}
		}

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

	rotate(){
		if(!this.activeShape) return;
		this.activeShape.rotate();
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