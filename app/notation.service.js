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
var http_1 = require('@angular/http');
var rxjs_1 = require('rxjs');
var node_1 = require('./models/node');
var relationship_1 = require('./models/relationship');
var note_1 = require('./models/note');
var link_1 = require('./models/link');
var authentication_service_1 = require('./authentication.service');
var NotationService = (function () {
    function NotationService(http, authenticationService) {
        this.http = http;
        this.authenticationService = authenticationService;
        this.notationUrl = 'api/notation'; // used to get notes
        this.selectionUrl = 'api/selection';
        this.noteUrl = '/api/note'; // used to post/put/delete note
        this.nodeUrl = '/api/node';
        this.relationUrl = '/api/relation';
        this.relationshipUrl = '/api/relationship';
    }
    NotationService.prototype.getNotation = function () {
        // uses token in headers to
        // return {notation_id: number, notes: note[]} notation object
        var headers = this.headers();
        return this.http.get(this.notationUrl, { headers: headers })
            .map(function (res) {
            var notation = res.json();
            console.log('notation0', notation);
            if (!(notation && notation.notes && notation.settings &&
                notation.settings.root_id && notation.settings.frame_id && notation.settings.current_id &&
                notation.settings.width && notation.settings.height)) {
                console.error('notation invalid', notation);
            }
            notation.notes_by_id = {};
            notation.links = [];
            notation.notes.forEach(function (note_data, i, notes) {
                var note = new note_1.Note(note_data, notation.settings);
                notation.notes_by_id[note.node.id] = note;
                notes[i] = note;
                note.relations.forEach(function (relation) {
                    var target = notation.notes_by_id[relation.target_id];
                    if (target) {
                        // both source and target notes are loaded
                        // every pair of loaded notes will have one link for each type of relationship they share
                        // relationships in a relation are grouped by type into 'modes'
                        var links = link_1.Link.getLinks(note, target);
                        [].push.apply(notation.links, links);
                    }
                });
            });
            console.log('notation', notation);
            return notation;
        })
            .catch(this.handleError);
    };
    NotationService.prototype.postSelection = function (params) {
        var headers = this.headers();
        var body = JSON.stringify({
            target_id: params.target_id,
            frame: params.frame,
            current: params.current,
            x: params.x,
            y: params.y,
            z: params.z
        });
        return this.http.post(this.selectionUrl, body, { headers: headers })
            .map(function (res) {
            console.log('select note', res.json());
            return res.json();
        })
            .catch(this.handleError);
    };
    NotationService.prototype.postNote = function (params) {
        var headers = this.headers();
        var body = JSON.stringify({
            secret: params.secret,
            x: params.x - params.settings.width / 2,
            y: params.settings.height / 2 - params.y,
            z: 0,
            fixed: false,
            showMeasurement: true,
            showParagraph: true,
            showDefinitions: false,
            showPresentations: false,
            showEquations: false,
            present: params.present,
            equate: params.equate
        });
        return this.http.post(this.noteUrl, body, { headers: headers })
            .map(function (res) {
            var note_data = res.json();
            console.log('post note', note_data);
            var note = new note_1.Note(note_data, params.settings);
            return note;
        })
            .catch(this.handleError);
    };
    NotationService.prototype.deleteNote = function (note) {
        var url = this.noteUrl + "/" + note.node.id;
        var headers = this.headers();
        return this.http.delete(url, headers)
            .map(function (res) {
            console.log('delete note', res.json());
            return res.json();
        })
            .catch(this.handleError);
    };
    NotationService.prototype.putNode = function (node, ignoreText) {
        var url = this.nodeUrl + "/" + node.id;
        var headers = this.headers();
        var body;
        if (ignoreText) {
            var clone = new node_1.Node(node);
            clone.name = null;
            clone.theme = null;
            clone.meta = null;
            body = JSON.stringify(clone);
        }
        else {
            body = JSON.stringify(node);
        }
        return this.http.put(url, body, { headers: headers })
            .map(function (res) {
            console.log('put node', res.json());
            return res.json();
        })
            .catch(this.handleError);
    };
    NotationService.prototype.postRelationship = function (relationship) {
        var body = JSON.stringify(relationship);
        var headers = this.headers();
        return this.http.post(this.relationshipUrl, body, { headers: headers })
            .map(function (res) {
            var relationship = new relationship_1.Relationship(res.json());
            console.log(relationship);
            return relationship;
        })
            .catch(this.handleError);
    };
    NotationService.prototype.deleteRelationship = function (relationship) {
        var url = this.relationshipUrl + "/" + relationship.id;
        var headers = this.headers();
        return this.http.delete(url, { headers: headers })
            .map(function (res) {
            var result = res.json();
            console.log(result);
            return result;
        })
            .catch(this.handleError);
    };
    NotationService.prototype.clone = function (obj) {
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj)
            return obj;
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.clone(obj[i]);
            }
            return copy;
        }
        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = this.clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    };
    NotationService.prototype.handleError = function (error) {
        var errMsg = (error.json() && error.json().message) ? error.json().message :
            error.status ? error.status + " - " + error.statusText : 'Server error';
        console.error(errMsg);
        return rxjs_1.Observable.throw(errMsg);
    };
    NotationService.prototype.headers = function () {
        var headers = new http_1.Headers({
            'Content-Type': 'application/json',
            'token': this.authenticationService.getToken()
        });
        return headers;
    };
    NotationService = __decorate([
        core_1.Injectable(), 
        __metadata('design:paramtypes', [http_1.Http, authentication_service_1.AuthenticationService])
    ], NotationService);
    return NotationService;
}());
exports.NotationService = NotationService;
//# sourceMappingURL=notation.service.js.map