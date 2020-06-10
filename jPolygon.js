/*
   jPolygon - a ligthweigth javascript library to draw polygons over HTML5 canvas images.
   Project URL: http://www.matteomattei.com/projects/jpolygon
   Author: Matteo Mattei <matteo.mattei@gmail.com>
   Version: 1.0
   License: MIT License
*/

class jPolygon {
    perimeter = [];
    complete = false;
    canvas;
    ctx;
    settings;

    constructor(_canvas, _settings) {
        this.canvas = _canvas;

        const {imgSrc, coordinates, coordinatesField, onComplete, onClose, onIntersect, onIncomplete} = _settings;
        this.settings = {imgSrc, coordinates, coordinatesField, onComplete, onClose, onIntersect, onIncomplete};

        this.clear_canvas();
    }

    line_intersects(p0, p1, p2, p3) {
        let s1_x, s1_y, s2_x, s2_y;
        s1_x = p1['x'] - p0['x'];
        s1_y = p1['y'] - p0['y'];
        s2_x = p3['x'] - p2['x'];
        s2_y = p3['y'] - p2['y'];

        let s, t;
        s = (-s1_y * (p0['x'] - p2['x']) + s1_x * (p0['y'] - p2['y'])) / (-s2_x * s1_y + s1_x * s2_y);
        t = (s2_x * (p0['y'] - p2['y']) - s2_y * (p0['x'] - p2['x'])) / (-s2_x * s1_y + s1_x * s2_y);

        return s >= 0 && s <= 1 && t >= 0 && t <= 1;
    }

    point(x, y) {
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "white";
        this.ctx.fillRect(x - 2, y - 2, 4, 4);
        this.ctx.moveTo(x, y);
    }

    undo() {
        this.ctx = undefined;
        this.perimeter.pop();
        this.complete = false;
        this.start(true);
    }

    clear_canvas() {
        this.ctx = undefined;
        this.perimeter = [];
        this.complete = false;
        this.settings.coordinatesField.value = '';
        this.start();
    }

    draw(end) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "white";
        this.ctx.lineCap = "square";
        this.ctx.beginPath();

        for (let i = 0; i < this.perimeter.length; i++) {
            if (i === 0) {
                this.ctx.moveTo(this.perimeter[i]['x'], this.perimeter[i]['y']);
                end || this.point(this.perimeter[i]['x'], this.perimeter[i]['y']);
            } else {
                this.ctx.lineTo(this.perimeter[i]['x'], this.perimeter[i]['y']);
                end || this.point(this.perimeter[i]['x'], this.perimeter[i]['y']);
            }
        }
        if (end) {
            this.ctx.lineTo(this.perimeter[0]['x'], this.perimeter[0]['y']);
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'blue';
            this.complete = true;
        }
        this.ctx.stroke();

        // print coordinates
        if (this.perimeter.length === 0) {
            this.settings.coordinatesField.value = '';
        } else {
            this.settings.coordinates = this.perimeter;
            this.settings.coordinatesField.value = JSON.stringify(this.perimeter);
        }
    }

    check_intersect(x, y) {
        if (this.perimeter.length < 4) {
            return false;
        }
        const p0 = [];
        const p1 = [];
        const p2 = [];
        const p3 = [];

        p2['x'] = this.perimeter[this.perimeter.length - 1]['x'];
        p2['y'] = this.perimeter[this.perimeter.length - 1]['y'];
        p3['x'] = x;
        p3['y'] = y;

        for (let i = 0; i < this.perimeter.length - 1; i++) {
            p0['x'] = this.perimeter[i]['x'];
            p0['y'] = this.perimeter[i]['y'];
            p1['x'] = this.perimeter[i + 1]['x'];
            p1['y'] = this.perimeter[i + 1]['y'];
            if (p1['x'] === p2['x'] && p1['y'] === p2['y']) {
                continue;
            }
            if (p0['x'] === p3['x'] && p0['y'] === p3['y']) {
                continue;
            }
            if (this.line_intersects(p0, p1, p2, p3) === true) {
                return true;
            }
        }
        return false;
    }

    point_it(event) {
        if (this.complete) {
            this.settings.onComplete();
            return false;
        }
        let rect, x, y;

        if (event.ctrlKey || event.which === 3 || event.button === 2) {
            if (this.perimeter.length === 2) {
                this.settings.onIncomplete();
                return false;
            }
            x = this.perimeter[0]['x'];
            y = this.perimeter[0]['y'];
            if (this.check_intersect(x, y)) {
                this.settings.onIntersect();
                return false;
            }
            this.draw(true);
            this.settings.onClose();
            event.preventDefault();
            return false;
        } else {
            rect = this.canvas.getBoundingClientRect();
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
            if (this.perimeter.length > 0 && x === this.perimeter[this.perimeter.length - 1]['x'] && y === this.perimeter[this.perimeter.length - 1]['y']) {
                // same point - double click
                return false;
            }
            if (this.check_intersect(x, y)) {
                this.settings.onIntersect();
                return false;
            }
            this.perimeter.push({'x': x, 'y': y});
            this.draw(false);
            return false;
        }
    }

    start(with_draw) {
        const img = new Image();
        img.src = this.settings.imgSrc;

        img.onload = () => {
            var hRatio = this.canvas.width / img.width;
            var vRatio = this.canvas.height / img.height;
            var ratio = Math.min(hRatio, vRatio);

            this.canvas.width = img.width * ratio;
            this.canvas.height = img.height * ratio;
            this.ctx = this.canvas.getContext("2d");
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            if (with_draw === true) {
                this.draw(false);
            }
        }
    }
}

$.fn.extend({
    jPolygon: function ({imgSrc, width, height, coordinates, $coordinates, onComplete, onClose, onIntersect, onIncomplete}) {
        const $this = this;

        $this.css({cursor: 'crosshair'});
        $this.attr('width', width);
        $this.attr('height', height);

        const jpolygon = new jPolygon($this.get(0), {
            coordinates,
            coordinatesField: $coordinates.get(0),
            imgSrc,
            onComplete,
            onClose,
            onIntersect,
            onIncomplete,
        });

        $this
            .on('mousedown', (event) => {
                jpolygon.point_it(event);
            })
            .on('contextmenu', (event) => {
                return false;
            });

        return jpolygon;
    }
});
