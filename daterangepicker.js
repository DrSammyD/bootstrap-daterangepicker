/**
* @version: 1.3.17
* @author: Dan Grossman http://www.dangrossman.info/
* @date: 2014-11-25
* @copyright: Copyright (c) 2012-2014 Dan Grossman. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
* @website: http://www.improvely.com/
*/

(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(['moment', 'jquery', 'exports'], function(momentjs, $, exports) {
      root.daterangepicker = factory(root, exports, momentjs, $);
    });

  } else if (typeof exports !== 'undefined') {
    var momentjs = require('moment');
    var jQuery;
    try {
      jQuery = require('jquery');
    } catch (err) {
      jQuery = window.jQuery;
      if (!jQuery) throw new Error('jQuery dependency not found');
    }

    factory(root, exports, momentjs, jQuery);

  // Finally, as a browser global.
  } else {
    root.daterangepicker = factory(root, {}, root.moment, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, daterangepicker, moment, $) {
    var STRING='string',
        OBJECT='object',
        NUMBER='number',
        BOOLEAN='boolean',
        UNDEFINED='undefined',
        DAY='day',
        MONTH='month';
    var DateRangePicker = function (element, options, cb) {

        // by default, the daterangepicker element is placed at the bottom of HTML body
        this.parentEl = 'body';

        //element that triggered the date range picker
        this.element = $(element);

        //tracks visible state
        this.isShowing = false;

        //custom options
        if (typeof options !== OBJECT || options === null)
            options = {};

        this.parentEl = (typeof options === OBJECT && options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
        this.container = $(DateRangePicker.prototype.DRPTemplate).appendTo(this.parentEl);

        this.setOptions(options, cb);

        //apply CSS classes and labels to buttons
        var c = this.container;
        $.each(this.buttonClasses, function (idx, val) {
            c.find('button').addClass(val);
        });
        this.container.find('.daterangepicker_start_input label').html(this.locale.fromLabel);
        this.container.find('.daterangepicker_end_input label').html(this.locale.toLabel);
        if (this.applyClass.length)
            this.container.find('.applyBtn').addClass(this.applyClass);
        if (this.cancelClass.length)
            this.container.find('.cancelBtn').addClass(this.cancelClass);
        this.container.find('.applyBtn').html(this.locale.applyLabel);
        this.container.find('.cancelBtn').html(this.locale.cancelLabel);

        //event listeners

        this.container.find('.calendar')
            .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
            .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
            .on('click.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
            .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
            .on('mouseleave.daterangepicker', 'td.available', $.proxy(this.updateFormInputs, this))
            .on('change.daterangepicker', 'select.yearselect', $.proxy(this.updateMonthYear, this))
            .on('change.daterangepicker', 'select.monthselect', $.proxy(this.updateMonthYear, this))
            .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.updateTime, this));

        this.container.find('.ranges')
            .on('click.daterangepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
            .on('click.daterangepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))
            .on('click.daterangepicker', '.daterangepicker_start_input,.daterangepicker_end_input', $.proxy(this.showCalendars, this))
            .on('change.daterangepicker', '.daterangepicker_start_input,.daterangepicker_end_input', $.proxy(this.inputsChanged, this))
            .on('keydown.daterangepicker', '.daterangepicker_start_input,.daterangepicker_end_input', $.proxy(this.inputsKeydown, this))
            .on('click.daterangepicker', 'li', $.proxy(this.clickRange, this))
            .on('mouseenter.daterangepicker', 'li', $.proxy(this.enterRange, this))
            .on('mouseleave.daterangepicker', 'li', $.proxy(this.updateFormInputs, this));

        if (this.element.is('input')) {
            this.element.on({
                'click.daterangepicker': $.proxy(this.show, this),
                'focus.daterangepicker': $.proxy(this.show, this),
                'keyup.daterangepicker': $.proxy(this.updateFromControl, this)
            });
        } else {
            this.element.on('click.daterangepicker', $.proxy(this.toggle, this));
        }

    };

    DateRangePicker.prototype = {
        constructor: DateRangePicker,
        DRPTemplate: '<div class="daterangepicker dropdown-menu">' +
                '<div class="calendar first left"></div>' +
                '<div class="calendar second right"></div>' +
                '<div class="ranges">' +
                  '<div class="range_inputs">' +
                    '<div class="daterangepicker_start_input">' +
                      '<label for="daterangepicker_start"></label>' +
                      '<input class="input-mini" type="text" name="daterangepicker_start" value="" />' +
                    '</div>' +
                    '<div class="daterangepicker_end_input">' +
                      '<label for="daterangepicker_end"></label>' +
                      '<input class="input-mini" type="text" name="daterangepicker_end" value="" />' +
                    '</div>' +
                    '<button class="applyBtn" disabled="disabled"></button>&nbsp;' +
                    '<button class="cancelBtn"></button>' +
                  '</div>' +
                '</div>' +
              '</div>',
        defaultOptions: {
            startDate : moment().startOf(DAY),
            endDate : moment().endOf(DAY),
            timeZone : moment().zone(),
            minDate : false,
            maxDate : false,
            dateLimit : false,

            showDropdowns : false,
            showWeekNumbers : false,
            timePicker : false,
            timePickerSeconds : false,
            timePickerIncrement : 30,
            timePicker12Hour : true,
            singleDatePicker : false,
            ranges : {},

            opens : 'right',
            opensLeft : 'left',
            buttonClasses : ['btn', 'btn-small btn-sm'],
            applyClass : 'btn-success',
            cancelClass : 'btn-default',

            format : 'MM/DD/YYYY',
            separator : ' - ',
            locale : {
                applyLabel: 'Apply',
                cancelLabel: 'Cancel',
                fromLabel: 'From',
                toLabel: 'To',
                weekLabel: 'W',
                customRangeLabel: 'Custom Range',
                daysOfWeek: moment.weekdaysMin(),
                monthNames: moment.monthsShort(),
                firstDay: moment.localeData()._week.dow
            },
            cb : function () { }
        },
        setOptions: function(options, callback) {

            this.startDate = DateRangePicker.prototype.startDate;
            this.endDate = DateRangePicker.prototype.endDate;
            this.timeZone = DateRangePicker.prototype.timeZone;
            this.minDate = DateRangePicker.prototype.minDate;
            this.maxDate = DateRangePicker.prototype.maxDate;
            this.dateLimit = DateRangePicker.prototype.dateLimit;

            this.showDropdowns = DateRangePicker.prototype.showDropdowns;
            this.showWeekNumbers = DateRangePicker.prototype.showWeekNumbers;
            this.timePicker = DateRangePicker.prototype.timePicker;
            this.timePickerSeconds = DateRangePicker.prototype.timePickerSeconds;
            this.timePickerIncrement = DateRangePicker.prototype.timePickerIncrement;
            this.timePicker12Hour = DateRangePicker.prototype.timePicker12Hour;
            this.singleDatePicker = DateRangePicker.prototype.singleDatePicker;
            this.ranges = DateRangePicker.prototype.ranges;

            this.opens = DateRangePicker.prototype.opens;
            if (this.element.hasClass('pull-right'))
                this.opens = DateRangePicker.prototype.opensLeft;

            this.buttonClasses=DateRangePicker.prototype.buttonClasses;
            this.applyClass=DateRangePicker.prototype.applyClass;
            this.cancelClass=DateRangePicker.prototype.cancelClass;

            this.format=DateRangePicker.prototype.format;
            this.separator=DateRangePicker.prototype.separator;
            this.locale = DateRangePicker.prototype.locale;
            this.cb = DateRangePicker.prototype.locale;

            if (typeof options.format === STRING || typeof DateRangePicker.prototype.format === STRING)
                this.format = options.format || typeof DateRangePicker.prototype.format;
            if (typeof options.separator === STRING || typeof DateRangePicker.prototype.separator === STRING)
                this.separator = options.separator || typeof DateRangePicker.prototype.separator;
            if (typeof options.startDate === STRING || typeof DateRangePicker.prototype.startDate === STRING)
                this.startDate = moment(options.startDate || typeof DateRangePicker.prototype.startDate, this.format);
            if (typeof options.endDate === STRING || typeof DateRangePicker.prototype.endDate === STRING)
                this.endDate = moment(options.endDate || typeof DateRangePicker.prototype.endDate, this.format);
            if (typeof options.minDate === STRING || typeof DateRangePicker.prototype.minDate === STRING)
                this.minDate = moment(options.minDate || typeof DateRangePicker.prototype.minDate, this.format);
            if (typeof options.maxDate === STRING || typeof DateRangePicker.prototype.maxDate === STRING)
                this.maxDate = moment(options.maxDate || typeof DateRangePicker.prototype.maxDate, this.format);
            if (typeof options.startDate === OBJECT || typeof DateRangePicker.prototype.startDate === OBJECT)
                this.startDate = moment(options.startDate || typeof DateRangePicker.prototype.startDate);
            if (typeof options.endDate === OBJECT || typeof DateRangePicker.prototype.endDate === OBJECT)
                this.endDate = moment(options.endDate || typeof DateRangePicker.prototype.endDate);
            if (typeof options.minDate === OBJECT || typeof DateRangePicker.prototype.minDate === OBJECT)
                this.minDate = moment(options.minDate || typeof DateRangePicker.prototype.minDate);
            if (typeof options.maxDate === OBJECT || typeof DateRangePicker.prototype.maxDate === OBJECT)
                this.maxDate = moment(options.maxDate || typeof DateRangePicker.prototype.maxDate);
            if (typeof options.applyClass === STRING || typeof DateRangePicker.prototype.applyClass === STRING)
                this.applyClass = options.applyClass || typeof DateRangePicker.prototype.applyClass;
            if (typeof options.cancelClass === STRING || typeof DateRangePicker.prototype.cancelClass === STRING)
                this.cancelClass = options.cancelClass || typeof DateRangePicker.prototype.cancelClass;
            if (typeof options.dateLimit === OBJECT || typeof DateRangePicker.prototype.dateLimit === OBJECT)
                this.dateLimit = options.dateLimit || typeof DateRangePicker.prototype.dateLimit;
            if (typeof options.locale === OBJECT || typeof DateRangePicker.prototype.locale) {

                if (typeof options.locale.daysOfWeek === OBJECT || typeof DateRangePicker.prototype.locale.daysOfWeek === OBJECT) {
                    // Create a copy of daysOfWeek to avoid modification of original
                    // options object for reusability in multiple daterangepicker instances
                    this.locale.daysOfWeek = options.locale.daysOfWeek.slice()||typeof DateRangePicker.prototype.locale.daysOfWeek;
                }

                if (typeof options.locale.monthNames === OBJECT || typeof DateRangePicker.prototype.locale.monthNames === OBJECT) {
                    this.locale.monthNames = options.locale.monthNames.slice()||typeof DateRangePicker.prototype.locale.monthNames;
                }

                if (typeof options.locale.firstDay === NUMBER || typeof DateRangePicker.prototype.locale.firstDay === NUMBER) {
                    this.locale.firstDay = options.locale.firstDay||typeof DateRangePicker.prototype.locale.firstDay;
                }

                if (typeof options.locale.applyLabel === STRING || typeof DateRangePicker.prototype.locale.applyLabel === STRING) {
                    this.locale.applyLabel = options.locale.applyLabel||typeof DateRangePicker.prototype.locale.applyLabel;
                }

                if (typeof options.locale.cancelLabel === STRING || typeof DateRangePicker.prototype.locale.cancelLabel === STRING) {
                    this.locale.cancelLabel = options.locale.cancelLabel||typeof DateRangePicker.prototype.locale.cancelLabel;
                }

                if (typeof options.locale.fromLabel === STRING || typeof DateRangePicker.prototype.locale.fromLabel === STRING) {
                    this.locale.fromLabel = options.locale.fromLabel||typeof DateRangePicker.prototype.locale.fromLabel;
                }

                if (typeof options.locale.toLabel === STRING || typeof DateRangePicker.prototype.locale.toLabel === STRING) {
                    this.locale.toLabel = options.locale.toLabel||typeof DateRangePicker.prototype.locale.toLabel;
                }

                if (typeof options.locale.weekLabel === STRING || typeof DateRangePicker.prototype.locale.weekLabel === STRING) {
                    this.locale.weekLabel = options.locale.weekLabel||typeof DateRangePicker.prototype.locale.weekLabel;
                }

                if (typeof options.locale.customRangeLabel === STRING || typeof DateRangePicker.prototype.locale.customRangeLabel === STRING) {
                    this.locale.customRangeLabel = options.locale.customRangeLabel||typeof DateRangePicker.prototype.locale.customRangeLabel;
                }
            }
            if (typeof options.opens === STRING||typeof DateRangePicker.prototype.opens === STRING) {
                this.opens = options.opens||typeof DateRangePicker.prototype.opens;
            }
            if (typeof options.showWeekNumbers === BOOLEAN||typeof DateRangePicker.prototype.showWeekNumbers === BOOLEAN) {
                this.showWeekNumbers = options.showWeekNumbers||typeof DateRangePicker.prototype.showWeekNumbers;
            }
            if (typeof options.buttonClasses === STRING||typeof DateRangePicker.prototype.buttonClasses === STRING) {
                this.buttonClasses = [options.buttonClasses]||typeof DateRangePicker.prototype.buttonClasses;
            }
            if (typeof options.buttonClasses === OBJECT||typeof DateRangePicker.prototype.buttonClasses === OBJECT) {
                this.buttonClasses = options.buttonClasses||typeof DateRangePicker.prototype.buttonClasses;
            }
            if (typeof options.showDropdowns === BOOLEAN||typeof DateRangePicker.prototype.showDropdowns === BOOLEAN) {
                this.showDropdowns = options.showDropdowns||typeof DateRangePicker.prototype.showDropdowns;
            }

            if (typeof options.singleDatePicker === BOOLEAN||typeof DateRangePicker.prototype.singleDatePicker === BOOLEAN) {
                this.singleDatePicker = options.singleDatePicker||DateRangePicker.prototype.singleDatePicker;
                if (this.singleDatePicker) {
                    this.endDate = this.startDate.clone();
                }
            }
            if (typeof options.timePicker === BOOLEAN||typeof DateRangePicker.prototype.timePicker === BOOLEAN) {
                this.timePicker = options.timePicker||typeof DateRangePicker.prototype.timePicker;
            }
            if (typeof options.timePickerSeconds === BOOLEAN||typeof DateRangePicker.prototype.timePickerSeconds === BOOLEAN) {
                this.timePickerSeconds = options.timePickerSeconds||typeof DateRangePicker.prototype.timePickerSeconds;
            }
            if (typeof options.timePickerIncrement === NUMBER||typeof DateRangePicker.prototype.timePickerIncrement === NUMBER) {
                this.timePickerIncrement = options.timePickerIncrement||typeof DateRangePicker.prototype.timePickerIncrement;
            }
            if (typeof options.timePicker12Hour === BOOLEAN||typeof DateRangePicker.prototype.timePicker12Hour === BOOLEAN) {
                this.timePicker12Hour = options.timePicker12Hour||typeof DateRangePicker.prototype.timePicker12Hour;
            }

            // update day names order to firstDay
            if (this.locale.firstDay != 0) {
                var iterator = this.locale.firstDay;
                while (iterator > 0) {
                    this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
                    iterator--;
                }
            }

            var start, end, range;

            //if no start/end dates set, check if an input element contains initial values
            if (typeof options.startDate === UNDEFINED && typeof options.endDate === UNDEFINED) {
                if ($(this.element).is('input[type=text]')) {
                    var val = $(this.element).val(),
                        split = val.split(this.separator);

                    start = end = null;

                    if (split.length == 2) {
                        start = moment(split[0], this.format);
                        end = moment(split[1], this.format);
                    } else if (this.singleDatePicker && val !== "") {
                        start = moment(val, this.format);
                        end = moment(val, this.format);
                    }
                    if (start !== null && end !== null) {
                        this.startDate = start;
                        this.endDate = end;
                    }
                }
            }

            // bind the time zone used to build the calendar to either the timeZone passed in through the options or the zone of the startDate (which will be the local time zone by default)
            if (typeof options.timeZone === STRING || typeof options.timeZone === NUMBER) {
                this.timeZone = options.timeZone;
                this.startDate.zone(this.timeZone);
                this.endDate.zone(this.timeZone);
            } else {
                this.timeZone = moment(this.startDate).zone();
            }

            if (typeof options.ranges === OBJECT) {
                for (range in options.ranges) {

                    if (typeof options.ranges[range][0] === STRING)
                        start = moment(options.ranges[range][0], this.format);
                    else
                        start = moment(options.ranges[range][0]);

                    if (typeof options.ranges[range][1] === STRING)
                        end = moment(options.ranges[range][1], this.format);
                    else
                        end = moment(options.ranges[range][1]);

                    // If we have a min/max date set, bound this range
                    // to it, but only if it would otherwise fall
                    // outside of the min/max.
                    if (this.minDate && start.isBefore(this.minDate))
                        start = moment(this.minDate);

                    if (this.maxDate && end.isAfter(this.maxDate))
                        end = moment(this.maxDate);

                    // If the end of the range is before the minimum (if min is set) OR
                    // the start of the range is after the max (also if set) don't display this
                    // range option.
                    if ((this.minDate && end.isBefore(this.minDate)) || (this.maxDate && start.isAfter(this.maxDate))) {
                        continue;
                    }

                    this.ranges[range] = [start, end];
                }

                var list = '<ul>';
                for (range in this.ranges) {
                    list += '<li>' + range + '</li>';
                }
                list += '<li>' + this.locale.customRangeLabel + '</li>';
                list += '</ul>';
                this.container.find('.ranges ul').remove();
                this.container.find('.ranges').prepend(list);
            }

            if (typeof callback === 'function') {
                this.cb = callback;
            }

            if (!this.timePicker) {
                this.startDate = this.startDate.startOf(DAY);
                this.endDate = this.endDate.endOf(DAY);
            }

            if (this.singleDatePicker) {
                this.opens = 'right';
                this.container.addClass('single');
                this.container.find('.calendar.right').show();
                this.container.find('.calendar.left').hide();
                if (!this.timePicker) {
                    this.container.find('.ranges').hide();
                } else {
                    this.container.find('.ranges .daterangepicker_start_input, .ranges .daterangepicker_end_input').hide();
                }
                if (!this.container.find('.calendar.right').hasClass('single'))
                    this.container.find('.calendar.right').addClass('single');
            } else {
                this.container.removeClass('single');
                this.container.find('.calendar.right').removeClass('single');
                this.container.find('.ranges').show();
            }

            this.oldStartDate = this.startDate.clone();
            this.oldEndDate = this.endDate.clone();
            this.oldChosenLabel = this.chosenLabel;

            this.leftCalendar = {
                month: moment([this.startDate.year(), this.startDate.month(), 1, this.startDate.hour(), this.startDate.minute(), this.startDate.second()]),
                calendar: []
            };

            this.rightCalendar = {
                month: moment([this.endDate.year(), this.endDate.month(), 1, this.endDate.hour(), this.endDate.minute(), this.endDate.second()]),
                calendar: []
            };

            if (this.opens == 'right' || this.opens == 'center') {
                //swap calendar positions
                var first = this.container.find('.calendar.first');
                var second = this.container.find('.calendar.second');

                if (second.hasClass('single')) {
                    second.removeClass('single');
                    first.addClass('single');
                }

                first.removeClass('left').addClass('right');
                second.removeClass('right').addClass('left');

                if (this.singleDatePicker) {
                    first.show();
                    second.hide();
                }
            }

            if (typeof options.ranges === UNDEFINED && !this.singleDatePicker) {
                this.container.addClass('show-calendar');
            }

            this.container.addClass('opens' + this.opens);

            this.updateView();
            this.updateCalendars();

        },

        setStartDate: function(startDate) {
            if (typeof startDate === STRING)
                this.startDate = moment(startDate, this.format).zone(this.timeZone);

            if (typeof startDate === OBJECT)
                this.startDate = moment(startDate);

            if (!this.timePicker)
                this.startDate = this.startDate.startOf(DAY);

            this.oldStartDate = this.startDate.clone();

            this.updateView();
            this.updateCalendars();
            this.updateInputText();
        },

        setEndDate: function(endDate) {
            if (typeof endDate === STRING)
                this.endDate = moment(endDate, this.format).zone(this.timeZone);

            if (typeof endDate === OBJECT)
                this.endDate = moment(endDate);

            if (!this.timePicker)
                this.endDate = this.endDate.endOf(DAY);

            this.oldEndDate = this.endDate.clone();

            this.updateView();
            this.updateCalendars();
            this.updateInputText();
        },

        updateView: function () {
            this.leftCalendar.month.month(this.startDate.month()).year(this.startDate.year()).hour(this.startDate.hour()).minute(this.startDate.minute());
            this.rightCalendar.month.month(this.endDate.month()).year(this.endDate.year()).hour(this.endDate.hour()).minute(this.endDate.minute());
            this.updateFormInputs();
        },

        updateFormInputs: function () {
            this.container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.format));
            this.container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.format));

            if (this.startDate.isSame(this.endDate) || this.startDate.isBefore(this.endDate)) {
                this.container.find('button.applyBtn').removeAttr('disabled');
            } else {
                this.container.find('button.applyBtn').attr('disabled', 'disabled');
            }
        },

        updateFromControl: function () {
            if (!this.element.is('input')) return;
            if (!this.element.val().length) return;

            var dateString = this.element.val().split(this.separator),
                start = null,
                end = null;

            if(dateString.length === 2) {
                start = moment(dateString[0], this.format).zone(this.timeZone);
                end = moment(dateString[1], this.format).zone(this.timeZone);
            }

            if (this.singleDatePicker || start === null || end === null) {
                start = moment(this.element.val(), this.format).zone(this.timeZone);
                end = start;
            }

            if (end.isBefore(start)) return;

            this.oldStartDate = this.startDate.clone();
            this.oldEndDate = this.endDate.clone();

            this.startDate = start;
            this.endDate = end;

            if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate))
                this.notify();

            this.updateCalendars();
        },

        notify: function () {
            this.updateView();
            this.cb(this.startDate, this.endDate, this.chosenLabel);
        },

        move: function () {
            var parentOffset = { top: 0, left: 0 };
            var parentRightEdge = $(window).width();
            if (!this.parentEl.is('body')) {
                parentOffset = {
                    top: this.parentEl.offset().top - this.parentEl.scrollTop(),
                    left: this.parentEl.offset().left - this.parentEl.scrollLeft()
                };
                parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
            }

            if (this.opens == 'left') {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight() - parentOffset.top,
                    right: parentRightEdge - this.element.offset().left - this.element.outerWidth(),
                    left: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else if (this.opens == 'center') {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight() - parentOffset.top,
                    left: this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2
                            - this.container.outerWidth() / 2,
                    right: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else {
                this.container.css({
                    top: this.element.offset().top + this.element.outerHeight() - parentOffset.top,
                    left: this.element.offset().left - parentOffset.left,
                    right: 'auto'
                });
                if (this.container.offset().left + this.container.outerWidth() > $(window).width()) {
                    this.container.css({
                        left: 'auto',
                        right: 0
                    });
                }
            }
        },

        toggle: function (e) {
            if (this.element.hasClass('active')) {
                this.hide();
            } else {
                this.show();
            }
        },

        show: function (e) {
            if (this.isShowing) return;

            this.element.addClass('active');
            this.container.show();
            this.move();

            // Create a click proxy that is private to this instance of datepicker, for unbinding
            this._outsideClickProxy = $.proxy(function (e) { this.outsideClick(e); }, this);
            // Bind global datepicker mousedown for hiding and
            $(document)
              .on('mousedown.daterangepicker', this._outsideClickProxy)
              // also support mobile devices
              .on('touchend.daterangepicker', this._outsideClickProxy)
              // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
              .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
              // and also close when focus changes to outside the picker (eg. tabbing between controls)
              .on('focusin.daterangepicker', this._outsideClickProxy);

            this.isShowing = true;
            this.element.trigger('show.daterangepicker', this);
        },

        outsideClick: function (e) {
            var target = $(e.target);
            // if the page is clicked anywhere except within the daterangerpicker/button
            // itself then call this.hide()
            if (
                // ie modal dialog fix
                e.type == "focusin" ||
                target.closest(this.element).length ||
                target.closest(this.container).length ||
                target.closest('.calendar-date').length
                ) return;
            this.hide();
        },

        hide: function (e) {
            if (!this.isShowing) return;

            $(document)
              .off('.daterangepicker');

            this.element.removeClass('active');
            this.container.hide();

            if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate))
                this.notify();

            this.oldStartDate = this.startDate.clone();
            this.oldEndDate = this.endDate.clone();

            this.isShowing = false;
            this.element.trigger('hide.daterangepicker', this);
        },

        enterRange: function (e) {
            // mouse pointer has entered a range label
            var label = e.target.innerHTML;
            if (label == this.locale.customRangeLabel) {
                this.updateView();
            } else {
                var dates = this.ranges[label];
                this.container.find('input[name=daterangepicker_start]').val(dates[0].format(this.format));
                this.container.find('input[name=daterangepicker_end]').val(dates[1].format(this.format));
            }
        },

        showCalendars: function() {
            this.container.addClass('show-calendar');
            this.move();
            this.element.trigger('showCalendar.daterangepicker', this);
        },

        hideCalendars: function() {
            this.container.removeClass('show-calendar');
            this.element.trigger('hideCalendar.daterangepicker', this);
        },

        // when a date is typed into the start to end date textboxes
        inputsChanged: function (e) {
            var el = $(e.target);
            var date = moment(el.val(), this.format);
            if (!date.isValid()) return;

            var startDate, endDate;
            if (el.attr('name') === 'daterangepicker_start') {
                startDate = date;
                endDate = this.endDate;
            } else {
                startDate = this.startDate;
                endDate = date;
            }
            this.setCustomDates(startDate, endDate);
        },

        inputsKeydown: function(e) {
            if (e.keyCode === 13) {
                this.inputsChanged(e);
                this.notify();
            }
        },

        updateInputText: function() {
            if (this.element.is('input') && !this.singleDatePicker) {
                this.element.val(this.startDate.format(this.format) + this.separator + this.endDate.format(this.format));
            } else if (this.element.is('input')) {
                this.element.val(this.endDate.format(this.format));
            }
        },

        clickRange: function (e) {
            var label = e.target.innerHTML;
            this.chosenLabel = label;
            if (label == this.locale.customRangeLabel) {
                this.showCalendars();
            } else {
                var dates = this.ranges[label];

                this.startDate = dates[0];
                this.endDate = dates[1];

                if (!this.timePicker) {
                    this.startDate.startOf(DAY);
                    this.endDate.endOf(DAY);
                }

                this.leftCalendar.month.month(this.startDate.month()).year(this.startDate.year()).hour(this.startDate.hour()).minute(this.startDate.minute());
                this.rightCalendar.month.month(this.endDate.month()).year(this.endDate.year()).hour(this.endDate.hour()).minute(this.endDate.minute());
                this.updateCalendars();

                this.updateInputText();

                this.hideCalendars();
                this.hide();
                this.element.trigger('apply.daterangepicker', this);
            }
        },

        clickPrev: function (e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.subtract(1, MONTH);
            } else {
                this.rightCalendar.month.subtract(1, MONTH);
            }
            this.updateCalendars();
        },

        clickNext: function (e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add(1, MONTH);
            } else {
                this.rightCalendar.month.add(1, MONTH);
            }
            this.updateCalendars();
        },

        hoverDate: function (e) {
            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');

            if (cal.hasClass('left')) {
                this.container.find('input[name=daterangepicker_start]').val(this.leftCalendar.calendar[row][col].format(this.format));
            } else {
                this.container.find('input[name=daterangepicker_end]').val(this.rightCalendar.calendar[row][col].format(this.format));
            }
        },

        setCustomDates: function(startDate, endDate) {
            this.chosenLabel = this.locale.customRangeLabel;
            if (startDate.isAfter(endDate)) {
                var difference = this.endDate.diff(this.startDate);
                endDate = moment(startDate).add(difference, 'ms');
            }
            this.startDate = startDate;
            this.endDate = endDate;

            this.updateView();
            this.updateCalendars();
        },

        clickDate: function (e) {
            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');

            var startDate, endDate;
            if (cal.hasClass('left')) {
                startDate = this.leftCalendar.calendar[row][col];
                endDate = this.endDate;
                if (typeof this.dateLimit === OBJECT) {
                    var maxDate = moment(startDate).add(this.dateLimit).startOf(DAY);
                    if (endDate.isAfter(maxDate)) {
                        endDate = maxDate;
                    }
                }
            } else {
                startDate = this.startDate;
                endDate = this.rightCalendar.calendar[row][col];
                if (typeof this.dateLimit === OBJECT) {
                    var minDate = moment(endDate).subtract(this.dateLimit).startOf(DAY);
                    if (startDate.isBefore(minDate)) {
                        startDate = minDate;
                    }
                }
            }

            if (this.singleDatePicker && cal.hasClass('left')) {
                endDate = startDate.clone();
            } else if (this.singleDatePicker && cal.hasClass('right')) {
                startDate = endDate.clone();
            }

            cal.find('td').removeClass('active');

            $(e.target).addClass('active');

            this.setCustomDates(startDate, endDate);

            if (!this.timePicker)
                endDate.endOf(DAY);

            if (this.singleDatePicker && !this.timePicker)
                this.clickApply();
        },

        clickApply: function (e) {
            this.updateInputText();
            this.hide();
            this.element.trigger('apply.daterangepicker', this);
        },

        clickCancel: function (e) {
            this.startDate = this.oldStartDate;
            this.endDate = this.oldEndDate;
            this.chosenLabel = this.oldChosenLabel;
            this.updateView();
            this.updateCalendars();
            this.hide();
            this.element.trigger('cancel.daterangepicker', this);
        },

        updateMonthYear: function (e) {
            var isLeft = $(e.target).closest('.calendar').hasClass('left'),
                leftOrRight = isLeft ? 'left' : 'right',
                cal = this.container.find('.calendar.'+leftOrRight);

            // Month must be Number for new moment versions
            var month = parseInt(cal.find('.monthselect').val(), 10);
            var year = cal.find('.yearselect').val();

            this[leftOrRight+'Calendar'].month.month(month).year(year);
            this.updateCalendars();
        },

        updateTime: function(e) {

            var cal = $(e.target).closest('.calendar'),
                isLeft = cal.hasClass('left');

            var hour = parseInt(cal.find('.hourselect').val(), 10);
            var minute = parseInt(cal.find('.minuteselect').val(), 10);
            var second = 0;

            if (this.timePickerSeconds) {
                second = parseInt(cal.find('.secondselect').val(), 10);
            }

            if (this.timePicker12Hour) {
                var ampm = cal.find('.ampmselect').val();
                if (ampm === 'PM' && hour < 12)
                    hour += 12;
                if (ampm === 'AM' && hour === 12)
                    hour = 0;
            }

            if (isLeft) {
                var start = this.startDate.clone();
                start.hour(hour);
                start.minute(minute);
                start.second(second);
                this.startDate = start;
                this.leftCalendar.month.hour(hour).minute(minute).second(second);
                if (this.singleDatePicker)
                    this.endDate = start.clone();
            } else {
                var end = this.endDate.clone();
                end.hour(hour);
                end.minute(minute);
                end.second(second);
                this.endDate = end;
                if (this.singleDatePicker)
                    this.startDate = end.clone();
                this.rightCalendar.month.hour(hour).minute(minute).second(second);
            }

            this.updateView();
            this.updateCalendars();
        },

        updateCalendars: function () {
            this.leftCalendar.calendar = this.buildCalendar(this.leftCalendar.month.month(), this.leftCalendar.month.year(), this.leftCalendar.month.hour(), this.leftCalendar.month.minute(), this.leftCalendar.month.second(), 'left');
            this.rightCalendar.calendar = this.buildCalendar(this.rightCalendar.month.month(), this.rightCalendar.month.year(), this.rightCalendar.month.hour(), this.rightCalendar.month.minute(), this.rightCalendar.month.second(), 'right');
            this.container.find('.calendar.left').empty().html(this.renderCalendar(this.leftCalendar.calendar, this.startDate, this.minDate, this.maxDate, 'left'));
            this.container.find('.calendar.right').empty().html(this.renderCalendar(this.rightCalendar.calendar, this.endDate, this.singleDatePicker ? this.minDate : this.startDate, this.maxDate, 'right'));

            this.container.find('.ranges li').removeClass('active');
            var customRange = true;
            var i = 0;
            for (var range in this.ranges) {
                if (this.timePicker) {
                    if (this.startDate.isSame(this.ranges[range][0]) && this.endDate.isSame(this.ranges[range][1])) {
                        customRange = false;
                        this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')')
                            .addClass('active').html();
                    }
                } else {
                    //ignore times when comparing dates if time picker is not enabled
                    if (this.startDate.format('YYYY-MM-DD') == this.ranges[range][0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') == this.ranges[range][1].format('YYYY-MM-DD')) {
                        customRange = false;
                        this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')')
                            .addClass('active').html();
                    }
                }
                i++;
            }
            if (customRange) {
                this.chosenLabel = this.container.find('.ranges li:last').addClass('active').html();
                this.showCalendars();
            }
        },

        buildCalendar: function (month, year, hour, minute, second, side) {
            var daysInMonth = moment([year, month]).daysInMonth();
            var firstDay = moment([year, month, 1]);
            var lastDay = moment([year, month, daysInMonth]);
            var lastMonth = moment(firstDay).subtract(1, MONTH).month();
            var lastYear = moment(firstDay).subtract(1, MONTH).year();

            var daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();

            var dayOfWeek = firstDay.day();

            var i;

            //initialize a 6 rows x 7 columns array for the calendar
            var calendar = [];
            calendar.firstDay = firstDay;
            calendar.lastDay = lastDay;

            for (i = 0; i < 6; i++) {
                calendar[i] = [];
            }

            //populate the calendar with date objects
            var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
            if (startDay > daysInLastMonth)
                startDay -= 7;

            if (dayOfWeek == this.locale.firstDay)
                startDay = daysInLastMonth - 6;

            var curDate = moment([lastYear, lastMonth, startDay, 12, minute, second]).zone(this.timeZone);

            var col, row;
            for (i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
                if (i > 0 && col % 7 === 0) {
                    col = 0;
                    row++;
                }
                calendar[row][col] = curDate.clone().hour(hour);
                curDate.hour(12);

                if (this.minDate && calendar[row][col].format('YYYY-MM-DD') == this.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.minDate) && side == 'left') {
                    calendar[row][col] = this.minDate.clone();
                }

                if (this.maxDate && calendar[row][col].format('YYYY-MM-DD') == this.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.maxDate) && side == 'right') {
                    calendar[row][col] = this.maxDate.clone();
                }

            }

            return calendar;
        },

        renderDropdowns: function (selected, minDate, maxDate) {
            var currentMonth = selected.month();
            var currentYear = selected.year();
            var maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
            var minYear = (minDate && minDate.year()) || (currentYear - 50);

            var monthHtml = '<select class="monthselect">';
            var inMinYear = currentYear == minYear;
            var inMaxYear = currentYear == maxYear;

            for (var m = 0; m < 12; m++) {
                if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
                    monthHtml += "<option value='" + m + "'" +
                        (m === currentMonth ? " selected='selected'" : "") +
                        ">" + this.locale.monthNames[m] + "</option>";
                }
            }
            monthHtml += "</select>";

            var yearHtml = '<select class="yearselect">';

            for (var y = minYear; y <= maxYear; y++) {
                yearHtml += '<option value="' + y + '"' +
                    (y === currentYear ? ' selected="selected"' : '') +
                    '>' + y + '</option>';
            }

            yearHtml += '</select>';

            return monthHtml + yearHtml;
        },

        renderCalendar: function (calendar, selected, minDate, maxDate, side) {

            var html = '<div class="calendar-date">';
            html += '<table class="table-condensed">';
            html += '<thead>';
            html += '<tr>';

            // add empty cell for week number
            if (this.showWeekNumbers)
                html += '<th></th>';

            if (!minDate || minDate.isBefore(calendar.firstDay)) {
                html += '<th class="prev available"><i class="fa fa-arrow-left icon icon-arrow-left glyphicon glyphicon-arrow-left"></i></th>';
            } else {
                html += '<th></th>';
            }

            var dateHtml = this.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(" YYYY");

            if (this.showDropdowns) {
                dateHtml = this.renderDropdowns(calendar[1][1], minDate, maxDate);
            }

            html += '<th colspan="5" class="month">' + dateHtml + '</th>';
            if (!maxDate || maxDate.isAfter(calendar.lastDay)) {
                html += '<th class="next available"><i class="fa fa-arrow-right icon icon-arrow-right glyphicon glyphicon-arrow-right"></i></th>';
            } else {
                html += '<th></th>';
            }

            html += '</tr>';
            html += '<tr>';

            // add week number label
            if (this.showWeekNumbers)
                html += '<th class="week">' + this.locale.weekLabel + '</th>';

            $.each(this.locale.daysOfWeek, function (index, dayOfWeek) {
                html += '<th>' + dayOfWeek + '</th>';
            });

            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            for (var row = 0; row < 6; row++) {
                html += '<tr>';

                // add week number
                if (this.showWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].week() + '</td>';

                for (var col = 0; col < 7; col++) {
                    var cname = 'available ';
                    cname += (calendar[row][col].month() == calendar[1][1].month()) ? '' : 'off';

                    if ((minDate && calendar[row][col].isBefore(minDate, DAY)) || (maxDate && calendar[row][col].isAfter(maxDate, DAY))) {
                        cname = ' off disabled ';
                    } else if (calendar[row][col].format('YYYY-MM-DD') == selected.format('YYYY-MM-DD')) {
                        cname += ' active ';
                        if (calendar[row][col].format('YYYY-MM-DD') == this.startDate.format('YYYY-MM-DD')) {
                            cname += ' start-date ';
                        }
                        if (calendar[row][col].format('YYYY-MM-DD') == this.endDate.format('YYYY-MM-DD')) {
                            cname += ' end-date ';
                        }
                    } else if (calendar[row][col] >= this.startDate && calendar[row][col] <= this.endDate) {
                        cname += ' in-range ';
                        if (calendar[row][col].isSame(this.startDate)) { cname += ' start-date '; }
                        if (calendar[row][col].isSame(this.endDate)) { cname += ' end-date '; }
                    }

                    var title = 'r' + row + 'c' + col;
                    html += '<td class="' + cname.replace(/\s+/g, ' ').replace(/^\s?(.*?)\s?$/, '$1') + '" data-title="' + title + '">' + calendar[row][col].date() + '</td>';
                }
                html += '</tr>';
            }

            html += '</tbody>';
            html += '</table>';
            html += '</div>';

            var i;
            if (this.timePicker) {

                html += '<div class="calendar-time">';
                html += '<select class="hourselect">';

                // Disallow selections before the minDate or after the maxDate
                var min_hour = 0;
                var max_hour = 23;

                if (minDate && (side == 'left' || this.singleDatePicker) && selected.format('YYYY-MM-DD') == minDate.format('YYYY-MM-DD')) {
                    min_hour = minDate.hour();
                    if (selected.hour() < min_hour)
                        selected.hour(min_hour);
                    if (this.timePicker12Hour && min_hour >= 12 && selected.hour() >= 12)
                        min_hour -= 12;
                    if (this.timePicker12Hour && min_hour == 12)
                        min_hour = 1;
                }

                if (maxDate && (side == 'right' || this.singleDatePicker) && selected.format('YYYY-MM-DD') == maxDate.format('YYYY-MM-DD')) {
                    max_hour = maxDate.hour();
                    if (selected.hour() > max_hour)
                        selected.hour(max_hour);
                    if (this.timePicker12Hour && max_hour >= 12 && selected.hour() >= 12)
                        max_hour -= 12;
                }

                var start = 0;
                var end = 23;
                var selected_hour = selected.hour();
                if (this.timePicker12Hour) {
                    start = 1;
                    end = 12;
                    if (selected_hour >= 12)
                        selected_hour -= 12;
                    if (selected_hour === 0)
                        selected_hour = 12;
                }

                for (i = start; i <= end; i++) {

                    if (i == selected_hour) {
                        html += '<option value="' + i + '" selected="selected">' + i + '</option>';
                    } else if (i < min_hour || i > max_hour) {
                        html += '<option value="' + i + '" disabled="disabled" class="disabled">' + i + '</option>';
                    } else {
                        html += '<option value="' + i + '">' + i + '</option>';
                    }
                }

                html += '</select> : ';

                html += '<select class="minuteselect">';

                // Disallow selections before the minDate or after the maxDate
                var min_minute = 0;
                var max_minute = 59;

                if (minDate && (side == 'left' || this.singleDatePicker) && selected.format('YYYY-MM-DD h A') == minDate.format('YYYY-MM-DD h A')) {
                    min_minute = minDate.minute();
                    if (selected.minute() < min_minute)
                        selected.minute(min_minute);
                }

                if (maxDate && (side == 'right' || this.singleDatePicker) && selected.format('YYYY-MM-DD h A') == maxDate.format('YYYY-MM-DD h A')) {
                    max_minute = maxDate.minute();
                    if (selected.minute() > max_minute)
                        selected.minute(max_minute);
                }

                for (i = 0; i < 60; i += this.timePickerIncrement) {
                    var num = i;
                    if (num < 10)
                        num = '0' + num;
                    if (i == selected.minute()) {
                        html += '<option value="' + i + '" selected="selected">' + num + '</option>';
                    } else if (i < min_minute || i > max_minute) {
                        html += '<option value="' + i + '" disabled="disabled" class="disabled">' + num + '</option>';
                    } else {
                        html += '<option value="' + i + '">' + num + '</option>';
                    }
                }

                html += '</select> ';

                if (this.timePickerSeconds) {
                    html += ': <select class="secondselect">';

                    for (i = 0; i < 60; i += this.timePickerIncrement) {
                        var num = i;
                        if (num < 10)
                            num = '0' + num;
                        if (i == selected.second()) {
                            html += '<option value="' + i + '" selected="selected">' + num + '</option>';
                        } else {
                            html += '<option value="' + i + '">' + num + '</option>';
                        }
                    }

                    html += '</select>';
                }

                if (this.timePicker12Hour) {
                    html += '<select class="ampmselect">';

                    // Disallow selection before the minDate or after the maxDate
                    var am_html = '';
                    var pm_html = '';

                    if (minDate && (side == 'left' || this.singleDatePicker) && selected.format('YYYY-MM-DD') == minDate.format('YYYY-MM-DD') && minDate.hour() >= 12) {
                        am_html = ' disabled="disabled" class="disabled"';
                    }

                    if (maxDate && (side == 'right' || this.singleDatePicker) && selected.format('YYYY-MM-DD') == maxDate.format('YYYY-MM-DD') && maxDate.hour() < 12) {
                        pm_html = ' disabled="disabled" class="disabled"';
                    }

                    if (selected.hour() >= 12) {
                        html += '<option value="AM"' + am_html + '>AM</option><option value="PM" selected="selected"' + pm_html + '>PM</option>';
                    } else {
                        html += '<option value="AM" selected="selected"' + am_html + '>AM</option><option value="PM"' + pm_html + '>PM</option>';
                    }
                    html += '</select>';
                }

                html += '</div>';

            }

            return html;

        },

        remove: function() {

            this.container.remove();
            this.element.off('.daterangepicker');
            this.element.removeData('daterangepicker');

        }

    };

    $.fn.daterangepicker = function (options, cb) {
        this.each(function () {
            var el = $(this);
            if (el.data('daterangepicker'))
                el.data('daterangepicker').remove();
            el.data('daterangepicker', new DateRangePicker(el, options, cb));
        });
        return this;
    };

}));
