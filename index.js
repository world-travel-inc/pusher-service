
const pusher = require('pusher');
const pako = require('pako');

module.exports = function pusherService(options) {
    const pusherNetwork = new pusher(options);
    var subscribedChannels = {};

    this.publish = function publish(channelName, eventName, message, callback) {
        const deflatedMessageBytes = Pako.deflate(message, { to: 'string'});
        const base64DeflatedMessage = Buffer.from(deflatedMessageBytes).toString('base64');

        this.pusherNetwork.trigger(channelName, eventName, base64DeflatedMessage, null, callback);
    };

    this.subscribe = function subscribe(channelName, callback) {
        if (!(channelName in this.subscribedChannels)) {
            this.subscribedChannels[channelName] = callback;

            const channel = this.pusherNetwork.subscribe(channelName);
            channel.bind_global((context, encodedData) => {
                if (context.indexOf('pusher:') === -1) {
                    const payloadBuffer = new Buffer.from(encodedData, 'base64').toString();
                    const payloadInflated = pako.inflate(payloadBuffer, { to: 'string' });
                    const data = new Buffer.from(payloadInflated, 'base64').toString('ascii');

                    this.subscribedChannels[channelName](context, data);
                } else {
                    this.subscribedChannels[channelName](context, encodedData);
                }
            });
        }
    };

    this.unsubscribe = function unsubscribe(channelName) {
        if (channelName in this.subscribedChannels) {
            delete this.subscribedChannels[channelName];
            this.pusherNetwork.unsubscribe(channelName);
        }
    }
};
