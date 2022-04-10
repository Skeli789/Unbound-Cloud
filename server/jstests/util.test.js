const expect = require('chai').expect;
const {gTestPokemon, gTestPokemon2, gTestPokemonStringified} = require('./data.js');
const util = require('../util');


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
        expect(stringified).to.equal(gTestPokemonStringified);
    });
});


describe("Test CalculateMonChecksum", () =>
{
    it(`should be ${gTestPokemon.checksum} for gTestPokemon`, () =>
    {
        let checksum = util.CalculateMonChecksum(gTestPokemon);
        expect(checksum).to.equal(gTestPokemon.checksum);
    });

    it(`should be ${gTestPokemon2.checksum} for gTestPokemon2`, () =>
    {
        let checksum = util.CalculateMonChecksum(gTestPokemon2);
        expect(checksum).to.equal(gTestPokemon2.checksum);
    });

    it(`should be unchanged with modified markings`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        pokemon.markings[0] = true;
        let checksum = util.CalculateMonChecksum(pokemon);
        expect(checksum).to.equal(gTestPokemon.checksum);
    });

    it(`should be unchanged with a modified checksum`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon2);
        pokemon.checksum = "blash";
        let checksum = util.CalculateMonChecksum(pokemon);
        expect(checksum).to.equal(gTestPokemon2.checksum);
    });

    it(`should be the same for similar objects`, () =>
    {
        let pokemon1 = {"species": "SPECIES_BULBASAUR", "personality": 12345678}
        let pokemon2 = {"personality": 12345678, "species": "SPECIES_BULBASAUR"}
        let checksum1 = util.CalculateMonChecksum(pokemon1);
        let checksum2 = util.CalculateMonChecksum(pokemon2);
        expect(checksum1).to.equal(checksum2);
    });
});


describe("Test ValidatePokemon", () =>
{
    it(`should be valid for gTestPokemon`, () =>
    {
        expect(util.ValidatePokemon(gTestPokemon, false)).to.be.true;
    });

    it(`should be valid for gTestPokemon2`, () =>
    {
        expect(util.ValidatePokemon(gTestPokemon2, false)).to.be.true;
    });

    it(`should not be valid for a missing checksum`, () =>
    {
        let pokemon = Object.assign({}, gTestPokemon);
        delete pokemon.checksum;
        expect(util.ValidatePokemon(pokemon, false)).to.be.false;
    });

    it(`should be valid for null Pokemon`, () =>
    {
        expect(util.ValidatePokemon(null, true)).to.be.true;
    });

    it(`should be invalid for null Pokemon`, () =>
    {
        expect(util.ValidatePokemon(null, false)).to.be.false;
    });
});
