// Setup mongoose and the database
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var options = {
    id : false,
    _id : false,
    autoIndex : false
};

// "OAuth token"
var OAuthTokenSchema = new Schema({
    // "access token"
    accessToken : {
        type : String,
        index : {
            unique : true
        }
    }, // key, The string token
    clientId : {
        type : String,
        index : true
    }, // The client id
    resourceOwner : {
        type : String,
        index : true
    }, // The resource owner (user) id
    realm : {
        type : String,
        index : true
    }, // The resource owner realm
    issuedAt : {
        type : Date,
        index : true
    }, // The timestamp when the token is issued
    expiresIn : Number, // Expiration time in seconds
    expiredAt : {
        type : Date,
        index : {
            expires : "1d"
        }
    }, // The timestamp when the token is expired
    scopes : [ String ], // oAuth scopes
    parameters : [ {
        name : String,
        value : String
    } ],

    authorizationCode : {
        type : String,
        index : true
    }, // The corresponding authorization code that is used to request the
    // access token
    refreshToken : {
        type : String,
        index : true
    }, // The corresponding refresh token if issued

    type : {
        type : String,
        enum : [ "Bearer", "MAC" ]
    }, // The token type, such as Bearer:
    // http://tools.ietf.org/html/draft-ietf-oauth-v2-bearer-16
    // or MAC: http://tools.ietf.org/html/draft-hammer-oauth-v2-mac-token-05
    authenticationScheme : String, // HTTP authenticationScheme
    hash : String, // The SHA-1 hash for
// client-secret/resource-owner-secret-key
}, options);

// "OAuth authorization code"
var OAuthAuthorizationCodeSchema = new Schema({
    code : {
        type : String,
        index : {
            unique : true
        }
    }, // key // The string code
    clientId : {
        type : String,
        index : true
    }, // The client id
    resourceOwner : {
        type : String,
        index : true
    }, // The resource owner (user) id
    realm : {
        type : String,
        index : true
    }, // The resource owner realm

    issuedAt : {
        type : Date,
        index : true
    }, // The timestamp when the token is issued
    expiresIn : Number, // Expiration time in seconds
    expiredAt : {
        type : Date,
        index : {
            expires : "1d"
        }
    }, // The timestamp when the token is expired

    scopes : [ String ], // oAuth scopes
    parameters : [ {
        name : String,
        value : String
    } ],

    used : Boolean, // Is it ever used
    redirectURI : String, // The redirectURI from the request, we need to
    // check if it's identical to the one used for
    // access token
    hash : String, // The SHA-1 hash for
// client-secret/resource-owner-secret-key
}, options);

// "OAuth client registration record"
var ClientRegistrationSchema = new Schema({
    id : {
        type : String,
        index : {
            unique : true
        }
    },
    clientId : {
        type : String,
        index : {
            unique : true
        }
    }, // key; // The client id
    clientSecret : String, // The generated client secret

    defaultTokenType : String,
    accessLevel : Number, // The access level to scopes, -1: disabled, 0:
    // basic, 1..N
    disabled : Boolean,

    name : {
        type : String,
        index : true
    },
    email : String,
    description : String,
    url : String,
    iconURL : String,
    redirectURIs : [ String ],
    type : {
        type : String,
        enum : [ "CONFIDENTIAL", "PUBLIC" ]
    },

    userId : {
        type : String,
        index : true
    }, // The registered developer

}, {
    autoIndex : true
});

// "OAuth permission"
var OAuthPermissionSchema = new Schema({
    clientId : {
        type : String,
        index : true
    }, // The client id
    resourceOwner : {
        type : String,
        index : true
    }, // The resource owner (user) id
    realm : {
        type : String,
        index : true
    }, // The resource owner realm

    issuedAt : {
        type : Date,
        index : true
    }, // The timestamp when the permission is issued
    expiresIn : Number, // Expiration time in seconds
    expiredAt : {
        type : Date,
        index : {
            expires : "1d"
        }
    }, // The timestamp when the permission is expired

    scopes : [ String ]
}, {
    autoIndex : false
});

// "OAuth scope"
var OAuthScopeSchema = new Schema({
    scope : {
        type : String,
        index : {
            unique : true
        }
    }, // key; // The scope name
    description : String, // Description of the scope
    iconURL : String, // The icon to be displayed on the "Request Permission"
    // dialog
    expiresIn : Number, // The default maximum lifetime of access token that
    // carries the scope
    requiredAccessLevel : Number, // The minimum access level required
    resourceOwnerAuthorizationRequired : Boolean
// The scope requires authorization from the resource owner
}, options);

// "OAuth protected resource"
var OAuthResourceSchema = new Schema({
    operations : [ {
        type : String,
        enum : [ "ALL", "GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH" ]
    } ], // A list of operations, by default ALL
    path : String, // The resource URI path
    scopes : [ String ]
// Allowd scopes
}, {
    autoIndex : false
});

// User Schema
var UserSchema = new Schema({
    id : {
        type : String,
        index : {
            unique : true
        }
    },
    realm : {
        type : String,
        index : true
    },
    name : {
        type : String,
        index : true
    },
    email : {
        type : String,
        index : true
    },
    hash : String,
    password : String,
    salt : String,
    macKey : String,
    created : {
        type : Date,
        index : true
    },
    lastUpdated : {
        type : Date,
        index : true
    }
});

// Use the schema to register a model
exports.OAuthToken = mongoose.model('OAuthToken', OAuthTokenSchema);
exports.OAuthAuthorizationCode = mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);
exports.ClientRegistration = mongoose.model('ClientRegistration', ClientRegistrationSchema);
exports.OAuthPermission = mongoose.model('OAuthPermission', OAuthPermissionSchema);
exports.OAuthScopeSchema = mongoose.model('OAuthScope', OAuthScopeSchema);
exports.OAuthResource = mongoose.model('OAuthResource', OAuthResourceSchema);
exports.User = mongoose.model('User', UserSchema);
