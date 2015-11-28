import {CELL_SIZE} from './constants.jsx';

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
		this._interval = null;
		this.time = 300;
	}

	/**
	 * Starts the game.
	 */
	start(){
		var board = this._board;

		$("#board").css({
			width: CELL_SIZE * board.width,
			height: CELL_SIZE * board.height
		});

		for(let cell of board.cells){
			$("#board").append(
				"<span style='width:"
				+ CELL_SIZE
				+ "px;height:"
				+ CELL_SIZE
				+ "px' class='cell' id='cell_"
				+ cell.y + "_"  + cell.x + "'>"
			);
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