import {D3NodeInterface} from "./d3NodeInterface";
import {Color} from "./colors";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3ConceptWrapper implements D3NodeInterface {

  didLoadChildren: boolean = true;
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

  color(): string {
    return "red";
  }

}

export class RelD3ConceptWrapper extends D3ConceptWrapper {
  constructor(public name: string,
              public children: any[],
              public tableName: string) {
    super(name, children);
  }

  color(): string {
    return Color.colorForTable(this.tableName);
  }

}
