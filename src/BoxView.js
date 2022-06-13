/**
 * A class for viewing a box of 30 Pokemon.
 */

import React, {Component} from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile} from "react-device-detect";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {PokemonSummary} from "./PokemonSummary";
import {GetIconSpeciesLink, GetIconSpeciesLinkBySpecies, GetIconSpeciesName, GetNickname, GetSpecies, IsBlankMon,
        IsEgg, IsHoldingBannedItem, IsHoldingItem, IsShiny, IsValidPokemon, MonWillLoseDataInSave} from "./PokemonUtil";
import {MatchesSearchCriteria, Search} from "./Search";
import {ShowdownExport} from "./ShowdownExport";
import {BASE_GFX_LINK, CreateSingleBlankSelectedPos, GetBoxPosBoxColumn, GetBoxPosBoxRow, GetBoxStartIndex,
        GetLocalBoxPosFromBoxOffset, GetSpeciesName, IsHomeBox, IsNullSpeciesName, IsSaveBox} from "./Util";
import {WonderTrade} from "./WonderTrade";
import gLivingDexOrder from "./data/LivingDexOrder.json";
import gSpeciesToDexNum from "./data/SpeciesToDexNum.json";

import {AiFillWarning, AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineCheckCircle,
        AiOutlineCloseCircle, AiOutlineSave, AiOutlineTool} from "react-icons/ai";
import {BiSearchAlt2} from "react-icons/bi";
import {CgExport, CgPokemon} from "react-icons/cg";
import {GrEdit, GrMultiple, GrTrash} from "react-icons/gr";
import {RiBoxingLine} from "react-icons/ri";

import "./stylesheets/BoxView.css";

//Constants
export const HIGHEST_HOME_BOX_NUM = 100;
export const MONS_PER_BOX = 30;
export const MONS_PER_ROW = 6;
export const MONS_PER_COL = MONS_PER_BOX / MONS_PER_ROW;
export const MAX_TITLE_LENGTH = 16;

const LIVING_DEX_NONE = 0;
const LIVING_DEX_NO_FORMS = 1;
const LIVING_DEX_ALL = 2;

const PopUp = withReactContent(Swal);

//Tooltips
const boxListTooltip = props => (<Tooltip {...props}>See Other Boxes</Tooltip>);
const renameTooltip = props => (<Tooltip {...props}>Rename</Tooltip>);
const saveTooltip = props => (<Tooltip {...props}>Save</Tooltip>);
const cancelTooltip = props => (<Tooltip {...props}>Cancel</Tooltip>);
const livingDexTooltip = props => (<Tooltip {...props}>Living Dex</Tooltip>);
const searchTooltip = props => (<Tooltip {...props}>Search</Tooltip>);
const selectAllTooltip = props => (<Tooltip {...props}>Select All</Tooltip>);
const deselectAllTooltip = props => (<Tooltip {...props}>Deselect All</Tooltip>);
const showdownTooltip = props => (<Tooltip {...props}>Showdown</Tooltip>);
const releaseTooltip = props => (<Tooltip {...props}>Release</Tooltip>);
const fixLivingDexTooltip = props => (<Tooltip {...props}>Sort Living Dex</Tooltip>);
const tradeTooltip = props => (<Tooltip {...props}>Select For Trade</Tooltip>);
const loseDataTooltip = props => (<Tooltip {...props}>Will lose data after saving</Tooltip>);


export class BoxView extends Component
{
    /**
     * Sets up the entire box view.
     */
    constructor(props)
    {
        super(props);

        this.state = //Set test data
        {
            editingTitle: false,
            titleInput: "",
            fixingLivingDex: false,
            searching: false,
            viewingShowdown: false,

            allPokemon: props.pokemonJSON,
            titles: props.titles,
            boxType: props.boxType,
            boxSlot: props.boxSlot, //Left or right
            isSameBoxTypeBothSides: props.isSameBoxBothSides,
            inTrade: props.inTrade,
            parent: props.parent,
            tradeParent: props.tradeParent,
        };
    }


    /**********************************
         General Utility Functions     
    **********************************/

    /**
     * @returns {Boolean} True if the current box is from the saved game, False otherwise.
     */
    isSaveBox()
    {
        return IsSaveBox(this.state.boxType);
    }

    /**
     * @returns {Boolean} True if the current box is from the Home file, False otherwise.
     */
    isHomeBox()
    {
        return IsHomeBox(this.state.boxType);
    }

    /**
     * @returns {Boolean} True if both boxes on the page are Home boxes, or both boxes on the page are Save boxes.
     */
    isSameBoxTypeBothSides()
    {
        return this.state.isSameBoxTypeBothSides;
    }

    /**
     * @returns {Number} The box id for the current box.
     */
    getCurrentBoxId()
    {
        return this.getParentState().currentBox[this.state.boxSlot];
    }

    /**
     * @returns {Number} The index in the list of all Pokemon this box starts at.
     */
    getBoxStartIndex()
    {
        return GetBoxStartIndex(this.getCurrentBoxId());
    }

    /**
     * @returns {Number} The box slot of the box this isn't.
     */
    getOtherBoxSlot()
    {
        return this.state.boxSlot ^ 1;
    }

    /**
     * @returns {Number} The largest id possible for a save box based on the current game.
     */
    getHighestSaveBoxNum()
    {
        return this.getParentState().saveBoxCount;
    }

    /**
     * @returns {Numbers} The user's chosen living dex view type, if any.
     */
    getLivingDexState()
    {
        return this.getParentState().livingDexState[this.state.boxSlot];
    }

    /**
     * Updates the user's chosen living dex state.
     * @param {Number} newState - The new living dex state to set for the current box.
     */
    setLivingDexState(newState)
    {
        var livingDexState = this.getParentState().livingDexState;
        livingDexState[this.state.boxSlot] = newState;
        this.state.parent.setState({livingDexState: livingDexState});
    }

    /**
     * @returns {Boolean} True if a search is in progress, False otherwise.
     */
    shouldFilterSearchResults()
    {
        return this.getParentState().searchCriteria[this.state.boxSlot] != null;
    }

    /**
     * @returns {Boolean} True if the current box is being saved, False otherwise.
     */
    isSaving()
    {
        return false; //Pop-Up should now prevent any modifications during saving
    }

    /**
     * @returns {Boolean} True if the user is currently selecting a Pokemon for a trade. False if normal controls.
     */
    isTrading()
    {
        return this.state.inTrade;
    }

    /**
     * @returns {Object} The this.state of MainPage.js.
     */
    getParentState()
    {
        return this.state.parent.state;
    }

    /**
     * Gets whether or not the mon at a specific box position is selected.
     * @param {Number} boxPos - The box position the mon is at.
     * @returns {Boolean} True if the mon has been selected, False otherwise.
     */
    isMonAtPosSelected(boxPos)
    {
        return this.getParentState().selectedMonBox[this.state.boxSlot] === this.getCurrentBoxId()
            && this.getParentState().selectedMonPos[this.state.boxSlot][boxPos];
    }

    /**
     * Gets whether or not the mon at a specific box position is currently up for a Wonder Trade.
     * @param {Number} boxPos - The box position the mon was at.
     * @returns {Boolean} True if the mon is up for a Wonder Trade, False otherwise.
     */
    isMonAtPosInWonderTrade(boxPos)
    {
        var wonderTradeData = this.getParentState().wonderTradeData;

        if (wonderTradeData != null)
        {
            return this.getCurrentBoxId() === wonderTradeData.boxNum
                && boxPos === wonderTradeData.boxPos
                && this.state.boxType === wonderTradeData.boxType;
        }

        return false;
    }

    /**
     * Gets whether or not the mon at a specific box position is currently being dragged.
     * @param {Number} boxPos - The box position to check.
     * @param {Boolean} leftCellAtLeastOnce - Whether or not the Pokemon has been dragged out its cell at least once.
     * @returns {Boolean} True if the mon is being dragged, False otherwise.
    */
    isMonAtPosBeingDragged(boxPos, leftCellAtLeastOnce)
    {
        return this.getParentState().draggedAtLeastOnce //Icon is attached to mouse
            && this.getParentState().draggingMon === boxPos + this.getBoxStartIndex()
            && this.getParentState().draggingFromBox === this.state.boxSlot
            && (!leftCellAtLeastOnce || this.getParentState().draggingLeftCell);
    }

    /**
     * Gets whether or not the mon at a specific box position should be highlighted when the
     * user tried to move it to an impossible spot.
     * @param {Number} boxPos - The box position the mon is at.
     * @returns {Boolean} True if the mon couldn't have been moved where it was placed, False otherwise.
     */
    shouldShowIconImpossibleMoveWarning(boxPos)
    {
        if (this.getParentState().impossibleMovement != null)
        {
            var impossibleMovement = this.getParentState().impossibleMovement[this.state.boxSlot];
            var row = Math.floor(boxPos / MONS_PER_ROW);
            var col = boxPos % MONS_PER_ROW;

            return impossibleMovement[row][col];
        }

        return false;
    }

    /**
     * Gets whether or not a box position should light up as it's hovered over.
     * @param {Number} boxPos - The box position to check.
     * @returns True if the position should be lit up. False otherwise.
     */
    shouldDisplayHoverOverPos(boxPos)
    {
        if (this.getParentState().draggingToBox === this.state.boxSlot //Not necessarily dragging, mouse is just over
        && this.getParentState().draggingOver === this.getBoxStartIndex() + boxPos //Hovering over this spot
        && !this.movingMultiplePokemonFromOtherBox()) //Spot may not be lit up because multi-select lighting takes priority
            return true;

        return this.isPosSpotForMultiDrop(boxPos);
    }

    /**
     * Gets whether or not the current pos will have a Pokemon placed in it for a multi-select placement.
     * @param {Number} boxPos - The box position to check.
     * @returns {Boolean} True if the box position will have a Pokemon placed in it. False otherwise.
     */
    isPosSpotForMultiDrop(boxPos)
    {
        var dropTopLeftPos = GetLocalBoxPosFromBoxOffset(this.getParentState().draggingOver); //Top left position of the placement

        if (dropTopLeftPos >= 0 //Mouse is over box
        && this.getParentState().draggingToBox === this.state.boxSlot //Not necessarily dragging, mouse is just over
        && this.movingMultiplePokemonFromOtherBox())
        {
            let currRow = GetBoxPosBoxRow(boxPos); //Of the spot to potentially be lit up
            let currCol = GetBoxPosBoxColumn(boxPos); //Of the spot to potentially be lit up
            let dropTopRow = GetBoxPosBoxRow(dropTopLeftPos); //Where the mouse is currently over
            let dropLeftCol = GetBoxPosBoxColumn(dropTopLeftPos); //Where the mouse is currently over

            if (currRow < dropTopRow || currCol < dropLeftCol) //Spot isn't even in range
                return false;

            let dropRowOffset = currRow - dropTopRow; //Rows away from where the mouse is
            let dropColOffset = currCol - dropLeftCol; //Columns away from where the mouse is

             //Determine the pickup area
            let pickUpTopRow = Number.MAX_SAFE_INTEGER; //Top row of pickup area
            let pickUpLeftCol = Number.MAX_SAFE_INTEGER; //Left column of pickup area
            let otherBoxSelectedPos = this.getParentState().selectedMonPos[this.getOtherBoxSlot()]; //Where the mons are coming from
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (otherBoxSelectedPos[i])
                {
                    let row = GetBoxPosBoxRow(i);
                    let col = GetBoxPosBoxColumn(i);

                    if (row < pickUpTopRow)
                        pickUpTopRow = row;

                    if (col < pickUpLeftCol)
                        pickUpLeftCol = col;
                }
            }

            //Determine where in the pickup area boxPos (parameter) would correspond to
            let checkPickUpRow = pickUpTopRow + dropRowOffset;
            let checkPickUpCol = pickUpLeftCol + dropColOffset;
            let checkPickUpPos = checkPickUpRow * MONS_PER_ROW + checkPickUpCol;
            return otherBoxSelectedPos[checkPickUpPos];
        }

        return false;
    }

    /**
     * Gets the Pokemon in the current box at a specific position.
     * @param {Number} boxPos - The position in the current box to get the Pokemon from.
     * @returns {Pokemon} The Pokemon in the current box at the requested position.
     */
    getMonInCurrentBoxAt(boxPos)
    {
        var offset = this.getBoxStartIndex() + boxPos;
        return this.state.allPokemon[offset];
    }

    /**
     * Gets the species name of Pokemon in the current box at a specific position.
     * @param {Number} boxPos - The position in the current box to get the species name from.
     * @returns {String} The species name of the Pokemon in the current box at the requested position.
     */
    getSpeciesNameInCurrentBoxAt(boxPos)
    {
        return GetIconSpeciesName(this.getMonInCurrentBoxAt(boxPos));
    }

    /**
     * Gets whether or not a Pokemon matches the requested search parameters.
     * @param {Pokemon} pokemon - The Pokemon to check if the search criteria matches.
     * @returns {Boolean} True if the Pokemon matches the search criteria, False otherwise.
     */
    matchesSearchCriteria(pokemon)
    {
        if (!this.shouldFilterSearchResults())
            return true; //Not searching

        var searchCriteria = this.getParentState().searchCriteria[this.state.boxSlot];

        return MatchesSearchCriteria(pokemon, searchCriteria, this.getParentState().saveGameId);
    }


    /**********************************
        Selection Utility Functions
    **********************************/

    /**
     * @returns {Boolean} True if a certain Pokemon can't be selected ever. False if it can be.
     */
    isUnselectableMon(pokemon)
    {
        return IsBlankMon(pokemon)
            || IsNullSpeciesName(GetIconSpeciesName(pokemon));
    }

    /**
     * @returns {Boolean} True if the selected Pokemon are from the current box, False if they're from some other box.
     */
    areSelectedPokemonInCurrentBox()
    {
        var selectedMonBox = this.getParentState().selectedMonBox;
        return selectedMonBox[this.state.boxSlot] === this.getCurrentBoxId();
    }

    /**
     * Gets whether or not any Pokemon in the current box have been selected.
     * @param {Boolean} countEggs - Whether or not selected Eggs count.
     * @returns {Boolean} True if any Pokemon is selected, False otherwise.
     */
    areAnyPokemonSelectedInCurrentBox(countEggs)
    {
        var startIndex = this.getBoxStartIndex();
        var selectedMonPos = this.getParentState().selectedMonPos;

        if (this.areSelectedPokemonInCurrentBox()) //Selection is in the current box and not from some previous box
        {
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                let allPokemonIndex = startIndex + i;

                if (!this.isUnselectableMon(this.state.allPokemon[allPokemonIndex]) //Ignore blank slots
                && (countEggs || !IsEgg(this.state.allPokemon[allPokemonIndex]))
                && selectedMonPos[this.state.boxSlot][i])
                    return true; //At least one mon selected
            }
        }

        return false;
    }

    /**
     * Gets whether or not all Pokemon in the current box have been selected.
     * @returns {Boolean} True if all Pokemon are selected, False otherwise.
     */
    /*areAllPokemonSelectedInCurrentBox()
    {
        var startIndex = this.getBoxStartIndex();
        var selectedMonPos = this.getParentState().selectedMonPos;
        let allSelected = false;

        if (this.areSelectedPokemonInCurrentBox()) //Not from some previous box
        {
            let i;
    
            for (i = 0; i < MONS_PER_BOX; ++i)
            {
                let allPokemonIndex = startIndex + i;

                if (!this.isUnselectableMon(this.state.allPokemon[allPokemonIndex]) //Ignore blank slots
                && !this.isMonAtPosInWonderTrade(i) //Can't select this mon
                && !selectedMonPos[this.state.boxSlot][i])
                    break; //At least one mon not selected
            }

            if (i >= MONS_PER_BOX)
                allSelected = true;
        }
    
        return allSelected;
    }*/

    /**
     * Gets whether or not a single Pokemon in the current box has been selected (including Eggs).
     * @returns {Boolean} True if a single Pokemon is selected, False otherwise.
     */
    isOnlyOnePokemonSelectedInCurrentBox()
    {
        var startIndex = this.getBoxStartIndex();
        var selectedMonPos = this.getParentState().selectedMonPos;
        var numSelected = 0;

        if (this.areSelectedPokemonInCurrentBox()) //Not from some previous box
        {
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                let allPokemonIndex = startIndex + i;

                if (!this.isUnselectableMon(this.state.allPokemon[allPokemonIndex]) //Ignore blank slots
                && selectedMonPos[this.state.boxSlot][i])
                {
                    if (++numSelected >= 2)
                        return false;
                }
            }
        }

        return numSelected === 1; //As opposed to 0
    }

    /**
     * @returns {Number} The position in the current box of the only mon that's selected.
     */
    getOnlySelectedPos()
    {
        var startIndex = this.getBoxStartIndex();
        var selectedMonPos = this.getParentState().selectedMonPos;

        if (this.areSelectedPokemonInCurrentBox()) //Not from some previous box
        {
            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                let allPokemonIndex = startIndex + i;

                if (!this.isUnselectableMon(this.state.allPokemon[allPokemonIndex]) //Ignore blank slots
                && selectedMonPos[this.state.boxSlot][i])
                    return i;
            }
        }

        return -1; 
    }

    /**
     * @returns {Pokemon} The only selected Pokemon in the current box.
     */
    getPokemonAtOnlySelectedPos()
    {
        var pos = this.getOnlySelectedPos();

        if (pos < 0)
            return null;

        return this.getMonInCurrentBoxAt(pos);
    }

    /**
     * @returns {Boolean} Whether or not at least one Pokemon has been selected in the other displayed box.
     */
    otherBoxHasSelection()
    {
        return this.getParentState().selectedMonPos[this.getOtherBoxSlot()].some((x) => x);
    }

    /**
     * Gets whether or not the current box slot can be clicked to trigger a selection.
     * @param {Number} boxPos - The box slot clicked on.
     * @returns {Boolean} True if clicking on the box slot will trigger a selection, False otherwise.
     */
    canSelectMonAtPos(boxPos)
    {
        var currSelectionActive = this.areAnyPokemonSelectedInCurrentBox(true);
        var otherSelectionActive = this.otherBoxHasSelection(); //At least one mon selected in the other box
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = IsNullSpeciesName(speciesNameSelected);

        if (selectedNullSpecies && !currSelectionActive && !otherSelectionActive)
            return false; //Clicking on a blank spot does nothing if no other Pokemon has been selected yet

        //The blank spot can be chosen to deselect the currently selected mon or move the other selected mon to
        return true;
    }

    /**
     * Gets whether or not the current box slot can be clicked to trigger a specific deselection.
     * @param {Number} boxPos - The box slot clicked on.
     * @returns {Boolean} True if clicking on the box slot will deselect the selection at boxPos, False otherwise.
     */
    doesClickingSpotDeselectChoice(boxPos)
    {
        if (this.isMonAtPosSelected(boxPos) //Already selected
        && !this.isMonAtPosBeingDragged(boxPos, false)) //And isn't currently being dragged
            return true; //Clicking the same mon twice deselects it

        return false; //Keep selected
    }

    /**
     * Gets whether or not the current box slot can be clicked to trigger deselection of all mons in the box.
     * @param {Number} boxPos - The box slot clicked on.
     * @returns {Boolean} True if clicking on the box slot will deselect the entire selection in the box, False otherwise.
     */
    doesClickingSpotDeselectAllChoices(boxPos)
    {
        var otherSelectionActive = this.otherBoxHasSelection(); //At least one mon selected in the other box
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = IsNullSpeciesName(speciesNameSelected);

        if (selectedNullSpecies && !otherSelectionActive)
            return true; //Clicking a blank spot in the same box deselects the current choice. Otherwise it'll move the Pokemon

        if (this.isMonAtPosInWonderTrade(boxPos) && !otherSelectionActive)
            return true; //Treat like a blank spot

        return false; //Keep selected
    }

    /**
     * Gets whether or not multiple Pokemon are being moved at the same time.
     * @returns {Boolean} True if more than one Pokemon are selected in either box, False otherwise.
     */
    doingMultiSwap()
    {
        var currBoxSlot = this.state.boxSlot;

        if (this.getParentState().selectedMonPos[currBoxSlot].filter(x => x).length >= 2
        || this.getParentState().selectedMonPos[currBoxSlot ^ 1].filter(x => x).length >= 2) //At least two mons selected in one box
            return true;

        return false;
    }

    /**
     * Gets whether or not multiple Pokemon are being moved at the same time from the other box.
     * @returns {Boolean} True if more than one Pokemon are selected in the other box, False otherwise.
     */
    movingMultiplePokemonFromOtherBox()
    {
        //At least two mons selected in the other box
        return this.getParentState().selectedMonPos[this.getOtherBoxSlot()].filter(x => x).length >= 2;
    }


    /************************************
        Viewing Mon Summary Functions
    ************************************/

    /**
     * @returns {Boolean} True if a Pokemon's summary is currently being displayed, False otherwise.
     */
    isViewingMonSummary()
    {
        return this.getParentState().summaryMon[this.state.boxSlot] != null
            && IsValidPokemon(this.getParentState().summaryMon[this.state.boxSlot].pokemon)
            && Object.keys(this.getParentState().summaryMon[this.state.boxSlot].pokemon).length > 0; //Not viewing fake Showdown mon
    }

    /**
     * @returns {*} The summary object of the summary currently being viewed.
     */
     getRawSummaryMon()
     {
         if (!this.isViewingMonSummary())
             return null;
 
         return this.getParentState().summaryMon[this.state.boxSlot];
     }
 
    /**
     * @returns {Pokemon} The Pokemon of the summary currently being viewed.
     */
    getSummaryMon()
    {
        var summaryMonObj = this.getRawSummaryMon();

        if (summaryMonObj == null)
            return null;

        return summaryMonObj.pokemon;
    }

    /**
     * @returns {Number} The react key for the summary currently being viewed (helps with rerendering).
     */
    getSummaryMonKey()
    {
        var summaryMonObj = this.getRawSummaryMon();

        if (summaryMonObj == null)
            return -1;

        return GetBoxStartIndex(summaryMonObj.boxNum) + summaryMonObj.boxPos;
    }

    /**
     * @returns {Boolean} True if the "Release Pokemon" button can be viewed for the summary mon, False otherwise.
     */
    canViewReleaseButton()
    {
        var summaryMonObj = this.getRawSummaryMon();

        if (this.isTrading())
            return false;

        if (this.areAnyPokemonSelectedInCurrentBox(true))
            return true; //Release selected Pokemon

        if (summaryMonObj == null)
            return false; //Can't release a non existent summary mon

        if (this.isMonAtPosInWonderTrade(summaryMonObj.boxPos))
            return false; //Can't release a Pokemon on the net

        return true;
    }

    /**
     * @returns {Boolean} True if the "Showdown Stats" button can be viewed for the summary mon, False otherwise.
     */
    canViewShowdownButton()
    {
        if (this.isTrading())
            return false;

        if (this.state.viewingShowdown)
            return true; //Can always close the view

        if (this.areAnyPokemonSelectedInCurrentBox(false)) //Don't count Eggs
            return true; //Will view the selected mons

        if (this.isViewingMonSummary() && !IsEgg(this.getSummaryMon()))
            return true; //Will view the summary mon

        return false;
    }


    /*****************************
        Changing Box Functions
    ******************************/

    /**
     * Jumps to a specific box. If modified, also modify "jumpToBox" in BoxList.js.
     * @param {Number} boxId - The id number of the box to jump to.
     */
    setCurrentBox(boxId)
    {
        var currentBoxes = this.getParentState().currentBox;
        var selectedMonPos = this.getParentState().selectedMonPos;
        var summaryMon = this.getParentState().summaryMon;

        currentBoxes[this.state.boxSlot] = boxId;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        summaryMon[this.state.boxSlot] = null; //Wipe

        this.setState({editingTitle: false, viewingShowdown: false});

        this.state.parent.setState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            //Error message and impossible movement are cleared below in wipeErrorMessage
        });

        this.state.parent.wipeErrorMessage();
    }

    /**
     * Handles the change box event.
     * @param {Number} change - The addition or subtraction that should be made to the current box number.
     */
    handleChangeBox(change)
    {
        var boxNum = this.getCurrentBoxId();

        while (true)
        {
            boxNum += change;

            if (boxNum < 0) //Underflow
            {
                //Wrap around
                if (this.isSaveBox())
                    boxNum = this.getHighestSaveBoxNum() - 1;
                else
                    boxNum = HIGHEST_HOME_BOX_NUM - 1;
            }
            else if (this.isSaveBox() && boxNum >= this.getHighestSaveBoxNum())
                boxNum = 0; //Wrap around
            else if (this.isHomeBox() && boxNum >= HIGHEST_HOME_BOX_NUM)
                boxNum = 0; //Wrap around

            if (this.isSameBoxTypeBothSides() && this.getParentState().currentBox[this.getOtherBoxSlot()] === boxNum) //Same box on both sides
                continue; //Force another increase so both boxes don't display the same mons

            break;
        }

        this.setCurrentBox(boxNum);
    }


    /**********************************
        Selection Handler Functions
    **********************************/

    /**
     * Selects or deselects a Pokemon.
     * @param {Number} boxPos - The position in the current box to select.
     * @param {Pokemon} pokemon - The Pokemon at the selected position.
     */
    handleSelection(boxPos, pokemon)
    {
        if (this.isSaving())
            return; //Don't allow selections while saving

        if (this.isUnselectableMon(pokemon) && !IsBlankMon(pokemon))
        {
            PopUp.fire
            ({
                icon: "error",
                title: "This Pokémon can't be selected!",
                scrollbarPadding: false,
            });

            return; //Pretend like the user didn't click at all
        }

        var swapMons = false;
        var multiSwap = false;
        var deselectedSlot = false;
        var boxSlot = this.state.boxSlot;
        var newSelectedMonBoxes = this.getParentState().selectedMonBox;
        var newSelectedMonPos = this.getParentState().selectedMonPos;
        var newSummaryMon = this.getParentState().summaryMon;
        var speciesNameSelected = this.getSpeciesNameInCurrentBoxAt(boxPos);
        var selectedNullSpecies = IsNullSpeciesName(speciesNameSelected);

        //Check if can select the current spot
        if (this.canSelectMonAtPos(boxPos))
        {
            if (this.doesClickingSpotDeselectAllChoices(boxPos))
            {
                newSelectedMonPos[boxSlot] = CreateSingleBlankSelectedPos(); //Deselect all
                this.state.parent.wipeErrorMessage();
            }
            else if (this.doesClickingSpotDeselectChoice(boxPos))
            {
                newSelectedMonPos[boxSlot][boxPos] = false; //No longer selected
                deselectedSlot = true;
            }
            else if (this.isTrading()) //Only one Pokemon can be selected
            {
                newSelectedMonPos[boxSlot] = CreateSingleBlankSelectedPos(); //Deselect all
                newSelectedMonPos[boxSlot][boxPos] = true; //Then select the chosen mon
            }
            else
                newSelectedMonPos[boxSlot][boxPos] = true;

            newSelectedMonBoxes[boxSlot] = this.getCurrentBoxId();
        }

        //Update the selection variables
        if (this.otherBoxHasSelection()) //Both selections are now active
            swapMons = true;

        //Try remove viewing mons
        if (swapMons)
            newSummaryMon = [null, null]; //No more viewing mons after the swap completes
        else if (selectedNullSpecies || deselectedSlot)
            newSummaryMon[boxSlot] = null; //Deselected
        else
            newSummaryMon[boxSlot] = {pokemon: pokemon, boxNum: this.getCurrentBoxId(), boxPos};        

        //Check for multi swap
        if (swapMons && this.doingMultiSwap())
            multiSwap = true;

        this.state.parent.setState({
            summaryMon: newSummaryMon,
            selectedMonBox: newSelectedMonBoxes,
            selectedMonPos: newSelectedMonPos,
        }, () =>
        {
            if (swapMons)
                this.state.parent.swapDifferentBoxSlotPokemon(multiSwap);
        });

        this.setState({viewingShowdown: false});
    }

    /**
     * Starts dragging a Pokemon.
     * @param {Number} allBoxesPos - The position in all of the boxes of the mon that's being dragged.
     * @param {Number} boxPos - The position in the current box of the mon that's being dragged.
     * @param {img} icon - The <img> tag of the mon that's being dragged.
     * @param {String} imgUrl - The link for the <img> tag of the mon that's being dragged.
     * @param {Pokemon} pokemon - The mon that's being dragged.
     */
    handleStartDragging(allBoxesPos, boxPos, icon, imgUrl, pokemon)
    {
        if (isMobile || this.isSaving() || this.isTrading())
            return; //No dragging on a touch screen, while prepping a save, or selecting a Pokemon to trade

        if (icon === "")
            return; //No dragging empty cell

        if (this.isUnselectableMon(pokemon))
            return;

        var summaryMon = this.getParentState().summaryMon;
        summaryMon[this.state.boxSlot] = {pokemon: pokemon, boxNum: this.getCurrentBoxId(), boxPos: boxPos}; //Show dragee's summary

        this.state.parent.setState({
            draggingMon: allBoxesPos,
            draggingImg: imgUrl,
            draggingFromBox: this.state.boxSlot,
            draggingLeftCell: false,
            summaryMon: summaryMon,
        });

        this.setState({viewingShowdown: false});
    }

    /**
     * Handles the drag over cell event.
     * @param {Number} allBoxesPos - The index in all of the boxes that the mon is currently being dragged over.
     */
    handleSetDraggingOver(allBoxesPos)
    {
        if (!isMobile) //No dragging on mobile devices
        {
            this.state.parent.setState({
                draggingOver: allBoxesPos,
                draggingToBox: this.state.boxSlot,
                draggingLeftCell: this.getParentState().draggingLeftCell
                               || this.getParentState().draggingOver !== allBoxesPos, //Changed cells
            });
        }
    }

    /**
     * Shows a specific mon's summary.
     * @param {Object} e - The context menu event.
     * @param {Number} boxPos - The position in the current box that's been selected.
     * @param {Pokemon} pokemon - The Pokemon to view the summary of.
     */
    handleSelectMonForViewing(e, boxPos, pokemon)
    {
        e.preventDefault(); //Prevent context menu from popping up

        if (this.isSaving())
            return; //Don't allow selections while saving

        var speciesName = GetIconSpeciesName(pokemon);
        if (!IsNullSpeciesName(speciesName)) //Don't change when clicking on a blank spot or a spot with an unknown mon
        {
            var newSummaryMon = this.getParentState().summaryMon;
            newSummaryMon[this.state.boxSlot] = {pokemon: pokemon, boxNum: this.getCurrentBoxId(), boxPos: boxPos};
            this.state.parent.setState({summaryMon: newSummaryMon});
            this.setState({viewingShowdown: false});
        }
    }

    /**
     * Selects or deselects all of the Pokemon in the current box.
     */
    handleSelectAll()
    {
        var startIndex = this.getBoxStartIndex();
        var selectedMonPos = this.getParentState().selectedMonPos;
        var selectedMonBox = this.getParentState().selectedMonBox;

        if (this.areAnyPokemonSelectedInCurrentBox(true))
            selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Deselect all
        else //At least one mon not selected
        {
            //Select all mons in box
            selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos();

            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                let allPokemonIndex = startIndex + i;

                if (!this.isUnselectableMon(this.state.allPokemon[allPokemonIndex]) //Don't select blank slots
                && !this.isMonAtPosInWonderTrade(i)
                && this.matchesSearchCriteria(this.state.allPokemon[allPokemonIndex]))
                    selectedMonPos[this.state.boxSlot][i] = true;
            }
        }

        selectedMonBox[this.state.boxSlot] = this.getCurrentBoxId();
        this.setState({selectedMonPos: selectedMonPos, selectedMonBox: selectedMonBox});
        this.state.parent.wipeErrorMessage();
    }


    /*******************************
        Other Features Functions
    *******************************/

    /**
     * Starts viewing the list of all boxes.
     */
    viewBoxList()
    {
        this.state.parent.setState({viewingBoxList: this.state.boxSlot});
    }

    /**
     * Starts a search based on the input criteria.
     */
    startSearching()
    {
        if (this.shouldFilterSearchResults()) //Already searching
        {
            //Stop searching
            var searchCriteria = this.getParentState().searchCriteria;
            searchCriteria[this.state.boxSlot] = null; //Wipe and end search
            this.state.parent.setState({searchCriteria: searchCriteria});
        }
        else //Not searching yet
        {
            //Start searching
            var selectedMonPos = this.getParentState().selectedMonPos;
            var summaryMon = this.getParentState().summaryMon;
            selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
            summaryMon[this.state.boxSlot] = null; //Wipe
    
            this.state.parent.setState({
                summaryMon: summaryMon,
                selectedMonPos: selectedMonPos,
            });

            this.state.parent.wipeErrorMessage();
            this.setState({searching: true, viewingShowdown: false});
        }
    }

    /**
     * Starts editing the title of a Home box.
     */
    startEditingTitle()
    {
        this.setState({
            editingTitle: true,
            titleInput: this.state.titles[this.getCurrentBoxId()],
        });
    }

    /**
     * Cancels editing the title of a Home box.
     */
    cancelEditingTitle()
    {
        this.setState({editingTitle: false})
    }

    /**
     * Updates the title of a Home box as it's typed in.
     * @param {String} input - The user's new title input
     */
    updateTitleNameInput(input)
    {
        if (input.length <= MAX_TITLE_LENGTH) //Must be within max characters in the title
            this.setState({titleInput: input});
    }

    /**
     * Finalizes the rename of the title of a Home box.
     */
    renameTitle()
    {
        var titles = this.state.titles;
        var changeWasMade = this.getParentState().changeWasMade;

        if (this.state.titleInput !== titles[this.getCurrentBoxId()]) //Title changed
        {
            titles[this.getCurrentBoxId()] = this.state.titleInput;
            changeWasMade[this.state.boxType] = true;
        }

        this.setState({
            editingTitle: false,
            titles: titles,
        })

        this.state.parent.setState({
            changeWasMade: changeWasMade,
        })
    }

    /**
     * Starts or ends viewing of the correct Living Dex order.
     */
    changeLivingDexView()
    {
        var livingDexState = this.getLivingDexState();
        var selectedMonPos = this.getParentState().selectedMonPos;
        var summaryMon = this.getParentState().summaryMon;

        //Adjust Current state
        if (livingDexState < LIVING_DEX_ALL)
            ++livingDexState;
        else
            livingDexState = LIVING_DEX_NONE; //Wrap around

        this.setState({viewingShowdown: false});

        //Adjust Parent State
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        summaryMon[this.state.boxSlot] = null; //Wipe
        this.state.parent.setState({selectedMonPos: selectedMonPos, summaryMon: summaryMon});
        this.state.parent.wipeErrorMessage();
        this.setLivingDexState(livingDexState);
    }

    /**
     * Reorganizes the Pokemon in the Home boxes to satisfy the selected Living Dex order.
     */
    async fixLivingDex()
    {
        var speciesList = (this.getLivingDexState() === LIVING_DEX_ALL) ? gLivingDexOrder["allSpecies"] : gLivingDexOrder["noAltForms"];
        var compareDexNums = (this.getLivingDexState() === LIVING_DEX_ALL) ? false : true;
        var boxCount = Math.ceil(speciesList.length / MONS_PER_BOX);

        PopUp.fire
        ({
            title: `This will rearrange the Pokemon in your first ${boxCount} boxes and may move Pokemon out of others! Are you sure you want to do this?`,
            confirmButtonText: `Do It`,
            cancelButtonText: `Cancel`,
            showCancelButton: true,
            icon: 'warning',
            scrollbarPadding: false,
        }).then(async (result) =>
        {
            if (result.isConfirmed)
            {
                this.setState({fixingLivingDex: true});

                await this.state.parent.fixLivingDex(speciesList, compareDexNums).then(newBoxes =>
                {
                    var changeWasMade = this.getParentState().changeWasMade;
                    changeWasMade[this.state.boxType] = true;

                    this.setState({
                        allPokemon: newBoxes,
                        fixingLivingDex: false,
                    });

                    this.state.parent.setState({
                        changeWasMade: changeWasMade,
                    });
                });
            }
        });
    }

    /**
     * Releases the chosen Pokemon.
     */
    releaseSelectedPokemon()
    {
        var title, pokemonName;
        var areAnyPokemonSelected = this.areAnyPokemonSelectedInCurrentBox(true);
        var onlyOnePokemonSelected = this.isOnlyOnePokemonSelectedInCurrentBox();
        var summaryMon = this.getSummaryMon();
        var noSelectedMonOnlySummaryMon = !areAnyPokemonSelected && this.isViewingMonSummary();
        var summaryOfNonSelectedMonShown = onlyOnePokemonSelected && this.isViewingMonSummary();  //Handles the case where one Pokemon is selected but another's summary is being viewed

        if (noSelectedMonOnlySummaryMon //No Pokemon are selected, but a summary is being shown
        || summaryOfNonSelectedMonShown //One Pokemon is selected, but a summary is being shown for a different Pokemon
        || onlyOnePokemonSelected) //Release the only selected mon for consistency
        {
            pokemonName = (onlyOnePokemonSelected && !summaryOfNonSelectedMonShown) ? //Summary mon would take priority
                            GetNickname(this.getPokemonAtOnlySelectedPos()) : GetNickname(summaryMon);
            title = `Release ${pokemonName}?`;
        }
        else
        {
            pokemonName = "Pokémon";
            title = "Release selected Pokémon?";
        }

        PopUp.fire
        ({
            title: title,
            showConfirmButton: false,
            showCancelButton: true,
            showDenyButton: true,
            cancelButtonText: `Keep`,
            denyButtonText: `Release`,
            icon: 'warning',
            scrollbarPadding: false,
        }).then((result) =>
        {
            if (result.isDenied) //Denied means released because it's the red button
            {
                if (noSelectedMonOnlySummaryMon || summaryOfNonSelectedMonShown)
                    this.state.parent.releaseSelectedPokemon(this.state.boxSlot, this.state.boxType, true); //Release the summary mon
                else
                    this.state.parent.releaseSelectedPokemon(this.state.boxSlot, this.state.boxType, false);

                PopUp.fire
                ({
                    title: `Bye-bye, ${pokemonName}!`,
                    confirmButtonText: `Done`,
                    icon: 'success',
                    scrollbarPadding: false,
                });

                this.setState({viewingShowdown: false});
            }
        });
    }

    /**
     * Alternates between viewing the Showdown stats and the regular stats for the summary mon.
     */
    viewShowdownExport()
    {
        var shouldView = true;
        var summaryMon = this.getParentState().summaryMon;

        if (this.state.viewingShowdown) //End viewing
        {
            shouldView = false;

            if (summaryMon[this.state.boxSlot] == null 
            || Object.keys(summaryMon[this.state.boxSlot].pokemon).length === 0) //Wasn't viewing any mon before
                summaryMon[this.state.boxSlot] = null;  //Don't show the summary after the showdown box closes
        }
        else //Start viewing
        {
            if (summaryMon[this.state.boxSlot] == null)
                summaryMon[this.state.boxSlot] = {pokemon: {}, boxNum: 0, boxPos: 0}; //Not actually viewing but allow the showdown data to appear
        }

        this.setState({viewingShowdown: shouldView});
        this.state.parent.setState({summaryMon: summaryMon});
    }

    /**
     * Prompts the user to confirm they want to trade the Pokemon they've selected
     */
    trySelectMonForTrade()
    {
        var pokemon = this.getPokemonAtOnlySelectedPos();

        PopUp.fire
        ({
            title: `Trade ${GetNickname(pokemon)}?`,
            confirmButtonText: `Let's trade!`,
            cancelButtonText: `Cancel`,
            showCancelButton: true,
            imageUrl: GetIconSpeciesLink(pokemon),
            imageAlt: "",
            scrollbarPadding: false,
        }).then((result) =>
        {
            if (result.isConfirmed)
                this.selectMonForTrade(pokemon);
        });
    }

    /**
     * Chooses the selected mon for a trade.
     */
    selectMonForTrade(pokemon)
    {
        if (IsHoldingBannedItem(pokemon))
        {
            PopUp.fire(
            {
                icon: 'error',
                title: "That Pokemon is holding an item that can't be traded!",
                cancelButtonText: `Awww`,
                showConfirmButton: false,
                showCancelButton: true,
                scrollbarPadding: false,
            });
        }
        else
        {
            var tradeData = this.getParentState().tradeData;
    
            if (tradeData == null)
                tradeData = {};
    
            tradeData.pokemon = pokemon;
            tradeData.boxNum = this.getCurrentBoxId();
            tradeData.boxPos = this.getOnlySelectedPos();
    
            this.state.parent.setState({tradeData: tradeData});
            this.state.tradeParent.offerPokemonToTrade(pokemon);
        }
    }

    /**
     * Gets the icon used to display a species in the Living Dex view.
     * @param {Number} i - The position in the entire state of boxes.
     * @param {String} speciesInSlot - The species of the mon already in the slot.
     * @returns {img} An img element for the icon.
     */
    getLivingDexSpeciesIcon(i, speciesInSlot)
    {
        var species;

        if (this.getLivingDexState() === LIVING_DEX_ALL)
        {
            let speciesList = gLivingDexOrder["allSpecies"];

            if (i >= speciesList.length)
                return ""; //All done

            species = speciesList[i];
            if (species === speciesInSlot) //Correct species is already in slot
                return ""; //Display full colour image instead
        }
        else
        {
            let speciesList = gLivingDexOrder["noAltForms"];

            if (i >= speciesList.length)
                return ""; //All done

            species = speciesList[i];
            let dexNum = gSpeciesToDexNum[species];

            if (speciesInSlot in gSpeciesToDexNum
            && dexNum === gSpeciesToDexNum[speciesInSlot]) //Correct species is already in slot
                return ""; //Display full colour image instead
        }

        let link = GetIconSpeciesLinkBySpecies(species, false, false);
        let alt = GetSpeciesName(species);
        let icon = <img src={link} alt={alt} aria-label={alt} className="box-icon-image living-dex-icon"
                        onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging

        return icon;
    }

    /**
     * Gets all of the icons to display in the current box.
     * @returns {Array <span>} A list of <span>s (images) to display.
     */
    getPokemonIconsToShow()
    {
        var icons = [];
        var startIndex = this.getBoxStartIndex();
        var addLivingDexIcon = (this.isHomeBox() && this.getLivingDexState() !== LIVING_DEX_NONE);

        //Add regular icons
        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            var isInWonderTrade = false;
            let pokemon = this.state.allPokemon[i];
            let species = GetIconSpeciesName(pokemon);
            let link = GetIconSpeciesLink(pokemon);
            let livingDexIcon = "";
            let heldItemIcon = "";
            let shinyIcon = "";
            let warningIcon = "";

            if (species === "none")
                icon = "";
            else
            {
                var matchesSearchCriteria = true;
                var className = "box-icon-image";
                var alt = GetNickname(pokemon);
                var hiddenImages = this.isMonAtPosBeingDragged(i - startIndex, true); //Hide a mon that's being dragged (attached to mouse instead)

                if (!this.matchesSearchCriteria(pokemon))
                {
                    matchesSearchCriteria = false;
                    className += " box-icon-faded"; //Fade out non-matches
                }

                if (this.isMonAtPosInWonderTrade(key))
                {
                    isInWonderTrade = true;
                    className += " box-icon-greyscale"; //Grey out mon that's not really there
                }

                icon = <img src={link} alt={alt} aria-label={alt} className={className}
                            hidden={hiddenImages}
                            onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging

                if (IsHoldingItem(pokemon))
                {
                    heldItemIcon = <img src={BASE_GFX_LINK + "held_item.png"} alt="I" aria-label="Holds Item"
                                        className={"box-icon-item-icon" + (!matchesSearchCriteria ? " box-icon-faded" : "")}
                                        hidden={hiddenImages}
                                        onMouseDown={(e) => e.preventDefault()}/>; //Prevent image dragging
                }

                if (IsShiny(pokemon))
                {
                    shinyIcon = <span className={"box-icon-shiny-icon" + (!matchesSearchCriteria ? " box-icon-faded" : "")}
                                      hidden={hiddenImages}
                                      aria-label="Shiny">★</span> //Show shiny star
                }

                //Warning icon when a Pokemon will lose data once the save file is updated
                if (this.isSaveBox() && MonWillLoseDataInSave(pokemon, this.getParentState().saveGameId))
                {
                    warningIcon =
                        <OverlayTrigger placement="top" overlay={loseDataTooltip}>
                            <AiFillWarning className={"box-icon-warning-icon" + (!matchesSearchCriteria ? " box-icon-faded" : "")}
                                                    fill={this.shouldShowIconImpossibleMoveWarning(key) ? "black" : "red"} size={14}
                                                    hidden={hiddenImages}
                                                    aria-label="Will Lose Data"/>
                        </OverlayTrigger>;
                }
            }

            if (addLivingDexIcon)
            {
                livingDexIcon = this.getLivingDexSpeciesIcon(i, GetSpecies(pokemon));
                if (livingDexIcon !== "")
                    icon = livingDexIcon;
            }

            let spanClassName = "box-icon"
                              + (!isMobile && !this.state.parent.shouldViewDraggingImg() ? " box-icon-hoverable" : "") //Just changes cursor
                              + (!isMobile && this.shouldDisplayHoverOverPos(key) ? " selected-box-icon" : "")
                              + (this.isMonAtPosSelected(key) ? " selected-box-icon" : "")
                              + (isInWonderTrade ? " wonder-trade-box-icon" : "")
                              + (this.shouldShowIconImpossibleMoveWarning(key) ? " error-box-icon" : "");

            if ((addLivingDexIcon && livingDexIcon !== "") //Can't click on this
            || species === "unknown") //Unknown species - can still click on "none" species, just not unknown one
            {
                icons.push(<span className={spanClassName}
                    onMouseEnter = {this.handleSetDraggingOver.bind(this, i)}
                    onMouseLeave = {this.handleSetDraggingOver.bind(this, -1)}
                    key={key}>{icon}</span>);
            }
            else if (isInWonderTrade) //Can't click on this
            {
                icons.push(<span className={spanClassName}
                                onClick={this.handleSelection.bind(this, key, pokemon)}
                                onMouseEnter = {this.handleSetDraggingOver.bind(this, i)}
                                onMouseLeave = {this.handleSetDraggingOver.bind(this, -1)}
                                onContextMenu={(e) => this.handleSelectMonForViewing(e, key, pokemon)}
                                key={key}>{shinyIcon} {icon} {heldItemIcon} {warningIcon}
                            </span>);
            }
            else
            {
                icons.push(<span className={spanClassName}
                                onClick={this.handleSelection.bind(this, key, pokemon)}
                                onMouseDown={this.handleStartDragging.bind(this, i, key, icon, link, pokemon)}
                                onMouseEnter = {this.handleSetDraggingOver.bind(this, i)}
                                onMouseLeave = {this.handleSetDraggingOver.bind(this, -1)}
                                onContextMenu={(e) => this.handleSelectMonForViewing(e, key, pokemon)}
                                key={key}>{shinyIcon} {icon} {heldItemIcon} {warningIcon}
                            </span>);
            }
        }

        return icons;
    }

    /**
     * Prints the summary of the selected summary mon.
     */
    printMonToView()
    {
        var pokemon = this.getSummaryMon();

        if (pokemon != null || this.state.viewingShowdown)
        {
            if (this.state.viewingShowdown)
            {
                var pokemonList = [];

                if (!this.areAnyPokemonSelectedInCurrentBox(false))
                {
                    //Just view the mon who's summary is currently being displayed
                    pokemonList.push(this.getSummaryMon());
                }
                else if (this.isOnlyOnePokemonSelectedInCurrentBox() //Handles the case of selecting one Pokemon, but viewing another with right-click
                && this.isViewingMonSummary())
                {
                    pokemonList.push(this.getSummaryMon()); //Override the selected mon with the summary mon
                }
                else
                {
                    for (let i = 0; i < MONS_PER_BOX; ++i)
                    {
                        if (this.getParentState().selectedMonPos[this.state.boxSlot][i]) //Selected
                        {
                            pokemon = this.getMonInCurrentBoxAt(i);
                            if (!IsEgg(pokemon))
                                pokemonList.push(pokemon);
                        }
                    }
                }

                return(<ShowdownExport pokemonList={pokemonList} gameId={this.getParentState().saveGameId} key={this.getSummaryMonKey()}/>);
            }
            else
                return(<PokemonSummary pokemon={pokemon} areBoxViewsVertical={this.state.parent.areBoxViewsVertical()}
                                       boxType={this.state.boxType} changeWasMade={this.getParentState().changeWasMade}
                                       gameId={this.getParentState().saveGameId} viewingEVsIVs={this.getParentState().viewingSummaryEVsIVs}
                                       isSaveBox={this.isSaveBox()}
                                       setGlobalState={this.state.parent.setState.bind(this.state.parent)}
                                       key={this.getSummaryMonKey()} inTrade={this.isTrading()}/>);
        }
        else
            return "";
    }

    /**
     * Prints the search view for selecting search criteria.
     */
    printSearchView()
    {
        return <Search boxType={this.state.boxType} boxSlot={this.state.boxSlot} parent={this} mainPage={this.state.parent}/>;
    }

    /**
     * Prints the Wonder Trade icon for a mon.
     * @param {String} boxName - The name of the current box.
     */
    printWonderTradeIcon(boxName)
    {
        if (this.isViewingMonSummary() && !this.isTrading() && !this.isSaveBox()) //Can only Wonder Trade in a Home Box
        {
            var summaryMonObj = this.getRawSummaryMon()
            var isMonInWonderTrade = this.isMonAtPosInWonderTrade(summaryMonObj.boxPos);
            var key = GetBoxStartIndex(summaryMonObj.boxNum) + summaryMonObj.boxPos + (isMonInWonderTrade ? 10000 : 0); //Forces often rerender

            return (
                <WonderTrade pokemon={summaryMonObj.pokemon} boxName={boxName}
                             boxNum={summaryMonObj.boxNum} boxPos={summaryMonObj.boxPos}
                             boxType={this.state.boxType} boxSlot={this.state.boxSlot}
                             isMonInWonderTrade={isMonInWonderTrade} globalState={this.state.parent}
                             setGlobalState={this.state.parent.setState.bind(this.state.parent)}
                             finishWonderTrade={this.state.parent.finishWonderTrade.bind(this.state.parent)}
                             key={key}/>
            );
        }
    }

    /**
     * Prints the icon that appears when the user can choose a Pokemon to send in a link trade.
     */
    chooseForTradeIcon()
    {
        if (this.isTrading() && this.areAnyPokemonSelectedInCurrentBox(true))
        {
            var iconSize = 30;

            return(
                <OverlayTrigger placement="bottom" overlay={tradeTooltip}>
                    {
                        <CgExport size={iconSize} className="box-lower-icon" style={{color: "red"}}
                                onClick = {this.trySelectMonForTrade.bind(this)}/>
                    }
                </OverlayTrigger>
            )
        }
    }

    /**
     * Prints the box view page.
     */
    render()
    {
        var boxName, title, titleEditIcon, titleContainerClass;
        var icons = this.getPokemonIconsToShow();
        var monToView = this.printMonToView();
        var editIconSize = 28;
        var livingDexIcon = "";

        if (this.state.searching)
            return this.printSearchView();

        //Set Up Living Dex Icon
        if (this.isHomeBox() && !this.state.editingTitle && !this.isTrading())
            livingDexIcon =
                <OverlayTrigger placement="top" overlay={livingDexTooltip}>
                    <CgPokemon size={editIconSize + 10} onClick={this.changeLivingDexView.bind(this)}
                               className="box-name-living-dex-icon" style={{color: this.getLivingDexState() === LIVING_DEX_NO_FORMS ? "violet"
                                                                                 : this.getLivingDexState() === LIVING_DEX_ALL ? "lightseagreen"
                                                                                 : "black"}} />
                </OverlayTrigger>;

        //Set Up Box Names
        if (this.state.titles != null) //Prevent errors from happening
        {
            boxName = this.state.titles[this.getCurrentBoxId()];

            if (this.state.editingTitle)
            {
                title =
                    <div>
                        {/*Cancel Button*/}
                        <OverlayTrigger placement="top" overlay={cancelTooltip}>
                            <AiOutlineCloseCircle size={editIconSize  + 14}
                                  onClick={this.cancelEditingTitle.bind(this)} className="box-name-cancel-icon" />
                        </OverlayTrigger>

                        {/*Text Input Field*/}
                        <input type="text" className="box-name-text box-name-input"
                                            onChange={(event) => this.updateTitleNameInput(event.target.value)}
                                            onKeyDown={(event) => event.keyCode === 13 ? this.renameTitle() : {}}
                                            value={this.state.titleInput}/>

                        {/*Save Button*/}
                        <OverlayTrigger placement="top" overlay={saveTooltip}>
                            <AiOutlineCheckCircle size={editIconSize + 14}
                                        onClick={this.renameTitle.bind(this)} className="box-name-save-icon" />
                        </OverlayTrigger>
                    </div>

                titleEditIcon = ""; //Hidden while editing
                titleContainerClass = "box-title-edit";
            }
            else
            {
                title =
                    <OverlayTrigger placement="top" overlay={boxListTooltip}>
                        <h2 className={"box-name-text"} onClick={this.viewBoxList.bind(this)}>{boxName}</h2>
                    </OverlayTrigger>
                titleContainerClass = "box-title-no-edit";

                titleEditIcon = this.state.editingTitle || this.isTrading() ? ""
                              : this.isHomeBox() ?
                                  <OverlayTrigger placement="top" overlay={renameTooltip}>
                                      <GrEdit size={editIconSize}
                                              onClick={this.startEditingTitle.bind(this)} className="box-name-edit-icon" />
                                  </OverlayTrigger>
                              : "";
            }
        }
        else
        {
            //Should never be reached
            boxName = "Box " + (this.getCurrentBoxId() + 1);
            title =
                <OverlayTrigger placement="top" overlay={boxListTooltip}>
                    <h2 className="box-name-text" onClick={this.viewBoxList.bind(this)}>{boxName}</h2>
                </OverlayTrigger>
            titleEditIcon = "";
            titleContainerClass = "box-title-no-edit";
        }

        //Set up icons under the box
        var lowerIcons = 
            <div className="box-lower-icons">
                {/*Search Icon*/}
                <OverlayTrigger placement="bottom" overlay={searchTooltip}>
                    <BiSearchAlt2 size={34} className={"box-lower-icon" + (this.shouldFilterSearchResults() ? " green-icon" : "")}
                            onClick={this.startSearching.bind(this)}/>
                </OverlayTrigger>

                { /*Select/Deselect All Icon*/
                    !this.isTrading() ?
                        <OverlayTrigger placement="bottom" overlay={this.areAnyPokemonSelectedInCurrentBox(true) ? deselectAllTooltip : selectAllTooltip}>
                            <GrMultiple size={28} className="box-lower-icon" onClick={this.handleSelectAll.bind(this)}/>
                        </OverlayTrigger>
                    :
                        ""
                }

                { /*Save Icon*/
                    this.getParentState().changeWasMade[this.state.boxType] && !this.isTrading() ?
                        <OverlayTrigger placement="bottom" overlay={saveTooltip}>
                            <AiOutlineSave size={36} className="box-lower-icon" onClick={() => this.state.parent.trySaveAndExit(true)}/>
                        </OverlayTrigger>
                    :
                        ""
                }

                { /*Fix Living Dex Icon*/
                    this.getLivingDexState() !== LIVING_DEX_NONE && !this.state.fixingLivingDex && this.isHomeBox() && !this.isTrading() ?
                        <OverlayTrigger placement="bottom" overlay={fixLivingDexTooltip}>
                            <AiOutlineTool size={36} className="box-lower-icon" onClick={this.fixLivingDex.bind(this)}/>
                        </OverlayTrigger>
                    :
                        ""
                }

                { /*Release & Showdown Icons*/
                    <>
                        {
                            this.canViewReleaseButton() ?
                                <OverlayTrigger placement="bottom" overlay={releaseTooltip}>
                                    <GrTrash size={28} className="box-lower-icon" onClick={this.releaseSelectedPokemon.bind(this)}/>
                                </OverlayTrigger>
                            :
                                ""
                        }
                        {
                            this.canViewShowdownButton() ?
                                <OverlayTrigger placement="bottom" overlay={showdownTooltip}>
                                    <RiBoxingLine size={32} className="box-lower-icon"
                                            onClick = {this.viewShowdownExport.bind(this)}/>
                                </OverlayTrigger>
                            :
                                ""
                        }
                    </>
                }
    
                { /*Wonder Trade Icon*/
                    this.printWonderTradeIcon(boxName)
                }

                { /*Choose for Trade Icon*/
                    this.chooseForTradeIcon()
                }
            </div>

        //Try replacing lower icons with message text
        if (this.state.fixingLivingDex)
            lowerIcons = <p className="lower-icon-message box-lower-icons">Please Wait...</p>
        else if (this.isSaving())
            lowerIcons = <p/>; //Show no options

        //Actual box view setup
        return (
            <div className="box-view">
                {/*Above Box*/}
                <div className={titleContainerClass}>
                    <AiOutlineArrowLeft size={42} aria-label="Previous Box" onClick={this.handleChangeBox.bind(this, -1)} className="box-change-arrow" />
                    <span className="box-name">
                        {livingDexIcon}
                        {title}
                        {titleEditIcon}
                    </span>
                    <AiOutlineArrowRight size={42} aria-label="Next Box" onClick={this.handleChangeBox.bind(this, 1)} className="box-change-arrow" />
                </div>

                {/*Box Itself*/}
                <div className={"box " + (this.isHomeBox() ? "home-box" : "save-box")}>
                    {icons}
                </div>

                {/*Below Box*/}
                {lowerIcons}

                {
                    this.getParentState().errorMessage[this.state.boxSlot] !== ""
                    ?
                        <p className="error-message">{this.getParentState().errorMessage[this.state.boxSlot]}</p>
                    :
                        monToView //Summary
                }
            </div>
        )
    }
}
