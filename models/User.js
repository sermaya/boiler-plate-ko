const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name : {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastName: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp : {
        type: Number
    }
});

userSchema.pre('save', function(next){
    var user = this;

    //password가 변경될 때만 암호화 실행
    if (user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) return next(err);

            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) return next(err);
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
})

userSchema.methods.comparePassword = function (plainPassword, callback){
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if (err) return callback(err);
        callback(null, isMatch);
    })
}

userSchema.methods.generateToken = function (callback){
    var user = this;

    //jsonwebtoken을 이용해서 token을 생성하기
    var token = jwt.sign(user._id.toHexString(),'secretToken');

    user.token = token;
    user.save(function(err, user){
        if(err) return callback(err);
        callback(null, user);
    });
}

//토큰 복호화한 후 비교
userSchema.statics.findByToken = function(token, callback){
    var user = this;

    jwt.verify(token, 'secretToken', function(err, decoded){
        //유저 아이디를 이용해서 유저를 찾은 후에
        //클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인한다.
        user.findOne({"_id":decoded, "token":token}, function(err, user){
            if (err) return callback(err);
            callback(null, user);
        })
    })
}

const User = mongoose.model('user', userSchema)

module.exports = { User };