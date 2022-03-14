
precision highp float;
precision highp int;

varying vec3	vColor;

// CLOI
#if defined(use_cloi)
	uniform float cloiValue;
	varying float	vImp;
#endif

void main() {

	vec4 finalColor = vec4(vColor, 1.0);

	// CLOI
	#if defined(use_cloi)
		float impOpacity = (vImp > cloiValue) ? 1.0 : 0.0;
		finalColor.r = cloiValue / 8.0;
	#endif	

	gl_FragColor = finalColor;
}


