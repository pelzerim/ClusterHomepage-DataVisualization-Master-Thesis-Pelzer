import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import {D3Node, RelD3Node} from "../../model/node";
import {D3ConceptWrapper, RelD3ConceptWrapper} from "../../model/nodeWrapper";
import {D3NodeInterface} from "../../model/d3NodeInterface";


@Injectable()
export class DataRelService {

  private baseUrl = 'http://localhost:8888';
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
      "content_projekt": "Projekte"
      // ,"content_publikation": "Publikationen"
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

  constructor(private http: Http) {
  }

  getRoot(): Promise<D3NodeInterface> {
    // Make Cluster
    let children: D3NodeInterface[] = [];
    let promises = [];
    for (let tableName in DataRelService.allClusterConcepts) {
      promises.push(
        this.getCountOfChildrenFromTable(tableName, DataRelService.allClusterConcepts[tableName]).then((node) => {
          children.push(node);
        })
      )
    }
    return Promise.all(promises).then(() => {
      let cluster = new RelD3ConceptWrapper("Cluster", children,promises.length, "none", this)
      return cluster;
    })
  }

  public getChildrenForNode(node: RelD3Node): Promise<D3NodeInterface[]> {
    let url = this.baseUrl + "/children/" + node.tableName + "/" + node.externalId;
    console.log("QUERYING: " + url)
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj) {
          if (child) {
            children.push(new RelD3Node(child.title, child.children, child.table_name, child.page_ptr_id, this))
          }
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
  public getAllFromTable(node : RelD3ConceptWrapper): Promise<D3NodeInterface> {
    let url = this.baseUrl + "/all/" + node.tableName;
    console.log("QUERYING: " + url)
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj) {
          children.push(new RelD3Node(child.title_de, child.children, node.tableName, child.page_ptr_id, this))
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


}
