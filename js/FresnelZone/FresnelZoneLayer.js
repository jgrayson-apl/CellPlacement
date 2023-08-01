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
 * FresnelZoneLayer
 *  - Fresnel Zone Layer
 *
 * Author:   John Grayson - Applications Prototype Lab - Esri
 * Created:  7/31/2023 - 0.0.1 -
 * Modified:
 *
 */

class FresnelZoneLayer extends EventTarget {

  static version = '0.0.1';

  static COLORS = {
    SIGHTLINE: {color: 'rgba(255, 213, 0, 0.9)'},
    DEFAULT: {fillColor: 'rgba(30, 144, 255, 0.7)', edgeColor: 'rgba(181,219,255,0.9)'},
    VISIBLE: {fillColor: 'rgba(33, 255, 48, 0.7)', edgeColor: 'rgba(179,255,184,0.9)'},
    OBSTRUCTED: {fillColor: 'rgba(255, 31, 31, 0.7)', edgeColor: 'rgba(255,179,179,0.9)'}
  };

  /**
   * @type {MapView}
   */
  #view;

  /**
   * @type {esri/layers/FeatureLayer}
   */
  #zonesLayer;

  /**
   * @type {esri/layers/FeatureLayer}
   */
  #centerlinesLayer;

  /**
   *
   * @param {esri/views/MapView} view
   */
  constructor({view}) {
    super();

    this.#view = view;

    this.initialize();
  }

  /**
   *
   * @param fillColor
   * @param edgeColor
   * @return {{symbolLayers: [{material: {color}, edges: {color, size: number, type: string}, type: string}], type: string}}
   * @private
   */
  _createZoneSymbol({fillColor, edgeColor}) {
    return {
      type: "mesh-3d",
      symbolLayers: [
        {
          type: "fill",
          material: {color: fillColor},
          edges: {type: "solid", color: edgeColor, size: 1.0}
        }
      ]
    };
  }

  /**
   *
   */
  initialize() {
    require([
      'esri/core/reactiveUtils',
      'esri/layers/FeatureLayer'
    ], (reactiveUtils, FeatureLayer) => {

      this.#centerlinesLayer = new FeatureLayer({
        title: 'Zones Centerlines',
        fields: [
          {name: "ObjectID", alias: "ObjectID", type: "oid"},
          {name: "zoneid", alias: "Zone ID", type: "guid", valueType: 'unique-identifier'}
        ],
        objectIdField: "ObjectID",
        geometryType: "polyline",
        hasZ: true,
        spatialReference: this.#view.spatialReference,
        source: [],
        renderer: {
          type: 'simple',
          symbol: {
            type: 'line-3d',
            symbolLayers: [{
              type: "line", cap: "round", join: "round", size: 1.5,
              material: FresnelZoneLayer.COLORS.SIGHTLINE
            }]
          }
        }
      });

      this.#zonesLayer = new FeatureLayer({
        title: 'Fresnel Zones',
        fields: [
          {name: "ObjectID", alias: "ObjectID", type: "oid"},
          {name: "zoneid", alias: "Zone ID", type: "guid", valueType: 'unique-identifier'},
          {
            name: "status", alias: "Status", type: "integer", valueType: 'type-or-category',
            domain: {type: 'coded-value', name: 'Status', codedValues: [{name: 'visible', code: 0}, {name: 'obstructed', code: 1}]}
          },
          {name: "obstructions", alias: "Obstructions", type: "integer", valueType: 'count-or-amount'}
        ],
        objectIdField: "ObjectID",
        geometryType: "mesh",
        spatialReference: this.#view.spatialReference,
        source: [],
        //popupTemplate: {},
        renderer: {
          type: "unique-value",
          field: "status",
          defaultSymbol: this._createZoneSymbol(FresnelZoneLayer.COLORS.DEFAULT),
          uniqueValueInfos: [
            {value: 0, symbol: this._createZoneSymbol(FresnelZoneLayer.COLORS.VISIBLE)},
            {value: 1, symbol: this._createZoneSymbol(FresnelZoneLayer.COLORS.OBSTRUCTED)}
          ]
        }
      });

      this.#view.map.addMany([this.#centerlinesLayer, this.#zonesLayer]);

    });
  }

  /**
   *
   * @param {FresnelZone} fresnelZone
   */
  addFresnelZone({fresnelZone}) {

    this.#zonesLayer.applyEdits({addFeatures: [fresnelZone.graphic.zoneGraphic]}).then(({addFeatureResults}) => {
      const addFeatureResult = addFeatureResults[0];
      console.info(fresnelZone.graphic.zoneGraphic.attributes, addFeatureResult);
    });
    this.#centerlinesLayer.applyEdits({addFeatures: [fresnelZone.graphic.centerlineGraphic]}).then(({addFeatureResults}) => {
      const addFeatureResult = addFeatureResults[0];
      console.info(fresnelZone.graphic.centerlineGraphic.attributes, addFeatureResult);
    });

  }

  /**
   *
   * @param {FresnelZone} fresnelZone
   */
  updateFresnelZone({fresnelZone}) {

    this.#zonesLayer.applyEdits({updateFeatures: [fresnelZone.graphic.zoneGraphic]}).then(({updateFeatureResults}) => {
      console.info(updateFeatureResults);
    });
    this.#centerlinesLayer.applyEdits({updateFeatures: [fresnelZone.graphic.centerlineGraphic]}).then(({updateFeatureResults}) => {
      console.info(updateFeatureResults);
    });

  }

}

export default FresnelZoneLayer;
