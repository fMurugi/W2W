require('dotenv').config()
const express = require('express');
const app = express()
const ussdMenu = require('ussd-builder')
const mongoose = require('mongoose')
const cache = require('memory-cache')
const Model = require('./models/model')
const log = require('signale')

const credentials={
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME
}
const africastalking = require('africastalking')

//db connection
const mongoString = process.env.DATABASE_URL
mongoose.connect(mongoString)
const database = mongoose.connection

database.on('error',(error)=>{
   log.error(error)
}
)
database.once('open',()=>{
    log.info('Database connected..:')
})

app.use(express.json());
app.use(express.urlencoded({extended:true}))

//ussd and sms setup
const AT = africastalking(credentials)
const sms = AT.sms

const menu = new ussdMenu()
let dataToSave = {}
menu.startState({
    run:()=>{
        menu.con(`welcome womenToWomen \n 1.Register \n 2.Quit`)

    },
    next:{
        '1': 'register',
        '2': 'quit'
    }
}  
)

menu.state('register',{
    run: ()=>{
        menu.con(`Hi , what is your first name?`)
    },
    next:{
        '*[a-zA-Z]+':'register.age'
    }
})
menu.state('register.age',{
    run:()=>{
        let name = menu.val
        dataToSave.name = name
        menu.con(`${name},how old are you?`)
    },
    next:{
        '*\\d+': 'register.location'
    }
})
menu.state('register.location', {
    run: () => {
        let age = menu.val;
        dataToSave.age = age;
        menu.con(`Great!  choose your location?\n1. Western\n2. Eastern\n3. Central\n4. Coastal\n5. North Eastern`);
    },
    next: {
        '1': 'end',  
        '2': 'end',
        '3': 'end',
        '4': 'end',
        '5': 'end'
    }
});
menu.state('end',{
    run: async ()=>{
        let location = menu.val
        dataToSave.location =location

        const data = new Model(
            {
                name: dataToSave.name,
                age: dataToSave.age,
                phoneNumber: menu.args.phoneNumber
            }
        )
        const dataSaved = await data.save()
        const options = {
            //extract someones phoneNumber from USSD
            to: menu.args.phoneNumber,
            message:`Hi ${dataToSave.name},thanks for registering one of our agents will be in contact with you soon`,
            from: ''
        }
        // console.log("++++++++++++++++++++++++++++++",options)
        // await sms.send(options)
        // .then(console.log)
        // .catch(console.log)
        menu.end(`Thank you for your time we will reach out`)
    }
})

menu.state('quit',{
    run:()=>{
        menu.end(`We are open to you any day any time`)
    }
})



app.post('/ussd',(req,res)=>{
    menu.run(req.body,ussdResults =>{

        res.send(ussdResults)
    })
})

app.get("/users",async(req,res)=>{
      const users = await Model.find({});
      try{
        res.send(users);
        console.log(users);
  
      }catch(error){
        response.status(500).send(error);
      }
    })
  
  

app.listen(3000,()=>{
    console.log('App is running on 3000')
})


