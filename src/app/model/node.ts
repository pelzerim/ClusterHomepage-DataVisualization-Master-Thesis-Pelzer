import {D3NodeInterface} from "./d3NodeInterface";
import {DataRelService} from "../services/relational/data-rel.service";
import {Color} from "./colors";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3Node implements D3NodeInterface {

  didLoadChildren: boolean = false;
  children: D3Node[];

  constructor(public name: string,
              public size: number) {
    this.name = name.substring(0, 20);  //TODO: (1) How many chars
  }

  public loadChildren(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  color() : string {
    return "red";
  }

}

export class RelD3Node extends D3Node {
  didLoadChildren: boolean = false;


  constructor(public name: string,
              public size: number,
              public tableName: string,
              public  id: string,
              private data : DataRelService) {
    super(name, size);
  }
  public loadChildren(): Promise<D3Node[]> {
    if (this.children) { // Has children already, returning them
      return new Promise<any>((resolve, reject) => {
        resolve(this.children);
      });
    } else {
      this.didLoadChildren = true;
      return this.data.getChildrenForNode(this);
    }
  }

  color() : string {
    return Color.colorForTable(this.tableName);
  }
}
