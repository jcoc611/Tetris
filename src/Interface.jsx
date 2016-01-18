import {CELL_SIZE, CELL_MARGIN, STEP_TIMEOUT, STEP_FAST_TIMEOUT} from './constants.jsx';

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
		board.on("change", this.redraw.bind(this));

		this._interval = null;

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

		$("body").on("keydown",function(e){
			if(e.which == 40) self.paceFast();
		}).on("keyup", function(e){
			switch(e.which){
				case 32:
					board.emit("add");
					break;
				case 37:
					board.emit("left");
					break;
				case 40:
					//board.emit("down");
					self.paceNormal();
					break;
				case 39:
					board.emit("right");
					break;
				case 38:
					board.emit("up");
					break;
			}
		});

		board.on("death", this.stop);
		board.on("score:change", this.setScore);

		this.paceNormal();
		this.setScore(0);
	}

	paceNormal(){
		if(this.pace == 1) return; // Already at right pace
		if(this._interval) clearInterval(this._interval);

		this._interval = setInterval(
			this.step.bind(this),
			STEP_TIMEOUT
		);

		this.pace = 1;
	}

	paceFast(){
		if(this.pace == 2) return; // Already at right pace
		if(this._interval) clearInterval(this._interval);

		this._interval = setInterval(
			this.step.bind(this),
			STEP_FAST_TIMEOUT
		);
		this.step();

		this.pace = 2;
	}

	/**
	 * Computes and displays a new frame.
	 */
	step(){
		this._board.step();
		
		this.redraw();
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

	setScore(score){
		$("#score-count").text(score);
	}

	/**
	 * Stops the game.
	 */
	stop(){
		clearInterval(this._interval);
		alert("rekt");
	}
};

export default Interface;