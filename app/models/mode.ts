import { Relationship } from './relationship';

export class Mode {
  source_id: number;
  target_id: number;
  type: string;// DEFINE, PRESENT, or EQUATE

  in: Relationship;
  extra_ins: Relationship[];
  out: Relationship;
  extra_outs: Relationship[];

  empty: boolean;
  rank: number;

  x: number;
  y: number;

  static weights = {
    in: 10000, //10e8
    out: 1000,
    x_in: 1,
    x_out: 1
  };

  constructor(data: any) {
    this.source_id = data.source_id;
    this.target_id = data.target_id;
    this.type = data.type;


    this.extra_ins = [];
    this.extra_outs = [];
    if (data.relationships) {
      this.in = data.relationships.in ? new Relationship(data.relationships.in) : null;
      this.out = data.relationships.out ? new Relationship(data.relationships.out) : null;

      if (Array.isArray(data.relationships.extra_ins)) {
        data.relationships.extra_ins.forEach((relationship_data) => {
          let relationship = new Relationship(relationship_data);
          this.extra_ins.push(relationship);
        });
      }

      if (Array.isArray(data.relationships.extra_outs)) {
        data.relationships.extra_outs.forEach((relationship_data) => {
          let relationship = new Relationship(relationship_data);
          this.extra_outs.push(relationship);
        }); 
      }
    }

    this.update();

    this.x = 0;
    this.y = 0;
  }
  update() {
    let empty = true;
    let rank = 0;

    if (this.in) {
      empty = false;
      rank += Mode.weights.in;
    }
    if (this.out) {
      empty = false;
      rank += Mode.weights.out;
    }
    if (this.extra_ins.length > 0) {
      empty = false;
      rank += Mode.weights.x_in*this.extra_ins.length;
    }
    if (this.extra_outs.length > 0) {
      empty = false;
      rank += Mode.weights.x_out*this.extra_outs.length;
    }
    this.empty = empty;
    this.rank = rank;
  }
  // return true if adding relationship to empty mode
  addRelationship(r: Relationship): boolean {
    return this.setRelationship(r, false);
  }
  // return true if removing relationship results in empty mode
  removeRelationship(r: Relationship): boolean {
    return this.setRelationship(r, true);
  }
  private setRelationship(r: Relationship, deletion: boolean): boolean {
    if (this.type != r.type) console.error('inempty relationship type', r);

    let direction;
    if (this.source_id == r.start) {
      direction = 'out';
    }
    else if (this.source_id == r.end) { // partner_id == relationship.end
      direction = 'in';
    }
    else console.error('inempty relationship endpoints', r);

    if (deletion) {
      this[direction] = null;
    }
    else {
      this[direction] = r;
    }

    let past_empty = this.empty;
    this.update();

    if (deletion && past_empty && !this.empty) {
      return true;
    }
    if (!deletion && !past_empty && this.empty) {
      return true;
    }
    return false;
  }
  static reverse(m: Mode): Mode {
    let reverse = new Mode({
      source_id: m.target_id,
      target_id: m.source_id,
      type: m.type,
      relationships: {
        in: m.out,
        extra_ins: m.extra_outs,
        out: m.in,
        extra_outs: m.extra_ins
      }
    });

    return reverse;
  }
}