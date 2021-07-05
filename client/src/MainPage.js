/*
    A class for the main page.
*/

import React, {Component} from 'react'
import {Button} from "react-bootstrap";
import {isMobile} from "react-device-detect";
//import {StatusCode} from "status-code-enum";
import axios from "axios";
import {config} from "./config";

import {BoxList} from "./BoxList";
import {BoxView, HIGHEST_SAVE_BOX_NUM, HIGHEST_HOME_BOX_NUM, MONS_PER_BOX, MONS_PER_ROW} from "./BoxView";
import {IsBlankMon} from "./PokemonUtil";
import {CreateSingleBlankSelectedPos} from "./Util";
import SaveData from "./data/Test Output.json"

import {FaHome, FaGamepad} from "react-icons/fa";

import "./stylesheets/MainPage.css";

export const BOX_HOME = 0;
export const BOX_SAVE = 1;

const STATE_UPLOAD_SAVE = 0;
const STATE_UPLOADING_SAVE_FILE = 1;
const STATE_UPLOAD_HOME_FILE = 2;
const STATE_UPLOADING_HOME_FILE = 3;
const STATE_CHOOSE_FUNCTION = 4;
const STATE_EDITING_HOME_BOXES = 5;
const STATE_EDITING_SAVE_FILE = 6;
const STATE_MOVING_POKEMON = 7;

export default class MainPage extends Component {
    constructor(props)
    {
        super(props);
        this.state = //Set test data
        {
            editState: STATE_MOVING_POKEMON, //STATE_UPLOAD_SAVE,
            uploadProgress: 0,
            selectedSaveFile: null,
            selectedHomeFile: null,
            fileUploadError: false,
            homeFileUploadError: false,
            currentBox: [0, 0],
            selectedMonBox: [0, 0],
            selectedMonPos: this.generateBlankSelectedPos(),
            viewingMon: [null, null],
            draggingImg: "",
            draggingMon: -1,
            draggingOver: -1,
            draggingFromBox: 0,
            draggingToBox: 0,
            viewingBoxList: -1,
            multiMoveError: [false, false],
            searchCriteria: [null, null],
            changeWasMade: [false, false],

            saveBoxes: SaveData["boxes"],
            saveTitles: SaveData["titles"],
            homeBoxes: this.generateBlankHomeBoxes(),
            homeTitles: this.generateBlankHomeTitles(),
            fileDownloadUrl: null,
            saveFileData: [],
            saveFileNumber: 0,
        };

        this.updateState = this.updateState.bind(this);
    }

    componentDidMount()
    {
        window.addEventListener('beforeunload', this.beforeUnload.bind(this));
    }

    componentWillUnmount()
    {
        window.removeEventListener('beforeunload', this.beforeUnload.bind(this));
    }

    beforeUnload(e)
    {
        if (this.state.changeWasMade.some((x) => x)) //Some boxes aren't saved
        {
            e.preventDefault();
            e.returnValue = true; //Display pop-up warning
        }
    }

    updateState(stateChange)
    {
        this.setState(stateChange);
    }

    getBoxesByBoxType(boxType)
    {
        if (boxType === BOX_HOME)
            return this.state.homeBoxes;
        else
            return this.state.saveBoxes;
    }

    getMonAtBoxPos(boxType, boxPos)
    {
        return this.getBoxesByBoxType(boxType)[boxPos];
    }

    chooseSaveFile(e)
    {
        var file = e.target.files[0];

        if (!file.name.toLowerCase().endsWith(".sav")
        || file.size !== 131072) //128 kb
            this.setState({fileUploadError: true});
        else
            this.setState({selectedSaveFile: file});
    }

    chooseHomeFile(e)
    {
        var file = e.target.files[0];

        if (!file.name.toLowerCase().endsWith(".dat"))
            this.setState({fileUploadError: true});
        else
            this.setState({selectedHomeFile: file});
    }

    async handleUpload(isSaveFile)
    {
        var file = isSaveFile ? this.state.selectedSaveFile : this.state.selectedHomeFile;
        var route = isSaveFile ? "uploadSaveFile" : "uploadHomeData";
        route = `${config.dev_server}/${route}`;

        const formData = new FormData(); //formData contains the image to be uploaded
        formData.append("file", file);
        formData.append("isSaveFile", isSaveFile);
        this.setState({editState: STATE_UPLOADING_SAVE_FILE});

        let res;
        try
        {
            res = await axios.post(route, formData,
            {
                onUploadProgress: (ProgressEvent) => this.updateUploadProgress(ProgressEvent)
            });
        }
        catch (error)
        {
            //Some error occurred
            var newState;
            console.log("An error occurred uploading the file.");
            console.log(res);

            if (isSaveFile)
                newState = STATE_UPLOAD_SAVE;
            else
                newState = STATE_UPLOAD_HOME_FILE;

            this.setState({
                editState: newState,
                fileUploadError: true
            });

            return;
        }

        //Accepted, no error occurred
        if (isSaveFile)
        {
            console.log("Save file upload successful.");

            this.setState({
                editState: STATE_UPLOAD_HOME_FILE,
                saveBoxes: res.data.boxes,
                saveTitles: res.data.titles,
                saveFileNumber: res.data.fileIdNumber,
                saveFileData: res.data.saveFileData,
                fileUploadError: false,
            });
        }
        else //Home File
        {
            console.log("Home file upload successful.");

            this.setState({
                editState: STATE_CHOOSE_FUNCTION,
                homeBoxes: res.data.boxes,
                homeTitles: res.data.titles,
                fileUploadError: false,
            });
        }
    }

    /*
        Updates the upload status during a file upload.
        param progressEvent: An object containing the current state of the upload.
    */
    updateUploadProgress(progressEvent) {
        if (progressEvent.loaded <= 0 || progressEvent.total <= 0) //Faulty numbers
            return;

        let progress = Math.round((progressEvent.loaded / progressEvent.total) * 100) + "%";
        this.setState({uploadProgress: progress});
    }

    swapBoxedPokemon(boxes1, boxes2, boxesOffset1, boxesOffset2)
    {
        var temp = boxes1[boxesOffset1];
        boxes1[boxesOffset1] = boxes2[boxesOffset2];
        boxes2[boxesOffset2] = temp;
    }

    swapDifferentBoxedPokemon(multiSwap)
    {
        var saveBoxes = this.state.saveBoxes;
        var homeBoxes = this.state.homeBoxes;
        var changeWasMade = this.state.changeWasMade;

        if (this.state.selectedMonBox[BOX_SAVE] <= HIGHEST_SAVE_BOX_NUM
        && this.state.selectedMonBox[BOX_HOME] <= HIGHEST_HOME_BOX_NUM)
        {
            if (!multiSwap)
            {
                var homeOffset = this.state.selectedMonBox[BOX_HOME] * MONS_PER_BOX + this.state.selectedMonPos[BOX_HOME].indexOf(true);
                var saveOffset = this.state.selectedMonBox[BOX_SAVE] * MONS_PER_BOX + this.state.selectedMonPos[BOX_SAVE].indexOf(true);

                this.swapBoxedPokemon(homeBoxes, saveBoxes, homeOffset, saveOffset);
                changeWasMade = [true, true];
            }
            else
            {
                var i, j, multiFrom, multiTo, multiTopLeftPos, toTopRow, toLeftCol;
                var topRow = Number.MAX_SAFE_INTEGER;
                var bottomRow = 0;
                var leftCol = Number.MAX_SAFE_INTEGER;
                var rightCol = 0;

                if (this.state.selectedMonPos[BOX_SAVE].filter(x => x).length >= 2) //Count number of "true"s in array
                {
                    multiFrom = BOX_SAVE;
                    multiTo = BOX_HOME;
                    multiTopLeftPos = this.state.selectedMonPos[BOX_HOME].indexOf(true);
                }
                else
                {
                    multiFrom = BOX_HOME;
                    multiTo = BOX_SAVE;
                    multiTopLeftPos = this.state.selectedMonPos[BOX_SAVE].indexOf(true);
                }

                //Get area of moving mons
                for (i = 0; i < MONS_PER_BOX; ++i)
                {
                    if (this.state.selectedMonPos[multiFrom][i])
                    {
                        let row = Math.floor(i / MONS_PER_ROW);
                        let col = i % MONS_PER_ROW;

                        if (row < topRow)
                            topRow = row;
                        
                        if (row > bottomRow)
                            bottomRow = row;
                        
                        if (col < leftCol)
                            leftCol = col;

                        if (col > rightCol)
                            rightCol = col;
                    }
                }

                //Confirm moving mons can fit snugly in spot
                var possible = true;
                var width = (rightCol - leftCol) + 1;
                var height = (bottomRow - topRow) + 1;
                toTopRow = Math.floor(multiTopLeftPos / MONS_PER_ROW);
                toLeftCol = multiTopLeftPos % MONS_PER_ROW;

                for (i = 0; i < height; ++i)
                {
                    let row = toTopRow + i;
                    if (row >= MONS_PER_BOX / MONS_PER_ROW) //5 Rows
                    {
                        possible = false; //Outside of bounds
                        break;
                    }

                    for (j = 0; j < width; ++j)
                    {
                        let col = toLeftCol + j;
                        if (col >= MONS_PER_ROW) //6 Colums
                        {
                            possible = false; //Outside of bounds
                            break;
                        }

                        if (!this.state.selectedMonPos[multiFrom][topRow * MONS_PER_ROW + i * MONS_PER_ROW + leftCol + j])
                            continue; //No mon would be going in this spot anyway

                        let pokemon = this.getMonAtBoxPos(multiTo, this.state.selectedMonBox[multiTo] * MONS_PER_BOX + row * MONS_PER_ROW + col);
                        if (!IsBlankMon(pokemon))
                        {
                            possible = false; //There's a Pokemon at this spot
                            break;
                        }
                    }

                    if (!possible)
                        break;
                }

                //Move Pokemon
                if (possible)
                {
                    for (i = 0; i < MONS_PER_BOX; ++i)
                    {
                        if (this.state.selectedMonPos[multiFrom][i]) //Moving mon from this spot
                        {
                            let fromRow = Math.floor(i / MONS_PER_ROW);
                            let fromCol = i % MONS_PER_ROW;
                            let toRow = toTopRow + (fromRow - topRow);
                            let toCol = toLeftCol + (fromCol - leftCol);

                            let fromOffset = this.state.selectedMonBox[multiFrom] * MONS_PER_BOX + i;
                            let toOffset = this.state.selectedMonBox[multiTo] * MONS_PER_BOX + toRow * MONS_PER_ROW + toCol;
                            this.swapBoxedPokemon(this.getBoxesByBoxType(multiFrom), this.getBoxesByBoxType(multiTo), fromOffset, toOffset);
                        }
                    }

                    changeWasMade = [true, true];
                }
                else
                {
                    //Only deselect clicked on spot
                    var selectedMonPos = this.state.selectedMonPos;
                    var multiMoveError = this.state.multiMoveError;
                    selectedMonPos[multiTo] = CreateSingleBlankSelectedPos();
                    multiMoveError[multiTo] = true;
                    this.setState({selectedMonPos: selectedMonPos, multiMoveError: multiMoveError});
                    return;
                }
            }
        }

        this.setState({
            selectedMonPos: this.generateBlankSelectedPos(),
            saveBoxes: saveBoxes,
            homeBoxes: homeBoxes,
            changeWasMade: changeWasMade,
            multiMoveError: [false, false],
        })
    }

    swapDraggingBoxPokemon()
    {
        var boxes1 = this.getBoxesByBoxType(this.state.draggingFromBox);
        var boxes2 = this.getBoxesByBoxType(this.state.draggingToBox);
        var offset1 = this.state.draggingMon;
        var offset2 = this.state.draggingOver;
        var selectedMonPos = this.state.selectedMonPos;
        var viewingMon = this.state.viewingMon;
        var changeWasMade = this.state.changeWasMade;

        if (offset1 >= 0 && offset2 >= 0
        && (this.state.draggingFromBox !== this.state.draggingToBox || offset1 !== offset2)) //Make sure different Pokemon are being swapped
        {
            this.swapBoxedPokemon(boxes1, boxes2, offset1, offset2);
            selectedMonPos = this.generateBlankSelectedPos(); //Only remove if swap was made
            viewingMon = [null, null];
            changeWasMade[this.state.draggingFromBox] = true;
            changeWasMade[this.state.draggingToBox] = true;
        }

        this.setState({
            draggingMon: -1,
            draggingImg: "",
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
            changeWasMade: changeWasMade,
            multiMoveError: [false, false],
            saveBoxes: (this.state.draggingFromBox === BOX_SAVE) ? boxes1 : (this.state.draggingToBox === BOX_SAVE) ? boxes2 : this.state.saveBoxes,
            homeBoxes: (this.state.draggingFromBox === BOX_HOME) ? boxes1 : (this.state.draggingToBox === BOX_HOME) ? boxes2 : this.state.homeBoxes,
        })
    }

    releaseSelectedPokemon(boxType)
    {
        var boxes = this.getBoxesByBoxType(boxType);
        var selectedMonPos = this.state.selectedMonPos;
        var viewingMon = this.state.viewingMon;
        var changeWasMade = this.state.changeWasMade;
        viewingMon[boxType] = null;

        if (this.state.selectedMonBox[boxType] >= 0
        && this.state.selectedMonBox[boxType] <= HIGHEST_SAVE_BOX_NUM)
        {
            var startIndex = this.state.selectedMonBox[boxType] * MONS_PER_BOX;

            for (let i = 0; i < MONS_PER_BOX; ++i)
            {
                if (this.state.selectedMonPos[boxType][i])
                {
                    let offset =  startIndex + i;
                    boxes[offset] = this.generateBlankMonObject();
                    changeWasMade[boxType] = true;
                }
            }
        }

        selectedMonPos[boxType] = CreateSingleBlankSelectedPos();

        this.setState({
            saveBoxes: (boxType === BOX_SAVE) ? boxes : this.state.saveBoxes,
            homeBoxes: (boxType === BOX_HOME) ? boxes : this.state.homeBoxes,
            selectedMonPos: selectedMonPos,
            viewingMon: viewingMon,
            changeWasMade: changeWasMade,
            multiMoveError: [false, false],
        })
    }

    async fixLivingDex(speciesList)
    {
        var newBoxes = this.generateBlankHomeBoxes();
        var speciesIndexDict = {};
        var freeSlot = speciesList.length;

        for (let i = 0; i < speciesList.length; ++i)
            speciesIndexDict[speciesList[i]] = i;

        for (let pokemon of this.state.homeBoxes)
        {
            let species = pokemon["species"];
            if (species in speciesIndexDict)
            {
                let index = speciesIndexDict[species];
                if (newBoxes[index]["species"] === "") //Free spot
                    newBoxes[index] = pokemon;
                else
                    newBoxes[freeSlot] = pokemon;
            }
            else
                newBoxes[freeSlot] = pokemon;

            ++freeSlot;
            if (freeSlot >= newBoxes.length)
                freeSlot = 0;

            while (newBoxes[freeSlot]["species"] !== ""
            && newBoxes[freeSlot]["species"] !== 0
            && newBoxes[freeSlot]["species"] !== "SPECIES_NONE")
                ++freeSlot; //Increment until a free slot is found
        }

        this.state.homeBoxes = newBoxes;
        return newBoxes;
    }

    generateBlankSelectedPos()
    {
        return [CreateSingleBlankSelectedPos(), CreateSingleBlankSelectedPos()];
    }

    generateBlankMonObject()
    {
        var blankObject = Object.assign({}, SaveData["boxes"][0]);
        for (let key of Object.keys(blankObject))
        {
            if (typeof(blankObject[key]) == "string")
                blankObject[key] = "";
            else if (typeof(blankObject[key]) == "number")
                blankObject[key] = 0;
            else
                blankObject[key] = null;
        }
        
        return blankObject;
    }

    generateBlankHomeBoxes()
    {
        var blankObject = this.generateBlankMonObject();

        var homeBoxes = []
        for (let i = 1; i <= HIGHEST_HOME_BOX_NUM + 1; ++i)
        {
            for (let j = 1; j <= 30; ++j)
                homeBoxes.push(Object.assign({}, blankObject))
        }

        return homeBoxes;
    }

    generateBlankHomeTitles()
    {
        var titles = [];

        for (let i = 1; i <= HIGHEST_HOME_BOX_NUM + 1; ++i)
            titles.push("Home " + i);

        return titles;
    }

    async downloadSaveFileAndHomeData()
    {
        var route = `${config.dev_server}/getUpdatedSaveFile`;
        var homeData = JSON.stringify({
            titles: this.state.homeTitles,
            boxes: this.state.homeBoxes,
        });
    
        const formData = new FormData(); //formData contains the image to be uploaded
        formData.append("newBoxes", JSON.stringify(this.state.saveBoxes));
        formData.append("saveFileData", JSON.stringify(this.state.saveFileData["data"]));
        formData.append("fileIdNumber", JSON.stringify(this.state.saveFileNumber));
        formData.append("homeData", homeData);

        await axios.post(route, formData,
        {
        })
        .then(res =>
        {
            var name;
            var dataBuffer = res.data.newSaveFileData;
            var encryptedHomeData = res.data.newHomeData;

            if (this.state.selectedSaveFile === null)
                name = "savefile.sav";
            else
                name = this.state.selectedSaveFile.name; //Same name as original file

            var output = []
            for (let byte of dataBuffer["data"])
            {
                let newArray = new Uint8Array(1);
                newArray[0] = byte;
                output.push(newArray);
            }

            //Download the Save File
            var element = document.createElement("a");
            var file = new Blob(output, {type: 'application/octet-stream'});
            element.href = URL.createObjectURL(file);
            element.download = name;
            document.body.appendChild(element); //Required for this to work in FireFox
            element.click();

            //Download the Home Data
            element = document.createElement("a");
            file = new Blob([encryptedHomeData], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = "home.dat";
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
        });
    }

    async saveAndExit()
    {
        await this.downloadSaveFileAndHomeData();
    }

    changeBoxView(newState)
    {
        this.setState({
            editState: newState,
            selectedMonBox: [0, 0],
            selectedMonPos: this.generateBlankSelectedPos(),
            viewingMon: [null, null],
            viewingBoxList: -1,
            draggingMon: -1,
            multiMoveError: [false, false],
        });
    }

    moveDraggingMonIcon(e)
    {
        let icon = document.getElementById('moving-icon');
        if (icon !== null)
        {
            icon.style.visibility = "initial";
            icon.style.left = e.pageX - (68 / 2) + 'px'; //Follow the mouse
            icon.style.top = e.pageY - (56 / 2) + 'px';
        }
    }

    moveDraggingMonIconTouch(e)
    {
        let icon = document.getElementById('moving-icon');
        let x = e.touches[0].pageX;
        let y = e.touches[0].pageY;

        //Update icon coordinates
        if (icon !== null)
        {
            icon.style.visibility = "initial";
            icon.style.left = x - (68 / 2) + 'px'; //Follow the finger
            icon.style.top = y - (56 / 2) + 'px';
        }

        //Update hovering over
        var element = document.elementFromPoint(x, y);
        if (element !== null && element.className !== undefined && !element.className.includes("box-icon"))
            this.setState({draggingOver: -1}); //No longer dragging over box cell
    }

    handleReleaseDragging()
    {
        if (this.state.draggingMon !== -1) //Actually dragging
            this.swapDraggingBoxPokemon(); //Also releases the dragging
    }

    editOnlyHomePokemonButton()
    {
        return (
            <Button size="lg" className="top-bar-button" onClick={() => this.changeBoxView(STATE_EDITING_HOME_BOXES)}>
                <FaHome size={42} /> ↔ <FaHome size={42} />
            </Button>
        );
    }

    editOnlySavePokemonButton()
    {
        return (
            <Button size="lg" className="top-bar-button" onClick={() => this.changeBoxView(STATE_EDITING_SAVE_FILE)}>
                <FaGamepad size={42} /> ↔ <FaGamepad size={42} />
            </Button>
        );
    }

    transferPokemonButton()
    {
        return (
            <Button size="lg" className="top-bar-button" onClick={() => this.changeBoxView(STATE_MOVING_POKEMON)}>
                <FaHome size={42} /> ↔ <FaGamepad size={42} />
            </Button>
        );
    }

    boxListScreen()
    {
        return (
            <BoxList boxes={this.state.viewingBoxList === BOX_HOME ? this.state.homeBoxes : this.state.saveBoxes}
                     titles={this.state.viewingBoxList === BOX_HOME ? this.state.homeTitles : this.state.saveTitles}
                     boxCount={this.state.viewingBoxList === BOX_HOME ? HIGHEST_HOME_BOX_NUM + 1 : HIGHEST_SAVE_BOX_NUM + 1}
                     currentBoxes={this.state.currentBox} boxType={this.state.viewingBoxList}
                     selectedMonPos={this.state.selectedMonPos} viewingMon={this.state.viewingMon}
                     searchCriteria={this.state.searchCriteria[this.state.viewingBoxList]} updateParentState={this.updateState}/>
        );
    }

    printUploadSaveFile()
    {
        return (
            <div className="main-page-upload-instructions">
                <h2>Upload your save file.</h2>
                <h3>It should be a file ending with .sav</h3>
                <label className="btn btn-primary btn-lg">
                    Choose File
                    <input type="file" hidden onChange={(e) => this.chooseSaveFile(e)} />
                </label>

                {
                    this.state.selectedSaveFile !== null
                        ? <p>{this.state.selectedSaveFile.name}</p>
                    :
                        ""
                }

                {
                    this.state.selectedSaveFile !== null
                        ? <Button size="lg" onClick={this.handleUpload.bind(this, true)}>Upload</Button>
                        : ""
                }

                {
                    this.state.fileUploadError
                    ? <div>
                        <p>There was a problem with the save file chosen.</p>
                        <p>Please make sure it was a correct 128 kb save file with no corruption.</p>
                    </div>
                    :
                        ""
                }
            </div>
        )
    }

    printUploadingSaveFile()
    {
        return (
            <div className="main-page-upload-instructions">
                Uploading {this.state.uploadProgress}
            </div>
        )
    }

    printUploadHomeFile()
    {
        return (
            <div className="main-page-upload-instructions">
                <h2>Upload your home data.</h2>
                <h3>It should be a file called home.dat</h3>
                <div>
                    <label className="btn btn-primary btn-lg choose-file-label-button">
                        Choose File
                        <input type="file" hidden onChange={(e) => this.chooseHomeFile(e)} />
                    </label>
                    
                    <Button size="lg" onClick={() => this.setState({editState: STATE_CHOOSE_FUNCTION})}
                            className="main-page-home-create-new-button">
                        Create New
                    </Button>
                </div>

                {
                    this.state.selectedHomeFile !== null
                        ? <p>{this.state.selectedHomeFile.name}</p>
                    :
                        ""
                }

                {
                    this.state.selectedHomeFile !== null
                        ? <Button size="lg" onClick={this.handleUpload.bind(this, false)}>Upload</Button>
                        : ""
                }

                {
                    this.state.fileUploadError
                    ? <div>
                        <p>There was a problem with the data file chosen.</p>
                        <p>Please make sure it was a correct data file with no corruption.</p>
                    </div>
                    :
                        ""
                }
            </div>
        )
    }

    printUploadingHomeFile()
    {
        return (
            <div className="main-page-upload-instructions">
                Uploading {this.state.uploadProgress}
            </div>
        )
    }

    printChooseFunction()
    {
        return (
            <div className="main-page-choice-buttons">
                {this.editOnlyHomePokemonButton()}
                {this.editOnlySavePokemonButton()}
                {this.transferPokemonButton()}
            </div>
        )
    }

    printEditingHomeBoxes()
    {
        var homeBoxView1 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                   parent={this} boxType={BOX_HOME}
                                   key={BOX_HOME + 3}/>; //The +3 forces a rerender by assigning a new key
        var homeBoxView2 = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                    parent={this} boxType={BOX_HOME}
                                    key={BOX_HOME + 4}/>; //The +4 forces a rerender by assigning a new key

        return (
            <div>         
                <div className="top-bar-buttons">
                    {this.transferPokemonButton()}
                    {this.editOnlySavePokemonButton()}
                </div>

            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <div className={!isMobile ? "scroll-container" : ""}>
                        <div className={isMobile ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView1}
                                {homeBoxView2}
                        </div>
                    </div>
            }
            </div>
        )
    }

    printEditingSaveBoxes()
    {
        var saveBoxView1 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                   parent={this} boxType={BOX_SAVE}
                                   key={BOX_SAVE + 5}/>; //The +5 forces a rerender by assigning a new key
        var saveBoxView2 = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                    parent={this} boxType={BOX_SAVE}
                                    key={BOX_SAVE + 6}/>; //The +6 forces a rerender by assigning a new key

        return (
            <div>                
                <div className="top-bar-buttons">
                    {this.editOnlyHomePokemonButton()}
                    {this.transferPokemonButton()}
                </div>

            {
                this.state.viewingBoxList >= 0 ?
                    this.boxListScreen()
                :
                    <div className={!isMobile ? "scroll-container" : ""}>
                        <div className={isMobile ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {saveBoxView1}
                                {saveBoxView2}
                        </div>
                    </div>
            }
            </div>
        )
    }

    printMovingPokemon()
    {
        var homeBoxView = <BoxView pokemonJSON={this.state.homeBoxes} titles={this.state.homeTitles}
                                   parent={this} boxType={BOX_HOME}
                                   key={BOX_HOME}/>;
        var saveBoxView = <BoxView pokemonJSON={this.state.saveBoxes} titles={this.state.saveTitles}
                                   parent={this} boxType={BOX_SAVE}
                                   key={BOX_SAVE}/>;
 
        return (
            <div>
                <div className="top-bar-buttons">
                    {this.editOnlyHomePokemonButton()}
                    {this.editOnlySavePokemonButton()}
                </div>

                {
                    this.state.viewingBoxList >= 0 ?
                        this.boxListScreen()
                    :
                        <div className={!isMobile ? "scroll-container" : ""}>
                            <div className={isMobile ? "main-page-boxes-mobile" : "main-page-boxes"}>
                                {homeBoxView}
                                {saveBoxView}
                            </div>
                        </div>
                }
            </div>
        )
    }

    /*
        Prints main page.
    */
    render()
    {
        var title = <h1 className="main-page-title">Unbound Home</h1>;
        var page, draggingImg;

        switch (this.state.editState)
        {
            case STATE_UPLOAD_SAVE:
                page = this.printUploadSaveFile();
                break;
            case STATE_UPLOADING_SAVE_FILE:
                page = this.printUploadingSaveFile();
                break;
            case STATE_UPLOAD_HOME_FILE:
                page = this.printUploadHomeFile();
                break;
            case STATE_UPLOADING_HOME_FILE:
                page = this.printUploadingHomeFile();
                break;
            case STATE_CHOOSE_FUNCTION:
                page = this.printChooseFunction();
                break;
            case STATE_EDITING_HOME_BOXES:
                title = ""; //Don't display title
                page = this.printEditingHomeBoxes();
                break;
            case STATE_EDITING_SAVE_FILE:
                title = ""; //Don't display title
                page = this.printEditingSaveBoxes();
                break;
            case STATE_MOVING_POKEMON:
                title = ""; //Don't display title
                page = this.printMovingPokemon();
                break;
            default:
                page = "";
                break;
        }

        draggingImg = ""
        if (this.state.draggingImg !== "")
            draggingImg = <img src={this.state.draggingImg} alt={this.getMonAtBoxPos(this.state.draggingFromBox, this.state.draggingMon)["species"]}
                               onMouseDown={(e) => e.preventDefault()} id="moving-icon" className="dragging-image"/>;

        return (
            <div style={{minWidth: "428px"}}
                         onMouseMove={(e) => this.moveDraggingMonIcon(e)}
                         onMouseUp={() => this.handleReleaseDragging()}>
                {title}
                {page}
                {draggingImg}
            </div>
        )
    }
}
