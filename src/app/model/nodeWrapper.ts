import {D3NodeInterface} from "./d3NodeInterface";
import {Color} from "./colors";
import {Guid} from "./GUID";
import {DataRelService} from "../services/relational/data-rel.service";
import {InformationChunk} from "./InformationChunk";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3ConceptWrapper implements D3NodeInterface {
  nameShort(): string {
    return this._nameShort;
  }

  isInFocus: boolean = true;
  private _id : string = Guid.newGuid();
  didLoadChildren: boolean = false;
  private _nameShort;
  information : {};

  constructor(public name: string,
              public children: any[],
              public size: number) {
    // calculate wrapper size
    this._nameShort = name.substring(0, 24).concat((name.length > 24) ? "..." : "");  //TODO: (1) How many chars


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

  loadInformation(): Promise<any[]> {
    return null;
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

  loadInformation(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      if (this.information) {
        resolve(this.information);
      } else {
          this.information = [new InformationChunk("name", this.name)];
          resolve(this.information);
      }
    });
  }

  loadChildren(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
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
