import * as React from 'react';

export class SiteFooter extends React.PureComponent {
    render() {
        return (
            <footer className='site-footer'>
                <nav>
                    <a href='/faq.html' target='_blank' >FAQ</a>
                    <a href='mailto:gifslice@gmail.com'>Contact</a>
                </nav>

                <p className='copyright'>Site &copy; 2018 <a href='https://mattbierner.com'>Matt Bierner</a><br />Gifs copyright original creators</p>

                <a href='http://giphy.com/'>
                    <img src='/images/PoweredBy_200px-Black_HorizLogo.png' alt='Powered by Giphy' />
                </a>
            </footer>
        )
    }
}