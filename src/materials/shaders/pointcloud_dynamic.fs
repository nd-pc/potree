
precision highp float;
precision highp int;

varying vec3	vColor;

void main() {

	vec4 finalColor = vec4(vColor, 1.0);


	gl_FragColor = finalColor;
}


