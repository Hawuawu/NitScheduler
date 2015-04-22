var NitScheduler = function (options) {
    this.supportedZooms = [360, 480, 720, 1440];
    this.zoom = 4;
    this.holder = "";
    this.dayMinHeight = 24;
    this.timeTitle = "";
    this.daysTitle = "";
    this.content = "";
    this.days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    this.timePeriods = 24;

    var nitScheduler = this;

    this.initialize = function (holder) {
        holder.empty();
        nitScheduler.holder = holder;
        nitScheduler.timeTitle = $("<div class=\"scheduler_time_title\"></div>");
        holder.append(nitScheduler.timeTitle)

        nitScheduler.daysTitle = $("<div class=\"scheduler_days_title\"></div>");
        holder.append(nitScheduler.daysTitle)

        nitScheduler.content = $("<div class=\"scheduler_content\"></div>");
        holder.append(nitScheduler.content)
        nitScheduler.content.css({width: "90%"});

        holder.append($("<div style=\"clear: both\"></div>"));

        for (var i = 0; i < nitScheduler.supportedZooms.length; i++) {
            var zoomPixels = nitScheduler.supportedZooms[i];
            if (nitScheduler.content.width() >= zoomPixels) {
                nitScheduler.zoom = 1440 / zoomPixels;
            }
        }

        nitScheduler.resize();
        nitScheduler.renderGrid();
        nitScheduler.setPositionForDaysTitle();
        nitScheduler.setPositionForTimeTitle();

        nitScheduler.renderData(options.start, options.end, options.data)
    }

    this.resize = function () {
        nitScheduler.content.css({height: nitScheduler.dayMinHeight * nitScheduler.days.length, width: 1440 / nitScheduler.zoom})
        nitScheduler.daysTitle.css({height: nitScheduler.dayMinHeight * nitScheduler.days.length, width: nitScheduler.timeTitle.width() - nitScheduler.content.width()})
        nitScheduler.timeTitle.css({height: nitScheduler.dayMinHeight})

    }

    this.renderGrid = function () {
        var cellWidth = nitScheduler.content.width() / 24
        var cellHeight = nitScheduler.content.height() / 7
        for (var dayOffset = 0; dayOffset < 7; dayOffset++) {
            for (var hourOffset = 0; hourOffset < 24; hourOffset++) {
                var cell = $("<div class=\"cell\"></div>");
                nitScheduler.content.append(cell)
                cell.css({position: "absolute", width: cellWidth, height: cellHeight, left: (hourOffset * cellWidth), top: (dayOffset * cellHeight)})
                if (hourOffset !== 23) {
                    cell.css({"border-right": "1px solid #C0E3DD"});
                }

                if (dayOffset !== 6) {
                    cell.css({"border-bottom": "1px solid #C0E3DD"});
                }
            }
        }


    }

    this.setPositionForDaysTitle = function () {
        nitScheduler.daysTitle.empty();
        for (var i = 0; i < nitScheduler.days.length; i++) {
            var day = $("<div class=\"day\"><div class=\"inner\">" + nitScheduler.days[i] + "</div></div>");
            day.css({position: "absolute", top: (i * nitScheduler.dayMinHeight), right: 0, height: nitScheduler.dayMinHeight});
            nitScheduler.daysTitle.append(day)
        }
    }

    this.setPositionForTimeTitle = function () {
        nitScheduler.timeTitle.empty();
        var initialLeft = nitScheduler.daysTitle.width()
        var positionParameter = (nitScheduler.timeTitle.width() - nitScheduler.daysTitle.width()) / nitScheduler.timePeriods;
        var maxWidth = 0;
        for (var i = 0; i <= nitScheduler.timePeriods; i++) {
            switch (nitScheduler.zoom) {
                case 5:
                case 4:
                case 3:
                    if (i % 2 == 0) {
                        var hour = $("<div class=\"hour\"><div class=\"inner\">" + i + "</div></div>");
                        nitScheduler.timeTitle.append(hour)
                    } else {
                        var hour = $("<div class=\"hour\"><div class=\"inner\"></div></div>");
                        nitScheduler.timeTitle.append(hour)
                    }
                    break;
                default:
                    var hour = $("<div class=\"hour\"><div class=\"inner\">" + i + "</div></div>");
                    nitScheduler.timeTitle.append(hour)
            }
            hour.css({position: "absolute", bottom: 5, "text-align": "center"});
            if (hour.width() > maxWidth) {
                maxWidth = hour.width()
            }
        }

        nitScheduler.timeTitle.children().each(function (i, object) {
            var left = (initialLeft + (i * positionParameter) - maxWidth);
            $(this).css({width: maxWidth, left: left})
        })
        nitScheduler.daysTitle.css({width: nitScheduler.daysTitle.width() - (maxWidth / 2)})
        // nitScheduler.content.css({width: nitScheduler.content.width() + (maxWidth)})
        // nitScheduler.timeTitle.css({width: nitScheduler.timeTitle.width() + (maxWidth / 2)})

    }
    this.renderData = function (start, end, data) {

        var renderDataMatrix = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        };

        for (var i = 0; i < data.length; i++) {
            if (data[i].start < start && data[i].end > start) {
                data[i].start = start;
            }

            if (data[i].start < end && data[i].end > end) {
                data[i].end = end;
            }
            var matrixIndex = getDaysOffset(start, data[i].start)
            if (data[i].start < data[i].end) {
                var startEndOffset = getDaysOffset(data[i].start, data[i].end)
                if (startEndOffset === 0) {
                    if (isSameDay(data[i].start, data[i].end)) {
                        renderDataMatrix[matrixIndex].push({start: data[i].start.getHours() * 60 + data[i].start.getMinutes(), duration: ((data[i].end - data[i].start) / 60 / 1000), event: data[i].event})
                    } else {
                        var firstDuration = (24 * 60) - (data[i].start.getHours() * 60 + data[i].start.getMinutes())
                        var secondDuration = ((data[i].end - data[i].start) / 60 / 1000) - firstDuration;

                        renderDataMatrix[matrixIndex].push({start: data[i].start.getHours() * 60 + data[i].start.getMinutes(), duration: firstDuration, event: data[i].event})
                        renderDataMatrix[matrixIndex + 1].push({start: 0, duration: secondDuration, event: data[i].event})
                    }
                } else {
                    renderDataMatrix[matrixIndex].push({start: (data[i].start.getHours() * 60 + data[i].start.getMinutes()), duration: (24 * 60) - (data[i].start.getHours() * 60 + data[i].start.getMinutes()), event: data[i].event})
                    var minutesToRender = ((data[i].end - data[i].start) / 60 / 1000) - ((24 * 60) - (data[i].start.getHours() * 60 + data[i].start.getMinutes()));
                    var offset = 0;
                    while (minutesToRender % (24 * 60 * 60 * 1000) > 0) {
                        offset++;
                        renderDataMatrix[matrixIndex + offset].push({start: 0, duration: (24 * 60 * 60 * 1000), event: data[i].event})
                    }
                    renderDataMatrix[matrixIndex + offset].push({start: 0, duration: minutesToRender, event: data[i].event})
                }
            }
        }

        //   var positionParameter =  nitScheduler.content.width() / (24*60)


        for (var i = 0; i < 7; i++) {
            for (var p = 0; p < renderDataMatrix[i].length; p++) {
                var data = renderDataMatrix[i][p]
                var event = $("<div class=\"event\" alt=\"" + data.event + "\" time=\"" + minutesToString(data.start) + " - " + minutesToString(data.start + data.duration) + "\"></div>");
                nitScheduler.content.append(event)
                var left = Math.round(data.start / nitScheduler.zoom)
                var width = Math.round(data.duration / nitScheduler.zoom)
                event.css({position: "absolute", left: left, top: (i * nitScheduler.dayMinHeight + 3), height: nitScheduler.dayMinHeight - 6, width: width})

                event.mouseenter(function (e) {
                    nitScheduler.content.find(".event").each(function () {
                        if ($(this)[0] !== $(e.target)[0]) {
                            $(this).css({opacity: 0.4})
                        }
                    })
                    nitScheduler.content.find(".event_bubble").remove()
                    var eventBubble = $(
                            "<div class=\"event_bubble\">" +
                            "<span class=\"time_row\">" + $(this).attr("time") + "</span>" +
                            "<span class=\"event_row\">" + $(this).attr("alt") + "</span>" +
                            "</div>"
                            )
                    nitScheduler.content.append(eventBubble)
                    var padding = eventBubble.css("padding")
                    eventBubble.css({position: "absolute", "z-index": 1000, left: ($(this).position().left - (eventBubble.width() / 2) + ($(this).width() / 2)), top: $(this).position().top - (eventBubble.height() + 17 + 20)})
                })

                event.mouseleave(function () {
                 //   $(this).css({border: "none", "z-index": 1})
                    nitScheduler.content.find(".event_bubble").remove()
                    nitScheduler.content.find(".event").css({opacity: 1})
                })
            }
        }

        nitScheduler.daysTitle.children().each(function (index, object) {
            var dateForLabeling = new Date(start);
            dateForLabeling.setDate(start.getDate() + index);
            if (nitScheduler.daysTitle.width() < 150 && nitScheduler.daysTitle.width() > 80) {
                var label = $("<span class=\"date\">" + dateForLabeling.getDate().toString() + "." + (dateForLabeling.getMonth() + 1).toString() + ".</span><span class=\"minus\">-</span><span class=\"day_in_week\">" + nitScheduler.days[dateForLabeling.getDay()] + "</span>")
                $(this).empty()
                $(this).append(label)
            } else if (nitScheduler.daysTitle.width() < 40) {
                $(this).text(nitScheduler.days[dateForLabeling.getDay()]);
                var label = $("<span class=\"day_in_week\">" + nitScheduler.days[dateForLabeling.getDay()] + "</span>")
                $(this).empty()
                $(this).append(label)
            } else if (nitScheduler.daysTitle.width() > 150) {
                var label = $("<span class=\"date\">" + dateForLabeling.toLocaleDateString() + "</span><span class=\"minus\">-</span><span class=\"day_in_week\">" + nitScheduler.days[dateForLabeling.getDay()] + "</span>")
                $(this).empty()
                $(this).append(label)
            }
        })

        function isSameDay(first, second) {
            return (first.getDate() === second.getDate() && first.getMonth() === second.getMonth() && first.getFullYear() === second.getFullYear())
        }

        function getDaysOffset(first, second) {
            var diff = second - first;
            var result = diff / (1000 * 60 * 60 * 24);
            if (result < 0) {
                return Math.ceil(result);
            }
            return Math.floor(result);
        }

        function minutesToString(value) {
            var hours = Math.floor(value / 60)
            var minutes = value - (hours * 60)
            var hoursString = hours.toString()
            if (hoursString.length == 1) {
                hoursString = '0' + hoursString
            }
            var minutesString = minutes.toString()
            if (minutesString.length == 1) {
                minutesString = '0' + minutesString
            }

            return hoursString + ":" + minutesString;
        }
    }
}

$.fn.nitScheduler = function (options) {
    return this.each(function () {
        var scheduler = new NitScheduler(options);
        scheduler.initialize($(this));
    })
}
//$(window).resize(function () { /* do something */ });


