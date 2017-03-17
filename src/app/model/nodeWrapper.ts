import {D3NodeInterface} from "./d3NodeInterface";
import {Color} from "./colors";
import {Guid} from "./GUID";
import {DataRelService} from "../services/relational/data-rel.service";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3ConceptWrapper implements D3NodeInterface {

  isInFocus: boolean = true;
  private _id : string = Guid.newGuid();
  didLoadChildren: boolean = false;

  constructor(public name: string,
              public children: any[],
              public size: number) {
    // calculate wrapper size


  }

  loadChildren(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      if (this.children) {
        this.didLoadChildren = true;
        resolve(this.children);
      } else {
        reject(new Error("No children in concept wrapper " + this.name))
      }

    });
  }

  color(): string {
    return "red";
  }

  id(): string {
    return this._id;
  }

}

export class RelD3ConceptWrapper extends D3ConceptWrapper {
  constructor(public name: string,
              public children: any[],
              public size:number,
              public tableName: string,
              public data : DataRelService) {
    super(name, children, size);
  }

  color(): string {
    return Color.colorForTable(this.tableName);
  }

  loadChildren(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      console.log(this.children)
      if (this.children) {
        this.didLoadChildren = true;
        resolve(this.children);
      } else {
        this.data.getAllFromTable(this).then((c) => {
          this.didLoadChildren = true;
          resolve(c);
        })
      }
    });
  }

}
