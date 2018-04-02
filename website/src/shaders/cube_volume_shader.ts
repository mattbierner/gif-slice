import * as THREE from 'three';

/**
 * Shader for the interior of the gif cube.
 */
export default {
    uniforms: {
        clippingPlane: { type: 'v4', value: new THREE.Vector4(0, 0, 0, 0) }
    },
    vertexShader: `
        varying vec3 eyePos;

        void main() {
            vec4 pos = modelViewMatrix * vec4(position, 1.0); 
            gl_Position = projectionMatrix * pos;
            eyePos = position;
        }
    `,
    fragmentShader: `
        uniform vec4 clippingPlane;

        varying vec3 eyePos;

        void main() {
            if (dot(eyePos, clippingPlane.xyz) > clippingPlane.w)
                discard;

            gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
        }
    `,
    side: THREE.DoubleSide,
    transparent: true,
};