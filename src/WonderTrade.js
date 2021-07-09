import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import io from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {config} from "./config";
import {GetIconSpeciesLink, IsMonEgg, GetMonNickname} from "./PokemonUtil";
import {CreateSingleBlankSelectedPos} from './Util';
import BannedWords from "./data/BannedWords.json"

import {CgExport, CgImport} from "react-icons/cg";

import "./stylesheets/WonderTrade.css";


const PopUp = withReactContent(Swal);
const wonderTradeTooltip = props => (<Tooltip {...props}>Wonder Trade</Tooltip>);
const cancelWonderTradeTooltip = props => (<Tooltip {...props}>Cancel Wonder Trade</Tooltip>);


export class WonderTrade extends Component
{
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

    getGlobalState()
    {
        return this.state.globalState.state;
    }

    isActive()
    {
        if (this.getGlobalState().wonderTradeData === null)
            return false;

        return this.getGlobalState().wonderTradeData.socket !== null;
    }

    badWordInText(textToCheck)
    {
        textToCheck = textToCheck.toUpperCase();
        var textToCheckWords = textToCheck.split(" ");

        for (let bannedWord of BannedWords)
        {
            if (bannedWord.contains) //The banned word cannot be present in the name at all
            {
                let allLetters = textToCheck.replace(" ", "").replace("-", "").replace(".", "");
                if (allLetters.includes(bannedWord.text))
                    return true; //Includes a banned string
            }
            else //Entire word matches
            {
                for (let text of textToCheckWords)
                {
                    if (text === bannedWord.text)
                        return true; //Has a bad word entirely in its name
                }
            }
        }

        return false;
    }

    canBeWonderTraded()
    {
        if (this.badWordInText(GetMonNickname(this.state.pokemon)))
            return false;

        if (this.badWordInText(this.state.pokemon["otName"]))
            return false;

        if (IsMonEgg(this.state.pokemon))
            return false;

        return true;
    }

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
            });

            return;
        }*/

        //Check illegal mon
        if (!this.canBeWonderTraded())
        {
            PopUp.fire(
            {
                title: `${GetMonNickname(pokemon)} can't be traded.`,
                cancelButtonText: `Awww`,
                showConfirmButton: false,
                showCancelButton: true,
                icon: 'error',
            });

            return;
        }

        //Check Already doing a Wonder Trade
        if (this.isActive()) 
        {
            PopUp.fire(
            {
                title: `A Wonder Trade is in progress!\nStart a new Wonder Trade with ${GetMonNickname(pokemon)} anyway?`,
                confirmButtonText: `Stop the old one, let's trade!`,
                cancelButtonText: `Keep the old one.`,
                showCancelButton: true,
                imageUrl: GetIconSpeciesLink(pokemon),
                imageAlt: "",
            }).then((result) =>
            {
                if (result.isConfirmed)
                {
                    //First end previous Wonder Trade
                    if (this.getGlobalState().wonderTradeData !== null)
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
            PopUp.fire(
            {
                title: `Start a Wonder Trade with ${GetMonNickname(pokemon)}?`,
                confirmButtonText: `Let's trade!`,
                cancelButtonText: `Cancel`,
                showCancelButton: true,
                imageUrl: GetIconSpeciesLink(pokemon),
                imageAlt: "",
            }).then((result) =>
            {
                if (result.isConfirmed)
                    this.startWonderTrade();
            });
        }
    }

    startWonderTrade()
    {
        var pokemon = this.state.pokemon;
        var endWonderTrade = this.endWonderTrade.bind(this);
        var thisObject = this;
        var selectedMonPos = this.getGlobalState().selectedMonPos;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos();

        if (!this.state.isActive && pokemon !== null)
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

                socket.on('connect', function()
                {
                    //Other handler functions
                    socket.on('disconnect', thisObject.handleLostConnection.bind(thisObject, socket));
                    socket.on('connect_error', thisObject.handleLostConnection.bind(thisObject, socket));
                    socket.on('message', function(data)
                    {
                        endWonderTrade(thisObject, data, socket);
                    });

                    //Send Pokemon for trade
                    console.log("Connection established.");
                    console.log("Sending pokemon...");
                    socket.send(pokemon);
                    console.log("Pokemon sent!");
                    //thisObject.setState({isMonInWonderTrade: true}); //Not needed because state changes in BoxView

                    PopUp.fire(
                    {
                        title: `${GetMonNickname(pokemon)} has been sent!\nPlease wait for your new Pokemon to arrive.`,
                        confirmButtonText: `Okay`,
                        imageUrl: GetIconSpeciesLink(pokemon),
                        imageAlt: "",
                    });
                });

                socket.connect();
                PopUp.fire(
                {
                    title: 'Connecting, please wait...',
                    timer: 5000,
                    timerProgressBar: true,
                    allowOutsideClick: false,
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
                            PopUp.fire(
                            {
                                title: "Couldn't connect!\nPlease try again later.",
                                cancelButtonText: `Awww`,
                                showConfirmButton: false,
                                showCancelButton: true,
                                icon: 'error',
                            });
                        }
                    });
            });
        }
    }

    endWonderTrade(thisObject, newPokemon, socket)
    {
        socket.close();
        console.log(`Receieved ${GetMonNickname(newPokemon)}`);
        thisObject.finishWonderTrade(newPokemon, this.state.boxType, this.state.boxNum, this.state.boxPos);

        PopUp.fire(
        {
            title: `${GetMonNickname(newPokemon)} has just arrived!\nIt was placed in "${this.state.boxName}".`,
            confirmButtonText: `Hooray!`,
            imageUrl: GetIconSpeciesLink(newPokemon),
            imageAlt: "",
        });
    }

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
        });
    }

    tryCancelWonderTrade()
    {
        var pokemon = this.state.pokemon;

        PopUp.fire(
        {
            title: `Stop trying to Wonder Trade ${GetMonNickname(pokemon)}?`,
            confirmButtonText: `No, keep it going.`,
            denyButtonText: `Cancel the trade.`,
            showDenyButton: true,
            imageUrl: GetIconSpeciesLink(pokemon),
            imageAlt: "",
        }).then((result) =>
        {
            if (result.isDenied)
            {
                //End previous Wonder Trade
                if (this.getGlobalState().wonderTradeData !== null)
                    this.getGlobalState().wonderTradeData.socket.close();

                this.setState({isMonInWonderTrade: false}); //Not anymore
                this.setGlobalState({wonderTradeData: null}, () => PopUp.close()); //Close the "connection lost" pop up
            }
        });
    }

    render()
    {
        if (!this.state.isMonInWonderTrade)
        {
            return(
                <OverlayTrigger placement="bottom" overlay={wonderTradeTooltip}>
                    {
                        <CgExport size={30} className="box-lower-icon"
                                onClick = {this.tryStartWonderTrade.bind(this)}/>
                    }
                </OverlayTrigger>
            )
        }
        else
        {
            return(
                <OverlayTrigger placement="bottom" overlay={cancelWonderTradeTooltip}>
                    {
                        <CgImport size={30} className="box-lower-icon cancel-wonder-trade-icon"
                                onClick = {this.tryCancelWonderTrade.bind(this)}/>
                    }
                </OverlayTrigger>
            )
        }
    }
}
