/* extension.js — lifecycle orchestrator. Holds no module-level mutable state. */

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { DataService } from './dataService.js';
import { ClaudeIndicator } from './indicator.js';

const BOX_ACTORS = {
    left: () => Main.panel._leftBox,
    center: () => Main.panel._centerBox,
    right: () => Main.panel._rightBox,
};

export default class ClaudeUsageExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._lastState = null;

        this._dataService = new DataService();
        this._indicator = new ClaudeIndicator(this._dataService, this.path);
        // Register once: places it and wires up the menu with the panel's menu manager.
        Main.panel.addToStatusArea(
            this.uuid, this._indicator,
            this._settings.get_int('panel-position'),
            this._settings.get_string('panel-box'));

        // Keep the latest state so a re-position can repaint immediately.
        this._dataService.connect(state => {
            this._lastState = state;
            this._indicator?.update(state);
        });

        this._settingsChangedId = this._settings.connect('changed', () => this._reposition());

        this._dataService.start();
    }

    disable() {
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        this._settings = null;
        this._lastState = null;

        // Stop the engine (removes timers/monitors/in-flight reads) before destroying
        // the actor it pushes state into.
        this._dataService?.stop();
        this._dataService = null;
        this._indicator?.destroy();
        this._indicator = null;
    }

    // Move the existing indicator to the configured box/position without re-registering
    // (which would throw on the duplicate role and lose the menu wiring).
    _reposition() {
        if (!this._indicator || !this._settings)
            return;
        const container = this._indicator.container;
        const parent = container.get_parent();
        if (parent)
            parent.remove_child(container);

        const boxName = this._settings.get_string('panel-box');
        const target = (BOX_ACTORS[boxName] || BOX_ACTORS.right)();
        const count = target.get_n_children();
        const pos = Math.max(0, Math.min(this._settings.get_int('panel-position'), count));
        target.insert_child_at_index(container, pos);
    }
}
