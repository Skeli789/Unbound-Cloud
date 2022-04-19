/**
 * A class for viewing a Pokemon's summary.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {CanMonGigantamax, ChangeMarking, GetAbility, /*GetBaseStats,*/ GetCaughtBall, GetFriendship, GetGender, GetItem, GetLevel,
        GetMarkings, GetMovePP, GetMoves, GetNature, GetNickname, GetOTGender, GetOTName, GetVisibleNature, GetVisibleOTId, GetVisibleStats,
        GetEVs, GetIVs, GetMoveType, HasPokerus, IsEgg, WasCuredOfPokerus, HEART_FRIENDSHIP, MAX_FRIENDSHIP, NATURE_STAT_TABLE, GetSpecies} from "./PokemonUtil";
import {BASE_GFX_LINK, GetAbilityName, GetBallName, GetItemIconLink, GetItemName, GetMoveName, GetNatureName, GetSpeciesName, GetTypeName} from "./Util";
import MoveData from "./data/MoveData.json";

import {BsCircle, BsSquare, BsTriangle, BsHeart, BsCircleFill, BsSquareFill, BsTriangleFill, BsHeartFill} from "react-icons/bs";

import "./stylesheets/PokemonSummary.css";

const IV_LETTERS = ["E", "D", "C", "B", "A", "S"];
const IV_SIGNS = ["-", "-", "", "", "+", "+"];
const IV_COLOURS = ["red", "orangered", "darkorange", "olivedrab", "dodgerblue", "blueviolet"]

const POKE_BALL_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/";
const TYPE_ICON_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/";
const CATEGORY_ICON_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/seals/home/move-";
const POKERUS_INFECTED_LINK = BASE_GFX_LINK + "pokerus_infected.png"
const POKERUS_CURED_LINK = BASE_GFX_LINK + "pokerus_cured.png"


export class PokemonSummary extends Component
{
    /**
     * Sets up variables for the summary view.
     */
    constructor(props)
    {
        super(props);

        this.state = //Set test data
        {
            pokemon: props.pokemon,
            markings: GetMarkings(props.pokemon),
            changeWasMade: props.changeWasMade,
            boxType: props.boxType,
            areBoxViewsVertical: props.areBoxViewsVertical,
            inTrade: props.inTrade,
            gameId: props.gameId,
            viewingEVsIVs: props.viewingEVsIVs,
        };

        this.setGlobalState = props.setGlobalState;
    }

    /**
     * Changes one of the Pokemon's markings.
     * @param {Number} i - The marking number to change.
     */
    changeMarking(i)
    {
        if (!this.state.inTrade) //No editing marking during a trade
        {
            ChangeMarking(this.state.pokemon, i);
            this.setState({markings: GetMarkings(this.state.pokemon)});

            var changeWasMade = this.state.changeWasMade;
            changeWasMade[this.state.boxType] = true;
            this.setGlobalState({changeWasMade: changeWasMade});
        }
    }

    /**
     * Changes whether are not the real stats or EV/IV values are shown on the summary.
     */
    changeStatDisplay()
    {
        this.setState({viewingEVsIVs: !this.state.viewingEVsIVs}, () =>
        {
            this.setGlobalState({viewingSummaryEVsIVs: this.state.viewingEVsIVs}); //Update permanently until user clicks again
        });
    }

    /**
     * Prints the Pokemon's nickname.
     * @returns {JSX} An element containing the container of the nickname.
     */
    printNickname()
    {        
        var speciesName = GetSpeciesName(GetSpecies(this.state.pokemon));
        var nicknameText = GetNickname(this.state.pokemon);
        var nickname = <span className="summary-name">{nicknameText}</span>

        if (nicknameText !== speciesName)
        {
            //Display species name when nickname is hovered over
            const speciesTooltip = props => (<Tooltip {...props}>{speciesName}</Tooltip>);

            nickname =
                <OverlayTrigger placement="top" overlay={speciesTooltip}>
                    {nickname}
                </OverlayTrigger>
        }

        return nickname;
    }

    /**
     * Prints one of the Pokemon's types.
     * @param typeNum {String} - Either "1" or "2" depending on which type to print.
     * @returns {JSX} An element containing the text of the type symbol.
     */
    /*printSpeciesType(typeNum)
    {
        let baseStats = GetBaseStats(this.state.pokemon, this.state.gameId);
        if (baseStats != null)
        {
            let typeName = GetTypeName(baseStats["type" + typeNum]);
            let alt = typeName.slice(0, 2);
            let typeNameTooltip = props => (<Tooltip {...props}>{typeName}</Tooltip>);

            if (typeNum == "2" && baseStats["type1"] == baseStats["type2"])
                return ""; //Don't print duplicate types

            return (
                <OverlayTrigger placement="top" overlay={typeNameTooltip}>
                    <img src={TYPE_ICON_GFX_LINK + typeName.toLowerCase() + ".png"} alt={alt} className="summary-move-type" />
                </OverlayTrigger>
            );
        }

        return "";
    }*/

    /**
     * Prints the Pokemon's gender symbol.
     * @returns {JSX} An element containing the text of the gender symbol.
     */
    printGenderSymbol()
    {
        var symbol = "";
        var gender = GetGender(this.state.pokemon).toUpperCase();

        if (gender === "M")
            symbol = <span className="male-gender-symbol">♂</span>;
        else if (gender === "F")
            symbol = <span className="female-gender-symbol">♀</span>;

        return symbol;
    }
 
     /**
      * Prints the visible symbol for the Pokemon's friendship value.
      * @returns {JSX} An element containing a heart for friendship.
      */
    printFriendshipSymbol()
    {
        var friendship = GetFriendship(this.state.pokemon);
        var isMaxFriendship = friendship >= MAX_FRIENDSHIP;
        var heartTooltipText = `Friendship: ${isMaxFriendship ? "Max" : friendship}`;
        var heartTooltip = props => (<Tooltip {...props}>{heartTooltipText}</Tooltip>);
        var heartSymbol = (friendship >= HEART_FRIENDSHIP) ? "♥" : "♡"; //Outline for less than gray heart
        var heartColour = isMaxFriendship ? "red" : (friendship >= HEART_FRIENDSHIP) ? "grey" : "black";

        return (
            <OverlayTrigger placement="top" overlay={heartTooltip}>
                <span className="summary-heart" style={{color: heartColour}}>
                    {heartSymbol}
                </span>
            </OverlayTrigger>
        );
    }
 
     /**
      * Prints a visible symbol if the Pokemon has the Gigantamax factor.
      * @returns {JSX} An element containing the Giganatamax symbol.
      */
    printGigantamaxSymbol()
    {
        var gigantamaxTooltip = props => (<Tooltip {...props}>Gigantamax</Tooltip>);

        if (CanMonGigantamax(this.state.pokemon))
        {
            return (
                <OverlayTrigger placement="top" overlay={gigantamaxTooltip}>
                    <img src={BASE_GFX_LINK + "gigantamax.png"} alt={"Gigantamax"} aria-label="Can Gigantamax" className="summary-gigantamax"/>
                </OverlayTrigger>
            );
        }

        return "";
    }

    /**
      * Prints a visible symbol if the Pokemon is infected with or was cured from Pokerus.
      * @returns {JSX} An element containing the Pokerus symbol.
     */
    printPokerusSymbol()
    {
        var tooltip, alt;
        var iconLink = "";
        var extraStyle = {}

        if (HasPokerus(this.state.pokemon))
        {
            iconLink = POKERUS_INFECTED_LINK;
            alt = "PKRS";
            tooltip = "Has Pokerus";
        }
        else if (WasCuredOfPokerus(this.state.pokemon))
        {
            iconLink = POKERUS_CURED_LINK;
            alt = "😐";
            tooltip = "Cured of Pokerus";
            extraStyle = {marginBottom: "1px"};
        }
        else //Never had Pokerus
            return "";

        return (
            <OverlayTrigger placement="top" overlay={props => (<Tooltip {...props}>{tooltip}</Tooltip>)}>
                <img src={iconLink} alt={alt} aria-label={tooltip} className="summary-pokerus" style={extraStyle}/>
            </OverlayTrigger>
        );
    }
 
    /**
     * Prints Pokemon markings that can be edited.
     * @returns {JSX} The container for the markings
     */
    printMarkings()
    {
        const markingsOutlined = [<BsCircle/>, <BsSquare/>, <BsTriangle/>, <BsHeart/>];
        const markingsFilled = [<BsCircleFill/>, <BsSquareFill/>, <BsTriangleFill/>, <BsHeartFill/>];
        var monMarkings = GetMarkings(this.state.pokemon);
        var displayMarkings = [];

        for (let i = 0; i < monMarkings.length; ++i)
        {
            let symbol = (monMarkings[i]) ? markingsFilled[i] : markingsOutlined[i];
            displayMarkings.push(<span className="summary-marking" key={i}
                                       style={this.state.inTrade ? {cursor: "default"} : {}} //No editing marking during a trade
                                       onClick={this.changeMarking.bind(this, i)}>{symbol}</span>);
        }

        return (
            <OverlayTrigger placement="right" overlay={props => (<Tooltip {...props}>Markings</Tooltip>)}>
                <span className="summary-markings">
                    {displayMarkings}
                </span>
            </OverlayTrigger>
        );
    }
 
     /**
      * Prints the original Trainer's details.
      * @returns {JSX} An element containing the original Trainer's details.
      */
    printOTSummary()
    {
        return (
            <div className="summary-ot-container">
                <span className={GetOTGender(this.state.pokemon) === "M" ? "summary-male-ot"
                                : GetOTGender(this.state.pokemon) === "F" ? "summary-female-ot"
                                : ""}>
                    {GetOTName(this.state.pokemon)}
                </span>
                : {String(GetVisibleOTId(this.state.pokemon)).padStart(5, "0") /*This is a colon, not an else*/}
            </div>
        );
    }

    /**
     * Prints the caught ball icon and held item icon.
     * @returns {JSX} The container for the caught ball and held item icons.
     */
    printBallAndItemIcon()
    {
        //Caught Ball Details
        var ballType = GetCaughtBall(this.state.pokemon);
        var ballName = GetBallName(ballType);
        var baseBallName = ballName.split(" Ball")[0].toLowerCase().replaceAll("é", "e");
        var ballNameTooltip = props => (<Tooltip {...props}>{ballName}</Tooltip>);

        //Held Item Details
        var item = GetItem(this.state.pokemon);
        var itemName = GetItemName(item);
        var itemLink = GetItemIconLink(item);
        var itemTooltip = props => (<Tooltip {...props}>{itemName}</Tooltip>);

        return (
            <div className="summary-ball-icon-container">
                {   //Held Item
                    itemLink !== "" ?
                        <OverlayTrigger placement="top" overlay={itemTooltip}>
                            <img src={itemLink} alt="" onMouseDown={(e) => e.preventDefault()}/>
                        </OverlayTrigger>
                    :
                        ""
                }
                {   //Caught Ball
                    <OverlayTrigger placement="top" overlay={ballNameTooltip}>
                        <img src={POKE_BALL_GFX_LINK + baseBallName + ".png"} alt="" onMouseDown={(e) => e.preventDefault()}/>
                    </OverlayTrigger>
                }
            </div>
        )
    }

    /**
     * Prints the Pokemon's stat values.
     * @returns {JSX} A column of the Pokemon's stats.
     */
    printStats()
    {
        var key = 0;
        var statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        const visibleStatIdToStatId = [0, 1, 2, 4, 5, 3];
        var stats = GetVisibleStats(this.state.pokemon, this.state.gameId);
        var nature = GetVisibleNature(this.state.pokemon);
        var evs = GetEVs(this.state.pokemon);
        var ivs = GetIVs(this.state.pokemon);
        var titlesNature = [];
        var printableStats = [];

        for (let visibleStatId = 0; visibleStatId < stats.length; ++visibleStatId)
        {
            let natureColour = "";
            let realStatId = visibleStatIdToStatId[visibleStatId];

            //Add Stat Name
            titlesNature.push(
                <span className="summary-stat-title" key={key++}>
                    {statNames[visibleStatId]}
                </span>
            );

            //Add Nature Arrow
            if (realStatId > 0) //Not HP
                natureColour = NATURE_STAT_TABLE[nature][realStatId - 1] === 1 ? "red"
                             : NATURE_STAT_TABLE[nature][realStatId  - 1] === -1 ? "cornflowerblue" : "";

            if (natureColour !== "") //Nature has effect
            {
                let symbol = natureColour === "red" ? "▲" : "▼";
                let tooltip = symbol === "▲" ? "Increased" : "Decreased";

                titlesNature.push(
                    <OverlayTrigger placement="left" overlay={props => (<Tooltip {...props}>{tooltip}</Tooltip>)} key={key++}>
                        <span className="summary-stat-nature-arrow" style={{color: natureColour}}>
                            {symbol}
                        </span>
                    </OverlayTrigger>
                );
            }

            //Add Stat Values
            if (!this.state.viewingEVsIVs) //Normal stats
            {
                let ivLetterId = Math.floor(ivs[visibleStatId] / 2 / (IV_LETTERS.length / 2));
                let ivLetter = IV_LETTERS[ivLetterId];
                let ivSign = IV_SIGNS[ivs[visibleStatId] % IV_SIGNS.length];
                let ivColour = IV_COLOURS[ivLetterId];

                if (ivLetter === "S")
                    ivSign = ""; //Only S, no S- or S+

                //Add Raw Stat
                printableStats.push(
                    <span className={"summary-stat-value"} key={key++}>
                        {stats[visibleStatId]}
                    </span>
                );

                //Add IV Grading
                printableStats.push(
                    <span className="summary-stat-iv-grading" key={key++}
                          style={{color: ivColour}}>
                        {ivLetter}{ivSign}
                    </span>
                );
            }
            else //Viewing EVs in IVs
            {
                //Add EV
                printableStats.push(
                    <span className="summary-stat-ev" key={key++}>
                        {evs[visibleStatId]}
                    </span>
                );

                //Add IV
                printableStats.push(
                    <span className="summary-stat-iv" key={key++}>
                        {ivs[visibleStatId]}
                    </span>
                );
            }
        }

        //Try put tooltip over EV/IV container
        var statValuesContainer =
            <div className="summary-stat-values-container"
                 onClick={this.changeStatDisplay.bind(this)}>
                {printableStats}
            </div>    

        if (this.state.viewingEVsIVs)
        {
            //Add tooltip to explain what the new values are
            statValuesContainer =
                <OverlayTrigger placement="bottom" overlay={props => (<Tooltip {...props}>EVs / IVs</Tooltip>)}>
                    {statValuesContainer}
                </OverlayTrigger>
        }

        return (
            <div className="summary-stats-container">
                {titlesNature}
                {statValuesContainer}
            </div>
        );
    }

    /**
     * Prints the moves the Pokemon knows.
     * @returns {JSX} A column of the Pokemon's moves.
     */
    printMoves()
    {
        var moves = []
        var key = 0;
        var typeNames = ["", "", "", ""];
        var splitNames = ["", "", "", ""];
        var rawMoves = GetMoves(this.state.pokemon);

        for (let i = 0; i < rawMoves.length; ++i)
        {
            let move = rawMoves[i];

            //Print Type
            if (move in MoveData)
            {
                var moveType = GetMoveType(move, this.state.pokemon, this.state.gameId);
                typeNames[i] = GetTypeName(moveType);
                var alt = typeNames[i].slice(0, 2);
                var typeNameTooltip = props => (<Tooltip {...props}>{typeNames[i]}</Tooltip>);

                moves.push(
                    <OverlayTrigger placement="left" overlay={typeNameTooltip} key={key++}>
                        <img src={TYPE_ICON_GFX_LINK + typeNames[i].toLowerCase() + ".png"} alt={alt} className="summary-move-type" />
                    </OverlayTrigger>
                )
            }
            else
            {
                moves.push(<span className="summary-move-type" key={key++}/>);
            }

            //Print Name
            var moveName = GetMoveName(move);
            moves.push(<span className="summary-move" key={key++}>{moveName}</span>)

            if (move in MoveData)
            {
                //Print PP
                var pp = GetMovePP(this.state.pokemon, move, i);
                moves.push(<span className="summary-pp" key={key++}>{pp}</span>);

                //Print Move Split
                var moveSplit = MoveData[move]["split"];
                splitNames[i] = moveSplit.toLowerCase().charAt(6).toUpperCase() + moveSplit.toLowerCase().slice(7); //Start after SPLIT_
                var splitNameTooltip = props => (<Tooltip {...props}>{splitNames[i]}</Tooltip>);

                moves.push(
                    <OverlayTrigger placement={this.state.areBoxViewsVertical ? "top" : "right"} overlay={splitNameTooltip} key={key++}>
                        <img src={CATEGORY_ICON_GFX_LINK + splitNames[i].toLowerCase() + ".png"} alt={splitNames[i].slice(0, 2)} className="summary-move-split"/>
                    </OverlayTrigger>
                );
            }
            else
            {
                moves.push(<span className="summary-pp" key={key++}/>);
                moves.push(<span className="summary-move-split" key={key++}/>);
            }
        }

        return (
            <div className="summary-moves-container">
                <span className="summary-moves-col-1-filler"/>
                <span className="summary-moves-col-2-filler"/>
                <span className="summary-moves-pp-title summary-pp">PP</span>
                <span className="summary-moves-split-title">Split</span>
                {moves}
            </div>
        );
    }

    /**
     * Prints the Pokemon's summary view
     */
    render()
    {
        var level = GetLevel(this.state.pokemon, this.state.gameId);
        var ability = GetAbilityName(GetAbility(this.state.pokemon, this.state.gameId));
        var nature = GetNatureName(GetNature(this.state.pokemon));
        var natureMint = GetNatureName(GetVisibleNature(this.state.pokemon));

        if (IsEgg(this.state.pokemon))
        {
            //Limited view for Eggs
            return (
                <div className="pokemon-summary-container">
                    <div className="summary-name-level-container">
                        <span>Egg</span>
                    </div>
                    {this.printOTSummary()}
                    {this.printBallAndItemIcon()}
                </div>
            );
        }

        return (
            <div className="pokemon-summary-container">
                {/*Nickname, Gender, Level, Friendship, & Gigantamax Row*/}
                <div className="summary-name-level-container">
                    {/*Nickname*/}
                    {this.printNickname()}

                    {/*Gender (attached to Level)*/}
                    <span>
                        {this.printGenderSymbol()}
                    </span>

                    {/*Level*/}
                    <span className="summary-level">
                        Lv. {level}
                    </span>

                    {/*Friendship*/}
                    {this.printFriendshipSymbol()}

                    {/*Gigantamax*/}
                    {this.printGigantamaxSymbol()}

                    {/*Pokerus*/}
                    {this.printPokerusSymbol()}

                    {/*Types*/}
                    {/*<span>
                        {this.printSpeciesType("1")}
                        {this.printSpeciesType("2")}
                    </span>*/}
                </div>

                {/*OT Summary Row*/}
                {this.printOTSummary()}

                {/*Ability Row*/}
                <div className="summary-ability">
                    Ability: {ability}
                </div>

                {/*Nature Row*/}
                <div className="summary-nature">
                    Nature: {nature} {nature !== natureMint ? `(${natureMint} Mint)` : ""}
                </div>

                {/*Ball & Item in Corner*/}
                {this.printBallAndItemIcon()}

                {/*Markings Underneath Ball & Item*/}
                {this.printMarkings()}

                {/*Stats Column*/}
                {this.printStats()}

                {/*Moves Column*/}
                {this.printMoves()}
            </div>
        );
    }
}
