const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const util = require('../util');
const {gTestPokemon, gTestBlankPokemon, gTestPokemonStringified} = require('./data');
const gSpeciesNames = require('../src/data/SpeciesNames.json');


describe("Test toUnicode", () =>
{
    it(`should be hello for hello`, () =>
    {
        expect(util.toUnicode("hello")).to.equal("hello");
    });

    it(`should be Nidoran\\u25b6 for Nidoran▶`, () =>
    {
        expect(util.toUnicode("Nidoran▶")).to.equal("Nidoran\\u25b6");
    });

    it(`should be Flab\\u00e9b\\u00e9 for Flabébé`, () =>
    {
        expect(util.toUnicode("Flabébé")).to.equal("Flab\\u00e9b\\u00e9");
    });
});


describe("Test PythonJSONStringify", () =>
{
    it (`should add whitespace after :`, () =>
    {
        let object = {"Hello": "World"};
        let expected = `{"Hello": "World"}`;
        let stringified = util.PythonJSONStringify(object);
        expect(stringified).to.equal(expected);
    });

    it (`should add whitespace between array arguments`, () =>
    {
        let object = {"Hello": [0, 1, 2, 3, 4]};
        let expected = `{"Hello": [0, 1, 2, 3, 4]}`;
        let stringified = util.PythonJSONStringify(object);
        expect(stringified).to.equal(expected);
    });

    it (`should add whitespace between object entries`, () =>
    {
        let object = {"Hello": {0: 1, 2: 3, 4: 5}};
        let expected = `{"Hello": {"0": 1, "2": 3, "4": 5}}`;
        let stringified = util.PythonJSONStringify(object);
        expect(stringified).to.equal(expected);
    });

    it (`should convert a whole pokemon`, () =>
    {
        let stringified = util.PythonJSONStringify(gTestPokemon);
        expect(stringified).to.eql(gTestPokemonStringified);
    });
});


describe("Test BadWordInText", () =>
{
    it (`should be true for whole word "faggot"`, () =>
    {
        let word = "faggot";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for whole word "FAGGOT"`, () =>
    {
        let word = "FAGGOT";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for contained word "afaggot"`, () =>
    {
        let word = "afaggot";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for contained word "AFAGGOT"`, () =>
    {
        let word = "afaggot";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for contained word "AFA GGOT"`, () =>
    {
        let word = "afa ggot";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be false for contained word "fag"`, () =>
    {
        let word = "Cofagrigus";
        expect(util.BadWordInText(word)).to.be.false;
    });

    it (`should be false for contained word "FAG"`, () =>
    {
        let word = "COFAGRIGUS";
        expect(util.BadWordInText(word)).to.be.false;
    });

    it (`should be true for whole word "fag"`, () =>
    {
        let word = "fag";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for whole word "ń!ggerfàg"`, () =>
    {
        let word = "ń!ggerfàg";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for whole word "ń¡ggerfàg"`, () =>
    {
        let word = "ń¡ggerfàg";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for whole word "ń1gg3rfàg"`, () =>
    {
        let word = "ń1gg3rfàg";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for discord link .gg/`, () =>
    {
        let word = ".gg/hi";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for discord link variation .gg`, () =>
    {
        let word = ".gghi";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for discord link variation gg/`, () =>
    {
        let word = "gg/hi";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be true for discord link variation g/`, () =>
    {
        let word = "g/hi";
        expect(util.BadWordInText(word)).to.be.true;
    });

    it (`should be false for every species name`, () =>
    {
        for (let species of Object.keys(gSpeciesNames))
            expect(util.BadWordInText(gSpeciesNames[species])).to.be.false;
    });
});


describe("Test HasNonNicknameCharacter", () =>
{
    it (`should be okay for "Bulbasaur"`, () =>
    {
        let name = "Bulbasaur";
        expect(util.HasNonNicknameCharacter(name)).to.be.false;
    });

    it (`should be okay for "Flabébé"`, () =>
    {
        let name = "Flabébé";
        expect(util.HasNonNicknameCharacter(name)).to.be.false;
    });

    it (`should be okay for "The Man"`, () =>
    {
        let name = "The Man";
        expect(util.HasNonNicknameCharacter(name)).to.be.false;
    });

    it (`should not be okay for "|"`, () =>
    {
        let name = "|";
        expect(util.HasNonNicknameCharacter(name)).to.be.true;
    });

    it (`should not be okay for "Á"`, () =>
    {
        let name = "Á";
        expect(util.HasNonNicknameCharacter(name)).to.be.true;
    });

    it (`should not be okay for "ab+cd"`, () =>
    {
        let name = "ab+cd";
        expect(util.HasNonNicknameCharacter(name)).to.be.true;
    });
});


describe("Test GetSpeciesName", () =>
{
    it (`should be "Bulbasaur" for "SPECIES_BULBASAUR"`, () =>
    {
        let species = "SPECIES_BULBASAUR";
        let expectedName = "Bulbasaur";
        expect(util.GetSpeciesName(species)).to.equal(expectedName);
    });

    it (`should be "Enamorus" for "SPECIES_ENAMORUS_THERIAN"`, () =>
    {
        let species = "SPECIES_ENAMORUS_THERIAN";
        let expectedName = "Enamorus";
        expect(util.GetSpeciesName(species)).to.equal(expectedName);
    });

    it (`should be "Enamorus-Therian" for "SPECIES_ENAMORUS_THERIAN" when using alt species names`, () =>
    {
        let species = "SPECIES_ENAMORUS_THERIAN";
        let expectedName = "Enamorus-Therian";
        expect(util.GetSpeciesName(species, true)).to.equal(expectedName);
    });
    
    it (`should be "Unknown Species" for "SPECIES_FAKE"`, () =>
    {
        let species = "SPECIES_FAKE";
        let expectedName = "Unknown Species";
        expect(util.GetSpeciesName(species)).to.equal(expectedName);
    });

    it (`should be "Unknown Species" for 5`, () =>
    {
        let species = 5;
        let expectedName = "Unknown Species";
        expect(util.GetSpeciesName(species)).to.equal(expectedName);
    });
});


describe("Test IsValidEmail", () =>
{
    it (`should be true for test@gmail.com`, () =>
    {
        expect(util.IsValidEmail("test@gmail.com")).to.be.true;
    });

    it (`should be true for scsdx@dsxs.co.ze`, () =>
    {
        expect(util.IsValidEmail("scsdx@dsxs.co.ze")).to.be.true;
    });

    it (`should be false for blah`, () =>
    {
        expect(util.IsValidEmail("blah")).to.be.false;
    });

    it (`should be false for null`, () =>
    {
        expect(util.IsValidEmail(null)).to.be.false;
    });

    it (`should be false for 5`, () =>
    {
        expect(util.IsValidEmail(5)).to.be.false;
    });
});


describe("Test IsValidUsername", () =>
{
    it (`should be true for Skeli789`, () =>
    {
        expect(util.IsValidUsername("Skeli789")).to.be.true;
    });

    it (`should be true for abcdefghijklmnopqrst`, () =>
    {
        expect(util.IsValidUsername("abcdefghijklmnopqrst")).to.be.true;
    });

    it (`should be true for uvwxyz!@#$%^&*()_-+=`, () =>
    {
        expect(util.IsValidUsername("uvwxyz!@#$%^&*()_-+=")).to.be.true;
    });

    it (`should be true for 3 chracters exactly`, () =>
    {
        expect(util.IsValidUsername("bla")).to.be.true;
    });

    it (`should be true for 20 characters exactly`, () =>
    {
        expect(util.IsValidUsername("12345678901234567890")).to.be.true;
    });

    it (`should be false for 2 chracters exactly`, () =>
    {
        expect(util.IsValidUsername("bl")).to.be.false;
    });

    it (`should be true for over 20 characters`, () =>
    {
        expect(util.IsValidUsername("123456789012345678901")).to.be.false;
    });

    it (`should be false with quotation mark in the name`, () =>
    {
        expect(util.IsValidUsername(`hell"o`)).to.be.false;
    });

    it (`should be false with apostrophe in the name`, () =>
    {
        expect(util.IsValidUsername(`hell'o`)).to.be.false;
    });

    it (`should be false with back tick in the name`, () =>
    {
        expect(util.IsValidUsername("hell`o")).to.be.false;
    });

    it (`should be false with emoji in the name`, () =>
    {
        expect(util.IsValidUsername("hell😊o")).to.be.false;
    });

    it (`should be false with left angle bracket in the name`, () =>
    {
        expect(util.IsValidUsername("<hello")).to.be.false;
    });

    it (`should be false with right angle bracket in the name`, () =>
    {
        expect(util.IsValidUsername("hello>")).to.be.false;
    });

    it (`should be false for null`, () =>
    {
        expect(util.IsValidUsername(null)).to.be.false;
    });

    it (`should be false for empty string`, () =>
    {
        expect(util.IsValidUsername("")).to.be.false;
    });

    it (`should be false for number`, () =>
    {
        expect(util.IsValidUsername(5)).to.be.false;
    });
});


describe("Test IsValidPassword", () =>
{
    it (`should be true for blahblah`, () =>
    {
        expect(util.IsValidPassword("blahblah")).to.be.true;
    });

    it (`should be false for blah`, () =>
    {
        expect(util.IsValidPassword("blah")).to.be.false;
    });

    it (`should be false for 123456789123456789123`, () =>
    {
        expect(util.IsValidPassword("123456789123456789123")).to.be.false;
    });

    it (`should be false for null`, () =>
    {
        expect(util.IsValidPassword(null)).to.be.false;
    });

    it (`should be false for 5`, () =>
    {
        expect(util.IsValidPassword(5)).to.be.false;
    });
});


describe("Test ValidateCloudBoxes", () =>
{
    it (`should be true for all_pokemon.json`, () =>
    {
        var data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon.json")));
        expect(util.ValidateCloudBoxes(data)).to.be.true;
    });

    it (`should be false for all_pokemon.json with mismatched checksum`, () =>
    {
        var data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon.json")));
        data[50].species += "a";
        expect(util.ValidateCloudBoxes(data)).to.be.false;
    });

    it (`should be true for all blank Pokemon`, () =>
    {
        var data = [];
        for (let i = 0; i < 3000; ++i)
            data.push(gTestBlankPokemon);
        expect(util.ValidateCloudBoxes(data)).to.be.true;
    });

    it (`should be true for the Pokemon limit`, () =>
    {
        var data = [];
        for (let i = 0; i < 3000; ++i)
            data.push(gTestPokemon);
        expect(util.ValidateCloudBoxes(data)).to.be.true;
    });

    it (`should be false for too many Pokemon`, () =>
    {
        var data = [];
        for (let i = 0; i < 3001; ++i)
            data.push(gTestPokemon);
        expect(util.ValidateCloudBoxes(data)).to.be.false;
    });

    it (`should be false for null`, () =>
    {
        expect(util.ValidateCloudBoxes(null)).to.be.false;
    });

    it (`should be false for string`, () =>
    {
        expect(util.ValidateCloudBoxes("hello")).to.be.false;
    });

    it (`should be false for number`, () =>
    {
        expect(util.ValidateCloudBoxes(5)).to.be.false;
    });

    it (`should be true for U.Flame's Boxes`, () => //Used to fail because of bad character encodings
    {
        var data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/brony_cloud.dat")));
        expect(util.ValidateCloudBoxes(data["boxes"])).to.be.true;
    })
});

describe("Test ValidateCloudTitles", () =>
{
    it (`should be true for all_pokemon_titles.json`, () =>
    {
        var data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon_titles.json")));
        expect(util.ValidateCloudTitles(data)).to.be.true;
    });

    it (`should be false for null`, () =>
    {
        expect(util.ValidateCloudTitles(null)).to.be.false;
    });

    it (`should be false for string`, () =>
    {
        expect(util.ValidateCloudTitles("hello")).to.be.false;
    });

    it (`should be false for number`, () =>
    {
        expect(util.ValidateCloudTitles(5)).to.be.false;
    });

    it (`should be false for list of number`, () =>
    {
        expect(util.ValidateCloudTitles([5])).to.be.false;
    });

    it (`should be false for list of empty string`, () =>
    {
        expect(util.ValidateCloudTitles([""])).to.be.false;
    });

    it (`should be false for list of super long titles`, () =>
    {
        expect(util.ValidateCloudTitles(["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"])).to.be.false;
    });
});
