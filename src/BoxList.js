/**
 * A page displaying a list of boxes.
 */

import React, {Component} from 'react';
import {isMobile} from "react-device-detect";

import {MAX_TITLE_LENGTH, MONS_PER_BOX} from "./BoxView";
import {GetIconSpeciesName} from "./PokemonUtil";
import {MatchesSearchCriteria} from "./Search";
import {CreateSingleBlankSelectedPos, GetBoxStartIndex, IsHomeBox} from "./Util";

import "./stylesheets/BoxList.css";

import {ReactComponent as PokeBallIcon} from './images/PokeBallIcon.svg';
const POKE_BALL_ICON_STYLE = {position: "absolute", top: "0", left: "0", height: "100%", width: "100%"};


export class BoxList extends Component
{
    /**
     * Sets up the box listing page.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
            boxNameFilter: "",
            boxType: props.boxType,
            boxSlot: props.boxSlot, //Left or right
            boxes: props.boxes,
            titles: props.titles,
            boxCount: props.boxCount,
            currentBoxes: props.currentBoxes,
            selectedMonPos: props.selectedMonPos,
            summaryMon: props.summaryMon,
            setParentState: props.updateParentState,
            searchCriteria: props.searchCriteria,
            isSameBoxBothSides: props.isSameBoxBothSides,
            globalState: props.globalState,
            gameId: props.gameId,
            loaded: false,
        };
    }

    /**
     * Starts changing the screen from "Loading..." when the loading screen is displayed.
     * Also overrides the back button to return to the main page.
     * Also ensures the filter starts immediately when the user starts typing.
     */
    async componentDidMount()
    {
        await new Promise(r => setTimeout(r, 50)); //Allows the loading screen to render
        this.setState({loaded: true});

        //Override back button
        window.history.pushState(null, document.title, window.location.href)
        window.addEventListener("popstate", this.state.globalState.navBackButtonPressed.bind(this.state.globalState));
        window.addEventListener("keydown", (this.handleKeyDown.bind(this)));
    }

    /**
     * Removes the event listener for the typing recognition when the user leaves the pages.
     */
    componentWillUnmount()
    {
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Focuses on the filter input field when the user starts typing.
     */
    handleKeyDown()
    {
        let inputFields = document.getElementsByTagName("input");
        if (inputFields.length > 0)
            inputFields[0].focus();
    }

    /**
     * Checks if a box's name matches the user's filter input.
     * @param {Number} boxId - The id number of the box to check the name of.
     * @returns {Boolean} True if the box name falls within the filter. False otherwise.
     */
    matchesFilter(boxId)
    {
        if (this.state.boxNameFilter === "")
            return true; //No filter applied

        var title = this.state.titles[boxId];
        return title.toLowerCase().includes(this.state.boxNameFilter.trim().toLowerCase());
    }

    /**
     * Jumps to a specific box. If modified, also modify "setCurrentBox" in BoxView.js.
     * @param {Number} boxId - The id number of the box to jump to.
     */
    jumpToBox(boxId)
    {
        var currentBoxes = this.state.currentBoxes;
        var selectedMonPos = this.state.selectedMonPos;
        var summaryMon = this.state.summaryMon;

        currentBoxes[this.state.boxSlot] = boxId;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        summaryMon[this.state.boxSlot] = null; //Wipe
    
        this.setState({currentBoxes: currentBoxes});

        this.state.setParentState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            summaryMon: summaryMon,
            errorMessage: ["", ""],
            impossibleMovement: null,
            viewingBoxList: -1, //No more viewing box list
        });

        window.scrollTo(0, 0); //Undoes scroll offset on mobile devices caused by scrolling through box list
    }

    /**
     * Creates the mini-image of a specific box.
     * @param {Number} boxId - The id number of the box to make the image of.
     * @param {Boolean} hidden - True if the box shouldn't be visible. False if it should be.
     * @returns {MiniBox} A mini box element.
     */
    createBoxView(boxId, hidden)
    {
        var title;
        var icons = [];
        var startIndex = GetBoxStartIndex(boxId);
        var disabledBox = false;

        //Make little Poke Ball icons
        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.boxes[i];
            let species = GetIconSpeciesName(pokemon);
            let colour = "rgba(0, 0, 0, 0.8)";

            if (species === "none") //Still show "unknown" because they take up slots
                icon = <div className="mini-box-cell" key={key}></div>;
            else
            {
                if (MatchesSearchCriteria(pokemon, this.state.searchCriteria, this.state.gameId))
                    colour = "#f33d21"; //Highlight icon red

                icon =
                    <div className="mini-box-cell" key={key}>
                        <PokeBallIcon fill={colour} style={POKE_BALL_ICON_STYLE}/>
                    </div>
            }

            icons.push(icon);
        }

        //Make the box's title
        title =
            <h4 className={"mini-box-title" + (this.state.currentBoxes[this.state.boxSlot] === boxId ? " mini-box-current-box-title" : "")}>
                {this.state.titles[boxId]}
            </h4>

        //Try disable jumping to a box already active (in a Home -> Home or Box -> Box view)
        if (this.state.isSameBoxBothSides && this.state.currentBoxes[this.state.boxSlot ^ 1] === boxId) //Other box has this
            disabledBox = true; //Prevent jumping to this box since the other box is already showing it

        //Create the entire box
        return (
            <div className="mini-box-with-title" hidden={hidden} key={boxId}>
                <div className={"mini-box " + (disabledBox ? "disabled-box" : IsHomeBox(this.state.boxType) ? "home-box" : "save-box")}
                     onClick={disabledBox ? null : this.jumpToBox.bind(this, boxId)}>
                    {icons}
                </div>
                {title}
            </div>
        )
    }

    /**
     * Renders all of the boxes in the list.
     * @returns {Array <MiniBox>} The mini boxes to be displayed.
     */
    printBoxes()
    {
        var boxes = [];
        var atLeastOneBox = false;

        for (let i = 0; i < this.state.boxCount; ++i)
        {
            let visible = this.matchesFilter(i);

            if (visible)
                atLeastOneBox = true;

            boxes.push(this.createBoxView(i, !visible));
        }

        if (!atLeastOneBox)
        {
            return (
                <div className="box-list-empty-filter">
                    <h1 className="box-list-empty-filter-text">
                        No Boxes Found
                    </h1>
                </div>
            );
        }

        return boxes;
    }

    /**
     * Renders the box list page.
     */
    render()
    {
        if (!this.state.loaded)
        {
            return (
                <div className={"box-list-loading-screen box-list-loading-screen-position" + (isMobile ? "-mobile" : "")}>
                    Loading...
                </div>
            );
        }
        else
        {
            return(
                <div className={"scroll-container-box-list" + (isMobile ? "-mobile" : "")}>
                    {/*Box Filter*/}
                    <div className="box-list-filter-container">
                        <input type="text"
                               className="mini-box-title"
                               placeholder="Type to filter..."
                               onChange={(e) => this.setState({boxNameFilter: e.target.value.substring(0, MAX_TITLE_LENGTH)})}
                               value={this.state.boxNameFilter}/>
                    </div>

                    {/*Actual Boxes*/}
                    <div className="mini-boxes">
                        {this.printBoxes()}
                    </div>
                </div>
            )
        }
    }
}
