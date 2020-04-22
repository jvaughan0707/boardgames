import { PureComponent } from 'reactn';

export default class Component extends PureComponent {
    addWebSocketListener (type, action, component, callback) {
        var listeners = this.global.wsListeners;

        if (listeners) {
            if (!listeners.some(l => l.type === type && l.action === action && l.component === component)) {
                listeners.push({ type, action, component, callback});
            }
        }
        else {
            listeners = [{ type, action, component, callback}]
        }

        this.setGlobal({wsListeners: listeners})
    }
}
