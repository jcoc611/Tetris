export var COLORS = {
	DEFAULT: 'transparent',
	blue: '#6D80C3',
	purple: '#C36DC0',
	red: '#C36D6D',
	weed: '#6DC3AF',
	money: '#92C36D',
	gold: '#C3B86D'
};

export var COLOR_KEYS = Object.keys(COLORS);

// Shapes are 2d arrays [x, y] of bool.
export var SHAPES = [
	[
		[1]
	],
	[
		[1, 1]
	],
	[
		[1,1,1],  // $ $ $
		[0,1,0]   //    $
	]
];

export var CELL_SIZE = 20;