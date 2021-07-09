/*
    A class for viewing a Pokemon's summary.
*/

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";

import {GetMonLevel, GetMonAbility, GetMonNature, GetMonGender, GetVisibleStats, /*GetVisibleEVs, GetVisibleIVs,*/
        GetMonOTName, GetMonOTGender, GetMonVisibleOTId, CanMonGigantamax,
        GetMoveName, GetAbilityName, GetNatureName, IsMonEgg} from "./PokemonUtil";
import {BASE_GFX_LINK, GetItemName, GetItemIconLink} from "./Util";
import MoveData from "./data/MoveData.json";

import "./stylesheets/PokemonSummary.css";

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

const PP_BONUS_MASK = [0x03, 0x0c, 0x30, 0xc0];


export class PokemonSummary extends Component
{
    constructor(props)
    {
        super(props);
        this.state = //Set test data
        {
            pokemon: props.pokemon,
            areBoxViewsVertical :props.areBoxViewsVertical,
        };
    }

    getPP(pokemon, move, moveIndex)
    {
        var ppBonuses = pokemon["ppBonuses"];
        var basePP = MoveData[move]["pp"];
        return Math.min(Math.floor(basePP + ((basePP * 20 * ((PP_BONUS_MASK[moveIndex] & ppBonuses) >> (2 * moveIndex))) / 100), 99));
    }

    printBallAndItemIcon()
    {
        var ballType = this.state.pokemon["pokeBall"];
        var baseBallName = ballType.split("BALL_TYPE_")[1].split("_BALL")[0].toLowerCase();
        var ballName = baseBallName.charAt(0).toUpperCase() + baseBallName.slice(1) + " Ball";
        var ballNameTooltip = props => (<Tooltip {...props}>{ballName}</Tooltip>);

        var item = this.state.pokemon["item"];
        var itemName = GetItemName(item);
        var itemLink = GetItemIconLink(item);
        var itemTooltip = props => (<Tooltip {...props}>{itemName}</Tooltip>);

        let ballBaseLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/items/ball/";

        return (
            <div className="summary-ball-icon-container">
                {
                    itemLink !== "" ?
                        <OverlayTrigger placement="top" overlay={itemTooltip}>
                            <img src={itemLink} alt="" onMouseDown={(e) => e.preventDefault()}/>
                        </OverlayTrigger>
                    :
                        ""
                }
                <OverlayTrigger placement="top" overlay={ballNameTooltip}>
                    <img src={ballBaseLink + baseBallName + ".png"} alt="" onMouseDown={(e) => e.preventDefault()}/>
                </OverlayTrigger>
            </div>
        )
    }

    printStats()
    {
        var key = 0;
        var statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var visibleStatIdToStatId = [0, 1, 2, 4, 5, 3];
        var stats = GetVisibleStats(this.state.pokemon);
        var nature = GetMonNature(this.state.pokemon);
        /*var evs = GetVisibleEVs(this.state.pokemon);
        var ivs = GetVisibleIVs(this.state.pokemon);*/
        var printableStats = [];

        for (let visibleStatId = 0; visibleStatId < stats.length; ++visibleStatId)
        {
            let natureColour;
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

    printMoves()
    {
        var moves = [];
        var key = 0;
        var typeNames = ["", "", "", ""];
        var splitNames = ["", "", "", ""];

        if (this.state.pokemon !== null && this.state.pokemon["moves"] !== null)
        {
            let baseTypeIconLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/types/gen8/";
            let splitBaseLink = "https://raw.githubusercontent.com/msikma/pokesprite/master/misc/seals/home/move-";

            for (let i = 0; i < this.state.pokemon["moves"].length; ++i)
            {
                let move = this.state.pokemon["moves"][i];

                //Print Type
                if (move in MoveData)
                {
                    var moveType = MoveData[move]["type"];
                    typeNames[i] = moveType.toLowerCase().charAt(5).toUpperCase() + moveType.toLowerCase().slice(6); //Start after TYPE_
                    var alt = typeNames[i].slice(0, 2);
                    var typeNameTooltip = props => (<Tooltip {...props}>{typeNames[i]}</Tooltip>);

                    moves.push(
                        <OverlayTrigger placement="left" overlay={typeNameTooltip} key={key++}>
                            <img src={baseTypeIconLink + typeNames[i].toLowerCase() + ".png"} alt={alt} className="summary-move-type" />
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
                    var pp = this.getPP(this.state.pokemon, move, i);
                    moves.push(<span className="summary-pp" key={key++}>{pp}</span>);

                    //Print Move Split
                    var moveSplit = MoveData[move]["split"];
                    splitNames[i] = moveSplit.toLowerCase().charAt(6).toUpperCase() + moveSplit.toLowerCase().slice(7); //Start after SPLIT_
                    var splitNameTooltip = props => (<Tooltip {...props}>{splitNames[i]}</Tooltip>);

                    moves.push(
                        <OverlayTrigger placement={this.state.areBoxViewsVertical ? "top" : "right"} overlay={splitNameTooltip} key={key++}>
                            <img src={splitBaseLink + splitNames[i].toLowerCase() + ".png"} alt={splitNames[i].slice(0, 2)} className="summary-move-split"/>
                        </OverlayTrigger>
                    );
                }
                else
                {
                    moves.push(<span className="summary-pp" key={key++}/>);
                    moves.push(<span className="summary-move-split" key={key++}/>);
                }
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
        )
    }

    getGenderSymbol()
    {
        var symbol = "";
        var gender = GetMonGender(this.state.pokemon).toUpperCase();

        if (gender === "M")
            symbol = <span className="male-gender-symbol">♂</span>;
        else if (gender === "F")
            symbol = <span className="female-gender-symbol">♀</span>;

        return symbol;
    }

    render()
    {
        var level = GetMonLevel(this.state.pokemon);
        var ability = GetAbilityName(GetMonAbility(this.state.pokemon));
        var nature = GetNatureName(GetMonNature(this.state.pokemon));
        var friendship = this.state.pokemon["friendship"];
        var maxFriendship = 255;
        var heartFriendship = 220;

        var heartTooltipText = (friendship >= maxFriendship) ? "Trusts you completely." : "Trusts you a lot.";
        var heartTooltip = props => (<Tooltip {...props}>{heartTooltipText}</Tooltip>);
        var gigantamaxTooltip = props => (<Tooltip {...props}>Gigantamax</Tooltip>);

        var summaryOT =
            <div className="summary-ot-container">
                <span className={GetMonOTGender(this.state.pokemon) === "M" ? "summary-male-ot" : "summary-female-ot"}>
                    {GetMonOTName(this.state.pokemon)}
                </span>
                : {GetMonVisibleOTId(this.state.pokemon)}
            </div>

        if (IsMonEgg(this.state.pokemon))
        {
            //Limited view for Eggs
            return (
                <div className="pokemon-summary-container">
                    <div className="summary-name-level-container">
                        <span>Egg</span>
                    </div>
                    {summaryOT}
                    {this.printBallAndItemIcon()}
                </div>
            );
        }

        return (
            <div className="pokemon-summary-container">
                <div className="summary-name-level-container">
                    <span className="summary-name">
                        {this.state.pokemon["nickname"]}
                    </span>
                    <span>
                        {this.getGenderSymbol()}
                    </span>
                    <span className="summary-level">
                        Lv. {level}
                    </span>
                    {
                        friendship >= heartFriendship ?
                            <OverlayTrigger placement="top" overlay={heartTooltip}>
                                <span className="summary-heart" style={{color: (friendship >= maxFriendship) ? "red" : "grey"}}>
                                        ♥
                                </span>
                            </OverlayTrigger>
                        :
                            ""
                    }
                    {
                        CanMonGigantamax(this.state.pokemon) ?
                            <OverlayTrigger placement="top" overlay={gigantamaxTooltip}>
                                <img src={BASE_GFX_LINK + "gigantamax.png"} alt={"Gigantamax"} aria-label="Can Gigantamax" className="summary-gigantamax"/>
                            </OverlayTrigger>
                        :
                            ""
                    }
                </div>
                {summaryOT}
                <div className="summary-ability">
                    Ability: {ability}
                </div>
                <div className="summary-nature">
                    Nature: {nature}
                </div>
                {this.printBallAndItemIcon()}
                {this.printStats()}
                {this.printMoves()}
            </div>
        );
    }
}
