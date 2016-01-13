export var COLORS = [
	'#6D80C3',
	'#C36DC0',
	'#C36D6D',
	'#6DC3AF',
	'#92C36D',
	'#C3B86D'
];

export var DEFAULT_COLOR = '#EEEEEE';
export var GHOST_COLOR = '#CCCCCC';

// Shapes are 2d arrays [x, y] of bool.
export var SHAPES = [
	[
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0]
	],
	[
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0]
	],
	[
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0]
	],
	[
		[1, 1],
		[1, 1]
	],
	[
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0]
	],
	[
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0]
	],
	[
		[0, 1, 0],
		[1, 1, 1]
	]
];

export var CELL_SIZE = 20;
export var CELL_MARGIN = 1;

export var LOCK_TIMEOUT = 500;

export var BOARD_WIDTH = 10;