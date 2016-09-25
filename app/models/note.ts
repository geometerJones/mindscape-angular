import { Node } from './node';
import { Relation } from './relation';
import { Relationship } from './relationship';

export class Note {
  node: Node;

  relations_by_id: any;
  relations: Relation[];

  definitions: Relation[];
  presentations: Relation[];
  equations: Relation[];

  freeRelation: Relation;

  created: string;
  updated: string;

  x: number;
  y: number;
  z: number;
  fixed: number;

  root: boolean;
  frame: boolean;
  current: boolean;

  extra: boolean;

  positionSignature: boolean;
  positionParagraph: boolean;
  positionDefinitions: boolean;
  positionPresentations: boolean;
  positionEquations: boolean;

  constructor(note_data: any, settings: any) {
    // the node is the core data structure of the note, corresponds to the neo4j node
    this.node = new Node(note_data.node);
    // relations are sets of relationships, grouped by target
    // (the relation 'source' is this, the note that holds the relation; the relation 'target' is the relationship partner note)
    this.relations_by_id = {};
    this.relations = [];
    // this.relations, filtered by relationship types, yields this.definitions, this.presentations, this.equations
    // these three subsets may overlap (multiple relationship types are possible in any one relation) 
    this.definitions = [];
    this.presentations = [];
    this.equations = [];

    note_data.relations.forEach((relation_data) => {
      // load each relation
      let relation = new Relation(relation_data);
      this.addRelation(relation);
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
    this.freeRelation = new Relation({
      source_id: this.node.id,
      target_id: settings.current_id
    });
  }
  addRelation(relation: Relation) {
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
  }
  addRelationship(r: Relationship): boolean {
    return this.setRelationship(r, false);
  }
  removeRelationship(r: Relationship): boolean {
    return this.setRelationship(r, true);
  }
  private setRelationship(r: Relationship, deletion: boolean): boolean {
    let target_id;
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

    let mode_changed;
    let relation = this.relations_by_id[target_id];
    if (deletion) {
      console.assert(relation, 'relation not found', r, this);
      
      mode_changed = relation.removeRelationship(r);
      if (mode_changed) {
        let relation_empty = true;
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
        relation = new Relation({
          source_id: this.node.id,
          target_id: target_id
        });
        this.relations_by_id[target_id] = relation;
        this.relations.push(relation);
      }
      mode_changed = relation.addRelationship(r);
    }

    if (r.type == 'DEFINE') {
      this.definitions.sort(Relation.compareByDefinitions);
    }
    else if (r.type == 'PRESENT') {
      this.presentations.sort(Relation.compareByPresentations);
    }
    else if (r.type == 'EQUATE') {
      this.equations.sort(Relation.compareByEquations);
    }
    else console.error('invalid relationship type', r);
    //this.positionRelations = true;

    return mode_changed;
  }
  private spliceRelation(r: Relation, list: Relation[]): boolean {
    for (let i = 0; i < list.length; i++) {
      if (r.target_id == list[i].target_id) {
        list.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}