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
 * FresnelZoneGraphic
 *  - Fresnel Zone Graphic
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  7/31/2023 - 0.0.1 -
 * Modified:
 *
 */

class FresnelZoneGraphic extends EventTarget {

  static version = '0.0.1';

  /**
   * @type {FresnelZoneLayer}
   */
  #layer;

  /**
   * @type {FresnelZone}
   */
  #fresnelZone;

  /**
   * @type {Graphic}
   */
  #centerlineGraphic;

  /**
   *
   * @return {Graphic}
   */
  get centerlineGraphic() {
    return this.#centerlineGraphic;
  }

  /**
   * @type {Graphic}
   */
  #zoneGraphic;

  /**
   *
   * @return {Graphic}
   */
  get zoneGraphic() {
    return this.#zoneGraphic;
  }

  /**
   *
   * @param {FresnelZoneLayer} layer
   * @param {FresnelZone} fresnelZone
   */
  constructor({layer, fresnelZone}) {
    super();

    this.#fresnelZone = fresnelZone;
    this.#layer = layer;

    require([
      'esri/core/reactiveUtils',
      'esri/Graphic'
    ], (reactiveUtils, Graphic) => {

      this.#zoneGraphic = new Graphic({attributes: {zoneid: this.#fresnelZone.id, status: null, obstructed: null}});
      this.#centerlineGraphic = new Graphic({attributes: {zoneid: this.#fresnelZone.id}});
      this.#layer.addFresnelZone({fresnelZone: this.#fresnelZone});

      this.#fresnelZone.addEventListener('geometry-change', () => {
        this.#zoneGraphic.geometry = this.#fresnelZone.geometry;
        this.#centerlineGraphic.geometry = this.#fresnelZone.centerline;
        this.#layer.updateFresnelZone({fresnelZone: this.#fresnelZone});
      });

    });
  }

}

export default FresnelZoneGraphic;
