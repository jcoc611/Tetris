import { 	CELL_SIZE,
		CELL_MARGIN,
		STEP_TIMEOUT,
		PACE_NORMAL,
		PACE_FAST
	} from './constants.jsx';
import easeOutBounce from './jquery.easing.jsx';

/**
 * A Tetris game user interface.
 */
class Interface {
	/**
	 * Creates a new game interface.
	 * @param  {Board} board The board of this new game.
	 * @constructor
	 */
	constructor(board){
		this._board = board;
		this._timeout = null;
		this._nextTimeout = null;
		this._pace = 0;
	}

	/**
	 * Starts the game.
	 */
	start(){
		var board = this._board,
			self = this;

		var $b = $("#board");

		// Add custom animations
		$.easing.easeOutBounce = easeOutBounce;

		$b.css({
			width: CELL_SIZE * board.width,
			height: CELL_SIZE * board.height
		});

		// Create cells
		for(let cell of board.cells){
			var $cell = $("<span>");

			$cell.attr("id", "cell_" + cell.y + "_"  + cell.x)
				.addClass("cell")
				.css({
					width: CELL_SIZE - 2*CELL_MARGIN,
					height: CELL_SIZE - 2*CELL_MARGIN,
					margin: CELL_MARGIN
				});

			$b.append($cell);
		}

		// Draw the next shapes
		for(let shape of board.bag.peek(3)){
			this.addNextShape(shape);
		}

		$(document).on("keydown",function(e){
			switch(e.which){
				case 37:
					board.emit("left");
					break;
				case 39:
					board.emit("right");
					break;
				case 40:
					self.pace = PACE_FAST;
					break;
			}
		}).on("keyup", function(e){
			switch(e.which){
				case 32:
					board.emit("add");
					break;
				
				case 38:
					board.emit("up");
					break;

				case 40:
					self.pace = PACE_NORMAL;
					break;
			}
		});

		board.on("death", this.stop.bind(this));
		board.on("change", this.redraw.bind(this));
		board.on("shape:add", this.updateNext.bind(this));
		board.on("score:change", function(score){
			self.score = score;
		});
		board.on("level:change", function(level){
			self.level = level;
		});

		this.pace = PACE_NORMAL;
		this.score = 0;
		this.level = 1;
	}

	/**
	 * Prepares the next step of the game.
	 */
	enqueue(){
		if(this._timeout !== null) clearTimeout(this._timeout);
		this._timeout = setTimeout(
			this.step.bind(this),
			(1 / this.pace) * STEP_TIMEOUT * (1/Math.log(this._board.level + 1))
		);
	}

	/**
	 * Computes and displays a new frame.
	 */
	step(){
		this._timeout = null;
		this._board.step();
		
		this.redraw();
		this.enqueue();
	}

	/**
	 * Displays the board cells on the screen.
	 */
	redraw(){
		// Draw
		for(let cell of this._board.cells){
			$("#cell_" + cell.y + "_" + cell.x).css({
				backgroundColor: cell.color,
				boxShadow: "0 0 2px " + cell.color
					+ ", inset 0 0 15px rgba(255, 255, 255, 0.2)"
			});
		}
	}

	/**
	 * Removes the top-most shape in the next shapes queue
	 * and moves the queue up.
	 */
	updateNext(){
		// Get next shape
		var next = this._board.bag.peekAt(2), self = this;

		// Insert next shape
		this.addNextShape(next);

		// Animate shape being inserted
		// (First child of div)
		var $el = $("#next-shapes .shape:first-child");

		if(this._nextTimeout !== null){
			clearTimeout(this._nextTimeout);
			$el.remove();
			$el = $("#next-shapes .shape:first-child");
		}

		$el.animate({
			right: -1000
		}, 200).delay(400).animate({
			height: 0
		}, 400, "easeOutBounce");

		this._nextTimeout = setTimeout(function(){
			$el.remove();
			self._nextTimeout = null;
		}, 1000);
	}

	/**
	 * Inserts a shape to the bottom of the next shapes queue.
	 * @param {Shape} shape  the shape to be inserted.
	 */
	addNextShape(shape){
		var $shape = $("<span>");

		$shape.addClass("shape")
		.css({
			width: CELL_SIZE*shape.cells.width,
			height: CELL_SIZE*2, // Hardcoded for better style,
			opacity: 0
		});

		for(let row = 0; row < shape.cells.height; row++){
			for(let col = 0; col < shape.cells.width; col++){
				var $cell = $("<span>");

				var cell = shape.cells.get(col, row),
					cellColor = (cell)? cell.color : "#FFF";

				$cell.addClass("cell")
				.css({
					width: CELL_SIZE - 2*CELL_MARGIN,
					height: CELL_SIZE - 2*CELL_MARGIN,
					margin: CELL_MARGIN,
					backgroundColor: cellColor,
					boxShadow: "0 0 2px " + cellColor
						+ ", inset 0 0 15px rgba(255, 255, 255, 0.2)"
				});

				$shape.append($cell);
			}
		}

		$("#next-shapes").append($shape);
		$shape.animate({
			opacity: 1
		}, 400);
	}

	/**
	 * Stops the game.
	 */
	stop(){
		clearTimeout(this._timeout);
		this.pace = 0;
		$("#death").fadeIn(200);
	}

	/**
	 * Returns the current pace of the game
	 * @return {int}  the step coefficient determining the
	 *                    current pace. Bigger is faster.
	 */
	get pace(){
		return this._pace;	
	}

	/**
	 * Sets a new pace for the game.
	 * @param  {int} p  the new pace.
	 */
	set pace(p){
		if(this._pace == p) return;
		this._pace = p;

		this.enqueue();
	}

	/**
	 * Sets the current score displayed to the user.
	 * @param  {int} score  the current score.
	 */
	set score(score){
		$("#score-count").text(score);
	}

	/**
	 * Sets the current level displayed to the user.
	 * @param  {int} level  the current level.
	 */
	set level(level){
		$("#level-count").text(level);
	}
};

export default Interface;