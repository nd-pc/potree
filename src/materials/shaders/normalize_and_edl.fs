
#extension GL_EXT_frag_depth : enable

// 
// adapted from the EDL shader code from Christian Boucheny in cloud compare:
// https://github.com/cloudcompare/trunk/tree/master/plugins/qEDL/shaders/EDL
//

precision mediump float;
precision mediump int;

uniform sampler2D uWeightMap;
uniform sampler2D uEDLMap;
uniform sampler2D uDepthMap;

uniform float screenWidth;
uniform float screenHeight;
uniform vec2 neighbours[NEIGHBOUR_COUNT];
uniform float edlStrength;
uniform float radius;

varying vec2 vUv;

// CLOI
#if defined(use_cloi)
	uniform float cloiValue;
	varying float	vImp;
#endif

float response(float depth){
	vec2 uvRadius = radius / vec2(screenWidth, screenHeight);
	
	float sum = 0.0;
	
	for(int i = 0; i < NEIGHBOUR_COUNT; i++){
		vec2 uvNeighbor = vUv + uvRadius * neighbours[i];
		
		float neighbourDepth = texture2D(uEDLMap, uvNeighbor).a;

		if(neighbourDepth != 0.0){
			if(depth == 0.0){
				sum += 100.0;
			}else{
				sum += max(0.0, depth - neighbourDepth);
			}
		}
	}
	
	return sum / float(NEIGHBOUR_COUNT);
}

void main() {

	float edlDepth = texture2D(uEDLMap, vUv).a;
	float res = response(edlDepth);
	float shade = exp(-res * 300.0 * edlStrength);

	float depth = texture2D(uDepthMap, vUv).r;
	if(depth >= 1.0 && res == 0.0){
		discard;
	}
	
	vec4 finalColor = texture2D(uWeightMap, vUv); 
	finalColor = finalColor / finalColor.w;
	finalColor = finalColor * shade;
	
	// CLOI
	#if defined(use_cloi)
		float impOpacity = (vImp > cloiValue) ? color.a : 0.0;
		finalColor.r = cloiValue / 8.0;
	#endif

	gl_FragColor = vec4(finalColor.rgb, 1.0); 

	gl_FragDepthEXT = depth;
}