// Index
require("!style!css!sass!./style.scss");

import Interface from './Interface.jsx';
import Board from './Board.jsx';

$(function(){
	var board = new Board(20, 30);
	var inter = new Interface(board);
	inter.start();
});