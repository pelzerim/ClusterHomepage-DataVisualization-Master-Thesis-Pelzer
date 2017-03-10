import {D3NodeInterface} from "./d3NodeInterface";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3ConceptWrapper implements D3NodeInterface {
  public size: number;

  constructor(public name: string,
              public children: any[]) {
    // calculate wrapper size
    let s = 0;
    for (let child of children) {
      s += child.size;
    }
    this.size = s;
  }

  loadChildren(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      resolve(this.children);
    });
  }

}

export class RelD3ConceptWrapper extends D3ConceptWrapper {
  constructor(public name: string,
              public children: any[],
              public tableName: string) {
    super(name, children);
  }
}
