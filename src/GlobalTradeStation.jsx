/**
 * A class for handling global trading functionality.
 */

import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {isMobile} from 'react-device-detect';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {BOX_HOME} from './MainPage';
import {PokemonSummary} from './PokemonSummary';

import "./stylesheets/GlobalTradeStation.css";

const GTS_CHOOSE_DEPOSIT_OR_SEARCH = 0;
const GTS_CHOOSE_DEPOSIT_POKEMON = 1;
const GTS_SEARCH = 2;
const GTS_CHOOSE_POKEMON_FOR_OFFER = 3;

const PopUp = withReactContent(Swal);

export class GlobalTradeStation extends Component
{
    /**********************************
            Page Setup Functions       
    **********************************/

    /**
     * Sets up the state needed for Global Trading.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            gtsState: GTS_CHOOSE_DEPOSIT_OR_SEARCH,
            depositedPokemon: [],
            globalState: props.globalState,
            homeBoxes: props.homeBoxes,
            homeTitles: props.homeTitles,
        };

        this.setGlobalState = props.setGlobalState;
    }

    /**
     * Overrides the back button to return to the main page.
     */
    componentDidMount()
    {
        window.history.pushState(null, document.title, window.location.href)
        window.addEventListener("popstate", this.getMainPage().navBackButtonPressed.bind(this.getMainPage()));
    }

    /**
     * Gets the main page component.
     * @returns {Component} The main page component.
     */
    getMainPage()
    {
        return this.state.globalState;
    }

    /**
     * Gets the state of MainPage.
     * @returns {Object} The this.state object of MainPage.js.
     */
    getGlobalState()
    {
        return this.getMainPage().state;
    }

    /**
     * Gets the current state in the Gloobal Trade process.
     * @returns {Number} - One of the states listed at the top of GlobalTradeStation.js.
     */
    getGlobalTradeStationState()
    {
        return this.state.gtsState;
    }


    /**********************************
           Page Render Functions       
    **********************************/

    /**
     * Prints a Pokemon being offered for the trade.
     * @param {Pokemon} pokemon - The Pokemon being offered.
     * @param {String} title - The title of the offer (eg. by whom).
     * @returns {JSX} The Pokemon offer container.
     */
    printPokemonOffer(pokemon)
    {
        if (pokemon == null)
        {
            return (
                <div className="gts-offer">
                    Error: Null Pokemon
                </div>
            )
        }

        return (
            <div className="gts-offer">
                <PokemonSummary pokemon={pokemon} areBoxViewsVertical={this.getMainPage().areBoxViewsVertical()}
                                boxType={BOX_HOME} changeWasMade={null}
                                gameId={this.getGlobalState().saveGameId} viewingEVsIVs={this.getGlobalState().viewingSummaryEVsIVs}
                                isSaveBox={false}
                                setGlobalState={this.setGlobalState.bind(this)}
                                key={0} inTrade={true} inGTS={true} />
            </div>
        );
    }

    /**
     * Prints the page that shows current deposited Pokemon and also a button to search for a specific mon.
     * @returns {JSX} The deposit or search page. 
     */
    depositOrSearchPage()
    {
        return (
            ""
        );
    }

    /**
     * Displays the box view to pick a Pokemon to deposit on the GTS.
     * @returns {JSX} The box view.
     */
    chooseDepositPokemonPage()
    {
        return (
            ""
        );
    }

    /**
     * Displays the page to filter Pokemon from the GTS.
     * @returns {JSX} The search page.
     */
    searchPage()
    {
        return (
            ""
        );
    }

    /**
     * Displays the box view to pick a requested Pokemon.
     * @returns {JSX} The box view.
     */
    choosePokemonForOfferPage()
    {
        return (
            ""
        );
    }

    /**
     * Prints the Friend Trade page.
     */
    render()
    {
        var pageContents;

        switch (this.getGlobalTradeStationState())
        {
            case GTS_CHOOSE_DEPOSIT_OR_SEARCH:
                pageContents = this.depositOrSearchPage();
                break;
            case GTS_CHOOSE_DEPOSIT_POKEMON:
                pageContents = this.chooseDepositPokemonPage();
                break;
            case GTS_SEARCH:
                pageContents = this.searchPage();
                break;
            case GTS_CHOOSE_POKEMON_FOR_OFFER:
                pageContents = this.choosePokemonForOfferPage();
                break;
            default:
                pageContents = "";
                break;
        }

        if (this.getGlobalState().viewingBoxList >= 0)
        {
            //BoxList must be called from GlobalTradeStation otherwise GlobalTradeStation loses its state
            return this.getMainPage().boxListScreen();
        }
        else
        {
            return (
                <div className="gts-page"
                     style={!isMobile ? {paddingLeft: "var(--scrollbar-width)"} : {}}>
                    {pageContents}
                </div>
            );
        }
    }
}
