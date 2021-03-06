import {D3NodeInterface} from "./d3NodeInterface";
import {Color, HEX} from "./colors";
import {Guid} from "./GUID";
import {DataRelService} from "../services/relational/data-rel.service";
import {InformationChunk} from "./InformationChunk";
import {DataSemService} from "../services/semantic/data-sem";
import {FacettedSearch, FCFilter} from "./facettedSearch";
import {FSFacettedSearch} from "../services/semantic/facettedSearchSemType";
/**
 * Created by immanuelpelzer on 08.03.17.
 */
export class D3ConceptWrapper implements D3NodeInterface {
  stopTimer() {
    if(this.timer) this.timer.stop();
  }
  timer: any;

  comment(): string {
    return null;
  }
  typeInDB(): string {
    return "";
  }
  facettedSearch: FacettedSearch;

  loadChildrenWithFilter(filter: FCFilter[]): Promise<any[]> {
    return undefined;
  }
  typeOriginal(): string {
    return this.type();
  }
  tooltip(): string {
    return "";
  }
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

  type() {
    return "None";
  }

}

export class RelD3ConceptWrapper extends D3ConceptWrapper {

  constructor(public name: string,
              public children: any[],
              public size:number,
              public tableName: string,
              public data : DataRelService) {
    super(name, children, size);
    //this.size = 200 + size;
    this.size = 1;
    this.facettedSearch = new FSFacettedSearch(this);
  }

  color(): string {
    return Color.colorForTable(this.tableName);
  }
  colorWithAlpha(alpha : number): string {
    return new HEX(Color.colorForTable(this.tableName)).toRGB().setAlpha(alpha).toString();

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
        this.data.getAllFromTable(this, null).then((c) => {
          this.didLoadChildren = true;
          resolve(c);
        })
      }
    });
  }

  loadChildrenWithFilter(filter: FCFilter[]): Promise<any[]> {
    return this.data.getAllFromTable(this, this.facettedSearch).then((c) => {
      this.didLoadChildren = true;
      return c;
    })
  }

  type() {
    return this.tableName;
  }
  typeInDB(): string {
    return this.tableName;
  }

}
//
// export class SemD3ConceptWrapper extends D3ConceptWrapper {
//   constructor(public name: string,
//               public children: any[],
//               public size:number,
//               public data : DataSemService) {
//     super(name, children, size);
//     this.size = 200 + size;
//   }
//
//   color(): string {
//     return "red"; // TODO: give color
//   }
//
//   loadInformation(): Promise<any[]> {
//     return new Promise<any>((resolve, reject) => {
//       if (this.information) {
//         resolve(this.information);
//       } else {
//         this.information = [new InformationChunk("name", this.name)];
//         resolve(this.information);
//       }
//     });
//   }
//
//   loadChildren(): Promise<any[]> {
//     return new Promise<any>((resolve, reject) => {
//       if (this.children) {
//         this.didLoadChildren = true;
//         resolve(this.children);
//       } else {
//         this.data.getChildrenForNode(this).then((c) => {
//           this.didLoadChildren = true;
//           resolve(c);
//         })
//       }
//     });
//   }
//
//   type() {
//     return "error"; // TODO:
//   }
// }
