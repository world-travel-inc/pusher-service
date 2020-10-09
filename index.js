
const pusher = require('pusher');
const pako = require('pako');

module.exports = function pusherService(options) {
    const pusherNetwork = new pusher(options);
    var subscribedChannels = {};

    this.publish = function publish(channelName, eventName, message, callback) {
        if (channelName && eventName && message) {
            console.log('Send - Channel (' + channelName + ') Event (' + eventName + '): ' + message);

            var type = 'S';
            if (typeof message === 'object') {
                message = JSON.stringify(message);
                type = 'O';
            }
            const deflatedMessageBytes = pako.deflate(type + message, { to: 'string' });
            const base64DeflatedMessage = Buffer.from(deflatedMessageBytes).toString('base64');
    
            pusherNetwork.trigger(channelName, eventName, base64DeflatedMessage, null, callback);
        }
    };

    this.subscribe = function subscribe(channelName, callback) {
        if (!(channelName in subscribedChannels)) {
            subscribedChannels[channelName] = callback;

            const channel = pusherNetwork.subscribe(channelName);
            channel.bind_global((context, encodedData) => {
                if (context.indexOf('pusher:') === -1) {
                    const payloadBuffer = Buffer.from(encodedData, 'base64').toString();
                    const payloadInflated = pako.inflate(payloadBuffer, { to: 'string' });
                    let result = null;

                    const message = payloadInflated.substring(1);

                    console.log('Recv - Channel (' + channelName + ') Event (' + eventName + '): ' + message);

                    if (payloadInflated[0] === 'O') {
                        result = JSON.parse(message);
                    } else {
                        result = message;
                    }

                    if (subscribedChannels[channelName]) {
                        subscribedChannels[channelName](context, result);
                    }
                } else {
                    if (subscribedChannels[channelName]) {
                        subscribedChannels[channelName](context, encodedData);
                    }
                }
            });
        }
    };

    this.unsubscribe = function unsubscribe(channelName) {
        if (channelName && channelName in subscribedChannels) {
            delete subscribedChannels[channelName];
            pusherNetwork.unsubscribe(channelName);
        }
    }
};
