// Index
require("!style!css!sass!./style.scss");

import Interface from './Interface.jsx';
import Board from './Board.jsx';

$(function(){
	var board = new Board(25);
	var inter = new Interface(board);
	inter.start();
});