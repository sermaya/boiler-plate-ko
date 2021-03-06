const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { auth } = require('./middleware/auth');
const { User } = require('./models/User');
const config = require('./config/dev');

//application/x-www-form-urlencoded 형식을 분석해서 가져올 수 있게 해 주는 것
app.use(bodyParser.urlencoded({extended : true}));

//application/json 형식을 분것석해서 가져올 수 있게 해 주는 것
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('Hello World! Node js GoGoGo!')
})

app.post('/api/users/register', (req, res) => {
    //회원 가입할 때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터베이스에 넣어준다.

    const user = new User(req.body);
    user.save((err, userInfo) => {
        if (err) return res.json({success:false, err});
        return res.status(200).json({
            success:true
        });
    })
})

app.post('/api/users/login', (req, res) => {
    //요청된 이메일을 데이터베이스에 있는지 찾는다.
    User.findOne({email: req.body.email}, (err, user) => {
        if (!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            });
        }

        //요청된 이메일이 데이터베이스에 있다면 비밀번호가 같은지 확인
        user.comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch){
                return res.json({
                    loginSuccess: false,
                    message: "비밀번호가 맞지 않습니다."
                });
            }

            //비밀번호까지 맞다면 큰 생성하기
            user.generateToken((err, user) => {
                if (err) return res.status(400).send(err);

                //토큰을 쿠키에 저장한다.
                res.cookie("x_auth", user.token)
                    .status(200)
                    .json({loginSuccess:true, userId: user._id});
            });
        })
    });
});

//role 0 -> 일반유저, role 0이 아니면 관리자
app.get('/api/users/auth', auth, (req, res) => {
    //middleware를 통과했다는 것은 authentication이 true라는 것이다.
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastName: req.user.lastName,
        role: req.user.role,
        image: req.user.image
    });
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id:req.user._id}, {token:""}, (err, user) => {
        if (err) return res.json({success:false, err});
        return res.status(200).send({success:true});
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})