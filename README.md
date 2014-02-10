# Pipes and Filters

Use the [Pipes and Filters](http://www.eaipatterns.com/PipesAndFilters.html) architectural style to divide a larger processing task into a sequence of smaller, independent processing steps (Filters) that are connected by channels (Pipes).

> Each filter exposes a very simple interface: it receives messages on the inbound pipe, processes the message, and publishes the results to the outbound pipe. The pipe connects one filter to the next, sending output messages from one filter to the next. Because all component use the same external interface they can be composed into different solutions by connecting the components to different pipes. We can add new filters, omit existing ones or rearrange them into a new sequence -- all without having to change the filters themselves. The connection between filter and pipe is sometimes called port. In the basic form, each filter component has one input port and one output port.

## Usage

Install the `pipes-and-filters` package.

	npm install --save pipes-and-filters

### Create, configure and execute a pipeline.

#### 1. Import the `Pipeline` class by requiring the `pipes-and-filters` package.

	var Pipeline = require('pipes-and-filters');

#### 2. Create a pipeline, with an optional name.

	var pipeline = Pipeline.create('order processing');

#### 3. Create a filter function, that takes an input object and a Node style `next` callback to indicate the filter has completed or errored.

	var decrypt = function(input, next) {
	  // call a crypto lib's async decrypt function and process the error/result
	  crypto.decrypt(input, function(err, decrypted) {
	    // raise an error
	    if (err) {
	  	  return next(error);
	    }

	    // continue to next filter
	    next(null, decrypted);
	  }); 
	};

#### 4. Register one or more filters.

	pipeline.use(decrypt);
	pipeline.use(authenticate);
	pipeline.use(deDuplicate);

Youn may optionally provide the context when the function is called.

	pipeline.use(foo.filter, foo)

#### 5. Add an `error` handler.

	pipeline.once('error', function(err) {
	  console.error(err);
	});
	
The pipeline will stop processing on any filter error.

#### 6. Add an `end` handler to be notified when the pipeline has completed.

	pipeline.once('end', function(result) {
	  console.log('completed', result);
	});

#### 7a. Execute the pipeline for a given input.

	pipeline.execute(input);

With this style, an `error` event handler is required. Otherwise the default action on any filter error is to print a stack trace and exit the program.

#### 7b. Execute the pipeline with a Node-style error/result callback.

	pipeline.execute(input, function(err, result) {
	  if (err) {
	    console.error(err);
	    return;
	  }

	  console.log('completed', result);
	});

With this style, an `error` and/or `end` event handler are not required.

### Early exit

You may exit early from a pipeline by passing `Pipeline.break` to the next callback. This will immediately stop execution and prevent any further filters from being called.

   	pipeline.use(function(input, next) {
   		// exit the pipeline
   		next(null, Pipeline.break);
	});

For convenience, you may use `Pipeline.breakIf` passing in a predicate function that returns true to exit early.

	pipeline.use(Pipeline.breakIf(function(input) {
      return true;  // exit early
  	}));

 Note, you should check the result in the complete event and/or callback.

 	pipeline.execute(function(err, result) {
 	  if (result === Pipeline.break) {
 	    // pipeline exited early
 	  }
 	});