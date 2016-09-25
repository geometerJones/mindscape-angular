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
var relationship_1 = require('./models/relationship');
var relation_1 = require('./models/relation');
var notation_service_1 = require('./notation.service');
// TODO use ng-pristine, ng-dirty instead of classes?
var RelationComponent = (function () {
    function RelationComponent(routeParams, notationService) {
        this.routeParams = routeParams;
        this.notationService = notationService;
        this.selectNote = new core_1.EventEmitter();
        this.addRelationship = new core_1.EventEmitter();
        this.removeRelationship = new core_1.EventEmitter();
        this.go = new core_1.EventEmitter();
    }
    RelationComponent.prototype.ngOnInit = function () {
        this.source = this.notes_by_id[this.relation.source_id];
        this.target = this.notes_by_id[this.relation.target_id];
        this.mode = this.relation.getMode(this.type);
        this.$relation = document.getElementById('relation-' + this.relation.source_id + '-' + this.relation.target_id + '-' + this.type);
        console.log(this.$relation);
    };
    // TODO process relations, ordering, etc
    // TODO expand relations (missing nodes)
    RelationComponent.prototype.onRelationshipClick = function ($event, type, direction, existing) {
        // bring relation out or keep it in 
        $event.stopPropagation();
        console.log('relationshipClick', [$event, type, direction, existing]);
        // TODO stop event propagation?
        if (existing) {
            if (confirm('Delete this relationship?')) {
                this.removeRelationship.emit({
                    relationship: existing
                });
            }
        }
        else {
            var relationship = new relationship_1.Relationship({
                start: (direction == 'out') ? this.relation.source_id : this.relation.target_id,
                end: (direction == 'out') ? this.relation.target_id : this.relation.source_id,
                type: type
            });
            this.addRelationship.emit({
                relationship: relationship
            });
        }
    };
    RelationComponent.prototype.onTargetClick = function ($event) {
        $event.stopPropagation();
        if (this.mode.x || this.mode.y) {
            this.mode.x = 0;
            this.mode.y = 0;
        }
        else {
            var $target = this.$relation.getElementsByClassName('target')[0];
            this.mode.x = this.$relation.offsetLeft + $target.offsetLeft + $target.offsetWidth / 2;
            this.mode.y = this.$relation.offsetTop + $target.offsetTop + $target.offsetHeight / 2;
        }
        this.go.emit({
            force: false
        });
    };
    RelationComponent.prototype.onTargetDblclick = function ($event) {
        $event.stopPropagation();
        var $target = this.$relation.getElementsByClassName('target')[0];
        this.mode.x = this.$relation.offsetLeft + $target.offsetLeft + $target.offsetWidth / 2;
        this.mode.y = this.$relation.offsetTop + $target.offsetTop + $target.offsetHeight / 2;
        this.selectNote.emit({
            source_id: this.relation.source_id,
            target_id: this.relation.target_id,
            frame: false,
            current: true,
            scroll: true
        });
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', String)
    ], RelationComponent.prototype, "type", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', relation_1.Relation)
    ], RelationComponent.prototype, "relation", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "settings", void 0);
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "notes_by_id", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "selectNote", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "addRelationship", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "removeRelationship", void 0);
    __decorate([
        core_1.Output(), 
        __metadata('design:type', Object)
    ], RelationComponent.prototype, "go", void 0);
    RelationComponent = __decorate([
        core_1.Component({
            selector: 'my-relation',
            template: "\n    <div id='relation-{{relation.source_id}}-{{relation.target_id}}-{{type}}' class='table-cell'>\n      <div class='target' title='target'\n        [class.extra]='target.extra'\n        [class.root]='target.root' [class.frame]='target.frame' [class.current]='target.current'\n        (click)='onTargetClick($event)'\n        (dblclick)='onTargetDblclick($event)'>\n        <div title='relation'>     \n          <span class='define'>\n            {{(relation.define.in || relation.define.extra_ins.length) ? 'generic' : ''}} \n            {{(relation.define.out || relation.define.extra_outs.length) ? 'specific' : ''}}\n          </span>\n          <span class='present'>\n            {{(relation.present.in || relation.present.extra_ins.length) ? 'prior' : ''}} \n            {{(relation.present.out || relation.present.extra_outs.length) ? 'posterior' : ''}}\n          </span> \n          <span class='equate'>\n            {{(relation.equate.in || relation.equate.extra_ins.length) ? 'formula0' : ''}} \n            {{(relation.equate.out || relation.equate.extra_outs.length) ? 'formula1' : ''}} \n          </span>\n        </div>\n        <div title='selection'>\n          <span *ngIf='target.current' class='present bold'>current</span> \n          <span *ngIf='target.frame' class='define bold'>frame</span>  \n          <span *ngIf='target.root' class='equate bold'>root</span> \n        </div>\n        <div>\n          <span class='root-id' title='root id'>{{target.node.degree}}[{{target.node.root_id}}] : </span>\n          <span class='id' title='id'>{{target.node.id}}</span>\n        </div>\n        <div class='name' title='name'>\n          '{{target.node.name}}'\n        </div>\n      </div>\n    </div>\n    <div class='table-cell'>\n      <div *ngIf='type == \"DEFINE\"'>\n        <div class='generic'>\n          <div *ngIf='relation.define.in || relation.define.extra_ins.length || (target.current && !source.extra && !target.extra)'\n            class='relationship define' title='relation.define.in ? \"delete relationship\" : \"add relationship\"'\n            [class.disabled]='relation.define.extra_ins'\n            [class.defined]='relation.define.in'\n            (click)='onRelationshipClick($event, \"DEFINE\", \"in\", relation.define.in)'>\n            -DEFINE->\n          </div>\n        </div>\n        <div class='specific'>\n          <div *ngIf='relation.define.out || relation.define.extra_outs.length || (target.current && !source.extra && !target.extra)'\n            class='relationship define'\n            [class.diabled]='relation.define.extra_outs'\n            [class.defined]='relation.define.out'\n            (click)='onRelationshipClick($event, \"DEFINE\", \"out\", relation.define.out)'>\n            <-DEFINE-\n          </div>\n        </div>\n      </div>\n      <div *ngIf='type == \"PRESENT\"'>\n        <div class='prior'>\n          <div *ngIf='relation.present.in || relation.present.extra_ins.length || target.current'\n            class='relationship present'\n            [class.presented]='relation.present.in'\n            (click)='onRelationshipClick($event, \"PRESENT\", \"in\", relation.present.in)'>\n            -PRESENT->\n            <br/>\n            {{relation.present.extra_ins.length ? '('+relation.present.extra_ins.length+')' : ''}}\n          </div>\n        </div>\n        <div class='posterior'>\n          <div *ngIf='relation.present.out || relation.present.extra_outs.length || target.current'\n            class='relationship present'\n            [class.presented]='relation.present.in'\n            (click)='onRelationshipClick($event, \"PRESENT\", \"out\", relation.present.out)'>\n            <-PRESENT-\n            <br/>\n            {{relation.present.extra_outs.length ? '('+relation.present.extra_outs.length+')' : ''}}\n          </div>\n        </div>\n      </div>\n      <div *ngIf='type == \"EQUATE\"'>\n        <div class='formula0'>\n          <div *ngIf='relation.equate.in || relation.equate.extra_ins.length || target.current'\n            class='relationship equate'\n            [class.equated]='relation.equate.in'\n            (click)='onRelationshipClick($event, \"MORPH\", \"in\", relation.equate.in)'>\n            -MORPH->\n            <br/>\n            {{relation.equate.extra_ins.length ? '('+relation.equate.extra_ins.length+')' : ''}}\n          </div>\n        </div>\n        <div class='formula1'>\n          <div *ngIf='relation.equate.out || relation.equate.extra_outs.length || target.current'\n            class='relationship equate'\n            [class.equated]='relation.equate.out' \n            (click)='onRelationshipClick($event, \"MORPH\", \"out\", relation.equate.out)'>\n            <-MORPH-\n            <br/>\n            {{relation.equate.extra_outs.length ? '('+relation.equate.extra_outs.length+')' : ''}}\n          </div>\n        </div>\n      </div>\n    </div>",
            styles: ["\n    .table-cell {\n      display: table-cell;\n      vertical-align: middle;\n      text-align: right;\n      //border: 1px solid lavender;\n      //margin: 1px;\n      white-space: nowrap;\n    }\n    .target {\n      background-color: azure;\n      text-align: center;\n      border-radius: 4px;\n      border: 2px solid lavender; \n      padding: 5px;\n      margin: 2px;\n    }\n    .target:hover {\n      cursor: pointer;\n    }\n    .id {\n      font-weight: bold;\n    }\n    .head {\n      font-weight: bold;\n    }\n    .last {\n\n    }\n    .relationship {\n      background-color: azure;\n      text-align: center;\n      border: 2px solid lavender;\n      border-radius: 4px;\n      margin: 2px;\n      white-space: nowrap;\n    }\n    .relationship:hover {\n      left: 2px;\n      top: 1px;\n      cursor: pointer;\n    }\n    .relationship.disabled:hover {\n      left: 0px;\n      top:0px;\n      border: 1px;\n      cursor:default;\n    }\n    .bold {\n      font-weight: bold;\n    }\n    .define {\n      color: steelblue;\n    }\n    .present {\n      color: darkturquoise;\n    }\n    .equate {\n      color: darkorchid;\n    }\n    .defined {\n      color: azure;\n      background-color: steelblue;\n    }\n    .presented {\n      color: azure;\n      background-color: darkturquoise;\n    }\n    .equated {\n      color:azure;\n      background-color: darkorchid;\n    }\n    .root {\n      color: darkorchid;\n      border-color: darkorchid;\n    }\n    .frame {\n      color: steelblue;\n      border-color: steelblue;\n    }\n    .current {\n      color: darkturquoise;\n      border-color: darkturquoise;\n    }\n  "],
        }), 
        __metadata('design:paramtypes', [(typeof (_a = typeof router_deprecated_1.RouteParams !== 'undefined' && router_deprecated_1.RouteParams) === 'function' && _a) || Object, notation_service_1.NotationService])
    ], RelationComponent);
    return RelationComponent;
    var _a;
}());
exports.RelationComponent = RelationComponent;
//# sourceMappingURL=relation.component.js.map