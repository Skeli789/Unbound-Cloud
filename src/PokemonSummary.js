/**
 * A class for viewing a Pokemon's summary.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {CanMonGigantamax, GetAbility, GetCaughtBall, GetFriendship, GetGender, GetItem, GetLevel,
        GetMovePP, GetMoves, GetNature, GetNickname, GetOTGender, GetOTName, GetVisibleOTId, GetVisibleStats,
        /*GetVisibleEVs, GetVisibleIVs,*/ IsEgg, HEART_FRIENDSHIP, MAX_FRIENDSHIP} from "./PokemonUtil";
import {BASE_GFX_LINK, GetAbilityName, GetItemIconLink, GetItemName, GetMoveName, GetNatureName} from "./Util";
import MoveData from "./data/MoveData.json";

import "./stylesheets/PokemonSummary.css";

//TODO: Clicking a button by the stats swaps to IV/EV view.
//TODO: Change nature highlighting to red arrow and blue arrow.

const NATURE_STAT_TABLE =
[
    // Atk Def Spd Sp.Atk Sp.Def
    [    0,  0,  0,     0,     0], // Hardy
    [   +1, -1,  0,     0,     0], // Lonely
    [   +1,  0, -1,     0,     0], // Brave
    [   +1,  0,  0,    -1,     0], // Adamant
    [   +1,  0,  0,     0,    -1], // Naughty
    [   -1, +1,  0,     0,     0], // Bold
    [    0,  0,  0,     0,     0], // Docile
    [    0, +1, -1,     0,     0], // Relaxed
    [    0, +1,  0,    -1,     0], // Impish
    [    0, +1,  0,     0,    -1], // Lax
    [   -1,  0, +1,     0,     0], // Timid
    [    0, -1, +1,     0,     0], // Hasty
    [    0,  0,  0,     0,     0], // Serious
    [    0,  0, +1,    -1,     0], // Jolly
    [    0,  0, +1,     0,    -1], // Naive
    [   -1,  0,  0,    +1,     0], // Modest
    [    0, -1,  0,    +1,     0], // Mild
    [    0,  0, -1,    +1,     0], // Quiet
    [    0,  0,  0,     0,     0], // Bashful
    [    0,  0,  0,    +1,    -1], // Rash
    [   -1,  0,  0,     0,    +1], // Calm
    [    0, -1,  0,     0,    +1], // Gentle
    [    0,  0, -1,     0,    +1], // Sassy
    [    0,  0,  0,    -1,    +1], // Careful
    [    0,  0,  0,     0,     0], // Quirky
];

const POKE_BALL_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/";
const TYPE_ICON_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/";
const CATEGORY_ICON_GFX_LINK = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/seals/home/move-";


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
            areBoxViewsVertical: props.areBoxViewsVertical,
        };
    }

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

        if (friendship >= HEART_FRIENDSHIP)
        {
            return (
                <OverlayTrigger placement="top" overlay={heartTooltip}>
                    <span className="summary-heart" style={{color: isMaxFriendship ? "red" : "grey"}}>
                        ♥
                    </span>
                </OverlayTrigger>
            );
        }

        return "";
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
        var baseBallName = ballType.split("BALL_TYPE_")[1].split("_BALL")[0].toLowerCase();
        var ballName = baseBallName.charAt(0).toUpperCase() + baseBallName.slice(1) + " Ball";
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
        var visibleStatIdToStatId = [0, 1, 2, 4, 5, 3];
        var stats = GetVisibleStats(this.state.pokemon);
        var nature = GetNature(this.state.pokemon);
        /*var evs = GetVisibleEVs(this.state.pokemon);
        var ivs = GetVisibleIVs(this.state.pokemon);*/
        var printableStats = [];

        for (let visibleStatId = 0; visibleStatId < stats.length; ++visibleStatId)
        {
            let natureColour = "";
            let realStatId = visibleStatIdToStatId[visibleStatId];

            if (realStatId > 0) //Not HP
                natureColour = NATURE_STAT_TABLE[nature][realStatId - 1] === 1 ? "red"
                             : NATURE_STAT_TABLE[nature][realStatId  - 1] === -1 ? "cornflowerblue" : "";

            printableStats.push(
                <span className="summary-stat-title" key={key++}>
                    {statNames[visibleStatId]}
                </span>
            );

            printableStats.push(
                    <span className={"summary-stat-value"} style={{color: natureColour}} key={key++}>
                        {stats[visibleStatId]}
                    </span>
            );

            /*printableStats.push(
                    <span className="summary-stat-ev" key={key++}>
                        {evs[statId]}
                    </span>
            );

            printableStats.push(
                    <span className="summary-stat-iv" key={key++}>
                        {ivs[statId]}
                    </span>
            );*/
        }

        return (
            <div className="summary-stats-container">
                {printableStats}
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
                var moveType = MoveData[move]["type"];
                typeNames[i] = moveType.toLowerCase().charAt(5).toUpperCase() + moveType.toLowerCase().slice(6); //Start after TYPE_
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
        var level = GetLevel(this.state.pokemon);
        var ability = GetAbilityName(GetAbility(this.state.pokemon));
        var nature = GetNatureName(GetNature(this.state.pokemon));

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
                    <span className="summary-name">
                        {GetNickname(this.state.pokemon)}
                    </span>

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
                </div>

                {/*OT Summary Row*/}
                {this.printOTSummary()}

                {/*Ability Row*/}
                <div className="summary-ability">
                    Ability: {ability}
                </div>

                {/*Nature Row*/}
                <div className="summary-nature">
                    Nature: {nature}
                </div>

                {/*Ball & Item in Corner*/}
                {this.printBallAndItemIcon()}

                {/*Stats Column*/}
                {this.printStats()}

                {/*Moves Column*/}
                {this.printMoves()}
            </div>
        );
    }
}
