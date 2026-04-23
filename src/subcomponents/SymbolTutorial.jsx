/**
 * The interior of a pop-up explaining the different symbols.
 */

import React, {Component} from 'react';
import Table from 'react-bootstrap/Table';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import {GetDefaultPopUpOpts} from "../Notifications";

import {AiFillWarning, AiOutlineCheckCircle, AiOutlineCloseCircle,
        AiOutlineSave, AiOutlineTool} from "react-icons/ai";
import {BiSearchAlt2} from "react-icons/bi";
import {CgExport, CgPokemon} from "react-icons/cg";
import {GrEdit, GrMultiple, GrTrash} from "react-icons/gr";
import {MdArrowBack, MdArrowForward, MdCloud, MdGridView, MdLogout, MdModeNight, MdMusicNote, MdMusicOff,
        MdSunny, MdSwapVert, MdVideogameAsset, MdVolumeOff, MdVolumeUp} from "react-icons/md";
import {RiBoxingLine} from "react-icons/ri";

const SVG_SIZE = 28;

const TABLE_DETAILS =
[
    [<MdCloud size={SVG_SIZE}/>, "This Box is a Cloud Box."],
    [<MdVideogameAsset size={SVG_SIZE}/>, "This Box is a save file Box."],
    [<MdModeNight size={SVG_SIZE}/>, "Turn dark mode on."],
    [<MdSunny size={SVG_SIZE}/>, "Turn dark mode off."],
    [<MdSwapVert size={SVG_SIZE}/>, "Start a trade with your friend."],
    [<MdVolumeUp size={SVG_SIZE}/>, "Sound effects are on."],
    [<MdVolumeOff size={SVG_SIZE}/>, "Sound effects are off."],
    [<MdMusicNote size={SVG_SIZE}/>, "Background music is on."],
    [<MdMusicOff size={SVG_SIZE}/>, "Background music is off."],
    [<MdLogout size={SVG_SIZE}/>, "Choose another save file."],
    [<MdArrowBack size={SVG_SIZE}/>, "Go to the previous Box."],
    [<MdArrowForward size={SVG_SIZE}/>, "Go to the next Box."],
    [<p className="box-name-button">Box</p>, "View all Boxes."],
    [<MdGridView size={SVG_SIZE}/>, "Rearrange Box order."],
    [<GrEdit size={SVG_SIZE}/>, "Start editing a Box name."],
    [<AiOutlineCheckCircle size={SVG_SIZE}/>, "Save changes to a Box name."],
    [<AiOutlineCloseCircle size={SVG_SIZE}/>, "Cancel editing a Box name."],
    [<CgPokemon size={SVG_SIZE + 6}/>, "Show which Pokémon are needed in the Cloud Boxes to make a living Pokédex.", {paddingLeft: "5px"}],
    [<AiOutlineTool size={SVG_SIZE + 8}/>, "Organize the Cloud Boxes to fill a living Pokédex.", {paddingLeft: "4px"}],
    [<BiSearchAlt2 size={SVG_SIZE + 6}/>, "Search through the Boxes for a specific Pokémon."],
    [<GrMultiple size={SVG_SIZE}/>, "Select or deselect all Pokémon in the current Box."],
    [<AiOutlineSave size={SVG_SIZE + 8}/>, "Download modified Cloud file and/or save file.", {paddingLeft: "4px"}],
    [<GrTrash size={SVG_SIZE}/>, "Release all selected Pokémon in the current Box."],
    [<RiBoxingLine size={SVG_SIZE}/>, "Convert a Pokémon to a Showdown spread."],
    [<CgExport size={SVG_SIZE}/>, "Start a Wonder Trade. Send a Pokémon and receive a random Pokémon in exchange."],
    [<AiFillWarning size={SVG_SIZE}/>, "This Pokémon will lose data when saved in the game."],
];

const PopUp = withReactContent(Swal);


export class SymbolTutorial extends Component
{
    /**
     * Sets up the symbol tutorial.
    */
    constructor(props)
    {
        super(props);

        this.state =
        {
        };
    }

    /**
     * Builds the table that shows the different symbols and their explanations.
     * @returns {Array <JSX>} A list of <tr> elements.  
     */
    buildTableBody()
    {
        var key = 0;
        var table = []

        for (let row of TABLE_DETAILS)
        {
            table.push(
                <tr key={key++}>
                    <td style={row.length >= 3 ? row[2] : {}}>{row[0]}</td>
                    <td>{row[1]}</td>
                </tr>
            );
        }

        return table;
    }

    /**
     * Prints the symbol tutorial table.
     */
    render()
    {
        return (
            <Table striped bordered hover style={{textAlign: "left"}} id="symbol-tutorial">
                <tbody>
                    {this.buildTableBody()}
                </tbody>
            </Table>
        );
    }
}

/**
 * Shows a pop-up explaining the different symbols on the page.
 */
export function ShowSymbolTutorial()
{
    PopUp.fire
    ({
        icon: "question",
        title: "Symbols",
        html: <SymbolTutorial/>,
        ...GetDefaultPopUpOpts(),
    });

    localStorage.visitedBefore = true; //Set cookie only once user has seen this pop-up
}

export default SymbolTutorial;
