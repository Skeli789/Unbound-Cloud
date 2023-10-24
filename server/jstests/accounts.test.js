const chai = require('chai');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');
const accounts = require('../accounts');
chai.use(require('chai-string'));
chai.use(require('chai-as-promised'));

const gTestUser = "TestUser";
const gTestUser2 = "TestUser2";
const gTestUserProfanity = "coon";
const gTestEmail = "test@gmail.com";
const gTestEmail2 = "other@gmail.com";
const gTestPassword = "blahblah";
const gTestPassword2 = "glahflah";

const sleep = ms => new Promise(res => setTimeout(res, ms));

before(async function()
{
    await ClearTestDatabase();
});

async function ClearTestDatabase()
{
    //Remove the cloud data directory
    var cloudDir = process.env.APPDATA + "/unboundcloud";
    if (fs.existsSync(cloudDir))
        fs.rmdirSync(cloudDir, {recursive: true, force: true});
}


describe("Test LockDB and UnlockDB", async () =>
{
    const testUserName = gTestUser;

    it (`LockDB should lock the database`, async () =>
    {
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.false;
        await accounts.LockAccountDB(testUserName);
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.true;
    });

    it (`UnlockDB should unlock the database`, async () =>
    {
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.true;
        await accounts.UnlockAccountDB(testUserName);
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.false;
    });

    it (`Two LockDB's should cause the second one to pause until the database is unlocked`, async () =>
    {
        //Lock the DB
        await accounts.LockAccountDB(testUserName);
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.true;
        console.log(`Locked Users After 1st Lock: [${accounts.GetLockedUsers()}]`);

        //Create a promise to unlock the DB after half a second
        const waitAndUnlock = async () =>
        {
            await sleep(200);
            await accounts.UnlockAccountDB(testUserName);
            console.log(`Locked Users After 1st Unlock: [${accounts.GetLockedUsers()}]`);
        };
        waitAndUnlock();

        //Lock the DB again. Should pause until the DB is unlocked
        timeStart = Date.now();
        await accounts.LockAccountDB(testUserName);
        console.log(`Locked Users After 2nd Lock: [${accounts.GetLockedUsers()}]`);
        timeEnd = Date.now();
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.true;
        expect(timeEnd - timeStart).to.be.greaterThanOrEqual(200);

        //Unlock the DB and make sure it stays unlocked
        await accounts.UnlockAccountDB(testUserName);
        console.log(`Locked Users After 2nd Unlock: [${accounts.GetLockedUsers()}]`);
        new Promise(r => setTimeout(r, 200))
        expect(accounts.IsAccountDBLocked(testUserName)).to.be.false;
    });
});


describe("Test UserToAccountFile", () =>
{
    it (`should end in unboundcloud/accounts/user_${gTestUser.toLocaleLowerCase()}.json`, () =>
    {
        expect(accounts.UserToAccountFile(gTestUser)).to.endsWith(`unboundcloud/accounts/user_${gTestUser.toLowerCase()}.json`);
    });
});


describe("Test EncryptPassword & ValidatePassword", () =>
{   
    it('should be returning different text', async () =>
    {
        let encryptedPassword = await accounts.EncryptPassword("password");
        expect(encryptedPassword).to.not.equal("password");
    });

    it('should match "password" to "password"', async () =>
    {
        let encryptedPassword = await accounts.EncryptPassword("password");
        let isValid = await accounts.ValidatePassword("password", encryptedPassword);
        expect(isValid).to.be.true;
    });

    it('should not match "password" to "passworda"', async () =>
    {
        let encryptedPassword = await accounts.EncryptPassword("password");
        let isValid = await accounts.ValidatePassword("passworda", encryptedPassword);
        expect(isValid).to.be.false;
    });

    it('should not match when password is null"', async () =>
    {
        expect(await accounts.ValidatePassword(null, "")).to.be.false;
    });

    it('should not match when encyrptedPassword is null"', async () =>
    {
        expect(await accounts.ValidatePassword("", null)).to.be.false;
    });
});


describe("Test EmailToUsernameTableExists & EmailExists & GetContentsOfEmailToUsernameTable & AddEmailUsernamePairToTable & RemoveEmailUsernamePairFromTable", async () =>
{
    it (`email to username table should not exist`, () =>
    {
        expect(accounts.EmailToUsernameTableExists()).to.be.false;
    });

    it (`contents of table should be empty`, () =>
    {
        expect(Object.keys(accounts.GetContentsOfEmailToUsernameTable()).length).to.equal(0);
    });

    it (`EmailExists should return false`, () =>
    {
        expect(accounts.EmailExists(gTestEmail)).to.be.false;
    });

    it (`removing email should do nothing`, async () =>
    {
        await accounts.RemoveEmailUsernamePairFromTable(gTestEmail);
        expect(Object.keys(accounts.GetContentsOfEmailToUsernameTable()).length).to.equal(0);
    });

    it (`contents of table should be updated after adding pair`, async () =>
    {
        await accounts.AddEmailUsernamePairToTable(gTestEmail, gTestUser);
        var expected = {};
        expected[gTestEmail] = gTestUser;
        expect(accounts.GetContentsOfEmailToUsernameTable()).to.eql(expected);
    });

    it (`EmailExists should return true for ${gTestEmail}`, () =>
    {
        expect(accounts.EmailExists(gTestEmail)).to.be.true;
    });

    it (`EmailToUsername should return ${gTestUser} for ${gTestEmail}`, () =>
    {
        expect(accounts.EmailToUsername(gTestEmail)).to.be.equal(gTestUser);
    });

    it (`EmailExists should return false for ${gTestEmail2}`, () =>
    {
        expect(accounts.EmailExists(gTestEmail2)).to.be.false;
    });

    it (`EmailToUsername should return empty string for ${gTestEmail2}`, () =>
    {
        expect(accounts.EmailToUsername(gTestEmail2)).to.be.equal("");
    });

    it (`contents of table should be updated after adding second pair`, async () =>
    {
        await accounts.AddEmailUsernamePairToTable(gTestEmail2, gTestUser2);
        var expected = {};
        expected[gTestEmail] = gTestUser;
        expected[gTestEmail2] = gTestUser2;
        expect(accounts.GetContentsOfEmailToUsernameTable()).to.eql(expected);
    });

    it (`removing ${gTestEmail} should only leave one other pair`, async () =>
    {
        await accounts.RemoveEmailUsernamePairFromTable(gTestEmail);
        var expected = {};
        expected[gTestEmail2] = gTestUser2;
        expect(accounts.GetContentsOfEmailToUsernameTable()).to.eql(expected);
    });
    
    it (`EmailExists should return false for ${gTestEmail}`, () =>
    {
        expect(accounts.EmailExists(gTestEmail)).to.be.false;
    });

    it (`EmailExists should return true for ${gTestEmail2}`, () =>
    {
        expect(accounts.EmailExists(gTestEmail2)).to.be.true;
    });

    it (`removing ${gTestEmail} again should do nothing`, async () =>
    {
        await accounts.RemoveEmailUsernamePairFromTable(gTestEmail);
        var expected = {};
        expected[gTestEmail2] = gTestUser2;
        expect(accounts.GetContentsOfEmailToUsernameTable()).to.eql(expected);
    });

    it (`removing ${gTestEmail2} should remove file`, async () =>
    {
        await accounts.RemoveEmailUsernamePairFromTable(gTestEmail2);
        expect(accounts.EmailToUsernameTableExists()).to.be.false;
    });
});


describe("Test GetUserData & StoreUserData", () =>
{   
    it (`${gTestUser} should return no data`, () =>
    {
        expect(Object.keys(accounts.GetUserData(gTestUser)).length).to.equal(0);
    });

    it (`${gTestUser} should have data stored for it successfully`, () =>
    {
        var data = {key1: "val1", key2: "val2", key3: "val3"};
        accounts.StoreUserData(gTestUser, data)
        expect(accounts.GetUserData(gTestUser)).to.eql(data);
    });

    it (`${gTestUser} should have data overwritten for it successfully`, () =>
    {
        var data = {key4: "val4", key5: "val5", key6: "val6"};
        accounts.StoreUserData(gTestUser, data)
        expect(accounts.GetUserData(gTestUser)).to.eql(data);
    });

    it (`should delete ${gTestUser}`, () =>
    {
        accounts.StoreUserData(gTestUser, {});
        expect(accounts.UserExists(gTestUser)).to.be.false;
    });
});


describe("Test CreateUser & UserExists", async () =>
{
    it (`${gTestUser} should not exist`, () =>
    {
        expect(accounts.UserExists(gTestUser)).to.be.false;
    });

    it (`${gTestUser} should be sucessfully created`, async () =>
    {
        expect((await accounts.CreateUser(gTestEmail, gTestUser, gTestPassword))[0]).to.be.true;
    });

    it (`${gTestUser} should exist`, () =>
    {
        expect(accounts.UserExists(gTestUser)).to.be.true;
    });

    it (`${gTestEmail} should fail to be created again`, async () =>
    {
        expect((await accounts.CreateUser(gTestEmail, gTestUser2, gTestPassword))[0]).to.be.false;
    });

    it (`${gTestUser} should fail to be created again`, async () =>
    {
        expect((await accounts.CreateUser(gTestEmail2, gTestUser, gTestPassword))[0]).to.be.false;
    });

    it (`account should fail to be created with null email`, async () =>
    {
        expect((await accounts.CreateUser(null, gTestUser2, gTestPassword))[0]).to.be.false;
    });

    it (`account should fail to be created with null user`, async () =>
    {
        expect((await accounts.CreateUser(gTestEmail2, null, gTestPassword))[0]).to.be.false;
    });

    it (`account should fail to be created with null password`, async () =>
    {
        expect((await accounts.CreateUser(gTestEmail2, gTestUser2, null))[0]).to.be.false;
    });

    it (`account should fail to be created with profanity in the nickname`, async () =>
    {
        let [success, err] = await accounts.CreateUser(gTestEmail2, gTestUserProfanity, gTestPassword);
        expect(success).to.be.false;
        expect(err).to.equal(`"${gTestUserProfanity}" has profanity in it!`);
    });
});


describe("Test UsernameToEmail", () =>
{
    it (`${gTestUser2} should return empty string`, () =>
    {
        expect(accounts.UsernameToEmail(gTestUser2)).to.equal("");
    });

    it (`${gTestUser} should return ${gTestEmail}`, () =>
    {
        expect(accounts.UsernameToEmail(gTestUser)).to.equal(gTestEmail);
    });
});


describe("Test ResendActivationEmail", async () =>
{
    it (`${gTestUser2} should return false`, async () =>
    {
        expect(await accounts.ResendActivationEmail(gTestUser2)).to.be.false;
    });

    it (`${gTestUser} should return true`, async () =>
    {
        expect(await accounts.ResendActivationEmail(gTestUser)).to.be.true;
    });

    it (`${gTestUser} should return false because one was just sent`, async () =>
    {
        expect(await accounts.ResendActivationEmail(gTestUser)).to.be.false;
    });
});


describe("Test AccountIsActivated & ActivateUser & GetUserActivationCode", () =>
{
    it('should not be activated', () =>
    {
        expect(accounts.AccountIsActivated(gTestUser)).to.be.false;
    });

    it('should have no confirmation code for email with no account', async () =>
    {
        expect(accounts.GetUserActivationCode(gTestUser2)).to.equal(null);
    });

    it('should have no confirmation code for invalid email', () =>
    {
        expect(accounts.GetUserActivationCode("")).to.equal(null);
    });

    it('should not activate for incorrect activation code', async () =>
    {
        expect(await accounts.ActivateUser(gTestUser, "wrongcode")).to.be.false;
    });

    it('should not activate for invalid email', async () =>
    {
        expect(await accounts.ActivateUser("sdfsdhjbsdc", "")).to.be.false;
    });

    it('should not activate for email without account', async () =>
    {
        expect(await accounts.ActivateUser(gTestUser2, "")).to.be.false;
    });

    it('should activate successfully', async () =>
    {
        expect(await accounts.ActivateUser(gTestUser, accounts.GetUserActivationCode(gTestUser))).to.be.true;
    });

    it('should be activated', () =>
    {
        expect(accounts.AccountIsActivated(gTestUser)).to.be.true;
    });

    it('should have no more confirmation code', () =>
    {
        expect(accounts.GetUserActivationCode(gTestUser)).to.be.undefined
    });

    it('should not activate for null email', async () =>
    {
        expect(await accounts.ActivateUser(null, "code")).to.be.false;
    });

    it('should not be activated for null email', () =>
    {
        expect(accounts.AccountIsActivated(null)).to.be.false;
    });
});


describe("Test VerifyCorrectPassword", () =>
{
    it('should be verified', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(gTestUser, gTestPassword)).to.be.true;
    });

    it('should not be verified for bad password', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(gTestUser, "fakepassword")).to.be.false;
    });

    it('should not be verified for fake email', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(gTestUser2, "password")).to.be.false;
    });

    it('should not be verified for null email', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(null, "password")).to.be.false;
    });

    it('should not be verified for null password', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(gTestUser, null)).to.be.false;
    });
});


describe("Test GetUserLastAccessed & UpdateUserLastAccessed", async () =>
{
    it('GetUserLastAccessed should fail for non-existent user', () =>
    {
        expect(accounts.GetUserLastAccessed(gTestUser2)).to.equal(0);
    });

    it('UpdateUserLastAccessed should fail for non-existent user', async () =>
    {
        expect(await accounts.UpdateUserLastAccessed(gTestUser2)).to.be.false;
    });

    it('should update successfully', async () =>
    {
        expect(await accounts.UpdateUserLastAccessed(gTestUser)).to.be.true;
    });

    it('should be last accessed in the past second', () =>
    {
        expect(Date.now() - accounts.GetUserLastAccessed(gTestUser)).to.be.lessThan(1000);
    });
});


describe("Test GetUserAccountCode", () =>
{
    it('should fail for non-existent user', () =>
    {
        expect(accounts.GetUserAccountCode(gTestUser2)).to.equal(null);
    });

    it (`should be 12 characters long`, () =>
    {
        expect(accounts.GetUserAccountCode(gTestUser, false).length).to.equal(12);
    });
});


describe("Test Password Reset Functions", async () =>
{
    var resetCode = "";

    it('should fail to create for non-existent user', async () =>
    {
        expect(await accounts.CreatePasswordResetCode(gTestUser2)).to.be.null;
    });

    it('should fail to get when none has been created yet', () =>
    {
        expect(accounts.GetPassswordResetCode(gTestUser)).to.be.null;
    });

    it('should not have expired when none has been created yet', () =>
    {
        expect(accounts.HasPasswordResetCodeExpired(gTestUser)).to.be.false;
    });

    it('should not have reset too recently', () =>
    {
        expect(accounts.ResetPasswordTooRecently(gTestUser)).to.be.false;
    });

    it('should create successfully', async () =>
    {
        resetCode = await accounts.CreatePasswordResetCode(gTestUser);
        expect(resetCode).to.not.be.null;
        expect(resetCode.length).to.equal(6);
    });

    it('should fail to get for non-existent user', () =>
    {
        expect(accounts.GetPassswordResetCode(gTestUser2)).to.be.null;
    });

    it('should get successfully', () =>
    {
        expect(accounts.GetPassswordResetCode(gTestUser)).to.equal(resetCode);
    });

    it('should not have expired right after being created', () =>
    {
        expect(accounts.HasPasswordResetCodeExpired(gTestUser)).to.be.false;
    });

    it('should not have expired for non-existent user', () =>
    {
        expect(accounts.HasPasswordResetCodeExpired(gTestUser2)).to.be.false;
    });

    it('should fail to change for non-existent user', async () =>
    {
        expect(await accounts.ChangePassword(gTestUser2, gTestPassword)).to.be.false;
    });

    it('should fail to change for bad password', async () =>
    {
        expect(await accounts.ChangePassword(gTestUser, null)).to.be.false;
    });

    it('should change successfully', async () =>
    {
        expect(await accounts.ChangePassword(gTestUser, gTestPassword2)).to.be.true;
    });

    it('should verify new password', async () =>
    {
        expect(await accounts.VerifyCorrectPassword(gTestUser, gTestPassword2)).to.be.true;
    });

    it('should fail to get when after password was changed', () =>
    {
        expect(accounts.GetPassswordResetCode(gTestUser)).to.be.null;
    });

    it('should not have expired when password was changed', () =>
    {
        expect(accounts.HasPasswordResetCodeExpired(gTestUser)).to.be.false;
    });

    it('should have reset too recently', () =>
    {
        expect(accounts.ResetPasswordTooRecently(gTestUser)).to.be.true;
    });

    it('should not have reset too recently for non-existent user', () =>
    {
        expect(accounts.ResetPasswordTooRecently(gTestUser2)).to.be.false;
    });

    it('should fail to send code to non-existent email', async () =>
    {
        expect(await accounts.SendPasswordResetCode(gTestEmail2)).to.be.false;
    });

    it('should send code successfully', async () =>
    {
        expect(await accounts.SendPasswordResetCode(gTestEmail)).to.be.true;
    });

    it('should fail to send code right after one was sent', async () =>
    {
        expect(await accounts.SendPasswordResetCode(gTestEmail)).to.be.false;
    });

    it('should get code successfully after a new one was sent', async () =>
    {
        expect(await accounts.GetPassswordResetCode(gTestUser)).to.not.be.null;
    });
});


describe("Test CreateCloudDataSyncKey & GetCloudDataSyncKey", async () =>
{
    let regularKey = "";
    let randomizerKey = "";

    it('should fail to create for non-existent user', async () =>
    {
        expect(accounts.CreateCloudDataSyncKey(gTestUser2)).to.be.eventually.rejected;
    });

    it('should fail to get for non-existent user', async () =>
    {
        expect(await accounts.GetCloudDataSyncKey(gTestUser2)).to.equal("");
    });

    it (`should create a key 12 characters long`, async () =>
    {
        regularKey = await accounts.CreateCloudDataSyncKey(gTestUser, false);
        expect(regularKey.length).to.equal(12);
    });

    it (`should get the same key just returned by the create function`, async () =>
    {
        expect(await accounts.GetCloudDataSyncKey(gTestUser, false)).to.equal(regularKey);
    });

    it (`should not get the same randomizer key`, async () =>
    {
        expect(await accounts.GetCloudDataSyncKey(gTestUser, true)).to.not.equal(regularKey);
    });

    it (`should create a randomizer key 12 characters long`, async () =>
    {
        randomizerKey = await accounts.CreateCloudDataSyncKey(gTestUser, true);
        expect(randomizerKey.length).to.equal(12);
    });

    it (`should get the same randomizer key just returned by the create function`, async () =>
    {
        expect(await accounts.GetCloudDataSyncKey(gTestUser, true)).to.equal(randomizerKey);
    });

    it (`should not get the same regular key`, async () =>
    {
        let key = await accounts.GetCloudDataSyncKey(gTestUser, false);
        expect(key).to.equal(regularKey);
        expect(key).to.not.equal(randomizerKey);
    });
});


describe("Test GetUserCloudBoxes & GetUserCloudTitles & SaveAccountCloudData", async () =>
{
    it (`should no Boxes for regular Boxes`, async () =>
    {
        expect(await accounts.GetUserCloudTitles(gTestUser, false)).to.eql([]);
    });

    it (`should no titles for regular Boxes`, async () =>
    {
        expect(await accounts.GetUserCloudTitles(gTestUser, false)).to.eql([]);
    });

    it (`should be no boxes for randomizer Boxes`, async () =>
    {
        expect(await accounts.GetUserCloudBoxes(gTestUser, true)).to.eql([]);
    });

    it (`should be no titles for randomizer Boxes`, async () =>
    {
        expect(await accounts.GetUserCloudTitles(gTestUser, true)).to.eql([]);
    });

    it (`should be no boxes for non-existent user`, async () =>
    {
        expect(await accounts.GetUserCloudBoxes(gTestUser2, false)).to.eql([]);
    });

    it (`should be no titles for non-existent user`, async () =>
    {
        expect(await accounts.GetUserCloudTitles(gTestUser2, false)).to.eql([]);
    });

    it (`should fail to save with a fake username`, async () =>
    {
        var boxes = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon.json")));
        var titles = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon_titles.json")));
        expect(await accounts.SaveAccountCloudData(gTestUser2, boxes, titles, false)).to.be.false;
    });

    it (`should save new titles and boxes successfully`, async () =>
    {
        var boxes = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon.json")));
        var titles = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon_titles.json")));
        expect(await accounts.SaveAccountCloudData(gTestUser, boxes, titles, false)).to.be.true;
    });

    it (`should save new randomized titles and boxes successfully`, async () =>
    {
        var boxes = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/flex.json")));
        var titles = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/flex_titles.json")));
        expect(await accounts.SaveAccountCloudData(gTestUser, boxes, titles, true)).to.be.true;
    });

    it (`should be newly saved Boxes`, async () =>
    {
        var boxes = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon.json")));
        expect(await accounts.GetUserCloudBoxes(gTestUser, false)).to.eql(boxes);
    });

    it (`should be newly saved titles`, async () =>
    {
        var titles = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/all_pokemon_titles.json")));
        expect(await accounts.GetUserCloudTitles(gTestUser, false)).to.eql(titles);
    });

    it (`should be newly saved randomizer Boxes`, async () =>
    {
        var boxes = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/flex.json")));
        expect(await accounts.GetUserCloudBoxes(gTestUser, true)).to.eql(boxes);
    });

    it (`should be newly saved randomizer titles`, async () =>
    {
        var titles = JSON.parse(fs.readFileSync(path.join(process.cwd(), "pytests/data/flex_titles.json")));
        expect(await accounts.GetUserCloudTitles(gTestUser, true)).to.eql(titles);
    });
});


describe("Test IsUserBannedFromWonderTrade", async () =>
{
    it (`should not be banned from Wonder Trade for non-existent user`, () =>
    {
        expect(accounts.IsUserBannedFromWonderTrade(gTestUser2)).to.be.false;
    });

    it (`should not be banned from Wonder Trade for gTestUser`, () =>
    {
        expect(accounts.IsUserBannedFromWonderTrade(gTestUser)).to.be.false;
    });

    it (`should not be bannable  for non-existent user`, async () =>
    {
        expect(await accounts.BanUserFromFromWonderTrade(gTestUser2)).to.be.false;
    });

    it (`should be banned successfully for gTestUser`, async () =>
    {
        expect(await accounts.BanUserFromFromWonderTrade(gTestUser)).to.be.true;
    });

    it (`should be banned from Wonder Trade for gTestUser`, () =>
    {
        expect(accounts.IsUserBannedFromWonderTrade(gTestUser)).to.be.true;
    });
});


describe("Test DeleteUser", async () =>
{
    it (`should not delete ${gTestUser} with mismatched password`, async () =>
    {
        expect(await accounts.DeleteUser(gTestUser, "fakepassword")).to.be.false;
    });

    it (`should delete ${gTestUser}`, async () =>
    {
        expect(await accounts.DeleteUser(gTestUser, gTestPassword2)).to.be.true;
    });

    it (`${gTestUser} should not exist`, () =>
    {
        expect(accounts.UserExists(gTestUser)).to.be.false;
    });

    it (`should not delete ${gTestUser}`, async () =>
    {
        expect(await accounts.DeleteUser(gTestUser, gTestPassword)).to.be.false;
    });

    it (`should not delete invalid email`, async () =>
    {
        expect(await accounts.DeleteUser("blhassd", gTestPassword)).to.be.false;
    });

    it (`should not delete null email`, async () =>
    {
        expect(await accounts.DeleteUser(null, gTestPassword)).to.be.false;
    });

    it (`should not delete null password`, async () =>
    {
        expect(await accounts.DeleteUser(gTestUser, null)).to.be.false;
    });
});
