import {D3NodeInterface} from "./d3NodeInterface";
import {DataRelService} from "../services/relational/data-rel.service";
import {Color, HEX} from "./colors";
import {Guid} from "./GUID";
import {DataSemService} from "../services/semantic/data-sem";
import {SemDataURI} from "./InformationChunk";
import * as d3 from 'd3';
import {FCFilter, FacettedSearch} from "./facettedSearch";
import {FSTypeFilter, FSFacettedSearch} from "../services/semantic/facettedSearchSemType";


/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3Node implements D3NodeInterface {
  stopTimer() {
    if (this.timer) this.timer.stop();
  }
  timer: any;

  facettedSearch: FacettedSearch;


  tooltip(): string {
    return "";
  }
  isLoading : boolean = false;
  isInFocus: boolean = false;

  didLoadChildren: boolean = false;
  children: D3NodeInterface[];
  information: {};

  private _id: string = Guid.newGuid();
  private maxNameLength = 24;
  protected _nameShort;

  constructor(public name: string,
              public size: number) {
    this.name = name.replace("&#38;", "&");
    this.nameRedo();
  }

  public nameRedo() {
    this._nameShort = this.name.substring(0, 24).concat((this.name.length > 24) ? "..." : "");
  }


  public loadChildren(): Promise<D3Node[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  loadChildrenWithFilter(filter: FCFilter[]): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  public loadInformation(): Promise<any[]> {
    return new Promise<any>((resolve, reject) => {
      reject(new Error("This should never be called, as this class is only a superclass/abstract."));
    });
  }

  color(): string {
    return "red";
  }

  id(): string {
    return this._id;
  }

  nameShort(): string {
    return this._nameShort;
  }

  type() {
    return "none";
  }

  typeInDB() {
    return "Leer";
  }

  comment(): string {
    return null;
  }

}


// D3 Node for RELATIONAL DATA
export class RelD3Node extends D3Node {

  didLoadChildren: boolean = false;


  constructor(public name: string,
              public size: number,
              public tableName: string,
              public  externalId: string,
              private data: DataRelService,
              public parent: D3NodeInterface) {
    super(name, size);
    this.name = name.replace("&#38;", "&");
    this.facettedSearch = new FSFacettedSearch(this);
    if (this.parent && this.parent.facettedSearch && this.parent.facettedSearch.namedFilters && this.parent.facettedSearch.namedFilters["sizeFilter"] && this.parent.facettedSearch.namedFilters["sizeFilter"].value == "none") {
      this.size = 1;
    } else {
      this.size = size;

    }



  }

  public loadChildren(): Promise<D3Node[]> {
    if (this.children) { // Has children already, returning them
      this.didLoadChildren = true;
      return new Promise<any>((resolve, reject) => {
        resolve(this.children);
      });
    } else {
      this.didLoadChildren = true;
      return this.data.getChildrenForNode(this, null);
    }
  }

  public loadChildrenWithFilter(filter: FCFilter[]): Promise<any[]> {
    this.didLoadChildren = true;
    return this.data.getChildrenForNode(this, this.facettedSearch);
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

  color() {
    return this.colorWithAlpha(1);
  }

  colorWithAlpha(alpha : number): string {
    //console.log(new HEX(Color.colorForTable(this.tableName)).toRGB().setAlpha(alpha).toString());
    return new HEX(Color.colorForTable(this.tableName)).toRGB().setAlpha(alpha).toString();

  }

  type() {
    return this.tableName.replace("content_","");
  }

  typeInDB(): string {
    return this.tableName;
  }

  tooltip(): string {
    return this.type() + ": <strong>" + this.name + "</strong>"
  }

}


export enum SemD3NodeType {
  Class,
  Instance
}

// D3 Node for SEMANTIC DATA
export class SemD3Node extends D3Node {
  didLoadChildren: boolean = false;

  size: number;
  semD3NodeType: SemD3NodeType;
  parent: D3NodeInterface;
  //static sizeOfNode = d3.interpolateNumber(1, 100);
  didLoadInformation = false;

  // URI TYPES
  public typeURI: SemDataURI = new SemDataURI(null);
  public uri: SemDataURI = new SemDataURI(null);
  public predicateConnectingParentToThisURI: SemDataURI;


  constructor(private data: DataSemService) {
    super("Leer", 0);

    this.facettedSearch = new FSFacettedSearch(this);
  }



  type() {
    return this.typeURI.getValueFormatted();
  }

  typeInDB() {
    return this.typeURI.getValue();
  }

  // IMPORTANT: MAKE SURE TO SET PARENT BEFORE INVOKING THIS
  public setSize(size: number) {
    if (!this.parent) throw new Error("Set parent proerty before setting size.");
    if (this.parent && this.parent.facettedSearch && this.parent.facettedSearch.namedFilters["sizeFilter"] &&  this.parent.facettedSearch.namedFilters["sizeFilter"].value == "none") {
      this.size = 1;
    } else {
      this.size = size;

    }

  }

  public uriEncoded() {
    if (!this.uri || !this.uri.getValue()) return null;
    return btoa(this.uri.getValue());
  }

  public loadChildren(): Promise<D3Node[]> {
    if (this.children) { // Has children already, returning them
      this.didLoadChildren = true;
      return new Promise<any>((resolve, reject) => {
        resolve(this.children);
      });
    } else {
      this.didLoadChildren = true;
      if (this.semD3NodeType == SemD3NodeType.Class) {
        return this.data.getPropertiesOfClass(this, null);
      } else if (this.semD3NodeType == SemD3NodeType.Instance) {
        return this.data.getPropertiesOfInstance(this, null);
      }

    }
  }

  loadChildrenWithFilter(filter: FCFilter[]): Promise<any[]> {
    this.didLoadChildren = true;
    if (this.semD3NodeType == SemD3NodeType.Class) {
      return this.data.getPropertiesOfClass(this, this.facettedSearch);
    } else if (this.semD3NodeType == SemD3NodeType.Instance) {
      return this.data.getPropertiesOfInstance(this, this.facettedSearch);
    }
  }

  public loadInformation(): Promise<D3Node[]> {
    if (this.information && this.didLoadInformation) { // Has children already, returning them
      return new Promise<any>((resolve, reject) => {
        resolve(this.information);
      });
    } else {
      this.didLoadInformation = true;
      return this.data.getLiteralsOf(this);
    }
  }

  color() {
    return this.colorWithAlpha(1);
  }

  colorWithAlpha(alpha : number): string {
    return new HEX(Color.colorForURI(this.typeURI.getValue())).toRGB().setAlpha(alpha).toString();
    //return Color.colorForURI(this.predicateConnectingParentToThisURI.getValue());
  }

  tooltip(): string {
    if (this.semD3NodeType == SemD3NodeType.Class) {
      let out = "<strong>" + this.name + "</strong> ";
      if(this.typeURI.comment) out += this.typeURI.comment;
      return out;
    } else if (this.semD3NodeType == SemD3NodeType.Instance) {
      let label = this.predicateConnectingParentToThisURI && this.predicateConnectingParentToThisURI.valueLabel ? this.predicateConnectingParentToThisURI.valueLabel + " " + this.typeURI.getValueFormatted() : this.typeURI.getValueFormatted()
      return label + ": <strong>" + this.name + "</strong>"
    }

  }

  comment(): string {
    return this.typeURI.comment;
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

  color(): string {
    return Color.colorForTable("empty");
  }

  type() {
    return "Leer";
  }


}
