import { Component, Input, OnInit, AfterViewChecked} from '@angular/core';

import * as D3 from 'd3/index';
import { Observable } from 'rxjs/Observable';

import { Link } from './models/link';
import { Note } from './models/note';
import { Node } from './models/node';
import { Relation } from './models/relation';
import { Relationship } from './models/relationship';

import { AuthenticationService } from './authentication.service';
import { NotationService } from './notation.service';

import { NoteComponent } from './note.component';

// <line *ngFor="let link of links" class='link'></line>
@Component({
  selector: 'my-notation',
  template: `
    <div class='space'>
      <svg>
        <defs>
          <marker id='DEFINE0' orient='auto' markerWidth='3' markerHeight='6' refX='0' refY='3'>
            <polyline points='3,0 0,3 3,6' stroke='steelblue' fill='none'/>
          </marker>
          <marker id='DEFINE1' orient='auto' markerWidth='3' markerHeight='6' refX='3' refY='3'>
            <polyline points='0,0 3,3 0,6' stroke='steelblue' fill='none'/>
          </marker>
          <marker id='DEFINE2' orient='auto' markerWidth='6' markerHeight='6' refX='3' refY='3'>
            <polyline points='6,0 3,3 6,6' stroke='steelblue' fill='none'/>
            <polyline points='0,0 3,3 0,6' stroke='steelblue' fill='none'/>
          </marker>
          <marker id='PRESENT0' orient='auto' markerWidth='6' markerHeight='12' refX='0' refY='6'>
            <polyline points='6,0 0,6 6,12' stroke='darkturquoise' fill='none'/>
          </marker>
          <marker id='PRESENT1' orient='auto' markerWidth='6' markerHeight='12' refX='6' refY='6'>
            <polyline points='0,0 6,6 0,12' stroke='darkturquoise' fill='none'/>
          </marker>
          <marker id='PRESENT2' orient='auto' markerWidth='12' markerHeight='12' refX='6' refY='6'>
            <polyline points='12,0 6,6 12,12' stroke='darkturquoise' fill='none'/>
            <polyline points='0,0 6,6 0,12' stroke='darkturquoise' fill='none'/>
          </marker>
        </defs>
      </svg>
      <div *ngFor='let note of notes' id='handle-{{note.node.id}}' class='handle'
        [class.fixed]='note.fixed'
        [class.root]='note.root' [class.frame]='note.frame' [class.current]='note.current'>
      </div>
      <div *ngFor='let note of notes' id='box-{{note.node.id}}' class='box'>
        <my-note [note]='note' [settings]='settings' [notes_by_id]='notes_by_id'
          (selectNote)='selectNote($event)'
          (removeNote)='removeNote($event)'
          (addRelationship)='addRelationship($event)'
          (removeRelationship)='removeRelationship($event)'
          (go)='go($event)'>
        </my-note>
      </div>
    </div>
  `,
  styles:[`
    .space {
      display: inline-block;
      position: relative;
    }
    svg {
      //border: 1px solid lavender;
    }
    .box {
      position: absolute;
      z-index: 0;
    }
    .handle {
      position: absolute;
      z-index: 100000;
      width: 15px;
      height: 15px;
      opacity: .95;
      background-color: lightyellow;
      border-radius: 4px;
      border: 1px solid gold;
      cursor: pointer;
    }
    .handle.fixed {
      background-color: lavender;
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
    NoteStreamComponent,
    NoteComponent,
  ]
})
export class NotationComponent implements OnInit, AfterViewChecked {
  // default world (space) settings
  mouse = {
    x: 0,
    y: 0,
    node_x: 0,
    node_y: 0
  };
  $space;
  $svg;

  // a Notation M consists of
  // N: a set of nodes
  // D: a set of directed relations between nodes in N that represent abstraction (vs definition)
  // P: a set of directed relations between notes in N that represent a temporal/presentational flow

  // each note comprises a node and the relations involving that node
  notes: Note[] = [];
  notes_by_id: any = {};
  // these are the nodes extracted from this.notes
  //nodes: Node[] = [];

  $boxes = null; // holds note.components
  $handles = null; // handles dragging, pinning of note
  handleZ = 100000; // eventually a frame click will cover an untouched handle...
  boxZ = 0;

  // these are the relations extracted form this.notes
  links: Link[] = [];

  $arrows = null; // visualizes relations between nodes

  settings;

  drag = {
    fixing: false,
    x0: 0,
    y0: 0
  };

  newNote;
  deletedNote;

  // D3.layout.force params
  force;
  tick = false;

  counter = 0;

  scrollNote = null;

  constructor(
    private authenticationService: AuthenticationService,
    private notationService: NotationService
  ) { }

  ngOnInit() {
    this.getNotation();
  }
  getNotation() {
    this.notationService.getNotation().subscribe(
      (notation) => {
        this.settings = notation.settings;
        this.notes = notation.notes;
        this.notes_by_id = notation.notes_by_id;
        this.links = notation.links;

        this.spaceOut();
        this.initForce();
      },
      (error) => { console.error(error); });
  }
  spaceOut() {
    // resize space
    this.$space = D3.select('.space')
      .style('width', this.settings.width)
      .style('height', this.settings.height)
      .on('mousemove', () => { // track mouse position
        this.mouse.x = D3.event.offsetX;
        this.mouse.y = D3.event.offsetY;
        this.mouse.node_x = this.mouse.x - this.settings.width / 2;
        this.mouse.node_y = this.settings.height / 2 - this.mouse.y;
      });
    this.$svg = this.$space.select('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height)
      .on('dblclick', () => {
        this.addNote(D3.event);
      });
    // center view (on space origin)
    this.centerView(this.settings.width / 2, this.settings.height / 2);
    // draw axes/coordinates
    this.drawOrthogonals();
  } 
  centerView(x, y) {
    let viewX = x - window.innerWidth / 2;
    let viewY = y - window.innerHeight / 2 + 50; // offset for header
    window.scroll(viewX, viewY); //TODO make this a smooth transition
  }
  drawOrthogonals() {
    let interval = 200;
    let radius = Math.min(this.settings.width, this.settings.height) / 2;

    for (let i = 0; i < radius; i += interval) {
      [-1, 1].forEach((direction) => {
        let y = this.settings.height / 2 + direction*i;
        this.$svg.append('line') // horizontals
          .attr('class', 'axis')
          .attr('x1', 0)
          .attr('y1', y)
          .attr('x2', this.settings.width)
          .attr('y2', y)
          .attr('stroke', (d) => { 
            if (i == 0) { return 'dimgrey'; }
            return 'lavender';
          })
          .attr('stroke-width', (d) => {
            if (i == 0) { return 1; }
            return 1; 
          });
        let x = this.settings.width / 2 + direction*i
        this.$svg.append('line') // verticals
          .attr('class', 'axis')
          .attr('x1', x)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', this.settings.height)
          .attr('stroke', (d) => {
            if (i == 0) { return 'dimgrey'; }
            return 'lavender';
          })
          .attr('stroke-width', (d) => {
            if (i == 0) { return 1; }
            return 1; 
          });
      });
    }
  }
  initForce() {
    this.force = D3.layout.force()
      .size([this.settings.width, this.settings.height])
      .nodes(this.notes)
      .links(this.links)
      .gravity(this.settings.gravity)
      .friction(this.settings.friction)
      .linkDistance((d) => {
        let distance = this.settings.linkDistance;
        return distance;
      })
      .linkStrength((d) => {
        let strength = this.settings.linkStrength;
        return strength;
      })
      .charge((d) => {
        let charge = this.settings.charge;
        return charge;
      })
      .theta(this.settings.theta)
      //.alpha(this.settings.alpha)
      .on('tick', () => { this.tick = true; })
      .start();
  }
  ngAfterViewChecked() {
    // these blocks are here at this lifecycle hook to ensure angular has already loaded the frame/handle elements
    // drawArrows doesn't have to wait for this, but it's grouped here with the other element manipulation
    if (this.force && !this.$arrows && !this.$boxes && !this.$handles) { // runs once, after note components are loaded
      this.finishRender(this.notes);
      window.requestAnimationFrame((timestamp) => {
        this.animate(timestamp);
      });
    }
    if (this.newNote) { // runs on note addition
      let note = this.newNote;
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
  }
  finishRender(newNotes: Note[]) {
    console.log();

    // bind link data to $arrow elements
    this.drawArrows(this.links);
    this.$arrows = D3.selectAll('.arrow');
    console.log('$arrows', this.$arrows);

    // bind note data to $frame/$handle elements
    newNotes.forEach((note) => {
      this.loadBasket(note);
    });
    this.$boxes = D3.selectAll('.box');
    this.$handles = D3.selectAll('.handle');
    console.log('$boxes', this.$boxes);
    console.log('$handles', this.$handles);
  }
  drawArrows(links: Link[]) { // draws and binds links
    let $arrows = D3.select('svg').selectAll('.arrow')
      .data(links) // make these paths with arrows

    $arrows.enter().append('polyline')
      .attr('id', (link) => {
        return 'arrow-'+link.source.node.id+'-'+link.target.node.id+'-'+link.type;
      })
      .attr('class', 'arrow')
      .attr('stroke', (link) => {
        return 'none';
      })
      .attr('stroke-width', 2);

    $arrows.exit().remove();
  }
  loadBasket(note: Note) { // binds frames and handles
    this.$space.select('#box-'+note.node.id)
      .data([ note ]);

    this.$space.select('#handle-'+note.node.id)
      .data([ note ])
      .classed('fixed', (note) => { return note.fixed; })
      .on('dblclick', (note) => {
        console.log('handle dblclick', note);
        if (note.fixed == 1 || note.fixed == 3) {
          console.log('unfix note 0', note);
          note.fixed = 0;
          note.node.fixed = false;

          this.force.start();
          if (!note.extra) {
            this.notationService.putNode(note.node, true).subscribe( // update note.node.fixed
              (data) => { },
              (err) => { console.log(err); });
          }
        }
      })
      .call(
        this.force.drag()
          .on("dragstart", (note) => { // fires on all mousedowns, pretty much
            console.log('handle dragstart', note);
            this.frontBasket(note.node.id);
            if (note.node.fixed) {
              this.drag.fixing = false;
            }
            else {
              note.fixed = 1;
              note.node.fixed = true;
              this.drag.fixing = true;
            }
            this.drag.x0 = note.x;
            this.drag.y0 = note.y;
          })
          .on("dragend", (note) => {
            let dx = note.x - this.drag.x0;
            let dy = note.y - this.drag.y0;
            if (!note.extra && (this.drag.fixing || Math.sqrt(dx*dx + dy*dy) >= 1)) {
              this.notationService.putNode(note.node, true).subscribe(
                (data) => { },
                (error) => { console.error(error); });
            }
          })
      );
  }
  private frontBasket(id) { // brings a note-vessel to the front
    this.boxZ++;
    document.getElementById('box-'+id).style.zIndex = this.boxZ+'';
    this.handleZ++;
    document.getElementById('handle-'+id).style.zIndex = this.handleZ+'';
  }
  go($event) {
    if ($event.force) {
      this.force.start();
    }
    else {
      this.tick = true;
    }
  }
  animate(timestamp) {
    if (this.tick) {
      this.tick = false;
      if (this.$arrows) {
        this.$arrows
          .attr('marker-mid', (link) => {
            return this.getMarker(link);
          })
          .attr('points', (link) => {
            return this.getPoints(link);
          });
      }
      if (this.$boxes) {
        this.$boxes
          .style('left', (note) => { // TODO user translate? instead of style left/top
            note.node.x = Math.round(note.x - this.settings.width / 2); // update node
            return note.x+'px'; // cast to string
          })
          .style('top', (note) => {
             note.node.y = Math.round(this.settings.height / 2 - note.y); // update node
            return note.y+'px';
          });
      }
      if (this.$handles) {
        this.$handles
          .style('left', (note) => { return note.x - 9+'px'; }) // -9 (offset = handle.width / 2 + 1)
          .style('top', (note) => { return note.y - 9+'px'; });
      }
    }
    if (this.scrollNote) {
      let note = this.scrollNote;
      this.scrollNote = null;
      // TODO animate this
      this.centerView(note.x, note.y);
    }
    window.requestAnimationFrame((timestamp) => {
      this.animate(timestamp);
    });
  }
  getMarker(link: Link) {
    let relation: Relation = link.source.relations_by_id[link.target.node.id];

    let mode = relation.getMode(link.type);

    let direction = ''
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
  }
  getPoints(link: Link) {
    let relation0: Relation = link.source.relations_by_id[link.target.node.id];
    let relation1: Relation = link.target.relations_by_id[link.source.node.id];

    let mode0 = relation0.getMode(link.type);
    let mode1 = relation1.getMode(link.type);

    let x0 = link.source.x + mode0.x;
    let y0 = link.source.y + mode0.y;
    let x1 = link.target.x + mode1.x;
    let y1 = link.target.y + mode1.y;

    let total_dx = x1 - x0;
    let total_dy = y1 - y0;
    let dr = Math.sqrt(total_dx*total_dx + total_dy*total_dy);
    let spacing = 12;
    let numPoints = Math.floor(dr / spacing);

    let pts = '';
    if (numPoints > 0) {
      let shift = 0;
      if (link.type == 'PRESENT') {
        shift = 0.5;
      }
      else if (link.type == 'EQUATE') {
        shift = 0.5;
      }
      let dx = total_dx / numPoints;
      let dy = total_dy / numPoints;

      for (let i = 0; i < numPoints + 1; i++) {
        pts += (x0 + i*dx + shift*dx) + ',' + (y0 + i*dy + shift*dy) + ' ';
      }
    }
    return pts;
  }
  selectNote($event) {
    let note = this.notes_by_id[$event.target_id];
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

        this.notes.forEach((note) => {
          note.freeRelation.target_id = this.settings.current_id;
        });
      }
      this.notationService.postSelection($event).subscribe(
        (note) => {},
        (error) => { console.error(error); });
    }
    if ($event.scroll) {
      this.scrollNote = note;
    }

    //TODO leave a current trail
    //TODO scroll to new frame
  }
  addNote($event: any) {
    console.log('addNote $event', $event);

    let $marker = D3.select('svg').append('circle')
      .attr('r', 5)
      .attr('cx', $event.offsetX)
      .attr('cy', $event.offsetY)
      .attr('fill', 'azure')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1);

    let params = {
      settings: this.settings,
      notes_by_id: this.notes_by_id,
      x: $event.offsetX,
      y: $event.offsetY,
      secret: ($event.ctrlKey) ? true : false,
      present: ($event.shiftKey) ? true : false,
      equate: ($event.altKey) ? true : false
    };
    this.notationService.postNote(params).subscribe(
      (note) => {
        $marker.remove();

        this.notes_by_id[note.node.id] = note;
        this.notes.push(note);

        note.relations.forEach((relation) => {
          let target: Note = this.notes_by_id[relation.target_id];
          if (target) {
            // add reverse-relation to target note
            let reverse = Relation.reverse(relation);
            target.addRelation(reverse);
            console.log('target', target);

            let links = Link.getLinks(note, target);
            console.log('links', links);
            [].push.apply(this.links, links);
          } 
          else { console.error('posted note has relations with nonexistent note', relation); }
        });

        this.force.start();
        this.newNote = note; // sets data for AfterViewChecked hook
      },
      (error) => { console.error(error); }
    );
  }
  removeNote($event) {
    this.notationService.deleteNote($event.note).subscribe(
      (note) => {
      },
      (error) => { console.error(error); });
  }
  addRelationship($event) {
    this.notationService.postRelationship($event.relationship).subscribe(
      (relationship) => {
        let noteA = this.notes_by_id[relationship.start];
        let noteB = this.notes_by_id[relationship.end];
        console.assert(noteA && noteB, 'adding relationship between invalid notes', relationship, noteA, noteB);

        let add_linkA = noteA.addRelationship(relationship);
        let add_linkB = noteB.addRelationship(relationship);
        console.assert(add_linkA == add_linkB, 'relation pair mismatch', relationship, noteA, noteB);

        if (add_linkA && add_linkB) {
          let link = new Link(noteA, noteB, relationship.type);
          this.links.push(link);
          this.drawArrows(this.links);
        }
        else {
          // link already exists
        }
      },
      (error) => { console.error(error); });
  }
  removeRelationship($event) {
    this.notationService.deleteRelationship($event.relationship).subscribe(
      (data) => {
        console.log(data);
        if (data.deleted) {
          let relationship = $event.relationship;

          let noteA = this.notes_by_id[relationship.start];
          let noteB = this.notes_by_id[relationship.end];

          let remove_linkA = noteA.removeRelationship(relationship);
          let remove_linkB = noteB.removeRelationship(relationship);
          console.assert(remove_linkA == remove_linkB, 'relation pair mismatch', relationship, noteA, noteB);

          if (remove_linkA && remove_linkB) {
            let source;
            let target;
            if (noteA.node.id < noteB.node.id) {
              source = noteA;
              target = noteB;
            }
            else {
              source = noteB;
              target = noteA;
            }
            for (let i = 0; i < this.links.length; i++) {
              if (this.links[i].source.node.id == source.node.id && this.links[i].target.node.id == target.node.id) {
                this.links.splice(i, 1);
                return;
              }
            }
            console.error('no link deleted?', [noteA, noteB]);
          }
        }
        else {
          console.log(data.message);
        }
      },
      (error) => { console.error(error); });
  }
    /*
  onClick($event, onSingle, onDouble) {
    let $target = $event.target;
    if ($target.getAttribute('data-click') == null) {
      $target.setAttribute('data-click', '1');
      console.log('click', $target.getAttribute('data-click'));
      setTimeout(() => {
        if ($target.getAttribute('data-click') == '1') {
          $target.removeAttribute('data-click');
          onSingle($event);
        }
      }, 200);
    }
    else {
      $target.removeAttribute('data-click');
      onDouble($event);
    }
  }*/

}
