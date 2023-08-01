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
 * FresnelZone
 *  - Fresnel Zone
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  7/28/2023 - 0.1.0 -
 * Modified:
 *
 */

import FresnelZoneGraphic from './FresnelZoneGraphic.js';

class FresnelZone extends EventTarget {

  static version = '0.1.0';

  /**
   * @type {string}
   */
  #zoneID;

  /**
   *
   * @return {string}
   */
  get id() {
    return this.#zoneID;
  }

  /**
   * @type {esri/views/SceneView}
   */
  #view;

  /**
   * @type {FresnelZoneLayer}
   */
  #layer;

  /**
   * @type {FresnelZoneGraphic}
   */
  #graphic;

  /**
   * @type {esri/geometry/Point}
   */
  #start;

  /**
   *
   * @param {esri/geometry/Point} value
   */
  set start(value) {
    this.#start = value;
    this._updateGeometry();
  }

  /**
   *
   * @return {esri|geometry|Point}
   */
  get start() {
    return this.#start;
  }

  /**
   * @type {esri/geometry/Point}
   */
  #end;

  /**
   *
   * @param {esri|geometry|Point} value
   */
  set end(value) {
    this.#end = value;
    this._updateGeometry();
  }

  /**
   *
   * @return {Point}
   */
  get end() {
    return this.#end;
  }

  /**
   * @type {Polyline}
   */
  #centerline;

  /**
   *
   * @return {Polyline}
   */
  get centerline() {
    return this.#centerline;
  }

  /**
   * @type {Mesh}
   */
  #geometry;

  /**
   *
   * @return {Mesh}
   */
  get geometry() {
    return this.#geometry;
  }

  /**
   *
   * @param {SceneView} view
   * @param {FresnelZoneLayer} layer
   */
  constructor({view, layer}) {
    super();

    this.#zoneID = FresnelZone.createGUID({});

    this.#view = view;
    this.#layer = layer;

    this.#graphic = new FresnelZoneGraphic({layer, fresnelZone: this});

  }

  /**
   *
   * @private
   */
  _updateGeometry() {
    require([
      'esri/core/reactiveUtils',
      'esri/geometry/Polyline'
    ], (reactiveUtils, Polyline) => {

      if (this.#start && this.#end) {

        this.#centerline = new Polyline({
          spatialReference: this.#view.spatialReference, hasZ: true,
          paths: [[[this.#start.x, this.#start.y, this.#start.z], [this.#end.x, this.#end.y, this.#end.z]]]
        });

        //this.#geometry =  new Mesh({
        //  spatialReference: this.observer.spatialReference,
        //  vertexAttributes: { position: positions },
        //  components: components
        //});

      } else {
        this.#centerline = null;
        this.#geometry = null;
      }

      this.dispatchEvent(new CustomEvent('geometry-change', {detail: {}}));
    });
  }

  /**
   * https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
   * - create UUID / GUID
   *
   *  - four possible variations...
   *     - id
   *     - id.replace(/-/g,'')
   *     - `{${ id }}`
   *     = `{${ id.replace(/-/g,'') }}`
   *
   * @param {boolean} [dashes]
   * @param {boolean} [brackets]
   * @returns {string}
   * @private
   */
  static createGUID({dashes = false, brackets = false}) {
    const url = URL.createObjectURL(new Blob());
    const [id] = url.toString().split('/').reverse();
    URL.revokeObjectURL(url);
    const uuid = dashes ? id : id.replace(/-/g, '');
    return brackets ? `{${ uuid }}` : uuid;
  };

}

export default FresnelZone;
