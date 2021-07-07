
import React, {Component} from 'react';
import {isMobile} from "react-device-detect";

import {MONS_PER_BOX} from "./BoxView";
import {BOX_HOME/*, BOX_SAVE*/} from './MainPage';
import {GetIconSpeciesName} from "./PokemonUtil";
import {MatchesSearchCriteria} from "./Search";
import {CreateSingleBlankSelectedPos} from "./Util";

import "./stylesheets/BoxList.css";

//TODO: Change mini-icon colour when satisfying search result


export class BoxList extends Component
{
    constructor(props)
    {
        super(props);

        this.state =
        {
            boxType: props.boxType,
            boxSlot: props.boxSlot,
            boxes: props.boxes,
            titles: props.titles,
            boxCount: props.boxCount,
            currentBoxes: props.currentBoxes,
            selectedMonPos: props.selectedMonPos,
            viewingMon: props.viewingMon,
            setParentState: props.updateParentState,
            searchCriteria: props.searchCriteria,
            isSameBoxBothSides: props.isSameBoxBothSides,
        };
    }

    jumpToBox(boxId)
    {
        var currentBoxes = this.state.currentBoxes;
        var selectedMonPos = this.state.selectedMonPos;
        var viewingMon = this.state.viewingMon;

        currentBoxes[this.state.boxSlot] = boxId;
        selectedMonPos[this.state.boxSlot] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxSlot] = null; //Wipe
    
        this.setState({
            currentBoxes: currentBoxes,
        });

        this.state.setParentState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
            viewingBoxList: -1, //No more viewing box list
            errorMessage: ["", ""],
        });
    }

    createBoxView(boxId)
    {
        var title;
        var icons = [];
        var startIndex = boxId * MONS_PER_BOX;
        var disabledBox = false;

        for (let i = startIndex, key = 0; i < startIndex + MONS_PER_BOX; ++i, ++key)
        {
            let icon;
            let pokemon = this.state.boxes[i];
            let species = GetIconSpeciesName(pokemon);
            let colour = "rgba(0, 0, 0, 0.8)";

            if (species === "none")
                icon = <div style={{backgroundColor: "rgba(255, 255, 255, 0.8)"}} className="mini-box-cell" key={key}></div>;
            else
            {
                if (MatchesSearchCriteria(pokemon, this.state.searchCriteria))
                    colour = "rgba(255, 0, 0, 0.8)"; //Red

                icon = <div style={{backgroundColor: colour}} className="mini-box-cell" key={key}></div>
            }

            icons.push(icon);
        }

        title = <h4 className={"mini-box-title" + (this.state.currentBoxes[this.state.boxSlot] === boxId ? " mini-box-current-box-title" : "")}>
                    {this.state.titles[boxId]}
                </h4>

        if (this.state.isSameBoxBothSides && this.state.currentBoxes[this.state.boxSlot ^ 1] === boxId) //Other box has this
            disabledBox = true; //Prevent jumping to this box since the other box is already showing it

        return(
            <div className="mini-box-with-title" key={boxId}>
                <div className={"mini-box " + (disabledBox ? "disabled-box" : this.state.boxType === BOX_HOME ? "home-box" : "save-box")}
                     onClick={disabledBox ? null : this.jumpToBox.bind(this, boxId)}>
                    {icons}
                </div>
                {title}
            </div>
        )
    }

    printBoxes()
    {
        var boxes = [];

        for (let i = 0; i < this.state.boxCount; ++i)
            boxes.push(this.createBoxView(i));

        return boxes;
    }

    render()
    {
        return(
            <div className={"mini-boxes" + (!isMobile ? " scroll-container" : "")}>
                {this.printBoxes()}
            </div>
        )
    }
}
