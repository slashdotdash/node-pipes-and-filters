var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var Pipeline = (function() {
  function Pipeline(name) {
    this.name = name || '';
    this.filters = [];

    EventEmitter.call(this);
  }
  
  util.inherits(Pipeline, EventEmitter);

  // Adds a filter function to the pipeline chain.
  Pipeline.prototype.use = function(filter, context) {
    this.filters.push({ fn: filter, context: context });
    return this;
  };
  
  // Early exit the pipeline if the given predicate evaluates to true.
  Pipeline.prototype.breakIf = function(predicate) {
    this.use(Pipeline.breakIf(predicate));
    return this;
  };

  // Start the execution of the pipeline.
  Pipeline.prototype.execute = function(input, done) {
    var emitter = this,
        pending = Array.prototype.slice.call(this.filters);

    if (done) {
      this.wireupEvents(done);
    }

    var continueExecution = function continueExecution(err, result) {
      // exit pipeline with an error
      if (err) {
        return emitter.emit('error', err);
      }
      
      // exit early
      if (result === Pipeline.break) {
        return emitter.emit('break');
      }

      // completed, with success, or exit early
      if (pending.length === 0) {
        return emitter.emit('end', result);
      }
 
      // take next filter from pending list, and continue execution
      var filter = pending.shift();

      process.nextTick(function() {
        // execute the filter function, with the (optional) context
        filter.fn.call(filter.context, result, continueExecution);
      });
    };

    process.nextTick(function() {
      continueExecution(null, input);
    });
  };

  // Wireup the optional `done` callback with both `error` and `end` event listeners
  // (if there is no error istener, the default action is to print a stack trace and exit the program).
  Pipeline.prototype.wireupEvents = function(done) {
    var emitter = this;

    var removeListeners = function() {
      emitter.removeListener('error', error);
      emitter.removeListener('end', end);
      emitter.removeListener('break', removeListeners);
    };

    var error = function(err) {
      removeListeners();
      done(err);
    };

    var end = function(result) {
      removeListeners();
      done(null, result);
    };

    this.once('error', error);
    this.once('end', end);
    this.once('break', removeListeners);
  };

  // Break out of the pipeline processing comparison value
  Pipeline.break = {};
  
  // Factory method to create an exit early filter function 
  Pipeline.breakIf = function(predicate) {
    return function(input, next) {
      // exit out of the pipeline if the predicate returns true
      if (predicate(input)) {
        return next(null, Pipeline.break);
      }

      next(null, input);
    };
  };

  return Pipeline;
})();

exports.break = Pipeline.break;

exports.breakIf = Pipeline.breakIf;

exports.create = function(name) {
  return new Pipeline(name);
};