import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataRelService} from "../../../services/relational/data-rel.service";
import {D3Node} from "../../../model/node";
import {D3NodeInterface} from "../../../model/d3NodeInterface";

@Component({
  selector: 'vis-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class CirclesComponent implements OnInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: Array<any>;
  private factorWhenToLoadNewData = 0.6; // caclulates diamater * factorWhenToLoadNewData
  private chart: any;
  private width: number;
  private height: number;
  public selectedData: D3NodeInterface;
  public focusedNodesLadder = [];

  constructor(private relData: DataRelService) {
  }

  ngOnInit() {
    this.createCircles();
  }

  //ngOnChanges() {}

  createCircles() {
    let element = this.chartContainer.nativeElement; // Direkter link auf chart
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;

    let svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);
    // Hinzufügen, und selekteieren (append) von setzen von width & height (attr)
    let diameter = +svg.attr("width");
    let radius = diameter / 2;
    let diameterMinus = diameter * this.factorWhenToLoadNewData;
    console.log(diameterMinus)
    let g = svg.append("g").attr("transform", "translate(" + radius + "," + radius + ")"); // Rücken in die mitte

    let fontSize = d3.interpolateNumber(2, 20);
    // let color = (d3.scaleLinear()
    //   .domain([-1, 5]) as any)
    //   .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"]) // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    //   .interpolate(d3.interpolateHcl); // Ne farbe in nem kontinurierlichen Spektrum  https://github.com/d3/d3-scale/blob/master/README.md#scaleLinear

    let pack = d3.pack()
      .size([diameter, diameter]);
    //.padding(2); // Erstellt packlayout, aber noch nix drin

    let root; // Root node
    this.relData.getRoot().then((rootObject) => {
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
        mouseoveredCircle, mouseoveredCircleSelection,
        currentDepth = 0;
      this.focusedNodesLadder.push(root);

      // START seamless zoom
      let transform = {k: 1};
      let transform0 = {k: 1};
      let translate = (transform) => {
        //g.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
        node.attr("transform", function (d: any) { // Translate everything
          return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
        });
        circle.attr("r", function (d: any) { // Radius of everything
          return d.r * transform.k;
        });

        if (mouseoveredCircleSelection) {
          mouseoveredCircleSelection.style("fill-opacity", function (e: any) { // Do zoom effect
            //console.log(e.data.name)
            if (e == mouseoveredCircle) {
              return (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) - 0.1
            } else {
              return 1;
            }
          });
        }

        adjustFontSizeForCurrentFocus();

        transform0 = transform;

      };


      // START Adjust font size
      let adjustFontSizeForCurrentFocus = () =>{

        let currentText = text.filter(function (d: any) {
          return d.parent == focus;
        });

        currentText
          .each(function(d , i) {
            let sel = d3.select(this);
            sel.style("font-size", function (d : any) { // Do font of icons
              let size;
              if (sel.attr("class") == "icon") {
                size = d.r * transform.k / 3;
              } else {
                size = d.r * transform.k / (d.data.name.length + 3);
              }
              size *= 10 / 2;
              size += 1;
              // if (sel.attr("class") != "icon") {
              //   console.log(Math.round(size))
              // }

              return Math.round(size) + 'px';
            });

          })

        // currentText.filter(".icon")
        //   .style("font-size", function (d) { // Do font of icons
        //     var size = d.r * transform.k / 3;
        //     size *= 10 / 2;
        //     size += 1;
        //     return Math.round(size) + 'px';
        //   })
        //
        // currentText.filter(".label")
        //   .style("font-size", function (d) { // Do font of icons
        //     //console.log(d)
        //     var size = d.r * transform.k / (d.data.name.length + 3);
        //     size *= 10 / 2;
        //     size += 1;
        //     return Math.round(size) + 'px';
        //   })
      };
      // END Adjust font size

      let zoomStartEnd = () => {
        if (d3.event) transform = d3.event.transform;
        if (!transform) return;

        let zoomFactor = transform.k;
        // g.selectAll("text").style("font-size",  (d: any) => {
        //   return fontSize((10 - (radius / (d.r * zoomFactor))) / 10);
        // })

        // Decide if loading new data
        let d: any = mouseoveredCircle;
        // Functions
        let focusNode = (d): Promise<boolean> => {
          if (focus != d) {
            console.log("focus ", d.data.name);
            if (d.depth > currentDepth) { // go in
              this.focusedNodesLadder.push(d);
            } else if (d.depth == currentDepth) { // stay same level
              this.focusedNodesLadder.pop();
              this.focusedNodesLadder.push(d);
            } else { // go out
              this.focusedNodesLadder.pop();
            }
            focus = d;
            mouseoveredCircle = null;
            currentDepth = d.depth;
            return new Promise<any>((resolve) => {
              resolve(true);
            });
          } else {
            return new Promise<any>((resolve) => {
              resolve(false);
            });
          }
        };

        // Remove child node
        let removeChildNodesOfNode = (parent, depth) => {
          if (parent && depth > 1) { // Always keep first 2 layers
            console.log("removeing children " + parent.parent.data.name);
            let removeChidren = (node) => { // Actual removal function
              for (let child of node.children) { // Remove all from this layer
                if (child.children && child.children.length != 0) {
                  console.log("removing " + child.data.name);
                  removeChidren(child);
                  nodes = nodes.filter(function (elem) {
                    return child.children.indexOf(elem) === -1;
                  });
                  child.data.children = null;
                  child.data.didLoadChildren = false;
                  child.children = null; // Das hier ist nicht genug, es müssen auch die kindeskinder gelöscht werden, da sonst die size von Ihnen mit reingerechnet wird

                }
              }
            };
            removeChidren(parent); // Actual removal function

            // nodes = nodes.filter( function ( elem ) {
            //   return parent.children.indexOf( elem ) === -1;
            // });
            // parent.data.didLoadChildren = false;
            // parent.children = [];
            text.remove();

            makeCirclesAndText(nodes);
            translate(transform);
          }
        };

        // Function if node d is big enough
        let isNear = (d) => {
          return d.r * 2 * zoomFactor > diameterMinus;
        };

        // check if mouseover node is near enought to focus
        if (!d) {
          // Noting
        }
        else if (isNear(d)) {
          if (focus != d) {
            console.log("focus near");
            // if (d.depth != currentDepth) {
            //   removeChildNodesOfNode(focus, focus.depth);
            // }
            // lade daten weil nah
            focusNode(d).then((didFocus) => {
              if (didFocus) {
                loadDataForNode(d).then(() => {
                  transitionText();
                });
              }
            });

          } else {
            console.log("not focussing because already focused");
          }
        } else if (!isNear(d)) { // check if parent is on same level as now and focus if so
          if (d.parent.depth == currentDepth) {
            focusNode(d.parent).then((didFocus) => {
              if (didFocus) {
                console.log("focusing parent on same level as currentdeopth")
                loadDataForNode(focus).then(() => {
                  transitionText();
                });
              }
            });
          }

        }
        // else if ((focus != d.parent) && isNear(d.parent)) { // make sure that parent is focused
        //   console.log("same layer")
        //   // Lade auf selber ebene
        //   //removeChildNodesOfNode(focus)
        //   focusNode(d.parent);
        //   loadDataForNode(d.parent).then(() => {
        //     transitionText(focus);
        //   });
        // }
        // Check zoomed out of focus
        if (!isNear(focus)) { // is not big enough
          if (focus.parent) {

            console.log("zooming out");
            //let focus0 = focus.parent;
            focusNode(focus.parent).then((didFocus) => {
              transitionText();
              //removeChildNodesOfNode(focus0.parent, focus0.depth);
            })

          }

        }
      };

      let zoomed = () => {
        if (d3.event) transform = d3.event.transform;
        if (!transform) {
          console.log("no transofrm")
          return;
        }
        translate(transform);
        zoomStartEnd();
      };
      // END seamless zoom


      // START Mouseover
      let mouseover = (d: any) => {
        if (d.depth == currentDepth + 1 || d.depth == currentDepth) {
          // if (d.parent != focus) {
          //   mouseoveredCircle = d.parent;
          // } else {

          // }
          // console.log(d.data.name)
          mouseoveredCircleSelection = circle.filter(function (e: any) {
            return e == mouseoveredCircle || e == d;
          })
          mouseoveredCircleSelection.style("fill-opacity", function (e: any) {
            //console.log(e.data.name)
            if (e == d) {
              return (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) - 0.1
            } else {
              return 1;
            }
          });
          mouseoveredCircle = d;

          d3.event.stopPropagation();
        } else if (d.parent) {
          mouseover(d.parent);
        }
      };
      // END Mouseover

      let isInFocusLadder = (d) => {
        return this.focusedNodesLadder.indexOf(d) != -1;
      }

      // START Transition of text
      let transitionText = () => {
        // text.filter(".label") // TEXT
        // // .filter(function (d: any) {
        // //   return d.parent == focus || d == focus || isInFocusLadder(d); // old  d.depth === currentDepth + 1
        // // })
        // //   .style("fill-opacity", function (d: any) {
        // //     //console.log("node ", d.data.name, _dhis.focusedNodesLadder.indexOf(d) != -1)
        // //     return (d.parent == focus && !isInFocusLadder(d)) ? 1 : 0;
        // //   })
        //   .style("display", function (d: any) {
        //     //console.log("node ", d.data.name, _dhis.focusedNodesLadder.indexOf(d) != -1)
        //     return (d.parent == focus && !isInFocusLadder(d)) ? "inline" : "none";
        //   });
        text.each(function(d, i) {
            d3.select(this).style("display", function (d: any) { // Only show curremtdepth -1 & +1
              return (d.parent == focus) || (d.depth == currentDepth && d != focus) ? "inline" : "none";
              //return (d.depth >= currentDepth - 2 ) && (d.depth <= currentDepth + 1 ) ? "inline" : "none"; // TODO: Kommt auch woanders hin?
            })
          });
          // .filter(".icon") // ICONS


        adjustFontSizeForCurrentFocus();
        // .filter(function (d: any) {
        //   return d.parent == focus || d == focus; // old  d.depth === currentDepth + 1
        // })
        // .on("start", function (d: any) {
        //
        // })
        // .on("end", function (d: any) {
        //   if (_dhis.focusedNodesLadder.indexOf(d) != -1) this.style.display = "none";
        // });

        // circle.transition()
        //   .filter(function (d: any) {
        //     return d == focus; // old  d.depth === currentDepth + 1
        //   })
        // circle.style("fill", function (d: any) {
        //   return d == focus ? "red" : d.data.color();
        // });

        circle
          .style("display", function (d: any) { // Only show curremtdepth -1 & +1
            return (d.parent == focus) || ((d.depth >= currentDepth - 2 ) && (d.depth <= currentDepth)) ? "inline" : "none";
          });

        // circle.exit().remove();
        //text.exit().remove();
        // icons = g.selectAll("icons")
        //   .style("fill-opacity", function (d: any) {
        //     return d.parent === root ? 1 : 0;
        //   })
        //   .style("display", function (d: any) {
        //     return d.parent === root ? "inline" : "none";
        //   })
      };
      // END Transition of text

      //START Make circles enter
      let makeCirclesAndText = (nodes: any) => {
        circle = g.selectAll("circle")
          .data(nodes, (d: any) => {
            return d.data.id()
          });
        circle.enter().append("circle")
          .attr("class", function (d: any) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
          })
          .on("click", (d) => {
            if (focus !== d) {
              this.selectedData = d.data;
            }
            d3.event.stopPropagation();
          })
          .on("mouseover", function (d: any) {
            mouseover(d);
          })
          .on("mousemove", function (d: any) {
            mouseover(d)
          })
          // .style("fill-opacity", 0)
          //.transition().duration(2000)
          .style("fill-opacity", 1)
          .style("fill", function (d: any) {
            return d.data.color();
          })
        //.transition()
        ;

        //circle.exit().remove();
        circle = g.selectAll("circle");

        text = g.selectAll("text")
          .data(nodes, (d: any) => {
            return d.data.id();
          })
        text.enter().append('text')
          .attr("class", "icon")

          .text(function (d) {
            return '\uf118'
          });
        text.enter().append("text")
          .attr("class", "label")
          .style("fill-opacity", function (d: any) {
            return 1;
          })
          .style("display", "inline")
          // .style("font-size",  (d: any) => {
          //   return fontSize((100 - this.width / d.r) / 100);
          // })
          .text(function (d: any) {
            //console.log(d)
            return d.data.name;// + " d:" + d.depth;
          });

        //text.exit().remove();
        text = g.selectAll("text");

        // icons = g.selectAll("icons")
        //   .data(nodes, (d:D3NodeInterface)=> {return d.data.id()})
        //   .enter().append('text')
        //   .attr("class", "icon")
        //   .style("fill-opacity", function (d: any) {
        //     return d.parent === root ? 1 : 0;
        //   })
        //   .style("display", function (d: any) {
        //     return d.parent === root ? "inline" : "none";
        //   })
        //   .text(function(d) { return '\uf118' });
        // icons.exit().remove()
        node = g.selectAll("circle,text");

        // This needs to happen
      };
      // END make circles enter


      let circle, text, node;// icons;
      //focus = root;
      makeCirclesAndText(nodes);
      transitionText();

      svg
        .style("background", "white") // background color of svg
        .on("click", function () {
          // TODO: Zoom out
        });

      let d3zoom = d3.zoom()
        .scaleExtent([0.9, Infinity])
        .on("zoom", zoomed);
      //.on("end", zoomStartEnd);
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
              let curChildnode;
              for (let i = 1; i < nodes.length; i++) {
                curChildnode = nodes[i];
                curChildnode.x = curChildnode.x - nodes[0].x + d3NodeParentElement.x;
                curChildnode.y = curChildnode.y - nodes[0].y + d3NodeParentElement.y;
                curChildnode.depth = d3NodeParentElement.depth + 1;
                curChildnode.parent = d3NodeParentElement;
              }
              nodes.splice(0, 1);


              return nodes;
            };
            // END virtual nodes

            // START add nodes
            let virtualNodes = virtualNodesByParentNode(d, children);
            d.children = virtualNodes;
            nodes.push.apply(nodes, virtualNodes);
            //text.remove();
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
          return new Promise<any>((resolve) => {
            resolve(true);
          });
        }
      };

      /**
       * Zoom to node d
       * @param d
       */
      let zoom = (d) => {
        //let focus0 = focus;
        focus = d;

        // START The zoom
        let transition = d3.transition("bla")
          .duration(750)
          .tween("zoom", function () {
            let i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]); // was focus.r * 2 + margin
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

      // START Old zoom
      function zoomTo(v) { // v ) [x,y, diameter] of circle
        let k = diameter / v[2]; // Fa
        view = v;
        node.attr("transform", function (d: any) {
          return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d: any) {
          return d.r * k;
        });
      }

      // END Old zoom
    });
  }

}
