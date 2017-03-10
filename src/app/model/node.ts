import {D3NodeInterface} from "./d3NodeInterface";
import {DataRelService} from "../services/relational/data-rel.service";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3Node implements D3NodeInterface {
  children: D3Node[] = [];

  constructor(public name: string,
              public size: number) {
    this.name = name.substring(0, 20);  //TODO: (1) How many chars
  }

  public loadChildren(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

}

export class RelD3Node extends D3Node {
  constructor(public name: string,
              public size: number,
              public tableName: string,
              public  id: string,
              private data : DataRelService) {
    super(name, size);
  }
  public loadChildren(): Promise<D3Node[]> {
    if (this.children) {
      return new Promise<any>((resolve, reject) => {
        resolve(this.children);
      });
    } else {
      return this.data.getChildrenForNode(this);
    }
  }
}
