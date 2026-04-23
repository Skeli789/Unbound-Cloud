/**
 * Test file for the /api/user/* endpoints.
 * Tests the user API endpoints to ensure they are working correctly.
 */

const { expect } = require('chai');
const fs = require('fs');
const request = require('supertest');
const { StatusCode } = require('status-code-enum');

const { app, http } = require('../server');
const accounts = require('../accounts');

const gTestEmail = 'testuser@example.com';
const gTestEmail2 = 'testuser2@example.com';
const gTestUsername = 'TestUserEndpoint';
const gTestUsername2 = 'TestUserEndpoint2';
const gTestPassword = 'testpass123';
const gValidNewPassword = 'newpass456';

let gAccountCode = null; // Set after successful account creation
let gCloudDataSyncKey = null; // Set after successful getAccountCloudData


before(async function ()
{
    this.timeout(10000);
    await ClearTestDatabase();
});

after((done) =>
{
    if (http.listening)
        http.close(done);
    else
        done();
});

async function ClearTestDatabase()
{
    var cloudDir = process.env.APPDATA + '/unboundcloud';
    if (fs.existsSync(cloudDir))
        fs.rmdirSync(cloudDir, {recursive: true, force: true});
}


describe('POST /api/user/new', () =>
{
    it('should return 400 BLANK_INPUT when all fields are empty strings', async () =>
    {
        const res = await request(app)
            .post('/api/user/new')
            .send({email: '', username: '', password: ''});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('BLANK_INPUT');
    });

    it('should return 400 NULL_ACCOUNT when fields are missing', async () =>
    {
        const res = await request(app)
            .post('/api/user/new')
            .send({});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('NULL_ACCOUNT');
    });

    it('should return 200 and account info when account is created successfully', async () =>
    {
        const res = await request(app)
            .post('/api/user/new')
            .send({email: gTestEmail, username: gTestUsername, password: gTestPassword});

        expect(res.status).to.equal(StatusCode.SuccessOK);
        expect(res.body).to.have.property('username', gTestUsername);
        expect(res.body).to.have.property('accountCode');
        gAccountCode = res.body.accountCode;
    });

    it('should return 409 EMAIL_EXISTS when the email is already registered', async () =>
    {
        const res = await request(app)
            .post('/api/user/new')
            .send({email: gTestEmail, username: 'DifferentUsername', password: gTestPassword});

        expect(res.status).to.equal(StatusCode.ClientErrorConflict);
        expect(res.body.errorMsg).to.equal('EMAIL_EXISTS');
    });

    it('should return 409 USER_EXISTS when the username is already taken', async () =>
    {
        const res = await request(app)
            .post('/api/user/new')
            .send({email: 'different@example.com', username: gTestUsername, password: gTestPassword});

        expect(res.status).to.equal(StatusCode.ClientErrorConflict);
        expect(res.body.errorMsg).to.equal('USER_EXISTS');
    });
});


describe('POST /api/user/login', () =>
{
    it('should return 400 NULL_ACCOUNT when fields are missing', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('NULL_ACCOUNT');
    });

    it('should return 400 BLANK_INPUT when fields are empty strings', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({username: '', password: ''});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('BLANK_INPUT');
    });

    it('should return 404 NO_ACCOUNT_FOUND for a nonexistent username', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({username: 'DoesNotExist', password: gTestPassword});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
        expect(res.body.errorMsg).to.equal('NO_ACCOUNT_FOUND');
    });

    it('should return 403 INVALID_PASSWORD for the wrong password', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({username: gTestUsername, password: 'wrongpassword'});

        expect(res.status).to.equal(StatusCode.ClientErrorForbidden);
        expect(res.body.errorMsg).to.equal('INVALID_PASSWORD');
    });

    it('should return 200 and account info for valid credentials', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({username: gTestUsername, password: gTestPassword});

        expect(res.status).to.equal(StatusCode.SuccessOK);
        expect(res.body).to.have.property('username', gTestUsername);
        expect(res.body).to.have.property('accountCode');
        expect(res.body).to.have.property('activated', false);
    });

    it('should return 200 when logging in with an email instead of a username', async () =>
    {
        const res = await request(app)
            .post('/api/user/login')
            .send({username: gTestEmail, password: gTestPassword});

        expect(res.status).to.equal(StatusCode.SuccessOK);
        expect(res.body).to.have.property('username', gTestUsername);
    });
});


describe('POST /api/user/activate', () =>
{
    it('should return 404 NO_ACCOUNT_FOUND for a nonexistent username', async () =>
    {
        const res = await request(app)
            .post('/api/user/activate')
            .send({username: 'DoesNotExist', activationCode: '123456'});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
        expect(res.body.errorMsg).to.equal('NO_ACCOUNT_FOUND');
    });

    it('should return 403 INVALID_ACTIVATION_CODE for a wrong activation code', async () =>
    {
        const res = await request(app)
            .post('/api/user/activate')
            .send({username: gTestUsername, activationCode: 'wrongcode'});

        expect(res.status).to.equal(StatusCode.ClientErrorForbidden);
        expect(res.body.errorMsg).to.equal('INVALID_ACTIVATION_CODE');
    });

    it('should return 200 when the correct activation code is provided', async () =>
    {
        const activationCode = accounts.GetUserActivationCode(gTestUsername);
        const res = await request(app)
            .post('/api/user/activate')
            .send({username: gTestUsername, activationCode});

        expect(res.status).to.equal(StatusCode.SuccessOK);
        expect(accounts.AccountIsActivated(gTestUsername)).to.be.true;
    });
});


describe('POST /api/user/sendActivationCode', () =>
{
    before(async function ()
    {
        // Create a second unactivated account to test activation code resending
        await request(app)
            .post('/api/user/new')
            .send({email: gTestEmail2, username: gTestUsername2, password: gTestPassword});
    });

    it('should return 404 NO_ACCOUNT_FOUND for a nonexistent username', async () =>
    {
        const res = await request(app)
            .post('/api/user/sendActivationCode')
            .send({username: 'DoesNotExist', accountCode: 'anycode'});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
        expect(res.body.errorMsg).to.equal('NO_ACCOUNT_FOUND');
    });

    it('should return 403 INVALID_ACCOUNT_CODE for a wrong account code', async () =>
    {
        const res = await request(app)
            .post('/api/user/sendActivationCode')
            .send({username: gTestUsername2, accountCode: 'wrongaccountcode'});

        expect(res.status).to.equal(StatusCode.ClientErrorForbidden);
        expect(res.body.errorMsg).to.equal('INVALID_ACCOUNT_CODE');
    });
});


describe('POST /api/user/sendPasswordResetCode', () =>
{
    it('should return 404 INVALID_EMAIL for an unregistered email', async () =>
    {
        const res = await request(app)
            .post('/api/user/sendPasswordResetCode')
            .send({email: 'notregistered@example.com'});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
        expect(res.body.errorMsg).to.equal('INVALID_EMAIL');
    });
});


describe('POST /api/user/resetPassword', () =>
{
    it('should return 400 NULL_ACCOUNT when fields are missing', async () =>
    {
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('NULL_ACCOUNT');
    });

    it('should return 400 BLANK_INPUT when fields are empty strings', async () =>
    {
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({email: '', newPassword: '', resetCode: ''});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('BLANK_INPUT');
    });

    it('should return 404 INVALID_EMAIL for an unregistered email', async () =>
    {
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({email: 'notregistered@example.com', newPassword: gValidNewPassword, resetCode: '123456'});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
        expect(res.body.errorMsg).to.equal('INVALID_EMAIL');
    });

    it('should return 400 INVALID_PASSWORD for an invalid new password format', async () =>
    {
        const resetCode = await accounts.CreatePasswordResetCode(gTestUsername);
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({email: gTestEmail, newPassword: 'bad', resetCode});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('INVALID_PASSWORD');
    });

    it('should return 400 INVALID_RESET_CODE for a wrong reset code', async () =>
    {
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({email: gTestEmail, newPassword: gValidNewPassword, resetCode: 'wrongcode'});

        expect(res.status).to.equal(StatusCode.ClientErrorBadRequest);
        expect(res.body.errorMsg).to.equal('INVALID_RESET_CODE');
    });

    it('should return 200 and allow login with the new password after a successful reset', async () =>
    {
        const resetCode = accounts.GetPassswordResetCode(gTestUsername);
        const res = await request(app)
            .post('/api/user/resetPassword')
            .send({email: gTestEmail, newPassword: gValidNewPassword, resetCode});

        expect(res.status).to.equal(StatusCode.SuccessOK);

        // Verify the new password works
        const loginRes = await request(app)
            .post('/api/user/login')
            .send({username: gTestUsername, password: gValidNewPassword});
        expect(loginRes.status).to.equal(StatusCode.SuccessOK);
    });
});


describe('GET /api/user/getAccountCloudData', () =>
{
    it('should return 404 for a nonexistent username', async () =>
    {
        const res = await request(app)
            .get('/api/user/getAccountCloudData')
            .query({username: 'DoesNotExist', accountCode: 'anycode', randomizer: 'false'});

        expect(res.status).to.equal(StatusCode.ClientErrorNotFound);
    });

    it('should return 401 for a wrong account code', async () =>
    {
        const res = await request(app)
            .get('/api/user/getAccountCloudData')
            .query({username: gTestUsername, accountCode: 'wrongcode', randomizer: 'false'});

        expect(res.status).to.equal(StatusCode.ClientErrorUnauthorized);
    });

    it('should return 200 with cloud data for valid credentials', async () =>
    {
        const res = await request(app)
            .get('/api/user/getAccountCloudData')
            .query({username: gTestUsername, accountCode: gAccountCode, randomizer: 'false'});

        expect(res.status).to.equal(StatusCode.SuccessOK);
        expect(res.body).to.have.property('cloudBoxes').that.is.an('array');
        expect(res.body).to.have.property('cloudTitles').that.is.an('array');
        expect(res.body).to.have.property('cloudDataSyncKey').that.is.a('string');
        gCloudDataSyncKey = res.body.cloudDataSyncKey;
    });
});


describe('PUT /api/user/saveAccountCloudData', () =>
{
    const gValidHomeData =
    {
        boxes: [],
        titles: [],
        randomizer: false,
        version: 2,
    };

    it('should return 401 for a wrong account code', async () =>
    {
        const res = await request(app)
            .put('/api/user/saveAccountCloudData')
            .send({
                username: gTestUsername,
                accountCode: 'wrongcode',
                cloudDataSyncKey: gCloudDataSyncKey,
                homeData: gValidHomeData,
            });

        expect(res.status).to.equal(StatusCode.ClientErrorUnauthorized);
    });

    it('should return 401 for an invalid cloud data sync key', async () =>
    {
        const res = await request(app)
            .put('/api/user/saveAccountCloudData')
            .send({
                username: gTestUsername,
                accountCode: gAccountCode,
                cloudDataSyncKey: 'invalidsynckey',
                homeData: gValidHomeData,
            });

        expect(res.status).to.equal(StatusCode.ClientErrorUnauthorized);
    });

    it('should return 200 when data is saved successfully', async () =>
    {
        const res = await request(app)
            .put('/api/user/saveAccountCloudData')
            .send({
                username: gTestUsername,
                accountCode: gAccountCode,
                cloudDataSyncKey: gCloudDataSyncKey,
                homeData: gValidHomeData,
            });

        expect(res.status).to.equal(StatusCode.SuccessOK);
    });
});
