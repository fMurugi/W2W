import axios from 'axios';
import africastalking from 'africastalking';
import dotenv from 'dotenv';
import cache from 'memory-cache'
dotenv.config();

//cohere ai set up
const options = {
  method: 'POST',
  url: process.env.COHERE_URI,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    authorization: process.env.COHERE_BEARER_TOKEN
  },
  data: {
    max_tokens: 2000,
    truncate: 'END',
    return_likelihoods: 'NONE',
    prompt: 'give advice  of one  healthy fruit to  a pregnant lady,jsut mention the fruit and its nutrients'
    // prompt:'give one advice of food that has healthy fats to eat to a pregnant woman and its nutrients in 2 sentence sonly'
  }
};


  // send sms

function sendSms(message,recipientsPhoneNumber){
  const username =process.env.AT_USERNAME
  const apikey =process.env.AT_API_KEY

const op = {
  apiKey: apikey,
  username: username,
};
  const AT = africastalking(op);
const sms = AT.SMS;
// const generatedText = `Here is a list of affordable breakfast meal plans for a 35-year-old pregnant lady: ... (rest of the text) ...`;

sms
  .send({
    to: recipientsPhoneNumber,
    message: message,
  })
  .then(response => {
    console.log('SMS sent successfully:', response);
  })
  .catch(error => {
    console.error('Error sending SMS:', error);
  });
}

//get phone numbers from mongoDb
async function getUsersPhoneNumbers() {
  try {
    const response = await axios.get('http://localhost:3000/users'); // Replace with your actual server URL
    const users = response.data;
    const phoneNumbers = users.map(user => user.phoneNumber);
    console.log("users________________",phoneNumbers);
    return phoneNumbers;
  } catch (error) {
    console.error('Error getting users\' phone numbers:', error);
    return [];
  }
}

// finally generate and sedn the sms 
async function generateAndSendSms(){
  //wait for phonenumbers to be sent from mong db
  const recipientsPhoneNumber = await getUsersPhoneNumbers();
  
  const cacheKey = JSON.stringify(options);

  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse) {
    console.log('Using cached response');
    const generatedMeals = cachedResponse.generations[0].text;
    sendSms(generatedMeals, recipientsPhoneNumber);
    console.log(generatedMeals);
  } else {
    try {
      const response = await axios.request(options);
      const generatedMeals = response.data.generations[0].text;

      // Cache the response for 5 minutes (300000 ms)
      cache.put(cacheKey, response.data, 300000);

      sendSms(generatedMeals, recipientsPhoneNumber);
      console.log(generatedMeals);
    } catch (error) {
      console.error(error);
    }
  }

}

generateAndSendSms();


