import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, NavLink, Switch } from 'react-router-dom'
import { HomeView } from './views/home';
import { CreateView } from './views/create';
import { SelectView } from './views/select';
import { Location, History } from 'history';
import { Gif } from './load_gif';
import { CheckoutView } from './views/checkout';
import { DoneView } from './views/done';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import { Sample } from './3d_renderer';

const theme = createMuiTheme({
    palette: {
        primary: {
            light: '#ffaafb',
            main: '#ef78c8',
            dark: '#ef78c8',
            contrastText: '#fff',
        },
        secondary: {
            light: '#ffaafb',
            main: '#42ecf4',
            dark: '#ba4797',
            contrastText: '#000',
        },
    },
});


enum Stage {
    Unknown = -1,
    Home = 1,
    Select = 2,
    Slice = 3,
    Checkout = 4,
    Done = 5,
}

const getGetStage = (location: Location) => {
    const last = location.pathname.match(/(\w+)(\/|.html)?$/ig)
    const key = last ? last[0] : ''
    switch (key) {
        case '': return Stage.Home;
        case 'select': return Stage.Select;
        case 'slice': return Stage.Slice;
        case 'checkout': return Stage.Checkout;
        default:
            console.error('Unknown stage')
            return Stage.Unknown;
    }
}

class PageLinks extends React.Component<{ stage: Stage, gif?: Gif, slice?: ImageData }> {
    render() {
        const links: JSX.Element[] = [];

        if (this.props.stage === Stage.Select) {
            links.push(
                <div key={'select'} className='page-link active'>
                    <NavLink to={'/select'}>Select</NavLink>
                </div>,
                <div key='edit' className={'page-link ' + (this.props.gif ? 'visited' : 'disabled')}>
                    <NavLink to={'/slice'}>Slice</NavLink>
                </div>,
                <div key='checkout' className={'page-link ' + (this.props.slice ? 'visited' : 'disabled')}>
                    <NavLink to={'/checkout'}>Checkout</NavLink>
                </div>
            )
        } else if (this.props.stage === Stage.Slice) {
            links.push(
                <div key={'select'} className='page-link visited'>
                    <NavLink to={'/select'}>Select</NavLink>
                </div>,
                <div key='edit' className='page-link active'>
                    <NavLink to={'/slice'}>Slice</NavLink>
                </div>,
                <div key='checkout' className='page-link'>
                    <NavLink to={'/checkout'}>Continue to Checkout</NavLink>
                </div>
            )
        } else if (this.props.stage === Stage.Checkout) {
            links.push(
                <div key={'select'} className='page-link visited'>
                    <NavLink to={'/select'}>Select</NavLink>
                </div>,
                <div key='edit' className='page-link visited'>
                    <NavLink to={'/slice'}>Slice</NavLink>
                </div>,
                <div key='checkout' className='page-link active'>
                    <NavLink to={'/checkout'}>Checkout</NavLink>
                </div>
            )
        }

        return (
            <div className='page-links' >
                {links}
            </div>
        )
    }
}

class SiteHeader extends React.Component<{ stage: Stage, gif?: Gif, slice?: ImageData }> {
    render() {
        if (this.props.stage === Stage.Home) {
            return null;
        }

        return (
            <header className='site-header'>
                <nav className='site-nav'>
                    <NavLink to={'/'}>
                        <img
                            id='site-title'
                            className='site-logo'
                            src='/images/logo.svg'
                            alt='gif slice'
                            width={100} />
                    </NavLink>
                    <PageLinks {...this.props} />
                </nav>
            </header>
        )
    }
}

interface AppState {
    gif?: Gif;
    sample?: Sample;

    placedOrderId?: string;
}

class App extends React.Component<{}, AppState> {
    private _sample?: Sample;

    constructor(props: any) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <Router>
                    <Route render={({ location, history }) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }} className={location.pathname.replace('/', '')}>
                            <SiteHeader
                                stage={getGetStage(location)}
                                gif={this.state.gif}
                                slice={this.state.sample ? this.state.sample.data : undefined} />
                            <Switch>

                                <Route exact path='/'
                                    component={HomeView} />

                                <Route exact path='/select'
                                    component={() =>
                                        <SelectView
                                            onDidSelectGif={(gif: Gif) => this.onDidSelectGif(gif, history)} />} />

                                <Route exact path='/slice'
                                    component={() => {
                                        if (!this.state.gif) {
                                            history.push('/select');
                                            return <div />
                                        }
                                        return <CreateView
                                            gif={this.state.gif}
                                            onSampleDidChange={sample => this.onSampleDidChange(sample)}
                                            initialPlaneTransform={this._sample ? this._sample.planeTransform : undefined}
                                        />
                                    }
                                    } />

                                <Route exact path='/checkout'
                                    component={() => {
                                        if (!this._sample) {
                                            history.push('/select');
                                            return <div />
                                        }
                                        return <CheckoutView
                                            sample={this._sample!}
                                            gif={this.state.gif!}
                                            onDidOrder={orderId => {
                                                this.setState({ placedOrderId: orderId }, () => {
                                                    history.push('/done');
                                                })
                                            }} />
                                    }
                                    } />

                                <Route exact path='/done'
                                    component={() => {
                                        if (!this.state.placedOrderId) {
                                            history.push('/');
                                            return <div />
                                        }
                                        return <DoneView
                                            placedOrderId={this.state.placedOrderId} />
                                    }
                                    } />

                                <Route
                                    component={() => {
                                        return <h1>404</h1>
                                    }
                                    } />
                            </Switch>
                        </div>
                    )} />
                </Router>
            </MuiThemeProvider>
        )
    }

    private onDidSelectGif(gif: Gif, history: History): any {
        this.setState({ gif })
        history.push('/slice')
    }

    private onSampleDidChange(sample: Sample) {
        this._sample = sample
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('content'));
