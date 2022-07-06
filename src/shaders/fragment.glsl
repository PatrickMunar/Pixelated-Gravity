precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
uniform vec4 uResolution;
uniform float uGravity;

varying vec2 vUv;

void main() {
    vec2 newUV = (vUv - vec2(0.5))*uResolution.zw + vec2(0.5);
    vec4 offset = texture2D(uDataTexture, vUv);
    // vec4 textureColor = texture2D(uTexture, newUV - 0.5*offset.r - 0.5*offset.g);
    // textureColor = vec4(textureColor.r-offset.r*1.0, textureColor.g-offset.r*1.0, textureColor.b-offset.r*1.0, 1.0);
    vec4 textureColor = texture2D(uTexture, newUV - uGravity*offset.r - uGravity*offset.g);
    // textureColor = vec4(textureColor.r, textureColor.g, textureColor.b, 1.0);
    //     vec4 textureColor = texture2D(uTexture, newUV - 0.5*offset.r - 0.5*offset.g);
    textureColor = vec4(textureColor.r-offset.r*1.0, textureColor.g-offset.g*1.0, textureColor.b-offset.b*1.0, 1.0);
    gl_FragColor = offset;
    gl_FragColor = textureColor;
}