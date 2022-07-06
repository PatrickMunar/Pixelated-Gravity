import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Scrollbar from 'smooth-scrollbar'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'

// Clear Scroll Memory
window.history.scrollRestoration = 'manual'

// Scroll Triggers
gsap.registerPlugin(ScrollTrigger)

// 3rd party library setup:
const bodyScrollBar = Scrollbar.init(document.querySelector('#bodyScrollbar'), { damping: 0.1, delegateTo: document })

let scrollY = 0

// Tell ScrollTrigger to use these proxy getter/setter methods for the "body" element: 
ScrollTrigger.scrollerProxy('#bodyScrollbar', {
  scrollTop(value) {
    if (arguments.length) {
      bodyScrollBar.scrollTop = value; // setter
    }
    return bodyScrollBar.scrollTop    // getter
  },
  getBoundingClientRect() {
    return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight}
  }
})

// when the smooth scroller updates, tell ScrollTrigger to update() too: 
bodyScrollBar.addListener(ScrollTrigger.update);

// -----------------------------------------------------------------
/**
 * Base
 */

// Canvas
const canvas = document.querySelector('.webgl')

// Fix Position
bodyScrollBar.addListener(({ offset }) => {  
    canvas.style.top = offset.y + 'px'
})

// Scene
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xF8F0E3)

// Loading Manager
const loadingBar = document.getElementById('loadingBar')
const loadingPage = document.getElementById('loadingPage')

const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
       
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {

    }
)

// Texture loader
const textureLoader = new THREE.TextureLoader()
const images = []
images[0] = textureLoader.load('./images/demo3.jpg')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)

// Lighting

const ambientLight = new THREE.AmbientLight(0xaa00ff, 0.1)
scene.add(ambientLight)

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {    
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    location.reload();
})

// Objects
// Data Texture
// create a buffer with color data
let scale = 256

const parameters = {
    width: scale,
    height: Math.floor(scale*window.innerHeight/window.innerWidth),
    gravity: 0.05,
    gravityRadius: 5,
    orderSpeed: 0.9925,
}

const size = parameters.width * parameters.height;
const data = new Uint8Array( 4 * size );

for ( let i = 0; i < size; i ++ ) {
    let r = Math.random()*255
	const stride = i * 4;

	data[ stride ] = r
	data[ stride + 1 ] = r
	data[ stride + 2 ] = r
	data[ stride + 3 ] = 255;
}

// used the buffer to create a DataTexture

const dataTexture = new THREE.DataTexture( data, parameters.width, parameters.height, THREE.RGBAFormat);
dataTexture.needsUpdate = true;

// Plane
const geometry = new THREE.PlaneGeometry(1,1,1,1)

const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTexture: {value: images[0]},
        uTime: {value: 0},
        uResolution: {value: new THREE.Vector4()},
        uDataTexture: {value: dataTexture},
        uGravity: {value: parameters.gravity},
        uMultiplierX: {value: 1}
    },
    side: THREE.DoubleSide
})

const plane = new THREE.Mesh(geometry, material)
scene.add(plane)

// Base camera
const frustumSize = 1
const aspect = window.innerWidth/window.innerHeight
const camera = new THREE.OrthographicCamera(frustumSize/-2, frustumSize/2, frustumSize/2, frustumSize/-2, -1000, 1000)
camera.position.set(0,0,2)
scene.add(camera)

// Image Resize
const imageResize = () => {
    let imageAspect = 3038/5401
    let a1
    let a2
    if ((1/aspect) > imageAspect) {
        a1 = aspect * imageAspect
        a2 = 1
    }
    else {
        a1 = 1
        a2 = (1/aspect)/imageAspect
    }
    material.uniforms.uResolution.value.x = window.innerWidth
    material.uniforms.uResolution.value.y = window.innerHeight
    material.uniforms.uResolution.value.z = a1
    material.uniforms.uResolution.value.w = a2
}

imageResize()

// Mouse Events
const mouse = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    prevX: 0,
    prevY: 0
}

window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX/window.innerWidth
    mouse.y = e.clientY/window.innerHeight
    
    mouse.vx = mouse.x - mouse.prevX
    mouse.vy = mouse.y - mouse.prevY

    mouse.prevX = mouse.x
    mouse.prevY = mouse.y
})

// Update Data Texture
const updateDataTexture = () => {
    let data = dataTexture.image.data
    for (let i = 0; i < data.length; i+=3) {
        data[i] *= parameters.orderSpeed
        data[i+1] *= parameters.orderSpeed
        data[i+2] *= parameters.orderSpeed
    }

    let mouseGridX = parameters.width * mouse.x
    let mouseGridY = parameters.height * (1 - mouse.y)
    let maxDistance = parameters.gravityRadius*scale/(100)

    for (let i = 0; i < parameters.width; i++) {
        for (let j = 0; j < parameters.height; j++) {

            let distance = (mouseGridX - i)**2 + (mouseGridY - j)**2
            let maxDistanceSq = maxDistance**2

            if (distance < maxDistanceSq) {
                let index = 4*(i + parameters.width*j)
                let power = maxDistance/Math.sqrt(distance)
                data[index] += mouse.vx*1000*power
                data[index+1] += mouse.vy*1000*power
            }
        }
    }

    dataTexture.needsUpdate = true
}

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enabled = false

controls.enableDamping = true
controls.maxPolarAngle = Math.PI/2
// controls.minAzimuthAngle = Math.PI*0/180
// controls.maxAzimuthAngle = Math.PI*90/180
controls.minDistance = 12  
controls.maxDistance = 80

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.CineonToneMapping

// Raycaster
const raycaster = new THREE.Raycaster()

// Parallax Camera Group
const cameraGroup = new THREE.Group
cameraGroup.add(camera)
scene.add(cameraGroup)

// Animate
const clock = new THREE.Clock()
let prevTime = 0

const tick = () =>
{
    updateDataTexture()

    mouse.vx = mouse.x - mouse.prevX
    mouse.vy = mouse.y - mouse.prevY

    mouse.prevX = mouse.x
    mouse.prevY = mouse.y

    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - prevTime
    prevTime = elapsedTime

    // Update controls
    if (controls.enabled == true) {
        controls.update()
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()