import 'babel-polyfill';
import { createChannel, CLOSED } from '../index.js';

// Helper that allows us to use async-await for tests.
const async = (asyncTest) => {
  return (done) => {
    asyncTest()
      .then(done)
      .catch(done.fail);
  }
}

describe(`channel`, () => {
  let chan;
  beforeEach(() => chan = createChannel());

  // ---------------------------------------------------------------------------
  //  PUT
  // ---------------------------------------------------------------------------
  describe(`put()`, () => {
    it(`returns true when a message is put on a channel with an empty message
        queue`, () => {
      expect(chan.put('msg')).toBe(true);
    });

    it(`returns true when a message is put on a channel with an NONempty message
        queue`, () => {
      chan.put('msg1');
      expect(chan.put('msg2')).toBe(true);
    });

    it(`returns true when a message is put on a channel with NONempty resolve
        queue`, () => {
      chan.take();
      expect(chan.put('msg')).toBe(true);
    });

    it(`returns false when the channel is closed`, () => {
      chan.close();
      expect(chan.put('msg')).toBe(false);
    });
  })


  // ---------------------------------------------------------------------------
  //  TAKE
  // ---------------------------------------------------------------------------
  describe(`take`, () => {
    it(`returns a promise when take()ing from a channel`, () => {
      expect(chan.take() instanceof Promise).toBe(true);
    });

    it(`returns a resolved promise when there is an untaken message`,
      async(async function() {
      chan.put('msg');
      await chan.take();
    }));

    it(`returns a resolved promise when there is untaken message and the channel
        is CLOSED`, async(async function() {
      chan.put('msg');
      chan.close();
      await chan.take();
    }));

    it(`returns a promise resolved with CLOSED when the channel is CLOSED, and
        there are no untaken messages`, async(async function() {
      chan.close();
      const value = await chan.take();
      expect(value).toBe(CLOSED);
    }));
  });

  // ---------------------------------------------------------------------------
  //  CLOSE
  // ---------------------------------------------------------------------------
  describe(`close`, () => {
    it(`returns true when closing an open channel`, () => {
      expect(chan.close()).toBe(true);
    })

    it(`returns false when closing a closed channel`, () => {
      chan.close();
      expect(chan.close()).toBe(false);
    });

    it(`resolves all currently queued resolves`, async(async function() {
      const queuedTakes = [chan.take(), chan.take(), chan.take()];
      expect(chan.close()).toBe(true);
      await Promise.all(queuedTakes);
    }));
  });

});
