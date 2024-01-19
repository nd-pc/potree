import {PointCloudCopcGeometryNode,PointCloudCopcGeometry} from "../PointCloudCopcGeometry"
import {POCLoader} from './POCLoader';
import {PointCloudOctree} from "../PointCloudOctree.js";

/**
 * Load copc data using Copc loader
 * @param {string} url
 * @returns Promise to PointCloudCopcGeometry
 */
async function loadCopcLaz(url) {
	// use Copc loader defined in global scope
	const { Copc, Getter } = window.Copc
	// define getter and load copc file header
	const getter = Getter.http(url);
	const copc = await Copc.create(getter);
	// create base geometry node for Copc
	const copcGeometry = new PointCloudCopcGeometry(getter, copc);
	// assign root tree node to base geometry class, note! circular reference
	copcGeometry.root = new PointCloudCopcGeometryNode(copcGeometry);
	// load root geometry node
	await copcGeometry.root.load();
	// debugger
	// return root Copc geometry
	return copcGeometry
}

/**
 * Load POC data using POCLoader.
 * it returns promise that resolves on received callback from POCLoader
 * @param {string} url
 * @returns Promise to PointCloudOctreeGeometry object
 */
function loadPoc(url) {
	return new Promise((resolve, reject) => {
		try {
			POCLoader.load(url, (pocGeometry) => {
				// callback received from POCloader
				debugger
				if (pocGeometry) {
					resolve(pocGeometry)
				} else {
					reject("Failed to load POC data. No geometry is returned from POCLoader")
				}
			});
		} catch (e) {
			reject("Failed to load POC data. ", e.message)
		}
	})
}

/**
 * Use VpcLoader to load data from *.vpc (Virtual Point Cloud) file.
 * See specification at https://github.com/PDAL/wrench/blob/main/vpc-spec.md
 * Supported data formats defined in the features object of vpc file are .copc.laz and cloud.js
 */
export class VpcLoader{
	static async load(file, callback) {
		const vpcPointclouds = []
		let minRange, maxRange

		// load vpc json file
		const response = await fetch(file)
		if(!response.ok) {
			console.error(`Failed to load file form ${file}`);
			callback(null);
			return;
		}
		const vpc = await response.json();

		// validate vpc file type
		if (vpc.type !== "FeatureCollection") {
			console.error("VPC file type!=FeatureCollection. ", file);
			callback(null);
			return;
		}

		// load geometry data defined in vpc features
		for (const feature of vpc.features){
			const url = feature.assets.data.href;
			let vpcGeometry

			// debugger

			if (url.toLowerCase().endsWith('.copc.laz')) {
				// get copc geometry
				vpcGeometry = await loadCopcLaz(url)
			} else if (url.toLowerCase().endsWith('.cloud.js')) {
				// get poc geometry
				vpcGeometry = await loadPoc(url)
			} else {
				// warn for not supported file and exit process
				console.warn("Feature data type not supported! ", url)
				callback(null)
				return
			}

			if (vpcGeometry) {
				// create pointcloud
				const pointcloud = new PointCloudOctree(vpcGeometry);
				// use feature id as pointcloud name
				pointcloud.name = feature.id

 				// calculate "global" min and max elevantionRange
				minRange = minRange === undefined ?
					pointcloud.material.elevationRange[0] :
					Math.min(pointcloud.material.elevationRange[0], minRange);
				maxRange = maxRange === undefined ?
					pointcloud.material.elevationRange[1] :
					Math.max(pointcloud.material.elevationRange[1], minRange);

				// add vpcPointclouds
				vpcPointclouds.push(pointcloud)
			}
		}

		// NOTE! We need to adjust the elevationRange of in all pointclouds
		// based on the "global" min and max range
		for (const pointcloud of vpcPointclouds) {
			// debugger
			pointcloud.material.elevationRange = [
				minRange,
				maxRange
			]
		}

		// return vpc pointclouds if there are
		// otherwise return null
		if (vpcPointclouds.length > 0) {
			callback(vpcPointclouds);
		} else {
			callback(null)
		}
	}
}
