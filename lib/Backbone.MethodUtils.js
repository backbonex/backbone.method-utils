define([
    'backbone',
    'underscore',
    'backbone.redefine'
], function (Backbone, _) {
    "use strict";

    _.method = {};

    _(['memoize', 'throttle', 'debounce', 'once']).forEach(function (methodName) {
        /**
         * @param {Function} fn
         * @returns {Function}
         */
        _.method[methodName] = function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.__wrap = function (fn) {
                var context = _(fn);
                return context[methodName].apply(context, args);
            };
            return fn;
        };
    });

    /**
     * @param {Function} fn
     * @returns {Function}
     */
    _.method.bind = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        fn.__wrap = function (fn) {
            args.unshift(this);
            fn = fn.bind.apply(fn, args);
            args.shift();
            return fn;
        };
        return fn;
    };

    /**
     * @param {String} message
     * @returns {Function}
     */
    _.abstract = function (message) {
        if (message.indexOf(' ') === -1) {
            message = 'Abstract method ' + message + ' is not implemented.';
        }
        return function () {
            throw new Error(message);
        };
    };

    var MethodUtils = function (origin) {
        /**
         * @lends Backbone.View
         * @lends Backbone.Router
         * @lends Backbone.Collection
         * @lends Backbone.History
         * @lends Backbone.Model
         */
        return {
            /**
             * @protected
             * @constructor
             */
            initialize: function () {
                this._wrapMethods();
                origin.initialize.apply(this, arguments);
            },

            /**
             * @protected
             */
            _wrapMethods: function () {
                var prop;
                /*jshint forin: false*/
                for (var propName in this) {
                    prop = this[propName];
                    if (typeof prop === 'function' && typeof prop.__wrap == 'function') {
                        this._wrapMethod(propName, prop);
                    }
                }
            },

            /**
             * @param {String} methodName
             * @param {Function} method
             * @param {Function} method.__wrap
             * @private
             */
            _wrapMethod: function (methodName, method) {
                var wrappedProp = method.__wrap.call(this, method);
                wrappedProp.__origin = method;
                this[methodName] = wrappedProp;
            },

            /**
             * @param {String} methodName
             * @protected
             */
            _reWrapMethod: function (methodName) {
                var method = this[methodName];
                this[methodName] = method.__origin;
                this._wrapMethod(methodName, this[methodName]);
            }
        };
    };

    Backbone.View.redefine(MethodUtils);
    Backbone.Model.redefine(MethodUtils);
    Backbone.Router.redefine(MethodUtils);
    Backbone.Collection.redefine(MethodUtils);
    Backbone.History.redefine(MethodUtils);
});
