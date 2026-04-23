import React, {Component} from 'react';
import PropTypes from 'prop-types';

import "./stylesheets/GoogleAds.css";

const GOOGLE_AD_ID = 'ca-pub-6540858947703998';


export class GoogleAd extends Component
{
    googleInit = null;

    componentDidMount()
    {
        this.googleInit = setTimeout(() =>
        {
            this.initAd();
        }, 200);
    }

    shouldComponentUpdate(nextProps)
    {
        const {props: {path}} = this;
        return nextProps.path !== path;
    }

    componentDidUpdate()
    {
        this.initAd();
    }

    componentWillUnmount()
    {
        if (this.googleInit)
            clearTimeout(this.googleInit);
    }

    initAd()
    {
        if (typeof(window) !== 'undefined')
            (window.adsbygoogle = window.adsbygoogle || []).push({});
    }

    render()
    {
        const {classNames, slot} = this.props;

        return (
            <div className={"google-ad " + classNames}>
                <ins
                    className="adsbygoogle"
                    style={{display: 'block'}}
                    data-ad-client={GOOGLE_AD_ID}
                    data-ad-slot={slot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                ></ins>
            </div>
        );
    }
}

GoogleAd.propTypes =
{
    classNames: PropTypes.string,
    slot: PropTypes.string,
};

GoogleAd.defaultProps =
{
    classNames: "",
};
