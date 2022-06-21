/**
 * A class for handling the Wonder Trade functionality.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {config} from "./config";
import {GetIconSpeciesLink, GetNickname, GetSpecies, HasDuplicateMovesInMoveset,
        IsEgg, IsHoldingBannedItem, IsValidPokemon} from "./PokemonUtil";
import {CreateSingleBlankSelectedPos, GetSpeciesName} from './Util';

import {CgExport, CgImport} from "react-icons/cg";
import SfxTradeComplete from './audio/TradeComplete.mp3';

import "./stylesheets/WonderTrade.css";

const WONDER_TRADE_COOLDOWN = 120000; //2 Minutes

const PopUp = withReactContent(Swal);
const wonderTradeTooltip = props => (<Tooltip {...props}>Wonder Trade</Tooltip>);
const cancelWonderTradeTooltip = props => (<Tooltip {...props}>Cancel Wonder Trade</Tooltip>);

const tradeCompleteSound = new Audio(SfxTradeComplete);

export class WonderTrade extends Component
{
    /**
     * Sets up the state needed for Wonder Trading.
     */
    constructor(props)
    {
        super(props);

        this.state =
        {
            pokemon: props.pokemon,
            boxName: props.boxName,
            boxNum: props.boxNum,
            boxPos: props.boxPos,
            boxType: props.boxType,
            boxSlot: props.boxSlot,
            isMonInWonderTrade: props.isMonInWonderTrade,
            globalState: props.globalState,
        };

        this.setGlobalState = props.setGlobalState;
        this.finishWonderTrade = props.finishWonderTrade;
    }

    /**
     * Gets the state of MainPage.
     * @returns {Object} The this.state object of MainPage.js.
     */
    getGlobalState()
    {
        return this.state.globalState.state;
    }

    /**
     * Gets whether or not a Wonder Trade is already in progress.
     * @returns {Boolean} True if a Pokemon is already up for Wonder Trade. False otherwise.
     */
    isActive()
    {
        if (this.getGlobalState().wonderTradeData == null)
            return false;

        return this.getGlobalState().wonderTradeData.socket != null;
    }

    /**
     * Checks if the selected Pokemon is eligible to be Wonder Traded.
     * @returns {Boolean} - True if the selected Pokemon can be Wonder Traded. False otherwise.
     */
    canBeWonderTraded()
    {
        if (IsEgg(this.state.pokemon))
            return false;

        if (IsHoldingBannedItem(this.state.pokemon))
            return false;

        if (HasDuplicateMovesInMoveset(this.state.pokemon))
            return false;

        return true;
    }

    /**
     * Gets the time until another Wonder Trade can be performed for the selected Pokemon.
     * @returns {Number} The time in seconds until another Wonder Trade can be performed for the selected Pokemon.
     */
    getTimeToNextWonderTrade()
    {
        if ("wonderTradeTimestamp" in this.state.pokemon)
        {
            var timeSince = Date.now() - this.state.pokemon.wonderTradeTimestamp;

            if (timeSince >= WONDER_TRADE_COOLDOWN)
            {
                delete this.state.pokemon.wonderTradeTimestamp; //Field is no longer required
                return 0; //Can wonder trade now
            }

            return Math.ceil((WONDER_TRADE_COOLDOWN - timeSince) / 1000);
        }

        return 0;
    }

    /**
     * Checks if a Wonder Trade can't be started for the selected Pokemon too soon after a previous one.
     * @returns {Boolean} True if it's too soon to begin another Wonder Trade for the selected Pokemon. False otherwise.
     */
    needToWaitForWonderTrade()
    {
        return this.getTimeToNextWonderTrade() !== 0;
    }

    /**
     * Tries to start a Wonder Trade.
     */
    tryStartWonderTrade()
    {
        var pokemon = this.state.pokemon;

        //Force saving changes
        /*if (this.getGlobalState().changeWasMade.some((x) => x)) //Any unsaved changes
        {
            PopUp.fire(
            {
                title: "Please save everything before attempting to Wonder Trade.",
                confirmButtonText: `Okay`,
                icon: 'error',
                scrollbarPadding: false,
            });

            return;
        }*/

        //Check illegal mon
        if (!this.canBeWonderTraded())
        {
            let title = `${GetNickname(pokemon)} can't be traded.`

            if (IsHoldingBannedItem(this.state.pokemon))
                title = `${GetNickname(pokemon)} is holding an item that can't be traded!`

            PopUp.fire
            ({
                title: title,
                cancelButtonText: `Awww`,
                showConfirmButton: false,
                showCancelButton: true,
                icon: 'error',
                scrollbarPadding: false,
            });

            return;
        }

        //Check need to wait
        if (this.needToWaitForWonderTrade())
        {
            var timeRemaining = this.getTimeToNextWonderTrade();

            PopUp.fire
            ({
                title: `Please wait ${timeRemaining} seconds before trading this Pokémon.`,
                cancelButtonText: `Okay`,
                showConfirmButton: false,
                showCancelButton: true,
                icon: 'error',
                scrollbarPadding: false,
            });

            return;
        }

        //Check Already doing a Wonder Trade
        if (this.isActive()) 
        {
            PopUp.fire
            ({
                title: `A Wonder Trade is in progress!\nStart a new Wonder Trade with ${GetNickname(pokemon)} anyway?`,
                confirmButtonText: `Stop the old one, let's trade!`,
                cancelButtonText: `Keep the old one.`,
                showCancelButton: true,
                imageUrl: GetIconSpeciesLink(pokemon),
                imageAlt: "",
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isConfirmed)
                {
                    //First end previous Wonder Trade
                    if (this.getGlobalState().wonderTradeData != null)
                        this.getGlobalState().wonderTradeData.socket.close();

                    this.setGlobalState({wonderTradeData: null}, () =>
                    {
                        //Then start the new one
                        this.startWonderTrade();
                    });
                }
            });
        }
        else //No Wonder Trade in progress yet
        {
            PopUp.fire
            ({
                title: `Start a Wonder Trade with ${GetNickname(pokemon)}?`,
                confirmButtonText: `Let's trade!`,
                cancelButtonText: `Cancel`,
                showCancelButton: true,
                imageUrl: GetIconSpeciesLink(pokemon),
                imageAlt: "",
                scrollbarPadding: false,
            }).then((result) =>
            {
                if (result.isConfirmed)
                    this.startWonderTrade();
            });
        }
    }

    /**
     * Begins a Wonder Trade with the selected Pokemon.
     */
    startWonderTrade()
    {
        var pokemon = this.state.pokemon;
        var endWonderTrade = this.endWonderTrade.bind(this);
        var thisObject = this;
        var selectedMonPos = this.getGlobalState().selectedMonPos;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos();

        if (!this.state.isActive && IsValidPokemon(pokemon))
        {
            console.log("Connecting...");
            var socket = io(`${config.dev_server}`, {autoConnect: false});

            const wonderTradeData =
            {
                boxNum: this.state.boxNum,
                boxPos: this.state.boxPos,
                boxType: this.state.boxType,
                pokemon: pokemon,
                socket: socket,
            };

            this.setGlobalState({wonderTradeData: wonderTradeData, selectedMonPos: selectedMonPos}, () => //Lock first
            {
                let timerInterval;

                //Function run after connection established
                socket.on('connect', function()
                {
                    //Other handler functions
                    socket.on('disconnect', thisObject.handleLostConnection.bind(thisObject, socket));
                    socket.on('connect_error', thisObject.handleLostConnection.bind(thisObject, socket));
                    socket.on('invalidPokemon', thisObject.handleInvalidPokemon.bind(thisObject, socket));
                    socket.on('message', function(data)
                    {
                        endWonderTrade(thisObject, data, socket);
                    });

                    //Send Pokemon for trade
                    socket.emit("tradeType", "WONDER_TRADE");
                    console.log("Connection established.");
                    console.log("Sending pokemon...");
                    socket.send(pokemon, thisObject.getGlobalState().isRandomizedSave);
                    console.log("Pokemon sent!");
                    //thisObject.setState({isMonInWonderTrade: true}); //Not needed because state changes in BoxView

                    PopUp.fire
                    ({
                        title: `${GetNickname(pokemon)} has been sent!\nPlease wait for your new Pokemon to arrive.`,
                        confirmButtonText: `Okay`,
                        imageUrl: GetIconSpeciesLink(pokemon),
                        imageAlt: "",
                        scrollbarPadding: false,
                    });
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
                            this.setGlobalState({wonderTradeData: null});
                            PopUp.fire
                            ({
                                title: "Couldn't connect!\nPlease try again later.",
                                cancelButtonText: `Awww`,
                                showConfirmButton: false,
                                showCancelButton: true,
                                icon: 'error',
                                scrollbarPadding: false,
                            });
                        }
                    });
            });
        }
    }

    /**
     * Receives the new Pokemon and ends the Wonder Trade.
     * @param {Object} thisObject - The "this" object for the Wonder Trade class.
     * @param {Pokemon} newPokemon - The Pokemon received in the Wonder Trade.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    async endWonderTrade(thisObject, newPokemon, socket)
    {
        const backupTitle = document.title;

        while (this.getGlobalState().isSaving || this.getGlobalState().inFriendTrade) //Saving or trade in progress
            await new Promise(r => setTimeout(r, 50)); //Sleep temporarily before checking again if can continue

        socket.close();
        console.log(`Received ${GetNickname(newPokemon)}`);
        newPokemon.wonderTradeTimestamp = Date.now(); //Prevent this Pokemon from instantly being sent back
        thisObject.finishWonderTrade(newPokemon, this.state.boxType, this.state.boxNum, this.state.boxPos);
        document.title = "Wonder Trade Complete!"; //Indicate to the user if they're in another tab

        if (!this.getGlobalState().muted)
            tradeCompleteSound.play();

        var newPokemonSpecies = GetSpeciesName(GetSpecies(newPokemon));
        PopUp.fire
        ({
            title: `${GetNickname(newPokemon)}${GetNickname(newPokemon) !== newPokemonSpecies ? ` (${newPokemonSpecies})` : ""} has just arrived!\nIt was placed in "${this.state.boxName}".`,
            confirmButtonText: `Hooray!`,
            imageUrl: GetIconSpeciesLink(newPokemon),
            imageAlt: "",
            scrollbarPadding: false,
        }).then(() =>
        {
            document.title = backupTitle;
        });
    }

    /**
     * Handles ending the Wonder Trade during a connection error.
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    handleLostConnection(socket)
    {
        socket.close();
        this.setGlobalState({wonderTradeData: null});

        PopUp.fire(
        {
            title: "The connection has been lost!\nThe Wonder Trade was cancelled.",
            cancelButtonText: `Awww`,
            showConfirmButton: false,
            showCancelButton: true,
            icon: 'error',
            scrollbarPadding: false,
        });
    }

    /**
     * Handles ending the Wonder Trade after sending an invalid Pokemon for a trade (due to checksum mismatch).
     * @param {WebSocket} socket - The socket used to connect to the server.
     */
    handleInvalidPokemon(socket)
    {
        socket.close();
        this.setGlobalState({wonderTradeData: null});
        console.log("Pokemon failed checksum!");

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
     * Tries force ending a Wonder Trade.
     */
    tryCancelWonderTrade()
    {
        var pokemon = this.state.pokemon;

        PopUp.fire
        ({
            title: `Stop trying to Wonder Trade ${GetNickname(pokemon)}?`,
            confirmButtonText: `No, keep it going.`,
            denyButtonText: `Cancel the trade.`,
            showDenyButton: true,
            imageUrl: GetIconSpeciesLink(pokemon),
            imageAlt: "",
            scrollbarPadding: false,
        }).then((result) =>
        {
            if (result.isDenied) //In this case it means agreed to cancel trade
            {
                //End previous Wonder Trade
                if (this.getGlobalState().wonderTradeData != null)
                    this.getGlobalState().wonderTradeData.socket.close();

                this.setState({isMonInWonderTrade: false}); //Not anymore
                this.setGlobalState({wonderTradeData: null}, () => PopUp.close()); //Close the "connection lost" pop up
            }
        });
    }

    /**
     * Prints the Wonder Trade icon.
     */
    render()
    {
        var iconSize = 30;

        if (!this.state.isMonInWonderTrade)
        {
            return (
                <OverlayTrigger placement="bottom" overlay={wonderTradeTooltip}>
                    <div className="box-lower-icon-div">
                        <CgExport size={iconSize} className="box-lower-icon"
                                onClick = {this.tryStartWonderTrade.bind(this)}/>
                    </div>
                </OverlayTrigger>
            )
        }
        else
        {
            return (
                <OverlayTrigger placement="bottom" overlay={cancelWonderTradeTooltip}>
                    <div className="box-lower-icon-div">
                        <CgImport size={iconSize} className="box-lower-icon cancel-wonder-trade-icon"
                                onClick = {this.tryCancelWonderTrade.bind(this)}/>
                    </div>
                </OverlayTrigger>
            )
        }
    }
}
