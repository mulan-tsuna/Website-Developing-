const express = require('express')
const User = require('./model')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const svgCaptcha = require('svg-captcha')
const session = require('express-session')
const app = express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/views'))
app.use(session({
    secret: 'captcha-test',
    resave: false,
    saveUninitialized: false,
}))


app.all('/', function (request, response) {
    response.render('login')
})

app.all('/logout', function (request, response) {
    response.redirect('/')
})

//เงื่อนไขหน้า login ว่ามีการเข้ารหัสถูกต้องหรือไม่
app.all('/login', function (request, response) {

    let Login = request.query.Login;
    let Passwordlogin = request.query.Passwordlogin;
    var pass_fail = "รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
    var User_fail = "ชื่อบัญชีไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
    var fail = "ไม่พบบัญชีผู้ใช้ กรุณาสมัครสมาชิก"
    console.log(Login)
    console.log(Passwordlogin)

    User.find()
        .select('Username Password')
        .exec((err, docs) => {
            for (d of docs) {
                if (d.Username == Login && d.Password == Passwordlogin) {
                    response.redirect('/home')
                    console.log("true")
                    var checklogin = 1;
                }
                else if (d.Username != Login && d.Password == Passwordlogin) {
                    response.render('login', { result_login: User_fail })
                    console.log("User Error")
                    var checklogin = 1;
                }
                else if (d.Username == Login && d.Password != Passwordlogin) {
                    response.render('login', { result_login: pass_fail })
                    console.log("Pass Error")
                    var checklogin = 1;
                }
            }

            if (checklogin != 1) {
                response.render('login', { result_login: fail })
                console.log("User and Pass Error")
            }


        })
})


app.all('/home', function (request, response) {
    response.render('home')
})


app.get('/captcha-image', (request, response) => {
    let captcha = svgCaptcha.create({ size: 5, noise: 3, background: '#def' })
    request.session.captcha = captcha.text
    response.type('svg')
    response.status(200) // everything is ok
    response.send(captcha.data) // ส่งข้อมูลของ chptcha
})

//หน้ายืนยันตัวตนผ่านการพิมพ์อักษรให้ตรงกับรูปภาพ
app.all('/check', (request, response) => {
    if (!request.body.captcha) {
        response.render('former')       // ถ้าไม่มีข้อมูลกให้อยู่ในรูปแบบ form (รูปแบบเริ่มต้น)
    } else {
        let sessCaptcha = request.session.captcha // ข้อมูลจากใน session ที่สุ่มมาจาก captcha
        let postCaptcha = request.body.captcha // ข้อมูลจาก body ที่มีชื่อว่า chatcha ซึ่งอยู่ในไฟล์ form.ejs
        var r = 'คุณใส่อักขระไม่ตรงกับในภาพ'

        if (sessCaptcha == postCaptcha) {
            response.redirect('/resetpassword')
        }
        else if (sessCaptcha != postCaptcha) {
            response.render('former', { result: r })
        }
    }
})

//หน้าการ reset password โดยเช้คจากฐานข้อมูลผ่าน email
app.all('/resetpassword', (request, response) => {
    if (request.method == 'GET') {
        response.render('resetpassword')
    }
    else if (request.method == 'POST') {
        var reset_fail = "ไม่พบปัญชีผู้ใช้"
        let Email_Reset = request.body.EmailReset || '';
        User.find()
            .select('Email')
            .exec((err, docs) => {
                for (e of docs) {
                    if (e.Email == Email_Reset) {
                        response.redirect('/edit/' + e._id)
                        var x = 1
                    }
                }
                if (x != 1) {
                    console.log("error")
                    response.render('resetpassword', { result_reset: reset_fail })
                }

            }
            )
    }
})

// หน้าเพิ่ม User เข้าใช้เว็บไซต์
app.all('/signin', (request, response) => {

    if (!request.body.Firstname) {
        response.render('signin')

    } else {
        let form = request.body
        let data = {
            title: form.title,
            Firstname: form.Firstname,
            Lastname: form.Lastname,
            Nation: form.Nation,
            Username: form.Username,
            Password: form.Password,
            Comfirmpassword: form.Comfirmpassword,
            Date: new Date(Date.parse(form.Date)) || new Date(),
            Gentle: form.Gentle,
            Phone: form.Phone,
            Email: form.Email
        }
        if (data.Password == data.Comfirmpassword) {
            User.create(data, err => {
                response.render('login')
            })
        }
        else {
            response.render('signin')
        }

    }

})

// หน้าค้นหาข้อมูลผู้ใช้ทั้งหมด
app.all('/find', (request, response) => {

    var find_fail = "ไม่พบบัญชี หากลืมรหัสผ่านกรุณาติดต่อเจ้าหน้าที่"
    let Login_find = request.query.Login_find;
    let Passwordlogin_find = request.query.Passwordlogin_find;

    if (Login_find == "Saowaporn" && Passwordlogin_find == "55555") {
        var findcheck = 1
        User.find()
            .exec((err, docs) => {
                response.render('find', {
                    data: docs
                })
            })
    }
    else if (findcheck != 1) {
        response.render('login', { result_find: find_fail })
    }

})

app.all('/find2', (request, response) => {

    User.find()
        .exec((err, docs) => {
            response.render('find', {
                data: docs
            })
        })
})

// หน้าการเเก้ไขข้อมูลส่วนตัวทั้งหมด + รหัสผ่าน
app.all('/edit/:id', (request, response) => {
    //ถ้าเรียกเข้ามาด้วยเมธอด GET พร้อมแนบค่า id
    //ก็ใช้เป็นเงื่อนไขในการอ่านข้อมูลเดิม แล้วส่งไปที่ฟอร์ม
    if (request.method == 'GET') {
        if (request.params.id) {
            User
                .findById(request.params.id)
                .exec((err, doc) => {
                    response.render('edit', { data: doc })
                })
        } else {
            response.render('find')
        }

        //ถ้าโพสต์ข้อมูลจากฟอร์มเข้ามา (หลังการแก้ไข)
        //ก็อ่านค่าจากแต่ละอิลิเมนต์ แล้วนำไปแก้ไขข้อมูลเดิม
    } else if (request.method == 'POST') {
        let form = request.body
        let data = {
            title: form.title,
            Firstname: form.Firstname,
            Lastname: form.Lastname,
            Nation: form.Nation,
            Username: form.Username,
            Password: form.Password,
            Comfirmpassword: form.Comfirmpassword,
            Date: new Date(Date.parse(form.Date)) || new Date(),
            Gentle: form.Gentle,
            Phone: form.Phone,
            Email: form.Email
        }
        if (data.Password == data.Comfirmpassword) {
            User
                .findByIdAndUpdate(request.params.id, data, { useFindAndModify: false })
                .exec(err => {
                    response.redirect('/')
                })
        }
        else {
            User
                .findById(request.params.id)
                .exec((err, doc) => {
                    response.render('edit', { data: doc })
                })
        }
    }
})

//หน้าลบข้อมูล User ออก
app.get('/delete/:id', (request, response) => {
    if (request.params.id) {
        User
        .findByIdAndDelete(request.params.id, { useFindAndModify: false })
        .exec(err => {
            response.redirect('/find2')
        })
    }
})
app.listen(3000, () => console.log('Server started on port: 3000'))