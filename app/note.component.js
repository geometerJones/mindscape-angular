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
var router_deprecated_1 = require('@angular/router-deprecated');
var note_1 = require('./models/note');
var notation_service_1 = require('./notation.service');
var relation_component_1 = require('./relation.component');
//import { ResizeSensor } from 'css-element-queries/src';
var ResizeSensor;
// TODO use ng-pristine, ng-dirty instead of classes?
var NoteComponent = (function () {
    function NoteComponent(routeParams, notationService) {
        this.routeParams = routeParams;
        this.notationService = notationService;
        this.selectNote = new core_1.EventEmitter();
        this.removeNote = new core_1.EventEmitter();
        this.addRelationship = new core_1.EventEmitter();
        this.removeRelationship = new core_1.EventEmitter();
        this.go = new core_1.EventEmitter();
        this.textModified = false;
        this.current = false;
        this.frame = false;
        this.current_id = null;
        this.click = 0;
        this.enter = 0;
    }
    NoteComponent.prototype.ngOnInit = function () {
        console.log('note', this.note);
        this.pristineName = this.note.node.name;
        this.pristineTheme = this.note.node.theme;
        this.pristineMeta = this.note.node.meta;
    };
    NoteComponent.prototype.ngAfterViewInit = function () {
        this.$definitions = document.getElementById('definitions-' + this.note.node.id);
        this.$presentations = document.getElementById('presentations-' + this.note.node.id);
        this.$equations = document.getElementById('equations-' + this.note.node.id);
        this.$theme = document.getElementById('theme-' + this.note.node.id);
        this.$meta = document.getElementById('meta-' + this.note.node.id);
        this.resizeText();
    };
    NoteComponent.prototype.ngAfterViewChecked = function () {
        // calculate relation coordinates
        if (this.note.positionDefinitions) {
            this.note.positionDefinitions = false;
            this.positionDefinitions();
        }
        if (this.note.positionPresentations) {
            this.note.positionPresentations = false;
            this.positionPresentations();
        }
        if (this.note.positionEquations) {
            this.note.positionEquations = false;
            this.positionEquations();
        }
    };
    NoteComponent.prototype.resizeText = function () {
        this.resizeTextArea(this.$theme);
        this.resizeTextArea(this.$meta);
    };
    NoteComponent.prototype.resizeTextArea = function ($textarea) {
        $textarea.style.height = 'auto'; // TODO check this
        $textarea.style.height = $textarea.scrollHeight + 'px';
    };
    NoteComponent.prototype.positionDefinitions = function () {
        console.log('positionDefinitions');
        // TODO remove this type-casting hack
        /*
        this.note.definitions.forEach((relation, i , definitions) => {
          let $definition = <HTMLElement><any>document.getElementById('definition-'+relation.source_id+'-'+relation.target_id);
          let $target = <HTMLElement><any>$definition.getElementsByClassName('target')[0];
          relation.define.x = this.$definitions.offsetLeft + $target.offsetLeft + $target.offsetWidth/2;
          relation.define.y = this.$definitions.offsetTop + $target.offsetTop + $target.offsetHeight/2;
        });
        this.go.emit({
          force: false
        });*/
    };
    NoteComponent.prototype.positionPresentations = function () {
        //this.$presentations.style.top = -1*this.$presentations.offsetHeight-1+'px';
    };
    NoteComponent.prototype.positionEquations = function () {
        //this.$equations.style.left = -1*this.$equations.offsetWidth-1+'px';
        //this.$equations.style.top = -1*this.$equations.offsetHeight-1+'px';
    };
    NoteComponent.prototype.toggleMeasurement = function () {
        console.log('toggleMeasurement');
        this.note.node.showMeasurement = !this.note.node.showMeasurement;
        this.putNode(true);
    };
    NoteComponent.prototype.toggleParagraph = function () {
        this.note.node.showParagraph = !this.note.node.showParagraph;
        this.putNode(true);
    };
    NoteComponent.prototype.toggleDefinitions = function () {
        this.note.node.showDefinitions = !this.note.node.showDefinitions;
        if (this.note.node.showDefinitions) {
            this.note.positionDefinitions = true;
        }
        this.putNode(true);
    };
    NoteComponent.prototype.togglePresentations = function () {
        this.note.node.showPresentations = !this.note.node.showPresentations;
        if (this.note.node.showPresentations) {
            this.note.positionPresentations = true;
        }
        this.putNode(true);
    };
    NoteComponent.prototype.toggleEquations = function () {
        this.note.node.showEquations = !this.note.node.showEquations;
        if (this.note.node.showEquations) {
            this.note.positionEquations = true;
        }
        this.putNode(true);
    };
    NoteComponent.prototype.putNode = function (ignoreText) {
        this.go.emit({
            force: false
        });
        if (!ignoreText) {
            this.pristineTheme = this.note.node.theme;
            this.pristineMeta = this.note.node.meta;
            this.textModified = false;
            var parts = this.note.node.theme.split('\n');
            this.note.node.name = parts[0];
        }
        this.notationService.putNode(this.note.node, ignoreText).subscribe(function (node) {
            // console.log(node);
        }, function (error) { console.error(error); });
    };
    NoteComponent.prototype.onClick = function ($event) {
        var _this = this;
        console.log('click', $event);
        if (this.click == 0) {
            this.click = 1;
            setTimeout(function () {
                if (_this.click == 1) {
                    _this.click = 0;
                    _this.selectNote.emit({
                        source_id: null,
                        target_id: _this.note.node.id,
                        frame: false,
                        current: !_this.note.current,
                        scroll: false
                    });
                }
            }, 200);
        }
        else if (this.click == 1) {
            this.click = 0;
            this.selectNote.emit({
                source_id: null,
                target_id: this.note.node.id,
                frame: !this.note.frame && !this.note.extra,
                current: !this.note.current,
                scroll: false
            });
        }
    };
    NoteComponent.prototype.onTextInput = function ($event) {
        this.textModified = true;
        this.resizeText();
    };
    NoteComponent.prototype.onTextEnter = function ($event) {
        var _this = this;
        if (this.enter == 0) {
            this.enter = 1;
            setTimeout(function () {
                if (_this.enter == 1) {
                    _this.enter = 0;
                }
            }, 200);
        }
        else if (this.enter == 1) {
            this.enter = 0;
            this.putNode(false);
        }
    };
    NoteComponent.prototype.refreshText = function () {
        this.note.node.theme = this.pristineTheme;
        this.note.node.meta = this.pristineMeta;
        this.textModified = false;
    };
    NoteComponent.prototype.deleteNote = function () {
        this.removeNote.emit({
            target_id: this.note.node.id,
            d1_recursive: false
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', note_1.Note)
    ], NoteComponent.prototype, "note", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "settings", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "notes_by_id", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "selectNote", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "removeNote", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "addRelationship", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "removeRelationship", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], NoteComponent.prototype, "go", void 0);
    NoteComponent = __decorate([
        core_1.Component({
            selector: 'my-note',
            template: "\n    <div id='note-{{note.node.id}}' class='note'\n      [class.root]='(note.node.id == settings.root_id)'\n      [class.frame]='(note.node.id == settings.frame_id)'\n      [class.current]='(note.node.id == settings.current_id)'>\n      <div class='toggle toggle-measurement' title='toggle measurement'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='toggleMeasurement()'>\n      </div>\n      <div class='toggle toggle-paragraph' title='toggle paragraph'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='toggleParagraph()'>\n      </div>\n      <div class='toggle toggle-paragraph' title='toggle paragraph'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='toggleParagraph()'>\n      </div>\n      <div class='toggle toggle-definitions' title='toggle definitions'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='toggleDefinitions()'>\n      </div>\n      <div class='toggle toggle-presentations' title='toggle presentations'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='togglePresentations()'>\n      </div>\n      <div class='toggle toggle-equations' title='toggle equations'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        (click)='toggleEquations()'>\n      </div>\n      <div class='petal petal-signature' title='signature'\n        [class.extra]='note.extra'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        [hidden]='(!note.node.showMeasurement && !note.node.showParagraph)'\n        (click)='onClick($event)'>\n        <div class='row-signature'>\n          <div *ngIf='note.node.showMeasurement' class='cell-signature'>\n            <div  class='measurement'>\n              <div title='created'>{{note.created}}</div>\n              <div title='updated'>{{note.updated}}</div>\n              <div title='coordinates'>\n                ({{note.node.x}}, {{note.node.y}}, {{note.node.z}})\n              </div>\n              <div class='bold' title='selection'>\n                <span *ngIf='note.root' class='root'>root</span>\n                <span *ngIf='note.frame' class='frame'>frame</span>\n                <span *ngIf='note.current' class='current'>current</span>\n              </div>\n              <div>\n                <span class='root-id' title='root id'>{{note.node.degree}}[{{note.node.root_id}}] : </span>\n                <span class='bold' title='id'>{{note.node.id}}</span>\n              </div>\n              <div class='bold' title='name'>'{{note.node.name}}'</div>\n            </div>\n          </div>\n          <div *ngIf='!note.extra' class='cell-signature' title='controls'>\n            <div [hidden]='!note.node.showParagraph'>\n              <div>\n                <button title='delete' (click)='deleteNote()'>delete</button>\n              </div>\n              <div *ngIf='textModified'>\n                <button title='save' (click)='putNode(false)'>save</button>\n                <button title='refresh' (click)='refreshText()'>refresh</button>\n              </div>\n            </div>\n          </div>\n        </div>\n        <div class='row-signature'>\n          <div class='cell-signature text theme'>\n            <textarea id='theme-{{note.node.id}}' cols='40' placeholder='theme' title='theme'\n              [(ngModel)]='note.node.theme'\n              [hidden]='!note.node.showParagraph'\n              [disabled]='note.extra'\n              (input)='onTextInput($event)'\n              (keyup.enter)='onTextEnter($event)'>\n            </textarea>\n          </div>\n          <div class='cell-signature text meta'>\n            <textarea id='meta-{{note.node.id}}' cols='40' placeholder='meta' title='meta'\n              [(ngModel)]='note.node.meta'\n              [hidden]='!note.node.showParagraph'\n              [disabled]='note.extra'\n              (input)='onTextInput($event)'\n              (keyup.enter)='onTextEnter($event)'>\n            </textarea>\n          </div>\n        </div>\n      </div>\n      <div id='definitions-{{note.node.id}}' class='petal petal-definitions' title='definitions'\n        [class.extra]='note.extra'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        [hidden]='!note.node.showDefinitions'\n        (click)='onClick($event)'>\n        <div class='content definitions-content'>\n          <my-relation *ngFor='let definition of note.definitions'\n            id='definition-{{definition.source_id}}-{{definition.target_id}}' class='relation definition'\n            [relation]='definition' [type]='\"DEFINE\"' [notes_by_id]='notes_by_id'\n            (addRelationship)='addRelationship.emit($event)'\n            (removeRelationship)='removeRelationship.emit($event)'\n            (selectNote)='selectNote.emit($event)'\n            (go)='go.emit($event)'>\n          </my-relation>\n        </div>\n      </div>\n      <div id='presentations-{{note.node.id}}' class='petal petal-presentations' title='presentations'\n        [class.extra]='note.extra'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        [hidden]='!note.node.showPresentations'\n        (click)='onClick($event)'>\n        <div class='content'>\n          <div>\n            PRESENT\n          </div>\n        </div>\n      </div>\n      <div id='equations-{{note.node.id}}' class='petal petal-equations' title='equations'\n        [class.extra]='note.extra'\n        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'\n        [hidden]='!note.node.showEquations' \n        (click)='onClick($event)'>\n        <div class='content equations-content'>\n          <div>\n            EQUATE\n          </div>\n        </div>\n      </div>\n    </div>",
            styles: ["\n    .note {\n      position: relative;\n      overflow: visible;\n    }\n    .toggle {\n      position: absolute;\n      display: inline-block;\n      z-index: 10;\n      height: 16px;\n      width: 16px;\n      opacity: .7;\n      background-color: honeydew;\n      border: 1px solid lavender;\n      cursor: pointer;\n    }\n    .toggle-measurement {\n      height: 12px;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .toggle-paragraph {\n      z-index: 9;\n      width: 24px;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .toggle-definitions {\n      right: 1px;\n      width: 12px;\n      border-top-left-radius: 4px;\n      border-bottom-right-radius: 4px;\n    }\n    .toggle-presentations {\n      bottom: 1px;\n      width: 12px;\n      border-top-left-radius: 4px;\n      border-bottom-right-radius: 4px;\n    }\n    .toggle-equations{\n      bottom: 1px;\n      right: 1px;\n      height: 12px;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .petal {\n      position: absolute;\n      opacity: 0.75;\n      background-color: azure;\n      padding: 5px;\n      border: 2px solid lavender;\n      font-size: 12px;\n    }\n    .petal-signature {\n      text-align: left;\n      border-top-right-radius: 8px;\n      border-bottom-left-radius: 8px;\n    }\n    .petal-definitions {\n      right: 1px;\n      border-top-left-radius: 8px;\n      border-bottom-right-radius: 8px;\n    }\n    .petal-presentations {\n      bottom: 1px;\n      border-top-left-radius: 8px;\n      border-bottom-right-radius: 8px;\n    }\n    .petal-equations {\n      bottom: 1px;\n      right: 1px;\n      border-top-right-radius: 8px;\n      border-bottom-left-radius: 8px;\n    }\n    .content {\n      overflow: hidden;\n      display: inline-block;\n      white-space: nowrap;\n      background-color: white;\n      color: black;\n      padding: 5px;\n      border: 1px solid lavender;\n    }\n    .content-signature {\n      overflow: hidden;\n      white-space: nowrap;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .content-definitions {\n      display: table;\n      border-top-left-radius: 4px;\n      border-bottom-right-radius: 4px;\n    }\n    .content-presentations {\n      text-align: left;\n      border-top-left-radius: 4px;\n      border-bottom-right-radius: 4px;\n    }\n    .content-equations {\n      text-align: right;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .root-id {\n      font-weight: normal;\n    }\n    .bold {\n      font-weight: bold;\n    }\n    .row-signature {\n      display: table-row;\n    }\n    .cell-signature {\n      display: table-cell;\n    }\n    .measurement {\n      overflow: hidden;\n      white-space: nowrap;\n      display: inline-block;\n    }\n    .text {\n      vertical-align: top;\n      overflow: hidden;\n      whites-pace: nowrap;\n      border-top-right-radius: 4px;\n      border-bottom-left-radius: 4px;\n    }\n    .relation {\n      display: table-row;\n    }\n    .relation.free {\n      border-top: 2px solid lavender;\n      margin-top: 2px;\n    }\n    .extra {\n      background-color: lightyellow;\n    }\n    .current {\n      color: darkturquoise;\n      border-color: darkturquoise;\n    }\n    .frame {\n      color: steelblue;\n      border-color: steelblue;\n    }\n    .root {\n      color: darkorchid;\n      border-color: darkorchid;\n    }\n\n  "],
            directives: [
                relation_component_1.RelationComponent,
            ]
        }), 
        __metadata('design:paramtypes', [(typeof (_a = typeof router_deprecated_1.RouteParams !== 'undefined' && router_deprecated_1.RouteParams) === 'function' && _a) || Object, notation_service_1.NotationService])
    ], NoteComponent);
    return NoteComponent;
    var _a;
}());
exports.NoteComponent = NoteComponent;
//# sourceMappingURL=note.component.js.map