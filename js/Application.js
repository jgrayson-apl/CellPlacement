/*
 Copyright 2022 Esri

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import AppBase from "./support/AppBase.js";
import AppLoader from "./loaders/AppLoader.js";
import SignIn from './apl/SignIn.js';
import ViewLoading from './apl/ViewLoading.js';
import FresnelZoneSketch from './FresnelZone/FresnelZoneSketch.js';

class Application extends AppBase {

  // PORTAL //
  portal;

  constructor() {
    super();

    // LOAD APPLICATION BASE //
    super.load().then(() => {

      // APPLICATION LOADER //
      const applicationLoader = new AppLoader({app: this});
      applicationLoader.load().then(({portal, group, map, view}) => {
        //console.info(portal, group, map, view);

        // PORTAL //
        this.portal = portal;

        // SET APPLICATION DETAILS //
        this.setApplicationDetails({map, group});

        // VIEW SHAREABLE URL PARAMETERS //
        this.initializeViewShareable({view});

        // USER SIGN-IN //
        this.configUserSignIn();

        // APPLICATION //
        this.applicationReady({portal, group, map, view}).catch(this.displayError).then(() => {
          // HIDE APP LOADER //
          document.getElementById('app-loader').toggleAttribute('hidden', true);
        });

      }).catch(this.displayError);
    }).catch(this.displayError);

  }

  /**
   *
   */
  configUserSignIn() {

    const signInContainer = document.getElementById('sign-in-container');
    if (signInContainer) {
      const signIn = new SignIn({container: signInContainer, portal: this.portal});
    }

  }

  /**
   *
   * @param view
   */
  configView({view}) {
    return new Promise((resolve, reject) => {
      if (view) {
        require([
          'esri/core/reactiveUtils',
          'esri/widgets/Popup',
          'esri/widgets/Home',
          'esri/widgets/Search',
          'esri/widgets/LayerList',
          'esri/widgets/BasemapLayerList',
          'esri/widgets/Legend'
        ], (reactiveUtils, Popup, Home, Search, LayerList, BasemapLayerList, Legend) => {

          // VIEW AND POPUP //
          view.set({
            constraints: {snapToZoom: false},
            popup: new Popup({
              dockEnabled: true,
              dockOptions: {
                buttonEnabled: false,
                breakpoint: false,
                position: "top-right"
              }
            })
          });

          // SEARCH //
          const search = new Search({view: view});
          view.ui.add(search, {position: 'top-left', index: 0});

          // HOME //
          const home = new Home({view});
          view.ui.add(home, {position: 'top-left', index: 1});

          // BASEMAP LAYER LIST //
          const basemapReferenceLayerList = new BasemapLayerList({
            container: 'basemap-reference-layers-container',
            view: view,
            visibleElements: {
              referenceLayers: true,
              baseLayers: false,
              errors: true,
              statusIndicators: true
            }
          });

          // LAYER LIST //
          const layerList = new LayerList({
            container: 'layers-container',
            view: view,
            visibleElements: {
              errors: true,
              statusIndicators: true
            }
          });

          // BASEMAP LAYER LIST //
          const basemapBaseLayerList = new BasemapLayerList({
            container: 'basemap-base-layers-container',
            view: view,
            visibleElements: {
              referenceLayers: false,
              baseLayers: true,
              errors: true,
              statusIndicators: true
            }
          });

          // LEGEND //
          const legend = new Legend({
            container: 'legend-container', view: view  //basemapLegendVisible: true
          });
          //view.ui.add(legend, {position: 'bottom-left', index: 0});

          // VIEW LOADING INDICATOR //
          const viewLoading = new ViewLoading({view: view});
          view.ui.add(viewLoading, 'bottom-right');

          resolve();
        });
      } else { resolve(); }
    });
  }

  /**
   *
   * @param portal
   * @param group
   * @param map
   * @param view
   * @returns {Promise}
   */
  applicationReady({portal, group, map, view}) {
    return new Promise(async (resolve, reject) => {
      // VIEW READY //
      this.configView({view}).then(() => {

        this.initializeCellPlacement({view});

        resolve();
      }).catch(reject);
    });
  }

  /**
   *
   * @param view
   */
  initializeCellPlacement({view}) {
    require([
      'esri/core/reactiveUtils',
      'esri/geometry/support/meshUtils'
    ], (reactiveUtils, meshUtils) => {

      const operationalLayers = view.map.layers.filter(layer => {
        const {type, geometryType} = layer;
        return (type === 'scene') && (geometryType === 'mesh');
      });
      //console.info(operationalLayers);

      //this.initializeSketch({view, operationalLayers});


      const fresnelZoneSketch = new FresnelZoneSketch({view});
      fresnelZoneSketch.load().then(() => {
        console.info('Loaded....');
      });
      view.ui.add(fresnelZoneSketch, 'top-right');

      let _meshSampler = null;
      /*reactiveUtils.on(() => view, 'pointer-move', pointerEvt => {
       if (_meshSampler) {
       const pointOnMesh = _meshSampler.queryElevation(view.toMap(pointerEvt));
       const {x, y, z} = pointOnMesh;
       console.info(x, y, z);
       }
       });*/

      /*reactiveUtils.on(() => view, 'click', pointerEvt => {
       view.hitTest(pointerEvt, {include: operationalLayers}).then(({results}) => {
       const meshFeature = results[0]?.graphic;
       if (meshFeature) {

       const meshOIDField = meshFeature.layer.objectIdField;
       const meshOID = meshFeature.attributes[meshOIDField];

       const meshQuery = meshFeature.layer.createQuery();
       meshQuery.set({
       //where: `(${ meshOIDField } = ${ meshOID })`,
       objectIds: [meshOID],
       outFields: ["*"],
       outSpatialReference: view.spatialReference,
       returnGeometry: true
       });
       //console.info(meshQuery);

       meshFeature.layer.queryFeatures(meshQuery).then((meshFS) => {
       const geometry = meshFS.features[0]?.geometry;
       geometry?.load().then(() => {
       console.info(meshFeature.layer.title, geometry);

       const mesh = geometry.clone();
       mesh.transform.scale = [0.75, 0.75, 1.001];

       view.graphics = [{
       geometry: mesh,
       symbol: {
       type: 'mesh-3d',
       symbolLayers: [
       {
       type: 'fill',
       material: {
       color: [255, 0, 0, 0.5]
       },
       edges: {
       type: "solid",
       size: 1.2,
       color: [255, 255, 255, 0.5]
       }
       }
       ]
       }
       }];

       meshUtils.createElevationSampler(mesh).then((elevationSampler) => {
       _meshSampler = elevationSampler;
       });

       });
       });
       } else {
       _meshSampler = null;
       view.graphics = [];
       }
       });
       });*/

    });
  }

  initializeSketch({view, operationalLayers}) {
    return new Promise((resolve, reject) => {
      require([
        'esri/core/reactiveUtils',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Sketch'
      ], (reactiveUtils, GraphicsLayer, Sketch) => {

        const sketchLayer = new GraphicsLayer({
          title: 'Sketch Layer',
          elevationInfo: {mode: "absolute-height"}
        });
        view.map.add(sketchLayer, 0);

        const sketch = new Sketch({
          container: document.getElementById('sketch-container'),
          view: view,
          layer: sketchLayer,
          availableCreateTools: ['polyline'],
          creationMode: 'update',
          defaultCreateOptions: {mode: 'click', hasZ: true},
          defaultUpdateOptions: {tool: 'reshape', enableZ: true, toggleToolOnClick: false, multipleSelectionEnabled: false, enableRotation: false, enableScaling: false},
          labelOptions: {enabled: true},
          snappingOptions: {
            enabled: true,
            selfEnabled: true,
            featureEnabled: true,
            //distance: 10,
            featureSources: operationalLayers.map(layer => {return {layer, enabled: true};})
          }
        });
        sketch.when(() => {

          sketch.viewModel.set({
            pointSymbol: {
              type: 'point-3d',
              symbolLayers: [{
                type: "object",
                width: 0.5, depth: 0.5, height: 1.5,
                resource: {primitive: "diamond"},
                material: {color: "gold"}
              }]
            }
          });

          resolve();
        }, reject).catch(reject);

      });
    });
  }

}

export default new Application();
