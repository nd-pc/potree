
precision mediump float;
precision mediump int;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

// CLOI
#if defined(use_cloi)
	attribute float imp;
	varying float	vImp;
#endif

void main() {
	vUv = uv;
	
	// CLOI
	#ifdef use_cloi
		vImp = imp;		
	#endif

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}