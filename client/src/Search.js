import React, {Component} from 'react';
import {Form, Button} from "react-bootstrap";
import {Dropdown} from 'semantic-ui-react'

import {BOX_HOME} from './MainPage';
import {GetMonNature, GetMonGender, GetMonAbility, GetMonLevel, IsMonShiny,
        GetSpeciesName, GetAbilityName} from './PokemonUtil';
import AbilityNames from "./data/AbilityNames.json";
import MoveNames from "./data/MoveNames.json";
import NatureNames from "./data/NatureNames.json";
import UnboundSpecies from "./data/UnboundSpecies.json";

import {ImCancelCircle} from "react-icons/im";

import "./stylesheets/BoxView.css";
import "./stylesheets/Search.css";

const MAX_LEVEL = 100;


export class Search extends Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            speciesIds: [],
            abilityIds: [],
            itemIds: [],
            moveIds: [],
            natureIds: [],
            levelStart: "",
            levelEnd: "",
            genders: [false, false, false],
            shiny: [false, false],
            speciesNameList: this.createSpeciesNameList(),
            abilityNameList: this.createAbilityNameList(),
            moveNameList: this.createMoveNameList(),
            natureNameList: this.createNatureNameList(),
            boxType: this.props.boxType,
            parent: this.props.parent,
            mainPage: this.props.mainPage,
        };
    }

    isHomeBox()
    {
        return this.state.boxType === BOX_HOME;
    }

    createSpeciesNameList()
    {
        var species = [];
        var namesAdded = {};

        for (let speciesId of Object.keys(UnboundSpecies))
        {
            if (speciesId === "SPECIES_NONE"
            || speciesId === "SPECIES_BAD_EGG")
                continue;

            var name = GetSpeciesName(speciesId);
            if (name in namesAdded || name === "Unknown Species")
                continue; //Don't add duplicate names

            species.push({key: speciesId, text: name, value: speciesId});
            namesAdded[name] = true;
        }

        species.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return species;
    }

    createMoveNameList()
    {
        var moves = [];

        for (let moveId of Object.keys(MoveNames))
        {
            if (moveId === "0"
            || MoveNames[moveId].startsWith("Z-Move")
            || MoveNames[moveId].startsWith("Max ")
            || MoveNames[moveId].startsWith("G-Max "))
                continue;

            moves.push({key: moveId, text: MoveNames[moveId], value: moveId});
        }

        moves.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return moves;
    }

    createAbilityNameList()
    {
        var abilities = [];

        for (let abilityId of Object.keys(AbilityNames))
        {
            if (abilityId === "ABILITY_NONE")
                continue;

            abilities.push({key: abilityId, text: GetAbilityName(abilityId), value: abilityId});
        }

        abilities.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return abilities;
    }

    createNatureNameList()
    {
        var natures = [];

        for (let natureId of Object.keys(NatureNames))
            natures.push({key: natureId, text: NatureNames[natureId], value: natureId});

        natures.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return natures;
    }

    setMoveInput(id, input)
    {
        var moves = this.state.moveIds;

        moves[id] = input;
        this.setState({moveIds: moves});
    }

    fixLevelStart()
    {
        var levelStart = this.state.levelStart.trim();
        var levelEnd = this.state.levelEnd;

        if (levelStart !== "" && isNaN(levelStart))
            levelStart = "";
        else if (parseInt(levelStart) < 1)
            levelStart = 1;
        else if (parseInt(levelStart) > MAX_LEVEL)
            levelStart = MAX_LEVEL;

        if (typeof(levelStart) == "number")
            levelStart = levelStart.toString();

        if (levelEnd !== "" && levelStart !== "" && !isNaN(levelEnd) && parseInt(levelStart) > parseInt(levelEnd))
            levelEnd = levelStart;

        this.setState({levelStart: levelStart, levelEnd: levelEnd});
    }

    fixLevelEnd()
    {
        var levelEnd = this.state.levelEnd.trim();
        var levelStart = this.state.levelStart;

        if (levelEnd !== "" && isNaN(levelEnd))
            levelEnd = "";
        else if (parseInt(levelEnd) < 1)
            levelEnd = 1;
        else if (parseInt(levelEnd) > MAX_LEVEL)
            levelEnd = MAX_LEVEL;

        if (typeof(levelEnd) == "number")
            levelEnd = levelEnd.toString();
    
        if (levelStart !== "" && levelEnd !== "" && !isNaN(levelStart) && parseInt(levelEnd) < parseInt(levelStart))
            levelStart = levelEnd;

        this.setState({levelEnd: levelEnd, levelStart: levelStart});
    }

    checkOffGender(e, genderId)
    {
        var isChecked = e.target.checked;
        var genders = this.state.genders;

        genders[genderId] = isChecked;
        this.setState({genders: genders});
    }

    checkOffShinyChoice(e, shinyId)
    {
        var isChecked = e.target.checked;
        var shinyChoice = [false, false];

        if (shinyId >= 0)
            shinyChoice[shinyId] = isChecked; //Max one choice at a time
        this.setState({shiny: shinyChoice});
    }

    cancelSearch()
    {
        this.state.parent.setState({searching: false});
    }

    updateSearchCriteria(e)
    {
        e.preventDefault(); //Prevent page reload

        var criteria = {};
        var searchCriteria = this.state.mainPage.state.searchCriteria;

        if (this.state.speciesIds.length > 0)
            criteria["species"] = this.state.speciesIds.map((species) => GetSpeciesName(species));

        if (this.state.moveIds.length > 0)
            criteria["move"] = this.state.moveIds;

        if (this.state.abilityIds.length > 0)
            criteria["ability"] = this.state.abilityIds;

        if (this.state.natureIds.length > 0)
            criteria["nature"] = this.state.natureIds.map((move) => parseInt(move));

        if (this.state.levelStart !== "" && !isNaN(this.state.levelStart) && parseInt(this.state.levelStart) > 1)
            criteria["levelStart"] = parseInt(this.state.levelStart);

        if (this.state.levelEnd !== "" && !isNaN(this.state.levelEnd) && parseInt(this.state.levelEnd) < MAX_LEVEL)
            criteria["levelEnd"] = parseInt(this.state.levelEnd);

        if (this.state.genders.some((x) => x) //At least one gender option selected
        && !this.state.genders.every((x) => x)) //And not all selected
        {
            criteria["gender"] = [];

            if (this.state.genders[0])
                criteria["gender"].push("M");

            if (this.state.genders[1])
                criteria["gender"].push("F");

            if (this.state.genders[2])
                criteria["gender"].push("U");
        }

        if (this.state.shiny.some((x) => x)) //At least one shiny option selected
        {
            if (this.state.shiny[0])
                criteria["shiny"] = true; //Only Shinies
            else
                criteria["shiny"] = false; //No Shinies
        }

        if (Object.keys(criteria).length === 0) //Nothing specified
            criteria = null;

        searchCriteria[this.state.boxType] = criteria;
        this.state.mainPage.setState({searchCriteria: searchCriteria});
        this.state.parent.setState({searching: false});
    }

    render()
    {
        return(
            <div className="search-view">
                <div className="box-title-no-edit">
                    <ImCancelCircle size={34} className="box-change-arrow" onClick={this.cancelSearch.bind(this)}/>
                    <span className="box-name">
                        <h2 className="search-title-text">Search</h2>
                    </span>
                    <ImCancelCircle size={34} className="box-change-arrow" style={{visibility: "hidden"}}/>
                </div>

                <Form
                        className={"search-form " + (this.isHomeBox() ? "home-box" : "save-box")}
                        onSubmit={(e) => this.updateSearchCriteria(e)}
                >
                    {/* Species Input */}
                    <Form.Group controlId="formSpecies">
                        <Form.Label>Species</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.speciesNameList}
                            onChange={(e, data) => this.setState({speciesIds: data.value})}
                        />
                    </Form.Group>

                    {/* Ability Input */}
                    <Form.Group controlId="formAbility">
                        <Form.Label>Ability</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.abilityNameList}
                            onChange={(e, data) => this.setState({abilityIds: data.value})}
                        />
                    </Form.Group>

                    {/* Item Input */}
                    {/*<Form.Group controlId="formItem">
                        <Form.Label>Item</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.itemNameList}
                            onChange={(e, data) => this.setState({itemIds: data.value})}
                        />
                        </Form.Group>*/}

                    {/* Moves Input */}
                    <Form.Group controlId="formMoves">
                        <Form.Label>Moves</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.moveNameList}
                            onChange={(e, data) => this.setState({moveIds: data.value})}
                        />
                    </Form.Group>

                    {/* Nature Input */}
                    <Form.Group controlId="formNature">
                        <Form.Label>Nature</Form.Label>
                        <Dropdown
                            placeholder='-'
                            fluid
                            multiple
                            search
                            selection
                            options={this.state.natureNameList}
                            onChange={(e, data) => this.setState({natureIds: data.value})}
                        />
                    </Form.Group>

                    {/* Level Range Input */}
                    <Form.Group controlId="formLevelStart">
                        <Form.Label>At Least Level</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="-"
                            value={this.state.levelStart}
                            onChange={(e) => this.setState({levelStart: e.target.value})}
                            onBlur={this.fixLevelStart.bind(this)}
                        />
                    </Form.Group>

                    <Form.Group controlId="formLevelEnd">
                        <Form.Label>At Most Level</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="-"
                            value={this.state.levelEnd}
                            onChange={(e) => this.setState({levelEnd: e.target.value})}
                            onBlur={this.fixLevelEnd.bind(this)}
                        />
                    </Form.Group>

                    {/* Gender Input */}
                    <Form.Group>
                        <Form.Label>Gender</Form.Label>
                        <br/>
                        {
                            ["Male", "Female", "Unknown"].map
                            (
                                (gender, id) =>
                                    <Form.Check
                                        inline
                                        type="checkbox"
                                        label={gender}
                                        size="lg"
                                        onChange={e => this.checkOffGender(e, id)}
                                        checked={this.state.genders[id]}
                                        key={id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Shiny Input */}
                    <Form.Group>
                        <Form.Label>Shiny</Form.Label>
                        <br/>
                        <Form.Check
                            inline
                            type="radio"
                            label="Either"
                            size="lg"
                            onChange={e => this.checkOffShinyChoice(e, -1)}
                            checked={!this.state.shiny[0] && !this.state.shiny[1]}
                        />
                        {
                            ["Only", "Exclude"].map
                            (
                                (name, id) =>
                                    <Form.Check
                                        inline
                                        type="radio"
                                        label={name}
                                        size="lg"
                                        onChange={e => this.checkOffShinyChoice(e, id)}
                                        checked={this.state.shiny[id]}
                                        key={id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Search Button */}
                    <div className = "search-form-buttons">
                        <Button className="search-button" type="submit">
                            Search
                        </Button>
                    </div>
                </Form>
            </div>
        )
    }
}

export function MatchesSearchCriteria(pokemon, searchCriteria)
{
    if (searchCriteria === null || searchCriteria === {})
        return false; //No search criteria

    //Check Wanted Species
    if ("species" in searchCriteria)
    {
        let name = GetSpeciesName(pokemon["species"]);
        if (!searchCriteria["species"].includes(name))
            return false;
    }

    //Check Has Move
    if ("move" in searchCriteria)
    {
        let i;

        for (i = 0; i < pokemon["moves"].length; ++i)
        {
            if (searchCriteria["move"].includes(pokemon["moves"][i]))
                break; //Has at least one requested move
        }

        if (i >= pokemon["moves"].length)
            return false; //Didn't have needed move
    }

    //Check Has Ability
    if ("ability" in searchCriteria)
    {
        if (!searchCriteria["ability"].includes(GetMonAbility(pokemon)))
            return false;
    }

    //Check Has Nature
    if ("nature" in searchCriteria)
    {
        if (!searchCriteria["nature"].includes(GetMonNature(pokemon)))
            return false;
    }

    //Check correct level range
    if ("levelStart" in searchCriteria)
    {
        if (GetMonLevel(pokemon) < searchCriteria["levelStart"])
            return false;
    }

    if ("levelEnd" in searchCriteria)
    {
        if (GetMonLevel(pokemon) > searchCriteria["levelEnd"])
            return false;
    }

    //Check Matches Gender
    if ("gender" in searchCriteria)
    {
        if (!searchCriteria["gender"].includes(GetMonGender(pokemon)))
            return false;

    }

    //Check Matches Shiny
    if ("shiny" in searchCriteria)
    {
        if (IsMonShiny(pokemon) !== searchCriteria["shiny"])
            return false;
    }

    return true;
}
