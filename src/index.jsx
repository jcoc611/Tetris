/**
 *  Tetris
 *  A modern implementation of the classic.
 *  JCOC611 2016.
 *  MIT License, see LICENSE.
 * @preserve
 */
require("!style!css!sass!./style.scss");

import Interface from './Interface.jsx';
import Board from './Board.jsx';
import {BOARD_HEIGHT} from './constants.jsx';

$(function(){
	var board = new Board(BOARD_HEIGHT);
	var inter = new Interface(board);
	inter.start();
});

// TFIN