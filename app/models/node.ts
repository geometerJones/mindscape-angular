export class Node {
  updated: number;
  created: number;

  id: number;
  root_id: number;

  name: string;
  theme: string;
  meta: string; 

  title: string;
  description: string;
  prescription: string;

  secret: boolean;

  degree: number;

  x: number;
  y: number;
  z: number;
  fixed: boolean;

  showMeasurement: boolean;
  showParagraph: boolean;
  showDefinitions: boolean;
  showPresentations: boolean;
  showEquations: boolean;

  //modified: boolean;
  //flagged: boolean;
  constructor(data: any) {
    this.created = data.created;
    this.updated = data.updated;

    this.id = data.id;
    this.root_id = data.root_id;

    this.name = data.name;
    this.theme = data.theme;
    this.meta = data.meta;

    this.secret = data.secret;

    this.degree = data.degree;
    
    this.x = data.x;
    this.y = data.y;
    this.z = data.z;
    this.fixed = data.fixed;

    this.showMeasurement= data.showMeasurement;
    this.showParagraph = data.showParagraph;
    this.showDefinitions = data.showDefinitions;
    this.showPresentations = data.showPresentations;
    this.showEquations = data.showEquations;
  }
}