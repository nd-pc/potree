import { CopcLoader } from './EptLoader';
import { POCLoader } from './POCLoader';
import { BaseGeometry } from "../PointCloudEptGeometry";
import { U } from "../PointCloudEptGeometry";
import * as THREE from "../../libs/three.js/build/three.module.js";
import { PointCloudTreeNode } from '../PointCloudTree';

export class VpcLoader {
	static async load(file, callback) {
		const response = await fetch(file)
		if(!response.ok) {
			console.error(`Failed to load file form ${file}`);
			callback(null);
			return;
		}

		const json = await response.json();

		const geometry = new PointCloudVpcBaseGeometry(json);
		const geometries = [];
		const callbackGeom = g => geometries.push(g);
		for (const url of geometry.linksToCopcFiles) {
			const urlLowerCase = url.toLowerCase();
			// TODO: do we have all file formats?
			if (urlLowerCase.endsWith('.copc.laz')) {
				await CopcLoader.load(url, callbackGeom)
			// } else if (urlLowerCase.endsWith('.laz') || urlLowerCase.endsWith('.las')) {
			// 	// TODO: is this correct?
			// 	POCLoader.load(url, callbackGeom);
			} else if (urlLowerCase.endsWith('.cloud.js')) {
				POCLoader.load(url, callbackGeom);
			}
		}

		const loadingPromises = [];
		for (const g of geometries) {
			if (g.root.isLoaded()) {
				continue;
			}
			let resolve;
			const promise = new Promise(res => resolve = res);
			g.root._loaded = g.root.loaded;
			Object.defineProperty(g.root, "loaded", {
				set(b) {
					this._loaded = b;
					if (b === true) {
						resolve();
					}
				},
				get() {
					return this._loaded;
				}
			});
			loadingPromises.push(promise);
		}

		await Promise.allSettled(loadingPromises);


		for (const g of geometries) {
			geometry.add(g);
		}
		let root = new VpcPointCloudTreeNode(geometry);
		geometry.root = root;
		geometry.root.load();
		geometry.spacing = geometries[0].spacing;

		callback(geometry);
	}
}
export class PointCloudVpcBaseGeometry extends BaseGeometry {
	//TODO: Did we override/implement all fields and methods correctly?
	static parse(json) {
		let xmin, ymin, zmin, xmax, ymax, zmax;

		for (const feature of json.features) {
			const box = feature.properties['proj:bbox'];
			xmin = xmin === undefined ? box[0] : Math.min(box[0], xmin);
			ymin = ymin === undefined ? box[1] : Math.min(box[1], ymin);
			zmin = zmin === undefined ? box[2] : Math.min(box[2], zmin);
			xmax = xmax === undefined ? box[3] : Math.max(box[3], xmax);
			ymax = ymax === undefined ? box[4] : Math.max(box[4], ymax);
			zmax = zmax === undefined ? box[5] : Math.max(box[5], zmax);
		}

		const cube = [xmin, ymin, zmin, xmax, ymax, zmax];
		const boundsConforming = cube;
		return ({ cube, boundsConforming, spacing: null, srs: null });
	}

	constructor(json) {
		super(PointCloudVpcBaseGeometry.parse(json));

		this.type = 'vpc';
		this.json = json;
		this.linksToCopcFiles = [];
		this.attributes = this.pointAttributes.attributes;
		this.children = [];

		for (const feature of json.features) {
			const url = feature.assets.data.href;
			this.linksToCopcFiles.push(url);
		}
	}

	async add(geometry) {
		this.children.push(geometry);

		for (const attribute of geometry.pointAttributes.attributes) {
			const name = attribute.name;
			const range = attribute.range;
			const currentAttribute = this.pointAttributes.attributes.find(a => a.name === name);
			const currentRange = currentAttribute.range;
			currentRange[0] = Math.min(currentRange[0], range[0]);
			currentRange[1] = Math.max(currentRange[1], range[1]);
			if (name === 'gps-time') {
				if (!currentAttribute.initialRange) {
					currentAttribute.initialRange = currentRange;
				}
			}
		}
	}

	isTreeNode() {
		return true;
	}
}

export class VpcPointCloudTreeNode extends PointCloudTreeNode {
	//TODO: Did we override/implement all fields and methods correctly?
	constructor(geometry) {
		super();
		this.boundingBox = geometry.boundingBox;
		this.children = [];
		this.name = "";
		this.numPoints = 0;
		for (const g of geometry.children) {
			this.children.push(g.root);
			this.numPoints += g.root.numPoints;
		}
		this.oneTimeDisposeHandlers = [];
		this.boundingSphere = U.sphereFrom(this.boundingBox);
		this.level = 0;
		this.spacing = 0.03867346938775511;
		this.hasChildren = true;
	}

	load() {
		this.geometry = new THREE.BufferGeometry();

		for (const property in this.children[0].geometry.attributes) {
			this.geometry.attributes[property] = this.children[0].geometry.attributes[property];
		}
		// this.boundingBox = this.children[0].boundingBox;
		this.tightBoundingBox = this.boundingBox;
		this.boundingSphere = U.sphereFrom(this.boundingBox);
		this.bounds = this.boundingBox;
		this.mean = this.children[0].mean;
		this.loading = false;
		this.loaded = true;
	}

	getChildren() {
		return this.children;
	}

	getBoundingBox() {
		return this.boundingBox;
	}

	isLoaded() {
		return true;
	}

	isGeometryNode() {
		return true;
	}

	isTreeNode() {
		return false;
	}

	getLevel() {
		return this.level;
	}

	getBoundingSphere() {
		return this.boundingSphere;
	}

	getNumPoints() {
		return this.numPoints;
	}
}
