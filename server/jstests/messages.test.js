const expect = require('chai').expect;
const messages = require('../messages');

const gTestEmail = "pokemonunboundteam@gmail.com"


describe("Test SendEmail", () =>
{
    it("should send successfully", async () =>
    {
        let res = await messages.SendEmail(gTestEmail, "NodeJS Test Email", "This a unit test email.");
        expect(res).to.be.true;
    });

    it("should not send successfully to null", async () =>
    {
        let res = await messages.SendEmail(null, "NodeJS Test Email", "This a unit test email.");
        expect(res).to.be.false;
    });
});
