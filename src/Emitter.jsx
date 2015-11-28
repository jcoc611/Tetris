/**
 * An event emitter.
 */
class Emitter {
	/**
	 * Creates a new event emitter.
	 * @constructor
	 */
	constructor(){
		this._handlers = {};
	}

	/**
	 * Adds an event handler for a certain event.
	 * @param  {String} event The name of the event to handle.
	 * @param  {Function} handler The event handling function.
	 */
	on(event, handler){
		if(!this._handlers[event]) this._handlers[event] = [];

		this._handlers[event].push(handler);
	}

	/**
	 * Emits an event.
	 * @param  {String}    event  The event to emit.
	 * @param  {...Object} params Parameters to pass to the event handlers.
	 */
	emit(event, ...params){
		if(!this._handlers[event]) return;

		for(let handler of this._handlers[event]){
			handler.apply(this, params);
		}
	}
}


export default Emitter;