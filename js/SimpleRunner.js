/**
 * @file Simple Runner
 * SimpleRunner class, a simple deferred object for handling yes/no callbacks
 * @author Alban Xhaferllari
 * @version 1.0
 * @date 15/08/2015
 */

define( /** @lends SimpleRunner */ function(){

    /**
     * SimpleRunner class, a simple deferred object for handling yes/no callbacks
     * @param scope The scope of run function, normally the object creating the runner
     * @constructor
     */
    var SimpleRunner = function (scope) {
        this._yes = [];
        this._no = [];
        this._always = [];
        this.scope = scope;
    };

    SimpleRunner.prototype = {
        /**
         * Adds callback to the positive return
         * @param cb
         * @returns {SimpleRunner}
         */
        yes: function (cb) {
            this._yes.push(cb);
            return this;
        },
        /**
         * Adds callback to negative return
         * @param cb
         * @returns {SimpleRunner}
         */
        no: function (cb) {
            this._no.push(cb);
            return this;
        },
        /**
         * Callbacks that runs always after the deferred is resolved
         * @param cb
         * @returns {SimpleRunner}
         */
        always: function (cb) {
            this._always.push(cb);
            return this;
        },
        /**
         * Run the selected queue of callbacks
         * @param queue
         * @returns {SimpleRunner}
         */
        run: function (queue) {
            if (this['_' + queue]) {
                //contact the always callbacks to the current one, to run
                var list = this['_' + queue].concat(this._always);
                for (var i = 0; i < list.length; i++) {
                    var fun = list[i];
                    if (fun.fn) {
                        fun.fn.call(fun.scope || this.scope);
                    } else if (typeof fun == 'function') {
                        fun.call(this.scope);
                    }
                }
            }
            return this;
        }
    };
    return SimpleRunner;
});