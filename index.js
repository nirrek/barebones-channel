export const CLOSED = Symbol('CLOSED');

/**
 * Creates a simple channel based-upon promises. The size of the channel's
 * buffer is unbounded, so this should not be used in cases where messages are
 * put onto the channel faster than consumers can take messages off it.
 *
 * @return {Object} The new channel.
 */
export function createChannel() {
  let isClosed = false;
  const messageQueue = [];
  const resolveQueue = [];

  /**
   * Attempts to put a a new `value` onto the channel.
   * @param  {any} value The value to put onto the channel.
   * @return {Boolean}   True if the value was put onto the channel. If the
   *                     channel is closed no value is put onto the channel, and
   *                     false is returned.
   */
  function put(value) {
    if (isClosed) return false;

    if (resolveQueue.length) resolveQueue.shift()(value);
    else                     messageQueue.push(value);
    return true;
  }

  /**
   * Attempts to take a value from the channel. A promise is returned that will
   * resolve to a value from the channel when one is available. If the channel
   * is closed, and the channel has finished draining the returned promise
   * resolved the CLOSED. If the channel becomes closed while the promise is
   * still unfulfilled, the promise is resolved with CLOSED.
   * @return {Promise<a>} Promise that resolves with the next available value
   *                      from the channel, or with CLOSED if the channel is
   *                      closed, or becomes closed while awaiting a value.
   */
  function take() {
    if (isClosed && !messageQueue.length)
      return Promise.resolve(CLOSED);

    if (messageQueue.length)
      return Promise.resolve(messageQueue.shift());

    return new Promise(resolve => resolveQueue.push(resolve));
  }

  /**
   * Closes a channel. Any outstanding take()s that are awaiting another value
   * from the channel will have their promises resolved with CLOSED.
   * @return {Boolean} True if the the channel was closed, false if the cannel
   *                   was already closed.
   */
  function close() {
    if (isClosed) return false;
    isClosed = true;
    if (resolveQueue.length)
      resolveQueue.map(resolve => resolve(CLOSED));
    return true;
  }

  return Object.freeze({
    put,
    take,
    close
  });
}
