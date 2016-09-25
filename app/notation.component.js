"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var D3 = require('d3/index');
var link_1 = require('./models/link');
var relation_1 = require('./models/relation');
var authentication_service_1 = require('./authentication.service');
var notation_service_1 = require('./notation.service');
var note_component_1 = require('./note.component');
// <line *ngFor="let link of links" class='link'></line>
var NotationComponent = (function () {
    function NotationComponent(authenticationService, notationService) {
        this.authenticationService = authenticationService;
        this.notationService = notationService;
        // default world (space) settings
        this.mouse = {
            x: 0,
            y: 0,
            node_x: 0,
            node_y: 0
        };
        // a Notation M consists of
        // N: a set of nodes
        // D: a set of directed relations between nodes in N that represent abstraction (vs definition)
        // P: a set of directed relations between notes in N that represent a temporal/presentational flow
        // each note comprises a node and the relations involving that node
        this.notes = [];
        this.notes_by_id = {};
        // these are the nodes extracted from this.notes
        //nodes: Node[] = [];
        this.$boxes = null; // holds note.components
        this.$handles = null; // handles dragging, pinning of note
        this.handleZ = 100000; // eventually a frame click will cover an untouched handle...
        this.boxZ = 0;
        // these are the relations extracted form this.notes
        this.links = [];
        this.$arrows = null; // visualizes relations between nodes
        this.drag = {
            fixing: false,
            x0: 0,
            y0: 0
        };
        this.tick = false;
        this.counter = 0;
        this.scrollNote = null;
    }
    NotationComponent.prototype.ngOnInit = function () {
        this.getNotation();
    };
    NotationComponent.prototype.getNotation = function () {
        var _this = this;
        this.notationService.getNotation().subscribe(function (notation) {
            _this.settings = notation.settings;
            _this.notes = notation.notes;
            _this.notes_by_id = notation.notes_by_id;
            _this.links = notation.links;
            _this.spaceOut();
            _this.initForce();
        }, function (error) { console.error(error); });
    };
    NotationComponent.prototype.spaceOut = function () {
        var _this = this;
        // resize space
        this.$space = D3.select('.space')
            .style('width', this.settings.width)
            .style('height', this.settings.height)
            .on('mousemove', function () {
            _this.mouse.x = D3.event.offsetX;
            _this.mouse.y = D3.event.offsetY;
            _this.mouse.node_x = _this.mouse.x - _this.settings.width / 2;
            _this.mouse.node_y = _this.settings.height / 2 - _this.mouse.y;
        });
        this.$svg = this.$space.select('svg')
            .attr('width', this.settings.width)
            .attr('height', this.settings.height)
            .on('dblclick', function () {
            _this.addNote(D3.event);
        });
        // center view (on space origin)
        this.centerView(this.settings.width / 2, this.settings.height / 2);
        // draw axes/coordinates
        this.drawOrthogonals();
    };
    NotationComponent.prototype.centerView = function (x, y) {
        var viewX = x - window.innerWidth / 2;
        var viewY = y - window.innerHeight / 2 + 50; // offset for header
        window.scroll(viewX, viewY); //TODO make this a smooth transition
    };
    NotationComponent.prototype.drawOrthogonals = function () {
        var _this = this;
        var interval = 200;
        var radius = Math.min(this.settings.width, this.settings.height) / 2;
        var _loop_1 = function(i) {
            [-1, 1].forEach(function (direction) {
                var y = _this.settings.height / 2 + direction * i;
                _this.$svg.append('line') // horizontals
                    .attr('class', 'axis')
                    .attr('x1', 0)
                    .attr('y1', y)
                    .attr('x2', _this.settings.width)
                    .attr('y2', y)
                    .attr('stroke', function (d) {
                    if (i == 0) {
                        return 'dimgrey';
                    }
                    return 'lavender';
                })
                    .attr('stroke-width', function (d) {
                    if (i == 0) {
                        return 1;
                    }
                    return 1;
                });
                var x = _this.settings.width / 2 + direction * i;
                _this.$svg.append('line') // verticals
                    .attr('class', 'axis')
                    .attr('x1', x)
                    .attr('y1', 0)
                    .attr('x2', x)
                    .attr('y2', _this.settings.height)
                    .attr('stroke', function (d) {
                    if (i == 0) {
                        return 'dimgrey';
                    }
                    return 'lavender';
                })
                    .attr('stroke-width', function (d) {
                    if (i == 0) {
                        return 1;
                    }
                    return 1;
                });
            });
        };
        for (var i = 0; i < radius; i += interval) {
            _loop_1(i);
        }
    };
    NotationComponent.prototype.initForce = function () {
        var _this = this;
        this.force = D3.layout.force()
            .size([this.settings.width, this.settings.height])
            .nodes(this.notes)
            .links(this.links)
            .gravity(this.settings.gravity)
            .friction(this.settings.friction)
            .linkDistance(function (d) {
            var distance = _this.settings.linkDistance;
            return distance;
        })
            .linkStrength(function (d) {
            var strength = _this.settings.linkStrength;
            return strength;
        })
            .charge(function (d) {
            var charge = _this.settings.charge;
            return charge;
        })
            .theta(this.settings.theta)
            .on('tick', function () { _this.tick = true; })
            .start();
    };
    NotationComponent.prototype.ngAfterViewChecked = function () {
        var _this = this;
        // these blocks are here at this lifecycle hook to ensure angular has already loaded the frame/handle elements
        // drawArrows doesn't have to wait for this, but it's grouped here with the other element manipulation
        if (this.force && !this.$arrows && !this.$boxes && !this.$handles) {
            this.finishRender(this.notes);
            window.requestAnimationFrame(function (timestamp) {
                _this.animate(timestamp);
            });
        }
        if (this.newNote) {
            var note = this.newNote;
            this.newNote = null;
            this.finishRender([note]);
            this.force.start();
        }
        if (this.deletedNote) {
            this.deletedNote = null;
            this.finishRender([]);
            this.force.start();
        }
        // if this.force movement = nil, do something?
        // TODO run force for a while before animating?
    };
    NotationComponent.prototype.finishRender = function (newNotes) {
        var _this = this;
        console.log();
        // bind link data to $arrow elements
        this.drawArrows(this.links);
        this.$arrows = D3.selectAll('.arrow');
        console.log('$arrows', this.$arrows);
        // bind note data to $frame/$handle elements
        newNotes.forEach(function (note) {
            _this.loadBasket(note);
        });
        this.$boxes = D3.selectAll('.box');
        this.$handles = D3.selectAll('.handle');
        console.log('$boxes', this.$boxes);
        console.log('$handles', this.$handles);
    };
    NotationComponent.prototype.drawArrows = function (links) {
        var $arrows = D3.select('svg').selectAll('.arrow')
            .data(links); // make these paths with arrows
        $arrows.enter().append('polyline')
            .attr('id', function (link) {
            return 'arrow-' + link.source.node.id + '-' + link.target.node.id + '-' + link.type;
        })
            .attr('class', 'arrow')
            .attr('stroke', function (link) {
            return 'none';
        })
            .attr('stroke-width', 2);
        $arrows.exit().remove();
    };
    NotationComponent.prototype.loadBasket = function (note) {
        var _this = this;
        this.$space.select('#box-' + note.node.id)
            .data([note]);
        this.$space.select('#handle-' + note.node.id)
            .data([note])
            .classed('fixed', function (note) { return note.fixed; })
            .on('dblclick', function (note) {
            console.log('handle dblclick', note);
            if (note.fixed == 1 || note.fixed == 3) {
                console.log('unfix note 0', note);
                note.fixed = 0;
                note.node.fixed = false;
                _this.force.start();
                if (!note.extra) {
                    _this.notationService.putNode(note.node, true).subscribe(// update note.node.fixed
                    function (data) { }, function (err) { console.log(err); });
                }
            }
        })
            .call(this.force.drag()
            .on("dragstart", function (note) {
            console.log('handle dragstart', note);
            _this.frontBasket(note.node.id);
            if (note.node.fixed) {
                _this.drag.fixing = false;
            }
            else {
                note.fixed = 1;
                note.node.fixed = true;
                _this.drag.fixing = true;
            }
            _this.drag.x0 = note.x;
            _this.drag.y0 = note.y;
        })
            .on("dragend", function (note) {
            var dx = note.x - _this.drag.x0;
            var dy = note.y - _this.drag.y0;
            if (!note.extra && (_this.drag.fixing || Math.sqrt(dx * dx + dy * dy) >= 1)) {
                _this.notationService.putNode(note.node, true).subscribe(function (data) { }, function (error) { console.error(error); });
            }
        }));
    };
    NotationComponent.prototype.frontBasket = function (id) {
        this.boxZ++;
        document.getElementById('box-' + id).style.zIndex = this.boxZ + '';
        this.handleZ++;
        document.getElementById('handle-' + id).style.zIndex = this.handleZ + '';
    };
    NotationComponent.prototype.go = function ($event) {
        if ($event.force) {
            this.force.start();
        }
        else {
            this.tick = true;
        }
    };
    NotationComponent.prototype.animate = function (timestamp) {
        var _this = this;
        if (this.tick) {
            this.tick = false;
            if (this.$arrows) {
                this.$arrows
                    .attr('marker-mid', function (link) {
                    return _this.getMarker(link);
                })
                    .attr('points', function (link) {
                    return _this.getPoints(link);
                });
            }
            if (this.$boxes) {
                this.$boxes
                    .style('left', function (note) {
                    note.node.x = Math.round(note.x - _this.settings.width / 2); // update node
                    return note.x + 'px'; // cast to string
                })
                    .style('top', function (note) {
                    note.node.y = Math.round(_this.settings.height / 2 - note.y); // update node
                    return note.y + 'px';
                });
            }
            if (this.$handles) {
                this.$handles
                    .style('left', function (note) { return note.x - 9 + 'px'; }) // -9 (offset = handle.width / 2 + 1)
                    .style('top', function (note) { return note.y - 9 + 'px'; });
            }
        }
        if (this.scrollNote) {
            var note = this.scrollNote;
            this.scrollNote = null;
            // TODO animate this
            this.centerView(note.x, note.y);
        }
        window.requestAnimationFrame(function (timestamp) {
            _this.animate(timestamp);
        });
    };
    NotationComponent.prototype.getMarker = function (link) {
        var relation = link.source.relations_by_id[link.target.node.id];
        var mode = relation.getMode(link.type);
        var direction = '';
        if (mode.in || mode.extra_ins.length) {
            if (mode.out || mode.extra_outs.length) {
                direction = '2';
            }
            else {
                direction = '0';
            }
        }
        else if (mode.out || mode.extra_outs.length) {
            direction = '1';
        }
        return 'url(notation#' + link.type + direction + ')';
    };
    NotationComponent.prototype.getPoints = function (link) {
        var relation0 = link.source.relations_by_id[link.target.node.id];
        var relation1 = link.target.relations_by_id[link.source.node.id];
        var mode0 = relation0.getMode(link.type);
        var mode1 = relation1.getMode(link.type);
        var x0 = link.source.x + mode0.x;
        var y0 = link.source.y + mode0.y;
        var x1 = link.target.x + mode1.x;
        var y1 = link.target.y + mode1.y;
        var total_dx = x1 - x0;
        var total_dy = y1 - y0;
        var dr = Math.sqrt(total_dx * total_dx + total_dy * total_dy);
        var spacing = 12;
        var numPoints = Math.floor(dr / spacing);
        var pts = '';
        if (numPoints > 0) {
            var shift = 0;
            if (link.type == 'PRESENT') {
                shift = 0.5;
            }
            else if (link.type == 'EQUATE') {
                shift = 0.5;
            }
            var dx = total_dx / numPoints;
            var dy = total_dy / numPoints;
            for (var i = 0; i < numPoints + 1; i++) {
                pts += (x0 + i * dx + shift * dx) + ',' + (y0 + i * dy + shift * dy) + ' ';
            }
        }
        return pts;
    };
    NotationComponent.prototype.selectNote = function ($event) {
        var _this = this;
        var note = this.notes_by_id[$event.target_id];
        console.assert(note, 'selected note isnt there', note);
        this.frontBasket(note.node.id);
        $event.x = note.node.x;
        $event.y = note.node.y;
        $event.z = note.node.z;
        $event.fixed = note.node.fixed;
        if ($event.frame || $event.current) {
            if ($event.frame) {
                this.notes_by_id[this.settings.frame_id].frame = false;
                note.frame = true;
                this.settings.frame_id = note.node.id;
            }
            if ($event.current) {
                this.notes_by_id[this.settings.current_id].current = false;
                note.current = true;
                this.settings.current_id = note.node.id;
                this.notes.forEach(function (note) {
                    note.freeRelation.target_id = _this.settings.current_id;
                });
            }
            this.notationService.postSelection($event).subscribe(function (note) { }, function (error) { console.error(error); });
        }
        if ($event.scroll) {
            this.scrollNote = note;
        }
        //TODO leave a current trail
        //TODO scroll to new frame
    };
    NotationComponent.prototype.addNote = function ($event) {
        var _this = this;
        console.log('addNote $event', $event);
        var $marker = D3.select('svg').append('circle')
            .attr('r', 5)
            .attr('cx', $event.offsetX)
            .attr('cy', $event.offsetY)
            .attr('fill', 'azure')
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1);
        var params = {
            settings: this.settings,
            notes_by_id: this.notes_by_id,
            x: $event.offsetX,
            y: $event.offsetY,
            secret: ($event.ctrlKey) ? true : false,
            present: ($event.shiftKey) ? true : false,
            equate: ($event.altKey) ? true : false
        };
        this.notationService.postNote(params).subscribe(function (note) {
            $marker.remove();
            _this.notes_by_id[note.node.id] = note;
            _this.notes.push(note);
            note.relations.forEach(function (relation) {
                var target = _this.notes_by_id[relation.target_id];
                if (target) {
                    // add reverse-relation to target note
                    var reverse = relation_1.Relation.reverse(relation);
                    target.addRelation(reverse);
                    console.log('target', target);
                    var links = link_1.Link.getLinks(note, target);
                    console.log('links', links);
                    [].push.apply(_this.links, links);
                }
                else {
                    console.error('posted note has relations with nonexistent note', relation);
                }
            });
            _this.force.start();
            _this.newNote = note; // sets data for AfterViewChecked hook
        }, function (error) { console.error(error); });
    };
    NotationComponent.prototype.removeNote = function ($event) {
        this.notationService.deleteNote($event.note).subscribe(function (note) {
        }, function (error) { console.error(error); });
    };
    NotationComponent.prototype.addRelationship = function ($event) {
        var _this = this;
        this.notationService.postRelationship($event.relationship).subscribe(function (relationship) {
            var noteA = _this.notes_by_id[relationship.start];
            var noteB = _this.notes_by_id[relationship.end];
            console.assert(noteA && noteB, 'adding relationship between invalid notes', relationship, noteA, noteB);
            var add_linkA = noteA.addRelationship(relationship);
            var add_linkB = noteB.addRelationship(relationship);
            console.assert(add_linkA == add_linkB, 'relation pair mismatch', relationship, noteA, noteB);
            if (add_linkA && add_linkB) {
                var link = new link_1.Link(noteA, noteB, relationship.type);
                _this.links.push(link);
                _this.drawArrows(_this.links);
            }
            else {
            }
        }, function (error) { console.error(error); });
    };
    NotationComponent.prototype.removeRelationship = function ($event) {
        var _this = this;
        this.notationService.deleteRelationship($event.relationship).subscribe(function (data) {
            console.log(data);
            if (data.deleted) {
                var relationship = $event.relationship;
                var noteA = _this.notes_by_id[relationship.start];
                var noteB = _this.notes_by_id[relationship.end];
                var remove_linkA = noteA.removeRelationship(relationship);
                var remove_linkB = noteB.removeRelationship(relationship);
                console.assert(remove_linkA == remove_linkB, 'relation pair mismatch', relationship, noteA, noteB);
                if (remove_linkA && remove_linkB) {
                    var source = void 0;
                    var target = void 0;
                    if (noteA.node.id < noteB.node.id) {
                        source = noteA;
                        target = noteB;
                    }
                    else {
                        source = noteB;
                        target = noteA;
                    }
                    for (var i = 0; i < _this.links.length; i++) {
                        if (_this.links[i].source.node.id == source.node.id && _this.links[i].target.node.id == target.node.id) {
                            _this.links.splice(i, 1);
                            return;
                        }
                    }
                    console.error('no link deleted?', [noteA, noteB]);
                }
            }
            else {
                console.log(data.message);
            }
        }, function (error) { console.error(error); });
    };
    NotationComponent = __decorate([
        core_1.Component({
            selector: 'my-notation',
            template: "\n    <div class='space'>\n      <svg>\n        <defs>\n          <marker id='DEFINE0' orient='auto' markerWidth='3' markerHeight='6' refX='0' refY='3'>\n            <polyline points='3,0 0,3 3,6' stroke='steelblue' fill='none'/>\n          </marker>\n          <marker id='DEFINE1' orient='auto' markerWidth='3' markerHeight='6' refX='3' refY='3'>\n            <polyline points='0,0 3,3 0,6' stroke='steelblue' fill='none'/>\n          </marker>\n          <marker id='DEFINE2' orient='auto' markerWidth='6' markerHeight='6' refX='3' refY='3'>\n            <polyline points='6,0 3,3 6,6' stroke='steelblue' fill='none'/>\n            <polyline points='0,0 3,3 0,6' stroke='steelblue' fill='none'/>\n          </marker>\n          <marker id='PRESENT0' orient='auto' markerWidth='6' markerHeight='12' refX='0' refY='6'>\n            <polyline points='6,0 0,6 6,12' stroke='darkturquoise' fill='none'/>\n          </marker>\n          <marker id='PRESENT1' orient='auto' markerWidth='6' markerHeight='12' refX='6' refY='6'>\n            <polyline points='0,0 6,6 0,12' stroke='darkturquoise' fill='none'/>\n          </marker>\n          <marker id='PRESENT2' orient='auto' markerWidth='12' markerHeight='12' refX='6' refY='6'>\n            <polyline points='12,0 6,6 12,12' stroke='darkturquoise' fill='none'/>\n            <polyline points='0,0 6,6 0,12' stroke='darkturquoise' fill='none'/>\n          </marker>\n        </defs>\n      </svg>\n      <div *ngFor='let note of notes' id='handle-{{note.node.id}}' class='handle'\n        [class.fixed]='note.fixed'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'>\n      </div>\n      <div *ngFor='let note of notes' id='box-{{note.node.id}}' class='box'>\n        <my-note [note]='note' [settings]='settings' [notes_by_id]='notes_by_id'\n          (selectNote)='selectNote($event)'\n          (removeNote)='removeNote($event)'\n          (addRelationship)='addRelationship($event)'\n          (removeRelationship)='removeRelationship($event)'\n          (go)='go($event)'>\n        </my-note>\n      </div>\n    </div>\n  ",
            styles: ["\n    .space {\n      display: inline-block;\n      position: relative;\n    }\n    svg {\n      //border: 1px solid lavender;\n    }\n    .box {\n      position: absolute;\n      z-index: 0;\n    }\n    .handle {\n      position: absolute;\n      z-index: 100000;\n      width: 15px;\n      height: 15px;\n      opacity: .95;\n      background-color: lightyellow;\n      border-radius: 4px;\n      border: 1px solid gold;\n      cursor: pointer;\n    }\n    .handle.fixed {\n      background-color: lavender;\n    }\n    .current {\n      color: darkturquoise;\n      border-color: darkturquoise;\n    }\n    .frame {\n      color: steelblue;\n      border-color: steelblue;\n    }\n    .root {\n      color: darkorchid;\n      border-color: darkorchid;\n    }\n  "],
            directives: [
                NoteStreamComponent,
                note_component_1.NoteComponent,
            ]
        }), 
        __metadata('design:paramtypes', [authentication_service_1.AuthenticationService, notation_service_1.NotationService])
    ], NotationComponent);
    return NotationComponent;
}());
exports.NotationComponent = NotationComponent;
//# sourceMappingURL=notation.component.js.map