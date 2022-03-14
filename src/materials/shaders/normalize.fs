
#extension GL_EXT_frag_depth : enable

precision mediump float;
precision mediump int;

uniform sampler2D uWeightMap;
uniform sampler2D uDepthMap;

varying vec2 vUv;

// CLOI
#if defined(use_cloi)
	uniform float cloiValue;
	varying float	vImp;
#endif

void main() {
	float depth = texture2D(uDepthMap, vUv).r;
	
	if(depth >= 1.0){
		discard;
	}

	gl_FragColor = vec4(depth, 1.0, 0.0, 1.0);

	vec4 finalColor = texture2D(uWeightMap, vUv); 
	finalColor = finalColor / finalColor.w;

	// CLOI
	#if defined(use_cloi)
		float impOpacity = (vImp > cloiValue) ? color.a : 0.0;
		finalColor.r = cloiValue / 8.0;
	#endif
	
	gl_FragColor = vec4(finalColor.rgb, 1.0); 
	
	gl_FragDepthEXT = depth;


}