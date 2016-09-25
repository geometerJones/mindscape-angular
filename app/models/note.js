"use strict";
var node_1 = require('./node');
var relation_1 = require('./relation');
var Note = (function () {
    function Note(note_data, settings) {
        var _this = this;
        // the node is the core data structure of the note, corresponds to the neo4j node
        this.node = new node_1.Node(note_data.node);
        // relations are sets of relationships, grouped by target
        // (the relation 'source' is this, the note that holds the relation; the relation 'target' is the relationship partner note)
        this.relations_by_id = {};
        this.relations = [];
        // this.relations, filtered by relationship types, yields this.definitions, this.presentations, this.equations
        // these three subsets may overlap (multiple relationship types are possible in any one relation) 
        this.definitions = [];
        this.presentations = [];
        this.equations = [];
        note_data.relations.forEach(function (relation_data) {
            // load each relation
            var relation = new relation_1.Relation(relation_data);
            _this.addRelation(relation);
        });
        // process node data, settings to build additional note data
        this.created = new Date(this.node.created).toLocaleString();
        this.updated = this.node.updated ? new Date(this.node.updated).toLocaleString() : '';
        this.current = (this.node.id == settings.current_id);
        // a note is extra if it is outside of the user's definition-tree (aka mandala)
        this.extra = (this.node.root_id != settings.root_id);
        if (this.extra) {
            // extra-notes cannot be the root or frame of the user
            this.root = false;
            this.frame = false;
            // a user doesn't (yet?) fix/set the position of extra-notes
            this.x = null;
            this.y = null;
            this.fixed = 0;
        }
        else {
            this.root = (this.node.id == settings.root_id);
            this.frame = (this.node.id == settings.frame_id);
            // note coordinates are css/html coordinates; node coordinates are cartesian coordinates
            this.x = settings.width / 2 + this.node.x;
            this.y = settings.height / 2 - this.node.y;
            this.fixed = this.node.fixed ? 1 : 0;
        }
        // a blank relation used to post new relations
        this.freeRelation = new relation_1.Relation({
            source_id: this.node.id,
            target_id: settings.current_id
        });
    }
    Note.prototype.addRelation = function (relation) {
        console.assert(!this.relations_by_id[relation.target_id], 'adding a relation that already exists', relation, this.relations_by_id[relation.target_id]);
        this.relations_by_id[relation.target_id] = relation;
        this.relations.push(relation);
        if (!relation.define.empty) {
            this.definitions.push(relation);
            this.positionDefinitions = true;
        }
        if (!relation.present.empty) {
            this.presentations.push(relation);
            this.positionPresentations = true;
        }
        if (!relation.equate.empty) {
            this.equations.push(relation);
            this.positionEquations = true;
        }
    };
    Note.prototype.addRelationship = function (r) {
        return this.setRelationship(r, false);
    };
    Note.prototype.removeRelationship = function (r) {
        return this.setRelationship(r, true);
    };
    Note.prototype.setRelationship = function (r, deletion) {
        var target_id;
        if (this.node.id == r.start) {
            target_id = r.end;
        }
        else if (this.node.id == r.end) {
            target_id = r.start;
        }
        else {
            console.error('cannot add relationship to unrelated note', r);
            return false;
        }
        var mode_changed;
        var relation = this.relations_by_id[target_id];
        if (deletion) {
            console.assert(relation, 'relation not found', r, this);
            mode_changed = relation.removeRelationship(r);
            if (mode_changed) {
                var relation_empty = true;
                if (relation.define.empty) {
                    if (r.type == 'DEFINE') {
                        this.spliceRelation(relation, this.definitions);
                    }
                }
                else {
                    relation_empty = false;
                }
                if (relation.present.empty) {
                    if (r.type == 'PRESENT') {
                        this.spliceRelation(relation, this.presentations);
                    }
                }
                else {
                    relation_empty = false;
                }
                if (relation.equate.empty) {
                    if (r.type == 'EQUATE') {
                        this.spliceRelation(relation, this.equations);
                    }
                }
                else {
                    relation_empty = false;
                }
                // remove relation if all modes empty, i.e. no filled relationships
                if (relation_empty) {
                    delete this.relations_by_id[target_id];
                    this.spliceRelation(relation, this.relations);
                }
            }
        }
        else {
            if (!relation) {
                relation = new relation_1.Relation({
                    source_id: this.node.id,
                    target_id: target_id
                });
                this.relations_by_id[target_id] = relation;
                this.relations.push(relation);
            }
            mode_changed = relation.addRelationship(r);
        }
        if (r.type == 'DEFINE') {
            this.definitions.sort(relation_1.Relation.compareByDefinitions);
        }
        else if (r.type == 'PRESENT') {
            this.presentations.sort(relation_1.Relation.compareByPresentations);
        }
        else if (r.type == 'EQUATE') {
            this.equations.sort(relation_1.Relation.compareByEquations);
        }
        else
            console.error('invalid relationship type', r);
        //this.positionRelations = true;
        return mode_changed;
    };
    Note.prototype.spliceRelation = function (r, list) {
        for (var i = 0; i < list.length; i++) {
            if (r.target_id == list[i].target_id) {
                list.splice(i, 1);
                return true;
            }
        }
        return false;
    };
    return Note;
}());
exports.Note = Note;
//# sourceMappingURL=note.js.map