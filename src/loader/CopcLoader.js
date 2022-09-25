/**
 * @author Maarten van Meersbergen
 */

import {Utils} from "../utils.js";




export class CopcLoader {	
	constructor() {
		this.laszip = null;
	}

	async load(file, callback) {
		await Promise.all([
			Utils.loadScript(`${Potree.scriptPath}/lazylibs/laz-perf/laz-perf.js`)
		]);

		Module.onRuntimeInitialized = () => {
			this.laszip = new Module.LASZip();
			const buf = this.loadLaz(file);
    };

		// let response = await fetch(file);
		// let data = await response.text();

		// let info = await CopcLoader.parseInfo(data);

		// let url = file.substr(0, file.lastIndexOf('copc.laz'));
		// let geometry = new Potree.PointCloudCopcGeometry(url, info);
		// let root = new Potree.PointCloudCopcGeometryNode(geometry);

		// geometry.root = root;
		// geometry.root.load();

		// callback(geometry);
	}

	async loadLaz(filename) {
		const res = await fetch(filename);
		const ab = await res.arrayBuffer();
		const buf = new Uint8Array(ab);
		this.handleLazBuf(buf);
	}

	handleLazBuf(tempbuf) {
		const len = tempbuf.byteLength;
		const buf = Module._malloc(len);
		Module.HEAPU8.set(tempbuf, buf);

		this.laszip.open(buf, len);

		// const pointCount = this.laszip.getCount();
		// const pointSize = this.laszip.getPointLength();
		// var pointbuf = Module._malloc(pointSize);
		// for (var i = 0; i < pointCount; ++i) {
		// 	this.laszip.getPoint(pointbuf);
		// 	this.parsePoint(pointbuf, pointSize);
		// }
	}

	parsePoint(pointbuf, bufsize) {
		const p = new DataView(Module.HEAPU8.buffer, pointbuf, bufsize);
		// console.log('X = ', p.getInt32(0, true));
		// console.log('Y = ', p.getInt32(4, true));
		// console.log('Z = ', p.getInt32(12, true));
	}

// 	static async parseInfo(buffer) {
// 		debugger
// 		let info = {};
// 		let lf = new LASFile(buffer);
// 		let handler = new CopcLazInfoBatcher(info);

// 		try{
// 			await lf.open();

// 			lf.isOpen = true;

// 			const header = await lf.getHeader();

// 			{
// 				let i = 0;

// 				let toArray = (v) => [v.x, v.y, v.z];
// 				let mins = toArray(node.key.b.min);
// 				let maxs = toArray(node.key.b.max);

// 				let hasMoreData = true;

// 				while(hasMoreData){
// 					const data = await lf.readData(1000000, 0, 1);

// 					let d = new LASDecoder(
// 						data.buffer,
// 						header.pointsFormatId,
// 						header.pointsStructSize,
// 						data.count,
// 						header.scale,
// 						header.offset,
// 						mins,
// 						maxs);

// 					d.extraBytes = header.extraBytes;
// 					d.pointsFormatId = header.pointsFormatId;
// 					handler.push(d);

// 					i += data.count;

// 					hasMoreData = data.hasMoreData;
// 				}

// 				header.totalRead = i;
// 				header.versionAsString = lf.versionAsString;
// 				header.isCompressed = lf.isCompressed;

// 				await lf.close();

// 				lf.isOpen = false;
// 			}

// 		}catch(err){
// 			console.error('Error reading LAZ:', err);
			
// 			if (lf.isOpen) {
// 				await lf.close();

// 				lf.isOpen = false;
// 			}
			
// 			throw err;
// 		}
// 	}
// };

// export class CopcLazInfoBatcher {		
// 	constructor(info) { 
// 		debugger
// 		this.info = info; 
// 	}

	
// 	push(las) {
// 		let workerPath = Potree.scriptPath +
// 			'/workers/CopcInfoDecoderWorker.js';
// 		let worker = Potree.workerPool.getWorker(workerPath);

// 		worker.onmessage = (e) => {
// 			let g = new THREE.BufferGeometry();
// 			let numPoints = las.pointsCount;

// 			let positions = new Float32Array(e.data.position);
// 			let colors = new Uint8Array(e.data.color);

// 			let intensities = new Float32Array(e.data.intensity);
// 			let classifications = new Uint8Array(e.data.classification);
// 			let returnNumbers = new Uint8Array(e.data.returnNumber);
// 			let numberOfReturns = new Uint8Array(e.data.numberOfReturns);
// 			let pointSourceIDs = new Uint16Array(e.data.pointSourceID);
// 			let indices = new Uint8Array(e.data.indices);
// 			let gpsTime = new Float32Array(e.data.gpsTime);

// 			g.setAttribute('position',
// 					new THREE.BufferAttribute(positions, 3));
// 			g.setAttribute('rgba',
// 					new THREE.BufferAttribute(colors, 4, true));
// 			g.setAttribute('intensity',
// 					new THREE.BufferAttribute(intensities, 1));
// 			g.setAttribute('classification',
// 					new THREE.BufferAttribute(classifications, 1));
// 			g.setAttribute('return number',
// 					new THREE.BufferAttribute(returnNumbers, 1));
// 			g.setAttribute('number of returns',
// 					new THREE.BufferAttribute(numberOfReturns, 1));
// 			g.setAttribute('source id',
// 					new THREE.BufferAttribute(pointSourceIDs, 1));
// 			g.setAttribute('indices',
// 					new THREE.BufferAttribute(indices, 4));
// 			g.setAttribute('gpsTime',
// 					new THREE.BufferAttribute(gpsTime, 1));
// 			this.node.gpsTime = e.data.gpsMeta;

// 			g.attributes.indices.normalized = true;

// 			let tightBoundingBox = new THREE.Box3(
// 				new THREE.Vector3().fromArray(e.data.tightBoundingBox.min),
// 				new THREE.Vector3().fromArray(e.data.tightBoundingBox.max)
// 			);

// 			this.node.doneLoading(
// 				g,
// 				tightBoundingBox,
// 				numPoints,
// 				new THREE.Vector3(...e.data.mean));

// 			Potree.workerPool.returnWorker(workerPath, worker);
// 		};

// 		let message = {
// 			buffer: las.arrayb,
// 			numPoints: las.pointsCount,
// 			pointSize: las.pointSize,
// 			pointFormatID: las.pointsFormatId,
// 			scale: las.scale,
// 			offset: las.offset,
// 			mins: las.mins,
// 			maxs: las.maxs
// 		};

// 		worker.postMessage(message, [message.buffer]);
// 	};
};
