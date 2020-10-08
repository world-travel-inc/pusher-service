
const pusher = require('pusher');
const pako = require('pako');

module.exports = function pusherService(options) {
    const pusherNetwork = new pusher(options);
    var subscribedChannels = {};

    this.publish = function publish(channelName, eventName, message, callback) {
        if (channelName && eventName && message) {
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
                    const payloadBuffer = new Buffer.from(encodedData, 'base64').toString();
                    const payloadInflated = pako.inflate(payloadBuffer, { to: 'string' });
                    const data = new Buffer.from(payloadInflated, 'base64').toString('ascii');
                    let result = null;

                    if (data[0] === 'O') {
                        result = JSON.parse(data.substring(1));
                    } else {
                        result = data.substring(1);
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
