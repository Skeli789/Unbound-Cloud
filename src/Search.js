/**
 * A class for applying a search filter to Pokemon.
 */

import React, { Component } from 'react';
import {Button, Form} from "react-bootstrap";
import {Dropdown} from 'semantic-ui-react';

import {BOX_HOME} from './MainPage';
import {GetAbility, GetGender, GetItem, GetLevel, GetNature, GetMoves, GetSpecies,
        GetVisibleNature, HasPokerus, IsEgg, IsShiny, MAX_LEVEL} from './PokemonUtil';
import {GetAbilityName, GetItemName, GetSpeciesName} from "./Util";

import AbilityNames from "./data/AbilityNames.json";
import ItemNames from "./data/ItemNames.json";
import MoveNames from "./data/MoveNames.json";
import NatureNames from "./data/NatureNames.json";
import UnboundSpecies from "./data/UnboundSpecies.json";

import {ImCancelCircle} from "react-icons/im";

import "./stylesheets/BoxView.css";
import "./stylesheets/Search.css";


export class Search extends Component
{
    /**
     * Sets up the data fields needed for the search menu.
     */
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
            pokerus: [false, false],
            speciesNameList: this.createSpeciesNameList(),
            abilityNameList: this.createAbilityNameList(),
            moveNameList: this.createMoveNameList(),
            itemNameList: this.createItemNameList(),
            natureNameList: this.createNatureNameList(),
            boxType: this.props.boxType,
            boxSlot: this.props.boxSlot,
            parent: this.props.parent,
            mainPage: this.props.mainPage,
        };
    }

    /**
     * Gets whether or not the search filter is for Home storage boxes.
     * @returns {Boolean} True if the search will be applied to a Home box. False otherwise.
     */
    isHomeBox()
    {
        return this.state.boxType === BOX_HOME;
    }

    /**
     * Creates a list of species names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: SPECIES_ID, text: Species Name, value: SPECIES_ID}.
     */
    createSpeciesNameList()
    {
        var species = [];
        var namesAdded = {};

        for (let speciesId of Object.keys(UnboundSpecies))
        {
            if (speciesId === "SPECIES_NONE")
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

    /**
     * Creates a list of Ability names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: ABILITY_ID, text: Ability Name, value: ABILITY_ID}.
     */
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

    /**
     * Creates a list of move names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: MOVE_ID, text: Move Name, value: MOVE_ID}.
     */
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

    /**
     * Creates a list of item names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: ITEM_ID, text: Item Name, value: ITEM_ID}.
     */
    createItemNameList()
    {
        var items = [];

        for (let itemId of Object.keys(ItemNames))
        {
            if (itemId === "ITEM_NONE")
                continue;

            items.push({key: itemId, text: GetItemName(itemId), value: itemId});
        }

        items.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return items;
    }

    /**
     * Creates a list of nature names that the user can search for.
     * @returns {Array <Object>} A list of objects with the format {key: NATURE_NUMBER, text: Nature Name, value: NATURE_NUMBER}.
     */
    createNatureNameList()
    {
        var natures = [];

        for (let natureId of Object.keys(NatureNames))
            natures.push({key: natureId, text: NatureNames[natureId], value: natureId});

        natures.sort((a, b) => (a.text > b.text) ? 1 : -1);
        return natures;
    }

    /**
     * Makes it so the user's starting level input is always valid.
     */
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

    /**
     * Makes it so the user's ending level input is always valid.
     */
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

    /**
     * Adds a checkmark for a specific gender selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} genderId - The number in the gender selection to check off.
     */
    checkOffGender(e, genderId)
    {
        var isChecked = e.target.checked;
        var genders = this.state.genders;

        genders[genderId] = isChecked;
        this.setState({genders: genders});
    }

    /**
     * Adds a checkmark for a specific shiny selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} shinyId - The number in the shiny selection to check off.
     */
    checkOffShinyChoice(e, shinyId)
    {
        var isChecked = e.target.checked;
        var shinyChoice = [false, false];

        if (shinyId >= 0)
            shinyChoice[shinyId] = isChecked; //Max one choice at a time
        this.setState({shiny: shinyChoice});
    }

    /**
     * Adds a checkmark for a specific Pokerus selection.
     * @param {Object} e - The checkbox event.
     * @param {Number} pokerusId - The number in the Pokerus selection to check off.
     */
    checkOffPokerusChoice(e, pokerusId)
    {
        var isChecked = e.target.checked;
        var pokerusChoice = [false, false];

        if (pokerusId >= 0)
            pokerusChoice[pokerusId] = isChecked; //Max one choice at a time
        this.setState({pokerus: pokerusChoice});
    }

    /**
     * Closes a search menu without searching.
     */
    cancelSearch()
    {
        this.state.parent.setState({searching: false});
    }

    /**
     * Starts searching for Pokemon matching the user's criteria.
     * @param {Object} e - The form submission event.
     */
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

        if (this.state.itemIds.length > 0)
            criteria["item"] = this.state.itemIds;

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

        if (this.state.pokerus.some((x) => x)) //At least one Pokerus option selected
        {
            if (this.state.pokerus[0])
                criteria["pokerus"] = true; //Only Pokerus
            else
                criteria["pokerus"] = false; //No Pokerus
        }

        if (Object.keys(criteria).length === 0) //Nothing specified
            criteria = null;

        searchCriteria[this.state.boxSlot] = criteria;
        this.state.mainPage.setState({searchCriteria: searchCriteria});
        this.state.parent.setState({searching: false});
    }

    /**
     * Prints the search menu.
     */
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

                    {/* Item Input */}
                    {<Form.Group controlId="formItem">
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
                        </Form.Group>}

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
                                        key={"shiny-" + id}
                                    />
                            )
                        }
                    </Form.Group>

                    {/* Pokerus Input */}
                    <Form.Group>
                        <Form.Label>Pokérus</Form.Label>
                        <br/>
                        <Form.Check
                            inline
                            type="radio"
                            label="Either"
                            size="lg"
                            onChange={e => this.checkOffPokerusChoice(e, -1)}
                            checked={!this.state.pokerus[0] && !this.state.pokerus[1]}
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
                                        onChange={e => this.checkOffPokerusChoice(e, id)}
                                        checked={this.state.pokerus[id]}
                                        key={"pokerus-" + id}
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

/**
 * Checks if a Pokemon matches a given search criteria.
 * @param {Pokemon} pokemon - The Pokemon to check.
 * @param {Object} searchCriteria - The search criteria to check against.
 * @returns True if the Pokemon matches the given search criteria. False otherwise.
 */
export function MatchesSearchCriteria(pokemon, searchCriteria)
{
    if (searchCriteria === null || searchCriteria === {})
        return false; //No search criteria

    var isEgg = IsEgg(pokemon);

    //Check Wanted Species
    if ("species" in searchCriteria)
    {
        let name = isEgg ? "Egg" : GetSpeciesName(GetSpecies(pokemon));
        if (!searchCriteria["species"].includes(name))
            return false;
    }

    if (isEgg)
        return false; //From here down nothing is applicable to an Egg

    //Check Has Move
    if ("move" in searchCriteria)
    {
        let i;
        let moves = GetMoves(pokemon);

        for (i = 0; i < moves.length; ++i)
        {
            if (searchCriteria["move"].includes(moves[i]))
                break; //Has at least one requested move
        }

        if (i >= moves.length)
            return false; //Didn't have needed move
    }

    //Check Has Ability
    if ("ability" in searchCriteria)
    {
        if (!searchCriteria["ability"].includes(GetAbility(pokemon)))
            return false;
    }

    //Check Holds Item
    if ("item" in searchCriteria)
    {
        if (!searchCriteria["item"].includes(GetItem(pokemon)))
            return false;
    }

    //Check Has Nature
    if ("nature" in searchCriteria)
    {
        if (!searchCriteria["nature"].includes(GetNature(pokemon))
        && !searchCriteria["nature"].includes(GetVisibleNature(pokemon))) //Eg. Nature Mint
            return false;
    }

    //Check correct level range
    if ("levelStart" in searchCriteria)
    {
        if (GetLevel(pokemon) < searchCriteria["levelStart"])
            return false;
    }

    if ("levelEnd" in searchCriteria)
    {
        if (GetLevel(pokemon) > searchCriteria["levelEnd"])
            return false;
    }

    //Check Matches Gender
    if ("gender" in searchCriteria)
    {
        if (!searchCriteria["gender"].includes(GetGender(pokemon)))
            return false;

    }

    //Check Matches Shiny
    if ("shiny" in searchCriteria)
    {
        if (IsShiny(pokemon) !== searchCriteria["shiny"])
            return false;
    }

    //Check Matches Pokerus
    if ("pokerus" in searchCriteria)
    {
        if (HasPokerus(pokemon) !== searchCriteria["pokerus"])
            return false;
    }

    return true;
}
