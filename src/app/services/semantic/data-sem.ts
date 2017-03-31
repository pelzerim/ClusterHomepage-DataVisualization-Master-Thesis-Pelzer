/**
 * Created by immanuelpelzer on 24.03.17.
 */
import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {D3Node, RelD3Node, EmptyD3Node, SemD3Node, SemD3NodeType} from "../../model/node";
import {D3NodeInterface} from "../../model/d3NodeInterface";
import {D3DataService} from "../dataServiceInterface";
import {InformationChunk, SemanticInformationChunk, SemData, SemDataURI} from "../../model/InformationChunk";
import {ColorMode} from "../../model/colors";


@Injectable()
export class DataSemService implements D3DataService {
  public colorMode() {
    return ColorMode.Semantic;
  }

  currentSelectedData: D3NodeInterface;
  currentFocusPath: D3NodeInterface[];

  private baseUrl = 'http://localhost:8888';

  public static iconForTableName =  {}; // Not using icons

  constructor(private http: Http) {
    this.currentFocusPath = [];
  }

  getRoot(): Promise<D3NodeInterface> {
    let url = this.baseUrl + "/semantic/root";
    console.log("QUERYING: " + url);
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let cluster = new SemD3Node(this); // "Cluster", 0, new SemDataURI(null),  this, null, SemD3NodeType.Class, null
        cluster.name ="Cluster";
        cluster.nameRedo();
        cluster.uri = new SemDataURI(null);
        cluster.semD3NodeType = SemD3NodeType.Class;
        cluster.children = [];

          //new SemD3ConceptWrapper("Cluster", children, children.length, this);
        let obj = res.json();
        for (let child of obj.results.bindings) {
          let uri = new SemDataURI(child.type.value);

          let newNode = new SemD3Node(this);
          newNode.uri = uri;
          newNode.name = child.title ? capitalizeFirstLetter(child.title.value) : uri.getValueFormatted();
          newNode.nameRedo();
          newNode.typeURI = uri;
          newNode.setSize(child.rank.value);
          newNode.parent = cluster;
          newNode.semD3NodeType = SemD3NodeType.Class;
          newNode.predicateConnectingParentToThis = null;

          // let info = [];
          // child.title ? info.push(new SemanticInformationChunk(new SemDataURI("Title"),child.title.value)):null;
          // child.comment ? info.push(new SemanticInformationChunk(new SemDataURI("Comment"),child.comment.value)):null;
          // newNode.information = info;


          cluster.children.push(newNode)


        }
        return cluster;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise()
  }

  getPropertiesOfInstance(node: SemD3Node): Promise<D3NodeInterface> {
    let encUri = node.uriEncoded();
    if (!encUri) {
      return new Promise<any>((resolve, reject) => {
        reject(new Error("No children in concept wrapper " + node.name))
      });
    }
    let url =this.baseUrl + "/semantic/instance/properties/" + node.uriEncoded()  ;

    console.log("QUERYING: " + url + " Original URI ("+ node.uri.getValue() + ")");
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj.results.bindings) {
          //console.log(child);
          let uri = new SemDataURI(child.o ? child.o.value : null);

          let newNode = new SemD3Node(this);
          newNode.uri = uri;
          newNode.name = capitalizeFirstLetter(child.title.value);
          newNode.nameRedo();
          newNode.setSize(child.rank.value);
          newNode.parent = node;
          newNode.semD3NodeType = SemD3NodeType.Instance;
          newNode.typeURI = new SemDataURI(child.type.value);
          newNode.predicateConnectingParentToThis = new SemDataURI(child.p.value);

          let info = [];
          //child.title ? info.push(new SemanticInformationChunk(new SemDataURI("Title"),child.title.value)):null;
          child.comment ? info.push(new SemanticInformationChunk(new SemDataURI("Comment"),child.comment.value)):null;
          newNode.information = info;
          children.push(newNode)

        }
        node.children = children;
        return children;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }


  getPropertiesOfClass(node: SemD3Node): Promise<D3NodeInterface> {
    let encUri = node.uriEncoded();
    if (!encUri) {
      return new Promise<any>((resolve, reject) => {
          reject(new Error("No children in concept wrapper " + node.name))
      });
    }
    let url =this.baseUrl + "/semantic/class/properties/" +  encUri ;

    console.log("QUERYING: " + url + " Original URI ("+ node.uri.getValue() + ")");
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj.results.bindings) {
          //console.log(child)
          let uri = new SemDataURI(child.s.value);

          let newNode = new SemD3Node(this);
          newNode.uri = uri;
          newNode.name = child.title.value;
          newNode.nameRedo();
          newNode.typeURI = node.uri;
          newNode.setSize(child.rank.value);
          newNode.parent = node;
          newNode.semD3NodeType = SemD3NodeType.Instance;
          newNode.predicateConnectingParentToThis = node.uri;
          children.push(newNode)
        }
        node.children = children;

        return children;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }

  getLiteralsOf(node: SemD3Node): Promise<D3NodeInterface> {
    let encUri = node.uriEncoded();
    if (!encUri) {
      return new Promise<any>((resolve, reject) => {
        reject(new Error("No children in concept wrapper " + node.name))
      });
    }
    console.log(encUri)
    let url =this.baseUrl + "/semantic/literals/" + encUri ;
    console.log("QUERYING: " + url + " Original URI ("+ node.uri.getValue() + ")");
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: InformationChunk[] = [];
        console.log(obj)
        for (let child of obj.results.bindings) {
          if (Object.keys(child).length !== 0 && child.constructor === Object) {
            let chunk = new SemanticInformationChunk(new SemData(child.p), new SemData(child.o))
            child.label ? chunk.setPredicateLabel(capitalizeFirstLetter(child.label.value)) : null;
            children.push(chunk)
          }

        }
        node.information = children;
        return children;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }

}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
