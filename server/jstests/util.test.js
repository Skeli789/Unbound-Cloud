const expect = require('chai').expect;
const util = require('../util');
const {gTestPokemon, gTestPokemonStringified} = require('./data');
const gSpeciesNames = require('../src/data/SpeciesNames.json');


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

    it (`should be false for every species name`, () =>
    {
        for (let species of Object.keys(gSpeciesNames))
            expect(util.BadWordInText(gSpeciesNames[species])).to.be.false;
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
