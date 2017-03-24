'use strict';
define(/** @lends Constants */ function () {
    var AreaSelector = function (container) {
        this.selectedElement = null;

        this.selectorArea = this.createArea(500, 500);
        this.createSelectors(500, 500);
        document.addEventListener('mousemove', this.updateArea.bind(this), false);
        document.addEventListener('mouseup', this.stopMove.bind(this), false);
        this.selectorArea.addEventListener('mousedown', this.startMove.bind(this), false);
        this.mouseIsDown = false;
        this.currentX = 0;
        this.currentY = 0;
        this.startX = 0;
        this.startY = 0;
        this.elementW = 0;
        this.elementH = 0;
    };

    AreaSelector.prototype = {
        init: function () {

        },
        startMove: function (e) {
            var me = this;
            me.selectedElement = e.target;
            me.mouseIsDown = true;
            me.startX = e.pageX;
            me.startY = e.pageY;
            this.currentX = this.selectorArea.offsetLeft;
            this.currentY = this.selectorArea.offsetTop;
            this.elementW = this.selectorArea.offsetWidth;
            this.elementH = this.selectorArea.offsetHeight;
            return false;
        },
        stopMove: function (e) {
            var me = this;
            me.selectedElement = null;
            me.mouseIsDown = false;
        },
        updateArea: function (e) {
            var me = this;
            if (this.mouseIsDown) {
                var diffX = e.pageX - me.startX;
                var diffY = e.pageY - me.startY;
                if (me.selectedElement.dataset.pos == 'mover') {
                    me.updateDimensions(diffX, diffY);
                } else {
                    me.updatePosition(diffX, diffY);
                }
            }
        },
        updateAreaLeft: function (diff) {
            this.selectorArea.style.left = (this.currentX + diff) + 'px';
        },
        updateAreaTop: function (diff) {
            this.selectorArea.style.top = (this.currentY + diff) + 'px';
        },
        updatePosition: function (diffX, diffY) {
            this.updateAreaLeft(diffX);
            this.updateAreaTop(diffY);
        },
        updateDimensions: function (diffX, diffY) {
            var me = this;
            var dataSet = me.selectedElement.dataset;
            if (dataSet.left === 'true') {
                me.updateAreaLeft(diffX);
            }
            if (dataSet.top === 'true') {
                me.updateAreaTop(diffY);
            }

            me.selectorArea.style.width = (me.elementW + diffX * dataSet.dirX) + 'px';
            me.selectorArea.style.height = (me.elementH + diffY * dataSet.dirY) + 'px';
        },
        bindEventSelector: function (selector) {
            var me = this;
            selector.addEventListener('mousedown', function (e) {
                me.startMove(e, this);
            }, false);
        },
        createSelectors: function (w, h) {
            var selectors = {
                topLeft: this.createDragSelector(0, 0, -1, -1),
                topMiddle: this.createDragSelector('calc(50% - 10px)', 0, 0, -1),
                topRight: this.createDragSelector('calc(100% - 20px)', 0, 1, -1),

                middleLeft: this.createDragSelector(0, 'calc(50% - 10px)', -1, 0),
                middleRight: this.createDragSelector('calc(100% - 20px)', 'calc(50% - 10px)', 1, 0),

                bottomLeft: this.createDragSelector(0, 'calc(100% - 20px)', -1, 1),
                bottomMiddle: this.createDragSelector('calc(50% - 10px)', 'calc(100% - 20px)', 0, 1),
                bottomRight: this.createDragSelector('calc(100% - 20px)', 'calc(100% - 20px)', 1, 1)
            };

            return selectors;
        },
        createDragSelector: function (x, y, w, h) {
            //TODO add css styling
            var div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.width = '20px';
            div.style.height = '20px';
            div.style.backgroundColor = 'transparent';
            div.style.border = '1px solid gray';
            div.style.left = x;
            div.style.top = y;
            div.style.zIndex = '11';

            div.dataset.pos = 'mover';
            div.dataset.left = x === 0;
            div.dataset.top = y === 0;
            div.dataset.dirX = w;
            div.dataset.dirY = h;

            this.selectorArea.appendChild(div);
            // this.bindEventSelector(div);
            return div;
        },
        createArea: function (w, h) {
            var div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.backgroundColor = 'transparent';
            div.style.border = '1px dashed black';
            div.style.transformOrigin = '0 0';
            div.style.transform = 'translate(0, 0)';
            div.style.width = w + 'px';
            div.style.height = h + 'px';
            div.style.top = '0px';
            div.style.left = '0px';
            div.style.zIndex = '10';
            document.body.appendChild(div);
            return div;
        }
    };

    return AreaSelector;
});