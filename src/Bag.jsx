import {SHAPES} from './constants.jsx';
import Shape from './Shape.jsx';

/**
 * A bag of tetrominos.
 * Essentially a randomizer of shapes.
 */
class Bag {
	/**
	 * Creates a new bag.
	 * @param  {int} min the minimum number of shapes
	 *                   to hold in this bag.
	 * @constructor
	 */
	constructor(min){
		this.queue = [];
		this.min = min || 3;
		this.replenish();
	}

	/**
	 * Returns a new shape from the bag.
	 * @return {Shape} a tetromino from the bag.
	 */
	grab(){
		var shape = this.queue.pop();
		
		if(this.queue.length < this.min) this.replenish();

		return shape;
	}

	/**
	 * Returns a few shapes that are next to come
	 * out of the bag. 
	 *
	 * Precondition: amount is at most this.min.
	 * 
	 * @param  {int} amount the number of shapes to peek at.
	 * @return {Shape[]}      an array of shapes which will
	 * come out of the bag, in the order in which they will
	 * be grabbed.
	 */
	peek(amount){
		var peekShapes = [];

		amount = Math.min(this.min, amount);

		for(var z = this.queue.length - 1; z >= this.queue.length - amount; z--){
			peekShapes.push(this.queue[z]);
		}

		return peekShapes;
	}

	/**
	 * Returns the shape that will be taken out of the bag
	 * after a certain number of grabs.
	 * @param  {int} position the number of shapes before this one
	 *                        will come out.
	 * @return {Shape}   the shape at such position.
	 */
	peekAt(position){
		// 0-base
		return this.queue[this.queue.length - 1 - position];
	}

	/**
	 * Adds seven shapes to the bag 
	 */
	replenish(){
		// Clone shapes
		var shapes = [];
		for(let shapeMeta of SHAPES){
			var sh = Shape.fromScheme(shapeMeta.scheme, shapeMeta.color);
			sh.move(shapeMeta.x, shapeMeta.y);
			shapes.push(sh);
		}

		this._shuffle(shapes);

		// Add all shapes in random order
		for(let shape of shapes){
			this.queue.unshift(shape);
		}
	}

	/**
	 * (Pseudo-)Randomizes the order of the elements of an array.
	 *
	 * This is an implementation of the Fisher-Yates (aka Knuth) Shuffle.
	 * Found at http://stackoverflow.com/a/2450976/532978
	 * 
	 * @param  {array} array an array to be shuffled.
	 * @return {array}       the shuffled array.
	 */
	_shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}
}

export default Bag;