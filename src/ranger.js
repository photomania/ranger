/**
 * Ranger: Slider UI Control for Mobile
 * @namespace Ranger
 * @version 0.1.0
 * @author Bar Ziony
 * @link https://github.com/photomania/ranger
 */

 (function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals (root is window)
        root.Ranger = factory(jQuery);
    }
}(this, function ($) {
    'use strict';

    var defaults = {
        'value': 0,
        'title': 'Ranger',
        'width': 200,
        'height': 80,
        'verticalContentMargin': 0,
        'horizontalContentMargin': 0,
        'min': 0,
        'max': 100,
        'step': 1,
        'multiplier': 1.0,
        'allowSlidingOutside': true,
        'onInput': null,
        'onChange': null
    };

    /**
     * Create a Ranger instance.
     *
     * @class
     * @memberOf Ranger
     *
     * @param {Object} options The options for this Ranger.
     * @since 0.1.0
     */
    var Ranger = function (options) {
        this._settings = $.extend({}, defaults, options || {});

        this._rendered = false;
        this.setValue(this._settings.value);

        this._createElement();
    };

    Ranger.prototype = {
        /** @this Ranger */
        _createElement: function () {
            /**
             * Root jQuery element of this Ranger.
             * <br>
             * This object is available immediately but content is rendered to it only after [render]{@link Ranger.render} is called.
             *
             * @memberOf Ranger
             * @type {jQuery}
             */
            this.$el = $('<div>').addClass('ranger');

            /**
             * Root DOM element of this Ranger.
             * This object is available immediately but content is rendered to it only after [render]{@link Ranger.render} is called.
             *
             * @memberOf Ranger
             * @type {HTMLElement}
             */
            this.el = this.$el.get(0);

            this._bindEvents();
        },

        _bindEvents: function () {
            this.$el.on('touchstart', '.ranger-surface', this._slideBegan.bind(this));
            this.$el.on('touchmove.ranger', '.ranger-surface', this._slideMoved.bind(this));
            this.$el.on('touchend.ranger', '.ranger-surface', this._slideEnded.bind(this));
        },

        _unbindEvents: function () {
            this.$el.off('.ranger');
        },

        _bindUIElements: function () {
            this._ui = {
                surface: this.$el.find('.ranger-surface'),
                content: this.$el.find('.ranger-content'),
                value: this.$el.find('.ranger-value'),
                title: this.$el.find('.ranger-title'),
                track: this.$el.find('.ranger-track'),
                trackFill: this.$el.find('.ranger-track-fill')
            };
        },

        _setDimensions: function () {
            this._width = this._settings.width || $(this._settings.container).width();
            this._height = this._settings.height || $(this._settings.container).height();
            var contentWidth = this._width - 2 * this._settings.horizontalContentMargin;
            var contentHeight = this._height - 2 * this._settings.verticalContentMargin;

            this.$el.css({
                'width': this._width,
                'height': this._height
            });

            this._ui.content.css({
                'width': contentWidth,
                'height': contentHeight
            });
        },

        _slideBegan: function (e) {
            this._sliding = true;

            this.$el.addClass('active');

            this._boundingRect = this.el.getBoundingClientRect();
            this._previousPos = this._getTouchPoint(e).x;
        },

        _slideMoved: function (e) {
            if (!this._sliding) {
                return;
            }

            var point = this._getTouchPoint(e);

            if (!this._settings.allowSlidingOutside && !this._isPointInRect(point, this._boundingRect)) {
               return;
            }

            this._currentPos = point.x;

            var widthDelta = this._currentPos - this._previousPos;
            var valueDelta = this._normalizeWidthDelta(widthDelta);
            this._incrementValue(valueDelta);

            this._previousPos = this._currentPos;

            this._triggerInputEvent();
        },

        _slideEnded: function () {
            this.$el.removeClass('active');

            this._boundingRect = null;
            this._previousPos = null;
            this._currentPos = null;
            this._sliding = false;

            this._triggerChangeEvent();
        },

        _getTouchPoint: function (e) {
            return {
                x: e.originalEvent.changedTouches[0].clientX,
                y: e.originalEvent.changedTouches[0].clientY
            };
        },

        _isPointInRect: function (point, rect) {
            return point.x >= rect.left &&
                   point.x <= rect.right &&
                   point.y >= rect.top &&
                   point.y <= rect.bottom;
        },

        _normalizeWidthDelta: function (widthDelta) {
            return (widthDelta / this._width) * this._settings.max * this._settings.multiplier;
        },

        _incrementValue: function (delta) {
            var value = this._absoluteValue + delta;
            var cappedValue = this._cap(value, this._settings.min, this._settings.max);
            this.setValue(cappedValue);
        },

        _roundToNearestStep: function (value) {
            var step = this._settings.step;
            var percent = 1 / step;
            var nearest = Math.round(value * percent) / percent;

            if (nearest < this._settings.min) {
                nearest += step;
            } else if (nearest > this._settings.max) {
                nearest -= step;
            }

            return nearest;
        },

        _cap: function (value, min, max) {
            if (value < min) { return min; }
            if (value > max) { return max; }

            return value;
        },

        _updateUI: function () {
            if (!this._rendered) {
                return;
            }

            this._updateTrack();
            this._ui.value.html(this.getValue());
        },

        _updateTrack: function () {
            var percentage = 100 * (this.getValue() / this._settings.max);
            this._ui.trackFill.width(percentage + '%');
        },

        _triggerInputEvent: function () {
            if (typeof this._settings.onInput === 'function') {
                this._settings.onInput(this.getValue());
            }

            this.el.dispatchEvent(new Event('input', {bubbles: true}));
        },

        _triggerChangeEvent: function () {
            if (typeof this._settings.onChange === 'function') {
                this._settings.onChange(this.getValue());
            }

            this.el.dispatchEvent(new Event('change', {bubbles: true}));
        },

        /**
         * Set the value for this Ranger.
         *
         * @memberOf Ranger
         *
         * @param {Number} value The value to set.
         * @throws {RangeError} If the given value to set is smaller than the minimum or bigger than the maximum.
         * @return {Ranger} This Ranger object.
         */
        setValue: function(value) {
            if (value === this._absoluteValue) {
                return;
            }

            if (value < this._settings.min || value > this._settings.max) {
                throw new RangeError('Value [' + value + '] is not in the expected range [' + this._settings.min + ' - ' + this._settings.max + '].');
            }

            this._absoluteValue = value;
            this._value = this._roundToNearestStep(value);

            this._updateUI();

            return this;
        },

        /**
         * Get the current value.
         *
         * @memberOf Ranger
         *
         * @return {Number} The current value for this Ranger.
         */
        getValue: function () {
            return this._value;
        },

        /**
         * Render the Ranger.
         *
         * @memberOf Ranger
         *
         * @returns {Ranger} This Ranger object.
         */
        render: function () {
            this._rendered = true;

            var html = '<div class="ranger-surface">' +
                            '<div class="ranger-content">' +
                                '<div class="ranger-value">' + this._value + '</div>' +
                                '<div class="ranger-track">' +
                                    '<div class="ranger-track-fill"></div>' +
                                '</div>' +
                                '<div class="ranger-title">' + this._settings.title + '</div>' +
                            '</div>' +
                        '</div>';

            this.$el.html(html);
            this._bindUIElements();
            this._setDimensions();
            this._updateUI();

            return this;
        },

        /**
         * Append the Ranger DOM element into a given DOM element.
         *
         * @memberOf Ranger
         *
         * @param {HTMLElement} element The DOM element to append the Ranger to.
         * @return {Ranger} This Ranger object.
         */
        appendTo: function (element) {
            this.$el.appendTo(element);

            return this;
        }
    };

    return Ranger;
}));
