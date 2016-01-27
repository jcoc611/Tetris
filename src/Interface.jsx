import {CELL_SIZE, CELL_MARGIN, STEP_TIMEOUT, STEP_FAST_TIMEOUT} from './constants.jsx';
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

		/**
		* Game Pace
		* 0 - none (stoped)
		* 1 - normal
		* 2 - fast
		**/
		this.pace = 0;
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
				case 40:
					self.paceFast();
					break;
				case 37:
					board.emit("left");
					break;
				case 39:
					board.emit("right");
					break;
			}
		}).on("keyup", function(e){
			switch(e.which){
				case 32:
					board.emit("add");
					break;
				case 40:
					self.paceNormal();
					break;
				case 38:
					board.emit("up");
					break;
			}
		});

		board.on("death", this.stop.bind(this));
		board.on("change", this.redraw.bind(this));
		board.on("score:change", this.setScore.bind(this));
		board.on("level:change", this.setLevel.bind(this));
		board.on("shape:add", this.updateNext.bind(this));

		this.paceNormal();
		this.setScore(0);
		this.setLevel(1);
	}

	paceNormal(){
		if(this.pace == 1) return; // Already at right pace

		this.pace = 1;
		this.enqueue();
	}

	paceFast(){
		if(this.pace == 10) return; // Already at right pace
		
		this.pace = 10;
		this.enqueue();
	}

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

	setScore(score){
		$("#score-count").text(score);
	}

	setLevel(level){
		$("#level-count").text(level);
	}

	/**
	 * Stops the game.
	 */
	stop(){
		clearTimeout(this._timeout);
		this.pace = 0;
		$("#death").fadeIn(200);
	}
};

export default Interface;