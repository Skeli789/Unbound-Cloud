/**
 * A class for viewing a Pokemon's summary.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {CanMonGigantamax, ChangeMarking, GetAbility, /*GetBaseStats,*/ GetCaughtBall, GetFriendship, GetGender, GetIconSpeciesLink, GetItem, GetLevel,
        GetMarkings, GetMovePP, GetMoves, GetNature, GetNickname, GetOTGender, GetOTName, GetVisibleNature, GetVisibleOTId, GetVisibleStats,
        GetEVs, GetIVs, GetMoveType, HasPokerus, IsEgg, MonWillLoseMoveInSave, MonWillLoseItemInSave, GetSpecies, WasCuredOfPokerus,
        MAX_FRIENDSHIP, NATURE_STAT_TABLE, MonWillLoseBallInSave} from "./PokemonUtil";
import {BASE_GFX_LINK, GetAbilityName, GetBallName, GetItemIconLink, GetItemName, GetMoveName, GetNatureName, GetSpeciesName, GetTypeName} from "./Util";
import gDexNums from "./data/DexNum.json";
import gMoveData from "./data/MoveData.json";
import gSpeciesToDexNum from "./data/SpeciesToDexNum.json";

import {AiFillWarning} from "react-icons/ai";
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
            inGTS: props.inGTS,
            gameId: props.gameId,
            viewingEVsIVs: props.viewingEVsIVs,
            isSaveBox: props.isSaveBox,
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
        var species = GetSpecies(this.state.pokemon);
        var speciesName = GetSpeciesName(species, true);
        var dexNum = (species in gSpeciesToDexNum) ? gDexNums[gSpeciesToDexNum[species]] : 0;
        var dexNumText = String(dexNum).padStart(3, "0");
        var nicknameText = GetNickname(this.state.pokemon);
        var nickname = <span className="summary-name" id="nickname">{nicknameText}</span>
        if (!this.state.inGTS)
            nickname = <span id="dex-num-nickname">#{dexNumText} {nickname}</span>

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
        const id = "gender";

        if (gender === "M")
            symbol = <span className="male-gender-symbol" id={id}>♂</span>;
        else if (gender === "F")
            symbol = <span className="female-gender-symbol" id={id}>♀</span>;

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
        var percent = friendship / MAX_FRIENDSHIP;
        percent = 25 + Math.floor(40 * percent); //Bind the percent since only values at 25% to 65% are actually visible on screen

        return (
            <OverlayTrigger placement="top" overlay={heartTooltip}>
                <span className="summary-heart" id="friendship"
                 style={{backgroundImage: `linear-gradient(to top, rgb(255 0 0) ${percent}%, transparent 0)`}}>
                    ♥
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
                    <img src={BASE_GFX_LINK + "gigantamax.png"} alt={"Gigantamax"} aria-label="Can Gigantamax"
                         className="summary-gigantamax" id="gigantamax"/>
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
                <img src={iconLink} alt={alt} aria-label={tooltip}
                     className="summary-pokerus" id="pokerus" style={extraStyle}/>
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
                                       id={"marking-" + i}
                                       style={this.state.inTrade ? {cursor: "default"} : {}} //No editing marking during a trade
                                       onClick={this.changeMarking.bind(this, i)}>{symbol}</span>);
        }

        return (
                <span className="summary-markings">
                    {/*Tooltip goes in here because otherwise it appears when moving mouse over half the summary view*/}
                    <OverlayTrigger placement="right" overlay={props => (<Tooltip {...props}>Markings</Tooltip>)}>
                        <span id="markings">
                            {displayMarkings}
                        </span>
                    </OverlayTrigger>
                </span>
        );
    }
 
     /**
      * Prints the original Trainer's details.
      * @returns {JSX} An element containing the original Trainer's details.
      */
    printOTSummary()
    {
        return (
            <div className="summary-ot-container" id="ot">
                <span className={GetOTGender(this.state.pokemon) === "M" ? "summary-male-ot"
                                : GetOTGender(this.state.pokemon) === "F" ? "summary-female-ot"
                                : ""}
                      id="ot-name">
                    {GetOTName(this.state.pokemon)}
                </span>
                : {String(GetVisibleOTId(this.state.pokemon)).padStart(5, "0") /*This is a colon, not an else*/}
            </div>
        );
    }

    /**
     * Prints the caught ball icon.
     * @returns {JSX} The container for the caught ball icon.
     */
    printBallIcon()
    {
        var loseBallWarning;
        var ballType = GetCaughtBall(this.state.pokemon);
        var ballName = GetBallName(ballType);
        var baseBallName = ballName.split(" Ball")[0].toLowerCase().replaceAll("é", "e");
        var ballNameTooltip = props => (<Tooltip {...props}>{ballName}</Tooltip>);

        if (this.state.isSaveBox && MonWillLoseBallInSave(this.state.pokemon, this.state.gameId))
        {
            const loseItemTooltip = props => (<Tooltip {...props}>This Ball will disappear after saving</Tooltip>);

            loseBallWarning=
                <OverlayTrigger placement="top" overlay={loseItemTooltip}>
                    <div id="lose-ball-warning">
                        <AiFillWarning className="summary-item-ball-warning summary-ball-warning"
                                       fill="red" size={14}
                                       aria-label="Will Lose Ball"/>
                    </div>
                </OverlayTrigger>;
        }
        else
        {
            loseBallWarning = <span className="summary-item-ball-warning summary-ball-warning" id="ball-warning" />;
        }

        return (
            <div style={{position: "relative"}}>
                {loseBallWarning}
                <OverlayTrigger placement="top" overlay={ballNameTooltip}>
                    <img src={POKE_BALL_GFX_LINK + baseBallName + ".png"} alt="" id="ball"
                         onMouseDown={(e) => e.preventDefault()}/>
                </OverlayTrigger>
            </div>
        );
    }

    /**
     * Prints the held item icon.
     * @returns {JSX} The container for the held item icons.
     */
    printItemIcon()
    {
        var loseItemWarning;
        var item = GetItem(this.state.pokemon);
        var itemName = GetItemName(item);
        var itemLink = GetItemIconLink(item);
        var itemTooltip = props => (<Tooltip {...props}>{itemName}</Tooltip>);

        if (this.state.isSaveBox && MonWillLoseItemInSave(this.state.pokemon, this.state.gameId))
        {
            const loseItemTooltip = props => (<Tooltip {...props}>This item will disappear after saving</Tooltip>);

            loseItemWarning=
                <OverlayTrigger placement="top" overlay={loseItemTooltip}>
                    <div id="lose-item-warning">
                        <AiFillWarning className="summary-item-ball-warning summary-item-warning"
                                       fill="red" size={14}
                                       aria-label="Will Lose Item"/>
                    </div>
                </OverlayTrigger>;
        }
        else
        {
            loseItemWarning = <span className="summary-item-ball-warning summary-item-warning" id="lose-item-warning" />;
        }

        return (
            itemLink !== "" ?
                <div className={this.state.inGTS ? "summary-item-container-gts" : ""} style={{position: "relative"}}> {/*Relative allows the warning's absolute to function properly*/}
                    {loseItemWarning}
                    <OverlayTrigger placement="top" overlay={itemTooltip}>
                        <img src={itemLink} alt="" className="summary-item" id="item"
                             onMouseDown={(e) => e.preventDefault()}/>
                    </OverlayTrigger>
                </div>
            :
                ""
        );
    }

    /**
     * Prints the caught ball icon and held item icon.
     * @returns {JSX} The container for the caught ball and held item icons.
     */
    printBallAndItemIcon()
    {
        return (
            <div className="summary-ball-icon-container" id="ball-and-item">
                {/*Held Item*/}
                {this.printItemIcon()}

                {/*Caught Ball*/}
                {this.printBallIcon()}
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
            let idStatName = statNames[visibleStatId].toLowerCase().replaceAll(" ", "-").replaceAll(".", "");

            //Add Stat Name
            titlesNature.push(
                <span className="summary-stat-title" key={key++}
                      id={"stat-title-" + idStatName}>
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
                        <span className="summary-stat-nature-arrow" style={{color: natureColour}}
                              id={"nature-arrow-" + idStatName}>
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
                    <span className={"summary-stat-value"} key={key++}
                          id={`stat-${idStatName}`}>
                        {stats[visibleStatId]}
                    </span>
                );

                //Add IV Grading
                printableStats.push(
                    <span className="summary-stat-iv-grading" key={key++}
                          style={{color: ivColour}}
                          id={"iv-grading-" + idStatName}>
                        {ivLetter}{ivSign}
                    </span>
                );
            }
            else //Viewing EVs in IVs
            {
                //Add EV
                printableStats.push(
                    <span className="summary-stat-ev" key={key++}
                          id={"ev-" + idStatName}>
                        {evs[visibleStatId]}
                    </span>
                );

                //Add IV
                printableStats.push(
                    <span className="summary-stat-iv" key={key++}
                          id={"iv-" + idStatName}>
                        {ivs[visibleStatId]}
                    </span>
                );
            }
        }

        //Try put tooltip over EV/IV container
        var statValuesContainer =
            <div className="summary-stat-values-container" id="stats"
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

            //Print warning icon if necessary
            if (this.state.isSaveBox && MonWillLoseMoveInSave(move, this.state.gameId))
            {
                const loseMoveTooltip = props => (<Tooltip {...props}>This move will disappear after saving</Tooltip>);

                moves.push(
                    <OverlayTrigger placement="top" overlay={loseMoveTooltip} key={key++}>
                        <div id={`lose-move-warning-${i}`}>
                            <AiFillWarning className="summary-move-warning"
                                           fill="red"
                                           size={18}
                                           aria-label="Will Lose Move"/>
                        </div>
                    </OverlayTrigger>
                );
            }
            else
            {
                moves.push(<span className="summary-move-warning" id={`lose-move-warning-${i}`} key={key++}/>);
            }

            //Print Type
            if (move in gMoveData)
            {
                var moveType = GetMoveType(move, this.state.pokemon, this.state.gameId);
                typeNames[i] = GetTypeName(moveType);
                var alt = typeNames[i].slice(0, 2);
                const typeNameTooltip = props => (<Tooltip {...props}>{typeNames[i]}</Tooltip>);

                moves.push(
                    <OverlayTrigger placement="left" overlay={typeNameTooltip} key={key++}>
                        <img src={TYPE_ICON_GFX_LINK + typeNames[i].toLowerCase() + ".png"} alt={alt}
                             className="summary-move-type" id={`move-type-${i}`} />
                    </OverlayTrigger>
                )
            }
            else
            {
                moves.push(<span className="summary-move-type" id={`move-type-${i}`} key={key++}/>);
            }

            //Print Name
            var moveName = GetMoveName(move);
            moves.push(<span className="summary-move" id={`move-${i}`} key={key++}>{moveName}</span>)

            if (move in gMoveData)
            {
                //Print PP
                var pp = GetMovePP(this.state.pokemon, move, i);
                moves.push(<span className="summary-pp" id={`pp-${i}`} key={key++}>{pp}</span>);

                //Print Move Split
                var moveSplit = gMoveData[move]["split"];
                splitNames[i] = moveSplit.toLowerCase().charAt(6).toUpperCase() + moveSplit.toLowerCase().slice(7); //Start after SPLIT_
                const splitNameTooltip = props => (<Tooltip {...props}>{splitNames[i]}</Tooltip>);

                moves.push(
                    <OverlayTrigger placement={this.state.areBoxViewsVertical ? "top" : "right"} overlay={splitNameTooltip} key={key++}>
                        <img src={CATEGORY_ICON_GFX_LINK + splitNames[i].toLowerCase() + ".png"} alt={splitNames[i].slice(0, 2)}
                             className="summary-move-split" id={`move-split-${i}`} />
                    </OverlayTrigger>
                );
            }
            else
            {
                moves.push(<span className="summary-pp" id={`pp-${i}`} key={key++}/>);
                moves.push(<span className="summary-move-split" id={`move-split-${i}`} key={key++}/>);
            }
        }

        return (
            <div className="summary-moves-container">
                <span className="summary-moves-col-1-filler"/>
                <span className="summary-moves-col-2-filler"/>
                <span className="summary-moves-col-3-filler"/>
                <span className="summary-moves-pp-title summary-pp">PP</span>
                <span className="summary-moves-split-title">Split</span>
                {moves}
            </div>
        );
    }

    /**
     * Prints the Pokemon's species icon and held item when viewing the Pokemon offer in the GTS.
     * @returns {JSX} The container for the Pokemon's species icon and held item icon.
     */
    printGTSMonIconAndItem()
    {
        return (
            <div className="summary-mon-icon-item-gts">
                <img src={GetIconSpeciesLink(this.state.pokemon)} alt={GetNickname(this.state.pokemon)}
                    id="mon-icon-gts"
                    className="summary-mon-icon-gts" onMouseDown={(e) => e.preventDefault()}/>
                {this.printItemIcon()}
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
                <div className="pokemon-summary-container"
                     id={`mon-summary-${(this.state.isSaveBox ? "save" : "home")}-box`} >
                    <div className="summary-name-level-container">
                        <span id="nickname">Egg</span>
                    </div>
                    {this.printOTSummary()}
                    {this.printBallAndItemIcon()}
                </div>
            );
        }

        return (
            <div className={"pokemon-summary-container" + (this.state.inGTS ? "-gts" : "")}
                 id={`mon-summary-${(this.state.isSaveBox ? "save" : "home")}-box`}>
                {/*Mon Icon in GTS*/}
                {this.state.inGTS ? this.printGTSMonIconAndItem(): ""}

                {/*Nickname, Gender, Level, Friendship, & Gigantamax Row*/}
                <div className="summary-name-level-container">
                    {/*Nickname*/}
                    {this.printNickname()}

                    {/*Gender (attached to Level)*/}
                    <span>
                        {this.printGenderSymbol()}
                    </span>

                    {/*Level*/}
                    <span className="summary-level" id="level">
                        Lv. {level}
                    </span>

                    {/*Friendship*/}
                    {!this.state.inGTS ? this.printFriendshipSymbol() : ""}

                    {/*Gigantamax*/}
                    {this.printGigantamaxSymbol()}

                    {/*Pokerus*/}
                    {!this.state.inGTS ? this.printPokerusSymbol() : ""}

                    {/*Types*/}
                    {/*<span>
                        {this.printSpeciesType("1")}
                        {this.printSpeciesType("2")}
                    </span>*/}
                </div>

                {/*OT Summary Row*/}
                {this.printOTSummary()}

                {/*Ability Row*/}
                <div className="summary-ability" id="ability">
                    Ability: {ability}
                </div>

                {/*Nature Row*/}
                {
                    !this.state.inGTS ?
                        <div className="summary-nature" id="nature">
                            Nature: {nature} {nature !== natureMint ? `(${natureMint} Mint)` : ""}
                        </div>
                    :
                        ""
                }

                {/*Ball & Item in Corner*/}
                {!this.state.inGTS ?this.printBallAndItemIcon() : ""}

                {/*Markings Underneath Ball & Item*/}
                {!this.state.inGTS ? this.printMarkings() : ""}

                {/*Stats Column*/}
                {!this.state.inGTS ? this.printStats() : ""}

                {/*Moves Column*/}
                {!this.state.inGTS ? this.printMoves() : ""}
            </div>
        );
    }
}
