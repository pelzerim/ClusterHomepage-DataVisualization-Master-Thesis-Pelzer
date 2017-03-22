import {Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DataRelService} from "../../../services/relational/data-rel.service";
import {D3Node, EmptyD3Node} from "../../../model/node";
import {D3NodeInterface} from "../../../model/d3NodeInterface";
import {Color} from "../../../model/colors";
import {D3DataService} from "../../../services/dataServiceInterface";

@Component({
  selector: 'vis-circles',
  templateUrl: './circles.component.html',
  styleUrls: ['./circles.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class CirclesComponent implements OnInit {
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: D3DataService;
  private chart: any;
  private width: number;
  public height: number;

  private settings = {
    iconsEnabled : false,
    factorWhenToLoadNewData : 0.3 // caclulates diamater * factorWhenToLoadNewData
  };

  //private selectedData: D3NodeInterface;
  private translate: any;
  //public focusedNodesLadder = [];

  constructor() {
  }

  ngOnInit() {
    this.createCircles();
  }


  //ngOnChanges() {}

  public focusNode(node: any, index: number) {
    console.log("Focus node from outside");

    // node.attr("transform", function (d: any) { // Translate everything
    //   return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
    // });
    // circle.attr("r", function (d: any) { // Radius of everything
    //   return d.r * transform.k;
    // });
    //console.log(node)

    let translate = {
      x: node.x - this.width / 2,
      y: node.y - this.width / 2,
      k: 1
    };

    this.translate(translate);
  }

  createCircles() {
    let element = this.chartContainer.nativeElement; // Direkter link auf chart
    this.width = element.offsetWidth;
    this.height = element.offsetWidth > 600 ? 600 : element.offsetWidth;

     let svg = d3.select(element).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    // Hinzufügen, und selekteieren (append) von setzen von width & height (attr)
    let diameter = +svg.attr("width");
    let radius = diameter / 2;
    let diameterMinus = diameter * this.settings.factorWhenToLoadNewData;
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
    this.data.getRoot().then((rootObject) => {
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
      this.data.currentFocusPath.push(root);

      // START seamless zoom
      let transform = {k: 1};
      let transform0 = {k: 1};

      let translate = (transform) => {
        // current view x center transform.x -radius
        view = [((transform.x- radius) *-1) ,((transform.y -radius) * -1), this.width];
        //g.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
        // let rect = {
        //   x : transform.x *-1 +radius,
        //   y: transform.y *-1 +radius,
        //   width : this.width,
        //   height: this.height
        // }
        // let intersects = ( circle :any,  rect :any) => {
        //   let circleDistance = {x:0,y:0}
        //   circleDistance.x = Math.abs(circle.x - rect.x);
        //   circleDistance.y = Math.abs(circle.y - rect.y);
        //
        //   if (circleDistance.x > (rect.width/2 + circle.r)) { return false; }
        //   if (circleDistance.y > (rect.height/2 + circle.r)) { return false; }
        //
        //   if (circleDistance.x <= (rect.width/2)) { return true; }
        //   if (circleDistance.y <= (rect.height/2)) { return true; }
        //
        //   let cornerDistance_sq = Math.pow((circleDistance.x - rect.width/2), 2) +
        //     Math.pow((circleDistance.y - rect.height/2), 2);
        //
        //   return (cornerDistance_sq <= Math.pow(circle.r, 2));
        // }

        node
          .filter((d : any) => {
            // return intersects(d, rect)
            return  (d.depth >= currentDepth -2 && d.depth <= currentDepth +1) ;
          })
          .attr("transform", function (d: any) { // Translate everything
          return "translate(" + ((transform.x + d.x * transform.k) - radius) + "," + ((transform.y + d.y * transform.k ) - radius) + ")";
        });
        circle
          .filter((d : any) => {
            return d.r * transform.k < this.width + radius || d == focus ||d == focus.parent;
          })
          .attr("r", function (d: any) { // Radius of everything
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
      this.translate = translate;


      // START Adjust font size
      let adjustFontSizeForCurrentFocus = () => {
        let zoomiZoom = () => {
          currentText
            .each(function (d, i) {
              let sel = d3.select(this);
              sel.style("font-size", function (d: any) { // Do font of icons
                let size;
                if (sel.attr("class") == "icon") {
                  size = d.r * transform.k / 4;
                } else {
                  size = d.r * transform.k / (d.data.nameShort().length + 10);
                }
                size *= 10 / 2;
                size += 1;

                // if (sel.attr("class") != "icon") {
                //   console.log(Math.round(size))
                // }
                sel.style("display", function (d) {
                  return size < 5 ? "none" : "inline";
                });
                return Math.round(size) + 'px';
              });

            })
        }

        let currentText = node.selectAll("text").filter(function (d: any) {
          return d != focus && (d.parent == focus || d.parent == focus.parent);
        });
        if (currentText.size() > 300) { // Too many stuff
          // hide parent nodes
          let sel = node.selectAll("text").filter(function (d: any) {
            return d.parent == focus.parent;
          });
          if (sel.size() > 30) { // too many parent nodes
            sel.style("display", "none");
            currentText = node.selectAll("text").filter(function (d: any) {
              return d != focus && (d.parent == focus && d.parent != focus.parent);
            })
            zoomiZoom()
          } else { // nothing we can do
            // do not do icons and lable of current node
            node.selectAll("text").filter(function (d: any) {
              return (d.parent == focus);
            }).style("display", "none");
            currentText = node.selectAll("text").filter(function (d: any) {
              return d != focus && (d.parent == focus.parent);
            });
            zoomiZoom()

          }

        } else {
          zoomiZoom()
        }


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
        if (!transform) {
          console.log("no transform, not zooming")
          return;
        }

        let zoomFactor = transform.k;
        // g.selectAll("text").style("font-size",  (d: any) => {
        //   return fontSize((10 - (radius / (d.r * zoomFactor))) / 10);
        // })

        // Decide if loading new data
        let d: any = mouseoveredCircle;
        // Functions
        let focusNode = (d): Promise<boolean> => {
          if (focus != d && !(d.data instanceof EmptyD3Node)) {
            console.log("focus ", d.data.name, d);
            if (d.depth > currentDepth) { // go in
              this.data.currentFocusPath.push(d);
            } else if (d.depth == currentDepth) { // stay same level
              this.data.currentFocusPath.pop();
              this.data.currentFocusPath.push(d);
            } else { // go out
              this.data.currentFocusPath.pop();
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
          if (parent && depth > 0) { // Always keep first 2 layers
            console.log("removeing children ");
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
            //text.remove();

            makeCirclesAndText(nodes);
            this.translate(transform);
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
            if (d.depth != currentDepth) {
              removeChildNodesOfNode(focus, focus.depth);
            }
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
            let focus0 = focus;
            removeChildNodesOfNode(focus0.parent, focus0.depth);
            focusNode(focus.parent).then((didFocus) => {
              transitionText();

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
        this.translate(transform);
        zoomStartEnd();
      };
      // END seamless zoom


      // START Mouseover
      let mouseover = (d: any) => {
        //console.log("d", d.x * transform.k, d.y * transform.k, d.r * transform.k)
        if (d.depth == currentDepth + 1 || d.depth == currentDepth) {
          // if (d.parent != focus) {
          //   mouseoveredCircle = d.parent;
          // } else {

          // }
          // console.log(d.data.name)

          // START The reinzoomen hitnergundfarbe
          mouseoveredCircleSelection = circle.filter(function (e: any) {
            return e == mouseoveredCircle || e == d;
          });
          mouseoveredCircleSelection.style("fill-opacity", function (e: any) {
            //console.log(e.data.name)
            if (e == d) {
              return (((100 / diameterMinus) * (e.r * transform.k * 2)) / 100) - 0.1
            } else {
              return 1;
            }
          });
          // END The reinzoomen hitnergundfarbe


          // START Mouseover text anzeigen
          let reclacIconSize = (selection) => {
            selection.style("font-size", function (d: any) { // Do font of icons
              let size;
              size = d.r * transform.k / 4;
              size *= 10 / 2;
              size += 1;
              return Math.round(size) + 'px';
            });
          }

          if (mouseoveredCircle && mouseoveredCircle["oldState"]) {
            let oldSelText = d3.select("#text-" + mouseoveredCircle.data.id())
            oldSelText.style("display", mouseoveredCircle["oldState"].textDisplay);
            oldSelText.style("font-size", mouseoveredCircle["oldState"].textFontSize);
            if(this.settings.iconsEnabled) {
              let oldSelIcon = d3.select("#icon-" + mouseoveredCircle.data.id())
              oldSelIcon.style("display", mouseoveredCircle["oldState"].iconDisplay);
              reclacIconSize(oldSelIcon);
            }

            mouseoveredCircle["oldState"] = undefined;
          }


          let oldState;
          if (d != focus && d.depth == currentDepth + 1) {
            //console.log(d.data.name + " " + focus.data.name)
            let selectedText = d3.select("#text-" + d.data.id());
            let selectedIcon = d3.select("#icon-" + d.data.id());
            oldState = {
              textDisplay: selectedText.style("display"),
              textFontSize: selectedText.style("font-size")

            }
            if (this.settings.iconsEnabled) {
              oldState["iconDisplay"] = selectedIcon.style("display")
            }
            //console.log(d.data.name)


            selectedText.style("display", "inline");
            selectedText.style("font-size", function (d) {
              let oldFontSize = selectedText.style("font-size");
              let fs = 20;
              if (+oldFontSize.replace("px", "") < fs) { // Should not make it smaller
                return fs + "px";
              }
              return oldFontSize;
            });


            if (this.settings.iconsEnabled) {
              selectedIcon.style("display", "inline");
              reclacIconSize(selectedIcon);
            }


          }
          mouseoveredCircle = d;
          if (oldState) mouseoveredCircle["oldState"] = oldState;
          // END Mouseover text anzeigen

          // START Never show focused text you fuckface
          d3.select("#text-" + focus.data.id()).style("display", "none");
          if (this.settings.iconsEnabled) d3.select("#icon-" + focus.data.id()).style("display", "none");
          // END Never show focused text

          d3.event.stopPropagation();
        } else if (d.parent) {
          mouseover(d.parent);
        }
      };
      // END Mouseover

      let isInFocusLadder = (d) => {
        return this.data.currentFocusPath.indexOf(d) != -1;
      };

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

        g.selectAll("text").each(function (d, i) {
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


        node
          .style("display", function (d: any) { // Only show curremtdepth -1 & +1
            return (d.parent == focus) || ((d.depth >= currentDepth - 2 ) && (d.depth <= currentDepth)) ? "inline" : "none";
          });

        // circle.exit().remove();
        // text.exit().remove();
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

        let container = g.selectAll("g").data(nodes, (d: any) => {
          return d.data.id()
        });

        let containerEnter = container.enter().append("g");
        // circle = g.selectAll("circle")
        //   .data(nodes, (d: any) => {
        //     return d.data.id()
        //   });
        circle = containerEnter.append("circle")
          .attr("class", function (d: any) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
          })
          .attr("id", function (d, i) {
            return "circle-" + d.data.id();
          })
          .on("click", (d) => {
            zoom(d)
              this.data.currentSelectedData = d.data;
              this.data.currentSelectedData.loadInformation().then((infos) => {
              });

            d3.event.stopPropagation();
          })
          .on("mouseover", function (d: any) {
            mouseover(d);
          })
          .on("mousemove", function (d: any) {
            mouseover(d)
          })
          // .style("fill3-opacity", 0)
          //.transition().duration(2000)
          .style("fill-opacity", 1)
          .style("fill", function (d: any) {
            return d.data.color();
          });

        //.transition()


        container.exit().remove();
        circle = g.selectAll("circle");

        // text = g.selectAll("text")
        //   .data(nodes, (d: any) => {
        //     return d.data.id();
        //   })

        if (this.settings.iconsEnabled) {
          containerEnter.append('text')
            .attr("class", "icon")
            .attr("id", function (d, i) {
              return "icon-" + d.data.id();
            })
            .style("fill", function (d) {
              return Color.colorIconForTable(d.data.tableName)
            })
            .style("display", "inline")
            .text(function (d) {
              return DataRelService.iconForTableName[d.data.tableName];
            });
        }

        containerEnter.append("text")
          .attr("class", "label")
          .attr("id", function (d, i) {
            return "text-" + d.data.id();
          })
          .style("fill-opacity", function (d: any) {
            return 1;
          })
          .style("display", "inline")
          // .style("font-size",  (d: any) => {
          //   return fontSize((100 - this.width / d.r) / 100);
          // })
          .text(function (d: any) {
            //console.log(d)
            return d.data.nameShort();// + " d:" + d.depth;
          });


        //text.exit().remove();
        //text = g.selectAll("text");

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
        //node = g.selectAll("circle,text");
        node = g.selectAll("g");
        // .filter(function (d: any) {
        //   return (d.parent == focus ||d.parent == focus.parent);
        // });
        console.log("current nodes", node.size())
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
        .on("zoom", () => {
          zoomed();
        })
        // .on("end", () => {
        //   zoomStartEnd();
        // });
      svg.call(d3zoom);
      svg.on("wheel", function() { d3.event.preventDefault(); });


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
                .size([d3NodeParentElementClone.r * 2 - (d3NodeParentElementClone.r * 2 * .1), d3NodeParentElementClone.r * 2 - (d3NodeParentElementClone.r * 2 * .1)])
                //.padding(1); // -1 is important to avoid edge overlap

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
