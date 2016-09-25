import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import { NgForm } from '@angular/common';
import { RouteParams } from '@angular/router-deprecated';

import { Node } from './models/node';
import { Relationship } from './models/relationship';
import { Relation } from './models/relation';
import { Note } from './models/note';
import { NotationService } from './notation.service';

import { RelationComponent } from './relation.component';

//import { ResizeSensor } from 'css-element-queries/src';
var ResizeSensor;

// TODO use ng-pristine, ng-dirty instead of classes?
@Component({
  selector: 'my-note',
  template: `
    <div id='note-{{note.node.id}}' class='note'
      [class.root]='(note.node.id == settings.root_id)'
      [class.frame]='(note.node.id == settings.frame_id)'
      [class.current]='(note.node.id == settings.current_id)'>
      <div class='toggle toggle-measurement' title='toggle measurement'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='toggleMeasurement()'>
      </div>
      <div class='toggle toggle-paragraph' title='toggle paragraph'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='toggleParagraph()'>
      </div>
      <div class='toggle toggle-paragraph' title='toggle paragraph'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='toggleParagraph()'>
      </div>
      <div class='toggle toggle-definitions' title='toggle definitions'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='toggleDefinitions()'>
      </div>
      <div class='toggle toggle-presentations' title='toggle presentations'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='togglePresentations()'>
      </div>
      <div class='toggle toggle-equations' title='toggle equations'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        (click)='toggleEquations()'>
      </div>
      <div class='petal petal-signature' title='signature'
        [class.extra]='note.extra'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        [hidden]='(!note.node.showMeasurement && !note.node.showParagraph)'
        (click)='onClick($event)'>
        <div class='row-signature'>
          <div *ngIf='note.node.showMeasurement' class='cell-signature'>
            <div  class='measurement'>
              <div title='created'>{{note.created}}</div>
              <div title='updated'>{{note.updated}}</div>
              <div title='coordinates'>
                ({{note.node.x}}, {{note.node.y}}, {{note.node.z}})
              </div>
              <div class='bold' title='selection'>
                <span *ngIf='note.root' class='root'>root</span>
                <span *ngIf='note.frame' class='frame'>frame</span>
                <span *ngIf='note.current' class='current'>current</span>
              </div>
              <div>
                <span class='root-id' title='root id'>{{note.node.degree}}[{{note.node.root_id}}] : </span>
                <span class='bold' title='id'>{{note.node.id}}</span>
              </div>
              <div class='bold' title='name'>'{{note.node.name}}'</div>
            </div>
          </div>
          <div *ngIf='!note.extra' class='cell-signature' title='controls'>
            <div [hidden]='!note.node.showParagraph'>
              <div>
                <button title='delete' (click)='deleteNote()'>delete</button>
              </div>
              <div *ngIf='textModified'>
                <button title='save' (click)='putNode(false)'>save</button>
                <button title='refresh' (click)='refreshText()'>refresh</button>
              </div>
            </div>
          </div>
        </div>
        <div class='row-signature'>
          <div class='cell-signature text theme'>
            <textarea id='theme-{{note.node.id}}' cols='40' placeholder='theme' title='theme'
              [(ngModel)]='note.node.theme'
              [hidden]='!note.node.showParagraph'
              [disabled]='note.extra'
              (input)='onTextInput($event)'
              (keyup.enter)='onTextEnter($event)'>
            </textarea>
          </div>
          <div class='cell-signature text meta'>
            <textarea id='meta-{{note.node.id}}' cols='40' placeholder='meta' title='meta'
              [(ngModel)]='note.node.meta'
              [hidden]='!note.node.showParagraph'
              [disabled]='note.extra'
              (input)='onTextInput($event)'
              (keyup.enter)='onTextEnter($event)'>
            </textarea>
          </div>
        </div>
      </div>
      <div id='definitions-{{note.node.id}}' class='petal petal-definitions' title='definitions'
        [class.extra]='note.extra'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        [hidden]='!note.node.showDefinitions'
        (click)='onClick($event)'>
        <div class='content definitions-content'>
          <my-relation *ngFor='let definition of note.definitions'
            id='definition-{{definition.source_id}}-{{definition.target_id}}' class='relation definition'
            [relation]='definition' [type]='"DEFINE"' [notes_by_id]='notes_by_id'
            (addRelationship)='addRelationship.emit($event)'
            (removeRelationship)='removeRelationship.emit($event)'
            (selectNote)='selectNote.emit($event)'
            (go)='go.emit($event)'>
          </my-relation>
        </div>
      </div>
      <div id='presentations-{{note.node.id}}' class='petal petal-presentations' title='presentations'
        [class.extra]='note.extra'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        [hidden]='!note.node.showPresentations'
        (click)='onClick($event)'>
        <div class='content'>
          <div>
            PRESENT
          </div>
        </div>
      </div>
      <div id='equations-{{note.node.id}}' class='petal petal-equations' title='equations'
        [class.extra]='note.extra'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'
        [hidden]='!note.node.showEquations' 
        (click)='onClick($event)'>
        <div class='content equations-content'>
          <div>
            EQUATE
          </div>
        </div>
      </div>
    </div>`,
  styles:[`
    .note {
      position: relative;
      overflow: visible;
    }
    .toggle {
      position: absolute;
      display: inline-block;
      z-index: 10;
      height: 16px;
      width: 16px;
      opacity: .7;
      background-color: honeydew;
      border: 1px solid lavender;
      cursor: pointer;
    }
    .toggle-measurement {
      height: 12px;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .toggle-paragraph {
      z-index: 9;
      width: 24px;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .toggle-definitions {
      right: 1px;
      width: 12px;
      border-top-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .toggle-presentations {
      bottom: 1px;
      width: 12px;
      border-top-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .toggle-equations{
      bottom: 1px;
      right: 1px;
      height: 12px;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .petal {
      position: absolute;
      opacity: 0.75;
      background-color: azure;
      padding: 5px;
      border: 2px solid lavender;
      font-size: 12px;
    }
    .petal-signature {
      text-align: left;
      border-top-right-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    .petal-definitions {
      right: 1px;
      border-top-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    .petal-presentations {
      bottom: 1px;
      border-top-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    .petal-equations {
      bottom: 1px;
      right: 1px;
      border-top-right-radius: 8px;
      border-bottom-left-radius: 8px;
    }
    .content {
      overflow: hidden;
      display: inline-block;
      white-space: nowrap;
      background-color: white;
      color: black;
      padding: 5px;
      border: 1px solid lavender;
    }
    .content-signature {
      overflow: hidden;
      white-space: nowrap;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .content-definitions {
      display: table;
      border-top-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .content-presentations {
      text-align: left;
      border-top-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    .content-equations {
      text-align: right;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .root-id {
      font-weight: normal;
    }
    .bold {
      font-weight: bold;
    }
    .row-signature {
      display: table-row;
    }
    .cell-signature {
      display: table-cell;
    }
    .measurement {
      overflow: hidden;
      white-space: nowrap;
      display: inline-block;
    }
    .text {
      vertical-align: top;
      overflow: hidden;
      whites-pace: nowrap;
      border-top-right-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    .relation {
      display: table-row;
    }
    .relation.free {
      border-top: 2px solid lavender;
      margin-top: 2px;
    }
    .extra {
      background-color: lightyellow;
    }
    .current {
      color: darkturquoise;
      border-color: darkturquoise;
    }
    .frame {
      color: steelblue;
      border-color: steelblue;
    }
    .root {
      color: darkorchid;
      border-color: darkorchid;
    }

  `],
  directives: [
    RelationComponent,
  ]
})
// TODO: merge back with notescomponent?
export class NoteComponent implements OnInit, AfterViewInit {
  @Input() note: Note;
  @Input() settings;
  @Input() notes_by_id;
  @Output() selectNote = new EventEmitter();
  @Output() removeNote = new EventEmitter();
  @Output() addRelationship = new EventEmitter();
  @Output() removeRelationship = new EventEmitter();
  @Output() go  = new EventEmitter();

  private textModified = false;
  private pristineName: string;
  private pristineTheme: string;
  private pristineMeta: string;

  private current = false;
  private frame = false;

  private current_id = null;

  private click = 0;
  private enter = 0;

  private $note;

  private $definitions;
  private $presentations;
  private $equations;

  private $theme;
  private $meta;

  constructor(
    private routeParams: RouteParams,
    private notationService: NotationService
  ) { }

  ngOnInit() {
    console.log('note', this.note);

    this.pristineName = this.note.node.name;
    this.pristineTheme = this.note.node.theme;
    this.pristineMeta = this.note.node.meta;
  }
  ngAfterViewInit() {
    this.$definitions = document.getElementById('definitions-'+this.note.node.id);
    this.$presentations = document.getElementById('presentations-'+this.note.node.id);
    this.$equations = document.getElementById('equations-'+this.note.node.id);

    this.$theme = document.getElementById('theme-'+this.note.node.id);
    this.$meta = document.getElementById('meta-'+this.note.node.id);

    this.resizeText();
  }
  ngAfterViewChecked() {
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
  }
  private resizeText() {
    this.resizeTextArea(this.$theme);
    this.resizeTextArea(this.$meta);
  }
  private resizeTextArea($textarea) {
    $textarea.style.height = 'auto'; // TODO check this
    $textarea.style.height = $textarea.scrollHeight+'px';
  }
  private positionDefinitions() { // TODO move this into relations component?
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
  }
  private positionPresentations() {
    //this.$presentations.style.top = -1*this.$presentations.offsetHeight-1+'px';
  }
  private positionEquations() {
    //this.$equations.style.left = -1*this.$equations.offsetWidth-1+'px';
    //this.$equations.style.top = -1*this.$equations.offsetHeight-1+'px';
  }
  toggleMeasurement() {
    console.log('toggleMeasurement');
    this.note.node.showMeasurement = !this.note.node.showMeasurement;
    this.putNode(true);
  }
  toggleParagraph() {
    this.note.node.showParagraph = !this.note.node.showParagraph;
    this.putNode(true);
   }
  toggleDefinitions() {
    this.note.node.showDefinitions = !this.note.node.showDefinitions;
    if (this.note.node.showDefinitions) {
      this.note.positionDefinitions = true;
    }
    this.putNode(true);
  }
  togglePresentations() {
    this.note.node.showPresentations = !this.note.node.showPresentations;
    if (this.note.node.showPresentations) {
      this.note.positionPresentations = true;
    }
    this.putNode(true);
  }
  toggleEquations() {
    this.note.node.showEquations = !this.note.node.showEquations;
    if (this.note.node.showEquations) {
      this.note.positionEquations = true;
    }
    this.putNode(true);
  }
  private putNode(ignoreText: boolean) {
    this.go.emit({
      force: false
    });
    if (!ignoreText) {
      this.pristineTheme = this.note.node.theme;
      this.pristineMeta = this.note.node.meta;
      this.textModified = false;

      let parts = this.note.node.theme.split('\n');
      this.note.node.name = parts[0];
      //this.note.node.last = (parts.length > 1) ? parts[parts.length - 1] : '';*/
    }
    this.notationService.putNode(this.note.node, ignoreText).subscribe(
      (node) => {
        // console.log(node);
      },
      (error) => { console.error(error); });
  }
  onClick($event) {
    console.log('click', $event);
    if (this.click == 0) {
      this.click = 1;

      setTimeout(() => {
        if (this.click == 1) {
          this.click = 0;
          this.selectNote.emit({
            source_id: null,
            target_id: this.note.node.id,
            frame: false,
            current: !this.note.current,
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
  }
  onTextInput($event) {
    this.textModified = true;
    this.resizeText();
  }
  onTextEnter($event) { //saves node on doubleEnter
    if (this.enter == 0) {
      this.enter = 1;
      setTimeout(() => {
        if (this.enter == 1) {
          this.enter = 0;
        }
      }, 200);
    }
    else if (this.enter == 1) {
      this.enter = 0;
      this.putNode(false);
    }
  }
  refreshText() {
    this.note.node.theme = this.pristineTheme;
    this.note.node.meta = this.pristineMeta;
    this.textModified = false;
  }
  deleteNote() { //TODO
    this.removeNote.emit({
      target_id: this.note.node.id,
      d1_recursive: false
    });
  }
}
