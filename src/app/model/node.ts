import {D3NodeInterface} from "./d3NodeInterface";
import {DataRelService} from "../services/relational/data-rel.service";
import {Color} from "./colors";
import {Guid} from "./GUID";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3Node implements D3NodeInterface {
  isInFocus: boolean = false;

  didLoadChildren: boolean = false;
  children: D3NodeInterface[];
  information : {};

  private _id : string = Guid.newGuid();
  private maxNameLength = 24;
  private _nameShort;
  constructor(public name: string,
              public size: number) {
    this._nameShort = name.substring(0, 24).concat((name.length > 24) ? "..." : "");  //TODO: (1) How many chars
  }

  public loadChildren(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  public loadInformation(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  color() : string {
    return "red";
  }

  id(): string {
    return this._id;
  }

  nameShort(): string {
    return this._nameShort;
  }

}



export class RelD3Node extends D3Node {
  didLoadChildren: boolean = false;


  constructor(public name: string,
              public size: number,
              public tableName: string,
              public  externalId: string,
              private data : DataRelService,
              public parent : D3NodeInterface) {
    super(name, size);
  }
  public loadChildren(): Promise<D3Node[]> {
    if (this.children) { // Has children already, returning them
      this.didLoadChildren = true;
      return new Promise<any>((resolve, reject) => {
        resolve(this.children);
      });
    } else {
      this.didLoadChildren = true;
      return this.data.getChildrenForNode(this);
    }
  }

  public loadInformation(): Promise<D3Node[]> {
    if (this.information) { // Has children already, returning them
      return new Promise<any>((resolve, reject) => {
        resolve(this.information);
      });
    } else {
      return this.data.getInformationForNode(this);
    }
  }

  color() : string {
    return Color.colorForTable(this.tableName);
  }
}


export class EmptyD3Node extends D3Node {
  didLoadChildren: boolean = true;

  constructor() {
    super("Leer", 1);
    this.information = [];
  }

  public loadChildren(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      reject()
    });
  }

  public loadInformation(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      resolve(this.information);
    });
  }

  color() : string {
    return Color.colorForTable("empty");
  }
}
