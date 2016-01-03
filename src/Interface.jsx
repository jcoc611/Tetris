import {CELL_SIZE, CELL_MARGIN} from './constants.jsx';

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
		this.time = 300;
	}

	/**
	 * Starts the game.
	 */
	start(){
		var board = this._board;
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

			$b.append($cell	);
		}

		$("body").on("keyup", function(e){
			switch(e.which){
				case 32:
					board.emit("add");
					break;
				case 37:
					board.emit("left");
					break;
				case 40:
					board.emit("down");
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

		this._interval = setInterval(this.step.bind(this), this.time);
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
				backgroundColor: cell.color
			});
		}
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