import { Note } from './note';

export class Link {
  source: Note;
  target: Note;
  type: string; // TODO allow only DEFINE, PRESENT, EQUATE

  constructor(noteA: Note, noteB: Note, type: string) {
    if (noteA.node.id < noteB.node.id) {
      this.source = noteA;
      this.target = noteB;
    }
    else {
      this.source = noteB;
      this.target = noteA;
    }
    if (type == 'DEFINE' || type == 'PRESENT' || type == 'EQUATE') {
      this.type = type;
    }
    else {
      console.error('invalid pair type', type);
    }
    // TODO verify that note relations are complementary/reverse-symmetric?
  }

  static getLinks(noteA: Note, noteB: Note) {
    let links = [];

    let relationA = noteA.relations_by_id[noteB.node.id];
    let relationB = noteB.relations_by_id[noteA.node.id];
    console.assert((relationA && relationB) || (!relationA && !relationB), 'relation mismatch', noteA, noteB);

    if (relationA && relationB) {
      console.assert(relationA.define.empty == relationB.define.empty, 'relation mismatch', relationA, relationB);
      console.assert(relationA.present.empty == relationB.present.empty, 'relation mismatch', relationA, relationB);
      console.assert(relationA.define.empty == relationB.define.empty, 'relation mismatch', relationA, relationB);
      if (!relationA.define.empty && !relationB.define.empty) {
        let link = new Link(noteA, noteB, 'DEFINE');
        links.push(link);
      }
      if (!relationA.present.empty && !relationB.present.empty) {
        let link = new Link(noteA, noteB, 'PRESENT');
        links.push(link);
      }
      if (!relationA.equate.empty && !relationB.equate.empty) {
        let link = new Link(noteA, noteB, 'EQUATE');
        links.push(link);
      }
    }
    return links;
  }
}