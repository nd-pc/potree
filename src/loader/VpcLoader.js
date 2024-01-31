import {CopcLoader} from './EptLoader';

export class VpcLoader {
	static async load(file, callback) {
		const response = await fetch(file)
		if(!response.ok) {
			console.error(`Failed to load file form ${file}`);
			callback(null);
			return;
		}

		const json = await response.json();

		const geometries = [];
		const urls = extractHrefs(json);
		const callbackGeom = g => geometries.push(g);
		for (const url of urls) {
			const urlLowerCase = url.toLowerCase();
			// TODO: we need to support more file formats
			if (urlLowerCase.endsWith('.copc.laz')) {
				await CopcLoader.load(url, callbackGeom);
			} else {
				console.warn(`Format not supported: ${url}`);
			}
		}

		callback(geometries);
	}
}

function extractHrefs(json) {
	const result = [];

	for (const feature of json.features) {
		const url = feature.assets.data.href;
		result.push(url);
	}

	return result;
}
