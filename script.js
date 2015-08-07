"use strict";
jQuery(function($){
	//'''''''''''''''''''''''''''''''''''''''''
	// CONSTANTS
	//,,,,,,,,,,,,,,,,,,,,,,,,,,
	var COLORS = {
		DEFAULT: 'transparent',
		blue: '#6D80C3',
		purple: '#C36DC0',
		red: '#C36D6D',
		weed: '#6DC3AF',
		money: '#92C36D',
		gold: '#C3B86D'
	};

	var COLOR_KEYS = Object.keys(COLORS);

	var SHAPES = [
		// Shapes are 2d arrays [x, y] of bool.
		[
			[1]
		],
		[
			[1,1,1],  // $ $ $
			[0,1,0]   //    $
		]
	];

	function loop(cb, s, max_x, max_y){
		max_x = max_x || BOARD_WIDTH;
		max_y = max_y || BOARD_HEIGHT;

		if(typeof(max_x) === "object"){
			max_y = max_x.length;
		}

		if(s === true){
			for(var y = max_y - 1; y >= 0; y--){
				var max_x_processed;
				if(typeof(max_x) === "object"){
					max_x_processed = max_x[y].length;
				}else{
					max_x_processed = max_x;
				}

				var f;
				for(var x = 0; x < max_x_processed; x++){
					f = cb.call(this, x, y);
					if(f === false) break;
				}
				if(f === false) break;
			}
		}else{
			for(var y = 0; y < max_y; y++){
				var max_x_processed;
				if(typeof(max_x) === "object"){
					max_x_processed = max_x[y].length;
				}else{
					max_x_processed = max_x;
				}

				var f;
				for(var x = 0; x < max_x_processed; x++){
					f = cb.call(this, x, y);
					if(f === false) break;
				}
				if(f === false) break;
			}
		}
	}

	//'''''''''''''''''''''''''''''''''''''''
	// Classes
	//,,,,,,,,,,,,,,,,,,,,,,,,
	function cell(x, y){
		/*

		Represents a single cell in the board.

		Properties:
			- resolved: whether or not the cell has been
				correctly pre-processed before being
				rendered.
			- shape: identifies the shape the cell belongs
				to (if any).
				- x: relative to the origin of the shape (left)
				- y: relative to the origin of the shape (top)
			- color
			- x
			- y

		*/
		this.color = COLORS["DEFAULT"];
		this.resolved = true;
		this.x = x;
		this.y = y;
		this.shape = null;

		// READ
		this.isEmpty = function(){
			return (this.shape === null);
		}

		// UPDATE
		this.off = function(){
			this.shape = null;
			this.resolved = true;
			this.color = COLORS["DEFAULT"];
			return this;
		}
		this.setColor = function(color){
			this.color = COLORS[color];
		}
	}

	function shape(options){
		/*

		Represents a collection of
		cells. 

		options can be:
			- Scheme: a 2d array of
				booleans. True means "on",
				so that cell gets drawn, and
				false means "off", so that
				cell gets ignored.
			- cell: any cell of a shape already
				within the board.

		*/
		if(instanceof(options, cell)){
			this.x = options.x - options.shape.x;
			this.x = options.shape.y;
		}else{
			this.scheme = options;
		}
		this.x = 0;
		this.y = 0;

		// Useful
		this.resolve = function(){
			var cell = get(x, y),
				shape = SHAPES[cell.shape],
				dx = x - cell.shape_x, // x origin of shape
				dy = y - cell.shape_y; // y origin of shape

			loop(function(x2, y2){
				map[dy + y2][dx + x2].resolved = true;
			}, false, shape);
		};
		this.unresolve = function(){
			loop(function(x, y){
				var cell = get(x, y);
				if(cell.shape !== null) cell.resolved = false;
				else cell.resolved = true;
			});
		}

		this.pullShape = function(x, y, direction){
			/* (int, int, str)

			Move shape that has cell at x, y
			down if possible. If direction is set,
			then move it in that direction (left/right).

			*/
			// Check if can be moved down
			var cell = get(x, y),
				shape = SHAPES[cell.shape],
				dx = x - cell.shape_x, // x origin of shape
				dy = y - cell.shape_y; // y origin of shape

			var pf = true;

			if(dy < 0){
				shape = shape.slice(-1 * dy);
				dy = 0;
			}

			// The x and y modifiers
			var xm = 0,
				ym = 1;

			if(direction === "right"){
				xm = 1;
				ym = 0;
			}else if(direction === "left"){
				xm = -1;
				ym = 0;
			}

			loop(function(x2, y2){
				if(shape[y2][x2]){
					var pff;
					if(isEmpty(dx + x2 + xm, dy + y2 + ym)) pff = true;
					else{
						pff = (shape[y2 + ym] && shape[y2 + ym][x2 + xm]);
					}
					pf &= pff;
				}
			}, false, shape);

			if(!pf) return resolveShape(x, y);

			// Move
			loop(function(x2, y2){
				if(shape[y2][x2]){
					on(dx + x2 + xm, dy + y2 + ym, off(dx + x2, dy + y2));
					get(dx + x2 + xm, dy + y2 + ym).resolved = true;	
				}
			}, true, shape);
		}
	};

	function board(){
		var self = this;
		this.queueColor = "#000";
		this.colorIndex = 0;
		this.map = [];

		// Settings
		this.width = 20;
		this.height = 30;
		this.cell_size = 20;

		this.nextColor = function(){
			if(this.colorIndex == COLOR_KEYS.length){
				this.colorIndex = 0;
			}else this.colorIndex++;

			if(COLOR_KEYS[this.colorIndex] == "DEFAULT"){
				this.nextColor();
			}else COLORS[COLOR_KEYS[this.colorIndex]];
		};

		this.resolve = function(){
			var flag = false;
			
			this.cells.each(function(cell){
				if(cell.isEmpty() || cell.resolved){
					cell.resolved = true;
				}else if(cell.below().isEmpty()){
					cell.shape().move("down");
				}else cell.shape().resolve();

				flag |= cell.resolved;
			});

			return flag;
		};

		this.step = function(){
			// Check if line is full, delete it
			var lastLine = map[map.length - 1] || [], f = true;

			for(var z = 0; z < lastLine.length; z++){
				f &= lastLine[z];
			}

			if(f){
				map.pop();
				map.shift([]);
			}

			// Gravity
			unresolve();
			while(!resolveMap()){ } // Minimalistic programming?

			// Add from queue
			if(queue.length){
				var line = queue.pop();
				for(var z = 0; z < line.length; z++){
					if(BOARD_WIDTH <= z) break;
					if(line[z].shape !== null){
						if(get(z, 0).shape !== null){
							die();
						}else{
							on(z, 0, line[z]);
						}
					}
				}
			}
		}

		this.cells = {
			data: [],
			get: function(x, y){
				var row = this.data[y];
				if(!row) return false;
				return row[x] || false;
			},
			each: function(callback, backwards){
				var self = this;
				loop(function(){
					var cell = self.get(x, y);;
					callback(cell);
				}, backwards, this.data);
			}
		};

		this.queue = {
			data: [],
			add: function(cell, x, y){
				if(!this.data[y]) this.data[y] = [];
				this.data[y][x] = cell;
			},
			fill: function(shape){
				var cells = shape.cells();
				var self = this;
				cells.each(function(cell, x, y){
					self.add(cell, x, y);
				});
			},
			clear: function(){
				this.data = [];
			}
		};

		this.shape = {
			add: function(){
				/*

				Enqueue shape with id to board.

				Side effects:
					- Clears shape queue. (Only one shape in queue).

				*/
				this.nextColor();
				this.clearQueue();

				this.queue.fill(shape);
				
				loop(function(x, y){
					if(!queue[y]) queue[y] = [];

					if(shape[y][x]){
						queue[y][x + offset] = {
							color: queueColor,
							shape: id,
							shape_x: x,
							shape_y: y,
							resolved: false
						}
					}else queue[y][x + offset] = EMPTY_CELL;
				}, false, shape);
			},
			active: function(){
				/* () -> [int x, int y]
				
				Return first falling cell of active
				(falling) shape.

				*/
				var rx = null, ry = null;

				loop(function(x, y){
					if(!isEmpty(x, y) && isEmpty(x, y + 1)){
						rx = x;
						ry = y;
						return false;
					}
					return true;
				});

				if(rx !== null && ry !== null) return [rx, ry];
				else return false;
			}
		};

		this.interface = {
			left: function(){
				var shape = board.shape.active();
				if(!shape) return;
				
				shape.move("left");
			},
			right: function(){
				var shape = board.shape.active();
				if(!shape) return;
				
				shape.move("right");
			},
			down: function(){
				while(board.shape.active()){
					board.unresolve();
					board.resolve();
				};
			}
		};
	};

	function renderer(){
		this._interval = null;
		this.time = 300;
		this._board = null;

		this.attach = function(board){
			this._board = board;
		}

		this.start = function(){
			if(!this._board){
				throw new Error("Renderer has not been attached to a board yet");
			}

			var board = this._board;

			$("#board").css({
				width: board.cell_size * board.width,
				height: board.cell_size * board.height
			});

			board.cells.each(function(cell){
				$("#board").append(
					"<span style='width:"
					+ board.cell_size
					+ "px;height:"
					+ board.cell_size
					+ "px' class='cell' id='cell_"
					+ cell.y + "_"  + cell.x + "'>"
				);
			});

			$("body").on("keyup", function(e){
				switch(e.which){
					case 37:
						board.interface.left();
						break;
					case 40:
						board.interface.down();
						break;
					case 39:
						board.interface.right();
						break;
				}
			});

			this._interval = setInterval(this.step, this.time);
		}

		this.step = function(){
			/*

			Compute and display new frame.

			*/
			this._board.step();
			
			// Draw
			this._board.cells.each(function(cell){
				$("#cell_" + cell.y + "_" + cell.x).css({
					backgroundColor: cell.color
				});
			});
		};

		this.stop = function(){
			clearInterval(this._interval);
		};
	};

	window.addShape = addShape;
	window.on = on;
	window.off = off;
	window.isEmpty = isEmpty;
	window.loop = loop;
	window.get = get;
	window.set = set;
	window.pullShape = pullShape;
	window.getActiveShape = getActiveShape;
});

// TFIN