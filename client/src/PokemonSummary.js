/*
    A class for viewing a Pokemon's summary.
*/

import React, {Component} from 'react';
import {GetMonLevel, GetMonAbility, GetMonNature, GetMonGender, GetVisibleStats, /*GetVisibleEVs, GetVisibleIVs,*/
        GetMonOTName, GetMonOTGender, GetMonVisibleOTId, CanMonGigantamax,
        GetMoveName, GetAbilityName, GetNatureName} from "./PokemonUtil";
import MoveData from "./data/MoveData.json";

import "./stylesheets/PokemonSummary.css";
import { GiVampireCape } from 'react-icons/gi';

const BASE_GFX_LINK = "images/";

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
        };
    }

    getPP(pokemon, move, moveIndex)
    {
        var ppBonuses = pokemon["ppBonuses"];
        var basePP = MoveData[move]["pp"];
        return Math.min(Math.floor(basePP + ((basePP * 20 * ((PP_BONUS_MASK[moveIndex] & ppBonuses) >> (2 * moveIndex))) / 100), 99));
    }

    printBallIcon()
    {
        var ballType = this.state.pokemon["pokeBall"];
        var ballName = ballType.split("BALL_TYPE_")[1].split("_BALL")[0].toLowerCase();
        ballName = ballName.charAt(0).toUpperCase() + ballName.slice(1) + " Ball";

        return (
            <div className="summary-ball-icon-container">
                <img src={BASE_GFX_LINK + ballType + ".png"} alt="" aria-label={ballName}/>
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

        if (this.state.pokemon !== null && this.state.pokemon["moves"] !== null)
        {
            for (let i = 0; i < this.state.pokemon["moves"].length; ++i)
            {
                let move = this.state.pokemon["moves"][i];

                //Print Type
                if (move in MoveData)
                {
                    var moveType = MoveData[move]["type"];
                    var typeName = moveType.toLowerCase().charAt(5).toUpperCase() + moveType.toLowerCase().slice(6); //Start after TYPE_
                    var alt = typeName.slice(0, 2);
                    moves.push(<img src={BASE_GFX_LINK + moveType + ".png"} alt={alt} aria-label={typeName} className="summary-move-type" key={key++} />)
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
                    var splitName = moveSplit.toLowerCase().charAt(6).toUpperCase() + moveSplit.toLowerCase().slice(7); //Start after SPLIT_
                    var alt = typeName.slice(0, 2);
                    moves.push(<img src={BASE_GFX_LINK + moveSplit + ".png"} alt={alt} aria-label={splitName} className="summary-move-split" key={key++} />)
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

        return (
            <div className="pokemon-summary-container">
                <div className="summary-name-level-container">
                    <span>
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
                            <span className="summary-heart" style={{color: (friendship >= maxFriendship) ? "red" : "grey"}}>
                                ♥
                            </span>
                        :
                            ""
                    }
                    {
                        CanMonGigantamax(this.state.pokemon) ?
                            <img src={BASE_GFX_LINK + "gigantamax.png"} alt={"Gigantamax"} aria-label="Can Gigantamax" className="summary-gigantamax"/>
                        :
                            ""
                    }
                </div>
                <div className="summary-ot-container">
                    <span className={GetMonOTGender(this.state.pokemon) === "M" ? "summary-male-ot" : "summary-female-ot"}>
                        {GetMonOTName(this.state.pokemon)}
                    </span>
                    : {GetMonVisibleOTId(this.state.pokemon)}
                </div>
                <div className="summary-ability">
                    Ability: {ability}
                </div>
                <div className="summary-nature">
                    Nature: {nature}
                </div>
                {this.printBallIcon()}
                {this.printStats()}
                {this.printMoves()}
            </div>
        );
    }
}
