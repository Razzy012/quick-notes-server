const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const models = require('../models');
const { errorHandler, withTransaction } = require('../util');
const { HttpError } = require('../error');

const signup = errorHandler(withTransaction(async function(req, res, session) {

    if(req.body.password.length < 6) {
        throw new HttpError(403, 'Password is too short (min 6)');
    }

    const userDoc = models.User({
        username: req.body.username,
        password: await argon2.hash(req.body.password)
    });

    const refreshTokenDoc = models.RefreshToken({
        owner: userDoc.id,
    });

    await userDoc.save({session});
    await refreshTokenDoc.save({session});

    const accessToken = createAccessToken(userDoc.id);
    const refreshToken = createRefreshToken(userDoc.id, refreshTokenDoc.id);

    return {
        id: userDoc.id,
        accessToken,
        refreshToken
    };
}));

const login = errorHandler(withTransaction(async function(req, res, session) {

    const userDoc = await models.User.findOne({ username: req.body.username }).select('+password').exec();
    if(!userDoc){
        throw new HttpError(401, "Wrong username or password");
    }

    await verifyPassword(userDoc.password, req.body.password);

    const refreshTokenDoc = models.RefreshToken({
        owner: userDoc.id,
    });

    await refreshTokenDoc.save({session});

    const accessToken = createAccessToken(userDoc.id);
    const refreshToken = createRefreshToken(userDoc.id, refreshTokenDoc.id);

    return {
        id: userDoc.id,
        accessToken,
        refreshToken
    };
}));

const newRefreshToken = errorHandler(withTransaction(async function(req, res, session) {
    const currentRefreshToken = await validateRefreshToken(req.body.refreshToken);

    const refreshTokenDoc = models.RefreshToken({
        owner: currentRefreshToken.userId,
    });

    await refreshTokenDoc.save({session});
    await models.RefreshToken.deleteOne({_id: currentRefreshToken.tokenId}, {session});

    const accessToken = createAccessToken(currentRefreshToken.userId);
    const refreshToken = createRefreshToken(currentRefreshToken.userId, refreshTokenDoc.id);

    return {
        id: currentRefreshToken.userId,
        accessToken,
        refreshToken
    };
}));

const newAccessToken = errorHandler(async function(req, res) {
    const currentRefreshToken = await validateRefreshToken(req.body.refreshToken);

    const accessToken = createAccessToken(currentRefreshToken.userId);

    return {
        id: currentRefreshToken.userId,
        accessToken,
        refreshToken: req.body.refreshToken
    };
});

const logout = errorHandler(withTransaction(async function(req, res, session) {
    const refreshToken = await validateRefreshToken(req.body.refreshToken);
    await models.RefreshToken.deleteOne({_id: refreshToken.tokenId}, {session});
    return {succes: true};
}));

const logoutAll = errorHandler(withTransaction(async function(req, res, session) {
    const refreshToken = await validateRefreshToken(req.body.refreshToken);
    await models.RefreshToken.deleteMany({owner: refreshToken.userId}, {session});
    return {succes: true};
}));

function createAccessToken(userId) {
    return jwt.sign({
        userId: userId
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '10m'
    })
};

function createRefreshToken(userId, refreshTokenId) {
    return jwt.sign({
        userId: userId,
        tokenId: refreshTokenId
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
}

const verifyPassword = async (hashedPassword, rawPassword) => {
    if(await argon2.verify(hashedPassword, rawPassword)){
        // password correct
    } else {
        throw new HttpError(401, 'Wrong username or password');
    }
}

const validateRefreshToken = async (token) => {
    const decodeToken = () => {
        try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (e) {
        return new HttpError(401, 'Unauthorized');
    }};

    const decodedToken = decodeToken();
    const tokenExists = await models.RefreshToken.exists({_id: decodedToken.tokenId});
    if(tokenExists){
        return decodedToken;
    } else {
        throw new HttpError(401, 'Unauthorized')
    }
};

module.exports = {
    signup, 
    login,
    newRefreshToken,
    newAccessToken,
    logout,
    logoutAll
};