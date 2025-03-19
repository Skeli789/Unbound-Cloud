/**
 * A class for handling peer-to-peer trading functionality.
 */

import React, {Component} from 'react';
import {Button, Form, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {isMobile} from 'react-device-detect';
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {BoxView, HIGHEST_HOME_BOX_NUM} from './BoxView';
import {config} from "./config";
import {CanUseFileHandleAPI, BOX_HOME, BOX_SLOT_LEFT} from './MainPage';
import {PokemonSummary} from './PokemonSummary';
import {GetIconSpeciesLink, GetNickname, GetSpecies} from './PokemonUtil';
import {Timer} from './Timer';
import {GetSpeciesName} from './Util';

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
const TIMER_AMOUNT = 60 * 10 //10 minutes once a socket is opened

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
            timerKey: 0,
            timerHidden: false,
            timerSeconds: TIMER_AMOUNT,
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
     * Gets the current state in the Friend Trade process.
     * @returns {Number} - One of the states listed at the top of FriendTrade.js.
     */
    getFriendTradeState()
    {
        return this.state.friendTradeState;
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
     * Sets the current state in the Friend Trade process.
     * @param {Number} newState - One of the states listed at the top of FriendTrade.js.
     */
    setFriendTradeState(newState)
    {
        this.setState({friendTradeState: newState});
    }

    /**
     * Resets the Friend Trade page back to square zero.
     */
    resetTradeState()
    {
        this.setState
        ({
            friendPokemon: null,
            codeInput: "",
            codeCopied: false,
        });

        this.resetTimer();
        this.setFriendTradeState(FRIEND_TRADE_CHOOSE_CODE_TYPE);
        this.getMainPage().resetStateForStartingFriendTrade(false);
    }

    /**
     * Resets the timer displayed during the Friend Trade process.
     */
    resetTimer()
    {
        this.setState
        ({
            timerHidden: false,
            timerSeconds: TIMER_AMOUNT,
        });
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
        const thisSetFriendTradeState = this.setFriendTradeState.bind(this);
        const handleLostConnection = this.handleLostConnection.bind(this);
        const connectedToFriend = this.connectedToFriend.bind(this);
        const couldntFindFriend = this.couldntFindFriend.bind(this);
        const mismatchedRandomizer = this.mismatchedRandomizer.bind(this);
        const partnerDisconnected = this.partnerDisconnected.bind(this);
        const handleInvalidPokemon = this.handleInvalidPokemon.bind(this);
        const handleInvalidCloudDataSyncKey = this.handleInvalidCloudDataSyncKey.bind(this);

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
                socket.on('mismatchedRandomizer', function() {mismatchedRandomizer(socket)});
                socket.on('partnerDisconnected', function() {partnerDisconnected(socket)});
                socket.on('invalidPokemon', function() {handleInvalidPokemon()});
                socket.on('invalidCloudDataSyncKey', function(data)
                {
                    handleInvalidCloudDataSyncKey(socket, data)
                });
                socket.on('createCode', function(code) //Code is received from server
                {
                    console.log(`Received code: ${code}`);

                    let advanceState = (codeCopied) =>
                    {
                        thisSetState({codeInput: code, codeCopied: codeCopied});
                        thisSetFriendTradeState(FRIEND_TRADE_CREATED_CODE);
                        PopUp.close(); //Closes "Connecting..." pop up
                    }

                    if (navigator.clipboard && navigator.clipboard.writeText)
                    {
                        navigator.clipboard.writeText(code).then((text) => //Copy to clipboard
                        {
                            advanceState(true);
                        }).catch((err) => //In case the copy fails on mobile browsers
                        {
                            console.error(`Couldn't copy code to clipboard: ${err}`);
                            advanceState(false);
                        });
                    }
                    else //In case the copy fails on mobile browsers
                        advanceState(false);
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
                        icon: 'error',
                        title: "Couldn't connect!\nPlease try again later.",
                        cancelButtonText: `Awww`,
                        showConfirmButton: false,
                        showCancelButton: true,
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
        this.hideTimer();
        socket.close();

        PopUp.fire(
        {
            icon: 'error',
            title: "The connection has been lost!\nThe Friend Trade was cancelled.",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
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
        this.hideTimer();
        socket.close();

        PopUp.fire(
        {
            icon: 'error',
            title: "Your partner has disconnected!\nThe Friend Trade was cancelled.",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            scrollbarPadding: false,
        }).then(() =>
        {
            this.resetTradeState();
        });
    }

    /**
     * Handles ending the Friend Trade due to the connection having gone on too long.
     */
    timedOut()
    {
        this.getGlobalState().tradeData.socket.off("disconnect"); //Prevents disconnected pop-up from showing
        this.getGlobalState().tradeData.socket.close();
        this.resetTradeState();

        PopUp.fire(
        {
            icon: 'error',
            title: "Time's up!\nYou spent too long on the trade!",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            scrollbarPadding: false,
        });
    }

    /**
     * Handles ending the Friend Trade because the Cloud Boxes were already loaded in a new tab.
     * @param {WebSocket} socket - The socket used to connect to the server.
     * @param {Object} data - The object with the error message sent from the server.
     */
    handleInvalidCloudDataSyncKey(socket, data)
    {
        this.hideTimer();
        socket.close();
        console.log("Cloud data sync key invalid!");

        PopUp.fire(
        {
            title: data,
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
     * @param {*} unusedArg - An unused, but needed second argument.
     */
    getCreatedCode(socket, unusedArg)
    {
        socket.emit("tradeType", "FRIEND_TRADE", this.getGlobalState().username); //As opposed to WONDER_TRADE
        console.log("Connection established.");
        console.log("Requesting code...");
        socket.emit("createCode", this.getGlobalState().isRandomizedSave,
                    this.getGlobalState().username, this.getGlobalState().cloudDataSyncKey);
        console.log("Code request sent!");
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
        socket.emit("tradeType", "FRIEND_TRADE", this.getGlobalState().username); //As opposed to WONDER_TRADE
        console.log("Connection established.");
        console.log("Sending code...");
        socket.emit("checkCode", code, this.getGlobalState().isRandomizedSave,
                    this.getGlobalState().username, this.getGlobalState().cloudDataSyncKey);
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
        this.resetTimer();
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
            icon: 'error',
            title: title,
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            scrollbarPadding: false,
        });
    }

    /**
     * Processes the notice from the server that a randomized save can't trade with a regular one.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    mismatchedRandomizer(socket)
    {
        var title = "Found your friend, but ";
        socket.close();
        this.setGlobalState({tradeData: null});
        
        if (this.getGlobalState().isRandomizedSave)
            title += "your randomized save can't trade with your friend's regular save!";
        else
            title += "your regular save can't trade with your friend's randomized save!";

        PopUp.fire
        ({
            icon: 'error',
            title: title,
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            scrollbarPadding: false,
        });
    
        this.setState({codeInput: ""}); //Must go after pop-up
        this.resetTimer();
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
            this.setFriendTradeState(FRIEND_TRADE_CHOOSE_POKEMON);
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
        this.setState({friendPokemon: pokemon});
        if (pokemon == null)
            console.log(`Friend has cancelled trade offer.`);
        else
            console.log(`Friend is offering to trade ${GetSpecies(pokemon)}.`);

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
            icon: 'error',
            title: "That Pokemon appears invalid and can't be traded!",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
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
        const hideTimer = this.hideTimer.bind(this);
        
        //First make sure the friend's offer isn't a duplicate
        let alreadyExistsRet = this.getMainPage().monAlreadyExistsInBoxes(this.state.friendPokemon,
                                    this.getMainPage().getBoxesByBoxType(BOX_HOME), HIGHEST_HOME_BOX_NUM, -1);

        if (alreadyExistsRet.boxNum >= 0)
        {
            PopUp.fire
            ({
                icon: "error",
                title: "You already have what your friend is offering!\nTell your friend to offer something else.",
                text: `The duplicate is in ${this.getGlobalState().homeTitles[alreadyExistsRet.boxNum]}.`,
                confirmButtonText: "Awww",
                scrollbarPadding: false,
            });

            return;
        }

        //Then send the acceptance
        if (socket != null)
        {
            socket.emit("acceptedTrade");

            socket.on('acceptedTrade', function(pokemon)
            {
                hideTimer(); //Prevent disconnecting now that the trade is done
                finalizeTrade(socket, pokemon);
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
     * Hides the active timer.
     */
    hideTimer()
    {
        this.setState({timerHidden: true});
    }

    /**
     * Receives the Pokemon offered in the trade and tries to start a new trade.
     * @param {WebSocket} socket - The socket used to connect to the server.
     * @param {Pokemon} newPokemon - The Pokemon received in the trade.
     */
    finalizeTrade(socket, newPokemon)
    {
        console.log(`Received ${GetNickname(newPokemon)}`);
        this.finishFriendTrade(newPokemon, BOX_HOME,
                    this.getGlobalState().tradeData.boxNum,
                    this.getGlobalState().tradeData.boxPos);

        if (!this.getGlobalState().muted)
            tradeCompleteSound.play();

        var newPokemonSpecies = GetSpeciesName(GetSpecies(newPokemon));
        PopUp.fire
        ({
            title: `${GetNickname(newPokemon)}${GetNickname(newPokemon) !== newPokemonSpecies ? ` (${newPokemonSpecies})` : ""} was received!`,
            confirmButtonText: "Hooray!",
            imageUrl: GetIconSpeciesLink(newPokemon),
            imageAlt: "",
            scrollbarPadding: false,
            timer: 60 * 1000, //Automatic pop-up because timer is currently hidden
            timerProgressBar: true,
        }).then(async () =>
        {
            if (CanUseFileHandleAPI())
            {
                //Force a save
                let savedSucessfully = await this.getMainPage().downloadSaveFileAndHomeData();
                if (!savedSucessfully)
                {
                    PopUp.fire
                    ({
                        icon: 'error',
                        title: "Error saving data!",
                        html: this.getGlobalState().savingMessage,
                        confirmButtonText: "Awww",
                        allowOutsideClick: false,
                        scrollbarPadding: false,
                        timer: 60 * 1000, //Automatic pop-up because timer is currently hidden
                        timerProgressBar: true,
                        didOpen: () =>
                        {
                            PopUp.hideLoading(); //From previous pop-ups
                        }
                    }).then(() =>
                    {
                        //Force the save to end after this first one
                        this.getMainPage().wipeErrorMessage();
                        socket.off("disconnect"); //Prevents disconnected pop-up from showing
                        socket.close();
                        this.resetTradeState(); //Prep for a future trade - must go before setGlobalState
                        this.setGlobalState({savingMessage: "", isSaving: false, inFriendTrade: false}); //Done trading
                    });
                }
                else
                    this.printPromptToContinueTrading(socket);
            }
            else //Don't force a save when the user has to download their file each time
                this.printPromptToContinueTrading(socket);
        });
    }

    /**
     * Prints a pop-up that asks the player if they want to keep on trading.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    printPromptToContinueTrading(socket)
    {
        PopUp.fire
        ({
            title: "Continue trading?",
            confirmButtonText: "Trade Again",
            cancelButtonText: "Done Trading",
            showCancelButton: true,
            allowOutsideClick: false,
            scrollbarPadding: false,
            timer: 60 * 1000, //Automatic pop-up because timer is currently hidden
            timerProgressBar: true,
        }).then((result) =>
        {
            if (result.isConfirmed) //Trade again
            {
                //Prepare for next trade
                let tradeData = this.getGlobalState().tradeData;
                tradeData.pokemon = null;
                this.setState({friendPokemon: null, timerKey: this.state.timerKey + 1}); //Changing the timer key causes a rerender of the timer
                this.resetTimer();
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
                                        gameId={this.getGlobalState().saveGameId}  viewingEVsIVs={this.getGlobalState().viewingSummaryEVsIVs}
                                        isSaveBox={false}
                                        setGlobalState={this.setGlobalState.bind(this)}
                                        key={0} inTrade={true} inGTS={false}/>
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
                    <Button className="friend-trade-offer-button"
                            onClick={this.createCode.bind(this)}>
                        Create Code
                    </Button>

                    <Button className="friend-trade-offer-button"
                            onClick={() => this.setFriendTradeState(FRIEND_TRADE_INPUT_CODE)}>
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
        var isCodeCopied = this.state.codeCopied;

        return (
            <div className="friend-trade-code-display-page">
                <h2>Have your friend enter this code!</h2>
                <div className="friend-trade-code-display-container">
                    <div className="friend-trade-code-display-code" translate="no"
                            style={isCodeCopied ? {backgroundColor: "rgba(100,100,100,.4)"} : {}}
                            onClick={this.copyCreatedCode.bind(this)}>
                        {this.state.codeInput}
                    </div>
                </div>
                {
                    <div className="friend-trade-code-copied fade-in-fast" style={{visibility: isCodeCopied ? "visible" : "hidden"}}>
                        Code Copied!
                    </div>
                }
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
                            <Button size="sm" className="friend-trade-offer-button"
                                    aria-label="Paste Code"
                                    onClick={this.pasteCode.bind(this)}>
                                <ImPaste size={pasteButtonSize}/>
                            </Button>
                        </OverlayTrigger>
                    </Form.Group>

                    <div className="friend-trade-code-input-button">
                        <OverlayTrigger placement="bottom" overlay={submitTooltip}>
                            <Button size="lg" className="friend-trade-offer-button"
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
                        {friendPokemon != null ? acceptTradeButton : ""}
                        {cancelButton}
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
        var timer = this.getGlobalState().tradeData != null && !this.state.timerHidden
            ?
                <Timer key={"timer" + this.state.timerKey.toString()} seconds={TIMER_AMOUNT}
                       onCompletionFunc={this.timedOut.bind(this)}
                       mainPage={this.state.globalState} parent={this}/>
            :
                ""

        switch (this.getFriendTradeState())
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

        if (this.getGlobalState().viewingBoxList >= 0)
        {
            //BoxList must be called from FriendTrade otherwise FriendTrade loses its state
            return (
                <>
                    {this.getMainPage().boxListScreen()}
                    {timer}
                </>
            )
        }
        else
        {
            return (
                <div className="friend-trade-page"
                     style={!isMobile ? {paddingLeft: "var(--scrollbar-width)"} : {}}>
                    {pageContents}
                    {timer}
                </div>
            );
        }
    }
}
