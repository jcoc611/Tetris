export var DEFAULT_COLOR = '#EEEEEE';
export var GHOST_COLOR = '#CCCCCC';

// Shapes - 2d arrays [y][x] of bool, and their colors.
export var SHAPES = [
	{		
		scheme: [
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		],
		// Cyan
		color: "#65B8D8"
	},
	{		
		scheme: [
			[1, 0, 0],
			[1, 1, 1],
			[0, 0, 0]
		],
		// Blue
		color: "#6578D8"
	},
	{		
		scheme: [
			[0, 0, 1],
			[1, 1, 1],
			[0, 0, 0]
		],
		// Orange
		color: "#D88A65"
	},
	{		
		scheme: [
			[1, 1],
			[1, 1]
		],
		// Yellow
		color: "#D8CF65"
	},
	{		
		scheme: [
			[0, 1, 1],
			[1, 1, 0],
			[0, 0, 0]
		],
		// Green
		color: "#65D87E"
	},
	{		
		scheme: [
			[1, 1, 0],
			[0, 1, 1],
			[0, 0, 0]
		],
		// Red
		color: "#D86565"
	},
	{		
		scheme: [
			[0, 1, 0],
			[1, 1, 1]
		],
		// Purple
		color: "#AC65D8"
	}
];

// Dimensions
export var CELL_SIZE = 20;
export var CELL_MARGIN = 1;
export var BOARD_WIDTH = 10;
export var BOARD_HEIGHT = 20;

// Times
export var LOCK_TIMEOUT = 300;
export var STEP_TIMEOUT = 600;
export var STEP_FAST_TIMEOUT = 80;

