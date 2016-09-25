import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, DoCheck } from '@angular/core';
import { NgForm } from '@angular/common';
import { RouteParams } from '@angular/router-deprecated';

import { Node } from './models/node';
import { Relationship } from './models/relationship';
import { Relation } from './models/relation';
import { Mode } from './models/mode';
import { Note } from './models/note';
import { NotationService } from './notation.service';

// TODO use ng-pristine, ng-dirty instead of classes?
@Component({
  selector: 'my-relation',
  template: `
    <div id='relation-{{relation.source_id}}-{{relation.target_id}}-{{type}}' class='table-cell'>
      <div class='target' title='target'
        [class.extra]='target.extra'
        [class.root]='target.root' [class.frame]='target.frame' [class.current]='target.current'
        (click)='onTargetClick($event)'
        (dblclick)='onTargetDblclick($event)'>
        <div title='relation'>     
          <span class='define'>
            {{(relation.define.in || relation.define.extra_ins.length) ? 'generic' : ''}} 
            {{(relation.define.out || relation.define.extra_outs.length) ? 'specific' : ''}}
          </span>
          <span class='present'>
            {{(relation.present.in || relation.present.extra_ins.length) ? 'prior' : ''}} 
            {{(relation.present.out || relation.present.extra_outs.length) ? 'posterior' : ''}}
          </span> 
          <span class='equate'>
            {{(relation.equate.in || relation.equate.extra_ins.length) ? 'formula0' : ''}} 
            {{(relation.equate.out || relation.equate.extra_outs.length) ? 'formula1' : ''}} 
          </span>
        </div>
        <div title='selection'>
          <span *ngIf='target.current' class='present bold'>current</span> 
          <span *ngIf='target.frame' class='define bold'>frame</span>  
          <span *ngIf='target.root' class='equate bold'>root</span> 
        </div>
        <div>
          <span class='root-id' title='root id'>{{target.node.degree}}[{{target.node.root_id}}] : </span>
          <span class='id' title='id'>{{target.node.id}}</span>
        </div>
        <div class='name' title='name'>
          '{{target.node.name}}'
        </div>
      </div>
    </div>
    <div class='table-cell'>
      <div *ngIf='type == "DEFINE"'>
        <div class='generic'>
          <div *ngIf='relation.define.in || relation.define.extra_ins.length || (target.current && !source.extra && !target.extra)'
            class='relationship define' title='relation.define.in ? "delete relationship" : "add relationship"'
            [class.disabled]='relation.define.extra_ins'
            [class.defined]='relation.define.in'
            (click)='onRelationshipClick($event, "DEFINE", "in", relation.define.in)'>
            -DEFINE->
          </div>
        </div>
        <div class='specific'>
          <div *ngIf='relation.define.out || relation.define.extra_outs.length || (target.current && !source.extra && !target.extra)'
            class='relationship define'
            [class.diabled]='relation.define.extra_outs'
            [class.defined]='relation.define.out'
            (click)='onRelationshipClick($event, "DEFINE", "out", relation.define.out)'>
            <-DEFINE-
          </div>
        </div>
      </div>
      <div *ngIf='type == "PRESENT"'>
        <div class='prior'>
          <div *ngIf='relation.present.in || relation.present.extra_ins.length || target.current'
            class='relationship present'
            [class.presented]='relation.present.in'
            (click)='onRelationshipClick($event, "PRESENT", "in", relation.present.in)'>
            -PRESENT->
            <br/>
            {{relation.present.extra_ins.length ? '('+relation.present.extra_ins.length+')' : ''}}
          </div>
        </div>
        <div class='posterior'>
          <div *ngIf='relation.present.out || relation.present.extra_outs.length || target.current'
            class='relationship present'
            [class.presented]='relation.present.in'
            (click)='onRelationshipClick($event, "PRESENT", "out", relation.present.out)'>
            <-PRESENT-
            <br/>
            {{relation.present.extra_outs.length ? '('+relation.present.extra_outs.length+')' : ''}}
          </div>
        </div>
      </div>
      <div *ngIf='type == "EQUATE"'>
        <div class='formula0'>
          <div *ngIf='relation.equate.in || relation.equate.extra_ins.length || target.current'
            class='relationship equate'
            [class.equated]='relation.equate.in'
            (click)='onRelationshipClick($event, "MORPH", "in", relation.equate.in)'>
            -MORPH->
            <br/>
            {{relation.equate.extra_ins.length ? '('+relation.equate.extra_ins.length+')' : ''}}
          </div>
        </div>
        <div class='formula1'>
          <div *ngIf='relation.equate.out || relation.equate.extra_outs.length || target.current'
            class='relationship equate'
            [class.equated]='relation.equate.out' 
            (click)='onRelationshipClick($event, "MORPH", "out", relation.equate.out)'>
            <-MORPH-
            <br/>
            {{relation.equate.extra_outs.length ? '('+relation.equate.extra_outs.length+')' : ''}}
          </div>
        </div>
      </div>
    </div>`,
  styles:[`
    .table-cell {
      display: table-cell;
      vertical-align: middle;
      text-align: right;
      //border: 1px solid lavender;
      //margin: 1px;
      white-space: nowrap;
    }
    .target {
      background-color: azure;
      text-align: center;
      border-radius: 4px;
      border: 2px solid lavender; 
      padding: 5px;
      margin: 2px;
    }
    .target:hover {
      cursor: pointer;
    }
    .id {
      font-weight: bold;
    }
    .head {
      font-weight: bold;
    }
    .last {

    }
    .relationship {
      background-color: azure;
      text-align: center;
      border: 2px solid lavender;
      border-radius: 4px;
      margin: 2px;
      white-space: nowrap;
    }
    .relationship:hover {
      left: 2px;
      top: 1px;
      cursor: pointer;
    }
    .relationship.disabled:hover {
      left: 0px;
      top:0px;
      border: 1px;
      cursor:default;
    }
    .bold {
      font-weight: bold;
    }
    .define {
      color: steelblue;
    }
    .present {
      color: darkturquoise;
    }
    .equate {
      color: darkorchid;
    }
    .defined {
      color: azure;
      background-color: steelblue;
    }
    .presented {
      color: azure;
      background-color: darkturquoise;
    }
    .equated {
      color:azure;
      background-color: darkorchid;
    }
    .root {
      color: darkorchid;
      border-color: darkorchid;
    }
    .frame {
      color: steelblue;
      border-color: steelblue;
    }
    .current {
      color: darkturquoise;
      border-color: darkturquoise;
    }
  `],
  //directives: [Autosize]
})
// TODO: merge back with notescomponent?
export class RelationComponent implements OnInit {
  @Input() type: string;
  @Input() relation: Relation;
  @Input() settings: any;
  @Input() notes_by_id: any;
  @Output() selectNote = new EventEmitter();
  @Output() addRelationship = new EventEmitter();
  @Output() removeRelationship = new EventEmitter();
  @Output() go = new EventEmitter();

  source: Note;
  target: Note;
  mode: Mode;

  $relation;

  constructor(
    private routeParams: RouteParams,
    private notationService: NotationService
  ) { }
  ngOnInit() {
    this.source = this.notes_by_id[this.relation.source_id];
    this.target = this.notes_by_id[this.relation.target_id];

    this.mode = this.relation.getMode(this.type);

    this.$relation = <HTMLElement><any>document.getElementById('relation-'+this.relation.source_id+'-'+this.relation.target_id+'-'+this.type);
    console.log(this.$relation);
  }
  // TODO process relations, ordering, etc
  // TODO expand relations (missing nodes)

  onRelationshipClick($event, type, direction, existing) {
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
      let relationship = new Relationship({
        start: (direction == 'out') ? this.relation.source_id : this.relation.target_id,
        end: (direction == 'out') ? this.relation.target_id : this.relation.source_id,
        type: type
      });
      this.addRelationship.emit({
        relationship: relationship
      });
    }
  }
  onTargetClick($event) {
    $event.stopPropagation();

    if (this.mode.x || this.mode.y) {
      this.mode.x = 0;
      this.mode.y = 0;
    }
    else {
      let $target = <HTMLElement><any>this.$relation.getElementsByClassName('target')[0];
      this.mode.x = this.$relation.offsetLeft + $target.offsetLeft + $target.offsetWidth/2;
      this.mode.y = this.$relation.offsetTop + $target.offsetTop + $target.offsetHeight/2;
    }
    this.go.emit({
      force: false
    });
  }
  onTargetDblclick($event) {
    $event.stopPropagation();

    let $target = <HTMLElement><any>this.$relation.getElementsByClassName('target')[0];
    this.mode.x = this.$relation.offsetLeft + $target.offsetLeft + $target.offsetWidth/2;
    this.mode.y = this.$relation.offsetTop + $target.offsetTop + $target.offsetHeight/2;

    this.selectNote.emit({
      source_id: this.relation.source_id,
      target_id: this.relation.target_id,
      frame: false,
      current: true,
      scroll: true
    });
  }
}
