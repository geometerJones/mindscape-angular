export class Relationship {
  start: number; // id(source:node)
  end: number; // id(target:node)
  id: number;
  type: string;
  properties: {
    updated: number;
    created: number;
    root_id: number;
    text: string;
  };

  constructor(data) {
    this.start = data.start;
    this.end = data.end;
    this.id = data.id;
    this.type = data.type;
    this.properties = data.properties;
  }
}