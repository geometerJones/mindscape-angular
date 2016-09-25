import { Mode } from './mode';
import { Relationship } from './relationship';

export class Relation {
  source_id: number;
  target_id: number;

  modes: Mode[];
  define: Mode;
  present: Mode;
  equate: Mode;

  // data.source_id
  // data.target_id
  // data.define
  // data.present
  // data.equate
  constructor(data: any) {
    this.source_id = data.source_id;
    this.target_id = data.target_id;

    this.define = new Mode({
      source_id: data.source_id,
      target_id: data.target_id,
      type: 'DEFINE',
      relationships: data.define
    });

    this.present = new Mode({
      source_id: data.source_id,
      target_id: data.target_id,
      type: 'PRESENT',
      relationships: data.present
    });

    this.equate = new Mode({
      source_id: data.source_id,
      target_id: data.target_id,
      type: 'EQUATE',
      relationships: data.equate
    });

    this.modes = [this.define, this.present, this.equate];
  }
  getMode(type: string): Mode {
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
  }
  // returns true if need to add a link
  addRelationship(r: Relationship): boolean {
    return this.setRelationship(r, false);
  }
  // returns true if need to remove a link
  removeRelationship(r: Relationship): boolean {
    return this.setRelationship(r, true);
  }
  private setRelationship(r: Relationship, deletion: boolean): boolean {
    let mode: Mode;
    if (r.type == 'DEFINE') {
      mode = this.define;
    }
    else if (r.type == 'PRESENT') {
      mode = this.present;
    }
    else if (r.type == 'EQUATE') {
      mode = this.equate;
    }
    else console.error('invalid relationship type', r);

    if (deletion) {
      return mode.removeRelationship(r);
    }
    else {
      return mode.addRelationship(r);
    }
  }
  static compareByDefinitions(a, b) {
    if (a.define.rank > b.define.rank) {
      return -1;
    }
    if (a.define.rank < b.define.rank) {
      return 1;
    }
    return 0;
  }
  static compareByPresentations(a, b) {
    if (a.define.rank > b.define.rank) {
      return -1;
    }
    if (a.define.rank < b.define.rank) {
      return 1;
    }
    return 0;
  }
  static compareByEquations(a, b) {
    if (a.define.rank > b.define.rank) {
      return -1;
    }
    if (a.define.rank < b.define.rank) {
      return 1;
    }
    return 0;
  }
  static reverse(r: Relation): Relation {
    let reverse = new Relation({
      source_id: r.target_id,
      target_id: r.source_id,
      define: Mode.reverse(r.define),
      present: Mode.reverse(r.present),
      equate: Mode.reverse(r.equate)
    });
    return reverse;
  }
}