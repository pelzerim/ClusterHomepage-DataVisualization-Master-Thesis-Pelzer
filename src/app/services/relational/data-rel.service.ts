import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {D3Node, RelD3Node, EmptyD3Node} from "../../model/node";
import {D3ConceptWrapper, RelD3ConceptWrapper} from "../../model/nodeWrapper";
import {D3NodeInterface} from "../../model/d3NodeInterface";
import {D3DataService} from "../dataServiceInterface";
import {InformationChunk} from "../../model/InformationChunk";
import {ColorMode} from "../../model/colors";
import {FCFilter} from "../../model/facettedSearch";
import {FSFacettedSearch} from "../semantic/facettedSearchSemType";
import {BenchmarkService, BenchmarkTask} from "../benchmark";


@Injectable()
export class DataRelService implements D3DataService {
  name(): string {
    return "rel";
  }
  public colorMode() {
    return ColorMode.Relational;
  }
  currentSelectedData: D3NodeInterface;
  currentFocusPath: D3NodeInterface[];
  currentMode :string;
  private baseUrl = 'http://ec2-54-93-82-100.eu-central-1.compute.amazonaws.com:8888/relational';
  private static allClusterConcepts =
    {
      "content_ausstellung": "Ausstellungen",
      "content_kooperation": "Kooperationen",
       "content_mitglied": "Mitglieder",
      "content_nachwuchsfoerderung": "Nachwuchsfoerderungen",
      "content_newsletter": "Newsletter",
      "content_podcast": "Podcasts",
      "content_post": "Posts",
      "content_pressemitteilung": "Pressemitteilungen",
      "content_projekt": "Projekte",
      "content_category" : "Kategorien",
      "forschungsschwerpunkte": "Forschungsschwerpunkte"
      ,"content_publikation": "Publikationen"
    }


  public static iconForTableName =
    {
      "content_ausstellung": "\uf03e",
      "content_kooperation": "\uf19c",
      "content_mitglied": "\uf007",
      "content_nachwuchsfoerderung": "\uf1ae",
      "content_newsletter": "\uf1ea",
      "content_podcast": "\uf2ce",
      "content_post": "\uf27b",
      "content_pressemitteilung": "\uf1ea",
      "content_projekt": "\uf0c0"
      ,"content_publikation": "\uf0f6"
    }

  constructor(private http: Http, private benchmark : BenchmarkService) {
    this.currentFocusPath = [];
    this.currentMode = "sql";
  }

  getRoot(): Promise<D3NodeInterface> {
    // Make Cluster
    let children: D3NodeInterface[] = [];
    let promises = [];
    let timer = this.benchmark.timer(BenchmarkTask.GetRoot, this.currentMode);

    for (let tableName in DataRelService.allClusterConcepts) {
      promises.push(
        this.getCountOfChildrenFromTable(tableName, DataRelService.allClusterConcepts[tableName]).then((node) => {
          node.size = 1;
          children.push(node);
        })
      )
    }
    return Promise.all(promises).then(() => {
      //timer.stop();
      let cluster = new RelD3ConceptWrapper("Cluster", children,promises.length, "none", this);
      cluster.timer = timer;
      cluster.didLoadChildren = true;
      return cluster;
    })

  }

  public getChildrenForNode(node: RelD3Node, facettedSearch : FSFacettedSearch): Promise<D3NodeInterface[]> {
    let url = this.baseUrl + "/children/" + node.tableName + "/" + node.externalId;
    console.log("QUERYING: " + url)
    // Prepare filter
    let payload = {filters: null};
    let type = BenchmarkTask.GetChildren
    if (facettedSearch) {
      type = BenchmarkTask.GetChildrenWithFacettedSearch;
      payload.filters = facettedSearch.getData(); // Stringify payload
    }
    let bodyString = JSON.stringify(payload);
    //let timer = this.benchmark.timer(BenchmarkTask.GetChildren);
    let timer = this.benchmark.timer(type, this.currentMode);
    node.timer = timer;
    return this.http
      .post(url, bodyString)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj) {
          if (child ) { // Do not add self &&
           if (node instanceof RelD3Node && ((node as RelD3Node).parent as RelD3Node).externalId == child.page_ptr_id) {
              console.log("NOT ADDING" , node.name, "to prevent loop");
            } else {
              children.push(new RelD3Node(child.title, child.children, child.table_name, child.page_ptr_id, this, node))
            }

          }
        }
        if (children.length == 0) {
          console.log(node.name, "emtpy")
          children.push(new EmptyD3Node())
        }
        node.children = children;

        return children;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }

  /**
   * Querys all objects from a table. Including number of children.
   * @param table
   * @param name Resulting D3ConceptWrapper name
   * @returns Promise<D3Node[]>
   */
  public getAllFromTable(node : RelD3ConceptWrapper, facettedSearch : FSFacettedSearch): Promise<D3NodeInterface[]> {
    let url = this.baseUrl + "/all/" + node.tableName;
    console.log("QUERYING: " + url)
    // ...using get request
    let payload = {filters: null};
    let type = BenchmarkTask.GetClass
    if (facettedSearch) {
      type = BenchmarkTask.GetClassWithFacettedSearch;
      payload.filters = facettedSearch.getData(); // Stringify payload
    }
    let bodyString = JSON.stringify(payload);


    let timer = this.benchmark.timer(type, this.currentMode);
    node.timer = timer;
    return this.http
      .post(url, bodyString)
      .map((res: Response) => {

        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj) {
            let ctChildren = child.children ? child.children :1;
            children.push(new RelD3Node(child.title_de,ctChildren, node.tableName, child.page_ptr_id, this, node))
        }
        node.children = children;
        return children;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }

  public getCountOfChildrenFromTable(table: string, name: string): Promise<D3NodeInterface> {
    let url = this.baseUrl + "/children/" + table;
    console.log("QUERYING: " + url)
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        return new RelD3ConceptWrapper(name, undefined, obj.children, table, this);
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }


  getInformationForNode(node : RelD3Node) {
    let url = this.baseUrl + "/information/" + node.tableName + "/" + node.externalId;
    console.log("QUERYING: " + url);

    // ...using get request
    let timer = this.benchmark.timer(BenchmarkTask.GetInformation, this.currentMode);
    node.timer = timer;
    return this.http
      .get(url)
      .map((res: Response) => {

        let obj = res.json();
        let infos = []
        for (let info in obj) {
          if (obj[info] && obj[info] != "") {
            infos.push(new InformationChunk(info, obj[info]));
          }
        }
        node.information = infos;
        return infos;
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }
}
