/**
 * A class for handling peer-to-peer trading functionality.
 */

import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {isMobile} from 'react-device-detect';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {BoxView} from './BoxView';
import {config} from "./config";
import {BOX_HOME, BOX_SLOT_LEFT} from './MainPage';
import {PokemonSummary} from './PokemonSummary';
import {GetBaseFriendship, GetIconSpeciesLink, GetNickname, GetSpecies, TryActivateTradeEvolution} from './PokemonUtil';

import {AiOutlineCloseCircle, AiOutlineCheckCircle} from "react-icons/ai";
import {ImPaste} from "react-icons/im";
import {GoPerson} from "react-icons/go";

import SfxTradeComplete from './audio/TradeComplete.mp3';

import "./stylesheets/FriendTrade.css";
 
const FRIEND_TRADE_CHOOSE_CODE_TYPE = 0;
const FRIEND_TRADE_CREATED_CODE = 1;
const FRIEND_TRADE_INPUT_CODE = 2;
const FRIEND_TRADE_CHOOSE_POKEMON = 3;

const CODE_LENGTH = 8; //The friend code's length

const PopUp = withReactContent(Swal);
const tradeCompleteSound = new Audio(SfxTradeComplete);


export class FriendTrade extends Component
{
    /**********************************
            Page Setup Functions       
    **********************************/

    /**
     * Sets up the state needed for Friend Trading.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            friendTradeState: FRIEND_TRADE_CHOOSE_CODE_TYPE,
            friendPokemon: null,
            codeInput: "",
            codeCopied: false,
            globalState: props.globalState,
            homeBoxes: props.homeBoxes,
            homeTitles: props.homeTitles,
        };

        this.setGlobalState = props.setGlobalState;
        this.finishFriendTrade = props.finishFriendTrade;
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
     * Gets the Pokemon being offered in a trade.
     * @returns {Pokemon} The Pokemon that's be offered to be traded. Null if there isn't one yet.
     */
    getPokemonToTrade()
    {
        var tradeData = this.getGlobalState().tradeData;

        if (tradeData == null)
            return null

        return tradeData.pokemon;
    }

    /**
     * Resets the Friend Trade page back to square zero.
     */
    resetTradeState()
    {
        this.setState
        ({
            friendTradeState: FRIEND_TRADE_CHOOSE_CODE_TYPE,
            friendPokemon: null,
            codeInput: "",
            codeCopied: false,
        });

        this.getMainPage().resetStateForStartingFriendTrade(false);
    }


    /**********************************
            Connection Functions       
    **********************************/

    /**
     * Initializes a Friend Trade connection to the server.
     * @param {String} code - The friend code to check (if entering a code).
     * @param {Function <Component, WebSocket>} codeSendFunc - The function that either gets a friend code from the server or checks if one is valid.
     */
    initializeConnection(code, codeSendFunc)
    {
        const thisSetState = this.setState.bind(this);
        const handleLostConnection = this.handleLostConnection.bind(this);
        const connectedToFriend = this.connectedToFriend.bind(this);
        const couldntFindFriend = this.couldntFindFriend.bind(this);
        const partnerDisconnected = this.partnerDisconnected.bind(this);
        const handleInvalidPokemon = this.handleInvalidPokemon.bind(this);

        console.log("Connecting...");
        var socket = io(`${config.dev_server}`, {autoConnect: false});

        const tradeData =
        {
            socket: socket,
            pokemon: null,
        };

        this.setGlobalState({tradeData: tradeData}, () => //Lock first
        {
            let timerInterval;

            //Function run after connection established
            socket.on('connect', function()
            {
                //Other handler functions
                socket.on('disconnect', function() {handleLostConnection(socket)});
                socket.on('connect_error', function() {handleLostConnection(socket)});
                socket.on('friendFound', function() {connectedToFriend(socket)});
                socket.on('friendNotFound', function() {couldntFindFriend(socket)});
                socket.on('partnerDisconnected', function() {partnerDisconnected(socket)});
                socket.on('invalidPokemon', function() {handleInvalidPokemon()});
                socket.on('createCode', function(code) //Code is received from server
                {
                    navigator.clipboard.writeText(code).then((text) => //Copy to clipboard
                    {
                        thisSetState({codeInput: code, codeCopied: true});
                    });
                });

                //Get or send friend code
                codeSendFunc(socket, code);
            });

            //Try to connect
            socket.connect();
            PopUp.fire
            ({
                title: 'Connecting, please wait...',
                timer: 5000,
                timerProgressBar: true,
                allowOutsideClick: false,
                scrollbarPadding: false,
                didOpen: () =>
                {
                    if (!socket.connected)
                    {
                        PopUp.showLoading();
                        timerInterval = setInterval(() =>
                        {
                        }, 100);
                    }
                },
                willClose: () =>
                {
                    clearInterval(timerInterval);
                }
            }).then(() =>
            {
                if (!socket.connected)
                {
                    socket.close();

                    PopUp.fire
                    ({
                        title: "Couldn't connect!\nPlease try again later.",
                        cancelButtonText: `Awww`,
                        showConfirmButton: false,
                        showCancelButton: true,
                        icon: 'error',
                        scrollbarPadding: false,
                    }).then(() =>
                    {
                        this.resetTradeState();
                    });
                }
            });
        });   
    }

    /**
     * Handles ending the Friend Trade during a connection error.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    handleLostConnection(socket)
    {
        socket.close();

        PopUp.fire(
        {
            title: "The connection has been lost!\nThe Friend Trade was cancelled.",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            icon: 'error',
            scrollbarPadding: false,
        }).then(() =>
        {
            this.resetTradeState();
        });
    }

    /**
     * Handles ending the Friend Trade when the partner disconnects.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    partnerDisconnected(socket)
    {
        socket.close();

        PopUp.fire(
        {
            title: "Your partner has disconnected!\nThe Friend Trade was cancelled.",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            icon: 'error',
            scrollbarPadding: false,
        }).then(() =>
        {
            this.resetTradeState();
        });
    }

    /**
     * Creates a code the user can give to their friend to connect.
     */
    createCode()
    {
        this.initializeConnection("", this.getCreatedCode.bind(this));
    }

    /**
     * Requests a friend code from the server.
     * @param {WebSocket} socket - The socket used to connect to the server.
     * @param {*} unusedArg - An unused, but needed third argument.
     */
    getCreatedCode(socket, unusedArg)
    {
        socket.emit("tradeType", "FRIEND_TRADE"); //As opposed to WONDER_TRADE
        console.log("Connection established.");
        console.log("Requesting code...");
        socket.emit("createCode");
        console.log("Code request sent!");

        PopUp.close(); //Closes "Connecting..." pop up
        this.setState({friendTradeState: FRIEND_TRADE_CREATED_CODE});
    }

    /**
     * Copies the code received from the server.
     */
    async copyCreatedCode()
    {
        //Clear old copy state and pause in order to allow tooltip to regenerate
        this.setState({codeCopied: false}, async () => //First clear copy state
        {
            await new Promise(r => setTimeout(r, 100)); //Allows the tooltip to rerender
            navigator.clipboard.writeText(this.state.codeInput); //Copy to clipboard
            this.setState({codeCopied: true});
        });
    }

    /**
     * Pastes the text on the clipboard into the submission field and automatically
     * submits it if it could be a valid code.
     */
    pasteCode()
    {
        navigator.clipboard.readText().then((text) =>
        {
            this.setState({codeInput: text}, () =>
            {
                if (this.state.codeInput.length === CODE_LENGTH) //Pasted in a valid code
                    this.handleSubmitCode(); //Auto submit the code for the user for convenience
            });
        });
    }

    /**
     * Sends the friend code in the input field to the server.
     * @param {Object} e - The form submission event.
     */
    submitCode(e)
    {
        e.preventDefault(); //Page reload
        this.handleSubmitCode();
    }

    /**
     * Handles sending the friend code in the input field to the server.
     */
    handleSubmitCode()
    {
        if (this.state.codeInput.length !== CODE_LENGTH)
        {
            //Save time by not calling the server when the code's obviously wrong
            this.couldntFindFriendPopUp(this.state.codeInput);
            this.setState({codeInput: ""}); //Must go after pop-up
        }
        else
            this.initializeConnection(this.state.codeInput, this.sendInputCode.bind(this));
    }

    /**
     * Sends the friend code to the
     * @param {WebSocket} socket - The socket used to connect to the server.
     * @param {String} code - The friend code to check on the server.
     */
    sendInputCode(socket, code)
    {
        socket.emit("tradeType", "FRIEND_TRADE"); //As opposed to WONDER_TRADE
        console.log("Connection established.");
        console.log("Sending code...");
        socket.emit("checkCode", code);
        console.log("Code sent!");

        PopUp.fire
        ({
            title: `Checking for the friend code...`,
            showConfirmButton: false,
            scrollbarPadding: false,
            didOpen: () =>
            {
                PopUp.showLoading();
            },
        });
    }

    /**
     * Processes the notice from the server that the code entered wasn't a valid friend code.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    couldntFindFriend(socket)
    {
        socket.close();
        this.setGlobalState({tradeData: null});
        this.couldntFindFriendPopUp(this.state.codeInput);
        this.setState({codeInput: ""}); //Must go after pop-up
    }

    /**
     * Displays a pop-up to the user that the code the entered wasn't a valid friend code.
     * @param {String} codeInput - THe code the user entered.
     */
    couldntFindFriendPopUp(codeInput)
    {
        var title;

        if (codeInput === "")
            title = "Your friend's code isn't blank!";
        else
            title = `No friend with the code "${codeInput}" was found!`;

        PopUp.fire
        ({
            title: title,
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            icon: 'error',
            scrollbarPadding: false,
        });
    }

    /**
     * Confirms the connection for the Friend Trade.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    connectedToFriend(socket)
    {
        const receivedTradeOffer = this.receivedTradeOffer.bind(this);
        this.setState({codeCopied: false}); //Hides tooltip

        PopUp.fire
        ({
            title: "Connected to your friend!",
            confirmButtonText: `Choose Pokémon`,
            scrollbarPadding: false,
        }).then(() =>
        {
            this.setState({friendTradeState: FRIEND_TRADE_CHOOSE_POKEMON});
        });

        //Prepare new communication function
        socket.on('tradeOffer', function(pokemon)
        {
            receivedTradeOffer(socket, pokemon);
        });
    }
 
    /**
     * Sends a Pokemon offer to the trade partner.
     * @param {Pokemon} pokemon - The Pokemon to offer in a trade.
     */
    offerPokemonToTrade(pokemon)
    {
        var socket = this.getGlobalState().tradeData.socket;
        if (socket != null)
            socket.emit("tradeOffer", pokemon);
    }

    /**
     * Handles receiving a trade offer from the trade partner.
     * @param {WebSocket} socket - The socket used to connect to the server.
     * @param {Pokemon} pokemon - The Pokemon offered in the trade.
     */
    receivedTradeOffer(socket, pokemon)
    {
        console.log(`Friend is offering to trade ${GetSpecies(pokemon)}.`);
        this.setState({friendPokemon: pokemon});

        //If the user previously confirmed, cancel the confirmation since the Pokemon has changed
        socket.emit("cancelledTradeAcceptance");
        PopUp.close(); //If one is open because the user was waiting for their friend to confirm too
    }

    /**
     * Cancels the Pokemon currently being offered to the trade partner.
     */
    cancelTradeOffer()
    {
        var tradeData = this.getGlobalState().tradeData;
        tradeData.pokemon = null;

        this.setGlobalState({tradeData: tradeData});
        this.offerPokemonToTrade(null);
    }

    /**
     * Cancels the Pokemon currently being offered to the trade partner due to checksum mismatch.
     */
    handleInvalidPokemon()
    {
        console.log("Pokemon failed checksum!");
        this.cancelTradeOffer();

        PopUp.fire(
        {
            title: "That Pokemon appears invalid and can't be traded!",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            icon: 'error',
            scrollbarPadding: false,
        });
    }

    /**
     * Accepts the Pokemon currently offered by the trade partner.
     */
    confirmTradeOffer()
    {
        var socket = this.getGlobalState().tradeData.socket;
        const finalizeTrade = this.finalizeTrade.bind(this);

        if (socket != null)
        {
            socket.emit("acceptedTrade");

            socket.on('acceptedTrade', function()
            {
                finalizeTrade(socket);
            });

            PopUp.fire
            ({
                title: "Waiting for your friend's choice...",
                showDenyButton: true, //Red button
                denyButtonText: "Cancel",
                scrollbarPadding: false,
                didOpen: () =>
                {
                    PopUp.showLoading(); //Spinny circle
                },
                willClose: () =>
                {
                    socket.emit("cancelledTradeAcceptance"); //Clicking outside closes the pop-up and undoes the confirmation
                }
            });
        }
    }

    /**
     * Receives the Pokemon offered in the trade and tries to start a new trade.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    finalizeTrade(socket)
    {
        let newPokemon = this.state.friendPokemon;

        console.log(`Receieved ${GetNickname(newPokemon)}`);
        newPokemon.friendship = GetBaseFriendship(newPokemon); //Reset after being traded
        TryActivateTradeEvolution(newPokemon, GetSpecies(this.getPokemonToTrade()));
        this.finishFriendTrade(newPokemon, BOX_HOME,
                    this.getGlobalState().tradeData.boxNum,
                    this.getGlobalState().tradeData.boxPos);

        if (!this.getGlobalState().muted)
            tradeCompleteSound.play();

        PopUp.fire
        ({
            title: `${GetNickname(newPokemon)} was received!`,
            confirmButtonText: "Trade Again",
            cancelButtonText: "Done Trading",
            showCancelButton: true,
            allowOutsideClick: false,
            imageUrl: GetIconSpeciesLink(newPokemon),
            imageAlt: "",
            scrollbarPadding: false,
        }).then((result) =>
        {
            if (result.isConfirmed) //Trade again
            {
                //Prepare for next trade
                let tradeData = this.getGlobalState().tradeData;
                tradeData.pokemon = null;
                this.setState({friendPokemon: null})
                this.setGlobalState({tradeData: tradeData});
                this.getMainPage().resetStateForStartingFriendTrade(true);
                socket.emit("tradeAgain");
            }
            else //Done trading
            {
                socket.off("disconnect"); //Prevents disconnected pop-up from showing
                socket.close();
                this.resetTradeState(); //Prep for a future trade - must go before setGlobalState
                this.setGlobalState({inFriendTrade: false}); //Done trading
            }
        });
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
    printPokemonOffer(pokemon, title)
    {
        return (
            <div className="friend-trade-offer">
                <div className="friend-trade-offer-title-container">
                    <span className="friend-trade-offer-title">{title}</span>
                    {
                        pokemon != null ?
                            <img src={GetIconSpeciesLink(pokemon)} alt={GetNickname(pokemon)}
                                onMouseDown={(e) => e.preventDefault()}/>
                        :
                            <div className="blank-placeholder-mon-icon"></div>
                    }
                </div>
                {
                    pokemon != null ?
                        <PokemonSummary pokemon={pokemon} areBoxViewsVertical={this.getMainPage().areBoxViewsVertical()}
                                        boxType={BOX_HOME} changeWasMade={null}
                                        gameId={this.getGlobalState().saveGameId}
                                        setGlobalState={this.setGlobalState.bind(this)}
                                        key={0} inTrade={true}/>
                    :
                        <div className="pokemon-summary-container">None Yet</div>
                }
            </div>
        );
    }

    /**
     * Prints the page where the user can choose to create a code or enter a code.
     * @returns {JSX} The choose code type page.
     */
    chooseCodeTypePage()
    {
        var iconSize = 33;

        return (
            <div className="friend-trade-code-choice-page">
                <div className="friend-trade-code-choice-instructions">
                    <div className="friend-trade-code-choice-title-container">
                        <GoPerson size={iconSize}/>
                        <h1 className="friend-trade-code-choice-title">Friend Trade</h1>
                        <GoPerson size={iconSize}/>
                    </div>
                    <h2>One friend creates a code.</h2>
                    <h2>The other enters the code created.</h2>
                </div>
                <div className="friend-trade-code-choice-buttons">
                    <Button className="friend-trade-offer-button friend-trade-code-button"
                            onClick={this.createCode.bind(this)}>
                        Create Code
                    </Button>

                    <Button className="friend-trade-offer-button friend-trade-code-button"
                            onClick={() => this.setState({friendTradeState: FRIEND_TRADE_INPUT_CODE})}>
                        Enter Code
                    </Button>
                </div>
            </div>
        );
    }

    /**
     * Prints the page where the user can see the code created that must be sent to their friend.
     * @returns {JSX} The created code page.
     */
    viewCreatedCodePage()
    {
        const codeCopiedTooltip = props => (<Tooltip {...props}>Code Copied!</Tooltip>);
        var isCodeCopied = this.state.codeCopied;

        return (
            <div className="friend-trade-code-display-page">
                <h2>Have your friend enter this code!</h2>
                <div className="friend-trade-code-display-container">
                    <OverlayTrigger placement="bottom" show={isCodeCopied} overlay={codeCopiedTooltip}>
                        <div className="friend-trade-code-display-code" translate="no"
                                style={isCodeCopied ? {backgroundColor: "rgba(100,100,100,.4)"} : {}}
                                onClick={this.copyCreatedCode.bind(this)}>
                            {this.state.codeInput}
                        </div>
                    </OverlayTrigger>
                </div>
            </div>
        );
    }

    /**
     * Prints the page where the user can enter the code they received from their friend.
     * @returns {JSX} The code input page.
     */
    inputCodePage()
    {
        const submitTooltip = props => (<Tooltip {...props}>Submit</Tooltip>);
        const pasteTooltip = props => (<Tooltip {...props}>Paste</Tooltip>);
        var pasteButtonSize = 30;
        var confirmButtonSize = 42;

        return (
            <div className="friend-trade-code-input-page">
                <Form onSubmit={(e) => this.submitCode(e)}>
                    <Form.Label><h2>Enter the code your friend created!</h2></Form.Label>
                    <Form.Group controlId="code" className="friend-trade-code-input-container">
                        <Form.Control type="text"
                            size="lg"
                            value={this.state.codeInput}
                            onChange={(e) => this.setState({codeInput: e.target.value.substring(0, CODE_LENGTH)})}/>

                        <OverlayTrigger placement="bottom" overlay={pasteTooltip}>
                            <Button size="sm" className="friend-trade-offer-button friend-trade-code-button"
                                    aria-label="Paste Code"
                                    onClick={this.pasteCode.bind(this)}>
                                <ImPaste size={pasteButtonSize}/>
                            </Button>
                        </OverlayTrigger>
                    </Form.Group>

                    <div className="friend-trade-code-input-button">
                        <OverlayTrigger placement="bottom" overlay={submitTooltip}>
                            <Button size="lg" className="friend-trade-offer-button friend-trade-code-button"
                                    aria-label="Submit Code"
                                    type="submit">
                                <AiOutlineCheckCircle size={confirmButtonSize}/>
                            </Button>
                        </OverlayTrigger>
                    </div>
                </Form>
            </div>
        );
    }

    /**
     * Prints the page where the user can pick a Pokemon to send for the trade.
     * @returns {JSX} The choose Pokemon and Pokemon offers pages.
     */
    choosePokemonPage()
    {
        var selectedMonForTrade = this.getPokemonToTrade();
        var friendPokemon = this.state.friendPokemon;
        var size = 42;

        if (selectedMonForTrade == null) //Haven't picked a Pokemon yet
        {
            var boxView =
                <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                        parent={this.getMainPage()} boxType={BOX_HOME} boxSlot={BOX_SLOT_LEFT}
                        isSameBoxBothSides={false} key={BOX_HOME}
                        inTrade={true} tradeParent={this}/>;

            return boxView;
        }
        else //Picked a Pokemon
        {
            const cancelTradeTooltip = props => (<Tooltip {...props}>Choose Another Pokemon</Tooltip>);
            const acceptTradeTooltip = props => (<Tooltip {...props}>Accept Trade</Tooltip>);

            var cancelButton =
                <OverlayTrigger placement="bottom" overlay={cancelTradeTooltip}>
                    <Button size="lg" className="friend-trade-offer-button"
                            variant="danger"
                            aria-label="Cancel Trade"
                            onClick={this.cancelTradeOffer.bind(this)}>
                        <AiOutlineCloseCircle size={size}/>
                    </Button>
                </OverlayTrigger>;

            var acceptTradeButton =
                <OverlayTrigger placement="bottom" overlay={acceptTradeTooltip}>
                    <Button size="lg" className="friend-trade-offer-button"
                            variant="success"
                            aria-label="Confirm Trade"
                            onClick={this.confirmTradeOffer.bind(this)}>
                        <AiOutlineCheckCircle size={size}/>
                    </Button>
                </OverlayTrigger>;

            return (
                <div className="friend-trade-offers-container">
                    <div className="friend-trade-offers">
                        {this.printPokemonOffer(selectedMonForTrade, "Your Offer")}
                        {this.printPokemonOffer(friendPokemon, "Friend's Offer")}
                    </div>
                    <div className="friend-trade-offer-buttons">
                        {cancelButton}
                        {friendPokemon != null ? acceptTradeButton : ""}
                    </div>
                </div>
            );
        }
    }

    /**
     * Prints the Friend Trade page.
     */
    render()
    {
        var pageContents;

        switch (this.state.friendTradeState)
        {
            case FRIEND_TRADE_CHOOSE_CODE_TYPE:
                pageContents = this.chooseCodeTypePage();
                break;
            case FRIEND_TRADE_CREATED_CODE:
                pageContents = this.viewCreatedCodePage();
                break;
            case FRIEND_TRADE_INPUT_CODE:
                pageContents = this.inputCodePage();
                break;
            case FRIEND_TRADE_CHOOSE_POKEMON:
                pageContents = this.choosePokemonPage();
                break;
            default:
                pageContents = "";
                break;
        }

        return (
            <div className="friend-trade-page"
                 style={!isMobile ? {paddingLeft: "var(--scrollbar-width)"} : {}}>
                {pageContents}
            </div>
        )
    }
}
