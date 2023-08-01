/*
 Copyright 2023 Esri

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
/**
 *
 * FresnelZoneSketch
 *  - Element: apl-fresnel-zone-sketch
 *  - Description: Fresnel Zone Sketch
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  7/31/2023 - 0.0.1 -
 * Modified:
 *
 */

class FresnelZoneSketch extends HTMLElement {

  static version = '0.0.1';

  /**
   * @type {HTMLElement}
   */
  container;

  /**
   * @type {SceneView}
   */
  #view;

  /**
   * @type {HTMLElement}
   */
  #sketchContainer;

  /**
   * @type {Sketch}
   */
  #sketch;

  /**
   * @type {boolean}
   */
  #loaded = false;
  get loaded() {
    return this.#loaded;
  }

  set loaded(value) {
    this.#loaded = value;
    this.dispatchEvent(new CustomEvent('loaded', {detail: {}}));
  }

  /**
   *
   * @param {HTMLElement|string} [container]
   * @param {SceneView} view
   */
  constructor({container, view}) {
    super();

    this.container = (container instanceof HTMLElement) ? container : document.getElementById(container);

    this.#view = view;

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.innerHTML = `
      <style>
        @import url(https://js.arcgis.com/4.27/@arcgis/core/assets/esri/themes/light/main.css);
        :host {}              
        :host calcite-block {
          margin-top: 0;
          margin-bottom: 0;
        }
      </style>      
      <calcite-block heading="Fresnel Zone Analysis" description="calculate 5G obstructions" collapsible open>
        <calcite-icon slot="icon" icon="line-of-sight"></calcite-icon>
        <div class="sketch-parent-container"></div>          
      </calcite-block>                                 
    `;

    this.container?.append(this);
  }

  /**
   *
   */
  connectedCallback() {

    this.#sketchContainer = this.shadowRoot.querySelector('.sketch-parent-container');

    // LOADED //
    requestAnimationFrame(() => {
      this.initialize().then(() => {
        this.loaded = true;
      });
    });

  }

  /**
   *
   * @returns {Promise<>}
   */
  load() {
    return new Promise((resolve, reject) => {
      if (this.loaded) { resolve(); } else {
        this.addEventListener('loaded', () => { resolve(); }, {once: true});
      }
    });
  }

  /**
   *
   */
  initialize() {
    return new Promise((resolve, reject) => {
      require([
        'esri/core/reactiveUtils',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Sketch'
      ], (reactiveUtils, GraphicsLayer, Sketch) => {

        const operationalLayers = this.#view.map.layers.filter(layer => {
          const {type, geometryType} = layer;
          return (type === 'scene') && (geometryType === 'mesh');
        });

        const sketchLayer = new GraphicsLayer({
          title: 'Sketch Layer',
          elevationInfo: {mode: "absolute-height"}
        });
        this.#view.map.add(sketchLayer);

        this.#sketch = new Sketch({
          container: this.#sketchContainer,
          //container: document.getElementById('sketch-container'),
          view: this.#view,
          layer: sketchLayer,
          availableCreateTools: ['point', 'polyline'],
          creationMode: 'update',
          defaultCreateOptions: {mode: 'click', hasZ: true},
          defaultUpdateOptions: {too: 'reshape', enableZ: true, toggleToolOnClick: false, multipleSelectionEnabled: false, enableRotation: false, enableScaling: false},
          labelOptions: {enabled: true},
          snappingOptions: {
            enabled: true,
            selfEnabled: true,
            featureEnabled: true,
            //distance: 10,
            featureSources: operationalLayers.map(layer => {return {layer, enabled: true};})
          }
        });
        //this.#view.ui.add(this.#sketch,'top-right')

        this.#sketch.when(() => {

          this.#sketch.viewModel.set({
            pointSymbol: {
              type: 'point-3d',
              symbolLayers: [{
                type: "object",
                width: 0.5, depth: 0.5, height: 1.0,
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

customElements.define("apl-fresnel-zone-sketch", FresnelZoneSketch);

export default FresnelZoneSketch;
