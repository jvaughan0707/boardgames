import { PureComponent } from 'reactn';

export default class Component extends PureComponent {

    addWebSocketListener (type, action, callback) {
        if (this.webSocketListeners.length === 0) {
            var socket = this.global.ws;
            socket.onMessage.addListener(this.onWebSocketMessage);
        }
        this.webSocketListeners.push({type, action, callback});
    }

    removeWebSocketListeners () {
        var socket = this.global.ws;
        socket.onMessage.removeListener(this.onWebSocketMessage);
        this.webSocketListeners = [];
    }

    webSocketListeners = [];

    onWebSocketMessage = (message => {
        const data = JSON.parse(message);
        this.webSocketListeners.forEach(l => {
            if (data.type === l.type && data.action === l.action) {
                l.callback(data);
            }
        });
    });
}
