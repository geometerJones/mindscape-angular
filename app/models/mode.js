"use strict";
var relationship_1 = require('./relationship');
var Mode = (function () {
    function Mode(data) {
        var _this = this;
        this.source_id = data.source_id;
        this.target_id = data.target_id;
        this.type = data.type;
        this.extra_ins = [];
        this.extra_outs = [];
        if (data.relationships) {
            this.in = data.relationships.in ? new relationship_1.Relationship(data.relationships.in) : null;
            this.out = data.relationships.out ? new relationship_1.Relationship(data.relationships.out) : null;
            if (Array.isArray(data.relationships.extra_ins)) {
                data.relationships.extra_ins.forEach(function (relationship_data) {
                    var relationship = new relationship_1.Relationship(relationship_data);
                    _this.extra_ins.push(relationship);
                });
            }
            if (Array.isArray(data.relationships.extra_outs)) {
                data.relationships.extra_outs.forEach(function (relationship_data) {
                    var relationship = new relationship_1.Relationship(relationship_data);
                    _this.extra_outs.push(relationship);
                });
            }
        }
        this.update();
        this.x = 0;
        this.y = 0;
    }
    Mode.prototype.update = function () {
        var empty = true;
        var rank = 0;
        if (this.in) {
            empty = false;
            rank += Mode.weights.in;
        }
        if (this.out) {
            empty = false;
            rank += Mode.weights.out;
        }
        if (this.extra_ins.length > 0) {
            empty = false;
            rank += Mode.weights.x_in * this.extra_ins.length;
        }
        if (this.extra_outs.length > 0) {
            empty = false;
            rank += Mode.weights.x_out * this.extra_outs.length;
        }
        this.empty = empty;
        this.rank = rank;
    };
    // return true if adding relationship to empty mode
    Mode.prototype.addRelationship = function (r) {
        return this.setRelationship(r, false);
    };
    // return true if removing relationship results in empty mode
    Mode.prototype.removeRelationship = function (r) {
        return this.setRelationship(r, true);
    };
    Mode.prototype.setRelationship = function (r, deletion) {
        if (this.type != r.type)
            console.error('inempty relationship type', r);
        var direction;
        if (this.source_id == r.start) {
            direction = 'out';
        }
        else if (this.source_id == r.end) {
            direction = 'in';
        }
        else
            console.error('inempty relationship endpoints', r);
        if (deletion) {
            this[direction] = null;
        }
        else {
            this[direction] = r;
        }
        var past_empty = this.empty;
        this.update();
        if (deletion && past_empty && !this.empty) {
            return true;
        }
        if (!deletion && !past_empty && this.empty) {
            return true;
        }
        return false;
    };
    Mode.reverse = function (m) {
        var reverse = new Mode({
            source_id: m.target_id,
            target_id: m.source_id,
            type: m.type,
            relationships: {
                in: m.out,
                extra_ins: m.extra_outs,
                out: m.in,
                extra_outs: m.extra_ins
            }
        });
        return reverse;
    };
    Mode.weights = {
        in: 10000,
        out: 1000,
        x_in: 1,
        x_out: 1
    };
    return Mode;
}());
exports.Mode = Mode;
//# sourceMappingURL=mode.js.map