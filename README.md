# barebones-channel
A barebones channel implementation based-upon promises.

The motivation for the library is to provide a lightweight channel implementation that can be used as a communication channel between 'push-based' event emitters, and 'pull-based' generators. This is a common need when working with async functions, or with sagas in `redux-saga`. This is also the reason why the implementation is based upon promises, as both async functions and sagas can pause execution of the function/generator until an awaited/yielded promise has resolved. This provides an easy way to defer execution until we have been able to take a value from the channel.

###  Putting values on the channel
```javascript
async function f() {
  const channel = createChannel();
  channel.put('value');
}
```

### Taking values from a channel
```javascript
async function f() {
  const channel = createChannel();
  const value = await channel.take();
  processValue(value);
}
```

### Closing a channel
```javascript
async function f() {
  const channel = createChannel();
  channel.close();
  await channel.take(); // promise resolved immediately with CLOSED value
  channel.put('value'); // noop - returns false to indicate this.
}
```

### Example usage - async/await
```javascript
import { createChannel, CLOSED } from 'barebones-channel';
const channel = createChannel();

// A sound object that emits 'time' events when playing, and a 'finish' event.
const sound = createSound();
sound.on('time', (elapsedTime) => {
  channel.put(elapsedTime);
});
sound.on('finish', () => channel.close());

async function monitorSound(channel) {
  let elapsedTime;
  while ((elapsedTime = await channel.take()) !== CLOSED) {
    console.log(`Time elapsed: ${elapsedTime}`);
  }

  console.log(`Sound has finished playing`);
}

monitorSound(channel);
sound.play();
```
