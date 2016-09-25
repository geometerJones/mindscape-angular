"use strict";
var mode_1 = require('./mode');
var Relation = (function () {
    // data.source_id
    // data.target_id
    // data.define
    // data.present
    // data.equate
    function Relation(data) {
        this.source_id = data.source_id;
        this.target_id = data.target_id;
        this.define = new mode_1.Mode({
            source_id: data.source_id,
            target_id: data.target_id,
            type: 'DEFINE',
            relationships: data.define
        });
        this.present = new mode_1.Mode({
            source_id: data.source_id,
            target_id: data.target_id,
            type: 'PRESENT',
            relationships: data.present
        });
        this.equate = new mode_1.Mode({
            source_id: data.source_id,
            target_id: data.target_id,
            type: 'EQUATE',
            relationships: data.equate
        });
        this.modes = [this.define, this.present, this.equate];
    }
    Relation.prototype.getMode = function (type) {
        if (type == 'DEFINE') {
            return this.define;
        }
        if (type == 'PRESENT') {
            return this.present;
        }
        if (type == 'EQUATE') {
            return this.equate;
        }
        console.error('invalid type', type);
        return null;
    };
    // returns true if need to add a link
    Relation.prototype.addRelationship = function (r) {
        return this.setRelationship(r, false);
    };
    // returns true if need to remove a link
    Relation.prototype.removeRelationship = function (r) {
        return this.setRelationship(r, true);
    };
    Relation.prototype.setRelationship = function (r, deletion) {
        var mode;
        if (r.type == 'DEFINE') {
            mode = this.define;
        }
        else if (r.type == 'PRESENT') {
            mode = this.present;
        }
        else if (r.type == 'EQUATE') {
            mode = this.equate;
        }
        else
            console.error('invalid relationship type', r);
        if (deletion) {
            return mode.removeRelationship(r);
        }
        else {
            return mode.addRelationship(r);
        }
    };
    Relation.compareByDefinitions = function (a, b) {
        if (a.define.rank > b.define.rank) {
            return -1;
        }
        if (a.define.rank < b.define.rank) {
            return 1;
        }
        return 0;
    };
    Relation.compareByPresentations = function (a, b) {
        if (a.define.rank > b.define.rank) {
            return -1;
        }
        if (a.define.rank < b.define.rank) {
            return 1;
        }
        return 0;
    };
    Relation.compareByEquations = function (a, b) {
        if (a.define.rank > b.define.rank) {
            return -1;
        }
        if (a.define.rank < b.define.rank) {
            return 1;
        }
        return 0;
    };
    Relation.reverse = function (r) {
        var reverse = new Relation({
            source_id: r.target_id,
            target_id: r.source_id,
            define: mode_1.Mode.reverse(r.define),
            present: mode_1.Mode.reverse(r.present),
            equate: mode_1.Mode.reverse(r.equate)
        });
        return reverse;
    };
    return Relation;
}());
exports.Relation = Relation;
//# sourceMappingURL=relation.js.map