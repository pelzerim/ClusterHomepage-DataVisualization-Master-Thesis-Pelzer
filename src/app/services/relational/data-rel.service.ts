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
  private allClusterConcepts =
    {
      "content_ausstellung": "Ausstellungen",
      "content_kooperation": "Kooperationen",
      //"content_mitglied": "Mitglieder",
      "content_nachwuchsfoerderung": "Nachwuchsfoerderungen",
      "content_newsletter": "Newsletter",
      "content_podcast": "Podcasts",
      //"content_post": "Posts",
      "content_pressemitteilung": "Pressemitteilungen",
      "content_projekt": "Projekte"
      //,"content_publikation": "Publikationen"
    }

  constructor(private http: Http) {
  }

  getRoot() : Promise<D3NodeInterface>  {
    // Make Cluster
    let children: D3NodeInterface[] = [];
    let promises  = [];
    for (let tableName in this.allClusterConcepts) {
      promises.push(this.getAllFromTable(tableName, this.allClusterConcepts[tableName]).then((node) => {
        children.push(node);
      }))
    }
    return Promise.all(promises).then(()=> {
      let cluster = new RelD3ConceptWrapper("Cluster", children, "none")
      return cluster;
    })
  }

  getProjects(): Promise<D3NodeInterface[]> {
    return this.getAllFromTable("content_projekt", "Projekte");
  }

  public getChildrenForNode(node: RelD3Node): Promise<D3NodeInterface[]> {
    let url = this.baseUrl + "/children/" + node.tableName + "/" + node.id;
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
  public getAllFromTable(table: string, name: string): Promise<D3NodeInterface> {
    let url = this.baseUrl + "/all/" + table;
    console.log("QUERYING: " + url)
    // ...using get request
    return this.http
      .get(url)
      .map((res: Response) => {
        let obj = res.json();
        let children: D3Node[] = [];
        for (let child of obj) {
          children.push(new RelD3Node(child.title_de, child.children, table, child.page_ptr_id, this))
        }
        return new RelD3ConceptWrapper(name, children, table);
      })
      .catch((error: any) => Observable.throw(error || 'Server error'))
      .toPromise();
  }


}
