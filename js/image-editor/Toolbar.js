'use strict';
define(function () {
    var Toolbar = function (container) {
        this.dom = {
            container: container
        };

        this.init();
    };

    Toolbar.prototype = {
        init: function () {
            this.dom.toolbar = this.createButtons();
        },
        createButtons: function () {
            this.dom.toolbar = this._doEl('div', 'ie-toolbar', this.dom.container);
            this.dom.apply = this._doEl('a', 'ie-apply-btn', this.dom.toolbar);
            this.dom.discard = this._doEl('a', 'ie-discard-btn', this.dom.toolbar);
            this.dom.cropSwitch = this._doEl('a', 'ie-crop-btn', this.dom.toolbar);
            this.dom.resizeSwitch = this._doEl('a', 'ie-resize-btn', this.dom.toolbar);
            this.dom.rotate = this._doEl('a', 'ie-rotate-btn', this.dom.toolbar);
        },
        _doEl: function (name, cls, parentNode) {
            var el = document.createElement(name);
            el.className = cls;
            if(parentNode) {
                parentNode.appendChild(el);
            }
            return el;
        }
    }

    return Toolbar;
});