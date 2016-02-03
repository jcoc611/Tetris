export var DEFAULT_COLOR = '#EEEEEE';
export var GHOST_COLOR = '#CCCCCC';

// Dimensions
export var CELL_SIZE = 20;
export var CELL_MARGIN = 1;
export var BOARD_WIDTH = 10;
export var BOARD_HEIGHT = 20;

// Times
export var LOCK_TIMEOUT = 300;
export var STEP_TIMEOUT = 600;
export var STEP_FAST_TIMEOUT = 80;

// Paces
export var PACE_NORMAL = 1;
export var PACE_FAST = 10;

// Key Repeat (ms)
export var DAS_INTERVAL = 30;
export var DAS_DELAY = 200;

// Shapes - 2d arrays [y][x] of bool, their spawn locations, and their colors.
export var SHAPES = [
	{		
		scheme: [
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		],
		x: 3,
		y: -1,
		// Cyan
		color: "#65B8D8"
	},
	{		
		scheme: [
			[1, 0, 0],
			[1, 1, 1],
			[0, 0, 0]
		],
		x: 1,
		y: -2,
		// Blue
		color: "#6578D8"
	},
	{		
		scheme: [
			[0, 0, 1],
			[1, 1, 1],
			[0, 0, 0]
		],
		x: 1,
		y: -2,
		// Orange
		color: "#D88A65"
	},
	{		
		scheme: [
			[1, 1],
			[1, 1]
		],
		x: 4,
		y: -2,
		// Yellow
		color: "#D8CF65"
	},
	{		
		scheme: [
			[0, 1, 1],
			[1, 1, 0],
			[0, 0, 0]
		],
		x: 1,
		y: -2,
		// Green
		color: "#65D87E"
	},
	{		
		scheme: [
			[1, 1, 0],
			[0, 1, 1],
			[0, 0, 0]
		],
		x: 1,
		y: -2,
		// Red
		color: "#D86565"
	},
	{		
		scheme: [
			[0, 1, 0],
			[1, 1, 1]
		],
		x: 1,
		y: -2,
		// Purple
		color: "#AC65D8"
	}
];