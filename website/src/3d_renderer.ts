import * as THREE from 'three';
import OrbitControls from './OrbitControls';
import TransformControls from './TransformControls';
import throttle = require('lodash.throttle');
const ResizeSensor = require('imports-loader?this=>window!css-element-queries/src/ResizeSensor');

import createImageData from './create_image_data';

import cubeShader from './shaders/cube_face_shader';
import cubeVolumeShader from './shaders/cube_volume_shader';
import { Gif, Frame } from 'load_gif';

const cubeMaterial = new THREE.ShaderMaterial(cubeShader);

const CAMERA_BASE = 1;
const INITIAL_PLANE_SIZE = 0.75;

type Sampler = (dest: ImageData, frame: Frame, x: number, y: number) => void

/**
 * Create a plane from 4 points.
 */
export const createPlane = (name: string, a: any, b: any, c: any, d: any, mat: any) => {
    const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

    const vertices = new Float32Array([
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z,
        d.x, d.y, d.z
    ]);

    const uv = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1
    ]);

    const geometry = new THREE.BufferGeometry();

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.name = name;
    (mesh.geometry as any).vertices = [a, b, c, d];
    return mesh;
};

/**
 * Helper to  create a texture from image data.
 */
const createTextureFromImageData = (imageData: any) => {
    const text = new THREE.Texture(imageData);
    text.minFilter = THREE.NearestFilter;
    text.needsUpdate = true;
    return text;
};

export interface Sample {
    readonly planeTransform: THREE.Matrix4
    readonly data: ImageData
    readonly planeWidth: number
    readonly planeHeight: number
}

export interface CubeRendererDelegate {
    onSampleDidChange?(sample: Sample): void
}

export interface CubeRendererOptions {
    initialPlaneTransform?: THREE.Matrix4;
    initialPlanePosition?: THREE.Vector3,
    enableControls: boolean
}

export class CubeRenderer {
    private onKeyDown?: (event: any) => void;
    private _container: HTMLElement;
    private _options: CubeRendererOptions;
    private _delegate: CubeRendererDelegate;
    private _scene: THREE.Scene;
    private _uiScene: THREE.Scene;
    private animate: () => void;
    private _renderer!: THREE.WebGLRenderer;
    private _camera!: THREE.OrthographicCamera;
    private _controls: any;
    private _transformControls: any;
    private _needsSlice: boolean = false;
    public _plane!: THREE.Mesh;
    private _planeGuides!: THREE.Object3D;
    private _axis!: THREE.Object3D;
    private _cube: any;
    private disposed: boolean = false;
    private _cubeOutline: any;
    private _sampleWidth?: number;
    private _sampleHeight?: number;
    private _data: any;
    private _imageCube: any;
    private _slicer: any;
    private _planeWidth?: number;
    private _planeHeight?: number;

    constructor(
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        delegate: CubeRendererDelegate,
        options: CubeRendererOptions
    ) {
        this._options = Object.assign({}, { enableControls: true, initialPlanePosition: new THREE.Vector3(0, 0, 0) }, options);
        this._delegate = delegate;

        this._container = container;
        this._scene = new THREE.Scene();
        this._uiScene = new THREE.Scene();

        this.initRenderer(canvas);
        this.initCamera(CAMERA_BASE, CAMERA_BASE);
        this.initControls(canvas);
        new ResizeSensor(container, this.onResize.bind(this));
        this.onResize();

        this.initGeometry();

        this.animate = () => this.animateImpl();
        this.animateImpl();
    }

    private initRenderer(canvas: HTMLCanvasElement) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true
        });
        this._renderer.autoClear = false;
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    }

    private initCamera(width: number, height: number) {
        this._camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, -10, 10);
        this.resetCamera();
    }

    private initControls(container: HTMLElement) {
        if (!this._options.enableControls) {
            return
        }
        // Create transform controls
        this._transformControls = new TransformControls(this._camera, container);
        this._transformControls.setSize(1);
        this._transformControls.setSpace('local');
        this._uiScene.add(this._transformControls);

        this._controls = new OrbitControls(this._camera, container);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.25;
        this._controls.enableZoom = true;
        this._controls.minZoom = 0.01;
        this._controls.maxZoom = 20;


        this.onKeyDown = (event: KeyboardEvent) => {
            switch (event.keyCode) {
                case 87: // W
                    this._transformControls.setMode("translate");
                    break;

                case 69: // E
                    this._transformControls.setMode("rotate");
                    break;

                case 82: // R
                    this._transformControls.setMode("scale");
                    break;
            }
        };
        window.addEventListener('keydown', this.onKeyDown);

        this._transformControls.addEventListener('change', () => {
            this._needsSlice = true;
        });
    }

    private onResize() {
        const width = this._container.clientWidth;
        const height = this._container.clientHeight;

        this._renderer.setSize(width, height);

        const aspect = width / height;
        this._camera.left = -CAMERA_BASE * aspect;
        this._camera.right = CAMERA_BASE * aspect;
        this._camera.top = CAMERA_BASE;
        this._camera.bottom = -CAMERA_BASE;
        this._camera.updateProjectionMatrix();
    }

    private initGeometry() {
        this.initPlane();
        this.initAxis();
    }

    private initPlane() {
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            map: new THREE.Texture(),
            transparent: true,
            alphaTest: 0.5,
        });

        const size = INITIAL_PLANE_SIZE;
        const p1 = new THREE.Vector3(-size, size, 0);
        const p2 = new THREE.Vector3(size, size, 0);
        const p3 = new THREE.Vector3(size, -size, 0);
        const p4 = new THREE.Vector3(-size, -size, 0);

        this._plane = createPlane('plane', p1, p2, p3, p4, material);

        (this._plane.geometry as any).attributes.uv.array = new Float32Array([
            0, 1,
            1, 1,
            1, 0,
            0, 0,
        ]);
        (this._plane.geometry as any).attributes.uv.needsUpdate = true;
        this.resetPlane();
        if (this._options.initialPlaneTransform) {
            this._plane.applyMatrix(this._options.initialPlaneTransform)
        }

        if (this._transformControls) {
            this._transformControls.attach(this._plane);
        }
        this._scene.add(this._plane);

        this._planeGuides = new THREE.Object3D();
        this._plane.add(this._planeGuides);

        // Create outline
        const outlineGeomtry = new THREE.Geometry();
        outlineGeomtry.vertices.push(p1, p2, p3, p4, p1);
        const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
        this._planeGuides.add(new THREE.Line(outlineGeomtry, outlineMaterial));

        // create marker for top left of plane
        const topLeftMarkerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const topLeftMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const topLeftMarker = new THREE.Mesh(topLeftMarkerGeometry, topLeftMarkerMaterial);

        this._planeGuides.add(topLeftMarker);
        topLeftMarker.translateX(-size);
        topLeftMarker.translateY(size);
    }

    private initAxis() {
        const size = 0.4;
        const origin = new THREE.Vector3(-0.6, -0.6, 0.6);

        const axis = [
            { color: 0xff0000, vector: new THREE.Vector3(size, 0, 0) },
            { color: 0x00ff00, vector: new THREE.Vector3(0, size, 0) },
            { color: 0x0000ff, vector: new THREE.Vector3(0, 0, -size) }];

        this._axis = new THREE.Object3D();
        for (const a of axis) {
            const material = new THREE.LineBasicMaterial({ color: a.color });
            const geometry = new THREE.Geometry();
            geometry.vertices.push(origin, new THREE.Vector3().addVectors(origin, a.vector));

            this._axis.add(new THREE.Line(geometry, material));
        }
        this._scene.add(this._axis);
    }

    public dispose() {
        this._scene.remove(this._cube);
        this._scene.remove(this._planeGuides);
        this._scene.remove(this._plane);

        if (this._transformControls) {
            this._transformControls.dispose();
        }
        if (this._controls) {
            this._controls.dispose();
        }
        if (this.onKeyDown) {
            window.removeEventListener('keydown', this.onKeyDown);
        }

        this._renderer.dispose();

        this.disposed = true;
    }

    /**
     * Set the camera to its original position
     */
    public resetCamera() {
        this.setCameraPosition(1, 1, 1);
    }

    /**
     * Switch to default front view.
     */
    public goToFrontView() {
        this.setCameraPosition(0, 0, 1.5);
    }

    /**
     * Switch to default side view.
     */
    public goToSideView() {
        this.setCameraPosition(1.5, 0, 0);
    }

    /**
     * Siwtch to default top view.
     */
    public goToTopView() {
        this.setCameraPosition(0, 1.5, 0);
    }

    private setCameraPosition(x: number, y: number, z: number) {
        if (this._controls) {
            this._controls.reset();
        }
        this._camera.position.set(x, y, z);
        this._camera.rotation.set(0, 0, 0);
        this._camera.lookAt(new THREE.Vector3());
    }

    public modifyPlane(f: (plane: THREE.Mesh) => void) {
        if (this._plane) {
            f(this._plane)
            this._needsSlice = true
        }
    }

    /**
     * Resets the sampling plane to its original position and size.
     */
    public resetPlane() {
        this._plane.scale.set(1, 1, 1);
        this._plane.position.set(this._options.initialPlanePosition!.x, this._options.initialPlanePosition!.y, this._options.initialPlanePosition!.z);
        this._plane.rotation.set(0, 0, 0);
        this._plane.updateMatrix();
        this._plane.rotateOnAxis(new THREE.Vector3(-1, 0, 0).normalize(), Math.PI / 4);
        this._needsSlice = true;
    }

    /**
     * Turn the transform controls on or off.
     */
    public showControls(shouldShowControls: boolean) {
        if (shouldShowControls) {
            this._transformControls.attach(this._plane);
        } else {
            this._transformControls.detach();
        }
    }

    /** 
     * Show the transform control mode
     */
    public setTransformMode(mode: string) {
        this.showControls(true);
        this._transformControls.setMode(mode);
    }

    public showGuides(shouldShowGuides: boolean) {
        this._axis.visible = shouldShowGuides;
        this._planeGuides.visible = shouldShowGuides;
        this._cubeOutline.visible = shouldShowGuides;
    }

    /**
     * Remove all objects from the current scene.
     */
    private clear() {
        this._scene.remove(this._cube);
    }

    private slice() {
        if (!this._sampleWidth || !this._sampleHeight || this.disposed) {
            return;
        }
        return this.doSlice(this._plane, this._sampleWidth, this._sampleHeight);
    }

    public doSlice(plane: any, sampleWidth: number, sampleHeight: number): Sample | null {
        if (!this._data) {
            return null;
        }

        const vertices = plane.geometry.vertices;
        const p1 = vertices[0].clone().applyMatrix4(plane.matrix);
        const p2 = vertices[1].clone().applyMatrix4(plane.matrix);
        const p3 = vertices[3].clone().applyMatrix4(plane.matrix);
        const dx = p2.clone().sub(p1).divideScalar(sampleWidth);
        const dx2 = dx.clone().divideScalar(2);
        const dy = p3.clone().sub(p1).divideScalar(sampleHeight);

        // Ensure we hvae a large enough texture buffer to write to
        if (!plane.material.map.image || plane.material.map.image.width !== sampleWidth || plane.material.map.image.height !== sampleHeight) {
            const texture = createImageData(sampleWidth, sampleHeight);
            plane.material.map.image = texture;
            plane.material.map.minFilter = THREE.NearestFilter;
        }

        const imageBuffer = plane.material.map.image.data;
        this._doSample(p1, dy, sampleHeight, dx2, sampleWidth, dx, imageBuffer);
        plane.material.map.needsUpdate = true;

        const sample = {
            data: plane.material.map.image,
            planeTransform: this._plane.matrix,
            planeWidth: this._planeWidth!,
            planeHeight: this._planeHeight!
        }

        if (this._delegate.onSampleDidChange) {
            this._delegate.onSampleDidChange(sample);
        }

        return sample
    }

    private _doSample(p1: any, dy: any, sampleHeight: number, dx2: any, sampleWidth: number, dx: any, imageBuffer: any) {
        const start = p1.clone().add(dy.clone().divideScalar(2));
        for (let y = 0; y < sampleHeight; ++y, start.add(dy)) {
            const p = start.clone().add(dx2);
            for (let x = 0; x < sampleWidth; ++x, p.add(dx)) {
                this._sampleImageCube(imageBuffer, (x + y * sampleWidth) * 4, p.x, p.y, p.z);
            }
        }
    }

    /**
     * Samples the the color value of the gif cube at a position in 3D space.
     */
    _sampleImageCube(dest: any, destIndex: number, x: number, y: number, z: number) {
        const { width, depth, height } = this._imageCube;

        // Shift to positive coordinates to simplify sampling
        x += this._imageCube.width2;
        y += this._imageCube.height2;
        z += this._imageCube.depth2;

        // Invert for sampling so we sample in HTML ImageData/canvas order
        y = this._imageCube.height - y;
        z = this._imageCube.depth - z;

        // Check if in cube
        if (x < 0 || x > width || y < 0 || y > height || z < 0 || z > depth) {
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            dest[destIndex++] = 0;
            return;
        }

        const frameIndex = Math.floor(z / depth * this._data.frames.length);
        const frameData = this._data.frames[frameIndex].data.data;

        const u = Math.floor(x / width * this._data.width);
        const v = Math.floor(y / height * this._data.height);

        let sampleIndex = (v * this._data.width + u) * 4;
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = frameData[sampleIndex++];
        dest[destIndex++] = 255;
    }

    /**
     * Set the currently rendered image.
     */
    public setGif(imageData: Gif) {
        this.clear();
        this._data = imageData;

        const scale = Math.max(imageData.width, imageData.height);

        this._imageCube = {
            width: imageData.width / scale,
            height: imageData.height / scale,
            depth: 1,

            width2: imageData.width / scale / 2,
            height2: imageData.height / scale / 2,
            depth2: 1 / 2
        };

        const w = imageData.width / scale / 2;
        const h = imageData.height / scale / 2;
        const d = 1 / 2;
        const faces = this.getFaceImages(imageData);

        this._cube = new THREE.Object3D();
        this._cube.add(
            createPlane('front',
                new THREE.Vector3(-w, -h, d), new THREE.Vector3(w, -h, d), new THREE.Vector3(w, h, d), new THREE.Vector3(-w, h, d),
                faces.front));

        this._cube.add(
            createPlane('right',
                new THREE.Vector3(w, -h, d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(w, h, d),
                faces.right));

        this._cube.add(
            createPlane('back',
                new THREE.Vector3(-w, -h, -d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(-w, h, -d),
                faces.back));

        this._cube.add(
            createPlane('left',
                new THREE.Vector3(-w, -h, d), new THREE.Vector3(-w, -h, -d), new THREE.Vector3(-w, h, -d), new THREE.Vector3(-w, h, d),
                faces.left));

        this._cube.add(
            createPlane('top',
                new THREE.Vector3(-w, h, -d), new THREE.Vector3(w, h, -d), new THREE.Vector3(w, h, d), new THREE.Vector3(-w, h, d),
                faces.top));

        this._cube.add(
            createPlane('bottom',
                new THREE.Vector3(-w, -h, -d), new THREE.Vector3(w, -h, -d), new THREE.Vector3(w, -h, d), new THREE.Vector3(-w, -h, d),
                faces.bottom));

        this._scene.add(this._cube);

        // Create outlines
        this._cubeOutline = new THREE.Object3D();
        for (const child of this._cube.children.slice()) {
            const edges = new THREE.EdgesHelper(child, '#cccccc' as any);
            this._cubeOutline.add(edges);
        }
        this._cube.add(this._cubeOutline);

        // Create gray inner volume
        const g2 = new THREE.BoxGeometry(this._imageCube.width - 0.01, this._imageCube.height - 0.01, this._imageCube.depth - 0.01);
        const mat = new THREE.ShaderMaterial(cubeVolumeShader);
        mat.uniforms.clippingPlane = cubeMaterial.uniforms.clippingPlane;

        const mesh = new THREE.Mesh(g2, mat);
        this._cube.add(mesh);

        this._needsSlice = true;
    }

    public setSampleSize(width: number, height: number) {
        this._sampleWidth = width;
        this._sampleHeight = height;
        this._needsSlice = true;
    }

    private copyRgba(dest: any, destIndex: number, src: any, srcIndex: number) {
        destIndex *= 4;
        srcIndex *= 4;

        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
        dest[destIndex++] = src[srcIndex++];
    }

    private sampleData(imageData: Gif, f: Sampler) {
        const data = createImageData(imageData.width, imageData.height);
        for (let x = 0; x < imageData.width; ++x) {
            const frameIndex = Math.floor(x / imageData.width * imageData.frames.length);
            const frame = imageData.frames[frameIndex];
            for (let y = 0; y < imageData.height; ++y) {
                f(data, frame, x, y);
            }
        }
        return data;
    }

    private sampleDataTop(imageData: Gif, f: Sampler) {
        const data = createImageData(imageData.width, imageData.height);
        for (let y = 0; y < imageData.height; ++y) {
            const frameIndex = Math.floor(y / imageData.height * imageData.frames.length);
            const frame = imageData.frames[frameIndex];
            for (let x = 0; x < imageData.width; ++x) {
                f(data, frame, x, y);
            }
        }
        return data;
    }

    private frontImage(imageData: Gif) {
        return imageData.frames[0].data;
    }

    private rightImage(imageData: Gif) {
        return this.sampleData(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                y * imageData.width + (imageData.width - 1)));
    }

    private backImage(imageData: Gif) {
        return imageData.frames[imageData.frames.length - 1].data;
    }

    private leftImage(imageData: Gif) {
        return this.sampleData(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                y * imageData.width + 0));
    }

    private topImage(imageData: Gif) {
        return this.sampleDataTop(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                x));
    }

    private bottomImage(imageData: Gif) {
        return this.sampleDataTop(imageData, (data, frame, x, y) =>
            this.copyRgba(
                data.data,
                y * imageData.width + x,
                frame.data.data,
                x + (imageData.height - 1) * imageData.width));
    }

    private getFaceImages(imageData: Gif): any {
        const images = {
            front: this.frontImage(imageData),
            right: this.rightImage(imageData),
            back: this.backImage(imageData),
            left: this.leftImage(imageData),
            top: this.topImage(imageData),
            bottom: this.bottomImage(imageData),
        };

        return Object.keys(images).reduce((out, name) => {
            const mat = cubeMaterial.clone();
            mat.uniforms.tDiffuse.value = createTextureFromImageData((images as any)[name]);
            mat.uniforms.clippingPlane = cubeMaterial.uniforms.clippingPlane;
            out[name] = mat;
            return out;
        }, Object.create(null));
    }

    /**
     * Main render loop function.
     */
    private animateImpl() {
        if (this.disposed) {
            return;
        }

        requestAnimationFrame(this.animate);

        this.update();
        this.render();

        this._slicer = this._slicer || throttle(() => this.slice(), 50);

        if (this._needsSlice) {
            this._slicer(this._data);
            this._needsSlice = false;
        }
    }

    private update() {
        if (this._transformControls) {
            this._controls.update();
            this._transformControls.update();
        }

        this.checkPlaneDidChange()

        if (!this._cube)
            return;

        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0).applyMatrix4(this._plane.matrix);
        cubeMaterial.uniforms.clippingPlane.value.set(
            clippingPlane.normal.x,
            clippingPlane.normal.y,
            clippingPlane.normal.z,
            -clippingPlane.constant);
        (cubeMaterial.uniforms.clippingPlane as any).needsUpdate = true;
    }

    /**
     * Main render function.
     */
    private render() {
        this._renderer.clear();
        this._renderer.render(this._scene, this._camera);
        this._renderer.clearDepth();
        this._renderer.render(this._uiScene, this._camera);
    }

    /**
     * See if the sample plane's dimensions have changed
     */
    private checkPlaneDidChange() {
        const width = INITIAL_PLANE_SIZE * 2 * this._plane.scale.x;
        const height = INITIAL_PLANE_SIZE * 2 * this._plane.scale.y;

        this._planeWidth = width;
        this._planeHeight = height;
    }
}