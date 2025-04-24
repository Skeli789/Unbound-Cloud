/**
 * A page displaying a list of boxes.
 */

import React, {Component} from 'react';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import {isMobile} from "react-device-detect";
import {closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor,
        useSensor, useSensors} from '@dnd-kit/core';
import {rectSortingStrategy, SortableContext, sortableKeyboardCoordinates,
        useSortable} from '@dnd-kit/sortable';
import {snapCenterToCursor} from '@dnd-kit/modifiers';
import {TextField} from '@mui/material';

import {MAX_TITLE_LENGTH, MONS_PER_BOX} from "./BoxView";
import {PlayErrorSound, SendErrorToastNotification} from "./Notifications";
import {GetIconSpeciesName} from "./PokemonUtil";
import {MatchesSearchCriteria} from "./Search";
import {CreateSingleBlankSelectedPos, GetBoxStartIndex, IsHomeBox} from "./Util";

import {MdGridView} from "react-icons/md";

import "./stylesheets/BoxList.css";
import "./stylesheets/PokeBallIcon.css";

const MAX_DRAGGING_BOXES_AT_ONCE = 9; //Max number of boxes that can be dragged at once


export class BoxList extends Component
{
    /**
     * Sets up the box listing page.
     * @constructor
     * @param {Object} props - The properties passed to the component.
     * @param {number} props.boxType - The type of box (BOX_HOME or BOX_SAVE).
     * @param {number} props.boxSlot - The box slot (left or right).
     * @param {Array} props.boxes - The list of boxes.
     * @param {Array} props.titles - The titles of the boxes.
     * @param {number} props.boxCount - The number of boxes.
     * @param {Array} props.currentBoxes - The currently selected boxes.
     * @param {Array} props.selectedMonPos - The currently selected Pokemon positions.
     * @param {Array} props.summaryMon - The currently selected Pokemon summary.
     * @param {Array} props.changeWasMade - Whether the box types have unsaved changes.
     * @param {Object} props.searchCriteria - The search criteria for filtering Pokemon in boxes.
     * @param {boolean} props.isSameBoxBothSides - True if the same box is displayed on both sides.
     * @param {string} props.gameId - The ID of the game.
     * @param {Function} props.navBackButtonPressed - The function to call when the back button is pressed.
     * @param {Function} props.updateParentState - The function to update the parent state.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
            loaded: false,
            boxNameFilter: "",
            boxes: props.boxes,
            titles: props.titles,
            currentBoxes: props.currentBoxes,

            //Dragging state
            draggingMode: false, //Whether the user is dragging boxes or selecting one to jump to
            multiSelectedSpots: [], //The spots of the boxes selected for multi dragging
            draggingSpot: -1, //The spot the box was being dragged from
            draggingBoxId: -1, //The id of the box being dragged corresponding to the id it had when the page loaded
            spotToBoxId: Array.from({length: props.boxCount}, (_, i) => i), //At the beginning, all box ids are the same as the spots they're in
        };

        this.setParentState = props.updateParentState;
        this.navBackButtonPressed = props.navBackButtonPressed;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.filterTimeout = null; //Allows time for the user to finish typing before rerendering the boxes
    }

    /**
     * Starts changing the screen from "Loading..." when the loading screen is displayed.
     * Also overrides the back button to return to the main page.
     * Also ensures the filter starts immediately when the user starts typing.
     */
    async componentDidMount()
    {
        await new Promise(r => setTimeout(r, 50)); //Allows the loading screen to render
        this.setState({loaded: true}, () =>
        {
            //Scroll to the current box
            let currentBox = this.state.currentBoxes[this.props.boxSlot];
            let boxElement = document.getElementById(`box-${this.spotToBoxId(currentBox)}-with-title`);
            if (boxElement)
                boxElement.scrollIntoView({block: "end", inline: "end"}); //Scroll to bottom of the box element
        });

        //Override back button
        window.history.pushState(null, document.title, window.location.href);
        window.addEventListener("popstate", this.navBackButtonPressed);

        //Any typing focuses on the filter input field
        window.addEventListener("keydown", this.handleKeyDown);
    }

    /**
     * Removes the event listeners when the user leaves the pages.
     */
    componentWillUnmount()
    {
        window.removeEventListener("popstate", this.navBackButtonPressed);
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Gets the box id currently at a specific spot.
     * @param {Number} spot - The spot of the box to get the id of.
     * @returns {Number} The id of the box at the specified spot.
     */
    spotToBoxId(spot)
    {
        return this.state.spotToBoxId[spot]; //Get the id the box had when the page loaded
    }

    /**
     * Gets the spot of a box given its id.
     * @param {Number} boxId - The id of the box to get the spot of.
     * @returns {Number} The spot the box with the specified id is currently at.
     */
    findSpotOfBoxId(boxId)
    {
        return this.state.spotToBoxId.findIndex(id => id === boxId); //Get the spot on the page the box is at
    }

    /**
     * Checks if a box at a spot is selected for multi dragging.
     * @param {Number} spot - The spot of the box to check.
     * @returns {Boolean} Whether the box at the spot is selected for multi dragging.
     */
    isSelectedForMultiDragging(spot)
    {
        return this.state.multiSelectedSpots.includes(spot);
    }

    /**
     * Check if the box at the spot is disabled (if it is the same box as the other side)
     * @param {Number} spot - The spot of the box to check.
     * @returns {Boolean} Whether the box at the spot is disabled.
     */
    isBoxAtSpotDisabled(spot)
    {
        return this.props.isSameBoxBothSides
            && this.state.currentBoxes[this.props.boxSlot ^ 1] === spot; //Other box has this
    }

    /**
     * Checks if the box at a spot's name matches the filter exactly.
     * @param {Number} spot - The spot of the box to check.
     * @returns {Boolean} Whether the box name matches the filter exactly.
     */
    matchesFilterExactly(spot)
    {
        if (this.state.boxNameFilter === "")
            return true; //No filter applied

        let title = this.state.titles[spot];
        return title.trim().toLowerCase() === this.state.boxNameFilter.trim().toLowerCase();
    }

    /**
     * Checks if the box at a spot's name includes the filter at all.
     * @param {Number} spot - The spot of the box to check.
     * @returns {Boolean} Whether the box name falls within the filter.
     */
    matchesFilterGenerally(spot)
    {
        if (this.state.boxNameFilter === "")
            return true; //No filter applied

        let title = this.state.titles[spot];
        return title.toLowerCase().includes(this.state.boxNameFilter.trim().toLowerCase());
    }

    getFilteredSpots()
    {
        //Apply the filter to the boxes
        const exactMatchFilteredSpots = [];
        const generalMatchFilteredSpots = [];
        for (let i = 0; i < this.props.boxCount; ++i)
        {
            if (this.matchesFilterExactly(i))
                exactMatchFilteredSpots.push(i);
            else if (this.matchesFilterGenerally(i))
                generalMatchFilteredSpots.push(i);
        }

        //Show the boxes that match the filter exactly first, then the ones that match generally
        const filteredSpots = exactMatchFilteredSpots.concat(generalMatchFilteredSpots);

        //When dragging multiple boxes, only leave the hole for the first selected box.
        const draggingSpot =  this.state.draggingSpot; //The spot the box was dragged from
        const draggingSpots = (draggingSpot >= 0 && this.isSelectedForMultiDragging(draggingSpot))
            ? this.state.multiSelectedSpots
            : [];

        //Filter out the boxes that are being dragged except for the one being dragged from
        return filteredSpots.filter(spot => spot === draggingSpot || !draggingSpots.includes(spot));
    }

    /**
     * Determines if the boxes can be dragged to reorder them.
     * @returns {Boolean} Whether dragging is allowed.
     */
    draggingAllowed()
    {
        return !isMobile; //Dragging is not allowed on mobile devices
    }

    /**
     * Jumps to a specific box. If modified, also modify "setCurrentBox" in BoxView.js.
     * @param {Number} spot - The spot of the box to jump to.
     */
    jumpToBoxAtSpot(spot)
    {
        let currentBoxes = this.state.currentBoxes;
        let selectedMonPos = this.props.selectedMonPos;
        let summaryMon = this.props.summaryMon;

        currentBoxes[this.props.boxSlot] = spot;
        selectedMonPos[this.props.boxSlot] = CreateSingleBlankSelectedPos(); //Clear selection 
        summaryMon[this.props.boxSlot] = null; //Clear summary

        this.setState({currentBoxes: currentBoxes});

        this.setParentState
        ({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            impossibleMovement: null,
            viewingBoxList: -1, //No more viewing box list
        });

        window.scrollTo(0, 0); //Undoes scroll offset on mobile devices caused by scrolling through box list
    }

    /**
     * Focuses on the filter input field when the user starts typing.
     */
    handleKeyDown()
    {
        if (this.state.draggingMode) //If the user is dragging boxes, don't focus on the input field
            return;

        let inputFields = document.getElementsByTagName("input");
        if (inputFields.length > 0)
            inputFields[0].focus();
    }

    /**
     * Updates the filter when the user types in the input field.
     * @param {Event} e - The event triggered by the input field.
     */
    updateFilter(e)
    {
        clearTimeout(this.filterTimeout);
        const value = e.target.value.substring(0, MAX_TITLE_LENGTH);
        this.filterTimeout = setTimeout(() =>
        {
            this.setState({boxNameFilter: value});
        }, 125); //Delay to allow user to finish typing before rerendering the boxes
    }

    /**
     * Resets the dragging box ids to their initial values.
     */
    resetDraggingBoxIds()
    {
        this.setState
        ({
            draggingSpot: -1,
            draggingBoxId: -1,
        });
    }

    /**
     * Toggles the dragging mode on or off.
     */
    toggleDraggingMode()
    {
        this.setState
        ({
            draggingMode: !this.state.draggingMode,
            multiSelectedSpots: [], //Reset multi-selected boxes
            boxNameFilter: "", //Reset the filter
        });
        this.resetDraggingBoxIds(); //Reset the dragging box ids
    }

    /**
     * Handle selecting a box to be dragged with multiple boxes.
     * @param {Event} e - The event triggered by the click.
     * @param {Number} spot - The spot of the box being clicked.
     */
    handleMultiSelectBoxClick(spot)
    {
        //Prevent selecting more than four boxes at once
        let multi = this.state.multiSelectedSpots.slice(); //Copy the current multi-selected spots
        if (multi.length >= MAX_DRAGGING_BOXES_AT_ONCE && !this.isSelectedForMultiDragging(spot))
        {
            SendErrorToastNotification(`Only ${MAX_DRAGGING_BOXES_AT_ONCE} boxes can be selected at once!`);
            return false;
        }

        //Either add or delete the box from the multi-selected spots
        let index = multi.indexOf(spot);
        if (index === -1)
            multi.push(spot);
        else
            multi.splice(index, 1);

        //Sort the selected spots in ascending order
        multi.sort((a, b) => a - b);
        this.setState({multiSelectedSpots: multi});
    }

    /**
     * Handler to set the box being dragged when dragging starts.
     * @param {Event} event - The event triggered by the drag start.
     */
    handleDragStart(event)
    {
        //Store the id and spot of the box being dragged
        let draggingBoxId = event.active.id;
        this.setState
        ({
            draggingSpot: this.findSpotOfBoxId(draggingBoxId), //Spot the box was dragged from
            draggingBoxId: draggingBoxId, //Id the box had when the page loaded
        });
    }

    /**
     * Updates the box order when the drag ends.
     * @param {Event} event - The event triggered by the drag end.
     * @param {Object} event.active - The box being dragged.
     * @param {Object} event.over - The box being dropped on.
     * @param {Number} event.active.id - The id of the box being dragged.
     * @param {Number} event.over.id - The id of the box being dropped on.
     */
    handleDragEnd(event)
    {
        //Prevent dragging if the filter is active
        if (this.state.boxNameFilter !== "")
        {
            PlayErrorSound();
            this.resetDraggingBoxIds();
            return;
        }

        //Prevent dragging if the user is trying to drag a box that is not in the list
        const {active, over} = event;
        if (!over) //No box to drop on
        {
            this.resetDraggingBoxIds();
            return;
        }

        //Get the boxes being dragged
        const draggingBoxId = active.id;
        const draggingSpot = this.findSpotOfBoxId(draggingBoxId); //Get the spot the box is being dragged from
        let draggingSpots = this.isSelectedForMultiDragging(draggingSpot) //In case some boxes are selected and the user decides to drag a different box
            ? this.state.multiSelectedSpots.slice() //Copy the current multi-selected boxes
            : [draggingSpot]; //Only one box is being dragged, so make it a single-element array

        //Get the box being dropped on
        const destBoxId = over.id;
        const destSpot = this.findSpotOfBoxId(destBoxId); //Get the spot the box is being dropped on

        //Create copies of current titles, boxes, and page load box ids to avoid mutating state directly
        let newTitles = this.state.titles.slice();
        let newBoxes = this.state.boxes.slice();
        let newSpotToBoxId = this.state.spotToBoxId.slice(); //Copy the box ids the boxes had when the page loaded

        //Arrays to store the titles and box groups being moved
        const removedTitles = [];
        const removedWholeBoxes = [];
        const removedSpotToBoxId = [];

        //Remove selected boxes and their titles from the current lists
        //Iterate in reverse to avoid index shifting issues
        for (let i = draggingSpots.length - 1; i >= 0; --i)
        {
            const spot = draggingSpots[i];
            const groupStart = spot * MONS_PER_BOX;
            removedTitles.unshift(newTitles.splice(spot, 1)[0]); //Remove the title of the box
            removedSpotToBoxId.unshift(newSpotToBoxId.splice(spot, 1)[0]); //Remove the box id
            removedWholeBoxes.unshift(newBoxes.splice(groupStart, MONS_PER_BOX)); //Remove the whole box
        }

        //Calculate the new destination index after removal
        const numRemovedBeforeDest = draggingSpots.filter(spot => spot < destSpot).length;
        let adjustedDestSpot = destSpot - numRemovedBeforeDest; //Adjust for removed boxes before the destination

        //Adjust destination index if dragging downwards
        if (destSpot > draggingSpot)
            adjustedDestSpot += 1;

        //Clamp destination index within valid bounds
        adjustedDestSpot = Math.max(0, Math.min(adjustedDestSpot, newTitles.length));

        //Insert the removed titles and page load box ids back into the new position
        newTitles.splice(adjustedDestSpot, 0, ...removedTitles);
        newSpotToBoxId.splice(adjustedDestSpot, 0, ...removedSpotToBoxId);

        //Flatten the removed whole boxes into a single array for insertion so all multi-selected boxes are insterted one after the other
        const flatRemovedBoxes = removedWholeBoxes.flat();

        //Insert the removed boxes back into the new position
        const destBoxOffset = adjustedDestSpot * MONS_PER_BOX;
        newBoxes.splice(destBoxOffset, 0, ...flatRemovedBoxes);

        //Update the currently selected box ids if necessary
        const newCurrentBoxes = this.state.currentBoxes.slice();
        let boxSlots = [this.props.boxSlot]; //The box slots to update
        if (this.props.isSameBoxBothSides) //If the same box is displayed on both sides, update both slots
            boxSlots.push(this.props.boxSlot ^ 1); //Toggle the box slot

        for (let boxSlot of boxSlots) //Loop in case box boxes are viewing the same kind of box
        {
            let currentSelectedSpot = this.state.currentBoxes[boxSlot]; //Old spot the currently selected box was at
            let boxId = this.spotToBoxId(currentSelectedSpot); //Get the id the box had when the page loaded
            currentSelectedSpot = newSpotToBoxId.findIndex(id => id === boxId); //Get the spot the box is at now
            newCurrentBoxes[boxSlot] = currentSelectedSpot; //Update the currentBoxes array with the new selection
        }

        //Mark the boxes as changed
        let changeWasMade = this.props.changeWasMade.slice(); //Copy to avoid mutating state directly
        changeWasMade[this.props.boxType] = true; 

        //Update the state with the new data
        this.setState
        ({
            titles: newTitles,
            boxes: newBoxes,
            spotToBoxId: newSpotToBoxId,
            currentBoxes: newCurrentBoxes,
            multiSelectedSpots: [],
        });
        this.resetDraggingBoxIds(); //Reset the dragging box ids

        //Update the parent state with the new titles and boxes
        this.setParentState
        ({
            [IsHomeBox(this.props.boxType) ? "homeTitles" : "saveTitles"]: newTitles,
            [(IsHomeBox(this.props.boxType) ? "homeBoxes" : "saveBoxes")]: newBoxes,
            currentBox: newCurrentBoxes,
            changeWasMade: changeWasMade,
        });
    }

    /**
     * Creates the mini-image of a specific box.
     * @param {Number} spot - The spot of the box to make the image of.
     * @param {Boolean} hidden - True if the box shouldn't be visible. False if it should be.
     * @returns {MiniBox} A mini box element.
     */
    createBoxView(spot, hidden=false)
    {
        let title, boxClasses;
        let startIndex = GetBoxStartIndex(spot);
        let disabledBox = false;
        const icons = [];

        //Make little Poke Ball icons
        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.boxes[i];
            let species = GetIconSpeciesName(pokemon);
            let colour = "";

            if (species === "none") //Still show "unknown" because they take up slots
                icon = <div className="mini-box-cell" key={key}></div>;
            else
            {
                if (MatchesSearchCriteria(pokemon, this.props.searchCriteria, this.props.gameId))
                    colour = "#f33d21"; //Highlight icon red

                const style = (colour) ? {backgroundColor: colour, borderColor: colour} : {}; //Set the colour of the icon
                icon =
                    <div className="mini-box-cell" key={key}>
                        <div className="poke-ball-icon" style={style} >
                            <div className="band" />
                            <div className="connector left" />
                            <div className="connector right" />
                            <div className="button" />
                        </div>
                    </div>;
            }

            icons.push(icon);
        }

        //Make the box's class name
        boxClasses = "mini-box " + (IsHomeBox(this.props.boxType) ? "home-box" : "save-box");
        if (!this.state.draggingMode)
            boxClasses += " selectable-mini-box"; //Selectable mode
        if (this.isSelectedForMultiDragging(spot))
            boxClasses += " multi-selected-box"; //Box selected for multi dragging

        //Make the box's title
        let boxId = this.spotToBoxId(spot); //Get the index of the box in the current list
        title =
            <h4 id={`box-${boxId}-title`}
                className={"mini-box-title" +
                (this.state.currentBoxes[this.props.boxSlot] === spot ? " mini-box-current-box-title" : "")}>
                {this.state.titles[spot]}
            </h4>;

        //Try disable jumping to a box already active (in a Home -> Home or Box -> Box view)
        if (this.isBoxAtSpotDisabled(spot) && !this.state.draggingMode) //Other box has this and not dragging currently
            disabledBox = true; //Prevent jumping to this box since the other box is already showing it

        //Create the entire box
        return (
            <div className={"mini-box-with-title" + ((this.state.draggingMode) ? " draggable-mini-box" : "")}
                 id={`box-${boxId}-with-title`} key={boxId}>
            {
                !hidden ?
                <>
                    <div className={boxClasses + (disabledBox ? " disabled-box" : "")}
                        id={`box-${boxId}`}
                        onClick={disabledBox ? null
                                 : this.state.draggingMode ? this.handleMultiSelectBoxClick.bind(this, spot) //Select for multi dragging
                                 : this.jumpToBoxAtSpot.bind(this, spot)}
                    >
                        {icons}
                    </div>
                    {title}
                </>
                :
                    //Show a placeholder to point to where the box is being dragged to
                    <div className="mini-box-with-title place-box-indicator" id={`place-box-${boxId}`} />
            }
            </div>
        );
    }

    /**
     * Renders all of the boxes in the list.
     * @param {Array<Number>} filteredSpots - The spots of the boxes to be displayed (spots corresponding to if all boxes were shown).
     * @returns {Array<JSX.Element>} The mini boxes to be displayed.
     */
    printBoxes(filteredSpots)
    {
        if (filteredSpots.length === 0)
        {
            return (
                <div className="box-list-empty-filter">
                    <h1 className="box-list-empty-filter-text">
                        No Boxes Found
                    </h1>
                </div>
            );
        }

        return filteredSpots.map(spot =>
        {
            let boxId = this.spotToBoxId(spot); //Get the id the box had when the page loaded
            const boxView = this.createBoxView(spot, this.state.draggingBoxId === boxId); //Create the box view

            if (!this.draggingAllowed() || !this.state.draggingMode)
                //No dragging at all, so just return the box view
                return (
                    <div key={boxId}> {/* Use div to maintain the same structure as the draggable box */}
                        {boxView}
                    </div>
                );
            else
            {
                return (
                    <DraggableBox key={boxId} id={boxId}>
                        {boxView}
                    </DraggableBox>
                );
            }
        });
    }

    /**
     * Renders the reorder button to toggle dragging mode.
     * @param {Boolean} visible - Whether the button should be visible or not and just take up space.
     * @returns {JSX.Element|null} The reorder button element or null if dragging is not allowed.
     */
    printReorderButton(visible)
    {
        let tooltipText = this.state.draggingMode ? "Stop Reordering" : "Reorder Boxes";
        let iconSize = 24;
        let iconFill = (this.state.draggingMode ? "#f33d21" : "currentColor"); //Red when dragging mode is active
        const tooltip = props => (<Tooltip {...props}>{tooltipText}</Tooltip>);

        if (!this.draggingAllowed())
            return null;

        return (
            <OverlayTrigger placement="top" overlay={tooltip}>
                <Button size="lg" id="reorder-button"
                        aria-label="Reorder Boxes"
                        style={{visibility: visible ? "visible" : "hidden"}}
                        onClick={this.toggleDraggingMode.bind(this)} >
                        <MdGridView size={iconSize} fill={iconFill} />
                </Button>
            </OverlayTrigger>
        );
    }

    /**
     * Renders the loading screen while the boxes are being loaded.
     * @returns {JSX.Element} The loading screen element.
     */
    printLoadingScreen()
    {
        return (
            <div className={"box-list-loading-screen box-list-loading-screen-position" + (isMobile ? "-mobile" : "")}>
                Loading...
            </div>
        );
    }

    /**
     * Renders the box list page.
     * @returns {JSX.Element} The loading screen element.
     */
    render()
    {
        if (!this.state.loaded)
            return this.printLoadingScreen();

        const filteredSpots = this.getFilteredSpots(); //Get the spots of the boxes to be displayed (spots corresponding to if all boxes were shown)

        return (
            <div className="box-list-container">
                {/* Box Filter */}
                <div className="box-list-filter-container">
                    {this.printReorderButton(false)} {/* Placeholder for margin */}

                    {
                        //Filter input
                        !this.state.draggingMode ?
                            <TextField
                                id="filter"
                                className="box-list-filter"
                                variant="outlined"
                                label="Type to filter..."
                                size="small"
                                onChange={this.updateFilter.bind(this)}
                                defaultValue={this.state.boxNameFilter}
                            />
                        : //Dragging Instructions
                            <span className="dragging-instructions">
                                Drag boxes to reorder them.<br/>Click to select up to {MAX_DRAGGING_BOXES_AT_ONCE} boxes at once!
                            </span>
                    }

                    {this.printReorderButton(true)}
                </div>

                {/* Actual Boxes */}
                <BoxListWrapper
                    className="mini-boxes"
                    id="box-list"
                    onDragStart={this.handleDragStart.bind(this)}
                    onDragEnd={this.handleDragEnd.bind(this)}
                    items={filteredSpots.map(spot => this.spotToBoxId(spot))}
                    dragOverlayContent={
                        //Create the overlay to show when any number of boxes are being dragged
                        <MultiDragOverlay
                            draggingSpot={this.state.draggingSpot}
                            multiSelectedSpots={this.state.multiSelectedSpots}
                            createBoxView={this.createBoxView.bind(this)}
                        />
                    }
                >
                    {this.printBoxes(filteredSpots)}
                </BoxListWrapper>
            </div>
        );
    }
}

/**
 * A wrapper component for enabling drag-and-drop functionality for the boxes.
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.id - The id of the box.
 * @param {ReactNode} props.children - The box to be rendered.
 * @returns {JSX.Element} The draggable box component.
 */
function DraggableBox(props)
{
    const {attributes, listeners, setNodeRef,
           transform, transition} = useSortable({id: props.id});
    const style =
    {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {props.children}
        </div>
    );
}

/**
 * A wrapper component that provides DnD functionality along with a DragOverlay.
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.id - The id of the box list.
 * @param {ReactNode} props.children - The box list to be rendered.
 * @param {Array} props.items - The list of items to be rendered.
 * @param {Function} props.onDragStart - The function to call when dragging starts.
 * @param {Function} props.onDragEnd - The function to call when dragging ends.
 * @param {ReactNode} props.dragOverlayContent - The content to be displayed in the drag overlay.
 * @return {JSX.Element} The box list wrapper component.
 */
function BoxListWrapper(props)
{
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={props.onDragStart}
            onDragEnd={props.onDragEnd}
            modifiers={[snapCenterToCursor]} //Always attach the box to the cursor when dragging (helps with multi-select allowing drag from any box)
        >
            <SortableContext items={props.items} strategy={rectSortingStrategy}>
                <div className={props.className} id={props.id}>
                    {props.children}
                </div>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
                {props.dragOverlayContent}
            </DragOverlay>
        </DndContext>
    );
}

/**
 * Component to render the overlay showing the multiple boxes being dragged.
 * @param {Object} props - The properties passed to the component.
 * @param {number} props.draggingSpot - The spot the box was dragged from.
 * @param {Array} props.multiSelectedSpots - The spots of the boxes selected for multi dragging.
 * @param {Function} props.createBoxView - The function to create the box view.
 */
function MultiDragOverlay({ draggingSpot, multiSelectedSpots, createBoxView })
{
    //Don't show overlay if no box is being dragged
    if (draggingSpot < 0)
        return null;

    //Choose how to render the overlay
    let content;

    if (multiSelectedSpots.includes(draggingSpot))
    {
        //If the box being dragged is part of a multi-selection, render all selected boxes together.
        content = (
            <div className="drag-overlay-group">
                {multiSelectedSpots.map(spot => (
                    <div key={spot} className="drag-overlay-item mini-box-overlay">
                        {createBoxView(spot)}
                    </div>
                ))}
            </div>
        );
    }
    else
    {
        //Only one box is being dragged, so render it normally.
        content = (
            <div className="mini-box-overlay">
                {createBoxView(draggingSpot)}
            </div>
        );
    }

    return content;
}

export default BoxList;
