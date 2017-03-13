import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataRelService} from "../../../services/relational/data-rel.service";
import {D3Node} from "../../../model/node";

@Component({
  selector: 'vis-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class CirclesComponent implements OnInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: Array<any>;
  private factorWhenToLoadNewData = 6; // caclulates diamater / factorWhenToLoadNewData
  private chart: any;
  private width: number;
  private height: number;

  constructor(private relData: DataRelService) {
  }

  ngOnInit() {
    //this.createChart();
    this.createCircles();
    // if (this.data) {
    //   this.updateChart();
    // }
  }

  ngOnChanges() {
  }

  createCircles() {
    let element = this.chartContainer.nativeElement; // Direkter link auf chart
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;
    console.log(this.width)

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);
    // Hinzufügen, und selekteieren (append) von setzen von width & height (attr)
    let diameter = +svg.attr("width");
    let radius = diameter / 2;
    let g = svg.append("g").attr("transform", "translate(" + radius + "," + radius + ")"); // Rücken in die mitte

    let fontSize = d3.interpolateNumber(10, 20);
    // let color = (d3.scaleLinear()
    //   .domain([-1, 5]) as any)
    //   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"]) // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    //   .interpolate(d3.interpolateHcl); // Ne farbe in nem kontinurierlichen Spektrum  https://github.com/d3/d3-scale/blob/master/README.md#scaleLinear

    let pack = d3.pack()
      .size([diameter, diameter])
    //.padding(2); // Erstellt packlayout, aber noch nix drin


    this.relData.getRoot().then((rootObject) => {
      //if (error) throw error;
      var root;
      root = d3.hierarchy(rootObject) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
        .sum(function (d: any) {
          return d.size;
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });

      let focus = root,
        nodes: any = pack(root).descendants(), // pack(root) Legt die kreise aus, verteilt x,y koordinaten und radius; descendants: array of descendant nodes
        view,
        mouseoveredCircle,
        currentDepth = 0;

      // START seamless zoom
      let transform = null;
      let zoomed = () => {
        if (d3.event) transform = d3.event.transform;
        if (!transform) return;
        //g.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
        node.attr("transform", function (d: any) {
          return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
        });
        circle.attr("r", function (d: any) {
          return d.r * transform.k;
        });
        g.selectAll("text").style("font-size",  (d: any) => {
          if (d.data.name == "Nachwuchsfoerderungen") {
            console.log(fontSize((100 - this.width / (d.r * zoomFactor)) / 100))
            console.log(fontSize((100 - this.width / (d.r )) / 100))
            console.log(fontSize((100 - this.width ) / 100))
            console.log(fontSize(1));


          }
          return fontSize((100 - this.width / (d.r * zoomFactor)) / 100);
        })


        // Decide if loading new data
        let d: any = mouseoveredCircle;
        if (!d) {
          console.log("no mouseover circle")
          return;
        };
        // Erst den focus machen (Unabhängig von der größe des mouseovers)
        let zoomFactor = transform.k;
        let focusNode = (d) => {
          console.log("focus ", d.data.name)
          if (focus != d) {
            focus = d;
            currentDepth = d.depth;
          }
        }
        if (d.r * zoomFactor > diameter / this.factorWhenToLoadNewData) { // check if mouseover node is near enought
          // lade daten weil nah
          focusNode(d);
          loadDataForNode(d).then(() => {
            transitionText(focus);
          });

        } else if ((focus != d.parent) && d.parent.r * zoomFactor > diameter / this.factorWhenToLoadNewData){ // make sure that parent is focused
            focusNode(d.parent);
            loadDataForNode(d.parent).then(() => {
              transitionText(focus);
            });
        }

        // Check transition into focus
        if (focus.r * zoomFactor < diameter / this.factorWhenToLoadNewData) { // is not big enough
          console.log("no big")
          focus = d.parent;
          currentDepth = focus.depth;
          transitionText(focus)
        }

      };

      // END seamless zoom
      let mouseover = (d: any) => {
        if (d.depth == currentDepth + 1 || d.depth == currentDepth) {
          mouseoveredCircle = d;
          circle = g.selectAll("circle").style("fill", function (e: any) {
            return e == d ? "orange" : e.data.color();
          });
          d3.event.stopPropagation();
        } else if (d.parent) {
          mouseover(d.parent);
        }
      };

      // START Transition of text
      let transitionText = (d) => {
        let transition = d3.transition("Text").duration(750);
        transition.selectAll("text")
          .filter(function (d: any) {
            return d.parent == focus || this.style.display === "inline"; // old  d.depth === currentDepth + 1
          })
          .style("fill-opacity", function (d: any) {
            return d.parent == focus ? 1 : 0;
          })
          .on("start", function (d: any) {
            if (d.parent == focus) this.style.display = "inline";
          })
          .on("end", function (d: any) {
            if (d.parent !== focus) this.style.display = "none";
          });

        circle = g.selectAll("circle")
          .style("fill", function (d: any) {
            return d == focus ? "red" : d.data.color();
          })
          .style("display", function (d: any) { // Only show curremtdepth -1 & +1
            return (d.depth >= currentDepth - 1 ) && (d.depth <= currentDepth + 1 ) ? "" : "none"; // TODO: Kommt auch woanders hin?
          })
      };
      // END Transition of text

      //START Make circles enter
      let makeCirclesAndText = (nodes: any) => {
        circle = g.selectAll("circle")
          .data(nodes)
          .enter().append("circle")
          .attr("class", function (d: any) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
          })
          .style("fill", function (d: any) {
            return d.data.color();
          })
          .on("click", function (d) {
            if (focus !== d) loadDataForNode(d);
            d3.event.stopPropagation();
          })
          .on("mouseover", function (d: any) {
            mouseover(d);
          })
        // .on("mousemove", function (d: any) {
        //   mouseover(d)
        // });
        ;
        text = g.selectAll("text")
          .data(nodes)
          .enter().append("text")
          .attr("class", "label")
          .style("fill-opacity", function (d: any) {
            return d.parent === root ? 1 : 0;
          })
          .style("display", function (d: any) {
            return d.parent === root ? "inline" : "none";
          })
          .style("font-size",  (d: any) => {
            return fontSize((100 - this.width / d.r) / 100);
          })
          .text(function (d: any) {
            return d.data.name;// + " d:" + d.depth;
          });

        node = g.selectAll("circle,text");
      }
      // END make circles enter

      var circle, text, node;
      makeCirclesAndText(nodes);

      svg
        .style("background", "white") // background color of svg
        .on("click", function () {
          // TODO: Zoom out
        });

      let d3zoom = d3.zoom()
        .on("zoom", zoomed);
      svg.call(d3zoom);


      zoomTo([root.x, root.y, root.r * 2]);


      let loadDataForNode = (d): Promise<any> => {
        if (!d.data.didLoadChildren) {
          //console.log("No children, loading.");
          let dataObject = d.data as D3Node;
          return dataObject.loadChildren().then((children) => {
            d.children = children;
            // START virtual nodes
            // http://stackoverflow.com/questions/29387379/inserting-nodes-into-d3-pack-layout-pagination-on-zoom
            // http://fiddle.jshell.net/wfvwgqb9/2/
            let virtualNodesByParentNode = (d3NodeParentElement, nodeChildrenElementArray) => {
              //root.children[0].children[0].children = subnode_subnodes; already happened
              // we need to do this because otherwise, the parent node object will be changed
              let d3NodeParentElementClone = Object.assign(Object.create(d3NodeParentElement), d3NodeParentElement);
              // Mach mir nen pack
              let pack = d3.pack()
                .size([d3NodeParentElementClone.r * 2, d3NodeParentElementClone.r * 2]); // -1 is important to avoid edge overlap

              d3NodeParentElementClone.children = nodeChildrenElementArray;

              d3NodeParentElementClone = d3.hierarchy(d3NodeParentElementClone) // Macht ne hierachie aus den daten/Erweitert daten mit werten wie data,depth, height, parent usw
                .sum(function (d: any) {
                  return d.size;
                })
                .sort(function (a, b) {
                  return b.value - a.value;
                });

              let nodes = pack(d3NodeParentElementClone).descendants();
              // absolute x,y coordinates calculation
              var curChildnode;
              for (let i = 1; i < nodes.length; i++) {
                curChildnode = nodes[i];
                curChildnode.x = curChildnode.x - nodes[0].x + d3NodeParentElement.x;
                curChildnode.y = curChildnode.y - nodes[0].y + d3NodeParentElement.y;
                curChildnode.depth = d3NodeParentElement.depth + 1;
                curChildnode.parent = d3NodeParentElement;
              }
              nodes.splice(0, 1);


              return nodes;
            }
            // END virtual nodes

            // START add nodes
            let virtualNodes = virtualNodesByParentNode(d, children);
            d.children = virtualNodes;
            nodes.push.apply(nodes, virtualNodes);
            text.remove();
            makeCirclesAndText(nodes);
            // zoom to current focus again (do the transformation of the updated elements)
            //zoomTo(view);
            zoomed();
            // END add nodes
          }).catch((error) => {
            console.log(error)
          });
        } else {
          //console.log("Already loaded, only zooming");
          return new Promise<any>((resolve, reject) => {
            resolve(true);
          });
        }
      }

      /**
       * Zoom to node d
       * @param d
       */
      let zoom = (d) => {
        let focus0 = focus;
        focus = d;

        // START The zoom
        let transition = d3.transition("bla")
          .duration(750)
          .tween("zoom", function (d) {
            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); // was focus.r * 2 + margin
            return function (t) {
              zoomTo(i(t));
            };
          });

        transition.selectAll("text")
          .filter(function (d: any) {
            return d.parent === focus || this.style.display === "inline";
          })
          .style("fill-opacity", function (d: any) {
            return d.parent === focus ? 1 : 0;
          })
          .on("start", function (d: any) {
            if (d.parent === focus) this.style.display = "inline";
          })
          .on("end", function (d: any) {
            if (d.parent !== focus) this.style.display = "none";
          });
        // END The zoom

      };


      function zoomTo(v) { // v ) [x,y, diameter] of circle
        var k = diameter / v[2]; // Fa
        view = v;
        node.attr("transform", function (d: any) {
          // console.log("translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")");
          // console.log(d)
          // console.log(v)
          return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d: any) {
          return d.r * k;
        });
      }
    });
  }

}
