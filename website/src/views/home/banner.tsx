import * as React from 'react';
import * as THREE from 'three';

import { loadGif } from '../../load_gif';
import { Link } from 'react-router-dom';
import { CubeRenderer } from '../../3d_renderer';


interface FrameProps {
    renderer?: CubeRenderer
}

class Frame extends React.PureComponent<FrameProps> {
    private canvas: HTMLCanvasElement | null = null;

    componentDidMount() {
        this.redraw(this.props.renderer);

        setInterval(() => this.redraw(this.props.renderer), 1000);
    }

    componentWillUnmount() {
        this.canvas = null;
    }

    componentWillReceiveProps(newProps: FrameProps) {
        this.redraw(newProps.renderer)
    }

    render() {
        return (
            <div className='frame' style={{ position: 'relative' }}>
                <canvas ref={canvas => this.canvas = canvas} width={256} height={256} />
            </div>
        )
    }

    private redraw(renderer: CubeRenderer | undefined) {
        if (!renderer || !this.canvas) {
            return
        }

        const ctx = this.canvas.getContext('2d')
        if (!ctx) {
            return
        }

        const slice = renderer.doSlice(renderer._plane, 256, 256);

        ctx.putImageData(slice!.data, 0, 0);
        renderer.modifyPlane(plane => {
            plane.rotateX(Math.random() * Math.PI);
            plane.rotateY(Math.random() * Math.PI);
            plane.rotateZ(Math.random() * Math.PI);
            plane.updateMatrix();
        });
    }
}

interface BannerState {
    renderer?: CubeRenderer
    ready: boolean
}

export class Banner extends React.Component<{}, BannerState> {
    private readonly gif = 'https://media.giphy.com/media/Dym2LTuxGJJSw/giphy.gif'

    private _renderer?: CubeRenderer;

    constructor(props: any) {
        super(props)
        this.state = {
            renderer: undefined,
            ready: false
        }
    }

    componentDidMount() {
        const canvas = document.createElement('canvas')
        this._renderer = new CubeRenderer(canvas, canvas, {},
            {
                initialPlanePosition: new THREE.Vector3(0, 0, 0),
                enableControls: false
            })

        loadGif(this.gif).then(data => {
            if (this._renderer) {
                this._renderer.setGif(data);
                this.setState({ renderer: this._renderer })
            }
        })
    }

    componentWillUnmount() {
        if (this._renderer) {
            this._renderer.dispose();
            this._renderer = undefined;
        }
    }

    render() {
        const frames: JSX.Element[] = [];
        for (let i = 0; i < 9; ++i) {
            frames.push(<Frame key={i} renderer={this.state.renderer} />)
        }

        return (
            <div className='site-banner'>
                <div style={{ position: 'relative' }} className='banner-left'>
                    <img src={this.gif} className={this.state.ready ? 'gif-fade' : 'hidden'} onLoad={() => this.setState({ ready: true })} />
                    <div className={'frames ' + (this.state.ready ? 'frames-fade' : 'hidden')}>{frames}</div>
                </div>
                <div className='banner-right'>
                    <h1><span className={this.state.ready ? 'initial-fade' : 'hidden'}>Turn any gif<span className={this.state.ready ? 'gif-fade' : 'hidden'}>...</span></span><br /><span className={this.state.ready ? 'frames-fade' : 'hidden'}>into <span className='classy'>classy</span> slices of art</span></h1>
                    <Link to='/select' className={'big-button-link get-started-button ' + (this.state.ready ? 'frames-fade' : 'hidden')}>Get Started</Link>
                </div>
            </div>
        )
    }
}
