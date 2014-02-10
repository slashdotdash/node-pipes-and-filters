var chai = require('chai'),
    expect = chai.expect,
    spies = require('chai-spies'),
    Pipeline = require('../pipeline');

chai.use(spies);

describe('Pipeline', function() {
  it('should create a named Pipeline', function() {
    expect(Pipeline.create('pipe').name).to.be.equal('pipe');
  });

  describe('#execute', function() {
    var pipeline;

    beforeEach(function() {
      pipeline = Pipeline.create();
    });

    describe('on complete', function() {
      beforeEach(function() {
        // pass-through filter
        pipeline.use(function(input, next) {
          input.wasCalled = true;
          next(null, input);
        });
      });

      it('should emit "end" event on complete', function(done) {
        pipeline.once('end', function(result) {
          expect(result).not.to.be.null;
          expect(result.wasCalled).to.be.true;
          done();
        });

        pipeline.execute({});
      });

      it('should invoke callback function, if provided', function(done) {
        pipeline.execute({}, function(err, result) {
          expect(err).to.be.null;
          expect(result).not.to.be.null;
          expect(result.wasCalled).to.be.true;
          done();
        });
      });
    });

    describe('on filter error', function() {
      var wasCalled = false;

      beforeEach(function() {
        // error raising filter
        pipeline.use(function(input, next) {
          next('failure');
        });

        pipeline.use(function(input, next) {
          wasCalled = true;
          next(null, input);
        });
      });

      it('should invoke "error" event', function(done) {
        pipeline.once('error', function(err) {
          expect(err).to.equal('failure');
          done();
        });

        pipeline.execute({});
      });

      it('should invoke callback function with error', function(done) {
        pipeline.execute({}, function(err, result) {
          expect(err).to.equal('failure');
          expect(result).to.be.undefined;
          done();
        });
      });

      it('should not execute subsequent filters on error', function(done) {
        pipeline.execute({}, function() {
          expect(wasCalled).to.be.false;
          done();
        });
      });
    });

    describe('break early', function() {
      var wasCalled = false;

      beforeEach(function() {
        // break
        pipeline.breakIf(function() {
          return true;
        });

        pipeline.use(function(input, next) {
          wasCalled = true;
          next(null, input);
        });
      });

      it('should not invoke callback with break result', function(done) {
        var spy = chai.spy(function() { });
        
        pipeline.once('break', function() {
          expect(spy).not.to.have.been.called();
          done();
        });

        pipeline.execute({}, spy);
      });

      it('should invoke "break" event', function(done) {
        pipeline.once('break', done);
        pipeline.execute({});
      });

      it('should not execute subsequent filters after break', function(done) {
        pipeline.once('break', function() {
          expect(wasCalled).to.be.false;
          done();
        });
        pipeline.execute({});
      });
    });

    describe('pipeline chaining', function() {
      it('should allow pipeline to be created and executed fluently', function(done) {
        Pipeline.create('test')
          .use(function(input, next) {
            input.wasCalled = true;
            next(null, input);
          })
          .breakIf(function() {
            return false;  // don't exit
          })
          .execute({}, function(err, result) {
            expect(err).to.be.null;
            expect(result).not.to.be.null;
            expect(result.wasCalled).to.be.true;
            done();
          });
      });
    });
  });
});