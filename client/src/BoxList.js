
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
            boxType: this.props.boxType,
            boxes: this.props.boxes,
            titles: this.props.titles,
            boxCount: this.props.boxCount,
            currentBoxes: this.props.currentBoxes,
            selectedMonPos: this.props.selectedMonPos,
            viewingMon: this.props.viewingMon,
            setParentState: this.props.updateParentState,
            searchCriteria: this.props.searchCriteria,
        };
    }

    jumpToBox(boxId)
    {
        var currentBoxes = this.state.currentBoxes;
        var selectedMonPos = this.state.selectedMonPos;
        var viewingMon = this.state.viewingMon;

        currentBoxes[this.state.boxType] = boxId;
        selectedMonPos[this.state.boxType] = CreateSingleBlankSelectedPos(); //Wipe 
        viewingMon[this.state.boxType] = null; //Wipe
    
        this.setState({
            currentBoxes: currentBoxes,
        });

        this.state.setParentState({
            currentBox: currentBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
            viewingBoxList: -1, //No more viewing box list
            multiMoveError: [false, false],
        });
    }

    createBoxView(boxId)
    {
        var icons = [];
        var startIndex = boxId * MONS_PER_BOX;
        var title;

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

        title = <h4 className={"mini-box-title" + (this.state.currentBoxes[this.state.boxType] === boxId ? " mini-box-current-box-title" : "")}>
                    {this.state.titles[boxId]}
                </h4>

        return(
            <div className="mini-box-with-title" key={boxId}>
                <div className={"mini-box " + (this.state.boxType === BOX_HOME ? "home-box" : "save-box")}
                     onClick={this.jumpToBox.bind(this, boxId)}>
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
