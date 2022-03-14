
precision mediump float;
precision mediump int;

varying vec3 vColor;
varying float vLinearDepth;

// CLOI
#if defined(use_cloi)
	uniform float cloiValue;
	varying float	vImp;
#endif

void main() {

	//gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	//gl_FragColor = vec4(vColor, 1.0);
	//gl_FragColor = vec4(vLinearDepth, pow(vLinearDepth, 2.0), 0.0, 1.0);

	vec4 finalColor = vec4(vLinearDepth, vLinearDepth / 30.0, vLinearDepth / 30.0, 1.0);

	// CLOI
	#if defined(use_cloi)
		float impOpacity = (vImp > cloiValue) ? 1.0 : 0.0;
		finalColor.r = cloiValue / 8.0;
	#endif	
	
	gl_FragColor = finalColor;
	
}


